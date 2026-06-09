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
import { CURVE, ease } from './motion'
import { Fonts, BODY_FONT } from './fonts'

/**
 * InventoryTableVideo — a clothing-store "Inventario" sheet that fills itself,
 * then collapses into a single process-grid tile.
 * ─────────────────────────────────────────────────────────────────────────────
 * Same self-filling engine as ClientTableVideo: the table chrome (headers +
 * empty cells) is present from frame 0, then every field *writes itself in*,
 * character by character, behind a blinking caret, as a diagonal wavefront
 * sweeps the sheet — an autofill bot racing a clothing inventory into place.
 *
 * Stripped to the essentials (no decorative chrome): a plain title (no mark),
 * no header KPI / progress bar, no per-row product icons, no stock gauge bar.
 * Stock is a plain unit count; "Estado" uses an ACCESSIBLE treatment — a
 * distinct icon SHAPE plus a high-contrast dark label, so state never relies on
 * colour alone.
 *
 * OUTRO (additive — the fill above is untouched): after a hold, the content
 * fades out, the whole card collapses to a CELL-sized square and dissolves, and
 * an elevated "process" plate carrying a chevron resolves in — i.e. the table
 * folds down into one of the raised tiles we drop on the grid de procesos. Kept
 * factored so the morph can be reused as an end pattern elsewhere.
 *
 * Timeline (30fps): fill 8 → 100, hold, then the morph settles by ~196.
 */

// ── data ─────────────────────────────────────────────────────────────────────

type Item = {
  product: string
  sku: string
  category: string
  /** Brand hue keyed to the category — the small category dot. */
  accent: string
  size: string
  color: string
  /** Hex of the colour swatch (the fabric colour, not the brand accent). */
  swatch: string
  /** Units on hand. */
  stock: number
  /** PVP in euros (with cents). */
  price: number
}

// One distinct category (and brand hue) per row — the sheet reads as a full
// little collection rather than nine of the same thing.
const ITEMS: Item[] = [
  { product: 'Camiseta orgánica', sku: 'CAM-2401', category: 'Camisetas',  accent: BRAND.teal,   size: 'XS–XL', color: 'Blanco',      swatch: '#f3f1ec', stock: 128, price: 24.95 },
  { product: 'Camisa de lino',    sku: 'CMS-1180', category: 'Camisas',    accent: KIT_BLUE,     size: 'S–XXL', color: 'Celeste',     swatch: '#bcd8ee', stock: 73,  price: 45.0  },
  { product: 'Vaquero slim',      sku: 'PAN-3307', category: 'Pantalones', accent: BRAND.purple, size: '38–46', color: 'Índigo',      swatch: '#3a4a7a', stock: 54,  price: 59.9  },
  { product: 'Vestido midi',      sku: 'VES-0925', category: 'Vestidos',   accent: BRAND.violet, size: 'XS–L',  color: 'Verde oliva', swatch: '#6f7a3a', stock: 12,  price: 79.0  },
  { product: 'Falda plisada',     sku: 'FAL-2208', category: 'Faldas',     accent: BRAND.pink,   size: 'XS–L',  color: 'Burdeos',     swatch: '#7a2230', stock: 38,  price: 39.95 },
  { product: 'Abrigo de lana',    sku: 'ABR-0412', category: 'Abrigos',    accent: BRAND.orange, size: 'S–XL',  color: 'Camel',       swatch: '#c19a6b', stock: 21,  price: 149.0 },
  { product: 'Jersey de punto',   sku: 'PUN-3320', category: 'Punto',      accent: BRAND.green,  size: 'S–XL',  color: 'Crudo',       swatch: '#e8ddc7', stock: 7,   price: 54.95 },
  { product: 'Zapatilla retro',   sku: 'CAL-7702', category: 'Calzado',    accent: BRAND.red,    size: '36–45', color: 'Hueso',       swatch: '#efe9dd', stock: 0,   price: 89.0  },
  { product: 'Bolso tote',        sku: 'ACC-8841', category: 'Accesorios', accent: BRAND.yellow, size: 'Única', color: 'Negro',       swatch: '#23232a', stock: 96,  price: 35.0  },
]

// ── stock status ──────────────────────────────────────────────────────────────

type StatusKey = 'ok' | 'bajo' | 'agotado'
const statusOf = (stock: number): StatusKey =>
  stock === 0 ? 'agotado' : stock <= 15 ? 'bajo' : 'ok'
const STATUS_LABEL: Record<StatusKey, string> = {
  ok: 'En stock',
  bajo: 'Stock bajo',
  agotado: 'Agotado',
}

// ── columns ────────────────────────────────────────────────────────────────

type ColKey = 'product' | 'sku' | 'category' | 'size' | 'color' | 'stock' | 'price' | 'status'

type Column = {
  key: ColKey
  label: string
  width: number
  align: 'left' | 'center' | 'right'
}

const COLS: Column[] = [
  { key: 'product',  label: 'Artículo',   width: 252, align: 'left' },
  { key: 'sku',      label: 'Referencia', width: 142, align: 'left' },
  { key: 'category', label: 'Categoría',  width: 172, align: 'left' },
  { key: 'size',     label: 'Tallas',     width: 110, align: 'center' },
  { key: 'color',    label: 'Color',      width: 158, align: 'left' },
  { key: 'stock',    label: 'Stock',      width: 122, align: 'left' },
  { key: 'price',    label: 'PVP',        width: 124, align: 'right' },
  { key: 'status',   label: 'Estado',     width: 168, align: 'left' },
]

const STATUS_COL = COLS.findIndex((c) => c.key === 'status')

// ── geometry ───────────────────────────────────────────────────────────────

const HEADER_H = 46
const ROW_H = 56
const CARD_PAD = 40
const SHEET_PAD = 10
const TABLE_W = COLS.reduce((w, c) => w + c.width, 0)
const CARD_W = TABLE_W + (CARD_PAD + SHEET_PAD) * 2
const CONTENT_W = CARD_W - CARD_PAD * 2
// The card's natural content height — made DETERMINISTIC by the explicit
// line-heights below (TITLE_LH + GAP + SUB_LH header, SHEET_H sheet, FOOT_LH
// footer, plus the two margins). The morph box is sized to wrap it exactly, then
// interpolates this and CARD_W down to a single grid cell. Keep these in sync if
// the rows / paddings change.
const TITLE_LH = 36
const SUB_LH = 18
const FOOT_LH = 18
const HEADER_GAP = 4
const HEADER_MB = 24
const FOOTER_MT = 20
const GRID_H = HEADER_H + ITEMS.length * ROW_H + 1 // tracks + container borderTop (border-box)
const SHEET_H = GRID_H + SHEET_PAD * 2
const CONTENT_H =
  TITLE_LH + HEADER_GAP + SUB_LH + HEADER_MB + SHEET_H + FOOTER_MT + FOOT_LH
const CARD_H = CONTENT_H + CARD_PAD * 2
// The grid cell we collapse into (the Figma 128px module).
const TILE_PX = 128

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// ── value formatting ─────────────────────────────────────────────────────────

const groupThousands = (s: string) => s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
/** €24,95 — Spanish grouping (dot thousands, comma cents). */
const eur = (n: number) => {
  const [int, dec] = n.toFixed(2).split('.')
  return `€${groupThousands(int)},${dec}`
}

/** The full string a given cell types out. */
function cellText(row: Item, col: Column): string {
  switch (col.key) {
    case 'status':
      return STATUS_LABEL[statusOf(row.stock)]
    case 'price':
      return eur(row.price)
    case 'stock':
      return row.stock.toString()
    default:
      return row[col.key]
  }
}

// ── fill maths (ported from ClientTableVideo) ─────────────────────────────────
//
// The whole sheet fills along ONE eased progress curve `g`. Each cell sits at a
// fixed "phase" along a diagonal wavefront and types as `g` sweeps past it.
// Because `g` is ease-in-out, the wavefront — AND each cell's own typing — eases
// in, blasts through the middle at peak velocity, then eases out.

const ROWS = ITEMS.length
const NCOLS = COLS.length

const FILL_START = 8
const FILL_DUR = 92
const FILL_END = FILL_START + FILL_DUR
const TYPE_SPAN = 0.17

const ROW_W = 1
const COL_W = 0.58
const WMAX = (ROWS - 1) * ROW_W + (NCOLS - 1) * COL_W
// The last cell finishes typing at g = 1 + TYPE_SPAN. Sweep a little past that so
// its trailing scan-glow has room to fade out completely before the hold —
// otherwise the final cell keeps a lit blue box (and reads as still "active").
const GLOW_SETTLE = 0.09
const G_END = 1 + TYPE_SPAN + GLOW_SETTLE

const FILL_EASE = Easing.bezier(0.74, 0, 0.26, 1)

const phaseOf = (r: number, c: number) => (r * ROW_W + c * COL_W) / WMAX

function fillG(frame: number): number {
  return interpolate(frame, [FILL_START, FILL_END], [0, G_END], {
    easing: FILL_EASE,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

const V_PEAK = (() => {
  let peak = 1e-6
  for (let f = FILL_START; f <= FILL_END; f++) {
    const v = fillG(f) - fillG(f - 1)
    if (v > peak) peak = v
  }
  return peak
})()

// ── outro morph: the finished sheet folds into a single grid tile ──────────────
// Additive only — none of the fill maths above changes. After a hold, ONE box
// morphs: the table content fades out while the SAME box continuously shrinks
// (CARD_W×CARD_H → 128²), its radius eases 40 → 26 and its raised shadow eases
// from the card's relief to the tile's — and a chevron fades in inside it. No
// crossfade, no swap: the card literally becomes the process tile.

const SETTLE_HOLD = 40
const MORPH_START = FILL_END + SETTLE_HOLD // 140
const CONTENT_FADE_END = MORPH_START + 12 // 152 — content disappears first
const COLLAPSE_START = MORPH_START + 8 // 148 — then the one box shrinks + morphs
const COLLAPSE_END = COLLAPSE_START + 34 // 182
const CHEVRON_START = COLLAPSE_START + 20 // 168 — the arrow resolves inside it
const CHEVRON_END = COLLAPSE_END + 6 // 188
const END_HOLD = 26
export const INVENTORY_TABLE_DURATION = CHEVRON_END + END_HOLD // 214

// Raised relief at each end of the morph — same theme colours, only the offset +
// blur change, so the box-shadow interpolates cleanly between them.
const CARD_DIST = 12
const CARD_BLUR = 28
const TILE_DIST = 8
const TILE_BLUR = 16
const CARD_RADIUS = 40
const TILE_RADIUS = 26

const cellDoneG = (r: number, c: number) => phaseOf(r, c) + TYPE_SPAN

type CellState = {
  visible: string
  typing: boolean
  glow: number
  started: boolean
  smear: number
}

const TRAIL_G = 0.16

function cellState(full: string, phase: number, g: number, vNorm: number): CellState {
  const len = full.length
  const lp = Math.max(0, Math.min(1, (g - phase) / TYPE_SPAN))
  const count = Math.round(lp * len)
  const typing = lp > 0 && lp < 1
  const overshoot = g - (phase + TYPE_SPAN)
  let glow: number
  if (lp <= 0) glow = 0
  else if (lp < 1) glow = 1
  else glow = Math.max(0, 1 - overshoot / (TRAIL_G * (0.25 + 0.75 * vNorm)))
  const smear = typing ? vNorm * vNorm * 9 : 0
  return { visible: full.slice(0, count), typing, glow, started: g >= phase, smear }
}

const kitRGBA = (a: number) => `rgba(0,112,249,${a})`

// ── caret ──────────────────────────────────────────────────────────────────

function Caret({ on, color, smear = 0 }: { on: boolean; color: string; smear?: number }) {
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

// ── status icons (shape carries the state, not colour alone) ───────────────────

/** Healthy: a quiet outline tick — the calm default, so problems can stand out. */
function CheckMark({ color }: { color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/** Low stock: a filled warning triangle with a white "!" — pops, high contrast. */
function WarnBadge({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 3.6 2.8 19.4a1 1 0 0 0 .87 1.5h16.66a1 1 0 0 0 .87-1.5L12 3.6Z" fill={color} />
      <path d="M12 9.4v4.3" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
      <circle cx="12" cy="16.9" r="1.15" fill="#fff" />
    </svg>
  )
}

/** Out of stock: a filled circle with a white "×" — unmistakable, high contrast. */
function CrossBadge({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" fill={color} />
      <path d="M9.2 9.2 14.8 14.8M14.8 9.2 9.2 14.8" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
}

/**
 * StatusCell — accessible stock state. The icon SHAPE (tick / triangle / cross)
 * and the always-present text label both encode the state, so it never relies
 * on colour alone; labels sit in high-contrast ink. The healthy state is kept
 * calm and the exceptions (low / out) are emphasised so the eye finds problems.
 */
function StatusCell({
  row,
  state,
  blink,
  theme,
}: {
  row: Item
  state: CellState
  blink: boolean
  theme: ReturnType<typeof useNeoTheme>
}) {
  if (!state.started) return null
  const key = statusOf(row.stock)
  const icon =
    key === 'ok' ? (
      <CheckMark color={BRAND.green} />
    ) : key === 'bajo' ? (
      <WarnBadge color={BRAND.orange} />
    ) : (
      <CrossBadge color={BRAND.red} />
    )
  const weight = key === 'ok' ? 500 : 600
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        whiteSpace: 'nowrap',
        color: theme.textStrong,
        fontSize: 14,
        fontWeight: weight,
      }}
    >
      <span style={{ display: 'inline-flex', width: 16, justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={state.smear > 0.5 ? { textShadow: `${-state.smear}px 0 ${state.smear * 1.1}px ${theme.textStrong}99` } : undefined}>
        {state.visible}
      </span>
      {state.typing && <Caret on={blink} color={KIT_BLUE} smear={state.smear} />}
    </span>
  )
}

// ── stock cell (a plain unit count) ───────────────────────────────────────────

function StockCell({
  row,
  state,
  blink,
  theme,
}: {
  row: Item
  state: CellState
  blink: boolean
  theme: ReturnType<typeof useNeoTheme>
}) {
  if (!state.started) return null
  const out = row.stock === 0
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 3,
        fontVariantNumeric: 'tabular-nums',
        color: out ? theme.textMuted : theme.textStrong,
        fontSize: 15,
      }}
    >
      <span style={state.smear > 0.5 ? { textShadow: `${-state.smear}px 0 ${state.smear * 1.1}px ${theme.textStrong}99` } : undefined}>
        {state.visible}
      </span>
      {state.typing ? (
        <Caret on={blink} color={KIT_BLUE} smear={state.smear} />
      ) : (
        <span style={{ fontSize: 11.5, color: theme.textMuted }}>uds</span>
      )}
    </span>
  )
}

// ── the table content (the self-filling sheet, minus the card chrome) ──────────
// The chrome (size / radius / relief) lives on the morph box in <Scene> so it can
// interpolate down to a tile; this renders only the fixed-width content, which
// fades out during the morph. Explicit line-heights keep CARD_H deterministic.

function TableContent() {
  const frame = useCurrentFrame()
  const theme = useNeoTheme()

  const sheet = elevation(theme, { depth: 'flat', radius: 18 })

  const blink = Math.floor(frame / 4) % 2 === 0

  const g = fillG(frame)
  const vNorm = Math.max(0, Math.min(1, (g - fillG(frame - 1)) / V_PEAK))

  // Rows fully committed (their Estado cell has landed) drive the footer totals.
  const stockedItems = ITEMS.filter((_row, r) => g >= cellDoneG(r, STATUS_COL))
  const stockedCount = stockedItems.length
  const stockedUnits = stockedItems.reduce((sum, row) => sum + row.stock, 0)

  const gridCols = COLS.map((c) => `${c.width}px`).join(' ')

  const justify = (a: Column['align']) =>
    a === 'right' ? 'flex-end' : a === 'center' ? 'center' : 'flex-start'

  return (
    <div style={{ width: CONTENT_W, color: theme.textStrong }}>
      {/* ── header: just the title ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: HEADER_GAP, marginBottom: HEADER_MB }}>
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 30, fontWeight: 600, letterSpacing: -0.3, lineHeight: `${TITLE_LH}px` }}>
          Inventario
        </span>
        <span style={{ fontSize: 14, color: theme.textMuted, letterSpacing: 0.1, lineHeight: `${SUB_LH}px` }}>
          Tienda de ropa · Temporada AW
        </span>
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
            {COLS.map((col) => (
              <HeaderCell key={col.key} theme={theme} align={col.align}>
                {col.label}
              </HeaderCell>
            ))}

            {/* data rows */}
            {ITEMS.map((row, r) => (
              <Fragment key={r}>
                {COLS.map((col, c) => {
                  const full = cellText(row, col)
                  const st = cellState(full, phaseOf(r, c), g, vNorm)
                  const isProduct = col.key === 'product'
                  const glowK = st.glow * (0.45 + 0.55 * vNorm)
                  const muted = col.key === 'sku'
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
                    fontWeight: isProduct ? 600 : 400,
                    color: muted ? theme.textMuted : theme.textStrong,
                    fontVariantNumeric:
                      col.key === 'price' || col.key === 'sku' ? 'tabular-nums' : undefined,
                    background: st.glow > 0 ? kitRGBA(0.05 + 0.06 * glowK) : 'transparent',
                    boxShadow: st.glow > 0 ? `inset 0 0 0 2px ${kitRGBA(0.3 + 0.55 * glowK)}` : undefined,
                    zIndex: st.glow > 0 ? 1 : undefined,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }

                  let content: ReactNode
                  if (col.key === 'status') {
                    content = <StatusCell row={row} state={st} blink={blink} theme={theme} />
                  } else if (col.key === 'stock') {
                    content = <StockCell row={row} state={st} blink={blink} theme={theme} />
                  } else if (col.key === 'category') {
                    content = (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                        {st.started && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: row.accent, flexShrink: 0 }} />
                        )}
                        <span style={st.smear > 0.5 ? { textShadow: `${-st.smear}px 0 ${st.smear * 1.1}px ${theme.textStrong}99` } : undefined}>
                          {st.visible}
                        </span>
                        {st.typing && <Caret on={blink} color={KIT_BLUE} smear={st.smear} />}
                      </span>
                    )
                  } else if (col.key === 'color') {
                    content = (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
                        {st.started && (
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 4,
                              background: row.swatch,
                              boxShadow: `inset 0 0 0 1px rgba(30,30,40,0.2)`,
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <span style={st.smear > 0.5 ? { textShadow: `${-st.smear}px 0 ${st.smear * 1.1}px ${theme.textStrong}99` } : undefined}>
                          {st.visible}
                        </span>
                        {st.typing && <Caret on={blink} color={KIT_BLUE} smear={st.smear} />}
                      </span>
                    )
                  } else {
                    content = (
                      <span>
                        <span
                          style={
                            st.smear > 0.5
                              ? { textShadow: `${-st.smear}px 0 ${st.smear * 1.1}px ${(muted ? theme.textMuted : theme.textStrong)}99` }
                              : undefined
                          }
                        >
                          {st.visible}
                        </span>
                        {st.typing && <Caret on={blink} color={KIT_BLUE} smear={st.smear} />}
                      </span>
                    )
                  }

                  return (
                    <div key={col.key} style={cellStyle}>
                      {content}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>

      {/* ── footer ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: FOOTER_MT,
          fontSize: 14,
          lineHeight: `${FOOT_LH}px`,
          color: theme.textMuted,
        }}
      >
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <strong style={{ color: theme.textStrong, fontWeight: 600 }}>{stockedCount}</strong> de{' '}
          {ITEMS.length} referencias
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          <strong style={{ color: theme.textStrong, fontWeight: 600 }}>{groupThousands(stockedUnits.toString())}</strong>{' '}
          unidades en stock
        </span>
      </div>
    </div>
  )
}

// ── scene: ONE box that fills, then truly morphs into a single grid tile ───────
// The same element interpolates width/height/radius/box-shadow from the card to
// the tile — no second element, no crossfade — while its content fades out and a
// chevron resolves in. Both ends use elevation(raised) with the same theme
// colours, so the relief morphs continuously (only distance + blur change).

function Scene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const theme = useNeoTheme()

  // Intro relief settle (unchanged), now applied to the morph box.
  const cardEnter = spring({ frame, fps, config: { damping: 200, mass: 0.8 } })

  const contentOpacity = 1 - ease(frame, MORPH_START, CONTENT_FADE_END, CURVE.exit)
  const c = ease(frame, COLLAPSE_START, COLLAPSE_END, CURVE.standard)
  const chevron = ease(frame, CHEVRON_START, CHEVRON_END, CURVE.enter)

  const w = lerp(CARD_W, TILE_PX, c)
  const h = lerp(CARD_H, TILE_PX, c)
  const radius = lerp(CARD_RADIUS, TILE_RADIUS, c)
  const boxShadow = elevation(theme, {
    depth: 'raised',
    distance: lerp(CARD_DIST, TILE_DIST, c),
    blur: lerp(CARD_BLUR, TILE_BLUR, c),
  }).boxShadow as string

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT }}>
      <Fonts />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'relative',
            boxSizing: 'border-box',
            width: w,
            height: h,
            borderRadius: radius,
            backgroundColor: theme.surface,
            boxShadow,
            overflow: 'hidden',
            opacity: cardEnter,
            transform: `translateY(${(1 - cardEnter) * 18}px) scale(${0.985 + 0.015 * cardEnter})`,
          }}
        >
          {/* the table content, anchored at the card inset and fixed-size, so it
              never reflows — it just fades out and is clipped as the box shrinks */}
          <div style={{ position: 'absolute', top: CARD_PAD, left: CARD_PAD, opacity: Math.max(0, contentOpacity) }}>
            <TableContent />
          </div>

          {/* the chevron, centred, resolving in as the box reaches tile size */}
          {chevron > 0.001 && (
            <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', opacity: chevron }}>
              <svg
                width={40}
                height={40}
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.textMuted}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ transform: `rotate(-90deg) scale(${lerp(0.7, 1, chevron)})` }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>
          )}
        </div>
      </AbsoluteFill>
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

export function InventoryTableVideo() {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <Scene />
    </NeoThemeProvider>
  )
}
