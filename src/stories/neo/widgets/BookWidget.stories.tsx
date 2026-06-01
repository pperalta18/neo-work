import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookWidget } from './BookWidget'

const meta = {
  title: 'Neo/Widgets/Book',
  component: BookWidget,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    width: { control: { type: 'range', min: 240, max: 520, step: 10 } },
    ratio: { control: { type: 'range', min: 1.2, max: 2.2, step: 0.02 } },
    holdMs: { control: { type: 'range', min: 600, max: 5000, step: 100 } },
    turnMs: { control: { type: 'range', min: 600, max: 3000, step: 100 } },
    page: { control: false },
    progress: { control: false },
    pages: { control: false },
  },
  args: { width: 340, ratio: 1.92, auto: true, holdMs: 2400, turnMs: 1500 },
} satisfies Meta<typeof BookWidget>

export default meta
type Story = StoryObj<typeof meta>

/** Auto-plays through the pages; click the page to turn it yourself. */
export const Default: Story = {}

/** Calmer cadence — longer reading pause, slower, more deliberate turn. */
export const SlowReader: Story = {
  args: { holdMs: 4000, turnMs: 2400 },
}

/** No auto-play — click anywhere on the page to turn it. */
export const ClickToTurn: Story = {
  args: { auto: false },
}

/**
 * Frozen mid-peel — driving `page` + `progress` directly (the controlled,
 * Remotion-ready path: state in, frame out).
 */
export const FrozenMidTurn: Story = {
  args: { page: 0, progress: 0.45 },
}

/**
 * Scrub the turn by hand to see the fold geometry — the corner lifts on a
 * Bézier path, reflects across the fold line, and sweeps off to the spine.
 */
export const Scrubber: Story = {
  render: (args) => {
    const [p, setP] = useState(0.4)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <BookWidget {...args} page={0} progress={p} />
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={p}
          onChange={(e) => setP(Number(e.target.value))}
          style={{ width: 320 }}
        />
      </div>
    )
  },
}

/**
 * The same turn driven by a frame clock — a preview of the Remotion render
 * path, where `progress` is a pure function of the current frame.
 */
export const FrameDriven: Story = {
  render: (args) => {
    const [frame, setFrame] = useState(0)
    useEffect(() => {
      let raf = 0
      const loop = () => {
        setFrame((f) => f + 1)
        raf = requestAnimationFrame(loop)
      }
      raf = requestAnimationFrame(loop)
      return () => cancelAnimationFrame(raf)
    }, [])
    const period = 120 // frames per page (hold + turn)
    const turn = 60 // frames spent turning
    const local = frame % period
    const page = Math.floor(frame / period)
    const progress = local < period - turn ? 0 : (local - (period - turn)) / turn
    return <BookWidget {...args} page={page} progress={progress} />
  },
}
