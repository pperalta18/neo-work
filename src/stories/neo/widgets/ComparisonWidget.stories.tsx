import type { Meta, StoryObj } from '@storybook/react-vite'
import { ComparisonWidget } from './ComparisonWidget'

const meta = {
  title: 'Neo/Widgets/Comparison',
  component: ComparisonWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    aLabel: 'AiKit',
    bLabel: 'ChatGPT / otros',
  },
} satisfies Meta<typeof ComparisonWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const VsCopilot: Story = {
  args: {
    bLabel: 'Copilot',
    rows: [
      { label: 'Opera tu ERP', a: true, b: false },
      { label: 'Ejecuta acciones reales', a: true, b: 'partial' },
      { label: 'Memoria de tu negocio', a: true, b: false },
      { label: 'Integraciones nativas', a: true, b: 'partial' },
      { label: 'Datos alojados en Europa', a: true, b: false },
      { label: 'Construye software a medida', a: true, b: false },
    ],
  },
}

export const VsAsistente: Story = {
  args: {
    bLabel: 'Asistente humano',
    rows: [
      { label: 'Disponible 24/7', a: true, b: false },
      { label: 'No se cansa nunca', a: true, b: false },
      { label: 'Escala sin contratar', a: true, b: false },
      { label: 'Conoce el contexto', a: true, b: 'partial' },
      { label: 'Acciona en tus sistemas', a: true, b: 'partial' },
      { label: 'Cuesta una fracción', a: true, b: false },
    ],
  },
}
