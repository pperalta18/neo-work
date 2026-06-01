import { BRAND } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type CallWidgetProps = {
  name?: string
  duration?: string
  /** Optional avatar image; falls back to a soft gradient tile. */
  avatar?: string
}

/** CallWidget — avatar, caller name + duration, dial-pad / mute / hang-up. */
export function CallWidget({
  name = 'Sarah Jenkins',
  duration = '3:08 mins',
  avatar,
}: CallWidgetProps) {
  const theme = useNeoTheme()
  return (
    <NeoCard width={260} style={{ minHeight: 260, gap: 16 }}>
      <div
        style={{
          width: 84,
          height: 84,
          borderRadius: 20,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          background: avatar
            ? `center / cover no-repeat url(${avatar})`
            : 'linear-gradient(150deg, #aab4c4, #7f8b9f)',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: theme.textStrong }}>{name}</div>
        <div style={{ marginTop: 2, fontSize: 14, color: theme.textMuted }}>{duration}</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
        <NeoButton size="sm" icon="dialpad" iconOnly />
        <NeoButton size="sm" icon="micOff" iconOnly />
        <NeoButton size="sm" icon="call" iconOnly tone="solid" fill={BRAND.red} />
      </div>
    </NeoCard>
  )
}
