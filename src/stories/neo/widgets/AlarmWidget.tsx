import { DISPLAY_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type AlarmWidgetProps = {
  time?: string
  label?: string
}

/** AlarmWidget — bell, big time, SNOOZE + dismiss action. */
export function AlarmWidget({ time = '8:30', label = 'Alarm' }: AlarmWidgetProps) {
  const theme = useNeoTheme()
  return (
    <NeoCard width={260} style={{ minHeight: 260, gap: 22 }}>
      <Icon name="bell" size={32} color={theme.textMuted} />
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontFamily: DISPLAY_FONT,
            fontWeight: 300,
            fontSize: 56,
            lineHeight: 1,
            letterSpacing: -1,
            color: theme.textMuted,
          }}
        >
          {time}
        </div>
        <div style={{ marginTop: 6, fontSize: 15, color: theme.textMuted }}>{label}</div>
      </div>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 4 }}>
        <NeoButton size="sm">SNOOZE</NeoButton>
        <NeoButton size="sm" icon="close" iconOnly tone="solid" />
      </div>
    </NeoCard>
  )
}
