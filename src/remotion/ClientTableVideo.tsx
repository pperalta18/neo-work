import { Fragment, type CSSProperties, type ReactNode } from 'react'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { BRAND, elevation, KIT_BLUE, TEXT_FONT, DISPLAY_FONT, lightTheme } from '@/lib/neumorphism'
import { NeoThemeProvider, useNeoTheme } from '@/stories/neo/NeoTheme'
import { Fonts, BODY_FONT } from './fonts'

/**
 * ClientTableVideo — a CRM "clientes" table that fills itself "a toda pastilla".
 * ─────────────────────────────────────────────────────────────────────────────
 * The table chrome (headers + empty cells) is there from frame 0; every field
 * then *writes itself in*, character by character, behind a blinking caret —
 * as if an autofill bot is racing across the sheet.
 *
 * The motion is one idea: a diagonal wavefront driven by a SINGLE ease-in-out
 * progress curve `g` (see fillG). Each cell sits at a fixed `phase` along the
 * front and types as `g` sweeps past it — so the front, and every cell's own
 * typing, eases in, blasts through the middle at peak velocity, then eases out.
 * That shared acceleration is what reads as real speed (not a linear march).
 *
 * Velocity (dg/dframe) is fed back into the look: at peak speed the lit band
 * stretches into a comet, the incoming text gets a horizontal motion-blur
 * smear, and the carets stretch into streaks — then it all sharpens as it
 * settles. Several cells are mid-keystroke at once ("todos los campos a la vez").
 *
 * As each row's last field (MRR) commits, the row counts as "imported": the
 * header progress bar advances, the contact counter ticks, and the footer MRR
 * total counts up. When the wavefront clears the last cell, an "✓ Sincronizado"
 * pill pops and the sheet settles.
 *
 * Timeline (30fps): fill eases across frames 8 → 100, then a short settle + hold.
 */

// ── data ─────────────────────────────────────────────────────────────────────

type StatusKey = 'activo' | 'prueba' | 'pendiente' | 'inactivo'

type Customer = {
  name: string
  company: string
  email: string
  phone: string
  plan: string
  status: StatusKey
  mrr: number
  /** Avatar accent (one of the brand hues). */
  accent: string
}

const CUSTOMERS: Customer[] = [
  { name: 'Ana García',   company: 'Estudio Marea',   email: 'ana@estudiomarea.es',   phone: '+34 612 044 198', plan: 'Pro',      status: 'activo',    mrr: 149, accent: KIT_BLUE },
  { name: 'Bruno Soler',  company: 'Cafés Ribera',    email: 'bruno@cafesribera.com', phone: '+34 645 921 330', plan: 'Business', status: 'activo',    mrr: 299, accent: BRAND.purple },
  { name: 'Carla Méndez', company: 'Nube Verde',      email: 'carla@nubeverde.io',    phone: '+34 600 158 472', plan: 'Starter',  status: 'prueba',    mrr: 49,  accent: BRAND.teal },
  { name: 'Diego Ferrer', company: 'Talleres Atlas',  email: 'diego@talleresatlas.es',phone: '+34 671 309 845', plan: 'Pro',      status: 'pendiente', mrr: 149, accent: BRAND.orange },
  { name: 'Elena Ruiz',   company: 'Clínica Sol',     email: 'elena@clinicasol.es',   phone: '+34 622 770 116', plan: 'Business', status: 'activo',    mrr: 299, accent: BRAND.green },
  { name: 'Fran Pardo',   company: 'Logística Ágora', email: 'fran@logagora.com',     phone: '+34 633 481 207', plan: 'Starter',  status: 'activo',    mrr: 49,  accent: BRAND.pink },
  { name: 'Gala Ortiz',   company: 'Moda Lumen',      email: 'gala@modalumen.es',     phone: '+34 688 015 943', plan: 'Pro',      status: 'prueba',    mrr: 149, accent: BRAND.violet },
  { name: 'Hugo Vela',    company: 'Bici Nómada',     email: 'hugo@bicinomada.cc',    phone: '+34 699 233 580', plan: 'Starter',  status: 'inactivo',  mrr: 0,   accent: BRAND.red },
  { name: 'Inés Cano',    company: 'Datalab Norte',   email: 'ines@datalabnorte.io',  phone: '+34 611 627 094', plan: 'Business', status: 'activo',    mrr: 299, accent: BRAND.teal },
]

const STATUS_LABEL: Record<StatusKey, string> = {
  activo: 'Activo',
  prueba: 'Prueba',
  pendiente: 'Pendiente',
  inactivo: 'Inactivo',
}

type ColKey = 'name' | 'company' | 'email' | 'phone' | 'plan' | 'status' | 'mrr'

type Column = {
  key: ColKey
  label: string
  width: number
  align: 'left' | 'center' | 'right'
}

const COLS: Column[] = [
  { key: 'name',    label: 'Cliente',  width: 230, align: 'left' },
  { key: 'company', label: 'Empresa',  width: 210, align: 'left' },
  { key: 'email',   label: 'Email',    width: 300, align: 'left' },
  { key: 'phone',   label: 'Teléfono', width: 190, align: 'left' },
  { key: 'plan',    label: 'Plan',     width: 120, align: 'left' },
  { key: 'status',  label: 'Estado',   width: 150, align: 'center' },
  { key: 'mrr',     label: 'MRR',      width: 130, align: 'right' },
]

const MRR_COL = COLS.findIndex((c) => c.key === 'mrr')

// ── geometry ───────────────────────────────────────────────────────────────

const GUTTER_W = 64 // avatar column
const HEADER_H = 46
const ROW_H = 56

// ── value formatting ─────────────────────────────────────────────────────────

const thousands = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
const eur = (n: number) => `€${thousands(n)}`

/** The full string a given cell types out. */
function cellText(row: Customer, col: Column): string {
  switch (col.key) {
    case 'status':
      return STATUS_LABEL[row.status]
    case 'mrr':
      return eur(row.mrr)
    default:
      return row[col.key]
  }
}

// ── fill maths ───────────────────────────────────────────────────────────────
//
// The whole sheet fills along ONE eased progress curve `g`. Each cell sits at a
// fixed "phase" along a diagonal wavefront and types as `g` sweeps past it.
// Because `g` is ease-in-out, the wavefront — AND each cell's own typing — eases
// in, blasts through the middle at peak velocity, then eases out. That shared
// acceleration is what actually reads as speed (vs. the old linear march).

const ROWS = CUSTOMERS.length
const NCOLS = COLS.length

const FILL_START = 8 // frame the wavefront leaves the top-left
const FILL_DUR = 92 // frames it takes to clear the whole sheet
const FILL_END = FILL_START + FILL_DUR
const TYPE_SPAN = 0.17 // span of `g` a single cell spends typing (sets overlap)

// Diagonal angle of the wavefront: row-dominant, columns trail slightly.
const ROW_W = 1
const COL_W = 0.58
const WMAX = (ROWS - 1) * ROW_W + (NCOLS - 1) * COL_W
const G_END = 1 + TYPE_SPAN // overshoot so the last cell still finishes typing

// Punchy in-out: near-flat ends, steep middle → strong velocity contrast.
const FILL_EASE = Easing.bezier(0.74, 0, 0.26, 1)

/** A cell's fixed position [0,1] along the diagonal wavefront. */
const phaseOf = (r: number, c: number) => (r * ROW_W + c * COL_W) / WMAX

/** Global eased fill progress: 0 → G_END across [FILL_START, FILL_END]. */
function fillG(frame: number): number {
  return interpolate(frame, [FILL_START, FILL_END], [0, G_END], {
    easing: FILL_EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

/** Peak per-frame velocity of `g`, sampled once — normalizes the speed cues. */
const V_PEAK = (() => {
  let peak = 1e-6
  for (let f = FILL_START; f <= FILL_END; f++) {
    const v = fillG(f) - fillG(f - 1)
    if (v > peak) peak = v
  }
  return peak
})()

export const CLIENT_TABLE_DURATION = FILL_END + 56

/** Value of `g` at which a cell has fully committed (all chars typed). */
const cellDoneG = (r: number, c: number) => phaseOf(r, c) + TYPE_SPAN

type CellState = {
  visible: string
  typing: boolean
  /** 0→1 active highlight, with a velocity-scaled comet tail behind the front. */
  glow: number
  started: boolean
  /** Horizontal motion-blur smear (px) for the incoming text + caret. */
  smear: number
}

// How far behind the front (in `g`-units) a finished cell keeps glowing. Scaled
// by velocity so the lit band stretches into a comet at peak speed.
const TRAIL_G = 0.16

/**
 * Resolve a cell against the current global progress `g` and normalized
 * velocity `vNorm`. `lp` is the cell's local typing progress [0,1].
 */
function cellState(full: string, phase: number, g: number, vNorm: number): CellState {
  const len = full.length
  const lp = Math.max(0, Math.min(1, (g - phase) / TYPE_SPAN))
  const count = Math.round(lp * len)
  const typing = lp > 0 && lp < 1
  const overshoot = g - (phase + TYPE_SPAN) // >0 once the cell has finished
  let glow: number
  if (lp <= 0) glow = 0
  else if (lp < 1) glow = 1
  else glow = Math.max(0, 1 - overshoot / (TRAIL_G * (0.25 + 0.75 * vNorm)))
  // Smear ramps with velocity² so it's invisible when crawling, a real streak at peak.
  const smear = typing ? vNorm * vNorm * 9 : 0
  return { visible: full.slice(0, count), typing, glow, started: g >= phase, smear }
}

const kitRGBA = (a: number) => `rgba(0,112,249,${a})`

// ── caret ──────────────────────────────────────────────────────────────────

function Caret({ on, color, smear = 0 }: { on: boolean; color: string; smear?: number }) {
  // At speed the caret stretches into a horizontal streak and stops blinking
  // (a fast-moving cursor reads as solid); at rest it's a thin blinking bar.
  const fast = smear > 1.2
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2 + smear * 0.9,
        height: '1.05em',
        marginLeft: 1,
        verticalAlign: '-0.16em',
        background: color,
        borderRadius: 1,
        opacity: fast ? 0.9 : on ? 0.95 : 0,
        boxShadow: smear > 0.5 ? `${-smear}px 0 ${smear * 1.2}px ${color}` : undefined,
      }}
    />
  )
}

// ── status pill ──────────────────────────────────────────────────────────────

function StatusPill({
  row,
  state,
  blink,
  theme,
}: {
  row: Customer
  state: CellState
  blink: boolean
  theme: ReturnType<typeof useNeoTheme>
}) {
  if (!state.started) return null
  const color = row.status === 'inactivo' ? theme.textMuted : BRAND[statusBrand(row.status)]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: '4px 11px',
        borderRadius: 999,
        background: `${color}1f`,
        color,
        fontSize: 12.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
      <span style={state.smear > 0.5 ? { textShadow: `${-state.smear}px 0 ${state.smear * 1.1}px ${color}aa` } : undefined}>
        {state.visible}
      </span>
      {state.typing && <Caret on={blink} color={color} smear={state.smear} />}
    </span>
  )
}

function statusBrand(s: StatusKey): keyof typeof BRAND {
  switch (s) {
    case 'activo':
      return 'green'
    case 'prueba':
      return 'teal'
    case 'pendiente':
      return 'yellow'
    default:
      return 'red'
  }
}

// ── avatar ───────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

// Pop with a little overshoot, driven by the same eased progress as the fill.
const BACK_EASE = Easing.bezier(0.34, 1.56, 0.64, 1)

function Avatar({
  row,
  appear,
  theme,
}: {
  row: Customer
  /** 0→1 as the wavefront reaches this row. */
  appear: number
  theme: ReturnType<typeof useNeoTheme>
}) {
  const started = appear > 0
  const s = interpolate(appear, [0, 1], [0, 1], { easing: BACK_EASE })
  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 13.5,
        fontWeight: 700,
        letterSpacing: 0.2,
        background: started ? `${row.accent}1f` : `${theme.textMuted}12`,
        color: row.accent,
        boxShadow: started ? `inset 0 0 0 1.5px ${row.accent}55` : `inset 0 0 0 1px ${theme.gridLine}`,
        transform: `scale(${0.55 + 0.45 * s})`,
      }}
    >
      <span style={{ opacity: Math.max(0, Math.min(1, appear * 1.4)) }}>{initials(row.name)}</span>
    </div>
  )
}

// ── main ─────────────────────────────────────────────────────────────────────

function TableInner() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const theme = useNeoTheme()

  // The table sits flat on the card — no pressed/recessed tray. The gridlines
  // and the rounded clip alone read as a table.
  const sheet = elevation(theme, { depth: 'flat', radius: 18 })
  const cardEnter = spring({ frame, fps, config: { damping: 200, mass: 0.8 } })

  // Blink shared by every active caret (one phase → they pulse in unison).
  const blink = Math.floor(frame / 4) % 2 === 0

  // The eased fill front + its instantaneous, normalized velocity. Everything
  // downstream (typing, glow comet, smear, progress bar) reads off these two.
  const g = fillG(frame)
  const vNorm = Math.max(0, Math.min(1, (g - fillG(frame - 1)) / V_PEAK))

  // How many rows have fully committed (their MRR cell has landed).
  const importedRows = CUSTOMERS.filter((_row, r) => g >= cellDoneG(r, MRR_COL))
  const importedCount = importedRows.length
  const importedMRR = importedRows.reduce((sum, row) => sum + row.mrr, 0)

  // The bar inherits the eased curve, so it visibly speeds up then settles.
  const fillProgress = Math.min(1, g / G_END)
  const done = frame >= FILL_END
  const syncPop = spring({ frame: frame - FILL_END, fps, config: { damping: 160, mass: 0.6 } })

  const tableW = GUTTER_W + COLS.reduce((w, c) => w + c.width, 0)
  const gridCols = `${GUTTER_W}px ${COLS.map((c) => `${c.width}px`).join(' ')}`
  // Card must wrap the grid (tableW) + the sheet's 10px inset on each side
  // + the card's own 40px padding on each side.
  const CARD_PAD = 40
  const SHEET_PAD = 10
  const cardW = tableW + (CARD_PAD + SHEET_PAD) * 2

  const justify = (a: Column['align']) =>
    a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start'

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: BODY_FONT,
      }}
    >
      <Fonts />
      <div
        style={{
          width: cardW,
          padding: CARD_PAD,
          borderRadius: 40,
          color: theme.textStrong,
          opacity: cardEnter,
          transform: `translateY(${(1 - cardEnter) * 18}px) scale(${0.985 + 0.015 * cardEnter})`,
          ...elevation(theme, { depth: 'raised', distance: 12, blur: 28, radius: 40 }),
        }}
      >
        {/* ── header ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: KIT_BLUE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 8px 20px -6px ${kitRGBA(0.5)}`,
            }}
          >
            <UsersGlyph />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontFamily: DISPLAY_FONT, fontSize: 27, fontWeight: 700 }}>Clientes</span>
            <span style={{ fontSize: 14, color: theme.textMuted }}>Base de datos · AiKit CRM</span>
          </div>

          {/* right: live import status */}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span style={{ fontSize: 13.5, color: theme.textMuted, fontVariantNumeric: 'tabular-nums' }}>
                {done ? `${importedCount} contactos sincronizados` : `Importando contactos… ${Math.round(fillProgress * 100)}%`}
              </span>
              <div
                style={{
                  width: 230,
                  height: 7,
                  borderRadius: 999,
                  overflow: 'hidden',
                  ...elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 999 }),
                }}
              >
                <div
                  style={{
                    width: `${fillProgress * 100}%`,
                    height: '100%',
                    borderRadius: 999,
                    background: done ? BRAND.green : KIT_BLUE,
                    boxShadow: `0 0 12px -2px ${done ? `${BRAND.green}cc` : kitRGBA(0.8)}`,
                  }}
                />
              </div>
            </div>
            {done && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: `${BRAND.green}1f`,
                  color: BRAND.green,
                  fontSize: 13.5,
                  fontWeight: 600,
                  opacity: syncPop,
                  transform: `scale(${0.8 + 0.2 * syncPop})`,
                }}
              >
                <CheckGlyph />
                Sincronizado
              </div>
            )}
          </div>
        </div>

        {/* ── sheet ───────────────────────────────────────────────── */}
        <div style={{ padding: SHEET_PAD, ...sheet }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridCols,
              borderTop: `1px solid ${theme.gridLine}`,
              borderLeft: `1px solid ${theme.gridLine}`,
              borderRadius: 10,
              overflow: 'hidden',
              fontFamily: TEXT_FONT,
            }}
          >
            {/* header row */}
            <HeaderCell theme={theme} />
            {COLS.map((col) => (
              <HeaderCell key={col.key} theme={theme} align={col.align}>
                {col.label}
              </HeaderCell>
            ))}

            {/* data rows */}
            {CUSTOMERS.map((row, r) => {
              const appear = Math.max(0, Math.min(1, (g - phaseOf(r, 0)) / 0.06))
              return (
                <Fragment key={r}>
                  {/* avatar gutter */}
                  <div
                    style={{
                      height: ROW_H,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: `1px solid ${theme.gridLine}`,
                      borderBottom: `1px solid ${theme.gridLine}`,
                    }}
                  >
                    <Avatar row={row} appear={appear} theme={theme} />
                  </div>

                  {COLS.map((col, c) => {
                    const full = cellText(row, col)
                    const st = cellState(full, phaseOf(r, c), g, vNorm)
                    const isName = col.key === 'name'
                    // Active highlight brightens with velocity → the front pulses harder mid-sweep.
                    const glowK = st.glow * (0.45 + 0.55 * vNorm)
                    const cellStyle: CSSProperties = {
                      position: 'relative',
                      height: ROW_H,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: justify(col.align),
                      padding: '0 14px',
                      borderRight: `1px solid ${theme.gridLine}`,
                      borderBottom: `1px solid ${theme.gridLine}`,
                      fontSize: 15,
                      fontWeight: isName ? 600 : 400,
                      color:
                        col.key === 'email' || col.key === 'phone' ? theme.textMuted : theme.textStrong,
                      fontVariantNumeric: col.key === 'mrr' ? 'tabular-nums' : undefined,
                      background: st.glow > 0 ? kitRGBA(0.05 + 0.06 * glowK) : 'transparent',
                      boxShadow: st.glow > 0 ? `inset 0 0 0 2px ${kitRGBA(0.3 + 0.55 * glowK)}` : undefined,
                      zIndex: st.glow > 0 ? 1 : undefined,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }
                    const textColor =
                      col.key === 'email' || col.key === 'phone' ? theme.textMuted : theme.textStrong

                    return (
                      <div key={col.key} style={cellStyle}>
                        {col.key === 'status' ? (
                          <StatusPill row={row} state={st} blink={blink} theme={theme} />
                        ) : (
                          <span>
                            <span
                              style={
                                st.smear > 0.5
                                  ? { textShadow: `${-st.smear}px 0 ${st.smear * 1.1}px ${textColor}99` }
                                  : undefined
                              }
                            >
                              {st.visible}
                            </span>
                            {st.typing && <Caret on={blink} color={KIT_BLUE} smear={st.smear} />}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </Fragment>
              )
            })}
          </div>
        </div>

        {/* ── footer ──────────────────────────────────────────────── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 20,
            fontSize: 14,
            color: theme.textMuted,
          }}
        >
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            <strong style={{ color: theme.textStrong, fontWeight: 600 }}>{importedCount}</strong> de{' '}
            {CUSTOMERS.length} clientes
          </span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            MRR total{' '}
            <strong style={{ color: theme.textStrong, fontWeight: 600 }}>{eur(importedMRR)}</strong>
          </span>
        </div>
      </div>
    </AbsoluteFill>
  )
}

function HeaderCell({
  theme,
  children,
  align = 'center',
}: {
  theme: ReturnType<typeof useNeoTheme>
  children?: ReactNode
  align?: Column['align']
}) {
  return (
    <div
      style={{
        height: HEADER_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent:
          align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
        padding: '0 14px',
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
        color: theme.textMuted,
        background: `${theme.textMuted}12`,
        borderRight: `1px solid ${theme.gridLine}`,
        borderBottom: `1px solid ${theme.gridLine}`,
      }}
    >
      {children}
    </div>
  )
}

function UsersGlyph() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CheckGlyph() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function ClientTableVideo() {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <TableInner />
    </NeoThemeProvider>
  )
}
