/**
 * SchedulingFlowVideo — "planificación de horarios", en 5 actos.
 * ──────────────────────────────────────────────────────────────────────────
 * Mini-película hermana de Accounting / E-Commerce / Email / Support.
 *
 *   1. {@link ShiftChaosScene}      — el PROBLEMA: cuadrante manual lleno de
 *      solapes, huecos, notas de WhatsApp y restricciones que se pisan.
 *   2. {@link StaffImportScene}     — cargas empleados desde Excel / ERP;
 *      DocuSense + Junction lo convierten en una plantilla única.
 *   3. {@link SchedulingRulesScene} — **Feedback Loop** recoge y CONFIRMA las
 *      reglas del cuadrante en un panel (una a una con check). Sin chat.
 *   4. {@link ConceptFlowVideo} (`planificacion-horarios`, teaser) — AiKit da un
 *      paso del recorrido y se abre la foto global de módulos: plantilla, ERP,
 *      reglas, reparto, conflictos, ajustes, planillas, avisos y cambios.
 *   5. {@link ScheduleTemplateScene} — LA PLANTILLA: la planilla semanal se
 *      rellena sola, centrada, con la pill "creadas con Glimpse".
 *   6. {@link ScheduleResultsScene}  — RESULTADOS: en piloto automático con
 *      **Heartbeat** (rutina que corre sola) + KPIs (conflictos 0, cobertura 100%).
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { ShiftChaosScene, SHIFT_CHAOS_DURATION } from './ShiftChaosScene'
import { StaffImportScene, STAFF_IMPORT_DURATION } from './StaffImportScene'
import { SchedulingRulesScene, SCHEDULING_RULES_DURATION } from './SchedulingRulesScene'
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'
import { ScheduleTemplateScene, SCHEDULE_TEMPLATE_DURATION } from './ScheduleTemplateScene'
import { ScheduleResultsScene, SCHEDULE_RESULTS_DURATION } from './ScheduleResultsScene'

const CONCEPT_ID = 'planificacion-horarios'
const GRID_TEASER_BEATS = 1
const TRANSITION = 8

const GRID_DURATION = flowDuration(CONCEPT_ID, GRID_TEASER_BEATS)

export const SCHEDULING_DURATION =
  SHIFT_CHAOS_DURATION +
  STAFF_IMPORT_DURATION +
  SCHEDULING_RULES_DURATION +
  GRID_DURATION +
  SCHEDULE_TEMPLATE_DURATION +
  SCHEDULE_RESULTS_DURATION -
  5 * TRANSITION

const crossFade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
)

export function SchedulingFlowVideo() {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SHIFT_CHAOS_DURATION}>
        <ShiftChaosScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      <TransitionSeries.Sequence durationInFrames={STAFF_IMPORT_DURATION}>
        <StaffImportScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      <TransitionSeries.Sequence durationInFrames={SCHEDULING_RULES_DURATION}>
        <SchedulingRulesScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      <TransitionSeries.Sequence durationInFrames={GRID_DURATION}>
        <ConceptFlowVideo conceptId={CONCEPT_ID} teaserBeats={GRID_TEASER_BEATS} />
      </TransitionSeries.Sequence>
      {crossFade()}

      <TransitionSeries.Sequence durationInFrames={SCHEDULE_TEMPLATE_DURATION}>
        <ScheduleTemplateScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      <TransitionSeries.Sequence durationInFrames={SCHEDULE_RESULTS_DURATION}>
        <ScheduleResultsScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
