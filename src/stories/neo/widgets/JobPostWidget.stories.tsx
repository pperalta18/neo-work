import type { Meta, StoryObj } from '@storybook/react-vite'
import { JobPostWidget } from './JobPostWidget'

const meta = {
  title: 'Neo/Widgets/JobPost',
  component: JobPostWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof JobPostWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ProductDesigner: Story = {
  args: {
    role: 'Diseñador/a de Producto',
    location: 'Remoto · España',
    type: 'Media jornada',
    summary: 'Tú diseñas pantallas bonitas; nosotros cribamos los 200 CVs por ti.',
    skills: ['Figma', 'Prototipado', 'Research'],
    candidate: {
      name: 'Leo Vidal',
      note: 'Portfolio limpio y obsesión sana por el detalle.',
      match: 88,
    },
  },
}

export const BackendOnSite: Story = {
  args: {
    role: 'Ingeniero/a Backend',
    location: 'Valencia · Presencial',
    type: 'Jornada completa',
    summary: 'Danos el marrón de filtrar perfiles: tú solo decides a quién contratas.',
    skills: ['Node', 'PostgreSQL', 'AWS', 'Go'],
    candidate: {
      name: 'Ana Suárez',
      note: 'Escaló una API a millones de peticiones sin despeinarse.',
      match: 95,
    },
  },
}
