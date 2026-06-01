# Grid & Cells

The composition surface: a coordinate grid of cells, each a container for
content. This is one of the two core tools (with the neumorphism engine).

## Capabilities

- Authors define a grid of `columns × rows`. Cells are 128px by default; individual
  column or row tracks can be resized to make room (scalable layout).
- Authors place a **Cell** by `(col, row)` — 1-indexed — and it can span multiple
  columns and/or rows.
- A cell can contain:
  - a neumorphic **elevation** plate (raised / recessed / flat),
  - a full-bleed **image** (or gradient),
  - **text** (a muted label + a strong value),
  - **icons** — directional chevrons, or Hugeicons content icons (icon-only or icon + text).
- The grid can draw faint **hairlines** between cells and an optional rounded **frame**
  (the soft tray panel) around the whole grid.

## Constraints

- A cell that spans more than one module reads as **one merged cell**: its footprint is
  painted opaque to hide internal hairlines, and a 1px perimeter border redraws its
  outer frame. (Merging only applies when hairlines are on.)
- Single (1×1) cells keep the hairline visible in their surrounding gutter.
- Content alignment inside a plate is start / center / end.

## Related specs

- [Neumorphism Engine](./neumorphism-engine.md) — how plates get their depth.
- [Pathfinding Concepts](./pathfinding-concepts.md) — places cells along a route.

## Source

- [src/components/Grid.tsx](../src/components/Grid.tsx)
- [src/components/Cell.tsx](../src/components/Cell.tsx)
- [src/components/content.tsx](../src/components/content.tsx)
