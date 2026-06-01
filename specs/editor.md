# Editor

An in-app surface for building a pathfinding concept directly on the grid, then
exporting it as a reusable spec.

## Capabilities

- Authors build a route by **clicking empty cells** to append steps in order; the path
  and arrows recompute automatically.
- Authors **select a step** (click it on the grid or in the step list) and edit its
  content: arrow / text / image, and its width (column span).
- For image steps, authors can **attach an image file** (uploaded and embedded as a data
  URL, with a thumbnail preview) or paste an image URL.
- For icon steps (and as an optional accent on text steps), authors pick from a Hugeicons
  set via an icon picker.
- Authors set the grid **columns and rows**.
- Authors **play** the emergence animation and **reset** to a starting state.
- Authors **export** the concept as JSON to paste into `concepts.ts`.

## Constraints

- Adding or widening a step must not create overlaps: the editor **reflows** later steps
  (see [Pathfinding Concepts](./pathfinding-concepts.md) geometry rules).
- The selected step is highlighted on the grid.
- Start node defaults to the left of the first step; the goal node is always pinned
  just outside the top-right corner (it follows the grid as it grows).

## UX notes

- The sidebar is grouped: scene settings (size), playback, the route step list, the
  selected-step editor, and export — in that priority order, with clear separation.
- The step list shows each step's index, position, and content type.

## Related specs

- [Pathfinding Concepts](./pathfinding-concepts.md)
- [Emergence Animation](./emergence-animation.md)

## Source

- [src/components/Editor.tsx](../src/components/Editor.tsx)
