/**
 * SupportFlowVideo — "del caos multicanal a un cliente atendido solo", en 5 actos.
 * ──────────────────────────────────────────────────────────────────────────
 * Mini-película encadenada con `TransitionSeries` (fades cortos), hermana de
 * Accounting / E-Commerce / Email. El grid serpenteante es solo UN acto, teaser.
 *
 *   1. {@link MessageStormScene}    — el PROBLEMA: una lluvia de mensajes de todos
 *      los canales que se amontona sin responder.
 *   2. {@link ChannelsConnectScene} — **Hotpot** conecta los canales → una bandeja
 *      única y ordenada.
 *   3. {@link ConceptFlowVideo} (`soporte-cliente`, teaser) — la IA da UN paso del
 *      recorrido (Hotpot · "Canales") y la cámara se abre a la foto global del
 *      grid (Canales · Tickets · Prioriza · Resuelve · Escala · Responde).
 *   4. {@link SupportChatScene}     — **Action Runner** atiende a un cliente y
 *      resuelve al instante.
 *   5. {@link SupportResolvedScene} — cliente atendido, equipo aliviado: primera
 *      respuesta 3 h → 30 s + cliente feliz (**Skill Hub** + **Foresight**).
 *
 * Cada acto está también registrado suelto en Root.tsx para iterarlo aislado.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { MessageStormScene, MESSAGE_STORM_DURATION } from './MessageStormScene'
import { ChannelsConnectScene, CHANNELS_CONNECT_DURATION } from './ChannelsConnectScene'
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'
import { SupportChatScene, SUPPORT_CHAT_DURATION } from './SupportChatScene'
import { SupportResolvedScene, SUPPORT_RESOLVED_DURATION } from './SupportResolvedScene'

const CONCEPT_ID = 'soporte-cliente'

/** Pasos que recorre el grid antes de abrirse a la foto global. */
const GRID_TEASER_BEATS = 1

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8

const GRID_DURATION = flowDuration(CONCEPT_ID, GRID_TEASER_BEATS)

/** Total = Σ actos − (nº de transiciones) × solape. */
export const SUPPORT_DURATION =
  MESSAGE_STORM_DURATION +
  CHANNELS_CONNECT_DURATION +
  GRID_DURATION +
  SUPPORT_CHAT_DURATION +
  SUPPORT_RESOLVED_DURATION -
  4 * TRANSITION

/** A short cross-fade between two acts (a fresh element per call). */
const crossFade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
)

export function SupportFlowVideo() {
  return (
    <TransitionSeries>
      {/* Acto 1 — la lluvia de mensajes (el problema) */}
      <TransitionSeries.Sequence durationInFrames={MESSAGE_STORM_DURATION}>
        <MessageStormScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 2 — Hotpot conecta los canales → bandeja única */}
      <TransitionSeries.Sequence durationInFrames={CHANNELS_CONNECT_DURATION}>
        <ChannelsConnectScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 3 — grid teaser: un paso + foto global */}
      <TransitionSeries.Sequence durationInFrames={GRID_DURATION}>
        <ConceptFlowVideo conceptId={CONCEPT_ID} teaserBeats={GRID_TEASER_BEATS} />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 4 — chat: la IA atiende a un cliente */}
      <TransitionSeries.Sequence durationInFrames={SUPPORT_CHAT_DURATION}>
        <SupportChatScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 5 — cliente atendido, equipo aliviado */}
      <TransitionSeries.Sequence durationInFrames={SUPPORT_RESOLVED_DURATION}>
        <SupportResolvedScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
