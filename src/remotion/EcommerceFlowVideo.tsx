/**
 * EcommerceFlowVideo — "de tienda física a tienda online", en 6 actos.
 * ──────────────────────────────────────────────────────────────────────────
 * Una mini-película encadenada con `TransitionSeries` (fades cortos), gemela de
 * {@link AccountingFlowVideo}. Sigue la escaleta del e-commerce: el problema, la
 * solución de AiKit y la tienda ya viva. El grid serpenteante es solo UN acto, y
 * en modo teaser.
 *
 *   1. {@link PlatformChaosScene}    — el PROBLEMA: tienes una tienda física y
 *      quieres vender online, pero elegir e implementar plataforma (Shopify,
 *      WooCommerce, PrestaShop…, plugins, themes, extensiones) es un lío caro.
 *   2. {@link InventoryIntakeScene}  — subes tu inventario en Excel y **DocuSense**
 *      lo absorbe; brota el catálogo.
 *   3. {@link ConceptFlowVideo} (`montar-tienda`, teaser) — la IA da UN paso del
 *      recorrido (DocuSense · "Catálogo") y la cámara se abre a la foto global
 *      del grid (Catálogo · Conecta · Pregunta · Monta web · Publica · Stock):
 *      se intuye que recorre todos los módulos.
 *   4. {@link EcommerceChatScene}    — **Feedback Loop** te hace preguntas para
 *      personalizar la tienda (su nombre, AURELE; el envío).
 *   5. {@link StoreTerminalScene}    — **Forge** construye la web AURELE en un
 *      terminal: `aikit forge build aurele`, componentes JSX, stock conectado,
 *      ✓ AURELE lista. El "cómo" antes del "resultado".
 *   6. {@link StoreCreateScene}      — **Forge** monta la web AURELE delante de ti
 *      (reusa StoreBuild, time-remapeada): lista para vender.
 *
 * Cada acto está también registrado suelto en Root.tsx para iterarlo aislado.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions'
import { fade } from '@remotion/transitions/fade'
import { PlatformChaosScene, PLATFORM_CHAOS_DURATION } from './PlatformChaosScene'
import { InventoryIntakeScene, INVENTORY_INTAKE_DURATION } from './InventoryIntakeScene'
import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'
import { EcommerceChatScene, ECOMMERCE_CHAT_DURATION } from './EcommerceChatScene'
import { StoreTerminalScene, STORE_TERMINAL_DURATION } from './StoreTerminalScene'
import { StoreCreateScene, STORE_CREATE_DURATION } from './StoreCreateScene'

const CONCEPT_ID = 'montar-tienda'

/** Pasos que recorre el grid antes de abrirse a la foto global. */
const GRID_TEASER_BEATS = 1

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8

const GRID_DURATION = flowDuration(CONCEPT_ID, GRID_TEASER_BEATS)

/** Total = Σ actos − (nº de transiciones) × solape. Ahora 6 actos, 5 transiciones. */
export const ECOMMERCE_DURATION =
  PLATFORM_CHAOS_DURATION +
  INVENTORY_INTAKE_DURATION +
  GRID_DURATION +
  ECOMMERCE_CHAT_DURATION +
  STORE_TERMINAL_DURATION +
  STORE_CREATE_DURATION -
  5 * TRANSITION

/** A short cross-fade between two acts (a fresh element per call). */
const crossFade = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: TRANSITION })}
  />
)

export function EcommerceFlowVideo() {
  return (
    <TransitionSeries>
      {/* Acto 1 — el lío de plataformas (el problema) */}
      <TransitionSeries.Sequence durationInFrames={PLATFORM_CHAOS_DURATION}>
        <PlatformChaosScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 2 — inventario en Excel → DocuSense */}
      <TransitionSeries.Sequence durationInFrames={INVENTORY_INTAKE_DURATION}>
        <InventoryIntakeScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 3 — grid teaser: un paso + foto global */}
      <TransitionSeries.Sequence durationInFrames={GRID_DURATION}>
        <ConceptFlowVideo conceptId={CONCEPT_ID} teaserBeats={GRID_TEASER_BEATS} />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 4 — chat: Feedback Loop personaliza la tienda */}
      <TransitionSeries.Sequence durationInFrames={ECOMMERCE_CHAT_DURATION}>
        <EcommerceChatScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 5 — Forge construye AURELE en un terminal (el "cómo") */}
      <TransitionSeries.Sequence durationInFrames={STORE_TERMINAL_DURATION}>
        <StoreTerminalScene />
      </TransitionSeries.Sequence>
      {crossFade()}

      {/* Acto 6 — Forge monta la web AURELE (lista para vender; el "resultado") */}
      <TransitionSeries.Sequence durationInFrames={STORE_CREATE_DURATION}>
        <StoreCreateScene />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  )
}
