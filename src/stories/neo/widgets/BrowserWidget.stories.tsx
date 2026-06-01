import type { Meta, StoryObj } from '@storybook/react-vite'
import { BrowserWidget } from './BrowserWidget'

const meta = {
  title: 'Neo/Widgets/Browser',
  component: BrowserWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    secure: { control: 'boolean' },
  },
  args: { url: 'aikit.es', title: 'AiKit', secure: true },
} satisfies Meta<typeof BrowserWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Insecure: Story = {
  args: { url: 'example.com', title: 'Example', secure: false },
}

export const CustomContent: Story = {
  args: {
    url: 'dashboard.aikit.es',
    title: 'Dashboard',
    children: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 80,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #aab4c4, #c7d0dd)',
              opacity: 0.5,
            }}
          />
        ))}
      </div>
    ),
  },
}
