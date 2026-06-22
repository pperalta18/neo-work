import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CURVE, ease } from './motion'
import {
  CELL,
  cellOrigin,
  EVENTS,
  GRID_LINE,
  H,
  IDLE_GRID_DURATION,
  PLATE,
  PLATE_RADIUS,
  PLATE_RAISED_SHADOW,
  PLATE_RISE,
  PLATE_SINK,
  type PlateEvent,
  SLIDE_BACKGROUND,
  SURFACE_DARK,
  W,
} from './idleGridScript'

/**
 * IdleGrid — the idle screen between presentations.
 * ────────────────────────────────────────────────────────────────────────────
 * A dense, static 64px grid that's simply *there* (it never draws in), with blank
 * neumorphic elevations rising and sinking in random cells — no paths, no arrows,
 * no goal, no glows. Ambient motion only. Deterministic schedule in
 * {@link idleGridScript}; the field is empty at both ends so the loop is seamless.
 */

/** One elevation: eases up out of the surface, rests, eases back down. */
function Plate({ event }: { event: PlateEvent }) {
  const frame = useCurrentFrame()
  const sinkAt = event.appear + PLATE_RISE + event.hold
  const end = sinkAt + PLATE_SINK
  if (frame < event.appear || frame > end) return null

  const rise = ease(frame, event.appear, event.appear + PLATE_RISE, CURVE.enter)
  const sink = ease(frame, sinkAt, end, CURVE.exit)
  const visible = rise * (1 - sink)
  if (visible <= 0.001) return null

  const y = 8 * (1 - rise) + 8 * sink
  const origin = cellOrigin(event.c, event.r)
  return (
    <div
      style={{
        position: 'absolute',
        left: origin.x,
        top: origin.y,
        width: PLATE,
        height: PLATE,
        borderRadius: PLATE_RADIUS,
        backgroundColor: SURFACE_DARK,
        opacity: visible,
        transform: `translateY(${y}px)`,
        boxShadow: PLATE_RAISED_SHADOW,
      }}
    />
  )
}

export const IdleGridVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: SURFACE_DARK }}>
      <AbsoluteFill style={{ width: W, height: H, backgroundImage: SLIDE_BACKGROUND }}>
        {/* the static, full-bleed grid — always present, never drawn in */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
            backgroundSize: `${CELL}px ${CELL}px`,
          }}
        />

        {/* soft vignette so the field has depth without drawing the eye */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at 50% 50%, transparent 46%, rgba(9, 11, 15, 0.5) 100%)',
          }}
        />

        {/* the random elevations */}
        {EVENTS.map((event, i) => (
          <Plate key={i} event={event} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

export { IDLE_GRID_DURATION }
