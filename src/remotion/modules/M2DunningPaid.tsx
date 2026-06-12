/**
 * M2DunningPaid · Dunning — ACTO 3 «La factura, cobrada»
 * ──────────────────────────────────────────────────────────────────────────────
 * Tercer y último clip: **la MISMA factura del acto 1** (mismo nº e importe), pero
 * ahora se cobra. Arranca un instante en el estado vencido (continuidad con el
 * acto 2) y, al llegar el pago, **vira a «Pagada»**: el sello VENCIDA se desvanece,
 * cae el sello **PAGADO** (verde), salta el ✓ con chispa y una onda verde celebra
 * el cobro. Acaba sostenido en la factura cobrada.
 *
 * Misma placa neumórfica limpia compartida (`DunningInvoiceCard`); el único color
 * de marco es un aro verde TENUE y transitorio del cobro (no el marco rojo que se
 * quitó). One-shot lineal con HOLD final.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Fonts } from '../fonts';
import {
  BRAND,
  CENTER,
  STAGE,
  clamp01,
  smoother,
  mix,
  TEXT_FONT,
  Check,
  CANVAS_BG,
} from './loopKit';
import { DunningInvoiceCard, DUNNING_CARD_W, DUNNING_CARD_H, Stamp } from './dunningInvoice';

export const M2_DUNNING_PAID_DURATION = 120; // 4.0 s

// ── ritmo del acto ────────────────────────────────────────────────────────────
const CARD_IN = 14; //     entra la tarjeta (estado vencido)
const PAY_AT = 26; //      llega el pago
const PAY_SPAN = 16; //    transición vencida → pagada
const CHECK_AT = PAY_AT + 8;

const CARD_X = CENTER - DUNNING_CARD_W / 2;
const CARD_Y = CENTER - DUNNING_CARD_H / 2;

export const M2DunningPaidScene: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = smoother(clamp01(frame / CARD_IN));

  // 0 = vencida … 1 = pagada
  const paid = smoother(clamp01((frame - PAY_AT) / PAY_SPAN));

  const statusText = paid < 0.5 ? 'Vencida hace 8 días' : 'Pagada';
  const statusColor = paid < 0.5 ? BRAND.red : mix(BRAND.green, '#000000', 0.18);

  // sellos: VENCIDA se va, PAGADO cae
  const vencAppear = clamp01(1 - paid * 2.2);
  const paidAppear = clamp01((paid - 0.4) / 0.45);

  // aro verde del cobro: hump transitorio que decae a un verde tenue de reposo
  const hump = Math.sin(clamp01((frame - PAY_AT) / 26) * Math.PI);
  const paidGlow = clamp01(0.4 * paid + 0.5 * hump);

  // onda verde que celebra el cobro (se expande y se desvanece)
  const ripple = clamp01((frame - PAY_AT) / 30);
  const rippleR = 120 + ripple * 230;
  const rippleOp = (1 - ripple) * 0.5 * clamp01((frame - PAY_AT) / 4);

  // ✓ «cobrada» en la esquina inferior derecha de la tarjeta
  const checkDraw = clamp01((frame - CHECK_AT) / 14);
  const checkSpark = clamp01((frame - CHECK_AT) / 24);

  return (
    <AbsoluteFill
      style={{
        background: CANVAS_BG,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      {/* onda verde del cobro (detrás de la tarjeta) */}
      {rippleOp > 0.01 && (
        <svg width={STAGE} height={STAGE} viewBox={`0 0 ${STAGE} ${STAGE}`} style={{ position: 'absolute', inset: 0 }}>
          <circle cx={CENTER} cy={CENTER} r={rippleR} fill="none" stroke={BRAND.green} strokeWidth={6} opacity={rippleOp} />
        </svg>
      )}

      <div
        style={{
          position: 'absolute',
          left: CARD_X,
          top: CARD_Y,
          opacity: appear,
          transform: `scale(${0.965 + 0.035 * appear})`,
          transformOrigin: '50% 50%',
        }}
      >
        <DunningInvoiceCard statusText={statusText} statusColor={statusColor} paidGlow={paidGlow} />
      </div>

      {/* sellos + ✓ (van por encima de la tarjeta; gateados por la entrada para no
          flotar solos antes de que la tarjeta aparezca) */}
      <Stamp text="VENCIDA" color={BRAND.red} x={CARD_X + DUNNING_CARD_W - 36} y={CARD_Y + 28} appear={appear * vencAppear} />
      <Stamp text="PAGADO" color={mix(BRAND.green, '#000000', 0.12)} x={CARD_X + DUNNING_CARD_W - 36} y={CARD_Y + 28} appear={appear * paidAppear} />

      {checkDraw > 0.01 && (
        <svg width={STAGE} height={STAGE} viewBox={`0 0 ${STAGE} ${STAGE}`} style={{ position: 'absolute', inset: 0 }}>
          <Check cx={CARD_X + DUNNING_CARD_W - 34} cy={CARD_Y + DUNNING_CARD_H - 34} size={36} draw={checkDraw} spark={checkSpark} />
        </svg>
      )}
    </AbsoluteFill>
  );
};
