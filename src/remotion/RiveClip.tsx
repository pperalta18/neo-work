/**
 * RiveClip — deterministic playback of a pre-rendered Rive module animation.
 * ──────────────────────────────────────────────────────────────────────────
 * Rive's web runtime advances on wall-clock requestAnimationFrame, so it can't
 * render deterministically inside a Remotion render. Instead `scripts/
 * capture-rive.mjs` pre-renders each module's lively timeline to a transparent
 * PNG sequence under public/rive-frames/<module>/ (manifest: ./riveClips.ts).
 * This component just picks the right frame for the current video frame — fully
 * deterministic, flicker-free (Remotion's <Img> blocks the frame until loaded).
 *
 * The clip is one-shot by default and holds its last frame; pass `loop` for a
 * continuous reaction. Playback begins at `startAt` (scene frame); before that
 * the rest frame (0) shows, so the icon can sit calmly until its cue.
 */
import { type CSSProperties } from 'react'
import { Img, staticFile, useCurrentFrame } from 'remotion'
import { RIVE_CLIPS, type RiveClipName } from './riveClips'

export type RiveClipProps = {
  module: RiveClipName
  /** Rendered edge in px (square). */
  size: number
  /** Scene frame at which playback starts; before it the rest frame (0) shows. */
  startAt?: number
  /** Loop the clip instead of holding the last frame. */
  loop?: boolean
  /** Playback rate (1 = clip fps, which equals the composition fps). */
  speed?: number
  style?: CSSProperties
}

const pad4 = (n: number) => String(n).padStart(4, '0')

export function RiveClip({ module, size, startAt = 0, loop = false, speed = 1, style }: RiveClipProps) {
  const meta = RIVE_CLIPS[module]
  const frame = useCurrentFrame()

  let i = Math.floor((frame - startAt) * speed)
  if (i < 0) i = 0
  else if (loop) i = ((i % meta.frames) + meta.frames) % meta.frames
  else if (i >= meta.frames) i = meta.frames - 1

  return (
    <Img
      src={staticFile(`rive-frames/${module}/${pad4(i)}.png`)}
      style={{ width: size, height: size, display: 'block', flexShrink: 0, ...style }}
    />
  )
}
