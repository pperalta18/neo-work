/**
 * EmailFlowVideo — "de campañas a mano a un funnel que se nutre solo", en 5 actos.
 * ──────────────────────────────────────────────────────────────────────────
 * Una mini-película encadenada con `TransitionSeries` (fades cortos), hermana de
 * {@link AccountingFlowVideo} y {@link EcommerceFlowVideo}. El grid serpenteante
 * es solo UN acto, en modo teaser.
 *
 *   1. {@link EmailGrindScene}      — el PROBLEMA: un borrador que no sale (asunto
 *      que se teclea y borra, "Para" sin segmentar, Enviar apagado) bajo una pila
 *      de herramientas (Mailchimp, HubSpot, Klaviyo, Brevo…) y el tiempo perdido.
 *   2. {@link ContactsMergeScene}  — tus contactos dispersos (Excel, CRM, web,
 *      email) CONVERGEN en una lista unificada con **DocuSense**.
 *   3. {@link ConceptFlowVideo} (`campana-email`, teaser) — la IA da UN paso del
 *      recorrido (DocuSense · "Contactos") y la cámara se abre a la foto global
 *      del grid, aquí en LINEAL (Contactos → Segmenta → Diseña → Redacta → Envía
 *      → Nutre): el funnel se lee como una cinta recta.
 *   4. {@link EmailComposeScene}   — **Smart Process** COMPONE la campaña en un
 *      terminal (segmenta, diseña la secuencia, programa envíos). Sin chat.
 *   5. {@link CampaignLiveScene}   — **Action Script** la envía y nutre 24/7 y
 *      **Foresight** la mide: secuencia automática + aperturas y clics subiendo.
 *
 * Cada acto está también registrado suelto en Root.tsx para iterarlo aislado.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { EmailGrindScene, EMAIL_GRIND_DURATION } from './EmailGrindScene'
import { ContactsMergeScene, CONTACTS_MERGE_DURATION } from './ContactsMergeScene'
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'
import { EmailComposeScene, EMAIL_COMPOSE_DURATION } from './EmailComposeScene'
import { CampaignLiveScene, CAMPAIGN_LIVE_DURATION } from './CampaignLiveScene'

const CONCEPT_ID = 'campana-email'

/** Pasos que recorre el grid antes de abrirse a la foto global. */
const GRID_TEASER_BEATS = 1

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8

const GRID_DURATION = flowDuration(CONCEPT_ID, GRID_TEASER_BEATS)

/** Total = Σ actos − (nº de transiciones) × solape. */
export const EMAIL_MARKETING_DURATION =
  EMAIL_GRIND_DURATION +
  CONTACTS_MERGE_DURATION +
  GRID_DURATION +
  EMAIL_COMPOSE_DURATION +
  CAMPAIGN_LIVE_DURATION -
  4 * TRANSITION

/** A short cross-fade between two acts (a fresh element per call). */
const crossFade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
)

export function EmailFlowVideo() {
  return (
    <TransitionSeries>
      {/* Acto 1 — el borrador atascado bajo la pila de herramientas (el problema) */}
      <TransitionSeries.Sequence durationInFrames={EMAIL_GRIND_DURATION}>
        <EmailGrindScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 2 — contactos dispersos que convergen → DocuSense */}
      <TransitionSeries.Sequence durationInFrames={CONTACTS_MERGE_DURATION}>
        <ContactsMergeScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 3 — grid teaser (lineal): un paso + foto global */}
      <TransitionSeries.Sequence durationInFrames={GRID_DURATION}>
        <ConceptFlowVideo conceptId={CONCEPT_ID} teaserBeats={GRID_TEASER_BEATS} />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 4 — Smart Process compone la campaña (terminal, sin chat) */}
      <TransitionSeries.Sequence durationInFrames={EMAIL_COMPOSE_DURATION}>
        <EmailComposeScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 5 — la campaña se envía y nutre sola (Action Script + Foresight) */}
      <TransitionSeries.Sequence durationInFrames={CAMPAIGN_LIVE_DURATION}>
        <CampaignLiveScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
