/**
 * CampaignLiveScene — acto 5 (cierre) de la mini-película Email Marketing.
 * ──────────────────────────────────────────────────────────────────────────
 * El remate: la campaña ya no es trabajo, es una máquina. **Action Script** la
 * envía y la nutre 24/7 con una secuencia automática (Bienvenida → Recordatorio
 * → Promo), y **Foresight** mide y mejora los resultados. Un titular + el sello
 * del módulo + la secuencia que se va "enviando sola" (checks que aparecen uno a
 * uno) + dos pruebas: el salto de aperturas (`StatWidget`) y los clics subiendo
 * (`ChartWidget`).
 *
 * Titular, secuencia y widgets emergen con `spring` escalonado, derivado de
 * `useCurrentFrame()` (determinista, sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { lightTheme, KIT_BLUE, BRAND, TEXT_FONT, elevation } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { StatWidget } from '@/stories/neo/widgets/StatWidget'
import { ChartWidget } from '@/stories/neo/widgets/ChartWidget'
import { Icon } from '@/components/icons'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

export const CAMPAIGN_LIVE_DURATION = 150

// La secuencia de nutrición automática (cada email "se envía" en su frame).
type Step = { subject: string; when: string; sentAt: number }
const STEPS: Step[] = [
  { subject: 'Bienvenida', when: 'Día 0', sentAt: 40 },
  { subject: 'Recordatorio', when: 'Día 3', sentAt: 58 },
  { subject: 'Promo ‑20%', when: 'Día 7', sentAt: 76 },
]

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

export function CampaignLiveScene() {
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
          <img src={MODULES.actionScript.icon} alt="Action Script" width={30} height={30} style={{ display: 'block' }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: lightTheme.textStrong }}>
            Enviada y nutrida con Action Script
          </span>
        </div>

        {/* Secuencia automática: los emails se van enviando solos. */}
        <div style={{ ...rise(16), display: 'flex', alignItems: 'center', gap: 14 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <NurtureCard step={s} frame={frame} fps={fps} />
              {i < STEPS.length - 1 && (
                <Icon name="arrow" size={22} color={lightTheme.textMuted} strokeWidth={2} />
              )}
            </div>
          ))}
        </div>

        {/* Las dos pruebas: salto de aperturas + clics subiendo. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
          <div style={rise(28)}>
            <StatWidget label="Apertura media" before="12%" after="34%" delta={183} accent="blue" />
          </div>
          <div style={rise(40)}>
            <ChartWidget
              title="Ventas por campaña"
              data={[1200, 1800, 1500, 2600, 2400, 3600, 4700]}
              labels={['L', 'M', 'X', 'J', 'V', 'S', 'D']}
              accent="green"
              delta="+164%"
            />
          </div>
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}

/** Una tarjeta de la secuencia: asunto + cuándo + estado (programado → enviado ✓). */
function NurtureCard({ step, frame, fps }: { step: Step; frame: number; fps: number }) {
  const plate = elevation(lightTheme, { depth: 'raised', distance: 8, blur: 18, radius: 18 })
  const sent = frame >= step.sentAt
  // El check "salta" al enviarse.
  const pop = spring({ frame: frame - step.sentAt, fps, config: { damping: 12, stiffness: 200, mass: 0.6 } })
  const checkScale = sent ? 0.6 + 0.4 * clamp01(pop) : 0

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
        <Icon name="email" size={22} color={KIT_BLUE} strokeWidth={1.8} />
        <span style={{ fontSize: 11, fontWeight: 600, color: lightTheme.textMuted, letterSpacing: 0.2 }}>
          {step.when}
        </span>
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, color: lightTheme.textStrong, letterSpacing: -0.3 }}>
        {step.subject}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minHeight: 20 }}>
        {sent ? (
          <>
            <span style={{ display: 'inline-flex', transform: `scale(${checkScale})`, color: BRAND.green }}>
              <Icon name="check" size={18} color={BRAND.green} strokeWidth={2} />
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.green }}>Enviado</span>
          </>
        ) : (
          <>
            <Icon name="clock" size={16} color={lightTheme.textMuted} strokeWidth={1.8} />
            <span style={{ fontSize: 12.5, color: lightTheme.textMuted }}>Programado</span>
          </>
        )}
      </div>
    </div>
  )
}
