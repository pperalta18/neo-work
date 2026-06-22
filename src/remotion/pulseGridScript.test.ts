import { describe, expect, it } from 'vitest'
import {
  BURSTS,
  CELL,
  COLUMNS,
  DURATION,
  GRID_CENTER,
  GRID_H,
  GRID_W,
  LEAD,
  NUM_PULSES,
  PERIOD,
  PULSE0,
  PULSE_FRAMES,
  ROWS,
  TAIL,
  Z_END,
  Z_START,
  cameraPZ,
  cometGrow,
  headProx,
  routeAlive,
  routeHead,
} from './pulseGridScript'

const W = 1920
const H = 1080
const man = (a: readonly number[], b: readonly number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1])
const inPlate = (c: number, r: number) => c >= 13 && c <= 16 && r >= 8 && r <= 11

describe('pulseGridScript — field & timeline', () => {
  it('the field is centred and bleeds the lens at every zoom', () => {
    expect(GRID_CENTER).toEqual([GRID_W / 2, GRID_H / 2])
    // cover zoom — the grid must always overflow 1920×1080 (no visible border)
    const cover = Math.max(W / GRID_W, H / GRID_H)
    expect(Z_END).toBeGreaterThan(cover)
    expect(Z_START).toBeGreaterThan(Z_END)
  })

  it('fires a steady train of beats inside the take', () => {
    expect(PULSE_FRAMES).toHaveLength(NUM_PULSES)
    expect(PULSE_FRAMES[0]).toBe(PULSE0)
    for (let i = 1; i < PULSE_FRAMES.length; i += 1) {
      expect(PULSE_FRAMES[i] - PULSE_FRAMES[i - 1]).toBe(PERIOD)
    }
    expect(PULSE_FRAMES[PULSE_FRAMES.length - 1]).toBeLessThan(DURATION)
  })
})

describe('every burst is a full radial fan of clean staircases', () => {
  it('each spoke is one continuous 4-connected chain that never touches the circle', () => {
    for (const burst of BURSTS) {
      expect(burst.routes.length).toBe(12)
      for (const route of burst.routes) {
        expect(route.cells.length).toBeGreaterThanOrEqual(6)
        expect(route.dirs).toHaveLength(route.cells.length)
        for (let i = 1; i < route.cells.length; i += 1) {
          expect(man(route.cells[i], route.cells[i - 1])).toBe(1) // 4-connected, no jumps
        }
        for (const c of route.cells) expect(inPlate(c[0], c[1])).toBe(false)
      }
    }
  })

  it('spokes leave in every direction (all four quadrants covered)', () => {
    for (const burst of BURSTS) {
      const ends = burst.routes.map((r) => r.cells[r.cells.length - 1])
      const right = ends.some((e) => e[0] > 16)
      const left = ends.some((e) => e[0] < 13)
      const down = ends.some((e) => e[1] > 11)
      const up = ends.some((e) => e[1] < 8)
      expect(right && left && down && up).toBe(true)
    }
  })

  it('is deterministic — same bursts on every module load', () => {
    expect(BURSTS[0].routes[0].cells).toEqual(BURSTS[0].routes[0].cells)
    // distinct bursts genuinely differ (the per-burst spin)
    expect(BURSTS[0].routes[0].cells).not.toEqual(BURSTS[1].routes[0].cells)
  })
})

describe('the comet — a bright head with a dissolving tail', () => {
  it('grow is a 0..1 crest that peaks at the head and is empty outside its window', () => {
    expect(cometGrow(5, 5)).toBeGreaterThan(0.95) // head on the cell
    expect(cometGrow(5, 5 + TAIL + 0.5)).toBe(0) // not reached yet (ahead)
    expect(cometGrow(5, 5 - TAIL - 0.5)).toBe(0) // long dissolved (behind)
    // the tail fades monotonically behind the head
    expect(cometGrow(5, 4)).toBeGreaterThan(cometGrow(5, 3))
    for (let h = 0; h <= 10; h += 0.5) {
      for (let k = -2; k <= 14; k += 1) {
        const g = cometGrow(h, k)
        expect(g).toBeGreaterThanOrEqual(0)
        expect(g).toBeLessThanOrEqual(1)
      }
    }
  })

  it('a comet shows nothing well before its spoke fires', () => {
    const burst = BURSTS[0]
    const route = burst.routes[0]
    expect(routeHead(burst.frame - 30, burst, route)).toBeLessThan(-LEAD)
    expect(routeAlive(burst.frame - 5, burst, route)).toBe(false)
    expect(headProx(-5, 0)).toBe(0)
  })

  it('the spokes ignite in sequence — a rotating sweep, not one pop', () => {
    for (const burst of BURSTS) {
      const delays = burst.routes.map((r) => r.startDelay)
      expect(Math.min(...delays)).toBeLessThanOrEqual(2) // the first spoke fires ~on the beat
      expect(Math.max(...delays)).toBeGreaterThan(delays[0] + 10) // the last lags well behind
    }
  })
})

describe('the camera — one slow, centred pull-back', () => {
  it('the lens stays pinned on the centre and only pulls back, monotonically', () => {
    expect(cameraPZ(0, W, H).P).toEqual(GRID_CENTER)
    expect(cameraPZ(DURATION, W, H).P).toEqual(GRID_CENTER)
    // monotonic zoom-out — no beat wobble
    let prev = cameraPZ(0, W, H).Z
    for (let f = 30; f <= DURATION; f += 30) {
      const z = cameraPZ(f, W, H).Z
      expect(z).toBeLessThanOrEqual(prev + 1e-9)
      prev = z
    }
    expect(cameraPZ(0, W, H).Z).toBeCloseTo(Z_START, 5)
    // never below the cover zoom — the field must keep bleeding
    expect(cameraPZ(DURATION, W, H).Z).toBeGreaterThan(Math.max(W / GRID_W, H / GRID_H))
    expect(Z_END).toBeGreaterThan(Math.max(W / GRID_W, H / GRID_H))
    expect(COLUMNS * CELL).toBe(GRID_W)
    expect(ROWS * CELL).toBe(GRID_H)
  })
})
