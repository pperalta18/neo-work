import { describe, expect, it } from 'vitest'
import { TEJIDO_VIVO_DURATION, generateMaster } from './tejidoVivoScript'
import {
  ALL_FACE_SRCS,
  ENTER_DUR,
  LAYERS,
  OWNER_CELL_C,
  OWNER_CELL_R,
  ROSTROS_VIVOS_DURATION,
  ownerRevealAt,
  sheetStateAt,
} from './rostrosVivosScript'

describe('rostrosVivosScript — layers', () => {
  it('base is the exact Tejido vivo field; the top layer runs different processes', () => {
    const base = LAYERS[0]
    const top = LAYERS[1]
    expect(base.enterAt).toBe(0)
    expect(base.seed).toBeUndefined() // default seed ⇒ exact Tejido vivo
    expect(base.scale).toBe(1)
    expect(top.seed).toBeDefined()
    expect(top.enterAt).toBeGreaterThan(0)
    expect(top.scale).toBeLessThan(1) // an inset sheet on top
    expect(top.face.src).not.toBe(base.face.src) // another profile
  })

  it('the two fields are genuinely different schedules', () => {
    const a = generateMaster(LAYERS[0].seed)
    const b = generateMaster(LAYERS[1].seed)
    // Different seeds ⇒ different spawn count or first placements.
    const sameStart = a.length === b.length && a.every((e, i) => e.tmpl === b[i].tmpl && e.off[0] === b[i].off[0] && e.off[1] === b[i].off[1])
    expect(sameStart).toBe(false)
  })

  it('every face points at a rostros/*.png and all are preloaded', () => {
    for (const l of LAYERS) expect(l.face.src).toMatch(/^rostros\/.+\.png$/)
    expect(ALL_FACE_SRCS).toEqual(LAYERS.map((l) => l.face.src))
  })
})

describe('rostrosVivosScript — sheet entry', () => {
  it('the base is always fully present; an upper sheet slides+fades to rest', () => {
    expect(sheetStateAt(LAYERS[0], 0)).toEqual({ dy: 0, opacity: 1, land: 1 })

    const top = LAYERS[1]
    const before = sheetStateAt(top, top.enterAt - 1)
    expect(before.opacity).toBe(0)
    expect(before.dy).toBeGreaterThan(0)

    const landed = sheetStateAt(top, top.enterAt + ENTER_DUR + 2)
    expect(landed.land).toBeCloseTo(1, 2)
    expect(landed.dy).toBeCloseTo(0, 2)
    expect(landed.opacity).toBeCloseTo(1, 2)
  })
})

describe('rostrosVivosScript — owner face + duration', () => {
  it('owner sits in the top-left corner cell and reveals gently', () => {
    expect(OWNER_CELL_C).toBe(1)
    expect(OWNER_CELL_R).toBe(1)
    expect(ownerRevealAt(0)).toBe(0)
    expect(ownerRevealAt(50)).toBeCloseTo(1, 2)
  })

  it('runs for the same duration as Tejido vivo', () => {
    expect(ROSTROS_VIVOS_DURATION).toBe(TEJIDO_VIVO_DURATION)
  })
})
