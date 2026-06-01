import type { Meta, StoryObj } from '@storybook/react-vite'
import { LoyaltyCardWidget } from './LoyaltyCardWidget'

const meta = {
  title: 'Neo/Widgets/Loyalty',
  component: LoyaltyCardWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    name: 'Pablo Peralta',
    tier: 'Socio Gold',
    points: '1.240 pts',
    nextRewardPts: 60,
    progress: 0.78,
    walletBalance: '€24,50',
    scheme: 'gold',
  },
} satisfies Meta<typeof LoyaltyCardWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Blue: Story = {
  args: {
    name: 'Marta Ruiz',
    tier: 'Socio Blue',
    points: '860 pts',
    nextRewardPts: 140,
    progress: 0.46,
    walletBalance: '€12,00',
    scheme: 'blue',
  },
}

export const CasiUnaRecompensa: Story = {
  args: {
    name: 'Lucía Gómez',
    tier: 'Socio Gold',
    points: '2.940 pts',
    nextRewardPts: 10,
    progress: 0.95,
    walletBalance: '€48,30',
    scheme: 'gold',
  },
}
