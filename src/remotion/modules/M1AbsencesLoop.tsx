/**
 * M1AbsencesLoop · versión BUCLE PERFECTO de Ausencias (conservada para comparar).
 * ──────────────────────────────────────────────────────────────────────────────
 * Era el clip `ModAbsences` original (loop de 120 f). Iván pidió rediseñar el
 * "proceso" como mini-película de 3 actos (ver `M1Absences.tsx`); este loop se
 * conserva registrado como `ModAbsencesLoop` (folder `Modulos-V1`) para comparar
 * lado a lado. Ya trae los arreglos de look pedidos (sin placa de fondo, cada
 * nombre sobre su placa neumórfica sin borde).
 *
 * Lenguaje HÍBRIDO (placa neumórfica AiKit + UI interna de Tailark). Base Tailark:
 * **calendar** (`vendor/tailark-pro/calendar.tsx`) — tarjeta-evento con título +
 * un toggle de punto de estado (pista redondeada + perilla). De ahí tomamos la
 * geometría/estética; su movimiento CSS se reimplementa por frame.
 *
 * UNA tarjeta-agenda neumórfica grande («Ausencias · Junio») con 5 FILAS de
 * solicitud (avatar + nombre + «🌴 N días» + toggle Tailark con punto de estado).
 * Coreografía «portador con solape»: SIEMPRE hay exactamente UNA fila en
 * aprobación. Por turnos, una fila levanta su solicitud (realce sutil) → Action
 * Runner pulsa → el toggle se desliza grey→verde + un ✓ breve + la fila se tiñe
 * muy suave de verde → decae a neutro JUSTO cuando la siguiente fila levanta la
 * suya. 5 aprobaciones por loop (120 = 5·24). Módulo: actionRunner.
 *
 * Bucle: el seam (frame 119→0) cae en MITAD del plateau de la fila portadora; en
 * u→1 toda fila vuelve a reposo (toggle gris, tinte 0), idéntico a u=0 → sin pop.
 * Determinista: solo hash/Math.sin; jamás Date/Math.random.
 */

import {
  LoopStage,
  AvatarChip,
  ModuleIcon,
  Check,
  StageSvg,
  useLoop,
  hash,
  mod,
  M1_DURATION,
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

export const M1_ABSENCES_LOOP_DURATION = M1_DURATION; // 120 f · 4 s

const DUR = M1_ABSENCES_LOOP_DURATION;
const ROWS = 5;
const SLOT = DUR / ROWS; // 24 f por turno de aprobación (120 = 5·24)

// ── datos deterministas (nombre + iniciales + días 1–5) ─────────────────────────
const NAMES = ['Marta Ruiz', 'Carlos Vega', 'Lucía Mora', 'Iván Soto', 'Nora Gil'] as const;
const initialsOf = (full: string) =>
  full
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
const daysOf = (i: number) => 1 + Math.floor(hash(i * 5.3 + 2.1) * 5); // 1..5 🌴

// ── layout de la tarjeta-agenda ────────────────────────────────────────────────
const CARD_W = 760;
const HEAD_H = 96;
const ROW_H = 96;
const ROW_GAP = 16;
const PAD = 28;
const HEAD_GAP = 8; // separación cabecera→primera fila
const CARD_H = PAD * 2 + HEAD_H + HEAD_GAP + ROWS * ROW_H + (ROWS - 1) * ROW_GAP;
const CARD_X = CENTER - CARD_W / 2;
const CARD_Y = CENTER - CARD_H / 2;

const ICON = 96; // Action Runner (esquina sup-izq de la tarjeta)

// ── fase de aprobación de la fila `i` (turno desfasado SLOT, con solape) ─────────
// e∈[0,1) = tiempo local de la fila a lo largo del loop. El turno «vivo» ocupa
// [0, WIN); el resto es reposo. WIN > 1/ROWS (0.2) → solape: cuando una fila aún
// decae, la siguiente ya levanta → SIEMPRE hay una fila en aprobación, y el seam
// del loop cae en mitad de un plateau (nada latcheado cruza la costura).
type RowAct = {
  lift: number; // 0..1 realce sutil de la fila
  toggle: number; // 0..1 perilla grey→verde
  done: number; // 0..1 tinte verde «aprobado» (transitorio)
  check: number; // 0..1 trazo del ✓
  spark: number; // 0..1 chispa del ✓
};

const WIN = 0.34; // ventana viva de cada turno (fracción del loop)

function rowAct(frame: number, i: number): RowAct {
  const e = mod(frame - i * SLOT, DUR) / DUR; // 0..1 reloj local de la fila i
  if (e >= WIN) return { lift: 0, toggle: 0, done: 0, check: 0, spark: 0 };
  const u = e / WIN; // 0..1 dentro del turno

  // sub-fases en u: levanta 0–.28 · toggle/run .22–.62 · check .42–.66 · todo→0 antes de 1
  const lift = smooth(clamp01(u / 0.28)) * (1 - smooth(clamp01((u - 0.7) / 0.3)));
  const toggle = smoother(clamp01((u - 0.22) / 0.28)) * (1 - smooth(clamp01((u - 0.62) / 0.34)));
  const done = smooth(clamp01((u - 0.34) / 0.16)) * (1 - smooth(clamp01((u - 0.6) / 0.4)));
  const check = smooth(clamp01((u - 0.42) / 0.2)) * (1 - smooth(clamp01((u - 0.66) / 0.3)));
  const spark = clamp01((u - 0.5) / 0.18) * (1 - clamp01((u - 0.62) / 0.16));
  return { lift, toggle, done, check, spark };
}

// ── y central de la fila i (para anclar el ✓ en SVG de lienzo completo) ──────────
const rowCenterY = (i: number) => CARD_Y + PAD + HEAD_H + HEAD_GAP + i * (ROW_H + ROW_GAP) + ROW_H / 2;

export const M1AbsencesLoopScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  const acts = Array.from({ length: ROWS }, (_, i) => rowAct(frame, i));
  // Action Runner se enciende con la fila que está pulsando el toggle.
  const iconActive = clamp01(acts.reduce((a, r) => Math.max(a, r.toggle), 0));

  return (
    <LoopStage dur={DUR}>
      {/* SIN placa neumórfica de fondo (pedido por Iván): la agenda flota sobre el
          escenario; cada nombre lleva su propia placa neumórfica (ver AbsenceRow). */}

      {/* tarjeta-agenda (geometría calendar Tailark): cabecera + filas */}
      <div style={{ position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W, height: CARD_H, padding: PAD, boxSizing: 'border-box' }}>
        {/* cabecera «Ausencias · Junio» */}
        <div style={{ height: HEAD_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingInline: 6 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 36, color: lightTheme.textStrong, letterSpacing: 0.1 }}>Ausencias · Junio</span>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 18, color: lightTheme.textStrong, opacity: 0.5 }}>Solicitudes por aprobar</span>
          </div>
          <PendingPill rows={acts} />
        </div>

        {/* filas de solicitud */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: ROW_GAP, marginTop: HEAD_GAP }}>
          {acts.map((act, i) => (
            <AbsenceRow key={i} i={i} act={act} />
          ))}
        </div>
      </div>

      {/* ✓ verde con chispa, sobre el toggle de la fila activa (decae antes del seam) */}
      <StageSvg>
        {acts.map((act, i) =>
          act.check > 0.04 ? <Check key={i} cx={CARD_X + CARD_W - PAD - 36} cy={rowCenterY(i)} size={24} draw={act.check} spark={act.spark} /> : null,
        )}
      </StageSvg>

      {/* icono de marca SIEMPRE presente (esquina), se enciende al aprobar */}
      <ModuleIcon name="actionRunner" size={ICON} x={CARD_X + 2} y={CARD_Y - 18} active={iconActive} />
    </LoopStage>
  );
};

// ── fila de solicitud: placa NEUMÓRFICA por nombre + avatar + 🌴 + toggle ─────────
// Antes era una TailarkCard plana con aro/borde; Iván pidió quitar ese borde intenso
// y que cada nombre vaya sobre su propia placa neumórfica (relieve, sin contorno).
const AbsenceRow: React.FC<{ i: number; act: RowAct }> = ({ i, act }) => {
  const name = NAMES[i];
  const days = daysOf(i);
  const raise = act.lift;
  const tint = act.done; // verde «aprobado» (transitorio)
  const liftY = -raise * 4;
  const scale = 1 + raise * 0.016;

  // relieve raised que crece un pelín al levantar la solicitud (sin aro/borde).
  const elev = elevation(lightTheme, { depth: 'raised', distance: 9 + raise * 5, blur: 20 + raise * 10, radius: 26 });

  return (
    <div
      style={{
        transform: `translateY(${liftY}px) scale(${scale})`,
        transformOrigin: '50% 50%',
        height: ROW_H,
        ...elev,
        backgroundColor: mix(lightTheme.surface, BRAND.green, tint * 0.14),
        display: 'flex',
        alignItems: 'center',
        paddingInline: 20,
        gap: 16,
        boxSizing: 'border-box',
      }}
    >
      <AvatarChip initials={initialsOf(name)} size={48} seed={i + 1} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 24, color: lightTheme.textStrong, whiteSpace: 'nowrap' }}>{name}</span>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 18, color: lightTheme.textStrong, opacity: 0.62 }}>
          🌴 {days} {days === 1 ? 'día' : 'días'} · vacaciones
        </span>
      </div>

      {/* estado textual breve mientras aprueba (sin latch) */}
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontWeight: 700,
          fontSize: 16,
          color: mix('#9aa6bd', BRAND.green, clamp01(act.toggle)),
          opacity: 0.28 + 0.72 * clamp01(Math.max(act.lift, act.toggle)),
          whiteSpace: 'nowrap',
        }}
      >
        {act.toggle > 0.5 ? 'Aprobado' : 'Pendiente'}
      </span>

      {/* toggle estilo calendar Tailark: pista redondeada + perilla + punto de estado */}
      <StatusToggle on={act.toggle} />
    </div>
  );
};

// ── toggle Tailark (pista + perilla deslizante grey→verde + punto de estado) ─────
const TRACK_W = 70;
const TRACK_H = 36;
const KNOB = 28;
const StatusToggle: React.FC<{ on: number }> = ({ on }) => {
  const e = smoother(clamp01(on));
  const dotColor = mix('#aeb8cc', BRAND.green, e); // pendiente gris → verde aprobado
  const trackBg = mix('#e7ebf3', mix('#ffffff', BRAND.green, 0.34), e);
  const knobX = lerp(3, TRACK_W - KNOB - 3, e);
  return (
    <div
      style={{
        position: 'relative',
        width: TRACK_W,
        height: TRACK_H,
        borderRadius: 999,
        background: trackBg,
        boxShadow: `inset 0 0 0 1px ${mix('rgba(120,134,160,0.30)', BRAND.green, e * 0.6)}, ${
          elevation(lightTheme, { depth: 'recessed', distance: 3, blur: 6, radius: 999 }).boxShadow
        }`,
        flexShrink: 0,
      }}
    >
      {/* perilla con su punto de estado dentro (calendar: size-3 rounded-full) */}
      <div
        style={{
          position: 'absolute',
          top: (TRACK_H - KNOB) / 2,
          left: knobX,
          width: KNOB,
          height: KNOB,
          borderRadius: 999,
          background: lightTheme.surface,
          boxShadow: elevation(lightTheme, { depth: 'raised', distance: 4, blur: 8, radius: 999 }).boxShadow,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ width: 11, height: 11, borderRadius: 999, background: dotColor }} />
      </div>
    </div>
  );
};

// ── pill de «N pendientes» en la cabecera (cuenta filas en reposo, sin latch) ────
const PendingPill: React.FC<{ rows: RowAct[] }> = ({ rows }) => {
  // cada fila aporta (1 - done): al aprobarse descuenta, al volver a reposo recuenta.
  // Periódico en DUR → idéntico en el seam.
  const pending = rows.reduce((a, r) => a + (1 - clamp01(r.done)), 0);
  const n = Math.round(pending);
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: mix(lightTheme.surface, '#ffffff', 0.55),
        boxShadow: 'inset 0 0 0 1px rgba(120,134,160,0.22)',
        borderRadius: 999,
        padding: '8px 16px',
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: 18,
        color: lightTheme.textStrong,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 999, background: KIT_BLUE }} />
      {n} pendientes
    </div>
  );
};
