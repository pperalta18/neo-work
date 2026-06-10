/**
 * MessageStormScene — acto 1 de la mini-película Atención al Cliente (el problema).
 * ──────────────────────────────────────────────────────────────────────────
 * "Las consultas llegan por TODOS lados y se pierden". Una LLUVIA de mensajes de
 * cada canal cae desde arriba y se AMONTONA, desordenada, en la parte baja.
 * En primer plano, UNA SOLA notificación push genérica (estilo lock screen
 * iOS/Android) con badge rojo cuyo contador crece con el frame, comunicando
 * el desbordamiento de forma simple y directa.
 *
 * Todo derivado de `useCurrentFrame()` (azar por hash determinista, sin
 * `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion'
import { elevation, lightTheme, BRAND, TEXT_FONT, DISPLAY_FONT, type BrandColor } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const MSG_START = 6
const MSG_STEP = 5 // chorro continuo de mensajes (lluvia de fondo)
const MSG_FALL = 28 // lo que tarda en caer y asentarse
const MSG_COUNT = 16
const HOLD = 36 // cola ampliada para asimilar el desbordamiento + contador

// Notificación push genérica: aparece en primer plano
const NOTIF_START = 8  // frame en que aparece la notificación
const NOTIF_RISE = 18  // duración de la animación de entrada

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
/** Caída con rebote suave al asentar (ease-out con micro-overshoot). */
function settle(x: number): number {
  const t = clamp01(x)
  return 1 - Math.pow(1 - t, 2.4)
}

function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const LAST_LAND = MSG_START + (MSG_COUNT - 1) * MSG_STEP + MSG_FALL
export const MESSAGE_STORM_DURATION = Math.ceil(LAST_LAND + HOLD)

type Channel = { icon: IconName; color: BrandColor }
const CHANNELS: Channel[] = [
  { icon: 'whatsapp', color: 'green' },
  { icon: 'email', color: 'blue' },
  { icon: 'chat', color: 'violet' },
  { icon: 'phone', color: 'orange' },
  { icon: 'instagram', color: 'pink' },
]

const PREVIEWS = [
  '¿Hacéis envíos a Canarias?',
  'No me llega la factura…',
  '¿Esto lo hace un robot? 👀',
  'Llamada perdida · 2 min',
  '¿Tenéis la talla M?',
  '¿Dónde está mi pedido??',
  'Quiero devolver un artículo',
  '¿Sigue abierto el chat?',
  '¿Me ayudáis con el pago?',
  'Lleváis 3 h sin responder…',
]

const CARD_W = 290
const CARD_H = 62

// Ancho de la tarjeta de notificación push genérica
const NOTIF_W = 340

/** Una burbuja-mensaje que cae y se asienta en el montón (lluvia de fondo). */
function MessageCard({ i, frame, W, H }: { i: number; frame: number; W: number; H: number }) {
  const spawn = MSG_START + i * MSG_STEP
  if (frame < spawn - 0.001) return null
  const p = settle(clamp01((frame - spawn) / MSG_FALL))

  const ch = CHANNELS[i % CHANNELS.length]
  // Montón en 3 columnas que crece hacia arriba (desborda), con jitter + rotación.
  const col = i % 3
  const row = Math.floor(i / 3)
  const colX = [W * 0.34, W * 0.5, W * 0.66][col]
  const restX = colX + (rnd(i, 1) - 0.5) * 90
  const restY = H * 0.82 - row * 58 - rnd(i, 2) * 12
  const restRot = (rnd(i, 3) - 0.5) * 12

  const startX = restX + (rnd(i, 4) - 0.5) * 120
  const startY = -CARD_H - rnd(i, 5) * 160
  const startRot = (rnd(i, 6) - 0.5) * 40

  const x = lerp(startX, restX, p)
  const y = lerp(startY, restY, smoother(p))
  const rot = lerp(startRot, restRot, p)
  // Ligeramente atenuadas para no competir con la notificación en primer plano,
  // pero bien visibles (la lluvia de mensajes es el corazón de la escena).
  const opacity = clamp01(p / 0.1) * 0.9

  const accent = BRAND[ch.color]
  const plate = elevation(theme, { depth: 'raised', distance: 6, blur: 15, radius: 16 })
  const unanswered = rnd(i, 7) > 0.45

  return (
    <div
      style={{
        position: 'absolute',
        left: x - CARD_W / 2,
        top: y - CARD_H / 2,
        width: CARD_W,
        transform: `rotate(${rot}deg)`,
        opacity,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '11px 14px',
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          borderRadius: 10,
          display: 'grid',
          placeItems: 'center',
          color: accent,
          background: `${accent}1f`,
        }}
      >
        <Icon name={ch.icon} size={18} color={accent} strokeWidth={1.9} />
      </div>
      <span
        style={{
          flex: 1,
          fontSize: 13.5,
          color: theme.textStrong,
          letterSpacing: -0.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {PREVIEWS[i % PREVIEWS.length]}
      </span>
      {unanswered && <span style={{ flexShrink: 0, width: 9, height: 9, borderRadius: 999, background: BRAND.red }} />}
    </div>
  )
}

/**
 * Notificación push genérica estilo lock screen iOS/Android.
 * Entra deslizando desde arriba. El badge rojo sobre el icono muestra el
 * contador animado `count` que crece con el frame.
 */
function PushNotification({
  frame,
  centerX,
  baseY,
  count,
}: {
  frame: number
  centerX: number
  baseY: number
  count: number
}) {
  if (frame < NOTIF_START - 0.001) return null
  const p = smoother(clamp01((frame - NOTIF_START) / NOTIF_RISE))

  const opacity = clamp01(p / 0.12)
  const translateY = lerp(-28, 0, p)

  const accent = BRAND.violet
  const plate = elevation(theme, { depth: 'raised', distance: 10, blur: 24, radius: 20 })

  return (
    <div
      style={{
        position: 'absolute',
        left: centerX - NOTIF_W / 2,
        top: baseY,
        width: NOTIF_W,
        opacity,
        transform: `translateY(${translateY}px)`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 16px',
        background: `${theme.surface}f0`,
        backdropFilter: 'blur(16px)',
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      {/* Icono genérico con badge de contador animado */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            display: 'grid',
            placeItems: 'center',
            background: `${accent}20`,
            border: `1.5px solid ${accent}40`,
          }}
        >
          <Icon name="chat" size={20} color={accent} strokeWidth={1.9} />
        </div>
        <div
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            minWidth: 20,
            height: 20,
            borderRadius: 999,
            background: BRAND.red,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 5px',
            fontFamily: DISPLAY_FONT,
            fontSize: 11,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: -0.2,
          }}
        >
          {count}
        </div>
      </div>

      {/* Contenido de la notificación */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 6,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: theme.textStrong,
              letterSpacing: -0.2,
            }}
          >
            Mensajes
          </span>
          <span
            style={{
              fontSize: 11,
              color: theme.textMuted,
              letterSpacing: -0.1,
              flexShrink: 0,
            }}
          >
            ahora
          </span>
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: theme.textStrong,
            letterSpacing: -0.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            fontWeight: 600,
          }}
        >
          {count} mensajes sin responder
        </div>
      </div>
    </div>
  )
}

export function MessageStormScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const count = Math.round(interpolate(frame, [10, LAST_LAND], [4, 47], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))

  // Centro horizontal de la pila de notificaciones (lado izquierdo del canvas)
  const notifCenterX = W * 0.5
  // Posición vertical base de la pila (bajada para acercarla al montón de mensajes)
  const notifBaseY = H * 0.34

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {/* lluvia de mensajes que se amontona en el fondo (atenuada al 50%) */}
        {Array.from({ length: MSG_COUNT }).map((_, i) => (
          <MessageCard key={i} i={i} frame={frame} W={W} H={H} />
        ))}

        {/* notificación push genérica en primer plano con contador animado */}
        <PushNotification
          frame={frame}
          centerX={notifCenterX}
          baseY={notifBaseY}
          count={count}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
