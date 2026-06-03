import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileWidget, FILE_KINDS } from './FileWidget'
import { DocumentIllustration } from '@/components/illustrations/document'

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

/**
 * The document illustration — now the Tailark Pro `document` component
 * (@tailark-pro/document), replacing the former neumorphic FileWidget drawing.
 * Lives here as the canonical "document" illustration; see also the dedicated
 * Neo/Widgets/DocumentIllustration story.
 */
export const Document: Story = {
  render: () => (
    <div style={{ transform: 'scale(3)', transformOrigin: 'center' }}>
      <DocumentIllustration />
    </div>
  ),
}
