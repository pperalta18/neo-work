/**
 * ScheduleTemplateScene — cierre (1/2) de Planificación de Horarios: LA PLANTILLA.
 * ──────────────────────────────────────────────────────────────────────────
 * La planilla semanal se rellena sola (reusa {@link ScheduleFillVideo}
 * time-remapeada) como protagonista único y CENTRADO, con la pill "Plantillas
 * creadas con Glimpse" encima. Antes esto compartía pantalla con los KPIs y el
 * aviso de Heartbeat (quedaba desbalanceado, "dos cosas"); ahora son dos clips:
 * éste (la plantilla) y {@link ScheduleResultsScene} (resultados en piloto
 * automático). El titular se inyecta fuera del vídeo (`cabeceras-extraidas.md`).
 */

import { AbsoluteFill, Easing, spring, useCurrentFrame } from 'remotion'
import { lightTheme, TEXT_FONT } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { MODULES } from '@/stories/neo/modules/modules'
import { ScheduleFillVideo } from './ScheduleFillVideo'
import { Fonts, BODY_FONT } from './fonts'

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const EXPO = Easing.bezier(0.16, 1, 0.3, 1)
const QUINT = Easing.bezier(0.83, 0, 0.17, 1)

export const SCHEDULE_TEMPLATE_DURATION = 165 // se rellena y se sostiene para leer la semana

// Time-remap de la planilla (local → frame de ScheduleFillVideo): se rellena
// rápido y luego se sostiene casi al final para que la semana se lea completa.
const KF: Array<[number, number, (t: number) => number]> = [
  [0, 0, EXPO],
  [16, 28, EXPO],
  [64, 92, QUINT],
  [120, 172, EXPO],
  [150, 222, QUINT],
]

function scheduleFrameAt(local: number): number {
  if (local <= 0) return 0
  for (let i = 0; i < KF.length - 1; i++) {
    const [a, av, ease] = KF[i]
    const [b, bv] = KF[i + 1]
    if (local < b) {
      const p = clamp01((local - a) / (b - a))
      return av + (bv - av) * ease(p)
    }
  }
  return 232
}

// Recorte de la planilla a su tarjeta (más un pequeño aire para conservar la
// sombra), para que sea el héroe centrado sin sangrar ni mostrar márgenes.
const CARD_SCALE = 0.72
const CARD_X = 140 // x/y de la tarjeta dentro del frame 1920×1080 de ScheduleFillVideo
const CARD_Y = 92
const CARD_W = 1640
const CARD_H = 900
const BLEED = 46
const CAL_W = Math.round((CARD_W + BLEED * 2) * CARD_SCALE)
const CAL_H = Math.round((CARD_H + BLEED * 2) * CARD_SCALE)

function GlimpsePill({ frame }: { frame: number }) {
  const p = spring({ frame: frame - 8, fps: 30, config: { damping: 200, mass: 0.75 } })
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 18px 10px 12px',
        borderRadius: 999,
        background: '#fff',
        boxShadow: '0 8px 24px rgba(45, 53, 78, 0.16), 0 1px 3px rgba(45, 53, 78, 0.12)',
        fontFamily: TEXT_FONT,
        opacity: p,
        transform: `translateY(${(1 - p) * -10}px)`,
      }}
    >
      <img src={MODULES.glimpse.icon} alt="Glimpse" width={26} height={26} style={{ display: 'block' }} />
      <span style={{ fontSize: 15.5, fontWeight: 650, color: lightTheme.textStrong }}>
        Plantillas creadas con Glimpse
      </span>
    </div>
  )
}

export function ScheduleTemplateScene() {
  const frame = useCurrentFrame()
  const scheduleFrame = scheduleFrameAt(frame)

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill style={{ backgroundColor: lightTheme.surface, fontFamily: BODY_FONT, overflow: 'hidden' }}>
        <Fonts />
        {/* Fondo limpio (sin gris): blanco al centro → surface, nada de #ececf4. */}
        <AbsoluteFill
          style={{ background: `radial-gradient(1500px 1040px at 50% 48%, #ffffff 0%, ${lightTheme.surface} 78%)` }}
        />

        {/* Pill de Glimpse + planilla, centrados como grupo. */}
        <AbsoluteFill
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}
        >
          <GlimpsePill frame={frame} />
          <div style={{ width: CAL_W, height: CAL_H, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
            <div
              style={{
                position: 'absolute',
                left: -(CARD_X - BLEED) * CARD_SCALE,
                top: -(CARD_Y - BLEED) * CARD_SCALE,
                width: 1920,
                height: 1080,
                transform: `scale(${CARD_SCALE})`,
                transformOrigin: '0 0',
              }}
            >
              <ScheduleFillVideo frameOverride={scheduleFrame} />
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
