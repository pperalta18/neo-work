# 3D Stacked-Process Generator (GridStack3D)

**Keywords**: stack 3D, planos de proceso apilados, CSS-3D (no three.js, no SDF),
perspective / preserve-3d / translate3d, exploded iso fan, depth wave front→back,
rack-focus (haze + blur por profundidad), ProcessGrid, StoreFlow emergence
generalised, PathSpec por plano, GridStackDoc, grid3d.html studio, Remotion
composition GridStack3D, Copiar doc, deterministic frame-driven.

## Propósito

Apilar **varios procesos** (cada uno una rejilla neumórfica que emerge ruta a
ruta) como **planos 3D** en abanico iso, para leer "muchos procesos a la vez" en
profundidad. Es a la vez una **herramienta de autoría** (su propia app,
`grid3d.html`) y una **composición Remotion** (`GridStack3D`) que renderiza el
mismo stack de forma determinista.

Es **CSS-3D puro** (perspective + preserve-3d + translate3d), **no three.js y no
el SDF/raymarch** del plan original (`plans/grid-3d-sdf.md`, descartado): así los
plates son los **plates neumórficos reales** y se ven pixel-exactos, y todo el
movimiento es función pura del frame.

## Capacidades de usuario

- En el **studio** (`grid3d.html`) el usuario compone un stack a ojo:
  - vista previa 3D en vivo — **arrastrar para orbitar, rueda para zoom**;
  - **gestor de planos** — añadir / clonar / reordenar / borrar planos;
  - **✎** abre el **Editor de grid** completo de un plano (tamaño de grid + cada pill);
  - **sliders de staging** — fan lateral/vertical, separación (gap), rack-focus
    (dim + blur), opacidad de relleno, pose base de cámara, perspectiva;
  - **play / scrub** reproduce la onda de profundidad front→back;
  - **"Copiar doc"** emite el `GridStackDoc` JSON.
- Pegar ese JSON como props de `<GridStack3DVideo>` (composición **GridStack3D**)
  renderiza **ese mismo stack** verbatim — una sola forma de dato, dos hosts.
- Cada plano corre **su propia** emergencia estilo StoreFlow (`ProcessGrid`) sobre
  **su propia ruta**; los planos arrancan escalonados (stagger) creando una **onda
  de profundidad** del plano frontal al más lejano.
- La profundidad se lee por **relieve + perspectiva atmosférica** (los planos del
  fondo se atenúan con un velo del color de superficie y se desenfocan); **nunca
  por glows de color**. El único acento azul (`KIT_BLUE`) es el nodo *goal*.
- Por defecto el stack se siembra con los `CONCEPTS` existentes (un proceso
  distinto por plano), totalmente editable en el studio.

## Restricciones

- **Determinismo**: toda la animación es función pura de `frame` (cámara con
  easing *smootherstep* hecho a mano; sin `Date.now()`/`Math.random()` en la ruta
  de render) → el mismo frame de Remotion renderiza pixel-idéntico entre runs.
- **Una fuente de verdad para la matemática**: timeline de la onda de
  profundidad, layout del abanico iso, rack-focus y cámara viven en
  `gridStack3d.ts` — módulo **puro, sin dependencias** (sin React/three/remotion),
  compartido **verbatim** por ambos hosts y unit-testeado en el proyecto `node`.
- **Reglas de la casa** (`specs/motion-language.md`): ease-out, **sin rebote**;
  profundidad por relieve + haze, no por glows.
- `ProcessGrid` generaliza la emergencia de StoreFlow a **cualquier `PathSpec`**:
  cada plate es función pura de un `reveal` continuo (flat→raised: sombra crece,
  escala sube, opacidad entra) — a diferencia de `<PathScene>`/`<Cell>` que emergen
  por transición CSS de reloj de pared (no determinista bajo Remotion).
- La composición Remotion es 1920×1080 @30fps; `calculateGridStack3DMetadata`
  dimensiona `durationInFrames` a la onda de profundidad (último plano + breathe).
- App independiente: entrada Vite propia (`grid3d.html`), separada del keynote/grid
  (`index.html`) y del generador de prints (`prints.html`).

## Estructura

- `GridStackDoc` (`doc.ts`) = lista ordenada de planos `PathSpec` (cada uno un
  concepto editable: grid + ruta + contenido por pill) + `layout` (staging del
  abanico) + `dark` + `cell` (px uniforme en todo el stack).
- `Studio.tsx` (autoría) y `GridStack3DVideo.tsx` (Remotion) montan ambos el
  **mismo** `GridStackScene3D` (el escenario CSS-3D); sólo difiere el driver
  (scrub/orbit vs `useCurrentFrame()`).

## Relacionadas

- [Pathfinding Concepts](./pathfinding-concepts.md) — el `PathSpec`/ruta que cada plano edita
- [Emergence Animation](./emergence-animation.md) — el revelado paso a paso que `ProcessGrid` generaliza
- [Neumorphism Engine](./neumorphism-engine.md) — temas / `elevation()` de los plates reales
- [Editor](./editor.md) — el editor de grid que el studio abre por plano (✎)
- [Product Video (Remotion)](./product-video.md) — arquitectura base de composiciones
- [Motion Language](./motion-language.md) — curvas, beats, reglas de movimiento

## Source

- [src/grid3d/doc.ts](../src/grid3d/doc.ts) — el contrato `GridStackDoc` + ground/defaults
- [src/grid3d/gridStack3d.ts](../src/grid3d/gridStack3d.ts) — timeline, layout, rack-focus, cámara (puro)
- [src/grid3d/ProcessGrid.tsx](../src/grid3d/ProcessGrid.tsx) — un plano: emergencia StoreFlow sobre cualquier PathSpec
- [src/grid3d/GridStackScene3D.tsx](../src/grid3d/GridStackScene3D.tsx) — el escenario CSS-3D compartido
- [src/grid3d/GridStack3DVideo.tsx](../src/grid3d/GridStack3DVideo.tsx) — host Remotion (composición GridStack3D)
- [src/grid3d/Studio.tsx](../src/grid3d/Studio.tsx) — host de autoría (grid3d.html)
- [src/grid3d/main.tsx](../src/grid3d/main.tsx), [grid3d.html](../grid3d.html) — entrada de la app
- [src/grid3d/gridStack3d.test.ts](../src/grid3d/gridStack3d.test.ts) — tests de la matemática
