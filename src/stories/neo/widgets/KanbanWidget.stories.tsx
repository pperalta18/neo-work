import type { Meta, StoryObj } from '@storybook/react-vite'
import { KanbanWidget } from './KanbanWidget'

const meta = {
  title: 'Neo/Widgets/Kanban',
  component: KanbanWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { title: 'Sprint 14' },
} satisfies Meta<typeof KanbanWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Roadmap: Story = {
  args: {
    title: 'Roadmap Q3',
    columns: [
      {
        title: 'Backlog',
        cards: [
          { title: 'Modo oscuro', tag: 'UI', color: 'violet', people: 1 },
          { title: 'Exportar a PDF', tag: 'Feature', color: 'blue', people: 2 },
          { title: 'i18n', tag: 'Plataforma', color: 'teal' },
        ],
      },
      {
        title: 'En curso',
        cards: [{ title: 'Facturación', tag: 'Pagos', color: 'orange', people: 3 }],
      },
      {
        title: 'Revisión',
        cards: [{ title: 'Búsqueda global', tag: 'Search', color: 'pink', people: 2 }],
      },
    ],
  },
}
