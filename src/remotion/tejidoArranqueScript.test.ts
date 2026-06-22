import { describe, expect, it } from 'vitest'
import { isModuleName } from '@/stories/neo/modules/modules'
import { RIVE_CLIPS } from './riveClips'
import {
  CHAIN,
  CHAIN_DIRS,
  CHAIN_LEN,
  COLUMNS,
  DURATION,
  MODULE_LAYOUT,
  MODULE_TRIGGER,
  P1_END,
  P1_START,
  P2_END,
  P2_START,
  P3_END,
  P3_START,
  P4_END,
  P4_START,
  RELAY_CELLS,
  RELAY_LEN,
  cameraPZ,
  cellGrow,
  fieldZoom,
  headAt,
  iconGrow,
  isModuleCell,
  isPersistent,
  seedZoom,
} from './tejidoArranqueScript'

const W = 1920
const H = 1080
const man = (a: readonly number[], b: readonly number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])

describe('tejidoArranqueScript — timeline', () => {
  it('beats are strictly ordered and the comp ends after the last one', () => {
    expect(P1_START).toBeLessThan(P1_END)
    expect(P1_END).toBeLessThan(P2_START)
    expect(P2_START).toBeLessThan(P2_END)
    expect(P2_END).toBeLessThan(P3_START)
    expect(P3_START).toBeLessThan(P3_END)
    expect(P3_END).toBeLessThan(P4_START)
    expect(P4_START).toBeLessThan(P4_END)
    expect(P4_END).toBeLessThan(DURATION)
  })
})

describe('the one continuous chain', () => {
  it('is 4-connected end to end (loop laps + route), starting on the loop cell', () => {
    expect(CHAIN[0]).toEqual(RELAY_CELLS[0].at)
    for (let i = 1; i < CHAIN.length; i += 1) {
      expect(man(CHAIN[i], CHAIN[i - 1])).toBe(1)
    }
  })

  it('circles the centre clockwise (↑→↓←) for the relay portion', () => {
    expect(RELAY_CELLS.map((c) => c.dir)).toEqual(['up', 'right', 'down', 'left'])
    expect(CHAIN_DIRS.slice(0, 4)).toEqual(['up', 'right', 'down', 'left'])
  })

  it('rests on the first central cell, where the persistent route begins', () => {
    // CONTINUITY: the route picks up from the cell the arrow was circling.
    expect(CHAIN[RELAY_LEN]).toEqual(RELAY_CELLS[0].at)
    expect(isPersistent(RELAY_LEN)).toBe(true)
    expect(isPersistent(RELAY_LEN - 1)).toBe(false)
  })

  it('threads every module cell from the centre out', () => {
    const inChain = new Set(CHAIN.map((c) => `${c[0]},${c[1]}`))
    for (const m of MODULE_LAYOUT) {
      expect(inChain.has(`${m.at[0]},${m.at[1]}`)).toBe(true)
      expect(isModuleCell(m.at)).toBe(true)
    }
    expect(CHAIN_LEN).toBeGreaterThan(RELAY_LEN + MODULE_LAYOUT.length)
  })
})

describe('the head walks it once, with continuity', () => {
  it('circles during beat 1: one loop cell lit at a time', () => {
    expect(headAt(P1_START)).toBeCloseTo(0, 5)
    expect(cellGrow(P1_START, 0)).toBeGreaterThan(0.99) // on cell 0
    expect(cellGrow(P1_START, 1)).toBeLessThan(0.01)
    // a couple of steps later the head has moved on round the square
    expect(cellGrow(P1_START + 2 * 16, 2)).toBeGreaterThan(0.99)
    expect(cellGrow(P1_START + 2 * 16, 0)).toBeLessThan(0.01)
  })

  it('loop cells SINK (ephemeral); they are dark again while the arrow rests', () => {
    const resting = Math.round((P1_END + P4_START) / 2) // mid hold (beats 2–3)
    for (let i = 0; i < RELAY_LEN; i += 1) expect(cellGrow(resting, i)).toBeLessThan(0.02)
    // ...but the resting arrow at the centre stays up the whole time
    expect(cellGrow(resting, RELAY_LEN)).toBeGreaterThan(0.99)
    expect(cellGrow(resting, RELAY_LEN + 1)).toBeLessThan(0.05)
  })

  it('route cells STAY: by the end the whole trail is laid', () => {
    expect(cellGrow(P4_START - 1, RELAY_LEN + 1)).toBeLessThan(0.05)
    expect(cellGrow(P4_END, RELAY_LEN + 1)).toBeGreaterThan(0.99)
    expect(cellGrow(P4_END, CHAIN_LEN - 2)).toBeGreaterThan(0.99)
  })
})

describe('beat 3 — the 16 scattered modules', () => {
  it('is the full catalogue: 16 unique modules at 16 unique in-bounds cells', () => {
    expect(MODULE_LAYOUT).toHaveLength(16)
    expect(new Set(MODULE_LAYOUT.map((m) => m.name)).size).toBe(16)
    expect(new Set(MODULE_LAYOUT.map((m) => `${m.at[0]},${m.at[1]}`)).size).toBe(16)
    for (const m of MODULE_LAYOUT) {
      expect(isModuleName(m.name)).toBe(true)
      expect(m.at[0]).toBeGreaterThanOrEqual(1)
      expect(m.at[0]).toBeLessThanOrEqual(COLUMNS)
      expect(m.at[1]).toBeGreaterThanOrEqual(1)
    }
  })

  it('every icon is fully emerged once the beat is done', () => {
    for (let i = 0; i < MODULE_LAYOUT.length; i += 1) {
      expect(iconGrow(P3_END, i)).toBeGreaterThan(0.99)
    }
    expect(iconGrow(P3_START - 1, 0)).toBeLessThan(0.5)
  })

  it('each module fires its Rive clip as the head passes, finishing before the comp ends', () => {
    expect(MODULE_TRIGGER).toHaveLength(MODULE_LAYOUT.length)
    for (let i = 0; i < MODULE_LAYOUT.length; i += 1) {
      const t = MODULE_TRIGGER[i]
      expect(t).toBeGreaterThanOrEqual(P4_START)
      expect(t).toBeLessThanOrEqual(P4_END)
      const meta = RIVE_CLIPS[MODULE_LAYOUT[i].name as keyof typeof RIVE_CLIPS]
      expect(t + meta.frames).toBeLessThanOrEqual(DURATION)
    }
  })
})

describe('camera', () => {
  it('starts tight on the closed square and pulls back to the bleeding field', () => {
    expect(seedZoom(W, H)).toBeGreaterThan(fieldZoom(W, H))
    expect(cameraPZ(0, W, H).Z).toBeCloseTo(seedZoom(W, H), 5)
    expect(cameraPZ(P3_START, W, H).Z).toBeCloseTo(fieldZoom(W, H), 5)
  })

  it('the field zoom is big enough that the grid bleeds off every edge', () => {
    const zf = fieldZoom(W, H)
    expect(COLUMNS * 128 * zf).toBeGreaterThan(W)
    expect(16 * 128 * zf).toBeGreaterThan(H)
  })

  it('keeps the lens centred on the grid the whole time', () => {
    for (const f of [0, P2_START, P3_START, P4_START, DURATION - 1]) {
      expect(cameraPZ(f, W, H).P).toEqual([COLUMNS * 64, 16 * 64])
    }
  })
})
