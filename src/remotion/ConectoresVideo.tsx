/**
 * ConectoresVideo — «Conectores (rodeo)».
 * ──────────────────────────────────────────────────────────────────────────
 * The real third-party tools (Notion · Zapier · Gmail · Jira · Outlook) on
 * raised plates across a field grid; the arrow's route goes to each one and
 * SKIRTS it — a box of chevrons AROUND the logo instead of through it. A thin
 * shell over {@link conectoresScript}; renderers reused verbatim: the field is
 * storeFlowScene's `GridLines`, every plate its `FlowPlate` (the logo injected
 * via the `iconNode` slot), the trail its `Chevron`.
 */
import { type CSSProperties } from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { FlowPlate, GridLines, theme } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  CHAIN,
  CHAIN_DIRS,
  DURATION,
  GRID_H,
  GRID_W,
  LOGOS,
  cameraPZ,
  logoGrow,
  trailGrow,
} from './conectoresScript'

export const CONECTORES_DURATION = DURATION

export function ConectoresVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const { P, Z } = cameraPZ(frame, W, H)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - P[0] * Z}px, ${H / 2 - P[1] * Z}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
            {/* the field — static hairlines, bleeding off every edge */}
            <GridLines />

            {/* the route — chevrons that rise as the head passes and STAY, skirting each logo */}
            {CHAIN.map((c, i) => {
              if (i >= CHAIN_DIRS.length) return null
              const grow = trailGrow(frame, i)
              if (grow <= 0.001) return null
              return <FlowPlate key={`t${i}`} step={{ at: c }} dir={CHAIN_DIRS[i]} grow={grow} />
            })}

            {/* the five connectors, on raised plates (the route goes AROUND these) */}
            {LOGOS.map((l, i) => {
              const grow = logoGrow(frame, i)
              if (grow <= 0.001) return null
              return (
                <FlowPlate
                  key={l.name}
                  step={{ at: l.at }}
                  dir="right"
                  grow={grow}
                  iconNode={
                    <Img
                      src={staticFile(`connectors/${l.name}.svg`)}
                      style={{ width: 48, height: 48, objectFit: 'contain', display: 'block' }}
                    />
                  }
                />
              )
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
