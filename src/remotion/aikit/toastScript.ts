/**
 * toastScript.ts — pure frame-driven logic for the notification toasts.
 * ─────────────────────────────────────────────────────────────────────
 * The stack engine behind NotificationToast/ToastStack: ToastWidget's CSS
 * rise (`neo-toast-rise`, 0.5s ease-out) ported to a pure pose, plus the
 * cascade/stacking choreography the spec asks for (Prod04's "ToastWidget en
 * cascada"). Pure data/maths — no React, no remotion — so the stack motion
 * is unit-testable and scenes can read slots for cursor/camera targets.
 *
 * Timeline contract per toast:
 *   - `showAt`  — frame the toast starts its rise into the stack.
 *   - `hideAt?` — frame it starts leaving; omitted = stays on screen.
 * A toast displaces the stack by its `presence` (0→1 as it enters, →0 as it
 * leaves), so older toasts slide down a slot as new ones land and ease back
 * when one departs — all fractional, all per-frame.
 */

export type ToastVariant = 'success' | 'warning' | 'info' | 'error'

export type ToastSpec = {
  /** Sets the rail colour + status icon in the visual. Default 'success'. */
  variant?: ToastVariant
  /** Bold headline of the toast. */
  title: string
  /** Muted line under the title. Optional. */
  message?: string
  /** Tiny timestamp next to the tag (free text), e.g. 'ahora'. */
  time?: string
  /** Frame the toast starts entering the stack. */
  showAt: number
  /** Frame it starts leaving. Omit for a toast that stays. */
  hideAt?: number
}

/** Frames of the entrance rise — the widget's 0.5s `neo-toast-rise` @30fps. */
export const TOAST_ENTER = 15
/** Frames of the exit slide — leaves quicker than it arrives (accelerate). */
export const TOAST_EXIT = 10

/** Linear 0→1 progress across [start, end], clamped; a collapsed window
 * degrades to a step at `end` (same contract as windowScript.phase). */
const phase = (frame: number, start: number, end: number): number => {
  if (end <= start) return frame >= end ? 1 : 0
  return Math.min(1, Math.max(0, (frame - start) / (end - start)))
}

// House easing without a remotion dep (pure-module rule): decelerate in,
// accelerate out — the CURVE.enter / CURVE.exit asymmetry.
const cubicOut = (t: number) => 1 - (1 - t) ** 3
const cubicIn = (t: number) => t * t * t

/** Eased 0→1 entrance progress of `toast` at `frame` (1 = settled). */
export function enterPhase(toast: ToastSpec, frame: number): number {
  return cubicOut(phase(frame, toast.showAt, toast.showAt + TOAST_ENTER))
}

/** Eased 0→1 exit progress (0 until `hideAt`; always 0 for a staying toast). */
export function exitPhase(toast: ToastSpec, frame: number): number {
  if (toast.hideAt == null) return 0
  return cubicIn(phase(frame, toast.hideAt, toast.hideAt + TOAST_EXIT))
}

/** How much of a stack slot the toast occupies at `frame` (0→1→0). The
 * displacement weight older toasts are pushed by. */
export function presence(toast: ToastSpec, frame: number): number {
  return enterPhase(toast, frame) * (1 - exitPhase(toast, frame))
}

/** True once the toast has fully left (never true for a staying toast). */
export function isGone(toast: ToastSpec, frame: number): boolean {
  return toast.hideAt != null && frame >= toast.hideAt + TOAST_EXIT
}

/** True while the toast should be rendered at all. */
export function isOnScreen(toast: ToastSpec, frame: number): boolean {
  return frame >= toast.showAt && !isGone(toast, frame)
}

/**
 * Fractional slot of toast `index` at `frame`: 0 = the anchor (newest), each
 * newer toast in the script pushes it one slot further away as it enters and
 * releases the slot as it leaves. Ties on `showAt` break by script order
 * (later in the script = newer). The visual multiplies by its slot pitch.
 */
export function toastSlot(script: readonly ToastSpec[], index: number, frame: number): number {
  const me = script[index]
  let slot = 0
  script.forEach((other, j) => {
    if (j === index) return
    const newer = other.showAt > me.showAt || (other.showAt === me.showAt && j > index)
    if (newer) slot += presence(other, frame)
  })
  return slot
}

/** The toast's own pose: the ported rise (fade + 12px from below) and an
 * accelerating slide-right + fade on exit. Apply as opacity + translate. */
export function toastPose(toast: ToastSpec, frame: number): { opacity: number; x: number; y: number } {
  const enter = enterPhase(toast, frame)
  const exit = exitPhase(toast, frame)
  return {
    opacity: enter * (1 - exit),
    x: 24 * exit,
    y: 12 * (1 - enter),
  }
}

/**
 * Author a cascade: assigns staggered `showAt`s (the Prod04 burst) to a list
 * of toasts. `stagger` frames between arrivals, first at `startAt`.
 */
export function toastCascade(
  toasts: readonly Omit<ToastSpec, 'showAt'>[],
  opts: { startAt?: number; stagger?: number } = {},
): ToastSpec[] {
  const startAt = opts.startAt ?? 0
  const stagger = opts.stagger ?? 12
  return toasts.map((t, i) => ({ ...t, showAt: startAt + i * stagger }))
}

/** Composition duration that covers every entrance/exit plus a held tail. */
export function toastStackDuration(script: readonly ToastSpec[], tailFrames = 45): number {
  return (
    script.reduce(
      (max, t) => Math.max(max, t.hideAt != null ? t.hideAt + TOAST_EXIT : t.showAt + TOAST_ENTER),
      0,
    ) + tailFrames
  )
}

/**
 * Sanity-check an authored script. Returns human-readable problems (empty =
 * valid): exits must start after their entrance begins, frames non-negative.
 */
export function validateToastScript(script: readonly ToastSpec[]): string[] {
  const errors: string[] = []
  script.forEach((t, i) => {
    if (t.showAt < 0) {
      errors.push(`toast ${i} ("${t.title.slice(0, 24)}…"): showAt ${t.showAt} must be ≥ 0`)
    }
    if (t.hideAt != null && t.hideAt <= t.showAt) {
      errors.push(`toast ${i} ("${t.title.slice(0, 24)}…"): hideAt ${t.hideAt} must be > showAt ${t.showAt}`)
    }
  })
  return errors
}
