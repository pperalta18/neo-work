/**
 * encargoWebSearch — epílogo de EncargoChat tras construirse el proceso.
 * ──────────────────────────────────────────────────────────────────────────
 * Una abstracción de NAVEGADOR (la que tenemos: dots + barra de direcciones +
 * viewport recesado) EMERGE de sus celdas, vacía. Dentro empiezan a fluir datos
 * en texto plano (JSON, key:value, URLs…) con palabras DESTACADAS — estilo
 * {@link ConectoresDatosVideo} (HiSpan animado) — como una IA buscando la web.
 * Después el navegador se COMPRIME y emergen muchos MINI-navegadores por todo el
 * grid. Todo en coordenadas grid-local (hijo del div GW×GH) y función de `frame`.
 */
import { type CSSProperties, type ReactNode } from 'react'
import { BRAND, CELL, KIT_BLUE, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { BODY_FONT } from './fonts'

const theme = lightTheme

// ── math (port from ConectoresDatos) ──────────────────────────────────────────────
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10) }
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const rnd = (n: number) => {
  let t = (Math.imul(n | 0, 1103515245) + 12345) & 0x7fffffff
  t ^= t >> 13
  return (Math.imul(t, 2654435761) >>> 0) / 4294967296
}
const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const MONO = "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace"

// ── timeline (local frames, 0 = epilogue start) ───────────────────────────────────
const BROWSER_IN = 14
const BROWSER_FULL = 42
const DATA_IN = 44
const DATA_OUT_START = 168
const COMPRESS_START = 174
const COMPRESS_END = 202
export const WS_MINI = 188 // EncargoChat fades the left steps from here
/** Total length of the web-search epilogue, in frames. */
export const WS_LENGTH = 300

// ── the big browser footprint (grid cells) ────────────────────────────────────────
const BCOL0 = 8
const BROW0 = 2
const BCOLS = 8
const BROWS = 7
const BINSET = 22

const DOMAINS = [
  'proveedores-industriales.es',
  'tarifas-material.com',
  'b2b-catalogo.es',
  'comparador-precios.com',
  'mayorista-acero.es',
]

// ── animated highlight (port from ConectoresDatos HiSpan) ─────────────────────────
type Mk = 'underline' | 'box' | 'marker' | 'strike' | 'bracket'
type BrandKey = keyof typeof BRAND
function HiSpan({ children, p, k, c }: { children: ReactNode; p: number; k: Mk; c: BrandKey }) {
  const color = BRAND[c]
  const lit = p > 0.04
  let mark: ReactNode = null
  if (k === 'underline') {
    mark = <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-0.1em', height: '0.11em', borderRadius: 2, background: color, transformOrigin: 'left center', transform: `scaleX(${p})`, boxShadow: `0 0 0.4em ${hexA(color, 0.5 * p)}` }} />
  } else if (k === 'strike') {
    mark = <span style={{ position: 'absolute', left: 0, right: 0, top: '0.52em', height: '0.1em', borderRadius: 2, background: color, transformOrigin: 'left center', transform: `scaleX(${p})` }} />
  } else if (k === 'box') {
    const q = clamp01(p * 1.25)
    mark = <span style={{ position: 'absolute', inset: '-0.12em -0.22em', borderRadius: '0.28em', boxShadow: `inset 0 0 0 0.1em ${hexA(color, 0.85 * q)}`, background: hexA(color, 0.1 * q), transform: `scale(${1.08 - 0.08 * q})` }} />
  } else if (k === 'marker') {
    mark = (
      <span style={{ position: 'absolute', inset: '-0.06em -0.16em', borderRadius: '0.16em', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.82)} 8%, ${hexA(color, 0.72)} 92%, ${hexA(color, 0)} 100%)`, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} />
      </span>
    )
  } else {
    return (
      <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
        <span style={{ color, fontWeight: 700, opacity: p }}>[</span>
        <span style={{ color: lit ? '#1e1e20' : 'inherit', fontWeight: p > 0.35 ? 600 : 400 }}>{children}</span>
        <span style={{ color, fontWeight: 700, opacity: p }}>]</span>
      </span>
    )
  }
  return (
    <span style={{ position: 'relative', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {mark}
      <span style={{ position: 'relative', color: k === 'marker' ? '#16203a' : lit ? '#1e1e20' : undefined, fontWeight: p > 0.35 ? 600 : 400 }}>{children}</span>
    </span>
  )
}

// ── web-search data catalog (plain text; each fragment, one highlight) ─────────────
type Frag = { a: string; h: string; b?: string; k: Mk; c: BrandKey; mono?: boolean }
const WEB_FRAGS: Frag[] = [
  { a: '"precio": ', h: '1240.00', b: ',', k: 'box', c: 'blue', mono: true },
  { a: 'GET /search?q=', h: 'material+inox', k: 'underline', c: 'teal', mono: true },
  { a: 'resultado · ', h: 'Proveedor A', k: 'marker', c: 'orange' },
  { a: '{ "stock": ', h: 'true', b: ' }', k: 'box', c: 'green', mono: true },
  { a: 'precio medio ', h: '1.180 €', k: 'underline', c: 'blue' },
  { a: 'https://', h: 'tarifas-material.com', k: 'underline', c: 'teal', mono: true },
  { a: '"iva": ', h: '0.21', k: 'box', c: 'violet', mono: true },
  { a: 'comparativa · ', h: '5 fuentes', k: 'bracket', c: 'orange' },
  { a: 'material: ', h: 'acero inox', k: 'marker', c: 'blue' },
  { a: '"entrega": ', h: '"48 h"', k: 'box', c: 'green', mono: true },
  { a: 'descuento ', h: '-12 %', k: 'strike', c: 'red' },
  { a: 'ref. ', h: 'MTL-0934', k: 'underline', c: 'violet', mono: true },
  { a: 'unidad · ', h: '€/m²', k: 'bracket', c: 'teal', mono: true },
  { a: 'disponibilidad ', h: 'inmediata', k: 'marker', c: 'green' },
  { a: '"min_order": ', h: '50', b: ',', k: 'box', c: 'blue', mono: true },
  { a: 'opiniones ', h: '4,7★', k: 'underline', c: 'orange', mono: true },
  { a: 'origen: ', h: 'UE', k: 'box', c: 'violet' },
  { a: 'plazo medio ', h: '3 días', k: 'marker', c: 'teal' },
  { a: '"sku": ', h: '"AX-22-INX"', k: 'underline', c: 'blue', mono: true },
  { a: 'caducado ', h: 'precio 2023', k: 'strike', c: 'red' },
  { a: 'tarifa volumen ', h: '> 100 uds', k: 'bracket', c: 'orange', mono: true },
  { a: 'garantía: ', h: '2 años', k: 'underline', c: 'green' },
]

// ── the data sea inside a viewport (fragments fade in/out, highlight draws) ────────
const DSEED = 5501
function fragState(seed: number, frame: number, env: number) {
  const P = 46
  const ph = Math.floor(rnd(seed) * P)
  const t = (((frame - ph) % P) + P) % P
  const life = 30 + Math.floor(rnd(seed * 7) * 9) // 30..38
  if (t >= life) return null
  const op = Math.min(easeOut(clamp01(t / 6)), clamp01((life - t) / 9)) * env
  if (op <= 0.004) return null
  const round = Math.floor((frame - ph + P * 4096) / P)
  const fi = Math.floor(rnd(seed * 13 + round * 131) * WEB_FRAGS.length)
  const hp = clamp01((t - 5) / 13)
  return { op, fi, hp }
}

function ViewportData({ frame, env, w, h, cols, rows, fontSize }: { frame: number; env: number; w: number; h: number; cols: number; rows: number; fontSize: number }) {
  if (env <= 0.01) return null
  const mx = 80
  const my = 28
  const innerW = w - mx * 2
  const innerH = h - my * 2
  const nodes: ReactNode[] = []
  for (let ci = 0; ci < cols; ci += 1) {
    for (let ri = 0; ri < rows; ri += 1) {
      const idx = ci * rows + ri
      const seed = DSEED + idx
      const x = mx + ((ci + 0.5) / cols + (rnd(seed + 3) * 2 - 1) * 0.16 / cols) * innerW
      const y = my + ((ri + 0.5) / rows + (rnd(seed + 5) * 2 - 1) * 0.18 / rows) * innerH
      const r = fragState(seed, frame, env)
      if (!r) continue
      const f = WEB_FRAGS[r.fi]
      nodes.push(
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            transform: 'translate(-50%, -50%)',
            opacity: r.op,
            fontFamily: f.mono ? MONO : BODY_FONT,
            fontSize,
            lineHeight: 1.3,
            color: '#586074',
            whiteSpace: 'nowrap',
            letterSpacing: f.mono ? 0 : -0.1,
          }}
        >
          {f.a}
          <HiSpan p={r.hp} k={f.k} c={f.c}>{f.h}</HiSpan>
          {f.b}
        </div>,
      )
    }
  }
  return <>{nodes}</>
}

// ── browser chrome ────────────────────────────────────────────────────────────────
function Dot({ c }: { c: string }) {
  return <span style={{ width: 14, height: 14, borderRadius: '50%', background: c }} />
}

function NavBtn({ icon }: { icon: 'back' | 'arrow' | 'reload' }) {
  const plate = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 999 })
  return (
    <span style={{ width: 40, height: 40, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, ...plate }}>
      <Icon name={icon} size={18} color={theme.textMuted} strokeWidth={1.8} />
    </span>
  )
}

/** The big browser: emerges from its cells, holds the streaming data, then compresses. */
function BigBrowser({ frame }: { frame: number }) {
  const emerge = smoother(clamp01((frame - BROWSER_IN) / (BROWSER_FULL - BROWSER_IN)))
  if (emerge <= 0.001) return null
  const compress = smoother(clamp01((frame - COMPRESS_START) / (COMPRESS_END - COMPRESS_START)))
  const scale = lerp(0.96, 1, emerge) * lerp(1, 0.12, compress)
  const opacity = clamp01(emerge * 1.5) * (1 - compress)

  const x = (BCOL0 - 1) * CELL + BINSET
  const y = (BROW0 - 1) * CELL + BINSET
  const w = BCOLS * CELL - BINSET * 2
  const h = BROWS * CELL - BINSET * 2

  const dataEnv = ease01(frame, DATA_IN, DATA_IN + 14) * (1 - ease01(frame, DATA_OUT_START, COMPRESS_START + 6))
  const liveUrl = DOMAINS[Math.max(0, Math.floor((frame - DATA_IN) / 26)) % DOMAINS.length]

  const card = elevation(theme, { depth: 'raised', distance: 12 * emerge, blur: 26 * emerge, radius: 22 })
  const addressBar = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 999 })
  const viewport = elevation(theme, { depth: 'recessed', distance: 5, blur: 12, radius: 16 })
  const tab = elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 12 })

  return (
    <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, transformOrigin: '50% 50%', transform: `scale(${scale})`, opacity }}>
      <div style={{ position: 'absolute', inset: 0, padding: 22, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: TEXT_FONT, ...card }}>
        {/* tab strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <Dot c={BRAND.red} />
            <Dot c={BRAND.orange} />
            <Dot c={BRAND.green} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', fontSize: 18, letterSpacing: -0.2, color: theme.textStrong, ...tab }}>
            <Icon name="global" size={18} color={theme.textMuted} strokeWidth={1.7} />
            Buscando en la web
          </div>
          <span style={{ fontSize: 17, color: theme.textMuted, opacity: 0.55 }}>Nueva pestaña</span>
        </div>
        {/* toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <NavBtn icon="back" />
          <NavBtn icon="arrow" />
          <NavBtn icon="reload" />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', fontSize: 18, color: theme.textMuted, ...addressBar }}>
            <Icon name="lock" size={16} color={theme.textMuted} strokeWidth={1.8} />
            <span style={{ color: theme.textStrong }}>{liveUrl}</span>
          </div>
        </div>
        {/* viewport — the streaming data */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', ...viewport }}>
          <ViewportData frame={frame} env={dataEnv} w={w - 44} h={h - 150} cols={5} rows={7} fontSize={16} />
        </div>
      </div>
    </div>
  )
}

function ease01(frame: number, a: number, b: number) {
  return smoother(clamp01((frame - a) / (b - a)))
}

// ── the field of mini-browsers (emerge after the big one compresses) ───────────────
type Mini = { col: number; row: number }
const MINI_LATTICE_COLS = [2, 5, 8, 11, 14]
const MINI_LATTICE_ROWS = [2, 4, 6, 8]
const MINIS: Mini[] = MINI_LATTICE_ROWS.flatMap((row, ri) =>
  MINI_LATTICE_COLS.map((col, ci) => ({
    col: col + (rnd((ri * 7 + ci) * 31 + 1) * 2 - 1) * 0.5,
    row: row + (rnd((ri * 7 + ci) * 31 + 2) * 2 - 1) * 0.4,
  })),
)
const MINI_W = 2.7 * CELL
const MINI_H = 1.7 * CELL

function MiniBrowser({ mini, frame, i }: { mini: Mini; frame: number; i: number }) {
  // scattered bloom across the grid (not row-by-row): random start within a window
  const start = WS_MINI + Math.floor(rnd((i + 1) * 53) * 64)
  const grow = smoother(clamp01((frame - start) / 18))
  if (grow <= 0.001) return null
  const scale = lerp(0.86, 1, grow)
  const opacity = clamp01(grow * 1.6)
  const cxp = (mini.col - 0.5) * CELL
  const cyp = (mini.row - 0.5) * CELL
  const card = elevation(theme, { depth: 'raised', distance: 7 * grow, blur: 15 * grow, radius: 14 })
  const seed = 800 + i
  const env = clamp01((frame - start - 8) / 10) // tiny data sea inside, after it appears
  const frag = WEB_FRAGS[Math.floor(rnd(seed) * WEB_FRAGS.length)]
  const hp = clamp01(((frame - start - 10) % 40) / 13)

  return (
    <div style={{ position: 'absolute', left: cxp - MINI_W / 2, top: cyp - MINI_H / 2, width: MINI_W, height: MINI_H, transformOrigin: '50% 50%', transform: `scale(${scale})`, opacity }}>
      <div style={{ position: 'absolute', inset: 0, padding: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 8, fontFamily: TEXT_FONT, ...card }}>
        {/* mini tab strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.red }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.orange }} />
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: BRAND.green }} />
          <span style={{ marginLeft: 6, flex: 1, height: 8, borderRadius: 999, background: theme.gridLine }} />
        </div>
        {/* mini viewport — one highlighted data line */}
        <div style={{ flex: 1, borderRadius: 9, background: hexA('#c3cddb', 0.18), boxShadow: `inset 0 0 0 1px ${theme.gridLine}`, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 7, overflow: 'hidden' }}>
          <div style={{ fontSize: 10.5, color: '#586074', whiteSpace: 'nowrap', fontFamily: frag.mono ? MONO : BODY_FONT, opacity: env }}>
            {frag.a}
            <HiSpan p={hp * env} k={frag.k} c={frag.c}>{frag.h}</HiSpan>
          </div>
          <div style={{ height: 7, width: '82%', borderRadius: 999, background: theme.gridLine, opacity: 0.7 * env }} />
          <div style={{ height: 7, width: '64%', borderRadius: 999, background: theme.gridLine, opacity: 0.5 * env }} />
        </div>
      </div>
    </div>
  )
}

/** The web-search epilogue. Renders inside the grid div (grid-local coords). */
export function WebSearch({ frame }: { frame: number }) {
  return (
    <>
      <BigBrowser frame={frame} />
      {MINIS.map((m, i) => (
        <MiniBrowser key={i} mini={m} frame={frame} i={i} />
      ))}
    </>
  )
}
