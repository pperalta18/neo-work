import type { ReactNode } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
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

const NODE = 24

/**
 * NeoReasoning — an LLM chain-of-thought trace.
 * ──────────────────────────────────────────────
 * Renders a model's reasoning as a vertical chain of steps wired together by a
 * neumorphic rail: completed steps carry a blue check, the active step spins,
 * and pending steps sit muted below. Lit by the active NeoTheme.
 */
export function NeoReasoning({
  steps,
  title = 'Razonamiento',
  elapsed,
  width = 420,
  children,
}: NeoReasoningProps) {
  const theme = useNeoTheme()
  const card = elevation(theme, { depth: 'raised', distance: 10, blur: 24, radius: 26 })
  const badge = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 12 })

  return (
    <div
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
      <style>{`
        @keyframes neo-reason-spin{to{transform:rotate(360deg)}}
        @keyframes neo-reason-pulse{0%,100%{opacity:.55}50%{opacity:1}}
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 34,
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: KIT_BLUE,
            ...badge,
          }}
        >
          <Icon name="brain" size={19} strokeWidth={1.9} />
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
            }}
          >
            <Icon name="clock" size={13} strokeWidth={2} />
            {elapsed}
          </span>
        )}
      </div>

      {/* Chain */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, i) => {
          const status = step.status ?? 'pending'
          const isLast = i === steps.length - 1
          // The rail segment below a node is "lit" once the step is settled.
          const lineColor = status === 'done' ? KIT_BLUE : theme.gridLine
          const muted = status === 'pending'

          return (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: isLast ? 0 : 18 }}>
              {/* Rail + node */}
              <div style={{ position: 'relative', width: NODE, flexShrink: 0 }}>
                {!isLast && (
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: NODE,
                      bottom: -18,
                      width: 2,
                      transform: 'translateX(-50%)',
                      background: lineColor,
                      borderRadius: 1,
                    }}
                  />
                )}
                <Node status={status} />
              </div>

              {/* Content */}
              <div style={{ paddingTop: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14.5,
                    lineHeight: '21px',
                    letterSpacing: -0.2,
                    fontWeight: status === 'active' ? 600 : 500,
                    color: muted ? theme.textMuted : theme.textStrong,
                  }}
                >
                  {step.title}
                </div>
                {step.detail && (
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 12.5,
                      lineHeight: '18px',
                      color: theme.textMuted,
                      animation:
                        status === 'active'
                          ? 'neo-reason-pulse 1.6s ease-in-out infinite'
                          : undefined,
                    }}
                  >
                    {step.detail}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {children}
    </div>
  )
}

/** The marker on the rail: blue check (done), spinner (active), hollow dot (pending). */
function Node({ status }: { status: ReasoningStatus }) {
  const theme = useNeoTheme()

  if (status === 'done') {
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
          boxShadow: `0 2px 6px ${theme.shadow}`,
        }}
      >
        <Icon name="check" size={15} strokeWidth={2.4} color="#fff" />
      </div>
    )
  }

  if (status === 'active') {
    return (
      <div
        style={{
          width: NODE,
          height: NODE,
          borderRadius: '50%',
          boxSizing: 'border-box',
          border: `2.5px solid ${theme.gridLine}`,
          borderTopColor: KIT_BLUE,
          animation: 'neo-reason-spin 0.8s linear infinite',
        }}
      />
    )
  }

  // pending
  return (
    <div
      style={{
        width: NODE - 6,
        height: NODE - 6,
        margin: 3,
        borderRadius: '50%',
        boxSizing: 'border-box',
        border: `2px solid ${theme.gridLine}`,
        background: theme.surface,
      }}
    />
  )
}
