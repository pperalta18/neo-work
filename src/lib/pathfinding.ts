/**
 * Pathfinding — the "intelligence" concept layer.
 * ────────────────────────────────────────────────
 * A concept is expressed as a route through the grid: an ordered list of cells
 * from a start node to a goal node. Each cell's arrow direction is *derived*
 * from the route geometry, so editing the route re-orients every arrow — that's
 * what makes variations cheap.
 *
 * Coords are [col, row], 1-indexed. Off-grid coords (col 0, col columns+1, etc.)
 * are allowed and used to place the start / goal nodes just outside the grid.
 */

export type Dir = 'up' | 'down' | 'left' | 'right'
export type Coord = [number, number]

/**
 * A single step along the route. By default it renders an arrow pointing to the
 * next step; give it `text` or `image` to make it a content cell instead.
 */
export type RouteStep = {
  at: Coord
  colSpan?: number
  rowSpan?: number
  text?: { muted?: string; main: string }
  image?: { src?: string; background?: string }
  /** Icon name (key of the icon registry). On its own → icon-only cell; with
   *  `text` → icon + text. */
  icon?: string
  /** AiKit module name (key of the module registry, e.g. `hotpot`). Renders the
   *  module's brand icon stacked over `text.main` as a micro-action — turns a
   *  step into "the AI reaching for this tool". Takes precedence over `icon`. */
  module?: string
  /** How the step sits in space — only consumed by the 3D (SDF) renderer; the
   *  2D scene always draws raised. `raised` swells out of the floor, `recessed`
   *  carves a hole into it, `flat` stays flush. Defaults to `raised`. */
  depth?: 'raised' | 'recessed' | 'flat'
}

export const stepCoords = (route: RouteStep[]): Coord[] => route.map((s) => s.at)

/** Wrap bare coords as plain arrow steps. */
export const coordsToSteps = (coords: Coord[]): RouteStep[] => coords.map((at) => ({ at }))

const key = (c: Coord) => `${c[0]},${c[1]}`

/** Cardinal direction pointing from `a` toward `b`. */
export function dirBetween(a: Coord, b: Coord): Dir {
  const dc = b[0] - a[0]
  const dr = b[1] - a[1]
  if (Math.abs(dc) >= Math.abs(dr)) return dc >= 0 ? 'right' : 'left'
  return dr >= 0 ? 'down' : 'up'
}

/**
 * BFS shortest path on a 4-connected grid, avoiding `blocked` cells.
 * Returns the inclusive ordered cells (start → goal), or [] if unreachable.
 * Use it to generate a route from just a start + goal, e.g.
 *   route: solve([1, 3], [5, 1], { columns: 5, rows: 3, blocked: [[3, 2]] })
 */
export function solve(
  start: Coord,
  goal: Coord,
  opts: { columns: number; rows: number; blocked?: Coord[] },
): Coord[] {
  const { columns, rows, blocked = [] } = opts
  const blockedSet = new Set(blocked.map(key))
  const inBounds = ([c, r]: Coord) => c >= 1 && c <= columns && r >= 1 && r <= rows

  const queue: Coord[][] = [[start]]
  const seen = new Set([key(start)])

  while (queue.length) {
    const path = queue.shift()!
    const cur = path[path.length - 1]
    if (cur[0] === goal[0] && cur[1] === goal[1]) return path

    const neighbours: Coord[] = [
      [cur[0] + 1, cur[1]],
      [cur[0] - 1, cur[1]],
      [cur[0], cur[1] + 1],
      [cur[0], cur[1] - 1],
    ]
    for (const n of neighbours) {
      if (!inBounds(n) || blockedSet.has(key(n)) || seen.has(key(n))) continue
      seen.add(key(n))
      queue.push([...path, n])
    }
  }
  return []
}

/**
 * Given the full ordered chain (startNode, ...route, goalNode), return, for each
 * on-grid route cell, the direction it should point (toward the next step).
 */
export function arrowsFor(chain: Coord[]): Array<{ cell: Coord; dir: Dir }> {
  const out: Array<{ cell: Coord; dir: Dir }> = []
  for (let i = 0; i < chain.length - 1; i += 1) {
    out.push({ cell: chain[i], dir: dirBetween(chain[i], chain[i + 1]) })
  }
  return out
}

// ── Footprint-aware geometry ─────────────────────────────────────────────────

export type Footprint = { c0: number; r0: number; c1: number; r1: number }

/** Inclusive cell bounds a step occupies. */
export function footprint(step: RouteStep): Footprint {
  const c0 = step.at[0]
  const r0 = step.at[1]
  return { c0, r0, c1: c0 + (step.colSpan ?? 1) - 1, r1: r0 + (step.rowSpan ?? 1) - 1 }
}

/** Direction from a footprint toward a target coord — uses the footprint edges. */
export function dirToward(fp: Footprint, target: Coord): Dir {
  if (target[0] > fp.c1) return 'right'
  if (target[0] < fp.c0) return 'left'
  if (target[1] > fp.r1) return 'down'
  if (target[1] < fp.r0) return 'up'
  // target sits inside the footprint: keep travelling rightward by default.
  return 'right'
}

/**
 * Resolve a route so consecutive steps connect **edge-to-edge** and never
 * overlap. Each step keeps the travel direction implied by its authored anchor,
 * but is repositioned adjacent to the previous step's footprint edge — so a
 * spanning step pushes whatever follows it past its far edge.
 */
export function reflowRoute(route: RouteStep[]): RouteStep[] {
  if (route.length === 0) return route
  const out: RouteStep[] = [{ ...route[0] }]

  for (let i = 1; i < route.length; i += 1) {
    const origPrev = route[i - 1]
    const origCur = route[i]
    let dir = dirToward(footprint(origPrev), origCur.at)
    // If the anchor fell inside the previous footprint, fall back to the raw
    // anchor-to-anchor direction so turns are preserved.
    if (
      origCur.at[0] >= footprint(origPrev).c0 &&
      origCur.at[0] <= footprint(origPrev).c1 &&
      origCur.at[1] >= footprint(origPrev).r0 &&
      origCur.at[1] <= footprint(origPrev).r1
    ) {
      dir = dirBetween(origPrev.at, origCur.at)
    }

    const prev = out[i - 1]
    const pf = footprint(prev)
    const curCols = origCur.colSpan ?? 1
    const curRows = origCur.rowSpan ?? 1

    let col = prev.at[0]
    let row = prev.at[1]
    if (dir === 'right') {
      col = pf.c1 + 1
      row = pf.r0
    } else if (dir === 'left') {
      col = pf.c0 - curCols
      row = pf.r0
    } else if (dir === 'down') {
      row = pf.r1 + 1
      col = pf.c0
    } else {
      row = pf.r0 - curRows
      col = pf.c0
    }

    out.push({ ...origCur, at: [Math.max(1, col), Math.max(1, row)] })
  }
  return out
}

/** Arrow direction per route step (footprint-aware), last step points to goal. */
export function routeArrows(route: RouteStep[], goal: Coord): Dir[] {
  return route.map((step, i) => {
    const target = i < route.length - 1 ? route[i + 1].at : goal
    return dirToward(footprint(step), target)
  })
}
