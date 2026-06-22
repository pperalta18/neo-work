/**
 * StoreFlowVideo — "crear una tienda online", read as a 2D pathfinding flow.
 * ──────────────────────────────────────────────────────────────────────────
 * Narrates a flow over the flat neumorphic grid ([Grid & Cells](../../specs/
 * grid-and-cells.md) + [Emergence](../../specs/emergence-animation.md)) with NO
 * captions — just the animation. A virtual "camera" (a CSS pan + zoom transform
 * on the grid) sits tight on one pastilla, glides to where the next step appears,
 * and that plate **emerges** (flat → raised: shadow grows, scales up, fades in)
 * as the lens arrives. Step by step the AI builds the store, ending on a slow
 * pull-back over the whole route + the blue goal (the live store).
 *
 * Smooth by construction: a single quintic `smoother` curve eases the camera pan
 * and every emergence, with the connecting arrow and the next plate rising in an
 * overlapping window so steps flow into one another instead of snapping.
 *
 * The flow math, geometry and plate/grid renderers live in {@link storeFlowScene}
 * so the unroll epilogue ({@link StoreUnfoldVideo}) can replay the EXACT same flow.
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { FlowGrid, flowCameraPZ, theme, useIconPreload, STORE_FLOW_DURATION } from './storeFlowScene'
import { Fonts } from './fonts'

export { STORE_FLOW_DURATION }

export function StoreFlowVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  useIconPreload()

  // Camera: place focus point P at the viewport centre, scaled by Z. On the outro
  // it eases to the whole-scene framing (the full route + goal).
  const { P, Z } = flowCameraPZ(frame, W, H)
  const tx = W / 2 - P[0] * Z
  const ty = H / 2 - P[1] * Z

  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${tx}px, ${ty}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <FlowGrid frame={frame} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
