import { useEffect, useMemo, useRef, useState } from 'react'
import { Editor } from '@/components/Editor'
import { PathScene } from '@/components/PathScene'
import { Stage } from '@/components/Stage'
import { CONCEPTS } from '@/content/concepts'
import { Slide06Grid } from '@/content/slide06Grid'
import { THEMES, type LightSource } from '@/lib/neumorphism'

const GRID_DEMO_ID = 'grid (06)'
const LIGHT_SOURCES: LightSource[] = ['tl', 'tr', 'bl', 'br']

export default function App() {
  const [view, setView] = useState<'preview' | 'editor'>('preview')
  const [themeName, setThemeName] = useState<'light' | 'dark'>('light')
  const [lightSource, setLightSource] = useState<LightSource>('tl')
  const [conceptId, setConceptId] = useState(CONCEPTS[0].id)
  const [revealedCount, setRevealedCount] = useState<number | undefined>(undefined)
  const timer = useRef<number | null>(null)

  const theme = useMemo(() => ({ ...THEMES[themeName], lightSource }), [themeName, lightSource])
  const concept = CONCEPTS.find((c) => c.id === conceptId)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  const play = () => {
    if (!concept) return
    if (timer.current) window.clearInterval(timer.current)
    setRevealedCount(0)
    let n = 0
    timer.current = window.setInterval(() => {
      n += 1
      setRevealedCount(n)
      if (n >= concept.spec.route.length) {
        if (timer.current) window.clearInterval(timer.current)
        timer.current = window.setTimeout(() => setRevealedCount(undefined), 700)
      }
    }, 320)
  }

  if (view === 'editor') {
    return (
      <>
        <Editor theme={theme} />
        <FloatBar>
          <Toggle label="◀ preview" active={false} onClick={() => setView('preview')} />
        </FloatBar>
      </>
    )
  }

  return (
    <>
      <Stage theme={theme}>
        {concept ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <PathScene spec={concept.spec} theme={theme} revealedCount={revealedCount} />
          </div>
        ) : (
          <Slide06Grid theme={theme} />
        )}
      </Stage>

      <FloatBar>
        {CONCEPTS.map((c) => (
          <Toggle
            key={c.id}
            label={c.label}
            active={conceptId === c.id}
            onClick={() => { setConceptId(c.id); setRevealedCount(undefined) }}
          />
        ))}
        <Toggle label={GRID_DEMO_ID} active={conceptId === GRID_DEMO_ID} onClick={() => setConceptId(GRID_DEMO_ID)} />
        <span style={sep} />
        {concept ? <Toggle label="▶ play" active={false} onClick={play} /> : null}
        <Toggle label="✎ editor" active={false} onClick={() => setView('editor')} />
        <span style={sep} />
        <Toggle label="light" active={themeName === 'light'} onClick={() => setThemeName('light')} />
        <Toggle label="dark" active={themeName === 'dark'} onClick={() => setThemeName('dark')} />
        <span style={sep} />
        {LIGHT_SOURCES.map((ls) => (
          <Toggle key={ls} label={`luz ${ls}`} active={lightSource === ls} onClick={() => setLightSource(ls)} />
        ))}
      </FloatBar>
    </>
  )
}

const sep = { width: 1, background: 'rgba(255,255,255,0.2)' } as const

function FloatBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        position: 'fixed', left: 16, bottom: 16, zIndex: 10,
        display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 'calc(100vw - 32px)',
        padding: 8, borderRadius: 12, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
      }}
    >
      {children}
    </div>
  )
}

function Toggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 600,
        color: active ? '#0d0f13' : '#e6e6f0',
        background: active ? '#7bb6ff' : 'rgba(255,255,255,0.12)',
      }}
    >
      {label}
    </button>
  )
}
