/**
 * galleryScript.ts — pure scheduling for the KitGallery smoke composition.
 * ────────────────────────────────────────────────────────────────────────
 * KitGallery chapters the kit demos back-to-back (hard cuts on Sequence
 * boundaries) so the whole Phase-1 kit is validated from ONE composition
 * with a handful of stills. This module owns the timeline maths — chapter
 * placement, frame→chapter lookup and the recommended still frames — so the
 * "validar con stills" contract is unit-testable and the still frames are
 * reproducible from the schedule alone.
 */

export type GalleryChapterSpec = {
  /** Stable id — used for lookups and still filenames (`kit-<id>-<beat>`). */
  id: string
  /** Human label shown on the chapter chip. */
  title: string
  /** What to check in this chapter; second line of the chip. */
  note?: string
  /** Frames the chapter plays — its demo's own exported duration. */
  duration: number
}

export type GalleryEntry = {
  spec: GalleryChapterSpec
  index: number
  /** First frame of the chapter on the gallery timeline. */
  startAt: number
  /** First frame AFTER the chapter (exclusive end = next chapter's startAt). */
  endAt: number
}

export type GallerySchedule = {
  entries: GalleryEntry[]
  /** Total gallery duration — the sum of chapter durations (hard cuts). */
  total: number
}

/** Authoring lint: returns human-readable issues ([] = good to schedule). */
export function validateGallery(chapters: GalleryChapterSpec[]): string[] {
  const issues: string[] = []
  if (chapters.length === 0) issues.push('gallery has no chapters')
  const seen = new Set<string>()
  chapters.forEach((c, i) => {
    if (!Number.isInteger(c.duration) || c.duration <= 0) {
      issues.push(`chapter "${c.id}" (#${i}) has invalid duration ${c.duration} (need integer > 0)`)
    }
    if (seen.has(c.id)) issues.push(`duplicate chapter id "${c.id}"`)
    seen.add(c.id)
  })
  return issues
}

/** Lay the chapters back-to-back from frame 0. Throws on invalid authoring. */
export function gallerySchedule(chapters: GalleryChapterSpec[]): GallerySchedule {
  const issues = validateGallery(chapters)
  if (issues.length > 0) throw new Error(`gallerySchedule: ${issues.join('; ')}`)
  let cursor = 0
  const entries = chapters.map((spec, index) => {
    const startAt = cursor
    cursor += spec.duration
    return { spec, index, startAt, endAt: cursor }
  })
  return { entries, total: cursor }
}

/** The chapter playing at `frame`, clamped to the first/last chapter. */
export function chapterAt(schedule: GallerySchedule, frame: number): GalleryEntry {
  const { entries } = schedule
  for (const entry of entries) {
    if (frame < entry.endAt) return entry
  }
  return entries[entries.length - 1]
}

/** Default smoke beats: entrance landed, mid-action, sustainable final frame. */
export const STILL_BEATS: readonly number[] = [0.25, 0.6, 0.98]

export type GalleryStill = {
  /** Chapter id the still belongs to. */
  id: string
  /** The beat fraction that produced it (0 = chapter start, 1 = last frame). */
  beat: number
  /** Absolute gallery frame to render. */
  frame: number
}

/**
 * The recommended still frames per chapter — beat fractions mapped onto each
 * chapter's [startAt, endAt - 1] range, always inside the chapter.
 */
export function galleryStills(
  schedule: GallerySchedule,
  beats: readonly number[] = STILL_BEATS,
): GalleryStill[] {
  return schedule.entries.flatMap((entry) => {
    const last = entry.endAt - 1
    return beats.map((beat) => ({
      id: entry.spec.id,
      beat,
      frame: Math.max(entry.startAt, Math.min(last, entry.startAt + Math.round((last - entry.startAt) * beat))),
    }))
  })
}
