/**
 * prod02Script.ts — pure choreography for Prod02Delegacion (Acto 2, "AiKit
 * ejecuta el mismo programa"). See specs/aikit-live-animations.md, inventario
 * Prod02.
 * ───────────────────────────────────────────────────────────────────────────
 * The 45-second answer to Prod01: the same email, but this time the human
 * types ONE sentence into the AiKit chat. The IA deploys the SAME 50-step
 * program (imported from prod01Script — the acts stay in lockstep by
 * construction) and runs it as a fast overlapping cascade: the CRM reads
 * itself, the plantilla fills in a wavefront, the presupuesto materialises,
 * and the stopwatch that dragged to 23:14 now freezes at 00:40. No cursor —
 * nobody touches the windows.
 *
 * Timeline at a glance (frames @30fps):
 *   10        the bandeja draws itself in — the same desk
 *   56        the same email arrives
 *   84        the AiKit chat rises
 *   130–308   the human types la frase — all the work they will do
 *   320–360   AiKit thinks, then commits to the job
 *   372       the program panel deploys — the same 50 steps
 *   420       execution starts: the cascade, several steps at once
 *   826       «Exportar a PDF» — the presupuesto writes itself
 *   907       «Enviar» lands; the stopwatch freezes at 00:40
 *   915–945   toasts: presupuesto enviado · programa completado
 *   1004–1350 the payoff stat: 23 min 14 s → 40 s (−97 %)
 */
import { CAST } from './aikit/cast'
import { type ProgramTempo, programSchedule } from './aikit/programScript'
import { type ChatLine } from './aikit/chatScript'
import {
  type CellWrite,
  euro,
  invoiceSchedule,
  invoiceTotals,
} from './aikit/widgetScript'
import { type ToastSpec } from './aikit/toastScript'
import { type CameraFraming } from './aikit/cameraScript'
import {
  INVOICE_ITEMS,
  INVOICE_TAX,
  PROD01_COPY,
  PROD01_STEPS,
  STOPWATCH_POINTS,
  type Rect,
} from './prod01Script'

/** Acto 2 runs the SAME program — shared constants keep both acts honest. */
export {
  INVOICE_ITEMS,
  INVOICE_TAX,
  PROD01_COPY,
  SHEET_BASE,
  SHEET_COL_W,
  SHEET_WIDGET_W,
  CRM_GEO,
  mmss,
} from './prod01Script'

/** The program of Acto 2 IS Prod01's — la IA despliega el mismo programa. */
export const PROD02_STEPS = PROD01_STEPS

/* ── copy (refined es-ES; people/companies come from CAST) ─────────────── */

export const PROD02_COPY = {
  eyebrow: 'ACTO 2 · LA PRIMERA DELEGACIÓN',
  chatTitle: 'AiKit',
  statLabel: 'La misma tarea',
} as const

export type Prod02Caption = { text: string; showAt: number; hideAt: number }

export const PROD02_CAPTIONS: readonly Prod02Caption[] = [
  { text: 'Otro lunes. La misma tarea entra por la bandeja.', showAt: 64, hideAt: 195 },
  { text: 'Esta vez, el humano solo escribe una frase.', showAt: 205, hideAt: 330 },
  { text: 'El mismo programa de 50 pasos. Ahora lo despliega la IA.', showAt: 380, hideAt: 540 },
  { text: 'Y lo ejecuta sola. Sin clicks, sin errores, sin cansancio.', showAt: 565, hideAt: 830 },
  { text: 'El presupuesto se escribe solo.', showAt: 845, hideAt: 985 },
  { text: 'La misma tarea: de 23 minutos a 40 segundos.', showAt: 1010, hideAt: 1350 },
]

/* ── beats & tempo ─────────────────────────────────────────────────────── */

export const INBOX_ENTER = 10
export const EMAIL_AT = 56
export const CHAT_ENTER = 84
export const PROGRAM_ENTER = 372
export const EXEC_START = 420

/** The same fifty steps, run as an overlapping cascade: `advance` < `active`
 * keeps several steps live at once (the Prod02 mode of programScript), with a
 * deliberate first bar and a readable close on «Enviar la respuesta». */
export const PROD02_TEMPO: ProgramTempo = {
  startAt: EXEC_START,
  active: 30,
  advance: (i) => {
    if (i < 4) return 16
    if (i < 10) return 12
    if (i < 20) return 10
    if (i < 40) return 8
    if (i === 47) return 18 // breath before «Enviar la respuesta»
    if (i === 48) return 20
    return 10
  },
}

export const PROD02_SCHEDULE = programSchedule(PROD02_STEPS.length, PROD02_TEMPO)

const A = PROD02_SCHEDULE.activeAt

/** The send lands here — the stopwatch freezes with it (cf. Prod01's SENT_AT). */
export const SENT_AT = A[48] + 3

export const PROD02_DURATION = 1350 // 45 s — the spec duration, payoff held

/* ── desktop layout (same stage contract as Prod01: 1920×1080 crop,
      AppWindow viewport content origin = (x+36, y+81)) ──────────────────── */

export const WIN2 = {
  inbox: { x: 660, y: 90, w: 560, h: 360 },
  crm: { x: 680, y: 140, w: 620, h: 500 },
  sheet: { x: 620, y: 470, w: 628, h: 540 },
  invoice: { x: 850, y: 190, w: 430, h: 720 },
} as const satisfies Record<string, Rect>

/** The chat — the only surface the human touches. Short enough that the
 * screen-space captions (y 975) never collide with its composer. */
export const CHAT_BOX = { x: 96, y: 150, w: 500, h: 680 } as const
/** The program panel sits exactly where Prod01 put it — the visual rhyme. */
export const PANEL_BOX = { x: 1330, y: 110, w: 470, h: 850 } as const

/* ── the chat: one sentence in, the job confirmed back ─────────────────── */

export const PROD02_CHAT: readonly ChatLine[] = [
  {
    from: 'me',
    text: 'Contesta a Lucía con el presupuesto del material del taller nuevo.',
    typeStart: 130,
    showAt: 308,
    time: '09:13',
  },
  {
    from: 'them',
    text: 'Voy con ello. Es tu programa de siempre: 50 pasos.',
    typeStart: 320,
    showAt: 360,
  },
  {
    from: 'them',
    text: `Listo. ${PROD01_COPY.invoiceNumber} enviado a ${CAST.clientContact}.`,
    typeStart: SENT_AT + 10,
    showAt: SENT_AT + 45,
    time: '09:13',
  },
]

/* ── the pastes: the same cells, the same figures, no error ────────────── */

const totals = invoiceTotals(INVOICE_ITEMS, INVOICE_TAX)

/** step → cell/value, Prod01's map minus the micro-error (no wrong cell,
 * no undo — the cascade is flawless). The write lands a beat into the step. */
const WRITE_STEPS: readonly { step: number; cell: readonly [number, number]; value: string }[] = [
  { step: 12, cell: [0, 1], value: CAST.clientCompany },
  { step: 14, cell: [1, 1], value: PROD01_COPY.cif },
  { step: 16, cell: [2, 1], value: CAST.clientContact },
  { step: 20, cell: [4, 2], value: '38,00' },
  { step: 21, cell: [4, 1], value: '6 h' },
  { step: 22, cell: [4, 3], value: '228,00' },
  { step: 26, cell: [5, 1], value: '1' },
  { step: 28, cell: [5, 2], value: '412,00' },
  { step: 29, cell: [5, 3], value: '412,00' },
  { step: 30, cell: [6, 1], value: '1' },
  { step: 30, cell: [6, 2], value: '35,00' },
  { step: 30, cell: [6, 3], value: '35,00' },
  { step: 32, cell: [7, 3], value: euro(-33.75) },
  { step: 34, cell: [8, 3], value: euro(totals.subtotal) },
  { step: 35, cell: [9, 3], value: euro(totals.tax) },
  { step: 36, cell: [10, 3], value: `${euro(totals.total)} €` },
]

export const PROD02_WRITES: readonly CellWrite[] = WRITE_STEPS.map((w) => ({
  at: A[w.step] + 4,
  cell: w.cell,
  value: w.value,
}))

/* ── CRM ficha — reads itself; the highlight is "Leído", not a copy click ── */

export type CrmReadField = { label: string; value: string; readAt?: number }

export const CRM2_FIELDS: readonly CrmReadField[] = [
  { label: 'Razón social', value: CAST.clientCompany, readAt: A[11] },
  { label: 'CIF', value: PROD01_COPY.cif, readAt: A[13] },
  { label: 'Contacto', value: CAST.clientContact, readAt: A[15] },
  { label: 'Email', value: PROD01_COPY.replyTo },
  { label: 'Condiciones', value: PROD01_COPY.paymentTerms, readAt: A[17] },
]

/** CRM beats: the query writes itself, the result lights, the ficha unfolds. */
export const CRM_QUERY_AT = A[9]
export const CRM_RESULT_AT = A[10]

/* ── invoice (the presupuesto materialising on «Exportar a PDF») ───────── */

export const INVOICE_SCHED2 = invoiceSchedule(INVOICE_ITEMS.length, {
  enterAt: A[41] + 30, // once the PDF window's viewport is in
  lineStagger: 5,
  totalsGap: 5,
  countFrames: 12,
})

/* ── toasts: the machine reports back ──────────────────────────────────── */

export const PROD02_TOASTS: readonly ToastSpec[] = [
  {
    variant: 'success',
    title: 'Presupuesto enviado',
    message: `${PROD01_COPY.invoiceNumber} · ${CAST.clientContact}`,
    time: '09:13',
    showAt: SENT_AT + 8,
  },
  {
    variant: 'info',
    title: 'Programa completado',
    message: '50 pasos · sin errores',
    time: 'ahora',
    showAt: SENT_AT + 38,
  },
]

/* ── stopwatch: the same clock, a different century ────────────────────── */

/** Prod01's frozen number — 23:14 — imported, never retyped. */
export const BEFORE_SECONDS = STOPWATCH_POINTS[STOPWATCH_POINTS.length - 1][1]
/** The whole run, chat send to «Enviar», in task seconds. */
export const AFTER_SECONDS = 40

/** Elapsed task seconds at `frame` — one linear ramp 0→40 across the run,
 * frozen the moment «Enviar» lands. */
export function stopwatch2Seconds(frame: number): number {
  const t = Math.min(1, Math.max(0, (frame - EXEC_START) / (SENT_AT - EXEC_START)))
  return AFTER_SECONDS * t
}

/** 1394 → '23 min 14 s' · 40 → '40 s' (the StatTile reading). */
export function minSec(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const m = Math.floor(s / 60)
  return m > 0 ? `${m} min ${s % 60} s` : `${s} s`
}

/* ── the payoff stat: 23 min 14 s → 40 s ───────────────────────────────── */

export const STAT = {
  label: PROD02_COPY.statLabel,
  before: minSec(BEFORE_SECONDS),
  after: minSec(AFTER_SECONDS),
  delta: -Math.round((1 - AFTER_SECONDS / BEFORE_SECONDS) * 100),
  enterAt: 1004,
  revealAt: 1028,
} as const

/* ── camera rig ────────────────────────────────────────────────────────── */

export const PROD02_CAM: readonly CameraFraming[] = [
  { at: 0, zoom: 1.18, fx: 940, fy: 300 }, // the bandeja — the same email
  { at: 150, zoom: 1.08, fx: 470, fy: 460, travel: 32 }, // the chat — la frase
  { at: PROGRAM_ENTER, zoom: 0.98, fx: 1060, fy: 500, travel: 34 }, // the program deploys
  { at: 480, zoom: 0.9, fx: 950, fy: 540, travel: 30 }, // wide — the desk works alone
  { at: 700, zoom: 1.0, fx: 880, fy: 600, travel: 34 }, // the wavefront fills the sheet
  { at: 856, zoom: 1.06, fx: 1030, fy: 540, travel: 30 }, // the presupuesto materialises
  { at: 1010, zoom: 0.9, fx: 960, fy: 540, travel: 44 }, // final wide — the stat lands
]
