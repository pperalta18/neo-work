/**
 * <AudioTrack> + runtime hooks — the music-sync render layer.
 * ────────────────────────────────────────────────────────────────────────────
 * Workflow (see specs/music-sync.md):
 *   1. Analyse a song once, offline:  `npm run beats public/audio/intro.mp3`
 *      → writes `intro.beats.json` and prints a frame-indexed summary.
 *   2. Read that summary to learn which frame each beat / downbeat / golpe lands
 *      on, and place your motion there.
 *   3. Wrap the scene in `<AudioTrack src map>` — it mounts Remotion's `<Audio>`
 *      (so the song plays in Studio preview and is muxed into the MP4) and shares
 *      the loaded {@link BeatMap} through context.
 *   4. Lock motion to the music with the hooks below.
 *
 * Every hook derives from `useCurrentFrame()` (and the committed beat map / the
 * decoded audio), never wall-clock time and never real-time analysis, so the
 * live preview and a parallel render produce identical frames — the same
 * "state in, frame out" rule the rest of the Remotion catalog follows. The pure
 * math lives in `src/lib/beatmap.ts` and is unit-tested there; the hooks are
 * thin wrappers that feed it the current frame and fps.
 *
 * NOTE: essentia.js (the analyser) lives only in `scripts/analyze-beats.mjs` and
 * never enters this bundle — the render path reads JSON and decoded audio only.
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { Audio, useCurrentFrame, useVideoConfig } from 'remotion'
import { useAudioData, visualizeAudio } from '@remotion/media-utils'
import {
  bandEnergyAt,
  bandEnergyFromSpectrum,
  beatPulseAt,
  eventFramesFor,
  momentPulseAt,
  musicSectionAt,
  nearestBeat,
  nextMoment,
  overallEnergyAt,
  rangedMomentAt,
  snapToBeat,
  type Band,
  type BeatEvent,
  type BeatMap,
  type Moment,
  type MomentType,
  type MusicSection,
  type NearestBeat,
} from '../lib/beatmap'

type AudioTrackContextValue = { map: BeatMap; src: string }

const AudioTrackContext = createContext<AudioTrackContextValue | null>(null)

export type AudioTrackProps = {
  /** Audio source — typically `staticFile('audio/intro.mp3')`. */
  src: string
  /** The committed beat map analysed from `src`. */
  map: BeatMap
  /** Optional playback volume (0..1); forwarded to Remotion's `<Audio>`. */
  volume?: number
  children: ReactNode
}

/**
 * Mounts the song and provides its beat map to the hooks below. Place it high in
 * a composition so every scene underneath can read the map.
 */
export function AudioTrack({ src, map, volume, children }: AudioTrackProps) {
  const value = useMemo<AudioTrackContextValue>(() => ({ map, src }), [map, src])
  return (
    <AudioTrackContext.Provider value={value}>
      <Audio src={src} volume={volume} />
      {children}
    </AudioTrackContext.Provider>
  )
}

function useAudioTrack(): AudioTrackContextValue {
  const ctx = useContext(AudioTrackContext)
  if (!ctx) {
    throw new Error('Music-sync hooks must be used inside an <AudioTrack> provider.')
  }
  return ctx
}

/** The {@link BeatMap} mounted by the nearest `<AudioTrack>`. */
export function useBeatMap(): BeatMap {
  return useAudioTrack().map
}

export type UseBeatPulseOptions = {
  /** Which event drives the pulse. Default `'beat'`. */
  on?: BeatEvent
  /** Frames of linear rise *into* each event (anticipation). Default `0` (instant). */
  attack?: number
  /** Frames the pulse takes to decay back to 0. Default `round(fps * 0.25)` (~250ms). */
  decay?: number
  /**
   * Absolute composition frame to evaluate at, overriding `useCurrentFrame()`.
   * The beat map is indexed in **absolute** frames, but `useCurrentFrame()` is
   * *sequence-local* inside a `<Sequence>` / `<TransitionSeries.Sequence>`, where
   * it restarts at 0. Pass `useCurrentFrame() + sequenceFromFrame` there so the
   * pulse still fires on the song's real beats. Omit it at the composition root.
   */
  frame?: number
}

/**
 * A `0..1` envelope that spikes on each beat / downbeat / onset and decays —
 * drive a scale punch, glow or shake with it. Pure function of the (absolute)
 * frame.
 */
export function useBeatPulse(options: UseBeatPulseOptions = {}): number {
  const { on = 'beat', attack = 0, decay, frame } = options
  const localFrame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const map = useBeatMap()
  const frames = useMemo(() => eventFramesFor(map, on, fps), [map, on, fps])
  const decayFrames = decay ?? Math.max(1, Math.round(fps * 0.25))
  return beatPulseAt(frames, frame ?? localFrame, { attack, decay: decayFrames })
}

/** `{ index, isDownbeat, framesSince, progress }` for the beat in effect now. */
export function useNearestBeat(): NearestBeat {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return nearestBeat(useBeatMap(), frame, fps)
}

/** The current song section + progress, or `null` when section-less. */
export function useMusicSection(): MusicSection | null {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return musicSectionAt(useBeatMap(), frame, fps)
}

/**
 * A `0..1` pulse that spikes on the song's structural **moments** — scaled by
 * each moment's strength, so the primary drop hits hard and a minor lift barely
 * registers. Pass `type` to react to only `'drop'` / `'break'` / `'dropout'` /
 * `'lift'`. Drive a flash, a scale-slam, a freeze. Default decay ~0.4s.
 */
export function useMomentPulse(options: { type?: MomentType; attack?: number; decay?: number } = {}): number {
  const { type, attack = 0, decay } = options
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const map = useBeatMap()
  const decayFrames = decay ?? Math.max(1, Math.round(fps * 0.4))
  return momentPulseAt(map, type, frame, fps, { attack, decay: decayFrames })
}

/** The next structural moment at or after the current frame (e.g. to count down to a drop). */
export function useNextMoment(): Moment | null {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return nextMoment(useBeatMap(), frame, fps)
}

/**
 * The ranged moment (a build/`lift`) active at the current frame plus its `0..1`
 * progress — for the *continuous* anticipatory ramp a lift wants (tighten / zoom
 * / vibrate, resolving on the drop at its end). `null` when no build is running.
 */
export function useRangedMoment(): { moment: Moment; progress: number } | null {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return rangedMomentAt(useBeatMap(), frame, fps)
}

/**
 * Returns a `(frame) => frame` snapper bound to this track's beat grid and fps —
 * use it to land an arbitrary cut/transition on the nearest beat.
 */
export function useSnapToBeat(): (frame: number) => number {
  const { fps } = useVideoConfig()
  const map = useBeatMap()
  return useMemo(() => (frame: number) => snapToBeat(map, frame, fps), [map, fps])
}

/**
 * The committed `0..1` energy of a band at the current frame, read from the beat
 * map's `bands` envelopes (interpolated). This is the *preferred* dynamics hook:
 * it needs no audio decode, is queryable at authoring time, is hand-editable,
 * and is identical across preview and a parallel render. Returns `0` when the
 * map carries no bands — analyse with bands (the default) to populate them.
 */
export function useEnergy(band: Band): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return bandEnergyAt(useBeatMap(), band, frame, fps)
}

/**
 * A composite `0..1` loudness (mean of the three committed bands) at the current
 * frame — a quick "how much is going on" signal. For the authoritative macro
 * level of a part, read the section's `intensity` via {@link useMusicSection}.
 */
export function useOverallEnergy(): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  return overallEnergyAt(useBeatMap(), frame, fps)
}

/**
 * Continuous `0..1` energy of a frequency band, straight from the decoded audio
 * via `@remotion/media-utils` `visualizeAudio` — beat-map-independent, for
 * breathing / VU-style motion when no committed bands exist. Returns `0` until
 * the audio has loaded. Prefer {@link useEnergy} when the map carries bands (the
 * analyser's default): it's deterministic without a decode and authorable.
 * Still frame-derived, so it stays deterministic across preview and render.
 */
export function useBandEnergy(band: Band, numberOfSamples = 256): number {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const { src } = useAudioTrack()
  const audioData = useAudioData(src)
  if (!audioData) return 0
  const spectrum = visualizeAudio({ audioData, frame, fps, numberOfSamples })
  return bandEnergyFromSpectrum(spectrum, band)
}
