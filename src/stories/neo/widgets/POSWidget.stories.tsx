import type { Meta, StoryObj } from '@storybook/react-vite'
import { POSWidget } from './POSWidget'

const meta = {
  title: 'Neo/Widgets/POS',
  component: POSWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    taxRate: { control: { type: 'range', min: 0, max: 0.3, step: 0.01 } },
    offlineHint: { control: 'boolean' },
  },
  args: {
    currency: '€',
    taxRate: 0.1,
    cashier: 'Cajero 02',
    offlineHint: true,
  },
} satisfies Meta<typeof POSWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Bar: Story = {
  args: {
    cashier: 'Barra 01',
    items: [
      { name: 'Caña', qty: 3, price: 2.0 },
      { name: 'Vino tinto', qty: 2, price: 2.8 },
      { name: 'Patatas bravas', qty: 1, price: 4.5 },
      { name: 'Aceitunas', qty: 1, price: 2.2 },
    ],
  },
}

export const Tienda: Story = {
  args: {
    cashier: 'Cajero 04',
    taxRate: 0.21,
    offlineHint: false,
    items: [
      { name: 'Camiseta algodón', qty: 1, price: 19.9 },
      { name: 'Calcetines (pack 3)', qty: 2, price: 7.5 },
      { name: 'Gorra', qty: 1, price: 14.0 },
    ],
  },
}
