import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarMonth } from './CalendarWidget'

const meta = {
  title: 'Neo/Widgets/Calendar/Mes',
  component: CalendarMonth,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    today: { control: { type: 'range', min: 1, max: 31, step: 1 } },
  },
  args: { title: 'Mayo 2026', today: 12 },
} satisfies Meta<typeof CalendarMonth>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { events: [], today: 8 },
}

export const CustomEvents: Story = {
  args: {
    title: 'Junio 2026',
    today: 5,
    events: [
      { title: 'Kickoff', color: 'blue', date: 2 },
      { title: 'Workshop', color: 'violet', date: 5 },
      { title: 'Entrega', color: 'green', date: 5 },
      { title: 'Retro', color: 'orange', date: 19 },
      { title: 'Lanzamiento', color: 'pink', date: 26 },
    ],
  },
}
