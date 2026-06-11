/**
 * M2MonthClose · «El cierre de mes, ya preparado» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Llegas a fin de mes y está hecho.»
 * Bucle: un calendario se llena de puntitos (apuntes) día a día → a fin de mes los
 *   apuntes VUELAN al informe (un Packet calendario→informe, ✓) y el calendario
 *   queda vacío → vuelve al día 1 y empieza a llenarse otra vez.
 * Cierra porque: el ciclo mensual es intrínsecamente loopable. El «volver al día 1»
 *   NO borra puntos a la vista: los apuntes SE RECOGEN en el informe (sustitución),
 *   así el calendario vacío del final == el del frame 0.
 * Origen PDF: derivado de Contabilidad (te prepara el cierre, legal y al detalle).
 *
 * Lenguaje «conectado» (Módulo 2): cable + Packet calendario→informe. El módulo
 * Glimpse «presenta» el cierre.
 */

import {
  LoopStage,
  StageSvg,
  Wire,
  Packet,
  Check,
  ModuleIcon,
  useLoop,
  M2_DURATION,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  clamp01,
  smooth,
  mix,
  type Pt,
} from './loopKit';

export const M2_MONTHCLOSE_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_MONTHCLOSE_DURATION;
const DAYS = 35; // 7×5
const FILL_END = 104; // los apuntes se llenan en [0,104] (~3.5 s)
const CLOSE_AT = 110; // arranca el cierre
const CLOSE_SPAN = 46; // [110,156]: Packet→informe, ✓, y el informe se va

// ── calendario (fijo, centrado) ──────────────────────────────────────────────
const CARD_W = 556;
const CARD_H = 470;
const CARD_X = CENTER - 70; // a la izquierda para dejar sitio al informe a la derecha
const CARD_Y = CENTER + 10;
const PAD = 34;
const HEADER_H = 46;
const COLS = 7;
const ROWS = 5;
const GAP = 12;
const CELL_W = (CARD_W - 2 * PAD - (COLS - 1) * GAP) / COLS;
const CELL_H = (CARD_H - 2 * PAD - HEADER_H - (ROWS - 1) * GAP) / ROWS;
const GRID_X0 = CARD_X - CARD_W / 2 + PAD;
const GRID_Y0 = CARD_Y - CARD_H / 2 + PAD + HEADER_H;

function cellCenter(d: number): Pt {
  const col = d % COLS;
  const row = Math.floor(d / COLS);
  return { x: GRID_X0 + col * (CELL_W + GAP) + CELL_W / 2, y: GRID_Y0 + row * (CELL_H + GAP) + CELL_H / 2 };
}

// ── informe (a la derecha) ───────────────────────────────────────────────────
const REP_W = 184;
const REP_H = 232;
const REP_X = CARD_X + CARD_W / 2 + 168; // centro en reposo
const REP_Y = CARD_Y;
const CAL_PT: Pt = { x: CARD_X + CARD_W / 2 - 24, y: CARD_Y };
const REP_PT: Pt = { x: REP_X - REP_W / 2, y: REP_Y };

export const M2MonthCloseScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // progreso del cierre 0..1 (ventana [CLOSE_AT, CLOSE_AT+CLOSE_SPAN])
  const closeE = frame - CLOSE_AT;
  const close = closeE < 0 ? 0 : closeE > CLOSE_SPAN ? 1 : clamp01(closeE / CLOSE_SPAN);
  // los apuntes están «vivos» hasta que el cierre se los lleva (decae a 0 antes del seam)
  const dotsAlive = 1 - smooth(clamp01((frame - CLOSE_AT) / 16));
  // el Packet viaja en la 1ª mitad del cierre; el informe se construye y luego se va
  const travel = clamp01(close / 0.55);
  const build = clamp01((close - 0.3) / 0.4); // escala/aparición del informe
  const checkDraw = clamp01((close - 0.5) / 0.25);
  const checkSpark = clamp01((close - 0.7) / 0.2);
  const leave = clamp01((close - 0.82) / 0.18); // se desliza fuera y se desvanece
  const repActive = build > 0.05 && leave < 1;
  const moduleActive = close > 0.05 && close < 0.95 ? 1 : 0;

  return (
    <LoopStage dur={DUR}>
      {/* cabecera + módulo Glimpse (presenta el cierre) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER,
          top: CARD_Y - CARD_H / 2 - 88,
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <ModuleIcon name="glimpse" size={50} active={moduleActive} />
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 27, color: lightTheme.textStrong, opacity: 0.85 }}>Cierre de mes</span>
      </div>

      {/* tarjeta calendario */}
      <div
        style={{
          position: 'absolute',
          left: CARD_X - CARD_W / 2,
          top: CARD_Y - CARD_H / 2,
          width: CARD_W,
          height: CARD_H,
          ...elevation(lightTheme, { depth: 'raised', distance: 14, blur: 34, radius: 40 }),
        }}
      >
        <div style={{ position: 'absolute', left: PAD, top: PAD - 6, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 24, color: lightTheme.textStrong, opacity: 0.85 }}>Junio</div>
      </div>

      {/* celdas-día (recessed) + apunte (dot KIT_BLUE) que aparece día a día */}
      {Array.from({ length: DAYS }, (_, d) => {
        const c = cellCenter(d);
        const appearF = (d / DAYS) * FILL_END;
        const dot = clamp01((frame - appearF) / 5) * dotsAlive;
        return (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: c.x - CELL_W / 2,
              top: c.y - CELL_H / 2,
              width: CELL_W,
              height: CELL_H,
              borderRadius: 12,
              ...elevation(lightTheme, { depth: 'recessed', distance: 4, blur: 9, radius: 12 }),
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 13,
                height: 13,
                borderRadius: 999,
                background: mix(KIT_BLUE, BRAND.green, 0.15 * clamp01((frame - appearF) / 30)),
                transform: `translate(-50%,-50%) scale(${dot})`,
                opacity: dot,
              }}
            />
          </div>
        );
      })}

      {/* cable + Packet: los apuntes se recogen en el informe */}
      <StageSvg>
        <Wire a={CAL_PT} b={REP_PT} lit={close > 0 && close < 1 ? travel * (1 - leave) : 0} width={3} />
        {close > 0.02 && close < 0.98 && <Packet path={[CAL_PT, REP_PT]} t={travel} tailFrac={0.3} r={7} id="mc" />}
      </StageSvg>

      {/* informe (carpeta) que se forma con ✓ y luego se va */}
      {repActive && (
        <div
          style={{
            position: 'absolute',
            left: REP_X - REP_W / 2 + leave * 360,
            top: REP_Y - REP_H / 2,
            width: REP_W,
            height: REP_H,
            ...elevation(lightTheme, { depth: 'raised', distance: 12, blur: 26, radius: 22 }),
            backgroundColor: mix(lightTheme.surface, BRAND.green, 0.12 * checkDraw),
            transform: `scale(${0.6 + 0.4 * smooth(build)})`,
            transformOrigin: '50% 50%',
            opacity: smooth(build) * (1 - leave),
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: 26,
                top: 36 + i * 20,
                width: i === 2 ? 70 : 120,
                height: 7,
                borderRadius: 4,
                background: mix('#c4cede', KIT_BLUE, 0.4),
                opacity: 0.7,
              }}
            />
          ))}
          <svg width={REP_W} height={REP_H} viewBox={`0 0 ${REP_W} ${REP_H}`} style={{ position: 'absolute', inset: 0 }}>
            <Check cx={REP_W / 2} cy={REP_H - 64} size={34} draw={checkDraw} spark={checkSpark} />
          </svg>
        </div>
      )}
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M2MonthCloseScene as M2MonthCloseV1Scene, M2_MONTHCLOSE_DURATION as M2_MONTHCLOSE_V1_DURATION };
