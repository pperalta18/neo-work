import type { Meta, StoryObj } from '@storybook/react-vite'
import { Phone3D } from './Phone3D'
import { KIT_BLUE } from '@/lib/neumorphism'

const meta = {
  title: 'Mockups/Phone 3D',
  component: Phone3D,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    screenBackground: { control: 'color' },
    bodyColor: { control: 'color' },
    bodyRoughness: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    bodyMetalness: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    screenCornerRatio: { control: { type: 'range', min: 0.1, max: 0.28, step: 0.005 } },
    autoRotate: { control: 'boolean' },
    enableControls: { control: 'boolean' },
    glare: { control: 'boolean' },
    shadow: { control: 'boolean' },
    swayAmplitude: { control: { type: 'range', min: 0, max: 0.6, step: 0.02 } },
    children: { control: false },
  },
  args: {
    autoRotate: true,
    enableControls: true,
    glare: true,
    shadow: true,
    width: 440,
    height: 660,
  },
} satisfies Meta<typeof Phone3D>

export default meta
type Story = StoryObj<typeof meta>

/** A soft app screen, painted with React content onto the glass. */
function DemoScreen() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '88px 28px 28px',
        gap: 22,
        color: '#1e1e20',
      }}
    >
      <div style={{ fontSize: 15, color: '#6c6c89' }}>Buenos días</div>
      <div style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1 }}>
        Tu día,
        <br />
        en orden.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
        {[
          { t: 'Tareas', v: '4', c: KIT_BLUE },
          { t: 'Reuniones', v: '2', c: '#f0a020' },
          { t: 'Mensajes', v: '12', c: '#23b26d' },
          { t: 'Foco', v: '1h', c: '#8b5cf6' },
        ].map((card) => (
          <div
            key={card.t}
            style={{
              background: '#fff',
              borderRadius: 22,
              padding: 18,
              boxShadow: '0 8px 20px rgba(40,60,90,0.08)',
            }}
          >
            <div style={{ width: 30, height: 30, borderRadius: 10, background: card.c }} />
            <div style={{ fontSize: 28, fontWeight: 700, marginTop: 14 }}>{card.v}</div>
            <div style={{ fontSize: 13, color: '#6c6c89' }}>{card.t}</div>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 'auto',
          background: KIT_BLUE,
          color: '#fff',
          borderRadius: 999,
          padding: '16px 0',
          textAlign: 'center',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        Empezar el día
      </div>
    </div>
  )
}

/** Paint any React UI onto the screen. */
export const Default: Story = {
  args: { children: <DemoScreen /> },
}

/** Static pose (no sway), good for hero shots / Remotion frames. */
export const Static: Story = {
  args: { children: <DemoScreen />, autoRotate: false, enableControls: false, initialTilt: [-6, -22] },
}

/** Matte white finish — chassis repainted as a soft, non-reflective white. */
export const MatteWhite: Story = {
  args: {
    children: <DemoScreen />,
    bodyColor: '#f1f1f3',
    bodyRoughness: 0.72,
    bodyMetalness: 0.04,
  },
}

/** Fill the screen with a screenshot URL instead of React content. */
export const FromImage: Story = {
  args: {
    screenImage:
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=720&q=80&fit=crop',
  },
}
