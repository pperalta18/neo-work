/**
 * globoVivoScript — pure choreography for the «Globo Vivo» hero scene.
 * ──────────────────────────────────────────────────────────────────────────
 * Everything here is a **pure function of the frame** (no React, no three.js,
 * no `Date.now()` / `Math.random()` / `useFrame` clock) so the composition
 * renders pixel-identical between runs and the timing math is unit-testable in
 * node. {@link GloboVivoVideo} reads ONLY this module for its motion.
 *
 * Scope today is **Phase 1 — de-risk @remotion/three**: a single lit sphere
 * spinning deterministically from the frame. Later phases grow this file with
 * the geodesic growth mask, the orbital camera rig and the flow schedule
 * (see plans/globo-vivo.md); the Phase-1 primitives below are the seed.
 */
import {
  PROCESS_LIBRARY,
  processCellSpan,
  stageSpan,
  mulberry32,
  heroProcesses,
  generatedProcesses,
  type Process,
  type Stage,
} from './processLibrary'

export const FPS = 30

/**
 * The finalized scene length: **900 frames ≈ 30 s** @ {@link FPS} (Phase 4). The
 * comp duration ({@link GLOBO_VIVO_DURATION}) and the flow-schedule span
 * ({@link FLOW_SCHEDULE_DURATION}) are the **same value**, so `durationInFrames`
 * matches the choreography exactly with no editor overflow. The colonization
 * window + orbital camera rig ({@link ORBIT_RIG}) derive their frames from this,
 * so the three acts (Earth → colonization → vast orb) fill the whole timeline.
 */
export const GLOBO_VIVO_DURATION = 900

// ── Sphere + camera geometry (world units) ──────────────────────────────────
// A unit-ish globe framed centre-screen by a static camera. The atlas/Earth
// maps (Phase 2) and the orbital rig (Phase 4) build on these.
export const SPHERE_RADIUS = 1.4
export const SPHERE_SEGMENTS = 64
export const CAMERA_Z = 4.2
export const CAMERA_FOV = 45

/** Clean light neumorphic studio ground (#ffffff family — never cream). */
export const STUDIO_BG = '#f4f4fa'

/**
 * Frames for one full 360° revolution — «girando despacio» (15 s / turn). CHOSEN
 * to divide {@link GLOBO_VIVO_DURATION} evenly (900 / 450 = 2), so the globe is back
 * at its frame-0 orientation at the loop wrap: `sphereYawAt(duration)` is a whole
 * number of turns (≡ 0 mod 2π) and the seam 899→0 advances the slow spin by exactly
 * one frame step — **continuous rotation across the loop, no half-turn jump** (the
 * old 360 gave 2.5 turns → a ~π snap). See {@link SPIN_LOOPS_SEAMLESSLY}.
 */
export const ROT_PERIOD_FRAMES = 450

/**
 * Whole globe revolutions across one full scene loop. Integer by construction
 * ({@link ROT_PERIOD_FRAMES} divides {@link GLOBO_VIVO_DURATION}) so the spin closes
 * the loop seamlessly. The seam-continuity contract the loop relies on.
 */
export const GLOBE_TURNS_PER_LOOP = GLOBO_VIVO_DURATION / ROT_PERIOD_FRAMES

/**
 * Whether the globe's slow spin closes the loop without a jump: true when the
 * rotation period divides the scene duration evenly, so the orientation at the loop
 * point (`frame === duration`) equals the orientation at frame 0. Drives the
 * seamless-loop guarantee + its unit test.
 */
export const SPIN_LOOPS_SEAMLESSLY = Number.isInteger(GLOBE_TURNS_PER_LOOP)

const TWO_PI = Math.PI * 2

// ── Small pure helpers (reused by later phases) ─────────────────────────────
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

/**
 * Deterministic sphere yaw (radians) at `frame`. A plain linear ramp keyed to
 * the frame — strictly increasing, with `sphereYawAt(0) === 0` and one full
 * turn every `period` frames — so two renders of the same frame match exactly.
 */
export function sphereYawAt(frame: number, period: number = ROT_PERIOD_FRAMES): number {
  return (frame / period) * TWO_PI
}

/**
 * Smooth Hermite step (the GLSL `smoothstep`): `0` for `x ≤ edge0`, `1` for
 * `x ≥ edge1`, eased ease-in-out in between — no overshoot, no bounce (house
 * rule). Degenerate `edge0 === edge1` becomes a hard step. Pure, used by the
 * coverage ramp and the soft growth front below.
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1
  const t = clamp01((x - edge0) / (edge1 - edge0))
  return t * t * (3 - 2 * t)
}

// ── Geodesic growth mask (Phase 2) ──────────────────────────────────────────
// The living tissue is born at a SEED point on the globe and colonizes the
// surface **geodesically**: the front is a spherical cap whose angular radius
// grows with the frame. `coverageAt(frame)` is the colonized *area fraction*
// [0..1]; the front's angular radius is recovered from it so the colonized AREA
// matches coverage exactly (a cap of angular radius r covers (1 − cos r)/2 of a
// sphere). `tissueMaskAt(lat, lon, frame)` is the per-texel Earth↔grid blend
// weight (0 = photoreal Earth, 1 = neumorphic grid) the host material samples
// once the Earth maps + tissue atlas land. All pure functions of the frame.

/**
 * Seed point (degrees, lat ∈ [−90,90] / lon ∈ [−180,180]) the colonization
 * front blooms outward from. Off-equator + off-meridian so the spreading cap
 * reads as a believable patch rather than a symmetric bullseye.
 */
export const SEED_LAT_DEG = 18
export const SEED_LON_DEG = -4

/**
 * Colonization beat window (frames) for the finalized ~900-frame scene: a ~2 s
 * Earth-establishing open (`0 → START` — the photoreal globe drifts wide), then
 * the geodesic colonization across the middle act (`START → END`), leaving a long
 * ~20 s survey of the vast living grid-orb (`END → duration`). Colonization
 * completes well before the schedule's density sample (`0.4·duration`) so the
 * orb reads vast there; the orbital camera's push-in spans exactly this window
 * ({@link buildOrbitRig}) and the colonization gate clips flow spawns to the cap.
 */
export const COLONIZE_START_FRAME = 60
export const COLONIZE_END_FRAME = 300

/** Angular half-width (radians) of the soft growth front — the dissolve band. */
export const MASK_EDGE = 0.1

const DEG2RAD = Math.PI / 180

/**
 * Great-circle (geodesic) angular distance between two lat/lon points, in
 * radians [0, π]. Spherical law of cosines; inputs in degrees. `0` to itself,
 * `π` to the antipode, symmetric in its two points. The float result is clamped
 * into `acos`'s domain so drift never yields `NaN`.
 */
export function geodesicDistance(
  latADeg: number,
  lonADeg: number,
  latBDeg: number,
  lonBDeg: number,
): number {
  const latA = latADeg * DEG2RAD
  const latB = latBDeg * DEG2RAD
  const dLon = (lonADeg - lonBDeg) * DEG2RAD
  const cosD =
    Math.sin(latA) * Math.sin(latB) + Math.cos(latA) * Math.cos(latB) * Math.cos(dLon)
  return Math.acos(cosD < -1 ? -1 : cosD > 1 ? 1 : cosD)
}

/**
 * Colonized **area fraction** [0..1] at `frame`. Monotonic non-decreasing: `0`
 * before {@link COLONIZE_START_FRAME}, `1` after {@link COLONIZE_END_FRAME},
 * eased ease-in-out (smoothstep) between — a calm bloom, no bounce.
 */
export function coverageAt(frame: number): number {
  return smoothstep(COLONIZE_START_FRAME, COLONIZE_END_FRAME, frame)
}

/**
 * Angular radius (radians, [0, π]) of the growth front at `frame`, recovered
 * from {@link coverageAt} so the colonized cap **area equals coverage** exactly:
 * cap fraction = (1 − cos r)/2  ⇒  r = acos(1 − 2·coverage). Monotonic
 * non-decreasing in `frame` (0 at the open, π once the orb is fully taken).
 */
export function frontRadiusAt(frame: number): number {
  const cosR = 1 - 2 * coverageAt(frame)
  return Math.acos(cosR < -1 ? -1 : cosR > 1 ? 1 : cosR)
}

/**
 * Per-texel tissue mask at `frame`: `0` = still photoreal Earth, `1` =
 * colonized neumorphic grid, with a soft {@link MASK_EDGE} band across the
 * advancing front. Geodesically ordered (a texel nearer the seed is colonized
 * no later than a farther one) and **monotonic non-decreasing in `frame`** for
 * every fixed `(lat, lon)`. Endpoints are pinned hard so the open is pure Earth
 * and the close is the full grid-orb.
 */
export function tissueMaskAt(latDeg: number, lonDeg: number, frame: number): number {
  const c = coverageAt(frame)
  if (c <= 0) return 0
  if (c >= 1) return 1
  const d = geodesicDistance(latDeg, lonDeg, SEED_LAT_DEG, SEED_LON_DEG)
  const front = frontRadiusAt(frame)
  // 1 well inside the front, 0 well outside, smooth across ±MASK_EDGE.
  return 1 - smoothstep(front - MASK_EDGE, front + MASK_EDGE, d)
}

/**
 * The same per-texel tissue mask as {@link tissueMaskAt}, but addressed by
 * **equirectangular UV** `(u, v) ∈ [0,1]²` instead of lat/lon — the exact CPU
 * twin of the GLSL the host injects into the Earth material (so the on-GPU blend
 * is unit-testable in node). UV→lon/lat uses the atlas / NASA-map convention
 * (`u`: lon −180→+180, `v`: lat +90→−90), then the *same* spherical-law-of-cosines
 * geodesic distance + soft front as {@link tissueMaskAt}. Pure; for a converted
 * `(lat, lon)` it equals `tissueMaskAt(lat, lon, frame)`.
 */
export function tissueMaskAtUV(u: number, v: number, frame: number): number {
  const coverage = coverageAt(frame)
  if (coverage <= 0) return 0
  if (coverage >= 1) return 1
  const lonDeg = u * 360 - 180
  const latDeg = 90 - v * 180
  const latR = latDeg * DEG2RAD
  const seedLatR = SEED_LAT_DEG * DEG2RAD
  const dLonR = (lonDeg - SEED_LON_DEG) * DEG2RAD
  let cosD = Math.sin(latR) * Math.sin(seedLatR) + Math.cos(latR) * Math.cos(seedLatR) * Math.cos(dLonR)
  cosD = cosD < -1 ? -1 : cosD > 1 ? 1 : cosD
  const d = Math.acos(cosD)
  const front = frontRadiusAt(frame)
  return 1 - smoothstep(front - MASK_EDGE, front + MASK_EDGE, d)
}

/** The per-frame geodesic-mask uniforms the host feeds the Earth material shader. */
export type MaskUniforms = {
  /** Colonized area fraction [0..1] (= {@link coverageAt}). */
  coverage: number
  /** Growth-front angular radius (rad, [0,π]) (= {@link frontRadiusAt}). */
  frontRadius: number
  /** Soft-front half-width (rad) (= {@link MASK_EDGE}, frame-independent). */
  maskEdge: number
  /** Seed latitude in radians (= {@link SEED_LAT_DEG}, frame-independent). */
  seedLatRad: number
  /** Seed longitude in degrees (= {@link SEED_LON_DEG}, frame-independent). */
  seedLonDeg: number
}

/**
 * Snapshot the geodesic-mask shader uniforms at `frame`: the two frame-driven
 * values (`coverage`, `frontRadius`) plus the three constants the GLSL needs
 * (`maskEdge`, `seedLatRad`, `seedLonDeg`). Pure — the host mutates the live
 * `coverage`/`frontRadius` each frame so the on-GPU blend tracks
 * {@link tissueMaskAtUV} exactly.
 */
export function maskUniformsAt(frame: number): MaskUniforms {
  return {
    coverage: coverageAt(frame),
    frontRadius: frontRadiusAt(frame),
    maskEdge: MASK_EDGE,
    seedLatRad: SEED_LAT_DEG * DEG2RAD,
    seedLonDeg: SEED_LON_DEG,
  }
}

// ── Photorealistic Earth maps (Phase 2) ──────────────────────────────────────
// Vendored NASA Blue Marble equirectangular maps (public domain, all 2:1)
// drive the surface look until the living grid replaces it. Paths are relative
// to `public/` — the host resolves them with Remotion `staticFile`. The values
// here are PURE data + math (no React/three) so they stay node-testable; the
// host bakes the inverted-roughness map and binds these to the meshes.

/**
 * The vendored Earth maps, keyed by role, relative to `public/`. Color + clouds
 * are sRGB albedo; specular (ocean mask) → an inverted roughness map; normal is
 * tangent-space relief; night city-lights are vendored for the Phase-4 AAA
 * terminator-aware emissive (not bound in Phase 2). Resolve via `staticFile`.
 */
export const EARTH_TEXTURES = {
  color: 'globoVivo/earth-color.jpg',
  specular: 'globoVivo/earth-specular.jpg',
  clouds: 'globoVivo/earth-clouds.png',
  night: 'globoVivo/earth-night.png',
  normal: 'globoVivo/earth-normal.jpg',
} as const
export type EarthTextureKey = keyof typeof EARTH_TEXTURES

/** Cloud shell radius as a multiple of the surface radius — floats just above. */
export const CLOUD_RADIUS_SCALE = 1.012

/** Earth axial tilt (radians) ≈ 23.44°, for a believable, non-vertical spin axis. */
export const EARTH_TILT_RAD = 23.44 * DEG2RAD

/**
 * Clouds drift a touch faster than the surface for gentle parallax — a shorter
 * rotation period (82% of the ground's) so the cloud shell leads the terrain.
 */
export const CLOUD_ROT_PERIOD_FRAMES = ROT_PERIOD_FRAMES * 0.82

/**
 * Deterministic cloud-shell yaw (radians) at `frame`: the same strictly-rising
 * linear ramp as {@link sphereYawAt} but on {@link CLOUD_ROT_PERIOD_FRAMES}, so
 * the clouds spin slightly ahead of the ground. `cloudYawAt(0) === 0`. Pure.
 */
export function cloudYawAt(frame: number, period: number = CLOUD_ROT_PERIOD_FRAMES): number {
  return (frame / period) * TWO_PI
}

/** Glossy oceans / matte land — the roughness endpoints the specular map selects. */
export const EARTH_OCEAN_ROUGHNESS = 0.3
export const EARTH_LAND_ROUGHNESS = 0.95

/**
 * Per-texel surface roughness from the specular (ocean) map luminance. The
 * NASA specular map is bright over oceans (≈1) and dark over land (≈0), but a
 * three roughness map wants the opposite polarity (dark = glossy), so this
 * **inverts** it: oceans → {@link EARTH_OCEAN_ROUGHNESS} (glossy sun-glint),
 * land → {@link EARTH_LAND_ROUGHNESS} (matte). `specLuma` is clamped to [0,1].
 * Pure — the host bakes this per pixel into the deterministic roughness map.
 */
export function oceanRoughnessFromSpecular(specLuma: number): number {
  return lerp(EARTH_LAND_ROUGHNESS, EARTH_OCEAN_ROUGHNESS, clamp01(specLuma))
}

// ── Earth → grid drain: terrain relief flattens where colonized (Phase 4) ─────
// As the grid takes the surface the Earth must drain into the white neumorphic
// orb COMPLETELY (spec: «el color de la Tierra se drena hacia el grid blanco»).
// The host already mixes the albedo to the atlas + pulls roughness/metalness
// matte per-fragment by the geodesic mask, but the tangent-space NORMAL relief
// (mountains / coastlines) is geometry and would otherwise still poke through the
// flat white grid at full coverage. So the host lerps the perturbed surface normal
// back to the smooth sphere normal by the same `gvMask`/{@link tissueMaskAtUV}
// weight — i.e. it scales the surviving terrain relief by `1 − mask`. These pure
// values are the single source for the host's normal-scale + the CPU twin of that
// per-fragment drain (unit-testable without the GPU).

/**
 * Base tangent-space normal-map intensity (terrain relief) on the still-photoreal
 * Earth — the host builds `Vector2(BASE_NORMAL_SCALE, BASE_NORMAL_SCALE)` from it.
 * Positive so land/coastlines catch a believable raking light; drained to flat
 * where the living grid colonizes (the orb's plate relief is the baked atlas
 * sprite shadow, not geometry). Single source so the host and the tests agree.
 */
export const BASE_NORMAL_SCALE = 0.5

/**
 * Earth **terrain-relief survival** [0..1] at equirectangular UV `(u, v)` and
 * `frame` — the CPU twin of the host's per-fragment normal drain. Full relief on
 * still-photoreal Earth (`1`), drained to flat where the grid has colonized
 * (`0`), exactly tracking the geodesic mask: `reliefStrengthAtUV = 1 −
 * tissueMaskAtUV`. So as coverage completes the whole orb goes geometrically
 * smooth — no Earth mountains poke through the white neumorphic grid. Monotonic
 * **non-increasing** in `frame` for any fixed `(u, v)` (mirror of the mask's
 * non-decreasing growth: relief only ever drains, never returns); `1` before
 * colonization, `0` at full coverage. Pure, deterministic.
 */
export function reliefStrengthAtUV(u: number, v: number, frame: number): number {
  return 1 - tissueMaskAtUV(u, v, frame)
}

// ════════════════════════════════════════════════════════════════════════════
// Cinematic orbital camera (Phase 4)
// ════════════════════════════════════════════════════════════════════════════
// The hero shot is never a static plate (house rule: «movimientos multi-paso que
// siguen la acción, nunca plano estático»). The camera orbits the globe through
// three beats keyed to the colonization story:
//   A · WIDE  — the whole Earth floating, before the tissue stirs.
//   B · PUSH-IN — a slow dolly toward the surface across the colonization window,
//                 so we watch the living grid bloom from the seed up close.
//   C · SURVEY — pull back to the SAME opening WIDE framing (the «loop home»), now a
//                vast white grid-orb. Ending where it began makes the loop seam
//                close on the camera too (the last frame flows into the first).
// The rig is the orbital twin of `aikit/cameraScript.ts`'s waypoint model (an
// arrival frame `at`, an approach of `travel` frames ending on `at`, rest in
// between) but addressed in orbital coordinates (a distance from the globe centre
// + an azimuth/elevation), with the camera always looking at the origin. Every
// pose is a PURE function of the frame (eased with {@link smoother} — quintic, no
// bounce) so the render stays deterministic and the choreography is node-testable.
//
// The default rig ({@link ORBIT_RIG}) derives its beat frames from the
// colonization window + the comp duration, so when Phase 4's duration
// finalization retunes those constants the camera **rescales automatically**
// (no hand-tuned frame numbers to chase).

/** Wide opening distance (world units) — the whole Earth in frame, lots of air. */
export const ORBIT_WIDE_RADIUS = 4.8
/** Closest dolly distance — the push-in that watches the tissue colonize up close. */
export const ORBIT_NEAR_RADIUS = 3.0
/**
 * Survey distance — the final pull-back. **Equals {@link ORBIT_WIDE_RADIUS} by
 * design**: beat C returns to the opening WIDE framing so the camera ends exactly
 * where it began and the loop seam closes (the survey pose ≡ the wide pose). Kept as
 * its own named constant for the «wide → near → survey» beat contract + its tests.
 */
export const ORBIT_SURVEY_RADIUS = ORBIT_WIDE_RADIUS

/** Opening (and closing) camera yaw around world Y — the shared «loop home» azimuth. */
export const ORBIT_HOME_AZIMUTH_DEG = -16
/** Opening (and closing) camera lift above the equatorial plane — the «loop home» elevation. */
export const ORBIT_HOME_ELEVATION_DEG = 12

/** Default approach length (frames) when a waypoint doesn't set its own `travel`. */
export const DEFAULT_ORBIT_TRAVEL = 26

/** A camera waypoint in orbital space (camera looks at the globe centre). */
export type OrbitWaypoint = {
  /** Frame the camera arrives on this waypoint (at rest). */
  at: number
  /** Frames the move into this waypoint takes (ends on `at`). Default {@link DEFAULT_ORBIT_TRAVEL}. */
  travel?: number
  /** Distance from the globe centre (world units). */
  radius: number
  /** Yaw around world Y (degrees); 0 looks along +Z toward the origin. */
  azimuthDeg: number
  /** Angle above the equatorial plane (degrees); +up, −down. */
  elevationDeg: number
}

/** The camera's resolved pose at a frame — orbital params + the world position. */
export type OrbitPose = {
  radius: number
  azimuthDeg: number
  elevationDeg: number
  /** Camera world position (looks at the origin). */
  position: [number, number, number]
  /** 0 at rest, peaking at 1 mid-move — damps the breathing drift during big moves. */
  moving: number
}

/**
 * World position of a camera orbiting the origin at `radius`, yawed `azimuthDeg`
 * around world Y and lifted `elevationDeg` above the equatorial plane. Azimuth 0 +
 * elevation 0 sits on the +Z axis (`[0, 0, radius]`), matching the Phase-1 static
 * framing. The result's length always equals `radius` (the camera looks at the
 * origin from exactly that distance). Pure.
 */
export function orbitPosition(
  radius: number,
  azimuthDeg: number,
  elevationDeg: number,
): [number, number, number] {
  const az = azimuthDeg * DEG2RAD
  const el = elevationDeg * DEG2RAD
  const cosEl = Math.cos(el)
  return [radius * cosEl * Math.sin(az), radius * Math.sin(el), radius * cosEl * Math.cos(az)]
}

/** The approach window toward waypoint `k` (clamped so it never predates the previous arrival). */
export function orbitTravelWindow(
  rig: readonly OrbitWaypoint[],
  k: number,
): { start: number; end: number } {
  const f = rig[k]
  if (k <= 0) return { start: f.at, end: f.at }
  const start = Math.max(rig[k - 1].at, f.at - (f.travel ?? DEFAULT_ORBIT_TRAVEL))
  return { start, end: f.at }
}

/**
 * The camera's pose at `frame` — the single source of truth shared by the host
 * and the tests. Selects the active leg (the latest waypoint whose approach has
 * begun), then eases the orbital params from the previous waypoint to it across
 * the approach window (`ease` defaults to the quintic {@link smoother} — no
 * overshoot). At rest on a waypoint, `moving` is 0; mid-move it arches to 1.
 */
export function orbitPoseAt(
  rig: readonly OrbitWaypoint[],
  frame: number,
  ease: (t: number) => number = smoother,
): OrbitPose {
  const settle = (wp: OrbitWaypoint): OrbitPose => ({
    radius: wp.radius,
    azimuthDeg: wp.azimuthDeg,
    elevationDeg: wp.elevationDeg,
    position: orbitPosition(wp.radius, wp.azimuthDeg, wp.elevationDeg),
    moving: 0,
  })
  if (rig.length === 0) {
    return {
      radius: CAMERA_Z,
      azimuthDeg: 0,
      elevationDeg: 0,
      position: [0, 0, CAMERA_Z],
      moving: 0,
    }
  }

  let k = 0
  for (let j = 1; j < rig.length; j += 1) {
    if (frame >= orbitTravelWindow(rig, j).start) k = j
  }
  const to = rig[k]
  if (k === 0) return settle(to)

  const { start, end } = orbitTravelWindow(rig, k)
  const t = end <= start ? 1 : clamp01((frame - start) / (end - start))
  if (t >= 1) return settle(to)

  const from = rig[k - 1]
  const e = ease(t)
  const radius = lerp(from.radius, to.radius, e)
  const azimuthDeg = lerp(from.azimuthDeg, to.azimuthDeg, e)
  const elevationDeg = lerp(from.elevationDeg, to.elevationDeg, e)
  return {
    radius,
    azimuthDeg,
    elevationDeg,
    position: orbitPosition(radius, azimuthDeg, elevationDeg),
    moving: 4 * t * (1 - t),
  }
}

/**
 * A subtle, deterministic breathing drift layered on a resting pose so held
 * frames stay alive (the {@link cameraScript} principle), damped while the camera
 * is mid-move (`pose.moving`). Pure sin of the frame — no clock, no randomness;
 * the drift is tiny (≈1° of yaw) so it reads as a living hand, not a wobble.
 */
export function driftedOrbitPose(
  pose: OrbitPose,
  frame: number,
  amp = 1,
): { radius: number; azimuthDeg: number; elevationDeg: number; position: [number, number, number] } {
  const a = amp * (0.5 + 0.5 * (1 - pose.moving))
  const radius = pose.radius + Math.sin(frame / 140) * 0.03 * a
  const azimuthDeg = pose.azimuthDeg + Math.sin(frame / 90) * 1.2 * a
  const elevationDeg = pose.elevationDeg + Math.sin(frame / 120) * 0.6 * a
  return { radius, azimuthDeg, elevationDeg, position: orbitPosition(radius, azimuthDeg, elevationDeg) }
}

/**
 * Build the default three-beat orbital rig from the colonization window + comp
 * duration. Beat B's approach spans the colonization (push-in `start` lands on
 * `colonizeStart`, arrival on `colonizeEnd`); beat C pulls back across the tail.
 * Deriving the frames keeps the camera correct through Phase 4's duration
 * finalization without re-authoring. Pure + deterministic.
 */
export function buildOrbitRig(
  colonizeStart: number = COLONIZE_START_FRAME,
  colonizeEnd: number = COLONIZE_END_FRAME,
  duration: number = GLOBO_VIVO_DURATION,
): OrbitWaypoint[] {
  const colonizeSpan = Math.max(1, colonizeEnd - colonizeStart)
  const end = Math.max(colonizeEnd + 1, duration - 1)
  // The shared opening + closing «loop home» pose — beat C returns to it so the
  // camera ends exactly where it began and the loop seam closes seamlessly.
  const home = {
    radius: ORBIT_WIDE_RADIUS,
    azimuthDeg: ORBIT_HOME_AZIMUTH_DEG,
    elevationDeg: ORBIT_HOME_ELEVATION_DEG,
  }
  return [
    { at: 0, ...home },
    { at: colonizeEnd, travel: colonizeSpan, radius: ORBIT_NEAR_RADIUS, azimuthDeg: 9, elevationDeg: 5 },
    {
      at: end,
      travel: Math.max(1, end - colonizeEnd),
      radius: ORBIT_SURVEY_RADIUS, // == ORBIT_WIDE_RADIUS — pull back to the home framing
      azimuthDeg: home.azimuthDeg,
      elevationDeg: home.elevationDeg,
    },
  ]
}

/** The default orbital rig the host drives (built once; auto-scales with the constants). */
export const ORBIT_RIG: OrbitWaypoint[] = buildOrbitRig()

/**
 * Sanity-check an authored rig — empty array means valid. Arrivals must be
 * strictly ordered, an approach must fit the gap before it (never depart before
 * the previous waypoint arrives), radii must be positive AND clear the globe (so
 * the camera never dives inside the sphere/cloud shell). Mirrors
 * `validateCameraRig` for the orbital model.
 */
export function validateOrbitRig(rig: readonly OrbitWaypoint[]): string[] {
  const errors: string[] = []
  const minRadius = SPHERE_RADIUS * CLOUD_RADIUS_SCALE
  rig.forEach((f, i) => {
    if (f.radius <= minRadius) {
      errors.push(`waypoint ${i}: radius ${f.radius} must clear the globe (> ${minRadius.toFixed(3)})`)
    }
    const travel = f.travel ?? DEFAULT_ORBIT_TRAVEL
    if (travel <= 0) errors.push(`waypoint ${i}: travel must be positive (got ${f.travel})`)
    if (i === 0) return
    const prev = rig[i - 1]
    if (f.at <= prev.at) {
      errors.push(`waypoint ${i}: at ${f.at} must arrive after waypoint ${i - 1} (${prev.at})`)
      return
    }
    if (f.at - travel < prev.at) {
      errors.push(
        `waypoint ${i}: travel ${travel} would depart at ${f.at - travel}, before waypoint ${i - 1} arrives (${prev.at})`,
      )
    }
  })
  return errors
}

// ── Surface grid — cosine-banded equirectangular cells (Phase 3) ─────────────
// The living grid is laid on the sphere as latitude BANDS of equal angular
// height, each carrying FEWER columns toward the poles (∝ cos lat) so a cell
// covers a roughly-equal AREA on the actual sphere (an equirectangular sheet
// stretches longitude as cos(lat)→0) and reads ~square once wrapped. This
// **logical** grid is the single source of truth for BOTH the flow schedule
// below AND the pixel atlas (`tissueAtlas.ts`, which imports it and adds
// equirectangular pixel coordinates) — so a scheduled flow and the plate the
// atlas stamps address the exact same cell. Pure + deterministic; one direction
// of dependency (atlas → script), no cycle. Columns floor at MIN_COLS so the
// polar caps are not one stretched plate.

/** Latitude band height (degrees). 7.5° → 24 rows, 48 columns at the equator. */
export const BAND_DEG = 7.5
/** Number of latitude bands (rows), north → south. */
export const ROWS = Math.round(180 / BAND_DEG)
/** Columns at the equator (where cells are ~square). */
export const COLS_EQ = Math.round(360 / BAND_DEG)
/** Minimum columns per band so the polar caps are not one stretched plate. */
export const MIN_COLS = 6

/** Centre latitude (degrees, in (−90, 90)) of band `row` (0 = northernmost). */
export function rowCenterLat(row: number): number {
  return 90 - (row + 0.5) * BAND_DEG
}

/** Column count of band `row`: cos-weighted toward the equator, clamped to [MIN_COLS, COLS_EQ]. */
export function colsInRow(row: number): number {
  const c = Math.round(COLS_EQ * Math.cos(rowCenterLat(row) * DEG2RAD))
  return Math.max(MIN_COLS, Math.min(COLS_EQ, c))
}

/**
 * Deterministic value in [0, 1) from two small integers — a seeded per-cell
 * phase (no `Math.random`). Integer avalanche mix; same inputs → same output.
 */
export function hash01(a: number, b: number): number {
  let h = (Math.imul(a, 374761393) + Math.imul(b, 668265263)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Lon/lat (degrees) → equirectangular UV in [0,1]² (u: lon −180→+180, v: lat +90→−90). */
export function lonLatToUV(lonDeg: number, latDeg: number): [number, number] {
  return [(lonDeg + 180) / 360, (90 - latDeg) / 180]
}

/** Inverse of {@link lonLatToUV}: equirectangular UV → lon/lat (degrees). */
export function uvToLonLat(u: number, v: number): [number, number] {
  return [u * 360 - 180, 90 - v * 180]
}

/** One logical grid cell on the equirectangular surface (no pixel coords). */
export type SurfaceCell = {
  /** Band index (0 = northernmost). */
  row: number
  /** Column within the band (0 = lon −180 side). */
  col: number
  /** Centre latitude (degrees). */
  lat: number
  /** Centre longitude (degrees). */
  lon: number
  /** Centre U in [0,1]. */
  u: number
  /** Centre V in [0,1]. */
  v: number
  /** Seeded phase in [0,1) for per-cell animation offsets. */
  seedPhase: number
}

/** Build the full cosine-banded logical cell grid once (pure, deterministic). */
export function buildSurfaceCells(): SurfaceCell[] {
  const cells: SurfaceCell[] = []
  for (let row = 0; row < ROWS; row += 1) {
    const lat = rowCenterLat(row)
    const cols = colsInRow(row)
    const v = (row + 0.5) / ROWS
    for (let col = 0; col < cols; col += 1) {
      const u = (col + 0.5) / cols
      cells.push({ row, col, lat, lon: u * 360 - 180, u, v, seedPhase: hash01(row + 1, col + 1) })
    }
  }
  return cells
}

/** The colonized-grid logical cells (built once at module load). */
export const SURFACE_CELLS: SurfaceCell[] = buildSurfaceCells()
/** Total cell count across the whole orb. */
export const SURFACE_CELL_COUNT = SURFACE_CELLS.length

/** Column count per band, indexed by row (= `colsInRow(row)`). */
export const ROW_COLS: number[] = Array.from({ length: ROWS }, (_, r) => colsInRow(r))

/** First flat {@link SURFACE_CELLS} index of each band (prefix sum of {@link ROW_COLS}). */
export const ROW_START: number[] = (() => {
  const starts: number[] = []
  let acc = 0
  for (let r = 0; r < ROWS; r += 1) {
    starts.push(acc)
    acc += ROW_COLS[r]
  }
  return starts
})()

/** Flat {@link SURFACE_CELLS} index of band `row`, column `col` (col already in-range). */
export function cellIndex(row: number, col: number): number {
  return ROW_START[row] + col
}

// ════════════════════════════════════════════════════════════════════════════
// Flow schedule — many micro-processes colonizing the surface (Phase 3)
// ════════════════════════════════════════════════════════════════════════════
// The vast living orb teems with «muchísimos procesos minúsculos» (spec). This is
// the choreography that places real business flows (from `processLibrary.ts`)
// onto the banded surface and animates them: each flow EMERGES head-first along a
// latitude ring, RUNS, then DISSIPATES back to bare grid (apoptosis) — while a
// minority CALCIFY and stay (the accreting lattice). Directly adapts
// `tejidoVivoScript.ts`'s `generateMaster()` / `solvePlacement()` / `revealAt()`
// / `stepDecayAt()` to lat/lon cells.
//
// Same authoring contract as the rest of the file: EVERYTHING is a pure function
// of the frame; the master schedule is generated ONCE at module load from a
// single seeded `mulberry32` stream (no `Date.now` / `Math.random`), so the
// studio and the render agree frame-for-frame and the scheduler is unit-testable
// without rendering. The pixel atlas (`tissueAtlas.ts`, next Phase-3 task) reads
// these anchors to stamp the plates; the geodesic-mask gate ({@link cellColonizedAt})
// clips every spawn to the colonized cap, so a flow only ever runs where the grid
// has already replaced the Earth.

/** Modulo that stays non-negative (rings wrap at the longitude seam). */
const mod = (n: number, m: number): number => ((n % m) + m) % m

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * The schedule's length (frames) — now **unified** with {@link GLOBO_VIVO_DURATION}
 * (the comp duration) so the flow timeline spans exactly the rendered scene with
 * no editor overflow. The colonization beats + orbital rig are tuned to this full
 * ~30 s span. Kept as its own export (referenced by `EMIT_END` / `generateMaster`)
 * so the schedule code stays readable; it is the same number as the comp duration.
 */
export const FLOW_SCHEDULE_DURATION = GLOBO_VIVO_DURATION

/** The single seed the whole flow schedule derives from (distinct from the library seed). */
const SCHEDULE_SEED = 0x6105d00d

/** Frames the emergence front spends per cell index (head-first sweep speed). */
export const PER_STEP_RUN = 2
/** Ephemeral dwell (frames) at full before dissipating. */
export const HOLD_MIN = 14
/** Random extra dwell added to {@link HOLD_MIN}. */
export const HOLD_JIT = 22
/** Dissipation window (frames) per cell. */
export const FADE = 9
/** Reverse-order stagger (frames): the last cell recoils first. */
export const RETRACT = 0.6
/** Concurrency aim — live flows the field fills toward (Phase-3 gating ramps this). */
export const TARGET_FLOWS = 96
/** The calcified (persistent) lattice stays a minority. */
export const MAX_PERSIST = 26

/** First activity frame (a calm start seam). */
const EMIT_START = 6
/**
 * Keep emitting fresh ephemerals **all the way to the last frame** so the vast orb
 * teems «sin cesar» right up to the loop wrap (no dead settle that visibly thins the
 * grid in the closing ~1.5 s). Flows spawned near the end finish their life a few
 * frames past `duration` — unrendered, and invisible at the wrap anyway because frame
 * 0 is pure Earth (coverage 0 masks the atlas away). This is the schedule half of the
 * seamless loop: the close is as alive as the middle.
 */
const EMIT_END = FLOW_SCHEDULE_DURATION
/** The soft scheduler clock step (frames between spawn passes). */
const TICK_STEP = 5
/** Frames over which concurrency ramps from 0 to {@link TARGET_FLOWS} (gentle fill). */
const FILL_RAMP = 240
/** Probability an ephemeral picks a legible hero flow (vs the combinatorial mass). */
const HERO_SPAWN_PROB = 0.16
/** Every Nth spawn tries to calcify (until {@link MAX_PERSIST} is reached). */
const PERSIST_EVERY = 6
/** Placement attempts before a spawn gives up this tick (natural back-pressure). */
const SEED_RETRY = 18
/** Free cells a flow must leave in its ring (1-cell gutter at each end). */
const MIN_RING_GAP = 2

const HERO: Process[] = heroProcesses()
const GEN: Process[] = generatedProcesses()

/** Whether a flow dissipates (ephemeral) or calcifies and stays (persistent). */
export type FlowKind = 'ephemeral' | 'persistent'

/** One placed cell of a flow on the banded surface, carrying its stage content. */
export type PlacedFlowStep = {
  /** Flat index into {@link SURFACE_CELLS}. */
  cellIndex: number
  /** Band index. */
  row: number
  /** Column within the band (already wrapped into range). */
  col: number
  /** Cell centre U / V / lat / lon (for the atlas + pulse + camera math). */
  u: number
  v: number
  lat: number
  lon: number
  /** The process stage this cell belongs to (tool or action). */
  stage: Stage
  /** First cell of its stage — an action spans 2 cells; the head carries the label. */
  isHead: boolean
}

/** A scheduled flow: a placed process with its reveal / dissipate timing. */
export type FlowEvent = {
  id: number
  /** Index into {@link PROCESS_LIBRARY}. */
  process: number
  kind: FlowKind
  start: number
  /** Cell count (= reveal sweep length = `steps.length`). */
  N: number
  growDur: number
  /** Ephemeral dwell at full; `0` for persistent (it never dissipates). */
  hold: number
  /** Frame the flow frees its cells (`Infinity` for persistent). */
  occEnd: number
  /** Baked surface geometry (frame-independent) so render is O(active). */
  steps: PlacedFlowStep[]
}

const cellKey = (row: number, col: number): string => `${row},${col}`

// ── Colonization gate (Phase 3) ──────────────────────────────────────────────
// Flows live ONLY where the living grid has already colonized the surface (spec:
// «donde el grid toma la superficie»). A cell is open to a flow once the geodesic
// growth front has swept over its centre — i.e. the same {@link tissueMaskAt} the
// host shader blends with is at least {@link COLONIZE_GATE} there. Because that
// mask is monotonic in frame, a cell colonized at a flow's spawn stays colonized
// for the flow's whole life, so gating once at placement time keeps every live
// plate on grid that exists (no flow ever floats over un-colonized Earth). Before
// colonization begins the gate is empty (nothing spawns); after full coverage it
// is a no-op (the whole orb is open — the vast dense end state).

/**
 * Geodesic-mask level at/above which a cell counts as colonized and may host a
 * flow. At exactly the front (`d === frontRadius`) the mask is 0.5, so `>= 0.5`
 * means the cell centre lies inside (or on) the growth cap.
 */
export const COLONIZE_GATE = 0.5

/**
 * Whether the colonization front has reached cell (`row`, `col`)'s centre by
 * `frame` — the spawn gate. Pure: reads the same monotonic {@link tissueMaskAt}
 * the host shader blends with, so the schedule and the visible blend agree on
 * where the grid exists. `col` is taken already in-range for `row`.
 */
export function cellColonizedAt(row: number, col: number, frame: number): boolean {
  const sc = SURFACE_CELLS[cellIndex(row, col)]
  return tissueMaskAt(sc.lat, sc.lon, frame) >= COLONIZE_GATE
}

/** Lay a process's stages as a contiguous run of cells along band `row`. */
function placeSteps(process: Process, row: number, col0: number, dir: number): PlacedFlowStep[] {
  const cols = ROW_COLS[row]
  const steps: PlacedFlowStep[] = []
  let cursor = 0
  for (const stage of process.stages) {
    const span = stageSpan(stage)
    for (let k = 0; k < span; k += 1) {
      const col = mod(col0 + dir * cursor, cols)
      const idx = cellIndex(row, col)
      const sc = SURFACE_CELLS[idx]
      steps.push({
        cellIndex: idx,
        row,
        col,
        u: sc.u,
        v: sc.v,
        lat: sc.lat,
        lon: sc.lon,
        stage,
        isHead: k === 0,
      })
      cursor += 1
    }
  }
  return steps
}

/**
 * All `span` run cells in-ring, free, AND colonized at `frame`, with a 1-cell
 * gutter clear at each end. The colonization gate ({@link cellColonizedAt}) is
 * what confines a flow to the part of the ring the growth front has already taken.
 */
function runFits(
  row: number,
  col0: number,
  dir: number,
  span: number,
  occ: Set<string>,
  frame: number,
): boolean {
  const cols = ROW_COLS[row]
  if (cols - span < MIN_RING_GAP) return false
  for (let i = 0; i < span; i += 1) {
    const col = mod(col0 + dir * i, cols)
    if (occ.has(cellKey(row, col))) return false
    if (!cellColonizedAt(row, col, frame)) return false // flows live only on colonized grid
  }
  if (occ.has(cellKey(row, mod(col0 - dir, cols)))) return false
  if (occ.has(cellKey(row, mod(col0 + dir * span, cols)))) return false
  return true
}

/**
 * Resolve a non-overlapping placement (band + start column + travel direction)
 * for a flow of `span` cells **inside the colonized cap at `frame`**, or `null`
 * if the colonized field is momentarily full. Rows are weighted by their colonized
 * free capacity so flows fill in behind the advancing front (rather than clumping
 * in one band or — early on — failing across bare Earth); within the chosen ring a
 * colonized start column + a random direction is tried, up to {@link SEED_RETRY}
 * attempts, with `runFits` verifying the whole run + gutters. Once the orb is fully
 * colonized the gate is a no-op and this weights purely by free capacity, exactly
 * like `tejidoVivoScript.solvePlacement`.
 */
function solvePlacement(
  span: number,
  occ: Set<string>,
  rowOcc: number[],
  rng: () => number,
  frame: number,
): { row: number; col0: number; dir: number } | null {
  // Once the whole orb is colonized the gate can't reject anything → skip the
  // per-cell colonization scan (the post-colonization majority of the schedule).
  const fullyColonized = coverageAt(frame) >= 1

  const fitRows: { r: number; w: number; openCols: number[] | null }[] = []
  let totalW = 0
  for (let r = 0; r < ROWS; r += 1) {
    const cols = ROW_COLS[r]
    if (cols - span < MIN_RING_GAP) continue // ring can't host the run + gutters
    const free = cols - rowOcc[r]
    if (free <= span) continue // basically full
    if (fullyColonized) {
      fitRows.push({ r, w: free, openCols: null })
      totalW += free
      continue
    }
    // Gated: weight by (and remember) the colonized free columns so the random
    // probe lands on grid the front has already taken.
    const openCols: number[] = []
    for (let c = 0; c < cols; c += 1) {
      if (occ.has(cellKey(r, c))) continue
      if (cellColonizedAt(r, c, frame)) openCols.push(c)
    }
    if (openCols.length <= span) continue // not enough colonized room in this ring yet
    fitRows.push({ r, w: openCols.length, openCols })
    totalW += openCols.length
  }
  if (!fitRows.length || totalW <= 0) return null

  for (let attempt = 0; attempt < SEED_RETRY; attempt += 1) {
    let t = rng() * totalW
    let chosen = fitRows[0]
    for (const fr of fitRows) {
      t -= fr.w
      if (t <= 0) {
        chosen = fr
        break
      }
    }
    const cols = ROW_COLS[chosen.r]
    const dir = rng() < 0.5 ? 1 : -1
    const col0 = chosen.openCols
      ? chosen.openCols[Math.floor(rng() * chosen.openCols.length)]
      : Math.floor(rng() * cols)
    if (runFits(chosen.r, col0, dir, span, occ, frame)) return { row: chosen.r, col0, dir }
  }
  return null
}

/** Pick a process: persistent + a sprinkle of ephemerals are legible hero flows. */
function pickProcess(wantPersist: boolean, rng: () => number): Process {
  if (wantPersist || rng() < HERO_SPAWN_PROB) return HERO[Math.floor(rng() * HERO.length)]
  return GEN[Math.floor(rng() * GEN.length)]
}

/** Lifetime past which an ephemeral has fully retracted and frees its cells. */
function ephemeralOccEnd(start: number, growDur: number, hold: number, N: number): number {
  return start + growDur + hold + FADE + (N - 1) * RETRACT + 2
}

/**
 * Build the full master flow schedule by simulating the timeline forward: each
 * tick expires finished ephemerals (freeing their cells), then tops the live
 * count up toward a ramping concurrency target by placing fresh flows. A minority
 * calcify (persistent, never dissipate). Deterministic — one seeded stream, fixed
 * order — so the same `duration` always yields the same schedule.
 */
export function generateMaster(duration: number = FLOW_SCHEDULE_DURATION): FlowEvent[] {
  const rng = mulberry32(SCHEDULE_SEED)
  const events: FlowEvent[] = []
  let live: FlowEvent[] = []
  const persist: FlowEvent[] = []
  const occ = new Set<string>()
  const rowOcc = new Array<number>(ROWS).fill(0)
  let id = 0
  let persistCount = 0

  const addOcc = (ev: FlowEvent) => {
    for (const s of ev.steps) {
      occ.add(cellKey(s.row, s.col))
      rowOcc[s.row] += 1
    }
  }
  const freeOcc = (ev: FlowEvent) => {
    for (const s of ev.steps) {
      occ.delete(cellKey(s.row, s.col))
      rowOcc[s.row] -= 1
    }
  }

  const emitEnd = Math.min(EMIT_END, duration)
  for (let tick = EMIT_START; tick < emitEnd; tick += TICK_STEP) {
    const expired = live.filter((e) => e.occEnd <= tick)
    if (expired.length) {
      for (const e of expired) freeOcc(e)
      live = live.filter((e) => e.occEnd > tick)
    }

    const target = Math.round(TARGET_FLOWS * smoother(clamp01((tick - EMIT_START) / FILL_RAMP)))

    while (live.length + persist.length < target) {
      const wantPersist =
        persistCount < MAX_PERSIST && id % PERSIST_EVERY === 0 && tick < emitEnd - 200
      const process = pickProcess(wantPersist, rng)
      const span = processCellSpan(process)
      const off = solvePlacement(span, occ, rowOcc, rng, tick)
      if (!off) break // colonized field full this tick — natural back-pressure

      const steps = placeSteps(process, off.row, off.col0, off.dir)
      const N = steps.length
      const growDur = Math.max(1, N * PER_STEP_RUN)
      const hold = wantPersist ? 0 : HOLD_MIN + Math.floor(rng() * HOLD_JIT)
      const ev: FlowEvent = {
        id,
        process: process.id,
        kind: wantPersist ? 'persistent' : 'ephemeral',
        start: tick,
        N,
        growDur,
        hold,
        occEnd: wantPersist ? Infinity : ephemeralOccEnd(tick, growDur, hold, N),
        steps,
      }
      events.push(ev)
      addOcc(ev)
      id += 1
      if (wantPersist) {
        persist.push(ev)
        persistCount += 1
      } else {
        live.push(ev)
      }
    }
  }
  return events
}

/** The full flow schedule (generated once at module load, deterministic). */
export const MASTER: FlowEvent[] = generateMaster()
/** Total scheduled flows. */
export const FLOW_COUNT = MASTER.length

// ── Per-frame derivation (pure functions of frame) ───────────────────────────

/** Whether a flow occupies the surface at `frame`. */
export const isActive = (ev: FlowEvent, frame: number): boolean =>
  frame >= ev.start && frame < ev.occEnd

/** All flows live at `frame`. */
export function activeFlowsAt(frame: number): FlowEvent[] {
  return MASTER.filter((ev) => isActive(ev, frame))
}

/** Continuous head-first reveal front (0..N) for a flow at `frame`. */
export function flowRevealAt(ev: FlowEvent, frame: number): number {
  const age = frame - ev.start
  if (age <= 0) return 0
  return ev.N * smoother(clamp01(age / ev.growDur))
}

/** Per-cell dissipation 0 (alive) .. 1 (gone). Reverse order: the last cell first. */
export function flowStepDecayAt(ev: FlowEvent, frame: number, i: number): number {
  if (ev.kind === 'persistent') return 0
  const dissStart = ev.start + ev.growDur + ev.hold
  const ageD = frame - dissStart
  if (ageD <= 0) return 0
  return clamp01((ageD - (ev.N - 1 - i) * RETRACT) / FADE)
}

/**
 * Plate grow [0,1] for cell `i` of a flow at `frame`: it rises as the head-first
 * front crosses the cell ({@link flowRevealAt}), then falls during the reverse
 * dissipation ({@link flowStepDecayAt}). Persistent flows hold at 1 (calcified).
 * The bridge the pixel atlas (next task) reads to size each plate.
 */
export function flowCellGrowAt(ev: FlowEvent, frame: number, i: number): number {
  const revealed = clamp01(flowRevealAt(ev, frame) - i)
  if (revealed <= 0) return 0
  return clamp01(revealed * (1 - flowStepDecayAt(ev, frame, i)))
}

/** A live flow cell with its current grow — the atlas stamps these per frame. */
export type ActiveFlowCell = {
  flowId: number
  process: number
  stepIndex: number
  cellIndex: number
  row: number
  col: number
  u: number
  v: number
  lat: number
  lon: number
  stage: Stage
  isHead: boolean
  grow: number
}

/**
 * Every visible flow cell at `frame` with its grow [0,1] — the per-frame surface
 * state the atlas renders. Cells with negligible grow are skipped; no two active
 * flows share a cell (the placement solver guarantees it), so this is conflict-free.
 */
export function activeCellGrowsAt(frame: number): ActiveFlowCell[] {
  const out: ActiveFlowCell[] = []
  for (const ev of MASTER) {
    if (!isActive(ev, frame)) continue
    for (let i = 0; i < ev.steps.length; i += 1) {
      const grow = flowCellGrowAt(ev, frame, i)
      if (grow <= 0.001) continue
      const s = ev.steps[i]
      out.push({
        flowId: ev.id,
        process: ev.process,
        stepIndex: i,
        cellIndex: s.cellIndex,
        row: s.row,
        col: s.col,
        u: s.u,
        v: s.v,
        lat: s.lat,
        lon: s.lon,
        stage: s.stage,
        isHead: s.isHead,
        grow,
      })
    }
  }
  return out
}

// ── Helpers exposed for the test suite ───────────────────────────────────────

/** Live footprint cells at `frame` (union over active flows). */
export function occupancyAt(frame: number): Set<string> {
  const occ = new Set<string>()
  for (const ev of activeFlowsAt(frame)) for (const s of ev.steps) occ.add(cellKey(s.row, s.col))
  return occ
}

/** Total live flows at `frame`. */
export const liveCountAt = (frame: number): number => activeFlowsAt(frame).length
/** Live persistent (calcified) flows at `frame`. */
export const persistentCountAt = (frame: number): number =>
  activeFlowsAt(frame).filter((e) => e.kind === 'persistent').length
