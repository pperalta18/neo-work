import type { ReactNode } from 'react'
import { useGrid } from '@/components/Grid'

/**
 * Small content primitives that live inside a <Cell>.
 * Text picks up theme colours; Chevron is a dependency-free icon.
 */

export function Label({ muted, children }: { muted?: ReactNode; children?: ReactNode }) {
  const { theme } = useGrid()
  return (
    <>
      {muted ? <span style={{ color: theme.textMuted }}>{muted}</span> : null}
      {children ? <span style={{ color: theme.textStrong }}>{children}</span> : null}
    </>
  )
}

export function Chevron({
  dir = 'down',
  size = 26,
}: {
  dir?: 'up' | 'down' | 'left' | 'right'
  size?: number
}) {
  const { theme } = useGrid()
  const rotate = { down: 0, up: 180, left: 90, right: -90 }[dir]
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.textMuted}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
