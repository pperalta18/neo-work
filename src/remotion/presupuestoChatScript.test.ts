import { describe, expect, it } from 'vitest'
import {
  ALL_DONE,
  ATTACH_AT,
  PRESUPUESTO_COPY,
  PRESUPUESTO_DURATION,
  PRESUPUESTO_SCHEDULE,
  PRESUPUESTO_STEPS,
  SENT_AT,
  STEPS_START,
  STEP_DUR,
  WORK_START,
  stepSchedule,
} from './presupuestoChatScript'

describe('presupuestoChatScript', () => {
  it('keeps the beats in order: type → send → work → steps → attach', () => {
    expect(SENT_AT).toBeGreaterThan(0)
    expect(WORK_START).toBeGreaterThan(SENT_AT)
    expect(STEPS_START).toBeGreaterThan(WORK_START)
    expect(ATTACH_AT).toBeGreaterThan(ALL_DONE)
    expect(PRESUPUESTO_DURATION).toBeGreaterThan(ATTACH_AT)
  })

  it('schedules each step back to back, one in progress at a time', () => {
    expect(PRESUPUESTO_SCHEDULE).toHaveLength(PRESUPUESTO_STEPS.length)
    PRESUPUESTO_SCHEDULE.forEach((step, i) => {
      expect(step.label).toBe(PRESUPUESTO_STEPS[i])
      expect(step.doneAt).toBe(step.startAt + STEP_DUR)
      if (i > 0) expect(step.startAt).toBe(PRESUPUESTO_SCHEDULE[i - 1].doneAt)
    })
  })

  it('lands ALL_DONE on the last step finishing', () => {
    expect(ALL_DONE).toBe(PRESUPUESTO_SCHEDULE[PRESUPUESTO_SCHEDULE.length - 1].doneAt)
  })

  it('declares a real series of steps and finishes with the PDF', () => {
    expect(PRESUPUESTO_STEPS.length).toBeGreaterThanOrEqual(4)
    expect(PRESUPUESTO_STEPS[PRESUPUESTO_STEPS.length - 1]).toMatch(/PDF/)
  })

  it('attaches a PDF whose total is the derived invoice total', () => {
    expect(PRESUPUESTO_COPY.attachName).toMatch(/\.pdf$/)
    expect(PRESUPUESTO_COPY.attachMeta).toContain('775,91 €')
  })

  it('stepSchedule is pure and parameterisable', () => {
    const s = stepSchedule(['a', 'b'], 100, 20)
    expect(s).toEqual([
      { label: 'a', startAt: 100, doneAt: 120 },
      { label: 'b', startAt: 120, doneAt: 140 },
    ])
  })
})
