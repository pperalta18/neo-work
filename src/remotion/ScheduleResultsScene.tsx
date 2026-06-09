/**
 * ScheduleResultsScene — cierre (2/2) de Planificación de Horarios: RESULTADOS.
 * ──────────────────────────────────────────────────────────────────────────
 * El remate: la planilla ya no es trabajo, es una máquina que gira sola.
 * **Heartbeat** la mantiene viva (publica, avisa, cubre bajas y re-cuadra), y la
 * prueba son los KPIs: los conflictos a 0 y la cobertura al 100%. Hermano del
 * cierre de Email Marketing ({@link CampaignLiveScene}): sello del módulo + una
 * secuencia que "ocurre sola" (checks que saltan uno a uno) + dos pruebas
 * (`StatWidget` + `ChartWidget`). Todo derivado de `useCurrentFrame()`.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { lightTheme, KIT_BLUE, BRAND, TEXT_FONT, elevation } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { StatWidget } from '@/stories/neo/widgets/StatWidget'
import { ChartWidget } from '@/stories/neo/widgets/ChartWidget'
import { Icon, type IconName } from '@/components/icons'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

export const SCHEDULE_RESULTS_DURATION = 165

// La rutina semanal que corre sola (cada paso "ocurre" en su frame).
type Step = { title: string; when: string; icon: IconName; doneAt: number }
const STEPS: Step[] = [
  { title: 'Publica la semana', when: 'Cada lunes', icon: 'calendar', doneAt: 40 },
  { title: 'Avisa al equipo', when: 'Al instante', icon: 'bell', doneAt: 56 },
  { title: 'Cubre bajas', when: 'En vivo', icon: 'employee', doneAt: 72 },
  { title: 'Re-cuadra cambios', when: 'Automático', icon: 'automate', doneAt: 88 },
]

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

export function ScheduleResultsScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const rise = (since: number, dy = 18) => {
    const t = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.7 } })
    return { opacity: t, transform: `translateY(${(1 - t) * dy}px) scale(${0.97 + 0.03 * t})` }
  }

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: lightTheme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BODY_FONT,
          flexDirection: 'column',
          gap: 44,
        }}
      >
        <Fonts />

        {/* Sello del módulo. */}
        <div
          style={{
            ...rise(8),
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 20px 10px 14px',
            borderRadius: 999,
            background: `${KIT_BLUE}14`,
          }}
        >
          <img src={MODULES.heartbeat.icon} alt="Heartbeat" width={30} height={30} style={{ display: 'block' }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: lightTheme.textStrong }}>
            En piloto automático con Heartbeat
          </span>
        </div>

        {/* La rutina semanal: cada paso se completa solo. */}
        <div style={{ ...rise(16), display: 'flex', alignItems: 'center', gap: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <RoutineCard step={s} frame={frame} fps={fps} />
              {i < STEPS.length - 1 && (
                <Icon name="arrow" size={22} color={lightTheme.textMuted} strokeWidth={2} />
              )}
            </div>
          ))}
        </div>

        {/* Las dos pruebas: conflictos a cero + cobertura subiendo al 100%. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={rise(30)}>
            <StatWidget label="Conflictos" before="14" after="0" delta={-100} accent="green" />
          </div>
          <div style={rise(42)}>
            <ChartWidget
              title="Cobertura semanal"
              data={[72, 76, 82, 88, 95, 100, 100]}
              labels={['L', 'M', 'X', 'J', 'V', 'S', 'D']}
              accent="blue"
              delta="+18%"
              valueFormat="percent"
            />
          </div>
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}

/** Una tarjeta de la rutina: acción + cadencia + estado (en cola → hecho ✓). */
function RoutineCard({ step, frame, fps }: { step: Step; frame: number; fps: number }) {
  const plate = elevation(lightTheme, { depth: 'raised', distance: 8, blur: 18, radius: 18 })
  const done = frame >= step.doneAt
  // El check "salta" al completarse.
  const pop = spring({ frame: frame - step.doneAt, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } })
  const checkScale = done ? 0.6 + 0.4 * clamp01(pop) : 0

  return (
    <div
      style={{
        width: 200,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        background: lightTheme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Icon name={step.icon} size={22} color={KIT_BLUE} strokeWidth={1.8} />
        <span style={{ fontSize: 11, fontWeight: 600, color: lightTheme.textMuted, letterSpacing: 0.2 }}>
          {step.when}
        </span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: lightTheme.textStrong, letterSpacing: -0.3 }}>
        {step.title}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 20 }}>
        {done ? (
          <>
            <span style={{ display: 'inline-flex', transform: `scale(${checkScale})`, color: BRAND.green }}>
              <Icon name="check" size={18} color={BRAND.green} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.green }}>Hecho</span>
          </>
        ) : (
          <>
            <Icon name="clock" size={16} color={lightTheme.textMuted} strokeWidth={1.8} />
            <span style={{ fontSize: 12.5, color: lightTheme.textMuted }}>En cola</span>
          </>
        )}
      </div>
    </div>
  )
}
