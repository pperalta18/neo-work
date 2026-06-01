import type { ReactNode } from 'react'
import { BRAND, elevation, KIT_BLUE } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type BrowserWidgetProps = {
  url?: string
  title?: string
  /** Secure padlock in the address bar. */
  secure?: boolean
  /** Custom page content; defaults to a soft skeleton mock. */
  children?: ReactNode
}

/**
 * BrowserWidget — a neumorphic browser window.
 * ─────────────────────────────────────────────
 * Tab strip + traffic dots, a toolbar (back / forward / reload + a recessed
 * address bar) and a recessed viewport showing the page.
 */
export function BrowserWidget({
  url = 'aikit.es',
  title = 'AiKit',
  secure = true,
  children,
}: BrowserWidgetProps) {
  const theme = useNeoTheme()
  const addressBar = elevation(theme, { depth: 'recessed', distance: 3, blur: 6, radius: 999 })
  const viewport = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const activeTab = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 12 })

  const dot = (c: string) => (
    <div style={{ width: 11, height: 11, borderRadius: '50%', background: c, boxShadow: `inset 0 0 0 1px rgba(0,0,0,0.04)` }} />
  )

  return (
    <NeoCard width={460} center={false} padding={18} radius={26} style={{ gap: 14 }}>
      {/* Tab strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {dot(BRAND.red)}
          {dot(BRAND.orange)}
          {dot(BRAND.green)}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 14px',
            fontSize: 13,
            color: theme.textStrong,
            ...activeTab,
          }}
        >
          <Icon name="global" size={14} color={theme.textMuted} />
          {title}
        </div>
        <span style={{ fontSize: 13, color: theme.textMuted, opacity: 0.6 }}>New tab</span>
        <div style={{ marginLeft: 'auto' }}>
          <NeoButton size="sm" icon="plus" iconOnly />
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NeoButton size="sm" icon="back" iconOnly />
        <NeoButton size="sm" icon="arrow" iconOnly />
        <NeoButton size="sm" icon="reload" iconOnly />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 16px',
            fontSize: 14,
            color: theme.textMuted,
            ...addressBar,
          }}
        >
          {secure && <Icon name="lock" size={14} color={theme.textMuted} />}
          <span style={{ color: theme.textStrong }}>{url}</span>
        </div>
      </div>

      {/* Viewport */}
      <div style={{ padding: 16, minHeight: 180, ...viewport }}>
        {children ?? <MockPage accent={KIT_BLUE} muted={theme.textMuted} />}
      </div>
    </NeoCard>
  )
}

/** A soft placeholder webpage: hero band + heading + skeleton lines + tiles. */
function MockPage({ accent, muted }: { accent: string; muted: string }) {
  const bar = (w: string | number, h = 10) => (
    <div style={{ width: w, height: h, borderRadius: 6, background: muted, opacity: 0.28 }} />
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div
        style={{
          height: 56,
          borderRadius: 12,
          background: `linear-gradient(120deg, ${accent}, #5aa6ff)`,
          opacity: 0.9,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {bar('70%', 13)}
        {bar('100%')}
        {bar('92%')}
        {bar('60%')}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ flex: 1, height: 44, borderRadius: 10, background: muted, opacity: 0.16 }}
          />
        ))}
      </div>
    </div>
  )
}
