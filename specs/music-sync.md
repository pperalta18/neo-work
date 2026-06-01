# Music Sync (Beats)

Lets a Remotion composition be choreographed *against* a song: a track is
analysed once into a deterministic **beat map** (BPM, beats, downbeats, accent
hits, energy-cut sections, and per-band energy envelopes) so the author always
knows **which frame each beat, downbeat and "golpe de efecto" lands on** — *and*
**how hard the song is pushing at any moment**: where it swells, drops out, or
gives way from a quiet intro to a wall of bass. Animations can lock to the pulse
*and* read the structure.

The point is authoring legibility: the beat map is a plain, inspectable artifact
the composition author (human or agent) reads to place motion on the right
frames — not a visual editor. The printed summary spells out both the beat grid
and a **structure block** (each section's intensity, contour sparkline and
rising/falling/steady shape) so the next agent can understand a song at a glance.

## Capabilities

- Authors run **`npm run beats <audio>`** to analyse a song once. It writes a
  **beat map JSON** next to the audio (numeric arrays collapsed to one line so
  the file stays readable) and prints a **frame-indexed summary** at a given fps
  — beats / downbeats / golpes, then the energy **structure block**, e.g.:
  ```
  Beat map @ 30fps — 165.8 BPM, 331.32s (9940 frames)
  beats     (916): 10, 21, 32, 42, 54, …
  downbeats (229): 10, 54, 98, 141, …
  golpes    (1595): 7, 10, 16, 26, 32, …
  energy    : low/mid/high envelopes @ 20Hz (6627 samples each)
  structure (10 sections, energy-cut):     ← 4 of 10 shown
    intro     f0–185       ▂▁▂▂▁▁▁▂  █░░░░░░░ 0.17  steady
    quiet     f185–2090    ▃▃▂▂▃▂▃▂  ██░░░░░░ 0.27  steady
    build     f3600–5198   ▂▂▃▃▃▄▃▄  ███░░░░░ 0.40  rising
    …
    outro     f9539–9940   ▄▅▃▃▄▄▂▁  ███░░░░░ 0.40  falling
  moments   (7): structural hits  (▲ drop  △ lift  ▼ break  ○ dropout)
    △ lift     f3600   ███░░░░░ 0.38
    ▼ break    f6061   ██░░░░░░ 0.20
    △ lift     f6061   ███░░░░░ 0.43
    ○ dropout  f6336   ██████░░ 0.80
    △ lift     f6968   ███░░░░░ 0.32
    ▼ break    f8569   █░░░░░░░ 0.14
    ○ dropout  f9467   ████████ 1.00
  ```
- A beat map carries: `bpm`, `beats[]`, `downbeats[]` (bar starts — the big
  accents), `onsets[]` (transient hits — the *golpes de efecto*), `sections[]`
  (structural segments, each with an `intensity` 0..1 + a `rising/falling/steady`
  `shape` when energy-cut), `bands` — the `low`/`mid`/`high` energy envelopes
  sampled at a fixed `hz` — and `moments[]` — the typed structural **hit points**
  (`drop` / `lift` / `break` / `dropout`), each with a `0..1` `strength` (and a
  `lift` also an `end`, since a build is a span you animate *over*).
- The analyser flags **structural moments** the way a motion designer reads a
  track (grounded in MIR + edit-craft research), from **two passes** that feed
  one ranked, de-duplicated list:
  1. **Boundary classification** — each energy-cut section seam is typed by the
     *sign + band* of its change: a **drop** needs the low/sub band to **re-enter
     from near-zero** on a bar (a loud section after a loud section is *not* a
     drop); a **lift** is a ranged rising build; a **break** is a sustained fall;
     a **dropout** is a sub-bar near-silence that *punctuates loud material* (a
     gap inside an already-quiet passage is just texture, not a hit).
  2. **Section-independent relative novelty** — the "cuando pega" ear, for hits
     that *don't* land on a seam and tracks with **compressed dynamics** (the
     energy never nears silence, the bass barely rests) that the absolute floors
     above miss. `detectImpacts` scores each downbeat's forward energy **rise**
     (boosted by climbing out of a local trough — the break-then-bang — and by a
     low-band re-entry) and keeps the local maxima that clear a threshold **set
     relative to the strongest rise in the song**; `detectTroughs` is its mirror,
     a sharp **sustained fall**. So a slam that's only +0.2 in absolute terms but
     the loudest move *in that track* still reads as a drop.
  `strength` is per-track contrast (headline hit ≈ 1.0) and doubles as
  confidence, so a scene softens rather than cuts hard on a maybe. It does **not**
  invent a drop a song doesn't have.
- The analyser **hears dynamics**, not just rhythm: it splits the PCM into three
  energy bands (pure biquad DSP, `src/lib/energyAnalysis.ts`) and **segments the
  song where the energy regime actually changes** (`--sections energy`, the
  default), instead of every N bars (`--sections bars`, the legacy grid). Tunables:
  `--band-hz <n>` (envelope rate, default 20), `--no-bands` (skip energy).
- Authors query the map at **authoring time** with pure helpers — no React
  needed: `beatFrames(map, fps)`, `accentFrames(map, fps)`,
  `nextDownbeat(map, frame, fps)`, `sectionAt(map, frame, fps)`, and the dynamics
  pair `bandEnergyAt(map, band, frame, fps)` / `overallEnergyAt(map, frame, fps)`.
- Authors wrap a scene in **`<AudioTrack src map>`**: it mounts Remotion's
  `<Audio>` (so the song plays in Studio preview and is muxed into the MP4) and
  provides the map through context.
- Inside that context, **runtime hooks** lock motion to the music, all derived
  from `useCurrentFrame()`:
  - `useBeatPulse({ on: 'beat' | 'downbeat' | 'onset', attack, decay })` — a
    `0→1` envelope that spikes on each event and decays (scale punch, glow, shake).
  - `useNearestBeat()` — `{ index, isDownbeat, progress, framesSince }`.
  - `useMusicSection()` — current section (with its `intensity` / `shape`) +
    progress, to drive scene changes and per-section character.
  - `useEnergy(band)` / `useOverallEnergy()` — the committed `0..1` band /
    composite energy at the current frame (breathing, VU motion), read from the
    map's `bands` — deterministic with **no audio decode**, and authorable.
  - `useMomentPulse({ type })` — a **strength-weighted** `0..1` pulse on the
    structural moments (slam/flash on a drop, freeze-flash on a dropout, pull-back
    on a break); `useRangedMoment()` returns the active `lift` + its `0..1`
    progress for a *continuous* tension ramp that resolves on the drop;
    `useNextMoment()` counts down to the next hit. (Pure backings:
    `momentPulseAt` / `rangedMomentAt` / `nextMoment` / `primaryMoment`.)
  - `useSnapToBeat()` — returns a snapper that lands any cut/transition frame on
    the beat grid (the pure `snapToBeat(map, frame, fps)` lives in `beatmap.ts`).
- **Continuous** reactivity prefers the committed `bands` (`useEnergy`); for a
  map without bands, `useBandEnergy()` falls back to `@remotion/media-utils`
  `visualizeAudio()` (decodes the audio at runtime, still frame-derived).
- The demo composition (**MusicPulse**, `src/remotion/MusicPulseVideo.tsx`)
  animates a circle + square off this map alone: punching on downbeats,
  breathing with the bass, shifting size/colour by the section it's in, and
  giving each **moment** its designed treatment — a continuous charge-up ramp
  through a `lift`, a white impact flash on a `drop`/`dropout`, a dim pull-back on
  a `break` — every gesture scaled by the moment's strength. A ribbon marks where
  each typed moment lands. A shape that reads the song's structure, not its pulse.
  It takes `map` + `audioSrc` props (defaulting to this song), auto-scales the
  size arc to the song's *own* intensity range, and derives its length from the
  map via `calculateMetadata` — so the same scene drops onto **any** analysed
  track. (The analysis + the hooks are song- and scene-agnostic; the scene is the
  worked example.)
- A **second** from-scratch demo, **PulseOverdrive**
  (`src/remotion/PulseOverdriveVideo.tsx`, on `pulse-overdrive.mp3`), proves the
  workflow is *scene*-agnostic too: a different visual — a neumorphic "drive
  console" with a radial spectrum corona (bass/mid/treble bars by angle, off
  `useEnergy`), downbeat-emitted shockwave rings, an engine core + overdrive
  redline meter, a tachometer, a `useNextMoment` countdown and a structure
  ribbon — reading the *same kind* of map (its own sections / dynamics / typed
  moments, headline drop at f1475) with the same hooks and the same
  `map` + `audioSrc` props + `calculateMetadata` contract.

## Constraints

- Analysis is **offline only**. essentia.js (WASM) lives in the analysis script
  and never enters the Remotion bundle or the rendered MP4; the render path only
  reads the JSON. This keeps renders deterministic ("state in, frame out").
- Every runtime animation derives from `useCurrentFrame()` — never wall-clock
  time and never real-time audio analysis — so parallel frame rendering matches
  the live preview.
- Beat-map times are stored in **seconds** (fps-agnostic); a frame is
  `round(t * fps)`, so the same song works at 24 / 30 / 60 fps.
- Energy is committed, not re-derived at runtime: `bands` are `0..1` envelopes
  (each peak-normalised) sampled at `bands.hz`; a frame reads them by
  interpolating at `frame / fps · hz`. Section `intensity` is the mean overall
  loudness normalised to the track peak. The DSP (biquad band-split, RMS, energy
  segmentation) is pure and unit-tested with synthetic signals.
- The beat map is committed and **hand-editable** — automatic detection
  (tempo, energy cuts, section labels) is a starting point an author can correct.
- Audio files and their maps live in `public/audio/`.

## Verification

The music-sync contract is guarded by automated acceptance gates (pure verdict
logic in `src/lib`, impure render/probe shells in `scripts/`, both unit-tested):

- `npm run verify:tour-audio` — the rendered MP4 actually carries the muxed song
  (an audio stream of the right length).
- `npm run verify:fps` — every scene cut frame equals `round(downbeatSeconds *
  fps)` and the same downbeats carry the cuts at 24 / 30 / 60 fps.
- `npm run verify:cuts` — the cuts land on the downbeats in the **rendered
  pixels**, not just the layout math: it decodes the MP4 to a grayscale change
  signal and checks the transition energy is concentrated on the predicted
  downbeat frames (deliberate beat-pulse accents on non-cut downbeats are
  distinguished from scene transitions, not flagged).
- `npm run verify:determinism` / `verify:bundle` — byte-identical re-renders, and
  no essentia.js/WASM in the bundle.

Together these cover "the MP4 has audio and the cuts land on downbeats" without a
human in the loop; the remaining subjective "feels synced when watched" is the
only part left to the eye.

## Related specs

- [Product Video (Remotion)](./product-video.md) — the render path and the
  "state in, frame out" rule this system obeys; ProductTour is the demo.
- [Emergence Animation](./emergence-animation.md) — another frame-driven
  composition that can lock its reveal to beats.

## Source

- [src/lib/beatmap.ts](../src/lib/beatmap.ts) — beat-map schema + authoring/runtime helpers (incl. `bandEnergyAt` / `overallEnergyAt` / structure summary)
- [src/lib/energyAnalysis.ts](../src/lib/energyAnalysis.ts) — pure DSP: band filters, RMS envelopes, energy-cut sections (the dynamics ear)
- [src/lib/beatAnalysis.ts](../src/lib/beatAnalysis.ts) — analyser math: assemble/validate/serialize the map
- [scripts/analyze-beats.mjs](../scripts/analyze-beats.mjs) — offline essentia.js + DSP analyser (`npm run beats`)
- [src/remotion/AudioTrack.tsx](../src/remotion/AudioTrack.tsx) — `<AudioTrack>` + runtime hooks (`useBeatPulse` / `useEnergy` / `useMusicSection` …)
- [src/remotion/MusicPulseVideo.tsx](../src/remotion/MusicPulseVideo.tsx) — the demo scene (`npm run render:music`)
- [src/remotion/PulseOverdriveVideo.tsx](../src/remotion/PulseOverdriveVideo.tsx) — a second demo scene on another song (`npm run render:overdrive`)
- [src/lib/verifyCutTiming.ts](../src/lib/verifyCutTiming.ts) — pixel-level cut-on-downbeat gate (`npm run verify:cuts`)
- `public/audio/` — audio files + `*.beats.json` maps
