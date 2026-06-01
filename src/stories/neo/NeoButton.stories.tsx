import type { Meta, StoryObj } from '@storybook/react-vite'
import { ICON_NAMES } from '@/components/icons'
import { BRAND } from '@/lib/neumorphism'
import { NeoButton } from './NeoButton'

const meta = {
  title: 'Neo/NeoButton',
  component: NeoButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
    icon: { control: 'select', options: [undefined, ...ICON_NAMES] },
    iconPosition: { control: 'inline-radio', options: ['left', 'right'] },
    iconOnly: { control: 'boolean' },
    accent: { control: 'boolean' },
    tone: { control: 'inline-radio', options: ['default', 'solid'] },
    fill: { control: 'color' },
    distance: { control: { type: 'range', min: 0, max: 24, step: 1 } },
    blur: { control: { type: 'range', min: 0, max: 48, step: 1 } },
    radius: { control: { type: 'range', min: 0, max: 48, step: 1 } },
    disabled: { control: 'boolean' },
    onClick: { action: 'clicked' },
  },
  args: { children: 'Pulsar', size: 'md' },
} satisfies Meta<typeof NeoButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Accent: Story = {
  args: { accent: true, children: 'Empezar' },
}

export const Disabled: Story = {
  args: { disabled: true },
}

export const IconLeft: Story = {
  args: { icon: 'sparkles', children: 'Generar' },
}

export const IconRight: Story = {
  args: { icon: 'arrow', iconPosition: 'right', children: 'Siguiente', accent: true },
}

export const IconOnly: Story = {
  args: { icon: 'mic', iconOnly: true, children: undefined },
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
      <NeoButton size="sm" icon="star">
        Small
      </NeoButton>
      <NeoButton size="md" icon="star">
        Medium
      </NeoButton>
      <NeoButton size="lg" icon="star">
        Large
      </NeoButton>
    </div>
  ),
}

export const IconOnlyRow: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <NeoButton icon="mic" iconOnly />
      <NeoButton icon="calendar" iconOnly />
      <NeoButton icon="target" iconOnly accent />
      <NeoButton icon="check" iconOnly />
      <NeoButton icon="flag" iconOnly />
    </div>
  ),
}

export const Solid: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 14 }}>
      <NeoButton icon="close" iconOnly tone="solid" />
      <NeoButton icon="call" iconOnly tone="solid" fill={BRAND.red} />
      <NeoButton icon="check" iconOnly tone="solid" fill={BRAND.green} />
      <NeoButton tone="solid" fill={BRAND.blue}>
        Solid
      </NeoButton>
    </div>
  ),
}

export const Elevation: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
      <NeoButton distance={2} blur={4}>
        Flush
      </NeoButton>
      <NeoButton distance={6} blur={12}>
        Default
      </NeoButton>
      <NeoButton distance={12} blur={24}>
        Floating
      </NeoButton>
      <NeoButton distance={20} blur={36} accent>
        High
      </NeoButton>
    </div>
  ),
}

export const Gallery: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, maxWidth: 520 }}>
      {ICON_NAMES.map((name) => (
        <NeoButton key={name} icon={name}>
          {name}
        </NeoButton>
      ))}
    </div>
  ),
}
