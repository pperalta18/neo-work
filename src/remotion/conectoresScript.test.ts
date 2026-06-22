import { describe, expect, it } from 'vitest'
import {
  CHAIN,
  CHAIN_DIRS,
  CHAIN_LEN,
  COLUMNS,
  DURATION,
  LOGOS,
  LOGO_END,
  PATH_END,
  PATH_START,
  ROWS,
  cameraPZ,
  fieldZoom,
  headAt,
  logoGrow,
  trailGrow,
} from './conectoresScript'

const W = 1920
const H = 1080
const key = (c: readonly number[]) => `${c[0]},${c[1]}`
const man = (a: readonly number[], b: readonly number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])

describe('conectoresScript — timeline', () => {
  it('logos settle, then the path runs, then the comp ends', () => {
    expect(LOGO_END).toBeLessThan(PATH_START)
    expect(PATH_START).toBeLessThan(PATH_END)
    expect(PATH_END).toBeLessThan(DURATION)
  })
})

describe('the five connectors', () => {
  it('are the five named tools at distinct in-bounds cells', () => {
    expect(LOGOS.map((l) => l.name)).toEqual(['outlook', 'notion', 'zapier', 'jira', 'gmail'])
    expect(new Set(LOGOS.map((l) => key(l.at))).size).toBe(5)
    for (const l of LOGOS) {
      // each logo keeps a clear ring inside the grid (never on an edge)
      expect(l.at[0]).toBeGreaterThanOrEqual(2)
      expect(l.at[0]).toBeLessThanOrEqual(COLUMNS - 1)
      expect(l.at[1]).toBeGreaterThanOrEqual(2)
      expect(l.at[1]).toBeLessThanOrEqual(ROWS - 1)
    }
  })

  it('all emerge before the path starts', () => {
    for (let i = 0; i < LOGOS.length; i += 1) expect(logoGrow(LOGO_END, i)).toBeGreaterThan(0.99)
  })
})

describe('the route goes AROUND, never through', () => {
  it('is one continuous 4-connected chain', () => {
    for (let i = 1; i < CHAIN.length; i += 1) expect(man(CHAIN[i], CHAIN[i - 1])).toBe(1)
  })

  it('never steps on a logo cell — it skirts them', () => {
    const logoCells = new Set(LOGOS.map((l) => key(l.at)))
    for (const c of CHAIN) expect(logoCells.has(key(c))).toBe(false)
  })

  it('actually encircles each logo: visits most of its 8-cell ring', () => {
    const inChain = new Set(CHAIN.map(key))
    for (const l of LOGOS) {
      const [c, r] = l.at
      const ring = [
        [c - 1, r], [c - 1, r - 1], [c, r - 1], [c + 1, r - 1],
        [c + 1, r], [c + 1, r + 1], [c, r + 1], [c - 1, r + 1],
      ]
      const hit = ring.filter((cell) => inChain.has(key(cell))).length
      expect(hit).toBe(8) // the whole ring is skirted
    }
  })

  it('has a direction for every cell but the terminal one', () => {
    expect(CHAIN_DIRS).toHaveLength(CHAIN_LEN - 1)
  })
})

describe('the head lays the trail and it stays', () => {
  it('nothing before it starts; the whole trail is down by the end', () => {
    expect(headAt(PATH_START - 1)).toBeLessThan(0)
    expect(trailGrow(PATH_START - 1, 0)).toBe(0)
    expect(trailGrow(PATH_END, 0)).toBeGreaterThan(0.99)
    expect(trailGrow(PATH_END, CHAIN_LEN - 2)).toBeGreaterThan(0.99)
  })
})

describe('camera', () => {
  it('frames the field wide and keeps the lens on the centre', () => {
    expect(COLUMNS * 128 * fieldZoom(W, H)).toBeGreaterThan(W) // bleeds horizontally
    expect(cameraPZ(0, W, H).P).toEqual([COLUMNS * 64, ROWS * 64])
  })
})
