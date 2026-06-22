# Globo Vivo (GloboVivo)

**Keywords**: globo terráqueo / Tierra fotorrealista NASA Blue Marble, esfera 3D
real **three.js + @react-three/fiber + drei + @remotion/three** (no CSS-3D, no
falsa esfera), textura viva que **envuelve y reemplaza** la Tierra, tejido vivo
sobre la superficie, máscara de **crecimiento geodésico** desde un punto semilla,
colonización del planeta, CanvasTexture equirectangular, atlas de tejido en
Canvas2D, FlowPlate neumórfico reproducido a sprites, muchísimos procesos
(híbrido curado + generador combinatorio), procesos minúsculos incesantes, grid
vasto, estudio claro neumórfico (no espacio oscuro), bucle perfecto, cámara
cinemática multi-beat, determinista frame-driven, composición Remotion GloboVivo.

## Propósito

Una escena **hero AAA** de ~30s: un **globo terráqueo fotorrealista** flota en un
**estudio claro neumórfico** (consistente con el kit, **no** espacio oscuro). Una
**textura de tejido vivo** —la misma gramática de micro-procesos de TejidoVivo—
nace en un **punto semilla** y **coloniza geodésicamente** la esfera, **reemplazando**
el mapa de la Tierra a medida que avanza, hasta dejar un **orbe-grid blanco
neumórfico vasto** con **incontables procesos minúsculos corriendo sin cesar** en
**bucle perfecto**. Metáfora: el sistema vivo de AiKit envolviendo el mundo.

Es a la vez una afirmación de marca y una composición Remotion determinista
(`GloboVivo`) que renderiza idéntica entre runs.

## Capacidades de usuario

- El espectador ve **tres actos** encadenados por una **cámara cinemática
  multi-beat**:
  1. **Tierra** — plano amplio del globo fotorrealista girando despacio (océanos
     especulares, capa de nubes, halo fresnel suave) sobre el estudio claro.
  2. **Colonización** — push-in mientras el tejido brota del **punto semilla** y
     se expande geodésicamente; donde el grid toma la superficie, la Tierra
     **se dessatura / drena** y las nubes **se disuelven**.
  3. **Orbe vivo** — pull-back al **grid-esfera** completo: vasto, blanco
     neumórfico, con micro-flows minúsculos que emergen, corren y se disipan
     **incesantemente**; cierra en **loop sin costura**.
- Sobre la superficie corren **muchísimos procesos** —muchos más que TejidoVivo—:
  un puñado de procesos **"hero" legibles y reconocibles** (flujos de negocio
  AiKit) mezclados con **cientos** generados por combinatoria sembrada (módulos ×
  verbos × dominios) para dar **densidad infinita**.
- Cada micro-flow conserva la identidad **FlowPlate neumórfica** (placa redondeada,
  doble sombra suave, pulso `KIT_BLUE` viajero, pip de "done").
- La escena se proyecta/renderiza desde Remotion Studio como las demás piezas del
  evento.

## Restricciones

- **Determinismo total**: toda la animación es función pura de `useCurrentFrame()`
  —cámara, máscara de crecimiento, schedule de flows y atlas de tejido—. **Nunca**
  `Date.now()` / `Math.random()` / reloj `useFrame` en la ruta de render; PRNG
  sembrado (estilo `mulberry32`). El mismo frame renderiza pixel-idéntico.
- **Esfera 3D real**: three.js (0.171) + r3f (8.18) + drei (9.122) bajo
  **@remotion/three** (4.0.469, ya en deps pero hasta ahora sin usar). La
  alternativa CSS-3D / falsa esfera queda **descartada** (no hay envoltura real).
- **El tejido se mapea como textura**, no como DOM: se pinta un **atlas
  equirectangular en Canvas2D** (p.ej. 4096×2048) y se aplica como `.map` del
  material de la esfera, **mezclado sobre el mapa de la Tierra** por una **máscara
  de crecimiento geodésico** sembrada en un punto focal. DOM→textura (drei `Html`)
  **no es viable** en el render headless de Remotion → rechazado.
- **Rendimiento**: el look neumórfico (cuyo `shadowBlur` es lo caro) se
  **pre-rasteriza una vez** a sprites offscreen de placa/paso; por frame solo se
  **estampan** (`drawImage`) y se animan reveal / decay / opacidad / pulso. El
  atlas debe sostener cientos de flows minúsculos sin colapsar 900 frames.
- **Tierra fotorrealista**: mapas **equirectangulares NASA Blue Marble** (color +
  nubes + luces nocturnas + specular de océanos), **dominio público**, vendorizados
  en `public/globoVivo/` y cargados con `staticFile`.
- **Paleta / fondo**: **estudio claro neumórfico** todo el tiempo (familia
  `#ffffff`); el color de la Tierra se **drena** hacia el grid blanco. **Sin
  starfield** (no pega en fondo claro). Único acento de color: `KIT_BLUE`
  (`#0070f9`) en los pulsos.
- **Excepción de marca consciente**: por ser hero 3D, la escena **se aparta** de la
  regla plana "sin glows" de `motion-language.md` para lograr AAA (HDRI/estudio,
  **fresnel rim**, **bloom** suave en pulsos, **profundidad de campo**, nubes que
  se disuelven, océanos especulares) — pero la **textura del grid conserva** la
  identidad neumórfica `FlowPlate`. El relieve del orbe y del suelo usa
  `elevation()`, no sombras a mano.
- Composición **1920×1080 @ 30fps**, ~**900 frames** (~30s), con `durationInFrames`
  cuadrado a la duración del schedule (sin overflow en el editor).

## Estructura

- `globoVivoScript.ts` — **coreografía pura** (sin React/three): beats de cámara
  orbital (waypoints adaptados de `cameraScript.ts` a coords orbitales), **timeline
  de la máscara de crecimiento geodésico** (semilla → cobertura total), y el
  **schedule de flows** sobre la superficie equirectangular (placement + reveal /
  decay reutilizando los conceptos de `tejidoVivoScript.ts`). Unit-testeado.
- `processLibrary.ts` — biblioteca de procesos **híbrida**: set curado "hero" +
  **generador combinatorio sembrado** (módulos AiKit × verbos de acción × dominios)
  → cientos de flows únicos deterministas.
- atlas de tejido (módulo Canvas2D) — pinta el **equirectangular** del grid vivo
  por frame estampando sprites neumórficos pre-rasterizados; expone la máscara de
  blend Tierra↔grid.
- `GloboVivoVideo.tsx` — host **@remotion/three**: malla de esfera, material que
  **mezcla Tierra + atlas** vía máscara, iluminación HDRI/estudio + fresnel,
  post-FX (bloom/DoF), todo alimentado por `useCurrentFrame()`.
- `globoVivoScript.test.ts` — tests de integridad temporal (beats sin solapes,
  cobertura de la máscara monótona, duración round-trip, determinismo del PRNG).
- Registro de la composición **`GloboVivo`** en `src/remotion/Root.tsx`.

## Relacionadas

- [AiKit Live Animations](./aikit-live-animations.md) — TejidoVivo y el kit de escenas del evento
- [3D Stacked-Process Generator](./grid-3d-stack.md) — `ProcessGrid` / emergencia StoreFlow generalizada
- [Device Mockups (3D)](./device-mockups.md) — patrón three.js / r3f / drei ya en el repo
- [Neumorphism Engine](./neumorphism-engine.md) — `elevation()` para suelo y relieve del orbe
- [Motion Language](./motion-language.md) — curvas/beats (y la regla de la que esta escena se aparta a propósito)
- [Generated Assets (image-gen)](./generated-assets.md) — convención de assets bajo `public/<scene>/`
- [Product Video (Remotion)](./product-video.md) — arquitectura base de composiciones

## Source

- [src/remotion/globoVivoScript.ts](../src/remotion/globoVivoScript.ts) — coreografía pura (cámara, máscara, schedule)
- [src/remotion/processLibrary.ts](../src/remotion/processLibrary.ts) — procesos híbridos (curado + combinatorio)
- [src/remotion/GloboVivoVideo.tsx](../src/remotion/GloboVivoVideo.tsx) — host @remotion/three (esfera + blend + FX)
- [src/remotion/globoVivoScript.test.ts](../src/remotion/globoVivoScript.test.ts) — tests de timing/determinismo
- [src/remotion/storeFlowScene.tsx](../src/remotion/storeFlowScene.tsx) — `FlowPlate` reusado como base del sprite neumórfico
- [src/remotion/tejidoVivoScript.ts](../src/remotion/tejidoVivoScript.ts) — scheduler de micro-flows reutilizado
- [src/remotion/aikit/cameraScript.ts](../src/remotion/aikit/cameraScript.ts) — rig de cámara adaptado a órbita
- [src/remotion/Root.tsx](../src/remotion/Root.tsx) — registro de la composición `GloboVivo`
- `public/globoVivo/` — mapas NASA Blue Marble (color/nubes/noche/specular)
