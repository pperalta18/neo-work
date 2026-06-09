/**
 * EmailComposeScene — acto 4 de la mini-película Email Marketing.
 * ──────────────────────────────────────────────────────────────────────────────
 * Sustituye al antiguo chat: en vez de teclear la campaña en un chat, se ve a
 * **Smart Process** COMPONER la campaña en un terminal — segmenta la audiencia,
 * diseña la secuencia (Bienvenida → Promo → Última oportunidad), conecta el
 * contenido de Forge y programa los envíos — hasta el sello ✓ campaña compuesta.
 * Es "la IA diseñando el proceso" (lo propio de Smart Process), no un chat.
 *
 * Reutiliza la estética y el motor de impresión de {@link StoreTerminalScene} /
 * {@link CodeTerminalVideo}: misma carta oscura, mismo mecanismo determinista
 * (emittedAt → scroll + shutter-sampling con plus-lighter) y el tokenizador
 * `highlight` + paleta `COLORS` de `codeStream`. Solo cambia el **contenido** del
 * stream (composición de campaña en vez de build de web) y el sello (Smart
 * Process). Todo derivado de `useCurrentFrame()`: determinista frame a frame.
 *
 * Timeline (30 fps):
 *   0–7     hold    — comando `aikit smartprocess build campana` se teclea
 *   7–17    prime   — líneas aparecen a paso legible (llena la pantalla)
 *   17–41   accel   — ramp de velocidad; scroll + motion-blur crecen
 *   41–79   cruise  — velocidad pico (componiendo a toda pastilla)
 *   79–93   settle  — deceleración suave sobre el resumen final
 *   93–120  rest    — aparcado en ✓ campaña compuesta, cursor parpadeante
 */

import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { highlight, COLORS, type Tok } from './codeStream'
import { TEXT_FONT } from '@/lib/neumorphism'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts } from './fonts'

export const EMAIL_COMPOSE_DURATION = 152 // ~5 s @ 30 fps (cola ampliada: el sello Smart Process se completa + reposo del cursor)

// ── Terminal geometry (idéntica a StoreTerminalScene / CodeTerminalVideo) ────
const CARD_W = 1320
const CARD_H = 800
const TITLE_H = 46
const PAD_X = 26
const PAD_Y = 16
const LINE_H = 34
const FONT_SIZE = 19
const BODY_H = CARD_H - TITLE_H
const VISIBLE_H = BODY_H - PAD_Y * 2

const MONO =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace"

// ── Timeline keyframes (mismas que StoreTerminalScene) ───────────────────────
const HOLD = 7
const FILL_END = 17
const ACCEL_END = 41
const CRUISE_END = 79
const SETTLE = 93

const V0 = 0.8
const START_OFFSET = LINE_H * 2

// ── Stream "Smart Process compone la campaña" ────────────────────────────────

/** Deterministic [0,1) pseudo-random from an integer seed. */
function seeded(i: number): number {
  let x = Math.imul(i ^ 0x9e3779b9, 2654435761) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 2246822519) >>> 0
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

function fillCampaign(line: string, i: number): string {
  const int = (lo: number, hi: number, salt: number) =>
    String(lo + Math.floor(seeded(i * 17 + salt) * (hi - lo)))
  return line
    .replace(/{n}/g, () => int(180, 460, 3))
    .replace(/{pct}/g, () => int(2, 99, 6))
    .replace(/{ms}/g, () => int(4, 180, 2))
    .replace(/{ab}/g, () => int(2, 6, 4))
}

/** Plantillas de "composición" — config + log (reel corto, se ve en blur). */
const CAMPAIGN_TEMPLATES = [
  '> segmentando la audiencia…',
  "✓ segmento 'inactivos 90d' — {n} contactos",
  '',
  '// secuencia diseñada por Smart Process',
  'sequence: [',
  "  { paso: 1, email: 'Te echamos de menos', envio: 'Día 0' },",
  "  { paso: 2, email: 'Promo -20%', envio: 'Día 2', cupon: 'VUELVE20' },",
  "  { paso: 3, email: 'Última oportunidad', envio: 'Día 5' },",
  ']',
  '',
  '✓ contenido redactado con Forge ({ms}ms)',
  '⚡ {ab} variantes A/B • asunto optimizado',
  '',
  "rule: if abre === false && horas > 48 -> reenviar con nuevo asunto",
  'rule: if compra === true -> salir de la secuencia',
  'trigger: ActionScript.run({ schedule: cron, audience })',
  '',
  '> programando envíos…  {pct}%',
  '> conectando con Heartbeat para nutrir 24/7…',
  '',
]

const COMPOSE_COMMAND = 'aikit smartprocess build campana'

type StreamLine = { toks: Tok[] }
type ComposeStream = {
  lines: StreamLine[]
  command: string
  cmdIndex: number
  promptIndex: number
}

function buildComposeStream(bodyLines = 60): ComposeStream {
  const intro = [
    `$ ${COMPOSE_COMMAND}`,
    '',
    '> aikit smart-process v2.4.1 — diseñando la campaña',
    '> leyendo 1.240 contactos desde DocuSense…',
    "> objetivo: 'promo -20% a quien no compra hace 90 días'",
    '',
  ]
  const body: string[] = []
  for (let i = 0; i < bodyLines; i++) {
    body.push(fillCampaign(CAMPAIGN_TEMPLATES[i % CAMPAIGN_TEMPLATES.length], i))
  }
  const outro = [
    '',
    "✓ campaña 'Reactivación' compuesta — 3 pasos",
    '✓ segmento conectado — 412 contactos objetivo',
    '✓ lista para enviarse y nutrirse sola',
    '',
    '$ ',
    '',
    '',
    '',
    '',
  ]
  const raw = [...intro, ...body, ...outro]
  const promptIndex = raw.lastIndexOf('$ ')
  return {
    lines: raw.map((s) => ({ toks: highlight(s) })),
    command: COMPOSE_COMMAND,
    cmdIndex: 0,
    promptIndex,
  }
}

// ── Motion helpers (idénticos a StoreTerminalScene) ──────────────────────────

function emittedAt(frame: number, total: number): number {
  const Tf = FILL_END - HOLD
  const Ta = ACCEL_END - FILL_END
  const Tc = CRUISE_END - ACCEL_END
  const Ts = SETTLE - CRUISE_END
  const peak = (total - 1 - V0 * (Tf + Ta / 2)) / (Ta / 2 + Tc + Ts / 2)
  const eF = 1 + V0 * Tf
  const eA = eF + ((V0 + peak) / 2) * Ta
  const eC = eA + peak * Tc

  if (frame <= HOLD) {
    return interpolate(frame, [0, 13], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }
  if (frame <= FILL_END) return 1 + V0 * (frame - HOLD)
  if (frame <= ACCEL_END) {
    const t = frame - FILL_END
    const a = (peak - V0) / Ta
    return eF + V0 * t + 0.5 * a * t * t
  }
  if (frame <= CRUISE_END) return eA + peak * (frame - ACCEL_END)
  const t = Math.min(frame - CRUISE_END, Ts)
  const d = peak / Ts
  return eC + peak * t - 0.5 * d * t * t
}

function scrollFromEmitted(emitted: number, dEnd: number): number {
  return Math.min(dEnd, Math.max(-START_OFFSET, emitted * LINE_H - VISIBLE_H))
}

function lineLen(toks: Tok[]): number {
  let n = 0
  for (const t of toks) n += t.s.length
  return n
}

function sliceToks(toks: Tok[], n: number): Tok[] {
  const out: Tok[] = []
  let left = n
  for (const t of toks) {
    if (left <= 0) break
    if (t.s.length <= left) {
      out.push(t)
      left -= t.s.length
    } else {
      out.push({ s: t.s.slice(0, left), c: t.c })
      left = 0
    }
  }
  return out
}

// ── Sub-components (idénticos en estética a StoreTerminalScene) ───────────────

const dot = (c: string): CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: '50%',
  background: c,
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
})

function Cursor({ color, on }: { color: string; on: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: FONT_SIZE * 0.56,
        height: FONT_SIZE * 1.05,
        marginLeft: 1,
        transform: 'translateY(3px)',
        background: color,
        opacity: on ? 0.95 : 0,
        borderRadius: 1,
      }}
    />
  )
}

function TermLine({ top, toks, trailing }: { top: number; toks: Tok[]; trailing?: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: LINE_H,
        lineHeight: `${LINE_H}px`,
        whiteSpace: 'pre',
        overflow: 'hidden',
      }}
    >
      {toks.map((t, i) => (
        <span key={i} style={{ color: COLORS[t.c] }}>
          {t.s}
        </span>
      ))}
      {trailing}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function EmailComposeScene() {
  const frame = useCurrentFrame()
  const stream = useMemo(() => buildComposeStream(60), [])
  const L = stream.lines.length

  const totalH = L * LINE_H
  const dEnd = totalH - VISIBLE_H

  const emitted = emittedAt(frame, L)
  const emittedPrev = emittedAt(frame - 1, L)
  const scrollY = scrollFromEmitted(emitted, dEnd)

  const prevY = scrollFromEmitted(emittedPrev, dEnd)
  const dist = Math.abs(scrollY - prevY)
  const SAMPLES = Math.min(24, Math.max(1, Math.ceil(dist / 4)))

  const blinkOn = Math.floor(frame / 14) % 2 === 0
  const typingNow = emitted - emittedPrev > 0.02
  const caretOn = typingNow || blinkOn
  const showActiveCaret = frame <= SETTLE - 6
  const showPromptCursor = frame > SETTLE - 6
  const running = frame > HOLD && frame < SETTLE
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.5))

  // Sello Smart Process — aparece al final cuando la campaña queda compuesta.
  const sealIn = interpolate(frame, [SETTLE - 4, SETTLE + 12], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const renderWindow = (em: number): ReactNode => {
    const y = scrollFromEmitted(em, dEnd)
    const lead = Math.min(Math.floor(em), L - 1)
    const frac = em - lead
    const first = Math.max(0, Math.floor(y / LINE_H) - 1)
    const last = Math.min(lead, Math.ceil((y + VISIBLE_H) / LINE_H) + 1)
    const out: ReactNode[] = []
    for (let idx = first; idx <= last; idx++) {
      const top = idx * LINE_H - y
      const active = idx === lead && showActiveCaret

      if (idx === stream.cmdIndex) {
        const typed = active ? Math.round(frac * stream.command.length) : stream.command.length
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={[
              { s: '$ ', c: 'prompt' },
              { s: stream.command.slice(0, typed), c: 'plain' },
            ]}
            trailing={active ? <Cursor color={COLORS.plain} on={caretOn} /> : null}
          />,
        )
      } else if (idx === stream.promptIndex) {
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={[{ s: '$ ', c: 'prompt' }]}
            trailing={
              showPromptCursor ? (
                <Cursor color={COLORS.prompt} on={blinkOn} />
              ) : active ? (
                <Cursor color={COLORS.plain} on={caretOn} />
              ) : null
            }
          />,
        )
      } else if (active) {
        const full = stream.lines[idx].toks
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={sliceToks(full, Math.round(frac * lineLen(full)))}
            trailing={<Cursor color={COLORS.plain} on={caretOn} />}
          />,
        )
      } else {
        out.push(<TermLine key={idx} top={top} toks={stream.lines[idx].toks} />)
      }
    }
    return out
  }

  const layers: ReactNode[] = []
  for (let k = 0; k < SAMPLES; k++) {
    const t = frame - 1 + (k + 0.5) / SAMPLES
    const em = emittedAt(t, L)
    const layerStyle: CSSProperties = { position: 'absolute', inset: 0, opacity: 1 / SAMPLES }
    ;(layerStyle as Record<string, string | number>).mixBlendMode = 'plus-lighter'
    layers.push(
      <div key={k} style={layerStyle}>
        {renderWindow(em)}
      </div>,
    )
  }

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 28%, #ffffff 0%, #e9e9f2 60%, #dfe0ec 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
      }}
    >
      <Fonts />

      {/* Tarjeta oscura — misma geometría y estética que StoreTerminalScene */}
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e1117 0%, #0a0d13 100%)',
          boxShadow:
            '0 60px 130px -34px rgba(26,36,62,0.55), 0 22px 60px -26px rgba(26,36,62,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: TITLE_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${PAD_X}px`,
            background: 'linear-gradient(180deg, #1a2029 0%, #141923 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 9 }}>
            <span style={dot('#ff5f57')} />
            <span style={dot('#febc2e')} />
            <span style={dot('#28c840')} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 13.5,
              color: '#8a94a6',
              letterSpacing: 0.2,
              pointerEvents: 'none',
            }}
          >
            zsh — aikit-smartprocess — campana — 120×40
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              color: '#6b7689',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#2ada56',
                opacity: running ? pulse : 0.35,
                boxShadow: running ? `0 0 8px rgba(42,218,86,${pulse})` : 'none',
              }}
            />
            {running ? 'composing' : 'done'}
          </div>
        </div>

        {/* Scrolling body */}
        <div
          style={{
            position: 'relative',
            height: BODY_H,
            overflow: 'hidden',
            padding: `${PAD_Y}px ${PAD_X}px`,
            fontSize: FONT_SIZE,
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: `${PAD_Y}px ${PAD_X}px`, isolation: 'isolate' }}>
            {layers}
          </div>

          {/* CRT scanlines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'overlay',
            }}
          />
          {/* Soft top glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(120% 60% at 50% -10%, rgba(122,162,255,0.10) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>

      {/* Sello Smart Process — aparece cuando la campaña queda compuesta. */}
      {sealIn > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 34,
            left: '50%',
            transform: `translateX(-50%) translateY(${(1 - sealIn) * -10}px)`,
            opacity: sealIn,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 18px 10px 12px',
            borderRadius: 999,
            background: '#ffffff',
            boxShadow: '0 8px 24px rgba(40,36,30,0.18), 0 1px 3px rgba(40,36,30,0.12)',
            fontFamily: TEXT_FONT,
            zIndex: 10,
          }}
        >
          <img src={MODULES.smartProcess.icon} alt="Smart Process" width={26} height={26} style={{ display: 'block' }} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: -0.3,
              color: '#2a2722',
            }}
          >
            Compuesta con Smart Process
          </span>
        </div>
      )}
    </AbsoluteFill>
  )
}
