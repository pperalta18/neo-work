import type { Meta, StoryObj } from '@storybook/react-vite'
import { DocumentIllustration } from '@/components/illustrations/document'

/**
 * Document illustration — now sourced from Tailark Pro (@tailark-pro/document),
 * replacing the previous neumorphic FileWidget document drawing. It's a small
 * Tailwind/shadcn component (a paper sheet with header dot, ruled lines and a
 * signature glyph) that follows the Storybook theme toggle via the `.dark`
 * class wired in .storybook/preview.tsx.
 *
 * Note: this is a Tailwind-class component, so unlike the inline-styled neo
 * widgets it does NOT respond to the «Iluminación» (light source / intensity)
 * controls — only to light/dark.
 */
const meta = {
  title: 'Neo/Widgets/DocumentIllustration',
  component: DocumentIllustration,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DocumentIllustration>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/** Scaled up so the sheet detail reads at presentation size. */
export const Large: Story = {
  render: () => (
    <div style={{ transform: 'scale(3)', transformOrigin: 'center' }}>
      <DocumentIllustration />
    </div>
  ),
}

/** A fanned trio — the "documents" hero arrangement, now with the Tailark sheet. */
export const Stack: Story = {
  render: () => (
    <div style={{ position: 'relative', width: 220, height: 180 }}>
      {[
        { rotate: -16, x: -54, y: 18, z: 1 },
        { rotate: 8, x: 60, y: 10, z: 1 },
        { rotate: -4, x: 0, y: 0, z: 2 },
      ].map(({ rotate, x, y, z }, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: 40 + y,
            left: 78 + x,
            zIndex: z,
            transform: `rotate(${rotate}deg) scale(1.6)`,
            transformOrigin: 'bottom center',
          }}
        >
          <DocumentIllustration />
        </div>
      ))}
    </div>
  ),
}
