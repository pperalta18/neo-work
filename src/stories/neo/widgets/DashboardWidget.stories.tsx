import type { Meta, StoryObj } from '@storybook/react-vite'
import { DashboardWidget } from './DashboardWidget'

const meta = {
  title: 'Neo/Widgets/Dashboard',
  component: DashboardWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DashboardWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Trimestre: Story = {
  args: {
    range: 'Este trimestre',
    chartSpan: ['1 abr', '30 jun'],
    kpis: [
      { label: 'Ingresos', value: '78,4k €', delta: '+21%', trend: 'up' },
      { label: 'Clientes', value: '342', delta: '+15%', trend: 'up' },
      { label: 'Bajas', value: '11', delta: '+4%', trend: 'down' },
    ],
    chart: [0.28, 0.36, 0.45, 0.42, 0.58, 0.66, 0.61, 0.78, 0.88, 0.97],
    priorities: [
      { label: 'Urgente', count: 9, color: 'red' },
      { label: 'Alta', count: 41, color: 'orange' },
      { label: 'Media', count: 88, color: 'blue' },
      { label: 'Baja', count: 36, color: 'green' },
    ],
  },
}

export const SoporteHoy: Story = {
  args: {
    title: 'Soporte · hoy',
    range: 'Hoy',
    chartSpan: ['00:00', '23:59'],
    kpis: [
      { label: 'Recibidos', value: '146', delta: '+19%', trend: 'up' },
      { label: 'Resueltos', value: '88%', delta: '+6%', trend: 'up' },
      { label: 'Espera media', value: '4m', delta: '-12%', trend: 'down' },
    ],
    priorities: [
      { label: 'Urgente', count: 6, color: 'red' },
      { label: 'Alta', count: 19, color: 'orange' },
      { label: 'Media', count: 33, color: 'teal' },
    ],
  },
}
