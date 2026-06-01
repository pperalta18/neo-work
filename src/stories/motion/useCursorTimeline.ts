import { useEffect, useRef, useState } from 'react'
import {
  sampleCursorTimeline,
  timelineDuration,
  type CursorKeyframe,
  type CursorSample,
} from './cursorTimeline'

export type UseCursorTimelineOpts = {
  /** Loop back to the start when the timeline ends. */
  loop?: boolean
  /** Extra ms held at the end before looping. */
  tail?: number
  /** Pause playback. */
  paused?: boolean
}

/**
 * useCursorTimeline — plays a cursor timeline with a rAF clock.
 * ─────────────────────────────────────────────────────────────
 * Live preview of a scripted move in the browser. The sampling is pure
 * (`sampleCursorTimeline`), so to render the SAME move in Remotion you swap this
 * hook for `sampleCursorTimeline(kfs, (useCurrentFrame() / fps) * 1000)`.
 */
export function useCursorTimeline(
  keyframes: CursorKeyframe[],
  { loop = true, tail = 600, paused = false }: UseCursorTimelineOpts = {},
): CursorSample {
  const [sample, setSample] = useState<CursorSample>(() => sampleCursorTimeline(keyframes, 0))
  const start = useRef<number | null>(null)

  useEffect(() => {
    if (paused) return
    const total = timelineDuration(keyframes) + tail
    let raf = 0
    start.current = null

    const tick = (now: number) => {
      if (start.current === null) start.current = now
      let elapsed = now - start.current
      if (loop && total > 0) elapsed %= total
      setSample(sampleCursorTimeline(keyframes, elapsed))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [keyframes, loop, tail, paused])

  return sample
}
