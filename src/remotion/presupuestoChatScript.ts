/**
 * presupuestoChatScript.ts — choreography for PresupuestoChat (versión limpia).
 * ───────────────────────────────────────────────────────────────────────────
 * Sin historia, sin panel: una sola instrucción del humano, y la IA se pone a
 * trabajar. Hace un tool-call que declara los pasos que va a seguir, los
 * completa uno a uno, y adjunta el presupuesto en PDF. Nada más.
 *
 * El total del adjunto se DERIVA de las líneas del presupuesto (INVOICE_ITEMS),
 * las mismas del resto del deck, para que la cifra siempre cuadre.
 */
import { CAST } from './aikit/cast'
import { euro, invoiceTotals } from './aikit/widgetScript'
import { INVOICE_ITEMS, INVOICE_TAX, PROD01_COPY } from './prod01Script'

const totals = invoiceTotals(INVOICE_ITEMS, INVOICE_TAX)

/* ── copy (es-ES; nombres/cifras vienen de CAST + el presupuesto) ───────── */

export const PRESUPUESTO_COPY = {
  userMessage: `Prepárame el presupuesto del material para ${CAST.clientCompany}.`,
  toolTitle: 'Generando el presupuesto',
  working: 'Trabajando…',
  done: 'Listo',
  attachName: `${PROD01_COPY.invoiceNumber}.pdf`,
  attachMeta: `Presupuesto · ${euro(totals.total)} €`,
} as const

/** Los pasos que la IA declara en el tool-call y luego ejecuta. */
export const PRESUPUESTO_STEPS: readonly string[] = [
  `Leer la solicitud de ${CAST.clientContact}`,
  'Recuperar la ficha del cliente (CRM)',
  'Calcular líneas: mano de obra y materiales',
  'Aplicar descuento e IVA (21 %)',
  'Generar el PDF del presupuesto',
]

/* ── timeline (frames @30fps) ───────────────────────────────────────────── */

export const TYPE_START = 10 // el humano empieza a escribir
export const SENT_AT = 108 // el mensaje se envía
export const WORK_START = SENT_AT + 18 // aparece la tarjeta del tool-call
export const STEPS_START = WORK_START + 26 // arranca el primer paso
export const STEP_DUR = 30 // un paso "en curso" cada vez

export type StepBeat = { label: string; startAt: number; doneAt: number }

/** Place each step back to back: one in progress at a time, then done. */
export function stepSchedule(
  steps: readonly string[],
  startAt = STEPS_START,
  dur = STEP_DUR,
): StepBeat[] {
  return steps.map((label, i) => ({
    label,
    startAt: startAt + i * dur,
    doneAt: startAt + (i + 1) * dur,
  }))
}

export const PRESUPUESTO_SCHEDULE = stepSchedule(PRESUPUESTO_STEPS)

/** Frame the last step finishes — header flips to "Listo" here. */
export const ALL_DONE = PRESUPUESTO_SCHEDULE[PRESUPUESTO_SCHEDULE.length - 1].doneAt
/** The PDF attachment drops in just after the work completes. */
export const ATTACH_AT = ALL_DONE + 14

export const PRESUPUESTO_DURATION = ATTACH_AT + 84
