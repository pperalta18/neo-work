import { describe, expect, it } from 'vitest'
import {
  ARROW_COL,
  CELL,
  CHEVRON_ROWS,
  COLUMNS,
  CREADOR_PLAY,
  CREADOR_ROW,
  CREADOR_ROWSPAN,
  DURATION,
  GRID_IN,
  HERO,
  HERO_BUILT,
  HERO_STEPS,
  PAINT_START,
  PAINT_STEP,
  PAN_END,
  PAN_START,
  PANEL_END,
  PANEL_START,
  REVEAL_END,
  ROWS,
  SKILLS,
  STEP_COL0,
  STEP_COLSPAN,
  STEP_ROWS,
  TRAVEL_START,
  Z_BUILD,
  Z_FOLLOW,
  cameraPZ,
  cellGrow,
  colCenter,
  creadorGrow,
  leftStepGrow,
  paintedGrow,
  panEase,
  panelPress,
  panelRowSpan,
  stepRowAt,
  titleOpacity,
  twinLit,
} from './creadorSkillsScript'

describe('creadorSkillsScript — timeline', () => {
  it('grids in, walks, forges, builds, holds, then pans — in order', () => {
    expect(GRID_IN[1]).toBeLessThan(TRAVEL_START)
    expect(TRAVEL_START).toBeLessThan(CREADOR_PLAY)
    expect(CREADOR_PLAY).toBeLessThan(PANEL_START)
    expect(PANEL_START).toBeLessThan(PANEL_END)
    expect(PANEL_END).toBeLessThanOrEqual(REVEAL_END)
    expect(REVEAL_END).toBe(PAINT_START)
    expect(PAINT_START).toBeLessThan(HERO_BUILT)
    expect(HERO_BUILT).toBeLessThan(PAN_START)
    expect(PAN_START).toBeLessThan(PAN_END)
    expect(PAN_END).toBeLessThan(DURATION)
  })
})

describe('the backbone runs THROUGH the steps', () => {
  it('the arrow column sits inside every step footprint (not beside it)', () => {
    expect(ARROW_COL).toBeGreaterThanOrEqual(STEP_COL0)
    expect(ARROW_COL).toBeLessThanOrEqual(STEP_COL0 + STEP_COLSPAN - 1)
  })
  it('the chevrons interleave the step rows around the steps', () => {
    const stepSet = new Set<number>(STEP_ROWS)
    for (const r of CHEVRON_ROWS) expect(stepSet.has(r)).toBe(false)
    expect(Math.min(...CHEVRON_ROWS)).toBeLessThan(Math.min(...STEP_ROWS))
    expect(Math.max(...CHEVRON_ROWS)).toBeGreaterThan(Math.max(...STEP_ROWS))
  })
})

describe('the descending head', () => {
  it('raises every chevron + step by the time it reaches the creador', () => {
    for (const row of CHEVRON_ROWS) expect(cellGrow(CREADOR_PLAY, row)).toBeGreaterThan(0.99)
    for (let i = 0; i < HERO_STEPS; i += 1) expect(leftStepGrow(CREADOR_PLAY, i)).toBeGreaterThan(0.99)
  })
  it('rises the creador plate exactly as the head arrives', () => {
    expect(creadorGrow(TRAVEL_START)).toBeLessThan(0.01)
    expect(creadorGrow(CREADOR_PLAY)).toBeGreaterThan(0.99)
  })
  it('leaves the left steps un-lit until the paint (the right ones light them)', () => {
    for (let i = 0; i < HERO_STEPS; i += 1) expect(twinLit(CREADOR_PLAY, i)).toBe(0)
  })
})

describe('the press + the painted steps', () => {
  it('one big cell presses in together: flat before, fully sunk by PANEL_END', () => {
    expect(panelPress(PANEL_START - 1)).toBe(0)
    expect(panelPress(PANEL_END)).toBeGreaterThan(0.99)
  })
  it('the «Creador de presupuestos» label rises with the press', () => {
    expect(titleOpacity(PANEL_START)).toBeLessThan(0.2)
    expect(titleOpacity(PANEL_END)).toBeGreaterThan(0.99)
  })
  it('paints the steps one at a time; each card appears and persists', () => {
    for (let i = 0; i < HERO_STEPS; i += 1) {
      expect(paintedGrow(PAINT_START - 1, i)).toBe(0)
      expect(paintedGrow(HERO_BUILT, i)).toBeGreaterThan(0.99) // card built & stays
    }
    for (let i = 1; i < HERO_STEPS; i += 1) {
      const mid = PAINT_START + (i - 1) * PAINT_STEP + 8
      expect(paintedGrow(mid, i - 1)).toBeGreaterThan(paintedGrow(mid, i))
    }
  })

  it('lights each step ONLY while it generates, then it settles back to natural', () => {
    for (let i = 0; i < HERO_STEPS; i += 1) {
      const s = PAINT_START + i * PAINT_STEP
      expect(twinLit(s - 30, i)).toBeLessThan(0.05) // before: natural
      expect(twinLit(s + 14, i)).toBeGreaterThan(0.9) // during: lit
      expect(twinLit(s + PAINT_STEP + 40, i)).toBeLessThan(0.05) // after: natural again
    }
  })
})

describe('the skill fleet', () => {
  it('has the hero first, moved close to the left process, plus more skills', () => {
    expect(SKILLS.length).toBeGreaterThanOrEqual(4)
    expect(HERO).toBe(SKILLS[0])
    expect(HERO.title).toBe('Creador de presupuestos')
    // hero sits just right of the left steps (only a small gap)
    expect(HERO.col0).toBeGreaterThan(STEP_COL0 + STEP_COLSPAN - 1)
    expect(HERO.col0 - (STEP_COL0 + STEP_COLSPAN - 1)).toBeLessThanOrEqual(3)
  })
  it('has distinct titles, varied lengths, and never overlaps in columns or bounds', () => {
    expect(new Set(SKILLS.map((s) => s.title)).size).toBe(SKILLS.length)
    expect(new Set(SKILLS.map((s) => s.steps.length)).size).toBeGreaterThan(1) // varied lengths
    const ordered = [...SKILLS].sort((a, b) => a.col0 - b.col0)
    for (let i = 1; i < ordered.length; i += 1) {
      expect(ordered[i].col0).toBeGreaterThan(ordered[i - 1].col0 + ordered[i - 1].span - 1)
    }
    for (const s of SKILLS) {
      expect(s.col0 + s.span - 1).toBeLessThanOrEqual(COLUMNS)
      expect(2 + panelRowSpan(s.steps.length) - 1).toBeLessThanOrEqual(ROWS) // panel fits vertically
    }
  })
})

describe('geometry stays in bounds', () => {
  it('the creador is one cell tall and above the grid floor', () => {
    expect(CREADOR_ROWSPAN).toBe(1)
    expect(CREADOR_ROW + CREADOR_ROWSPAN - 1).toBeLessThanOrEqual(ROWS)
    expect(Math.max(...STEP_ROWS)).toBeLessThan(CREADOR_ROW)
  })
})

describe('the act-2 linear pan', () => {
  it('panEase is a clamped, monotonic 0→1 ramp', () => {
    expect(panEase(0)).toBe(0)
    expect(panEase(1)).toBeCloseTo(1, 5)
    expect(panEase(-1)).toBe(0)
    expect(panEase(2)).toBeCloseTo(1, 5)
    let prev = -1
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const v = panEase(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })
  it('is roughly constant-speed through the middle', () => {
    const d1 = panEase(0.5) - panEase(0.4)
    const d2 = panEase(0.6) - panEase(0.5)
    expect(Math.abs(d1 - d2)).toBeLessThan(0.01)
  })
})

describe('camera', () => {
  it('follows tight, settles to the build zoom, then sweeps right', () => {
    expect(cameraPZ(0).Z).toBe(Z_FOLLOW)
    expect(cameraPZ(CREADOR_PLAY).Z).toBe(Z_FOLLOW)
    expect(Z_BUILD).toBeLessThan(Z_FOLLOW)
    expect(cameraPZ(PAN_START).Z).toBe(Z_BUILD)
    // the pan moves the lens to the right and ends on the far skills
    expect(cameraPZ(PAN_END).P[0]).toBeGreaterThan(cameraPZ(PAN_START).P[0])
    expect(cameraPZ(PAN_END).P[0]).toBeCloseTo(colCenter(40), 5)
    // the build framing keeps the hero off-centre to the right of the left steps
    expect(cameraPZ(PAN_START).P[0]).toBeCloseTo(colCenter(8), 5)
  })
})

describe('the painted cards line up with the left twins', () => {
  it('each painted step shares its twin row', () => {
    for (let i = 0; i < HERO_STEPS; i += 1) expect(stepRowAt(i)).toBe(STEP_ROWS[i])
  })
  it('frames are 1920×1080-independent (camera takes only frame)', () => {
    expect(cameraPZ(0)).toHaveProperty('P')
    expect(typeof CELL).toBe('number')
  })
})
