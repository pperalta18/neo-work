/**
 * TejidoVivoVideo — «Tejido vivo», the organism of micro-processes.
 * ──────────────────────────────────────────────────────────────────────────
 * A thin visual shell over {@link tejidoVivoScript}: a huge light-neumorphic
 * field (StoreFlow's exact surface) shot wide by a slowly-breathing camera,
 * teeming with many flows at once. Every plate is storeFlowScene's `FlowPlate`,
 * reused verbatim — emergence via `grow`, dissipation folded into the same
 * `grow`/`scaleMul`/`opacityMul` channels (a dissipating plate sinks flat back
 * into the grid). The only non-plate accents are the KIT_BLUE traveling pulses
 * and the 2-3 hero "done" pips — small glow dots, not extra relief.
 *
 * The shell reads ONLY the script; all motion is a pure function of the frame.
 */
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { CELL as NEO_CELL } from '@/lib/neumorphism'
import { Grid } from '@/components/Grid'
import { MODULES } from '@/stories/neo/modules/modules'
import { FlowPlate, theme } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  COLUMNS,
  GRID_H,
  GRID_W,
  ROWS,
  TEJIDO_VIVO_DURATION,
  activeFlowsAt,
  breathAt,
  cameraPZ,
  clamp01,
  revealAt,
  stepDecayAt,
} from './tejidoVivoScript'

export { TEJIDO_VIVO_DURATION }

export function TejidoVivoVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  useAllModuleIconPreload()

  const { P, Z } = cameraPZ(frame, W, H)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - P[0] * Z}px, ${H / 2 - P[1] * Z}px) scale(${Z})`,
  }

  // Derive the whole field once per frame (not per plate).
  const flows = useMemo(() => activeFlowsAt(frame), [frame])
  const breath = breathAt(frame)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <Grid
            columns={COLUMNS}
            rows={ROWS}
            cell={NEO_CELL}
            theme={theme}
            gridlines
            style={{ width: GRID_W, height: GRID_H }}
          >
            {flows.map((ev) => {
              const reveal = revealAt(ev, frame)
              const live = ev.kind === 'ephemeral'
              return ev.placed.map((p, i) => {
                const gEmerge = clamp01(reveal - i)
                if (gEmerge <= 0.001) return null
                const decay = stepDecayAt(ev, frame, i)
                // Live tissue shares a ±2% breath; persistents are calcified (rigid).
                const breathMul = live ? 1 + 0.02 * breath : 1
                // Distance-to-camera depth-of-field — opacity only (cheap, no blur).
                const dist = Math.hypot(p.centerPx[0] - P[0], p.centerPx[1] - P[1])
                const dof = 1 - 0.08 * clamp01((dist - 700) / 900)
                return (
                  <FlowPlate
                    key={`${ev.id}:${i}`}
                    step={p.step}
                    dir={p.dir}
                    grow={gEmerge * (1 - decay) * breathMul}
                    scaleMul={1 - 0.12 * decay}
                    opacityMul={(1 - decay) * dof}
                  />
                )
              })
            })}
          </Grid>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Warm the browser cache for ALL module icons so plates have them on frame 0. */
function useAllModuleIconPreload() {
  const [handle] = useState(() => delayRender('Preload module icons', { timeoutInMilliseconds: 12000 }))
  useEffect(() => {
    const urls = Array.from(new Set(Object.values(MODULES).map((m) => m.icon)))
    if (urls.length === 0) {
      continueRender(handle)
      return
    }
    let done = 0
    const tick = () => {
      done += 1
      if (done >= urls.length) continueRender(handle)
    }
    for (const url of urls) {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
