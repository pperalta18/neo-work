# Pathfinding Concepts

Represents an abstract concept (e.g. "intelligence") as a **route** navigating
the grid from a start node to a goal. This is the layer that turns "here's the
idea" into a composition, and makes variations cheap.

## Capabilities

- An author describes a concept as an ordered list of **steps** plus a **start node**.
- The **goal node** (blue dot) is **always** rendered just outside the **top-right
  corner**, even after the grid grows from added rows/columns or a span — it never
  lands inside a cell.
- Each step is, by default, an **arrow** that auto-points toward the next step. A step
  can instead carry **text**, an **image**, an **icon**, or an **AiKit module** badge
  (brand icon stacked over a micro-action caption — turns the route into a reasoning
  chain of tools the AI reaches for, e.g. *create an online store*). Any step can span
  multiple columns/rows.
- Arrow directions are **derived from the route geometry** — editing the route
  re-orients every arrow automatically.
- A route can be **auto-generated** with BFS from just a start, a goal, and a set of
  blocked cells (`solve`). Changing start / goal / blocked regenerates the path.
- The start node (empty disc) and goal node (blue dot) sit just outside the grid and
  are present from the start.

## Constraints (geometry rules)

- A step has a **footprint**: the rectangle of cells `[col … col+colSpan-1] × [row …
  row+rowSpan-1]`. No two steps may overlap footprints.
- Connectivity is **edge-to-edge between footprints**, not anchor-to-anchor. The arrow
  leaving a step originates from the footprint edge facing the next step: e.g. a step
  that spans 3 columns horizontally connects to the next step from its **rightmost**
  column, and the next step must be adjacent to that edge.
- The arrow direction of a step is the direction from its footprint toward the next
  step's footprint (last step → goal node).
- When a step's span changes, later steps **reflow** so footprints never overlap:
  steps after it shift along the path direction to stay adjacent and clear.

## Related specs

- [Grid & Cells](./grid-and-cells.md) — steps render as cells.
- [Emergence Animation](./emergence-animation.md) — how a route is revealed.
- [Editor](./editor.md) — building and editing routes.

## Source

- [src/lib/pathfinding.ts](../src/lib/pathfinding.ts)
- [src/components/PathScene.tsx](../src/components/PathScene.tsx)
- [src/content/concepts.ts](../src/content/concepts.ts)
