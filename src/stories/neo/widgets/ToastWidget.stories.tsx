import type { Meta, StoryObj } from '@storybook/react-vite'
import { ToastWidget } from './ToastWidget'

const meta = {
  title: 'Neo/Widgets/Toast',
  component: ToastWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    variant: 'success',
    title: 'Reporte semanal listo 📊',
    message: 'Te lo he dejado en Telegram. Échale un ojo cuando quieras, sin prisa.',
    time: 'ahora',
    onClose: () => {},
  },
} satisfies Meta<typeof ToastWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Stock bajo en 3 productos',
    message: 'Antes de que se agoten te aviso por Telegram. Tú decides; yo te lo recuerdo.',
    time: 'hace 2 min',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Tu agente ha cerrado 4 tareas',
    message: 'El curro aburrido ya está hecho. Esto es lo fácil: no te líes y revísalo.',
    time: 'hace 1 h',
  },
}
