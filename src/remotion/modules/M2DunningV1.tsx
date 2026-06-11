/**
 * M2Dunning · «Los impagos se persiguen solos» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «AiKit cobra por ti, sin que tú seas el pesado.»
 * Bucle: una factura ROJA (vencida) entra por la derecha → el nodo AiKit (izq.)
 *   manda un SOBRE-pulso por el cable → al llegar, un relojito gira (2.º aviso) →
 *   la factura se vuelve VERDE «pagado» y se desliza fuera → mientras, OTRA roja ya
 *   está entrando (solapamiento). El loop = la persecución recurrente.
 * Cierra porque (FLUJO CONTINUO): roja entra por la derecha, verde sale por la
 *   derecha. Nada latcheado.
 * Módulo: actionScript (persigue/avisa).
 *
 * ⚠️ Caso NO presente en el PDF de estrategia — aportación del panel de
 * second-opinion, conservado por su fuerza comercial; pendiente de validar con el
 * equipo que AiKit ejecuta cobros de verdad.
 *
 * ── Patrón Módulo 2 ──────────────────────────────────────────────────────────
 * Copia el lenguaje «conectado» de M2Onboarding: nodo emisor + CABLE + Packet con
 * estela KIT_BLUE. Aquí el circuito es una ruta de ida (AiKit → factura): el sobre
 * vuela del ERP a la deuda y la cobra.
 *
 * ── Bucle perfecto (la matemática) ───────────────────────────────────────────
 * Hay DOS facturas en pantalla, cada una recorre la MISMA vida (entrar→pagar→salir)
 * y van desfasadas EXACTAMENTE medio ciclo (offset 0.5). Cada factura es función
 * pura de `mod(frame/CYCLE + offset, 1)`, con CYCLE = DUR/2 → al ser el desfase
 * constante y el periodo divisor de DUR, el frame DUR-1 encadena con el 0 sin
 * costura por construcción. Mientras una (verde, pagada) se desliza fuera, la otra
 * (roja) entra y se cruzan brevemente en el punto de reposo = el «solapamiento».
 * El sobre, el reloj y el ✓ están ligados a la fase de cada factura → reposan en su
 * estado neutro en la costura. Nada acumulado sobrevive al seam.
 */

import {
  LoopStage,
  NeoTile,
  Wire,
  Packet,
  StageSvg,
  ModuleIcon,
  Check,
  useLoop,
  eventProgress,
  pointAt,
  clamp01,
  smooth,
  lerp,
  mix,
  CURVE,
  TAU,
  M2_DURATION,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  mod,
  type Pt,
} from './loopKit';

export const M2_DUNNING_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_DUNNING_DURATION;
const CYCLES = 2; // 2 persecuciones idénticas → seam invisible
const CYCLE = DUR / CYCLES; // 84 f por cobro (~2.8 s = alivio, no agresivo)

// ── geometría de escena ──────────────────────────────────────────────────────
const NODE = 196; // nodo AiKit (izquierda)
const TILE = 232; // factura (derecha)
const NODE_X = CENTER - 286;
const TILE_REST_X = CENTER + 226; // reposo de la factura, a la derecha
const OFFSCREEN_DX = 540; // desplazamiento de entrada/salida (fuera de plano)
const NODE_PT: Pt = { x: NODE_X, y: CENTER };
const REST_PT: Pt = { x: TILE_REST_X, y: CENTER }; // donde el sobre «cobra»
const WIRE: Pt[] = [NODE_PT, REST_PT];

// ── coreografía dentro de la vida de UNA factura (fase p∈[0,1)) ───────────────
//  p: 0 ─────────────────────────────────────────────────────────────────── 1
//  entra roja │ sobre vuela │ reloj 2º aviso │ pagado✓ │ se desliza fuera (verde)
const ENTER_END = 0.2; // termina de entrar
const EXIT_START = 0.66; // empieza a salir (verde, ya pagada)
const T_PAID = 0.42; // al aterrizar el sobre, arranca «pagado»
const PAID_SPAN = 0.14; // dibujo del ✓ + tinte a verde
const REM_START = T_PAID - 0.05; // el reloj «2.º aviso» justo antes del pago
const REM_SPAN = 0.24; // gira ~1 vuelta y se retira

// ── ritmo del sobre: UN cobro por MEDIO ciclo (las dos facturas se pagan alternas) ─
const HALF = CYCLE / 2; // 42 f — cada medio ciclo una factura llega a reposo y se paga
const PAY_FRAME = T_PAID * CYCLE; // ~35.3 f: instante de pago dentro de la vida de una factura
const FLY_DUR = 16; // f que tarda el sobre en volar (aterriza ~1 f antes del pago)
const FLY_START_OFF = PAY_FRAME - FLY_DUR + 1;

/** Posición X de una factura según su fase de vida `p`: entra → reposa → sale. */
function invoiceX(p: number): number {
  if (p < ENTER_END) return TILE_REST_X + OFFSCREEN_DX * (1 - smooth(p / ENTER_END));
  if (p > EXIT_START) return TILE_REST_X + OFFSCREEN_DX * smooth((p - EXIT_START) / (1 - EXIT_START));
  return TILE_REST_X;
}
/** Opacidad en los bordes de la vida (sin «pop» al cruzar el límite de plano). */
function invoiceOpacity(p: number): number {
  if (p < 0.05) return smooth(p / 0.05);
  if (p > 0.95) return 1 - smooth((p - 0.95) / 0.05);
  return 1;
}
/** «pagado» 0..1 a lo largo de la vida (rojo→verde). */
function paidOf(p: number): number {
  return clamp01((p - T_PAID) / PAID_SPAN);
}

/** Glifo abstracto de «documento-factura» con su importe (UI abstracta, nunca real). */
const InvoiceGlyph: React.FC<{ paid: number }> = ({ paid }) => {
  const ink = mix(BRAND.red, BRAND.green, paid);
  const faint = mix('#c0c8d6', ink, 0.4);
  return (
    <svg width={140} height={140} viewBox="0 0 140 140">
      <rect x="30" y="20" width="80" height="100" rx="10" fill={lightTheme.surface} stroke={ink} strokeWidth={4} />
      <line x1="44" y1="40" x2="84" y2="40" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <line x1="44" y1="58" x2="96" y2="58" stroke={faint} strokeWidth={4} strokeLinecap="round" />
      <line x1="44" y1="72" x2="88" y2="72" stroke={faint} strokeWidth={4} strokeLinecap="round" />
      {/* total: barra de importe */}
      <rect x="44" y="92" width="52" height="16" rx="6" fill={mix(lightTheme.surface, ink, 0.22)} stroke={ink} strokeWidth={3} />
    </svg>
  );
};

/** Sello de estado: «VENCIDA» (rojo) que cruza a «PAGADO» (verde) según `paid`. */
const Stamp: React.FC<{ paid: number; x: number; y: number; opacity: number }> = ({ paid, x, y, opacity }) => {
  const overdue = clamp01(1 - paid / 0.5);
  const done = clamp01((paid - 0.5) / 0.5);
  const Label: React.FC<{ text: string; c: string; op: number }> = ({ text, c, op }) => (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translateX(-50%)',
        padding: '5px 13px',
        borderRadius: 9,
        backgroundColor: mix(lightTheme.surface, c, 0.16),
        boxShadow: `inset 0 0 0 2px ${c}`,
        fontFamily: TEXT_FONT,
        fontWeight: 800,
        fontSize: 22,
        letterSpacing: 1.2,
        color: c,
        opacity: clamp01(op) * clamp01(opacity),
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
  return (
    <>
      <Label text="VENCIDA" c={BRAND.red} op={overdue} />
      <Label text="PAGADO" c={BRAND.green} op={done} />
    </>
  );
};

/** Relojito del «2.º aviso»: arco SVG que gira una vuelta y reposa (manecilla suave). */
const Reminder: React.FC<{ x: number; y: number; spin: number; appear: number }> = ({ x, y, spin, appear }) => {
  const a = clamp01(appear);
  if (a <= 0.002) return null;
  const r = 26;
  const ang = spin * TAU - Math.PI / 2; // manecilla
  const hx = x + Math.cos(ang) * (r - 8);
  const hy = y + Math.sin(ang) * (r - 8);
  const sweep = clamp01(spin);
  const a0 = -Math.PI / 2;
  const a1 = a0 + sweep * TAU;
  const arcEnd: Pt = { x: x + Math.cos(a1) * r, y: y + Math.sin(a1) * r };
  const large = sweep > 0.5 ? 1 : 0;
  const sc = 0.7 + 0.3 * a;
  return (
    <g opacity={a} transform={`translate(${x} ${y}) scale(${sc}) translate(${-x} ${-y})`}>
      <circle cx={x} cy={y} r={r} fill={mix(lightTheme.surface, KIT_BLUE, 0.1)} stroke="#c8d0de" strokeWidth={3} />
      {sweep > 0.001 && (
        <path
          d={`M ${x + Math.cos(a0) * r} ${y + Math.sin(a0) * r} A ${r} ${r} 0 ${large} 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none"
          stroke={KIT_BLUE}
          strokeWidth={4}
          strokeLinecap="round"
        />
      )}
      <line x1={x} y1={y} x2={hx} y2={hy} stroke={KIT_BLUE} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={x} cy={y} r={3} fill={KIT_BLUE} />
    </g>
  );
};

/** Una factura completa anclada a su fase de vida `p` (placa + sello). HTML. */
const InvoiceTile: React.FC<{ p: number }> = ({ p }) => {
  const x = invoiceX(p);
  const op = invoiceOpacity(p);
  if (op <= 0.002) return null;
  const paid = paidOf(p);
  const accent = mix(BRAND.red, BRAND.green, paid);
  const confirm = clamp01(1 - Math.abs(p - T_PAID) / 0.1);
  return (
    <>
      <NeoTile
        size={TILE}
        x={x}
        y={CENTER}
        radius={34}
        distance={12}
        blur={24}
        opacity={op}
        accent={accent}
        accentAmount={lerp(0.42, 0.5, paid)}
        scale={1 + 0.03 * confirm}
      >
        <InvoiceGlyph paid={paid} />
      </NeoTile>
      <Stamp paid={paid} x={x} y={CENTER - TILE / 2 + 14} opacity={op} />
    </>
  );
};

/** El reloj + ✓ de una factura, anclados a su fase `p`. SVG (van en un StageSvg). */
const InvoiceMarks: React.FC<{ p: number }> = ({ p }) => {
  const x = invoiceX(p);
  const op = invoiceOpacity(p);
  if (op <= 0.4) return null;
  const paid = paidOf(p);
  // reloj «2.º aviso»: aparece, gira ~1 vuelta y se retira; reposa fuera de ventana
  const remRange = REM_SPAN + 0.1;
  const remActive = p >= REM_START - 0.001 && p <= REM_START + remRange;
  const remAppear = remActive ? smooth(Math.sin(clamp01((p - REM_START) / remRange) * Math.PI)) : 0;
  const remSpin = remActive ? smooth(clamp01((p - REM_START) / REM_SPAN)) : 0;
  // ✓ verde: dibujo ligado al pago; chispa que decae a 0 antes del seam
  const checkSpark = clamp01((paid - 0.7) / 0.3);
  return (
    <g opacity={op}>
      {remActive && <Reminder x={x + TILE / 2 - 16} y={CENTER - TILE / 2 + 16} spin={remSpin} appear={remAppear} />}
      {paid > 0.02 && <Check cx={x + TILE / 2 - 18} cy={CENTER + TILE / 2 - 22} size={30} draw={paid} spark={checkSpark} />}
    </g>
  );
};

export const M2DunningScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // las dos facturas: misma vida, desfasadas medio ciclo (offset 0.5) → tilean el
  // punto de reposo y se cruzan en el solapamiento. Periódicas en DUR por diseño.
  const pA = mod(frame / CYCLE, 1);
  const pB = mod(frame / CYCLE + 0.5, 1);

  // ── el sobre-pulso «cobra»: vuela del nodo al reposo UNA vez por MEDIO ciclo ──
  // (las dos facturas se pagan alternas, una cada 42 f). eventProgress sobre el
  // frame LOCAL del medio ciclo → dispara en los 4 cobros de DUR, loop-aware.
  const localHalf = mod(frame - FLY_START_OFF, HALF);
  const flyT = eventProgress(localHalf, HALF, 0, FLY_DUR);
  const flying = flyT != null;
  const flyEase = flying ? CURVE.standard(flyT) : 0;
  // el sobre viaja del nodo (u=0) hasta casi la factura (u=0.92)
  const sobrePos = flying ? pointAt(WIRE, lerp(0, 0.92, flyEase)) : NODE_PT;
  // pulso del cable mientras el sobre lo recorre (sube y baja, reposa en 0)
  const wireLit = flying ? Math.sin(flyT * Math.PI) : 0;

  // nodo AiKit «trabaja» al emitir (vuelo) y al confirmarse cada pago (cada medio
  // ciclo). La confirmación es periódica en HALF → reposa idéntica en el seam.
  const halfPhase = mod(frame - PAY_FRAME, HALF) / HALF; // 0 = instante de pago
  const confirm = clamp01(1 - Math.min(halfPhase, 1 - halfPhase) / 0.08);
  const nodeActive = Math.max(wireLit, confirm * 0.7);

  return (
    <LoopStage dur={DUR}>
      {/* cable nodo→factura + sobre-pulso con estela (lenguaje «conectado» M2) */}
      <StageSvg>
        <Wire a={NODE_PT} b={{ x: TILE_REST_X - TILE / 2 + 18, y: CENTER }} lit={wireLit} width={4} />
        {flying && (
          <>
            <Packet path={[NODE_PT, sobrePos]} t={1} tailFrac={0.5} r={9} id="dun" />
            {/* «sobre» = solapa sobre la cabeza del pulso, sin glow */}
            <g opacity={0.92}>
              <rect
                x={sobrePos.x - 16}
                y={sobrePos.y - 11}
                width={32}
                height={22}
                rx={4}
                fill={mix(lightTheme.surface, KIT_BLUE, 0.25)}
                stroke={KIT_BLUE}
                strokeWidth={2.5}
              />
              <path
                d={`M ${sobrePos.x - 16} ${sobrePos.y - 11} L ${sobrePos.x} ${sobrePos.y + 2} L ${sobrePos.x + 16} ${sobrePos.y - 11}`}
                fill="none"
                stroke={KIT_BLUE}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            </g>
          </>
        )}
      </StageSvg>

      {/* nodo AiKit (izquierda) — persigue/avisa */}
      <NeoTile
        size={NODE}
        x={NODE_X}
        y={CENTER}
        radius={38}
        distance={13}
        blur={28}
        scale={1 + 0.05 * nodeActive}
        accent={KIT_BLUE}
        accentAmount={0.1 + 0.32 * nodeActive}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <ModuleIcon name="actionScript" size={70} active={nodeActive} />
          <div
            style={{
              ...elevation(lightTheme, { depth: 'raised', distance: 5, blur: 12, radius: 12 }),
              backgroundColor: mix(lightTheme.surface, KIT_BLUE, 0.08),
              padding: '6px 14px',
              fontFamily: TEXT_FONT,
              fontWeight: 700,
              fontSize: 22,
              color: lightTheme.textStrong,
              whiteSpace: 'nowrap',
            }}
          >
            cobrando<span style={{ color: KIT_BLUE }}>…</span>
          </div>
        </div>
      </NeoTile>

      {/* las dos facturas (placa + sello), desfasadas medio ciclo */}
      <InvoiceTile p={pA} />
      <InvoiceTile p={pB} />

      {/* reloj «2.º aviso» + ✓ pagado de cada factura (SVG) */}
      <StageSvg>
        <InvoiceMarks p={pA} />
        <InvoiceMarks p={pB} />
      </StageSvg>
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M2DunningScene as M2DunningV1Scene, M2_DUNNING_DURATION as M2_DUNNING_V1_DURATION };
