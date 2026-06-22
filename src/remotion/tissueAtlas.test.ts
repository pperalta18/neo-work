import { afterEach, describe, expect, it } from 'vitest'
import { KIT_BLUE } from '@/lib/neumorphism'
import {
  ACTIVE_ATLAS_QUALITY,
  ATLAS_H,
  ATLAS_QUALITY_FULL,
  ATLAS_QUALITY_LEAN,
  ATLAS_SURFACE,
  ATLAS_W,
  BAND_DEG,
  CELL_COUNT,
  COLS_EQ,
  GROW_LEVELS,
  GRID_CELLS,
  MIN_COLS,
  PULSE_WIDTH,
  ROWS,
  SPRITE_SIZE,
  atlasPixelLoad,
  bakePlateSprite,
  buildGridCells,
  colsInRow,
  growForLevel,
  hash01,
  lonLatToPx,
  lonLatToUV,
  pulseIntensityAt,
  quantizeGrow,
  renderAtlas,
  resetAtlasCaches,
  rowCenterLat,
  uvToLonLat,
  visibleCellCountAt,
  type CanvasFactory,
  type CanvasLike,
  type Ctx2DLike,
} from './tissueAtlas'
import { activeCellGrowsAt, COLONIZE_START_FRAME } from './globoVivoScript'

// ── A recording fake Canvas2D so the stamping pipeline is testable in node ─────
// Every ctx op pushes {op, args} into a per-canvas log; properties are plain
// fields. Numeric args are rounded and object args collapsed to 'C' when we
// compare logs, so determinism checks ignore float dust / sprite identity.

type Call = { op: string; args: unknown[] }

function makeFakeFactory(): { factory: CanvasFactory; canvases: Array<CanvasLike & { __log: Call[] }> } {
  const canvases: Array<CanvasLike & { __log: Call[] }> = []
  const factory: CanvasFactory = (w, h) => {
    const log: Call[] = []
    const ctx = {
      fillStyle: '',
      globalAlpha: 1,
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
    } as unknown as Ctx2DLike
    const ops = [
      'save',
      'restore',
      'clearRect',
      'fillRect',
      'beginPath',
      'moveTo',
      'lineTo',
      'arcTo',
      'closePath',
      'fill',
      'drawImage',
    ] as const
    for (const op of ops) {
      ;(ctx as unknown as Record<string, unknown>)[op] = (...args: unknown[]) => {
        // Capture the mutable style at the time of a paint op so determinism
        // checks see colour/alpha too (fill/fillRect read current props).
        if (op === 'fill' || op === 'fillRect') {
          log.push({ op, args: [...args, ctx.fillStyle, Number(ctx.globalAlpha.toFixed(6))] })
        } else {
          log.push({ op, args })
        }
      }
    }
    const canvas = {
      width: w,
      height: h,
      getContext: () => ctx,
      __log: log,
    } as CanvasLike & { __log: Call[] }
    canvases.push(canvas)
    return canvas
  }
  return { factory, canvases }
}

/** Normalize a call log: round numbers, collapse object args → comparable strings. */
function normalize(log: Call[]): string[] {
  return log.map(
    (c) =>
      `${c.op}(${c.args
        .map((a) =>
          typeof a === 'number'
            ? a.toFixed(6)
            : a !== null && typeof a === 'object'
              ? 'C'
              : String(a),
        )
        .join(',')})`,
  )
}

afterEach(() => {
  // Caches are keyed by factory identity, but reset between tests for hygiene.
  resetAtlasCaches()
})

// A frame deep in the «orbe vivo» end state: the orb is fully colonized and teems
// with live flows, so the atlas stamps hundreds of plates — the Phase-3 render path
// under load. (Pre-colonization frames like 0 leave the orb bare; see those tests.)
const BUSY_FRAME = 300

describe('atlas dimensions', () => {
  it('is a 2:1 power-of-two equirectangular sheet', () => {
    expect(ATLAS_W).toBe(2 * ATLAS_H)
    // Power of two (clean mipmaps on a GPU texture).
    expect(Math.log2(ATLAS_W) % 1).toBe(0)
    expect(Math.log2(ATLAS_H) % 1).toBe(0)
    expect(ATLAS_SURFACE).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('lonLatToUV / uvToLonLat — equirectangular projection', () => {
  it('maps the NASA-map corners (north-west top-left → south-east bottom-right)', () => {
    expect(lonLatToUV(-180, 90)).toEqual([0, 0])
    expect(lonLatToUV(180, -90)).toEqual([1, 1])
    expect(lonLatToUV(0, 0)).toEqual([0.5, 0.5])
  })

  it('round-trips lon/lat → uv → lon/lat across the globe', () => {
    for (let lat = -80; lat <= 80; lat += 20) {
      for (let lon = -160; lon <= 160; lon += 40) {
        const [u, v] = lonLatToUV(lon, lat)
        const [lon2, lat2] = uvToLonLat(u, v)
        expect(lon2).toBeCloseTo(lon, 9)
        expect(lat2).toBeCloseTo(lat, 9)
      }
    }
  })

  it('is monotonic: east increases U, north decreases V', () => {
    expect(lonLatToUV(10, 0)[0]).toBeGreaterThan(lonLatToUV(-10, 0)[0])
    expect(lonLatToUV(0, 10)[1]).toBeLessThan(lonLatToUV(0, -10)[1])
  })

  it('lonLatToPx lands the centre of the sheet for (0,0) and spans the full frame', () => {
    expect(lonLatToPx(0, 0)).toEqual([ATLAS_W / 2, ATLAS_H / 2])
    expect(lonLatToPx(-180, 90)).toEqual([0, 0])
    expect(lonLatToPx(180, -90)).toEqual([ATLAS_W, ATLAS_H])
  })
})

describe('cosine-banded layout', () => {
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

  it('colsInRow peaks near the equator and is clamped to [MIN_COLS, COLS_EQ]', () => {
    for (let r = 0; r < ROWS; r += 1) {
      const c = colsInRow(r)
      expect(c).toBeGreaterThanOrEqual(MIN_COLS)
      expect(c).toBeLessThanOrEqual(COLS_EQ)
      expect(Number.isInteger(c)).toBe(true)
    }
    // Most columns near the equator, fewest at the poles.
    const equatorRow = Math.floor(ROWS / 2)
    expect(colsInRow(equatorRow)).toBeGreaterThan(colsInRow(0))
    expect(colsInRow(equatorRow)).toBeGreaterThan(colsInRow(ROWS - 1))
  })

  it('is symmetric about the equator (band r mirrors band ROWS−1−r)', () => {
    for (let r = 0; r < ROWS; r += 1) {
      expect(colsInRow(r)).toBe(colsInRow(ROWS - 1 - r))
      expect(rowCenterLat(r)).toBeCloseTo(-rowCenterLat(ROWS - 1 - r), 9)
    }
  })
})

describe('hash01 — seeded per-cell phase', () => {
  it('returns a value in [0, 1) and is deterministic', () => {
    for (let a = 0; a < 10; a += 1) {
      for (let b = 0; b < 10; b += 1) {
        const v = hash01(a, b)
        expect(v).toBeGreaterThanOrEqual(0)
        expect(v).toBeLessThan(1)
        expect(v).toBe(hash01(a, b))
      }
    }
  })

  it('decorrelates neighbours (does not return the same phase for adjacent cells)', () => {
    expect(hash01(3, 4)).not.toBe(hash01(3, 5))
    expect(hash01(3, 4)).not.toBe(hash01(4, 4))
  })
})

describe('buildGridCells / GRID_CELLS', () => {
  it('contains exactly the sum of per-row column counts', () => {
    let expected = 0
    for (let r = 0; r < ROWS; r += 1) expected += colsInRow(r)
    expect(CELL_COUNT).toBe(expected)
    expect(GRID_CELLS.length).toBe(expected)
    expect(CELL_COUNT).toBeGreaterThan(100) // "muchísimos procesos minúsculos"
  })

  it('keeps every cell in-bounds in pixels and in valid lon/lat', () => {
    for (const cell of GRID_CELLS) {
      expect(cell.xPx).toBeGreaterThanOrEqual(0)
      expect(cell.xPx).toBeLessThanOrEqual(ATLAS_W)
      expect(cell.yPx).toBeGreaterThanOrEqual(0)
      expect(cell.yPx).toBeLessThanOrEqual(ATLAS_H)
      expect(cell.lat).toBeGreaterThan(-90)
      expect(cell.lat).toBeLessThan(90)
      expect(cell.lon).toBeGreaterThanOrEqual(-180)
      expect(cell.lon).toBeLessThanOrEqual(180)
      expect(cell.u).toBeGreaterThanOrEqual(0)
      expect(cell.u).toBeLessThanOrEqual(1)
    }
  })

  it("a cell's pixel centre agrees with its lon/lat projection", () => {
    for (const cell of GRID_CELLS) {
      const [x, y] = lonLatToPx(cell.lon, cell.lat)
      expect(x).toBeCloseTo(cell.xPx, 6)
      expect(y).toBeCloseTo(cell.yPx, 6)
    }
  })

  it('is deterministic — a fresh build equals GRID_CELLS', () => {
    expect(buildGridCells()).toEqual(GRID_CELLS)
  })
})

describe('growForLevel / quantizeGrow', () => {
  it('growForLevel ramps 0 → 1 across the baked levels', () => {
    expect(growForLevel(0)).toBe(0)
    expect(growForLevel(GROW_LEVELS - 1)).toBe(1)
    for (let l = 1; l < GROW_LEVELS; l += 1) {
      expect(growForLevel(l)).toBeGreaterThan(growForLevel(l - 1))
    }
  })

  it('quantizeGrow maps [0,1] onto valid levels, monotonically, clamping out-of-range', () => {
    expect(quantizeGrow(0)).toBe(0)
    expect(quantizeGrow(1)).toBe(GROW_LEVELS - 1)
    expect(quantizeGrow(-5)).toBe(0)
    expect(quantizeGrow(5)).toBe(GROW_LEVELS - 1)
    let prev = -1
    for (let g = 0; g <= 1.0001; g += 0.05) {
      const lvl = quantizeGrow(g)
      expect(lvl).toBeGreaterThanOrEqual(0)
      expect(lvl).toBeLessThanOrEqual(GROW_LEVELS - 1)
      expect(lvl).toBeGreaterThanOrEqual(prev)
      prev = lvl
    }
  })

  it('quantize∘growForLevel is the identity on baked levels', () => {
    for (let l = 0; l < GROW_LEVELS; l += 1) {
      expect(quantizeGrow(growForLevel(l))).toBe(l)
    }
  })
})

describe('pulseIntensityAt — travelling KIT_BLUE band', () => {
  const sample = GRID_CELLS.slice(0, 80)

  it('stays a finite intensity in [0,1] over the surface × timeline', () => {
    for (const cell of sample) {
      for (let f = 0; f < 160; f += 5) {
        const p = pulseIntensityAt(cell, f)
        expect(p).toBeGreaterThanOrEqual(0)
        expect(p).toBeLessThanOrEqual(1)
        expect(Number.isFinite(p)).toBe(true)
      }
    }
  })

  it('peaks (≈1) on the band and falls off away from it', () => {
    // At frame 0 the band sits at U=0. A cell right on U≈0 is far brighter than one at U≈0.5.
    const near = { u: 0.0, row: 0, col: 0, lat: 0, lon: 0, v: 0, xPx: 0, yPx: 0, wPx: 0, hPx: 0, seedPhase: 0 }
    const far = { ...near, u: 0.5 }
    expect(pulseIntensityAt(near, 0)).toBeGreaterThan(0.9)
    expect(pulseIntensityAt(far, 0)).toBeLessThan(0.01)
  })

  it('wraps around the longitude seam (U≈1 is as bright as U≈0 when the band is at 0)', () => {
    const base = { row: 0, col: 0, lat: 0, lon: 0, v: 0, xPx: 0, yPx: 0, wPx: 0, hPx: 0, seedPhase: 0 }
    const left = pulseIntensityAt({ ...base, u: 0.005 }, 0)
    const right = pulseIntensityAt({ ...base, u: 0.995 }, 0)
    expect(right).toBeCloseTo(left, 9)
  })

  it('is deterministic and uses a positive band width', () => {
    expect(PULSE_WIDTH).toBeGreaterThan(0)
    expect(pulseIntensityAt(sample[3], 77)).toBe(pulseIntensityAt(sample[3], 77))
  })
})

describe('visibleCellCountAt — tracks the live flow schedule (Phase 3)', () => {
  it('is bare before colonization and never exceeds the whole grid', () => {
    // Before the growth front opens (frame < COLONIZE_START_FRAME) nothing is
    // colonized, so no flow can spawn → the orb shows zero plates.
    for (let f = 0; f < COLONIZE_START_FRAME; f += 1) {
      expect(visibleCellCountAt(f)).toBe(0)
    }
    for (const f of [120, 300, 500, 700]) {
      const n = visibleCellCountAt(f)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(CELL_COUNT)
    }
  })

  it('rises from the colonizing orb to the vast end state', () => {
    expect(visibleCellCountAt(45)).toBeLessThan(visibleCellCountAt(300))
    expect(visibleCellCountAt(300)).toBeGreaterThan(0)
  })

  it('counts exactly the schedule cells with a non-blank sprite level', () => {
    for (const f of [120, 300, 500]) {
      const expected = activeCellGrowsAt(f).filter((c) => quantizeGrow(c.grow) > 0).length
      expect(visibleCellCountAt(f)).toBe(expected)
    }
  })
})

describe('bakePlateSprite / sprites', () => {
  it('bakes a SPRITE_SIZE canvas and paints the raised double-shadow at full grow', () => {
    const { factory } = makeFakeFactory()
    const sprite = bakePlateSprite(GROW_LEVELS - 1, factory) as CanvasLike & { __log: Call[] }
    expect(sprite.width).toBe(SPRITE_SIZE)
    expect(sprite.height).toBe(SPRITE_SIZE)
    const ops = sprite.__log.map((c) => c.op)
    expect(ops).toContain('clearRect')
    expect(ops).toContain('arcTo') // rounded-rect path
    // Three fills: dark shadow, light highlight, crisp face.
    expect(ops.filter((o) => o === 'fill').length).toBe(3)
  })

  it('bakes an empty sprite at the invisible level (only a clear, no fill)', () => {
    const { factory } = makeFakeFactory()
    const sprite = bakePlateSprite(0, factory) as CanvasLike & { __log: Call[] }
    const ops = sprite.__log.map((c) => c.op)
    expect(ops).toContain('clearRect')
    expect(ops).not.toContain('fill')
  })

  it('fills plates with the kit surface colour, never a hand-picked shade', () => {
    const { factory } = makeFakeFactory()
    const sprite = bakePlateSprite(GROW_LEVELS - 1, factory) as CanvasLike & { __log: Call[] }
    const fills = sprite.__log.filter((c) => c.op === 'fill')
    for (const f of fills) expect(f.args[f.args.length - 2]).toBe(ATLAS_SURFACE)
  })
})

describe('renderAtlas — frame-driven stamping', () => {
  it('returns a single reused ATLAS_W×ATLAS_H canvas (no per-frame realloc)', () => {
    const { factory } = makeFakeFactory()
    const a = renderAtlas(0, { createCanvas: factory })
    const b = renderAtlas(30, { createCanvas: factory })
    expect(a).toBe(b) // same canvas object across frames
    expect(a.width).toBe(ATLAS_W)
    expect(a.height).toBe(ATLAS_H)
  })

  it('paints the ground once but stamps nothing before any flow colonizes (bare orb)', () => {
    // Phase 3: at the very open no flow has spawned, so the atlas is just the white
    // grid ground — clean (cleared + filled) with zero plate stamps.
    const { factory } = makeFakeFactory()
    const canvas = renderAtlas(0, { createCanvas: factory }) as CanvasLike & { __log: Call[] }
    const log = canvas.__log
    expect(log.filter((c) => c.op === 'clearRect').length).toBe(1)
    expect(
      log.filter((c) => c.op === 'fillRect' && c.args[2] === ATLAS_W && c.args[3] === ATLAS_H).length,
    ).toBe(1)
    expect(log.filter((c) => c.op === 'drawImage').length).toBe(0)
    expect(visibleCellCountAt(0)).toBe(0)
  })

  it('clears + paints the ground, then stamps every live flow cell (Phase 3 schedule)', () => {
    const { factory } = makeFakeFactory()
    const canvas = renderAtlas(BUSY_FRAME, { createCanvas: factory }) as CanvasLike & { __log: Call[] }
    const log = canvas.__log
    const clears = log.filter((c) => c.op === 'clearRect')
    const grounds = log.filter((c) => c.op === 'fillRect' && c.args[2] === ATLAS_W && c.args[3] === ATLAS_H)
    const stamps = log.filter((c) => c.op === 'drawImage')
    const visible = visibleCellCountAt(BUSY_FRAME)
    expect(clears.length).toBe(1)
    expect(grounds.length).toBe(1)
    expect(visible).toBeGreaterThan(0) // the vast end state teems with flows
    // One primary stamp per visible cell; each seam-wrapped edge cell adds at most one.
    expect(stamps.length).toBeGreaterThanOrEqual(visible)
    expect(stamps.length).toBeLessThanOrEqual(2 * visible)
  })

  it('lands each primary stamp on the pixel centre of a scheduled active cell', () => {
    const { factory } = makeFakeFactory()
    const canvas = renderAtlas(BUSY_FRAME, { createCanvas: factory }) as CanvasLike & { __log: Call[] }
    const stamps = canvas.__log.filter((c) => c.op === 'drawImage')
    // The cells the schedule says are live this frame, by their atlas pixel centre.
    const activeCentres = new Set(
      activeCellGrowsAt(BUSY_FRAME)
        .filter((c) => quantizeGrow(c.grow) > 0)
        .map((c) => {
          const cell = GRID_CELLS[c.cellIndex]
          return `${Math.round(cell.xPx)},${Math.round(cell.yPx)}`
        }),
    )
    // Recover each stamp's centre (dx + dW/2, dy + dH/2); primaries match an active
    // cell centre, seam-wrap copies land a full atlas-width off and don't.
    let matched = 0
    for (const s of stamps) {
      const [, dx, dy, dW, dH] = s.args as [unknown, number, number, number, number]
      if (activeCentres.has(`${Math.round(dx + dW / 2)},${Math.round(dy + dH / 2)}`)) matched += 1
    }
    expect(activeCentres.size).toBeGreaterThan(0)
    expect(matched).toBe(activeCentres.size) // every active cell gets its primary stamp
  })

  it('only ever fills the kit surface (ground) or KIT_BLUE (pulse) — no hand-picked shades', () => {
    const { factory } = makeFakeFactory()
    const canvas = renderAtlas(BUSY_FRAME, { createCanvas: factory }) as CanvasLike & { __log: Call[] }
    const colours = new Set(canvas.__log.filter((c) => c.op === 'fillRect').map((c) => c.args[c.args.length - 2]))
    for (const col of colours) expect([ATLAS_SURFACE, KIT_BLUE]).toContain(col)
    expect(colours.has(ATLAS_SURFACE)).toBe(true) // the white ground is always painted
  })

  it('rides a KIT_BLUE pulse over the live tissue as the band sweeps the loop', () => {
    // The travelling band crosses every longitude over PULSE_PERIOD; with hundreds of
    // live plates it must light a pulse pip on some cell — the lone FlowPlate accent.
    let sawPulse = false
    for (const f of [120, 180, 240, 300, 360, 420]) {
      const { factory } = makeFakeFactory()
      const canvas = renderAtlas(f, { createCanvas: factory }) as CanvasLike & { __log: Call[] }
      if (canvas.__log.some((c) => c.op === 'fillRect' && c.args[c.args.length - 2] === KIT_BLUE)) {
        sawPulse = true
        break
      }
    }
    expect(sawPulse).toBe(true)
  })

  it('is deterministic — two independent renders of the same frame match call-for-call', () => {
    const a = makeFakeFactory()
    const b = makeFakeFactory()
    const ca = renderAtlas(60, { createCanvas: a.factory }) as CanvasLike & { __log: Call[] }
    const cb = renderAtlas(60, { createCanvas: b.factory }) as CanvasLike & { __log: Call[] }
    expect(normalize(ca.__log)).toEqual(normalize(cb.__log))
  })

  it('is frame-dependent — different frames produce different draw calls', () => {
    // Frame 0 is pre-colonization (bare orb, no flow stamps); BUSY_FRAME is fully
    // colonized and teeming. The two must differ, proving the atlas tracks the frame.
    const a = makeFakeFactory()
    const b = makeFakeFactory()
    const bare = renderAtlas(0, { createCanvas: a.factory }) as CanvasLike & { __log: Call[] }
    const busy = renderAtlas(BUSY_FRAME, { createCanvas: b.factory }) as CanvasLike & { __log: Call[] }
    expect(normalize(bare.__log)).not.toEqual(normalize(busy.__log))
  })
})

// ── Checkpoint B: perf quality tiers + leaner fallback ────────────────────────
// Checkpoint B kept the full tier live (≈0.28 s/frame, ~900f ≈ ~4 min). These
// guard the fallback lever the plan asks us to keep on hand: it is a genuine,
// look-preserving resolution swap (same plates, a quarter of the pixels) that
// stays deterministic — so a future slower host can flip ACTIVE_ATLAS_QUALITY
// to LEAN with confidence.

describe('atlas quality tiers (Checkpoint B fallback)', () => {
  /** Pull the numeric (dx,dy,dW,dH) of every drawImage from a recorded log. */
  const stampCoords = (log: Call[]): number[][] =>
    log.filter((c) => c.op === 'drawImage').map((c) => c.args.slice(1).map(Number))

  it('defines a full and a half-res lean tier, both valid 2:1 sheets', () => {
    expect(ATLAS_QUALITY_FULL).toEqual({ name: 'full', width: ATLAS_W, height: ATLAS_H })
    expect(ATLAS_QUALITY_LEAN.width).toBe(ATLAS_W / 2)
    expect(ATLAS_QUALITY_LEAN.height).toBe(ATLAS_H / 2)
    // Both keep the equirectangular 2:1 aspect so the projection still lines up.
    expect(ATLAS_QUALITY_FULL.width).toBe(2 * ATLAS_QUALITY_FULL.height)
    expect(ATLAS_QUALITY_LEAN.width).toBe(2 * ATLAS_QUALITY_LEAN.height)
  })

  it('keeps the full tier live by default (Checkpoint B verdict)', () => {
    expect(ACTIVE_ATLAS_QUALITY).toBe(ATLAS_QUALITY_FULL)
  })

  it('atlasPixelLoad: lean is exactly a quarter of full', () => {
    expect(atlasPixelLoad(ATLAS_QUALITY_FULL)).toBe(ATLAS_W * ATLAS_H)
    expect(atlasPixelLoad(ATLAS_QUALITY_LEAN)).toBe(atlasPixelLoad(ATLAS_QUALITY_FULL) / 4)
  })

  it('renders onto a canvas sized to the chosen tier and grounds it fully', () => {
    const { factory } = makeFakeFactory()
    const canvas = renderAtlas(0, {
      createCanvas: factory,
      quality: ATLAS_QUALITY_LEAN,
    }) as CanvasLike & { __log: Call[] }
    expect(canvas.width).toBe(ATLAS_QUALITY_LEAN.width)
    expect(canvas.height).toBe(ATLAS_QUALITY_LEAN.height)
    const grounds = canvas.__log.filter(
      (c) => c.op === 'fillRect' && c.args[2] === ATLAS_QUALITY_LEAN.width && c.args[3] === ATLAS_QUALITY_LEAN.height,
    )
    expect(grounds.length).toBe(1)
  })

  it('is look-preserving: the lean tier stamps exactly the same plates as full', () => {
    const f = makeFakeFactory()
    const l = makeFakeFactory()
    const full = renderAtlas(BUSY_FRAME, { createCanvas: f.factory, quality: ATLAS_QUALITY_FULL }) as CanvasLike & { __log: Call[] }
    const lean = renderAtlas(BUSY_FRAME, { createCanvas: l.factory, quality: ATLAS_QUALITY_LEAN }) as CanvasLike & { __log: Call[] }
    const fullStamps = stampCoords(full.__log)
    const leanStamps = stampCoords(lean.__log)
    // Same number of sprite stamps (same cells, same seam-wraps) at both tiers.
    expect(leanStamps.length).toBe(fullStamps.length)
    expect(fullStamps.length).toBeGreaterThanOrEqual(visibleCellCountAt(BUSY_FRAME))
  })

  it('scales every draw by the resolution factor (lean coords are half of full)', () => {
    const f = makeFakeFactory()
    const l = makeFakeFactory()
    const full = renderAtlas(BUSY_FRAME, { createCanvas: f.factory, quality: ATLAS_QUALITY_FULL }) as CanvasLike & { __log: Call[] }
    const lean = renderAtlas(BUSY_FRAME, { createCanvas: l.factory, quality: ATLAS_QUALITY_LEAN }) as CanvasLike & { __log: Call[] }
    const fullStamps = stampCoords(full.__log)
    const leanStamps = stampCoords(lean.__log)
    const res = ATLAS_QUALITY_LEAN.width / ATLAS_W // 0.5
    for (let i = 0; i < fullStamps.length; i += 1) {
      for (let k = 0; k < 4; k += 1) {
        expect(leanStamps[i][k]).toBeCloseTo(fullStamps[i][k] * res, 6)
      }
    }
  })

  it('stays deterministic at the lean tier (two renders match call-for-call)', () => {
    const a = makeFakeFactory()
    const b = makeFakeFactory()
    const ca = renderAtlas(60, { createCanvas: a.factory, quality: ATLAS_QUALITY_LEAN }) as CanvasLike & { __log: Call[] }
    const cb = renderAtlas(60, { createCanvas: b.factory, quality: ATLAS_QUALITY_LEAN }) as CanvasLike & { __log: Call[] }
    expect(normalize(ca.__log)).toEqual(normalize(cb.__log))
  })

  it('defaults to the active tier when no quality is passed', () => {
    const a = makeFakeFactory()
    const b = makeFakeFactory()
    const dflt = renderAtlas(BUSY_FRAME, { createCanvas: a.factory }) as CanvasLike & { __log: Call[] }
    const active = renderAtlas(BUSY_FRAME, { createCanvas: b.factory, quality: ACTIVE_ATLAS_QUALITY }) as CanvasLike & { __log: Call[] }
    expect(normalize(dflt.__log)).toEqual(normalize(active.__log))
  })

  it('re-allocates the canvas when the tier dimensions change, reuses it otherwise', () => {
    const { factory } = makeFakeFactory()
    const full1 = renderAtlas(0, { createCanvas: factory, quality: ATLAS_QUALITY_FULL })
    const full2 = renderAtlas(5, { createCanvas: factory, quality: ATLAS_QUALITY_FULL })
    expect(full1).toBe(full2) // same dims → reused
    const lean1 = renderAtlas(0, { createCanvas: factory, quality: ATLAS_QUALITY_LEAN })
    expect(lean1).not.toBe(full1) // different dims → fresh canvas
    expect(lean1.width).toBe(ATLAS_QUALITY_LEAN.width)
  })
})
