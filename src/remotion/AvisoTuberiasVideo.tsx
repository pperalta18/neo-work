import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { Fonts, BODY_FONT } from './fonts'
import { Phone3DStage, PHONE_SCREEN_PX } from './aikit/Phone3DStage'

/**
 * AvisoTuberias — un aviso de pantalla de bloqueo en el móvil 3D.
 * ──────────────────────────────────────────────────────────────────────────
 * El iPhone reposa en el estudio neumórtico claro y «despierta»: aparecen reloj
 * y fecha, y desde arriba cae una notificación del AGENTE (AiKit) con una
 * pregunta de aclaración — «¿Las tuberías son C2 o C3?» — que enlaza con la
 * escena RegistroInventario (han llegado las tuberías). Dos respuestas rápidas
 * (C2 · C3) aparecen bajo el aviso. Todo dirigido por `useCurrentFrame()` (vía
 * {@link Phone3DStage}), así que exporta a MP4 de forma determinista.
 */

const FPS = 30
export const AVISO_TUBERIAS_DURATION = 252 // ~8.4 s

const STUDIO_BG = '#eef0f5'
const DISPLAY_FONT = "'Universal Sans Display', ui-sans-serif, system-ui, sans-serif"

// — Beats (frames) —
const WAKE_IN = 10 // reloj/fecha encienden
const NOTIF_AT = 62 // cae el aviso
const Q_AT = 76 // la pregunta
const SUB_AT = 88 // la línea de contexto
const CHIP_C2_AT = 104
const CHIP_C3_AT = 114

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function AvisoTuberiasVideo() {
  const frame = useCurrentFrame()
  const { width, height, fps } = useVideoConfig()

  // El móvil sube al entrar, luego un push-in lentísimo durante el hold.
  const rise = interpolate(frame, [0, 26], [0, 1], { extrapolateRight: 'clamp', easing: easeOutCubic })
  const posY = (1 - rise) * -1.7
  const zoomIn = interpolate(frame, [0, 26], [0.965, 1], { extrapolateRight: 'clamp', easing: easeOutCubic })
  const push = interpolate(frame, [26, AVISO_TUBERIAS_DURATION], [0, 0.045], { extrapolateLeft: 'clamp' })
  const zoom = zoomIn + push

  // Balanceo continuo y suave (3/4 de cara), anclado al frame.
  const baseX = -0.085
  const baseY = -0.3
  const swayY = Math.sin(frame / 96) * 0.05
  const swayX = Math.sin(frame / 132) * 0.02
  const rotation: [number, number] = [baseX + swayX, baseY + swayY]

  const sceneIn = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ backgroundColor: STUDIO_BG, fontFamily: BODY_FONT }}>
      <Fonts />
      {/* Viñeta suave del estudio para dar profundidad al fondo claro. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(120% 90% at 50% 38%, rgba(255,255,255,0.9) 0%, rgba(225,230,238,0.55) 55%, rgba(205,212,224,0.85) 100%)',
        }}
      />
      <AbsoluteFill style={{ opacity: sceneIn }}>
        <Phone3DStage
          width={width}
          height={height}
          rotation={rotation}
          zoom={zoom}
          posY={posY}
          cameraZ={37}
          screenBackground="#05070b"
          screen={<LockScreen frame={frame} fps={fps} />}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ── Lock screen UI (designed at PHONE_SCREEN_PX wide, fills the glass height) ──

function LockScreen({ frame, fps }: { frame: number; fps: number }) {
  const wake = interpolate(frame, [WAKE_IN, WAKE_IN + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // El aviso cae con muelle; un breve destello «enciende» la pantalla al llegar.
  const notif = spring({ frame: frame - NOTIF_AT, fps, config: { damping: 200, mass: 0.7 } })
  const notifFlash = interpolate(frame, [NOTIF_AT, NOTIF_AT + 6, NOTIF_AT + 22], [0, 0.16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        padding: `62px ${22}px 26px`,
        color: '#f5f7fb',
        // Fondo de bloqueo: base profunda + glow azul AiKit tras el reloj + textura.
        backgroundColor: '#05070b',
        backgroundImage: [
          'radial-gradient(120% 60% at 50% 8%, rgba(0,112,249,0.20) 0%, rgba(0,112,249,0) 52%)',
          'radial-gradient(90% 70% at 50% 120%, rgba(20,179,207,0.10) 0%, rgba(20,179,207,0) 60%)',
          'repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 30px)',
          'repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 30px)',
          'linear-gradient(180deg, #0a0e15 0%, #05070b 70%)',
        ].join(','),
      }}
    >
      <StatusBar />

      {/* Reloj + fecha */}
      <div style={{ textAlign: 'center', marginTop: 6, opacity: wake, transform: `translateY(${(1 - wake) * 6}px)` }}>
        <LockGlyph />
        <div style={{ fontSize: 14, color: 'rgba(225,232,245,0.62)', marginTop: 12, fontWeight: 550 }}>
          lunes, 15 de junio
        </div>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 250,
            fontSize: 96,
            lineHeight: 1,
            letterSpacing: '-2px',
            marginTop: 2,
            color: '#fbfcfe',
            textShadow: '0 2px 30px rgba(0,112,249,0.25)',
          }}
        >
          9:41
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 8 }} />

      {/* Aviso del agente */}
      <div
        style={{
          opacity: notif,
          transform: `translateY(${(1 - notif) * -34}px) scale(${0.96 + 0.04 * notif})`,
          transformOrigin: 'center top',
          position: 'relative',
        }}
      >
        {/* Destello de «pantalla encendida» al llegar el aviso. */}
        <div
          style={{
            position: 'absolute',
            inset: '-40px -30px',
            background: 'radial-gradient(60% 60% at 50% 40%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 70%)',
            opacity: notifFlash,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            borderRadius: 24,
            padding: '14px 15px 16px',
            background: 'rgba(24,28,37,0.62)',
            backdropFilter: 'blur(18px) saturate(140%)',
            WebkitBackdropFilter: 'blur(18px) saturate(140%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 18px 40px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AgenteIcon size={30} />
            <span style={{ fontSize: 14.5, fontWeight: 650, color: '#eef2f8', letterSpacing: '0.1px' }}>IA</span>
            <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'rgba(220,228,240,0.5)' }}>ahora</span>
          </div>

          <RevealLine show={frame >= Q_AT} fps={fps} since={Q_AT} frame={frame}>
            <div style={{ fontSize: 17.5, fontWeight: 600, lineHeight: 1.25, marginTop: 11, color: '#fafbfe' }}>
              ¿Las tuberías son C2 o C3?
            </div>
          </RevealLine>

          <RevealLine show={frame >= SUB_AT} fps={fps} since={SUB_AT} frame={frame}>
            <div style={{ fontSize: 13.5, lineHeight: 1.35, marginTop: 5, color: 'rgba(226,233,245,0.62)' }}>
              Lo necesito para clasificar el albarán y registrarlas en el inventario.
            </div>
          </RevealLine>
        </div>

        {/* Respuestas rápidas: las dos opciones de la pregunta. */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <ReplyChip label="C2" frame={frame} fps={fps} since={CHIP_C2_AT} />
          <ReplyChip label="C3" frame={frame} fps={fps} since={CHIP_C3_AT} />
        </div>
      </div>

      {/* Pie: hint + barra de inicio */}
      <div style={{ marginTop: 18, textAlign: 'center', opacity: wake }}>
        <div style={{ fontSize: 12, color: 'rgba(220,228,240,0.45)', marginBottom: 14 }}>desliza para responder</div>
        <div
          style={{
            width: 116,
            height: 5,
            borderRadius: 999,
            background: 'rgba(245,247,251,0.85)',
            margin: '0 auto',
          }}
        />
      </div>
    </div>
  )
}

/** Líneas del aviso que aparecen con un pequeño desliz hacia arriba. */
function RevealLine({
  children,
  show,
  since,
  fps,
  frame,
}: {
  children: React.ReactNode
  show: boolean
  since: number
  fps: number
  frame: number
}) {
  const s = show ? spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.5 } }) : 0
  return (
    <div style={{ opacity: s, transform: `translateY(${(1 - s) * 6}px)` }}>{children}</div>
  )
}

/** Pastilla de respuesta rápida (C2 / C3), aparece con muelle. */
function ReplyChip({ label, frame, fps, since }: { label: string; frame: number; fps: number; since: number }) {
  const s = frame >= since ? spring({ frame: frame - since, fps, config: { damping: 180, mass: 0.6 } }) : 0
  return (
    <div
      style={{
        flex: 1,
        opacity: s,
        transform: `translateY(${(1 - s) * 8}px) scale(${0.92 + 0.08 * s})`,
        textAlign: 'center',
        padding: '11px 0',
        borderRadius: 16,
        fontSize: 15.5,
        fontWeight: 600,
        letterSpacing: '0.3px',
        color: '#eaf0f8',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.14)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {label}
    </div>
  )
}

/** Barra de estado mínima: señal · 5G · batería (arriba a la derecha). */
function StatusBar() {
  return (
    <div style={{ position: 'absolute', top: 22, right: 24, display: 'flex', alignItems: 'center', gap: 7 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
        {[5, 8, 11, 14].map((h, i) => (
          <div key={i} style={{ width: 3, height: h, borderRadius: 1, background: 'rgba(245,247,251,0.92)' }} />
        ))}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(245,247,251,0.92)' }}>5G</span>
      <div
        style={{
          width: 24,
          height: 12,
          borderRadius: 3,
          border: '1.4px solid rgba(245,247,251,0.85)',
          padding: 1.4,
          position: 'relative',
          display: 'flex',
        }}
      >
        <div style={{ flex: 1, borderRadius: 1, background: 'rgba(245,247,251,0.92)' }} />
        <div
          style={{
            position: 'absolute',
            right: -3,
            top: 3,
            width: 2,
            height: 5,
            borderRadius: 1,
            background: 'rgba(245,247,251,0.85)',
          }}
        />
      </div>
    </div>
  )
}

/** Candado fino centrado sobre el reloj. */
function LockGlyph() {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none" style={{ display: 'block', margin: '0 auto', opacity: 0.85 }}>
      <rect x="3" y="11" width="16" height="13" rx="3.5" fill="rgba(245,247,251,0.92)" />
      <path d="M6.5 11V8a4.5 4.5 0 0 1 9 0v3" stroke="rgba(245,247,251,0.92)" strokeWidth="2" fill="none" />
    </svg>
  )
}

/** Icono del agente: cuadrado azul con un punto blanco (sin logo). */
function AgenteIcon({ size = 30 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: 'linear-gradient(150deg, #2a8bff 0%, #0070f9 60%, #0a5fd6 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(0,90,210,0.5), inset 0 1px 0 rgba(255,255,255,0.3)',
        flex: '0 0 auto',
      }}
    >
      <div style={{ width: size * 0.3, height: size * 0.3, borderRadius: '50%', background: '#ffffff' }} />
    </div>
  )
}
