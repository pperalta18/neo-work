import type { PathSpec } from '@/components/PathScene'
import { coordsToSteps, solve, type Coord } from '@/lib/pathfinding'

/**
 * Concepts → pathfinding compositions.
 * Each entry says "this is the idea"; the engine renders it. Edit a route (or
 * the start / goal of a solved one) to spin off a new variation. A step can also
 * carry `text` or `image` instead of an arrow.
 */

export type Concept = {
  id: string
  label: string
  spec: PathSpec
}

export const CONCEPTS: Concept[] = [
  {
    // Faithful reproduction of the reference image.
    id: 'inteligencia',
    label: 'inteligencia',
    spec: {
      columns: 3,
      rows: 2,
      route: coordsToSteps([
        [1, 2],
        [2, 2],
        [2, 1],
        [3, 1],
      ]),
      startNode: [0, 2],
    },
  },
  {
    // Event-index variation: arrows interleaved with text plates.
    id: 'agenda',
    label: 'agenda',
    spec: {
      columns: 5,
      rows: 3,
      route: [
        { at: [1, 3], icon: 'sparkles' },
        { at: [2, 3], colSpan: 3, icon: 'user', text: { muted: '20:00', main: 'Pablo Yusta' } },
        { at: [2, 2] },
        { at: [3, 2], colSpan: 3, icon: 'user', text: { muted: '20:30', main: 'David W. Wood' } },
        { at: [3, 1], icon: 'mic' },
        { at: [4, 1] },
        { at: [5, 1] },
      ],
      startNode: [0, 3],
    },
  },
  {
    // AiKit reasoning chain: the steps the AI takes to launch an online store.
    // Each step is an AiKit module (brand icon + micro-action), serpentining
    // from the start disc up to the goal (the live store, blue dot top-right).
    // Crosses the three families: Controla (see) → Construye (build) → Delega (act).
    id: 'tienda-online',
    label: 'tienda online',
    spec: {
      // Reads as a PATHFINDING route, not a table: the AI navigates a sparse grid,
      // making a decision at each module (icon + micro-action chip) and "moving"
      // along arrow cells between them. Arrows turn (↑) at the corners — those
      // turns are the visible decisions. Empty rows above/below the winding line
      // are the space being searched. Bottom-left start → top-right goal (the
      // published store, blue dot). Geometry verified against reflowRoute.
      columns: 8,
      rows: 5,
      route: [
        // ── bottom row: gather the inputs (Controla), travelling right ──
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Catálogo' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'hotpot', text: { main: 'Pagos' } },
        { at: [6, 5] },
        { at: [7, 5], colSpan: 2, module: 'junction', text: { main: 'Unir datos' } },
        { at: [7, 4] }, // ↑ decision: turn up
        // ── middle row: build & scale (Construye), travelling left ──
        { at: [7, 3], colSpan: 2, module: 'foresight', text: { main: 'Demanda' } },
        { at: [6, 3] },
        { at: [4, 3], colSpan: 2, module: 'forge', text: { main: 'Montar web' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'teamwork', text: { main: 'Alta masiva' } },
        { at: [1, 2] }, // ↑ decision: turn up
        // ── top row: operate & sustain (Delega), travelling right to the goal ──
        { at: [1, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Publicar' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Stock' } },
        { at: [6, 1] },
        { at: [7, 1], colSpan: 2, module: 'smartProcess', text: { main: 'Reponer' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // Same concept, route AUTO-SOLVED with BFS around obstacles.
    id: 'inteligencia-solved',
    label: 'auto (BFS)',
    spec: {
      columns: 6,
      rows: 4,
      route: coordsToSteps(
        solve([1, 4], [6, 1], {
          columns: 6,
          rows: 4,
          blocked: [
            [3, 4],
            [3, 3],
            [3, 2],
            [5, 1],
            [5, 2],
          ] as Coord[],
        }),
      ),
      startNode: [0, 4],
    },
  },
]
