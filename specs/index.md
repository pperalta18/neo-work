# Specs Index

Quick reference to all system specs for **aikit-prints** — a poster/slide
composition tool built on a neumorphic grid that represents concepts (e.g.
"intelligence") as pathfinding routes. Search-optimized with keywords.

---

## [Neumorphism Engine](./neumorphism-engine.md)

Themes, light source (tl/tr/bl/br), elevation depths (raised / recessed / pressed
/ flat), computed box-shadows, re-lighting, light & dark mode, surface colours,
secondary brand palette (BRAND: red/orange/yellow/green/teal/purple/violet/pink).

**Source**: `src/lib/neumorphism.ts`

---

## [Grid & Cells](./grid-and-cells.md)

Grid of cells, columns/rows, variable track sizes, rounded frame, hairlines,
cells as containers, elevations, images, text plates, icons, column/row spans,
merged-cell rendering (single cell look + perimeter border).

**Source**: `src/components/Grid.tsx`, `src/components/Cell.tsx`, `src/components/content.tsx`

---

## [Pathfinding Concepts](./pathfinding-concepts.md)

Concept → route, ordered steps, start node, goal node (blue dot), arrows derived
from route geometry, BFS auto-solve, obstacles, step footprints, edge connection
for spanning steps, overlap reflow, variations.

**Source**: `src/lib/pathfinding.ts`, `src/components/PathScene.tsx`, `src/content/concepts.ts`

---

## [Emergence Animation](./emergence-animation.md)

Reveal route step by step, flat → raised, growing toward viewer, sequenced
animation, start/goal fixed, play button, revealedCount.

**Source**: `src/components/PathScene.tsx`, `src/components/Cell.tsx`

---

## [Product Video (Remotion)](./product-video.md)

Remotion compositions, MP4 render, product tour, scene transitions (slide / wipe
/ fade), frame-driven animation, useCurrentFrame, spring, interpolate, studio,
deterministic render, reused widgets.

**Source**: `src/remotion/`, `remotion.config.ts`

---

## [Generated Assets (image-gen)](./generated-assets.md)

Standing convention: when a scene, mockup or layout needs imagery that doesn't
exist (photos, illustrations, figures, product shots, hero banners, category
thumbnails, portraits, textures), generate it with the **image-gen skill**
(`/image-gen`, fal.ai / GPT Image 2) matched to the case's style — e.g. the
Documents scene's archetype imagery, or the product/hero/category shots an online
store needs. Commit PNGs under `public/<scene>/`, load via `staticFile`, prompts
end in "no text" when text is overlaid in code; assets are committed static files
(deterministic renders).

**Source**: `~/.claude/skills/image-gen/`, `public/docs/`, `src/remotion/DocumentsVideo.tsx`

---

## [Music Sync (Beats)](./music-sync.md)

Sync Remotion animations to a song, beat detection, beat map (BPM / beats /
downbeats / onsets / golpes de efecto / sections), offline analysis (essentia.js,
WASM), frame-indexed beat summary, AudioTrack, useBeatPulse, useNearestBeat,
useMusicSection, snapToBeat, beatFrames/accentFrames helpers, visualizeAudio
continuous reactivity, fps-agnostic seconds, deterministic, hand-editable map,
beat-driven scene transitions on downbeats. **Dynamics / energy ear**: low/mid/high
energy bands (biquad DSP), RMS envelopes, crescendos, swells, drops, breakdowns,
energy-cut structural sections with intensity + rising/falling/steady shape,
structure summary block (sparkline + intensity meter), bandEnergyAt /
overallEnergyAt / useEnergy / useOverallEnergy. **Structural moments / motion-design
hit points**: typed drop / lift / break / dropout with 0..1 strength (and lift
range), low-band re-entry drop gate, sustained break vs sub-bar dropout, per-track
contrast/confidence, detectMoments, plus a section-independent **relative
energy-novelty** pass for hits off the section seams and compressed-dynamics
tracks ("cuando pega" — a slam loud only relative to its own song): detectImpacts
(forward rise out of a local trough + low re-entry) / detectTroughs (sustained
fall, the mirror), momentPulseAt / rangedMomentAt / nextMoment /
primaryMoment, useMomentPulse / useRangedMoment / useNextMoment, designed treatments
(build charge ramp, impact flash, freeze on silence). MusicPulse demo (circle/square
that animates to the song's structure and reacts to its moments).

**Source**: `scripts/analyze-beats.mjs`, `src/lib/beatmap.ts`, `src/lib/energyAnalysis.ts`, `src/remotion/AudioTrack.tsx`, `src/remotion/MusicPulseVideo.tsx`

---

## [Print Generator](./print-generator.md)

Print-ready export of the neumorphic material: CMYK PDF/X (true CMYK via ICC,
PDF/X-1a default / X-4 opt-in), plus PNG/JPG. Operator tool — Claude lays out each
print in code (`src/print/pages/`), reusing widgets/fonts/palette; the only human
GUI is an index of prints + a per-print export flow with viewport zoom/fit.
Dimensions (A4/A3/A5/Letter/poster/custom mm), bleed (sangrado), safe margin, crop
marks, 300 DPI. Raster-first via Remotion `renderStill` (box-shadows survive),
then Ghostscript sRGB→CMYK + OutputIntent + Media/Bleed/TrimBox. Documents as
local JSON (`public/prints/<id>/doc.json`), no backend.

**Source**: `src/print/`, `scripts/export-print.mjs`, `public/prints/`, `public/icc/`

---

## [Editor](./editor.md)

In-app editor, build route by clicking cells, edit step content (arrow/text/
image), grid size, span/width, reflow, play preview, export JSON spec, sidebar UX.

**Source**: `src/components/Editor.tsx`

---

## [Storybook Catalog](./storybook-catalog.md)

Storybook (react-vite), theme + light-source toolbar, NeoTheme context, neumorphic
primitives (NeoSurface / NeoButton / NeoCard), composed widgets (alarm, PIN,
expenses chart, stopwatch, call, schedule, browser window), brand palette swatches,
curated Hugeicons set. Landing kit (Promise/Picture/Proof/Push): module gallery tabs,
timeline/stepper, dropzone upload, e-signature, KPI stat, line/area cash-flow chart,
dashboard, multichannel inbox, toast/alert, storefront, POS, loyalty/wallet card,
job post, security/privacy panel, pricing card, comparison table (vs ChatGPT),
testimonial.

**Source**: `.storybook/`, `src/stories/neo/`, `src/components/icons.tsx`

---

## [Device Mockups (3D)](./device-mockups.md)

WebGL 3D device frames, paint React UI / screenshot onto a phone or laptop screen,
iPhone 15 FBX, MacBook Air 13" FBX, react-three-fiber, drei Html transform, PCA
screen-plane fit on tilted laptop lid, studio lighting, glare, contact shadow,
sway, drag-to-rotate, chassis recolour, hero shots / Remotion frames.

**Source**: `src/stories/mockup/Phone3D.tsx`, `src/stories/mockup/Laptop3D.tsx`

---

## [Cursor (Motion)](./motion-cursor.md)

Realistic OS-style pointer for demo videos (non-neumorphic): arrow → pointing hand
on hover, I-beam over text, fist on grab, click ripple, follow-mouse or scripted
(controlled `at` / `state` / `clicking`) drive modes, data-cursor hooks.

**Source**: `src/stories/motion/Cursor.tsx`

---
