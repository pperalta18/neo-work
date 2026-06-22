import type { CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { KIT_BLUE, BRAND, lightTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'
import {
  ATTACH_AT,
  PRESUPUESTO_COPY,
  PRESUPUESTO_SCHEDULE,
  SENT_AT,
  TYPE_START,
  WORK_START,
  ALL_DONE,
  type StepBeat,
} from './presupuestoChatScript'

export { PRESUPUESTO_DURATION } from './presupuestoChatScript'

/**
 * PresupuestoChat — una instrucción, la IA trabajando, el PDF adjunto (~17 s · 1920×1080).
 * ───────────────────────────────────────────────────────────────────────────
 * Limpio y plano: sin panel ni relieve. El humano escribe un mensaje; la IA hace
 * un tool-call que declara los pasos, los completa uno a uno, y adjunta el
 * presupuesto. Toda la coreografía vive en presupuestoChatScript.ts.
 */

const theme = lightTheme
const COL_W = 760

export function PresupuestoChat() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong }}>
      <Fonts />
      {/* Centered column: every block is always laid out (incl. the attachment's
          reserved space), so the stack never reflows — items just fade/rise in. */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: COL_W, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <UserMessage />
          <ToolCall />
          <Attachment />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/* ── the human's one message: types in, then commits (flat, no relief) ──── */

function UserMessage() {
  const frame = useCurrentFrame()
  const typing = frame >= TYPE_START && frame < SENT_AT
  const settleEnd = SENT_AT - 8
  const t = Math.min(1, Math.max(0, (frame - TYPE_START) / (settleEnd - TYPE_START)))
  const text = PRESUPUESTO_COPY.userMessage.slice(0, Math.round(t * PRESUPUESTO_COPY.userMessage.length))
  const caretOn = typing && frame % 30 < 18
  const appear = ease(frame, TYPE_START, TYPE_START + DUR.base)

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: appear }}>
      <div
        style={{
          maxWidth: '78%',
          padding: '14px 18px',
          borderRadius: 20,
          borderBottomRightRadius: 7,
          background: KIT_BLUE,
          color: '#fff',
          fontSize: 19,
          lineHeight: '26px',
          letterSpacing: -0.2,
        }}
      >
        {text || '​'}
        <span
          style={{
            display: 'inline-block',
            width: 2,
            height: 19,
            marginLeft: 2,
            verticalAlign: 'text-bottom',
            background: '#fff',
            opacity: caretOn ? 0.85 : 0,
          }}
        />
      </div>
    </div>
  )
}

/* ── the AI tool-call: declares the steps, then completes them ──────────── */

function ToolCall() {
  const frame = useCurrentFrame()
  const open = ease(frame, WORK_START, WORK_START + DUR.reveal, CURVE.enter)
  const finished = frame >= ALL_DONE

  return (
    <div
      style={{
        opacity: open,
        transform: `translateY(${(1 - open) * 16}px)`,
        border: `1px solid ${theme.gridLine}`,
        borderRadius: 18,
        background: '#fff',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      {/* header — tool identity + live status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: `${KIT_BLUE}14`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="sparkles" size={19} color={KIT_BLUE} strokeWidth={1.7} />
        </div>
        <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: -0.2, flex: 1 }}>
          {PRESUPUESTO_COPY.toolTitle}
        </span>
        <Status frame={frame} finished={finished} />
      </div>

      {/* the steps it declared, checking off one at a time */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {PRESUPUESTO_SCHEDULE.map((step, i) => (
          <StepRow key={step.label} step={step} frame={frame} index={i} />
        ))}
      </div>
    </div>
  )
}

/** Header status: a flat spinner while working, a green check when done. */
function Status({ frame, finished }: { frame: number; finished: boolean }) {
  if (finished) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: BRAND.green, fontSize: 14, fontWeight: 600 }}>
        <Icon name="check" size={17} color={BRAND.green} strokeWidth={2.2} />
        {PRESUPUESTO_COPY.done}
      </span>
    )
  }
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 9, color: theme.textMuted, fontSize: 14 }}>
      <Spinner frame={frame} size={16} color={KIT_BLUE} />
      {PRESUPUESTO_COPY.working}
    </span>
  )
}

function StepRow({ step, frame, index }: { step: StepBeat; frame: number; index: number }) {
  const inn = ease(frame, WORK_START + 6 + index * 3, WORK_START + 6 + index * 3 + DUR.base)
  const done = frame >= step.doneAt
  const active = frame >= step.startAt && frame < step.doneAt
  const labelColor = done ? theme.textStrong : active ? theme.textStrong : theme.textMuted

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 13, opacity: inn }}>
      <StepGlyph done={done} active={active} frame={frame} />
      <span
        style={{
          fontSize: 16,
          letterSpacing: -0.15,
          color: labelColor,
          opacity: done || active ? 1 : 0.7,
        }}
      >
        {step.label}
      </span>
    </div>
  )
}

/** pending → hollow ring · active → spinner · done → filled blue check. */
function StepGlyph({ done, active, frame }: { done: boolean; active: boolean; frame: number }) {
  if (done) {
    return (
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: KIT_BLUE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon name="check" size={13} color="#fff" strokeWidth={2.6} />
      </span>
    )
  }
  if (active) {
    return (
      <span style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Spinner frame={frame} size={18} color={KIT_BLUE} />
      </span>
    )
  }
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: `2px solid ${theme.gridLine}`,
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    />
  )
}

/* ── the attachment: the presupuesto PDF, dropped in when work completes ── */

function Attachment() {
  const frame = useCurrentFrame()
  const inn = ease(frame, ATTACH_AT, ATTACH_AT + DUR.reveal, CURVE.enter)

  return (
    <div
      style={{
        // Always laid out (reserves its space); opacity drives the reveal.
        opacity: inn,
        transform: `translateY(${(1 - inn) * 18}px)`,
        border: `1px solid ${theme.gridLine}`,
        borderRadius: 16,
        background: '#fff',
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <PdfGlyph />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
        <span style={{ fontSize: 16.5, fontWeight: 600, letterSpacing: -0.2 }}>{PRESUPUESTO_COPY.attachName}</span>
        <span style={{ fontSize: 13.5, color: theme.textMuted }}>{PRESUPUESTO_COPY.attachMeta}</span>
      </div>
      <DownloadGlyph />
    </div>
  )
}

/* ── flat primitives (no relief) ────────────────────────────────────────── */

/** Deterministic spinner — a 270° arc rotating on a fixed frame cadence. */
function Spinner({ frame, size, color }: { frame: number; size: number; color: string }) {
  const angle = (frame * 9) % 360
  const r = size / 2 - 2
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${angle}deg)` }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={`${color}28`} strokeWidth={2} />
      <path
        d={`M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - r} ${c}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}

/** A flat PDF chip — a red document tile labelled "PDF". */
function PdfGlyph() {
  return (
    <span
      style={{
        width: 42,
        height: 42,
        borderRadius: 11,
        background: '#ec4d3b',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: 0.4,
        flexShrink: 0,
      }}
    >
      PDF
    </span>
  )
}

/** A quiet download arrow on the right of the attachment. */
function DownloadGlyph() {
  const s: CSSProperties = { color: theme.textMuted }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={s}>
      <path d="M12 3v12" />
      <path d="m7 11 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}
