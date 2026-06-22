# AiKit Live Animations Implementation Plan

## Summary

Producir las 13 composiciones Remotion de
([spec: Inventario de piezas](../specs/aikit-live-animations.md#inventario-de-piezas-composiciones))
para proyección en vivo desde Remotion Studio (1920×1080 @30fps): pista Producto
`Prod01`–`Prod05` (la historia hero) y pista Yusta `Yusta01`–`Yusta08` (apoyos de
charla). Decisiones clave: escenas nuevas que **absorben** motores/widgets de la
librería existente según el mapa de la spec (nada de Tailwind en `src/remotion/`,
todo determinista por frame); primero el kit compartido `src/remotion/aikit/`,
porque las 13 piezas componen sobre él; producción multi-agente por tandas con
verificación visual por stills en cada pieza. Copy refinado es-ES con nombres
placeholder centralizados en una constante por pieza
([spec: Reglas de la casa](../specs/aikit-live-animations.md#reglas-de-la-casa)).

## Phase 1: Kit compartido (`src/remotion/aikit/`)

- [x] `ChatPanel` — chat AiKit guionizado `{from, text, typeStart, showAt}` con typing bubble y tecleo letra a letra (absorbe mecánica de `ConversationVideo`) ([spec: Kit compartido](../specs/aikit-live-animations.md#kit-compartido-srcremotionaikit))
- [x] `AppWindow` — ventana neumórfica con chrome (título/icono/url), viewport recessed y entrada opcional GridDrawIn (port inline de `BrowserWidget` + `NeoCard`)
- [x] `ScriptedCursor` — cursor frame-driven por waypoints `frame→{x,y,state,click}` con glifos/hotspots de `Cursor.tsx` y press/ripple por interpolate
- [x] `ProgramRunner` — tasklist/stepper del "programa" a tempo paramétrico, estados pendiente/activo/hecho (generaliza `TaskCardVideo` + `TimelineWidget`)
- [x] `BaGraph` — grafo orgánico de nodos tipados (AikitModule/Plate) con aristas comet, ignite por nodo, layout sembrado mulberry32, 3→40+ nodos
- [x] `NotificationToast` — port a frames de `ToastWidget`, apilable en cascada con stagger
- [x] `WorkspaceTile` — tile 128px con ignite + avatar-stack; destino del morph pantalla→nodo de `InventoryTableVideo`
- [x] Ports inline de widgets que las piezas usan dentro de ventanas: `SpreadsheetWidget`, `InboxWidget`, `CalendarWidget`, `ChartWidget`, `StatWidget`, `InvoiceWidget` (solo los modos que se usan)
- [x] Story de humo: composición `KitGallery` temporal (no registrada al final) para validar el kit visualmente con stills

## Phase 2: Pista Producto (hero, en orden narrativo)

- [x] `Prod01Programa` (60s) — email→programa de 50 pasos→ejecución click a click con micro-error y cronómetro ([spec: inventario Prod01](../specs/aikit-live-animations.md#inventario-de-piezas-composiciones))
- [x] `Prod02Delegacion` (45s) — misma tarea por chat; tasklist + wavefront CRM + doc escribiéndose; contraste 23 min → 40 s
- [x] `Prod03Costumbre` (40s) — recurrencia en calendario; pregunta proactiva del nombre; morph proceso→nodo aterrizando en el /ba/
- [x] `Prod04Colmena` (90s) — setup notificación → Manolo (3 tiles) → Laura (8 tiles) → montaje acelerado → pull-back al organismo 40+ nodos con contadores y notificación final
- [x] `Prod05CierreFlujos` (35s) — flujos origen→humano→salida mutando a origen→artificial→salida; cursor que se desvanece; lockup AiKit Live
- [x] Registrar las 5 en `Root.tsx` en orden de proyección + scripts `render:prod*` de cortesía

## Phase 3: Pista Yusta (apoyos)

- [x] `Yusta01Procesador` (25s) — océano de conocimiento→núcleo→rejilla de acciones, con rotulación
- [x] `Yusta02ProgramarHumanos` (25s) — frase→programa→cabeza de Manolete; etiquetas barato/caro
- [ ] `Yusta03Economics` (25s) — comparación invertida + contador de amortización hasta el presupuesto 9.999
- [ ] `Yusta04EntornoHumano` (25s) — parejas limitación→herramienta cerrando en constelación
- [ ] `Yusta05Chispitas` (30s) — botones ✨, enjambre de sparkles, congelado del cuello de botella humano
- [ ] `Yusta06EntornoIA` (30s) — núcleo IA, tres familias orbitando, descartes de herramientas humanas
- [ ] `Yusta07Curva` (20s) — la curva implacable cruzando umbrales
- [ ] `Yusta08OficinaViva` (30s loop) — plano cenital autodibujado con personas-punto deterministas
- [ ] Registrar las 8 en `Root.tsx` + scripts de render de cortesía

## Phase 4: Pase de calidad y entrega

- [ ] Revisión adversarial visual por pieza (stills en beats clave: entrada, mitad, final) contra la spec y el guión; iterar las que no den el nivel
- [ ] Pase de consistencia transversal: misma luz (tl), mismos tempos (motion.ts), cast placeholder coherente entre piezas, contadores/datos consistentes (Prod04 ↔ guión: 7 apps · 12 procesos · 3 BBDD · 24 personas)
- [ ] Limpieza: retirar `KitGallery`, `npx tsc -b` limpio (salvo error preexistente de MotionShowcase), lanzar Studio y confirmar las 13 en la barra lateral

## Verification

- [ ] `npx tsc -b` sin errores nuevos
- [ ] Stills de cada composición (inicio/medio/fin) revisados visualmente contra su fila del inventario de la spec
- [ ] Las 13 composiciones aparecen y reproducen en Remotion Studio (entrega = proyección en vivo)
- [ ] Determinismo: sin CSS animations / Math.random / Date.now en `src/remotion/` nuevo (grep)
- [ ] Sin imports de Tailwind/clases en `src/remotion/` nuevo (grep `className`)
- [ ] Copy es-ES pulido, nombres placeholder centralizados en `CAST`/`COPY` por pieza
