/**
 * flowBuilderScript.ts — pure frame-driven brain of «el flujo, a mano».
 * ───────────────────────────────────────────────────────────────────────────
 * A real Zapier automation assembles itself block by block: a Gmail trigger, a
 * Filtro (conditional), a Rutas split into two condition-labelled branches, a
 * deep action stack down each branch, and a SECOND, nested Filtro inside one of
 * them. No cursor, no captions — just the relentless, slow accretion of blocks
 * and wires. The length is the message: programming like this, by hand, makes
 * no sense. Concrete visual-programming blocks, never abstractions.
 *
 * Everything is a pure function of (data, frame) so the build and the camera
 * stay in lockstep and the choreography is unit-testable without rendering. The
 * visual shell (FlowBuilderVideo) only reads these anchors.
 */
import { type CameraFraming } from './aikit/cameraScript'

// ── geometry (content space — the layer the camera shoots) ─────────────────────

export const CARD_W = 460
export const CARD_H = 92

/** The trunk column, and the two branch columns the Rutas block splits into. */
export const COL_C = 960
export const COL_L = 640
export const COL_R = 1280

/** Card TOP per vertical level. */
export const Y_TRIGGER = 150
export const Y_FILTER = 314
export const Y_PATHS = 478
/** The horizontal "bus" the Rutas split spreads along before dropping into a branch. */
export const BUS_Y = 616
export const Y_BR1 = 690
export const Y_BR2 = 840
export const Y_BR3 = 990
export const Y_BR4 = 1140

export const cardBottom = (yTop: number) => yTop + CARD_H

// ── the blocks (concrete Zapier-style blocks, with two conditionals) ───────────

export type BlockKind = 'trigger' | 'filter' | 'paths' | 'action'
export type GlyphName =
  | 'mail' | 'funnel' | 'branch' | 'user' | 'hash' | 'send' | 'grid' | 'calendar' | 'board'
export type ConnKind = 'none' | 'straight' | 'elbow-left' | 'elbow-right'

export type FlowBlock = {
  id: string
  kind: BlockKind
  app: string
  title: string
  glyph: GlyphName
  color: string
  x: number
  y: number
  parent: number
  conn: ConnKind
  /** Inline config pills — the hand-set condition / routes (filter & paths). */
  config?: string[]
  /** Path condition shown on the branch elbow (Rutas children only). */
  branchLabel?: string
  /** Connector midpoint where the insert "+" sits. */
  add: { x: number; y: number }
}

const gapY = (topAbove: number, topBelow: number) => (cardBottom(topAbove) + topBelow) / 2
const elbowAddY = (Yb1: number) => (BUS_Y + Yb1) / 2

export const BLOCKS: readonly FlowBlock[] = [
  // ── trunk ──
  { id: 'trigger', kind: 'trigger', app: 'Gmail', title: 'Nuevo correo de pedido', glyph: 'mail', color: '#ea4335', x: COL_C, y: Y_TRIGGER, parent: -1, conn: 'none', add: { x: COL_C, y: Y_TRIGGER + CARD_H / 2 } },
  { id: 'filter', kind: 'filter', app: 'Filtro', title: 'Sólo si el importe supera 500 €', glyph: 'funnel', color: '#5b6b88', x: COL_C, y: Y_FILTER, parent: 0, conn: 'straight', config: ['Importe', '>', '500 €'], add: { x: COL_C, y: gapY(Y_TRIGGER, Y_FILTER) } },
  { id: 'paths', kind: 'paths', app: 'Rutas', title: 'Bifurcar según condición', glyph: 'branch', color: '#6b5cff', x: COL_C, y: Y_PATHS, parent: 1, conn: 'straight', config: ['Ruta A', 'Ruta B'], add: { x: COL_C, y: gapY(Y_FILTER, Y_PATHS) } },

  // ── branch A (left): el pedido grande ──
  { id: 'a1', kind: 'action', app: 'HubSpot', title: 'Crear contacto', glyph: 'user', color: '#ff7a59', x: COL_L, y: Y_BR1, parent: 2, conn: 'elbow-left', branchLabel: 'Si importe > 500 €', add: { x: COL_L, y: elbowAddY(Y_BR1) } },
  { id: 'a2', kind: 'action', app: 'Slack', title: 'Avisar a #ventas', glyph: 'hash', color: '#4a154b', x: COL_L, y: Y_BR2, parent: 3, conn: 'straight', add: { x: COL_L, y: gapY(Y_BR1, Y_BR2) } },
  { id: 'a3', kind: 'action', app: 'Google Calendar', title: 'Agendar llamada', glyph: 'calendar', color: '#4285f4', x: COL_L, y: Y_BR3, parent: 4, conn: 'straight', add: { x: COL_L, y: gapY(Y_BR2, Y_BR3) } },
  { id: 'a4', kind: 'action', app: 'Gmail', title: 'Enviar bienvenida', glyph: 'send', color: '#ea4335', x: COL_L, y: Y_BR4, parent: 5, conn: 'straight', add: { x: COL_L, y: gapY(Y_BR3, Y_BR4) } },

  // ── branch B (right): el pedido pequeño, con OTRO filtro dentro ──
  { id: 'b1', kind: 'action', app: 'Google Sheets', title: 'Añadir fila', glyph: 'grid', color: '#0f9d58', x: COL_R, y: Y_BR1, parent: 2, conn: 'elbow-right', branchLabel: 'Si importe ≤ 500 €', add: { x: COL_R, y: elbowAddY(Y_BR1) } },
  { id: 'b2', kind: 'filter', app: 'Filtro', title: 'Sólo si el país es España', glyph: 'funnel', color: '#5b6b88', x: COL_R, y: Y_BR2, parent: 7, conn: 'straight', config: ['País', '=', 'ES'], add: { x: COL_R, y: gapY(Y_BR1, Y_BR2) } },
  { id: 'b3', kind: 'action', app: 'Gmail', title: 'Enviar respuesta', glyph: 'send', color: '#ea4335', x: COL_R, y: Y_BR3, parent: 8, conn: 'straight', add: { x: COL_R, y: gapY(Y_BR2, Y_BR3) } },
  { id: 'b4', kind: 'action', app: 'Trello', title: 'Crear tarjeta', glyph: 'board', color: '#0079bf', x: COL_R, y: Y_BR4, parent: 9, conn: 'straight', add: { x: COL_R, y: gapY(Y_BR3, Y_BR4) } },
]

export const NB = BLOCKS.length

/** The SVG path of a block's incoming connector (in content space). */
export function connectorPath(i: number): string | null {
  const b = BLOCKS[i]
  if (b.conn === 'none' || b.parent < 0) return null
  const p = BLOCKS[b.parent]
  if (b.conn === 'straight') return `M ${b.x} ${cardBottom(p.y)} L ${b.x} ${b.y}`
  // elbow: down the trunk to the bus, across to the branch column, down to the card.
  return `M ${p.x} ${cardBottom(p.y)} L ${p.x} ${BUS_Y} L ${b.x} ${BUS_Y} L ${b.x} ${b.y}`
}

// ── timeline (30 fps) — one block per beat, no cursor pacing ────────────────────

export const INTRO = 16
/** One block built per beat — unhurried; the accretion is the whole point. */
export const BEAT = 80
export const BUILD_END = INTRO + NB * BEAT

export const blockStart = (k: number) => INTRO + k * BEAT
const connDur = (i: number) => (BLOCKS[i].conn.startsWith('elbow') ? 34 : 26)

export type BlockAnchors = {
  connStart: number
  connDur: number
  plateAt: number
  tileAt: number
  labelAt: number
  configAt: number
  /** The insert "+" on this block's connector pops in as the card forms. */
  addAppearAt: number
}

export function blockAnchors(k: number): BlockAnchors {
  const S = blockStart(k)
  const plateAt = S + (k === 0 ? 0 : 14)
  return {
    connStart: S,
    connDur: connDur(k),
    plateAt,
    tileAt: plateAt + 10,
    labelAt: plateAt + 18,
    configAt: plateAt + 30,
    addAppearAt: plateAt + 22,
  }
}

export const cardStartFrame = (k: number) => blockAnchors(k).plateAt
export const cardSettleFrame = (k: number) => blockAnchors(k).configAt + 20

export const FLOW_ANCHORS: readonly BlockAnchors[] = BLOCKS.map((_, k) => blockAnchors(k))

// ── the camera: glides block to block down each branch, then pulls back ────────

const Z_TRUNK = 1.1
const Z_BRANCH = 1.04
const Z_ALL = 0.78
const cy = (yTop: number) => yTop + CARD_H / 2
const TREE_CENTER_Y = (Y_TRIGGER + cardBottom(Y_BR4)) / 2

function framingFor(k: number): CameraFraming {
  const b = BLOCKS[k]
  const trunk = b.conn === 'none' || b.conn === 'straight' && b.x === COL_C
  // the jump from the bottom of branch A back up to the top of branch B
  const jump = b.id === 'b1'
  return {
    at: k === 0 ? 0 : blockAnchors(k).plateAt + 4,
    zoom: trunk ? Z_TRUNK : Z_BRANCH,
    fx: b.x,
    fy: cy(b.y),
    ...(jump ? { travel: 40 } : {}),
  }
}

export const FLOW_CAM: readonly CameraFraming[] = [
  ...BLOCKS.map((_, k) => framingFor(k)),
  { at: BUILD_END + 30, zoom: Z_ALL, fx: COL_C, fy: TREE_CENTER_Y, travel: 40 },
]

// ── duration ────────────────────────────────────────────────────────────────────

const TAIL = 130
export const FLOW_BUILDER_DURATION = BUILD_END + TAIL
