/**
 * InventoryDashboardVideo — an inventory dashboard that builds itself.
 * ──────────────────────────────────────────────────────────────────────────
 * In the "Store Create" lineage (an unseen agent assembling a UI live), but the
 * UI is a neumorphic INVENTORY dashboard and there is almost no copy — the
 * *building behaviour itself* tells the story. The window's outline traces
 * itself (AppWindow's `draw` entrance), then module after module emerges from
 * the recessed viewport and **fills with motion**, never with text:
 *
 *   · the sidebar rail powers on icon by icon
 *   · four KPI tiles pop and their numbers count up (sparkline draws itself)
 *   · the "stock por categoría" bars grow from the baseline, one after another
 *   · a stock-health donut sweeps to fill, its centre number counting up
 *   · the inventory list cascades in row by row — swatches, stock bars, qtys
 *   · a warehouse bin-map heat-grid lights up in a diagonal wave
 *
 * House motion rules (specs/motion-language.md + ./motion): eased `interpolate`
 * only, ease-out, NO bounce/spring; depth from neumorphic relief (elevation())
 * never a coloured glow. Every pixel is a pure function of `useCurrentFrame()`
 * — no Math.random / Date.now — so frame N is byte-identical on every render.
 *
 * Reuses the design system (lightTheme · BRAND · KIT_BLUE · elevation · the
 * AppWindow shell · the motion CURVE/DUR tokens · Universal Sans). The data
 * widgets are bespoke, tuned for "poco texto, mucha animación".
 */

import { type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import {
  BRAND,
  KIT_BLUE,
  TEXT_FONT,
  DISPLAY_FONT,
  elevation,
  lightTheme,
} from '@/lib/neumorphism'
import { AikitLogo } from '@/components/AikitLogo'
import { AppWindow } from './aikit/AppWindow'
import { CURVE, DUR, ease } from './motion'
import { Fonts } from './fonts'

const theme = lightTheme
const SURFACE = theme.surface
const INK = theme.textStrong
const MUTED = theme.textMuted
const LINE = theme.gridLine
const BLUE = KIT_BLUE
const GREEN = BRAND.green
const ORANGE = BRAND.orange
const RED = BRAND.red

export const INVENTORY_DASHBOARD_DURATION = 330 // 11 s @ 30 fps

// ── timeline (composition frames) ───────────────────────────────────────────
// The window draws 0–24 and its content fades in ~26–38 (AppWindow defaults);
// every module gates its own opacity from 0, so these starts choreograph the
// build on top of a viewport that is already "lit".
const T = {
  sidebar: 30,
  header: 36,
  kpi: 48, // + i*7
  bars: 70, // well emerges, then bars grow staggered from 84
  donut: 92,
  list: 108, // card emerges, rows cascade from 124
  binmap: 150, // grid emerges, cells light up in a wave from 162
  sheen: 196, // one arrival sweep across the glass
  live: 250, // a small "live data" tick so the settled frame still breathes
} as const

// ── helpers ─────────────────────────────────────────────────────────────────
const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Spanish thousands grouping (1.248 · 38.420) — no locale dependency. */
const fmt = (n: number) =>
  Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** A number that counts up from 0 → `to` across [start, start+dur]. */
const countUp = (frame: number, start: number, to: number, dur = DUR.grand) =>
  lerp(0, to, ease(frame, start, start + dur, CURVE.standard))

/**
 * A card's "emerge": flat → raised. The plate fades + lifts as its relief
 * grows (the StoreCreate idiom), returning the wrapper styles + a 0→1 `p` so
 * callers can stagger their inner content after the plate has landed.
 */
function useEmerge(start: number, radius = 26) {
  const frame = useCurrentFrame()
  const p = ease(frame, start, start + DUR.reveal, CURVE.enter)
  const plate = elevation(theme, {
    depth: 'raised',
    distance: lerp(4, 11, p),
    blur: lerp(8, 24, p),
    radius,
  })
  return {
    frame,
    p,
    style: {
      ...plate,
      opacity: clamp01(p * 1.35),
      transform: `translateY(${(1 - p) * 20}px)`,
    } as CSSProperties,
  }
}

// ── inline glyphs (the icon set has no warehouse vocabulary, so draw them) ────
function Glyph({
  name,
  size = 20,
  color = MUTED,
  w = 1.7,
}: {
  name: string
  size?: number
  color?: string
  w?: number
}) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    box: (
      <>
        <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      </>
    ),
    layers: (
      <>
        <path d="M12 3 21 8l-9 5-9-5z" />
        <path d="M3 13l9 5 9-5M3 8" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V4" />
        <path d="M4 20h16" />
        <path d="M8 16v-3M12 16V8M16 16v-6" />
      </>
    ),
    truck: (
      <>
        <path d="M2 6h11v9H2zM13 9h4l3 3v3h-7z" />
        <circle cx="7" cy="17.5" r="1.6" />
        <circle cx="17" cy="17.5" r="1.6" />
      </>
    ),
    tag: (
      <>
        <path d="M3 11.5 11.5 3H20v8.5L11.5 20z" />
        <circle cx="15.5" cy="7.5" r="1.3" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3.5 21 19H3z" />
        <path d="M12 9.5v4M12 16.6v.2" />
      </>
    ),
    inbox: (
      <>
        <path d="M3.5 13.5 6 5h12l2.5 8.5v5h-17z" />
        <path d="M3.5 13.5h5l1.5 2.5h4l1.5-2.5h5" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.5 15.5 20 20" />
      </>
    ),
    sliders: (
      <>
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
        <circle cx="16" cy="7" r="2" />
        <circle cx="8" cy="17" r="2" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6z" />
        <path d="M10 20a2 2 0 004 0" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Composition root.
// ─────────────────────────────────────────────────────────────────────────────
export const InventoryDashboardVideo: React.FC = () => {
  const frame = useCurrentFrame()
  // faint constructor field behind the window, flashing in then resting low
  const fieldOp = interpolate(frame, [0, 10, 30, 60], [0, 0.5, 0.5, 0.32], clampE)

  return (
    <AbsoluteFill style={{ background: SURFACE, fontFamily: TEXT_FONT }}>
      <Fonts />

      {/* neumorphic constructor grid — the surface the UI is assembled on */}
      <AbsoluteFill
        style={{
          opacity: fieldOp,
          backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`,
          backgroundSize: '64px 64px',
          backgroundPosition: 'center',
          maskImage: 'radial-gradient(120% 120% at 50% 50%, #000 35%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(120% 120% at 50% 50%, #000 35%, transparent 78%)',
        }}
      />

      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <AppWindow
          title="Inventario"
          icon="global"
          width={1680}
          height={984}
          enter="draw"
          enterAt={0}
          viewportPadding={22}
        >
          <Dashboard />
        </AppWindow>
      </AbsoluteFill>

      {/* one arrival sheen sweeping across the assembled glass */}
      <Sheen />
    </AbsoluteFill>
  )
}

/** The dashboard layout — a sidebar rail + the main column of modules. */
function Dashboard() {
  return (
    <div style={{ display: 'flex', gap: 22, width: '100%', height: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Header />
        <KpiRow />
        <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: 18 }}>
          {/* left — the chart well + the warehouse heat-map */}
          <div style={{ flex: 1.55, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <BarChartCard />
            <BinMapCard />
          </div>
          {/* right — the health donut + the inventory list */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <DonutCard />
            <InventoryListCard />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── sidebar rail ──────────────────────────────────────────────────────────────
const NAV = ['grid', 'box', 'chart', 'truck', 'tag', 'gear'] as const
const NAV_ACTIVE = 1 // box = inventory

function Sidebar() {
  const frame = useCurrentFrame()
  const railP = ease(frame, T.sidebar, T.sidebar + DUR.reveal, CURVE.enter)
  const rail = elevation(theme, { depth: 'raised', distance: lerp(4, 9, railP), blur: lerp(8, 20, railP), radius: 26 })
  const logoP = ease(frame, T.sidebar + 2, T.sidebar + 2 + DUR.base, CURVE.enter)

  return (
    <div
      style={{
        width: 78,
        flexShrink: 0,
        ...rail,
        opacity: clamp01(railP * 1.3),
        transform: `translateX(${(1 - railP) * -14}px)`,
        padding: '18px 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {/* the AiKit mark on a raised tile */}
      <div
        style={{
          ...elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 }),
          width: 42,
          height: 42,
          display: 'grid',
          placeItems: 'center',
          opacity: logoP,
          transform: `scale(${0.9 + 0.1 * logoP})`,
        }}
      >
        <AikitLogo variant="mark" height={20} markColor={BLUE} />
      </div>
      <div style={{ width: 30, height: 1, background: LINE, marginBottom: 2 }} />
      {NAV.map((n, i) => {
        const p = ease(frame, T.sidebar + 8 + i * 4, T.sidebar + 8 + i * 4 + DUR.base, CURVE.enter)
        const active = i === NAV_ACTIVE
        const tile = active
          ? elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 13 })
          : {}
        return (
          <div
            key={n}
            style={{
              ...tile,
              width: 44,
              height: 44,
              display: 'grid',
              placeItems: 'center',
              opacity: p,
              transform: `translateY(${(1 - p) * 8}px)`,
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: -18,
                  width: 4,
                  height: 22,
                  borderRadius: 3,
                  background: BLUE,
                }}
              />
            )}
            <Glyph name={n} size={21} color={active ? BLUE : MUTED} w={active ? 1.9 : 1.7} />
          </div>
        )
      })}
    </div>
  )
}

// ── header ──────────────────────────────────────────────────────────────────
function Header() {
  const frame = useCurrentFrame()
  const p = ease(frame, T.header, T.header + DUR.reveal, CURVE.enter)
  const search = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 999 })
  const btn = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 14 })
  const addBtn = elevation(theme, { depth: 'raised', distance: 4, blur: 10, radius: 14 })

  // a quiet "Inventario" eyebrow + a live count chip (the only words on screen)
  const count = Math.round(countUp(frame, T.header + 6, 1248))
  return (
    <div
      style={{
        height: 54,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        opacity: clamp01(p * 1.3),
        transform: `translateY(${(1 - p) * -10}px)`,
      }}
    >
      <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 600, fontSize: 22, letterSpacing: -0.4, color: INK }}>
        Inventario
      </span>
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: BLUE,
          background: `${BLUE}16`,
          borderRadius: 999,
          padding: '4px 11px',
        }}
      >
        {fmt(count)} SKU
      </span>

      <div style={{ flex: 1 }} />

      {/* search pill — placeholder bars, no text */}
      <div style={{ ...search, width: 230, height: 38, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        <Glyph name="search" size={16} color={MUTED} />
        <span style={{ width: 92, height: 7, borderRadius: 4, background: LINE }} />
      </div>
      <div style={{ ...btn, width: 40, height: 40, display: 'grid', placeItems: 'center' }}>
        <Glyph name="sliders" size={18} color={MUTED} />
      </div>
      <div style={{ ...btn, width: 40, height: 40, display: 'grid', placeItems: 'center', position: 'relative' }}>
        <Glyph name="bell" size={18} color={MUTED} />
        <span style={{ position: 'absolute', top: 9, right: 10, width: 7, height: 7, borderRadius: 999, background: ORANGE }} />
      </div>
      {/* the primary "add" action — the one accent button */}
      <div
        style={{
          ...addBtn,
          background: BLUE,
          width: 40,
          height: 40,
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 6px 16px ${BLUE}38`,
        }}
      >
        <Glyph name="plus" size={20} color="#fff" w={2.2} />
      </div>
    </div>
  )
}

// ── KPI row ─────────────────────────────────────────────────────────────────
type Kpi = {
  label: string
  to: number
  icon: string
  accent: string
  chip?: { sign: '+' | '−'; v: string; color: string }
  spark?: number[]
}
const KPIS: Kpi[] = [
  { label: 'SKUs', to: 1248, icon: 'box', accent: BLUE, chip: { sign: '+', v: '3,2%', color: GREEN } },
  { label: 'Unidades', to: 38420, icon: 'layers', accent: BLUE, spark: [40, 52, 46, 63, 58, 74, 86] },
  { label: 'Bajo mínimo', to: 12, icon: 'alert', accent: ORANGE, chip: { sign: '−', v: '4', color: GREEN } },
  { label: 'Entradas hoy', to: 76, icon: 'inbox', accent: GREEN, chip: { sign: '+', v: '18', color: GREEN } },
]

function KpiRow() {
  return (
    <div style={{ display: 'flex', gap: 18, height: 150 }}>
      {KPIS.map((k, i) => (
        <KpiCard key={k.label} kpi={k} start={T.kpi + i * 7} idx={i} />
      ))}
    </div>
  )
}

function KpiCard({ kpi, start, idx }: { kpi: Kpi; start: number; idx: number }) {
  const { style } = useEmerge(start, 22)
  const frame = useCurrentFrame()
  // a tiny "live" tick on the last tile so the settled frame keeps breathing
  const liveBump = idx === 3 ? Math.round(interpolate(frame, [T.live, T.live + 10], [0, 2], clampE)) : 0
  const value = Math.round(countUp(frame, start + 8, kpi.to)) + liveBump

  return (
    <div style={{ ...style, flex: 1, minWidth: 0, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 11, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: MUTED, textTransform: 'uppercase' }}>
          {kpi.label}
        </span>
        <div
          style={{
            ...elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 10 }),
            width: 32,
            height: 32,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Glyph name={kpi.icon} size={17} color={kpi.accent} w={1.8} />
        </div>
      </div>

      <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 34, letterSpacing: -1, lineHeight: 1, color: INK }}>
        {fmt(value)}
      </span>

      <div style={{ height: 22, display: 'flex', alignItems: 'center' }}>
        {kpi.spark ? (
          <Sparkline data={kpi.spark} start={start + 12} />
        ) : kpi.chip ? (
          <Chip {...kpi.chip} start={start + 14} />
        ) : null}
      </div>
    </div>
  )
}

function Chip({ sign, v, color, start }: { sign: '+' | '−'; v: string; color: string; start: number }) {
  const frame = useCurrentFrame()
  const p = ease(frame, start, start + DUR.base, CURVE.enter)
  const up = sign === '+'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 12.5,
        fontWeight: 700,
        color,
        background: `${color}1f`,
        borderRadius: 999,
        padding: '3px 9px',
        opacity: p,
        transform: `translateY(${(1 - p) * 6}px)`,
      }}
    >
      <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
        {up ? <path d="M6 15l6-6 6 6" /> : <path d="M6 9l6 6 6-6" />}
      </svg>
      {sign}
      {v}
    </span>
  )
}

function Sparkline({ data, start }: { data: number[]; start: number }) {
  const frame = useCurrentFrame()
  const w = 96
  const h = 22
  const min = Math.min(...data)
  const max = Math.max(...data)
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((d - min) / (max - min || 1)) * (h - 4) - 2,
  }))
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const draw = ease(frame, start, start + DUR.reveal, CURVE.standard)
  const last = pts[pts.length - 1]
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <path d={d} fill="none" stroke={BLUE} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      <circle cx={last.x} cy={last.y} r={2.6} fill={BLUE} opacity={clamp01((draw - 0.85) / 0.15)} />
    </svg>
  )
}

// ── bar chart · stock por categoría ───────────────────────────────────────────
const BARS = [
  { v: 58, c: 'soft' },
  { v: 82, c: 'soft' },
  { v: 44, c: 'soft' },
  { v: 70, c: 'soft' },
  { v: 96, c: 'peak' },
  { v: 52, c: 'soft' },
  { v: 36, c: 'low' },
] as const
const SWATCH = [BLUE, '#16b3cf', '#5856d6', GREEN, BLUE, ORANGE, RED]

function BarChartCard() {
  const { style, frame } = useEmerge(T.bars, 26)
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 11, radius: 18 })
  const titleP = ease(frame, T.bars + 4, T.bars + 4 + DUR.base, CURVE.enter)

  return (
    <div style={{ ...style, flex: 1, minHeight: 0, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: titleP }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: BLUE }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>Stock por categoría</span>
        <div style={{ flex: 1 }} />
        <Glyph name="chart" size={17} color={MUTED} />
      </div>

      {/* recessed plotting well */}
      <div style={{ ...well, flex: 1, minHeight: 0, padding: '18px 20px 14px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* faint gridlines */}
        <div style={{ position: 'absolute', inset: '18px 20px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          {[0, 1, 2, 3].map((g) => (
            <div key={g} style={{ height: 1, background: LINE }} />
          ))}
        </div>

        {/* bars */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'flex-end', gap: '3.2%' }}>
          {BARS.map((b, i) => {
            const start = 84 + i * 5
            const grow = ease(frame, start, start + 16, CURVE.standard)
            // gentle "live" breathing of the peak after everything settles
            const breathe = b.c === 'peak' ? 1 + 0.02 * Math.sin((frame - T.live) * 0.12) * clamp01((frame - T.live) / 12) : 1
            const hPct = b.v * grow * breathe
            const fill =
              b.c === 'peak' ? BLUE : b.c === 'low' ? `${RED}cc` : `${BLUE}5e`
            const pop = clamp01((grow - 0.9) / 0.1)
            return (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
                {/* peak value chip */}
                {b.c === 'peak' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: `${hPct}%`,
                      left: '50%',
                      transform: 'translate(-50%, -8px)',
                      background: BLUE,
                      color: '#fff',
                      fontSize: 11.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 7,
                      whiteSpace: 'nowrap',
                      opacity: pop,
                      boxShadow: `0 4px 10px ${BLUE}40`,
                    }}
                  >
                    9.6k
                  </div>
                )}
                <div
                  style={{
                    height: `${hPct}%`,
                    borderRadius: '7px 7px 4px 4px',
                    background: fill,
                    boxShadow: b.c === 'peak' ? `0 4px 12px ${BLUE}33` : undefined,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* x ticks — colour swatches, no labels (poco texto) */}
        <div style={{ display: 'flex', gap: '3.2%', marginTop: 10 }}>
          {BARS.map((_, i) => {
            const p = clamp01(ease(frame, 84 + i * 5 + 6, 84 + i * 5 + 6 + DUR.base, CURVE.enter))
            return (
              <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <span style={{ width: 16, height: 5, borderRadius: 3, background: SWATCH[i], opacity: 0.55 * p }} />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── donut · salud del stock ───────────────────────────────────────────────────
function DonutCard() {
  const { style, frame } = useEmerge(T.donut, 26)
  const titleP = ease(frame, T.donut + 4, T.donut + 4 + DUR.base, CURVE.enter)

  const R = 58
  const C = 2 * Math.PI * R
  const pct = 87
  const sweep = ease(frame, T.donut + 10, T.donut + 10 + DUR.grand, CURVE.standard)
  const filled = (pct / 100) * sweep
  const center = Math.round(countUp(frame, T.donut + 12, pct))

  return (
    <div style={{ ...style, padding: 24, display: 'flex', flexDirection: 'column', gap: 14, height: 246 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: titleP }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: GREEN }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>Salud del stock</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ position: 'relative', width: 152, height: 152, flexShrink: 0 }}>
          <svg width={152} height={152} viewBox="0 0 152 152">
            {/* recessed-looking track */}
            <circle cx={76} cy={76} r={R} fill="none" stroke={LINE} strokeWidth={14} />
            <circle
              cx={76}
              cy={76}
              r={R}
              fill="none"
              stroke={GREEN}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - filled)}
              transform="rotate(-90 76 76)"
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 38, letterSpacing: -1.5, lineHeight: 1, color: INK }}>
              {center}
              <span style={{ fontSize: 18, color: MUTED }}>%</span>
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, color: MUTED, textTransform: 'uppercase', marginTop: 2 }}>óptimo</span>
          </div>
        </div>

        {/* tiny legend — dots + bars, no sentences */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 13 }}>
          {[
            { c: GREEN, w: 0.86, label: 'Óptimo' },
            { c: ORANGE, w: 0.4, label: 'Bajo' },
            { c: RED, w: 0.18, label: 'Agotado' },
          ].map((r, i) => {
            const p = ease(frame, T.donut + 16 + i * 4, T.donut + 16 + i * 4 + DUR.base, CURVE.enter)
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, opacity: p, transform: `translateX(${(1 - p) * 10}px)` }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: r.c, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: MUTED, width: 52 }}>{r.label}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 4, background: LINE, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.w * 100 * p}%`, background: r.c, borderRadius: 4 }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── inventory list ─────────────────────────────────────────────────────────────
type Row = { swatch: string; nameW: number; skuW: number; level: number; qty: number; status: string }
const ROWS: Row[] = [
  { swatch: BLUE, nameW: 132, skuW: 64, level: 0.82, qty: 1240, status: GREEN },
  { swatch: '#16b3cf', nameW: 108, skuW: 58, level: 0.64, qty: 860, status: GREEN },
  { swatch: '#5856d6', nameW: 150, skuW: 72, level: 0.31, qty: 210, status: ORANGE },
  { swatch: GREEN, nameW: 96, skuW: 52, level: 0.74, qty: 980, status: GREEN },
  { swatch: ORANGE, nameW: 124, skuW: 60, level: 0.12, qty: 48, status: RED },
  { swatch: RED, nameW: 116, skuW: 66, level: 0.55, qty: 620, status: GREEN },
]

function InventoryListCard() {
  const { style, frame } = useEmerge(T.list, 26)
  const titleP = ease(frame, T.list + 4, T.list + 4 + DUR.base, CURVE.enter)

  return (
    <div style={{ ...style, flex: 1, minHeight: 0, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: titleP }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: BLUE }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>Artículos</span>
        <div style={{ flex: 1 }} />
        <Glyph name="sliders" size={16} color={MUTED} />
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {ROWS.map((r, i) => {
          const start = 124 + i * 7
          const p = ease(frame, start, start + DUR.base, CURVE.enter)
          // last-row status flips to "received" on the live tick
          const liveQty = i === 4 ? Math.round(interpolate(frame, [T.live, T.live + 12], [0, 64], clampE)) : 0
          const qty = Math.round(countUp(frame, start + 6, r.qty)) + liveQty
          const fill = ease(frame, start + 4, start + 4 + DUR.reveal, CURVE.standard)
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                borderTop: i === 0 ? 'none' : `1px solid ${LINE}`,
                opacity: clamp01(p * 1.3),
                transform: `translateX(${(1 - p) * 14}px)`,
              }}
            >
              {/* category swatch tile */}
              <div
                style={{
                  ...elevation(theme, { depth: 'raised', distance: 2, blur: 6, radius: 10 }),
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span style={{ width: 14, height: 14, borderRadius: 5, background: r.swatch }} />
              </div>

              {/* name + sku placeholder bars (poco texto) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: 150 }}>
                <span style={{ width: r.nameW * p, height: 8, borderRadius: 4, background: '#c7cfde' }} />
                <span style={{ width: r.skuW * p, height: 6, borderRadius: 4, background: LINE }} />
              </div>

              <div style={{ flex: 1 }} />

              {/* mini stock bar */}
              <div style={{ width: 88, height: 8, borderRadius: 4, background: LINE, overflow: 'hidden', flexShrink: 0 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${r.level * 100 * fill}%`,
                    background: r.level < 0.2 ? RED : r.level < 0.4 ? ORANGE : GREEN,
                    borderRadius: 4,
                  }}
                />
              </div>

              {/* qty */}
              <span style={{ width: 56, textAlign: 'right', fontSize: 15, fontWeight: 600, color: INK, fontVariantNumeric: 'tabular-nums' }}>
                {fmt(qty)}
              </span>

              {/* status dot */}
              <span style={{ width: 9, height: 9, borderRadius: 999, background: i === 4 && frame > T.live + 6 ? GREEN : r.status, flexShrink: 0 }} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── warehouse bin-map heat grid ───────────────────────────────────────────────
const BIN_COLS = 22
const BIN_ROWS = 4

function BinMapCard() {
  const { style, frame } = useEmerge(T.binmap, 26)
  const titleP = ease(frame, T.binmap + 4, T.binmap + 4 + DUR.base, CURVE.enter)
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })

  const cells = []
  for (let r = 0; r < BIN_ROWS; r++) {
    for (let c = 0; c < BIN_COLS; c++) {
      cells.push({ c, r })
    }
  }

  return (
    <div style={{ ...style, height: 172, padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: titleP }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: '#16b3cf' }} />
        <span style={{ fontSize: 15, fontWeight: 600, color: INK }}>Ocupación de almacén</span>
        <div style={{ flex: 1 }} />
        {/* legend gradient ticks */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[0.18, 0.42, 0.68, 0.92].map((a) => (
            <span key={a} style={{ width: 14, height: 6, borderRadius: 2, background: `rgba(0,112,249,${a})` }} />
          ))}
        </div>
      </div>

      <div style={{ ...well, flex: 1, minHeight: 0, padding: 12 }}>
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: `repeat(${BIN_COLS}, 1fr)`,
            gridTemplateRows: `repeat(${BIN_ROWS}, 1fr)`,
            gap: 5,
          }}
        >
          {cells.map(({ c, r }) => {
            // deterministic, organic intensity field
            const intensity = clamp01(0.22 + 0.6 * Math.abs(Math.sin(c * 0.55 + r * 1.27) * Math.cos(c * 0.21 - r * 0.4)))
            const low = intensity < 0.3
            const start = T.binmap + 12 + (c * 0.7 + r * 2)
            const p = ease(frame, start, start + DUR.quick, CURVE.enter)
            const bg = low ? `rgba(255,163,34,${0.35 + 0.4 * p})` : `rgba(0,112,249,${(0.1 + intensity * 0.62) * p})`
            return (
              <div
                key={`${c}-${r}`}
                style={{
                  borderRadius: 4,
                  background: bg,
                  opacity: clamp01(p * 1.2),
                  transform: `scale(${0.6 + 0.4 * p})`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── arrival sheen ──────────────────────────────────────────────────────────────
function Sheen() {
  const frame = useCurrentFrame()
  const x = interpolate(frame, [T.sheen, T.sheen + 34], [-0.3, 1.3], { ...clampE, easing: CURVE.standard })
  const op = clamp01(ease(frame, T.sheen, T.sheen + 8, CURVE.enter) - ease(frame, T.sheen + 26, T.sheen + 40, CURVE.enter))
  if (op <= 0) return null
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: op * 0.5,
          background: 'linear-gradient(108deg, transparent 44%, rgba(255,255,255,0.5) 50%, transparent 56%)',
          transform: `translateX(${x * 100}%)`,
        }}
      />
    </AbsoluteFill>
  )
}
