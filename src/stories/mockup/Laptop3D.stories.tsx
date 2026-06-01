import type { Meta, StoryObj } from '@storybook/react-vite'
import { Laptop3D } from './Laptop3D'
import { KIT_BLUE } from '@/lib/neumorphism'

const meta = {
  title: 'Mockups/Laptop 3D',
  component: Laptop3D,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    screenBackground: { control: 'color' },
    bodyColor: { control: 'color' },
    bodyRoughness: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    bodyMetalness: { control: { type: 'range', min: 0, max: 1, step: 0.02 } },
    autoRotate: { control: 'boolean' },
    enableControls: { control: 'boolean' },
    glare: { control: 'boolean' },
    shadow: { control: 'boolean' },
    swayAmplitude: { control: { type: 'range', min: 0, max: 0.4, step: 0.02 } },
    children: { control: false },
  },
  args: {
    autoRotate: true,
    enableControls: true,
    glare: true,
    shadow: true,
    width: 760,
    height: 560,
  },
} satisfies Meta<typeof Laptop3D>

export default meta
type Story = StoryObj<typeof meta>

/** A soft desktop dashboard, painted with React content onto the display. */
function DemoScreen() {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        background: '#0f1116',
        color: '#e9ecf2',
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 168,
          padding: '26px 18px',
          background: '#161a22',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 22, height: 22, borderRadius: 7, background: KIT_BLUE }} />
          <div style={{ fontSize: 15, fontWeight: 700 }}>AiKit</div>
        </div>
        {['Inicio', 'Proyectos', 'Equipo', 'Métricas', 'Ajustes'].map((t, i) => (
          <div
            key={t}
            style={{
              fontSize: 13,
              padding: '9px 12px',
              borderRadius: 9,
              background: i === 0 ? 'rgba(0,112,249,0.16)' : 'transparent',
              color: i === 0 ? '#7db4ff' : '#9aa3b2',
            }}
          >
            {t}
          </div>
        ))}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div>
          <div style={{ fontSize: 13, color: '#8a93a3' }}>Buenos días, Pablo</div>
          <div style={{ fontSize: 26, fontWeight: 700, marginTop: 4 }}>Resumen de hoy</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            { t: 'Ingresos', v: '€48.2k', c: KIT_BLUE },
            { t: 'Usuarios', v: '12,840', c: '#23b26d' },
            { t: 'Conversión', v: '3.9%', c: '#f0a020' },
          ].map((card) => (
            <div key={card.t} style={{ background: '#1b202a', borderRadius: 16, padding: 18 }}>
              <div style={{ width: 28, height: 28, borderRadius: 9, background: card.c }} />
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 14 }}>{card.v}</div>
              <div style={{ fontSize: 12, color: '#8a93a3' }}>{card.t}</div>
            </div>
          ))}
        </div>

        {/* Faux chart */}
        <div style={{ background: '#1b202a', borderRadius: 16, padding: 20, flex: 1 }}>
          <div style={{ fontSize: 13, color: '#8a93a3', marginBottom: 16 }}>Actividad semanal</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: '70%' }}>
            {[42, 68, 55, 90, 73, 100, 61].map((h, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: 8,
                  background: i === 5 ? KIT_BLUE : '#2c3340',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Paint any React UI onto the display. */
export const Default: Story = {
  args: { children: <DemoScreen /> },
}

/** Static pose (no sway), good for hero shots / Remotion frames. */
export const Static: Story = {
  args: { children: <DemoScreen />, autoRotate: false, enableControls: false, initialTilt: [10, -26] },
}

/** Space-grey matte finish. */
export const SpaceGrey: Story = {
  args: {
    children: <DemoScreen />,
    bodyColor: '#3a3d42',
    bodyRoughness: 0.5,
    bodyMetalness: 0.9,
  },
}

/** Fill the display with a screenshot URL instead of React content. */
export const FromImage: Story = {
  args: {
    screenImage:
      'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=1280&q=80&fit=crop',
  },
}
