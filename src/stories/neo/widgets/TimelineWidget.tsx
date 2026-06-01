import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type TimelineStep = {
  /** Phase name, e.g. "Digitalizar". */
  title: string
  /** One-line note under the title. */
  caption?: string
}

export type TimelineWidgetProps = {
  /** Header label above the stepper. */
  title?: string
  /** The phases, in order. */
  steps?: TimelineStep[]
  /** Index of the phase you're on now: everything before is done, after is future. */
  current?: number
  /** Lay the rail across or down. */
  orientation?: 'horizontal' | 'vertical'
}

type Theme = ReturnType<typeof useNeoTheme>
type NodeState = 'done' | 'active' | 'future'

const NODE = 30

const DEFAULT_STEPS: TimelineStep[] = [
  { title: 'Digitalizar', caption: 'Sacamos tus papeles del cajón' },
  { title: 'Conectar', caption: 'Enchufamos tus apps de siempre' },
  { title: 'Automatizar por chat', caption: 'Le pides el marrón y lo hace' },
  { title: 'Flujos autónomos', caption: 'Solo, sin que estés encima' },
  { title: 'Mejora continua', caption: 'Cada semana, un poco mejor' },
]

/**
 * TimelineWidget — a neumorphic phase stepper.
 * ─────────────────────────────────────────────
 * Numbered circular nodes wired by a single rail: the segments behind you are
 * lit KIT_BLUE, the ones ahead stay a quiet gridline. Node states mirror
 * NeoReasoning — done is a filled blue check, the active phase is a blue ring,
 * and future phases are hollow muted dots. `current` drives the whole thing.
 * Works across (horizontal) or down (vertical). Re-lit live by the NeoTheme.
 */
export function TimelineWidget({
  title = 'Tu camino con AiKit',
  steps = DEFAULT_STEPS,
  current = 2,
  orientation = 'horizontal',
}: TimelineWidgetProps) {
  const theme = useNeoTheme()
  const stateOf = (i: number): NodeState =>
    i < current ? 'done' : i === current ? 'active' : 'future'

  const vertical = orientation === 'vertical'
  const width = vertical ? 360 : 560

  return (
    <NeoCard width={width} center={false} padding={vertical ? 26 : 30} radius={28} style={{ gap: 22 }}>
      <style>{`
        @keyframes neo-timeline-glow{0%,100%{opacity:.45}50%{opacity:.85}}
      `}</style>

      {/* Header: blue square + label, plus a progress meta on the right. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 9, height: 9, borderRadius: 3, background: KIT_BLUE }} />
        <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: -0.3, color: theme.textStrong }}>
          {title}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: theme.textMuted,
          }}
        >
          {`FASE ${Math.min(current + 1, steps.length)}/${steps.length}`}
        </span>
      </div>

      {vertical ? (
        <VerticalRail steps={steps} stateOf={stateOf} theme={theme} />
      ) : (
        <HorizontalRail steps={steps} stateOf={stateOf} theme={theme} />
      )}
    </NeoCard>
  )
}

/* ── Horizontal: a row of nodes wired by one rail, title + caption beneath. ── */
function HorizontalRail({
  steps,
  stateOf,
  theme,
}: {
  steps: TimelineStep[]
  stateOf: (i: number) => NodeState
  theme: Theme
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, paddingTop: 4 }}>
      {steps.map((step, i) => {
        const state = stateOf(i)
        const isLast = i === steps.length - 1
        // The segment to the right of a node is lit once this node is settled.
        const lineColor = state === 'done' ? KIT_BLUE : theme.gridLine
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Node + the connector reaching to the next node. */}
            <div style={{ position: 'relative', height: NODE, display: 'flex', alignItems: 'center' }}>
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    right: 0,
                    top: '50%',
                    height: 3,
                    marginLeft: NODE / 2,
                    width: `calc(100% - ${NODE / 2}px)`,
                    transform: 'translateY(-50%)',
                    background: lineColor,
                    borderRadius: 2,
                  }}
                />
              )}
              <Node state={state} index={i} theme={theme} />
            </div>

            {/* Title + caption under the node. */}
            <div style={{ marginTop: 12, paddingRight: 8 }}>
              <Label step={step} state={state} theme={theme} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Vertical: mirrors the NeoReasoning rail — node left, content right. ── */
function VerticalRail({
  steps,
  stateOf,
  theme,
}: {
  steps: TimelineStep[]
  stateOf: (i: number) => NodeState
  theme: Theme
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {steps.map((step, i) => {
        const state = stateOf(i)
        const isLast = i === steps.length - 1
        // The segment below a node is lit once this node is settled.
        const lineColor = state === 'done' ? KIT_BLUE : theme.gridLine
        return (
          <div key={i} style={{ display: 'flex', gap: 16, marginBottom: isLast ? 0 : 22 }}>
            <div style={{ position: 'relative', width: NODE, flexShrink: 0 }}>
              {!isLast && (
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: NODE,
                    bottom: -22,
                    width: 3,
                    transform: 'translateX(-50%)',
                    background: lineColor,
                    borderRadius: 2,
                  }}
                />
              )}
              <Node state={state} index={i} theme={theme} />
            </div>
            <div style={{ paddingTop: 4, minWidth: 0 }}>
              <Label step={step} state={state} theme={theme} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ── Title + caption, dimmed for future phases, bold for the active one. ── */
function Label({ step, state, theme }: { step: TimelineStep; state: NodeState; theme: Theme }) {
  const muted = state === 'future'
  return (
    <>
      <div
        style={{
          fontSize: 13.5,
          lineHeight: '18px',
          letterSpacing: -0.2,
          fontWeight: state === 'active' ? 700 : 600,
          color: muted ? theme.textMuted : theme.textStrong,
        }}
      >
        {step.title}
      </div>
      {step.caption && (
        <div
          style={{
            marginTop: 3,
            fontSize: 11.5,
            lineHeight: '16px',
            letterSpacing: -0.1,
            color: theme.textMuted,
            opacity: muted ? 0.75 : 1,
          }}
        >
          {step.caption}
        </div>
      )}
    </>
  )
}

/* ── The node: blue check (done), blue ring (active), hollow dot (future). ── */
function Node({ state, index, theme }: { state: NodeState; index: number; theme: Theme }) {
  // Done — a filled blue circle with a white check, sitting on a soft shadow.
  if (state === 'done') {
    return (
      <div
        style={{
          width: NODE,
          height: NODE,
          borderRadius: '50%',
          background: KIT_BLUE,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 7px ${theme.shadow}`,
        }}
      >
        <Icon name="check" size={16} strokeWidth={2.6} color="#fff" />
      </div>
    )
  }

  // Active — a recessed well rimmed in a blue ring, carrying the phase number.
  if (state === 'active') {
    const well = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: NODE })
    return (
      <div
        style={{
          position: 'relative',
          width: NODE,
          height: NODE,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `2.5px solid ${KIT_BLUE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...well,
        }}
      >
        {/* A faint pulsing halo so the eye lands on "you are here". */}
        <span
          style={{
            position: 'absolute',
            inset: -5,
            borderRadius: '50%',
            border: `2px solid ${KIT_BLUE}`,
            opacity: 0.45,
            animation: 'neo-timeline-glow 2.4s ease-in-out infinite',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: KIT_BLUE, fontFamily: TEXT_FONT }}>
          {index + 1}
        </span>
      </div>
    )
  }

  // Future — a hollow muted dot carved into the surface, number inside.
  const well = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: NODE })
  return (
    <div
      style={{
        width: NODE,
        height: NODE,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: `2px solid ${theme.gridLine}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...well,
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: theme.textMuted, fontFamily: TEXT_FONT }}>
        {index + 1}
      </span>
    </div>
  )
}
