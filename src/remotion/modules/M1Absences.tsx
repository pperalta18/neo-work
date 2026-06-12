/**
 * ModAbsences · «Aprobar ausencias sin Excel» — mini-película de 3 actos.
 * ──────────────────────────────────────────────────────────────────────────────
 * Iván rediseñó el "proceso": en vez de un loop abstracto, una pequeña HISTORIA
 * encadenada con fundidos (como accounting/e-commerce), cuadrada (1080), NO bucle:
 *   1. {@link M1AbsencesRequestsScene} — un MONTÓN de peticiones, todas de vacaciones
 *      (el problema): las solicitudes caen y se apilan, el contador sube.
 *   2. {@link M1AbsencesProcessScene}  — el MÓDULO lo gestiona: la placa neumórfica
 *      «en funcionamiento» (`OperatingModuleTile`, Action Runner) absorbe las
 *      solicitudes y se abre con «Aprobando ausencias» — mismo lenguaje que los flujos.
 *   3. {@link M1AbsencesSummaryScene}  — el MARCADOR: Aprobadas · A revisar ·
 *      Rechazadas (cuentas que suben) + sello + mini-avatares por veredicto.
 *
 * Datos y tarjeta de solicitud compartidos en `absencesShared.tsx`. La versión loop
 * anterior (con sus arreglos de look) se conserva en `M1AbsencesLoop.tsx`
 * (registrada como `ModAbsencesLoop` en `Modulos-V1`).
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { clamp01, smoother } from './loopKit';
import { M1AbsencesRequestsScene, ABS_REQUESTS_DURATION } from './M1AbsencesRequests';
import { M1AbsencesProcessScene, ABS_PROCESS_DURATION } from './M1AbsencesProcess';
import { M1AbsencesSummaryScene, ABS_SUMMARY_DURATION } from './M1AbsencesSummary';
import { AbsBg } from './absencesShared';

/** Solape de cada fundido entre actos (frames @30fps). */
const TRANSITION = 8;

/** Total = Σ actos − (nº de transiciones) × solape. */
export const M1_ABSENCES_DURATION =
  ABS_REQUESTS_DURATION + ABS_PROCESS_DURATION + ABS_SUMMARY_DURATION - 2 * TRANSITION;

/** Fundido de salida al cerrar: el contenido se disuelve hacia el lienzo limpio. */
const FADE_OUT = 16;

const crossFade = () => (
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
);

/**
 * Capa de cierre: el MISMO fondo (`AbsBg`) se opaca encima del último acto en los
 * últimos {@link FADE_OUT} frames → el clip ya no corta en seco, se funde al lienzo
 * (simétrico al fade-in de entrada). Solo afecta al vídeo combinado.
 */
const ClosingFade: React.FC = () => {
  const frame = useCurrentFrame();
  const o = smoother(clamp01((frame - (M1_ABSENCES_DURATION - FADE_OUT)) / FADE_OUT));
  if (o <= 0) return null;
  return <AbsBg style={{ opacity: o, pointerEvents: 'none' }}>{null}</AbsBg>;
};

export const M1AbsencesScene: React.FC = () => (
  <AbsoluteFill>
    <TransitionSeries>
      {/* Acto 1 — el montón de peticiones */}
      <TransitionSeries.Sequence durationInFrames={ABS_REQUESTS_DURATION}>
        <M1AbsencesRequestsScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 2 — Action Runner aprobando */}
      <TransitionSeries.Sequence durationInFrames={ABS_PROCESS_DURATION}>
        <M1AbsencesProcessScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 3 — el marcador */}
      <TransitionSeries.Sequence durationInFrames={ABS_SUMMARY_DURATION}>
        <M1AbsencesSummaryScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>

    <ClosingFade />
  </AbsoluteFill>
);
