import type { Meta, StoryObj } from '@storybook/react-vite'
import { InvoiceWidget } from './InvoiceWidget'

const meta = {
  title: 'Neo/Widgets/Invoice',
  component: InvoiceWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    status: { control: 'select', options: ['paid', 'pending', 'overdue', 'draft'] },
    accent: {
      control: 'select',
      options: ['blue', 'teal', 'green', 'orange', 'violet', 'pink', 'red', 'purple', 'yellow'],
    },
    taxRate: { control: { type: 'range', min: 0, max: 0.3, step: 0.01 } },
  },
  args: {
    number: 'INV-0042',
    from: 'AiKit Studio',
    billTo: 'Acme S.L.',
    date: '29 May 2026',
    taxRate: 0.21,
    currency: '€',
    status: 'pending',
    accent: 'blue',
  },
} satisfies Meta<typeof InvoiceWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Paid: Story = {
  args: { status: 'paid', accent: 'green', number: 'INV-0039' },
}

export const Overdue: Story = {
  args: { status: 'overdue', accent: 'red', number: 'INV-0021', date: '14 Abr 2026' },
}

export const Draft: Story = {
  args: { status: 'draft', accent: 'teal', number: 'BORRADOR' },
}

export const CustomItems: Story = {
  args: {
    from: 'Lumen Films',
    billTo: 'Vega Media',
    number: 'INV-0103',
    accent: 'violet',
    status: 'paid',
    items: [
      { description: 'Producción vídeo', qty: 1, price: 3200 },
      { description: 'Edición (horas)', qty: 12, price: 65 },
      { description: 'Música licenciada', qty: 1, price: 450 },
    ],
  },
}
