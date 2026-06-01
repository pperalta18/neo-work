import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { PathScene, type PathSpec } from '@/components/PathScene'
import { Icon, ICON_NAMES, isIconName, type IconName } from '@/components/icons'
import type { NeoTheme } from '@/lib/neumorphism'
import { footprint, reflowRoute, type Coord, type RouteStep } from '@/lib/pathfinding'

/**
 * Editor — build a pathfinding concept directly on the grid.
 * Click empty cells to lay the path in order; click a step to select it and set
 * its content (arrow / text / image / width). Spans reflow the rest so nothing
 * overlaps. Press play to watch it emerge.
 */

const INITIAL: PathSpec = {
  columns: 5,
  rows: 4,
  route: reflowRoute([
    { at: [1, 4] },
    { at: [2, 4] },
    { at: [2, 3] },
    { at: [3, 3] },
    { at: [3, 2] },
  ]),
  startNode: [0, 4],
}

const sameCoord = (a: Coord, b: Coord) => a[0] === b[0] && a[1] === b[1]

export function Editor({ theme }: { theme: NeoTheme }) {
  const [spec, setSpec] = useState<PathSpec>(INITIAL)
  const [selected, setSelected] = useState<number | null>(null)
  const [revealedCount, setRevealedCount] = useState<number | undefined>(undefined)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  const setRoute = (route: RouteStep[]) => setSpec((s) => ({ ...s, route: reflowRoute(route) }))

  const onCellClick = (coord: Coord) => {
    const idx = spec.route.findIndex((s) => sameCoord(s.at, coord))
    if (idx >= 0) {
      setSelected(idx)
      return
    }
    setRoute([...spec.route, { at: coord }])
    setSelected(spec.route.length)
  }

  const updateStep = (idx: number, patch: Partial<RouteStep>) =>
    setRoute(spec.route.map((step, i) => (i === idx ? { ...step, ...patch } : step)))

  const removeStep = (idx: number) => {
    setRoute(spec.route.filter((_, i) => i !== idx))
    setSelected(null)
  }

  const attachImage = (idx: number, file: File) => {
    const reader = new FileReader()
    reader.onload = () =>
      updateStep(idx, { image: { src: String(reader.result) } })
    reader.readAsDataURL(file)
  }

  const play = () => {
    if (timer.current) window.clearInterval(timer.current)
    setRevealedCount(0)
    let n = 0
    timer.current = window.setInterval(() => {
      n += 1
      setRevealedCount(n)
      if (n >= spec.route.length) {
        if (timer.current) window.clearInterval(timer.current)
        timer.current = window.setTimeout(() => setRevealedCount(undefined), 600)
      }
    }, 320)
  }

  const sel = selected != null ? spec.route[selected] : null
  const kind: 'arrow' | 'icon' | 'text' | 'image' = sel?.image
    ? 'image'
    : sel?.text
      ? 'text'
      : sel?.icon
        ? 'icon'
        : 'arrow'

  // Effective grid (may have grown from spans) drives the preview scale.
  const maxC = Math.max(spec.columns, ...spec.route.map((s) => footprint(s).c1)) + 2
  const scale = Math.min(1, 900 / (maxC * 128))

  return (
    <div style={{ display: 'flex', height: '100vh', background: theme.surface }}>
      <aside style={panel}>
        <header>
          <h2 style={{ margin: 0, fontSize: 17, color: ink }}>Editor de conceptos</h2>
          <p style={hint}>
            Clic en una celda vacía para añadir un paso. Clic en un paso para editarlo.
            Las celdas anchas recolocan el resto del camino.
          </p>
        </header>

        <Section title="Escena">
          <div style={{ display: 'flex', gap: 10 }}>
            <Stepper label="columnas" value={spec.columns} onChange={(v) => setSpec((s) => ({ ...s, columns: v }))} />
            <Stepper label="filas" value={spec.rows} onChange={(v) => setSpec((s) => ({ ...s, rows: v }))} />
          </div>
        </Section>

        <Section title="Reproducción">
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={primaryBtn} onClick={play}>▶ Reproducir</button>
            <button style={ghostBtn} onClick={() => { setSpec(INITIAL); setSelected(null) }}>↺ Reset</button>
          </div>
        </Section>

        <Section title={`Ruta · ${spec.route.length} pasos`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 190, overflowY: 'auto' }}>
            {spec.route.length === 0 ? (
              <span style={hint}>Aún no hay pasos. Haz clic en el grid →</span>
            ) : null}
            {spec.route.map((step, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                style={{ ...stepRow, ...(selected === i ? stepRowActive : null) }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge>{kindIcon(step)}</Badge>
                  <span style={{ fontWeight: 600 }}>{i + 1}</span>
                  <span style={{ color: muted }}>[{step.at[0]},{step.at[1]}]</span>
                </span>
                <span style={{ color: muted, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {step.text ? step.text.main : step.image ? 'imagen' : step.icon ? step.icon : 'flecha'}
                </span>
              </button>
            ))}
          </div>
        </Section>

        {sel ? (
          <Section title={`Paso ${selected! + 1} · [${sel.at[0]},${sel.at[1]}]`}>
            <Segmented
              value={kind}
              options={[
                ['arrow', 'flecha'],
                ['icon', 'icono'],
                ['text', 'texto'],
                ['image', 'imagen'],
              ]}
              onChange={(k) =>
                updateStep(selected!, {
                  text: k === 'text' ? { muted: '', main: 'Texto' } : undefined,
                  image: k === 'image' ? { background: 'linear-gradient(120deg,#6d3bd1,#ff7ac6)' } : undefined,
                  icon:
                    k === 'icon'
                      ? (isIconName(sel.icon) ? sel.icon : ICON_NAMES[0])
                      : k === 'text'
                        ? sel.icon
                        : undefined,
                  colSpan: k === 'arrow' || k === 'icon' ? 1 : sel.colSpan,
                })
              }
            />

            {kind === 'icon' ? (
              <IconPicker value={sel.icon} onPick={(n) => updateStep(selected!, { icon: n })} />
            ) : null}

            {kind === 'text' ? (
              <>
                <Field label="etiqueta (opcional)" value={sel.text?.muted ?? ''}
                  onChange={(v) => updateStep(selected!, { text: { ...sel.text!, muted: v } })} />
                <Field label="texto" value={sel.text?.main ?? ''}
                  onChange={(v) => updateStep(selected!, { text: { ...sel.text!, main: v } })} />
                <div style={{ fontSize: 12, color: muted }}>icono (opcional)</div>
                <IconPicker value={sel.icon} allowNone onPick={(n) => updateStep(selected!, { icon: n })} />
                <Stepper label="ancho (celdas)" value={sel.colSpan ?? 1} min={1}
                  onChange={(v) => updateStep(selected!, { colSpan: v })} />
              </>
            ) : null}

            {kind === 'image' ? (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {sel.image?.src ? (
                    <div
                      style={{
                        width: 48, height: 48, borderRadius: 8, flexShrink: 0,
                        border: `1px solid ${line}`, backgroundSize: 'cover',
                        backgroundPosition: 'center', backgroundImage: `url(${sel.image.src})`,
                      }}
                    />
                  ) : null}
                  <label style={{ ...ghostBtn, flex: 1, textAlign: 'center' }}>
                    {sel.image?.src ? 'Cambiar imagen' : 'Adjuntar imagen'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) attachImage(selected!, file)
                      }}
                    />
                  </label>
                </div>
                <Field label="o pega una URL" value={sel.image?.src?.startsWith('data:') ? '' : sel.image?.src ?? ''}
                  onChange={(v) => updateStep(selected!, { image: { src: v } })} />
                <Stepper label="ancho (celdas)" value={sel.colSpan ?? 1} min={1}
                  onChange={(v) => updateStep(selected!, { colSpan: v })} />
              </>
            ) : null}

            <button style={dangerBtn} onClick={() => removeStep(selected!)}>Eliminar paso</button>
          </Section>
        ) : null}

        <details style={{ fontSize: 12 }}>
          <summary style={{ cursor: 'pointer', color: muted, padding: '4px 0' }}>Exportar spec (JSON)</summary>
          <pre style={pre}>
            {JSON.stringify(
              spec,
              (_k, v) => (typeof v === 'string' && v.startsWith('data:') ? 'data:…(imagen adjunta)' : v),
              2,
            )}
          </pre>
        </details>
      </aside>

      <main style={{ flex: 1, display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
          <PathScene
            spec={spec}
            theme={theme}
            revealedCount={revealedCount}
            onCellClick={onCellClick}
            selected={sel?.at ?? null}
          />
        </div>
      </main>
    </div>
  )
}

// ── design tokens ────────────────────────────────────────────────────────────
const ink = '#1e1e20'
const muted = '#6c6c89'
const line = '#e6e6f0'

const panel: CSSProperties = {
  width: 312, flexShrink: 0, height: '100vh', overflowY: 'auto',
  padding: 18, display: 'flex', flexDirection: 'column', gap: 16,
  background: '#fbfbff', borderRight: `1px solid ${line}`,
  fontFamily: 'system-ui, sans-serif',
}
const hint: CSSProperties = { margin: '6px 0 0', fontSize: 12.5, color: muted, lineHeight: 1.45 }
const stepRow: CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '7px 9px', borderRadius: 9, border: `1px solid ${line}`, background: '#fff',
  cursor: 'pointer', fontSize: 12.5, color: ink,
}
const stepRowActive: CSSProperties = { borderColor: '#0070f9', boxShadow: '0 0 0 1px #0070f9' }
const primaryBtn: CSSProperties = {
  flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
  background: '#0070f9', color: '#fff', fontWeight: 700, fontSize: 14,
}
const ghostBtn: CSSProperties = {
  padding: '10px 14px', borderRadius: 9, border: `1px solid ${line}`, cursor: 'pointer',
  background: '#fff', color: ink, fontWeight: 600, fontSize: 14,
}
const dangerBtn: CSSProperties = {
  marginTop: 4, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
  background: '#ffe3e8', color: '#c01643', fontWeight: 600, fontSize: 13,
}
const pre: CSSProperties = {
  background: '#0d0f13', color: '#c1c1e6', padding: 10, borderRadius: 8,
  fontSize: 11, overflowX: 'auto', maxHeight: 220, marginTop: 6,
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {title}
      </div>
      {children}
    </section>
  )
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span style={{
      width: 18, height: 18, display: 'grid', placeItems: 'center', borderRadius: 5,
      background: '#eef1f8', color: muted, fontSize: 11,
    }}>{children}</span>
  )
}

const kindIcon = (s: RouteStep) => (s.text ? 'T' : s.image ? '▦' : s.icon ? '◆' : '→')

function Segmented({
  value, options, onChange,
}: { value: string; options: Array<[string, string]>; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4, background: '#eef1f8', padding: 4, borderRadius: 10 }}>
      {options.map(([k, label]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          style={{
            flex: 1, padding: '7px', borderRadius: 7, border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600,
            background: value === k ? '#fff' : 'transparent',
            color: value === k ? ink : muted,
            boxShadow: value === k ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function IconPicker({
  value, allowNone = false, onPick,
}: { value?: string; allowNone?: boolean; onPick: (n: IconName | undefined) => void }) {
  const pickBtn = (active: boolean): CSSProperties => ({
    width: 34, height: 34, display: 'grid', placeItems: 'center', cursor: 'pointer',
    borderRadius: 8, background: active ? '#e7f0ff' : '#fff',
    border: `1px solid ${active ? '#0070f9' : line}`,
  })
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {allowNone ? (
        <button style={{ ...pickBtn(!value), color: muted, fontSize: 16 }} onClick={() => onPick(undefined)} title="ninguno">
          —
        </button>
      ) : null}
      {ICON_NAMES.map((n) => (
        <button key={n} style={pickBtn(value === n)} onClick={() => onPick(n)} title={n}>
          <Icon name={n} size={20} color={value === n ? '#0070f9' : '#6c6c89'} />
        </button>
      ))}
    </div>
  )
}

function Stepper({
  label, value, min = 1, onChange,
}: { label: string; value: number; min?: number; onChange: (v: number) => void }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 12, color: muted, marginBottom: 5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button style={stepBtn} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
        <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 700, color: ink }}>{value}</span>
        <button style={stepBtn} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  )
}
const stepBtn: CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: `1px solid ${line}`, cursor: 'pointer',
  background: '#fff', color: ink, fontWeight: 700, fontSize: 15, lineHeight: 1,
}

function Field({
  label, value, onChange,
}: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: muted }}>
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ padding: '8px 10px', borderRadius: 8, border: `1px solid ${line}`, fontSize: 14, color: ink }}
      />
    </label>
  )
}
