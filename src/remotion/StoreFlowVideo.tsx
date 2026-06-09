/**
 * StoreFlowVideo — "crear una tienda online", read as a 2D pathfinding flow.
 * ──────────────────────────────────────────────────────────────────────────
 * A thin wrapper over the generic {@link ConceptFlowVideo} engine, bound to the
 * `tienda-online` concept. The camera glides plate-to-plate while each step's
 * AiKit module emerges (flat → raised), ending on a pull-back over the whole
 * route + the blue goal (the live store). See ConceptFlowVideo for the mechanics.
 */

import { ConceptFlowVideo, flowDuration } from './ConceptFlowVideo'

const CONCEPT_ID = 'tienda-online'

/** Total composition length in frames. */
export const STORE_FLOW_DURATION = flowDuration(CONCEPT_ID)

export function StoreFlowVideo() {
  return <ConceptFlowVideo conceptId={CONCEPT_ID} />
}
