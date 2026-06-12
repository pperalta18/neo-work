/**
 * absencesShared — datos + piezas comunes de la mini-película de Ausencias (3 actos).
 * ──────────────────────────────────────────────────────────────────────────────
 * La pieza `ModAbsences` dejó de ser un loop abstracto: ahora cuenta una pequeña
 * historia en 3 actos (peticiones → módulo aprobando → marcador), encadenados con
 * fundidos (ver `M1Absences.tsx`). Este fichero centraliza lo que comparten:
 *   · `REQUESTS` — las 5 solicitudes nombradas + su veredicto (da el marcador del
 *     acto 3: Aprobadas 3 · A revisar 1 · Rechazada 1).
 *   · `RequestCard` — la tarjeta de solicitud con el look pedido por Iván: placa
 *     NEUMÓRFICA por nombre, sin borde, avatar + «🌴 N días».
 *   · `AbsBg` — el fondo común (mismo degradado claro que `LoopStage`) para que los
 *     3 actos sean una familia y los cross-fades queden limpios.
 */

import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import { AvatarChip, BRAND, lightTheme, elevation, TEXT_FONT, mix, CANVAS_BG } from './loopKit';
import { Fonts } from '../fonts';

export type Verdict = 'approved' | 'review' | 'rejected';

export type AbsenceRequest = {
  name: string;
  initials: string;
  days: number;
  reason: string; // micro-motivo para el marcador
  verdict: Verdict;
  seed: number;
};

/** Las 5 solicitudes nombradas. El reparto de veredictos fija el marcador del acto 3. */
export const REQUESTS: AbsenceRequest[] = [
  { name: 'Marta Ruiz', initials: 'MR', days: 5, reason: 'Sin solapes', verdict: 'approved', seed: 1 },
  { name: 'Carlos Vega', initials: 'CV', days: 3, reason: 'Cobertura ok', verdict: 'approved', seed: 2 },
  { name: 'Lucía Mora', initials: 'LM', days: 2, reason: 'Sin solapes', verdict: 'approved', seed: 3 },
  { name: 'Iván Soto', initials: 'IS', days: 4, reason: 'Solapa con Carlos', verdict: 'review', seed: 4 },
  { name: 'Nora Gil', initials: 'NG', days: 6, reason: 'Cierre de mes', verdict: 'rejected', seed: 5 },
];

export const VERDICT_META: Record<Verdict, { kpi: string; tag: string; color: string; glyph: string }> = {
  approved: { kpi: 'Aprobadas', tag: 'Aprobada', color: BRAND.green, glyph: '✓' },
  review: { kpi: 'A revisar', tag: 'A revisar', color: BRAND.orange, glyph: '!' },
  rejected: { kpi: 'Rechazadas', tag: 'Rechazada', color: BRAND.red, glyph: '✕' },
};

export const ROW_H = 92;
export const CARD_W = 560;

/** Fondo común de los 3 actos: mismo degradado claro que `LoopStage`, sin breathe. */
export const AbsBg: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill
    style={{
      background: CANVAS_BG,
      fontFamily: TEXT_FONT,
      overflow: 'hidden',
      ...style,
    }}
  >
    <Fonts />
    {children}
  </AbsoluteFill>
);

/**
 * Tarjeta de solicitud: placa NEUMÓRFICA (sin borde) + avatar + nombre + «🌴 N días».
 * `tint` (0..1) la tiñe hacia su acento de veredicto; `raise` (0..1) sube su relieve;
 * `verdict` muestra el badge de veredicto a la derecha.
 */
export const RequestCard: React.FC<{
  req: AbsenceRequest;
  width?: number;
  tint?: number;
  raise?: number;
  verdict?: Verdict | null;
  style?: CSSProperties;
}> = ({ req, width = CARD_W, tint = 0, raise = 0, verdict = null, style }) => {
  const elev = elevation(lightTheme, { depth: 'raised', distance: 9 + raise * 5, blur: 20 + raise * 10, radius: 26 });
  const accent = verdict ? VERDICT_META[verdict].color : BRAND.green;
  return (
    <div
      style={{
        width,
        height: ROW_H,
        ...elev,
        backgroundColor: mix(lightTheme.surface, accent, tint * 0.14),
        display: 'flex',
        alignItems: 'center',
        paddingInline: 20,
        gap: 16,
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <AvatarChip initials={req.initials} size={48} seed={req.seed} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 24, color: lightTheme.textStrong, whiteSpace: 'nowrap' }}>{req.name}</span>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 18, color: lightTheme.textStrong, opacity: 0.62 }}>
          🌴 {req.days} {req.days === 1 ? 'día' : 'días'} · vacaciones
        </span>
      </div>
      {verdict && <VerdictBadge verdict={verdict} />}
    </div>
  );
};

/** Badge de veredicto (pill con glifo + etiqueta, teñido por color). */
export const VerdictBadge: React.FC<{ verdict: Verdict; opacity?: number }> = ({ verdict, opacity = 1 }) => {
  const m = VERDICT_META[verdict];
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: mix(lightTheme.surface, m.color, 0.18),
        color: mix(m.color, '#000000', 0.28),
        fontFamily: TEXT_FONT,
        fontWeight: 800,
        fontSize: 15,
        padding: '6px 12px',
        borderRadius: 999,
        whiteSpace: 'nowrap',
        opacity,
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 13, lineHeight: 1 }}>{m.glyph}</span>
      {m.tag}
    </div>
  );
};
