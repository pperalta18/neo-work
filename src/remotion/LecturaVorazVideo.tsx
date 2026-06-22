import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { elevation, KIT_BLUE, TEXT_FONT, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { NeoThemeProvider, useNeoTheme } from '@/stories/neo/NeoTheme'
import { Fonts, BODY_FONT } from './fonts'
import {
  activeDropsAt,
  cameraAt,
  clamp01,
  dropEnterAt,
  dropOpacityAt,
  highlightsAt,
  lerp,
  LECTURA_VORAZ_DURATION,
  TEMPLATES,
  type ApiTemplate,
  type Drop,
  type HlKind,
  type JsonKind,
  type JsonTemplate,
  type TableTemplate,
} from './lecturaVorazScript'

/**
 * LecturaVorazVideo — the visual shell over lecturaVorazScript's deterministic
 * brain. It owns only pixels: the neumorphic source plates (a clean data table,
 * a JSON object, an API response — NO window chrome, NO labels), the highlight
 * primitive (underline / box / sweep), and the heap layout. All timing — when a
 * source drops, where it lands, which slots get scanned and when — comes from the
 * script, so studio and render agree frame-for-frame.
 */

export { LECTURA_VORAZ_DURATION }

const MONO = "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace"

const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// JSON / API token colours — readable on the light surface, syntax-distinct.
const TOK: Record<JsonKind | 'key' | 'punct', string> = {
  key: '#2f63d8',
  str: '#1c8c4b',
  num: '#c1740f',
  bool: '#6a4bd6',
  id: '#0f8aa0',
  punct: '#9aa0b4',
}

const METHOD_COLOR: Record<ApiTemplate['method'], string> = {
  GET: KIT_BLUE,
  POST: '#1c9b53',
  PUT: '#d08512',
  DELETE: '#e0463a',
}

type Hl = { p: number; kind: HlKind; accent: string }

// ── the highlight primitive (destacado) ────────────────────────────────────────
// Insets to its relative parent (the scanned token / cell). Underline draws L→R,
// box rings the slot, sweep wipes a marker wash across it. All hold once drawn.

function Highlight({ p, kind, accent }: Hl) {
  if (p <= 0) return null
  if (kind === 'underline') {
    return (
      <span
        style={{
          position: 'absolute',
          left: -1,
          right: -1,
          bottom: -2,
          height: 2.5,
          borderRadius: 2,
          background: accent,
          transformOrigin: 'left center',
          transform: `scaleX(${p})`,
          boxShadow: `0 0 7px ${hexA(accent, 0.55)}`,
          opacity: 0.55 + 0.45 * p,
        }}
      />
    )
  }
  if (kind === 'box') {
    const k = clamp01(p * 1.3)
    return (
      <span
        style={{
          position: 'absolute',
          inset: '-2px -4px',
          borderRadius: 5,
          boxShadow: `inset 0 0 0 2px ${hexA(accent, 0.5 * k)}`,
          background: hexA(accent, 0.1 * k),
        }}
      />
    )
  }
  // sweep — a marker wash that wipes left→right and leaves a faint tint.
  return (
    <span style={{ position: 'absolute', inset: '-2px -3px', borderRadius: 4, overflow: 'hidden' }}>
      <span
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(90deg, ${hexA(accent, 0.22)} 0%, ${hexA(accent, 0.12)} 100%)`,
          clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`,
        }}
      />
    </span>
  )
}

/** A highlightable token/cell: relative box wrapping its content + its mark. */
function Slot({ hl, children, style }: { hl?: Hl; children: ReactNode; style?: CSSProperties }) {
  const lit = hl ? hl.p > 0.02 : false
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        borderRadius: 3,
        zIndex: lit ? 2 : 1,
        textShadow: lit ? `0 0 7px ${hexA(hl!.accent, 0.4)}` : undefined,
        ...style,
      }}
    >
      {children}
      {hl && <Highlight {...hl} />}
    </span>
  )
}

// ── artifact renderers (real content, no chrome) ────────────────────────────────
// Each emits highlightable slots in the SAME reading order the scheduler assumes:
// tables row-major; json top→bottom over value lines; api endpoint, status, then
// fields. `hlAt(i)` returns the active mark for slot i (or undefined).

function TableCard({ t, hlAt, theme }: { t: TableTemplate; hlAt: (i: number) => Hl | undefined; theme: NeoTheme }) {
  const gridCols = t.cols.map((c) => `${c.w}px`).join(' ')
  const justify = (a?: string) => (a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start')
  let slot = 0
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: gridCols,
        fontFamily: TEXT_FONT,
        borderTop: `1px solid ${theme.gridLine}`,
        borderLeft: `1px solid ${theme.gridLine}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {t.cols.map((c, ci) => (
        <div
          key={`h${ci}`}
          style={{
            height: 34,
            display: 'flex',
            alignItems: 'center',
            justifyContent: justify(c.align),
            padding: '0 12px',
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            color: theme.textMuted,
            background: `${theme.textMuted}12`,
            borderRight: `1px solid ${theme.gridLine}`,
            borderBottom: `1px solid ${theme.gridLine}`,
          }}
        >
          {c.label}
        </div>
      ))}
      {t.rows.map((row, ri) => (
        <Fragment key={ri}>
          {row.map((cell, ci) => {
            const idx = slot++
            const hl = hlAt(idx)
            const lit = hl ? hl.p > 0.03 : false
            const numeric = t.cols[ci].align === 'right'
            return (
              <div
                key={ci}
                style={{
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: justify(t.cols[ci].align),
                  padding: '0 12px',
                  fontSize: 14,
                  fontWeight: lit ? 600 : 400,
                  color: lit ? theme.textStrong : ci === 0 ? theme.textMuted : theme.textStrong,
                  fontVariantNumeric: numeric ? 'tabular-nums' : undefined,
                  borderRight: `1px solid ${theme.gridLine}`,
                  borderBottom: `1px solid ${theme.gridLine}`,
                  whiteSpace: 'nowrap',
                }}
              >
                <Slot hl={hl}>{cell}</Slot>
              </div>
            )
          })}
        </Fragment>
      ))}
    </div>
  )
}

function JsonCard({ t, hlAt, theme }: { t: JsonTemplate; hlAt: (i: number) => Hl | undefined; theme: NeoTheme }) {
  let slot = 0
  return (
    <div style={{ fontFamily: MONO, fontSize: 14.5, lineHeight: '26px', color: theme.textStrong, minWidth: 268 }}>
      {t.lines.map((l, i) => {
        const hasContent = l.key !== undefined || l.val !== undefined
        const pad = l.indent * 18
        if (!hasContent) {
          return (
            <div key={i} style={{ paddingLeft: pad, color: TOK.punct }}>
              {l.punct}
            </div>
          )
        }
        const idx = slot++
        const hl = hlAt(idx)
        return (
          <div key={i} style={{ paddingLeft: pad, whiteSpace: 'nowrap' }}>
            <Slot hl={hl}>
              {l.key !== undefined && <span style={{ color: TOK.key }}>&quot;{l.key}&quot;</span>}
              {l.key !== undefined && <span style={{ color: TOK.punct }}>: </span>}
              {l.val !== undefined && (
                <span style={{ color: TOK[l.vKind ?? 'str'] }}>
                  {l.vKind === 'num' || l.vKind === 'bool' ? l.val : `"${l.val}"`}
                </span>
              )}
            </Slot>
            {l.punct && <span style={{ color: TOK.punct }}>{l.punct}</span>}
          </div>
        )
      })}
    </div>
  )
}

function ApiCard({ t, hlAt, theme }: { t: ApiTemplate; hlAt: (i: number) => Hl | undefined; theme: NeoTheme }) {
  const ep = hlAt(0)
  const st = hlAt(1)
  return (
    <div style={{ fontFamily: MONO, fontSize: 14, color: theme.textStrong, minWidth: 312 }}>
      {/* endpoint */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: 0.5,
            color: '#fff',
            background: METHOD_COLOR[t.method],
            padding: '2px 7px',
            borderRadius: 5,
            fontFamily: BODY_FONT,
          }}
        >
          {t.method}
        </span>
        <Slot hl={ep} style={{ color: theme.textStrong }}>
          {t.path}
        </Slot>
      </div>
      {/* status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.ok ? '#1c9b53' : '#e0463a', flexShrink: 0 }} />
        <Slot hl={st} style={{ color: theme.textMuted, fontSize: 13 }}>
          {t.status}
        </Slot>
      </div>
      {/* fields */}
      <div style={{ display: 'grid', gap: 7 }}>
        {t.fields.map((fld, i) => {
          const hl = hlAt(2 + i)
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 18 }}>
              <span style={{ color: TOK.key }}>&quot;{fld.key}&quot;</span>
              <Slot hl={hl}>
                <span style={{ color: TOK[fld.vKind ?? 'str'] }}>
                  {fld.vKind === 'num' || fld.vKind === 'bool' ? fld.val : `"${fld.val}"`}
                </span>
              </Slot>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ArtifactCard({ tmpl, hlAt, theme }: { tmpl: number; hlAt: (i: number) => Hl | undefined; theme: NeoTheme }) {
  const t = TEMPLATES[tmpl]
  if (t.family === 'table') return <TableCard t={t} hlAt={hlAt} theme={theme} />
  if (t.family === 'json') return <JsonCard t={t} hlAt={hlAt} theme={theme} />
  return <ApiCard t={t} hlAt={hlAt} theme={theme} />
}

// ── one card on the pile (landing pop + placement + opacity from the script) ────

function PileCard({ d, frame, theme }: { d: Drop; frame: number; theme: NeoTheme }) {
  const e = dropEnterAt(d, frame)
  const op = dropOpacityAt(d, frame)
  if (op <= 0.001) return null

  const marks = highlightsAt(d, frame)
  const map = new Map<number, Hl>()
  for (const m of marks) map.set(m.target, { p: m.p, kind: m.kind, accent: m.accent })
  const hlAt = (i: number) => map.get(i)

  // landing: drops in from above, oversized + over-rotated, settling to rest.
  const ty = d.dy + (1 - e) * -34
  const sc = d.scale * lerp(1.1, 1, e)
  const extraRot = (1 - e) * (d.rot >= 0 ? 8 : -8)

  const plate: CSSProperties = {
    ...elevation(theme, { depth: 'raised', distance: 15, blur: 34, radius: 20 }),
    padding: 22,
    border: `1px solid ${hexA('#0b1020', 0.05)}`,
    boxSizing: 'border-box',
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${d.dx}px), calc(-50% + ${ty}px)) rotate(${d.rot + extraRot}deg) scale(${sc})`,
        opacity: op,
        zIndex: d.id,
      }}
    >
      <div style={plate}>
        <ArtifactCard tmpl={d.tmpl} hlAt={hlAt} theme={theme} />
      </div>
    </div>
  )
}

function Scene() {
  const frame = useCurrentFrame()
  const theme = useNeoTheme()
  const cam = cameraAt(frame)
  const cards = activeDropsAt(frame)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT }}>
      <Fonts />
      <AbsoluteFill
        style={{
          transform: `translate(${cam.x}px, ${cam.y}px) scale(${cam.scale})`,
          transformOrigin: 'center center',
        }}
      >
        {cards.map((d) => (
          <PileCard key={d.id} d={d} frame={frame} theme={theme} />
        ))}
      </AbsoluteFill>
      {/* very faint vignette — footage cohesion; soft, since sources live at the
          edges of a full-screen field, no chrome */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: `radial-gradient(135% 105% at 50% 48%, transparent 72%, ${hexA('#1a2438', 0.08)} 100%)`,
        }}
      />
    </AbsoluteFill>
  )
}

export function LecturaVorazVideo() {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <Scene />
    </NeoThemeProvider>
  )
}
