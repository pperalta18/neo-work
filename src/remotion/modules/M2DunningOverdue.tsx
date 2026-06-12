/**
 * M2DunningOverdue · Dunning — ACTO 1 «La factura vence»
 * ──────────────────────────────────────────────────────────────────────────────
 * Primer clip de la mini-película de impagos (antes todo iba en un solo bucle).
 * Aquí, simplemente: UNA factura, y **los días corriendo**. El contador de
 * vencimiento avanza solo —«Vence en 5 días» → «Vence hoy» → «Vencida hace N
 * días»— y, en el instante en que se agota el plazo (cruza el día 0), cae el sello
 * **VENCIDA**. Acaba sostenido en «Vencida hace 8 días».
 *
 * La factura es la placa neumórfica limpia compartida (`DunningInvoiceCard`): sin
 * marco rojo externo, sin ring negro — «dejamos solo la factura».
 *
 * NO es un bucle (a diferencia de los module-loops): es un ACTO lineal one-shot,
 * como los actos de los flujos. Termina en HOLD para encadenar por cross-fade.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Fonts } from '../fonts';
import {
  CENTER,
  clamp01,
  lerp,
  smoother,
  TEXT_FONT,
  CANVAS_BG,
} from './loopKit';
import { DunningInvoiceCard, DUNNING_CARD_W, DUNNING_CARD_H, Stamp, dueLabel } from './dunningInvoice';

export const M2_DUNNING_OVERDUE_DURATION = 140; // ~4.7 s

// ── ritmo del acto ────────────────────────────────────────────────────────────
const CARD_IN = 16; //              la tarjeta entra (escala/opacidad)
const RUN_START = 20; //            empiezan a correr los días
const RUN_END = 104; //             llega a «Vencida hace 8 días»
const DAY_FROM = 5; //              empieza «Vence en 5 días»
const DAY_TO = -8; //               acaba «Vencida hace 8 días»

const CARD_X = CENTER - DUNNING_CARD_W / 2;
const CARD_Y = CENTER - DUNNING_CARD_H / 2;

/** Día respecto al vencimiento en función del frame (corre +5 → −8, eased). */
function dayAt(f: number): number {
  if (f <= RUN_START) return DAY_FROM;
  if (f >= RUN_END) return DAY_TO;
  return lerp(DAY_FROM, DAY_TO, smoother((f - RUN_START) / (RUN_END - RUN_START)));
}

/** Frame (aprox.) en que el contador cruza el día 0 → cuándo cae el sello. */
const ZERO_AT = (() => {
  // inversa aproximada del smoother: basta una búsqueda fina determinista.
  for (let f = RUN_START; f <= RUN_END; f++) if (dayAt(f) <= 0) return f;
  return RUN_END;
})();

export const M2DunningOverdueScene: React.FC = () => {
  const frame = useCurrentFrame();

  // entrada de la tarjeta
  const appear = smoother(clamp01(frame / CARD_IN));
  const cardScale = lerp(0.965, 1, appear);

  // contador de días + su etiqueta/color
  const dayVal = dayAt(frame);
  const { text, color } = dueLabel(dayVal);

  // «tick»: micro-pulso de la línea de estado al pasar cada día entero
  const frac = Math.abs(dayVal - Math.round(dayVal));
  const tick = frame > RUN_START && frame < RUN_END ? clamp01(1 - frac * 3) : 0;
  const statusScale = 1 + 0.05 * tick;

  // sello VENCIDA: cae al agotarse el plazo (cruce del día 0)
  const stampAppear = clamp01((frame - ZERO_AT) / 12);

  return (
    <AbsoluteFill
      style={{
        background: CANVAS_BG,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      <div
        style={{
          position: 'absolute',
          left: CARD_X,
          top: CARD_Y,
          opacity: appear,
          transform: `scale(${cardScale})`,
          transformOrigin: '50% 50%',
        }}
      >
        <DunningInvoiceCard statusText={text} statusColor={color} statusScale={statusScale} />
      </div>

      {/* sello VENCIDA en la esquina superior derecha de la tarjeta */}
      <Stamp text="VENCIDA" color={color} x={CARD_X + DUNNING_CARD_W - 36} y={CARD_Y + 28} appear={stampAppear} />
    </AbsoluteFill>
  );
};
