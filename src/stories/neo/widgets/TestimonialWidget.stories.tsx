import type { Meta, StoryObj } from '@storybook/react-vite'
import { TestimonialWidget } from './TestimonialWidget'

const meta = {
  title: 'Neo/Widgets/Testimonial',
  component: TestimonialWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof TestimonialWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Founder: Story = {
  args: {
    quote: 'Antes vivía pegada al correo y las facturas. Ahora AiKit hace el muermo y yo me dedico a lo mío.',
    name: 'Lucía Ferrán',
    role: 'CEO · Brota Studio',
    rating: 5,
    starColor: 'yellow',
  },
}

export const NoRating: Story = {
  args: {
    quote: 'Le solté todo el papeleo que odiaba y me lo devolvió hecho. De verdad, esto es lo fácil.',
    name: 'Diego Salas',
    role: 'Autónomo · Reformas DS',
    rating: 0,
  },
}
