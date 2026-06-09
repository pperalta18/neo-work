/**
 * AccountingFlowVideo — "gestionar facturas y cerrar el trimestre", en 5 actos.
 * ──────────────────────────────────────────────────────────────────────────
 * Una mini-película encadenada con `TransitionSeries` (fades cortos), ágil
 * (~16 s). El grid serpenteante es solo UN acto, y en modo teaser:
 *
 * Sigue el §8 del pitch (facturas y velocidad de cobro). Sin chat: la ejecución
 * la cuenta el razonamiento de Foresight (no todos los flujos llevan chat).
 *   1. {@link InvoiceIntakeScene}   — las facturas entran en **Udon** (Odoo).
 *   2. {@link ConceptFlowVideo} (`cierre-trimestre`, teaser) — la IA da UN paso
 *      del recorrido (DocuSense · "Extrae") y la cámara se abre a la foto global
 *      del grid, que aquí dibuja una ESCALERA (Extrae · Combina · Analiza ·
 *      Presenta · Registra · Cierre): se intuye que ha recorrido todos los módulos.
 *   3. {@link AccountingLoopScene}  — **Foresight** cruza los datos y encuentra el
 *      patrón ("las del miércoles se cobran antes").
 *   4. {@link AccountingCloseScene} — informe con **Glimpse** + KPI antes→después +
 *      sello firmado (cómodo, rápido y seguro).
 *
 * Cada acto está también registrado suelto en Root.tsx para iterarlo aislado.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { InvoiceIntakeScene, INVOICE_INTAKE_DURATION } from './InvoiceIntakeScene'
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'
import { AccountingLoopScene, ACCOUNTING_LOOP_DURATION } from './AccountingLoopScene'
import { AccountingCloseScene, ACCOUNTING_CLOSE_DURATION } from './AccountingCloseScene'

const CONCEPT_ID = 'cierre-trimestre'

/** Pasos que recorre el grid antes de abrirse a la foto global. */
const GRID_TEASER_BEATS = 1

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8

const GRID_DURATION = flowDuration(CONCEPT_ID, GRID_TEASER_BEATS)

/** Total = Σ actos − (nº de transiciones) × solape. */
export const ACCOUNTING_DURATION =
  INVOICE_INTAKE_DURATION +
  GRID_DURATION +
  ACCOUNTING_LOOP_DURATION +
  ACCOUNTING_CLOSE_DURATION -
  3 * TRANSITION

/** A short cross-fade between two acts (a fresh element per call). */
const crossFade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
)

export function AccountingFlowVideo() {
  return (
    <TransitionSeries>
      {/* Acto 1 — facturas → Udon */}
      <TransitionSeries.Sequence durationInFrames={INVOICE_INTAKE_DURATION}>
        <InvoiceIntakeScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 2 — grid teaser (escalera): un paso + foto global */}
      <TransitionSeries.Sequence durationInFrames={GRID_DURATION}>
        <ConceptFlowVideo conceptId={CONCEPT_ID} teaserBeats={GRID_TEASER_BEATS} />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 3 — Foresight analiza y encuentra el patrón */}
      <TransitionSeries.Sequence durationInFrames={ACCOUNTING_LOOP_DURATION}>
        <AccountingLoopScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 4 — cierre: informe con Glimpse + KPI + sello */}
      <TransitionSeries.Sequence durationInFrames={ACCOUNTING_CLOSE_DURATION}>
        <AccountingCloseScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
