import type { Meta, StoryObj } from '@storybook/react-vite'
import { ModuleGalleryWidget } from './ModuleGalleryWidget'

const meta = {
  title: 'Neo/AiKit/Modules Gallery',
  component: ModuleGalleryWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: { defaultGroup: 'Controla' },
} satisfies Meta<typeof ModuleGalleryWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Delega: Story = {
  args: { defaultGroup: 'Delega' },
}

export const Construye: Story = {
  args: { defaultGroup: 'Construye' },
}
