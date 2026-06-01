import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Cursor, type CursorState } from './Cursor'
import { useCursorTimeline } from './useCursorTimeline'
import type { CursorKeyframe } from './cursorTimeline'

const meta = {
  title: 'Motion/Cursor',
  component: Cursor,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    size: { control: { type: 'range', min: 16, max: 64, step: 1 } },
    stiffness: { control: { type: 'range', min: 0.05, max: 1, step: 0.05 } },
    state: { control: 'inline-radio', options: [undefined, 'arrow', 'hand', 'text', 'grab', 'grabbing'] },
    followMouse: { control: 'boolean' },
  },
  args: { size: 26, followMouse: true, stiffness: 1 },
} satisfies Meta<typeof Cursor>

export default meta
type Story = StoryObj<typeof meta>

const CANVAS: React.CSSProperties = {
  width: 720,
  height: 440,
  borderRadius: 24,
  background: '#f4f4fa',
  boxShadow: '0 20px 60px rgba(60,80,120,0.18)',
}

const font = "'Universal Sans Text', ui-sans-serif, system-ui, sans-serif"

/** Move the mouse over the canvas — arrow over blank space, hand over the
 * buttons / link, I-beam over the paragraph, grab over the draggable chip. */
export const Default: Story = {
  render: (args) => (
    <div style={CANVAS}>
      <Cursor {...args}>
        <div
          style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: font,
            color: '#1e1e20',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            {['Generate', 'Explore'].map((l) => (
              <div
                key={l}
                data-cursor="hand"
                style={{
                  padding: '14px 28px',
                  borderRadius: 16,
                  background: '#fff',
                  boxShadow: '0 8px 24px rgba(60,80,120,0.12)',
                  fontWeight: 600,
                }}
              >
                {l}
              </div>
            ))}
            <div
              data-cursor="grab"
              style={{
                padding: '14px 22px',
                borderRadius: 16,
                background: '#0070f9',
                color: '#fff',
                fontWeight: 600,
              }}
            >
              Drag me
            </div>
          </div>
          <p data-cursor="text" style={{ maxWidth: 360, textAlign: 'center', color: '#6c6c89' }}>
            Hover this paragraph and the pointer turns into a text I-beam, just like a
            real OS cursor.
          </p>
          <a data-cursor="hand" style={{ color: '#0070f9', fontWeight: 600 }}>
            A link →
          </a>
        </div>
      </Cursor>
    </div>
  ),
}

/** All cursor shapes side by side. */
export const States: Story = {
  render: () => {
    const states: CursorState[] = ['arrow', 'hand', 'text', 'grab', 'grabbing']
    return (
      <div style={{ display: 'flex', gap: 18, fontFamily: font }}>
        {states.map((s) => (
          <div
            key={s}
            style={{
              width: 120,
              height: 120,
              borderRadius: 18,
              background: '#f4f4fa',
              boxShadow: '0 10px 28px rgba(60,80,120,0.14)',
              position: 'relative',
            }}
          >
            <Cursor followMouse={false} state={s} at={{ x: 60, y: 52 }} size={28} />
            <span
              style={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: 12,
                color: '#6c6c89',
              }}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    )
  },
}

/** Scripted motion via a pure timeline (no mouse): the cursor springs to the
 * button, clicks, then glides back — looping. This is the choreography you'd
 * reuse frame-for-frame in Remotion. */
const SCRIPT: CursorKeyframe[] = [
  { at: { x: 80, y: 380 }, t: 0, state: 'arrow' },
  { at: { x: 360, y: 215 }, t: 900, state: 'hand', ease: 'spring' },
  { at: { x: 360, y: 215 }, t: 1500, click: true },
  { at: { x: 360, y: 215 }, t: 1900 },
  { at: { x: 80, y: 380 }, t: 2700, state: 'arrow', ease: 'easeInOut' },
]

export const Scripted: Story = {
  render: function ScriptedDemo() {
    const { at, state, clicking } = useCursorTimeline(SCRIPT, { loop: true, tail: 700 })
    const [done, setDone] = useState(false)
    useEffect(() => {
      if (clicking) setDone(true)
    }, [clicking])
    useEffect(() => {
      if (state === 'arrow') setDone(false)
    }, [state])

    return (
      <div style={CANVAS}>
        <Cursor followMouse={false} at={at} state={state} clicking={clicking} size={26}>
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: font,
            }}
          >
            <div
              data-cursor="hand"
              style={{
                padding: '16px 34px',
                borderRadius: 18,
                background: done ? '#2ada56' : '#0070f9',
                color: '#fff',
                fontSize: 18,
                fontWeight: 600,
                transition: 'background 0.2s ease',
                boxShadow: '0 10px 30px rgba(0,112,249,0.3)',
              }}
            >
              {done ? 'Done ✓' : 'Generate'}
            </div>
          </div>
        </Cursor>
      </div>
    )
  },
}
