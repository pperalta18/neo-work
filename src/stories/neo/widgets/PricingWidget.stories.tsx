import type { Meta, StoryObj } from '@storybook/react-vite'
import { PricingWidget } from './PricingWidget'

const meta = {
  title: 'Neo/Widgets/Pricing',
  component: PricingWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    plan: 'Pro',
    price: '€49',
    period: '/mes',
    tagline: 'Para los que ya no quieren tocar el trabajo aburrido.',
    cta: 'Empezar',
    highlighted: false,
    popular: true,
  },
} satisfies Meta<typeof PricingWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Highlighted: Story = {
  args: { highlighted: true, popular: true },
}

export const Starter: Story = {
  args: {
    plan: 'Starter',
    price: '€0',
    period: '/siempre',
    tagline: 'Pruébalo sin tarjeta. En serio, es lo fácil, no te líes.',
    popular: false,
    highlighted: false,
    cta: 'Probar gratis',
    features: [
      'Hasta 100 conversaciones',
      '3 módulos a elegir',
      'Una integración',
      'Soporte por email',
    ],
  },
}
