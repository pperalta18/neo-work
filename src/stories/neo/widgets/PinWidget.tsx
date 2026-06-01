import { elevation } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type PinWidgetProps = {
  title?: string
  /** Number of PIN slots. */
  length?: number
  /** How many slots are filled (shows a dot). */
  filled?: number
}

/** PinWidget — label, a row of recessed PIN slots, UNLOCK action. */
export function PinWidget({ title = 'Enter PIN', length = 4, filled = 0 }: PinWidgetProps) {
  const theme = useNeoTheme()
  const slot = elevation(theme, { depth: 'recessed', distance: 4, blur: 8, radius: 12 })

  return (
    <NeoCard width={260} style={{ minHeight: 260, gap: 26 }}>
      <div style={{ fontSize: 18, color: theme.textMuted }}>{title}</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 34,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              ...slot,
            }}
          >
            {i < filled && (
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: theme.textMuted,
                }}
              />
            )}
          </div>
        ))}
      </div>
      <NeoButton size="sm" icon="lock">
        UNLOCK
      </NeoButton>
    </NeoCard>
  )
}
