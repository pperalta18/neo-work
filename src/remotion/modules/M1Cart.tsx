/**
 * M1Cart · «Carrito abandonado recuperado» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Lenguaje HÍBRIDO (UI interna de Tailark + placa de «módulo en funcionamiento»
 * AiKit). Base Tailark: **payment / checkout form** (`PaymentIllustration`) — campo
 * Email + «Card Information» (nº de tarjeta con chip de marca + MM/YY + CVV) montados
 * sobre una `TailarkCard` con ring fino. El logo Visa se recrea como chip abstracto.
 *
 * Estructura en **3 MOMENTOS** (mini-secuencia en bucle perfecto, pedido por Iván):
 *   1) ABANDONO — el checkout está apagado/desaturado (campos vacíos) y abajo asoma
 *      una **notificación** «Compra sin terminar · 48,90 €» (sustituye al antiguo
 *      sello atravesado «Carrito abandonado»).
 *   2) EJECUCIÓN — entra el lenguaje de «módulo trabajando» de Accounting/Ecommerce:
 *      la placa de **Action Script** (`OperatingModuleTile`) se abre con el estado
 *      «Recuperando carrito» mientras un shimmer recorre Email→tarjeta→CVV y revive
 *      la tarjeta (gris→color).
 *   3) PAGO — el botón vira a KIT_BLUE → «✓ Pagado» (✓ INLINE en el botón, ya no un
 *      check flotando encima). Sin el recuadro contenedor (la placa gris→verde se
 *      eliminó): el checkout queda solo sobre el fondo neumórfico.
 *
 * Bucle (relevo, sin costura): la tarjeta pagada se desvanece y se cruza con una
 * NUEVA gris/abandonada (drivers a 0) → en u→1 el estado == u=0. El verde y la placa
 * de ejecución NO se latchean: decaen antes del seam. Determinista, periódico en DUR.
 * Módulo: actionScript.
 */

import {
  LoopStage,
  TailarkCard,
  TAILARK_RING,
  useLoop,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  clamp01,
  lerp,
  smooth,
  smoother,
  mix,
} from './loopKit';
import { OperatingModuleTile } from '../OperatingModuleTile';

export const M1_CART_DURATION = 150; // 5.0 s — override de M1 (120 f): da aire a los 3 momentos

const DUR = M1_CART_DURATION;

// ── coreografía de los 3 momentos (en fracciones u∈[0,1) del loop) ────────────────
// 1) ABANDONO reposo  2) EJECUCIÓN (placa Action Script + shimmer)  3) PAGO  → relevo
const REVIVE_START = 0.22;
const REVIVE_END = 0.42; // la tarjeta recupera color (deja de estar «abandonada»)
const TILE_IN = 0.16; // la placa de ejecución asoma y se abre
const TILE_OUT_START = 0.52; // …y se cierra/retira antes del pago
const TILE_OUT_END = 0.62;
const FILL_START = 0.28;
const FILL_END = 0.5; // shimmer Email→tarjeta→CVV
const PAID_START = 0.52;
const PAID_PEAK = 0.66; // botón KIT_BLUE → ✓ «Pagado»
const RELAY_START = 0.76; // el pagado se desvanece y entra un carrito nuevo gris
const RELAY_END = 0.94; // ya está el nuevo carrito abandonado en reposo (== u=0)

// ── geometría ────────────────────────────────────────────────────────────────────
const CARD_W = 560;
const CARD_H = 600;
const CARD_Y = CENTER + 26;
const TILE_Y = CENTER - 388; // placa de ejecución, arriba (sobre la tarjeta)
const NOTICE_Y = CENTER + 430; // notificación de abandono, abajo
const FIELD_H = 64;
const FIELD_GAP = 18;

// progreso 0..1 de un tramo [a,b] de u, con suavizado
const seg = (u: number, a: number, b: number, ease: (t: number) => number = smooth) =>
  ease(clamp01((u - a) / (b - a)));

// ──────────────────────────────────────────────────────────────────────────────

export const M1CartScene: React.FC = () => {
  const { frame, t: u } = useLoop(DUR);

  // ── relevo: crossfade de DOS tarjetas (saliente pagada / entrante gris) ─────────
  // En u→1 solo queda la entrante en reposo == la única tarjeta en u=0 → sin pop.
  const relay = seg(u, RELAY_START, RELAY_END, smooth);
  const outAlpha = 1 - relay; // opacidad de la saliente (la que recorre el ciclo)
  const inAlpha = relay; // opacidad de la entrante (gris/abandonada)

  // ── drivers de la tarjeta SALIENTE ──────────────────────────────────────────────
  const revive = seg(u, REVIVE_START, REVIVE_END, smoother); // gris → color (deja de estar abandonada)
  const fill = seg(u, FILL_START, FILL_END, smooth); // shimmer de relleno
  const paid = seg(u, PAID_START, PAID_PEAK, smoother); // botón → pagado (verde transitorio)

  // ── MOMENTO 2: placa de ejecución (Action Script «Recuperando carrito») ─────────
  // Aparece y se abre (TILE_IN), aguanta, y se cierra/retira antes del pago.
  const tilePresence = clamp01(seg(u, TILE_IN, REVIVE_START, smoother) - seg(u, TILE_OUT_START, TILE_OUT_END, smooth));
  const tileAlpha = tilePresence * outAlpha;

  // ── MOMENTO 1: notificación de abandono ─────────────────────────────────────────
  // Portador a través de la costura: visible cuando una tarjeta está abandonada.
  // saliente abandonada al inicio (1-revive) + entrante abandonada en el relevo (relay).
  const noticeOpacity = clamp01((1 - revive) * outAlpha + relay);

  return (
    <LoopStage dur={DUR}>
      {/* tarjeta-checkout ENTRANTE: el carrito NUEVO gris/abandonado en reposo
          (drivers a 0). Está detrás; aparece con el relevo y queda como reposo en u→1.
          Idéntica a la única tarjeta visible en u=0 → la costura cierra sin pop. */}
      {inAlpha > 0.001 && <CheckoutCard revive={0} fill={0} paid={0} placaAlpha={inAlpha} />}

      {/* tarjeta-checkout SALIENTE: apagada → revive → se rellena → paga.
          Se desvanece durante el relevo (outAlpha→0) descubriendo a la entrante. */}
      {outAlpha > 0.001 && <CheckoutCard revive={revive} fill={fill} paid={paid} placaAlpha={outAlpha} />}

      {/* MOMENTO 2 — el módulo en funcionamiento: misma placa que Accounting/Ecommerce.
          Determinista (frame + expand). Decae a 0 antes del seam (no se latchea). */}
      {tileAlpha > 0.002 && (
        <div style={{ opacity: tileAlpha }}>
          <OperatingModuleTile
            x={CENTER}
            y={TILE_Y}
            module="actionScript"
            status="Recuperando carrito"
            frame={frame}
            expand={tilePresence}
          />
        </div>
      )}

      {/* MOMENTO 1 — notificación de abandono, abajo (sustituye al sello atravesado) */}
      {noticeOpacity > 0.01 && <AbandonNotice opacity={noticeOpacity} />}
    </LoopStage>
  );
};

// ── tarjeta-checkout: Email + Card Information (chip de marca + MM/YY + CVV) ───────
const CheckoutCard: React.FC<{
  revive: number; // 0 apagado → 1 vivo
  fill: number; // shimmer de relleno 0..1
  paid: number; // 0..1 botón→pagado
  placaAlpha: number;
}> = ({ revive, fill, paid, placaAlpha }) => {
  // saturación: en abandonado vira a gris (desaturado), al revivir recupera color.
  // La nitidez NO cambia (el «apagado» es solo desaturación) → resting gris idéntico
  // entre la tarjeta saliente en u=0 y la entrante en u→1, sin pop en la costura.
  const sat = lerp(0.2, 1, revive);
  // anillo de la card: se enciende suave hacia KIT_BLUE mientras se rellena.
  const ring = mix(TAILARK_RING, KIT_BLUE, clamp01(fill) * 0.5 * revive);

  return (
    <div
      style={{
        position: 'absolute',
        left: CENTER - CARD_W / 2,
        top: CARD_Y - CARD_H / 2,
        width: CARD_W,
        height: CARD_H,
        opacity: placaAlpha,
        filter: `saturate(${sat})`,
      }}
    >
      <TailarkCard width={CARD_W} height={CARD_H} radius={28} bevel ring={ring} pad={40} shadow>
        {/* encabezado: título del checkout + total */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 26 }}>
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 26, color: lightTheme.textStrong, opacity: 0.5 + 0.5 * revive }}>
            Finalizar compra
          </span>
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 24, color: mix(lightTheme.textStrong, KIT_BLUE, 0.4 * revive), opacity: 0.4 + 0.6 * revive }}>
            48,90 €
          </span>
        </div>

        {/* líneas de producto tenues (lo que había en el carrito) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 24 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 + 0.4 * revive }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: mix('#c4cede', KIT_BLUE, 0.1 * revive), opacity: 0.7 }} />
              <div style={{ flex: 1, height: 7, borderRadius: 9, background: 'rgba(30,30,32,0.10)', maxWidth: i === 0 ? '70%' : '52%' }} />
              <div style={{ width: 44, height: 7, borderRadius: 9, background: 'rgba(30,30,32,0.10)' }} />
            </div>
          ))}
        </div>

        {/* Email */}
        <FieldLabel revive={revive}>Email</FieldLabel>
        <InputField radius={10} fillLevel={fieldFill(fill, 0)} revive={revive} placeholder="cliente@correo.com" />

        {/* Card Information */}
        <div style={{ height: FIELD_GAP }} />
        <FieldLabel revive={revive}>Información de la tarjeta</FieldLabel>
        {/* nº de tarjeta + chip de marca */}
        <InputField
          radius={10}
          radiusBottom={0}
          fillLevel={fieldFill(fill, 1)}
          revive={revive}
          placeholder="1234 1234 1234 1234"
          trailing={<BrandChip lit={fieldFill(fill, 1) * revive} />}
        />
        {/* MM/YY + CVV, fila inferior compartida */}
        <div style={{ display: 'flex', marginTop: -1 }}>
          <InputField radius={0} radiusBL={10} half="left" fillLevel={fieldFill(fill, 2)} revive={revive} placeholder="MM/YY" />
          <InputField radius={0} radiusBR={10} half="right" fillLevel={fieldFill(fill, 3)} revive={revive} placeholder="CVV" />
        </div>

        {/* botón Pagar → KIT_BLUE → ✓ Pagado */}
        <div style={{ marginTop: 28 }}>
          <PayButton paid={paid} revive={revive} />
        </div>
      </TailarkCard>
    </div>
  );
};

// el shimmer recorre los 4 campos en secuencia: Email(0)→nº(1)→MM/YY(2)→CVV(3)
const fieldFill = (fill: number, idx: number) => {
  const n = 4;
  const span = 1 / n;
  const start = idx * span;
  return clamp01((fill - start) / span);
};

const FieldLabel: React.FC<{ children: React.ReactNode; revive: number }> = ({ children, revive }) => (
  <div
    style={{
      fontFamily: TEXT_FONT,
      fontWeight: 600,
      fontSize: 17,
      color: lightTheme.textStrong,
      opacity: 0.4 + 0.45 * revive,
      marginBottom: 8,
    }}
  >
    {children}
  </div>
);

// campo de input estilo Tailark (bg blanco, ring fino, shadow suave) que «se rellena»
const InputField: React.FC<{
  radius?: number;
  radiusBottom?: number;
  radiusBL?: number;
  radiusBR?: number;
  half?: 'left' | 'right';
  fillLevel: number; // 0 vacío → 1 relleno (shimmer)
  revive: number;
  placeholder: string;
  trailing?: React.ReactNode;
}> = ({ radius = 10, radiusBottom, radiusBL, radiusBR, half, fillLevel, revive, placeholder, trailing }) => {
  const f = clamp01(fillLevel);
  const br = {
    borderTopLeftRadius: half === 'right' ? 0 : radius,
    borderTopRightRadius: half === 'left' ? 0 : radius,
    borderBottomLeftRadius: radiusBL ?? radiusBottom ?? radius,
    borderBottomRightRadius: radiusBR ?? radiusBottom ?? radius,
  };
  return (
    <div
      style={{
        position: 'relative',
        flex: half ? 1 : undefined,
        height: FIELD_H,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        background: '#ffffff',
        boxShadow: `inset 0 0 0 1px ${mix('rgba(120,134,160,0.28)', KIT_BLUE, f * 0.4 * revive)}, 0 4px 12px -8px rgba(40,52,74,0.35)`,
        marginLeft: half === 'right' ? -1 : 0,
        overflow: 'hidden',
        ...br,
      }}
    >
      {/* texto del campo: aparece a medida que el shimmer lo rellena */}
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 19,
          fontWeight: 500,
          color: mix('#9aa6bd', lightTheme.textStrong, f),
          opacity: lerp(0.4, 1, f) * (0.6 + 0.4 * revive),
          letterSpacing: 0.4,
        }}
      >
        {placeholder}
      </span>
      <div style={{ flex: 1 }} />
      {trailing}
      {/* barrido de luz del relleno (KIT_BLUE), recortado al campo */}
      {f > 0.01 && f < 0.99 && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 60,
            left: `calc(${f * 100}% - 30px)`,
            background: `linear-gradient(90deg, transparent, ${KIT_BLUE}33, transparent)`,
            opacity: revive,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

// chip de marca abstracto (sustituye al logo Visa) — se «enciende» al rellenar la tarjeta
const BrandChip: React.FC<{ lit: number }> = ({ lit }) => {
  const l = clamp01(lit);
  return (
    <div
      style={{
        width: 40,
        height: 26,
        borderRadius: 6,
        background: `linear-gradient(135deg, ${mix('#c4cede', KIT_BLUE, l)}, ${mix('#aeb8cc', mix(KIT_BLUE, BRAND.violet, 0.4), l)})`,
        boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.4)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7 + 0.3 * l,
      }}
    >
      {/* «banda» del chip */}
      <div style={{ width: 14, height: 10, borderRadius: 2, background: 'rgba(255,255,255,0.55)' }} />
    </div>
  );
};

// botón Pagar → vira a KIT_BLUE al estar listo → estado «✓ Pagado» (✓ INLINE, verde transitorio)
const PayButton: React.FC<{ paid: number; revive: number }> = ({ paid, revive }) => {
  // gris apagado → KIT_BLUE (listo para pagar) → tinte verde (pagado), todo transitorio
  const base = mix('#c8d0e0', KIT_BLUE, revive);
  const bg = mix(base, BRAND.green, clamp01(paid) * 0.85);
  const done = paid > 0.5;
  return (
    <div
      style={{
        height: 62,
        borderRadius: 14,
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        boxShadow: `0 10px 22px -12px ${mix(bg, '#000000', 0.35)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
        opacity: 0.55 + 0.45 * revive,
      }}
    >
      {/* ✓ inline al lado del texto (ya no flota encima de «Pagado») */}
      {done && <span style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 22, color: '#fff', lineHeight: 1 }}>✓</span>}
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 21, color: '#fff', letterSpacing: 0.3 }}>
        {done ? 'Pagado' : 'Pagar 48,90 €'}
      </span>
    </div>
  );
};

// notificación de abandono (sustituye al sello atravesado): toast neumórfico abajo,
// icono de carrito tintado + dos líneas + puntito de atención.
const AbandonNotice: React.FC<{ opacity: number }> = ({ opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: CENTER,
      top: NOTICE_Y,
      transform: 'translate(-50%, -50%)',
      opacity: clamp01(opacity),
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      ...elevation(lightTheme, { depth: 'raised', distance: 10, blur: 24, radius: 20 }),
      backgroundColor: lightTheme.surface,
      padding: '16px 26px 16px 18px',
      pointerEvents: 'none',
    }}
  >
    {/* icono de carrito en cuadradito tintado (atención) */}
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 14,
        background: mix(lightTheme.surface, BRAND.orange, 0.2),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 28,
        flexShrink: 0,
      }}
    >
      🛒
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 23, color: lightTheme.textStrong }}>Compra sin terminar</span>
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 500, fontSize: 17, color: lightTheme.textMuted }}>Un cliente dejó 48,90 € en el carrito</span>
    </div>
    {/* puntito de atención */}
    <div style={{ width: 10, height: 10, borderRadius: 999, background: BRAND.orange, marginLeft: 6, flexShrink: 0 }} />
  </div>
);
