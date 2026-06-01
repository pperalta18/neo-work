import type { Meta, StoryObj } from '@storybook/react-vite'
import { StatWidget } from './StatWidget'

const meta = {
  title: 'Neo/Widgets/Stat',
  component: StatWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    label: 'Tiempo por contratación',
    value: '75 s',
    delta: -98,
    deltaCaption: 'vs. el proceso a mano',
  },
} satisfies Meta<typeof StatWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ConSparkline: Story = {
  args: {
    label: 'Candidatos por semana',
    value: '1.284',
    delta: 23.5,
    deltaCaption: 'y subiendo, ojo',
    sparkline: [12, 18, 15, 22, 19, 28, 26, 34, 31, 42],
  },
}

export const Comparacion: Story = {
  args: {
    label: 'Antes vs. con AiKit',
    before: '78 min',
    after: '75 s',
    delta: -98,
    accent: 'teal',
  },
}
