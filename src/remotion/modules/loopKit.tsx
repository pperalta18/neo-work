/**
 * loopKit — sustrato compartido de los 10 clips «seleccionables» de los módulos.
 * ──────────────────────────────────────────────────────────────────────────────
 * Las 10 animaciones (Módulo 1 «Tus tareas del día a día» × 5, Módulo 2 «Tu
 * negocio funcionando conectado» × 5) son CLIPS ÚNICOS EN BUCLE PERFECTO. Este
 * fichero fija la ESTÉTICA y la MATEMÁTICA comunes para que las 10, hechas en
 * paralelo, parezcan una familia; cada animación aporta solo su MECANISMO propio.
 *
 * Referencia técnica: el hero (`hero/HeroIntroVideo.tsx`). Reglas de la casa
 * (specs/motion-language.md, specs/module-loops.md):
 *   · Light mode, superficie neumórfica, KIT_BLUE como único acento primario.
 *   · SIN glows, SIN bounce: relieve = `elevation()`, curvas ease-out.
 *   · Friendly y aliviado, no épico. Cabe la imperfección relatable (un ✓ con chispa).
 *   · NUNCA capturas reales: UIs abstractas, cuadros y «mensajitos».
 *
 * BUCLE PERFECTO (innegociable): sin entrada/fade; todo presente desde el frame 0;
 * TODO movimiento es PERIÓDICO en `dur` frames (tiempo modular) → el último frame
 * encadena con el primero sin costura. Determinista: función pura de `frame mod dur`
 * (hash con `Math.sin`, jamás `Date`/`Math.random`).
 *
 * Convención de los dos módulos (regla visual que los separa):
 *   · Módulo 1 = UN solo cuadro/objeto que se transforma (una tarea, un área).
 *   · Módulo 2 = VARIOS cuadros conectados por cables con un PULSO que recorre el
 *     circuito y vuelve a su origen (una chispa, una cadena entre áreas).
 */

import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion';
import {
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  DISPLAY_FONT,
  type Depth,
} from '@/lib/neumorphism';
import { MODULES, type ModuleName } from '@/stories/neo/modules/modules';
import { Fonts } from '../fonts';

// ── lienzo + ritmo ─────────────────────────────────────────────────────────────
export const FPS = 30;
/** Lienzo CUADRADO: encuadra «un objeto / un sistema» y se recorta a cualquier ratio. */
export const STAGE = 1080;
export const CENTER = STAGE / 2;
/** Duración canónica de cada módulo (loop perfecto). Mantenerlas para que el selector sea uniforme. */
export const M1_DURATION = 120; // 4.0 s — Módulo 1 (tareas cortas, ~3–5 s). Div: 2·3·4·5·6·8·10·12·15·20·24·30·40
export const M2_DURATION = 168; // 5.6 s — Módulo 2 (cadenas, ~5–6 s). Muy divisible (2·3·4·6·7·8·12·14·21·24·28) → vueltas/sub-ciclos enteros

export const TAU = Math.PI * 2;
export const RAD = Math.PI / 180;

// ── re-exports útiles (para que los ficheros de animación importen solo del kit) ─
export { KIT_BLUE, BRAND, lightTheme, elevation, TEXT_FONT, DISPLAY_FONT };
export { MODULES };
export type { ModuleName };

// ── matemática pura (sin Date/random) ───────────────────────────────────────────
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** smoothstep — arranque/cierre suaves. */
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
/** smootherstep — aún más sedoso en los extremos (Ken Perlin). */
export const smoother = (t: number) => {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
};
/** módulo siempre positivo. */
export const mod = (x: number, m: number) => ((x % m) + m) % m;
/** hash determinista 0..1 (pliegue de seno). Varía el `n` por índice para «aleatoriedad» reproducible. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};
/** onda triangular 0→1→0 sobre el periodo (sube y baja, perfecta para «llenar y vaciar»). */
export const triangle = (t: number) => {
  const u = mod(t, 1);
  return u < 0.5 ? u * 2 : 2 - u * 2;
};

/**
 * Curvas de la casa (Material 3 «emphasized», ver motion-language.md).
 * `enter` = aparece/llega (DEFAULT) · `exit` = se va · `standard` = mueve en pantalla.
 */
export const CURVE = {
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  exit: Easing.bezier(0.3, 0, 0.8, 0.15),
  standard: Easing.bezier(0.2, 0, 0, 1),
} as const;

// ── helpers de bucle ────────────────────────────────────────────────────────────
/** Fase del bucle: `t`∈[0,1) y `ca` (ángulo maestro, una vuelta por loop). */
export function useLoop(dur: number) {
  const frame = useCurrentFrame();
  const f = mod(frame, dur);
  const t = f / dur;
  return { frame: f, t, ca: t * TAU };
}

/**
 * Progreso 0..1 de un «evento» que arranca en `t0` (frames) y dura `span` frames,
 * envuelto al bucle. Devuelve null si el evento no está activo en este frame.
 * Úsalo para coreografiar pasos discretos (cae un PDF, vuela un sobre…) sin costura.
 */
export function eventProgress(frame: number, dur: number, t0: number, span: number): number | null {
  const e = mod(frame - t0, dur);
  if (e > span) return null;
  return clamp01(e / span);
}

/** Mezcla dos colores hex (#rrggbb) — para teñir suave una placa hacia un acento. */
export function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(lerp(ar, br, t));
  const g = Math.round(lerp(ag, bg, t));
  const bl = Math.round(lerp(ab, bb, t));
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

// ── geometría de polilíneas / anillos (para los cables del Módulo 2) ─────────────
export type Pt = { x: number; y: number };

/**
 * Reparte `n` nodos en un anillo regular centrado en (cx,cy). `start` (deg) sitúa el
 * primer nodo (por defecto arriba). El nodo 0 es el «origen» del pulso.
 */
export function ringPoints(n: number, cx: number, cy: number, r: number, start = -90): Pt[] {
  return Array.from({ length: n }, (_, i) => {
    const a = (start + (360 / n) * i) * RAD;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });
}

/** Longitudes acumuladas de una polilínea (opcionalmente cerrada en anillo). */
function arcTable(pts: Pt[], closed: boolean) {
  const seq = closed ? [...pts, pts[0]] : pts;
  const seg: number[] = [];
  let total = 0;
  for (let i = 0; i < seq.length - 1; i++) {
    const d = Math.hypot(seq[i + 1].x - seq[i].x, seq[i + 1].y - seq[i].y);
    seg.push(d);
    total += d;
  }
  return { seq, seg, total };
}

/** Punto a lo largo de la polilínea en `u`∈[0,1] del recorrido total (arc-length). */
export function pointAt(pts: Pt[], u: number, closed = false): Pt {
  const { seq, seg, total } = arcTable(pts, closed);
  let d = clamp01(u) * total;
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) {
      const f = seg[i] === 0 ? 0 : d / seg[i];
      return { x: lerp(seq[i].x, seq[i + 1].x, f), y: lerp(seq[i].y, seq[i + 1].y, f) };
    }
    d -= seg[i];
  }
  return seq[0];
}

// ──────────────────────────────────────────────────────────────────────────────
// COMPONENTES COMPARTIDOS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Escenario común: superficie neumórfica clara + fuentes + un «respiro» de cámara
 * periódico (opcional) y una viñeta neutra muy sutil. Los hijos se renderizan
 * dentro del lienzo cuadrado. Reúne la firma visual de las 10.
 */
export const LoopStage: React.FC<{
  dur: number;
  children: ReactNode;
  /** respiro de cámara muy leve (escala/translate periódicos). Default true. */
  breathe?: boolean;
  /** viñeta de foco. Default true. */
  vignette?: boolean;
}> = ({ dur, children, breathe = true, vignette = true }) => {
  const { ca } = useLoop(dur);
  const scale = breathe ? 1 + 0.01 * (1 - Math.cos(ca)) * 0.5 : 1;
  const camX = breathe ? Math.sin(ca) * 4 : 0;
  const camY = breathe ? Math.sin(ca * 2) * 2.5 : 0;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 47%, #fbfbff, ${lightTheme.surface} 58%, #e9eaf2)`,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />
      <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px) scale(${scale})`, transformOrigin: '50% 50%' }}>
        {children}
      </AbsoluteFill>
      {vignette && (
        <AbsoluteFill
          style={{ background: 'radial-gradient(circle at 50% 47%, transparent 60%, rgba(120,134,160,0.10) 100%)', pointerEvents: 'none' }}
        />
      )}
    </AbsoluteFill>
  );
};

/**
 * Placa cuadrada neumórfica — el «cuadro/objeto». Es la unidad del Módulo 1 y el
 * nodo del Módulo 2. Se puede teñir suavemente hacia un acento (verde «hecho»,
 * rojo «vencido») sin glow: mezcla de fondo + aro inset finísimo.
 */
export const NeoTile: React.FC<{
  size: number;
  x?: number; // si se dan x,y → posición absoluta centrada en (x,y); si no → inline
  y?: number;
  radius?: number;
  depth?: Depth; // 'raised' (default) | 'recessed' | 'flat'
  distance?: number;
  blur?: number;
  /** 0..1 reposo→pulsado: interpola relieve raised→recessed (un OK que «pulsa» la celda). */
  press?: number;
  accent?: string; // color de tinte (KIT_BLUE, BRAND.green, BRAND.red…)
  accentAmount?: number; // 0..1
  scale?: number;
  opacity?: number;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({
  size,
  x,
  y,
  radius = Math.round(size * 0.26),
  depth = 'raised',
  distance = 10,
  blur = 22,
  press = 0,
  accent,
  accentAmount = 0,
  scale = 1,
  opacity = 1,
  children,
  style,
}) => {
  // press interpola entre raised y recessed mezclando ambas sombras vía opacidad.
  const raised = elevation(lightTheme, { depth, distance, blur, radius });
  const pressed = elevation(lightTheme, { depth: 'recessed', distance: distance * 0.7, blur: blur * 0.7, radius });
  const base: CSSProperties = press > 0.5 ? pressed : raised;
  const bg = accent && accentAmount > 0 ? mix(lightTheme.surface, accent, accentAmount * 0.5) : lightTheme.surface;
  const positioned: CSSProperties =
    x != null && y != null
      ? { position: 'absolute', left: x - size / 2, top: y - size / 2 }
      : { position: 'relative' };
  return (
    <div
      style={{
        ...positioned,
        width: size,
        height: size,
        ...base,
        backgroundColor: bg,
        boxShadow:
          accent && accentAmount > 0
            ? `${base.boxShadow}, inset 0 0 0 ${1.5}px ${mix(lightTheme.surface, accent, Math.min(1, accentAmount))}`
            : base.boxShadow,
        transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

/**
 * Icono de marca de un módulo AiKit (SVG horneado, se ve igual en cualquier tema).
 * `active` (0..1) lo hace «trabajar»: escala + opacidad. Respeta el `rotate` del módulo.
 * Con x,y se ancla centrado; si no, va inline. Para que «se intuya el ERP debajo».
 */
export const ModuleIcon: React.FC<{
  name: ModuleName;
  size: number;
  x?: number;
  y?: number;
  active?: number; // 0..1
  opacity?: number;
  style?: CSSProperties;
}> = ({ name, size, x, y, active = 0, opacity, style }) => {
  const spec = MODULES[name];
  const rot = (spec as { rotate?: number }).rotate ?? 0;
  const s = 1 + 0.1 * clamp01(active);
  const op = opacity ?? 0.9 + 0.1 * clamp01(active);
  const img = (
    <img
      src={spec.icon}
      alt={spec.name}
      width={size}
      height={size}
      style={{
        display: 'block',
        opacity: op,
        transform: `scale(${s})${rot ? ` rotate(${rot}deg)` : ''}`,
        transformOrigin: '50% 50%',
        willChange: 'transform, opacity',
        ...style,
      }}
    />
  );
  if (x != null && y != null) {
    return (
      <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
        <div style={{ position: 'absolute', left: -size / 2, top: -size / 2 }}>{img}</div>
      </div>
    );
  }
  return img;
};

/** Nombre del módulo (aparece solo mientras «trabaja», nunca etiquetas fijas). */
export const ModuleLabel: React.FC<{ name: ModuleName; x: number; y: number; opacity: number; size?: number }> = ({
  name,
  x,
  y,
  opacity,
  size = 26,
}) => (
  <span
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: 'translateX(-50%)',
      whiteSpace: 'nowrap',
      fontFamily: TEXT_FONT,
      fontWeight: 600,
      fontSize: size,
      letterSpacing: 0.1,
      color: lightTheme.textStrong,
      opacity: clamp01(opacity),
    }}
  >
    {MODULES[name].name}
  </span>
);

/**
 * Cable del circuito (Módulo 2). Trazo neumórfico tenue entre dos puntos; por encima
 * viaja el `Packet`. `lit` (0..1) lo enciende un instante cuando lo recorre el pulso.
 */
export const Wire: React.FC<{ a: Pt; b: Pt; lit?: number; width?: number }> = ({ a, b, lit = 0, width = 3 }) => (
  <line
    x1={a.x}
    y1={a.y}
    x2={b.x}
    y2={b.y}
    stroke={mix('#c4cede', KIT_BLUE, clamp01(lit))}
    strokeWidth={width}
    strokeLinecap="round"
    opacity={0.5 + 0.5 * clamp01(lit)}
  />
);

/**
 * Pulso KIT_BLUE con estela en degradado que se desvanece — la técnica del hero.
 * Recorre la polilínea `path` (un anillo si `closed`) en `t`∈[0,1]. La estela hace
 * que «una conexión solo se vea mientras la bola la recorre». Renderiza DENTRO de un <svg>.
 */
export const Packet: React.FC<{
  path: Pt[];
  t: number; // 0..1 a lo largo del recorrido total
  closed?: boolean;
  tailFrac?: number; // longitud de estela como fracción del total (default 0.16)
  r?: number;
  id: string | number; // único por packet (para el gradiente)
  opacity?: number;
}> = ({ path, t, closed = false, tailFrac = 0.16, r = 6, id, opacity = 1 }) => {
  // La estela se muestrea como POLILÍNEA que SIGUE el trazado (no una cuerda recta);
  // en bucles cerrados la cola ENVUELVE (`mod`) en vez de recortarse a 0 → sin pop en
  // el seam (antes `Math.max(0, t-tailFrac)` colapsaba la estela al cruzar la costura).
  const SEG = 10;
  const samples = Array.from({ length: SEG + 1 }, (_, k) => {
    const f = k / SEG; // 0 = cola … 1 = cabeza
    const u = closed ? mod(t - tailFrac * (1 - f), 1) : Math.max(0, t - tailFrac * (1 - f));
    return pointAt(path, u, closed);
  });
  const tail = samples[0];
  const head = samples[SEG];
  const gid = `pk${id}`;
  return (
    <g opacity={opacity}>
      <linearGradient id={gid} x1={tail.x} y1={tail.y} x2={head.x} y2={head.y} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={KIT_BLUE} stopOpacity="0" />
        <stop offset="1" stopColor={KIT_BLUE} stopOpacity="0.5" />
      </linearGradient>
      <polyline points={samples.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={`url(#${gid})`} strokeWidth={r * 0.7} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={head.x} cy={head.y} r={r} fill={KIT_BLUE} />
    </g>
  );
};

/**
 * «Globito»/mensajito neumórfico (el 🌴 1–5?, el «uff, hecho»). Burbuja redondeada
 * con colita; `appear` (0..1) la levanta y desvanece. HTML (no SVG).
 */
export const Bubble: React.FC<{
  x: number;
  y: number; // ancla = punta de la colita (abajo-centro)
  appear?: number; // 0..1
  accent?: string; // tinte de la burbuja (default surface)
  children: ReactNode;
  fontSize?: number;
}> = ({ x, y, appear = 1, accent, children, fontSize = 30 }) => {
  const a = clamp01(appear);
  const bg = accent ? mix(lightTheme.surface, accent, 0.16) : lightTheme.surface;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, calc(-100% - 12px)) translateY(${(1 - a) * 10}px)`,
        opacity: a,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          ...elevation(lightTheme, { depth: 'raised', distance: 7, blur: 16, radius: 18 }),
          backgroundColor: bg,
          padding: '10px 16px',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize,
          color: lightTheme.textStrong,
          whiteSpace: 'nowrap',
        }}
      >
        {children}
      </div>
      {/* colita */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: -7,
          width: 14,
          height: 14,
          background: bg,
          transform: 'translateX(-50%) rotate(45deg)',
          borderRadius: 3,
        }}
      />
    </div>
  );
};

/**
 * Check verde «con chispa» (relatable, aliviado). `draw` (0..1) dibuja el trazo;
 * un par de chispas saltan al completarse. SVG.
 */
export const Check: React.FC<{ cx: number; cy: number; size: number; draw: number; spark?: number }> = ({
  cx,
  cy,
  size,
  draw,
  spark = 0,
}) => {
  const d = clamp01(draw);
  const len = size * 1.6;
  const sp = clamp01(spark);
  return (
    <g>
      <circle cx={cx} cy={cy} r={size * 0.72} fill={mix(lightTheme.surface, BRAND.green, 0.22)} />
      <path
        d={`M ${cx - size * 0.34} ${cy + size * 0.02} L ${cx - size * 0.06} ${cy + size * 0.3} L ${cx + size * 0.4} ${cy - size * 0.32}`}
        fill="none"
        stroke={BRAND.green}
        strokeWidth={size * 0.13}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={len}
        strokeDashoffset={len * (1 - d)}
      />
      {sp > 0 &&
        [0, 1, 2].map((i) => {
          const a = (-50 + i * 50) * RAD;
          const rr = size * (0.8 + sp * 0.7);
          return (
            <circle
              key={i}
              cx={cx + Math.cos(a) * rr}
              cy={cy - size * 0.2 + Math.sin(a) * rr}
              r={size * 0.05 * (1 - sp)}
              fill={BRAND.green}
              opacity={1 - sp}
            />
          );
        })}
    </g>
  );
};

/** SVG a pantalla completa del lienzo (helper para cables/pulsos). */
export const StageSvg: React.FC<{ children: ReactNode }> = ({ children }) => (
  <svg width={STAGE} height={STAGE} viewBox={`0 0 ${STAGE} ${STAGE}`} style={{ position: 'absolute', inset: 0 }}>
    {children}
  </svg>
);

// ──────────────────────────────────────────────────────────────────────────────
// PRIMITIVAS HÍBRIDAS — porte de Tailark Pro (línea «Quartz»).
// ──────────────────────────────────────────────────────────────────────────────
// De Tailark se toma SOLO el look (geometría/composición/colores); cada primitiva
// renderiza un ESTADO ESTÁTICO y el clip la anima por props (el movimiento de
// Tailark, CSS/keyframes, no se captura en Remotion). Traducción de marca:
// indigo→KIT_BLUE, emerald→BRAND.green; tokens shadcn / `ring-border-illustration`
// / `bg-illustration` → estilos inline. Ver specs/module-loops.md §8.

/** Anillo fino tipo `ring-border-illustration` (borde sutil de las cards Tailark). */
export const TAILARK_RING = 'rgba(120,134,160,0.22)';
/** Fondo "card" claro de Tailark sobre la superficie neumórfica (t→blanco). */
export const tailarkSurface = (t = 0.55) => mix(lightTheme.surface, '#ffffff', t);

/**
 * Tarjeta blanca con ring fino — contenedor de las UIs internas de Tailark.
 * Plana (relieve suave): va DENTRO de un NeoTile o suelta sobre el lienzo.
 * `bevel` recrea la esquina sup-der biselada (`corner-tr-bevel`, firma Tailark).
 */
export const TailarkCard: React.FC<{
  width?: number | string;
  height?: number | string;
  radius?: number;
  bevel?: boolean;
  pad?: number | string;
  ring?: string;
  bg?: string;
  shadow?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
}> = ({ width, height, radius = 16, bevel = false, pad = 14, ring = TAILARK_RING, bg, shadow = true, children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: radius,
      borderTopRightRadius: bevel ? Math.round(radius * 2.2) : radius,
      background: bg ?? tailarkSurface(0.55),
      boxShadow: `inset 0 0 0 1px ${ring}${shadow ? ', 0 12px 26px -18px rgba(40,52,74,0.5)' : ''}`,
      padding: pad,
      boxSizing: 'border-box',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

// ── doc-card (document-pdf/xlx/csv) ───────────────────────────────────────────
export type DocKind = 'pdf' | 'xlx' | 'csv' | 'doc';
const DOC_BADGE: Record<DocKind, { label: string; color: string }> = {
  pdf: { label: 'PDF', color: BRAND.red },
  xlx: { label: 'XLX', color: BRAND.green },
  csv: { label: 'CSV', color: BRAND.teal },
  doc: { label: 'DOC', color: KIT_BLUE },
};

const ink = (op: number): CSSProperties => ({ background: `rgba(30,30,32,${op})`, borderRadius: 999 });

/** Rejilla de hoja de cálculo (document-xlx): cabecera más fuerte + celdas. */
const SheetUI: React.FC = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
    <div style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 11, borderRadius: 2, ...ink(0.13) }} />
      ))}
    </div>
    {Array.from({ length: 18 }, (_, i) => (
      <div key={i} style={{ height: 11, borderRadius: 2, ...ink(0.05) }} />
    ))}
  </div>
);

/** Filas CSV (document-csv): primera fila fuerte + filas tenues a 3 columnas. */
const CsvUI: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {Array.from({ length: 7 }, (_, r) => (
      <div key={r} style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2].map((c) => (
          <div key={c} style={{ flex: 1, height: 11, borderRadius: 3, ...ink(r === 0 ? 0.15 : 0.05) }} />
        ))}
      </div>
    ))}
  </div>
);

/** Líneas de documento (document-pdf/doc): anchos variables + cierre fuerte. */
const DocLinesUI: React.FC<{ strong?: boolean }> = ({ strong }) => {
  const ln = (w: string, s = false): CSSProperties => ({ height: 5, width: w, borderRadius: 9, ...(s ? { background: lightTheme.textStrong } : ink(0.1)) });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={ln('100%')} />
      <div style={{ display: 'flex', gap: 5 }}><div style={ln('33%')} /><div style={ln('33%')} /><div style={ln('33%')} /></div>
      <div style={{ display: 'flex', gap: 5 }}><div style={ln('50%')} /><div style={ln('50%')} /></div>
      <div style={{ display: 'flex', gap: 5 }}><div style={ln('33%')} /><div style={ln('66%')} /></div>
      <div style={{ display: 'flex', gap: 5 }}><div style={ln('40%')} /><div style={ln('40%')} /></div>
      <div style={ln('30px', strong ?? true)} />
    </div>
  );
};

/**
 * Doc-card de Tailark (document-pdf/xlx/csv/doc): tarjeta biselada + badge de
 * extensión en la esquina + UI interna por tipo. Estática (el clip la mueve).
 */
export const DocChip: React.FC<{
  kind: DocKind;
  width?: number;
  ratio?: number; // alto = width·ratio
  badge?: boolean;
  style?: CSSProperties;
}> = ({ kind, width = 120, ratio = 1.3, badge = true, style }) => {
  const b = DOC_BADGE[kind];
  const h = Math.round(width * ratio);
  return (
    <div style={{ position: 'relative', width, height: h, ...style }}>
      {badge && (
        <div
          style={{
            position: 'absolute',
            right: -8,
            bottom: Math.round(width * 0.14),
            zIndex: 2,
            background: b.color,
            color: '#fff',
            fontFamily: TEXT_FONT,
            fontSize: Math.max(10, Math.round(width * 0.1)),
            fontWeight: 800,
            letterSpacing: 0.4,
            padding: '2px 6px',
            borderRadius: 5,
            boxShadow: `0 6px 14px -6px ${mix(b.color, '#000000', 0.4)}`,
          }}
        >
          {b.label}
        </div>
      )}
      <TailarkCard width={width} height={h} radius={Math.round(width * 0.1)} bevel pad={Math.round(width * 0.13)}>
        {kind === 'xlx' ? <SheetUI /> : kind === 'csv' ? <CsvUI /> : <DocLinesUI strong={kind === 'doc'} />}
      </TailarkCard>
    </div>
  );
};

// ── chip de estado (flow/workflow: idle → activo → ✓ hecho) ───────────────────
/**
 * Chip de estado tipo Tailark: idle (punto gris) → activo (azul) → ✓ verde.
 * El verde es TRANSITORIO (el clip lo decae antes del seam). `active`/`done` 0..1.
 */
export const StateChip: React.FC<{ active: number; done: number; label?: string }> = ({ active, done, label = 'hecho' }) => {
  if (done > 0.04) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          background: mix(lightTheme.surface, BRAND.green, 0.18),
          color: mix(BRAND.green, '#000000', 0.3),
          fontFamily: TEXT_FONT,
          fontSize: 13,
          fontWeight: 700,
          padding: '2px 9px',
          borderRadius: 999,
          opacity: clamp01(done),
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1 }}>✓</span> {label}
      </div>
    );
  }
  const c = active > 0.1 ? KIT_BLUE : '#aeb8cc';
  return <div style={{ width: 10, height: 10, borderRadius: 999, background: c, opacity: 0.5 + 0.5 * clamp01(active) }} />;
};

// ── avatar-chip (sustituto determinista de `next/image` de Tailark) ───────────
const AVATAR_PALETTE = [KIT_BLUE, BRAND.purple, BRAND.teal, BRAND.orange, BRAND.pink, BRAND.violet] as const;
/**
 * Avatar abstracto: círculo + iniciales, color determinista por `seed`. Sustituye
 * a los `next/image` remotos de Tailark (collaboration/kanban/poll) — nunca cargamos
 * imágenes remotas en el render.
 */
export const AvatarChip: React.FC<{
  initials: string;
  size?: number;
  seed?: number;
  color?: string;
  ring?: boolean;
  style?: CSSProperties;
}> = ({ initials, size = 36, seed = 0, color, ring = true, style }) => {
  const c = color ?? AVATAR_PALETTE[Math.floor(hash(seed * 2.7 + 1.1) * AVATAR_PALETTE.length)];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: mix(c, '#ffffff', 0.12),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: Math.round(size * 0.4),
        boxShadow: ring ? `inset 0 0 0 2px ${mix(c, '#ffffff', 0.4)}, 0 4px 10px -4px ${mix(c, '#000000', 0.4)}` : undefined,
        ...style,
      }}
    >
      {initials}
    </div>
  );
};

// ── medidor de barras (uptime) ────────────────────────────────────────────────
/**
 * Medidor de ticks tipo Tailark `uptime`: fila de `count` barras verticales; las
 * primeras `value·count` están llenas (vira a `low` cuando el nivel baja del
 * umbral), el resto vacías. Para "nivel" que sube y baja (stock/capacidad).
 * Estático: el clip anima `value` (0..1).
 */
export const MetricBar: React.FC<{
  value: number;
  width: number;
  count?: number;
  height?: number;
  fill?: string;
  low?: string;
  lowAt?: number;
  empty?: string;
  gap?: number;
}> = ({ value, width, count = 32, height = 56, fill = BRAND.green, low = BRAND.red, lowAt = 0.28, empty = '#cdd5e2', gap = 3 }) => {
  const v = clamp01(value);
  const c = v <= lowAt ? mix(low, fill, clamp01(v / lowAt)) : fill;
  const litN = Math.round(v * count);
  const bw = (width - gap * (count - 1)) / count;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap, width, height }}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ width: bw, height: '100%', borderRadius: Math.min(bw, 4), background: i < litN ? c : empty, opacity: i < litN ? 1 : 0.5 }} />
      ))}
    </div>
  );
};
