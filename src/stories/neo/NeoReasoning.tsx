import type { ReactNode } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT, type NeoTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from './NeoTheme'

export type ReasoningStatus = 'done' | 'active' | 'pending'

export type ReasoningStep = {
  /** The reasoning move, e.g. "Breaking the problem into parts". */
  title: string
  /** Optional sub-line: the model's note for this step. */
  detail?: string
  /** done = settled (blue check), active = thinking now (spinner), pending = not reached. */
  status?: ReasoningStatus
}

/* ─────────────────────────── design tokens ───────────────────────────
 * One source of truth for the few magic numbers, so the rail geometry and
 * the two variants stay in lockstep when any of them is tuned.
 */
const MARKER = 24 // chain node diameter
const BOX = 20 // tasklist checkbox edge
const ROW_GAP = 20 // vertical rhythm between chain steps
const RAIL_W = 2 // connector thickness

const KEYFRAMES = `
  @keyframes neo-reason-spin{to{transform:rotate(360deg)}}
  @keyframes neo-reason-pulse{0%,100%{opacity:.5}50%{opacity:1}}
`

/* ─────────────────────────── shared atoms ──────────────────────────── */

/** A bare tick — no surrounding ring, so it sits clean inside a fill or a tint. */
function Tick({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12.5 10 17.5 19 7"
        stroke={color}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** A ring with one blue arc, spun — the universal "working on it" marker. */
function Spinner({ size, theme }: { size: number; theme: NeoTheme }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: `${RAIL_W + 0.5}px solid ${theme.gridLine}`,
        borderTopColor: KIT_BLUE,
        animation: 'neo-reason-spin .8s linear infinite',
      }}
    />
  )
}

/** Header shared by both variants: brain mark, title, and a right-aligned meta. */
function Header({
  title,
  elapsed,
  badge,
  theme,
}: {
  title: string
  elapsed?: string
  /** Wrap the brain in a recessed neumorphic well (chain) vs. plain (tasklist). */
  badge?: boolean
  theme: NeoTheme
}) {
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 12 })
  // A trailing ellipsis reads as "still thinking" — let the meta breathe.
  const thinking = !!elapsed && /[….]\s*$/.test(elapsed)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: badge ? 12 : 9 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: KIT_BLUE,
          ...(badge ? { width: 34, height: 34, ...well } : null),
        }}
      >
        <Icon name="brain" size={badge ? 19 : 18} strokeWidth={1.9} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: -0.3 }}>{title}</span>
      {elapsed && (
        <span
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            color: theme.textMuted,
            animation: thinking ? 'neo-reason-pulse 1.6s ease-in-out infinite' : undefined,
          }}
        >
          <Icon name="clock" size={13} strokeWidth={2} />
          {elapsed}
        </span>
      )}
    </div>
  )
}

/**
 * Title + optional detail, with the active step emphasised and pending dimmed.
 * `strikeDone` turns it into a checklist line: done items are struck through,
 * dimmed, and collapse to a single line (their detail is hidden).
 */
function StepBody({
  step,
  status,
  theme,
  strikeDone = false,
}: {
  step: ReasoningStep
  status: ReasoningStatus
  theme: NeoTheme
  strikeDone?: boolean
}) {
  const done = status === 'done'
  const struck = strikeDone && done
  const muted = status === 'pending' || struck
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontSize: 14.5,
          lineHeight: '21px',
          letterSpacing: -0.2,
          fontWeight: status === 'active' ? 600 : 500,
          color: muted ? theme.textMuted : theme.textStrong,
          textDecoration: struck ? 'line-through' : undefined,
          textDecorationColor: struck ? `${theme.textMuted}99` : undefined,
        }}
      >
        {step.title}
      </div>
      {step.detail && !struck && (
        <div
          style={{
            marginTop: 3,
            fontSize: 12.5,
            lineHeight: '18px',
            color: theme.textMuted,
            animation: status === 'active' ? 'neo-reason-pulse 1.6s ease-in-out infinite' : undefined,
          }}
        >
          {step.detail}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════
 * NeoReasoning — boxed chain-of-thought
 * ══════════════════════════════════════════════════════════════════════
 * A model's reasoning as a vertical chain wired together by a neumorphic
 * rail: settled steps carry a blue tick, the active step spins under a soft
 * glow, pending steps sit in recessed wells below. Lit by the active theme.
 */
export type NeoReasoningProps = {
  /** Ordered chain of thought. */
  steps: ReasoningStep[]
  /** Header label. */
  title?: string
  /** Right-aligned meta, e.g. "Pensó durante 8s". */
  elapsed?: string
  width?: number
  children?: ReactNode
}

export function NeoReasoning({
  steps,
  title = 'Razonamiento',
  elapsed,
  width = 420,
  children,
}: NeoReasoningProps) {
  const theme = useNeoTheme()
  const card = elevation(theme, { depth: 'raised', distance: 10, blur: 24, radius: 26 })

  return (
    <section
      aria-label={title}
      style={{
        width,
        boxSizing: 'border-box',
        padding: 24,
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        ...card,
      }}
    >
      <style>{KEYFRAMES}</style>

      <Header title={title} elapsed={elapsed} badge theme={theme} />

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => {
          const status = step.status ?? 'pending'
          const isLast = i === steps.length - 1
          // The rail below a node lights up only once that node is settled.
          const railColor = status === 'done' ? KIT_BLUE : theme.gridLine

          return (
            <li
              key={i}
              aria-current={status === 'active' ? 'step' : undefined}
              style={{ display: 'flex', gap: 14 }}
            >
              {/* Marker column — stretches to the row height so the rail
                  always reaches the next node, whatever the content. */}
              <div
                style={{
                  alignSelf: 'stretch',
                  width: MARKER,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <ChainMarker status={status} theme={theme} />
                {!isLast && (
                  <span
                    aria-hidden
                    style={{
                      flex: 1,
                      width: RAIL_W,
                      marginTop: 6,
                      borderRadius: RAIL_W,
                      background: railColor,
                    }}
                  />
                )}
              </div>

              <div style={{ paddingTop: 1, paddingBottom: isLast ? 0 : ROW_GAP }}>
                <StepBody step={step} status={status} theme={theme} />
              </div>
            </li>
          )
        })}
      </ol>

      {children}
    </section>
  )
}

/** Chain node: filled blue tick (done), glowing spinner (active), recessed well (pending). */
function ChainMarker({ status, theme }: { status: ReasoningStatus; theme: NeoTheme }) {
  if (status === 'done') {
    return (
      <div
        style={{
          width: MARKER,
          height: MARKER,
          borderRadius: '50%',
          background: KIT_BLUE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 3px 8px ${theme.shadow}`,
        }}
      >
        <Tick size={14} />
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div style={{ borderRadius: '50%', boxShadow: `0 0 0 4px ${KIT_BLUE}1f` }}>
        <Spinner size={MARKER} theme={theme} />
      </div>
    )
  }

  // pending — an empty socket carved into the surface
  return (
    <div
      style={{
        width: MARKER,
        height: MARKER,
        boxSizing: 'border-box',
        ...elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: MARKER / 2 }),
      }}
    />
  )
}

/* ══════════════════════════════════════════════════════════════════════
 * NeoTaskList — the same trace, no boxes
 * ══════════════════════════════════════════════════════════════════════
 * A flat checklist variant: no card, no rail — just checkbox markers and
 * labels. The marker shape itself carries the state (filled tick → done,
 * circular spinner → in progress, outlined box → pending), so it reads as a
 * plain to-do list while still being lit by the active theme.
 */
export type NeoTaskListProps = {
  steps: ReasoningStep[]
  title?: string
  elapsed?: string
  width?: number
  /** Show the brain + title line above the list. */
  header?: boolean
  children?: ReactNode
}

export function NeoTaskList({
  steps,
  title = 'Razonamiento',
  elapsed,
  width = 420,
  header = true,
  children,
}: NeoTaskListProps) {
  const theme = useNeoTheme()

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <style>{KEYFRAMES}</style>

      {header && <Header title={title} elapsed={elapsed} theme={theme} />}

      <ol
        style={{
          listStyle: 'none',
          margin: 0,
          padding: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        }}
      >
        {steps.map((step, i) => {
          const status = step.status ?? 'pending'
          return (
            <li
              key={i}
              aria-current={status === 'active' ? 'step' : undefined}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
            >
              <CheckBox status={status} theme={theme} />
              <StepBody step={step} status={status} theme={theme} strikeDone />
            </li>
          )
        })}
      </ol>

      {children}
    </div>
  )
}

/** Tasklist marker: soft-tinted tick box (done), circular spinner (active), outlined box (pending). */
function CheckBox({ status, theme }: { status: ReasoningStatus; theme: NeoTheme }) {
  // Nudge down to sit on the cap-height of the title's first line.
  const seat = { flexShrink: 0, marginTop: 2 } as const

  if (status === 'done') {
    return (
      <span
        aria-hidden
        style={{
          ...seat,
          width: BOX,
          height: BOX,
          borderRadius: 6,
          boxSizing: 'border-box',
          background: `${KIT_BLUE}1f`, // ~12% tint — present, not saturated
          border: `1.5px solid ${KIT_BLUE}40`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Tick size={12} color={KIT_BLUE} />
      </span>
    )
  }

  if (status === 'active') {
    // A round spinner in a square slot signals "in progress" without a tick.
    return (
      <span aria-hidden style={{ ...seat, display: 'inline-flex' }}>
        <Spinner size={BOX} theme={theme} />
      </span>
    )
  }

  // pending — an empty checkbox
  return (
    <span
      aria-hidden
      style={{
        ...seat,
        width: BOX,
        height: BOX,
        borderRadius: 6,
        boxSizing: 'border-box',
        border: `1.6px solid ${theme.gridLine}`,
      }}
    />
  )
}
