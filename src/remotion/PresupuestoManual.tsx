import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CURVE, DUR, ease } from './motion'
import { ScriptedCursor } from './aikit/ScriptedCursor'
import { cursorPose } from './aikit/cursorScript'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import { seeded } from './aikit/rand'
import {
  appDim,
  cellCenter,
  cellRect,
  COL_W,
  CRM,
  crmRowRect,
  DOCK,
  DOCK_CRM,
  DOCK_EXCEL,
  DOCK_FILES,
  DOCK_GAP,
  DOCK_N,
  DOCK_SQ,
  DRAG_ROWS,
  EXCEL,
  FILL_COL,
  focusedApp,
  GALLERY,
  galChipRect,
  GAL_PICK,
  galOpenBtnCenter,
  GHOST_ROW,
  GRID,
  loadProgress,
  PASTE_LAND,
  PASTE_ROWS,
  PM_CAMERA,
  PM_CURSOR,
  T,
  TEMPLATE_ROWS,
  templateRowAt,
  TOTAL_ROW,
  type App,
} from './presupuestoManualScript'

export { PRESUPUESTO_MANUAL_DURATION } from './presupuestoManualScript'

/**
 * PresupuestoManual — «El Vía Crucis del Presupuesto» (~27 s · 1920×1080).
 * ───────────────────────────────────────────────────────────────────────────
 * The PAIN/BEFORE counterpart to PresupuestoChat. A human builds a quote BY HAND
 * on a flat, text-free desktop, shot through a macro lens that never grants a
 * calm full view: double-click the file gallery, hunt a template, switch to the
 * CRM, copy one value, switch back, paste, copy-paste-copy-paste, then ratchet a
 * fill-handle down a whole column one grudging row at a time. Exactly ONE accent
 * is live per beat — the app you're IN owns its colour; every other window
 * desaturates under a flat dim veil (depth without a single shadow). All flat,
 * all deterministic; every shape is driven by presupuestoManualScript.ts.
 *
 * NO neumorphism, NO box-shadow, NO text — separation is hairlines + flat fills +
 * accent tints + z-order + the dim scrim. Don't wire this into the print system.
 */

/* ── flat palette (self-contained; cool grounds, no cream) ──────────────────*/
const C = {
  ground: '#EEF1F6',
  surface: '#FFFFFF',
  line: '#D4D9E2',
  lineSoft: '#E4E9F0',
  chrome: '#C4C8D0',
  barEmpty: '#C4CCD8',
  barData: '#9AA6B6',
  ink: '#33373E',
  excel: '#2ADA56',
  crm: '#0070F9',
  files: '#F5A524',
  scrim: '#0E1422',
  track: '#DDE3EC',
} as const

const ACCENT: Record<App, string> = { excel: C.excel, crm: C.crm, gallery: C.files }
const SCRIM_MAX = 0.28
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const inRect = (p: { x: number; y: number }, r: { x: number; y: number; w: number; h: number }) =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h

/* ── local (window-relative) cell geometry for drawing inside the Excel body ─*/
const GRID_BODY_TOP = GRID.titleH + GRID.toolH + GRID.headerH
function localCell(r: number, c: number) {
  return { x: GRID.gutterW + c * COL_W, y: GRID_BODY_TOP + r * GRID.rowH, w: COL_W, h: GRID.rowH }
}

/* ── the fill-handle's vertical position during the ratchet drag (pure, frozen
      after the drag so later cursor moves never un-reveal the column) ────────*/
function handleY(frame: number): number {
  const yTop = cellRect(PASTE_ROWS[2], FILL_COL).y + GRID.rowH
  const yBot = cellRect(DRAG_ROWS[DRAG_ROWS.length - 1], FILL_COL).y + GRID.rowH
  if (frame <= T.grab) return yTop
  const t = CURVE.standard(clamp01((frame - T.grab) / (T.dragEnd - T.grab)))
  return lerp(yTop, yBot, t)
}

/* ── the active-cell ring walks 5→6→7 as the three pastes land, then holds at
      the source cell while the fill-handle drags the marquee down ────────────*/
function ringRow(frame: number): number {
  if (frame < PASTE_LAND[1]) return PASTE_ROWS[0]
  if (frame < PASTE_LAND[2]) return PASTE_ROWS[1]
  return PASTE_ROWS[2]
}

export function PresupuestoManual() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(PM_CAMERA, frame, CURVE.standard), frame, 1)
  const pose = cursorPose(PM_CURSOR, frame, CURVE.standard)
  const focus = focusedApp(frame)

  return (
    <AbsoluteFill style={{ backgroundColor: C.ground, overflow: 'hidden' }}>
      {/* the whole desk, shot through the virtual macro lens */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        <ExcelWindow frame={frame} dim={appDim('excel', frame)} z={focus === 'excel' ? 30 : 10} />
        <CrmWindow frame={frame} dim={appDim('crm', frame)} z={focus === 'crm' ? 30 : 11} pose={pose} />
        <GalleryWindow frame={frame} dim={appDim('gallery', frame)} pose={pose} />
        <Dock frame={frame} focus={focus} />
        <ClipboardDot frame={frame} pose={pose} />
        {/* cursor lives INSIDE the camera transform so it shares plane coords */}
        <ScriptedCursor script={PM_CURSOR} accent={ACCENT[focus]} size={30} ease={CURVE.standard} />
      </div>
    </AbsoluteFill>
  )
}

/* ── window shell: 1px border, three grey dots + one accent app-mark, a flat
      dim veil over the body (no shadow), and a 1.04× push back when inactive ──*/
function WindowFrame({
  box,
  titleH,
  accent,
  dim,
  z,
  children,
}: {
  box: { x: number; y: number; w: number; h: number }
  titleH: number
  accent: string
  dim: number
  z: number
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: box.x,
        top: box.y,
        width: box.w,
        height: box.h,
        zIndex: z,
        transform: `scale(${1 + 0.04 * dim})`,
        transformOrigin: '50% 50%',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 14, overflow: 'hidden' }}>
        {/* content sits below the title bar */}
        <div style={{ position: 'absolute', left: 0, top: titleH, right: 0, bottom: 0 }}>{children}</div>
        {/* the dim veil — depth without a single shadow; never covers the title */}
        {dim > 0.001 && (
          <div style={{ position: 'absolute', left: 0, top: titleH, right: 0, bottom: 0, background: C.scrim, opacity: SCRIM_MAX * dim, pointerEvents: 'none' }} />
        )}
        {/* title bar stays crisp above the veil — the wayfinding anchor */}
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: titleH, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.chrome }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.chrome }} />
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.chrome }} />
          <span style={{ width: 15, height: 15, borderRadius: 4, background: accent, marginLeft: 10 }} />
        </div>
      </div>
    </div>
  )
}

/* ── EXCEL ──────────────────────────────────────────────────────────────────*/
function ExcelWindow({ frame, dim, z }: { frame: number; dim: number; z: number }) {
  const ring = ringRow(frame)
  const hY = handleY(frame)
  const dragging = frame >= T.grab && frame <= T.release + 4
  const loadOn = frame >= T.tplLoad && frame <= T.tplDone + 12

  return (
    <WindowFrame box={EXCEL} titleH={GRID.titleH} accent={C.excel} dim={dim} z={z}>
      {/* toolbar + formula strip (content is offset by titleH already) */}
      <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: GRID.toolH, borderBottom: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px' }}>
        {/* a few flat toolbar pills */}
        {[34, 22, 22, 50, 22].map((w, i) => (
          <span key={i} style={{ width: w, height: 12, borderRadius: 6, background: C.lineSoft }} />
        ))}
        {/* name-box (tints green — a cell is always active) + long formula bar */}
        <span style={{ width: 46, height: 18, borderRadius: 5, marginLeft: 8, background: `${C.excel}22`, border: `1px solid ${C.excel}55` }} />
        <span style={{ flex: 1, height: 18, borderRadius: 5, background: '#F7F9FC', border: `1px solid ${C.lineSoft}` }} />
      </div>

      {/* the grid */}
      <Grid frame={frame} ring={ring} hY={hY} dragging={dragging} />

      {/* template-load progress: crawls, STALLS at 70%, finishes — drawn AFTER the
          grid (on the toolbar/grid divider) so the header band never occludes it */}
      {loadOn && <ProgressBar frame={frame} />}
    </WindowFrame>
  )
}

function ProgressBar({ frame }: { frame: number }) {
  const p = loadProgress(frame)
  const appear = ease(frame, T.tplLoad, T.tplLoad + DUR.quick) * (1 - ease(frame, T.tplDone + 4, T.tplDone + 12))
  const left = GRID.gutterW
  const width = EXCEL.w - GRID.gutterW - 24
  return (
    <div style={{ position: 'absolute', left, top: GRID.toolH - 3, width, height: 5, borderRadius: 2.5, background: C.track, opacity: appear, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${p * 100}%`, background: C.excel, borderRadius: 2.5 }} />
      {/* a brighter leading edge — the thing the macro lens cruelly studies */}
      <div style={{ position: 'absolute', left: `calc(${p * 100}% - 4px)`, top: 0, height: '100%', width: 4, background: '#7BF09A' }} />
    </div>
  )
}

function Grid({ frame, ring, hY, dragging }: { frame: number; ring: number; hY: number; dragging: boolean }) {
  const top = GRID.toolH
  const gridW = COL_W * GRID.cols
  const gridH = GRID.rowH * GRID.bodyRows
  const bodyTop = GRID.headerH

  // which cells carry content
  const labelCols = [0, 2, 3] // template line-item bars
  const rowEls: React.ReactNode[] = []
  for (let r = 0; r < GRID.bodyRows; r++) {
    // template bars (col 0/2/3), drip in down the sheet
    if (r < TEMPLATE_ROWS) {
      for (const c of labelCols) {
        const rev = ease(frame, templateRowAt(r), templateRowAt(r) + DUR.base)
        if (rev <= 0.001) continue
        rowEls.push(<Bar key={`t${r}-${c}`} r={r} c={c} reveal={rev} color={C.barData} kind={c === 0 ? 'label' : 'num'} />)
      }
    }
    // ghost rows below the line items: faint empty placeholders (never done)
    if (r >= TEMPLATE_ROWS && r <= GHOST_ROW) {
      const rev = ease(frame, T.tplDone, T.tplDone + DUR.base)
      if (r !== TOTAL_ROW) rowEls.push(<Bar key={`g${r}`} r={r} c={0} reveal={rev * 0.5} color={C.barEmpty} kind="label" />)
    }
    // FILL_COL — the column filled by hand
    const fillRev = fillReveal(r, frame, hY)
    if (fillRev > 0.001) rowEls.push(<Bar key={`f${r}`} r={r} c={FILL_COL} reveal={fillRev} color={C.barData} kind="num" />)
  }

  // the lone graphite total, at the very end
  const totalRev = ease(frame, T.totalAt, T.totalAt + DUR.reveal)

  return (
    <div style={{ position: 'absolute', left: 0, top, right: 0, bottom: 0 }}>
      {/* column-header band — tiny ticks, never letters */}
      <div style={{ position: 'absolute', left: GRID.gutterW, top: 0, width: gridW, height: GRID.headerH, borderBottom: `1px solid ${C.line}`, background: '#F7F9FC' }}>
        {Array.from({ length: GRID.cols }).map((_, c) => (
          <span key={c} style={{ position: 'absolute', left: c * COL_W + COL_W / 2 - 5, top: GRID.headerH / 2 - 1.5, width: 10, height: 3, borderRadius: 1.5, background: C.chrome }} />
        ))}
      </div>
      {/* row gutter — tiny ticks */}
      <div style={{ position: 'absolute', left: 0, top: bodyTop, width: GRID.gutterW, height: gridH, borderRight: `1px solid ${C.line}`, background: '#F7F9FC' }}>
        {Array.from({ length: GRID.bodyRows }).map((_, r) => (
          <span key={r} style={{ position: 'absolute', left: GRID.gutterW / 2 - 5, top: r * GRID.rowH + GRID.rowH / 2 - 1.5, width: 10, height: 3, borderRadius: 1.5, background: C.chrome }} />
        ))}
      </div>
      {/* the cell field: hairline grid via repeating gradients (crisp at macro) */}
      <div
        style={{
          position: 'absolute',
          left: GRID.gutterW,
          top: bodyTop,
          width: gridW,
          height: gridH,
          backgroundImage: `repeating-linear-gradient(to right, ${C.lineSoft} 0 1px, transparent 1px ${COL_W}px), repeating-linear-gradient(to bottom, ${C.lineSoft} 0 1px, transparent 1px ${GRID.rowH}px)`,
          borderRight: `1px solid ${C.line}`,
          borderBottom: `1px solid ${C.line}`,
        }}
      >
        {rowEls}

        {/* total line: a thin double rule + a graphite bar */}
        {totalRev > 0.001 && (
          <>
            <div style={{ position: 'absolute', left: localCell(TOTAL_ROW, FILL_COL).x - GRID.gutterW, top: TOTAL_ROW * GRID.rowH, width: COL_W * 2, height: 2, background: C.ink, opacity: 0.5 * totalRev }} />
            <Bar r={TOTAL_ROW} c={FILL_COL + 1} reveal={totalRev} color={C.ink} kind="num" />
          </>
        )}

        {/* active-cell ring (white fill + 2px inset green ring) */}
        <ActiveCell row={ring} frame={frame} />

        {/* fill-handle: parked at the source cell, or dragging the marquee down */}
        <FillHandleAndMarquee ring={ring} hY={hY} dragging={dragging} frame={frame} />
      </div>
    </div>
  )
}

/** A cell's FILL_COL reveal: pasted rows pop on their paste click; drag rows
 *  fade as the fill-handle crosses their midline. */
function fillReveal(r: number, frame: number, hY: number): number {
  const pasteIdx = PASTE_ROWS.indexOf(r as (typeof PASTE_ROWS)[number])
  if (pasteIdx >= 0) return ease(frame, PASTE_LAND[pasteIdx], PASTE_LAND[pasteIdx] + DUR.base)
  if (DRAG_ROWS.includes(r as (typeof DRAG_ROWS)[number]) && frame >= T.grab) {
    const cross = cellCenter(r, FILL_COL).y
    return clamp01((hY - (cross - 8)) / 18)
  }
  return 0
}

function Bar({ r, c, reveal, color, kind }: { r: number; c: number; reveal: number; color: string; kind: 'label' | 'num' }) {
  const cell = localCell(r, c)
  const inner = cell.w - 28
  const wFrac = kind === 'label' ? 0.62 + 0.3 * seeded(r * GRID.cols + c) : 0.34 + 0.24 * seeded(r * GRID.cols + c, 7)
  const w = inner * wFrac
  const right = kind === 'num'
  const e = CURVE.enter(clamp01(reveal))
  return (
    <div
      style={{
        position: 'absolute',
        left: cell.x - GRID.gutterW + (right ? cell.w - 14 - w : 14),
        top: cell.y - GRID_BODY_TOP + cell.h / 2 - 5,
        width: w,
        height: 10,
        borderRadius: 5,
        background: color,
        opacity: e,
        transform: `scaleX(${0.55 + 0.45 * e})`,
        transformOrigin: right ? 'right center' : 'left center',
      }}
    />
  )
}

function ActiveCell({ row, frame }: { row: number; frame: number }) {
  const appear = ease(frame, T.cold, T.cold + DUR.base)
  const cell = localCell(row, FILL_COL)
  return (
    <div
      style={{
        position: 'absolute',
        left: cell.x - GRID.gutterW,
        top: cell.y - GRID_BODY_TOP,
        width: cell.w,
        height: cell.h,
        boxSizing: 'border-box',
        // transparent fill — the ring is just a selection outline; a pasted bar in
        // this same cell must read THROUGH it (the loop's whole payoff)
        background: 'transparent',
        border: `2px solid ${C.excel}`,
        opacity: appear,
      }}
    />
  )
}

function FillHandleAndMarquee({ ring, hY, dragging, frame }: { ring: number; hY: number; dragging: boolean; frame: number }) {
  const src = localCell(ring, FILL_COL)
  const appear = ease(frame, T.cold, T.cold + DUR.base)
  // local y of the handle
  const localHandleY = hY - (EXCEL.y + GRID.titleH + GRID.toolH + GRID.headerH)
  const handleLocalTop = dragging ? localHandleY : src.y - GRID_BODY_TOP + src.h
  const dash = frame % 16
  return (
    <>
      {/* the dashed fill marquee from the source cell down to the handle */}
      {dragging && (
        <div
          style={{
            position: 'absolute',
            left: src.x - GRID.gutterW,
            top: src.y - GRID_BODY_TOP,
            width: src.w,
            height: Math.max(0, handleLocalTop - (src.y - GRID_BODY_TOP)),
            boxSizing: 'border-box',
            border: `2px dashed ${C.excel}`,
            backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${GRID.rowH - 1}px, ${C.excel}22 ${GRID.rowH - 1}px, ${C.excel}22 ${GRID.rowH}px)`,
            backgroundPositionY: `${dash}px`,
          }}
        />
      )}
      {/* the hero fill-handle square */}
      <div
        style={{
          position: 'absolute',
          left: src.x - GRID.gutterW + src.w - 7,
          top: handleLocalTop - 7,
          width: 13,
          height: 13,
          background: C.excel,
          border: '1.5px solid #FFFFFF',
          opacity: appear,
        }}
      />
    </>
  )
}

/* ── CRM ────────────────────────────────────────────────────────────────────*/
function CrmWindow({ frame, dim, z, pose }: { frame: number; dim: number; z: number; pose: { x: number; y: number } }) {
  const listReady = ease(frame, T.l1Crm + 14, T.l1Crm + 14 + DUR.reveal)
  const coldLoad = frame >= T.l1Crm && frame < T.l1Crm + 16
  // caret only blinks while the lap-1 search field is actually the focus, not on
  // laps 2–3 where the cursor never touches the search well again
  const caretOn = frame >= T.l1Search && frame < T.l1Copy && frame % 16 < 8

  // selected / copied record per lap
  const selectedRow = frame >= T.l3Copy ? 4 : frame >= T.l2Copy ? 3 : frame >= T.l1Select ? 2 : -1
  // copy marching-ants windows
  const copyWin = (copyAt: number, row: number) => (frame >= copyAt + 3 && frame < copyAt + 27 ? row : -1)
  const antsRow = copyWin(T.l1Copy, 2) >= 0 ? 2 : copyWin(T.l2Copy, 3) >= 0 ? 3 : copyWin(T.l3Copy, 4) >= 0 ? 4 : -1

  return (
    <WindowFrame box={CRM} titleH={GRID.titleH} accent={C.crm} dim={dim} z={z}>
      {/* search well + blinking caret */}
      <div style={{ position: 'absolute', left: 22, top: 16, right: 22, height: 36, borderRadius: 18, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
        <span style={{ width: 13, height: 13, borderRadius: '50%', border: `2px solid ${C.chrome}`, boxSizing: 'border-box' }} />
        <span style={{ width: 120, height: 8, borderRadius: 4, background: frame >= T.l1Search ? C.barData : C.barEmpty }} />
        {caretOn && <span style={{ width: 2, height: 18, background: C.crm }} />}
      </div>

      {/* cold-load spinner, then the record list */}
      {coldLoad && (
        <div style={{ position: 'absolute', left: CRM.w / 2 - 14, top: 200 }}>
          <Spinner frame={frame} size={28} color={C.crm} />
        </div>
      )}
      <div style={{ opacity: listReady }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const r = crmRowRect(i)
          const local = { x: r.x - CRM.x, y: r.y - CRM.y, w: r.w, h: r.h }
          const selected = i === selectedRow
          const ants = i === antsRow
          const hovered = inRect(pose, r) && !selected && focusedApp(frame) === 'crm'
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: local.x,
                top: local.y,
                width: local.w,
                height: local.h,
                boxSizing: 'border-box',
                borderRadius: 12,
                border: `1px solid ${selected ? `${C.crm}66` : hovered ? C.chrome : C.lineSoft}`,
                background: selected ? `${C.crm}14` : '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '0 18px',
              }}
            >
              {/* blue selection rail */}
              {selected && <div style={{ position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2, background: C.crm }} />}
              {/* avatar */}
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: C.chrome, flexShrink: 0 }} />
              {/* two stacked content bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <span style={{ width: 150 + Math.round(70 * seeded(i, 3)), height: 9, borderRadius: 4.5, background: selected || ants ? C.barData : C.barEmpty }} />
                <span style={{ width: 90 + Math.round(50 * seeded(i, 9)), height: 8, borderRadius: 4, background: C.barEmpty }} />
              </div>
              {/* the value chip being copied — a true marching-ants ring while copying */}
              <div style={{ position: 'absolute', right: 16, top: local.h / 2 - 13, width: 76, height: 26, borderRadius: 7, background: ants ? `${C.crm}10` : '#F7F9FC', border: ants ? 'none' : `1px solid ${C.lineSoft}` }}>
                <span style={{ position: 'absolute', left: 12, top: 9, width: 44, height: 8, borderRadius: 4, background: selected || ants ? C.barData : C.barEmpty }} />
                {ants && (
                  <svg width={76} height={26} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
                    <rect x={1} y={1} width={74} height={24} rx={7} fill="none" stroke={C.crm} strokeWidth={2} strokeDasharray="8 6" strokeDashoffset={-frame} />
                  </svg>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </WindowFrame>
  )
}

/* ── TEMPLATE GALLERY (a wall of indistinguishable chips) ────────────────────*/
function GalleryWindow({ frame, dim, pose }: { frame: number; dim: number; pose: { x: number; y: number } }) {
  const enter = ease(frame, T.galOpen - 8, T.galOpen - 8 + DUR.reveal, CURVE.enter)
  const exit = 1 - ease(frame, T.tplLoad, T.tplLoad + 10, CURVE.exit)
  const vis = enter * exit
  if (vis <= 0.001) return null
  const ready = ease(frame, T.galReady, T.galReady + DUR.reveal)

  return (
    <div style={{ opacity: vis, transform: `translateY(${(1 - enter) * 30}px)` }}>
      <WindowFrame box={GALLERY} titleH={GRID.titleH} accent={C.files} dim={dim} z={40}>
        {/* folder strip — amber pills */}
        <div style={{ position: 'absolute', left: 24, top: 16, right: 24, height: 28, display: 'flex', gap: 12, alignItems: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 64, height: 22, borderRadius: 11, background: i === 0 ? `${C.files}22` : '#F7F9FC', border: `1px solid ${i === 0 ? `${C.files}66` : C.lineSoft}` }} />
          ))}
        </div>

        {/* cold-load spinner before the chips resolve */}
        {frame < T.galReady && (
          <div style={{ position: 'absolute', left: GALLERY.w / 2 - 16, top: GALLERY.h / 2 - 40 }}>
            <Spinner frame={frame} size={32} color={C.files} />
          </div>
        )}

        {/* 4×3 chip wall */}
        {Array.from({ length: 12 }).map((_, i) => {
          const r = galChipRect(i)
          const local = { x: r.x - GALLERY.x, y: r.y - GALLERY.y, w: r.w, h: r.h }
          const picked = i === GAL_PICK && frame >= T.galPick + 3
          const hovered = inRect(pose, r) && !picked
          const pulse = 0.5 + 0.18 * Math.sin(frame / 7)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: local.x,
                top: local.y,
                width: local.w,
                height: local.h,
                boxSizing: 'border-box',
                borderRadius: 12,
                border: `${picked ? 2 : 1}px solid ${picked ? C.files : hovered ? `${C.files}88` : C.line}`,
                background: picked ? `${C.files}10` : '#FFFFFF',
                padding: 18,
                opacity: frame < T.galReady ? pulse : 1,
              }}
            >
              {/* a faint fake doc preview — one wide bar + three short ones */}
              <div style={{ opacity: ready }}>
                <div style={{ width: '78%', height: 10, borderRadius: 5, background: C.barData, marginBottom: 14 }} />
                {[0.92, 0.7, 0.55].map((w, k) => (
                  <div key={k} style={{ width: `${w * 100}%`, height: 7, borderRadius: 3.5, background: C.barEmpty, marginBottom: 9 }} />
                ))}
              </div>
            </div>
          )
        })}

        {/* the open pill (no text) — pulses on click */}
        <OpenButton frame={frame} />
      </WindowFrame>
    </div>
  )
}

function OpenButton({ frame }: { frame: number }) {
  const c = galOpenBtnCenter()
  const local = { x: c.x - GALLERY.x, y: c.y - GALLERY.y }
  const press = frame >= T.galOpenBtn + 3 && frame < T.galOpenBtn + 12
  return (
    <div
      style={{
        position: 'absolute',
        left: local.x - 60,
        top: local.y - 18,
        width: 120,
        height: 36,
        borderRadius: 18,
        background: C.files,
        transform: `scale(${press ? 0.94 : 1})`,
      }}
    />
  )
}

/* ── DOCK — the literal map of the window-switch tax ────────────────────────*/
function Dock({ frame, focus }: { frame: number; focus: App }) {
  const accents = [C.excel, C.crm, C.files, C.chrome]
  const focusIdx = focus === 'excel' ? DOCK_EXCEL : focus === 'crm' ? DOCK_CRM : DOCK_FILES
  // a soft press pulse when a dock square is actually clicked
  const clicks: Array<[number, number]> = [
    [T.filesClick, DOCK_FILES],
    [T.l1Crm, DOCK_CRM],
    [T.l1Back, DOCK_EXCEL],
    [T.l2Crm, DOCK_CRM],
    [T.l2Back, DOCK_EXCEL],
  ]
  return (
    <div style={{ position: 'absolute', left: DOCK.x, top: DOCK.y, width: DOCK.w, height: DOCK.h, zIndex: 25, borderRadius: 22, background: '#FFFFFFEE', border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: DOCK_GAP }}>
      {Array.from({ length: DOCK_N }).map((_, i) => {
        const active = i === focusIdx
        const pressed = clicks.some(([at, idx]) => idx === i && frame >= at + 3 && frame < at + 11)
        return (
          <div key={i} style={{ width: DOCK_SQ, height: DOCK_SQ, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${pressed ? 0.9 : 1})` }}>
            <div
              style={{
                width: DOCK_SQ - 8,
                height: DOCK_SQ - 8,
                borderRadius: 16,
                background: active ? accents[i] : C.chrome,
                opacity: active ? 1 : 0.55,
                outline: active ? `3px solid ${accents[i]}33` : 'none',
                outlineOffset: 3,
              }}
            />
          </div>
        )
      })}
    </div>
  )
}

/* ── the clipboard dot — the only thing that says Ctrl+C / Ctrl+V ───────────*/
function ClipboardDot({ frame, pose }: { frame: number; pose: { x: number; y: number } }) {
  const carries: Array<[number, number]> = [
    [T.l1Copy + 3, PASTE_LAND[0]],
    [T.l2Copy + 3, PASTE_LAND[1]],
    [T.l3Copy + 3, PASTE_LAND[2]],
  ]
  const active = carries.find(([from, to]) => frame >= from && frame < to)
  if (!active) return null
  const [from, to] = active
  const pop = ease(frame, from, from + DUR.quick)
  const drop = 1 - ease(frame, to - 6, to)
  const s = pop * drop
  return (
    <div
      style={{
        position: 'absolute',
        left: pose.x + 12,
        top: pose.y + 16,
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: C.crm,
        border: '2px solid #FFFFFF',
        transform: `scale(${s})`,
        zIndex: 55,
      }}
    />
  )
}

/* ── flat deterministic spinner (PresupuestoChat's, verbatim) ───────────────*/
function Spinner({ frame, size, color }: { frame: number; size: number; color: string }) {
  const angle = (frame * 9) % 360
  const r = size / 2 - 2
  const c = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: `rotate(${angle}deg)` }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={`${color}28`} strokeWidth={2.5} />
      <path d={`M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - r} ${c}`} fill="none" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  )
}
