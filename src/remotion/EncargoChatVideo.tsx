/**
 * EncargoChatVideo — "Solo díselo" → un tool-call de 3 pasos que se expande.
 * ──────────────────────────────────────────────────────────────────────────
 * Una VENTANA de chat con formato de app de escritorio (apaisada, barra de
 * título con su semáforo) neumórfica, centrada sobre el grounds claro con padding
 * a los lados — NO a pantalla completa. Dentro, la conversación en columna con
 * métrica NeoMessage y un NeoInput abajo. El humano dispara una RÁFAGA de
 * mensajes (burbujas azules SIN texto, todas suyas, a la derecha); la IA responde
 * una sola línea, «Entendido, preparo tu presupuesto» (precedida de su
 * "escribiendo…").
 *
 * Entonces lanza UN tool-call — una tarjeta al estilo {@link PresupuestoChat}:
 * cabecera (icono · título · estado) y una lista de TRES pasos que se completan
 * de uno en uno. Cuando termina el último, esa misma tarjeta se EXPANDE con el
 * patrón de StoreCreate — su rect pasa de la tarjeta al frame completo
 * 1920×1080, el radio abre a 0, su contenido se disuelve y el chat de detrás se
 * escala hacia fuera — aterrizando en una superficie limpia con el icono
 * centrado (sin texto).
 *
 * El contenedor de mensajes deja una canaleta interior para que el RELIEVE de las
 * burbujas no se recorte, y un degradado de máscara arriba para el scroll.
 *
 * Reglas de la casa (specs/motion-language.md + ./motion): `interpolate` con
 * easing, ease-out, SIN bounce/spring, profundidad por relieve neumórfico —
 * nunca un glow de color. Cada píxel es función pura de `useCurrentFrame()`.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BRAND, CELL, KIT_BLUE, PLATE_INSET, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { NeoMessage } from '@/stories/neo/NeoMessage'
import { NeoInput } from '@/stories/neo/NeoInput'
import { NeoCard } from '@/stories/neo/widgets/NeoCard'
import { GridLines } from './storeFlowScene'
import { WebSearch, WS_LENGTH, WS_MINI } from './encargoWebSearch'
import { Icon, type IconName } from '@/components/icons'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'

const theme = lightTheme

// ── frame geometry ────────────────────────────────────────────────────────────
const W = 1920
const H = 1080

/** The chat window — desktop-app format (landscape), centred (padding shows around it). */
const WIN_W = 1280
const WIN_H = 800
const WIN_LEFT = (W - WIN_W) / 2 // 320
const WIN_TOP = (H - WIN_H) / 2 // 140
const WIN_R = 16
const TITLE_H = 48 // window title bar (traffic lights)
const PAD = 28

/** Conversation column — centred inside the window. */
const CONV_W = 820
const CONV_LEFT_REL = (WIN_W - CONV_W) / 2 // 230 · window-relative
const CONV_LEFT = WIN_LEFT + CONV_LEFT_REL // 550 · frame

/** Shadow gutter — room inside the clipped scroll area so bubble relief isn't cut. */
const GUT = 22

/** Composer (NeoInput) reserved height, pinned to the window bottom. */
const INPUT_H = 56
const INPUT_TOP = WIN_TOP + WIN_H - PAD - INPUT_H // 856
const GAP_INPUT = 68 // aire (doble) entre el último elemento del chat y el input
const GAP_TOOL = 14 // aire entre el mensaje y la tarjeta del tool-call

/** The tool-call card → full-frame surface (the morph element, frame coords).
 *  Rests as the newest message, just above the input. */
const TC_W = 424
const TC_H = 168
const TC = { left: CONV_LEFT, top: INPUT_TOP - GAP_INPUT - TC_H, w: TC_W, h: TC_H, r: 18 } // top 620
const FULL = { left: 0, top: 0, w: W, h: H, r: 0 }

// ── the grid epilogue revealed when the card opens (bleeds off every edge) ──────
const GCOLS = 17
const GROWS = 10
const GW = GCOLS * CELL // 2176
const GH = GROWS * CELL // 1280
const GLEFT = (W - GW) / 2 // -128 · bleeds left/right
const GTOP = (H - GH) / 2 // -100 · bleeds top/bottom

/** A vertical column of step elevations on the LEFT — a multi-step process. */
type ProcessStep = { icon: IconName; len: number }
const PROCESS: ProcessStep[] = [
  { icon: 'global', len: 1.0 }, // internet
  { icon: 'database', len: 0.78 },
  { icon: 'folder', len: 0.94 },
  { icon: 'calculator', len: 0.68 },
  { icon: 'check', len: 0.9 },
]
const STEP_COL0 = 3 // grid column where each pill starts (leaves col 1–2 to its left)
const STEP_SPAN = 4 // pill width in cells
const STEP_ROW0 = 3 // first pill row (1-based)

/** Scroll area for the chat messages: bottom-anchored, rises as messages arrive. */
const SCROLL_TOP = WIN_TOP + TITLE_H + 8 // 196 · frame

// ── the user's flurry: a few short empty blue bubbles ───────────────────────────
type Bubble = { w: number; h: number; at: number }
const USER_BUBBLES: Bubble[] = [
  { w: 224, h: 44, at: 8 },
  { w: 168, h: 44, at: 20 },
  { w: 300, h: 44, at: 32 },
]

// ── the single tool-call (PresupuestoChat-style: header + 3 steps) ──────────────
const TOOL = {
  title: 'Generando el presupuesto',
  steps: ['Recuperar datos del cliente', 'Calcular líneas y precios', 'Generar el PDF'],
  inAt: 128, // la tarjeta aparece
  stepsAt: 144, // arranca el primer paso
}
const STEP_DUR = 28 // un paso "en curso" cada vez
const TOOL_DONE = TOOL.stepsAt + TOOL.steps.length * STEP_DUR // 228

// ── timeline (30 fps) ───────────────────────────────────────────────────────
const TYPING_START = 64 // la IA "escribiendo…" tras la ráfaga
const REPLY_AT = 108 // se compromete la respuesta de la IA
const EXPAND_START = TOOL_DONE + 16 // 244 · beat para leer "Listo", luego abre
const EXPAND_END = EXPAND_START + 58 // 302 · expansión ágil (~1.9 s)
const CHAT_FADE: [number, number] = [EXPAND_START + 14, EXPAND_END - 6]
const GRID_IN: [number, number] = [EXPAND_END - 16, EXPAND_END + 12] // gridlines fade in
const STEPS_START = EXPAND_END + 6 // las elevaciones-paso se pintan una a una
const STEP_STAGGER = 12
const STEPS_DONE = STEPS_START + PROCESS.length * STEP_STAGGER + 14 // 382
/** Frame en el que arranca el epílogo de búsqueda web (navegador + datos + minis). */
const WS_START = STEPS_DONE + 4 // 386
const HL1: [number, number] = [WS_START, WS_START + 16] // el primer paso se destaca
/** Largo total (~22 s): chat + expand + grid + pasos + epílogo web. */
export const ENCARGO_CHAT_DURATION = WS_START + WS_LENGTH // 686

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export type EncargoChatProps = {
  /** Texto de la única respuesta de la IA. */
  reply?: string
}

export function EncargoChatVideo({ reply = 'Entendido, preparo tu presupuesto.' }: EncargoChatProps = {}) {
  const frame = useCurrentFrame()

  // ── chat layer: scales out + dissolves as the card grows ──────────────────
  const expand = ease(frame, EXPAND_START, EXPAND_END, CURVE.standard)
  const chatOut = ease(frame, CHAT_FADE[0], CHAT_FADE[1], CURVE.standard)
  const chatScale = lerp(1, 1.05, expand)

  // the conversation sits just above the input and RISES with each message; when
  // the tool-call card appears it pushes the thread up to make room for itself.
  const toolPresence = ease(frame, TOOL.inAt, TOOL.inAt + DUR.base, CURVE.enter)
  const convBottom = INPUT_TOP - GAP_INPUT - toolPresence * (TC_H + GAP_TOOL)
  const scrollHeight = convBottom + GUT - SCROLL_TOP

  return (
    <NeoThemeProvider theme={theme}>
      <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, overflow: 'hidden' }}>
        <Fonts />

        {/* the chat window — dissolves with the expand */}
        <AbsoluteFill style={{ opacity: 1 - chatOut, transform: `scale(${chatScale})`, transformOrigin: '50% 50%' }}>
          <NeoCard
            width={WIN_W}
            padding={PAD}
            radius={WIN_R}
            center={false}
            style={{ position: 'absolute', left: WIN_LEFT, top: WIN_TOP, height: WIN_H }}
          >
            {/* window chrome — title bar with traffic lights + a centred title (window-relative) */}
            <WindowChrome />

            {/* conversation — centred column, bottom-anchored stack; gutter keeps
                relief from clipping, a top mask fades anything that scrolls up. */}
            <div
              style={{
                position: 'absolute',
                left: CONV_LEFT_REL - GUT,
                top: TITLE_H + 8,
                width: CONV_W + GUT * 2,
                height: scrollHeight,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                gap: 14,
                paddingLeft: GUT,
                paddingRight: GUT,
                paddingBottom: GUT,
                boxSizing: 'border-box',
                overflow: 'hidden',
                WebkitMaskImage: 'linear-gradient(to bottom, transparent 0, #000 44px)',
                maskImage: 'linear-gradient(to bottom, transparent 0, #000 44px)',
              }}
            >
              {USER_BUBBLES.map((b, i) => (frame >= b.at ? <UserBubble key={i} bubble={b} frame={frame} /> : null))}
              <AiReply reply={reply} frame={frame} />
            </div>

            {/* the composer — Conversation's NeoInput */}
            <div style={{ position: 'absolute', left: CONV_LEFT_REL, bottom: PAD, width: CONV_W }}>
              <NeoInput value="" placeholder="Escribe un mensaje…" icon="plus" multiline style={{ width: '100%' }} />
            </div>
          </NeoCard>
        </AbsoluteFill>

        {/* the tool-call card → full-frame surface (over the panel) */}
        <ToolCallMorph frame={frame} expand={expand} />
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}

/* ── window chrome: title bar (traffic lights + centred title) ─────────────────── */

function WindowChrome() {
  return (
    <>
      {/* traffic lights */}
      <div style={{ position: 'absolute', left: 24, top: 0, height: TITLE_H, display: 'flex', alignItems: 'center', gap: 9 }}>
        {['#ec6a5e', '#f4be4f', '#61c554'].map((c) => (
          <span key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
        ))}
      </div>
      {/* centred window title */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: WIN_W,
          height: TITLE_H,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14.5,
          fontWeight: 600,
          letterSpacing: -0.2,
          color: theme.textMuted,
        }}
      >
        Asistente
      </div>
      {/* title-bar hairline */}
      <div style={{ position: 'absolute', left: 0, top: TITLE_H, width: WIN_W, height: 1, background: theme.gridLine }} />
    </>
  )
}

/* ── the user's bubbles: empty blue plates, right-aligned (NeoMessage "me") ───── */

function UserBubble({ bubble, frame }: { bubble: Bubble; frame: number }) {
  const e = ease(frame, bubble.at, bubble.at + DUR.base, CURVE.enter)
  const plate = elevation(theme, { depth: 'raised', distance: 5, blur: 12, radius: 20 })
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          ...plate,
          width: bubble.w,
          height: bubble.h,
          maxWidth: '78%',
          background: KIT_BLUE,
          borderBottomRightRadius: 6,
          opacity: e,
          transform: `translateY(${(1 - e) * 12}px) scale(${0.97 + 0.03 * e})`,
        }}
      />
    </div>
  )
}

/* ── the AI's one line: "typing…" → the reply (NeoMessage "them") ─────────────── */

function AiReply({ reply, frame }: { reply: string; frame: number }) {
  const replied = frame >= REPLY_AT
  const since = replied ? REPLY_AT : TYPING_START
  const e = ease(frame, since, since + DUR.base, CURVE.enter)
  if (frame < TYPING_START) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        opacity: e,
        transform: `translateY(${(1 - e) * 12}px) scale(${0.97 + 0.03 * e})`,
      }}
    >
      {replied ? <NeoMessage from="them">{reply}</NeoMessage> : <NeoMessage from="them" typing typingFrame={frame} />}
    </div>
  )
}

/* ── the tool-call: a PresupuestoChat-style card that morphs to full frame ────── */

function ToolCallMorph({ frame, expand }: { frame: number; expand: number }) {
  if (frame < TOOL.inAt) return null

  // appear (before the expand): rise + fade like a chat message
  const ap = ease(frame, TOOL.inAt, TOOL.inAt + DUR.base, CURVE.enter)

  // card → full-frame morph
  const rect = {
    left: lerp(TC.left, FULL.left, expand),
    top: lerp(TC.top, FULL.top, expand),
    w: lerp(TC.w, FULL.w, expand),
    h: lerp(TC.h, FULL.h, expand),
    r: lerp(TC.r, FULL.r, expand),
  }
  const borderOpacity = 1 - clamp01(expand * 2)
  // card surface fades white → grounds as it opens (so the grid blends in)
  const bg = mixColor('#ffffff', theme.surface, clamp01(expand * 2))

  // the card's own content fades out early in the expand
  const bodyOpacity = (1 - ease(frame, EXPAND_START, EXPAND_START + 22, CURVE.standard)) * ap
  // the grid epilogue is revealed through the growing rect (kept screen-fixed)
  const gridOpacity = ease(frame, GRID_IN[0], GRID_IN[1], CURVE.enter)

  const finished = frame >= TOOL_DONE

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.left,
        top: rect.top,
        width: rect.w,
        height: rect.h,
        opacity: ap,
        transform: `translateY(${(1 - ap) * 12}px)`,
        boxSizing: 'border-box',
        background: bg,
        border: `1px solid rgba(184, 204, 224, ${0.45 * borderOpacity})`,
        borderRadius: rect.r,
        overflow: 'hidden',
      }}
    >
      {/* the card body (header + 3 steps) — fades out as it opens */}
      <div style={{ position: 'absolute', left: 20, top: 18, width: TC_W - 40, opacity: bodyOpacity, display: 'flex', flexDirection: 'column' }}>
        {/* header — tool identity + live status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconTile />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.2, color: theme.textStrong, flex: 1 }}>{TOOL.title}</span>
          <Status frame={frame} finished={finished} />
        </div>
        {/* the steps it declared, checking off one at a time */}
        <div style={{ marginTop: 15, display: 'flex', flexDirection: 'column', gap: 11 }}>
          {TOOL.steps.map((label, i) => (
            <StepRow key={label} label={label} startAt={TOOL.stepsAt + i * STEP_DUR} frame={frame} />
          ))}
        </div>
      </div>

      {/* the grid epilogue — screen-fixed inside the growing rect, so it reads as
          one surface spreading open: a grid that bleeds off every edge + a left
          column of step elevations (the process). */}
      <GridEpilogue frame={frame} opacity={gridOpacity} originLeft={-rect.left} originTop={-rect.top} />
    </div>
  )
}

/* ── the grid surface revealed on open + the left column of step elevations ────── */

function GridEpilogue({ frame, opacity, originLeft, originTop }: { frame: number; opacity: number; originLeft: number; originTop: number }) {
  if (opacity <= 0.001) return null
  const lit1 = ease(frame, HL1[0], HL1[1], CURVE.enter) // el primer paso se destaca
  // los pasos se atenúan cuando florecen los mini-navegadores por todo el grid
  const stepsOut = ease(frame, WS_START + WS_MINI, WS_START + WS_MINI + 24, CURVE.standard)
  return (
    <div style={{ position: 'absolute', left: originLeft, top: originTop, width: W, height: H, opacity, background: theme.surface }}>
      <div style={{ position: 'absolute', left: GLEFT, top: GTOP, width: GW, height: GH }}>
        <GridLines />
        <div style={{ position: 'absolute', inset: 0, opacity: 1 - stepsOut }}>
          {PROCESS.map((s, i) => (
            <StepPlate
              key={i}
              col0={STEP_COL0}
              row={STEP_ROW0 + i}
              colSpan={STEP_SPAN}
              grow={ease(frame, STEPS_START + i * STEP_STAGGER, STEPS_START + i * STEP_STAGGER + 14, CURVE.enter)}
              lit={i === 0 ? lit1 : 0}
              n={i + 1}
              icon={s.icon}
              len={s.len}
            />
          ))}
        </div>

        {/* web-search epilogue: the browser emerges, data streams, then it
            compresses into a field of mini-browsers (local frame = frame - WS_START). */}
        <WebSearch frame={frame - WS_START} />
      </div>
    </div>
  )
}

/** One step: [number] + icon + bar, on a raised plate (CreadorSkills style). `lit` highlights it. */
function StepPlate({ col0, row, colSpan, grow, lit, n, icon, len }: { col0: number; row: number; colSpan: number; grow: number; lit: number; n: number; icon: IconName; len: number }) {
  if (grow <= 0.001) return null
  const x = (col0 - 1) * CELL
  const y = (row - 1) * CELL
  const w = colSpan * CELL
  const scale = 0.965 + 0.035 * grow
  const opacity = clamp01(grow * 1.6)
  const plate = elevation(theme, { depth: 'raised', distance: 8 * grow, blur: 16 * grow, radius: 20 })
  const ring = lit > 0.001 ? `, inset 0 0 0 ${1.4 * lit}px ${KIT_BLUE}, 0 0 ${16 * lit}px ${KIT_BLUE}22` : ''
  const numColor = mixColor('#6c6c89', KIT_BLUE, lit)
  const iconColor = mixColor('#1e1e20', KIT_BLUE, lit)
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: CELL }}>
      {/* erase internal hairlines so the pill reads as one surface */}
      <div style={{ position: 'absolute', inset: 0, background: theme.surface, boxShadow: `inset 0 0 0 1px ${theme.gridLine}`, opacity: clamp01(grow * 1.8) }} />
      <div
        style={{
          position: 'absolute',
          inset: PLATE_INSET,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          fontFamily: TEXT_FONT,
          ...plate,
          boxShadow: `${plate.boxShadow}${ring}`,
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        <span style={{ width: 22, flexShrink: 0, textAlign: 'center', fontSize: 20, fontWeight: 600, letterSpacing: -0.4, color: numColor }}>{n}</span>
        <span style={{ flexShrink: 0, display: 'flex' }}>
          <Icon name={icon} size={28} color={iconColor} strokeWidth={1.7} />
        </span>
        <div style={{ flex: 1, height: 12, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div style={{ width: `${clamp01(len) * 100}%`, height: 12, borderRadius: 999, background: '#c3cddb', boxShadow: 'inset 0 1px 2px rgba(120, 140, 170, 0.25)' }} />
        </div>
      </div>
    </div>
  )
}

/** Lerp between two #rrggbb colours. */
function mixColor(a: string, b: string, t: number): string {
  const k = clamp01(t)
  const pa = parseInt(a.slice(1), 16)
  const pb = parseInt(b.slice(1), 16)
  const r = Math.round(((pa >> 16) & 255) + (((pb >> 16) & 255) - ((pa >> 16) & 255)) * k)
  const g = Math.round(((pa >> 8) & 255) + (((pb >> 8) & 255) - ((pa >> 8) & 255)) * k)
  const bl = Math.round((pa & 255) + ((pb & 255) - (pa & 255)) * k)
  return `rgb(${r}, ${g}, ${bl})`
}

/** The tool glyph — a sparkles icon on a soft blue tile. */
function IconTile() {
  return (
    <span style={{ width: 32, height: 32, borderRadius: 10, background: `${KIT_BLUE}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name="sparkles" size={18} color={KIT_BLUE} strokeWidth={1.7} />
    </span>
  )
}

/** Header status: a flat spinner while working, a green check when done. */
function Status({ frame, finished }: { frame: number; finished: boolean }) {
  if (finished) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: BRAND.green, fontSize: 13.5, fontWeight: 600 }}>
        <Icon name="check" size={16} color={BRAND.green} strokeWidth={2.2} />
        Listo
      </span>
    )
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: theme.textMuted, fontSize: 13.5 }}>
      <Spinner frame={frame} size={15} color={KIT_BLUE} />
      Trabajando…
    </span>
  )
}

function StepRow({ label, startAt, frame }: { label: string; startAt: number; frame: number }) {
  const done = frame >= startAt + STEP_DUR
  const active = frame >= startAt && !done
  const color = done || active ? theme.textStrong : theme.textMuted
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <StepGlyph done={done} active={active} frame={frame} />
      <span style={{ fontSize: 15, letterSpacing: -0.1, color, opacity: done || active ? 1 : 0.75 }}>{label}</span>
    </div>
  )
}

/** pending → hollow ring · active → spinner · done → filled blue check. */
function StepGlyph({ done, active, frame }: { done: boolean; active: boolean; frame: number }) {
  if (done) {
    return (
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: KIT_BLUE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="check" size={12} color="#fff" strokeWidth={2.6} />
      </span>
    )
  }
  if (active) {
    return (
      <span style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Spinner frame={frame} size={17} color={KIT_BLUE} />
      </span>
    )
  }
  return <span style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${theme.gridLine}`, boxSizing: 'border-box', flexShrink: 0 }} />
}

/* ── flat primitives ────────────────────────────────────────────────────────── */

/** Deterministic spinner — a 270° arc rotating on a fixed frame cadence. */
function Spinner({ frame, size, color }: { frame: number; size: number; color: string }) {
  const angle = (frame * 9) % 360
  const r = size / 2 - 2
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${angle}deg)`, display: 'block' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={`${color}28`} strokeWidth={2} />
      <path d={`M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - r} ${c}`} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}
