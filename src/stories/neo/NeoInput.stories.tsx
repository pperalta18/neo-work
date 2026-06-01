import type { Meta, StoryObj } from '@storybook/react-vite'
import { ICON_NAMES } from '@/components/icons'
import { NeoInput } from './NeoInput'

const meta = {
  title: 'Neo/NeoInput',
  component: NeoInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'select', options: [null, ...ICON_NAMES] },
    submit: { control: 'boolean' },
    disabled: { control: 'boolean' },
    onSubmit: { action: 'submit' },
    onChange: { action: 'change' },
  },
  args: { placeholder: 'What are you looking for today?', icon: 'mic', submit: true },
} satisfies Meta<typeof NeoInput>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithText: Story = {
  args: { defaultValue: 'What are' },
}

export const NoIcon: Story = {
  args: { icon: null, placeholder: 'Type a message…' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Locked' },
}
