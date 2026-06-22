/**
 * programScript.ts — pure frame-driven logic for the "programa" runner.
 * ─────────────────────────────────────────────────────────────────────
 * The schedule engine behind ProgramRunner (the tasklist/stepper of the
 * spec). It generalises TaskCardVideo's fixed-tempo plan and TimelineWidget's
 * static `current` into a parametric tempo: a pure (count, tempo) → schedule
 * derivation that every piece sequences against, at any rhythm —
 *
 *   - Prod01: ~50 slow steps, click by click, with dramatic holds
 *     (`advance` > `active` leaves travel gaps between steps).
 *   - Prod02: the same program run by AiKit in a fast cascade
 *     (`advance` < `active` overlaps steps — several run at once).
 *   - Yusta02: a handful of steps at a deliberate stepper pace.
 *
 * Everything here is pure data/maths — no React, no remotion — so the
 * choreography is unit-testable and shared by visuals and scene scripts.
 */

export type ProgramStep = {
  /** The instruction, e.g. "Copiar la referencia al CRM". */
  title: string
  /** Optional quiet second line, e.g. "Hoja 'Pedidos' · fila 12". */
  detail?: string
}

export type ProgramTempo = {
  /** Frame step 0 becomes active. Default 0. */
  startAt?: number
  /** Frames a step stays active before settling to done. Default 24. */
  active?: number | ((i: number) => number)
  /**
   * Frames between consecutive activations: step i+1 starts `advance(i)`
   * frames after step i. Defaults to `active(i)` (strictly sequential).
   * Smaller than `active` → cascade overlap; larger → gaps between steps.
   */
  advance?: number | ((i: number) => number)
  /** Pauses: `frames` inserted before step `before` activates (and pushing
   * everything after it). The micro-error / dramatic-hold beat. */
  holds?: readonly { before: number; frames: number }[]
}

export type ProgramSchedule = {
  count: number
  /** Frame step i becomes active. */
  activeAt: readonly number[]
  /** Frame step i settles to done. */
  doneAt: readonly number[]
  /** First frame every step is done (startAt for an empty program). */
  allDoneAt: number
}

export type StepState = 'pending' | 'active' | 'done'

/** The panel's raised relief (ProgramRunner's card at rest) — quoted by
 * scenes whose morph box takes over the plate (Prod03's TileMorph `from`). */
export const PROGRAM_PANEL_RELIEF = { radius: 32, distance: 10, blur: 22 } as const

const DEFAULT_ACTIVE = 24

const perStep = (v: number | ((i: number) => number) | undefined, fallback: (i: number) => number) =>
  v == null ? fallback : typeof v === 'number' ? () => v : v

/**
 * Derive the run schedule — the single source of truth shared by the
 * ProgramRunner visual and the scenes choreographing around it (cursor
 * clicks, windows reacting, stopwatch beats).
 */
export function programSchedule(count: number, tempo: ProgramTempo = {}): ProgramSchedule {
  const startAt = tempo.startAt ?? 0
  const active = perStep(tempo.active, () => DEFAULT_ACTIVE)
  const advance = perStep(tempo.advance, active)
  const holdBefore = (i: number) =>
    (tempo.holds ?? []).reduce((sum, h) => sum + (h.before === i ? h.frames : 0), 0)

  const activeAt: number[] = []
  const doneAt: number[] = []
  let cursor = startAt
  for (let i = 0; i < count; i++) {
    cursor += holdBefore(i)
    activeAt.push(cursor)
    doneAt.push(cursor + active(i))
    cursor += advance(i)
  }
  return {
    count,
    activeAt,
    doneAt,
    allDoneAt: doneAt.reduce((max, d) => Math.max(max, d), startAt),
  }
}

/** pendiente / activo / hecho for step i at `frame`. */
export function stepState(s: ProgramSchedule, i: number, frame: number): StepState {
  if (frame >= s.doneAt[i]) return 'done'
  if (frame >= s.activeAt[i]) return 'active'
  return 'pending'
}

/** Steps settled at `frame`. */
export function doneCount(s: ProgramSchedule, frame: number): number {
  return s.doneAt.reduce((n, d) => n + (frame >= d ? 1 : 0), 0)
}

/** The 1-based "paso X/N" counter: the latest step to have activated,
 * clamped to N once the run is past the end; 0 before work starts. */
export function currentStepNumber(s: ProgramSchedule, frame: number): number {
  return s.activeAt.reduce((n, a) => n + (frame >= a ? 1 : 0), 0)
}

/** Linear 0→1 progress of `frame` across [start, end], clamped; a collapsed
 * window degrades to a step at `end` (same contract as windowScript.phase). */
const phase = (frame: number, start: number, end: number): number => {
  if (end <= start) return frame >= end ? 1 : 0
  return Math.min(1, Math.max(0, (frame - start) / (end - start)))
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/**
 * Continuous 0→1 fill for the progress track: each step contributes 1/count,
 * ramping in over `ramp` frames from the moment it settles.
 */
export function progressFill(s: ProgramSchedule, frame: number, ramp = 10): number {
  if (s.count === 0) return 0
  return s.doneAt.reduce((p, d) => p + smooth(phase(frame, d, d + ramp)), 0) / s.count
}

/**
 * Fractional index of the step the viewport should focus on — eases from
 * i-1 to i across the `lead` frames before step i activates. Drives the
 * scroll-follow on long programs (the 50-step stepper can't fit on screen).
 */
export function focusIndex(s: ProgramSchedule, frame: number, lead = 8): number {
  let focus = 0
  for (let i = 1; i < s.count; i++) {
    focus += smooth(phase(frame, s.activeAt[i] - lead, s.activeAt[i]))
  }
  return focus
}

/** Composition duration that covers the run plus a held tail. */
export function programDuration(s: ProgramSchedule, tailFrames = 45): number {
  return s.allDoneAt + tailFrames
}

/**
 * Sanity-check an authored tempo for a program of `count` steps. Returns
 * human-readable problems (empty = valid): durations must be ≥ 1 frame per
 * step, holds must target real steps with non-negative frames.
 */
export function validateProgramTempo(count: number, tempo: ProgramTempo = {}): string[] {
  const errors: string[] = []
  const active = perStep(tempo.active, () => DEFAULT_ACTIVE)
  const advance = perStep(tempo.advance, active)
  for (let i = 0; i < count; i++) {
    if (active(i) < 1) errors.push(`step ${i}: active ${active(i)} must be ≥ 1 frame`)
    if (advance(i) < 1) errors.push(`step ${i}: advance ${advance(i)} must be ≥ 1 frame`)
  }
  for (const h of tempo.holds ?? []) {
    if (h.before < 0 || h.before >= count) {
      errors.push(`hold before step ${h.before}: no such step (program has ${count})`)
    }
    if (h.frames < 0) errors.push(`hold before step ${h.before}: ${h.frames} frames must be ≥ 0`)
  }
  return errors
}
