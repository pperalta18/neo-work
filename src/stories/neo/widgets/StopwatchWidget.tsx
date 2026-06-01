import { DISPLAY_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type StopwatchWidgetProps = {
  title?: string
  time?: string
}

/** StopwatchWidget — title, large elapsed time, pause + stop actions. */
export function StopwatchWidget({
  title = 'Stopwatch',
  time = '01:32:05',
}: StopwatchWidgetProps) {
  const theme = useNeoTheme()
  return (
    <NeoCard width={260} style={{ minHeight: 260, gap: 26 }}>
      <div style={{ fontSize: 18, color: theme.textMuted }}>{title}</div>
      <div
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 300,
          fontSize: 44,
          lineHeight: 1,
          letterSpacing: -1,
          color: theme.textMuted,
        }}
      >
        {time}
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <NeoButton size="sm" icon="pause" iconOnly />
        <NeoButton size="sm" icon="close" iconOnly />
      </div>
    </NeoCard>
  )
}
