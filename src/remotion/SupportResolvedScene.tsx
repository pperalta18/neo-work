/**
 * SupportResolvedScene — acto 5 (cierre) de la mini-película Atención al Cliente.
 * ──────────────────────────────────────────────────────────────────────────
 * El remate: "cliente atendido, equipo aliviado". **Skill Hub** resuelve solo lo
 * repetitivo y **Foresight** aprende de cada caso. Un titular + el sello del
 * módulo + dos pruebas: el desplome del tiempo de primera respuesta
 * (`StatWidget`) y un cliente feliz (`TestimonialWidget`).
 *
 * Emergen con `spring` escalonado, derivado de `useCurrentFrame()` (determinista).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { lightTheme, KIT_BLUE } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { StatWidget } from '@/stories/neo/widgets/StatWidget'
import { TestimonialWidget } from '@/stories/neo/widgets/TestimonialWidget'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

export const SUPPORT_RESOLVED_DURATION = 150

export function SupportResolvedScene() {
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
          gap: 50,
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
          <img src={MODULES.skillHub.icon} alt="Skill Hub" width={30} height={30} style={{ display: 'block' }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: lightTheme.textStrong }}>
            Resuelto con Skill Hub · 68% sin tocar nada
          </span>
        </div>

        {/* Las dos pruebas: primera respuesta + cliente feliz. */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={rise(16)}>
            <StatWidget label="Primera respuesta" before="3 h" after="30 s" delta={-99} accent="blue" />
          </div>
          <div style={rise(28)}>
            <TestimonialWidget
              quote="Pregunté por WhatsApp un domingo y me respondieron al momento. Ni sabía que era una IA."
              name="Lucía Marín"
              role="Cliente"
              rating={5}
              starColor="blue"
            />
          </div>
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
