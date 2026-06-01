import type { Meta, StoryObj } from '@storybook/react-vite'
import { TimelineWidget } from './TimelineWidget'

const meta = {
  title: 'Neo/Widgets/Timeline',
  component: TimelineWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { current: 2 },
} satisfies Meta<typeof TimelineWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    title: 'Cómo lo montamos',
    current: 1,
  },
}

export const Onboarding: Story = {
  args: {
    title: 'Onboarding en 4 pasos',
    current: 3,
    steps: [
      { title: 'Cuéntanos el marrón', caption: 'Eso que odias hacer cada lunes' },
      { title: 'Lo conectamos', caption: 'Con tus herramientas de siempre' },
      { title: 'Lo probamos juntos', caption: 'Sin prisa, sin liarte' },
      { title: 'Funciona solo', caption: 'Y tú a lo tuyo' },
    ],
  },
}
