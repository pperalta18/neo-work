# Product Video (Remotion)

**Keywords**: Remotion, MP4 render, product tour, scene transitions, slide, wipe,
fade, frame-driven animation, useCurrentFrame, spring, interpolate, Remotion
studio, deterministic render, composition, sequence, reused React widgets,
beat-driven timing, beat map, downbeat scene cuts, AudioTrack, music sync.

## Purpose

Render the AiKit poster/keynote widgets as polished MP4 videos using Remotion. The
first composition is a **product tour** that showcases the neumorphic grid and
widgets with smooth scene transitions, driven entirely by `useCurrentFrame()` so
every render is deterministic.

## Architecture

```
src/remotion/
  index.ts              Remotion entry — registers all compositions
  Root.tsx              <Composition> registrations (id, fps, dimensions, duration)
  ProductTourVideo.tsx  The product-tour composition (beat-driven)
  AudioTrack.tsx        <Audio> mount + BeatMap context + music-sync hooks
src/lib/
  beatScenes.ts         planBeatScenes — pure scene layout (frames) from a beat map
```

## Compositions

### ProductTour

- **Dimensions**: 1920×1080, 30fps.
- **Scenes**: a hardcoded `SCENES` array — each entry is a neumorphic widget plus
      a caption/detail. Authors add a scene by appending to `SCENES`; the timing
      recomputes from the beat map (there is *no* hardcoded `SCENE_FRAMES`).
- **Beat-driven layout**: `planBeatScenes(map, fps, { sceneCount: SCENES.length })`
      distributes the scenes across the song — it picks `sceneCount − 1` cut
      frames, each near an even fraction of the track **and landing on a
      downbeat**, then returns each scene's absolute `fromFrame` /
      `durationInFrames`. (It falls back to beats, then an even split, only when
      the map is too sparse to carry the cuts.)
- **Transitions**: `@remotion/transitions` (slide / wipe / fade, cycled per cut),
      each `layout.transitionFrames` long (≈ one beat), sequenced with
      `<TransitionSeries>`. Every scene cut is **centred on its downbeat** (half
      the transition extends into each adjacent scene) — replacing the old fixed
      `TRANSITION_FRAMES` grid.
- **Duration**: `PRODUCT_TOUR_DURATION` frames =
      `secondsToFrame(TOUR_BEAT_MAP.duration, fps)` — i.e. the song's length, not
      a hardcoded constant. It equals `planBeatScenes(...).totalFrames`, and the
      sequence + transition durations sum to exactly that (240 frames @30fps for
      the committed 8s / 120 BPM test track).
- **Audio**: wrapped in `<AudioTrack src={staticFile('audio/test-beat.wav')} map>`,
      so the track plays in Studio preview and is muxed into the rendered MP4.
- **Background**: a single neumorphic light theme (`NeoThemeProvider`).
- **Captions**: each caption springs in, then **punches on every downbeat** via
      `useBeatPulse({ on: 'downbeat' })`. Because `useCurrentFrame()` is
      sequence-local, the caption feeds the hook the *absolute* frame
      (sequence-local frame + the scene's `fromFrame`) so the punch lands on the
      song's real downbeats.

## Beat-driven scene timing

Scene lengths and cut positions are no longer hardcoded. They are computed offline
from a committed, hand-editable **beat map** (BPM / beats / downbeats / sections,
all times in seconds) and turned into frame timings by the pure planner in
`src/lib/beatScenes.ts`:

- `planBeatScenes(map, fps, { sceneCount })` → a `BeatSceneLayout`: one slot per
      scene with its absolute `fromFrame` and `durationInFrames`, the per-cut
      `transitions` (each centred on a downbeat), and `totalFrames` =
      `secondsToFrame(map.duration, fps)`. The sequence and transition durations
      sum to exactly `totalFrames`, so the tour spans the whole song.
- `PRODUCT_TOUR_DURATION` (in `ProductTourVideo.tsx`) is computed as
      `secondsToFrame(TOUR_BEAT_MAP.duration, fps)` — the same `totalFrames`, so
      the registered composition length stays locked to the track.

Because everything is keyed off the map (in **seconds**) and converted with
`secondsToFrame(t, fps) = round(t · fps)`, the same map renders correctly at any
fps (24 / 30 / 60) with cuts always landing on the same downbeats. See
`specs/music-sync.md` for the beat-map contract and the analyse → read summary →
place motion workflow.

## How it renders deterministically

`useCurrentFrame()` drives every animation; no `Date.now()` / `Math.random()`. The
scene planner (`planBeatScenes`) is pure (state in, frames out), so the same map +
fps always yields the same layout. The same frame always produces the same pixels,
so renders are reproducible and can be distributed across machines.

## Adding a new composition

1. Build the visual with neumorphic widgets (reuse `src/components`).
2. Register a `<Composition>` in `Root.tsx` with id, fps, dimensions, duration.
3. To sync to music, wrap it in `<AudioTrack>` and place motion with the beat
   hooks (see `specs/music-sync.md`).
4. Render via `npx remotion render … out/<name>.mp4`.

## Related

See `specs/music-sync.md` for syncing animation to a song (beat-driven transitions).
