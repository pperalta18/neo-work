# Grid 3D (SDF) Implementation Plan

## Summary

Render a concept route in real 3D as a **single signed-distance field**: the floor
and every plate are one continuous surface, joined by smooth fillets, raymarched in a
fragment shader. Plates grow *out* of an infinite floor (smooth union = raised, smooth
subtraction = recessed/carved hole, flush = flat); route arrows are extruded chevrons
fused to their plates; step content is rasterised onto each plate's top face. The scene
reuses the existing `PathSpec` unchanged, plays the emergence via `revealedCount`, orbits
slowly, and renders deterministically by frame for Remotion MP4 output.

Key decisions (from drafting): SDF raymarch with `smin`; infinite floor, no frame; matte
monochrome surface lit by a single light matching the theme `lightSource`; AiKit blue only
for the goal; content as projected textures; r3f in-app + Remotion-renderable.

See ([spec: Grid 3D (SDF)](../specs/grid-3d-sdf.md)).

## Phase 1: Scene model (CPU side)

Translate a `PathSpec` into a flat, shader-ready description — no rendering yet.

- [x] Add `src/lib/sdfScene.ts`: a pure function `buildSdfScene(spec, theme, { revealedCount })`
      that runs `reflowRoute`, grows the grid (same rules as `PathScene`), and emits a flat
      list of **SDF primitives** ([spec: Capabilities](../specs/grid-3d-sdf.md#capabilities)).
- [x] For each route step emit a rounded-box plate primitive with: footprint rect (from
      `footprint()`), depth sign (raised `+` / recessed `−` / flat `0`), and a grow factor
      derived from `revealedCount` ([spec: Constraints](../specs/grid-3d-sdf.md#constraints)).
- [x] Emit the **arrow** as a chevron primitive per non-content step, oriented from
      `routeArrows(route, goalNode)` (reuse, don't recompute direction).
- [x] Emit **start** (plain disc) and **goal** (blue-accent disc) primitives just outside
      the grid, mirroring `PathScene`'s `startNode` / top-right `goalNode` placement.
- [x] Map grid coords → world XZ (cell size = world unit), Y = up; centre the scene at origin.
- [x] Unit-test `buildSdfScene` for footprint/grow/arrow-direction correctness (no GL).

## Phase 2: SDF shader (GPU side)

The raymarcher that turns the scene description into the continuous neumorphic surface.

- [x] Add `src/shaders/grid3d.frag` (+ vertex passthrough): raymarch a fullscreen quad,
      `map()` = `smin`-union of the infinite floor plane with all raised plates, then
      `smax`/smooth-subtract the recessed ones ([spec: Capabilities](../specs/grid-3d-sdf.md#capabilities)).
- [x] Implement primitives: rounded box, chevron prism, disc; pass the scene in via uniforms
      (packed array or data texture, capped count) — keep it **deterministic** (no time-based
      randomness) ([spec: Constraints](../specs/grid-3d-sdf.md#constraints)).
- [x] Lighting: single soft directional light whose XZ direction maps from the theme
      `lightSource` (`tl/tr/bl/br`); matte monochrome = floor colour; soft AO/contact shade
      in the fillet valleys ([spec: Neumorphism Engine](../specs/neumorphism-engine.md)).
- [x] Goal accent: blue emissive disc + soft glow; everything else stays monochrome
      ([spec: Constraints](../specs/grid-3d-sdf.md#constraints)).
- [x] Expose `kSmin` (blend radius) as a uniform — the main look dial.

## Phase 3: Top-face content + React component

Wire the shader into r3f and project step content onto plate tops.

- [x] Rasterise each step's content (label / icon / AiKit module) to a `CanvasTexture`,
      reusing `content.tsx` / `icons.tsx` / `MODULES` visuals; build a small atlas keyed by step.
- [x] In the shader, when a ray hits a plate's top face, sample that step's content texture
      in the plate's local UV ([spec: Capabilities](../specs/grid-3d-sdf.md#capabilities)).
- [x] Add `src/components/Grid3D.tsx`: an r3f `<Canvas>` hosting the raymarch material, props
      `{ spec, theme, revealedCount?, cell?, autoOrbit?, staticPose? }` mirroring `PathScene`.
- [x] Slow orbit camera by default (`useFrame`), static pose option for hero shots
      ([spec: Capabilities](../specs/grid-3d-sdf.md#capabilities)).
- [x] Add a Storybook story exercising a sample concept route, theme toggle, light-source
      toolbar, and a `revealedCount` slider.

## Phase 4: Emergence + Remotion render

Make it animate and render to video deterministically.

- [x] Drive emergence: per-step grow factor ramps with `revealedCount` so steps rise from the
      floor in route order ([spec: Emergence Animation](../specs/emergence-animation.md)).
- [x] Add a Remotion composition that feeds `useCurrentFrame()` → `revealedCount` + camera
      angle, rendering `Grid3D` frame-deterministically ([spec: Product Video](../specs/product-video.md)).
- [x] Verify a rendered frame is identical across runs (no `Date.now()`/random in shader path).

## Verification

- [x] `buildSdfScene` unit tests pass (footprints, grow, arrow direction, start/goal placement).
- [ ] Plates visibly **morph into** the floor with no seam; adjacent cells stay legible (tune `kSmin`).
- [ ] raised / recessed / flat read correctly; recessed is a carved hole, not a floating plate.
- [x] Single light source re-orients with `lightSource` (`tl/tr/bl/br`); only the goal is blue.
- [x] Emergence rises step-by-step in route order, matching the 2D `revealedCount` behaviour.
- [x] Same Remotion frame renders pixel-identical across runs (determinism).
- [ ] Interactive performance is acceptable on the default grid size (raymarch step/iteration budget).
