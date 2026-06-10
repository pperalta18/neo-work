/**
 * SupportChatScene — el beat de RESOLUCIÓN automática (Action Runner).
 * ──────────────────────────────────────────────────────────────────────────
 * "La IA atiende sola". Un CLIENTE escribe con una duda real ("¿dónde está mi
 * pedido?") y **Action Runner** responde y resuelve AL INSTANTE, con los datos a
 * mano — sin que nadie del equipo tenga que tocar nada. El cliente es quien
 * escribe (a la derecha, "redacta" su duda en el input); AiKit responde a la
 * izquierda como burbuja entrante (estado "escribiendo…" y se envía).
 *
 * Misma plantilla que los otros chats (NeoMessage + NeoInput en un NeoCard) con
 * header de marca del módulo. Todo derivado de `useCurrentFrame()`.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { lightTheme, BRAND, elevation } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { NeoMessage } from '@/stories/neo/NeoMessage'
import { NeoInput } from '@/stories/neo/NeoInput'
import { NeoCard } from '@/stories/neo/widgets/NeoCard'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts, BODY_FONT } from './fonts'

type Line = {
  from: 'me' | 'them'
  text: string
  time: string
  showAt: number
  typeStart?: number
}

// El cliente (me, derecha) pregunta; AiKit (them, izquierda) resuelve al instante.
const SCRIPT: Line[] = [
  { from: 'me', text: 'Hola, ¿dónde está mi pedido #1240?', time: '9:41', typeStart: 8, showAt: 34 },
  { from: 'them', text: '¡Hola Lucía! Salió ayer 📦 Llega mañana antes de las 14 h.', time: '9:41', typeStart: 42, showAt: 96 },
  { from: 'them', text: '¿Te ayudo con algo más?', time: '9:41', typeStart: 104, showAt: 134 },
]

export const SUPPORT_CHAT_DURATION = 186 // cola ampliada para leer el cierre "¿Te ayudo con algo más?"

export function SupportChatScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const enter = (since: number, from: 'me' | 'them') => {
    const s = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.6 } })
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: from === 'me' ? 'flex-end' : 'flex-start',
      opacity: s,
      transform: `translateY(${(1 - s) * 14}px) scale(${0.97 + 0.03 * s})`,
    }
  }

  const shown = SCRIPT.filter((l) => frame >= l.showAt)
  const thinking = SCRIPT.find(
    (l) => l.from === 'them' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  )
  const composing = SCRIPT.find(
    (l) => l.from === 'me' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  )
  const inputValue = composing
    ? composing.text.slice(
        0,
        Math.round(
          interpolate(frame, [composing.typeStart!, composing.showAt - 8], [0, composing.text.length], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        ),
      )
    : ''

  const well = elevation(lightTheme, { depth: 'recessed', distance: 3, blur: 8, radius: 14 })
  const headerIn = spring({ frame, fps, config: { damping: 200, mass: 0.7 } })

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: lightTheme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BODY_FONT,
        }}
      >
        <Fonts />
        <NeoCard
          width={580}
          padding={28}
          radius={40}
          center={false}
          style={{ height: 500, justifyContent: 'flex-end', gap: 0 }}
        >
          {/* header de marca del módulo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              paddingBottom: 16,
              opacity: headerIn,
              transform: `translateY(${(1 - headerIn) * -8}px)`,
            }}
          >
            <div style={{ width: 44, height: 44, display: 'grid', placeItems: 'center', ...well }}>
              <img src={MODULES.actionRunner.icon} alt="Action Runner" width={28} height={28} style={{ display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: lightTheme.textStrong }}>
                Action Runner
              </span>
              <span style={{ fontSize: 12.5, color: lightTheme.textMuted, letterSpacing: -0.2 }}>
                responde al instante
              </span>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: BRAND.green,
                background: `${BRAND.green}1f`,
                borderRadius: 999,
                padding: '5px 12px',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 999, background: BRAND.green }} />
              en línea
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              justifyContent: 'flex-end',
              flex: 1,
              minHeight: 0,
              paddingBottom: 22,
            }}
          >
            {shown.map((l) => (
              <div key={l.text} style={enter(l.showAt, l.from)}>
                <NeoMessage from={l.from} time={l.time}>
                  {l.text}
                </NeoMessage>
              </div>
            ))}
            {thinking && (
              <div style={enter(thinking.typeStart!, 'them')}>
                <NeoMessage from="them" typing />
              </div>
            )}
          </div>
          <NeoInput value={inputValue} placeholder="Escribe un mensaje…" icon="plus" style={{ width: '100%' }} />
        </NeoCard>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
