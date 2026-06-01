import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileWidget, FILE_KINDS } from './FileWidget'

const meta = {
  title: 'Neo/Widgets/FileWidget',
  component: FileWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    kind: { control: 'select', options: FILE_KINDS },
    width: { control: { type: 'range', min: 90, max: 260, step: 2 } },
    name: { control: 'text' },
    showName: { control: 'boolean' },
  },
  args: { kind: 'pdf', width: 150, showName: true },
} satisfies Meta<typeof FileWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Excel: Story = { args: { kind: 'xlsx' } }
export const Pdf: Story = { args: { kind: 'pdf' } }
export const Presentation: Story = { args: { kind: 'pptx' } }
export const Image: Story = { args: { kind: 'png' } }
export const Archive: Story = { args: { kind: 'zip' } }

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end' }}>
      <FileWidget kind="pdf" width={110} showName={false} />
      <FileWidget kind="pdf" width={150} showName={false} />
      <FileWidget kind="pdf" width={200} showName={false} />
    </div>
  ),
}

export const AllTypes: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 40,
        maxWidth: 760,
        justifyContent: 'center',
        alignItems: 'flex-start',
      }}
    >
      {FILE_KINDS.map((kind) => (
        <FileWidget key={kind} kind={kind} width={130} />
      ))}
    </div>
  ),
}

/** A fanned stack of mixed file types — a "documents" hero illustration. */
export const Stack: Story = {
  render: () => (
    <div style={{ position: 'relative', width: 320, height: 280 }}>
      {(
        [
          { kind: 'png' as const, rotate: -16, x: -70, y: 24, z: 1 },
          { kind: 'xlsx' as const, rotate: 8, x: 78, y: 14, z: 1 },
          { kind: 'pdf' as const, rotate: -4, x: 0, y: 0, z: 2 },
        ]
      ).map(({ kind, rotate, x, y, z }) => (
        <div
          key={kind}
          style={{
            position: 'absolute',
            top: 30 + y,
            left: 90 + x,
            zIndex: z,
            transform: `rotate(${rotate}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <FileWidget kind={kind} width={150} showName={false} />
        </div>
      ))}
    </div>
  ),
}
