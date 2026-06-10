/**
 * EcommerceChatScene — el beat de PERSONALIZACIÓN (Feedback Loop).
 * ──────────────────────────────────────────────────────────────────────────
 * "AiKit importa el inventario y te hace preguntas para definir y personalizar
 * tu tienda". Ya con el catálogo dentro, el módulo **Feedback Loop** pregunta lo
 * justo para configurar la tienda — basta el nombre — y tú respondes por chat,
 * sin menús ni formularios. En cuanto lo das ("AURELE"), confirma y pasa a montar
 * la tienda en el acto siguiente.
 *
 * Es uno de los dos únicos chats que quedan en la landing (junto al de Support):
 * plantilla NeoMessage + NeoInput dentro de un NeoCard con header de marca del
 * módulo. Todo derivado de `useCurrentFrame()`: la línea del usuario se "teclea"
 * en el input y las líneas de la IA aparecen con `spring`.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { lightTheme, KIT_BLUE, elevation } from '@/lib/neumorphism'
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
  /** Frame the bubble commits to the thread. */
  showAt: number
  /** Animate the lead-up: 'me' is typed into the input; 'them' shows "typing…". */
  typeStart?: number
}

// Feedback Loop pregunta; el usuario define su tienda por chat.
const SCRIPT: Line[] = [
  { from: 'them', text: 'Tu inventario ya está dentro. ¿Cómo se llama tu tienda?', time: '9:41', showAt: 10 },
  { from: 'me', text: 'AURELE', time: '9:41', typeStart: 20, showAt: 58 },
  { from: 'them', text: '¡Magnífico! Empezamos 🚀', time: '9:41', typeStart: 66, showAt: 86 },
]

export const ECOMMERCE_CHAT_DURATION = 136 // last showAt + tail de lectura

export function EcommerceChatScene() {
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
              <img src={MODULES.feedbackLoop.icon} alt="Feedback Loop" width={28} height={28} style={{ display: 'block' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: lightTheme.textStrong }}>
                Feedback Loop
              </span>
              <span style={{ fontSize: 12.5, color: lightTheme.textMuted, letterSpacing: -0.2 }}>
                personaliza tu tienda
              </span>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 12,
                fontWeight: 600,
                color: KIT_BLUE,
                background: `${KIT_BLUE}14`,
                borderRadius: 999,
                padding: '5px 12px',
              }}
            >
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
