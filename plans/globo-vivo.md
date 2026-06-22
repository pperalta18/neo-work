# Globo Vivo (GloboVivo) Implementation Plan

## Summary

Build the **GloboVivo** Remotion hero scene ([spec](../specs/globo-vivo.md)): a
photorealistic Earth (NASA Blue Marble) floating in a clean **light neumorphic
studio**, progressively **enveloped and replaced** by a living "tejido vivo"
process-grid that grows geodesically from a **seed point**, ending as a vast white
neumorphic **grid-orb** with countless tiny processes running incessantly in a
**seamless loop**. ~30s (~900 frames), 1920×1080, 30fps, **deterministic** from
`useCurrentFrame()` only.

**Key decisions** ([spec: Restricciones](../specs/globo-vivo.md#restricciones)):
real 3D sphere via three.js + r3f + drei under **@remotion/three** (in deps but
**unused so far** — de-risk first); the living grid is a **Canvas2D equirectangular
atlas → CanvasTexture** blended over the Earth maps by a geodesic growth mask
(DOM→texture rejected); neumorphic FlowPlate look via **pre-rasterized sprites**
stamped per frame; **hybrid** process library (curated hero + seeded combinatorial).

**Sequencing principle**: the three riskiest unknowns — (1) @remotion/three
deterministic sphere, (2) per-frame `CanvasTexture` perf over 900 frames, (3)
equirectangular mapping + geodesic mask — are proven with **proof-of-render
checkpoints in Phases 1–2** before the full library, AAA FX, and final choreography.

---

## Phase 1: De-risk @remotion/three — minimal deterministic sphere

Prove the unproven integration before anything else.
([spec: Restricciones](../specs/globo-vivo.md#restricciones))

- [x] Confirm `@remotion/three` (4.0.469) + `three` (0.171) + r3f (8.18) + drei
      (9.122) resolve; skim existing three.js usage in
      `src/stories/mockup/Phone3D.tsx`, `Laptop3D.tsx`,
      `src/print/ui/EventSpaceScene.tsx` for the r3f Canvas pattern.
      → all 4 installed & resolve; r3f `Canvas` pattern from `Phone3D.tsx`.
      `@remotion/three` exports `ThreeCanvas` (Canvas + `width`/`height`).
- [x] Create `src/remotion/GloboVivoVideo.tsx` with `<ThreeCanvas>` from
      `@remotion/three` rendering a single lit `<sphereGeometry>` + `meshStandardMaterial`.
- [x] Drive sphere rotation **purely from `useCurrentFrame()`** (no `useFrame`
      clock, no `Date.now`/`Math.random`). → pure `sphereYawAt(frame)` in the new
      `globoVivoScript.ts`; host passes yaw down as a prop.
- [x] Register composition **`GloboVivo`** in `src/remotion/Root.tsx` (1920×1080,
      30fps, temporary short duration e.g. 90 frames). → `GLOBO_VIVO_DURATION=90`.
- [x] **Checkpoint A**: render a few stills via `renderStill` AND scrub in Studio;
      confirm the sphere appears, rotates by frame, and two renders of the same
      frame are pixel-identical. Resolve any WebGL/headless quirks now.
      → **WebGL quirk resolved**: headless Chromium can't make a HW WebGL context;
      set `Config.setChromiumOpenGlRenderer('swangle')` in `remotion.config.ts`.
      Two stills of frame 45 are **byte-identical** (same SHA-256); frame 0 differs
      (rotates by frame); lit blue sphere reads on the `#f4f4fa` studio ground.

## Phase 2: Earth maps + equirectangular tissue atlas + geodesic blend

The core visual mechanic and its perf, proven on a still texture first.
([spec: Estructura](../specs/globo-vivo.md#estructura),
[Capacidades de usuario](../specs/globo-vivo.md#capacidades-de-usuario))

- [x] Vendor **NASA Blue Marble** equirectangular maps (color + clouds + night
      lights + specular) into `public/globoVivo/`; load via `staticFile`. Preload
      with `delayRender()`/`continueRender()` so they're ready before frame 0.
      → 5 public-domain maps vendored from the three.js NASA-derived planet set
      (`earth-color.jpg` 4096², `earth-specular.jpg`, `earth-clouds.png` alpha,
      `earth-night.png`, `earth-normal.jpg`, all 2:1 POT). `EARTH_TEXTURES` map of
      `public/`-relative paths in `globoVivoScript.ts`; host loads all behind one
      `delayRender('Preload Earth maps')` handle (GridStack3DVideo preload pattern),
      releasing on load OR error (never strands the render).
- [x] Apply the Earth color map as the sphere `.map`; add specular/roughness for
      oceans and a separate cloud layer (slightly larger sphere or second material).
      → PBR `meshStandardMaterial`: color `.map` (sRGB) + `normalMap` relief +
      `roughnessMap` **baked from the ocean specular map** by pure pixel math
      (`oceanRoughnessFromSpecular`: oceans glossy 0.3 / land matte 0.95) → glossy
      sun-glint oceans, matte land. Separate cloud shell at `CLOUD_RADIUS_SCALE`
      (1.012×) drifts faster (`cloudYawAt`, 0.82× period) for parallax; `EARTH_TILT_RAD`
      ≈ 23.44° axis. **Render-proven**: frame-8 still reads photoreal Earth + clouds
      on the `#f4f4fa` studio ground; two frame-40 stills are **byte-identical**
      (same SHA-256) → determinism holds across the new texture/bake path.
      Night-lights map vendored but its terminator-aware emissive is deferred to
      Phase 4 (uniform emissive would glow over the day side).
- [x] Create `src/remotion/tissueAtlas.ts`: a **Canvas2D equirectangular** renderer
      (~4096×2048) that draws the neumorphic grid; **pre-rasterize** plate/step
      sprites once (bake `shadowBlur`), then `drawImage`-stamp. Expose
      `renderAtlas(frame)` returning an HTMLCanvas for use as `CanvasTexture`.
      → `ATLAS_W/H = 4096×2048` (2:1 POT). **Perf core**: `GROW_LEVELS=16` plate
      sprites pre-rasterized once via `bakePlateSprite` (raised double-shadow,
      `shadowBlur` baked), memoized by canvas factory; per frame `renderAtlas`
      only `drawImage`-stamps them. **Cosine-banded layout** (`BAND_DEG=7.5` →
      24 rows × cos-weighted cols, `MIN_COLS=6`) so plates stay ~equal-area on the
      sphere — `CELL_COUNT≈738` tiny plates. Equirectangular `lonLatToUV`/`Px`
      match the NASA-map convention so the host blend (`tissueMaskAt`) lines up.
      Frame-driven `plateGrowAt` (per-cell breathing) + travelling `KIT_BLUE`
      `pulseIntensityAt`; all pure + deterministic (seeded `hash01`, no
      `Date.now`/`Math.random`). Canvas work goes through an **injectable
      `CanvasFactory`** (default DOM, only touched when *called* → node-importable).
      **34 unit tests green** (`tissueAtlas.test.ts`): projection round-trip,
      banded layout symmetry, sprite baking, and the stamping pipeline verified
      against a recording fake ctx (determinism call-for-call + frame-dependence).
      The real canvas render-proof lands at the next checkbox (mount into the host)
      + Checkpoint B.
- [x] Implement the **geodesic growth mask**: a pure function `coverageAt(frame)`
      + per-texel mask seeded at a focal lat/lon that spreads to full coverage;
      blend Earth↔grid by the mask (and drain Earth saturation / dissolve clouds
      where covered).
      → pure mask fns in `globoVivoScript.ts`: `SEED_LAT/LON_DEG`, colonize beat
      window, `coverageAt` (smoothstep area-fraction, monotonic 0→1),
      `frontRadiusAt` (= `acos(1−2·coverage)` so cap AREA == coverage exactly),
      `geodesicDistance` (great-circle), `tissueMaskAt(lat,lon,frame)` (0=Earth,
      1=grid, soft `MASK_EDGE` front, geodesically ordered, monotonic-in-frame).
      36 unit tests green (`globoVivoScript.test.ts`). The host *consumes* this
      mask to blend the material at the **"mount the atlas blended with Earth"**
      checkbox below (needs the Earth maps + atlas first).
- [x] Wire `canvasTexture.needsUpdate = true` per frame; mount the atlas as the
      sphere map blended with Earth.
      → Host mounts `renderAtlas`'s reused 4096×2048 canvas as ONE `CanvasTexture`
      (sRGB), repaints it per frame and flips `.needsUpdate=true`. The atlas is
      blended over the Earth **inside the `meshStandardMaterial` fragment shader**
      via `onBeforeCompile`: a GLSL twin of the new pure `tissueMaskAtUV`
      (computed per-fragment from `vMapUv` → lon/lat, same NASA-map convention)
      mixes the grid into `diffuseColor` where colonized, pulls `roughnessFactor`
      matte (0.9) + `metalnessFactor` flat there, and clouds dissolve globally by
      `1−coverage`. Frame uniforms come from the pure `maskUniformsAt(frame)`
      (mutated on stable `{value}` objects; `customProgramCacheKey` pins the
      variant). **Render-proven** (`swangle`): frame 5 = photoreal Earth, frame 45
      = geodesic colonization front (grid replacing Earth from the seed), frame 80
      = vast white neumorphic grid-orb + `KIT_BLUE` pulse, clouds gone; two
      frame-45 stills are **byte-identical** (same SHA-256). 18 new unit tests
      green (`tissueMaskAtUV` ≡ `tissueMaskAt`, `maskUniformsAt`, GLSL-formula
      re-run reproduces the twin).
- [x] **Checkpoint B (perf)**: render the full ~900-frame range at target res.
      Measure per-frame time. If too slow, lower atlas res / sprite count and
      **`log()` the cap taken**; keep a leaner sprite-stamping fallback.
      ([spec: Restricciones — rendimiento](../specs/globo-vivo.md#restricciones))
      → **Verdict: full tier retained, no cap.** Worst-case render (every frame
      stamps all `CELL_COUNT`≈738 plates + re-uploads the whole 4096×2048 atlas)
      of the temp 90-frame comp at 1920×1080, **8× concurrency, swangle software
      WebGL** measured **≈0.28 s/frame** (upper bound — wall-clock incl. one-time
      bundle/encode), so the full ~900-frame scene is **≈4 min** of deterministic
      offline render. Comfortable headroom → the full atlas stays live and
      determinism re-confirmed post-edit (frame-45 stills byte-identical, SHA
      `ce05a53…`). The leaner fallback the plan asks to keep is **implemented +
      tested but not engaged**: `tissueAtlas.ts` now has **resolution quality
      tiers** — `ATLAS_QUALITY_FULL` (4096×2048) / `ATLAS_QUALITY_LEAN` (2048×1024 =
      ¼ the `atlasPixelLoad`), selected by `ACTIVE_ATLAS_QUALITY` (= FULL).
      `renderAtlas(frame, {quality})` keeps the cells/sprites/projection in
      canonical 4096×2048 space and scales every draw by `width/ATLAS_W`, so a tier
      swap is **look-preserving + deterministic**; a slower host engages LEAN by
      flipping the one `ACTIVE_ATLAS_QUALITY` constant (the host's `useAtlasTexture`
      → `renderAtlas` picks it up, no other change). 9 new `tissueAtlas.test.ts`
      cases cover tier shape, the ¼ pixel-load, look-preserving stamp parity, exact
      0.5× coord scaling, lean determinism, default==active, and canvas realloc.

## Phase 3: Hybrid process library + surface flow schedule

Make the grid vast and alive with "muchísimos procesos".
([spec: Capacidades de usuario](../specs/globo-vivo.md#capacidades-de-usuario))

- [x] Create `src/remotion/processLibrary.ts`: curated legible **hero** AiKit
      business processes + a **seeded combinatorial generator** (modules × action
      verbs × business domains) yielding hundreds of unique deterministic flows
      (`mulberry32`-style PRNG seeded once).
      → Pure, node-testable module (only **type-only** `ModuleName`/`IconName`
      imports — no `.svg`/`.riv` runtime pull, same elision pattern as
      `tejidoVivoScript`). A `Stage` grammar with an explicit `kind` discriminant
      (`moduleStage` = 1-cell tool / `actionStage` = 2-cell verb). **18 curated
      hero** flows (legible AiKit business processes: Pedido→entrega, Soporte→cierre,
      Lead→venta, Conciliación bancaria, Ticket→SLA, …). **Seeded combinatorial
      generator** (`generateProcesses`, one `mulberry32` stream from `LIBRARY_SEED`):
      crosses `MODULE_POOL` (16) × `ACTION_VERBS` (32) × `DOMAINS` (12) →
      `GENERATED_COUNT=300` unique flows, each **domain-anchored** (opens on the
      domain's lead module), **closing on an action**, alternating tool/verb so it
      reads as a real process; deduped by `processSignature` (flows AND names
      unique). `PROCESS_LIBRARY` = hero ++ generated (**318** flows, `id`==index),
      `processById`/`processCellSpan`/`heroProcesses`/`generatedProcesses` exposed.
      `globoVivoScript.ts` (next box) samples this; `tissueAtlas.ts` renders it.
      **27 unit tests green** (`processLibrary.test.ts`): PRNG determinism+range,
      generator determinism + seed-sensitivity + count + uniqueness + length
      bounds + lead/closing-action shape + pool membership, hero validity,
      library assembly/ids, geometry helpers, and a comment-stripped
      no-`Math.random`/`Date.now` source guard. `tsc` clean (only the pre-existing
      unrelated `MotionShowcaseVideo` error remains).
- [x] Create `src/remotion/globoVivoScript.ts` (pure, no React/three): a
      **flow schedule** over the equirectangular surface — adapt
      `generateMaster()`/`solvePlacement()`/`revealAt()`/`stepDecayAt()` concepts
      from `tejidoVivoScript.ts` + `storeFlowScene.tsx` to lat/lon cells; flows
      emerge head-first, run, dissipate; a persistent subset calcifies.
      → **Single source of truth for the surface grid established.** The logical
      cosine-banded grid (`BAND_DEG`/`ROWS`/`COLS_EQ`/`MIN_COLS`/`rowCenterLat`/
      `colsInRow`/`hash01`/`lonLatToUV`/`uvToLonLat`/`SurfaceCell`/`SURFACE_CELLS`
      + `ROW_COLS`/`ROW_START`/`cellIndex`) **moved into `globoVivoScript.ts`** (the
      choreography module per spec); `tissueAtlas.ts` now **imports + re-exports**
      it and only adds the pixel projection (`AtlasCell = SurfaceCell & {x/y/w/hPx}`,
      `buildGridCells` maps `SURFACE_CELLS`) — keeping the one-directional dep
      `tissueAtlas → globoVivoScript` (no cycle) and `GRID_CELLS` **byte-identical**
      (proven: all prior atlas tests green + a new cross-check that `GRID_CELLS[i]`
      shares `SURFACE_CELLS[i]`'s logical fields). **Flow schedule** is a
      tejido-style forward simulation (`generateMaster(duration)`, one
      `mulberry32(SCHEDULE_SEED)` stream): each tick expires finished ephemerals
      (freeing cells) then tops live count toward a ramping `TARGET_FLOWS`=96 by
      placing fresh flows via `solvePlacement` — flows lay as a **contiguous
      latitude-ring run** (cyclic cols, 1-cell gutters, rows weighted by free
      capacity), a minority (`MAX_PERSIST`=26) **calcify** (`occEnd=Infinity`,
      never decay). Processes come from `processLibrary` (hero + generated;
      persistents are legible heroes). Per-frame derivation: `activeFlowsAt` /
      `flowRevealAt` (head-first `N·smoother(age/growDur)`) / `flowStepDecayAt`
      (reverse-order) / `flowCellGrowAt` (the atlas bridge) / `activeCellGrowsAt`
      (the per-frame surface state the **next box** stamps). The placement solver
      **guarantees no two simultaneously-active flows share a cell** (tested: union
      == raw cell sum). Schedule built over `FLOW_SCHEDULE_DURATION`=900 (Phase 4
      unifies `GLOBO_VIVO_DURATION` to it). **29 new unit tests** (grid invariants,
      cellIndex round-trip, single-source cross-check, schedule determinism,
      contiguity/in-bounds/non-overlap, head-first reveal + reverse decay,
      persistent calcify, dense fill ≳0.3·cells, `activeCellGrowsAt` conflict-free,
      no-`Math.random`/`Date.now`/`useFrame` source guard) — **153 unit tests green**
      across the 3 globo-vivo files; `tsc` clean (only the pre-existing unrelated
      `MotionShowcaseVideo` error). Mask-gating + feeding the atlas are the next two
      boxes; the host is unchanged (still Phase-2 visuals) → no render regression.
- [x] Gate flow spawning by the growth mask (flows only live where the grid has
      colonized); keep density rising toward the vast end state with tiny plates +
      `KIT_BLUE` traveling pulses.
      → New geodesic spawn gate in `globoVivoScript.ts`: `COLONIZE_GATE=0.5`
      (mask 0.5 == the front midpoint, so `>=` means the cell centre is inside the
      growth cap) + pure `cellColonizedAt(row,col,frame)` (reads the same monotonic
      `tissueMaskAt` the host shader blends with). `runFits` now also requires every
      run cell colonized at the spawn frame; `solvePlacement(span,occ,rowOcc,rng,frame)`
      weights bands by their **colonized free** columns and probes from a colonized
      start col (with a `coverageAt(frame)>=1` short-circuit so the post-colonization
      majority weights purely by free capacity — byte-identical to the old solver).
      `generateMaster` passes the spawn `tick` through. **Proven** (diagnostic over
      the full 900-frame `MASTER`): 0 flow cells un-colonized at spawn, 0 visible
      cells un-colonized at any sampled frame, earliest start frame 31
      (coverage 0.175 — nothing before colonization), and active-cell density rises
      13→36→79→260→411 (mid-colonization → vast end), peak occupancy 0.64·cells /
      peak live 60 (existing dense-fill test still green). The atlas still renders the
      Phase-2 breathing lattice — **feeding this gated schedule into `tissueAtlas`
      is the next box** (the tiny-plate + `KIT_BLUE`-pulse rendering already lives in
      the atlas). **12 new unit tests** (gate ≡ `tissueMaskAt≥gate`, empty-before /
      full-after, gate monotonic, seed-before-antipode, every flow spawns on colonized
      grid, no start ≤ `COLONIZE_START_FRAME`, every visible cell colonized at its
      frame, footprint inside the cap during colonization, density rises to the vast
      end, schedule still byte-deterministic) → **165 globo-vivo tests green**; `tsc`
      clean (only the pre-existing unrelated `MotionShowcaseVideo` error).
- [x] Feed the schedule into `tissueAtlas.ts` so the atlas renders the live flows
      each frame.
      → `renderAtlas(frame)` now walks the schedule's `activeCellGrowsAt(frame)`
      (from `globoVivoScript.ts`) instead of the Phase-2 `plateGrowAt` breathing:
      for every cell carrying a live flow it stamps the pre-baked neumorphic plate
      at the sprite level matching that flow's per-cell grow (head-first reveal →
      run → reverse decay; persistents hold full), seam-wrapped at the longitude
      edge, with the travelling `KIT_BLUE` pulse riding the live tissue. Cells with
      no flow stay **bare grid** (the orb is empty before colonization and fills as
      flows spawn behind the front). The placement solver guarantees no two active
      flows share a cell → stamps never overlap; iteration order (flow id, then
      step) is deterministic. The breathing placeholder (`plateGrowAt`/`BREATH_*`)
      is **removed**; `visibleCellCountAt` now counts the live flow cells. Host
      unchanged (`GloboVivoVideo` still calls `renderAtlas(frame)`), so it picks the
      schedule up automatically. **Render-proven** (`swangle`): frame 5 = photoreal
      Earth, frame 45 = geodesic front (white grid replacing Earth from the seed,
      flows on the colonized part), frame 80 = white grid-orb with the live flow
      plates; **two frame-80 stills are byte-identical** (SHA `cf57a40d…`) →
      determinism holds across the new flow-driven path. **Deliberately deferred**:
      per-cell **stage icons/labels** — `processLibrary` imports module/icon names
      as *types only* (no runtime asset pull, to stay node-testable) and at ~10 px
      per cell on the rendered orb they'd be illegible ("procesos minúsculos"); the
      spec's FlowPlate identity is plate + soft double shadow + `KIT_BLUE` pulse +
      pip, all present. **20 new/updated `tissueAtlas.test.ts` cases** (bare orb
      before colonization, ground-then-stamp-every-live-cell, primary stamps land
      on scheduled active-cell centres, density rises colonizing→vast, pulse rides
      the live tissue, only kit-surface/`KIT_BLUE` fills, tier parity at a busy
      frame). **167 globo-vivo unit tests green**; `tsc` clean (only the
      pre-existing unrelated `MotionShowcaseVideo` error).

## Phase 4: Cinematic orbital camera + AAA production + loop

The hero polish and the seamless ending.
([spec: Propósito](../specs/globo-vivo.md#propósito),
[Capacidades de usuario](../specs/globo-vivo.md#capacidades-de-usuario))

- [x] Add the **multi-beat orbital camera** to `globoVivoScript.ts` (waypoint rig
      adapted from `aikit/cameraScript.ts` to orbital coords, eased with
      `motion.ts` CURVE/DUR): wide Earth → push-in during colonization → pull-back
      to the vast grid-orb. Apply to the r3f camera in `GloboVivoVideo.tsx`.
      → New **orbital camera rig** in `globoVivoScript.ts` (pure, frame-driven):
      `OrbitWaypoint` (orbital twin of `cameraScript`'s `at`/`travel` contract,
      addressed by `radius`/`azimuthDeg`/`elevationDeg`, camera always looks at the
      globe centre), `orbitPosition` (spherical → world, |pos| ≡ radius), the
      windowed leg selector `orbitTravelWindow`, and `orbitPoseAt(rig, frame, ease=
      smoother)` — eased with the **quintic `smoother`** (no bounce, house rule),
      `moving` arching 0→1 mid-move. The default **`ORBIT_RIG`** is built by
      `buildOrbitRig(colonizeStart, colonizeEnd, duration)` from the **colonization
      constants** so it **auto-rescales** when Phase-4's duration finalization
      retunes them (no hand-tuned frame numbers): beat A **WIDE** (r 4.8, at 0) →
      beat B **PUSH-IN** (r 3.0, approach spans the colonization window exactly:
      start≡`COLONIZE_START_FRAME`, arrive≡`COLONIZE_END_FRAME`) → beat C **SURVEY**
      (r 4.4, pulls back across the tail). `validateOrbitRig` mirrors
      `validateCameraRig` (ordered arrivals, fitting approaches, radii that clear
      the globe+cloud shell). A subtle deterministic `driftedOrbitPose` (≈1° yaw,
      damped while moving) keeps held frames alive. Host: a `CameraRig` child reads
      `useThree().camera` and sets `position`+`lookAt(0,0,0)` per frame from
      `orbitPoseAt`/`driftedOrbitPose` (imperative, no `useFrame` clock); the
      `ThreeCanvas` initial framing = the rig's frame-0 pose. **Render-proven**
      (`swangle`): frame 0 = whole photoreal Earth floating wide, frame 75 =
      camera dollied in tight on the colonized white grid-orb (the push-in follows
      the tissue); two frame-0 stills are **byte-identical** (SHA `af88b480…`) →
      determinism holds with the moving camera. **23 new unit tests** (beat radii
      clear the globe; `orbitPosition` axis cases + |pos|≡radius; rig validity +
      ordered arrivals + push-in spans colonization + auto-scale to (120,520,900) +
      validator rejects sunk/tangled rigs; pose rests on every waypoint, stays
      `radius` from centre & outside the globe across the timeline, `moving`∈[0,1],
      eased monotonic push-in then pull-back with no overshoot, closest approach is
      the push-in beat, deterministic, empty-rig fallback; drift reduces to base at
      amp 0, stays a tiny bounded offset, keeps |pos|≡radius, deterministic) →
      **190 globo-vivo unit tests green**; `tsc` clean (only the pre-existing
      unrelated `MotionShowcaseVideo` error). The duration is still the temp 90f
      (the rig auto-scales when the **Finalize duration** box bumps it to ~900).
- [ ] Add AAA lighting/FX: HDRI/studio lighting (drei `Environment`), **fresnel
      rim**, soft **bloom** on pulses, **depth of field**, **specular oceans**,
      cloud layer that **dissolves** as the grid advances. **No starfield** (light
      ground). Use `elevation()` for the studio ground + orb relief, not hand shadows.
      ([spec: Restricciones — excepción de marca](../specs/globo-vivo.md#restricciones))
- [x] Set the clean **light neumorphic studio ground** (`#ffffff` family); Earth
      color drains into the white grid as coverage completes.
      → Studio ground confirmed in the `#ffffff` family (`STUDIO_BG = #f4f4fa`,
      every channel ≥ `0xee`, no cream — existing test asserts it). The albedo +
      roughness + metalness already drained per-fragment by the geodesic mask; the
      **missing piece (and the documented full-coverage gotcha) was the terrain
      NORMAL relief** — geometry that still poked Earth mountains/coastlines through
      the flat white grid at `coverage→1`. Fixed **per-fragment** in the Earth
      material shader: a new injection after `<normal_fragment_maps>` lerps the
      perturbed surface normal back to the smooth sphere normal (three 0.171's
      `nonPerturbedNormal`, declared in `<normal_fragment_begin>`) by the same
      `gvMask` the albedo/roughness/metalness already use —
      `normal = normalize(mix(normal, nonPerturbedNormal, gvMask))` — so relief
      survives **only** where the grid hasn't colonized and the orb goes
      geometrically smooth (a pure neumorphic albedo grid; its plate relief is the
      baked atlas sprite shadow, not geometry). `NORMAL_SCALE` now sourced from the
      single-source `BASE_NORMAL_SCALE` in the script; program cache key bumped
      `v1→v2`. Pure CPU twin `reliefStrengthAtUV(u,v,frame) = 1 − tissueMaskAtUV`
      added for testing. **Render-proven** (`swangle`): frame 0 = photoreal Earth
      (full relief, clouds, glossy oceans), frame 180 = geodesic front (smooth white
      grid on the colonized side, Earth relief intact on the un-colonized side —
      the per-fragment drain, superior to a global `normalScale` fade), frame 360 =
      **vast pure-smooth white grid-orb** with no mountains poking through +
      `KIT_BLUE` pips; two frame-360 stills are **byte-identical** (SHA `24ccaf03…`)
      → determinism holds with the new injection. **8 new unit tests**
      (`globoVivoScript.test.ts`: base relief positive; `reliefStrengthAtUV ≡
      1−tissueMaskAtUV` texel-for-texel across UV × timeline; in `[0,1]` + finite;
      full relief before colonization; **zero relief at full coverage** (the gotcha);
      monotonic **non-increasing** per texel; seed flattens before the antipode;
      deterministic) → **206 globo-vivo unit tests green**; `tsc` clean (only the
      pre-existing unrelated `MotionShowcaseVideo` error).
- [x] Make the ending a **seamless loop**: schedule + camera + atlas so the last
      frame flows into the first (tiny incessant processes).
      → The Earth→orb skin change is a one-way narrative (coverage monotonic to 1,
      relief drains to 0 — both already asserted), so a literal pixel loop is
      impossible **by design**; what the loop now makes seamless is the **motion
      across the wrap**, on all three axes the box names:
      **· spin** — `ROT_PERIOD_FRAMES` retuned `360 → 450` so it **divides**
      `GLOBO_VIVO_DURATION` exactly (`GLOBE_TURNS_PER_LOOP = 900/450 = 2`,
      `SPIN_LOOPS_SEAMLESSLY`): `sphereYawAt(900) = 2·2π ≡` the frame-0 orientation,
      so the slow globe doesn't snap a half-turn at the wrap (the old 360 → 2.5
      turns → a ~π jump); the seam advances yaw by exactly **one frame step**
      (constant velocity). Still «girando despacio» (now 15 s/turn) and `sphereYawAt`
      stays the same pure linear ramp (its tests untouched). **· camera** —
      `buildOrbitRig` beat **C now returns to the opening «home» pose** (shared
      `ORBIT_HOME_AZIMUTH_DEG/ELEVATION_DEG`, `ORBIT_SURVEY_RADIUS = ORBIT_WIDE_RADIUS`),
      so the pull-back ends **exactly** where it began — the closing pose deep-equals
      the opening pose (undrifted seam is perfect; the living-hand drift residual is
      sub-degree). **· churn** — `EMIT_END` lifted `dur−60 → dur` so emission runs to
      the **last frame**: the orb teems «sin cesar» right up to the wrap (no dead
      settle thinning the grid in the closing ~1.5 s); flows spawned near the end
      finish a few frames past `duration` (unrendered, and invisible at the wrap
      anyway because frame 0 is pure Earth — coverage 0 masks the atlas away). Host
      unchanged (it reads these constants). **Render-proven** (`swangle`): frame 0 =
      photoreal Earth wide on the home framing; frame 899 = **vast white grid-orb on
      the IDENTICAL home framing** (same size/position → camera + spin flow into
      frame 0), teeming with plates + `KIT_BLUE` pips (343 live cells, ≈ the mid-orb
      370 — no settle); two frame-899 stills are **byte-identical** (SHA `c327be3d…`).
      **10 new unit tests** (`globoVivoScript.test.ts`: period divides duration +
      integer turns; yaw≡0 mod 2π at the loop point; one-frame-step seam advance;
      beat C shares the home pose; closing pose ≡ opening pose exactly; drifted seam
      imperceptible; >200 live cells on the closing frame + ≥0.5·mid; healthy
      live-count/footprint at the end; every flow starts inside the window with a
      deliberate post-`duration` overrun; closing churn deterministic) → **216
      globo-vivo unit tests green**; `tsc` clean (only the pre-existing unrelated
      `MotionShowcaseVideo` error). **Note:** the genuine pixel-perfect loop is
      blocked by the one-way Earth→orb story (intended); the loop is seamless in
      framing/spin/density, which is the achievable + spec-aligned «cierra en loop
      sin costura».
- [x] Finalize duration (~900 frames); set `durationInFrames` to exactly match the
      schedule length (no editor overflow) in `Root.tsx`.
      → `GLOBO_VIVO_DURATION` is now the **finalized scene length** `900`
      (≡ `30·FPS` = 30 s) and `FLOW_SCHEDULE_DURATION = GLOBO_VIVO_DURATION` (one
      source of truth — `GLOBO_VIVO_DURATION` is declared first, so the schedule
      span references it). `Root.tsx` already binds `durationInFrames` to
      `GLOBO_VIVO_DURATION`, so the comp span now equals the master-schedule span
      **exactly** (no editor overflow); only the composition comment was retouched.
      The **colonization window was retuned to the full ~30 s scene** —
      `COLONIZE_START_FRAME 15→60` (a ~2 s Earth-establishing open) /
      `COLONIZE_END_FRAME 75→300` (colonization completes at 10 s, **before** the
      schedule's `0.4·duration`=360 density sample, so the existing `vast>200`
      test stays valid), leaving a long ~20 s vast-orb survey (the longest act).
      Everything downstream **auto-rescaled** off these constants: the orbital
      camera `ORBIT_RIG` (push-in approach now spans 60→300, survey lands on frame
      899) and the geodesic colonization gate (parameter-agnostic). **Render-proven**
      (`swangle`, full 900-frame comp): frame 0 = photoreal Earth wide, frame 240
      (≈84 % colonized) = white neumorphic grid-orb taking over with `KIT_BLUE`
      pulse pips, frame 360 = **vast white grid-orb** (the dense end state, only
      reachable now the timeline is full); **two frame-240 stills byte-identical**
      (SHA `076ffe88…`) → determinism holds across the retuned schedule. **8 new
      unit tests** (`globoVivoScript.test.ts`: 900≡30·FPS, comp span≡schedule span,
      `MASTER≡generateMaster(GLOBO_VIVO_DURATION)`, three non-empty acts with the
      survey longest, Earth fully colonized before the end + at the density sample,
      no flow starts past the timeline, rig spans the whole scene) + 1 atlas test
      updated (`tissueAtlas.test.ts` «frame-dependent» now contrasts a bare
      pre-colonization frame 0 vs the busy `BUSY_FRAME` 300, since the old frame 45
      is now pre-colonization). **198 globo-vivo unit tests green**; `tsc` clean
      (only the pre-existing unrelated `MotionShowcaseVideo` error).

## Phase 5: Tests, determinism & validation

([spec: Restricciones](../specs/globo-vivo.md#restricciones))

- [ ] Write `src/remotion/globoVivoScript.test.ts`: camera beats don't overlap,
      `coverageAt(frame)` is **monotonic** seed→full, duration round-trips, and the
      seeded PRNG / schedule is **deterministic** (same output across runs).
- [ ] Run **targeted** tests + `tsc` only (per house rule — not the full slow
      vitest suite): the new test file + any touched modules.
- [ ] Re-render the full range twice; confirm **pixel-identical** output (no
      `Date.now`/`Math.random`/`useFrame`-clock leaks).
- [ ] Visual review in Remotion Studio across the three acts; confirm legibility of
      hero processes and the vast tiny-process end state.

---

## Verification

- [ ] `GloboVivo` composition renders end-to-end (~900 frames) without errors or
      frozen-render (delayRender always continued).
- [ ] Two renders of any frame are **pixel-identical** (determinism holds).
- [ ] Earth reads as photorealistic at the open; the grid **colonizes geodesically**
      from the seed and **replaces** the Earth; end state is a vast white grid-orb
      with countless tiny processes; the loop is seamless.
- [ ] Per-frame render time is acceptable at chosen atlas res; any cap/fallback is
      `log()`-ged, not silent.
- [ ] Hybrid process library produces hundreds of distinct deterministic flows;
      hero processes are legible.
- [ ] Targeted tests + `tsc` pass; `globoVivoScript.test.ts` covers
      timing/mask-monotonicity/determinism.
- [ ] Neumorphic FlowPlate identity preserved in the grid texture; AAA FX present
      (fresnel/bloom/DoF/specular/clouds), no starfield, `KIT_BLUE` pulses only.
- [ ] `specs/globo-vivo.md` + `specs/index.md` reflect the final implementation.
