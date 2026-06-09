/**
 * AccountingLoopScene — el ANÁLISIS de Foresight (§8 del pitch).
 * ──────────────────────────────────────────────────────────────────────────
 * Tras dirigir el análisis por chat, la IA CRUZA las fechas de emisión con lo
 * que tarda en cobrarse y encuentra el patrón ("las del miércoles se cobran
 * antes"), mide la correlación y prepara el informe. Es el corazón del ejemplo
 * de velocidad de cobro.
 *
 * La cadena de razonamiento (`NeoReasoning`) avanza derivada de
 * `useCurrentFrame()`: cada paso pasa de pendiente → activo (spinner) → hecho
 * (check azul). Al lado, la **placa del módulo Foresight en funcionamiento**
 * ({@link OperatingModuleTile}, estado "Buscando patrones") como sello del acto.
 * Todo determinista (sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { NeoReasoning, type ReasoningStep, type ReasoningStatus } from '@/stories/neo/NeoReasoning'
import { OperatingModuleTile } from './OperatingModuleTile'
import { Fonts, BODY_FONT } from './fonts'

/** Lado de la placa cuadrada del módulo. */
const TILE = 132

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

type StepDef = { title: string; detail?: string; activeAt: number; doneAt: number }

// La cadena: cruzar datos → patrón → correlación → informe.
const STEPS: StepDef[] = [
  { title: 'Cruzo fecha de emisión ↔ días hasta cobro', detail: '1.240 facturas', activeAt: 6, doneAt: 30 },
  { title: 'Las del miércoles se cobran 6 días antes', detail: 'patrón detectado', activeAt: 30, doneAt: 56 },
  { title: 'Mido la correlación', activeAt: 56, doneAt: 78 },
  { title: 'Preparo el informe', detail: 'listo para Glimpse', activeAt: 78, doneAt: 98 },
]

export const ACCOUNTING_LOOP_DURATION = 122 // last doneAt + tail (cola ampliada para leer "Preparo el informe")

const statusAt = (s: StepDef, frame: number): ReasoningStatus =>
  frame < s.activeAt ? 'pending' : frame < s.doneAt ? 'active' : 'done'

export function AccountingLoopScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const steps: ReasoningStep[] = STEPS.map((s) => ({
    title: s.title,
    detail: s.detail,
    status: statusAt(s, frame),
  }))
  const allDone = STEPS.every((s) => frame >= s.doneAt)

  // Spring entrances: the chain settles first, the module badge a beat later.
  const rise = (since: number, dy = 16) => {
    const t = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.7 } })
    return { opacity: t, transform: `translateY(${(1 - t) * dy}px) scale(${0.98 + 0.02 * t})` }
  }

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: lightTheme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BODY_FONT,
          gap: 44,
          flexDirection: 'column',
        }}
      >
        <Fonts />

        <div style={rise(0)}>
          <NeoReasoning
            title="Análisis"
            elapsed={allDone ? 'listo' : 'analizando…'}
            width={560}
            steps={steps}
          />
        </div>

        {/* La placa se renderiza inline (sin x/y) y se abre simétrica; la centra
            el flex en columna. */}
        <div style={rise(18, 22)}>
          <OperatingModuleTile
            module="foresight"
            status="Buscando patrones"
            frame={frame}
            expand={smoother(clamp01((frame - 18) / 18))}
            size={TILE}
          />
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
