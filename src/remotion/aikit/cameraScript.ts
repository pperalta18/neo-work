/**
 * cameraScript.ts — pure frame-driven logic for the cinematic virtual camera.
 * ───────────────────────────────────────────────────────────────────────────
 * The multi-step pan/zoom rig of ObjectiveVideo, extracted as pure functions
 * of (rig, frame) so every piece moves the camera the same way (spec house
 * rule: "movimientos multi-paso que siguen la acción, nunca plano estático").
 *
 * Model: an unbounded content layer shot through a virtual camera. A framing
 * is a focus point in content space (`fx`, `fy`) plus a `zoom`; the layer is
 * transformed so that point sits at the screen centre. Same waypoint contract
 * as cursorScript: `at` is the ARRIVAL frame, the approach takes `travel`
 * frames ending at `at`, and between arrivals the camera rests (plus the
 * breathing drift so held frames stay alive).
 */

export type CameraFraming = {
  /** Frame the camera arrives on this framing (at rest). */
  at: number
  zoom: number
  /** Content-space focus point — lands at the screen centre. */
  fx: number
  fy: number
  /** Frames the move takes (ends at `at`). Default DEFAULT_CAM_TRAVEL. */
  travel?: number
}

/** Default move duration — an unhurried reframe (just over DUR.grand). */
export const DEFAULT_CAM_TRAVEL = 26

export type CameraPose = {
  zoom: number
  fx: number
  fy: number
  /** 0 at rest, peaking at 1 mid-move — damps the drift during big moves. */
  moving: number
}

/** The approach window toward framing `k` (clamped to the previous arrival). */
export function camTravelWindow(
  rig: readonly CameraFraming[],
  k: number,
): { start: number; end: number } {
  const f = rig[k]
  if (k <= 0) return { start: f.at, end: f.at }
  const start = Math.max(rig[k - 1].at, f.at - (f.travel ?? DEFAULT_CAM_TRAVEL))
  return { start, end: f.at }
}

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The camera's pose at `frame`. Pure — the single source of truth shared by
 * the piece visual and anything choreographing against the framing. `ease`
 * shapes the move (the visual passes CURVE.standard; the linear default keeps
 * the module dependency-free and the tests honest).
 */
export function cameraPose(
  rig: readonly CameraFraming[],
  frame: number,
  ease: (t: number) => number = (t) => t,
): CameraPose {
  if (rig.length === 0) return { zoom: 1, fx: 0, fy: 0, moving: 0 }

  let k = 0
  for (let j = 1; j < rig.length; j++) {
    if (frame >= camTravelWindow(rig, j).start) k = j
  }
  const to = rig[k]
  if (k === 0) return { zoom: to.zoom, fx: to.fx, fy: to.fy, moving: 0 }

  const { start, end } = camTravelWindow(rig, k)
  const t = end <= start ? 1 : clamp01((frame - start) / (end - start))
  if (t >= 1) return { zoom: to.zoom, fx: to.fx, fy: to.fy, moving: 0 }

  const from = rig[k - 1]
  const e = ease(t)
  return {
    zoom: lerp(from.zoom, to.zoom, e),
    fx: lerp(from.fx, to.fx, e),
    fy: lerp(from.fy, to.fy, e),
    moving: 4 * t * (1 - t),
  }
}

/**
 * The continuous breathing drift (ObjectiveVideo's held-frame life), damped
 * while the camera is mid-move. Deterministic — pure sin of the frame.
 */
export function driftedPose(
  pose: CameraPose,
  frame: number,
  amp = 1,
): { zoom: number; fx: number; fy: number } {
  const a = amp * (0.5 + 0.5 * (1 - pose.moving))
  return {
    zoom: pose.zoom + Math.sin(frame / 72) * 0.004,
    fx: pose.fx + Math.sin(frame / 46) * 6 * a,
    fy: pose.fy + Math.sin(frame / 60) * 3.2 * a,
  }
}

/**
 * The CSS transform that centres (fx, fy) on a `stageW`×`stageH` screen at
 * `zoom`. Apply to the content layer with `transformOrigin: '50% 50%'`.
 */
export function cameraTransform(
  p: { zoom: number; fx: number; fy: number },
  stageW = 1920,
  stageH = 1080,
): string {
  return `translate(${p.zoom * (stageW / 2 - p.fx)}px, ${p.zoom * (stageH / 2 - p.fy)}px) scale(${p.zoom})`
}

/**
 * Sanity-check an authored rig. Returns human-readable problems (empty =
 * valid): arrivals must be ordered, moves must fit the gap they're given,
 * zooms must be positive.
 */
export function validateCameraRig(rig: readonly CameraFraming[]): string[] {
  const errors: string[] = []
  rig.forEach((f, i) => {
    if (f.zoom <= 0) errors.push(`framing ${i}: zoom must be positive (got ${f.zoom})`)
    const travel = f.travel ?? DEFAULT_CAM_TRAVEL
    if (travel <= 0) errors.push(`framing ${i}: travel must be positive (got ${f.travel})`)
    if (i === 0) return
    const prev = rig[i - 1]
    if (f.at <= prev.at) {
      errors.push(`framing ${i}: at ${f.at} must arrive after framing ${i - 1} (${prev.at})`)
      return
    }
    if (f.at - travel < prev.at) {
      errors.push(
        `framing ${i}: travel ${travel} would depart at ${f.at - travel}, before framing ${i - 1} arrives (${prev.at})`,
      )
    }
  })
  return errors
}
