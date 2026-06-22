/**
 * prod01Script.ts — pure choreography for Prod01Programa (Acto 1, "el robot
 * de carne blanda"). See specs/aikit-live-animations.md, inventario Prod01.
 * ───────────────────────────────────────────────────────────────────────────
 * The whole 60-second piece as pure data: the 50-step program and its tempo,
 * the desktop layout, the cursor script, the spreadsheet pastes (including
 * the micro-error + undo), the dragging stopwatch, the captions and the
 * camera rig. Prod01Programa.tsx is the visual shell on top; tests assert
 * the beats line up without rendering a frame.
 *
 * Timeline at a glance (frames @30fps):
 *   12        the bandeja window draws itself in
 *   92        the email from CAST.clientContact arrives
 *   149       the owner opens it (cursor click)
 *   170       the program panel rises — the task is already 50 steps
 *   280       execution starts: stopwatch 00:00, click by click
 *   666–766   step 15 pastes the CIF in the WRONG cell → Ctrl+Z → repaste
 *   842–1163  montage: the run accelerates, the stopwatch flies
 *   1163      «Exportar a PDF» — the presupuesto materialises
 *   1430      «Enviar» lands; the stopwatch freezes at 23:14
 *   1495–1620 final wide — the held still
 */
import { CAST } from './aikit/cast'
import {
  type ProgramStep,
  type ProgramTempo,
  programSchedule,
} from './aikit/programScript'
import { type CursorWaypoint } from './aikit/cursorScript'
import {
  type CellValue,
  type CellWrite,
  type InvoiceLineSpec,
  euro,
  invoiceSchedule,
  invoiceTotals,
} from './aikit/widgetScript'
import { type CameraFraming } from './aikit/cameraScript'

/* ── copy (refined es-ES; people/companies come from CAST) ─────────────── */

export const PROD01_COPY = {
  eyebrow: 'ACTO 1 · EL ROBOT DE CARNE BLANDA',
  emailPreview: '¿Nos pasáis presupuesto del material para el taller nuevo?',
  emailTime: '09:12',
  inboxTitle: 'Bandeja',
  programTitle: `Presupuesto · ${CAST.clientCompany.replace(' S.L.', '')}`,
  sheetTitle: 'plantilla-presupuesto.xlsx',
  crmTitle: 'CRM · Clientes',
  pdfTitle: 'PRE-2026-041.pdf',
  invoiceNumber: 'PRE-2026-041',
  invoiceDate: '17 jun 2026',
  replyTo: 'lucia@talleresriera.es',
  replySubject: 'Re: Presupuesto del material',
  replyAttachment: 'PRE-2026-041.pdf',
  send: 'Enviar',
  sent: 'Enviada',
  cif: 'B-67412880',
  paymentTerms: '30 días f. f.',
} as const

export type Prod01Caption = { text: string; showAt: number; hideAt: number }

export const PROD01_CAPTIONS: readonly Prod01Caption[] = [
  { text: 'Una tarea más entra por la bandeja.', showAt: 78, hideAt: 200 },
  { text: 'La conoce de memoria: en su cabeza ya es un programa de 50 pasos.', showAt: 215, hideAt: 345 },
  { text: 'Y al ejecutarla, se convierte en un robot. Click a click.', showAt: 380, hideAt: 650 },
  { text: 'Un robot que se cansa. Y se equivoca.', showAt: 690, hideAt: 784 },
  { text: 'Paso tras paso. Ventana tras ventana. Veinte minutos más.', showAt: 900, hideAt: 1150 },
  { text: 'Un presupuesto: 23 minutos de cerebro humano.', showAt: 1495, hideAt: 1620 },
]

/* ── the program: 50 pasos (guión: "lee los requisitos… abre la plantilla…
      busca la información del cliente en el CRM…") ──────────────────────── */

export const PROD01_STEPS: readonly ProgramStep[] = [
  { title: 'Releer los requisitos' },
  { title: 'Confirmar qué pide: un presupuesto' },
  { title: 'Comprobar el plazo de respuesta' },
  { title: 'Abrir Excel' },
  { title: 'Ir a Archivos recientes' },
  { title: 'Buscar «plantilla-presupuesto»' },
  { title: 'Abrir la plantilla' },
  { title: 'Guardar como «PRE-2026-041»' },
  { title: 'Abrir el CRM' },
  { title: 'Buscar «Talleres Riera»' },
  { title: 'Abrir la ficha del cliente' },
  { title: 'Copiar la razón social' },
  { title: 'Pegarla en la plantilla' },
  { title: 'Copiar el CIF' },
  { title: 'Pegarlo en la plantilla' },
  { title: 'Copiar el contacto' },
  { title: 'Pegarlo en la plantilla' },
  { title: 'Comprobar las condiciones de pago' },
  { title: 'Abrir la lista de tarifas' },
  { title: 'Buscar el precio de mano de obra' },
  { title: 'Copiarlo a la plantilla' },
  { title: 'Estimar las horas del trabajo' },
  { title: 'Calcular el importe' },
  { title: 'Buscar el material en el catálogo' },
  { title: 'Comprobar el stock disponible' },
  { title: 'Copiar la referencia' },
  { title: 'Pegarla en la plantilla' },
  { title: 'Buscar el precio actualizado' },
  { title: 'Pegarlo en la plantilla' },
  { title: 'Calcular el importe' },
  { title: 'Añadir el desplazamiento' },
  { title: 'Repasar los descuentos vigentes' },
  { title: 'Aplicar el descuento del 5 %' },
  { title: 'Recalcular los importes' },
  { title: 'Sumar el subtotal' },
  { title: 'Comprobar el tipo de IVA' },
  { title: 'Calcular el total' },
  { title: 'Repasar los números otra vez' },
  { title: 'Ajustar el formato de la tabla' },
  { title: 'Corregir un decimal bailado' },
  { title: 'Guardar el archivo' },
  { title: 'Exportar a PDF' },
  { title: 'Revisar el PDF entero' },
  { title: 'Volver al correo' },
  { title: 'Redactar la respuesta' },
  { title: 'Adjuntar el presupuesto' },
  { title: 'Releer antes de enviar' },
  { title: 'Corregir una errata' },
  { title: 'Enviar la respuesta' },
  { title: 'Archivar la tarea' },
]

/* ── beats & tempo ─────────────────────────────────────────────────────── */

export const INBOX_ENTER = 12
export const EMAIL_AT = 92
/** The click that opens the email lands here (cursor wp 1). */
export const EMAIL_OPEN_AT = 149
export const PROGRAM_ENTER = 170
export const EXEC_START = 280

/** Index of the step whose paste lands in the wrong cell. */
export const ERROR_STEP = 14
const MONTAGE_START = 17
const MONTAGE_END = 40
const FINAL_START = 41

/** Three rhythms: deliberate detail clicks, an accelerating montage, and a
 * slow close — plus one long beat for the micro-error + undo on ERROR_STEP. */
export const PROD01_TEMPO: ProgramTempo = {
  startAt: EXEC_START,
  active: (i) => {
    if (i === ERROR_STEP) return 100
    if (i <= 2) return 16
    if (i <= 7) return 20
    if (i < MONTAGE_START) return 22
    if (i <= MONTAGE_END) return Math.max(7, 24 - (i - MONTAGE_START))
    if (i === PROD01_STEPS.length - 1) return 16
    return 24
  },
  advance: (i) => {
    if (i === ERROR_STEP) return 116
    if (i <= 2) return 22
    if (i <= 7) return 28
    if (i < MONTAGE_START) return 30
    if (i <= MONTAGE_END) return Math.max(7, 24 - (i - MONTAGE_START))
    if (i === 47) return 48 // breath before «Enviar la respuesta»
    if (i === PROD01_STEPS.length - 1) return 24
    return 36
  },
}

export const PROD01_SCHEDULE = programSchedule(PROD01_STEPS.length, PROD01_TEMPO)

export const PROD01_DURATION = 1620 // 54 s — the spec's "~60s" hero with a held tail

/* ── desktop layout (stage = unbounded content space; 1920×1080 is only the
      screen crop). Window viewport content origin = (x+36, y+81). ────────── */

export type Rect = { x: number; y: number; w: number; h: number }

export const WIN = {
  inbox: { x: 150, y: 250, w: 580, h: 478 },
  crm: { x: 90, y: 80, w: 620, h: 500 },
  sheet: { x: 540, y: 430, w: 628, h: 550 },
  invoice: { x: 760, y: 150, w: 430, h: 740 },
  panel: { x: 1330, y: 110, w: 470, h: 850 },
} as const satisfies Record<string, Rect>

/** AppWindow viewport content origin (pad 18 + chrome 31 + gap 14 + pad 18). */
export const CONTENT_DX = 36
export const CONTENT_DY = 81

const content = (r: Rect) => ({ x: r.x + CONTENT_DX, y: r.y + CONTENT_DY })

/* ── spreadsheet: the plantilla ────────────────────────────────────────── */

export const SHEET_BASE: readonly (readonly CellValue[])[] = [
  ['Cliente', '', '', ''],
  ['CIF', '', '', ''],
  ['Contacto', '', '', ''],
  ['Concepto', 'Uds', 'Precio', 'Importe'],
  ['Mano de obra', '', '', ''],
  ['Material eléctrico', '', '', ''],
  ['Desplazamiento', '', '', ''],
  ['Descuento 5 %', '', '', ''],
  ['Subtotal', '', '', ''],
  ['IVA 21 %', '', '', ''],
  ['Total', '', '', ''],
]

/** Column widths in px — drive both the widget and the cursor targets. */
export const SHEET_COL_W = [150, 168, 94, 94] as const
export const SHEET_WIDGET_W = 8 * 2 + 34 + SHEET_COL_W.reduce((a, b) => a + b, 0)
/** Grid top inside the widget: title 17 + gap 14 + formula bar 29 + gap 14 + pad 8. */
const SHEET_GRID_TOP = 82
const SHEET_ROW_H = 30
const SHEET_GUTTER = 8 + 34 // sheet padding + row-number gutter

/** Centre of cell [r, c] in widget-local coordinates. */
export function sheetCellCenterLocal(r: number, c: number): { x: number; y: number } {
  let x = SHEET_GUTTER
  for (let i = 0; i < c; i++) x += SHEET_COL_W[i]
  return { x: x + SHEET_COL_W[c] / 2, y: SHEET_GRID_TOP + SHEET_ROW_H + r * SHEET_ROW_H + SHEET_ROW_H / 2 }
}

/** Centre of cell [r, c] in stage coordinates (inside the sheet window). */
export function sheetCellStage(r: number, c: number): { x: number; y: number } {
  const o = content(WIN.sheet)
  const l = sheetCellCenterLocal(r, c)
  return { x: o.x + l.x, y: o.y + l.y }
}

/** Cell [r, c] rect in widget-local coordinates (the error-ring overlay). */
export function sheetCellRectLocal(r: number, c: number): Rect {
  let x = SHEET_GUTTER
  for (let i = 0; i < c; i++) x += SHEET_COL_W[i]
  return { x, y: SHEET_GRID_TOP + SHEET_ROW_H + r * SHEET_ROW_H, w: SHEET_COL_W[c], h: SHEET_ROW_H }
}

/* ── invoice (the PDF) — same numbers as the sheet, derived once ────────── */

export const INVOICE_ITEMS: readonly InvoiceLineSpec[] = [
  { description: 'Mano de obra', qty: 6, price: 38 },
  { description: 'Material eléctrico', price: 412 },
  { description: 'Desplazamiento', price: 35 },
  { description: 'Descuento 5 %', price: -33.75 },
]
export const INVOICE_TAX = 0.21

const A = PROD01_SCHEDULE.activeAt
const totals = invoiceTotals(INVOICE_ITEMS, INVOICE_TAX)

export const INVOICE_SCHED = invoiceSchedule(INVOICE_ITEMS.length, {
  enterAt: A[FINAL_START] + 36, // once the PDF window's viewport is in
})

/* ── the pastes (writes), including the wrong-cell error + Ctrl+Z ──────── */

export const WRONG_CELL = [2, 1] as const // the Contacto row — where the CIF lands by mistake
export const CIF_CELL = [1, 1] as const
export const ERROR_PASTE_AT = A[ERROR_STEP]
export const UNDO_AT = ERROR_PASTE_AT + 38
export const FIX_AT = ERROR_PASTE_AT + 69

export const PROD01_WRITES: readonly CellWrite[] = [
  { at: A[12], cell: [0, 1], value: CAST.clientCompany },
  // the micro-error: the CIF pasted one row low, undone, repasted right
  { at: ERROR_PASTE_AT, cell: WRONG_CELL, value: PROD01_COPY.cif },
  { at: UNDO_AT, cell: WRONG_CELL, value: '' },
  { at: FIX_AT, cell: CIF_CELL, value: PROD01_COPY.cif },
  { at: A[16], cell: [2, 1], value: CAST.clientContact },
  // montage: the numbers land in cascade, keyed to their steps
  { at: A[20], cell: [4, 2], value: '38,00' },
  { at: A[21], cell: [4, 1], value: '6 h' },
  { at: A[22], cell: [4, 3], value: '228,00' },
  { at: A[26], cell: [5, 1], value: '1' },
  { at: A[28], cell: [5, 2], value: '412,00' },
  { at: A[29], cell: [5, 3], value: '412,00' },
  { at: A[30], cell: [6, 1], value: '1' },
  { at: A[30], cell: [6, 2], value: '35,00' },
  { at: A[30], cell: [6, 3], value: '35,00' },
  { at: A[32], cell: [7, 3], value: euro(-33.75) }, // the negative line, es-ES minus
  { at: A[34], cell: [8, 3], value: euro(totals.subtotal) },
  { at: A[35], cell: [9, 3], value: euro(totals.tax) },
  { at: A[36], cell: [10, 3], value: `${euro(totals.total)} €` },
]

/* ── CRM ficha ─────────────────────────────────────────────────────────── */

export type CrmField = { label: string; value: string; copiedAt?: number }

export const CRM_FIELDS: readonly CrmField[] = [
  { label: 'Razón social', value: CAST.clientCompany, copiedAt: A[11] },
  { label: 'CIF', value: PROD01_COPY.cif, copiedAt: A[13] },
  { label: 'Contacto', value: CAST.clientContact, copiedAt: A[15] },
  { label: 'Email', value: PROD01_COPY.replyTo },
  { label: 'Condiciones', value: PROD01_COPY.paymentTerms, copiedAt: A[17] },
]

/** CRM content geometry (local to the window's viewport content origin). */
export const CRM_GEO = {
  searchH: 38,
  resultY: 50,
  resultH: 48,
  fieldsY: 116,
  fieldH: 54,
  valueX: 150,
} as const

/** Stage point on field i's value (the copy click target). */
export function crmFieldStage(i: number): { x: number; y: number } {
  const o = content(WIN.crm)
  return { x: o.x + CRM_GEO.valueX + 90, y: o.y + CRM_GEO.fieldsY + i * CRM_GEO.fieldH + CRM_GEO.fieldH / 2 }
}

/* ── reply chip (the final «Enviar») ───────────────────────────────────── */

export const REPLY = { x: 230, y: 812, w: 380, h: 88 } as const
export const SEND_BTN = { x: REPLY.x + REPLY.w - 130, y: REPLY.y + 24, w: 110, h: 40 } as const
export const REPLY_AT = A[44] // «Redactar la respuesta»
export const ATTACH_AT = A[45] // «Adjuntar el presupuesto»
/** The send click lands here — the stopwatch freezes with it. */
export const SENT_AT = A[48] + 3

/* ── cursor script ─────────────────────────────────────────────────────── */

const emailRow = { x: WIN.inbox.x + CONTENT_DX + 254, y: WIN.inbox.y + CONTENT_DY + 80 }
const crmContent = content(WIN.crm)
const click = (
  step: number,
  x: number,
  y: number,
  travel = 16,
  state: CursorWaypoint['state'] = 'arrow', // standard pointer; pass 'cell' over the sheet
): CursorWaypoint => ({
  at: A[step] - 3, // the press lands exactly at activeAt[step]
  x,
  y,
  state,
  click: true,
  travel,
})

export const PROD01_CURSOR: readonly CursorWaypoint[] = [
  { at: 96, x: 820, y: 850 }, // enters, parks under the bandeja
  { at: EMAIL_OPEN_AT - 3, x: emailRow.x, y: emailRow.y, state: 'arrow', click: true, travel: 22 },
  { at: 205, x: 800, y: 620, state: 'arrow', travel: 20 }, // steps aside while the program forms
  { ...click(3, 840, 470, 24) }, // Abrir Excel — the sheet window draws
  { ...click(4, 650, 560) }, // Archivos recientes
  { ...click(6, 700, 592, 18) }, // Abrir la plantilla
  { ...click(7, 620, 592, 14) }, // Guardar como
  { ...click(8, 400, 130, 18) }, // Abrir el CRM — the window draws
  { at: A[9] - 3, x: crmContent.x + 254, y: crmContent.y + 19, state: 'text', click: true, travel: 16 },
  { ...click(10, crmContent.x + 254, crmContent.y + CRM_GEO.resultY + 24) },
  { at: A[11] - 3, x: crmFieldStage(0).x, y: crmFieldStage(0).y, state: 'text', click: true, travel: 16 },
  { ...click(12, sheetCellStage(0, 1).x, sheetCellStage(0, 1).y, 18, 'cell') },
  { at: A[13] - 3, x: crmFieldStage(1).x, y: crmFieldStage(1).y, state: 'text', click: true, travel: 18 },
  { ...click(14, sheetCellStage(...WRONG_CELL).x, sheetCellStage(...WRONG_CELL).y, 18, 'cell') }, // the WRONG cell
  { at: FIX_AT - 3, x: sheetCellStage(...CIF_CELL).x, y: sheetCellStage(...CIF_CELL).y, state: 'cell', click: true, travel: 14 },
  { at: A[15] - 3, x: crmFieldStage(2).x, y: crmFieldStage(2).y, state: 'text', click: true, travel: 20 },
  { ...click(16, sheetCellStage(2, 1).x, sheetCellStage(2, 1).y, 18, 'cell') },
  { ...click(17, crmFieldStage(4).x, crmFieldStage(4).y, 18) },
  // montage shuttle — fast roundtrips while the cascade fills the sheet
  { at: 885, x: sheetCellStage(4, 2).x, y: sheetCellStage(4, 2).y, state: 'cell', click: true, travel: 14 },
  { at: 935, x: crmFieldStage(3).x, y: crmFieldStage(3).y, state: 'text', click: true, travel: 14 },
  { at: 985, x: sheetCellStage(5, 3).x, y: sheetCellStage(5, 3).y, state: 'cell', click: true, travel: 14 },
  { at: 1035, x: crmFieldStage(1).x, y: crmFieldStage(1).y, state: 'text', travel: 14 },
  { at: 1085, x: sheetCellStage(6, 2).x, y: sheetCellStage(6, 2).y, state: 'cell', click: true, travel: 14 },
  { at: 1125, x: sheetCellStage(10, 3).x, y: sheetCellStage(10, 3).y, state: 'cell', travel: 12 },
  { ...click(FINAL_START, 700, 545, 14) }, // Exportar a PDF — the presupuesto draws
  { at: 1240, x: 975, y: 620, state: 'arrow', travel: 26 }, // contempla el documento
  { at: 1320, x: 410, y: 846, state: 'arrow', travel: 24 }, // baja a la respuesta
  { at: A[48] - 3, x: SEND_BTN.x + SEND_BTN.w / 2, y: SEND_BTN.y + SEND_BTN.h / 2, state: 'arrow', click: true, travel: 16 },
  { at: 1490, x: 700, y: 950, state: 'arrow', travel: 20 }, // descansa — no vanish (that beat is Prod05's)
]

/** step → cursor-waypoint index, for every click that drives a program step. */
export const STEP_CLICKS: readonly { step: number; wp: number }[] = [
  { step: 3, wp: 3 },
  { step: 4, wp: 4 },
  { step: 6, wp: 5 },
  { step: 7, wp: 6 },
  { step: 8, wp: 7 },
  { step: 9, wp: 8 },
  { step: 10, wp: 9 },
  { step: 11, wp: 10 },
  { step: 12, wp: 11 },
  { step: 13, wp: 12 },
  { step: 14, wp: 13 },
  { step: 15, wp: 15 },
  { step: 16, wp: 16 },
  { step: 17, wp: 17 },
  { step: 41, wp: 24 },
  { step: 48, wp: 27 },
]

/* ── stopwatch: el cronómetro que se arrastra ──────────────────────────── */

/** (frame, elapsed task seconds) control points — light compression during
 * the detail work, heavy through the montage, frozen once «Enviar» lands. */
export const STOPWATCH_POINTS: readonly (readonly [number, number])[] = [
  [EXEC_START, 0],
  [ERROR_PASTE_AT, 150], // 02:30 when the error happens
  [A[15], 260], // the mistake cost a minute
  [A[FINAL_START], 1140], // 19:00 after the montage
  [SENT_AT, 23 * 60 + 14], // 23:14 — the number Prod02 answers
]

/** Elapsed task seconds at `frame` — piecewise linear, clamped, monotone. */
export function stopwatchSeconds(frame: number): number {
  const pts = STOPWATCH_POINTS
  if (frame <= pts[0][0]) return pts[0][1]
  for (let i = 1; i < pts.length; i++) {
    const [f1, s1] = pts[i]
    if (frame <= f1) {
      const [f0, s0] = pts[i - 1]
      return s0 + ((s1 - s0) * (frame - f0)) / (f1 - f0)
    }
  }
  return pts[pts.length - 1][1]
}

/** 1394 → '23:14'. */
export function mmss(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

/* ── camera rig ────────────────────────────────────────────────────────── */

const wrongCell = sheetCellStage(...WRONG_CELL)

export const PROD01_CAM: readonly CameraFraming[] = [
  { at: 0, zoom: 1.16, fx: 470, fy: 500 }, // the bandeja
  { at: 215, zoom: 1.0, fx: 1010, fy: 520, travel: 36 }, // the program panel joins
  { at: 380, zoom: 1.05, fx: 870, fy: 600, travel: 32 }, // the sheet draws — work begins
  { at: 520, zoom: 0.97, fx: 720, fy: 520, travel: 30 }, // the CRM joins the desk
  { at: 700, zoom: 1.22, fx: wrongCell.x, fy: wrongCell.y - 16, travel: 26 }, // the error, close
  { at: 820, zoom: 0.99, fx: 740, fy: 560, travel: 30 }, // back to work
  { at: 905, zoom: 0.88, fx: 960, fy: 540, travel: 44 }, // montage — the whole desk
  { at: 1205, zoom: 1.07, fx: 980, fy: 520, travel: 36 }, // the PDF materialises
  { at: 1495, zoom: 0.9, fx: 960, fy: 540, travel: 48 }, // final wide — the held still
]
