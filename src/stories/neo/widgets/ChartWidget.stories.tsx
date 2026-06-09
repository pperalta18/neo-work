import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChartWidget } from './ChartWidget'

const meta = {
  title: 'Neo/Widgets/Chart',
  component: ChartWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ChartWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Otra serie, otro acento: ingresos del trimestre subiendo fuerte.
export const Ingresos: Story = {
  args: {
    title: 'Ingresos',
    accent: 'blue',
    delta: '+24,1%',
    data: [12, 14, 13, 18, 17, 22, 26],
    labels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'],
  },
}

// Mes flojo: la cosa baja, el badge se pone rojo solo.
export const Caida: Story = {
  args: {
    title: 'Margen',
    accent: 'orange',
    delta: '-9,2%',
    data: [8800, 8200, 7600, 7900, 6400, 5950],
    labels: ['Dic', 'Ene', 'Feb', 'Mar', 'Abr', 'May'],
  },
}

// `valueFormat="percent"`: el pico se rotula como % (p. ej. cobertura semanal).
export const Porcentaje: Story = {
  args: {
    title: 'Cobertura semanal',
    accent: 'blue',
    delta: '+18%',
    valueFormat: 'percent',
    data: [72, 76, 82, 88, 95, 100, 100],
    labels: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
  },
}
