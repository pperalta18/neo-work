import type { Meta, StoryObj } from '@storybook/react-vite'
import { NeoSurface } from './NeoSurface'

const meta = {
  title: 'Neo/NeoSurface',
  component: NeoSurface,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    depth: { control: 'inline-radio', options: ['raised', 'recessed', 'flat'] },
    distance: { control: { type: 'range', min: 0, max: 24, step: 1 } },
    blur: { control: { type: 'range', min: 0, max: 48, step: 1 } },
    radius: { control: { type: 'range', min: 0, max: 64, step: 1 } },
    padding: { control: { type: 'range', min: 0, max: 80, step: 2 } },
    align: { control: 'inline-radio', options: ['start', 'center', 'end'] },
  },
  args: {
    depth: 'raised',
    radius: 24,
    padding: 40,
    children: 'Neo surface',
    style: { minWidth: 220, minHeight: 120 },
  },
} satisfies Meta<typeof NeoSurface>

export default meta
type Story = StoryObj<typeof meta>

export const Raised: Story = {}

export const Recessed: Story = {
  args: { depth: 'recessed', children: 'Carved in' },
}

export const Flat: Story = {
  args: { depth: 'flat', children: 'Flat' },
}

export const AllDepths: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
      <NeoSurface depth="raised" style={{ minWidth: 180, minHeight: 120 }}>
        Raised
      </NeoSurface>
      <NeoSurface depth="recessed" style={{ minWidth: 180, minHeight: 120 }}>
        Recessed
      </NeoSurface>
      <NeoSurface depth="flat" style={{ minWidth: 180, minHeight: 120 }}>
        Flat
      </NeoSurface>
    </div>
  ),
}
