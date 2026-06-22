import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { ProgramRunner } from './ProgramRunner'
import { programDuration, programSchedule, validateProgramTempo } from './programScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for ProgramRunner; not part of the event deck.
 * Left: a short program at the slow human tempo (Yusta02), with a dramatic
 * hold mid-run. Right: a long program at the AiKit cascade tempo (Prod02
 * shape) inside a fixed-height panel, exercising the scroll-follow. */

const theme = lightTheme

// ── left: 6 steps, deliberate stepper pace, one hold ────────────────────────
const SLOW_STEPS = [
  { title: 'Abrir el correo del cliente', detail: `${CAST.clientCompany} · presupuesto` },
  { title: 'Buscar las referencias', detail: 'Hoja "Pedidos 2026"' },
  { title: 'Comprobar el stock', detail: '84 referencias' },
  { title: 'Calcular los precios', detail: 'Tarifa general · IVA incluido' },
  { title: 'Rellenar la plantilla', detail: 'Plantilla "Servicios"' },
  { title: 'Enviar el presupuesto', detail: `Para ${CAST.clientContact}` },
]
const SLOW_TEMPO = {
  startAt: 30,
  active: 26,
  advance: 34,
  holds: [{ before: 3, frames: 36 }], // the human stops to double-check
}
const SLOW = programSchedule(SLOW_STEPS.length, SLOW_TEMPO)

// ── right: 24 steps, fast cascade in a clipped viewport ─────────────────────
const FAST_TITLES = [
  'Leer el correo entrante',
  'Extraer las referencias',
  'Abrir la hoja de pedidos',
  'Localizar cada artículo',
  'Comprobar el stock',
  'Reservar las unidades',
  'Consultar la tarifa',
  'Aplicar el descuento',
  'Calcular los portes',
  'Sumar el IVA',
  'Abrir el CRM',
  'Buscar la ficha del cliente',
  'Actualizar el contacto',
  'Registrar la oportunidad',
  'Abrir la plantilla',
  'Volcar las líneas',
  'Insertar los totales',
  'Revisar los datos fiscales',
  'Generar el PDF',
  'Adjuntar las condiciones',
  'Redactar el correo',
  'Añadir el asunto',
  'Programar el seguimiento',
  'Enviar el presupuesto',
]
const FAST_STEPS = FAST_TITLES.map((title) => ({ title }))
const FAST_TEMPO = { startAt: 48, active: 14, advance: 7 }
const FAST = programSchedule(FAST_STEPS.length, FAST_TEMPO)

for (const err of [
  ...validateProgramTempo(SLOW_STEPS.length, SLOW_TEMPO),
  ...validateProgramTempo(FAST_STEPS.length, FAST_TEMPO),
]) {
  throw new Error(`ProgramRunnerDemo: ${err}`)
}

export const PROGRAM_RUNNER_DEMO_DURATION = Math.max(
  programDuration(SLOW),
  programDuration(FAST),
)

export function ProgramRunnerDemo() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.surface,
        fontFamily: BODY_FONT,
        color: theme.textStrong,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 120,
      }}
    >
      <Fonts />
      <ProgramRunner
        steps={SLOW_STEPS}
        schedule={SLOW}
        title="Programa · a mano"
        width={540}
        enterAt={6}
      />
      <ProgramRunner
        steps={FAST_STEPS}
        schedule={FAST}
        title="Programa · AiKit"
        width={520}
        height={640}
        rowHeight={44}
        enterAt={14}
      />
    </AbsoluteFill>
  )
}
