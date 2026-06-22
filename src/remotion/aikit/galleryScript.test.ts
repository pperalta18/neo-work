import { describe, expect, it } from 'vitest'
import {
  STILL_BEATS,
  type GalleryChapterSpec,
  chapterAt,
  gallerySchedule,
  galleryStills,
  validateGallery,
} from './galleryScript'

const CHAPTERS: GalleryChapterSpec[] = [
  { id: 'a', title: 'Alpha', duration: 100 },
  { id: 'b', title: 'Beta', note: 'check the beta beat', duration: 40 },
  { id: 'c', title: 'Gamma', duration: 250 },
]

describe('validateGallery', () => {
  it('accepts a well-formed chapter list', () => {
    expect(validateGallery(CHAPTERS)).toEqual([])
  })

  it('rejects an empty gallery', () => {
    expect(validateGallery([])).toHaveLength(1)
  })

  it('rejects non-positive and fractional durations', () => {
    const bad = validateGallery([
      { id: 'x', title: 'X', duration: 0 },
      { id: 'y', title: 'Y', duration: -10 },
      { id: 'z', title: 'Z', duration: 12.5 },
    ])
    expect(bad).toHaveLength(3)
  })

  it('rejects duplicate ids', () => {
    const bad = validateGallery([
      { id: 'x', title: 'X', duration: 10 },
      { id: 'x', title: 'X again', duration: 10 },
    ])
    expect(bad.some((m) => m.includes('duplicate'))).toBe(true)
  })
})

describe('gallerySchedule', () => {
  const schedule = gallerySchedule(CHAPTERS)

  it('starts at frame 0 and lays chapters back-to-back (no gaps, no overlap)', () => {
    expect(schedule.entries[0].startAt).toBe(0)
    for (let i = 1; i < schedule.entries.length; i++) {
      expect(schedule.entries[i].startAt).toBe(schedule.entries[i - 1].endAt)
    }
  })

  it('totals the sum of chapter durations', () => {
    expect(schedule.total).toBe(100 + 40 + 250)
    expect(schedule.entries.at(-1)?.endAt).toBe(schedule.total)
  })

  it('keeps spec, index and span per entry', () => {
    const beta = schedule.entries[1]
    expect(beta.spec.id).toBe('b')
    expect(beta.index).toBe(1)
    expect(beta.endAt - beta.startAt).toBe(40)
  })

  it('throws on invalid authoring', () => {
    expect(() => gallerySchedule([])).toThrow()
    expect(() => gallerySchedule([{ id: 'x', title: 'X', duration: 0 }])).toThrow()
  })
})

describe('chapterAt', () => {
  const schedule = gallerySchedule(CHAPTERS)

  it('maps a frame to the chapter playing at it', () => {
    expect(chapterAt(schedule, 0).spec.id).toBe('a')
    expect(chapterAt(schedule, 99).spec.id).toBe('a')
    expect(chapterAt(schedule, 100).spec.id).toBe('b') // endAt is exclusive
    expect(chapterAt(schedule, 139).spec.id).toBe('b')
    expect(chapterAt(schedule, 140).spec.id).toBe('c')
  })

  it('clamps outside the timeline', () => {
    expect(chapterAt(schedule, -5).spec.id).toBe('a')
    expect(chapterAt(schedule, schedule.total + 100).spec.id).toBe('c')
  })
})

describe('galleryStills', () => {
  const schedule = gallerySchedule(CHAPTERS)

  it('emits chapters × beats stills, each inside its own chapter', () => {
    const stills = galleryStills(schedule)
    expect(stills).toHaveLength(CHAPTERS.length * STILL_BEATS.length)
    for (const still of stills) {
      const entry = schedule.entries.find((e) => e.spec.id === still.id)!
      expect(still.frame).toBeGreaterThanOrEqual(entry.startAt)
      expect(still.frame).toBeLessThan(entry.endAt)
      // The still frame really falls in the chapter it claims to capture.
      expect(chapterAt(schedule, still.frame).spec.id).toBe(still.id)
    }
  })

  it('maps beat 0 to the chapter start and beat 1 to its last frame', () => {
    const stills = galleryStills(schedule, [0, 1])
    const beta = schedule.entries[1]
    expect(stills.filter((s) => s.id === 'b').map((s) => s.frame)).toEqual([
      beta.startAt,
      beta.endAt - 1,
    ])
  })

  it('orders frames monotonically within a chapter for ascending beats', () => {
    const stills = galleryStills(schedule, [0.2, 0.5, 0.9]).filter((s) => s.id === 'c')
    expect(stills[0].frame).toBeLessThan(stills[1].frame)
    expect(stills[1].frame).toBeLessThan(stills[2].frame)
  })

  it('survives a 1-frame chapter (all beats collapse onto the only frame)', () => {
    const tiny = gallerySchedule([{ id: 'solo', title: 'Solo', duration: 1 }])
    for (const still of galleryStills(tiny)) expect(still.frame).toBe(0)
  })
})

describe('KitGallery (real schedule smoke)', () => {
  it('chapters the eight kit demos contiguously and recommends in-range stills', async () => {
    const { KIT_GALLERY_SCHEDULE, KIT_GALLERY_DURATION, KIT_GALLERY_STILLS } = await import(
      './KitGallery'
    )
    expect(KIT_GALLERY_SCHEDULE.entries).toHaveLength(8)
    expect(KIT_GALLERY_SCHEDULE.entries[0].startAt).toBe(0)
    for (let i = 1; i < 8; i++) {
      expect(KIT_GALLERY_SCHEDULE.entries[i].startAt).toBe(
        KIT_GALLERY_SCHEDULE.entries[i - 1].endAt,
      )
    }
    expect(KIT_GALLERY_DURATION).toBe(KIT_GALLERY_SCHEDULE.entries.at(-1)!.endAt)
    for (const still of KIT_GALLERY_STILLS) {
      expect(chapterAt(KIT_GALLERY_SCHEDULE, still.frame).spec.id).toBe(still.id)
    }
    // Log the chapter map + still frames — the table the smoke render uses.
    for (const e of KIT_GALLERY_SCHEDULE.entries) {
      console.log(
        `chapter ${e.index + 1} ${e.spec.id.padEnd(8)} [${e.startAt}, ${e.endAt}) ` +
          `stills ${KIT_GALLERY_STILLS.filter((s) => s.id === e.spec.id)
            .map((s) => s.frame)
            .join(' · ')}`,
      )
    }
  })
})
