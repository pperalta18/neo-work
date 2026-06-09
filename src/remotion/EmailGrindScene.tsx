/**
 * EmailGrindScene — acto 1 de la mini-película Email Marketing (el problema).
 * ──────────────────────────────────────────────────────────────────────────
 * "Quieres hacer email marketing pero no tienes tiempo, y saltas entre mil
 * herramientas caras". En primer plano, un COMPOSITOR de correo ATASCADO: el
 * asunto se teclea y se borra (indecisión), el "Para" sigue sin segmentar y el
 * botón Enviar está apagado. Detrás, una PILA de ventanas de herramientas
 * (Mailchimp, HubSpot, Klaviyo, Brevo…) que se amontona — las tienes todas
 * abiertas y el correo sigue sin salir. Arriba, el tiempo perdido que sube.
 *
 * A propósito DISTINTO del enjambre radial de E-Commerce (`ChaosScene`): aquí el
 * caos son ventanas rectangulares apiladas + un borrador que no avanza. Todo
 * derivado de `useCurrentFrame()` (sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, BRAND, TEXT_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const TOOL_START = 14 // primera ventana de herramienta
const TOOL_STEP = 9 // cada cuánto cae otra
const TYPE_BEGIN = 20 // el cursor empieza a teclear el asunto

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

const TOOLS: Array<{ name: string; color: string }> = [
  { name: 'Mailchimp', color: BRAND.green },
  { name: 'HubSpot', color: BRAND.orange },
  { name: 'Klaviyo', color: BRAND.violet },
  { name: 'Brevo', color: BRAND.blue },
  { name: 'Sendinblue', color: BRAND.teal },
  { name: 'ActiveCampaign', color: BRAND.pink },
]

const COMPOSER_W = 660

export const EMAIL_GRIND_DURATION = 150

// El asunto que el usuario teclea y borra una y otra vez (indecisión).
const SUBJECTS = ['Oferta de primavera', '¿Novedades esta semana?', 'No te lo pierdas…']
const TYPE_DUR = 26
const HOLD_DUR = 14
const DEL_DUR = 16
const GAP_DUR = 8
const PER = TYPE_DUR + HOLD_DUR + DEL_DUR + GAP_DUR

function subjectAt(frame: number): string {
  if (frame < TYPE_BEGIN) return ''
  const t = frame - TYPE_BEGIN
  const s = SUBJECTS[Math.floor(t / PER) % SUBJECTS.length]
  const local = t % PER
  let n: number
  if (local < TYPE_DUR) n = Math.round((local / TYPE_DUR) * s.length)
  else if (local < TYPE_DUR + HOLD_DUR) n = s.length
  else if (local < TYPE_DUR + HOLD_DUR + DEL_DUR) n = Math.round((1 - (local - TYPE_DUR - HOLD_DUR) / DEL_DUR) * s.length)
  else n = 0
  return s.slice(0, n)
}

/** Una ventana de herramienta apilada detrás del compositor (asoma su barra). */
function ToolWindow({ tool, i, frame, fps }: { tool: { name: string; color: string }; i: number; frame: number; fps: number }) {
  const spawn = TOOL_START + i * TOOL_STEP
  const s = spring({ frame: frame - spawn, fps, config: { damping: 200, mass: 0.7 } })
  if (s <= 0.001) return null

  // Se reparten en ESCALERA diagonal detrás del compositor: cada una asoma su
  // barra de título (color + nombre) arriba-izquierda → montón de herramientas
  // abiertas, todas legibles.
  const TOOL_W = COMPOSER_W - 130
  const lift = 26 + i * 30
  const dx = -150 + i * 52
  const rot = (i - (TOOLS.length - 1) / 2) * 1.6
  const win = elevation(theme, { depth: 'raised', distance: 8, blur: 20, radius: 16 })

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        width: TOOL_W,
        height: 320,
        marginLeft: -TOOL_W / 2 + dx,
        transform: `translateY(${-lift - (1 - s) * 18}px) rotate(${rot}deg)`,
        transformOrigin: '50% 100%',
        opacity: s,
        background: theme.surface,
        zIndex: i,
        ...win,
      }}
    >
      {/* barra de título de la herramienta */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 16px',
          borderBottom: `1px solid ${theme.gridLine}`,
        }}
      >
        <span style={{ width: 11, height: 11, borderRadius: 999, background: tool.color, flexShrink: 0 }} />
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong, fontFamily: TEXT_FONT }}>
          {tool.name}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {[0, 1, 2].map((k) => (
            <span key={k} style={{ width: 7, height: 7, borderRadius: 999, background: theme.gridLine }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function EmailGrindScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H, fps } = useVideoConfig()

  const rise = spring({ frame, fps, config: { damping: 200, mass: 0.7 } })
  const composer = elevation(theme, { depth: 'raised', distance: 14, blur: 34, radius: 26 })
  const field = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 12 })

  const subject = subjectAt(frame)
  const caretOn = Math.floor(frame / 8) % 2 === 0

  // Tiempo perdido que sube (min) → "X h YY min".
  const mins = Math.round(interpolate(frame, [10, EMAIL_GRIND_DURATION], [12, 228], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const timeLabel = `${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min`

  const cx = W / 2
  const cy = H * 0.54

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {/* contador de tiempo perdido, arriba */}
        <div
          style={{
            position: 'absolute',
            top: H * 0.13,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            opacity: clamp01((frame - 6) / 12),
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 18px',
              borderRadius: 999,
              background: `${BRAND.red}14`,
              fontFamily: TEXT_FONT,
            }}
          >
            <Icon name="clock" size={18} color={BRAND.red} strokeWidth={2} />
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, color: theme.textStrong }}>
              {timeLabel} esta semana
            </span>
            <span style={{ fontSize: 14, color: theme.textMuted }}>· y sigue sin salir</span>
          </div>
        </div>

        {/* escenario: pila de herramientas detrás + compositor delante */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            transform: `translate(-50%, -50%) translateY(${(1 - rise) * 24}px)`,
            opacity: rise,
            width: COMPOSER_W,
          }}
        >
          {/* pila de herramientas (detrás) */}
          {TOOLS.map((t, i) => (
            <ToolWindow key={t.name} tool={t} i={i} frame={frame} fps={fps} />
          ))}

          {/* el compositor de correo (delante) */}
          <div
            style={{
              position: 'relative',
              zIndex: 50,
              width: COMPOSER_W,
              background: theme.surface,
              fontFamily: TEXT_FONT,
              ...composer,
            }}
          >
            {/* barra del compositor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 22px', borderBottom: `1px solid ${theme.gridLine}` }}>
              <Icon name="email" size={20} color={KIT_BLUE} strokeWidth={1.9} />
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>
                Nuevo mensaje
              </span>
            </div>

            <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Para */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 64, fontSize: 14, color: theme.textMuted }}>Para</span>
                <span style={{ fontSize: 15, color: theme.textStrong }}>1.240 contactos</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: BRAND.red,
                    background: `${BRAND.red}1f`,
                    borderRadius: 8,
                    padding: '3px 9px',
                  }}
                >
                  sin segmentar
                </span>
              </div>

              {/* Asunto (se teclea y se borra) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 64, fontSize: 14, color: theme.textMuted }}>Asunto</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '9px 14px', ...field }}>
                  <span style={{ fontSize: 15, color: theme.textStrong }}>{subject}</span>
                  <span style={{ width: 2, height: 18, marginLeft: 1, background: KIT_BLUE, opacity: caretOn ? 0.9 : 0 }} />
                </div>
              </div>

              {/* cuerpo vacío (skeleton) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
                {[0.95, 0.8, 0.88, 0.55].map((w, i) => (
                  <div key={i} style={{ height: 9, width: `${w * 100}%`, borderRadius: 5, background: theme.gridLine, opacity: 0.7 }} />
                ))}
              </div>

              {/* pie: borrador + Enviar apagado */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: theme.textMuted }}>
                  <Icon name="clock" size={14} color={theme.textMuted} strokeWidth={1.8} />
                  Borrador · sin enviar hace 3 semanas
                </span>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textMuted,
                    opacity: 0.6,
                    background: `${theme.textMuted}1f`,
                    borderRadius: 999,
                    padding: '9px 22px',
                  }}
                >
                  Enviar
                </span>
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
