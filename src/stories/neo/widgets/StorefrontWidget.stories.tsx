import type { Meta, StoryObj } from '@storybook/react-vite'
import { StorefrontWidget } from './StorefrontWidget'

const meta = {
  title: 'Neo/Widgets/Storefront',
  component: StorefrontWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof StorefrontWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CaféDeBarrio: Story = {
  args: {
    store: 'Café de Barrio',
    cart: 1,
    products: [
      { name: 'Grano natural', price: '€11', color: 'orange', tag: 'Nuevo' },
      { name: 'Cold brew', price: '€5', color: 'teal' },
      { name: 'Taza cerámica', price: '€16', color: 'pink' },
      { name: 'Pack cata', price: '€29', color: 'violet', tag: '-15%' },
    ],
  },
}

export const CarritoVacío: Story = {
  args: {
    store: 'Plantas & Co',
    cart: 0,
    products: [
      { name: 'Monstera mini', price: '€19', color: 'green', tag: 'Nuevo' },
      { name: 'Maceta barro', price: '€8', color: 'orange' },
      { name: 'Riego auto', price: '€22', color: 'blue' },
    ],
  },
}
