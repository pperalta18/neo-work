import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarWeek } from './CalendarWidget'

const meta = {
  title: 'Neo/Widgets/Calendar/Semana',
  component: CalendarWeek,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { title: 'Mayo 2026' },
} satisfies Meta<typeof CalendarWeek>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { events: [] },
}

export const Busy: Story = {
  args: {
    title: '11–17 May',
    events: [
      { title: 'Standup', color: 'blue', weekday: 0, start: 9, end: 9.5 },
      { title: 'Diseño', color: 'violet', weekday: 0, start: 11, end: 12.5 },
      { title: '1:1', color: 'teal', weekday: 1, start: 10, end: 10.5 },
      { title: 'Comida', color: 'orange', weekday: 1, start: 14, end: 15 },
      { title: 'Taller', color: 'green', weekday: 2, start: 12, end: 14 },
      { title: 'Review', color: 'pink', weekday: 3, start: 16, end: 17 },
      { title: 'Demo', color: 'blue', weekday: 4, start: 10, end: 11 },
      { title: 'Planning', color: 'violet', weekday: 4, start: 12, end: 13.5 },
    ],
  },
}
