/**
 * dunningInvoice — la tarjeta de factura compartida por los 3 actos de Dunning.
 * ──────────────────────────────────────────────────────────────────────────────
 * Tras la iteración con Iván, la factura deja de ir en una doble caja (placa
 * neumórfica TEÑIDA de rojo por fuera + `TailarkCard` con su ring oscuro por
 * dentro). Ahora es **una sola placa NEUMÓRFICA limpia** — el «borde neumorfista
 * de la casa» (`elevation` raised) — sin marco rojo externo y sin el ring negro de
 * Tailark: «dejamos solo la factura».
 *
 * Es la MISMA factura en el acto 1 (vence) y en el acto 3 (cobrada): nº e importe
 * son constantes (`DUNNING_INVOICE`) para que se reconozca que es la misma. El
 * estado (vencimiento / pagada) y su color los inyecta cada acto vía `statusText`
 * + `statusColor`; el resto de la tarjeta queda neutra (sin teñir el marco).
 */

import {
  lightTheme,
  elevation,
  KIT_BLUE,
  BRAND,
  TEXT_FONT,
  DISPLAY_FONT,
  mix,
  clamp01,
  lerp,
  smoother,
  type Pt,
} from './loopKit';

// ── la factura (constante: misma en «vence» y en «cobrada») ───────────────────
export const DUNNING_INVOICE = { num: 'INV-002418', amount: '3.480,00 €' };

export const DUNNING_CARD_W = 470;
export const DUNNING_CARD_H = 528;

const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

/** Fila «Para / De / Dirección» (look Tailark) — barra neutra, longitud variable. */
const MetaRow: React.FC<{ label: string; w: string }> = ({ label, w }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '124px 1fr', alignItems: 'center' }}>
    <span style={{ fontFamily: TEXT_FONT, fontSize: 21, fontWeight: 500, color: mix(lightTheme.textStrong, '#ffffff', 0.45) }}>{label}</span>
    <span style={{ height: 10, width: w, borderRadius: 999, background: mix(lightTheme.textStrong, lightTheme.surface, 0.66) }} />
  </div>
);

/**
 * La tarjeta de factura — placa neumórfica única.
 * `statusText`/`statusColor`: línea de estado (la mueve cada acto).
 * `paidGlow` (0..1): destello verde TRANSITORIO de «cobrada» (acto 3) — no es un
 * marco permanente, sube al pagar y decae; en reposo (0) la placa queda neutra.
 */
export const DunningInvoiceCard: React.FC<{
  statusText: string;
  statusColor: string;
  paidGlow?: number;
  /** micro-pulso de la línea de estado (acto 1, «tick» al correr cada día). */
  statusScale?: number;
}> = ({ statusText, statusColor, paidGlow = 0, statusScale = 1 }) => {
  const g = clamp01(paidGlow);
  const plate = elevation(lightTheme, { depth: 'raised', distance: 16, blur: 38, radius: 30 });
  return (
    <div
      style={{
        width: DUNNING_CARD_W,
        height: DUNNING_CARD_H,
        boxSizing: 'border-box',
        padding: 46,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        ...plate,
        backgroundColor: lightTheme.surface,
        // único acento opcional: un aro verde TENUE y transitorio al cobrar.
        boxShadow: g > 0.01 ? `${plate.boxShadow}, inset 0 0 0 ${lerp(0, 2.5, g)}px ${mix(lightTheme.surface, BRAND.green, g)}` : plate.boxShadow,
      }}
    >
      {/* cabecera: wordmark AiKit + nº + importe + estado */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 20 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: KIT_BLUE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 11px -5px ${mix(KIT_BLUE, '#000000', 0.4)}`,
            }}
          >
            <span style={{ color: '#fff', fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 21 }}>A</span>
          </div>
          <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 28, letterSpacing: 0.2, color: lightTheme.textStrong }}>AiKit</span>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: mix(lightTheme.textStrong, '#ffffff', 0.4), marginBottom: 6 }}>{DUNNING_INVOICE.num}</div>
        <div style={{ fontFamily: MONO, fontSize: 47, fontWeight: 600, letterSpacing: -0.5, color: lightTheme.textStrong, marginBottom: 9 }}>{DUNNING_INVOICE.amount}</div>
        <div style={{ fontFamily: TEXT_FONT, fontSize: 23, fontWeight: 700, color: statusColor, whiteSpace: 'nowrap', transform: `scale(${statusScale})`, transformOrigin: '0% 50%' }}>{statusText}</div>
      </div>

      {/* filas Para / De / Dirección (UIs abstractas, nunca capturas reales) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <MetaRow label="Para" w="26%" />
        <MetaRow label="De" w="50%" />
        <MetaRow label="Dirección" w="66%" />
      </div>
    </div>
  );
};

/**
 * Sello diagonal genérico (VENCIDA rojo / PAGADO verde). `appear` 0..1 lo hace
 * «caer» con un leve overshoot de escala. `(x, y)` = esquina sup-derecha (ancla).
 */
export const Stamp: React.FC<{ text: string; color: string; x: number; y: number; appear: number }> = ({ text, color, x, y, appear }) => {
  const a = clamp01(appear);
  if (a <= 0.002) return null;
  const e = smoother(a);
  const scale = lerp(1.28, 1, e);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translateX(-50%) rotate(-7deg) scale(${scale})`,
        padding: '6px 16px',
        borderRadius: 9,
        backgroundColor: mix(lightTheme.surface, color, 0.16),
        boxShadow: `inset 0 0 0 2.5px ${color}`,
        fontFamily: TEXT_FONT,
        fontWeight: 800,
        fontSize: 26,
        letterSpacing: 1.3,
        color,
        opacity: clamp01(a * 1.5),
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

/**
 * El «sobre» (aviso de cobro) que viaja: solapa sobre un punto. SVG, sin glow.
 * Reutilizado del bucle original. `p` = centro del sobre.
 */
export const Envelope: React.FC<{ p: Pt; opacity?: number }> = ({ p, opacity = 1 }) => (
  <g opacity={opacity}>
    <rect x={p.x - 17} y={p.y - 12} width={34} height={24} rx={4} fill={mix(lightTheme.surface, KIT_BLUE, 0.25)} stroke={KIT_BLUE} strokeWidth={2.5} />
    <path d={`M ${p.x - 17} ${p.y - 12} L ${p.x} ${p.y + 2} L ${p.x + 17} ${p.y - 12}`} fill="none" stroke={KIT_BLUE} strokeWidth={2.5} strokeLinejoin="round" />
  </g>
);

/** Texto de estado por nº de días respecto al vencimiento (negativo = vencida). */
export function dueLabel(days: number): { text: string; color: string } {
  const d = Math.round(days);
  if (d > 0) {
    const unit = d === 1 ? 'día' : 'días';
    return { text: `Vence en ${d} ${unit}`, color: d <= 2 ? BRAND.orange : lightTheme.textMuted };
  }
  if (d === 0) return { text: 'Vence hoy', color: BRAND.orange };
  const ad = -d;
  const unit = ad === 1 ? 'día' : 'días';
  return { text: `Vencida hace ${ad} ${unit}`, color: BRAND.red };
}
