import type { Meta, StoryObj } from '@storybook/react-vite'
import { BRAND } from '@/lib/neumorphism'
import { useNeoTheme } from './NeoTheme'

const meta = {
  title: 'Neo/Brand Palette',
  parameters: { layout: 'centered' },
} satisfies Meta

export default meta
type Story = StoryObj

function Swatches() {
  const theme = useNeoTheme()
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 18,
        fontFamily: "'Universal Sans Text', system-ui, sans-serif",
      }}
    >
      {Object.entries(BRAND).map(([name, hex]) => (
        <div key={name} style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 150 }}>
          <div
            style={{
              height: 88,
              borderRadius: 18,
              background: hex,
              boxShadow: '0 8px 22px rgba(60,80,120,0.18)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: theme.textStrong, textTransform: 'capitalize' }}>
              {name}
            </span>
            <span style={{ color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>{hex}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export const Brand: Story = { render: () => <Swatches /> }
