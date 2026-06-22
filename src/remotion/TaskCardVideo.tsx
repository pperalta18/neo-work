/**
 * TaskCardVideo — a neumorphic task card that works through its own list.
 * ──────────────────────────────────────────────────────────────────────────
 * A raised card on the soft AiKit surface holds an agent's to-do list (the
 * NeoTaskList language from Storybook, ported to inline frame-driven styles).
 * The card lifts in, the rows cascade, and then the agent runs the plan: each
 * task's checkbox flips from an empty outline to a spinning ring to a blue
 * tick, the title is struck through as its detail line folds away, and a
 * recessed progress track at the foot of the card fills step by eased step.
 * When the last task lands the header badge flips from "Trabajando…" to
 * "Completado" and the card breathes a soft blue glow.
 *
 * Determinism (house rule): every frame is a pure function of
 * `useCurrentFrame()` — the spinner rotation, the tick draw-in and the pulse
 * are all derived from the frame number (no CSS animations / transitions),
 * so frame N renders byte-identically every time.
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, interpolate, interpolateColors, useCurrentFrame } from 'remotion'
import { KIT_BLUE, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts } from './fonts'
import { CURVE, ease } from './motion'

export const TASK_CARD_DURATION = 264 // 8.8s @ 30fps

const theme = lightTheme

// ── the agent's plan ────────────────────────────────────────────────────────
type Task = { title: string; detail: string }

const TASKS: Task[] = [
  { title: 'Revisar los correos del buzón', detail: '12 mensajes nuevos · 3 requieren respuesta' },
  { title: 'Preparar el presupuesto de junio', detail: "Plantilla 'Servicios' · IVA incluido" },
  { title: 'Actualizar el inventario', detail: '84 referencias sincronizadas' },
  { title: 'Confirmar la reunión con Marta', detail: 'Jueves · 10:30 · sala 2' },
  { title: 'Enviar el resumen al equipo', detail: 'Resumen semanal · 5 destinatarios' },
]

// ── timeline (frames @30fps) ────────────────────────────────────────────────
const INTRO = 18 // card lifts into the workspace
const ROWS_AT = 12 // first row rises in
const ROW_STAG = 5 // stagger between rows
const WORK_START = 50 // the agent picks up task 0
const ACTIVE_DUR = 34 // each task spins ~1.1s before settling

const activeAt = (i: number) => WORK_START + i * ACTIVE_DUR
const doneAt = (i: number) => activeAt(i) + ACTIVE_DUR
const ALL_DONE = doneAt(TASKS.length - 1) // 220

// ── card geometry ───────────────────────────────────────────────────────────
const CARD_W = 720
const PAD = 40
const BOX = 30 // checkbox edge
const ROW_GAP = 22
const TITLE_LH = 32
const DETAIL_H = 30 // 4px seat + 26px line — folds to 0 once struck

/** Fade + rise: content lifts a few px into place as it appears. */
function riseIn(f: number, start: number, dur = 14, dy = 14): CSSProperties {
  const p = ease(f, start, start + dur)
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

/** Frame-driven 0.5↔1 breathing, the deterministic stand-in for a CSS pulse. */
const pulse = (f: number) => 0.75 + 0.25 * Math.sin((f / 30) * Math.PI * 2 * 0.6)

/** A bare tick that draws itself in (pathLength-normalised dash). */
function Tick({ size, color, draw }: { size: number; color: string; draw: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - draw}
      />
    </svg>
  )
}

/** A ring with one blue arc, rotated by the frame — "working on it". */
function Spinner({ f, size }: { f: number; size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: `3px solid ${theme.gridLine}`,
        borderTopColor: KIT_BLUE,
        transform: `rotate(${(f * 14) % 360}deg)`,
      }}
    />
  )
}

/** Marker slot: pending outline → spinner → blue-tinted tick box, crossfaded. */
function CheckBox({ f, i }: { f: number; i: number }) {
  const aAt = activeAt(i)
  const dAt = doneAt(i)
  const toActive = ease(f, aAt, aAt + 5)
  const toDone = ease(f, dAt, dAt + 6)
  const tickDraw = ease(f, dAt + 2, dAt + 12)

  return (
    <div style={{ position: 'relative', width: BOX, height: BOX, flexShrink: 0, marginTop: 2 }}>
      {/* pending — an empty checkbox */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          boxSizing: 'border-box',
          border: `2px solid ${theme.gridLine}`,
          opacity: 1 - toActive,
        }}
      />
      {/* active — round spinner in the square slot, under a soft blue halo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          opacity: toActive * (1 - toDone),
          boxShadow: `0 0 0 ${toActive * 5}px ${KIT_BLUE}1a`,
        }}
      >
        <Spinner f={f} size={BOX} />
      </div>
      {/* done — soft-tinted box, tick drawing in */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 9,
          boxSizing: 'border-box',
          background: `${KIT_BLUE}1f`,
          border: `2px solid ${KIT_BLUE}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: toDone,
          transform: `scale(${interpolate(toDone, [0, 1], [0.7, 1])})`,
        }}
      >
        <Tick size={18} color={KIT_BLUE} draw={tickDraw} />
      </div>
    </div>
  )
}

function TaskRow({ f, i, task }: { f: number; i: number; task: Task }) {
  const aAt = activeAt(i)
  const dAt = doneAt(i)
  const active = ease(f, aAt, aAt + 6) * (1 - ease(f, dAt, dAt + 6))
  // strike sweeps across the title, then the detail line folds away beneath it
  const strike = ease(f, dAt + 2, dAt + 12)
  const fold = ease(f, dAt + 6, dAt + 18)

  const titleColor = interpolateColors(strike, [0, 1], [theme.textStrong, theme.textMuted])

  return (
    <li style={{ display: 'flex', gap: 18, alignItems: 'flex-start', ...riseIn(f, ROWS_AT + i * ROW_STAG) }}>
      <CheckBox f={f} i={i} />
      <div style={{ minWidth: 0 }}>
        <span
          style={{
            position: 'relative',
            display: 'inline-block',
            fontSize: 23,
            lineHeight: `${TITLE_LH}px`,
            letterSpacing: -0.3,
            fontWeight: 500 + Math.round(active) * 100,
            color: titleColor,
          }}
        >
          {task.title}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: '54%',
              width: `${strike * 100}%`,
              height: 2,
              borderRadius: 1,
              background: `${theme.textMuted}b3`,
            }}
          />
        </span>
        <div style={{ overflow: 'hidden', height: (1 - fold) * DETAIL_H, opacity: 1 - fold }}>
          <div
            style={{
              paddingTop: 4,
              fontSize: 18,
              lineHeight: '26px',
              color: theme.textMuted,
              opacity: active > 0 ? pulse(f) : 0.8,
            }}
          >
            {task.detail}
          </div>
        </div>
      </div>
    </li>
  )
}

/** Brain badge + title, with the right-hand meta flipping once the plan lands. */
function Header({ f }: { f: number }) {
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })
  const flip = ease(f, ALL_DONE + 4, ALL_DONE + 14)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...riseIn(f, 6) }}>
      <div
        style={{
          width: 52,
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: KIT_BLUE,
          ...well,
        }}
      >
        <Icon name="brain" size={28} strokeWidth={1.9} />
      </div>
      <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: -0.4 }}>Plan del agente</span>
      <span style={{ marginLeft: 'auto', position: 'relative', fontSize: 17, color: theme.textMuted }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            opacity: (1 - flip) * pulse(f),
          }}
        >
          <Icon name="clock" size={16} strokeWidth={2} />
          Trabajando…
        </span>
        <span
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            whiteSpace: 'nowrap',
            color: KIT_BLUE,
            fontWeight: 500,
            opacity: flip,
          }}
        >
          <Tick size={16} color={KIT_BLUE} draw={flip} />
          Completado
        </span>
      </span>
    </div>
  )
}

/** Recessed track that fills one eased step per settled task, with a counter. */
function Progress({ f }: { f: number }) {
  const doneCount = TASKS.reduce((n, _, i) => n + (f >= doneAt(i) ? 1 : 0), 0)
  const fill = TASKS.reduce((p, _, i) => p + ease(f, doneAt(i) - 4, doneAt(i) + 10), 0) / TASKS.length
  const track = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 5 })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, ...riseIn(f, ROWS_AT + TASKS.length * ROW_STAG) }}>
      <div style={{ flex: 1, height: 10, ...track }}>
        <div
          style={{
            width: `${fill * 100}%`,
            height: '100%',
            borderRadius: 5,
            background: `linear-gradient(90deg, ${KIT_BLUE}cc, ${KIT_BLUE})`,
            boxShadow: fill > 0 ? `0 1px 6px ${KIT_BLUE}40` : 'none',
          }}
        />
      </div>
      <span style={{ fontSize: 16, fontVariantNumeric: 'tabular-nums', color: theme.textMuted }}>
        {doneCount}/{TASKS.length}
      </span>
    </div>
  )
}

// ── composition root ────────────────────────────────────────────────────────
export const TaskCardVideo: React.FC = () => {
  const f = useCurrentFrame()
  const cardIn = ease(f, 0, INTRO)
  const cardPlate = elevation(theme, { depth: 'raised', distance: 12, blur: 30, radius: 30 })
  // a gentle "complete" breath of the whole card once the list is settled
  const settle = ease(f, ALL_DONE, ALL_DONE + 18)
  // slow cinematic push-in across the whole take
  const push = 1 + 0.04 * ease(f, 0, TASK_CARD_DURATION, CURVE.standard)

  return (
    <AbsoluteFill style={{ background: theme.surface }}>
      <Fonts />
      {/* soft radial depth behind the card */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 760px at 50% 40%, #ffffff 0%, ${theme.surface} 62%, #ececf4 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${push})`,
          fontFamily: TEXT_FONT,
          color: theme.textStrong,
        }}
      >
        <section
          aria-label="Plan del agente"
          style={{
            width: CARD_W,
            boxSizing: 'border-box',
            padding: PAD,
            display: 'flex',
            flexDirection: 'column',
            gap: 30,
            ...cardPlate,
            boxShadow: `${cardPlate.boxShadow as string}${settle > 0 ? `, 0 0 ${settle * 60}px ${KIT_BLUE}12` : ''}`,
            opacity: cardIn,
            transform: `translateY(${(1 - cardIn) * 26}px) scale(${interpolate(cardIn, [0, 1], [0.985, 1])})`,
          }}
        >
          <Header f={f} />
          <ol
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: ROW_GAP,
            }}
          >
            {TASKS.map((task, i) => (
              <TaskRow key={i} f={f} i={i} task={task} />
            ))}
          </ol>
          <Progress f={f} />
        </section>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
