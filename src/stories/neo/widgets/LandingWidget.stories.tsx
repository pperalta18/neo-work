import type { Meta, StoryObj } from '@storybook/react-vite'
import { LandingWidget } from './LandingWidget'

const meta = {
  title: 'Neo/Widgets/Landing',
  component: LandingWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    brand: 'AiKit',
    brandIcon: 'sparkles',
    nav: ['Producto', 'Precios', 'Docs'],
    cta: 'Empezar',
    eyebrow: 'Novedad',
    headline: 'Diseña ideas que cobran relieve',
    subhead: 'Compón conceptos sobre una rejilla neumórfica y míralos emerger.',
    primaryCta: 'Probar gratis',
    secondaryCta: 'Ver demo',
  },
} satisfies Meta<typeof LandingWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SaaS: Story = {
  args: {
    brand: 'Pulse',
    brandIcon: 'target',
    nav: ['Features', 'Pricing', 'Blog'],
    cta: 'Sign up',
    eyebrow: 'v2.0',
    headline: 'Analytics that feel tactile',
    subhead: 'Track every signal on a surface you can actually read.',
    primaryCta: 'Start free',
    secondaryCta: 'Book a call',
    features: [
      { icon: 'brain', title: 'Insights' },
      { icon: 'bell', title: 'Alerts' },
      { icon: 'flag', title: 'Goals' },
    ],
  },
}
