# Emergence Animation

Plays a route being built piece by piece — each step rises out of the surface
toward the viewer, since neumorphism is itself a 3D depth illusion.

## Capabilities

- Authors can play a route's construction: route steps appear **one at a time**, in
  order, animating from flat → raised (shadow grows, plate scales up, fades in).
- The start node and goal node are present from the beginning; only the route between
  them is built.

## Constraints

- Reveal order follows the route order (step 1 first, then 2, …).
- The light source does not move during the animation (for now).
- Driven by `revealedCount`: steps with index `< revealedCount` are raised; the rest
  stay flat. When omitted, all steps are shown raised (static).

## Related specs

- [Pathfinding Concepts](./pathfinding-concepts.md) — defines the route being revealed.
- [Neumorphism Engine](./neumorphism-engine.md) — flat↔raised interpolation.

## Source

- [src/components/PathScene.tsx](../src/components/PathScene.tsx)
- [src/components/Cell.tsx](../src/components/Cell.tsx)
