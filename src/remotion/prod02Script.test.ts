import { describe, expect, it } from 'vitest'
import { validateChatScript } from './aikit/chatScript'
import { validateProgramTempo } from './aikit/programScript'
import { sheetValuesAt, validateSheetWrites } from './aikit/widgetScript'
import { validateToastScript } from './aikit/toastScript'
import { validateCameraRig } from './aikit/cameraScript'
import {
  PROD01_DURATION,
  PROD01_STEPS,
  PROD01_WRITES,
  SENT_AT as PROD01_SENT_AT,
  stopwatchSeconds,
} from './prod01Script'
import {
  AFTER_SECONDS,
  BEFORE_SECONDS,
  CRM2_FIELDS,
  EXEC_START,
  INVOICE_SCHED2,
  PROD02_CAM,
  PROD02_CAPTIONS,
  PROD02_CHAT,
  PROD02_DURATION,
  PROD02_SCHEDULE,
  PROD02_STEPS,
  PROD02_TEMPO,
  PROD02_TOASTS,
  PROD02_WRITES,
  PROGRAM_ENTER,
  SENT_AT,
  SHEET_BASE,
  STAT,
  minSec,
  mmss,
  stopwatch2Seconds,
} from './prod02Script'

const A = PROD02_SCHEDULE.activeAt

describe('the program', () => {
  it('IS the Prod01 program — la IA despliega el mismo programa', () => {
    expect(PROD02_STEPS).toBe(PROD01_STEPS)
    expect(PROD02_STEPS).toHaveLength(50)
  })

  it('has a valid tempo', () => {
    expect(validateProgramTempo(PROD02_STEPS.length, PROD02_TEMPO)).toEqual([])
  })

  it('runs as an overlapping cascade — several steps live at once', () => {
    const advance = PROD02_TEMPO.advance as (i: number) => number
    const active = PROD02_TEMPO.active as number
    for (let i = 4; i < PROD02_STEPS.length - 1; i++) {
      expect(advance(i)).toBeLessThan(active)
    }
  })

  it('starts when execution starts and finishes with room for the payoff', () => {
    expect(A[0]).toBe(EXEC_START)
    expect(PROD02_SCHEDULE.allDoneAt).toBeLessThanOrEqual(STAT.enterAt - 40)
  })

  it('runs roughly the spec duration (~45s @30fps)', () => {
    expect(PROD02_DURATION).toBe(1350)
  })

  it('is an order of magnitude faster than the Prod01 run', () => {
    const run = PROD02_SCHEDULE.allDoneAt - EXEC_START
    expect(run).toBeLessThan(600) // ≤20s of screen time for all 50 steps
  })
})

describe('the chat', () => {
  it('is a valid script (lead-ups end in time, bubbles land in order)', () => {
    expect(validateChatScript(PROD02_CHAT)).toEqual([])
  })

  it('the human writes exactly ONE sentence — all the work they do', () => {
    const mine = PROD02_CHAT.filter((l) => l.from === 'me')
    expect(mine).toHaveLength(1)
    expect(mine[0].typeStart).toBeDefined()
  })

  it('the delegation lands before the program deploys, and AiKit confirms first', () => {
    const [order, reply] = PROD02_CHAT
    expect(order.showAt).toBeLessThan(PROGRAM_ENTER)
    expect(reply.from).toBe('them')
    expect(reply.showAt).toBeLessThanOrEqual(PROGRAM_ENTER)
  })

  it('closes the loop after the send', () => {
    const closing = PROD02_CHAT[PROD02_CHAT.length - 1]
    expect(closing.from).toBe('them')
    expect(closing.typeStart!).toBeGreaterThan(SENT_AT)
    expect(closing.showAt).toBeLessThanOrEqual(PROD02_DURATION - 300)
  })

  it('execution only starts after AiKit has taken the job', () => {
    expect(EXEC_START).toBeGreaterThan(PROD02_CHAT[1].showAt)
  })
})

describe('the spreadsheet', () => {
  it('has valid writes against the base grid', () => {
    expect(validateSheetWrites(SHEET_BASE, PROD02_WRITES)).toEqual([])
  })

  it('never undoes — the cascade is flawless (no error beat)', () => {
    for (const w of PROD02_WRITES) expect(w.value).not.toBe('')
  })

  it('ends in EXACTLY the same grid as Prod01 — same task, same result', () => {
    const ours = sheetValuesAt(SHEET_BASE, PROD02_WRITES, PROD02_DURATION)
    const theirs = sheetValuesAt(SHEET_BASE, PROD01_WRITES, PROD01_DURATION)
    expect(ours).toEqual(theirs)
  })

  it('writes land keyed to their program steps, after the sheet window draws', () => {
    for (const w of PROD02_WRITES) {
      expect(w.at).toBeGreaterThan(A[3]) // «Abrir Excel» draws the window
      expect(w.at).toBeLessThanOrEqual(SENT_AT)
    }
  })
})

describe('the stopwatch', () => {
  it('is zero until execution starts', () => {
    expect(stopwatch2Seconds(0)).toBe(0)
    expect(stopwatch2Seconds(EXEC_START)).toBe(0)
  })

  it('only ever counts up', () => {
    let prev = -1
    for (let f = 0; f <= PROD02_DURATION; f += 7) {
      const s = stopwatch2Seconds(f)
      expect(s).toBeGreaterThanOrEqual(prev)
      prev = s
    }
  })

  it('freezes at 00:40 when «Enviar» lands — the answer to 23:14', () => {
    expect(mmss(stopwatch2Seconds(SENT_AT))).toBe('00:40')
    expect(mmss(stopwatch2Seconds(PROD02_DURATION))).toBe('00:40')
  })
})

describe('the payoff stat', () => {
  it('quotes Prod01’s frozen number, never retyped', () => {
    expect(BEFORE_SECONDS).toBe(stopwatchSeconds(PROD01_SENT_AT))
    expect(BEFORE_SECONDS).toBe(23 * 60 + 14)
    expect(STAT.before).toBe('23 min 14 s')
  })

  it('answers with the 40-second run', () => {
    expect(AFTER_SECONDS).toBe(40)
    expect(STAT.after).toBe('40 s')
  })

  it('computes the −97% delta from the two numbers', () => {
    expect(STAT.delta).toBe(-97)
  })

  it('reveals after the run is over, on the final wide', () => {
    expect(STAT.enterAt).toBeGreaterThan(PROD02_SCHEDULE.allDoneAt)
    expect(STAT.revealAt).toBeLessThanOrEqual(PROD02_DURATION - 120)
  })

  it('formats minute-second readings', () => {
    expect(minSec(1394)).toBe('23 min 14 s')
    expect(minSec(40)).toBe('40 s')
    expect(minSec(0)).toBe('0 s')
  })
})

describe('the CRM', () => {
  it('reads the same fields Prod01 copied, keyed to their steps', () => {
    const readAts = CRM2_FIELDS.filter((f) => f.readAt != null).map((f) => f.readAt!)
    expect(readAts).toEqual([A[11], A[13], A[15], A[17]])
  })

  it('reads only after its window draws («Abrir el CRM»)', () => {
    for (const f of CRM2_FIELDS) {
      if (f.readAt != null) expect(f.readAt).toBeGreaterThan(A[8])
    }
  })
})

describe('the PDF', () => {
  it('materialises after «Exportar a PDF» and settles before the send', () => {
    expect(INVOICE_SCHED2.enterAt).toBeGreaterThan(A[41])
    expect(INVOICE_SCHED2.settledAt).toBeLessThanOrEqual(SENT_AT)
  })
})

describe('the toasts', () => {
  it('are a valid script', () => {
    expect(validateToastScript(PROD02_TOASTS)).toEqual([])
  })

  it('report back only after the send lands', () => {
    for (const t of PROD02_TOASTS) expect(t.showAt).toBeGreaterThan(SENT_AT)
  })
})

describe('the captions', () => {
  it('are ordered and never overlap', () => {
    for (let i = 0; i < PROD02_CAPTIONS.length; i++) {
      const c = PROD02_CAPTIONS[i]
      expect(c.hideAt).toBeGreaterThan(c.showAt)
      if (i > 0) expect(c.showAt).toBeGreaterThanOrEqual(PROD02_CAPTIONS[i - 1].hideAt)
    }
  })

  it('fit inside the piece', () => {
    const last = PROD02_CAPTIONS[PROD02_CAPTIONS.length - 1]
    expect(last.hideAt).toBeLessThanOrEqual(PROD02_DURATION)
  })
})

describe('the camera', () => {
  it('is a valid rig', () => {
    expect(validateCameraRig(PROD02_CAM)).toEqual([])
  })

  it('holds the final framing as a stable still', () => {
    const last = PROD02_CAM[PROD02_CAM.length - 1]
    expect(PROD02_DURATION - last.at).toBeGreaterThanOrEqual(45)
  })
})
