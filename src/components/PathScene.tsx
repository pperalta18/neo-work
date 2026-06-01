import type { CSSProperties } from 'react'
import { CELL, elevation, KIT_BLUE, PLATE_INSET, type NeoTheme } from '@/lib/neumorphism'
import { footprint, reflowRoute, routeArrows, type Coord, type RouteStep } from '@/lib/pathfinding'
import { Cell } from '@/components/Cell'
import { Chevron, Label } from '@/components/content'
import { Grid } from '@/components/Grid'
import { Icon, isIconName } from '@/components/icons'
import { MODULES, isModuleName, type ModuleSpec } from '@/stories/neo/modules/modules'

/**
 * PathScene — renders a "concept" as a pathfinding composition.
 * ─────────────────────────────────────────────────────────────
 * Give it a route (ordered steps) plus a start and goal node. Each step renders
 * an arrow auto-oriented toward the next step — unless the step carries `text`
 * or `image`, in which case it shows that content. Start / goal nodes sit just
 * outside the grid and are present from the start.
 *
 * `revealedCount` drives the emergence animation: only the first N steps are
 * raised; the rest stay flat until revealed. `onCellClick` turns the grid into
 * an editable surface.
 */

export type PathSpec = {
  columns: number
  rows: number
  route: RouteStep[]
  /** Empty start disc. Defaults to just left of the first step. */
  startNode?: Coord
  // Goal node is always rendered just outside the top-right corner.
}

export function PathScene({
  spec,
  theme,
  cell = CELL,
  revealedCount,
  onCellClick,
  selected,
}: {
  spec: PathSpec
  theme: NeoTheme
  cell?: number
  revealedCount?: number
  onCellClick?: (coord: Coord) => void
  selected?: Coord | null
}) {
  // Resolve geometry: edge-to-edge connection, no overlaps, footprint-aware.
  const route = reflowRoute(spec.route)

  // Grow the grid if any step's footprint runs past the declared size.
  const columns = Math.max(spec.columns, ...route.map((s) => footprint(s).c1))
  const rows = Math.max(spec.rows, ...route.map((s) => footprint(s).r1))

  const startNode: Coord = spec.startNode ?? [0, route[0]?.at[1] ?? 1]
  // The goal always lives just outside the top-right corner — never inside a
  // cell, even after the grid grows from added rows/columns or a span.
  const goalNode: Coord = [columns + 1, 1]

  const arrows = routeArrows(route, goalNode)

  const centre = (c: Coord): [number, number] => [(c[0] - 0.5) * cell, (c[1] - 0.5) * cell]
  const animate = revealedCount !== undefined

  return (
    <div style={{ position: 'relative', width: columns * cell, height: rows * cell }}>
      <Grid columns={columns} rows={rows} cell={cell} theme={theme} frame>
        {route.map((step, i) => {
          const [col, row] = step.at
          const revealed = !animate || i < revealedCount
          const common = {
            col,
            row,
            colSpan: step.colSpan,
            rowSpan: step.rowSpan,
            animate,
            revealed,
            key: `${col}-${row}-${i}`,
          }

          if (step.image) {
            return <Cell {...common} variant="image" background={step.image.background} src={step.image.src} />
          }
          // An AiKit module renders its brand icon inline, exactly like any other
          // icon; paired with `text` it sits next to a micro-action caption.
          const moduleSpec: ModuleSpec | null = isModuleName(step.module) ? MODULES[step.module] : null
          const iconEl = moduleSpec ? (
            <img
              src={moduleSpec.icon}
              alt={moduleSpec.name}
              width={40}
              height={40}
              style={{
                display: 'block',
                flexShrink: 0,
                transform: moduleSpec.rotate ? `rotate(${moduleSpec.rotate}deg)` : undefined,
              }}
            />
          ) : isIconName(step.icon) ? (
            <Icon name={step.icon} />
          ) : null
          if (step.text) {
            return (
              <Cell {...common} align="center">
                {iconEl}
                <Label muted={step.text.muted}>{step.text.main}</Label>
              </Cell>
            )
          }
          if (iconEl) {
            return <Cell {...common}>{iconEl}</Cell>
          }
          return (
            <Cell {...common}>
              <Chevron dir={arrows[i]} />
            </Cell>
          )
        })}
      </Grid>

      <Node theme={theme} cell={cell} centre={centre(startNode)} variant="start" />
      <Node theme={theme} cell={cell} centre={centre(goalNode)} variant="goal" />

      {onCellClick ? (
        <ClickLayer columns={columns} rows={rows} cell={cell} selected={selected} onCellClick={onCellClick} />
      ) : null}
    </div>
  )
}

function ClickLayer({
  columns,
  rows,
  cell,
  selected,
  onCellClick,
}: {
  columns: number
  rows: number
  cell: number
  selected?: Coord | null
  onCellClick: (coord: Coord) => void
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, ${cell}px)`,
        gridTemplateRows: `repeat(${rows}, ${cell}px)`,
      }}
    >
      {Array.from({ length: columns * rows }, (_, i) => {
        const col = (i % columns) + 1
        const row = Math.floor(i / columns) + 1
        const isSel = selected?.[0] === col && selected?.[1] === row
        return (
          <button
            key={i}
            onClick={() => onCellClick([col, row])}
            style={{
              border: isSel ? `2px solid ${KIT_BLUE}` : '1px solid transparent',
              borderRadius: 12,
              background: 'transparent',
              cursor: 'pointer',
              padding: 0,
            }}
          />
        )
      })}
    </div>
  )
}

function Node({
  theme,
  cell,
  centre,
  variant,
}: {
  theme: NeoTheme
  cell: number
  centre: [number, number]
  variant: 'start' | 'goal'
}) {
  // A node sits in an invisible cell-sized box and its disc is inset by the same
  // padding as a raised cell plate — so it's exactly the size of an elevated cell.
  const box: CSSProperties = {
    position: 'absolute',
    left: centre[0] - cell / 2,
    top: centre[1] - cell / 2,
    width: cell,
    height: cell,
  }
  const disc: CSSProperties = {
    position: 'absolute',
    inset: PLATE_INSET,
    display: 'grid',
    placeItems: 'center',
    ...elevation(theme, { depth: 'raised', radius: 999 }),
  }
  const discSize = cell - PLATE_INSET * 2

  return (
    <div style={box}>
      <div style={disc}>
        {variant === 'goal' ? (
          <div
            style={{
              width: discSize * 0.5,
              height: discSize * 0.5,
              borderRadius: 999,
              background: KIT_BLUE,
              boxShadow: `0 0 ${discSize * 0.25}px ${KIT_BLUE}66`,
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
