/**
 * EventoMarketingVideo — «Evento · Marketing» (1920×1080 · 30 fps).
 * ──────────────────────────────────────────────────────────────────────────
 * Two acts, one cut:
 *
 *   ACT A — the AI prepares the event's marketing as a process over the flat
 *   neumorphic grid (StoreFlow look: a pathfinding route whose elevated plates
 *   emerge step by step while a virtual camera pans plate-to-plate). The chain
 *   ends on the **Google Calendar** plate — «Consultando timeline de montaje» —
 *   the AI checking the build timeline to schedule the campaign.
 *
 *   ACT B — that consultation surfaces a problem, so the scene dissolves into a
 *   conversation (the Conversation-scene look: neumorphic chat card) where the
 *   AI proactively asks the user **why the assembly day falls before the graphic
 *   material arrives**. A short, calm exchange resolves it — the "con IA" beat.
 *
 * Frame-driven throughout. Act A reuses StoreFlow's `FlowPlate` / `FlowNode`
 * renderers and the camera math from {@link eventoMarketingScript}; Act B reuses
 * the neumorphic chat components. A single crossfade hands act A → act B.
 */
import { useState, useEffect, type CSSProperties } from 'react'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  spring,
  interpolate,
  continueRender,
  delayRender,
} from 'remotion'
import { CELL, lightTheme } from '@/lib/neumorphism'
import { FlowPlate, theme } from './storeFlowScene'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { NeoMessage } from '@/stories/neo/NeoMessage'
import { NeoInput } from '@/stories/neo/NeoInput'
import { NeoCard } from '@/stories/neo/widgets/NeoCard'
import { Fonts, BODY_FONT } from './fonts'
import {
  ROUTE,
  ARROWS,
  CAL_INDEX,
  ACT_A_DURATION,
  clamp01,
  flowCameraPZ,
  flowReveal,
} from './eventoMarketingScript'

const CAL_LOGO = 'evento/google-calendar.svg'
/** Full-bleed gridlines plane (px). −half is a CELL multiple → cell lines land on
 *  the grid origin and the hairlines bleed off-screen at every camera position. */
const GRID_PLANE = 12800

// ── Act A → Act B handoff ─────────────────────────────────────────────────────
const XFADE = 26 // crossfade frames from the grid route into the chat

// ── Act B — the conversation (the AI flags the logistics inconsistency) ─────────
type Line = {
  from: 'me' | 'them'
  text: string
  time: string
  showAt: number
  typeStart?: number
}

// The AI is preparing the campaign calendar, cross-checks the build timeline with
// the logistics, and proactively raises the contradiction: the montaje (assembly)
// is scheduled before the graphic material (lonas y vinilos) even arrives. The
// user owns the call; the AI executes the fix. Times are local to Act B.
const CONV: Line[] = [
  { from: 'them', text: 'Estoy montando el calendario de la campaña del evento.', time: '9:41', typeStart: 26, showAt: 70 },
  { from: 'them', text: 'He cruzado el timeline de montaje con la logística y hay algo que no cuadra.', time: '9:41', typeStart: 82, showAt: 162 },
  { from: 'them', text: 'El montaje es el 16 de junio, pero las lonas y los vinilos llegan el 17.', time: '9:41', typeStart: 174, showAt: 262 },
  { from: 'them', text: '¿Por qué el montaje va antes que el material?', time: '9:41', typeStart: 274, showAt: 332 },
  { from: 'me', text: 'Cierto… se nos ha colado. El material tiene que estar antes del montaje.', time: '9:42', typeStart: 344, showAt: 470 },
  { from: 'them', text: 'Adelanto la entrega del proveedor al día 15 y aviso al equipo de montaje. ¿Lo confirmo?', time: '9:42', typeStart: 482, showAt: 588 },
  { from: 'me', text: 'Confírmalo.', time: '9:42', typeStart: 600, showAt: 666 },
  { from: 'them', text: 'Hecho. Montaje el 16 con el material ya en sala.', time: '9:42', typeStart: 678, showAt: 770 },
]

const CONV_TAIL = 96 // calm hold on the resolved thread
const CONV_DURATION = 770 + CONV_TAIL

export const EVENTO_MARKETING_DURATION = ACT_A_DURATION + CONV_DURATION

export function EventoMarketingVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  usePreload()

  const gridOut = interpolate(frame, [ACT_A_DURATION, ACT_A_DURATION + XFADE], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const chatIn = interpolate(frame, [ACT_A_DURATION, ACT_A_DURATION + XFADE], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      {gridOut > 0.001 ? (
        <AbsoluteFill style={{ overflow: 'hidden', opacity: gridOut }}>
          <MarketingGrid frame={frame} W={W} H={H} />
        </AbsoluteFill>
      ) : null}
      {chatIn > 0.001 ? (
        <AbsoluteFill style={{ opacity: chatIn }}>
          <ConversationAct frame={frame - ACT_A_DURATION} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  )
}

// ── Act A — the route on the grid ──────────────────────────────────────────────

function MarketingGrid({ frame, W, H }: { frame: number; W: number; H: number }) {
  const { P, Z } = flowCameraPZ(frame)
  const tx = W / 2 - P[0] * Z
  const ty = H / 2 - P[1] * Z
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${tx}px, ${ty}px) scale(${Z})`,
  }

  const reveal = flowReveal(frame)

  return (
    <div style={camera}>
      {/* Full-bleed hairline grid: a large plane aligned to the grid origin (no
          tray, no elevation, no frame) so the lines fill the screen and bleed off
          every edge as the camera pans. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: -GRID_PLANE / 2,
          top: -GRID_PLANE / 2,
          width: GRID_PLANE,
          height: GRID_PLANE,
          backgroundImage: `linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)`,
          backgroundSize: `${CELL}px ${CELL}px`,
        }}
      />
      {ROUTE.map((step, i) => (
        <FlowPlate
          key={i}
          step={step}
          dir={ARROWS[i]}
          grow={clamp01(reveal - i)}
          iconNode={i === CAL_INDEX ? <CalendarLogo /> : undefined}
        />
      ))}
    </div>
  )
}

/** The real Google Calendar brand mark (official 2020 multicolour SVG). */
function CalendarLogo() {
  return (
    <img
      src={staticFile(CAL_LOGO)}
      alt="Google Calendar"
      width={46}
      height={46}
      style={{ display: 'block', flexShrink: 0 }}
    />
  )
}

// ── Act B — the conversation ───────────────────────────────────────────────────

function ConversationAct({ frame }: { frame: number }) {
  const { fps } = useVideoConfig()

  const enter = (since: number, from: 'me' | 'them'): CSSProperties => {
    const s = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.6 } })
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: from === 'me' ? 'flex-end' : 'flex-start',
      opacity: s,
      transform: `translateY(${(1 - s) * 14}px) scale(${0.97 + 0.03 * s})`,
    }
  }

  const shown = CONV.filter((l) => frame >= l.showAt)

  const thinking = CONV.find(
    (l) => l.from === 'them' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  )

  const composing = CONV.find(
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
        <NeoCard width={580} padding={28} radius={40} center={false} style={{ height: 760, justifyContent: 'flex-end', gap: 0 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              justifyContent: 'flex-end',
              flex: 1,
              minHeight: 0,
              paddingBottom: 22,
              overflow: 'hidden',
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
                <NeoMessage from="them" typing typingFrame={frame} />
              </div>
            )}
          </div>
          <NeoInput value={inputValue} placeholder="Escribe un mensaje…" icon="plus" multiline style={{ width: '100%' }} />
        </NeoCard>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}

// ── preload: warm the calendar logo so frame 0 is complete ──────────────────────

function usePreload() {
  const [handle] = useState(() => delayRender('Preload calendar logo', { timeoutInMilliseconds: 12000 }))
  useEffect(() => {
    const img = new Image()
    img.onload = () => continueRender(handle)
    img.onerror = () => continueRender(handle)
    img.src = staticFile(CAL_LOGO)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
