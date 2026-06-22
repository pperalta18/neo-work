/**
 * creadorSkillsScript — pure frame-driven brain of «Creador de skills».
 * ───────────────────────────────────────────────────────────────────────────
 * Act 1 — a trail of arrow elevations descends a backbone that runs THROUGH four
 * budget steps (icon + skeleton bar, NO numbers — it's the manual process being
 * executed). The head reaches the one-cell-tall **Creador de skills** plate (the
 * Skill-Forge Rive logo, which plays the instant it's touched). Then, just to its
 * right, **one big cell presses in** and the steps **paint themselves into it**,
 * now numbered, under the label «Creador de presupuestos»; each painted step
 * lights its twin on the left.
 *
 * Act 2 — a beat after the skill is built, the camera **pans linearly to the
 * right** and reveals a whole fleet of other skills the forge has already made,
 * each a labelled pressed panel with its own steps (varied names + lengths).
 *
 * Everything is a pure function of `frame`; the shell only reads these anchors.
 */
import { CELL } from '@/lib/neumorphism'
import type { IconName } from '@/components/icons'

export const FPS = 30

// ── small pure math ─────────────────────────────────────────────────────────────
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
export const window01 = (f: number, lo: number, hi: number) => smoother((f - lo) / (hi - lo))

/** A constant-speed (linear) ramp with soft start/stop — for the act-2 pan. */
export function panEase(x: number): number {
  const t = clamp01(x)
  const r = 0.16
  const v = 1 / (1 - r)
  if (t < r) return (0.5 * v * t * t) / r
  if (t > 1 - r) {
    const u = 1 - t
    return 1 - (0.5 * v * u * u) / r
  }
  return v * (t - 0.5 * r)
}

// ── the skill catalogue (index 0 is the hero we forge on screen) ─────────────────
export type SkillStep = { icon: IconName; len: number }
export type Skill = { col0: number; span: number; title: string; steps: SkillStep[] }

export const SKILLS: Skill[] = [
  {
    col0: 8,
    span: 6,
    title: 'Creador de presupuestos',
    steps: [
      { icon: 'mouse', len: 1.0 },
      { icon: 'userSearch', len: 0.82 },
      { icon: 'folder', len: 0.95 },
      { icon: 'calculator', len: 0.72 },
    ],
  },
  {
    col0: 18,
    span: 5,
    title: 'Clasificador de tickets',
    steps: [
      { icon: 'user', len: 0.7 },
      { icon: 'target', len: 0.95 },
      { icon: 'check', len: 0.6 },
    ],
  },
  {
    col0: 25,
    span: 7,
    title: 'Extractor de facturas',
    steps: [
      { icon: 'folder', len: 0.9 },
      { icon: 'calculator', len: 0.6 },
      { icon: 'check', len: 0.85 },
      { icon: 'flag', len: 0.7 },
      { icon: 'star', len: 0.5 },
    ],
  },
  {
    col0: 34,
    span: 5,
    title: 'Conciliador bancario',
    steps: [
      { icon: 'calculator', len: 0.8 },
      { icon: 'global', len: 0.65 },
      { icon: 'check', len: 0.92 },
    ],
  },
  {
    col0: 41,
    span: 6,
    title: 'Buscador de leads',
    steps: [
      { icon: 'userSearch', len: 0.78 },
      { icon: 'target', len: 0.9 },
      { icon: 'sparkles', len: 0.6 },
      { icon: 'brain', len: 0.85 },
    ],
  },
]

export const HERO = SKILLS[0]
export const HERO_STEPS = HERO.steps.length

/** Row of step i inside a panel (rows 2, 4, 6 … — a gap row between steps). */
export const stepRowAt = (i: number) => 2 + 2 * i
/** Inclusive row span a panel of n steps occupies (rows 2 … 2n). */
export const panelRowSpan = (n: number) => 2 * n - 1

// ── field geometry (a wide field — the fleet lives off to the right) ─────────────
const lastSkill = SKILLS[SKILLS.length - 1]
export const COLUMNS = lastSkill.col0 + lastSkill.span - 1 + 2 // 48
export const ROWS = 12
export { CELL }
export const GRID_W = COLUMNS * CELL
export const GRID_H = ROWS * CELL
export const colCenter = (c: number) => (c - 0.5) * CELL
export const rowCenter = (r: number) => (r - 0.5) * CELL

// ── left column: the backbone runs THROUGH the (un-numbered) steps ───────────────
export const STEP_COL0 = 3
export const STEP_COLSPAN = 3 // cols 3..5 — compact
export const ARROW_COL = STEP_COL0 + Math.floor(STEP_COLSPAN / 2) // 4 (dead-centre)
export const STEP_ROWS = HERO.steps.map((_, i) => stepRowAt(i)) // [2,4,6,8]
export const CHEVRON_ROWS = [1, 3, 5, 7, 9] as const
export const CREADOR_COL0 = STEP_COL0
export const CREADOR_COLSPAN = STEP_COLSPAN
export const CREADOR_ROW = 10
export const CREADOR_ROWSPAN = 1

// ── the travelling head ──────────────────────────────────────────────────────────
export const TRAVEL_START = 22
export const PER_ROW = 13
export function headRow(frame: number): number {
  return (frame - TRAVEL_START) / PER_ROW
}
const frameAtRow = (row: number) => TRAVEL_START + row * PER_ROW
const GROW_SPAN = 1.5
export function cellGrow(frame: number, row: number): number {
  return smoother(clamp01((headRow(frame) - row + GROW_SPAN) / GROW_SPAN))
}
export function leftStepGrow(frame: number, i: number): number {
  return cellGrow(frame, STEP_ROWS[i])
}
export function creadorGrow(frame: number): number {
  return cellGrow(frame, CREADOR_ROW)
}
export const CREADOR_PLAY = Math.round(frameAtRow(CREADOR_ROW)) // 152

// ── timeline (30 fps) ────────────────────────────────────────────────────────────
export const GRID_IN: [number, number] = [0, 18]
export const FORGE_HOLD = 42
export const PANEL_START = CREADOR_PLAY + FORGE_HOLD // 194 — the big cell presses in
export const PANEL_IN = 42
export const PANEL_END = PANEL_START + PANEL_IN // 236
export const REVEAL_END = PANEL_START + 64 // 258 — camera settled on the build framing
export const PAINT_START = REVEAL_END // 258
export const PAINT_STEP = 32
export const PAINT_DUR = 28
export const HERO_BUILT = PAINT_START + (HERO_STEPS - 1) * PAINT_STEP + PAINT_DUR // 382
export const HOLD_AFTER = 34 // ~1 s beat once the skill is built
export const PAN_START = HERO_BUILT + HOLD_AFTER // 416
export const PAN_DUR = 176
export const PAN_END = PAN_START + PAN_DUR // 592
export const END_HOLD = 34
export const DURATION = PAN_END + END_HOLD // 626

/** The hero's big cell presses in together (0 → 1). */
export const panelPress = (frame: number) => window01(frame, PANEL_START, PANEL_END)
/** The «Creador de presupuestos» label rises above the panel as it presses. */
export const titleOpacity = (frame: number) => window01(frame, PANEL_START + 6, PANEL_START + 40)

/** Hero step i paints into the press (0→1). */
export function paintedGrow(frame: number, i: number): number {
  return smoother(clamp01((frame - (PAINT_START + i * PAINT_STEP)) / PAINT_DUR))
}
/** Step i "lights up" ONLY while it's being generated (left twin + right card),
 *  then settles back to its natural, un-lit state. A transient pulse, not a fill. */
export function twinLit(frame: number, i: number): number {
  const s = PAINT_START + i * PAINT_STEP
  const e = s + PAINT_DUR
  return clamp01(window01(frame, s - 4, s + 12) * (1 - window01(frame, e, e + 20)))
}

// ── camera (P, Z) — follow · dwell · reveal · build · hold · LINEAR PAN ───────────
export const Z_FOLLOW = 1.3
export const Z_BUILD = 0.85
const P_BUILD: [number, number] = [colCenter(8), rowCenter(5.5)]
const PAN_END_X = colCenter(40)

export function cameraPZ(frame: number): { P: [number, number]; Z: number } {
  // WALK — follow the descending head down the backbone.
  if (frame <= CREADOR_PLAY) {
    const t = smoother(clamp01((headRow(frame) + 0.5 - 3.5) / (CREADOR_ROW + 0.5 - 3.5)))
    const py = lerp(rowCenter(3.5), rowCenter(CREADOR_ROW + 0.5), t)
    return { P: [colCenter(ARROW_COL), py], Z: Z_FOLLOW }
  }
  // DWELL — hold on the creador plate while the forge logo reacts.
  if (frame <= PANEL_START) {
    return { P: [colCenter(ARROW_COL), rowCenter(CREADOR_ROW)], Z: Z_FOLLOW }
  }
  // REVEAL — zoom out + pan to frame the left process + the new skill.
  if (frame <= REVEAL_END) {
    const t = smoother(clamp01((frame - PANEL_START) / (REVEAL_END - PANEL_START)))
    return {
      P: [lerp(colCenter(ARROW_COL), P_BUILD[0], t), lerp(rowCenter(CREADOR_ROW), P_BUILD[1], t)],
      Z: lerp(Z_FOLLOW, Z_BUILD, t),
    }
  }
  // BUILD + HOLD — frame the build, then a beat.
  if (frame <= PAN_START) {
    return { P: P_BUILD, Z: Z_BUILD }
  }
  // PAN — a linear sweep right across the fleet of created skills.
  if (frame <= PAN_END) {
    const t = panEase((frame - PAN_START) / PAN_DUR)
    return { P: [lerp(P_BUILD[0], PAN_END_X, t), P_BUILD[1]], Z: Z_BUILD }
  }
  // END — rest on the far skills.
  return { P: [PAN_END_X, P_BUILD[1]], Z: Z_BUILD }
}
