import type { Meta, StoryObj } from '@storybook/react-vite'
import { AikitLogo } from '@/components/AikitLogo'

const meta = {
  title: 'Neo/Brand/Aikit Logo',
  component: AikitLogo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { height: 56, tone: 'light' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['light', 'dark'] },
    height: { control: { type: 'range', min: 16, max: 160, step: 4 } },
  },
} satisfies Meta<typeof AikitLogo>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  args: { tone: 'light' },
  render: (args) => (
    <div style={{ padding: 56, background: '#f4f4fa', borderRadius: 16 }}>
      <AikitLogo {...args} />
    </div>
  ),
}

export const Dark: Story = {
  args: { tone: 'dark' },
  render: (args) => (
    <div style={{ padding: 56, background: '#0d0d11', borderRadius: 16 }}>
      <AikitLogo {...args} />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 32, alignItems: 'center', padding: 48, background: '#f4f4fa', borderRadius: 16 }}>
      {[24, 40, 64, 96].map((h) => (
        <AikitLogo key={h} height={h} />
      ))}
    </div>
  ),
}
