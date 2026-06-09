/**
 * SchedulingRulesScene — acto 3 de la mini-película Planificación de Horarios.
 * ──────────────────────────────────────────────────────────────────────────
 * Sustituye al antiguo chat de reglas: en vez de teclear en un chat, se ve a
 * **Feedback Loop** RECOGER y CONFIRMAR las reglas del cuadrante en un panel —
 * cada restricción aparece y se marca con un check (entendida). Es "la IA
 * entendiendo cómo quieres los turnos", sin volver a usar la plantilla de chat.
 *
 * Reutiliza el patrón visual tarjeta + lista de {@link StaffImportScene} /
 * {@link ContactsMergeScene} (NeoTheme + elevation + filas que emergen con
 * `spring`). Todo derivado de `useCurrentFrame()`: determinista frame a frame
 * (sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, BRAND, DISPLAY_FONT } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { Icon } from '@/components/icons'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const CARD_AT = 6
const RULES_AT = 26 // primera regla
const RULE_STEP = 18 // separación entre reglas
const CHECK_LAG = 9 // el check confirma un poco después de aparecer la regla
const HOLD = 34

const RULES: Array<{ label: string; sub: string; color: 'blue' | 'green' | 'violet' | 'orange' | 'pink' }> = [
  { label: 'Nadie más de 5 días seguidos', sub: 'descanso garantizado', color: 'blue' },
  { label: 'Refuerza el viernes por la tarde', sub: 'pico de demanda', color: 'orange' },
  { label: 'Respeta contratos y vacaciones', sub: 'horas y ausencias', color: 'violet' },
  { label: 'Mínimo 2 personas por turno', sub: 'nunca sola la barra', color: 'green' },
  { label: 'Marta no trabaja los lunes', sub: 'preferencia fija', color: 'pink' },
]

export const SCHEDULING_RULES_DURATION = Math.ceil(
  RULES_AT + (RULES.length - 1) * RULE_STEP + CHECK_LAG + 24 + HOLD,
)

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

export function SchedulingRulesScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const cardIn = spring({ frame: frame - CARD_AT, fps, config: { damping: 200, mass: 0.8 } })
  const card = elevation(theme, { depth: 'raised', distance: 14, blur: 32, radius: 28 })
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 18 })

  const confirmed = RULES.filter((_, i) => frame >= RULES_AT + i * RULE_STEP + CHECK_LAG).length

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: theme.surface,
          background: `radial-gradient(1100px 760px at 50% 42%, #ffffff 0%, ${theme.surface} 66%, #ececf4 100%)`,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BODY_FONT,
        }}
      >
        <Fonts />

        <div
          style={{
            width: 620,
            transform: `translateY(${(1 - cardIn) * 24}px) scale(${0.97 + 0.03 * cardIn})`,
            opacity: cardIn,
            padding: 30,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            background: theme.surface,
            ...card,
          }}
        >
          {/* Cabecera: sello Feedback Loop + contador de reglas entendidas */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, display: 'grid', placeItems: 'center', background: `${KIT_BLUE}15` }}>
              <img src={MODULES.feedbackLoop.icon} alt="Feedback Loop" width={30} height={30} style={{ display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 19, fontWeight: 750, color: theme.textStrong, letterSpacing: -0.3 }}>
                Reglas del cuadrante
              </span>
              <span style={{ fontSize: 13.5, color: theme.textMuted, letterSpacing: -0.2 }}>
                Feedback Loop entiende cómo quieres los turnos
              </span>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: DISPLAY_FONT,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -1,
                color: KIT_BLUE,
              }}
            >
              {confirmed}/{RULES.length}
            </span>
          </div>

          {/* Lista de reglas que se confirman una a una */}
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, ...well }}>
            {RULES.map((rule, i) => {
              const at = RULES_AT + i * RULE_STEP
              const rowIn = spring({ frame: frame - at, fps, config: { damping: 200, mass: 0.7 } })
              if (rowIn <= 0.001) return null
              const checkIn = clamp01((frame - (at + CHECK_LAG)) / 10)
              const hue = BRAND[rule.color]
              return (
                <div
                  key={rule.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 13,
                    padding: '12px 14px',
                    borderRadius: 16,
                    background: theme.surface,
                    opacity: rowIn,
                    transform: `translateY(${(1 - rowIn) * 10}px)`,
                    ...elevation(theme, { depth: 'raised', distance: 5, blur: 12, radius: 16 }),
                  }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: 999, background: hue, flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 16.5, fontWeight: 650, color: theme.textStrong, letterSpacing: -0.3 }}>
                      {rule.label}
                    </span>
                    <span style={{ fontSize: 12.5, color: theme.textMuted, letterSpacing: -0.2 }}>{rule.sub}</span>
                  </div>
                  <span
                    style={{
                      flexShrink: 0,
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      display: 'grid',
                      placeItems: 'center',
                      background: `${BRAND.green}1f`,
                      opacity: checkIn,
                      transform: `scale(${0.6 + 0.4 * checkIn})`,
                    }}
                  >
                    <Icon name="check" size={16} color={BRAND.green} strokeWidth={2.4} />
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
