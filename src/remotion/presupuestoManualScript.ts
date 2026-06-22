/**
 * presupuestoManualScript.ts — choreography for «El Vía Crucis del Presupuesto».
 * ───────────────────────────────────────────────────────────────────────────
 * The PAIN/BEFORE counterpart to PresupuestoChat: a human building a quote BY
 * HAND on a flat, text-free desktop. Double-click the file gallery, hunt for a
 * template, switch to the CRM, copy one value, switch back, paste, copy-paste-
 * copy-paste, then ratchet a fill-handle down a whole column — one grudging row
 * at a time. Tedium is the message; the clean AI sibling does it in one breath.
 *
 * Everything here is a PURE function of the frame: geometry, the cursor spine,
 * the cinematic camera rig, the cell-fill schedule, the focus/scrim hand-offs.
 * No text, no neumorphism — the visual (PresupuestoManual.tsx) draws flat shapes
 * off these numbers. No Math.random / Date.now: any scatter comes from seeded().
 */
import type { CursorWaypoint } from './aikit/cursorScript'
import { cursorScriptDuration, validateCursorScript } from './aikit/cursorScript'
import type { CameraFraming } from './aikit/cameraScript'
import { validateCameraRig } from './aikit/cameraScript'

/* ── content plane: an unbounded desk; three apps in three corners + a dock in
      the middle, so every task is a corner-to-corner-via-centre round trip
      (this is what manufactures the wasted travel). All coords in plane space;
      the camera reframes, nothing reflows (only the gallery folder-swap does). */

export const PLANE = { w: 2600, h: 1720 } as const

export const EXCEL = { x: 1180, y: 300, w: 1040, h: 800 } as const
export const CRM = { x: 120, y: 300, w: 624, h: 792 } as const
export const GALLERY = { x: 700, y: -184, w: 1160, h: 700 } as const
export const DOCK = { x: 1066, y: 1496, w: 700, h: 100 } as const

/* ── Excel grid geometry (a true grid of hairlines; cells are huge under macro) */

export const GRID = {
  titleH: 40, // window title bar
  toolH: 50, // formula/toolbar strip
  gutterW: 50, // row-number gutter
  headerH: 32, // column-header band
  cols: 7,
  bodyRows: 15, // rows drawn in the sheet body
  rowH: 44,
} as const

export const COL_W = (EXCEL.w - GRID.gutterW) / GRID.cols
export const GRID_LEFT = EXCEL.x + GRID.gutterW
export const GRID_TOP = EXCEL.y + GRID.titleH + GRID.toolH + GRID.headerH

export function cellRect(r: number, c: number) {
  return { x: GRID_LEFT + c * COL_W, y: GRID_TOP + r * GRID.rowH, w: COL_W, h: GRID.rowH }
}
export function cellCenter(r: number, c: number) {
  const R = cellRect(r, c)
  return { x: R.x + R.w / 2, y: R.y + R.h / 2 }
}
/** The fill-handle hot-square sits at a cell's bottom-right corner. */
export function fillHandle(r: number, c: number) {
  const R = cellRect(r, c)
  return { x: R.x + R.w, y: R.y + R.h }
}

/** The column the human fills by hand (copy-paste, then drag-fill down). */
export const FILL_COL = 5
/** Rows whose label/spec bars the template hands you (the line items). */
export const TEMPLATE_ROWS = 13
/** The three FILL_COL rows pasted one painful round-trip at a time. */
export const PASTE_ROWS = [5, 6, 7] as const
/** The rows the fill-handle ratchets into existence afterwards (rows 0–4 stay
 *  pointedly empty — the work above is never done either). */
export const DRAG_ROWS = [8, 9, 10, 11, 12] as const
/** The lone graphite total line that lands at the very end. */
export const TOTAL_ROW = 13
/** A ghost row below the total — the never-done tail. */
export const GHOST_ROW = 14

/* ── dock: four app-squares (excel green · crm blue · files amber · neutral) ── */

export const DOCK_SQ = 64
export const DOCK_GAP = 26
export const DOCK_N = 4
const DOCK_INNER = DOCK_N * DOCK_SQ + (DOCK_N - 1) * DOCK_GAP
const DOCK_X0 = DOCK.x + (DOCK.w - DOCK_INNER) / 2 + DOCK_SQ / 2
export function dockCenter(i: number) {
  return { x: DOCK_X0 + i * (DOCK_SQ + DOCK_GAP), y: DOCK.y + DOCK.h / 2 }
}
export const DOCK_EXCEL = 0
export const DOCK_CRM = 1
export const DOCK_FILES = 2

/* ── CRM list geometry ──────────────────────────────────────────────────── */

export const CRM_TITLE_H = 40
export const CRM_SEARCH_H = 56
export const CRM_LIST_TOP = CRM.y + CRM_TITLE_H + CRM_SEARCH_H + 22
export const CRM_ROW_H = 92
export const CRM_ROW_GAP = 14
export const CRM_ROWS = 6
export function crmSearchCenter() {
  return { x: CRM.x + CRM.w / 2, y: CRM.y + CRM_TITLE_H + CRM_SEARCH_H / 2 }
}
export function crmRowRect(i: number) {
  return {
    x: CRM.x + 22,
    y: CRM_LIST_TOP + i * (CRM_ROW_H + CRM_ROW_GAP),
    w: CRM.w - 44,
    h: CRM_ROW_H,
  }
}
export function crmRowCenter(i: number) {
  const R = crmRowRect(i)
  return { x: R.x + R.w / 2, y: R.y + R.h / 2 }
}
/** The value chip on a row the cursor actually copies (right portion of the row). */
export function crmValueCenter(i: number) {
  const R = crmRowRect(i)
  return { x: R.x + R.w * 0.72, y: R.y + R.h * 0.62 }
}

/* ── template gallery geometry (a 4×3 wall of indistinguishable chips) ────── */

export const GAL_TITLE_H = 40
export const GAL_COLS = 4
export const GAL_ROWS = 3
export const GAL_PAD = 40
export const GAL_GAP = 30
export const GAL_CHIP_W = (GALLERY.w - GAL_PAD * 2 - GAL_GAP * (GAL_COLS - 1)) / GAL_COLS
export const GAL_GRID_TOP = GALLERY.y + GAL_TITLE_H + 64 // title + folder strip
export const GAL_CHIP_H = (GALLERY.h - (GAL_GRID_TOP - GALLERY.y) - GAL_PAD - 78) / GAL_ROWS // leave room for the open bar
export function galChipRect(i: number) {
  const r = Math.floor(i / GAL_COLS)
  const c = i % GAL_COLS
  return {
    x: GALLERY.x + GAL_PAD + c * (GAL_CHIP_W + GAL_GAP),
    y: GAL_GRID_TOP + r * (GAL_CHIP_H + GAL_GAP),
    w: GAL_CHIP_W,
    h: GAL_CHIP_H,
  }
}
export function galChipCenter(i: number) {
  const R = galChipRect(i)
  return { x: R.x + R.w / 2, y: R.y + R.h / 2 }
}
export const GAL_PICK = 9 // the chip we eventually settle on
export const GAL_MISHOVER = [1, 6] as const // the wrong ones we paw at first
export function galOpenBtnCenter() {
  return { x: GALLERY.x + GALLERY.w - GAL_PAD - 70, y: GALLERY.y + GALLERY.h - 50 }
}

/* ── TIMELINE (frames @30fps) ───────────────────────────────────────────────
   Named beats so the cursor, camera, writes and focus all reference one clock. */

export const T = {
  // Paced like a real human at the keyboard: deliberate moves, reaction/reading
  // pauses before every click, real waiting on loads, a beat of "did it work?"
  // after each paste. ~49s total — slow on purpose, so the tedium is FELT.
  // act 0 — cold open, a long beat just staring at the empty cell ("uf…")
  cold: 18,
  reveal: 78,
  // act 1 — the template hunt
  filesClick: 130, // dock → files (lands +3)
  galOpen: 150, // gallery raises (cold spinner ~150..175)
  galReady: 192, // skeleton chips resolve
  galHoverA: 196, // start pawing at the wrong chips
  galHoverB: 240,
  galPick: 290, // click the chosen chip (after dithering)
  galOpenBtn: 340, // click the open pill
  // act 2 — the template loads (crawls, STALLS ~42f at 70%, then the skeleton)
  tplLoad: 352, // gallery closes, progress starts
  tplStallFrom: 374,
  tplStallTo: 416,
  tplDone: 448, // skeleton line-items resolved
  // act 3 — the copy-paste loop (3 laps, easing quicker as it grinds to autopilot)
  // lap 1 (full, unhurried)
  l1Crm: 500, // dock → crm
  l1Search: 554, // click search well, type
  l1Hover: 602, // mis-hover the wrong record (reading the list)
  l1Select: 642, // select the right record
  l1Copy: 690, // copy a value (marching ants held ~690..714)
  l1Back: 750, // dock → excel
  l1Paste: 802, // paste into (5, FILL_COL); hold after to look
  // lap 2 (a touch quicker, still deliberate)
  l2Crm: 860,
  l2Copy: 908,
  l2Back: 962,
  l2Paste: 1012,
  // lap 3 (fastest — straight CRM↔Excel, autopilot)
  l3Copy: 1066,
  l3Paste: 1120,
  // act 4 — the punchline drag-fill (slow ratchet, row by grudging row)
  grab: 1180,
  dragEnd: 1300,
  release: 1314,
  // act 5 — the lone total, the grand pull-back, the relief
  totalAt: 1360,
  endRest: 1410,
  endVanish: 28,
} as const

/* ── focus / scrim: exactly ONE app is live per span; the others desaturate to
      grey under a flat dim scrim (depth without shadow). The cursor ripple and
      the live accent come from whoever owns the screen at `frame`. ──────────── */

export type App = 'excel' | 'crm' | 'gallery'

type Span = { app: App; from: number }
export const FOCUS_SPANS: readonly Span[] = [
  { app: 'excel', from: 0 },
  { app: 'gallery', from: T.galOpen },
  { app: 'excel', from: T.tplLoad },
  { app: 'crm', from: T.l1Crm },
  { app: 'excel', from: T.l1Back },
  { app: 'crm', from: T.l2Crm },
  { app: 'excel', from: T.l2Back },
  { app: 'crm', from: T.l3Copy - 18 },
  // keep the CRM lit until the lap-3 marching-ants copy window closes (l3Copy+27),
  // so the final copy never greys out mid-action; Excel then owns the paste
  { app: 'excel', from: T.l3Copy + 27 },
]

export function focusedApp(frame: number): App {
  let app: App = FOCUS_SPANS[0].app
  for (const s of FOCUS_SPANS) if (frame >= s.from) app = s.app
  return app
}

/** Build the lit intervals for one app from the focus spans. */
function litIntervals(app: App): Array<{ from: number; to: number }> {
  const out: Array<{ from: number; to: number }> = []
  for (let i = 0; i < FOCUS_SPANS.length; i++) {
    if (FOCUS_SPANS[i].app !== app) continue
    const from = FOCUS_SPANS[i].from
    const to = i + 1 < FOCUS_SPANS.length ? FOCUS_SPANS[i + 1].from : Infinity
    out.push({ from, to })
  }
  return out
}

/** 0 when the app owns the screen, 1 when it sits under the dim veil; an 8-frame
 *  flat cross-fade at every hand-off. Multiply by the scrim's max alpha (0.28). */
export const SCRIM_FADE = 8
export function appDim(app: App, frame: number): number {
  const lit = litIntervals(app)
  let litness = 0
  for (const iv of lit) {
    // ramp up when GAINING focus mid-scene; the opening span (from 0) is already lit
    const up = iv.from <= 0 ? 1 : clamp01((frame - iv.from) / SCRIM_FADE)
    const down = iv.to === Infinity ? 1 : 1 - clamp01((frame - iv.to) / SCRIM_FADE)
    litness = Math.max(litness, Math.min(up, down))
  }
  return 1 - litness
}

/* ── cell-fill schedule (pure) ──────────────────────────────────────────────
   The template hands you label/spec bars; YOU fill FILL_COL by hand. Paste rows
   land on the paste clicks; drag rows are revealed by a frame-pure handle-Y
   (see handleY() in the visual) crossing each row's midline — NOT the live cursor
   pose, so the reveal is monotonic and frozen full after the drag (never un-reveals). */

/** When (frame) a template line-item's bars begin to fade in — a slow wavefront
 *  down the sheet so even "instant" template load feels like it drips in. */
export function templateRowAt(r: number): number {
  return T.tplDone + r * 5
}

/** The frame each manual paste lands in FILL_COL (sync the bar to the click). */
export const PASTE_LAND: readonly number[] = [T.l1Paste + 3, T.l2Paste + 3, T.l3Paste + 3]

/* ── progress bar (template load): crawl → STALL at 0.7 → finish ─────────── */
export function loadProgress(frame: number): number {
  if (frame <= T.tplLoad) return 0
  if (frame < T.tplStallFrom) return 0.7 * (frame - T.tplLoad) / (T.tplStallFrom - T.tplLoad)
  if (frame < T.tplStallTo) return 0.7 // the universal fake-hang
  if (frame < T.tplDone) return 0.7 + 0.3 * (frame - T.tplStallTo) / (T.tplDone - T.tplStallTo)
  return 1
}

/* ── helpers ────────────────────────────────────────────────────────────── */
function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x
}

/* ── THE CURSOR SPINE ───────────────────────────────────────────────────────
   Content-space waypoints. Clicks LAND at at+3; the visual syncs each reaction
   to that. Standard OS pointers, NO hands: `arrow` clicks app UI (dock, buttons,
   records), `text` types in the search well, `cell` (the spreadsheet "+") sits
   over grid cells, `crosshair` (the thin "+") drags the fill-handle. Generous
   gaps so every click settles before the cursor leaves (validated below). */

const fc = FILL_COL
export const PM_CURSOR: readonly CursorWaypoint[] = [
  // act 0 — fade in over the empty hero cell (the spreadsheet "+"), sit a long beat
  { at: T.cold, ...nudge(cellCenter(PASTE_ROWS[0], fc), 40, -6), state: 'cell' },

  // act 1 — slowly reach all the way down to the dock, summon the gallery, hunt
  { at: T.filesClick, ...dockCenter(DOCK_FILES), state: 'arrow', click: true, travel: 46 },
  { at: T.galHoverA, ...galChipCenter(GAL_MISHOVER[0]), state: 'arrow', travel: 40 },
  { at: T.galHoverB, ...galChipCenter(GAL_MISHOVER[1]), state: 'arrow', travel: 30 },
  { at: T.galPick, ...galChipCenter(GAL_PICK), state: 'arrow', click: true, travel: 34 },
  { at: T.galOpenBtn, ...galOpenBtnCenter(), state: 'arrow', click: true, travel: 34 },

  // act 2 — drift over the sheet and WAIT there while it loads (and stalls)
  { at: T.tplLoad + 58, ...nudge(cellCenter(0, 0), 18, 0), state: 'cell', travel: 40 },

  // act 3 lap 1 — the full window-switch tax, at human speed
  { at: T.l1Crm, ...dockCenter(DOCK_CRM), state: 'arrow', click: true, travel: 44 },
  { at: T.l1Search, ...crmSearchCenter(), state: 'text', click: true, travel: 40 },
  { at: T.l1Hover, ...crmRowCenter(0), state: 'arrow', travel: 30 }, // wrong record first
  { at: T.l1Select, ...crmRowCenter(2), state: 'arrow', click: true, travel: 30 },
  { at: T.l1Copy, ...crmValueCenter(2), state: 'arrow', click: true, travel: 32 },
  { at: T.l1Back, ...dockCenter(DOCK_EXCEL), state: 'arrow', click: true, travel: 44 },
  { at: T.l1Paste, ...cellCenter(PASTE_ROWS[0], fc), state: 'cell', click: true, travel: 40 },

  // act 3 lap 2 — a touch quicker, still deliberate
  { at: T.l2Crm, ...dockCenter(DOCK_CRM), state: 'arrow', click: true, travel: 42 },
  { at: T.l2Copy, ...crmValueCenter(3), state: 'arrow', click: true, travel: 36 },
  { at: T.l2Back, ...dockCenter(DOCK_EXCEL), state: 'arrow', click: true, travel: 42 },
  { at: T.l2Paste, ...cellCenter(PASTE_ROWS[1], fc), state: 'cell', click: true, travel: 40 },

  // act 3 lap 3 — autopilot, straight CRM↔Excel
  { at: T.l3Copy, ...crmValueCenter(4), state: 'arrow', click: true, travel: 44 },
  { at: T.l3Paste, ...cellCenter(PASTE_ROWS[2], fc), state: 'cell', click: true, travel: 44 },

  // act 4 — grab the fill-handle (the thin "+") and ratchet it ALL the way down
  { at: T.grab, ...fillHandle(PASTE_ROWS[2], fc), state: 'crosshair', travel: 42 },
  { at: T.dragEnd, ...fillHandle(DRAG_ROWS[DRAG_ROWS.length - 1], fc), state: 'crosshair', travel: 118 },
  { at: T.release, ...fillHandle(DRAG_ROWS[DRAG_ROWS.length - 1], fc), state: 'cell', travel: 12 },

  // act 5 — drift to the lone total, then dissolve (la UI sigue sola → corte a la IA)
  { at: T.totalAt, ...nudge(cellCenter(TOTAL_ROW, fc + 1), 0, 4), state: 'cell', travel: 36 },
  { at: T.endRest, ...nudge(cellCenter(6, 3), 0, 0), state: 'arrow', travel: 34, vanish: T.endVanish },
]

/** Spread a center point into {x,y} with a small offset (keeps waypoints terse). */
function nudge(p: { x: number; y: number }, dx: number, dy: number) {
  return { x: p.x + dx, y: p.y + dy }
}

/* ── THE CAMERA RIG ─────────────────────────────────────────────────────────
   Macro-lens choreography that lives DOWN in the work and never grants a calm
   full-desk overview. Frames each target a beat before the cursor acts there;
   the lone live accent is dragged corner-to-corner across mostly-grey frames. */

/** Map a content-space center {x,y} into a camera focus {fx,fy}. */
function foc(p: { x: number; y: number }) {
  return { fx: p.x, fy: p.y }
}
const exc = { x: EXCEL.x + EXCEL.w / 2, y: EXCEL.y + EXCEL.h / 2 }
export const PM_CAMERA: readonly CameraFraming[] = [
  // cold open: extreme macro inside one empty cell — "this'll take forever"
  { at: 0, zoom: 2.6, ...foc(cellCenter(PASTE_ROWS[0], fc)) },
  // the epic-of-nothing dolly-out: the lone ring adrift in an empty grid
  { at: T.reveal, zoom: 1.18, fx: exc.x - 40, fy: exc.y - 60, travel: 56 },
  // dip toward the dock for the first window-switch tax
  { at: T.filesClick + 2, zoom: 1.16, ...foc(dockCenter(DOCK_FILES)), travel: 44 },
  // up-pan to the gallery as it raises (the third destination / the hunt)
  { at: T.galReady, zoom: 1.0, fx: GALLERY.x + GALLERY.w / 2, fy: GALLERY.y + GALLERY.h / 2, travel: 44 },
  // push onto the chosen chip
  { at: T.galPick - 4, zoom: 1.2, ...foc(galChipCenter(GAL_PICK)), travel: 36 },
  // cruel macro onto the load bar's leading edge where it crawls in and STALLS at
  // 70% (fx sits on the stall edge ≈ gutter + 0.7·barW; fy on the bar itself)
  { at: T.tplLoad + 4, zoom: 2.6, fx: EXCEL.x + 650, fy: EXCEL.y + GRID.titleH + GRID.toolH - 1, travel: 40 },
  // dip back to the dock for the CRM
  { at: T.l1Crm - 8, zoom: 1.16, ...foc(dockCenter(DOCK_CRM)), travel: 44 },
  // long pan LEFT to the CRM record list — "all the way over there"
  { at: T.l1Select - 10, zoom: 1.22, ...foc(crmRowCenter(2)), travel: 48 },
  // macro push on the record for the COPY; fy tracks a beat late (slipping away)
  { at: T.l1Copy - 2, zoom: 1.36, ...foc(nudge(crmValueCenter(2), 0, 14)), travel: 30 },
  // whip BACK to the dock carrying the clipboard dot — more travel across the void
  { at: T.l1Back, zoom: 1.12, ...foc(dockCenter(DOCK_EXCEL)), travel: 36 },
  // push into the target cell for PASTE #1 — "after all that, ONE bar"
  { at: T.l1Paste - 2, zoom: 1.34, ...foc(cellCenter(PASTE_ROWS[0], fc)), travel: 34 },
  // lap 2 — back to CRM, same swing, a touch faster
  { at: T.l2Copy - 6, zoom: 1.34, ...foc(crmValueCenter(3)), travel: 40 },
  // lap 2 paste — zoom creeping inward
  { at: T.l2Paste - 2, zoom: 1.4, ...foc(cellCenter(PASTE_ROWS[1], fc)), travel: 32 },
  // lap 3 — CRM, faster cut
  { at: T.l3Copy - 4, zoom: 1.34, ...foc(crmValueCenter(4)), travel: 30 },
  // lap 3 paste — tightest of the loop
  { at: T.l3Paste - 2, zoom: 1.44, ...foc(cellCenter(PASTE_ROWS[2], fc)), travel: 30 },
  // push into the fill-handle for the drag
  { at: T.grab + 2, zoom: 2.0, ...foc(fillHandle(PASTE_ROWS[2], fc)), travel: 40 },
  // slow VERTICAL macro tracking shot, locked to the dragging handle
  { at: T.dragEnd, zoom: 1.9, ...foc(nudge(fillHandle(DRAG_ROWS[DRAG_ROWS.length - 1], fc), -COL_W / 2, -GRID.rowH)), travel: 100 },
  // grand pull-back — the only near-complete view, off-centre + drift; HOLD
  { at: T.totalAt + 6, zoom: 1.12, fx: exc.x + 60, fy: exc.y + 40, travel: 44 },
]

/* ── derived duration ───────────────────────────────────────────────────── */
const LAST_CAM = PM_CAMERA[PM_CAMERA.length - 1].at
export const PRESUPUESTO_MANUAL_DURATION = Math.max(
  cursorScriptDuration(PM_CURSOR, 34),
  LAST_CAM + 60,
)

/* ── authoring guards (used by the test; also safe to call at module load) ── */
export function scriptProblems(): string[] {
  return [
    ...validateCursorScript(PM_CURSOR).map((e) => `cursor: ${e}`),
    ...validateCameraRig(PM_CAMERA).map((e) => `camera: ${e}`),
  ]
}
