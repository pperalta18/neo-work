/**
 * ControlaModulosVideo — «Controla · módulos», a horizontal pan past the modules.
 * ──────────────────────────────────────────────────────────────────────────
 * One arrow sweeps left→right along a single row of the Controla (blue/data)
 * modules on an infinite grid. Each module is a NAMED plate (icon + wordmark) and
 * plays its Rive logo as the arrow head passes through it; the chevrons stay,
 * weaving a trail. The camera only pans horizontally, resting on each module for
 * two seconds. Plates reuse storeFlowScene's `FlowPlate`; the brain is
 * {@link controlaModulosScript}.
 */
import { type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { CELL as NEO_CELL } from '@/lib/neumorphism'
import { type RiveClipName } from './riveClips'
import { RiveClip } from './RiveClip'
import { FlowNode, FlowPlate, theme } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  CHAIN,
  CHAIN_DIRS,
  GOAL_NODE,
  GRID_H,
  GRID_W,
  MODULES_ROW,
  MODULE_SPAN,
  MODULE_TRIGGER,
  ROW,
  cameraPZ,
  cellGrow,
  goalGrow,
  isGoalCell,
  isModuleCell,
  moduleGrow,
} from './controlaModulosScript'

export { DURATION as CONTROLA_MODULOS_DURATION } from './controlaModulosScript'

export function ControlaModulosVideo() {
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
            {/* infinite hairline grid — 3× the field, aligned to CELL, always bleeds */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: -GRID_W,
                top: -GRID_H,
                width: 3 * GRID_W,
                height: 3 * GRID_H,
                pointerEvents: 'none',
                backgroundImage: `linear-gradient(to right, ${theme.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${theme.gridLine} 1px, transparent 1px)`,
                backgroundSize: `${NEO_CELL}px ${NEO_CELL}px`,
              }}
            />

            {/* the woven trail — chevrons along the row (module cells suppressed) */}
            {CHAIN.map((c, i) => {
              if (i >= CHAIN_DIRS.length || isModuleCell(c) || isGoalCell(c)) return null
              const grow = cellGrow(frame, i)
              if (grow <= 0.001) return null
              return <FlowPlate key={`c${i}`} step={{ at: c }} dir={CHAIN_DIRS[i]} grow={grow} />
            })}

            {/* the modules — NAMED plates (icon + wordmark); each logo plays its Rive
                as the arrow head passes through its cell (MODULE_TRIGGER). */}
            {MODULES_ROW.map((m, k) => {
              const grow = moduleGrow(frame, k)
              if (grow <= 0.001) return null
              return (
                <FlowPlate
                  key={m.name}
                  step={{ at: [m.col, ROW], module: m.name, text: { main: m.label }, colSpan: MODULE_SPAN }}
                  dir="right"
                  grow={grow}
                  iconNode={
                    <RiveClip module={m.name as RiveClipName} size={40} startAt={MODULE_TRIGGER[k]} />
                  }
                />
              )
            })}

            {/* the objetivo — the goal node the line ARRIVES at; replaces the
                run-out chevrons, emerging just before the head reaches it. */}
            <FlowNode coord={GOAL_NODE} variant="goal" grow={goalGrow(frame)} />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
