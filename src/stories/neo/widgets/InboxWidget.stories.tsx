import type { Meta, StoryObj } from '@storybook/react-vite'
import { InboxWidget } from './InboxWidget'

const meta = {
  title: 'Neo/Widgets/Inbox',
  component: InboxWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    title: 'Bandeja',
  },
} satisfies Meta<typeof InboxWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SoloWhatsApp: Story = {
  args: {
    title: 'WhatsApp',
    items: [
      {
        channel: 'whatsapp',
        sender: 'Lucía Marín',
        preview: '¿Me podéis pasar el presupuesto antes del viernes? 🙏',
        time: '2 min',
        unread: true,
        selected: true,
      },
      {
        channel: 'whatsapp',
        sender: 'Pedidos · Tienda',
        preview: 'Nuevo pedido #1042 — y este lo gestiona el bot solito.',
        time: '40 min',
        unread: true,
      },
      {
        channel: 'whatsapp',
        sender: 'Marta R.',
        preview: 'Gracias, sois la caña 💚',
        time: '2 h',
      },
    ],
  },
}

export const TodoLeido: Story = {
  args: {
    title: 'Al día',
    items: [
      {
        channel: 'email',
        sender: 'Carlos Vidal',
        preview: 'Cerrado. Lo aburrido os lo coméis vosotros 😅',
        time: 'Ayer',
      },
      {
        channel: 'chat',
        sender: 'Visitante #4821',
        preview: 'Resuelto sin que tocara nadie. Magia.',
        time: 'Ayer',
      },
      {
        channel: 'web',
        sender: 'Formulario · Contacto',
        preview: 'Respondido y archivado. A otra cosa.',
        time: '2 d',
      },
    ],
  },
}
