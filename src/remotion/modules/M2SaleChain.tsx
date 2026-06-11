/**
 * M2SaleChain · «Una venta mueve toda la cadena» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Vendes una vez, se ocupa todo lo demás.»
 *
 * REDISEÑO con base Tailark Pro (`workflow.tsx` + `currency.tsx`):
 *   · Árbol de step-cards con conectores punteados en L (codo redondeado) — firma
 *     «workflow» de Tailark — y la moneda € (`currency`) que CAE en el POS.
 *
 * Topología RAMIFICADA (pedido por Iván): la venta es secuencial al principio y
 * luego se BIFURCA en dos ramas que ocurren EN PARALELO:
 *
 *              ┌── POS ──┐         (cae la moneda → dispara la cadena)
 *                   │
 *               Inventario         (Stock −1)
 *                ╱     ╲           ← split: dos ramas simultáneas
 *           Compra     Factura
 *        (reposición)     │
 *                      Cliente
 *
 * Bucle (M2 = circuito + pulso que vuelve al origen): la moneda cae en el POS → un
 *   pulso baja POS→Inventario → en Inventario se DIVIDE en dos pulsos simultáneos
 *   (Inventario→Compra ‖ Inventario→Factura→Cliente) encendiendo cada card
 *   (idle→azul→✓ verde TRANSITORIO) → dos cables de retorno laterales devuelven el
 *   pulso al POS justo cuando cae OTRA moneda, cerrando el circuito.
 *
 * Costura: el ✓/verde «hecho» de cada paso es TRANSITORIO y decae a idle antes del
 *   seam; los pulsos sólo existen dentro de su ventana temporal (null en el seam).
 *   En el frame 0/DUR sólo está la moneda aterrizando + el POS pulsando. Origen del
 *   ERP: `ModuleIcon actionRunner` en el POS.
 */

import {
  LoopStage,
  Packet,
  StageSvg,
  ModuleIcon,
  StateChip,
  TailarkCard,
  useLoop,
  M2_DURATION,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  clamp01,
  mod,
  lerp,
  smooth,
  mix,
  type Pt,
} from './loopKit';

export const M2_SALECHAIN_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_SALECHAIN_DURATION;
// LAPS = 1 → UNA venta recorre toda la cadena ramificada y vuelve al origen (la
// ramificación necesita tiempo para leerse; el relevo lo da la moneda en el seam).

// ── geometría del árbol (firma «workflow» de Tailark) ───────────────────────────
const CARD_W = 384;
const CARD_H = 104;
const RADIUS = 22;
const ELBOW = 18; // radio del codo redondeado de los conectores en L

// columnas (centros X): tronco centrado, ramas a izq/der simétricas
const COL_C = CENTER; // 540 — POS + Inventario (tronco)
const COL_L = 322; //       Compra (rama izquierda)
const COL_R = 758; //       Factura + Cliente (rama derecha)

// filas (centros Y): 4 niveles, márgenes 215 arriba/abajo (simétrico)
const ROW_POS = 267;
const ROW_INV = 449;
const ROW_BRANCH = 631; // Compra (izq) ‖ Factura (der)
const ROW_CLIENT = 813; // Cliente (cuelga de Factura)

// carriles verticales de los cables de retorno (laterales, simétricos)
const RAIL_L = 72;
const RAIL_R = 1080 - 72; // 1008

// Y de la juntura del split (a media altura entre Inventario y la fila de ramas)
const SPLIT_Y = (ROW_INV + CARD_H / 2 + ROW_BRANCH - CARD_H / 2) / 2; // 540

// los 5 nodos (POS especial; los otros 4 son pasos con glifo + StateChip)
type Node = { id: string; label: string; sub: string; glyph: string; x: number; y: number };
const POS: Node = { id: 'pos', label: 'POS', sub: 'Venta registrada', glyph: 'pos', x: COL_C, y: ROW_POS };
const INV: Node = { id: 'inv', label: 'Inventario', sub: 'Stock −1', glyph: 'box', x: COL_C, y: ROW_INV };
const COMPRA: Node = { id: 'compra', label: 'Compra', sub: 'Reposición', glyph: 'cart', x: COL_L, y: ROW_BRANCH };
const FACTURA: Node = { id: 'factura', label: 'Factura', sub: 'Emitida', glyph: 'invoice', x: COL_R, y: ROW_BRANCH };
const CLIENTE: Node = { id: 'cliente', label: 'Cliente', sub: 'Ticket enviado', glyph: 'person', x: COL_R, y: ROW_CLIENT };
const NODES = [POS, INV, COMPRA, FACTURA, CLIENTE];

const C = (n: Node): Pt => ({ x: n.x, y: n.y }); // centro (los cables se ocultan bajo la card)

// ── instante (tau∈[0,1)) en que el pulso «toca» cada step + ventanas de los edges ─
const HIT: Record<string, number> = { inv: 0.24, factura: 0.42, compra: 0.5, cliente: 0.58 };

// edges del circuito con su ventana temporal; las dos ramas solapan → PARALELO.
const EDGES: { id: string; pts: Pt[]; a: number; b: number }[] = [
  { id: 'trunk', pts: [C(POS), C(INV)], a: 0.05, b: 0.24 },
  { id: 'splitL', pts: [C(INV), { x: COL_C, y: SPLIT_Y }, { x: COL_L, y: SPLIT_Y }, C(COMPRA)], a: 0.26, b: 0.5 },
  { id: 'splitR', pts: [C(INV), { x: COL_C, y: SPLIT_Y }, { x: COL_R, y: SPLIT_Y }, C(FACTURA)], a: 0.26, b: 0.42 },
  { id: 'fc', pts: [C(FACTURA), C(CLIENTE)], a: 0.42, b: 0.58 },
  { id: 'retL', pts: [C(COMPRA), { x: RAIL_L, y: ROW_BRANCH }, { x: RAIL_L, y: ROW_POS }, C(POS)], a: 0.62, b: 0.9 },
  { id: 'retR', pts: [C(CLIENTE), { x: RAIL_R, y: ROW_CLIENT }, { x: RAIL_R, y: ROW_POS }, C(POS)], a: 0.62, b: 0.9 },
];

/** Bump 0..1: cuán cerca (en tau, envuelto al bucle) está la fase de `center`. */
function bump(tau: number, center: number, width: number): number {
  const d = Math.min(mod(tau - center, 1), mod(center - tau, 1));
  return clamp01(1 - d / width);
}
/** Progreso 0..1 de un edge dentro de su ventana [a,b], o null si no está activo. */
function seg(tau: number, a: number, b: number): number | null {
  if (tau < a || tau > b) return null;
  return (tau - a) / (b - a);
}

// ── glifos abstractos sobrios de cada paso (UIs abstractas, nunca capturas) ──────
const Glyph: React.FC<{ kind: string; c: string }> = ({ kind, c }) => {
  const common = { fill: 'none', stroke: c, strokeWidth: 3.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={42} height={42} viewBox="0 0 52 52">
      {kind === 'box' && (
        <>
          <path d="M10 18 L26 10 L42 18 L42 38 L26 46 L10 38 Z" {...common} />
          <path d="M10 18 L26 26 L42 18 M26 26 L26 46" {...common} />
        </>
      )}
      {kind === 'cart' && (
        <>
          <path d="M9 12 L15 12 L20 34 L40 34" {...common} />
          <path d="M15 18 L42 18 L38 30 L20 30" {...common} />
          <circle cx="22" cy="42" r="3" {...common} />
          <circle cx="37" cy="42" r="3" {...common} />
        </>
      )}
      {kind === 'invoice' && (
        <>
          <path d="M14 8 L38 8 L38 44 L33 40 L29 44 L25 40 L21 44 L17 40 L14 44 Z" {...common} />
          <line x1="20" y1="20" x2="32" y2="20" {...common} />
          <line x1="20" y1="28" x2="32" y2="28" {...common} />
        </>
      )}
      {kind === 'person' && (
        <>
          <circle cx="26" cy="19" r="8" {...common} />
          <path d="M12 44 Q12 30 26 30 Q40 30 40 44" {...common} />
        </>
      )}
    </svg>
  );
};

/**
 * Moneda € — port del tile `currency` de Tailark: card rotada con borde de color
 * + mini-líneas. Cae sobre el POS y dispara la cadena. SVG (viaja en StageSvg).
 */
const CoinTile: React.FC<{ x: number; y: number; s: number; opacity: number }> = ({ x, y, s, opacity }) => {
  const w = 78 * s;
  const h = 96 * s;
  const r = 12 * s;
  const ring = mix(KIT_BLUE, '#ffffff', 0.1);
  const bar = (bx: number, by: number, bw: number) => (
    <rect x={bx} y={by} width={bw} height={3.4 * s} rx={1.7 * s} fill={mix('#c4cede', KIT_BLUE, 0.25)} />
  );
  return (
    <g opacity={clamp01(opacity)} transform={`translate(${x} ${y}) rotate(-12)`}>
      <g transform={`translate(${-w / 2} ${-h / 2})`}>
        <rect x={0} y={0} width={w} height={h} rx={r} fill={lightTheme.surface} stroke={ring} strokeWidth={2} />
        <rect x={4 * s} y={4 * s} width={w - 8 * s} height={h - 8 * s} rx={r - 3} fill="none" stroke={mix(KIT_BLUE, lightTheme.surface, 0.55)} strokeWidth={1.4 * s} />
        {/* cabecera € */}
        <text x={9 * s} y={20 * s} fontFamily={TEXT_FONT} fontSize={13 * s} fontWeight={700} fill={mix(KIT_BLUE, '#000000', 0.25)}>€ EUR</text>
        {/* mini-líneas (firma currency) */}
        {bar(9 * s, 32 * s, 14 * s)}
        {bar(27 * s, 32 * s, 30 * s)}
        {bar(9 * s, 42 * s, 14 * s)}
        {bar(27 * s, 42 * s, 30 * s)}
        {bar(9 * s, 58 * s, w - 18 * s)}
        {bar(9 * s, 68 * s, (w - 18 * s) * 0.62)}
        {bar((9 + (w - 18) * 0.66) * s, 68 * s, (w - 18 * s) * 0.3)}
      </g>
    </g>
  );
};

const DASH = { strokeWidth: 2.5, strokeLinecap: 'round' as const, strokeDasharray: '2 10', fill: 'none' };
const wireCol = (lit: number) => mix('#c0cadb', KIT_BLUE, clamp01(lit));
/** Conector punteado (firma Tailark): trazo en L con opacidad que sube al encenderse. */
const Wire: React.FC<{ d: string; lit: number }> = ({ d, lit }) => (
  <path d={d} stroke={wireCol(lit)} opacity={0.42 + 0.5 * clamp01(lit)} {...DASH} />
);

// ── una step-card del árbol ──────────────────────────────────────────────────────
const NodeCard: React.FC<{ node: Node; t: number }> = ({ node, t }) => {
  const isPOS = node.id === 'pos';
  // POS: pulsa al emitir (seam) y al recibir el retorno (~0.90). Pasos: bump en su HIT.
  const act = isPOS ? Math.max(bump(t, 0, 0.05), bump(t, 0.9, 0.06)) : bump(t, HIT[node.id], 0.06);
  // «hecho» verde TRANSITORIO: salta tras pasar la onda y decae antes del seam.
  const passT = mod(t - (HIT[node.id] ?? 0), 1);
  const done = !isPOS && passT <= 0.16 ? clamp01(1 - passT / 0.16) : 0;
  const accent = act > 0.05 ? KIT_BLUE : done > 0.04 ? BRAND.green : '#9fb0cc';
  const glyphC = act > 0.1 ? KIT_BLUE : lightTheme.textStrong;

  return (
    <div
      style={{
        position: 'absolute',
        left: node.x - CARD_W / 2,
        top: node.y - CARD_H / 2,
        transform: `scale(${1 + 0.03 * act})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div style={elevation(lightTheme, { depth: 'raised', distance: 11, blur: 24, radius: RADIUS })}>
        <TailarkCard
          width={CARD_W}
          height={CARD_H}
          radius={RADIUS}
          pad={0}
          bg={mix(lightTheme.surface, accent, isPOS ? 0.06 + 0.12 * act : 0.04 + 0.18 * Math.max(act, done * 0.7))}
          // SIN borde: ítems puramente neumorfistas (el relieve lo da el wrapper
          // elevation; el estado activo/hecho se nota por el fondo teñido + scale).
          // Sin `bevel` → las 4 esquinas iguales (antes la sup-der iba más redondeada).
          ring="transparent"
          shadow={false}
          style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '0 24px' }}
        >
          {/* icono / glifo del paso (POS lleva el icono de marca actionRunner) */}
          <div
            style={{
              width: 64,
              height: 64,
              flexShrink: 0,
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...elevation(lightTheme, { depth: isPOS ? 'recessed' : 'raised', distance: 6, blur: 12, radius: 16 }),
              background: mix(lightTheme.surface, accent, isPOS ? 0.1 + 0.2 * act : 0.06 * Math.max(act, done)),
            }}
          >
            {isPOS ? <ModuleIcon name="actionRunner" size={40} active={act} /> : <Glyph kind={node.glyph} c={glyphC} />}
          </div>

          {/* texto: label + sublínea */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 27, color: lightTheme.textStrong, letterSpacing: isPOS ? 1 : 0 }}>
              {node.label}
            </span>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 500, fontSize: 16.5, color: mix(lightTheme.textStrong, '#ffffff', 0.42) }}>
              {node.sub}
            </span>
          </div>

          {/* chip de estado (POS: «€ venta»; pasos: StateChip idle→azul→✓) */}
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            {isPOS ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: mix(lightTheme.surface, KIT_BLUE, 0.1 + 0.2 * act),
                  color: mix(KIT_BLUE, '#000000', 0.25),
                  fontFamily: TEXT_FONT,
                  fontSize: 16,
                  fontWeight: 700,
                  padding: '4px 12px',
                  borderRadius: 999,
                }}
              >
                <span style={{ fontSize: 17 }}>€</span> venta
              </div>
            ) : (
              <StateChip active={act} done={done} label="ok" />
            )}
          </div>
        </TailarkCard>
      </div>
    </div>
  );
};

export const M2SaleChainScene: React.FC = () => {
  const { t } = useLoop(DUR); // t = fase 0..1 del bucle (LAPS = 1)

  // bordes de cards (para anclar los conectores dibujados)
  const posBottom = ROW_POS + CARD_H / 2;
  const invTop = ROW_INV - CARD_H / 2;
  const invBottom = ROW_INV + CARD_H / 2;
  const branchTop = ROW_BRANCH - CARD_H / 2;
  const facturaBottom = ROW_BRANCH + CARD_H / 2;
  const clienteTop = ROW_CLIENT - CARD_H / 2;

  // encendido (lit) de cada cable cuando lo recorre su pulso
  const litTrunk = bump(t, 0.145, 0.12);
  const litSplitL = bump(t, 0.4, 0.13);
  const litSplitR = bump(t, 0.34, 0.1);
  const litFC = bump(t, 0.5, 0.1);
  const litRet = bump(t, 0.76, 0.16);

  return (
    <LoopStage dur={DUR}>
      {/* ── conectores punteados en L (firma Tailark) ── */}
      <StageSvg>
        {/* tronco POS → Inventario */}
        <Wire d={`M ${COL_C} ${posBottom} L ${COL_C} ${invTop}`} lit={litTrunk} />

        {/* split T: tronco baja y se abre a las dos ramas (codos redondeados) */}
        <Wire d={`M ${COL_C} ${invBottom} L ${COL_C} ${SPLIT_Y}`} lit={Math.max(litSplitL, litSplitR)} />
        <Wire
          d={`M ${COL_C} ${SPLIT_Y} L ${COL_L + ELBOW} ${SPLIT_Y} Q ${COL_L} ${SPLIT_Y} ${COL_L} ${SPLIT_Y + ELBOW} L ${COL_L} ${branchTop}`}
          lit={litSplitL}
        />
        <Wire
          d={`M ${COL_C} ${SPLIT_Y} L ${COL_R - ELBOW} ${SPLIT_Y} Q ${COL_R} ${SPLIT_Y} ${COL_R} ${SPLIT_Y + ELBOW} L ${COL_R} ${branchTop}`}
          lit={litSplitR}
        />

        {/* rama derecha: Factura → Cliente */}
        <Wire d={`M ${COL_R} ${facturaBottom} L ${COL_R} ${clienteTop}`} lit={litFC} />

        {/* cables de retorno laterales (cierran el circuito Compra/Cliente → POS) */}
        <Wire
          d={`M ${COL_L - CARD_W / 2} ${ROW_BRANCH} L ${RAIL_L + ELBOW} ${ROW_BRANCH} Q ${RAIL_L} ${ROW_BRANCH} ${RAIL_L} ${ROW_BRANCH - ELBOW} L ${RAIL_L} ${ROW_POS + ELBOW} Q ${RAIL_L} ${ROW_POS} ${RAIL_L + ELBOW} ${ROW_POS} L ${COL_C - CARD_W / 2} ${ROW_POS}`}
          lit={litRet}
        />
        <Wire
          d={`M ${COL_R + CARD_W / 2} ${ROW_CLIENT} L ${RAIL_R - ELBOW} ${ROW_CLIENT} Q ${RAIL_R} ${ROW_CLIENT} ${RAIL_R} ${ROW_CLIENT - ELBOW} L ${RAIL_R} ${ROW_POS + ELBOW} Q ${RAIL_R} ${ROW_POS} ${RAIL_R - ELBOW} ${ROW_POS} L ${COL_C + CARD_W / 2} ${ROW_POS}`}
          lit={litRet}
        />

        {/* pulsos: cada uno solo existe dentro de su ventana (null en el seam) */}
        {EDGES.map((e) => {
          const s = seg(t, e.a, e.b);
          return s == null ? null : <Packet key={e.id} path={e.pts} t={s} tailFrac={0.18} r={7} id={e.id} />;
        })}
      </StageSvg>

      {/* ── step-cards del árbol ── */}
      {NODES.map((node) => (
        <NodeCard key={node.id} node={node} t={t} />
      ))}

      {/* ── moneda € que cae sobre el POS (port `currency`) ── */}
      {(() => {
        // La caída ocupa el último tramo del bucle y ATERRIZA en t=0, cuando el POS
        // dispara la onda → la moneda saliente de un ciclo es la entrante del seam:
        // continuo, sin pop. Tras posarse se funde en el POS al principio del lap.
        const coinX = COL_C + 116; // cae sobre el lado del chip «€ venta», sin tapar el texto
        const posTop = ROW_POS - CARD_H / 2;
        const DROP = 0.22; // fracción del lap que dura la caída
        const coinPhase = clamp01(mod(t + DROP, 1) / DROP); // 0 arriba → 1 posada (en t=0)
        const fall = smooth(coinPhase);
        const yTop = posTop - 196;
        const yLand = posTop - 16; // se acuña justo sobre el borde superior del POS
        const coinY = lerp(yTop, yLand, fall);
        const s = lerp(0.7, 1, fall);
        const settle = clamp01(1 - t / 0.07); // se funde en el POS al inicio del lap
        const coinVis = coinPhase < 1 ? 0.35 + 0.65 * fall : settle;
        return (
          <StageSvg>
            <CoinTile x={coinX} y={coinY} s={s} opacity={coinVis} />
          </StageSvg>
        );
      })()}
    </LoopStage>
  );
};
