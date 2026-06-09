/**
 * AccountingCloseScene — acto 5 (cierre) de la mini-película Accounting.
 * ──────────────────────────────────────────────────────────────────────────
 * El remate: el trimestre queda cerrado "cómodo, rápido y seguro gracias a
 * AiKit". Un titular grande + dos pruebas: un KPI antes→después (lo RÁPIDO y
 * CÓMODO) y un sello de firma electrónica (lo SEGURO / legal y al detalle).
 *
 * Titular y widgets emergen con `spring` escalonado, derivado de
 * `useCurrentFrame()` (determinista, sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { lightTheme, KIT_BLUE } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { StatWidget } from '@/stories/neo/widgets/StatWidget'
import { SignatureWidget } from '@/stories/neo/widgets/SignatureWidget'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

export const ACCOUNTING_CLOSE_DURATION = 92

export function AccountingCloseScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Staggered spring entrances: title → KPI → seal.
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
          gap: 56,
        }}
      >
        <Fonts />

        {/* Informe del análisis, presentado con Glimpse (§8). */}
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
          <img src={MODULES.glimpse.icon} alt="Glimpse" width={30} height={30} style={{ display: 'block' }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: -0.3, color: lightTheme.textStrong }}>
            Informe creado con Glimpse
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={rise(14)}>
            <StatWidget label="Cierre trimestral" before="3 días" after="5 min" delta={-99} accent="blue" />
          </div>
          <div style={rise(26)}>
            <SignatureWidget
              signed
              docTitle="Cierre Q2 · reportado"
              signer="AiKit"
              role="Cerrado y conciliado automáticamente"
              date="3 jun 2026"
            />
          </div>
        </div>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
