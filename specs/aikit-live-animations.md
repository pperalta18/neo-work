# AiKit Live — Animaciones Remotion (Producto + Charla Yusta)

**Keywords**: presentación producto, charla Yusta, proyección en vivo, Remotion Studio,
actos, programa de 50 pasos, robot de carne blanda, delegación, chat AiKit, tasklist,
proactividad, recurrencia, /ba/, grafo de conocimiento, colmena, reproducción,
workspaces, organismo, chispitas, sparkles, entorno operativo, economics, la curva,
oficina cenital, flujos origen→salida.

## Propósito

Piezas animadas para el evento **AiKit Live (2026-06-17)** que apoyan la
**presentación de Producto** (actos 1–4 + cierre) y la **charla de Yusta**.
Se proyectan **en vivo desde Remotion Studio** (no MP4): cada pieza es una
`<Composition>` registrada en `Root.tsx`, 1920×1080 @30fps, reproducible de
principio a fin sin interacción. La charla de Miguel queda fuera.

**Fuente canónica del guión**: `~/Downloads/message (5).txt` (importado
2026-06-13) — secciones `presentacion Producto` y `charla Yusta`. Los beats
están resumidos en el inventario; ante duda de intención, manda el guión.

## Reglas de la casa

- Estilo 100% producto: `elevation()`/temas de `src/lib/neumorphism.ts`,
  curvas/duraciones de `src/remotion/motion.ts` (ease-out, sin rebote),
  Universal Sans vía `<Fonts/>`. **Sin Tailwind** en `src/remotion/` —
  widgets de Storybook se absorben porteando a estilos inline si hace falta.
- Determinismo: todo función pura de `useCurrentFrame()`; PRNG sembrado
  (`mulberry32`/`seeded`) para campos generativos; sin CSS animations,
  `Math.random()` ni Rive runtime-driven.
- Escenas **nuevas**: no se reusan composiciones enteras; se absorben motores,
  widgets y patrones existentes cuando su calidad lo merece (columna *Absorbe*).
- Copy: español pulido para pantalla (redacción refinada del guión, tono calmado
  premium, nunca shouty). Nombres de personas/empresas son **placeholder**
  (Manolo Barroso, Laura, "Talleres Riera S.L."…), fáciles de sustituir en un
  solo sitio por pieza (constante `CAST`/`COPY` en cabecera del fichero).
- Cámara cinematográfica: movimientos multi-paso que siguen la acción
  (rig de `ObjectiveVideo`), nunca plano estático salvo loops de apoyo.
- Cada pieza funciona como apoyo de un orador: legible sin audio, sin
  depender de voz en off para entenderse, y con un beat final estable
  (último frame sostenible como still).

## Inventario de piezas (composiciones)

Pista Producto — la historia central, en orden de proyección:

| ID | Beat del guión | ~Dur | Qué ve el espectador | Absorbe |
|---|---|---|---|---|
| `Prod01Programa` | Acto 1 — el robot de carne blanda | 60s | Llega un email ("¿me pasáis presupuesto…?") a una bandeja; el empresario lo traduce en un programa de ~50 pasos (stepper vertical); lo ejecuta click a click entre ventanas (hoja de cálculo, CRM, plantilla): cursor lento, copia/pega, un micro-error con undo, cronómetro que se arrastra, contador "paso 7/50" | InboxWidget (copy ya alineado), SpreadsheetWidget (`selected` celda a celda), chrome tabla CRM de ClientTableVideo, TimelineWidget (50 pasos), cursor guionizado (PointerCursor de StorePitchVideo / glifos de Cursor.tsx), GridDrawIn hairline como entrada de cada app, InvoiceWidget como doc final, StopwatchWidget |
| `Prod02Delegacion` | Acto 2 — AiKit ejecuta el mismo programa | 45s | El mismo email; esta vez el humano teclea UNA frase en el chat AiKit; la IA despliega el mismo programa como tasklist y lo ejecuta en cascada veloz y sin fallos: tabla CRM autorrellenándose (wavefront), documento escribiéndose solo, presupuesto materializándose; cronómetro 23 min → 40 s (StatWidget antes/después) | mecánica chat de ConversationVideo (typing + teclear letra a letra), gesto write-in→ignite de ObjectiveVideo, TaskCardVideo (tasklist autocompletándose), motor wavefront de ClientTable/InventoryTable, charsAt de DocumentVideo, skeleton→denoise→typed de StoreBuildVideo, ToastWidget éxito, AikitModule (módulos que se activan) |
| `Prod03Costumbre` | Acto 3 — recurrencia + proactividad + /ba/ | 40s | "Hazlo todos los lunes a las 8" → el evento azul se repite por el mes (CalendarWidget vista mes); la IA pregunta "¿Cómo llamamos a este procedimiento? ¿'Chequeo de inventario'?" (chat); al confirmar, la pantalla del proceso colapsa en un nodo que aterriza en el grafo /ba/ y se conecta (aristas comet) a BBDD inventario y TPV | morph card→tile de InventoryTableVideo (el gesto clave), ignite de ObjectiveVideo, patrón Stroke/comet de GridDrawIn para aristas, AikitModule + modules.ts como nodos tipados, ConversationVideo (pregunta proactiva), CalendarWidget, typewriter de textAnimations |
| `Prod04Colmena` | Acto 4 — se reproduce | 90s | Fases del guión: notificación "Manolo ha adaptado tu proceso" → pantalla de Manolo (añade caducidades, comparte: 3 tiles de workspace se encienden) → pantalla de Laura (nace app de predicción que bebe de procesos ajenos + TPV; distribuye: 8 tiles) → montaje acelerado (Pedro autocompra, Ana negociación, Carlos filtro; la IA conecta dos ramas proactivamente) → pull-back final: organismo de 40+ nodos respirando, contadores 7 apps · 12 procesos · 3 BBDD · 24 personas, y una última notificación: el sistema propone un proceso nuevo | ignite por-tile + WIDE_CAM pull-back de ObjectiveVideo, buildField/mulberry32 + Plate de SourcesActionsVideo (organismo), comet de GridDrawIn (conexiones naciendo), ToastWidget en cascada, CounterStat de textAnimations, avatar-stack de KanbanWidget, miniaturas con frameOverride de StoreBuildVideo, apps de la galería (Dashboard/POS/Storefront) como pantallas que nacen, morph de InventoryTable a escala |
| `Prod05CierreFlujos` | Cierre — la empresa cambia de plano | 35s | Diagrama vivo: hilos de información entran a un plano humano (origen→humano→salida); progresivamente los hilos se re-enrutan por el plano artificial que crece (origen→artificial→salida); el cursor humano se desvanece mientras la UI sigue operándose sola; remate en lockup AiKit Live | TwoGridScene/OceanPill de SourcesActionsVideo, comet sobre paths curvos (GridDrawIn), patrón recede de StorePitchVideo, FlowNode start/goal de StoreFlowVideo, fade de cursor (Cursor.tsx), LightSweep/ScalePunch de textAnimations |

Pista Yusta — apoyos de charla, proyectables sueltos:

| ID | Beat | ~Dur | Qué ve el espectador | Absorbe |
|---|---|---|---|---|
| `Yusta01Procesador` | la empresa procesa información | 25s | Océano de pastillas de conocimiento (emails, facturas, reuniones…) que fluye hacia un núcleo y sale como rejilla de acciones (enviar, facturar, reponer) — entrada→procesador→salida con rotulación | SourcesActionsVideo casi entero (Plate, OceanPill, TwoGridScene) + rotulación nueva |
| `Yusta02ProgramarHumanos` | programar humanos: barato programar, caro ejecutar | 25s | El jefe dicta una frase; la frase se compila en un programa de pasos que se desliza a la cabeza de Manolete (silueta); etiquetas "programar: barato · ejecutar: lento y caro"; Manolete ejecuta a ritmo de stepper lento | TimelineWidget, typewriter, patrón frase-con-entidades de ScheduleWidget, StatWidget |
| `Yusta03Economics` | economics humano vs software invertidos | 25s | Dos columnas antes/después (humano: programar barato/ejecutar caro · software: lo inverso); contador de amortización corriendo hasta el presupuesto 9.999; el punto de cruce | StatWidget modo comparación (hecho para esto), CounterStat, ChartWidget |
| `Yusta04EntornoHumano` | limitación humana → herramienta | 25s | Parejas que aterrizan en secuencia: sin telepatía→Slack · memoria frágil→Notion · sin transferir ficheros→PPT · mal cálculo→Excel; cierran en una constelación alrededor de una silueta humana | BrowserWidget como chrome de cada herramienta, iconografía document-xlx (molde de badges), Plate de SourcesActions |
| `Yusta05Chispitas` | chispitas inundando el software | 30s | Las mismas herramientas reciben el botón ✨; enjambre de sparkles cayendo sobre todos los mockups; barrido de varita que las "toca"; congelado: en el centro, el cerebro humano sigue siendo el cuello de botella | icono `sparkles` en enjambre sembrado, Wand+AiBadge de ScheduleFillVideo, ScanLine/denoise de StoreBuildVideo, mockups de Yusta04 |
| `Yusta06EntornoIA` | un entorno operativo para IAs | 30s | Núcleo IA con tres familias de herramientas orbitando (consultar · manipular · aprender); las herramientas humanas se acercan y se descartan con su porqué (Notion→txt plano, Zapier→código, Excel→cálculo directo, Teams→clones); las nativas se acoplan | AikitModule/modules.ts (taxonomía data/action/orchestration), ignite de ObjectiveVideo, Plate, comet |
| `Yusta07Curva` | la curva de 10 años | 20s | Una sola curva implacable dibujándose por años, cruzando umbrales etiquetados ("tu umbral, esté donde esté"); pull-back que la deja entrar en el futuro | ChartWidget (Catmull-Rom + pico tooltip) con revelado progresivo, CameraPan de textAnimations |
| `Yusta08OficinaViva` | la oficina cenital, "plano vivo" | 30s loop | Plano cenital estilizado de la oficina (el plano se traza solo); personas-punto que van de mesa a reunión a café, pantallas parpadeando — el telón de fondo de los actos 2–4 de la charla | GridDrawIn (plano arquitectónico autodibujado), rig de cámara de ObjectiveVideo, mulberry32 para trayectos deterministas |

Piezas de apoyo (standalone) — autocontenidas, proyectables sueltas como ilustración de un beat:

| ID | Idea | Qué ve el espectador | Notas |
|---|---|---|---|
| `PresupuestoManual` | el Vía Crucis del presupuesto (antes de la IA) | El proceso manual de armar un presupuesto, paso tedioso a paso | **Deliberadamente plano y sin texto** (sin neumorfismo/elevaciones); NO armonizar con el deck; la longitud transmite el tedio |
| `FlowBuilder` | "el flujo, a mano" — Zapier a mano | Un flow real estilo Zapier se autoensambla bloque a bloque (disparador Gmail → 2 Filtros + Rutas con bifurcación, ~11 bloques reales por rama) | **Sin cursor ni rótulos**; la longitud lenta y sin sentido ES el mensaje; cámara cinematográfica bloque a bloque + pull-back |
| `PresupuestoChat` | el presupuesto, con IA (el reverso de `PresupuestoManual`) | Una instrucción en el chat → la IA hace un tool-call que declara los pasos, los completa uno a uno y adjunta el PDF (~17 s) | Limpio y plano (sin panel ni relieve); coreografía en `presupuestoChatScript.ts` |
| `TejidoVivo` | tejido vivo — organismo de micro-procesos | Campo enorme neumórfico (superficie de StoreFlow) lleno de muchos flows simultáneos: unos emergen, otros se disipan, unos pocos "quedan" | build-and-settle; reusa `FlowPlate` de `storeFlowScene`; pulsos azules + pips "done"; tuning en `tejidoVivoScript.ts` |

## Estado de producción

Lo construido se registra como `<Composition>` en `Root.tsx`. **Registradas hoy**:
`Prod01Programa`, `Prod02Delegacion`, `Prod04Colmena`, `PresupuestoChat`,
`PresupuestoManual`, `FlowBuilder`, `TejidoVivo` (+ `KitGallery`, galería-smoke
temporal). **Aún planificadas** (en el inventario pero sin composición):
`Prod03Costumbre`, `Prod05CierreFlujos` y toda la pista Yusta. El stack 3D de
procesos (`GridStack3D`) vive aparte → [3D Stacked-Process Generator](./grid-3d-stack.md).

## Kit compartido (`src/remotion/aikit/`)

Componentes nuevos que las piezas comparten; nacen porteando lo absorbido.
**Arquitectura "script + componente"**: cada widget separa su coreografía (un
módulo puro `*Script.ts`, función del frame, unit-testeado en el proyecto `node`)
del render React (`*.tsx`), y muchos llevan un `*Demo.tsx` aislado. Todo se
re-exporta desde `src/remotion/aikit/index.ts`.

- **ChatPanel** (`chatScript`) — chat AiKit guionizado por `{from, text, typeStart,
  showAt}` (mecánica de ConversationVideo, chrome de app con cabecera).
- **AppWindow** (`windowScript`) — ventana de app neumórfica (NeoCard + chrome de
  BrowserWidget porteado), con título/icono y viewport; entrada vía GridDrawIn opcional.
- **ScriptedCursor** (`cursorScript`) — cursor frame-driven (glifos/hotspots de
  Cursor.tsx + press de StorePitchVideo), timeline de waypoints `frame→{x,y,state,click}`.
- **ProgramRunner** (`programScript`) — la tasklist/stepper del "programa" con
  estados pendiente/activo/hecho (TaskCardVideo + TimelineWidget), a cualquier tempo.
- **BaGraph** (`graphScript`) — grafo orgánico de nodos tipados (AikitModule + Plate)
  con aristas comet, ignite por nodo y layout sembrado; escala de 3 a 40+ nodos.
- **NotificationToast** (`toastScript`) — ToastWidget porteado a frames, apilable en cascada.
- **WorkspaceTile** (`tileScript`) — tile 128px de workspace/proceso con ignite y
  avatar-stack; destino del morph pantalla→nodo (InventoryTableVideo).
- **Widgets de contenido** (`widgetScript`) — pantallas que las apps muestran:
  **Spreadsheet** (selección celda a celda), **Inbox**, **CalendarMonth** (vista mes,
  evento que se repite), **LineChart**, **StatTile** (modo comparación antes/después),
  **Invoice**/presupuesto como documento final.
- **cameraScript** — el rig de cámara cinematográfica (pose + drift) compartido por
  las piezas; `trace` — utilidades de path/medición; `rand` — PRNG sembrado.
- **KitGallery** (`galleryScript`) — galería-smoke que encadena los demos del kit
  (temporal, para revisar el kit; se retira al cerrar producción).

## Fuera de alcance

Charla de Miguel; metraje real (cacofonía de jefes, manager); tótems/pantallas
interactivas de la expo; render MP4 (existe `npm run render:*` si hiciera falta,
pero la entrega es Studio); audio/música (las piezas no dependen de un track).

> Nota: `SourcesActionsVideo` (citado en varias columnas *Absorbe*) se refactorizó
> en `src/remotion/storeFlowScene.tsx` (el `FlowPlate` reutilizable que usan
> `TejidoVivo` y compañía); el fichero original ya no existe.

## Relacionadas

- [Product Video (Remotion)](./product-video.md) — arquitectura base de composiciones
- [Motion Language](./motion-language.md) — curvas, beats, reglas de movimiento
- [3D Stacked-Process Generator](./grid-3d-stack.md) — el stack 3D de procesos (GridStack3D), pieza aparte
- [Generated Assets](./generated-assets.md) — imágenes que falten (image-gen)
- [Expo Guión](./expo-guion.md) — brief creativo de la expo (contexto del evento)

## Source

- [src/remotion/](../src/remotion/) — composiciones `Prod*`/`Yusta*`/standalone + kit `aikit/`
- [src/remotion/Root.tsx](../src/remotion/Root.tsx) — registro ordenado de las piezas
- [src/remotion/aikit/index.ts](../src/remotion/aikit/index.ts) — barrel del kit (scripts + componentes)
- [src/remotion/storeFlowScene.tsx](../src/remotion/storeFlowScene.tsx) — `FlowPlate` reutilizable (ex-SourcesActionsVideo)
- [src/stories/neo/widgets/](../src/stories/neo/widgets/) — widgets absorbidos (port inline)
- [src/stories/neo/modules/](../src/stories/neo/modules/) — los 16 módulos AiKit (iconos/taxonomía)
