import type { Meta, StoryObj } from '@storybook/react-vite'
import { SecurityWidget } from './SecurityWidget'

const meta = {
  title: 'Neo/Widgets/Security',
  component: SecurityWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    title: 'Tus datos son solo tuyos',
    points: [
      'Alojados en Europa 🇪🇺',
      'No entrenamos modelos con tus datos · DPA',
      'Cifrado extremo y acceso granular',
      'Cumple verifactu y normativa IA',
    ],
  },
} satisfies Meta<typeof SecurityWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Compacto: Story = {
  args: {
    title: 'Privacidad de serie',
    points: [
      'Tus datos no salen de Europa 🇪🇺',
      'Cifrado de extremo a extremo',
      'Tú decides quién ve qué',
    ],
  },
}

export const Cumplimiento: Story = {
  args: {
    title: 'Cumplimos por ti',
    points: [
      'verifactu y normativa IA al día',
      'DPA firmado, datos solo tuyos',
      'Auditorías y registros de acceso',
      'Borrado total cuando tú quieras',
    ],
  },
}
