import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Cursor, type CursorLottie } from './Cursor'

const meta = {
  title: 'Motion/Cursor (Lottie)',
  component: Cursor,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Cursor>

export default meta
type Story = StoryObj<typeof meta>

const CANVAS: React.CSSProperties = {
  width: 720,
  height: 420,
  borderRadius: 24,
  background: '#f4f4fa',
  boxShadow: '0 20px 60px rgba(60,80,120,0.18)',
}
const font = "'Universal Sans Text', ui-sans-serif, system-ui, sans-serif"

/**
 * Paste any LottieFiles cursor / click JSON URL (the `assets*.lottiefiles.com/
 * packages/lf20_*.json` or `lottie.host/*.json` form) to see it drive the
 * cursor live. `hand` replaces the pointer on hover; `click` is the one-shot
 * effect on press. Leave a field blank to keep the SVG fallback.
 */
export const LoadFromUrl: Story = {
  render: function LottieLoader() {
    const [handUrl, setHandUrl] = useState('')
    const [clickUrl, setClickUrl] = useState('')
    const [lottie, setLottie] = useState<CursorLottie>({})
    const [status, setStatus] = useState('')

    const load = async () => {
      setStatus('Loading…')
      const next: CursorLottie = {}
      try {
        if (handUrl) next.hand = await (await fetch(handUrl)).json()
        if (clickUrl) next.click = await (await fetch(clickUrl)).json()
        setLottie(next)
        setStatus(`Loaded: ${Object.keys(next).join(', ') || 'nothing'}`)
      } catch (e) {
        setStatus(`Error: ${(e as Error).message} (CORS? try a lottie.host URL)`)
      }
    }

    const field = (label: string, v: string, set: (s: string) => void) => (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#6c6c89' }}>
        {label}
        <input
          value={v}
          onChange={(e) => set(e.target.value)}
          placeholder="https://lottie.host/…  or  https://assets…lottiefiles.com/packages/lf20_….json"
          style={{ width: 520, padding: '8px 10px', borderRadius: 8, border: '1px solid #d7dde6', fontSize: 13 }}
        />
      </label>
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: font }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {field('Hover cursor (hand) — Lottie URL', handUrl, setHandUrl)}
          {field('Click effect — Lottie URL', clickUrl, setClickUrl)}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={load}
              style={{
                padding: '8px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#0070f9',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Load
            </button>
            <span style={{ fontSize: 12, color: '#6c6c89' }}>{status}</span>
          </div>
        </div>

        <div style={CANVAS}>
          <Cursor lottie={lottie} size={28} lottieAnchor="center">
            <div
              style={{
                height: '100%',
                display: 'flex',
                gap: 16,
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1e1e20',
                userSelect: 'none',
              }}
            >
              {['Generate', 'Explore', 'Publish'].map((l) => (
                <div
                  key={l}
                  data-cursor="hand"
                  style={{
                    padding: '16px 30px',
                    borderRadius: 16,
                    background: '#fff',
                    boxShadow: '0 8px 24px rgba(60,80,120,0.12)',
                    fontWeight: 600,
                  }}
                >
                  {l}
                </div>
              ))}
            </div>
          </Cursor>
        </div>
      </div>
    )
  },
}
