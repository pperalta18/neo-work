/**
 * ChannelsConnectScene — acto 2 de la mini-película Atención al Cliente.
 * ──────────────────────────────────────────────────────────────────────────
 * "Conecta todos tus canales en una sola bandeja". Los canales dispersos
 * (WhatsApp, email, chat, teléfono, Instagram) se ENCHUFAN uno a uno a un hub
 * **Hotpot** —cada cable se enciende con un pulso azul y el canal queda "online"—
 * y a la derecha emerge la BANDEJA ÚNICA (`InboxWidget`), ya ordenada: el caos
 * de la lluvia anterior, recogido.
 *
 * A propósito DISTINTO de los otros actos de "captura" (hoja absorbida en
 * E-Commerce, partículas que convergen en Email): aquí el gesto es CONECTAR
 * (cables que se encienden). Todo derivado de `useCurrentFrame()`.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, BRAND, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { InboxWidget } from '@/stories/neo/widgets/InboxWidget'
import { Icon, type IconName } from '@/components/icons'
import { OperatingModuleTile } from './OperatingModuleTile'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const CONNECT_START = 16
const CONNECT_STEP = 11
const DRAW = 14 // lo que tarda en encenderse un cable
const HOLD = 36 // cola ampliada para leer "Bandeja única" ya estabilizada

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

type Channel = { name: string; icon: IconName; color: BrandColor }
const CHANNELS: Channel[] = [
  { name: 'WhatsApp', icon: 'whatsapp', color: 'green' },
  { name: 'Email', icon: 'email', color: 'blue' },
  { name: 'Chat web', icon: 'chat', color: 'violet' },
  { name: 'Teléfono', icon: 'phone', color: 'orange' },
  { name: 'Instagram', icon: 'instagram', color: 'pink' },
]

const INBOX_AT = CONNECT_START + CHANNELS.length * CONNECT_STEP + 4
export const CHANNELS_CONNECT_DURATION = Math.ceil(INBOX_AT + 30 + HOLD)

/** Punto en una bézier cuadrática (para curvar el cable y mover el pulso). */
function bezier(sx: number, sy: number, cxp: number, cyp: number, tx: number, ty: number, t: number): [number, number] {
  const q = 1 - t
  return [q * q * sx + 2 * q * t * cxp + t * t * tx, q * q * sy + 2 * q * t * cyp + t * t * ty]
}

export function ChannelsConnectScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H, fps } = useVideoConfig()

  const hubX = W * 0.34
  const hubY = H * 0.5

  const hubRise = spring({ frame: frame - 2, fps, config: { damping: 200, mass: 0.7 } })
  // La placa se abre revelando su estado en cuanto el primer canal queda enchufado.
  const tileOpen = spring({ frame: frame - (CONNECT_START + DRAW + 2), fps, config: { damping: 200, mass: 0.8 } })

  // posiciones de los canales (arco a la izquierda del hub)
  const chPos = CHANNELS.map((_, i) => {
    const t = CHANNELS.length === 1 ? 0.5 : i / (CHANNELS.length - 1)
    const y = lerp(H * 0.2, H * 0.8, t)
    const x = W * 0.13 + Math.sin((t - 0.5) * Math.PI) * 34
    return [x, y] as [number, number]
  })

  const inboxX = W * 0.72
  const inboxRise = spring({ frame: frame - INBOX_AT, fps, config: { damping: 200, mass: 0.8 } })

  return (
    <NeoThemeProvider theme={theme}>
      <AbsoluteFill style={{ backgroundColor: theme.surface }}>
        <Fonts />
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          {/* cables canal → hub, y hub → bandeja */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
            {CHANNELS.map((_ch, i) => {
              const [sx, sy] = chPos[i]
              const cxp = (sx + hubX) / 2
              const cyp = (sy + hubY) / 2 + (sy - hubY) * 0.12
              const at = CONNECT_START + i * CONNECT_STEP
              const p = clamp01((frame - at) / DRAW)
              if (p <= 0) return null
              const lit = p >= 1
              return (
                <path
                  key={i}
                  d={`M ${sx} ${sy} Q ${cxp} ${cyp} ${hubX} ${hubY}`}
                  fill="none"
                  stroke={lit ? KIT_BLUE : `${KIT_BLUE}77`}
                  strokeWidth={lit ? 2.4 : 2}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  opacity={0.85}
                />
              )
            })}
            {/* cable hub → bandeja (se enciende al final) */}
            {(() => {
              const p = clamp01((frame - (INBOX_AT - 4)) / DRAW)
              if (p <= 0) return null
              return (
                <path
                  d={`M ${hubX} ${hubY} L ${inboxX - 210} ${hubY}`}
                  fill="none"
                  stroke={KIT_BLUE}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                />
              )
            })()}
            {/* pulsos viajando por cada cable mientras se enciende */}
            {CHANNELS.map((ch, i) => {
              const [sx, sy] = chPos[i]
              const cxp = (sx + hubX) / 2
              const cyp = (sy + hubY) / 2 + (sy - hubY) * 0.12
              const at = CONNECT_START + i * CONNECT_STEP
              const p = (frame - at) / DRAW
              if (p < 0 || p > 1) return null
              const [px, py] = bezier(sx, sy, cxp, cyp, hubX, hubY, smoother(p))
              return <circle key={`p${i}`} cx={px} cy={py} r={5} fill={BRAND[ch.color]} />
            })}
          </svg>

          {/* canales */}
          {CHANNELS.map((ch, i) => {
            const [x, y] = chPos[i]
            const on = frame >= CONNECT_START + i * CONNECT_STEP + DRAW
            return <ChannelChip key={ch.name} ch={ch} x={x} y={y} on={on} appear={clamp01((frame - i * 3) / 12)} />
          })}

          {/* hub Hotpot — módulo "en funcionamiento": placa neumórfica que se abre
              con su estado (sustituye al antiguo núcleo circular con glow azul). */}
          <div
            style={{
              position: 'absolute',
              left: hubX,
              top: hubY,
              transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * hubRise})`,
              opacity: hubRise,
            }}
          >
            <OperatingModuleTile
              module="hotpot"
              status="Conectando canales"
              frame={frame}
              expand={tileOpen}
              size={140}
            />
          </div>

          {/* bandeja única */}
          <div
            style={{
              position: 'absolute',
              left: inboxX - 210,
              top: hubY,
              transform: `translateY(-50%) translateY(${(1 - inboxRise) * 20}px)`,
              opacity: inboxRise,
            }}
          >
            <InboxWidget title="Bandeja única" />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}

/** Un canal que se enciende cuando queda conectado al hub. */
function ChannelChip({ ch, x, y, on, appear }: { ch: Channel; x: number; y: number; on: boolean; appear: number }) {
  const plate = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 14 })
  const accent = BRAND[ch.color]
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - appear) * 10}px)`,
        opacity: appear,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 15px',
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div style={{ width: 32, height: 32, borderRadius: 9, display: 'grid', placeItems: 'center', color: accent, background: `${accent}1f` }}>
        <Icon name={ch.icon} size={17} color={accent} strokeWidth={1.9} />
      </div>
      <span style={{ fontSize: 14.5, fontWeight: 600, letterSpacing: -0.2, color: theme.textStrong }}>{ch.name}</span>
      <span style={{ marginLeft: 6, display: 'inline-flex', opacity: on ? 1 : 0.25, transition: undefined }}>
        {on ? (
          <Icon name="check" size={17} color={BRAND.green} strokeWidth={2.2} />
        ) : (
          <span style={{ width: 8, height: 8, borderRadius: 999, background: theme.gridLine }} />
        )}
      </span>
    </div>
  )
}
