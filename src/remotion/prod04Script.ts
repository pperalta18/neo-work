/**
 * prod04Script.ts — pure choreography for Prod04Colmena (Acto 4,
 * "se reproduce"). See specs/aikit-live-animations.md, inventario Prod04.
 * ───────────────────────────────────────────────────────────────────────────
 * The 90-second turn where ONE delegated process becomes a living company.
 * The Acto-3 node ("Chequeo de inventario") sits alone, alight — then it
 * reproduces, person by person:
 *
 *   · Manolo adapts it (control de caducidades) and shares it — 3 tiles ignite.
 *   · Laura grows an app de predicción from it and the TPV — 8 tiles distribute.
 *   · Pedro / Ana / Carlos pile their own on top in an accelerated montage,
 *     and AiKit connects two branches nobody asked it to.
 *   · The camera pulls all the way back: a 46-node organism breathing, with
 *     live counters settling on 7 apps · 12 procesos · 3 BBDD · 24 personas —
 *     and a final notification: the system proposes a brand-new process.
 *
 * The whole piece IS the /ba/ organism growing (BaGraph, the engine built for
 * exactly this). Node-ignite WAVES are the "tiles se encienden" gesture (a
 * BaGraph node powers on with the same beat a WorkspaceTile does); the camera
 * pull-back is the WIDE_CAM reveal; toasts carry the notifications; counters
 * read the organism's live size. Everything here is pure data/maths so the
 * sizes, waves, counts, edges, camera and toasts all unit-test.
 *
 * Timeline at a glance (frames @30fps · 2700 = 90s):
 *   0–330     the original process, alone and alight; Manolo's notification
 *   330–820   Manolo's wave — 3 tiles ignite; «compartido con Almacén»
 *   900–1400  Laura's wave — the app de predicción + 8 tiles distribute
 *   1440–2040 the montage: Pedro · Ana · Carlos; AiKit links two branches
 *   2040–2700 pull-back to the 46-node organism; counters; the new proposal
 */
import {
  type BaEdgeSpec,
  type BaNodeKind,
  type BaNodeSpec,
  baGraphLayout,
  baGraphTiming,
  organicEdges,
} from './aikit/graphScript'
import { type CameraFraming } from './aikit/cameraScript'
import { type ToastSpec } from './aikit/toastScript'

/* ── copy (refined es-ES; people/companies come from CAST) ─────────────── */

export const PROD04_COPY = {
  eyebrow: 'ACTO 4 · SE REPRODUCE',
  /** Heading over the live counters once the organism is visible. */
  organismTitle: 'La empresa, viva',
} as const

/** The guión's headline tally — the counters settle here, and BA_NODES is
 * built to match it exactly (asserted in the tests). */
export const GUION_COUNTS = { app: 7, proceso: 12, bbdd: 3, persona: 24 } as const

export const PROD04_DURATION = 2700 // 90 s — the spec duration

/* ── phase beats ───────────────────────────────────────────────────────── */

export const PHASE = {
  /** The Acto-3 node re-lights, alone. */
  heart: 0,
  /** Manolo adapts + shares — the first reproduction. */
  manolo: 330,
  /** Laura's app de predicción is born and distributed. */
  laura: 900,
  /** The accelerated montage of everyone else's processes. */
  montage: 1440,
  /** The pull-back: the organism, the counters, the new proposal. */
  pullback: 2040,
} as const

/* ── the organism (BaGraph nodes) ──────────────────────────────────────── */

// Compact builders — annotated so the literal `kind` widens to BaNodeKind.
const proc = (id: string, at: number, label?: string, anchor?: { x: number; y: number }): BaNodeSpec => ({
  id,
  kind: 'proceso',
  at,
  label,
  anchor,
})
const app = (id: string, at: number, module: string, label?: string, anchor?: { x: number; y: number }): BaNodeSpec => ({
  id,
  kind: 'app',
  at,
  module,
  label,
  anchor,
})
const db = (id: string, at: number, module: string, label?: string): BaNodeSpec => ({
  id,
  kind: 'bbdd',
  at,
  module,
  label,
})
const per = (id: string, at: number, name: string): BaNodeSpec => ({ id, kind: 'persona', at, label: name })

/** The heart — the Acto-3 process re-lit (anchored centre, the camera's open),
 * with the inventory/TPV it already touched and the owner who delegated it. */
export const HEART_NODES: readonly BaNodeSpec[] = [
  proc('p_chequeo', PHASE.heart, 'Chequeo de inventario', { x: 960, y: 540 }),
  db('db_inventario', PHASE.heart + 10, 'hotpot', 'Inventario'),
  app('app_tpv', PHASE.heart + 18, 'actionRunner', 'TPV'),
  per('per_dani', PHASE.heart + 26, 'Dani'),
]

/** Manolo's wave — exactly THREE tiles ignite (the «3 tiles» of the guión):
 * his adapted process, himself, and the warehouse colleague it reaches. */
export const MANOLO_WAVE: readonly BaNodeSpec[] = [
  proc('p_caducidades', PHASE.manolo, 'Control de caducidades', { x: 620, y: 360 }),
  per('per_manolo', PHASE.manolo + 24, 'Manolo Barroso'),
  per('per_nuria', PHASE.manolo + 48, 'Nuria Pons'),
]

/** Laura's wave — EIGHT tiles (the «8 tiles» of the guión): the app de
 * predicción that drinks from others' processes + the TPV, and the six people
 * she distributes it to (Laura herself makes eight). */
export const LAURA_WAVE: readonly BaNodeSpec[] = [
  app('app_prediccion', PHASE.laura, 'foresight', 'Predicción de demanda', { x: 1320, y: 680 }),
  per('per_laura', PHASE.laura + 16, 'Laura Vidal'),
  per('per_sergio', PHASE.laura + 30, 'Sergio Mena'),
  per('per_marta', PHASE.laura + 44, 'Marta Ríos'),
  per('per_hugo', PHASE.laura + 58, 'Hugo Salas'),
  per('per_elena', PHASE.laura + 72, 'Elena Cano'),
  per('per_ivan', PHASE.laura + 86, 'Iván Prat'),
  per('per_rosa', PHASE.laura + 100, 'Rosa Gil'),
]

/** The montage — everyone else's processes pile on, fast (≈16-frame gap).
 * Pedro autocompra · Ana negociación · Carlos filtro, plus the apps, the
 * proveedores BBDD and the crowd that fills the organism out. */
const MONTAGE_SPECS: readonly Omit<BaNodeSpec, 'at'>[] = [
  { id: 'per_pedro', kind: 'persona', label: 'Pedro Alonso' },
  { id: 'p_autocompra', kind: 'proceso', label: 'Compra automática' },
  { id: 'per_ana', kind: 'persona', label: 'Ana Ferrer' },
  { id: 'p_negociacion', kind: 'proceso', label: 'Negociación' },
  { id: 'per_carlos', kind: 'persona', label: 'Carlos Gil' },
  { id: 'p_filtro', kind: 'proceso', label: 'Filtro de pedidos' },
  { id: 'app_dashboard', kind: 'app', module: 'glimpse', label: 'Cuadro de mando' },
  { id: 'p_reposicion', kind: 'proceso' },
  { id: 'per_jorge', kind: 'persona', label: 'Jorge Vega' },
  { id: 'db_proveedores', kind: 'bbdd', module: 'sqlsense', label: 'Proveedores' },
  { id: 'p_conciliacion', kind: 'proceso' },
  { id: 'per_clara', kind: 'persona', label: 'Clara Soto' },
  { id: 'app_posdos', kind: 'app', module: 'actionRunner', label: 'TPV tienda 2' },
  { id: 'p_onboarding', kind: 'proceso' },
  { id: 'per_diego', kind: 'persona', label: 'Diego Lara' },
  { id: 'p_devoluciones', kind: 'proceso' },
  { id: 'app_conector', kind: 'app', module: 'junction', label: 'Conector' },
  { id: 'per_sara', kind: 'persona', label: 'Sara Roca' },
  { id: 'p_facturacion', kind: 'proceso' },
  { id: 'per_luis', kind: 'persona', label: 'Luis Cao' },
  { id: 'app_compras', kind: 'app', module: 'smartProcess', label: 'Panel de compras' },
  { id: 'p_calidad', kind: 'proceso' },
  { id: 'per_paula', kind: 'persona', label: 'Paula Mir' },
  { id: 'per_tomas', kind: 'persona', label: 'Tomás Gea' },
]

export const MONTAGE_GAP = 16
export const MONTAGE_NODES: readonly BaNodeSpec[] = MONTAGE_SPECS.map((s, i) => ({
  ...s,
  at: PHASE.montage + i * MONTAGE_GAP,
}))

/** The pull-back — the last fillers settle, then (after a beat) the system's
 * own proposal lights up: a brand-new process nobody asked for. */
export const PROPOSAL_AT = 2250
export const PULLBACK_NODES: readonly BaNodeSpec[] = [
  app('app_almacen', PHASE.pullback + 6, 'heartbeat', 'Almacén móvil'),
  db('db_precios', PHASE.pullback + 24, 'udon', 'Precios'),
  per('per_marc', PHASE.pullback + 36, 'Marc Vidal'),
  per('per_irene', PHASE.pullback + 50, 'Irene Pou'),
  per('per_noa', PHASE.pullback + 64, 'Noa Serra'),
  per('per_bea', PHASE.pullback + 78, 'Bea Coll'),
  proc('p_anticipar', PROPOSAL_AT, 'Anticipar roturas'),
]

export const BA_NODES: readonly BaNodeSpec[] = [
  ...HEART_NODES,
  ...MANOLO_WAVE,
  ...LAURA_WAVE,
  ...MONTAGE_NODES,
  ...PULLBACK_NODES,
]

/* ── edges: the organic web + the two branches AiKit links proactively ──── */

/** The deterministic colmena web — every node links to its nearest grown
 * neighbour, with cross-links every few nodes (organicEdges). */
export const AUTO_EDGES: readonly BaEdgeSpec[] = organicEdges(
  baGraphLayout(BA_NODES, { seed: 7, quality: 40 }),
  { extraEvery: 4, pulseEvery: 190 },
)

/** «la IA conecta dos ramas proactivamente»: Laura's prediction feeds Pedro's
 * auto-purchase, and Manolo's expiry control feeds Ana's negotiation — links
 * drawn LATE, after both branches exist, with their own slow pulse. */
export const HERO_EDGES: readonly BaEdgeSpec[] = [
  { from: 'app_prediccion', to: 'p_autocompra', at: 1880, pulseEvery: 150 },
  { from: 'p_caducidades', to: 'p_negociacion', at: 1924, pulseEvery: 170 },
]

export const BA_EDGES: readonly BaEdgeSpec[] = [...AUTO_EDGES, ...HERO_EDGES]

export const BA_LAYOUT = baGraphLayout(BA_NODES, { seed: 7, quality: 40 })
export const BA_TIMING = baGraphTiming(BA_LAYOUT, BA_EDGES)

/* ── live counters (read the organism's true size, frame by frame) ──────── */

/** How many nodes of `kind` have ignited by `frame` — the honest counter: it
 * ticks up as the organism grows and lands on the guión total at the end. */
export function countByKindAt(frame: number, kind: BaNodeKind): number {
  return BA_NODES.filter((n) => n.kind === kind && BA_TIMING.nodeAt[n.id] <= frame).length
}

/** The four KPIs of the closing dashboard, in reading order. */
export const COUNTERS: readonly { kind: BaNodeKind; label: string }[] = [
  { kind: 'app', label: 'Apps' },
  { kind: 'proceso', label: 'Procesos' },
  { kind: 'bbdd', label: 'Bases de datos' },
  { kind: 'persona', label: 'Personas' },
]

/** The counter strip fades in as the pull-back begins. */
export const COUNTERS_AT = PHASE.pullback - 80

/* ── notifications (the cascade in the quiet corner) ───────────────────── */

export const PROD04_TOASTS: readonly ToastSpec[] = [
  { variant: 'info', title: 'Manolo ha adaptado tu proceso', message: 'Añadió control de caducidades', time: '09:14', showAt: 150, hideAt: 470 },
  { variant: 'success', title: 'Compartido con Almacén', message: '3 personas reciben el proceso', showAt: 430, hideAt: 760 },
  { variant: 'success', title: 'Laura creó una app de predicción', message: 'Bebe de tus procesos y del TPV', showAt: 1010, hideAt: 1320 },
  { variant: 'success', title: 'Distribuido al equipo', message: '8 personas la usan ya', showAt: 1140, hideAt: 1420 },
  { variant: 'success', title: 'Pedro automatizó la compra', showAt: 1560, hideAt: 1760 },
  { variant: 'success', title: 'Ana negocia con proveedores', showAt: 1680, hideAt: 1900 },
  { variant: 'info', title: 'AiKit conectó dos procesos', message: 'Predicción → Compra automática', showAt: 1900, hideAt: 2160 },
  { variant: 'info', title: 'El sistema propone un proceso nuevo', message: '¿Anticipar roturas de stock?', time: '09:41', showAt: 2320 },
]

/* ── captions (screen-space narration, ordered, non-overlapping) ───────── */

export type Prod04Caption = { text: string; showAt: number; hideAt: number }

export const PROD04_CAPTIONS: readonly Prod04Caption[] = [
  { text: 'El proceso que delegaste ya no es solo tuyo. Empieza a reproducirse.', showAt: 60, hideAt: 320 },
  { text: 'Manolo lo adapta —control de caducidades— y lo comparte con su equipo.', showAt: 360, hideAt: 850 },
  { text: 'Laura hace nacer una app de predicción que bebe de procesos ajenos, y la reparte.', showAt: 920, hideAt: 1400 },
  { text: 'Pedro, Ana y Carlos suman los suyos. AiKit conecta ramas que nadie le pidió.', showAt: 1460, hideAt: 2030 },
  { text: 'Una empresa entera, viva — y proponiéndose ella sola el siguiente paso.', showAt: 2100, hideAt: 2700 },
]

/* ── camera rig (the WIDE_CAM pull-back, following the reproduction) ────── */

export const PROD04_CAM: readonly CameraFraming[] = [
  { at: 0, zoom: 1.5, fx: 960, fy: 540 }, // the original process, alone
  { at: 348, zoom: 1.26, fx: 720, fy: 430, travel: 44 }, // toward Manolo's wave
  { at: 912, zoom: 1.04, fx: 1200, fy: 620, travel: 52 }, // toward Laura's
  { at: 1500, zoom: 0.9, fx: 960, fy: 540, travel: 60 }, // re-centre for the montage
  { at: 2100, zoom: 0.72, fx: 960, fy: 540, travel: 64 }, // full pull-back — the organism
  { at: 2420, zoom: 0.7, fx: 960, fy: 540, travel: 40 }, // settle wide — the final still
]
