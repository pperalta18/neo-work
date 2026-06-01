import type { Meta, StoryObj } from '@storybook/react-vite'
import { CalendarDay } from './CalendarWidget'

const meta = {
  title: 'Neo/Widgets/Calendar/Día',
  component: CalendarDay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    focusWeekday: { control: { type: 'range', min: 0, max: 6, step: 1 } },
  },
  args: { title: 'Mar 12', focusWeekday: 1 },
} satisfies Meta<typeof CalendarDay>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Empty: Story = {
  args: { events: [], title: 'Dom 17', focusWeekday: 6 },
}

export const FullDay: Story = {
  args: {
    title: 'Lun 11',
    focusWeekday: 0,
    events: [
      { title: 'Standup', color: 'blue', weekday: 0, start: 9, end: 9.5 },
      { title: 'Diseño de marca', color: 'violet', weekday: 0, start: 10, end: 12 },
      { title: 'Comida', color: 'orange', weekday: 0, start: 13.5, end: 14.5 },
      { title: 'Review de sprint', color: 'green', weekday: 0, start: 15, end: 16.5 },
      { title: 'Demo cliente', color: 'pink', weekday: 0, start: 17, end: 18 },
    ],
  },
}
