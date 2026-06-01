import type { ReactNode } from 'react'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type ScheduleWidgetProps = {
  children?: ReactNode
}

/** ScheduleWidget — a round mic action over a soft prompt line. */
export function ScheduleWidget({ children }: ScheduleWidgetProps) {
  const theme = useNeoTheme()
  return (
    <NeoCard width={260} center={false} style={{ minHeight: 230, gap: 24, alignItems: 'flex-start' }}>
      <NeoButton size="lg" icon="mic" iconOnly accent />
      <div style={{ fontSize: 22, lineHeight: '30px', color: theme.textMuted }}>
        {children ?? (
          <>
            Schedule a call with{' '}
            <strong style={{ color: theme.textStrong, fontWeight: 600 }}>Oliver</strong> on{' '}
            <strong style={{ color: theme.textStrong, fontWeight: 600 }}>Tuesday</strong>
          </>
        )}
      </div>
    </NeoCard>
  )
}
