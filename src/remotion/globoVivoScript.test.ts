import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CAMERA_FOV,
  CAMERA_Z,
  CLOUD_RADIUS_SCALE,
  CLOUD_ROT_PERIOD_FRAMES,
  COLONIZE_END_FRAME,
  COLONIZE_START_FRAME,
  EARTH_LAND_ROUGHNESS,
  EARTH_OCEAN_ROUGHNESS,
  EARTH_TEXTURES,
  EARTH_TILT_RAD,
  FPS,
  GLOBO_VIVO_DURATION,
  MASK_EDGE,
  ROT_PERIOD_FRAMES,
  SEED_LAT_DEG,
  SEED_LON_DEG,
  SPHERE_RADIUS,
  SPHERE_SEGMENTS,
  STUDIO_BG,
  clamp01,
  cloudYawAt,
  coverageAt,
  frontRadiusAt,
  geodesicDistance,
  lerp,
  maskUniformsAt,
  oceanRoughnessFromSpecular,
  smoothstep,
  sphereYawAt,
  tissueMaskAt,
  tissueMaskAtUV,
  BASE_NORMAL_SCALE,
  reliefStrengthAtUV,
  type MaskUniforms,
  // ── Phase 3: surface grid + flow schedule ──
  BAND_DEG,
  ROWS,
  COLS_EQ,
  MIN_COLS,
  SURFACE_CELLS,
  SURFACE_CELL_COUNT,
  ROW_COLS,
  ROW_START,
  rowCenterLat,
  colsInRow,
  hash01,
  lonLatToUV,
  uvToLonLat,
  cellIndex,
  buildSurfaceCells,
  smoother,
  FLOW_SCHEDULE_DURATION,
  MAX_PERSIST,
  MASTER,
  FLOW_COUNT,
  generateMaster,
  COLONIZE_GATE,
  cellColonizedAt,
  isActive,
  activeFlowsAt,
  flowRevealAt,
  flowStepDecayAt,
  flowCellGrowAt,
  activeCellGrowsAt,
  occupancyAt,
  liveCountAt,
  persistentCountAt,
  type FlowEvent,
  // ── Phase 4: cinematic orbital camera ──
  ORBIT_WIDE_RADIUS,
  ORBIT_NEAR_RADIUS,
  ORBIT_SURVEY_RADIUS,
  ORBIT_HOME_AZIMUTH_DEG,
  ORBIT_HOME_ELEVATION_DEG,
  DEFAULT_ORBIT_TRAVEL,
  ORBIT_RIG,
  orbitPosition,
  orbitTravelWindow,
  orbitPoseAt,
  driftedOrbitPose,
  buildOrbitRig,
  validateOrbitRig,
  type OrbitWaypoint,
  // ── Phase 4: seamless loop ──
  GLOBE_TURNS_PER_LOOP,
  SPIN_LOOPS_SEAMLESSLY,
} from './globoVivoScript'
import { PROCESS_LIBRARY, processCellSpan } from './processLibrary'
import { GRID_CELLS } from './tissueAtlas'

const TWO_PI = Math.PI * 2
const FRAMES = Array.from({ length: GLOBO_VIVO_DURATION }, (_, f) => f)

describe('globoVivoScript — Phase 1 constants', () => {
  it('declares a sane composition footprint (30fps, positive duration)', () => {
    expect(FPS).toBe(30)
    expect(GLOBO_VIVO_DURATION).toBeGreaterThan(0)
    expect(Number.isInteger(GLOBO_VIVO_DURATION)).toBe(true)
  })

  it('declares a valid sphere + static camera framing', () => {
    expect(SPHERE_RADIUS).toBeGreaterThan(0)
    // three.js needs ≥3 segments per ring; we want a smooth globe.
    expect(SPHERE_SEGMENTS).toBeGreaterThanOrEqual(16)
    expect(Number.isInteger(SPHERE_SEGMENTS)).toBe(true)
    // Camera must sit outside the sphere or it renders from inside.
    expect(CAMERA_Z).toBeGreaterThan(SPHERE_RADIUS)
    expect(CAMERA_FOV).toBeGreaterThan(0)
    expect(CAMERA_FOV).toBeLessThan(180)
  })

  it('uses the clean light neumorphic studio ground (#ffffff family, never cream)', () => {
    expect(STUDIO_BG).toMatch(/^#[0-9a-f]{6}$/i)
    // Reject the removed cream (#f4f1ea): warm grounds were dropped kit-wide.
    expect(STUDIO_BG.toLowerCase()).not.toBe('#f4f1ea')
    // Light ground: every channel should be near-white (>= 0xee).
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(STUDIO_BG.slice(i, i + 2), 16))
    expect(Math.min(r, g, b)).toBeGreaterThanOrEqual(0xee)
  })
})

describe('sphereYawAt — deterministic frame-driven rotation', () => {
  it('starts at zero yaw on frame 0', () => {
    expect(sphereYawAt(0)).toBe(0)
  })

  it('is a pure function: same frame → identical yaw across calls', () => {
    for (const f of FRAMES) {
      expect(sphereYawAt(f)).toBe(sphereYawAt(f))
    }
  })

  it('is strictly increasing frame to frame (visible spin, no stalls)', () => {
    for (let f = 1; f < GLOBO_VIVO_DURATION; f++) {
      expect(sphereYawAt(f)).toBeGreaterThan(sphereYawAt(f - 1))
    }
  })

  it('completes exactly one revolution per period (loop-friendly)', () => {
    expect(sphereYawAt(ROT_PERIOD_FRAMES)).toBeCloseTo(TWO_PI, 10)
    expect(sphereYawAt(ROT_PERIOD_FRAMES / 4)).toBeCloseTo(TWO_PI / 4, 10)
  })

  it('honours a custom period and scales linearly with frame', () => {
    expect(sphereYawAt(50, 100)).toBeCloseTo(Math.PI, 10)
    // Linearity: doubling the frame doubles the angle (no easing/jitter).
    expect(sphereYawAt(20)).toBeCloseTo(2 * sphereYawAt(10), 10)
  })

  it('produces only finite values across the whole timeline', () => {
    for (const f of FRAMES) {
      expect(Number.isFinite(sphereYawAt(f))).toBe(true)
    }
  })
})

describe('pure helpers', () => {
  it('clamp01 pins to [0,1]', () => {
    expect(clamp01(-0.5)).toBe(0)
    expect(clamp01(0.5)).toBe(0.5)
    expect(clamp01(1.5)).toBe(1)
  })

  it('lerp interpolates linearly', () => {
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 1)).toBe(10)
  })
})

// A fine lat/lon sampling of the whole sphere, used to exercise the per-texel
// mask across the surface (not just the seed/antipode).
const LAT_LONS: Array<[number, number]> = []
for (let lat = -80; lat <= 80; lat += 20) {
  for (let lon = -160; lon <= 160; lon += 40) {
    LAT_LONS.push([lat, lon])
  }
}

describe('smoothstep — eased 0→1 ramp', () => {
  it('clamps below edge0 and above edge1', () => {
    expect(smoothstep(10, 20, 5)).toBe(0)
    expect(smoothstep(10, 20, 25)).toBe(1)
    expect(smoothstep(10, 20, 10)).toBe(0)
    expect(smoothstep(10, 20, 20)).toBe(1)
  })

  it('hits 0.5 at the midpoint and is symmetric about it', () => {
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 12)
    const below = smoothstep(0, 1, 0.3)
    const above = smoothstep(0, 1, 0.7)
    expect(below + above).toBeCloseTo(1, 12)
  })

  it('is monotonic non-decreasing across the ramp', () => {
    let prev = -Infinity
    for (let x = -2; x <= 22; x += 0.25) {
      const y = smoothstep(0, 20, x)
      expect(y).toBeGreaterThanOrEqual(prev)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
      prev = y
    }
  })

  it('degenerates to a hard step when edges coincide', () => {
    expect(smoothstep(5, 5, 4.9)).toBe(0)
    expect(smoothstep(5, 5, 5)).toBe(1)
    expect(smoothstep(5, 5, 5.1)).toBe(1)
  })
})

describe('geodesicDistance — great-circle angular distance', () => {
  it('is zero to itself', () => {
    // acos is ill-conditioned at its domain edge (cos≈1), so a self-distance
    // carries ~1e-8 rad of float noise — still ~0.0000009°, visually exact.
    expect(geodesicDistance(SEED_LAT_DEG, SEED_LON_DEG, SEED_LAT_DEG, SEED_LON_DEG)).toBeCloseTo(0, 6)
    // Identical integer inputs are bit-exact (acos(1) === 0).
    expect(geodesicDistance(0, 0, 0, 0)).toBe(0)
  })

  it('is π to the antipode', () => {
    expect(geodesicDistance(0, 0, 0, 180)).toBeCloseTo(Math.PI, 9)
    // Off-axis antipode: same edge-of-domain conditioning as above (~1e-8 rad).
    expect(geodesicDistance(18, -4, -18, 176)).toBeCloseTo(Math.PI, 6)
  })

  it('matches known quarter/eighth turns (equator + pole)', () => {
    // 90° of longitude on the equator = a quarter great circle.
    expect(geodesicDistance(0, 0, 0, 90)).toBeCloseTo(Math.PI / 2, 9)
    // Equator to the north pole = a quarter turn regardless of longitude.
    expect(geodesicDistance(0, 37, 90, 0)).toBeCloseTo(Math.PI / 2, 9)
    expect(geodesicDistance(0, 0, 0, 45)).toBeCloseTo(Math.PI / 4, 9)
  })

  it('is symmetric in its two points', () => {
    for (const [lat, lon] of LAT_LONS) {
      const ab = geodesicDistance(lat, lon, SEED_LAT_DEG, SEED_LON_DEG)
      const ba = geodesicDistance(SEED_LAT_DEG, SEED_LON_DEG, lat, lon)
      expect(ab).toBeCloseTo(ba, 12)
    }
  })

  it('always returns a finite value in [0, π] (no acos-domain NaN)', () => {
    for (const [lat, lon] of LAT_LONS) {
      for (const [lat2, lon2] of LAT_LONS) {
        const d = geodesicDistance(lat, lon, lat2, lon2)
        expect(Number.isFinite(d)).toBe(true)
        expect(d).toBeGreaterThanOrEqual(0)
        expect(d).toBeLessThanOrEqual(Math.PI + 1e-9)
      }
    }
  })
})

describe('coverageAt — colonized area fraction', () => {
  it('declares a valid colonization window inside the duration', () => {
    expect(COLONIZE_START_FRAME).toBeGreaterThanOrEqual(0)
    expect(COLONIZE_END_FRAME).toBeGreaterThan(COLONIZE_START_FRAME)
    expect(COLONIZE_END_FRAME).toBeLessThanOrEqual(GLOBO_VIVO_DURATION)
  })

  it('is exactly 0 before START and exactly 1 after END (pure Earth → full grid)', () => {
    expect(coverageAt(0)).toBe(0)
    expect(coverageAt(COLONIZE_START_FRAME)).toBe(0)
    expect(coverageAt(COLONIZE_END_FRAME)).toBe(1)
    expect(coverageAt(GLOBO_VIVO_DURATION)).toBe(1)
    expect(coverageAt(COLONIZE_END_FRAME + 50)).toBe(1)
  })

  it('is monotonic non-decreasing seed→full across the whole timeline', () => {
    for (let f = 1; f <= GLOBO_VIVO_DURATION; f++) {
      expect(coverageAt(f)).toBeGreaterThanOrEqual(coverageAt(f - 1))
    }
  })

  it('passes through ~0.5 near the middle of the window and stays in [0,1]', () => {
    const mid = (COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2
    expect(coverageAt(mid)).toBeCloseTo(0.5, 9)
    for (let f = 0; f <= GLOBO_VIVO_DURATION; f++) {
      const c = coverageAt(f)
      expect(c).toBeGreaterThanOrEqual(0)
      expect(c).toBeLessThanOrEqual(1)
    }
  })
})

describe('frontRadiusAt — geodesic cap radius matching coverage', () => {
  it('grows 0 → π across the colonization window', () => {
    expect(frontRadiusAt(COLONIZE_START_FRAME)).toBeCloseTo(0, 9)
    expect(frontRadiusAt(COLONIZE_END_FRAME)).toBeCloseTo(Math.PI, 9)
  })

  it('is a hemisphere (π/2) at half coverage', () => {
    const mid = (COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2
    expect(frontRadiusAt(mid)).toBeCloseTo(Math.PI / 2, 6)
  })

  it('keeps the cap AREA equal to coverage: (1 − cos r)/2 === coverageAt', () => {
    for (let f = 0; f <= GLOBO_VIVO_DURATION; f++) {
      const r = frontRadiusAt(f)
      const capFraction = (1 - Math.cos(r)) / 2
      expect(capFraction).toBeCloseTo(coverageAt(f), 9)
    }
  })

  it('is monotonic non-decreasing in frame', () => {
    for (let f = 1; f <= GLOBO_VIVO_DURATION; f++) {
      expect(frontRadiusAt(f)).toBeGreaterThanOrEqual(frontRadiusAt(f - 1) - 1e-12)
    }
  })
})

describe('tissueMaskAt — per-texel Earth↔grid blend', () => {
  it('is pure Earth (0) everywhere before colonization starts', () => {
    for (const [lat, lon] of LAT_LONS) {
      expect(tissueMaskAt(lat, lon, 0)).toBe(0)
      expect(tissueMaskAt(lat, lon, COLONIZE_START_FRAME)).toBe(0)
    }
  })

  it('is full grid (1) everywhere after colonization ends', () => {
    for (const [lat, lon] of LAT_LONS) {
      expect(tissueMaskAt(lat, lon, COLONIZE_END_FRAME)).toBe(1)
      expect(tissueMaskAt(lat, lon, GLOBO_VIVO_DURATION)).toBe(1)
    }
  })

  it('the seed colonizes before the antipode (geodesic ordering)', () => {
    const antipodeLat = -SEED_LAT_DEG
    const antipodeLon = SEED_LON_DEG + 180
    let seedEverAhead = false
    for (let f = COLONIZE_START_FRAME; f <= COLONIZE_END_FRAME; f++) {
      const atSeed = tissueMaskAt(SEED_LAT_DEG, SEED_LON_DEG, f)
      const atAntipode = tissueMaskAt(antipodeLat, antipodeLon, f)
      // Nearer the seed is never colonized later than the far antipode.
      expect(atSeed).toBeGreaterThanOrEqual(atAntipode - 1e-9)
      if (atSeed > atAntipode + 1e-6) seedEverAhead = true
    }
    // And there is a genuine moment where the seed leads (not a flat tie).
    expect(seedEverAhead).toBe(true)
  })

  it('respects geodesic distance: nearer texels colonize no later than farther ones', () => {
    const mid = (COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2
    const sorted = [...LAT_LONS].sort(
      (a, b) =>
        geodesicDistance(a[0], a[1], SEED_LAT_DEG, SEED_LON_DEG) -
        geodesicDistance(b[0], b[1], SEED_LAT_DEG, SEED_LON_DEG),
    )
    for (let i = 1; i < sorted.length; i++) {
      const near = tissueMaskAt(sorted[i - 1][0], sorted[i - 1][1], mid)
      const far = tissueMaskAt(sorted[i][0], sorted[i][1], mid)
      expect(near).toBeGreaterThanOrEqual(far - 1e-9)
    }
  })

  it('is monotonic non-decreasing in frame for every fixed (lat, lon)', () => {
    for (const [lat, lon] of LAT_LONS) {
      for (let f = 1; f <= GLOBO_VIVO_DURATION; f++) {
        expect(tissueMaskAt(lat, lon, f)).toBeGreaterThanOrEqual(
          tissueMaskAt(lat, lon, f - 1) - 1e-12,
        )
      }
    }
  })

  it('stays a finite blend weight in [0,1] across surface × timeline', () => {
    for (const [lat, lon] of LAT_LONS) {
      for (let f = 0; f <= GLOBO_VIVO_DURATION; f++) {
        const m = tissueMaskAt(lat, lon, f)
        expect(Number.isFinite(m)).toBe(true)
        expect(m).toBeGreaterThanOrEqual(0)
        expect(m).toBeLessThanOrEqual(1)
      }
    }
  })

  it('is deterministic: same (lat, lon, frame) → identical mask across calls', () => {
    for (const [lat, lon] of LAT_LONS) {
      const f = (COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2
      expect(tissueMaskAt(lat, lon, f)).toBe(tissueMaskAt(lat, lon, f))
    }
  })

  it('has a soft front band, not a hard binary edge', () => {
    // Somewhere in the window, some texel sits mid-dissolve (0 < mask < 1).
    let sawSoft = false
    for (let f = COLONIZE_START_FRAME + 1; f < COLONIZE_END_FRAME; f++) {
      for (const [lat, lon] of LAT_LONS) {
        const m = tissueMaskAt(lat, lon, f)
        if (m > 0.02 && m < 0.98) {
          sawSoft = true
          break
        }
      }
      if (sawSoft) break
    }
    expect(sawSoft).toBe(true)
    // The softness comes from a positive front half-width.
    expect(MASK_EDGE).toBeGreaterThan(0)
  })
})

describe('Earth maps — Phase 2 vendored texture set', () => {
  it('declares all five NASA Blue Marble maps under public/globoVivo (staticFile-ready)', () => {
    const keys = Object.keys(EARTH_TEXTURES)
    expect(keys.sort()).toEqual(['clouds', 'color', 'night', 'normal', 'specular'])
    for (const path of Object.values(EARTH_TEXTURES)) {
      // Relative to public/: no leading slash, no public/ prefix, lives in globoVivo/.
      expect(path).toMatch(/^globoVivo\/earth-[a-z]+\.(jpg|png)$/)
      expect(path.startsWith('/')).toBe(false)
      expect(path.startsWith('public/')).toBe(false)
    }
  })

  it('declares a believable axial tilt and a cloud shell above the surface', () => {
    // ≈ 23.44° in radians.
    expect(EARTH_TILT_RAD).toBeCloseTo((23.44 * Math.PI) / 180, 12)
    expect(EARTH_TILT_RAD).toBeGreaterThan(0)
    // Clouds float just outside the surface (a thin shell, not a balloon).
    expect(CLOUD_RADIUS_SCALE).toBeGreaterThan(1)
    expect(CLOUD_RADIUS_SCALE).toBeLessThan(1.1)
  })
})

describe('cloudYawAt — deterministic cloud-shell parallax', () => {
  it('starts at zero yaw on frame 0', () => {
    expect(cloudYawAt(0)).toBe(0)
  })

  it('is strictly increasing frame to frame (no stalls)', () => {
    for (let f = 1; f < GLOBO_VIVO_DURATION; f++) {
      expect(cloudYawAt(f)).toBeGreaterThan(cloudYawAt(f - 1))
    }
  })

  it('leads the surface — clouds spin faster than the ground (parallax)', () => {
    expect(CLOUD_ROT_PERIOD_FRAMES).toBeLessThan(ROT_PERIOD_FRAMES)
    for (let f = 1; f < GLOBO_VIVO_DURATION; f++) {
      expect(cloudYawAt(f)).toBeGreaterThan(sphereYawAt(f))
    }
  })

  it('completes one revolution per cloud period and stays finite', () => {
    expect(cloudYawAt(CLOUD_ROT_PERIOD_FRAMES)).toBeCloseTo(Math.PI * 2, 10)
    for (let f = 0; f < GLOBO_VIVO_DURATION; f++) {
      expect(Number.isFinite(cloudYawAt(f))).toBe(true)
    }
  })
})

describe('oceanRoughnessFromSpecular — glossy oceans, matte land', () => {
  it('inverts polarity: specular≈1 (ocean) → glossy, specular≈0 (land) → matte', () => {
    expect(oceanRoughnessFromSpecular(0)).toBeCloseTo(EARTH_LAND_ROUGHNESS, 12)
    expect(oceanRoughnessFromSpecular(1)).toBeCloseTo(EARTH_OCEAN_ROUGHNESS, 12)
    // Oceans must be glossier (lower roughness) than land.
    expect(EARTH_OCEAN_ROUGHNESS).toBeLessThan(EARTH_LAND_ROUGHNESS)
  })

  it('is monotonic decreasing in specular luminance', () => {
    let prev = Infinity
    for (let s = 0; s <= 1; s += 0.05) {
      const r = oceanRoughnessFromSpecular(s)
      expect(r).toBeLessThanOrEqual(prev + 1e-12)
      prev = r
    }
  })

  it('hits the midpoint at half luminance and clamps out-of-range input', () => {
    expect(oceanRoughnessFromSpecular(0.5)).toBeCloseTo((EARTH_LAND_ROUGHNESS + EARTH_OCEAN_ROUGHNESS) / 2, 12)
    // Out-of-domain luminance (float noise / over-bright pixels) is clamped.
    expect(oceanRoughnessFromSpecular(-0.5)).toBeCloseTo(EARTH_LAND_ROUGHNESS, 12)
    expect(oceanRoughnessFromSpecular(1.5)).toBeCloseTo(EARTH_OCEAN_ROUGHNESS, 12)
  })

  it('always returns a valid roughness in [0,1]', () => {
    for (let s = -0.2; s <= 1.2; s += 0.1) {
      const r = oceanRoughnessFromSpecular(s)
      expect(r).toBeGreaterThanOrEqual(0)
      expect(r).toBeLessThanOrEqual(1)
    }
  })
})

// A fine sampling of the equirectangular UV square, kept off the exact poles /
// seam so the acos great-circle math is well away from its ill-conditioned edge.
const UVS: Array<[number, number]> = []
for (let u = 0.05; u <= 0.95; u += 0.1) {
  for (let v = 0.05; v <= 0.95; v += 0.1) {
    UVS.push([Number(u.toFixed(3)), Number(v.toFixed(3))])
  }
}

describe('tissueMaskAtUV — equirectangular UV twin of the GLSL blend', () => {
  it('equals tissueMaskAt at the converted (lat, lon) for the whole surface × timeline', () => {
    // The host injects a GLSL mirror of this; proving the twin agrees with the
    // canonical lat/lon mask validates both the UV→lon/lat convention and the
    // geodesic math the shader runs.
    for (const [u, v] of UVS) {
      const lon = u * 360 - 180
      const lat = 90 - v * 180
      for (let f = 0; f <= GLOBO_VIVO_DURATION; f += 3) {
        expect(tissueMaskAtUV(u, v, f)).toBeCloseTo(tissueMaskAt(lat, lon, f), 12)
      }
    }
  })

  it('is pure Earth (0) before colonization and full grid (1) after it ends', () => {
    for (const [u, v] of UVS) {
      expect(tissueMaskAtUV(u, v, 0)).toBe(0)
      expect(tissueMaskAtUV(u, v, COLONIZE_START_FRAME)).toBe(0)
      expect(tissueMaskAtUV(u, v, COLONIZE_END_FRAME)).toBe(1)
      expect(tissueMaskAtUV(u, v, GLOBO_VIVO_DURATION)).toBe(1)
    }
  })

  it('is monotonic non-decreasing in frame for every fixed UV (grid never recedes)', () => {
    for (const [u, v] of UVS) {
      for (let f = 1; f <= GLOBO_VIVO_DURATION; f++) {
        expect(tissueMaskAtUV(u, v, f)).toBeGreaterThanOrEqual(tissueMaskAtUV(u, v, f - 1) - 1e-12)
      }
    }
  })

  it('stays a finite blend weight in [0,1] and is deterministic across calls', () => {
    const mid = (COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2
    for (const [u, v] of UVS) {
      for (let f = 0; f <= GLOBO_VIVO_DURATION; f += 5) {
        const m = tissueMaskAtUV(u, v, f)
        expect(Number.isFinite(m)).toBe(true)
        expect(m).toBeGreaterThanOrEqual(0)
        expect(m).toBeLessThanOrEqual(1)
      }
      expect(tissueMaskAtUV(u, v, mid)).toBe(tissueMaskAtUV(u, v, mid))
    }
  })
})

/**
 * Re-implements the injected GLSL ({@link GV_MASK_BLEND_GLSL} in the host) purely
 * from a {@link MaskUniforms} snapshot — same hard endpoints, same
 * spherical-law-of-cosines distance, same soft front. If this reproduces
 * `tissueMaskAtUV`, the uniforms carry everything the shader needs and the GLSL
 * formula matches the canonical twin.
 */
function shaderMaskFromUniforms(u: number, v: number, m: MaskUniforms): number {
  if (m.coverage >= 1) return 1
  if (m.coverage <= 0) return 0
  const D2R = Math.PI / 180
  const lon = u * 360 - 180
  const lat = 90 - v * 180
  const latR = lat * D2R
  const dLon = (lon - m.seedLonDeg) * D2R
  let cos = Math.sin(latR) * Math.sin(m.seedLatRad) + Math.cos(latR) * Math.cos(m.seedLatRad) * Math.cos(dLon)
  cos = cos < -1 ? -1 : cos > 1 ? 1 : cos
  const d = Math.acos(cos)
  return 1 - smoothstep(m.frontRadius - m.maskEdge, m.frontRadius + m.maskEdge, d)
}

describe('maskUniformsAt — per-frame shader uniforms', () => {
  it('mirrors the frame-driven coverage / front radius exactly', () => {
    for (let f = 0; f <= GLOBO_VIVO_DURATION; f++) {
      const m = maskUniformsAt(f)
      expect(m.coverage).toBe(coverageAt(f))
      expect(m.frontRadius).toBe(frontRadiusAt(f))
    }
  })

  it('carries the frame-independent constants (edge + seed, in shader units)', () => {
    const a = maskUniformsAt(0)
    const b = maskUniformsAt(GLOBO_VIVO_DURATION)
    expect(a.maskEdge).toBe(MASK_EDGE)
    expect(a.seedLatRad).toBeCloseTo((SEED_LAT_DEG * Math.PI) / 180, 12)
    expect(a.seedLonDeg).toBe(SEED_LON_DEG)
    // Constant across frames (the host need not re-upload them per frame).
    expect(b.maskEdge).toBe(a.maskEdge)
    expect(b.seedLatRad).toBe(a.seedLatRad)
    expect(b.seedLonDeg).toBe(a.seedLonDeg)
  })

  it('is deterministic: same frame → identical uniform snapshot', () => {
    for (let f = 0; f <= GLOBO_VIVO_DURATION; f += 7) {
      expect(maskUniformsAt(f)).toEqual(maskUniformsAt(f))
    }
  })

  it('reproduces tissueMaskAtUV when the GLSL formula is re-run from the uniforms', () => {
    for (let f = 0; f <= GLOBO_VIVO_DURATION; f += 3) {
      const m = maskUniformsAt(f)
      for (const [u, v] of UVS) {
        expect(shaderMaskFromUniforms(u, v, m)).toBeCloseTo(tissueMaskAtUV(u, v, f), 12)
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 3 — surface grid (cosine-banded equirectangular cells)
// ════════════════════════════════════════════════════════════════════════════

describe('cosine-banded surface grid', () => {
  it('derives row/column counts from the band size', () => {
    expect(ROWS).toBe(Math.round(180 / BAND_DEG))
    expect(COLS_EQ).toBe(Math.round(360 / BAND_DEG))
    expect(ROWS).toBeGreaterThan(1)
  })

  it('rowCenterLat stays strictly inside the poles and steps north → south', () => {
    for (let r = 0; r < ROWS; r += 1) {
      const lat = rowCenterLat(r)
      expect(lat).toBeGreaterThan(-90)
      expect(lat).toBeLessThan(90)
      if (r > 0) expect(lat).toBeLessThan(rowCenterLat(r - 1))
    }
  })

  it('colsInRow peaks near the equator, clamps to [MIN_COLS, COLS_EQ], is symmetric', () => {
    for (let r = 0; r < ROWS; r += 1) {
      const c = colsInRow(r)
      expect(c).toBeGreaterThanOrEqual(MIN_COLS)
      expect(c).toBeLessThanOrEqual(COLS_EQ)
      expect(Number.isInteger(c)).toBe(true)
      // Mirror band: north/south symmetry about the equator.
      expect(colsInRow(r)).toBe(colsInRow(ROWS - 1 - r))
    }
    const equatorRow = Math.floor(ROWS / 2)
    expect(colsInRow(equatorRow)).toBeGreaterThan(colsInRow(0))
  })

  it('lonLatToUV / uvToLonLat round-trip across the globe', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -160; lon <= 160; lon += 40) {
        const [u, v] = lonLatToUV(lon, lat)
        const [lon2, lat2] = uvToLonLat(u, v)
        expect(lon2).toBeCloseTo(lon, 9)
        expect(lat2).toBeCloseTo(lat, 9)
      }
    }
  })

  it('hash01 returns [0,1) deterministically and decorrelates neighbours', () => {
    expect(hash01(3, 4)).toBe(hash01(3, 4))
    expect(hash01(3, 4)).not.toBe(hash01(3, 5))
    for (let a = 0; a < 6; a += 1)
      for (let b = 0; b < 6; b += 1) {
        const v = hash01(a, b)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
      }
  })

  it('SURFACE_CELLS has exactly Σ colsInRow cells, all valid', () => {
    let expected = 0
    for (let r = 0; r < ROWS; r += 1) expected += colsInRow(r)
    expect(SURFACE_CELL_COUNT).toBe(expected)
    expect(SURFACE_CELLS.length).toBe(expected)
    expect(SURFACE_CELL_COUNT).toBeGreaterThan(100) // "muchísimos procesos minúsculos"
    for (const cell of SURFACE_CELLS) {
      expect(cell.lat).toBeGreaterThan(-90)
      expect(cell.lat).toBeLessThan(90)
      expect(cell.lon).toBeGreaterThanOrEqual(-180)
      expect(cell.lon).toBeLessThanOrEqual(180)
      expect(cell.u).toBeGreaterThanOrEqual(0)
      expect(cell.u).toBeLessThanOrEqual(1)
      expect(cell.v).toBeGreaterThanOrEqual(0)
      expect(cell.v).toBeLessThanOrEqual(1)
    }
  })

  it('buildSurfaceCells is deterministic (a fresh build equals SURFACE_CELLS)', () => {
    expect(buildSurfaceCells()).toEqual(SURFACE_CELLS)
  })

  it('ROW_COLS / ROW_START / cellIndex address every cell exactly once', () => {
    expect(ROW_COLS.length).toBe(ROWS)
    for (let r = 0; r < ROWS; r += 1) expect(ROW_COLS[r]).toBe(colsInRow(r))
    // Prefix sum: each band starts right after the previous one ends.
    let acc = 0
    for (let r = 0; r < ROWS; r += 1) {
      expect(ROW_START[r]).toBe(acc)
      acc += ROW_COLS[r]
    }
    expect(acc).toBe(SURFACE_CELL_COUNT)
    // cellIndex(row,col) round-trips to the right SURFACE_CELLS entry.
    for (let r = 0; r < ROWS; r += 1) {
      for (let c = 0; c < ROW_COLS[r]; c += 1) {
        const idx = cellIndex(r, c)
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(SURFACE_CELL_COUNT)
        expect(SURFACE_CELLS[idx].row).toBe(r)
        expect(SURFACE_CELLS[idx].col).toBe(c)
      }
    }
  })

  it('is the single source of truth: tissueAtlas GRID_CELLS share its logical fields', () => {
    expect(GRID_CELLS.length).toBe(SURFACE_CELL_COUNT)
    for (let i = 0; i < SURFACE_CELL_COUNT; i += 1) {
      const s = SURFACE_CELLS[i]
      const g = GRID_CELLS[i]
      expect(g.row).toBe(s.row)
      expect(g.col).toBe(s.col)
      expect(g.lat).toBe(s.lat)
      expect(g.lon).toBe(s.lon)
      expect(g.u).toBe(s.u)
      expect(g.v).toBe(s.v)
      expect(g.seedPhase).toBe(s.seedPhase)
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 3 — flow schedule (placement + reveal/decay + persistence)
// ════════════════════════════════════════════════════════════════════════════

const SCHEDULE_FRAMES = Array.from({ length: 19 }, (_, i) => Math.round((i / 18) * (FLOW_SCHEDULE_DURATION - 1)))
const firstPersistent = (): FlowEvent => {
  const ev = MASTER.find((e) => e.kind === 'persistent')
  if (!ev) throw new Error('expected at least one persistent flow')
  return ev
}
const firstEphemeral = (): FlowEvent => {
  const ev = MASTER.find((e) => e.kind === 'ephemeral')
  if (!ev) throw new Error('expected at least one ephemeral flow')
  return ev
}

describe('smoother — quintic ease (no jerk)', () => {
  it('pins the ends and passes through 0.5 at the midpoint, clamping out of range', () => {
    expect(smoother(0)).toBe(0)
    expect(smoother(1)).toBe(1)
    expect(smoother(0.5)).toBeCloseTo(0.5, 12)
    expect(smoother(-1)).toBe(0)
    expect(smoother(2)).toBe(1)
  })

  it('is monotonic non-decreasing', () => {
    let prev = -Infinity
    for (let x = -0.2; x <= 1.2; x += 0.05) {
      const y = smoother(x)
      expect(y).toBeGreaterThanOrEqual(prev - 1e-12)
      prev = y
    }
  })
})

describe('generateMaster — deterministic schedule', () => {
  it('produces a non-empty schedule (MASTER === default generateMaster)', () => {
    expect(FLOW_COUNT).toBe(MASTER.length)
    expect(FLOW_COUNT).toBeGreaterThan(0)
    expect(generateMaster()).toEqual(MASTER)
  })

  it('is byte-for-byte deterministic across runs (no Date.now / Math.random)', () => {
    expect(generateMaster(450)).toEqual(generateMaster(450))
  })

  it('scales with duration: every flow starts within its span, longer ⇒ more flows', () => {
    const shortSched = generateMaster(200)
    const longSched = generateMaster(900)
    for (const e of shortSched) {
      expect(e.start).toBeGreaterThanOrEqual(0)
      expect(e.start).toBeLessThan(200)
      expect(e.occEnd).toBeGreaterThan(e.start)
    }
    expect(longSched.length).toBeGreaterThan(shortSched.length)
  })

  it('calcifies a real but minority persistent lattice', () => {
    const persistent = MASTER.filter((e) => e.kind === 'persistent')
    expect(persistent.length).toBeGreaterThan(0)
    expect(persistent.length).toBeLessThanOrEqual(MAX_PERSIST)
    // Persistent flows are a minority of the whole schedule.
    expect(persistent.length).toBeLessThan(MASTER.length / 2)
    for (const e of persistent) expect(e.occEnd).toBe(Infinity)
  })
})

describe('flow placement — contiguous, in-bounds, non-overlapping', () => {
  // Heavy per-flow checks on a representative sample + both kinds.
  const sample = MASTER.filter((_, i) => i % 7 === 0).concat(firstPersistent(), firstEphemeral())

  it('every flow lays a contiguous ring run matching its process span', () => {
    for (const ev of sample) {
      const proc = PROCESS_LIBRARY[ev.process]
      expect(proc).toBeDefined()
      expect(ev.steps.length).toBe(ev.N)
      expect(ev.steps.length).toBe(processCellSpan(proc))
      // One head per stage (an action spans 2 cells; only its first is the head).
      expect(ev.steps.filter((s) => s.isHead).length).toBe(proc.stages.length)

      const row = ev.steps[0].row
      const cols = ROW_COLS[row]
      const seen = new Set<number>()
      for (let i = 0; i < ev.steps.length; i += 1) {
        const s = ev.steps[i]
        // All cells in ONE band ring, addressed consistently.
        expect(s.row).toBe(row)
        expect(s.col).toBeGreaterThanOrEqual(0)
        expect(s.col).toBeLessThan(cols)
        expect(cellIndex(s.row, s.col)).toBe(s.cellIndex)
        expect(SURFACE_CELLS[s.cellIndex].row).toBe(s.row)
        expect(SURFACE_CELLS[s.cellIndex].col).toBe(s.col)
        seen.add(s.cellIndex)
        // Consecutive cells are ring-adjacent (Δcol = 1, or the seam wrap cols−1).
        if (i > 0) {
          const d = Math.abs(s.col - ev.steps[i - 1].col)
          expect(d === 1 || d === cols - 1).toBe(true)
        }
      }
      // No cell repeats within a flow.
      expect(seen.size).toBe(ev.steps.length)
    }
  })

  it('never overlaps another LIVE flow at any frame (cell ⇒ ≤ 1 active flow)', () => {
    for (const f of SCHEDULE_FRAMES) {
      const flows = activeFlowsAt(f)
      const totalCells = flows.reduce((n, e) => n + e.steps.length, 0)
      // If footprints never collide, the union size equals the raw cell sum.
      expect(occupancyAt(f).size).toBe(totalCells)
    }
  })

  it('fills the surface densely toward the middle of the schedule', () => {
    let peak = 0
    let peakLive = 0
    for (let f = 0; f < FLOW_SCHEDULE_DURATION; f += 15) {
      peak = Math.max(peak, occupancyAt(f).size)
      peakLive = Math.max(peakLive, liveCountAt(f))
    }
    // A substantial fraction of the orb runs processes at once ("muchísimos").
    expect(peak).toBeGreaterThan(0.3 * SURFACE_CELL_COUNT)
    expect(peakLive).toBeGreaterThanOrEqual(40)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 3 — colonization gate (flows live ONLY where the grid has colonized)
// ════════════════════════════════════════════════════════════════════════════

describe('cellColonizedAt — the per-cell spawn gate', () => {
  it('gates at the front midpoint (mask 0.5 == the cap edge)', () => {
    expect(COLONIZE_GATE).toBe(0.5)
  })

  it('agrees with tissueMaskAt ≥ COLONIZE_GATE for sampled cells × frames', () => {
    for (let f = 0; f <= FLOW_SCHEDULE_DURATION; f += 11) {
      for (let i = 0; i < SURFACE_CELLS.length; i += 17) {
        const c = SURFACE_CELLS[i]
        expect(cellColonizedAt(c.row, c.col, f)).toBe(tissueMaskAt(c.lat, c.lon, f) >= COLONIZE_GATE)
      }
    }
  })

  it('is empty before colonization and full once it completes', () => {
    for (const c of SURFACE_CELLS) {
      expect(cellColonizedAt(c.row, c.col, 0)).toBe(false)
      expect(cellColonizedAt(c.row, c.col, COLONIZE_START_FRAME)).toBe(false)
      expect(cellColonizedAt(c.row, c.col, COLONIZE_END_FRAME)).toBe(true)
      expect(cellColonizedAt(c.row, c.col, FLOW_SCHEDULE_DURATION - 1)).toBe(true)
    }
  })

  it('never un-colonizes: once a cell is open it stays open (monotonic in frame)', () => {
    for (let i = 0; i < SURFACE_CELLS.length; i += 13) {
      const c = SURFACE_CELLS[i]
      let wasOpen = false
      for (let f = 0; f <= FLOW_SCHEDULE_DURATION; f += 5) {
        const now = cellColonizedAt(c.row, c.col, f)
        if (wasOpen) expect(now).toBe(true)
        wasOpen = wasOpen || now
      }
    }
  })

  it('opens the nearest cell to the seed no later than the farthest one', () => {
    let near = SURFACE_CELLS[0]
    let far = SURFACE_CELLS[0]
    let dMin = Infinity
    let dMax = -Infinity
    for (const c of SURFACE_CELLS) {
      const d = geodesicDistance(c.lat, c.lon, SEED_LAT_DEG, SEED_LON_DEG)
      if (d < dMin) {
        dMin = d
        near = c
      }
      if (d > dMax) {
        dMax = d
        far = c
      }
    }
    const firstOpen = (cell: typeof near): number => {
      for (let f = 0; f <= FLOW_SCHEDULE_DURATION; f += 1) if (cellColonizedAt(cell.row, cell.col, f)) return f
      return Infinity
    }
    expect(firstOpen(near)).toBeLessThanOrEqual(firstOpen(far))
  })

  it('is deterministic: same (cell, frame) → identical gate across calls', () => {
    const mid = Math.round((COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2)
    for (let i = 0; i < SURFACE_CELLS.length; i += 23) {
      const c = SURFACE_CELLS[i]
      expect(cellColonizedAt(c.row, c.col, mid)).toBe(cellColonizedAt(c.row, c.col, mid))
    }
  })
})

describe('flow schedule is gated to the colonized cap', () => {
  it('spawns no flow before colonization begins (coverage > 0 at every start)', () => {
    for (const e of MASTER) {
      expect(coverageAt(e.start)).toBeGreaterThan(0)
      // Coverage is exactly 0 up to and including COLONIZE_START_FRAME → no spawn there.
      expect(e.start).toBeGreaterThan(COLONIZE_START_FRAME)
    }
  })

  it('lays every flow only on cells already colonized at its spawn frame', () => {
    for (const e of MASTER) {
      for (const s of e.steps) {
        expect(cellColonizedAt(s.row, s.col, e.start)).toBe(true)
      }
    }
  })

  it('keeps every VISIBLE flow cell on colonized grid at the frame it shows', () => {
    // Spawn gate + mask-monotonicity: a flow placed on colonized grid never drifts
    // onto bare Earth, because the growth mask only ever advances.
    const frames: number[] = []
    for (let f = COLONIZE_START_FRAME; f <= COLONIZE_END_FRAME; f += 2) frames.push(f) // dense over colonization
    for (let f = COLONIZE_END_FRAME + 7; f < FLOW_SCHEDULE_DURATION; f += 37) frames.push(f)
    for (const f of frames) {
      for (const c of activeCellGrowsAt(f)) {
        expect(cellColonizedAt(c.row, c.col, f)).toBe(true)
      }
    }
  })

  it('confines the live footprint inside the growth cap during colonization', () => {
    // Independent cross-check (raw geodesic, not via cellColonizedAt): every active
    // cell sits within the front radius of the seed, and the orb is already alive.
    let sawActivity = false
    for (let f = COLONIZE_START_FRAME; f < COLONIZE_END_FRAME; f += 1) {
      const front = frontRadiusAt(f)
      const cells = activeCellGrowsAt(f)
      if (cells.length) sawActivity = true
      for (const c of cells) {
        expect(geodesicDistance(c.lat, c.lon, SEED_LAT_DEG, SEED_LON_DEG)).toBeLessThanOrEqual(front + 1e-9)
      }
    }
    expect(sawActivity).toBe(true) // the tissue brota del punto semilla mid-colonization
  })

  it('rises in density from the colonizing orb to the vast end state', () => {
    const mid = Math.round((COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2)
    const earlyMid = activeCellGrowsAt(mid).length // mid-colonization (partial cap)
    const vast = activeCellGrowsAt(Math.round(FLOW_SCHEDULE_DURATION * 0.4)).length // fully colonized
    expect(earlyMid).toBeLessThan(vast)
    expect(vast).toBeGreaterThan(200) // «muchísimos procesos minúsculos»
  })

  it('stays byte-for-byte deterministic with the gate in place', () => {
    expect(generateMaster()).toEqual(MASTER)
    expect(generateMaster(450)).toEqual(generateMaster(450))
  })
})

describe('flowRevealAt / flowStepDecayAt — emerge head-first, dissipate in reverse', () => {
  it('reveal is 0 at/before start, reaches N by growDur, monotonic in frame', () => {
    const ev = firstEphemeral()
    expect(flowRevealAt(ev, ev.start)).toBe(0)
    expect(flowRevealAt(ev, ev.start - 5)).toBe(0)
    expect(flowRevealAt(ev, ev.start + ev.growDur)).toBeCloseTo(ev.N, 9)
    let prev = -Infinity
    for (let f = ev.start; f <= ev.start + ev.growDur + 5; f += 1) {
      const r = flowRevealAt(ev, f)
      expect(r).toBeGreaterThanOrEqual(prev - 1e-12)
      prev = r
    }
  })

  it('persistent flows never decay; ephemerals decay last-cell-first', () => {
    const p = firstPersistent()
    for (let i = 0; i < p.N; i += 1) {
      for (const f of [p.start, p.start + 200, FLOW_SCHEDULE_DURATION - 1]) {
        expect(flowStepDecayAt(p, f, i)).toBe(0)
      }
    }
    const e = firstEphemeral()
    const dissStart = e.start + e.growDur + e.hold
    expect(flowStepDecayAt(e, dissStart, 0)).toBe(0)
    // Reverse order: at the onset of dissipation the LAST cell leads the head.
    const justAfter = dissStart + 1
    expect(flowStepDecayAt(e, justAfter, e.N - 1)).toBeGreaterThanOrEqual(
      flowStepDecayAt(e, justAfter, 0),
    )
  })
})

describe('flowCellGrowAt — head-first grow, reverse dissolve, persistent calcify', () => {
  it('emerges head-first (early frame: head grown, tail still bare)', () => {
    const ev = firstEphemeral()
    const f = ev.start + 1
    expect(flowCellGrowAt(ev, f, 0)).toBeGreaterThan(flowCellGrowAt(ev, f, ev.N - 1))
    expect(flowCellGrowAt(ev, f, ev.N - 1)).toBe(0)
  })

  it('the head sits fully grown once revealed (grow = 1 at growDur)', () => {
    const ev = firstEphemeral()
    expect(flowCellGrowAt(ev, ev.start + ev.growDur, 0)).toBeCloseTo(1, 9)
  })

  it('a persistent flow calcifies: every cell holds grow = 1 forever', () => {
    const p = firstPersistent()
    const settled = p.start + p.growDur + 5
    for (let i = 0; i < p.N; i += 1) {
      expect(flowCellGrowAt(p, settled, i)).toBeCloseTo(1, 9)
      expect(flowCellGrowAt(p, FLOW_SCHEDULE_DURATION - 1, i)).toBeCloseTo(1, 9)
    }
  })

  it('an ephemeral flow returns to bare grid after its lifetime', () => {
    const ev = firstEphemeral()
    expect(isActive(ev, ev.occEnd)).toBe(false)
    let maxGrow = 0
    for (let i = 0; i < ev.N; i += 1) maxGrow = Math.max(maxGrow, flowCellGrowAt(ev, ev.occEnd - 1, i))
    expect(maxGrow).toBeLessThan(0.2) // nearly fully retracted right before it frees its cells
  })
})

describe('activeCellGrowsAt — the per-frame surface state for the atlas', () => {
  it('returns only positive grows, one entry per cell (conflict-free)', () => {
    for (const f of SCHEDULE_FRAMES) {
      const cells = activeCellGrowsAt(f)
      const idx = new Set(cells.map((c) => c.cellIndex))
      expect(idx.size).toBe(cells.length) // no cell rendered by two flows at once
      for (const c of cells) {
        expect(c.grow).toBeGreaterThan(0.001)
        expect(c.grow).toBeLessThanOrEqual(1)
        expect(c.cellIndex).toBe(cellIndex(c.row, c.col))
      }
      // The visible cells are a subset of the live footprint.
      expect(cells.length).toBeLessThanOrEqual(occupancyAt(f).size)
    }
  })

  it('is deterministic (same frame → identical surface state)', () => {
    expect(activeCellGrowsAt(450)).toEqual(activeCellGrowsAt(450))
  })

  it('is alive across the schedule (some processes always running)', () => {
    for (const f of [120, 300, 500, 700]) {
      expect(activeCellGrowsAt(f).length).toBeGreaterThan(0)
    }
  })
})

describe('schedule persistence + determinism guard', () => {
  it('ephemerals turn over while the persistent lattice remains to the end', () => {
    const lateLive = liveCountAt(FLOW_SCHEDULE_DURATION - 1)
    const latePersist = persistentCountAt(FLOW_SCHEDULE_DURATION - 1)
    expect(latePersist).toBeGreaterThan(0)
    // The orb stays incessantly alive to the last frame (the loop keeps emitting),
    // so the calcified lattice is a subset of the still-running live flows.
    expect(latePersist).toBeLessThanOrEqual(lateLive)
  })

  it('the source never reaches for Math.random / Date.now / a three clock', () => {
    const src = readFileSync(fileURLToPath(new URL('./globoVivoScript.ts', import.meta.url)), 'utf8')
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    expect(code).not.toContain('Math.random')
    expect(code).not.toContain('Date.now')
    expect(code).not.toContain('useFrame')
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 4 — cinematic orbital camera (multi-beat, frame-driven, deterministic)
// ════════════════════════════════════════════════════════════════════════════

/** Euclidean length of a world-space camera position. */
const mag = (p: readonly [number, number, number]): number => Math.hypot(p[0], p[1], p[2])
/** The closest the camera may sit before it clips the globe + cloud shell. */
const MIN_CLEAR = SPHERE_RADIUS * CLOUD_RADIUS_SCALE
const CAM_FRAMES = Array.from({ length: GLOBO_VIVO_DURATION + 1 }, (_, f) => f)

describe('orbital camera — beat radii', () => {
  it('declares a push-in story: near is closest, wide/survey pull back', () => {
    expect(ORBIT_NEAR_RADIUS).toBeLessThan(ORBIT_WIDE_RADIUS)
    expect(ORBIT_NEAR_RADIUS).toBeLessThan(ORBIT_SURVEY_RADIUS)
    expect(DEFAULT_ORBIT_TRAVEL).toBeGreaterThan(0)
  })

  it('keeps every beat radius clear of the globe + cloud shell', () => {
    for (const r of [ORBIT_WIDE_RADIUS, ORBIT_NEAR_RADIUS, ORBIT_SURVEY_RADIUS]) {
      expect(r).toBeGreaterThan(MIN_CLEAR)
    }
  })
})

describe('orbitPosition — spherical placement looking at the origin', () => {
  it('azimuth 0 / elevation 0 sits on the +Z axis (the Phase-1 framing)', () => {
    const p = orbitPosition(4.2, 0, 0)
    expect(p[0]).toBeCloseTo(0, 9)
    expect(p[1]).toBeCloseTo(0, 9)
    expect(p[2]).toBeCloseTo(4.2, 9)
  })

  it('elevation 90° lifts straight up the +Y axis', () => {
    const p = orbitPosition(3, 0, 90)
    expect(p[0]).toBeCloseTo(0, 9)
    expect(p[1]).toBeCloseTo(3, 9)
    expect(p[2]).toBeCloseTo(0, 9)
  })

  it('azimuth 90° swings onto the +X axis', () => {
    const p = orbitPosition(3, 90, 0)
    expect(p[0]).toBeCloseTo(3, 9)
    expect(p[1]).toBeCloseTo(0, 9)
    expect(p[2]).toBeCloseTo(0, 9)
  })

  it('always lands exactly `radius` from the origin (camera distance is the radius)', () => {
    for (const r of [3, 4.2, 5]) {
      for (let az = -180; az <= 180; az += 45) {
        for (let el = -60; el <= 60; el += 30) {
          expect(mag(orbitPosition(r, az, el))).toBeCloseTo(r, 9)
        }
      }
    }
  })
})

describe('buildOrbitRig / ORBIT_RIG — three colonization-keyed beats', () => {
  it('is a valid rig: ordered arrivals, fitting approaches, globe-clearing radii', () => {
    expect(validateOrbitRig(ORBIT_RIG)).toEqual([])
    expect(ORBIT_RIG.length).toBe(3)
    for (let i = 1; i < ORBIT_RIG.length; i += 1) {
      expect(ORBIT_RIG[i].at).toBeGreaterThan(ORBIT_RIG[i - 1].at)
    }
  })

  it('lays the beats wide → near → survey', () => {
    expect(ORBIT_RIG[0].radius).toBe(ORBIT_WIDE_RADIUS)
    expect(ORBIT_RIG[1].radius).toBe(ORBIT_NEAR_RADIUS)
    expect(ORBIT_RIG[2].radius).toBe(ORBIT_SURVEY_RADIUS)
  })

  it("the push-in's approach spans the colonization window exactly", () => {
    const pushIn = ORBIT_RIG[1]
    expect(pushIn.at).toBe(COLONIZE_END_FRAME)
    const { start, end } = orbitTravelWindow(ORBIT_RIG, 1)
    expect(start).toBe(COLONIZE_START_FRAME) // dolly begins as the tissue stirs
    expect(end).toBe(COLONIZE_END_FRAME) // arrives as the grid finishes taking the surface
  })

  it('is deterministic and auto-scales when the colonization window / duration retunes', () => {
    expect(buildOrbitRig()).toEqual(buildOrbitRig())
    // Phase-4 finalization values (long timeline, later colonization) stay valid.
    const scaled = buildOrbitRig(120, 520, 900)
    expect(validateOrbitRig(scaled)).toEqual([])
    expect(scaled[1].at).toBe(520)
    expect(orbitTravelWindow(scaled, 1).start).toBe(120) // push-in still spans colonization
    expect(scaled[2].at).toBe(899)
  })

  it('validateOrbitRig flags inside-the-globe radii and out-of-order arrivals', () => {
    const sunk: OrbitWaypoint[] = [{ at: 0, radius: 1.0, azimuthDeg: 0, elevationDeg: 0 }]
    expect(validateOrbitRig(sunk).length).toBeGreaterThan(0)
    const tangled: OrbitWaypoint[] = [
      { at: 30, radius: 4, azimuthDeg: 0, elevationDeg: 0 },
      { at: 30, radius: 4, azimuthDeg: 0, elevationDeg: 0 },
    ]
    expect(validateOrbitRig(tangled).length).toBeGreaterThan(0)
  })
})

describe('orbitPoseAt — eased multi-beat pose', () => {
  it('rests on the opening wide beat at frame 0 (no motion yet)', () => {
    const p = orbitPoseAt(ORBIT_RIG, 0)
    expect(p.radius).toBe(ORBIT_WIDE_RADIUS)
    expect(p.azimuthDeg).toBe(ORBIT_RIG[0].azimuthDeg)
    expect(p.elevationDeg).toBe(ORBIT_RIG[0].elevationDeg)
    expect(p.moving).toBe(0)
    expect(p.position).toEqual(orbitPosition(ORBIT_WIDE_RADIUS, ORBIT_RIG[0].azimuthDeg, ORBIT_RIG[0].elevationDeg))
  })

  it('settles exactly on every waypoint at its arrival frame (moving = 0)', () => {
    for (const wp of ORBIT_RIG) {
      const p = orbitPoseAt(ORBIT_RIG, wp.at)
      expect(p.radius).toBeCloseTo(wp.radius, 9)
      expect(p.azimuthDeg).toBeCloseTo(wp.azimuthDeg, 9)
      expect(p.elevationDeg).toBeCloseTo(wp.elevationDeg, 9)
      expect(p.moving).toBe(0)
    }
  })

  it('holds the camera exactly `radius` from the centre and always outside the globe', () => {
    for (const f of CAM_FRAMES) {
      const p = orbitPoseAt(ORBIT_RIG, f)
      expect(mag(p.position)).toBeCloseTo(p.radius, 9)
      expect(mag(p.position)).toBeGreaterThan(MIN_CLEAR)
    }
  })

  it('moving stays in [0,1] and only lifts off the floor mid-move', () => {
    let sawMoving = false
    for (const f of CAM_FRAMES) {
      const m = orbitPoseAt(ORBIT_RIG, f).moving
      expect(m).toBeGreaterThanOrEqual(0)
      expect(m).toBeLessThanOrEqual(1)
      if (m > 0) sawMoving = true
    }
    expect(sawMoving).toBe(true)
  })

  it('pushes in across the colonization, then pulls back (eased, no overshoot)', () => {
    // Beat B (wide → near): radius monotonic non-increasing across the window.
    let prev = Infinity
    for (let f = COLONIZE_START_FRAME; f <= COLONIZE_END_FRAME; f += 1) {
      const r = orbitPoseAt(ORBIT_RIG, f).radius
      expect(r).toBeLessThanOrEqual(prev + 1e-12)
      expect(r).toBeGreaterThanOrEqual(ORBIT_NEAR_RADIUS - 1e-9) // never overshoots past the target
      expect(r).toBeLessThanOrEqual(ORBIT_WIDE_RADIUS + 1e-9)
      prev = r
    }
    // Beat C (near → survey): radius monotonic non-decreasing across the window.
    prev = -Infinity
    for (let f = ORBIT_RIG[1].at; f <= ORBIT_RIG[2].at; f += 1) {
      const r = orbitPoseAt(ORBIT_RIG, f).radius
      expect(r).toBeGreaterThanOrEqual(prev - 1e-12)
      expect(r).toBeLessThanOrEqual(ORBIT_SURVEY_RADIUS + 1e-9)
      prev = r
    }
  })

  it('the closest approach is the push-in beat, nearer than the open and the end', () => {
    const openR = orbitPoseAt(ORBIT_RIG, 0).radius
    const nearR = orbitPoseAt(ORBIT_RIG, COLONIZE_END_FRAME).radius
    const endR = orbitPoseAt(ORBIT_RIG, GLOBO_VIVO_DURATION).radius
    expect(nearR).toBe(ORBIT_NEAR_RADIUS)
    expect(nearR).toBeLessThan(openR)
    expect(nearR).toBeLessThan(endR)
  })

  it('is deterministic: same frame → identical pose across calls', () => {
    for (const f of [0, 12, COLONIZE_START_FRAME, 45, COLONIZE_END_FRAME, GLOBO_VIVO_DURATION]) {
      expect(orbitPoseAt(ORBIT_RIG, f)).toEqual(orbitPoseAt(ORBIT_RIG, f))
    }
  })

  it('falls back to a safe static framing for an empty rig', () => {
    const p = orbitPoseAt([], 10)
    expect(mag(p.position)).toBeGreaterThan(MIN_CLEAR)
    expect(p.moving).toBe(0)
  })
})

describe('driftedOrbitPose — subtle living-hand breathing', () => {
  it('reduces to the base pose when amplitude is zero', () => {
    for (const f of [0, 33, 77]) {
      const base = orbitPoseAt(ORBIT_RIG, f)
      const d = driftedOrbitPose(base, f, 0)
      expect(d.radius).toBeCloseTo(base.radius, 12)
      expect(d.azimuthDeg).toBeCloseTo(base.azimuthDeg, 12)
      expect(d.elevationDeg).toBeCloseTo(base.elevationDeg, 12)
    }
  })

  it('stays a tiny offset (≈1° yaw, a few cm of dolly) — a hand, not a wobble', () => {
    for (const f of CAM_FRAMES) {
      const base = orbitPoseAt(ORBIT_RIG, f)
      const d = driftedOrbitPose(base, f)
      expect(Math.abs(d.radius - base.radius)).toBeLessThanOrEqual(0.05)
      expect(Math.abs(d.azimuthDeg - base.azimuthDeg)).toBeLessThanOrEqual(1.3)
      expect(Math.abs(d.elevationDeg - base.elevationDeg)).toBeLessThanOrEqual(0.7)
    }
  })

  it('keeps the camera looking at the origin from its (drifted) radius, never inside the globe', () => {
    for (const f of CAM_FRAMES) {
      const d = driftedOrbitPose(orbitPoseAt(ORBIT_RIG, f), f)
      expect(mag(d.position)).toBeCloseTo(d.radius, 9)
      expect(mag(d.position)).toBeGreaterThan(MIN_CLEAR)
    }
  })

  it('is deterministic: same (pose, frame) → identical drift', () => {
    const base = orbitPoseAt(ORBIT_RIG, 40)
    expect(driftedOrbitPose(base, 40)).toEqual(driftedOrbitPose(base, 40))
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 4 — finalized duration (comp span == schedule, full ~30 s, 3 acts)
// ════════════════════════════════════════════════════════════════════════════

describe('finalized duration — comp span cuadrada al schedule (~30 s, no overflow)', () => {
  it('is the finalized ~30 s scene length (900 frames @ FPS)', () => {
    // The plan finalizes the temp 90-frame smoke duration to the full scene.
    expect(GLOBO_VIVO_DURATION).toBe(900)
    expect(GLOBO_VIVO_DURATION).toBe(30 * FPS) // exactly 30 s at 30 fps
  })

  it('matches the flow-schedule span exactly (single source, no editor overflow)', () => {
    // durationInFrames (Root.tsx uses GLOBO_VIVO_DURATION) must equal the span the
    // master schedule is generated over, or the timeline overruns / underruns it.
    expect(FLOW_SCHEDULE_DURATION).toBe(GLOBO_VIVO_DURATION)
  })

  it('MASTER is generated over exactly the comp duration', () => {
    expect(generateMaster(GLOBO_VIVO_DURATION)).toEqual(MASTER)
  })

  it('lays out three non-empty acts inside the duration (Earth · colonize · survey)', () => {
    // Act 1 (Earth establish): a real opening beat before colonization stirs.
    expect(COLONIZE_START_FRAME).toBeGreaterThan(0)
    // Act 2 (colonization): a real middle act.
    expect(COLONIZE_END_FRAME).toBeGreaterThan(COLONIZE_START_FRAME)
    // Act 3 (vast-orb survey): a real tail of the timeline after colonization.
    expect(COLONIZE_END_FRAME).toBeLessThan(GLOBO_VIVO_DURATION)
    // The survey is the longest act — the «orbe vivo» needs the most screen time.
    const earthAct = COLONIZE_START_FRAME
    const colonizeAct = COLONIZE_END_FRAME - COLONIZE_START_FRAME
    const surveyAct = GLOBO_VIVO_DURATION - COLONIZE_END_FRAME
    expect(surveyAct).toBeGreaterThan(colonizeAct)
    expect(surveyAct).toBeGreaterThan(earthAct)
  })

  it('finishes colonizing the Earth before the end (loop closes on the vast orb)', () => {
    // The Earth is fully replaced well within the timeline, so the final act —
    // and the seamless loop seam — sits on the all-grid orb, never mid-dissolve.
    expect(coverageAt(GLOBO_VIVO_DURATION - 1)).toBe(1)
    expect(frontRadiusAt(GLOBO_VIVO_DURATION - 1)).toBeCloseTo(Math.PI, 9)
  })

  it('is fully colonized by the density sample frame (the orb reads vast there)', () => {
    // The flow-density check samples 0.4·duration expecting the vast end state;
    // colonization must be complete by then for that to hold.
    const densitySample = Math.round(GLOBO_VIVO_DURATION * 0.4)
    expect(densitySample).toBeGreaterThan(COLONIZE_END_FRAME)
    expect(coverageAt(densitySample)).toBe(1)
  })

  it('schedules no flow past the rendered timeline (every start inside the duration)', () => {
    for (const e of MASTER) {
      expect(e.start).toBeGreaterThanOrEqual(0)
      expect(e.start).toBeLessThan(GLOBO_VIVO_DURATION)
    }
  })

  it('drives the orbital camera across the whole finalized timeline', () => {
    expect(validateOrbitRig(ORBIT_RIG)).toEqual([])
    // The push-in arrives as colonization ends…
    expect(ORBIT_RIG[1].at).toBe(COLONIZE_END_FRAME)
    expect(orbitTravelWindow(ORBIT_RIG, 1).start).toBe(COLONIZE_START_FRAME)
    // …and the survey beat lands on the last frame of the scene (no static tail).
    expect(ORBIT_RIG[ORBIT_RIG.length - 1].at).toBe(GLOBO_VIVO_DURATION - 1)
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 4 — Earth → grid drain (relief flattens so the orb is a pure white grid)
// ════════════════════════════════════════════════════════════════════════════
// The spec's end state is a «orbe-grid blanco neumórfico vasto»: as the grid
// colonizes, the Earth must drain COMPLETELY into white. The host already mixes
// the albedo to the atlas + pulls roughness/metalness matte per-fragment by the
// geodesic mask; the missing piece (and a render gotcha seen at full coverage) is
// the tangent-space terrain relief, which is GEOMETRY and would otherwise still
// poke mountains/coastlines through the flat white grid. The host lerps the
// perturbed normal back to the smooth sphere normal by `gvMask`; reliefStrengthAtUV
// is the pure CPU twin of the surviving-relief weight (`1 − mask`) the shader uses.

// Reuses the module-level `UVS` (a fine pole-/seam-safe equirectangular sampling).
// Seed UV vs its antipode UV — the front reaches the seed first, the antipode last.
const SEED_UV = lonLatToUV(SEED_LON_DEG, SEED_LAT_DEG)
const ANTIPODE_UV = lonLatToUV(SEED_LON_DEG + 180, -SEED_LAT_DEG)
const MID_COLONIZE_FRAME = Math.round((COLONIZE_START_FRAME + COLONIZE_END_FRAME) / 2)

describe('Earth relief drain — vast orb goes pure neumorphic grid', () => {
  it('keeps a real base terrain relief on the photoreal Earth (drained later)', () => {
    expect(BASE_NORMAL_SCALE).toBeGreaterThan(0)
    expect(Number.isFinite(BASE_NORMAL_SCALE)).toBe(true)
  })

  it('is the faithful twin of the shader weight: reliefStrength === 1 − mask', () => {
    // The host lerps normal→smooth by gvMask, so the surviving relief is (1 − mask)
    // texel-for-texel. Verify across the whole surface × the whole timeline span.
    for (const f of [0, COLONIZE_START_FRAME, MID_COLONIZE_FRAME, 240, COLONIZE_END_FRAME, GLOBO_VIVO_DURATION - 1]) {
      for (const [u, v] of UVS) {
        expect(reliefStrengthAtUV(u, v, f)).toBeCloseTo(1 - tissueMaskAtUV(u, v, f), 12)
      }
    }
  })

  it('stays within [0,1] and finite everywhere across the timeline', () => {
    for (const f of [0, 30, 120, 300, 600, GLOBO_VIVO_DURATION - 1]) {
      for (const [u, v] of UVS) {
        const r = reliefStrengthAtUV(u, v, f)
        expect(Number.isFinite(r)).toBe(true)
        expect(r).toBeGreaterThanOrEqual(0)
        expect(r).toBeLessThanOrEqual(1)
      }
    }
  })

  it('shows full Earth relief everywhere before colonization begins', () => {
    // Up to (and including) the colonization start, coverage is 0 → relief intact.
    for (let f = 0; f <= COLONIZE_START_FRAME; f += 5) {
      for (const [u, v] of UVS) {
        expect(reliefStrengthAtUV(u, v, f)).toBe(1)
      }
    }
  })

  it('drains to a perfectly smooth orb once fully colonized (no mountains)', () => {
    // At full coverage the gotcha must be gone: zero surviving relief anywhere.
    for (const f of [COLONIZE_END_FRAME, MID_COLONIZE_FRAME + (COLONIZE_END_FRAME - MID_COLONIZE_FRAME), GLOBO_VIVO_DURATION - 1]) {
      expect(coverageAt(f)).toBe(1)
      for (const [u, v] of UVS) {
        expect(reliefStrengthAtUV(u, v, f)).toBe(0)
      }
    }
  })

  it('only ever drains relief (monotonic non-increasing in frame) per texel', () => {
    // Mirror of the mask being monotonic non-decreasing: a flattened texel never
    // re-grows its terrain — so a render never pops relief back in mid-colonization.
    for (const [u, v] of UVS) {
      let prev = Infinity
      for (let f = 0; f < GLOBO_VIVO_DURATION; f += 7) {
        const r = reliefStrengthAtUV(u, v, f)
        expect(r).toBeLessThanOrEqual(prev + 1e-9)
        prev = r
      }
    }
  })

  it('flattens the seed before the antipode (drain follows the geodesic front)', () => {
    // Mid-colonization the seed sits well inside the front (relief gone) while the
    // antipode is untouched (full relief) — the drain spreads from the seed.
    const atSeed = reliefStrengthAtUV(SEED_UV[0], SEED_UV[1], MID_COLONIZE_FRAME)
    const atAntipode = reliefStrengthAtUV(ANTIPODE_UV[0], ANTIPODE_UV[1], MID_COLONIZE_FRAME)
    expect(atSeed).toBeLessThan(atAntipode)
    expect(atSeed).toBeLessThan(0.5)
    expect(atAntipode).toBeGreaterThan(0.5)
  })

  it('is deterministic: same (u, v, frame) → identical relief', () => {
    for (const f of [0, MID_COLONIZE_FRAME, GLOBO_VIVO_DURATION - 1]) {
      for (const [u, v] of UVS) {
        expect(reliefStrengthAtUV(u, v, f)).toBe(reliefStrengthAtUV(u, v, f))
      }
    }
  })
})

// ════════════════════════════════════════════════════════════════════════════
// Phase 4 — seamless loop (the last frame flows into the first)
// ════════════════════════════════════════════════════════════════════════════
// The hero scene plays frames 0…duration−1 then wraps to 0. The Earth→orb skin
// change is a one-way narrative (coverage is monotonic to 1, relief drains to 0 —
// asserted above), so a literal pixel loop is impossible by design; what the loop
// makes seamless is the MOTION across the wrap:
//   · spin — the globe returns to its frame-0 orientation (period divides duration),
//   · camera — beat C pulls back to the exact opening «home» framing,
//   · churn — emission runs to the last frame so the orb teems «sin cesar».
// All three are pure functions of the frame, so the seam is unit-checkable here.

describe('seamless loop — continuous spin across the wrap', () => {
  it('the rotation period divides the duration (whole turns per loop)', () => {
    expect(SPIN_LOOPS_SEAMLESSLY).toBe(true)
    expect(Number.isInteger(GLOBE_TURNS_PER_LOOP)).toBe(true)
    expect(GLOBE_TURNS_PER_LOOP).toBeGreaterThanOrEqual(1)
    expect(GLOBO_VIVO_DURATION % ROT_PERIOD_FRAMES).toBe(0)
    expect(GLOBE_TURNS_PER_LOOP).toBe(GLOBO_VIVO_DURATION / ROT_PERIOD_FRAMES)
  })

  it('returns to the frame-0 orientation at the loop point (yaw ≡ 0 mod 2π)', () => {
    // sphereYawAt(duration) is exactly a whole number of turns, so the orientation
    // at the wrap equals frame 0 — the white orb does not snap to a new yaw.
    expect(sphereYawAt(GLOBO_VIVO_DURATION)).toBeCloseTo(GLOBE_TURNS_PER_LOOP * TWO_PI, 9)
    const turnsFraction = sphereYawAt(GLOBO_VIVO_DURATION) / TWO_PI
    expect(turnsFraction).toBeCloseTo(Math.round(turnsFraction), 9)
  })

  it('advances the spin by exactly one frame step across the seam (no jump)', () => {
    // The wrap 899→0 stands in for 899→900; because 900 ≡ 0, the effective angular
    // advance at the seam must equal a normal per-frame step (constant velocity).
    const perFrameStep = sphereYawAt(1) - sphereYawAt(0)
    const seamStep = sphereYawAt(GLOBO_VIVO_DURATION) - sphereYawAt(GLOBO_VIVO_DURATION - 1)
    expect(seamStep).toBeCloseTo(perFrameStep, 12)
    expect(perFrameStep).toBeCloseTo(TWO_PI / ROT_PERIOD_FRAMES, 12)
  })
})

describe('seamless loop — the camera returns to the opening framing', () => {
  it('survey beat C shares the opening home pose (radius/azimuth/elevation)', () => {
    const open = ORBIT_RIG[0]
    const survey = ORBIT_RIG[ORBIT_RIG.length - 1]
    expect(survey.radius).toBe(open.radius)
    expect(survey.azimuthDeg).toBe(open.azimuthDeg)
    expect(survey.elevationDeg).toBe(open.elevationDeg)
    // The home constants are the single source for both ends of the loop.
    expect(open.radius).toBe(ORBIT_WIDE_RADIUS)
    expect(open.azimuthDeg).toBe(ORBIT_HOME_AZIMUTH_DEG)
    expect(open.elevationDeg).toBe(ORBIT_HOME_ELEVATION_DEG)
    // Survey radius is the wide radius by design (pull back to the opening framing).
    expect(ORBIT_SURVEY_RADIUS).toBe(ORBIT_WIDE_RADIUS)
  })

  it('the closing pose equals the opening pose exactly (base, no drift)', () => {
    // Beat C arrives on the last frame, so the resolved pose there is the settled
    // home pose — identical to frame 0. The undrifted camera seam is perfect.
    const start = orbitPoseAt(ORBIT_RIG, 0)
    const end = orbitPoseAt(ORBIT_RIG, ORBIT_RIG[ORBIT_RIG.length - 1].at)
    expect(end.radius).toBe(start.radius)
    expect(end.azimuthDeg).toBe(start.azimuthDeg)
    expect(end.elevationDeg).toBe(start.elevationDeg)
    expect(end.position).toEqual(start.position)
    expect(end.moving).toBe(0)
    expect(start.moving).toBe(0)
  })

  it('keeps the drifted camera seam imperceptibly small (a hand, not a cut)', () => {
    // The living-hand drift differs between frame 0 and the last frame, but the
    // residual is sub-degree / sub-cm — far below a visible jump.
    const dStart = driftedOrbitPose(orbitPoseAt(ORBIT_RIG, 0), 0)
    const last = GLOBO_VIVO_DURATION - 1
    const dEnd = driftedOrbitPose(orbitPoseAt(ORBIT_RIG, last), last)
    expect(Math.abs(dEnd.radius - dStart.radius)).toBeLessThan(0.06)
    expect(Math.abs(dEnd.azimuthDeg - dStart.azimuthDeg)).toBeLessThan(2.5)
    expect(Math.abs(dEnd.elevationDeg - dStart.elevationDeg)).toBeLessThan(1.3)
  })
})

describe('seamless loop — the orb teems «sin cesar» to the last frame', () => {
  const densitySample = Math.round(GLOBO_VIVO_DURATION * 0.4) // a fully-colonized mid-orb frame
  const lastFrame = GLOBO_VIVO_DURATION - 1

  it('still runs hundreds of micro-processes on the closing frame (no dead settle)', () => {
    const mid = activeCellGrowsAt(densitySample).length
    const end = activeCellGrowsAt(lastFrame).length
    expect(end).toBeGreaterThan(200) // «muchísimos procesos minúsculos» right to the wrap
    // The close is as alive as the middle — not a thinning settle tail.
    expect(end).toBeGreaterThan(0.5 * mid)
  })

  it('holds a healthy live-flow count and dense footprint at the end', () => {
    expect(liveCountAt(lastFrame)).toBeGreaterThanOrEqual(40)
    expect(occupancyAt(lastFrame).size).toBeGreaterThan(0.3 * SURFACE_CELL_COUNT)
  })

  it('every flow still starts inside the rendered window (nothing emitted past it)', () => {
    // Incessant emission must not schedule a flow whose head only appears after the
    // last rendered frame (it would never be seen, and could leak occupancy).
    for (const e of MASTER) {
      expect(e.start).toBeLessThan(GLOBO_VIVO_DURATION)
    }
    // A flow MAY finish a few frames past the duration (unrendered) — that is fine,
    // and is the deliberate overrun that keeps the close busy.
    const overrun = MASTER.some((e) => e.occEnd > GLOBO_VIVO_DURATION && Number.isFinite(e.occEnd))
    expect(overrun).toBe(true)
  })

  it('the closing churn is deterministic (same last frame → identical state)', () => {
    expect(activeCellGrowsAt(lastFrame)).toEqual(activeCellGrowsAt(lastFrame))
    expect(generateMaster()).toEqual(MASTER)
  })
})
