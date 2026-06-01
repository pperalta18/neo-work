import type { Meta, StoryObj } from '@storybook/react-vite'
import { SpreadsheetWidget } from './SpreadsheetWidget'

const meta = {
  title: 'Neo/Widgets/Spreadsheet',
  component: SpreadsheetWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    chrome: { control: 'boolean' },
    headerRow: { control: 'boolean' },
    formulaBar: { control: 'boolean' },
  },
  args: { title: 'Revenue.xlsx', chrome: true, headerRow: true, formulaBar: true },
} satisfies Meta<typeof SpreadsheetWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoChrome: Story = {
  args: { chrome: false, formulaBar: false },
}

export const Bare: Story = {
  args: { chrome: false, headerRow: false, formulaBar: false, selected: null },
}

export const CustomColumns: Story = {
  args: {
    title: 'Headcount.xlsx',
    columns: [
      { label: 'Team', align: 'left', width: 120 },
      { label: 'Hires', align: 'right' },
      { label: 'Open', align: 'right' },
    ],
    data: [
      ['Team', 'Hires', 'Open'],
      ['Design', 4, 1],
      ['Engineering', 12, 5],
      ['Sales', 7, 2],
      ['Ops', 3, 0],
    ],
    selected: [2, 1],
  },
}
