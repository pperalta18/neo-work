import type { Meta, StoryObj } from '@storybook/react-vite'
import { DropzoneWidget } from './DropzoneWidget'

const meta = {
  title: 'Neo/Widgets/Dropzone',
  component: DropzoneWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DropzoneWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Vacia: Story = {
  args: {
    title: 'Suelta aquí tus papeles',
    hint: 'esto es lo fácil · arrastra y olvídate',
    files: [],
  },
}

export const SubiendoLote: Story = {
  args: {
    title: 'Tira el lote de tickets aquí',
    hint: 'danos el papeleo aburrido · PDF, XLSX, JPG',
    files: [
      { name: 'nominas-mayo.xlsx', size: '1,9 MB', type: 'XLSX', progress: 100 },
      { name: 'contrato-proveedor.pdf', size: '3,2 MB', type: 'PDF', progress: 38 },
      { name: 'recibo-luz.jpg', size: '720 KB', type: 'JPG', progress: 84 },
    ],
  },
}
