import type { Meta, StoryObj } from '@storybook/react-vite'
import { SignatureWidget } from './SignatureWidget'

const meta = {
  title: 'Neo/Widgets/Signature',
  component: SignatureWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    signer: 'María López',
    role: 'Directora de Operaciones',
    date: '30 may 2026',
    docTitle: 'Contrato de empleo · María López',
    signed: true,
  },
} satisfies Meta<typeof SignatureWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const PorFirmar: Story = {
  args: {
    signed: false,
    date: 'Pendiente',
  },
}

export const Acuerdo: Story = {
  args: {
    docTitle: 'Acuerdo de confidencialidad · Acme S.L.',
    signer: 'Jorge Ferrer',
    role: 'CEO · Acme S.L.',
    date: '12 abr 2026',
  },
}
