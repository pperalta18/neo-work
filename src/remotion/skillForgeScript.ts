/**
 * skillForgeScript — pure frame-driven brain of «Skill Forge».
 * ───────────────────────────────────────────────────────────────────────────
 * Four recipe-step CARDS sit on the row from the start (icon + short label, they do
 * NOT emerge). The elevated head travels across them in a STRAIGHT line, and between
 * every pair of cards a single arrow cell rises as it passes — the flow drawing
 * itself through the pre-laid recipe. Then one elevation is the **Skill Hub** module
 * (its Rive clip loops as the head reaches it); the very next elevation is a 3-cell
 * pill showing three "working" dots.
 *
 * The head rests on the pill, then it **opens** exactly like StoreCreate (pill →
 * full frame). The dots magnify with it and then clear, and the same four steps
 * **stack into a numbered column** (a number + icon + the short instruction — not
 * code). The SAME morph runs in REVERSE, packing the panel into the pill — now
 * carrying an icon + "Comparador de alquileres". Finally the camera **zooms out**
 * and the whole field comes alive:
 * many processes, each turning three "working" dots into a software pill (the
 * label types itself in) — the skill hub forging skills at scale.
 *
 * Everything is a pure function of `frame`; the shell only reads these anchors.
 * The plate renderer is storeFlowScene's `FlowPlate`; the open/close morph mirrors
 * StoreCreateVideo's geometry so the pill↔panel hand-off is seamless.
 */
import { CELL, PLATE_INSET } from '@/lib/neumorphism'
import type { IconName } from '@/components/icons'
import type { TokColor } from './codeStream'

export const FPS = 30

// ── field geometry ──────────────────────────────────────────────────────────
export const COLUMNS = 22
export const ROWS = 13
export { CELL }
export const GRID_W = COLUMNS * CELL // 2816
export const GRID_H = ROWS * CELL // 1664
export const GRID_CENTER: [number, number] = [GRID_W / 2, GRID_H / 2]

// ── small pure math ───────────────────────────────────────────────────────────
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Quintic smootherstep — zero 1st & 2nd derivative at both ends (no jerk). */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
/** Map a value through a [lo, hi] window into an eased 0→1. */
export const window01 = (f: number, lo: number, hi: number) => smoother((f - lo) / (hi - lo))

// ── the straight line on one row ───────────────────────────────────────────────
export const ROW = 7

// Four recipe-step CARDS, laid out from the start (they do NOT emerge): each a
// 3-cell pill (same footprint as the working-dots pill) carrying an icon + a short
// label. Between every pair of cards sits a single arrow cell that DOES emerge as
// the head passes (the flow drawing itself through the pre-laid recipe); the last
// arrow feeds into the module.
export const STEP_COLSPAN = 3
export const STEP_COL0S = [2, 6, 10, 14] as const // cards: 2-4 · 6-8 · 10-12 · 14-16
export const CHEVRON_COLS = [5, 9, 13, 17] as const // arrows between cards (+ into the module)

export const SKILLHUB_COL = 18
export const PILL_COL0 = 19
export const PILL_COLSPAN = 3
export const PILL_CENTER_COL = PILL_COL0 + (PILL_COLSPAN - 1) / 2 // 20

// ── the travelling head (column-space, calm cell-by-cell advance) ───────────────
export const TRAVEL_START = 10
const PER_CELL = 8
export function headCol(frame: number): number {
  return 1 + (frame - TRAVEL_START) / PER_CELL
}
const frameAtCol = (col: number) => TRAVEL_START + (col - 1) * PER_CELL

export const SKILLHUB_PLAY = Math.round(frameAtCol(SKILLHUB_COL)) // 146
export const HEAD_ARRIVE = Math.round(frameAtCol(PILL_CENTER_COL)) // 162

export function cellGrow(frame: number, col: number): number {
  return smoother(clamp01(headCol(frame) - col + 1))
}
export function pillGrow(frame: number): number {
  return smoother(clamp01(headCol(frame) - PILL_COL0 + 1))
}

// ── timeline (30 fps) ──────────────────────────────────────────────────────────
export const GRID_IN: [number, number] = [0, 14]
export const WORK_START = 162
export const EXPAND_START = 182 // brief beat reading the working pill, then it opens
export const EXPAND_END = 224 // ~1.4 s open (StoreCreate morph)
export const CODE_START = EXPAND_END
export const CODE_END = 320 // ~3.2 s for the four numbered steps to stack in
export const CLOSE_START = CODE_END
export const CLOSE_END = 362 // ~1.4 s close, reverse of the open
export const ZOOM_START = CLOSE_END // camera pulls back; the field wakes up
const ZOOM_RAMP = 120
export const SETTLE_END = 530
export const SKILL_FORGE_DURATION = SETTLE_END

/**
 * StoreCreate-style morph progress: 0 (pill) → 1 (full frame) on the open, holds
 * at 1 through the code, then 1 → 0 on the close. The panel is rendered only while
 * this window is live; at exactly 0 the panel equals the flow pill, so the hand-off
 * in/out of the panel is invisible.
 */
export function expandAt(frame: number): number {
  if (frame < EXPAND_START) return 0
  if (frame <= EXPAND_END) return window01(frame, EXPAND_START, EXPAND_END)
  if (frame < CLOSE_START) return 1
  if (frame <= CLOSE_END) return 1 - window01(frame, CLOSE_START, CLOSE_END)
  return 0
}
export const panelActive = (frame: number) => frame >= EXPAND_START && frame <= CLOSE_END
export const flowDotsVisible = (frame: number) => frame < EXPAND_START

// content cues inside the panel
/** The dots magnify with the open, then CLEAR as the code starts (the user's
 *  note: while code shows, no dots). */
export function panelDotsOpacity(frame: number): number {
  return 1 - window01(frame, EXPAND_END - 6, CODE_START + 8)
}
/** Reveal progress 0→1 across the window the four steps stack in. */
export function codeProgress(frame: number): number {
  return window01(frame, CODE_START + 4, CODE_END)
}
/** The step stack fades in as it starts and out at the close. */
export function codeOpacity(frame: number): number {
  const inn = window01(frame, CODE_START, CODE_START + 12)
  const out = window01(frame, CLOSE_START, CLOSE_START + 14)
  return clamp01(inn) * (1 - out)
}
/** "Comparador de alquileres" rises in over the back half of the close so the
 *  panel equals the flow result pill by the time it lands. */
export function labelOpacity(frame: number): number {
  return window01(frame, CLOSE_START + 18, CLOSE_END)
}

// ── camera (P, Z) — follow the head, hold static for the morph, ZOOM OUT ────────
export const Z_FLOW = 1.6 // the panel pill geometry is pinned to this — keep it exact across the morph
const Z_ENTRY = Z_FLOW * 0.94
const Z_WIDE = 0.62 // fits the whole 22×13 field for the "many processes" finale
const cellCenter = (col: number, row = ROW): [number, number] => [(col - 0.5) * CELL, (row - 0.5) * CELL]
const P_ENTRY = cellCenter(4)
const P_PILL = cellCenter(PILL_CENTER_COL)

export function cameraPZ(frame: number): { P: [number, number]; Z: number } {
  if (frame <= HEAD_ARRIVE) {
    const t = smoother(clamp01((frame - TRAVEL_START) / (HEAD_ARRIVE - TRAVEL_START)))
    return { P: [lerp(P_ENTRY[0], P_PILL[0], t), P_ENTRY[1]], Z: lerp(Z_ENTRY, Z_FLOW, t) }
  }
  if (frame <= ZOOM_START) return { P: P_PILL, Z: Z_FLOW }
  const t = smoother(clamp01((frame - ZOOM_START) / ZOOM_RAMP))
  return {
    P: [lerp(P_PILL[0], GRID_CENTER[0], t), lerp(P_PILL[1], GRID_CENTER[1], t)],
    Z: lerp(Z_FLOW, Z_WIDE, t),
  }
}
/** The chevron trail dissolves as we zoom out — it was just the way in. */
export const chevronFade = (frame: number) => 1 - window01(frame, ZOOM_START, ZOOM_START + 30)

// ── panel pill rect — the flow pill's ON-SCREEN rect at (P_PILL, Z_FLOW) ─────────
const PILL_W_GRID = PILL_COLSPAN * CELL - 2 * PLATE_INSET // 340
const PILL_H_GRID = CELL - 2 * PLATE_INSET // 84
const PILL_RADIUS = 24

export type Rect = { left: number; top: number; w: number; h: number; r: number }
export function pillRect(W: number, H: number): Rect {
  const w = PILL_W_GRID * Z_FLOW
  const h = PILL_H_GRID * Z_FLOW
  return { left: W / 2 - w / 2, top: H / 2 - h / 2, w, h, r: PILL_RADIUS * Z_FLOW }
}
export const fullRect = (W: number, H: number): Rect => ({ left: 0, top: 0, w: W, h: H, r: 0 })

export function morphRect(expand: number, W: number, H: number): Rect {
  const a = pillRect(W, H)
  const b = fullRect(W, H)
  return {
    left: lerp(a.left, b.left, expand),
    top: lerp(a.top, b.top, expand),
    w: lerp(a.w, b.w, expand),
    h: lerp(a.h, b.h, expand),
    r: lerp(a.r, b.r, expand),
  }
}
export function morphRelief(expand: number): { distance: number; blur: number } {
  return { distance: lerp(8 * Z_FLOW, 46, expand), blur: lerp(16 * Z_FLOW, 130, expand) }
}
export const CONTENT_SCALE_END = 2.7
export const contentScale = (expand: number) => lerp(1, CONTENT_SCALE_END, expand)
export const flowLayerOpacity = (expand: number) => 1 - smoother(clamp01(expand / 0.55))
export const flowLayerScale = (expand: number) => lerp(1, 1.22, expand)

// ── the four recipe steps of «comparar alquileres» ──────────────────────────────
// Each is a CARD the head passes (icon + short label); when the working pill opens,
// the same four steps stack in a numbered column — short instructions, NOT code.
// Single source of truth for the cards and for the stack.
export type ForgeStep = { icon: IconName; label: string }
export const FORGE_STEPS: ForgeStep[] = [
  { icon: 'global', label: 'Buscar pisos' },
  { icon: 'target', label: 'Filtrar por precio' },
  { icon: 'calculator', label: 'Calcular €/m²' },
  { icon: 'star', label: 'Ordenar resultados' },
]

// ── the finale field: many "working dots → software pill" conversions ───────────
export type ForgePill = {
  at: [number, number]
  label: string
  icon: IconName
  /** Frame the pill rises in (as a working-dots pill). */
  born: number
  /** Frame the dots→label conversion begins (the label types itself in). */
  convert: number
}
export const FORGE_CONVERT_DUR = 24

const FORGE_LABELS = [
  'Resumen de contratos',
  'Detector de fraude',
  'Clasificador de tickets',
  'Extractor de facturas',
  'Análisis de sentimiento',
  'Generador de informes',
  'Conciliador bancario',
  'Buscador de leads',
  'Traductor de reseñas',
  'Planificador de turnos',
  'Validador de pedidos',
  'Auditor de gastos',
  'Sincronizador de stock',
  'Lector de albaranes',
  'Asignador de rutas',
  'Verificador de IBAN',
  'Etiquetador de correos',
  'Resolutor de incidencias',
  'Previsor de demanda',
  'Normalizador de datos',
]
const FORGE_ICONS: IconName[] = [
  'flag', 'lock', 'target', 'star', 'brain', 'megaphone', 'check', 'global',
  'calendar', 'clock', 'bell', 'user', 'reload', 'sparkles', 'location', 'plus',
  'mic', 'close', 'back', 'dialpad',
]
const FORGE_ROWS = [2, 4, 9, 11]
const FORGE_COLS = [2, 6, 10, 14, 18]

export const FORGE_PILLS: ForgePill[] = (() => {
  const pills: ForgePill[] = []
  let i = 0
  for (const row of FORGE_ROWS) {
    for (const col of FORGE_COLS) {
      const born = ZOOM_START + 8 + (i % 5) * 6 + Math.floor(i / 5) * 12
      const convert = born + 20 + ((i * 7) % 16)
      pills.push({
        at: [col, row],
        label: FORGE_LABELS[i % FORGE_LABELS.length],
        icon: FORGE_ICONS[i % FORGE_ICONS.length],
        born,
        convert,
      })
      i += 1
    }
  }
  return pills
})()

// ── falling/typing code palette (CodeTerminal, but for the light surface) ────────
export const COLORS_LIGHT: Record<TokColor, string> = {
  plain: '#3b4252',
  keyword: '#1361c8',
  string: '#1a7f37',
  comment: '#9aa3b2',
  number: '#b3531d',
  func: '#0a7ea4',
  type: '#6f42c1',
  punct: '#7a8290',
  ok: '#1a7f37',
  warn: '#9a6700',
  err: '#cf222e',
  prompt: '#1a7f37',
  muted: '#9aa3b2',
}
