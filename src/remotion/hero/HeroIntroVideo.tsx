/**
 * HeroIntroVideo — "Inteligencia" (hero de la home · light · neumórfico)
 * ──────────────────────────────────────────────────────────────────────────────
 * Es **simplemente EL GRID** de la referencia (concept `inteligencia`: 3×2, ruta
 * serpenteante disco-inicio → punto-azul meta) y su animación es la **EMERGENCIA**
 * de los ítems: cada placa/disco brota de plano → elevado, **escalonado a lo largo
 * de la ruta** (igual que `GridEmergeVideo`). Como guía muy sutil queda un **puntito
 * azul diminuto** que recorre la ruta sincronizado con la emergencia (cada ítem
 * emerge cuando el punto llega a él). Luego el grid se repliega y **vuelve a empezar**.
 *
 * Reescrito 2026-06-12 (Iván): la versión con la línea azul recorriendo el grid no
 * convencía → ahora EMERGEN los ítems (patrón GridEmerge) y la "rayita" se queda
 * mucho más pequeña y tenue, como mera guía.
 *
 * BUCLE PERFECTO: la emergencia se DERIVA de `frame mod LOOP` (sin transiciones CSS,
 * sin Rive, sin Date/random → determinista). Cada ítem hace `grow = emerge·(1−recede)`:
 * brota escalonado y al final se repliega (recede en orden inverso). En la costura
 * (u→1 ≡ u→0) todo está plano (grow=0) → el frame final encadena con el inicial sin
 * salto. La rejilla-bandeja (frame redondeado) es lo único permanente.
 *
 * Reglas de la casa (specs/hero-animation.md · motion-language.md): light mode, sin
 * glows duros, sin bounce, muy suave.
 */

import type { CSSProperties } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { elevation, KIT_BLUE, lightTheme, PLATE_INSET, TEXT_FONT } from '@/lib/neumorphism';
import { coordsToSteps, reflowRoute, routeArrows, type Coord, type Dir } from '@/lib/pathfinding';
import { Cell } from '@/components/Cell';
import { Grid } from '@/components/Grid';

export const HERO_INTRO_DURATION = 159; // ~5,3 s @30fps — emerger → desaparecer, sin apenas reposo
const LOOP = HERO_INTRO_DURATION; // todo es periódico en LOOP frames → bucle sin costura

// ── lienzo + look ──────────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const theme = lightTheme;

// ── el grid de la referencia (concept `inteligencia`): 3×2, ruta serpenteante ──
const COLUMNS = 3;
const ROWS = 2;
const STEPS = reflowRoute(coordsToSteps([
  [1, 2],
  [2, 2],
  [2, 1],
  [3, 1],
]));
const START: Coord = [0, 2]; // disco vacío, justo a la izquierda del primer paso
const GOAL: Coord = [COLUMNS + 1, 1]; // punto azul, fuera de la esquina superior derecha
const ARROWS: Dir[] = routeArrows(STEPS, GOAL);

// ── escala + encuadre (centrado en el lienzo) ──────────────────────────────────
const CELL = 300; // celda generosa: contenido 5·CELL × 2·CELL = 1500×600, centrado
const GRID_X = W / 2 - (COLUMNS / 2) * CELL; // 510 — origen (top-left) del grid 3×2
const GRID_Y = H / 2 - (ROWS / 2) * CELL; //   240
const localCentre = (c: Coord): [number, number] => [(c[0] - 0.5) * CELL, (c[1] - 0.5) * CELL];
const centreAbs = (c: Coord): [number, number] => [GRID_X + localCentre(c)[0], GRID_Y + localCentre(c)[1]];

// ── orden de emergencia = recorrido de la ruta (inicio → flechas → meta) ────────
// 6 ítems: [0] disco inicio · [1..4] las 4 flechas · [5] disco meta.
const ITEMS = STEPS.length + 2; // 6
const stepArcCoords: Coord[] = [START, ...STEPS.map((s) => s.at), GOAL];

// ── geometría de la polilínea (para el puntito guía) ────────────────────────────
const VERTS: [number, number][] = stepArcCoords.map(centreAbs);
const SEGS = VERTS.slice(1).map((p, i) => {
  const a = VERTS[i];
  const dx = p[0] - a[0];
  const dy = p[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return { a, dx, dy, len, ux: dx / len, uy: dy / len };
});
const CUM: number[] = (() => {
  const out = [0];
  let acc = 0;
  for (const g of SEGS) { acc += g.len; out.push(acc); }
  return out;
})();
const PATH_LEN = CUM[CUM.length - 1];

/** Punto [x,y] sobre la polilínea a una longitud de arco `s` (clamp 0..PATH_LEN). */
function pointAt(s: number): [number, number] {
  let d = Math.max(0, Math.min(PATH_LEN, s));
  for (const g of SEGS) {
    if (d <= g.len) return [g.a[0] + g.ux * d, g.a[1] + g.uy * d];
    d -= g.len;
  }
  const last = SEGS[SEGS.length - 1];
  return [last.a[0] + last.dx, last.a[1] + last.dy];
}

// ── helpers puros ───────────────────────────────────────────────────────────────
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** smootherstep — sin tirón al arrancar ni al parar. */
const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────────
const START_F = 0; // la primera emergencia arranca en el frame 0 (reposo de costura ~1 f)
const STAGGER = 13; // separación entre ítems consecutivos al emerger
const RISE = 28; //    cuánto tarda un ítem en emerger del todo
const T = (i: number) => START_F + i * STAGGER; // arranque de emergencia del ítem i
// desaparición en el MISMO orden que la aparición (FIFO): el primero que emerge (disco
// de inicio) es el primero en irse → ola continua de aparecer/desaparecer en la misma
// dirección. Arranca casi en cuanto el grid se completa (build ~f93 → RECEDE_START 100).
const RECEDE_START = 100;
const STAGGER_OUT = 8;
const FALL = 18;
const RT = (i: number) => RECEDE_START + i * STAGGER_OUT; // arranque de desaparición (FIFO)

/** Emergencia neta (0..1) del ítem i: brota escalonado y al final se repliega. */
function growAt(frame: number, i: number): number {
  const emerge = smoother((frame - T(i)) / RISE);
  const recede = smoother((frame - RT(i)) / FALL);
  return clamp01(emerge * (1 - recede));
}

// ── el puntito guía: arco sincronizado con la emergencia ────────────────────────
// El ítem i está en el arco CUM[i] y emerge en T(i); el punto interpola entre ellos.
function guideArc(frame: number): number {
  if (frame <= T(0)) return 0;
  if (frame >= T(ITEMS - 1)) return PATH_LEN;
  const i = Math.min(ITEMS - 2, Math.floor((frame - START_F) / STAGGER));
  return lerp(CUM[i], CUM[i + 1], smoother((frame - T(i)) / STAGGER));
}
/** Opacidad del puntito: aparece con el primer ítem, se va al terminar el barrido. */
function guideOpacity(frame: number): number {
  const inn = smoother((frame - START_F) / 8);
  const out = 1 - smoother((frame - (T(ITEMS - 1) + 10)) / 22);
  return clamp01(inn) * clamp01(out);
}

const ROTATE: Record<Dir, number> = { down: 0, up: 180, left: 90, right: -90 };
const INSET = PLATE_INSET * (CELL / 128); // inset de placa escalado a la celda grande

// ──────────────────────────────────────────────────────────────────────────────
export const HeroIntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame % LOOP;

  const grows = Array.from({ length: ITEMS }, (_, i) => growAt(f, i)); // [start, ch0..3, goal]
  const gArc = guideArc(f);
  const gOp = guideOpacity(f);
  const [gx, gy] = pointAt(gArc);

  return (
    <AbsoluteFill
      style={{
        background: '#f4f4fa',
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      {/* ── el grid (bandeja permanente; las flechas EMERGEN dentro) ── */}
      <div style={{ position: 'absolute', left: GRID_X, top: GRID_Y, width: COLUMNS * CELL, height: ROWS * CELL }}>
        <Grid columns={COLUMNS} rows={ROWS} cell={CELL} theme={theme} frame frameRadius={40}>
          {STEPS.map((step, i) => {
            const [col, row] = step.at;
            const g = grows[i + 1]; // 0 = disco de inicio
            return (
              <Cell
                key={`${col}-${row}`}
                col={col}
                row={row}
                inset={INSET}
                distance={8 * g}
                blur={16 * g}
                style={{ transform: `scale(${0.9 + 0.1 * g})`, opacity: clamp01(g * 1.5) }}
              >
                <Chevron dir={ARROWS[i]} />
              </Cell>
            );
          })}
        </Grid>

        {/* discos de inicio (vacío) y meta (punto azul) — fuera del grid, también emergen */}
        <Node centre={localCentre(START)} grow={grows[0]} variant="start" />
        <Node centre={localCentre(GOAL)} grow={grows[ITEMS - 1]} variant="goal" />
      </div>

      {/* ── el puntito guía (DELANTE): diminuto y muy tenue, recorre la ruta ── */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 8 }, (_, k) => {
          const fr = k / 7; // 0 = cola, 1 = cabeza
          const [x, y] = pointAt(gArc - (1 - fr) * (CELL * 0.5));
          return <circle key={`t${k}`} cx={x} cy={y} r={1 + 2.2 * fr} fill={KIT_BLUE} opacity={gOp * fr * fr * 0.28} />;
        })}
        <circle cx={gx} cy={gy} r={CELL * 0.022} fill={KIT_BLUE} opacity={gOp * 0.55} />
        <circle cx={gx} cy={gy} r={CELL * 0.009} fill="#ffffff" opacity={gOp * 0.7} />
      </svg>
    </AbsoluteFill>
  );
};

/** Flecha del grid (gris, como la referencia). Proporción flecha/celda fiel al original
 *  (Chevron 26 sobre celda 128 ≈ 0.2·CELL). */
function Chevron({ dir }: { dir: Dir }) {
  const size = CELL * 0.2;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.textMuted}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${ROTATE[dir]}deg)` }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Disco de inicio (anillo vacío) o meta (punto azul), del tamaño de una placa. Emerge con `grow`. */
function Node({
  centre,
  grow,
  variant,
}: {
  centre: [number, number];
  grow: number;
  variant: 'start' | 'goal';
}) {
  const g = grow;
  const discSize = CELL - INSET * 2;
  const box: CSSProperties = {
    position: 'absolute',
    left: centre[0] - CELL / 2,
    top: centre[1] - CELL / 2,
    width: CELL,
    height: CELL,
  };
  const disc: CSSProperties = {
    position: 'absolute',
    inset: INSET,
    display: 'grid',
    placeItems: 'center',
    transform: `scale(${0.9 + 0.1 * g})`,
    opacity: clamp01(g * 1.5),
    ...elevation(theme, { depth: 'raised', radius: 999, distance: 8 * g, blur: 16 * g }),
  };

  return (
    <div style={box}>
      <div style={disc}>
        {variant === 'goal' ? (
          <div
            style={{
              width: discSize * 0.42,
              height: discSize * 0.42,
              borderRadius: 999,
              background: KIT_BLUE,
              opacity: clamp01(g * 1.5),
              boxShadow: `0 0 ${discSize * 0.12 * g}px ${KIT_BLUE}55`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
