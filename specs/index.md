# Specs Index

Quick reference to all system specs for **aikit-prints** — a poster/slide
composition tool built on a neumorphic grid that represents concepts (e.g.
"intelligence") as pathfinding routes. Search-optimized with keywords.

---

## ⭐ [Operations Manual](./operations-manual.md) — empieza aquí

**Documento de estado compartido**: cárgalo al inicio de cada tarea de
animaciones/módulos. Registro maestro de los **16 módulos AiKit** (categoría del
pitch Controla/Delega/Construye → icono SVG → animación Rive `.riv` → instance del
combinado → estado), arquitectura de assets (`modules.ts`, `icons/`, `rive/`,
`RiveModuleIcon` individual+fallback), **checklist para añadir un módulo** (icono +
Rive obligatorios), iconos de paso HugeIcons, estado de los flujos de la landing y
log de pendientes. Pareja de [Flow Blueprints](./flow-blueprints.md).

**Source**: `specs/operations-manual.md`, `src/stories/neo/modules/`

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

## [Flow Blueprints](./flow-blueprints.md)

Unified blueprint for the landing's flow animations. Per example (Contabilidad,
E-Commerce, Punto de venta, Soporte, …): the list of steps, the AiKit module, the
icon (HugeIcons Pro) and whether there's a **detalle** (and which widget). Shared
icon kit, detalle→widget catalogue, mechanics (serpentine route, one arrow
between items, start disc → blue goal). The base for building each flow as a
`concept` + a thin `ConceptFlowVideo` wrapper.

**Source**: `specs/flow-blueprints.md`, `src/content/concepts.ts`, `src/remotion/ConceptFlowVideo.tsx`

---

## [Hero Animation ("El ecosistema vivo")](./hero-animation.md)

Blueprint de la animación del **hero** de la home — la pieza que explica **qué es
AiKit** (no un caso de uso), con **reglas propias** distintas a las 5 de flujo. Un
**render único** (~10s), vívido y denso: los **16 módulos reales** en 3 clusters por
familia, una malla que los conecta y **tráfico de datos** (KIT_BLUE) en paralelo;
cada módulo pulsa y dice su nombre al trabajar. Sin logo/gota/placas/bordes/glows.
Incluye el **pivote** desde la v1 "El motor invisible" (rechazada por simplona) y el
registro del panel de second opinion. Qué evitar (grid/chat/`OperatingModuleTile`).
✅ construido (v2).

**Source**: `specs/hero-animation.md`, `src/remotion/hero/HeroIntroVideo.tsx`, `src/stories/neo/modules/modules.ts`

---

## [Cabeceras extraídas](./cabeceras-extraidas.md)

Registro de las **tarjetas-título estáticas (H1 + subtítulo)** que se sacaron de
los vídeos de flujo (cierres de Accounting, Email, Support, Scheduling) porque se
inyectan de otra forma en la landing. Guarda el texto literal, en qué clip/escena
y en qué vídeo estaba — para no perderlo y poder reponerlo.

**Source**: `specs/cabeceras-extraidas.md`, `src/remotion/*CloseScene.tsx` / `*ResolvedScene.tsx` / `CampaignLiveScene.tsx` / `ScheduleOutputScene.tsx`

---

## [Motion Language (curves, beats, principles)](./motion-language.md)

Motion-for-video vocabulary: the named easing curves (ENTER / EXIT / STANDARD =
Material 3 emphasized set, exact cubic-beziers for `Easing.bezier`), duration
tokens (ms + frames), light-mode + neumorphic + no-bounce house rules. Beat /
rhythm: sound-led cuts, holds, the reusable 5-beat reveal arc (anticipation →
assembly → emerge → wordmark → breathe). What makes a good video animation
(research synthesis: Apple film grammar, Disney 12 principles, ease-out
asymmetry, timing & spacing, light & depth).

**Source**: `src/remotion/MotionShowcaseVideo.tsx`, `src/lib/neumorphism.ts`

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

## [Print Type & Style System](./print-typography.md)

The type voice for **print** pieces (wall graphics, signage, editorial text walls) —
**print only, not the Remotion videos**. Grounds/palette chosen by `doc.theme`
(clean **white** light / deep ink dark); a four-heading modular scale (H1 by wall
proportion, H2/H3/H4 = H1 / ratiⁿ) + comfort-sized body + tracked eyebrow, all sized
by **reading distance** (legibility floor ≈1 cm cap / 3 m, comfort ≈1 in / 10 ft, via
`eventTypeScale`). Hairline Universal Sans Display cut (`PRINT_DISPLAY_HAIR`, its own
single-face family so the matcher can't fall back to 400) + Universal Sans Text;
print-owned `@font-face` (`<PrintFonts/>`) that works in the app preview + export.
Hairline rules, one warm accent, lots of air. Authored on `marco-5-s-1`.

**Source**: `src/print/pages/tipografia.ts`, `src/print/pages/tipografia-kit.tsx`, `src/print/pages/tipografia.tsx`, `src/print/printFonts.tsx`

---

## [Wall Graphics Production (AiKit Live)](./wall-graphics.md)

AiKit Live expo wall graphics (vinyls / light-boxes) for the 21-wall 3D maquette.
6-room emotional funnel (S1 Bici / S2 Intro IA / S3 Velocidad / S4 Ineficiencias /
S5 Cuellos de botella — juice "Naranja Mecánica" / S6 Pobreza histórica + cocktail).
Message-first curation, no blank walls, no spoilers. Two production tracks:
code-rendered honest data-viz (model size, stock exponentials, # labs, context-window
surfaces, code-gen value, the hero "sistema solar de la inversión" = circle area ∝
market cap) from a researched sourced data file, vs image-gen (combustion texture,
Naranja Mecánica storefront light-box, dark factories / autonomous trucks, salones por
siglos). **Wall frames base layer** — every wall face is papered with a blank print
("marco"), cut into separately-printable panels by abutment + nave cámaras, each
associated to its numeric print (host wall `invId`); a piece is designed *on the frame
itself*, for the wall at true size, as exhibition/museography (`wallFrames.ts`, `npm run
frames` → `public/prints/marco-*`). Wall registry on event-layout.json (invId↔wall-N,
sala/tema/rol/estado), museographic format standards (eye band, cap-height per distance),
3D light-box / double-sided / placement persistence, gpt-image-1 img2img + tiling,
pared-{id}_{sala}_{slug}.png, CMYK PDF/X export.

**Source**: `specs/wall-graphics.md`, `src/print/space/`, `src/print/ui/EventSpaceScene.tsx`, `src/print/pages/`, `scripts/export-print.mjs`

---

## [Expo Guión (creative brief / copy source)](./expo-guion.md)

The **original creative brief** for the AiKit Live expo experience, preserved
verbatim (Spanish) as the canonical source for **copy, tone, and the meaning of
each room**. Central message *"la IA nos libera de ser robots"*; the 6-room
emotional funnel (S1 Bici / S2 Intro IA / S3 Velocidad-Showroom / S4 Ineficiencias
/ S5 Cuellos de botella / S6 Pobreza histórica), every interactive (👁️ visual vs
🎮 interactivo) and visual element per room, narrative arc table, tone directives
(never denigrate the visitor), exit gift (zumo de naranja). **Caveat:** room
numbering is conceptual and does **not** map 1:1 to the physical 21-wall layout —
this is the *why/what*, `wall-graphics.md` + the wall registry is the *where*.

**Source**: `~/Downloads/expo_ia_semantic (2).md` (imported 2026-06-04)

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
