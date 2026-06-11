/**
 * M2SaleChain · «Una venta mueve toda la cadena» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Vendes una vez, se ocupa todo lo demás.»
 * Bucle: cae una moneda en el POS → una onda (el pulso) recorre el anillo
 *   Inventario → Compra → Factura → Cliente → vuelve al POS justo cuando cae OTRA
 *   moneda. Una sola vuelta por loop (168 f), muy legible.
 * Cierra porque: es un anillo; la onda da la vuelta completa y regresa al origen.
 *   NO hay cambio de texto (más simple que onboarding: no necesita el truco de
 *   nombres/vueltas). Una sola vuelta, perfectamente periódica.
 * Origen PDF: Vende → Tienda que se gestiona sola.
 *
 * ── Copia de la REFERENCIA M2Onboarding ──────────────────────────────────────
 * Misma plantilla: LoopStage + anillo de 5 nodos (`ringPoints`, start=90 → nodo 0
 * abajo) + cables (`Wire`) + el pulso con estela (`Packet`). Cada nodo destino
 * PULSA en KIT_BLUE al pasar la onda y deja un destello verde TRANSITORIO que
 * DECAE a neutro antes de la costura (nada acumulado sobrevive al seam). En vez
 * del nombre del chat, el nodo POS muestra una moneda que cae sobre él en u≈0 (y
 * la anterior en u≈1, continuo) + un <ModuleIcon name="actionRunner"> discreto
 * para «intuir el ERP» debajo.
 */

import {
  LoopStage,
  NeoTile,
  Wire,
  Packet,
  StageSvg,
  ModuleIcon,
  useLoop,
  ringPoints,
  M2_DURATION,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  clamp01,
  mod,
  smooth,
  lerp,
  TEXT_FONT,
  type Pt,
} from './loopKit';

export const M2_SALECHAIN_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_SALECHAIN_DURATION;

// ── el anillo: origen (POS, abajo) + 4 pasos. ringPoints con start=90 → nodo 0 abajo ──
const R = 312;
const RING: Pt[] = ringPoints(5, CENTER, CENTER, R, 90);
const STEPS = [
  { label: 'Inventario', glyph: 'box' },
  { label: 'Compra', glyph: 'cart' },
  { label: 'Factura', glyph: 'invoice' },
  { label: 'Cliente', glyph: 'person' },
] as const;
const NODE = 158;

/** Bump 0..1: cuán «recién recorrido» está el punto del anillo en `u0` por el pulso en `u`. */
function nearPulse(u: number, u0: number, width = 0.12): number {
  const d = Math.min(mod(u - u0, 1), mod(u0 - u, 1));
  return clamp01(1 - d / width);
}

/** Glifos abstractos de cada paso (UIs abstractas, nunca capturas reales). */
const Glyph: React.FC<{ kind: string; c: string }> = ({ kind, c }) => {
  const s = 52;
  const common = { fill: 'none', stroke: c, strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={s} height={s} viewBox="0 0 52 52">
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

/** Moneda que cae sobre el POS — disco neumórfico con «canto» (elipse interna). */
const Coin: React.FC<{ x: number; y: number; r: number; opacity: number; tilt: number }> = ({ x, y, r, opacity, tilt }) => (
  <g opacity={clamp01(opacity)} transform={`translate(${x} ${y})`}>
    <circle cx={0} cy={0} r={r} fill={lightTheme.surface} stroke={KIT_BLUE} strokeWidth={3} />
    <ellipse cx={0} cy={0} rx={r * tilt} ry={r * 0.72} fill="none" stroke={KIT_BLUE} strokeWidth={2.5} opacity={0.7} />
    <line x1={-r * 0.34} y1={0} x2={r * 0.34} y2={0} stroke={KIT_BLUE} strokeWidth={3} strokeLinecap="round" />
  </g>
);

export const M2SaleChainScene: React.FC = () => {
  const { t } = useLoop(DUR);
  const u = t; // pulso 0..1 a lo largo del anillo cerrado, UNA vuelta por loop

  // u del nodo i en el anillo (0=POS origen, 1..4 = pasos)
  const uOf = (i: number) => i / 5;

  return (
    <LoopStage dur={DUR}>
      {/* cables del anillo + pulso con estela (SVG) */}
      <StageSvg>
        {RING.map((p, i) => {
          const q = RING[(i + 1) % 5];
          const lit = nearPulse(u, (uOf(i) + uOf(i + 1)) / 2, 0.1);
          return <Wire key={i} a={p} b={q} lit={lit} width={3.5} />;
        })}
        <Packet path={RING} t={u} closed tailFrac={0.22} r={7} id="sale" />
      </StageSvg>

      {/* los 4 nodos-paso de la cadena */}
      {STEPS.map((s, k) => {
        const p = RING[k + 1];
        const act = nearPulse(u, uOf(k + 1), 0.13);
        // «hecho»: destello verde TRANSITORIO justo al pasar la onda, que decae a
        // neutro antes de cerrar la vuelta (passT>0.15) → en u→1 todos los nodos
        // vuelven a neutro = estado de u=0. Si fuera un latch, el verde «engancharía»
        // y reventaría la costura del bucle. (REGLA: nada acumulado sobrevive al seam.)
        const passT = mod(u - uOf(k + 1), 1); // cuánto hace que pasó la onda (0..1 de la vuelta)
        const done = passT <= 0.15 ? clamp01(1 - passT / 0.15) : 0;
        const accent = act > 0.05 ? KIT_BLUE : done > 0.04 ? BRAND.green : undefined;
        return (
          <div key={s.label}>
            <NeoTile
              size={NODE}
              x={p.x}
              y={p.y}
              radius={32}
              distance={11}
              blur={24}
              scale={1 + 0.08 * act}
              accent={accent}
              accentAmount={Math.max(act, done * 0.5)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Glyph kind={s.glyph} c={act > 0.1 ? KIT_BLUE : lightTheme.textStrong} />
              </div>
            </NeoTile>
            <span
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y + NODE / 2 + 6,
                transform: 'translateX(-50%)',
                fontFamily: TEXT_FONT,
                fontWeight: 600,
                fontSize: 24,
                color: lightTheme.textStrong,
                opacity: 0.55 + 0.45 * act,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </span>
          </div>
        );
      })}

      {/* nodo origen = el POS de AiKit (recibe la moneda y dispara la onda) */}
      {(() => {
        const p = RING[0];
        const emit = clamp01(1 - u / 0.1); // pulsa al disparar la onda (u≈0)
        const recv = nearPulse(u, 1, 0.1); //  pulsa cuando la onda vuelve (u≈1)
        const pulse = Math.max(emit, recv);

        // Moneda que cae: UNA sola moneda por loop, función pura de `u`. La caída
        // ocupa el ÚLTIMO tramo del bucle (DROP) y ATERRIZA justo en u=0, cuando el
        // POS dispara la onda. Así la moneda ya está cayendo en u→1 (cola) y «toca»
        // el POS en el seam → la moneda saliente de un ciclo es, frame a frame, la
        // entrante del siguiente: continuo, sin pop. Tras posarse se funde en el POS
        // (cae a vis=0) muy al principio del loop → nada acumulado sobrevive al seam.
        const DROP = 0.16; // fracción de la vuelta que dura la caída
        // coinPhase 0→1 a lo largo de la caída: arranca al inicio de la ventana
        // (u = 1-DROP) y completa el aterrizaje en el seam (u → 1 ≡ 0).
        const coinPhase = clamp01((mod(u + DROP, 1)) / DROP); // 0 arriba → 1 posada (en u=0)
        const fall = smooth(coinPhase); // ease-out de caída (sin bounce)
        const yTop = p.y - 250; // origen de la caída (sobre el POS)
        const yLand = p.y - (NODE / 2 + 14); // se posa justo encima del POS
        const coinY = lerp(yTop, yLand, fall);
        const tilt = lerp(0.16, 1, fall); // canto → cara (la moneda se «endereza»)
        // visible durante la caída; tras posarse (primeros frames del loop) se funde.
        const landed = mod(u, 1); // 0 justo al posarse, crece a lo largo del loop
        const settle = clamp01(1 - landed / 0.06); // se desvanece en el POS en ~10 f
        const coinVis = coinPhase < 1 ? 0.4 + 0.6 * fall : settle;

        return (
          <>
            <StageSvg>
              <Coin x={p.x} y={coinY} r={26} opacity={coinVis} tilt={tilt} />
            </StageSvg>

            <NeoTile
              size={NODE + 36}
              x={p.x}
              y={p.y}
              radius={30}
              distance={13}
              blur={28}
              scale={1 + 0.06 * pulse}
              accent={KIT_BLUE}
              accentAmount={0.12 + 0.4 * pulse}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 8px' }}>
                <ModuleIcon name="actionRunner" size={46} active={pulse} />
                <span
                  style={{
                    fontFamily: TEXT_FONT,
                    fontWeight: 700,
                    fontSize: 22,
                    letterSpacing: 1.5,
                    color: KIT_BLUE,
                    opacity: 0.85,
                  }}
                >
                  POS
                </span>
              </div>
            </NeoTile>
          </>
        );
      })()}
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M2SaleChainScene as M2SaleChainV1Scene, M2_SALECHAIN_DURATION as M2_SALECHAIN_V1_DURATION };
