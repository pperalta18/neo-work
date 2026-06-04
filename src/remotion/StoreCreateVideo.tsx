/**
 * StoreCreateVideo — "Crear tienda online" → "Usando Forge".
 * ──────────────────────────────────────────────────────────────────────────
 * Opens on the flat neumorphic grid (the Flow "grid constructor" surface — see
 * [Grid & Cells](../../specs/grid-and-cells.md)) holding ONE pastilla: the Forge
 * module next to the label "Crear tienda online". The plate emerges (flat →
 * raised), holds a beat, then **expands**: its rect eases from the little pill to
 * the full 1920×1080 frame while its corner radius opens to 0 — the pill becomes
 * the next scene's surface — and the grid behind it scales outward and dissolves
 * *with* it, so the whole composition reads as one surface spreading open.
 *
 * Once full-frame, the label "Crear tienda online" collapses + fades and the
 * Forge icon glides to dead centre, where it plays its real Storybook reaction
 * (the Rive "React" timeline, pre-rendered deterministically by
 * scripts/capture-rive.mjs and replayed via {@link RiveClip}) as the caption
 * "Usando Forge" rises beneath it.
 *
 * House motion rules (specs/motion-language.md + ./motion): eased `interpolate`
 * only, ease-out, NO bounce/spring, depth from neumorphic relief — never a
 * coloured glow. Every pixel is a pure function of `useCurrentFrame()`.
 */

import { type CSSProperties } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { CELL, PLATE_INSET, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { Grid } from '@/components/Grid'
import { RiveClip } from './RiveClip'
import { CURVE, ease } from './motion'
import { Fonts } from './fonts'

const theme = lightTheme

// ── frame geometry ────────────────────────────────────────────────────────────
const W = 1920
const H = 1080

// A grid that bleeds off every edge, centred on the frame, so scaling it up never
// reveals a seam. 17×11 cells → 2176×1408, centred at (960, 540).
const COLUMNS = 17
const ROWS = 11
const GRID_W = COLUMNS * CELL
const GRID_H = ROWS * CELL
const GRID_LEFT = (W - GRID_W) / 2 // -128
const GRID_TOP = (H - GRID_H) / 2 // -164

// The single pastilla sits on the centre cell, spanning 3 columns × 1 row.
const PILL_COLS = 3
const COL0 = (COLUMNS - PILL_COLS) / 2 // 7
const ROW0 = (ROWS - 1) / 2 // 5
const FP = { left: COL0 * CELL, top: ROW0 * CELL, w: PILL_COLS * CELL, h: CELL }

// Plate start rect (footprint inset so the gridline shows around it) → full frame.
const PILL = {
  left: GRID_LEFT + FP.left + PLATE_INSET,
  top: GRID_TOP + FP.top + PLATE_INSET,
  w: FP.w - PLATE_INSET * 2,
  h: FP.h - PLATE_INSET * 2,
  r: 26,
}
const FULL = { left: 0, top: 0, w: W, h: H, r: 0 }

// ── timeline (30 fps) ───────────────────────────────────────────────────────
const GRID_IN: [number, number] = [0, 12]
const PLATE_EMERGE: [number, number] = [4, 22]
const CONTENT_IN: [number, number] = [12, 30]
const EXPAND_START = 40 // brief beat to read "Crear tienda online", then open
const EXPAND_END = 96 // snappy ~1.9 s full-frame expansion
const GRID_FADE: [number, number] = [EXPAND_START + 22, EXPAND_END - 4]
const TEXT_SWAP: [number, number] = [EXPAND_END + 2, EXPAND_END + 16] // "Crear tienda online" collapses + fades
const FORGE_PLAY = EXPAND_END + 10 // Forge starts its reaction as the label clears
const USANDO_IN: [number, number] = [EXPAND_END + 18, EXPAND_END + 40] // "Usando Forge" rises in
/** Total composition length in frames (~5.4 s) — a tight settle after "Usando Forge"
 *  arrives (~frame 136) while the Forge icon plays ~2 calm reaction cycles. */
export const STORE_CREATE_DURATION = 162

const GRID_SCALE_END = 2.7
const CONTENT_SCALE_END = 2.4
const ICON_BASE = 56 // forge edge at pill scale; ×CONTENT_SCALE_END at the hero

const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export function StoreCreateVideo() {
  const frame = useCurrentFrame()

  // pill → full-frame morph
  const expand = ease(frame, EXPAND_START, EXPAND_END, CURVE.standard)
  const rect = {
    left: lerp(PILL.left, FULL.left, expand),
    top: lerp(PILL.top, FULL.top, expand),
    w: lerp(PILL.w, FULL.w, expand),
    h: lerp(PILL.h, FULL.h, expand),
    r: lerp(PILL.r, FULL.r, expand),
  }

  // emerge: a small pop + relief growth, then the expand keeps relief growing
  const emerge = ease(frame, PLATE_EMERGE[0], PLATE_EMERGE[1], CURVE.enter)
  const emergeScale = lerp(0.92, 1, emerge)
  const plateOpacity = clamp01(emerge * 1.6)
  const distance = lerp(lerp(4, 9, emerge), 46, expand)
  const blur = lerp(lerp(10, 22, emerge), 130, expand)
  const plate = elevation(theme, { depth: 'raised', distance, blur, radius: rect.r })

  // the grid spreads outward and dissolves with the pill
  const gridScale = lerp(1, GRID_SCALE_END, expand)
  const gridIn = clamp01(ease(frame, GRID_IN[0], GRID_IN[1], CURVE.enter))
  const gridOut = ease(frame, GRID_FADE[0], GRID_FADE[1], CURVE.standard)
  const gridOpacity = gridIn * (1 - gridOut)

  // content: icon + label, centred, scaling into the hero
  const contentOpacity = clamp01(ease(frame, CONTENT_IN[0], CONTENT_IN[1], CURVE.enter) * 1.4)
  const contentScale = lerp(1, CONTENT_SCALE_END, expand)

  // "Crear tienda online" collapses (width → 0) + fades; the flex row recentres
  // the Forge icon to dead centre as it vanishes.
  const textGone = ease(frame, TEXT_SWAP[0], TEXT_SWAP[1], CURVE.standard)
  // "Usando Forge" caption rises in beneath the icon
  const usando = ease(frame, USANDO_IN[0], USANDO_IN[1], CURVE.enter)

  // arrival sheen as the surface locks to full frame
  const sheenX = interpolate(frame, [EXPAND_END - 12, EXPAND_END + 30], [-1.3, 1.3], { ...clampE, easing: CURVE.standard })
  const sheenOpacity = clamp01((expand - 0.7) / 0.3) * (1 - usando)

  const gridWrap: CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: `translate(-50%, -50%) scale(${gridScale})`,
    transformOrigin: '50% 50%',
    opacity: gridOpacity,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, overflow: 'hidden' }}>
      <Fonts />

      {/* the grid constructor surface — spreads out + dissolves as the pill grows */}
      <div style={gridWrap}>
        <Grid columns={COLUMNS} rows={ROWS} cell={CELL} theme={theme} gridlines>
          {/* merged-cell fill: paint the 3-cell footprint as one surface so the
              internal hairlines vanish — the pastilla reads as a single pill. */}
          <div
            style={{
              position: 'absolute',
              left: FP.left,
              top: FP.top,
              width: FP.w,
              height: FP.h,
              background: theme.surface,
              boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            }}
          />
        </Grid>
      </div>

      {/* the pastilla → full-frame surface */}
      <div
        style={{
          position: 'absolute',
          left: rect.left,
          top: rect.top,
          width: rect.w,
          height: rect.h,
          transform: `scale(${emergeScale})`,
          transformOrigin: '50% 50%',
          opacity: plateOpacity,
        }}
      >
        <div
          style={{
            ...plate,
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* content group — scales up into the hero, stays centred */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${contentScale})`,
              transformOrigin: '50% 50%',
              opacity: contentOpacity,
            }}
          >
            {/* Forge — rests until its cue, then plays the Storybook "React" reaction */}
            <RiveClip module="forge" size={ICON_BASE} startAt={FORGE_PLAY} loop />

            {/* "Crear tienda online" — collapses to 0 width + fades; the row
                recentres the Forge icon as it disappears. */}
            <div
              style={{
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                maxWidth: (1 - textGone) * 420,
                marginLeft: (1 - textGone) * 14,
                opacity: 1 - textGone,
                fontFamily: TEXT_FONT,
                fontSize: 20,
                lineHeight: '28px',
                letterSpacing: -0.4,
              }}
            >
              <span style={{ color: theme.textMuted }}>Crear </span>
              <span style={{ color: theme.textStrong }}>tienda online</span>
            </div>

            {/* "Usando Forge" — rises in beneath the centred icon */}
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: '50%',
                marginTop: 16,
                transform: `translate(-50%, ${(1 - usando) * 14}px)`,
                opacity: usando,
                whiteSpace: 'nowrap',
                fontFamily: TEXT_FONT,
                fontSize: 17,
                lineHeight: '24px',
                letterSpacing: -0.2,
              }}
            >
              <span style={{ color: theme.textMuted }}>Usando </span>
              <span style={{ color: theme.textStrong }}>Forge</span>
            </div>
          </div>

          {/* arrival sheen — a neutral highlight, never a coloured glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: sheenOpacity,
              background:
                'linear-gradient(108deg, transparent 42%, rgba(255,255,255,0.42) 50%, transparent 58%)',
              transform: `translateX(${sheenX * 100}%)`,
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  )
}
