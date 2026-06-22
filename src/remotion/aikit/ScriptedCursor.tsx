import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { KIT_BLUE } from '@/lib/neumorphism'
import { CURVE } from '../motion'
import { type CursorGlyphState, type CursorWaypoint, cursorPose } from './cursorScript'

export type ScriptedCursorProps = {
  /** Waypoint timeline; see cursorScript.ts for the contract. */
  script: readonly CursorWaypoint[]
  /** Pixel size (height of the arrow glyph). 36 reads well on the 1920 canvas. */
  size?: number
  /** Ripple ring colour. */
  accent?: string
  /** Travel easing — the house on-screen move by default. */
  ease?: (t: number) => number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  zIndex?: number
  style?: CSSProperties
}

/**
 * ScriptedCursor — the kit's frame-driven OS pointer.
 * ───────────────────────────────────────────────────
 * Port of Cursor.tsx's glyphs/hotspots (arrow · I-beam · cell-+ · crosshair · hand) minus all
 * the runtime machinery: no mouse, no state, no CSS animation — pure pose from
 * cursorPose(script, frame). Press dips the glyph around its hotspot
 * (StorePitchVideo's gesture) and the click ripple is the CSS ring re-cut as an
 * interpolated frame effect. Render it as the last child of a `position:
 * relative` stage; waypoint coordinates are in that stage's space.
 */
export function ScriptedCursor({
  script,
  size = 36,
  accent = KIT_BLUE,
  ease = CURVE.standard,
  frame: frameProp,
  zIndex = 60,
  style,
}: ScriptedCursorProps) {
  const globalFrame = useCurrentFrame()
  const pose = cursorPose(script, frameProp ?? globalFrame, ease)
  if (pose.opacity <= 0.001) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate(${pose.x}px, ${pose.y}px)`,
        opacity: pose.opacity,
        pointerEvents: 'none',
        zIndex,
        ...style,
      }}
    >
      {pose.ripple != null && <RippleRing progress={pose.ripple} accent={accent} />}
      {/* The hotspot sits at this div's (0,0), so a top-left scale presses into the click point. */}
      <div style={{ transform: `scale(${1 - 0.12 * pose.press})`, transformOrigin: 'top left' }}>
        <CursorGlyph state={pose.state} size={size} />
      </div>
    </div>
  )
}

/** The expanding click ring — Cursor.tsx's 0.45s CSS ripple, frame-driven. */
function RippleRing({ progress, accent }: { progress: number; accent: string }) {
  const p = CURVE.standard(progress)
  const r = 7 * (0.3 + 2.3 * p)
  return (
    <span
      style={{
        position: 'absolute',
        left: -r,
        top: -r,
        width: r * 2,
        height: r * 2,
        boxSizing: 'border-box',
        borderRadius: '50%',
        border: `2px solid ${accent}`,
        opacity: 0.75 * (1 - p),
      }}
    />
  )
}

/** The drawn pointer for each state (Cursor.tsx's SVGs). Hotspot at the parent's (0,0). */
function CursorGlyph({ state, size }: { state: CursorGlyphState; size: number }) {
  if (state === 'text') {
    const h = size
    return (
      <svg width={h * 0.5} height={h} viewBox="0 0 12 24" style={{ transform: 'translate(-50%, -50%)' }}>
        <path
          d="M6 2v20M3 2h6M3 22h6"
          stroke="#1e1e20"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M6 2v20M3 2h6M3 22h6" stroke="#fff" strokeWidth="0.6" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  // cell — the thick white "+" a spreadsheet shows over its cells. Hotspot centre.
  if (state === 'cell') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: 'translate(-50%, -50%)' }}>
        <path
          d="M10 3 H14 V10 H21 V14 H14 V21 H10 V14 H3 V10 H10 Z"
          fill="#fff"
          stroke="#1e1e20"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // crosshair — the thin "+" for dragging a fill-handle. Hotspot centre, white halo.
  if (state === 'crosshair') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: 'translate(-50%, -50%)' }}>
        <path d="M12 3 V21 M3 12 H21" stroke="#fff" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        <path d="M12 3 V21 M3 12 H21" stroke="#1e1e20" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </svg>
    )
  }

  if (state === 'hand' || state === 'grab' || state === 'grabbing') {
    const grabbing = state === 'grabbing'
    // viewBox 0 0 28 36, fingertip hotspot ~ (11.8, 1).
    const fingers = grabbing
      ? // fist: fingers folded down
        [
          <rect key="i" x={10} y={9} width={3.6} height={11} rx={1.8} />,
          <rect key="m" x={14.2} y={8} width={3.6} height={12} rx={1.8} />,
          <rect key="r" x={18.4} y={8.5} width={3.6} height={11} rx={1.8} />,
          <rect key="p" x={22.4} y={10.5} width={3.4} height={9} rx={1.7} />,
        ]
      : [
          <rect key="i" x={10} y={1} width={3.6} height={19} rx={1.8} />,
          <rect key="m" x={14.2} y={6.5} width={3.6} height={13} rx={1.8} />,
          <rect key="r" x={18.4} y={8.5} width={3.6} height={11} rx={1.8} />,
          <rect key="p" x={22.4} y={10.5} width={3.4} height={9} rx={1.7} />,
        ]
    const shapes = (
      <>
        {fingers}
        <rect x={8} y={14} width={17} height={16} rx={7} />
        <rect x={5} y={15} width={3.8} height={10} rx={1.9} transform="rotate(-30 6.9 20)" />
      </>
    )
    const h = size * 1.35
    return (
      <svg
        width={(h * 28) / 36}
        height={h}
        viewBox="0 0 28 36"
        style={{ transform: `translate(${(-11.8 / 28) * 100}%, ${(-1 / 36) * 100}%)` }}
      >
        {/* dark outline via thick stroke behind */}
        <g fill="#1e1e20" stroke="#1e1e20" strokeWidth={3} strokeLinejoin="round">
          {shapes}
        </g>
        {/* white fill on top */}
        <g fill="#fff" stroke="none">
          {shapes}
        </g>
      </svg>
    )
  }

  // arrow (default). Hotspot at the tip (3, 2).
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: 'translate(-12.5%, -8.3%)' }}>
      <path
        d="M3 2 L3 18.2 L7.2 14.2 L10 20.4 L12.7 19.2 L9.9 13.1 L15.4 13.1 Z"
        fill="#fff"
        stroke="#1e1e20"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}
