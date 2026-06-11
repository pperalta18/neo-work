/**
 * M1Absences · «Aprobar ausencias sin Excel» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Un tap y a otra cosa.»
 * Bucle: una mini-rejilla de la semana (5 col L–V × 3 filas). En cada momento UNA
 *   celda levanta un globito `🌴 1–5?` → un chip OK baja y la pulsa (press 0→1) →
 *   la celda se tiñe de verde suave con un ✓ breve → se calma justo cuando OTRA
 *   celda levanta su globito.
 * Cierra porque: siempre hay «un globito arriba», solo rota cuál. El verde de cada
 *   celda DECAE a neutro antes de que su turno cierre → en cualquier frame hay
 *   exactamente UNA celda activa, y la rejilla está toda neutra en la costura.
 * Origen PDF: Control de asistencia y vacaciones. Módulo: Action Runner (ejecuta la
 *   aprobación en el ERP) → se enciende cuando se pulsa un OK.
 *
 * ── Hermano de M1Stock ───────────────────────────────────────────────────────
 * Misma plantilla M1 (LoopStage + un cuadro que se transforma), pero el «objeto»
 * aquí es la rejilla-semana: una sola coreografía PERIÓDICA en DURATION frames,
 * determinista (hash/Math.sin), sin estado que sobreviva al seam.
 */

import { ModuleIcon } from './loopKit';
import {
  LoopStage,
  NeoTile,
  Bubble,
  Check,
  StageSvg,
  useLoop,
  M1_DURATION,
  CENTER,
  BRAND,
  KIT_BLUE,
  lightTheme,
  elevation,
  TEXT_FONT,
  hash,
  clamp01,
  lerp,
  smooth,
  smoother,
  mix,
  mod,
} from './loopKit';

export const M1_ABSENCES_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del ciclo (todo dentro de [0,120), periódico → sin costura) ───────────
const DUR = M1_ABSENCES_DURATION;
const SLOTS = 5; //          5 aprobaciones repartidas por el loop
const SLOT = DUR / SLOTS; //  24 f por aprobación (120 = 5·24, divisor exacto → loop perfecto)

// Fases dentro de un slot (en su propio reloj 0..SLOT). El globito ocupa CASI todo el
// slot: sube en los primeros frames y baja en los últimos, de modo que el del slot
// siguiente ya está subiendo cuando este baja → SOLAPE → «siempre hay un globito
// arriba» (en ningún frame la rejilla queda muda). El press/✓/verde van en medio y el
// verde DECAE a 0 antes de cerrar el slot (clave del bucle).
const OVERLAP = 5; //   el globito de un slot sigue visible 5 f DENTRO del siguiente
const WINDOW = SLOT + OVERLAP; // ventana de render de cada slot (24+5=29 f)
const RISE = 5; //      el globito sube (0 → RISE)
const PRESS_AT = 7; //   el chip OK baja y pulsa
const PRESS_END = 11; //  fin del press → ✓ + tinte verde
const GREEN_DECAY_AT = 13; // el verde empieza a decaer…
const GREEN_GONE = 18; //   …y llega a neutro mucho ANTES de cerrar la ventana (clave del loop)
const FALL_AT = SLOT; //   el globito empieza a bajar al entrar el siguiente slot (solape)
const FALL_END = WINDOW; //  …y termina de bajar al final de la ventana

// ── geometría de la rejilla ─────────────────────────────────────────────────────
const TILE = 600; //         el cuadro único (la «semana»)
const COLS = 5; //           L M X J V
const ROWS = 3;
const CELL = 84; //          lado de cada celdita
const GAP_X = 30;
const GAP_Y = 34;
const GRID_W = COLS * CELL + (COLS - 1) * GAP_X;
const GRID_H = ROWS * CELL + (ROWS - 1) * GAP_Y;
const GRID_LEFT = CENTER - GRID_W / 2;
const GRID_TOP = CENTER - GRID_H / 2 + 28; // un pelín abajo (deja sitio a la cabecera L–V)
const DAYS = ['L', 'M', 'X', 'J', 'V'] as const;

/** Centro (x,y) de la celda (col,row) en coordenadas del lienzo. */
function cellCenter(col: number, row: number) {
  return {
    x: GRID_LEFT + col * (CELL + GAP_X) + CELL / 2,
    y: GRID_TOP + row * (CELL + GAP_Y) + CELL / 2,
  };
}

/**
 * Celda elegida para el slot `s` (0..SLOTS-1). hash determinista → 0..14, y un nudge
 * si choca con el slot vecino para que el globito «salte» de zona a zona (relatable).
 */
function cellOfSlot(s: number): { col: number; row: number; idx: number } {
  const base = Math.floor(hash(s * 3.17 + 1.4) * (COLS * ROWS)); // 0..14
  const prev = s === 0 ? -1 : Math.floor(hash((s - 1) * 3.17 + 1.4) * (COLS * ROWS));
  const idx = base === prev ? (base + 7) % (COLS * ROWS) : base; // evita repetir celda seguida
  return { col: idx % COLS, row: Math.floor(idx / COLS), idx };
}

/**
 * Estado de un slot en su reloj local `e`∈[0,SLOT). Todo nace en 0 y vuelve a 0
 * antes de cerrar el slot → nada sobrevive a la costura (del slot ni del loop).
 * El globito ocupa casi todo el slot (sube en [0,RISE], baja en [FALL_AT,FALL_END]),
 * así el del slot siguiente solapa con la cola de este: nunca hay un frame sin globito.
 */
function slotState(e: number) {
  // globito: sube [0,RISE] → plateau → baja [FALL_AT,FALL_END]
  const up = smooth(clamp01(e / RISE));
  const down = e >= FALL_AT ? smooth(clamp01((e - FALL_AT) / (FALL_END - FALL_AT))) : 0;
  const bubble = clamp01(up - down);

  // chip OK que baja y pulsa la celda (un pico breve centrado en el press)
  const pressUp = smooth(clamp01((e - RISE) / (PRESS_AT - RISE)));
  const pressDown = e >= PRESS_END ? smooth(clamp01((e - PRESS_END) / 3)) : 0;
  const press = clamp01(pressUp - pressDown);

  // tinte verde: aparece al pulsar y DECAE a 0 antes de GREEN_GONE (clave del loop)
  const greenUp = smooth(clamp01((e - PRESS_AT) / (PRESS_END - PRESS_AT)));
  const greenDown = e >= GREEN_DECAY_AT ? smoother(clamp01((e - GREEN_DECAY_AT) / (GREEN_GONE - GREEN_DECAY_AT))) : 0;
  const green = clamp01(greenUp - greenDown);

  // ✓ breve dentro de la celda (se dibuja al pulsar y se desvanece con el verde)
  const checkDraw = smooth(clamp01((e - PRESS_AT) / 4));
  const checkOpacity = clamp01(green / 0.5);

  return { bubble, press, green, checkDraw, checkOpacity };
}

export const M1AbsencesScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // Action Runner se enciende mientras se pulsa un OK. El press solo ocurre en
  // e∈[PRESS_AT,PRESS_END] (bien dentro del slot), así que basta el reloj del slot
  // que posee el frame actual: mod(frame, SLOT).
  const pressNow = slotState(mod(frame, SLOT)).press;

  // por celda: acumulamos bubble/press/green del slot que la posee (y, en el solape,
  // del slot vecino). Como solo un slot «toca» cada celda por vuelta y el verde decae,
  // nunca hay dos estados vivos en la misma celda a la vez.
  const cells = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      cells.push({ col, row, idx: row * COLS + col });
    }
  }

  return (
    <LoopStage dur={DUR}>
      {/* el cuadro único: la «semana» */}
      <NeoTile size={TILE} x={CENTER} y={CENTER} radius={52} distance={14} blur={34}>
        <></>
      </NeoTile>

      {/* cabecera L–V (días, discreta) */}
      {DAYS.map((d, col) => {
        const c = cellCenter(col, 0);
        return (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: c.x,
              top: GRID_TOP - 46,
              transform: 'translateX(-50%)',
              fontFamily: TEXT_FONT,
              fontWeight: 600,
              fontSize: 28,
              color: mix(lightTheme.textStrong, lightTheme.surface, 0.35),
            }}
          >
            {d}
          </div>
        );
      })}

      {/* la rejilla de celditas (cada una recibe el estado de su slot) */}
      {cells.map((cell) => {
        // ¿algún slot apunta a esta celda? Solo entonces se anima.
        let press = 0;
        let green = 0;
        for (let s = 0; s < SLOTS; s++) {
          const sc = cellOfSlot(s);
          if (sc.idx !== cell.idx) continue;
          const e = mod(frame - s * SLOT, DUR);
          if (e >= WINDOW) continue; // su slot + el solape de 5 f con el siguiente
          const st = slotState(e);
          press = Math.max(press, st.press);
          green = Math.max(green, st.green);
        }
        const c = cellCenter(cell.col, cell.row);
        return (
          <NeoTile
            key={cell.idx}
            size={CELL}
            x={c.x}
            y={c.y}
            radius={22}
            distance={6}
            blur={14}
            press={press}
            accent={green > 0.01 ? BRAND.green : undefined}
            accentAmount={green}
          />
        );
      })}

      {/* ✓ verde breve dentro de la celda activa (decae con el verde) */}
      <StageSvg>
        {(() => {
          const draws = [];
          for (let s = 0; s < SLOTS; s++) {
            const e = mod(frame - s * SLOT, DUR);
            if (e >= WINDOW) continue;
            const st = slotState(e);
            if (st.checkOpacity <= 0.01) continue;
            const sc = cellOfSlot(s);
            const c = cellCenter(sc.col, sc.row);
            draws.push(
              <g key={s} opacity={st.checkOpacity}>
                <Check cx={c.x} cy={c.y} size={26} draw={st.checkDraw} />
              </g>,
            );
          }
          return draws;
        })()}
      </StageSvg>

      {/* el globito de la celda activa: 🌴 1–5? (siempre hay exactamente uno arriba) */}
      {(() => {
        const bubbles = [];
        for (let s = 0; s < SLOTS; s++) {
          const e = mod(frame - s * SLOT, DUR);
          if (e >= WINDOW) continue;
          const st = slotState(e);
          if (st.bubble <= 0.01) continue;
          const sc = cellOfSlot(s);
          const c = cellCenter(sc.col, sc.row);
          // pedir vacaciones 1–5 días (determinista por slot)
          const days = 1 + Math.floor(hash(s * 9.13 + 4.7) * 5);
          bubbles.push(
            <Bubble key={s} x={c.x} y={c.y - CELL / 2 - 6} appear={st.bubble} accent={KIT_BLUE} fontSize={26}>
              {`🌴 ${days}d`}
            </Bubble>,
          );
        }
        return bubbles;
      })()}

      {/* chip OK que baja y pulsa la celda activa (el «tap») */}
      {(() => {
        const chips = [];
        for (let s = 0; s < SLOTS; s++) {
          const e = mod(frame - s * SLOT, DUR);
          if (e >= WINDOW) continue;
          const st = slotState(e);
          if (st.press <= 0.01) continue;
          const sc = cellOfSlot(s);
          const c = cellCenter(sc.col, sc.row);
          const drop = lerp(-30, -2, smooth(st.press)); // baja sobre la celda
          chips.push(
            <div
              key={s}
              style={{
                position: 'absolute',
                left: c.x,
                top: c.y + drop,
                transform: `translate(-50%, -50%) scale(${lerp(0.86, 1, smooth(st.press))})`,
                opacity: st.press,
                ...elevation(lightTheme, { depth: 'raised', distance: 5, blur: 10, radius: 14 }),
                backgroundColor: mix(lightTheme.surface, KIT_BLUE, 0.12),
                padding: '6px 14px',
                fontFamily: TEXT_FONT,
                fontWeight: 700,
                fontSize: 22,
                color: KIT_BLUE,
                pointerEvents: 'none',
              }}
            >
              OK
            </div>,
          );
        }
        return chips;
      })()}

      {/* módulo de marca: Action Runner ejecuta la aprobación (esquina, se enciende al pulsar) */}
      <ModuleIcon name="actionRunner" size={62} x={CENTER + TILE / 2 - 16} y={CENTER + TILE / 2 - 16} active={pressNow} />
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M1AbsencesScene as M1AbsencesV1Scene, M1_ABSENCES_DURATION as M1_ABSENCES_V1_DURATION };
