/**
 * lecturaVorazScript — pure frame-driven brain of «Lectura voraz».
 * ───────────────────────────────────────────────────────────────────────────
 * An AiKit AI processing information from everywhere at once. Structured SOURCES
 * — data tables, JSON objects, API responses — keep RAINING into the frame ALL
 * OVER THE SCREEN (scattered edge to edge, bleeding off the borders), dozens alive
 * at once. Each artifact lands (slightly rotated, scaled, overlapping its
 * neighbours, newest on top) and is immediately scanned: a frantic burst of
 * HIGHLIGHTS sweeps its cells / lines / fields (underline, box, sweep). Every
 * source DIMS as it ages and the oldest dissolve — continuously, throughout — so
 * the freshest pop and the field has depth; after the rain stops it drains to bare
 * surface, the very last source fading last. No window chrome, no labels, no
 * narration: just real source content being read alive, everywhere, fast.
 *
 * Same authoring contract as tejidoVivoScript / flowBuilderScript: EVERYTHING is
 * a pure function of (frame). The whole choreography — drop cadence, placement,
 * per-card highlight schedule — is generated ONCE at module load from a seeded
 * PRNG (no Date.now / Math.random), so the studio and the Remotion render agree
 * frame-for-frame and the scheduler is unit-testable without rendering. The
 * visual shell (LecturaVorazVideo) only reads these anchors; it owns pixel sizes
 * and the artifact renderers, never the timing.
 */
import { BRAND, KIT_BLUE } from '@/lib/neumorphism'
import { CURVE, ease } from './motion'

// ── global scene config (30 fps) ───────────────────────────────────────────────

export const FPS = 30
export const WIDTH = 1920
export const HEIGHT = 1080

const SEED = 0x5ea12cf

// ── tiny pure utilities ─────────────────────────────────────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Deterministic PRNG (mulberry32) — one stream seeded once, no global RNG. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates over [0..n) using the shared rng → a scattered scan order. */
function shuffledRange(n: number, rng: () => number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── the source catalogue (abstract-but-REAL: content, no UI chrome) ─────────────
//
// Each template is an AiKit-internal view of a real structured source. The text
// is the payload the AI reads; there is deliberately no window chrome, toolbar or
// title. `targetCount(t)` is the number of highlightable slots, and the renderer
// MUST emit those slots in the SAME canonical reading order the scheduler assumes
// (tables: row-major; json: top→bottom over value lines; api: endpoint, status,
// then fields top→bottom) so highlight indices line up without measuring the DOM.

export type Family = 'table' | 'json' | 'api'

export type TableTemplate = {
  family: 'table'
  cols: { label: string; w: number; align?: 'left' | 'right' | 'center' }[]
  rows: string[][]
}

export type JsonKind = 'str' | 'num' | 'bool' | 'id'
export type JsonLine = {
  indent: number
  key?: string
  val?: string
  vKind?: JsonKind
  /** trailing punctuation drawn dim after the value (`,`), or a lone brace. */
  punct?: string
}
export type JsonTemplate = {
  family: 'json'
  lines: JsonLine[]
}

export type ApiTemplate = {
  family: 'api'
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  status: string
  ok: boolean
  fields: { key: string; val: string; vKind?: JsonKind }[]
}

export type Template = TableTemplate | JsonTemplate | ApiTemplate

/** Indices of json lines that carry a key/value (the highlightable ones). */
export function jsonTargetLines(t: JsonTemplate): number[] {
  const out: number[] = []
  t.lines.forEach((l, i) => {
    if (l.key !== undefined || l.val !== undefined) out.push(i)
  })
  return out
}

/** Highlightable slot count, in canonical reading order. */
export function targetCount(t: Template): number {
  switch (t.family) {
    case 'table':
      return t.rows.length * t.cols.length
    case 'json':
      return jsonTargetLines(t).length
    case 'api':
      return 2 + t.fields.length // endpoint, status, fields…
  }
}

const tbl = (
  cols: TableTemplate['cols'],
  rows: string[][],
): TableTemplate => ({ family: 'table', cols, rows })

export const TEMPLATES: Template[] = [
  // ── tables ────────────────────────────────────────────────────────────────
  tbl(
    [
      { label: 'Pedido', w: 116 },
      { label: 'Cliente', w: 168 },
      { label: 'Importe', w: 104, align: 'right' },
      { label: 'Estado', w: 124 },
    ],
    [
      ['ORD-8841', 'Marta Ruiz', '€149,00', 'Pagado'],
      ['ORD-8842', 'Nadia Cole', '€59,90', 'Pendiente'],
      ['ORD-8843', 'Leo Alonso', '€24,95', 'Pagado'],
      ['ORD-8844', 'Iván Prats', '€312,40', 'Enviado'],
      ['ORD-8845', 'Sofía Vela', '€45,00', 'Reembolso'],
      ['ORD-8846', 'Hugo Mena', '€88,20', 'Pagado'],
    ],
  ),
  tbl(
    [
      { label: 'SKU', w: 118 },
      { label: 'Artículo', w: 176 },
      { label: 'Stock', w: 86, align: 'right' },
      { label: 'PVP', w: 96, align: 'right' },
    ],
    [
      ['CAM-2401', 'Camiseta org.', '128', '€24,95'],
      ['CMS-1180', 'Camisa lino', '73', '€45,00'],
      ['PAN-3307', 'Vaquero slim', '54', '€59,90'],
      ['ABR-0412', 'Abrigo lana', '21', '€149,00'],
      ['PUN-3320', 'Jersey punto', '7', '€54,95'],
      ['CAL-7702', 'Zapatilla', '0', '€89,00'],
    ],
  ),
  tbl(
    [
      { label: 'Fecha', w: 112 },
      { label: 'Concepto', w: 188 },
      { label: 'Débito', w: 104, align: 'right' },
      { label: 'Saldo', w: 112, align: 'right' },
    ],
    [
      ['12 jun', 'Nómina junio', '—', '€4.218,50'],
      ['13 jun', 'Proveedor Telas', '€1.240,00', '€2.978,50'],
      ['15 jun', 'Cobro ORD-8844', '+€312,40', '€3.290,90'],
      ['18 jun', 'Suscripción SaaS', '€89,00', '€3.201,90'],
      ['21 jun', 'Devolución cliente', '€45,00', '€3.156,90'],
    ],
  ),
  tbl(
    [
      { label: 'Ticket', w: 104 },
      { label: 'Asunto', w: 196 },
      { label: 'Prioridad', w: 110 },
      { label: 'Estado', w: 116 },
    ],
    [
      ['#4821', 'No llega el pedido', 'Alta', 'Abierto'],
      ['#4822', 'Cambio de talla', 'Media', 'En curso'],
      ['#4823', 'Factura incorrecta', 'Alta', 'Abierto'],
      ['#4824', 'Consulta de envío', 'Baja', 'Resuelto'],
      ['#4825', 'Producto dañado', 'Alta', 'En curso'],
    ],
  ),
  // ── json ──────────────────────────────────────────────────────────────────
  {
    family: 'json',
    lines: [
      { indent: 0, punct: '{' },
      { indent: 1, key: 'id', val: 'ord_8841', vKind: 'id', punct: ',' },
      { indent: 1, key: 'cliente', val: 'Marta Ruiz', vKind: 'str', punct: ',' },
      { indent: 1, key: 'total', val: '149.00', vKind: 'num', punct: ',' },
      { indent: 1, key: 'pagado', val: 'true', vKind: 'bool', punct: ',' },
      { indent: 1, key: 'items', val: '3', vKind: 'num', punct: ',' },
      { indent: 1, key: 'moneda', val: 'EUR', vKind: 'str' },
      { indent: 0, punct: '}' },
    ],
  },
  {
    family: 'json',
    lines: [
      { indent: 0, punct: '{' },
      { indent: 1, key: 'sku', val: 'PAN-3307', vKind: 'id', punct: ',' },
      { indent: 1, key: 'nombre', val: 'Vaquero slim', vKind: 'str', punct: ',' },
      { indent: 1, key: 'stock', val: '54', vKind: 'num', punct: ',' },
      { indent: 1, key: 'almacen', val: 'MAD-02', vKind: 'str', punct: ',' },
      { indent: 1, key: 'activo', val: 'true', vKind: 'bool', punct: ',' },
      { indent: 1, key: 'precio', val: '59.90', vKind: 'num' },
      { indent: 0, punct: '}' },
    ],
  },
  {
    family: 'json',
    lines: [
      { indent: 0, punct: '{' },
      { indent: 1, key: 'evento', val: 'pago.recibido', vKind: 'str', punct: ',' },
      { indent: 1, key: 'ts', val: '1718553600', vKind: 'num', punct: ',' },
      { indent: 1, key: 'usuario', val: 'usr_5f3a', vKind: 'id', punct: ',' },
      { indent: 1, key: 'importe', val: '312.40', vKind: 'num', punct: ',' },
      { indent: 1, key: 'metodo', val: 'tarjeta', vKind: 'str', punct: ',' },
      { indent: 1, key: 'exito', val: 'true', vKind: 'bool' },
      { indent: 0, punct: '}' },
    ],
  },
  // ── api ───────────────────────────────────────────────────────────────────
  {
    family: 'api',
    method: 'GET',
    path: '/v1/orders/8841',
    status: '200 OK',
    ok: true,
    fields: [
      { key: 'cliente', val: 'Marta Ruiz', vKind: 'str' },
      { key: 'total', val: '149.00', vKind: 'num' },
      { key: 'estado', val: 'pagado', vKind: 'str' },
      { key: 'items', val: '3', vKind: 'num' },
    ],
  },
  {
    family: 'api',
    method: 'POST',
    path: '/v1/customers',
    status: '201 Created',
    ok: true,
    fields: [
      { key: 'id', val: 'usr_5f3a', vKind: 'id' },
      { key: 'email', val: 'nadia@mail.io', vKind: 'str' },
      { key: 'plan', val: 'pro', vKind: 'str' },
    ],
  },
  {
    family: 'api',
    method: 'GET',
    path: '/v1/inventory?sku=PAN-3307',
    status: '200 OK',
    ok: true,
    fields: [
      { key: 'stock', val: '54', vKind: 'num' },
      { key: 'reservado', val: '6', vKind: 'num' },
      { key: 'almacen', val: 'MAD-02', vKind: 'str' },
      { key: 'reponer', val: 'false', vKind: 'bool' },
    ],
  },
  {
    family: 'api',
    method: 'DELETE',
    path: '/v1/sessions/9f2c',
    status: '204 No Content',
    ok: true,
    fields: [
      { key: 'revocado', val: 'true', vKind: 'bool' },
      { key: 'expira', val: '0', vKind: 'num' },
    ],
  },
]

export const familyOf = (i: number): Family => TEMPLATES[i].family

// ── timeline shape ──────────────────────────────────────────────────────────────
//
// Cadence: sources rain in, the gap between drops shrinking from calm → frantic,
// then holding frantic until EMIT_END, when the rain stops and the pile drains.

const INTRO_DELAY = 8 // first source lands here (calm start seam)
export const EMIT_END = 470 // last source lands before here; then the pile drains
const RAMP = 250 // frames over which the drop gap eases from calm → frantic
const GAP_CALM = 26
const GAP_FRANTIC = 3.4
const GAP_JIT = 1.5 // ± frames of per-drop jitter on the gap

// Placement: sources SCATTER across the whole 1920×1080 frame (centre-relative
// px), bleeding off the edges — a full-screen blizzard, not one central heap.
const SPREAD_X = 830
const SPREAD_Y = 432
const MAX_ROT = 9 // deg
const SCALE_MIN = 0.7
const SCALE_MAX = 1.0

// Lifetime: a card holds for LIFE — dimming GRADUALLY as it ages (freshest pop,
// older recede → depth without mush even with dozens on screen) — then dissolves
// over FADE_DUR. Fast rain × long-ish life ⇒ MANY alive at once; the oldest keep
// fading throughout, and after the rain stops the field drains to bare surface,
// the very last source fading last.
const LIFE_CALM = 50
const LIFE_FRANTIC = 74
const LIFE_JIT = 24
export const FADE_DUR = 30
const DIM_FLOOR = 0.32 // opacity an aged (not-yet-dissolving) card dims to
const LAND_DUR = 9 // landing pop (scale/translate/rot settle)
const LAND_FADE = 6 // fade-in on landing
const END_PAD = 18

// Drain: when the rain stops, the sources still mid-life would each play out their
// full lifetime with nothing landing on top — a slow, draggy empty. Instead their
// fades are REMAPPED into a short, ordered cascade (oldest-still-alive first, the
// very last source last) so the field clears briskly.
const DRAIN_LEAD = 6 // grace after the rain stops before the cascade begins
export const DRAIN_SPAN = 40 // whole remaining field clears within this window

// Highlights per card.
const HL_LEAD = 2 // first highlight, frames after landing
const HL_DUR = 6 // draw-in window of one highlight
const HL_DUR_JIT = 4
const HL_STAGGER_CALM = 5
const HL_STAGGER_FRANTIC = 1.2
const HL_COVER_CALM = 0.6
const HL_COVER_FRANTIC = 1.0

export type HlKind = 'underline' | 'box' | 'sweep'

export type Highlight = {
  target: number
  start: number // absolute frame
  dur: number
  kind: HlKind
  accent: string
}

export type Drop = {
  id: number
  tmpl: number
  start: number
  fadeStart: number
  occEnd: number
  dx: number
  dy: number
  rot: number
  scale: number
  hls: Highlight[]
}

const HL_ACCENTS = [BRAND.teal, BRAND.purple, BRAND.green, BRAND.orange, BRAND.violet]

/** Frantic-ness 0→1 by landing frame (drives gap, coverage, highlight stagger). */
const frantic = (t: number) => clamp01(t / RAMP)

function pickKind(rng: () => number): HlKind {
  const r = rng()
  return r < 0.5 ? 'underline' : r < 0.8 ? 'box' : 'sweep'
}

function buildHighlights(tmplIdx: number, start: number, rng: () => number): Highlight[] {
  const n = targetCount(TEMPLATES[tmplIdx])
  const f = frantic(start)
  const cover = lerp(HL_COVER_CALM, HL_COVER_FRANTIC, f)
  const stagger = lerp(HL_STAGGER_CALM, HL_STAGGER_FRANTIC, f)
  const count = Math.max(1, Math.round(n * cover))
  const order = shuffledRange(n, rng).slice(0, count)
  return order.map((target, k) => ({
    target,
    start: Math.round(start + HL_LEAD + k * stagger),
    dur: HL_DUR + Math.floor(rng() * HL_DUR_JIT),
    kind: pickKind(rng),
    accent: rng() < 0.8 ? KIT_BLUE : HL_ACCENTS[Math.floor(rng() * HL_ACCENTS.length)],
  }))
}

/** Build the full master schedule by simulating the rain forward, once. */
export function generateMaster(): Drop[] {
  const rng = mulberry32(SEED)
  const drops: Drop[] = []

  // 1) cadence + placement + highlights for every drop.
  let t = INTRO_DELAY
  let prevTmpl = -1
  let prevFamily: Family | '' = ''
  let id = 0
  while (t < EMIT_END) {
    const start = Math.round(t)
    if (start >= EMIT_END) break // rounding can nudge past the boundary; stop cleanly

    // pick a template: never repeat the exact one, avoid same family back-to-back.
    let tmpl = Math.floor(rng() * TEMPLATES.length)
    for (let tries = 0; tries < 6; tries += 1) {
      const sameFamily = familyOf(tmpl) === prevFamily
      if (tmpl !== prevTmpl && !sameFamily) break
      tmpl = Math.floor(rng() * TEMPLATES.length)
    }

    // scatter across the whole frame; live a frantic-scaled lifetime, then fade.
    const dx = Math.round((rng() * 2 - 1) * SPREAD_X)
    const dy = Math.round((rng() * 2 - 1) * SPREAD_Y)
    const rot = (rng() * 2 - 1) * MAX_ROT
    const scale = lerp(SCALE_MIN, SCALE_MAX, rng())
    const life = Math.max(
      20,
      Math.round(lerp(LIFE_CALM, LIFE_FRANTIC, frantic(start)) + (rng() * 2 - 1) * LIFE_JIT),
    )
    const fadeStart = start + life

    drops.push({
      id,
      tmpl,
      start,
      fadeStart,
      occEnd: fadeStart + FADE_DUR,
      dx,
      dy,
      rot,
      scale,
      hls: buildHighlights(tmpl, start, rng),
    })

    prevTmpl = tmpl
    prevFamily = familyOf(tmpl)
    id += 1

    const gap = lerp(GAP_CALM, GAP_FRANTIC, frantic(t)) + (rng() * 2 - 1) * GAP_JIT
    t += Math.max(GAP_FRANTIC - GAP_JIT, gap)
  }

  // Compress the drain. Sources whose fade would naturally begin after the rain
  // stops are remapped into a short, ordered cascade — by landing order, so the
  // oldest-still-alive dissolves first and the very last source last — instead of
  // each draggily running out its full lifetime over empty surface.
  const tail = drops.filter((d) => d.fadeStart > EMIT_END).sort((a, b) => a.id - b.id)
  tail.forEach((d, k) => {
    const frac = tail.length > 1 ? k / (tail.length - 1) : 1
    d.fadeStart = Math.round(EMIT_END + DRAIN_LEAD + frac * DRAIN_SPAN)
    d.occEnd = d.fadeStart + FADE_DUR
  })

  return drops
}

export const MASTER: Drop[] = generateMaster()

export const LECTURA_VORAZ_DURATION =
  Math.max(...MASTER.map((d) => d.occEnd)) + END_PAD

// ── per-frame derivation (pure functions of frame; the comp memoizes by frame) ──

export const isActive = (d: Drop, frame: number) => frame >= d.start && frame < d.occEnd

/** Cards on the pile at `frame`, bottom→top (ascending id == ascending z). */
export function activeDropsAt(frame: number): Drop[] {
  return MASTER.filter((d) => isActive(d, frame))
}

/** Landing pop 0→1 (drives scale/translate/rotation settle on arrival). */
export function dropEnterAt(d: Drop, frame: number): number {
  return ease(frame, d.start, d.start + LAND_DUR, CURVE.enter)
}

/**
 * Card opacity: fades IN on landing, DIMS gradually as it ages (so the freshest
 * sources pop and the older ones recede — depth even with dozens layered), then
 * dissolves to nothing over the fade window.
 */
export function dropOpacityAt(d: Drop, frame: number): number {
  const fin = ease(frame, d.start, d.start + LAND_FADE, CURVE.enter)
  const ageT = clamp01((frame - (d.start + LAND_FADE)) / Math.max(1, d.fadeStart - (d.start + LAND_FADE)))
  const dim = lerp(1, DIM_FLOOR, ageT)
  const fout = 1 - ease(frame, d.fadeStart, d.occEnd, CURVE.exit)
  return clamp01(fin) * dim * clamp01(fout)
}

/**
 * Active highlights on a card at `frame`, each with draw progress `p` (0→1, then
 * held lit). Only started highlights are returned; the renderer holds the mark
 * until the card itself fades, so completed scans accumulate on the source.
 */
export function highlightsAt(
  d: Drop,
  frame: number,
): { target: number; p: number; kind: HlKind; accent: string }[] {
  const out: { target: number; p: number; kind: HlKind; accent: string }[] = []
  for (const h of d.hls) {
    if (frame < h.start) continue
    out.push({
      target: h.target,
      p: ease(frame, h.start, h.start + h.dur, CURVE.standard),
      kind: h.kind,
      accent: h.accent,
    })
  }
  return out
}

// ── camera (a calm, near-static breath over the full-screen field — no chase) ───
// The blizzard fills the whole frame and bleeds off the edges, so the camera must
// NOT push in (it would crop the field). Just a barely-there settle + lazy drift,
// easing to a hair wider as the field drains so the emptying reads.

/** Global transform for the field: gentle settle, lazy drift, slight end pull. */
export function cameraAt(frame: number): { scale: number; x: number; y: number } {
  const settle = ease(frame, 0, 70, CURVE.standard) // 0→1
  const intro = lerp(1.03, 1.0, settle)
  const breath = 0.004 * Math.sin((2 * Math.PI * frame) / 360)
  const drain = ease(frame, EMIT_END, LECTURA_VORAZ_DURATION, CURVE.standard)
  const scale = intro + breath - 0.02 * drain
  const x = 16 * Math.sin((2 * Math.PI * frame) / 520)
  const y = 11 * Math.sin((2 * Math.PI * frame) / 680 + 1.1)
  return { scale, x, y }
}

// ── helpers exposed for the test suite ──────────────────────────────────────────

export const liveCountAt = (frame: number) => activeDropsAt(frame).length
