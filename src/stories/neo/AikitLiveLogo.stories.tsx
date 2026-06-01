import type { Meta, StoryObj } from '@storybook/react-vite'
import { AikitLiveLogo } from '@/components/AikitLiveLogo'

const meta = {
  title: 'Neo/Brand/Aikit Live Logo',
  component: AikitLiveLogo,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { height: 64, tone: 'light' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['light', 'dark'] },
    height: { control: { type: 'range', min: 16, max: 200, step: 4 } },
  },
} satisfies Meta<typeof AikitLiveLogo>

export default meta
type Story = StoryObj<typeof meta>

export const Light: Story = {
  args: { tone: 'light' },
  render: (args) => (
    <div style={{ padding: 56, background: '#f4f4fa', borderRadius: 16 }}>
      <AikitLiveLogo {...args} />
    </div>
  ),
}

export const Dark: Story = {
  args: { tone: 'dark' },
  render: (args) => (
    <div style={{ padding: 56, background: '#0d0d11', borderRadius: 16 }}>
      <AikitLiveLogo {...args} />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'flex-start', padding: 48, background: '#f4f4fa', borderRadius: 16 }}>
      {[28, 48, 72, 104].map((h) => (
        <AikitLiveLogo key={h} height={h} />
      ))}
    </div>
  ),
}
