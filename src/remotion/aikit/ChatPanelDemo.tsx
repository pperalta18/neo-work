import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { ChatPanel } from './ChatPanel'
import { type ChatLine, chatDuration } from './chatScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for ChatPanel; not part of the event deck. */
const SCRIPT: ChatLine[] = [
  { from: 'them', text: `Hola ${CAST.owner} 👋 ¿En qué te ayudo hoy?`, time: '8:02', showAt: 8 },
  {
    from: 'me',
    text: `Prepara el presupuesto para ${CAST.clientCompany}.`,
    time: '8:02',
    typeStart: 28,
    showAt: 110,
  },
  {
    from: 'them',
    text: 'Hecho. He seguido el procedimiento de siempre: 50 pasos, 40 segundos. ¿Lo envío?',
    time: '8:03',
    typeStart: 126,
    showAt: 190,
  },
]

export const CHAT_PANEL_DEMO_DURATION = chatDuration(SCRIPT)

export function ChatPanelDemo() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: lightTheme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BODY_FONT,
      }}
    >
      <Fonts />
      <ChatPanel script={SCRIPT} subtitle={CAST.company} />
    </AbsoluteFill>
  )
}
