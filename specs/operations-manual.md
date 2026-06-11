# Manual de operaciones — Animaciones AiKit

> **Documento de estado compartido.** Cárgalo al **inicio de cada tarea** de
> animaciones/módulos (junto a [`flow-blueprints.md`](./flow-blueprints.md)). Es
> la "fuente de verdad" del trabajo en común: qué módulos existen, qué assets
> tiene cada uno (icono SVG + animación Rive), cómo se cablean y cómo se añade uno
> nuevo. **Mantenlo vivo**: cada vez que añadas un módulo, un icono o un flujo,
> actualiza la tabla correspondiente aquí mismo.

Responsable de maquetación/frontend: **Iván**. Si tocamos algo de maquetación,
valora si hay que actualizar este manual o las specs (`specs/index.md`).

---

## 0. El producto en una frase (del pitch)

> **La IA es el combustible. AiKit es el tractor.** AiKit no vende IA; vende la
> maquinaria que la convierte en trabajo útil. Es *software que le compras a tu
> IA, no a tus trabajadores* — sin interfaz, sin botones.

Tres categorías (→ se mapean al campo `group` de `MODULES`):

| Categoría (pitch) | `group` | Objetivo | Idea |
|---|---|---|---|
| **Controla** | `data` | Hacer visible lo oculto | le da **ojos** |
| **Delega** | `action` | Convertir intención en resultado | le da **manos** |
| **Construye** | `orchestration` | Cristalizar y automatizar | lo vuelve **repetible** |

El **Flywheel**: Controla → Delega → Construye, una y otra vez; cada vuelta deja
más datos y más superficies de control. El único módulo pensado para humanos es
**AiKit Gestalt** ("hablar con tu empresa") — ver §6 (pendiente, sin asset aún).

Fuente del guion: `~/Downloads/pitch_aikit.pdf` (extraído en este repo como base
del storytelling; no commiteado).

---

## 1. Registro de módulos (16) — la fuente de verdad

Cada módulo del pitch = una entrada en
[`src/stories/neo/modules/modules.ts`](../src/stories/neo/modules/modules.ts)
(`MODULES`). Cada uno tiene **dos assets de marca**: un **icono SVG** (estático)
y una **animación Rive individual** (`.riv`, la entregada por diseño). El campo
`instance` referencia el `.riv` **combinado** de respaldo (`aikit-modules.riv`).

La columna **Qué hace** resume qué resuelve cada módulo (fuente:
`~/Documents/AiKit/AiKit — Categorías y Módulos.canvas`), para tenerlo presente al
elegir qué módulo protagoniza cada paso de un flujo.

> Convención de nombres: la **clave** de `MODULES` es camelCase
> (`actionRunner`); los **ficheros** (svg y riv) son kebab-case
> (`action-runner.svg` / `action-runner.riv`); `instance` es el nombre **verbatim**
> dentro del `.riv` combinado, con sus rarezas (`Juction`, `SQL Sense`).

### Controla · `group: data`

> *Hacer visible lo oculto — le da **ojos** a la IA.*

| Módulo | Qué hace | Clave `MODULES` | SVG `icons/` | Rive `rive/` | `instance` (combinado) | Estado |
|---|---|---|---|---|---|---|
| Hotpot | Conecta la IA con APIs externas de internet (Airbnb, Calendly… cualquier software con API). | `hotpot` | `hotpot.svg` | `hotpot.riv` | `Hotpot` | ✅ |
| SQLSense | La IA habla SQL: lanza queries e interpreta resultados sobre bases de datos empresariales. | `sqlsense` | `sqlsense.svg` | `sqlsense.riv` | `SQL Sense` | ✅ |
| Udon | Conector con Odoo y sus módulos: facturación, inventario, CRM, ventas… | `udon` | `udon.svg` | `udon.riv` | `Udon` | ✅ |
| Sushimi | Acceso a servidores, hosting e infraestructura técnica vía SSH cifrado. | `sushimi` | `sushimi.svg` | `sushimi.riv` | `Sushimi` | ✅ |
| DocuSense | Lee y extrae información de documentos desestructurados: Excel, PDF, Word… | `docusense` | `docusense.svg` | `docusense.riv` | `Docusense` | ✅ |
| Junction | Une y relaciona datos de distintas fuentes para darle a la IA una visión integrada. | `junction` | `junction.svg` | `junction.riv` | `Juction` | ✅ |
| Glimpse | Presenta la información de forma visual, sin montar dashboards a mano (Power BI/Miro). | `glimpse` | `glimpse.svg` | `glimpse.riv` | `Glimpse` | ✅ |
| Foresight | Modelos predictivos: detecta patrones, correlaciones, tendencias y anomalías. | `foresight` | `foresight.svg` | `foresight.riv` | `Foresight` | ✅ *(rotate −90°)* |

### Delega · `group: action`

> *Convertir intención en resultado — le da **manos** a la IA.*

| Módulo | Qué hace | Clave `MODULES` | SVG `icons/` | Rive `rive/` | `instance` (combinado) | Estado |
|---|---|---|---|---|---|---|
| Action Runner | Le da "manos" a la IA: ejecuta acciones con efecto en el mundo real (combina con Udon/Hotpot/SQLSense). | `actionRunner` | `action-runner.svg` | `action-runner.riv` | `Action Runner` | ✅ |
| Action Script | Encadena secuencias de acciones donde cada paso puede depender del anterior. | `actionScript` | `action-script.svg` | `action-script.riv` | `ActionScript` | ✅ |
| Teamwork | Ejecuta muchas tareas en paralelo lanzando varios agentes simultáneos. Ideal para volumen. | `teamwork` | `teamwork.svg` | `teamwork.riv` | `TeamWork` | ✅ |
| Feedback Loop | Memoria operativa: guarda lo aprendido para no repetir las instrucciones cada vez. | `feedbackLoop` | `feedback-loop.svg` | `feedback-loop.riv` | `FeedbackLoop` | ✅ |
| Heartbeat | Despierta a la IA de forma autónoma (evento, calendario, webhook, periódico). Vigila y opera en continuo. | `heartbeat` | `heartbeat.svg` | `heartbeat.riv` | `Heartbeat` | ✅ |

### Construye · `group: orchestration`

> *Cristalizar y automatizar lo que se repite — lo vuelve **repetible**.*

| Módulo | Qué hace | Clave `MODULES` | SVG `icons/` | Rive `rive/` | `instance` (combinado) | Estado |
|---|---|---|---|---|---|---|
| Smart Process | Define procesos complejos con pasos, condiciones y triggers que viven en segundo plano y se repiten. | `smartProcess` | `smart-process.svg` | `smart-process.riv` | `SmartProcess` | ✅ |
| Forge | Crea software para humanos: apps a medida, paneles operativos e interfaces de bajo coste cognitivo. | `forge` | `forge.svg` | `forge.riv` | `Forge` | ✅ |
| Skill Hub | Crea software para IAs: procesos deterministas y herramientas que la propia IA crea, mantiene y consume. | `skillHub` | `skill-hub.svg` | `skill-hub.riv` | `SkillHub` | ✅ |

> **Naming entregado vs repo**: el compañero pasó `juction.riv` y `sqlSense.riv`;
> al importarlos se renombraron a `junction.riv` / `sqlsense.riv` para casar con la
> convención kebab-case de `icons/`. El `instance` del combinado mantiene `Juction`
> y `SQL Sense` porque así están **dentro** del `.riv` y no se pueden cambiar desde
> código.

---

## 2. Arquitectura de assets (cómo está cableado)

```
src/stories/neo/modules/
├── modules.ts            ← MODULES (fuente de verdad: name, icon, rive, instance, group, rotate)
├── icons/<modulo>.svg    ← icono de marca estático (16)
├── rive/<modulo>.riv     ← animación Rive individual (16)  ← NUEVO (entregado por diseño)
├── aikit-modules.riv     ← combinado de respaldo (SlotVM, 16 instances)
├── RiveModuleIcon.tsx    ← reproduce la animación (individual → fallback combinado)
└── AikitModule.tsx       ← badge de marca (icono + wordmark); `animated` usa Rive
```

- **Variante estática**: `MODULES[m].icon` (SVG). La usan p. ej. las pastillas de
  los flujos en
  [`ConceptFlowVideo.tsx`](../src/remotion/ConceptFlowVideo.tsx) (`<img src={spec.icon} …>`).
- **Variante animada**: `MODULES[m].rive` (`.riv?url`) vía
  [`RiveModuleIcon`](../src/stories/neo/modules/RiveModuleIcon.tsx):
  - **Primaria** (`RiveIndividualIcon`): carga el `.riv` individual del módulo.
    Cada fichero trae su propio artboard (Rive elige el default) + `State Machine
    1` (`RIVE_MODULE_STATE_MACHINE`), con `autoBind` para su view model propio.
    El SM reproduce un **reveal de entrada de una sola pasada** al montar y luego
    se **congela** (estados `Start` → `React`). Para que el icono "reviva" se
    **re-dispara** su trigger de view-model (`click`, o `click2` en SQLSense)
    sobre la instancia auto-bound (`rive.viewModelInstance.trigger(name).trigger()`):
    - `playOnHover` (default **true**): re-dispara al pasar el ratón / click.
    - `loop` (default false): re-dispara cada ~2.6 s → "vivo" en bucle (galerías).
      Las stories `Animated*` lo activan. Propagado por `AikitModule loop`.
  - **Fallback** (`RiveCombinedIcon`): si un módulo no tuviera `rive`, carga
    `aikit-modules.riv` (artboard `FeedbackLoop 2`) y enlaza su `instance` del
    `SlotVM`, re-tinta `colorBackground` al tema y dispara `click` al tocar.
  - El branch es **a nivel de componente** (el wrapper `RiveModuleIcon` elige uno
    u otro): cada variante mantiene su propio orden de hooks estable, así el path
    individual **no** llama a los hooks del `SlotVM` → consola sin ruido (cero
    errores "Could not find View Model named SlotVM"). Verificado en Storybook.
- **Imports**: los `.riv` se importan con el sufijo `?url` de Vite
  (`import x from './rive/x.riv?url'`), igual que el combinado.

### Módulo "en funcionamiento" → pila cuadrada (`OperatingModuleTile`)

El lenguaje para mostrar **un módulo trabajando** dentro de un vídeo (p. ej.
DocuSense ingiriendo el inventario en E-Commerce) es
[`OperatingModuleTile`](../src/remotion/OperatingModuleTile.tsx): una **placa
cuadrada neumórfica unitaria** —misma familia que las pastillas del grid, pero con
**algo más de relieve/entidad** y **sin tinte azul**— con el icono de marca dentro
(algo más pequeño que el badge normal, ~0.46 del lado; placa compacta, **padding
igual por los 4 lados**). Al activarse (`expand` 0→1) **se abre hacia AMBOS lados**
—queda centrada donde está— revelando un estado (`status`, p. ej. "Procesando
documentos…") con un **shimmer sutil** por frame sobre el texto. Sustituye al
antiguo "núcleo" circular con glow.

> **Variante "dúo"** (prop opcional `secondary`): si un paso lo protagonizan **dos
> módulos en pareja** (p. ej. DocuSense + Junction en Scheduling), la placa muestra
> **ambos iconos** juntos (flex con `pairGap = iconSize·0.24`). En este caso la placa
> **deja de ser cuadrada en reposo** y se ensancha lo justo para acogerlos; al abrirse
> el `status` aparece igual a la derecha. Úsala sólo cuando los dos módulos trabajan
> realmente a la vez; si uno es claramente el protagonista, una placa de un solo icono.

- **El icono NO se anima**: la reacción tipo Rive (pulso/escala + destello azul) se
  **descartó**. No se puede replicar de forma determinista por frame sin
  reimplementar la animación entregada en `.riv`, y el `.riv` real reproduce en
  tiempo real (RAF) y **no se captura bien con `renderMedia`** (sale al primer
  frame / a tirones). Iván pidió: *o se replica la de Rive, o se deja sin
  animación* → el icono queda **estático y limpio**. Lo único que se mueve es la
  expansión de la placa y el shimmer del estado, ambos deterministas por frame
  (idéntico en preview y export). *(Si algún día se quiere el `.riv` real en el
  vídeo habría que avanzarlo manualmente desde `useCurrentFrame()`.)*
- **Sin azul**: se quitaron el halo radial azul y el destello `inset` `KIT_BLUE`
  del borde. La placa usa sólo `elevation` neumórfica (`distance 14`/`blur 32` →
  más entidad que una pastilla del grid). El único azul que queda es el del
  `shimmer` del texto de estado.
- **Geometría simétrica, ancho intrínseco** (cambio pedido por Iván): la placa es
  `inline-flex` cuyo ancho lo fija el contenido (icono + texto), con el **mismo
  padding a ambos lados** (`padX = (size − iconSize)/2`, el mismo aire que rodea al
  icono). En reposo (`expand=0`) el hueco del texto vale 0 → **cuadrada**; al
  abrirse el hueco crece (`maxWidth = e·TEXT_MAX`, recortado al ancho real del
  texto → padding derecho nunca sobra) y el icono se desliza a la izquierda del
  centro. Como el ancla `(x,y)` es el **centro de la placa**, crece hacia **ambos
  lados** (no hay que descentrarla). Antes crecía sólo a la derecha con ancho fijo
  `STATUS_W` → padding asimétrico (eliminado).
- **Contrato** (props): `x`/`y` **opcionales** = centro de la **placa**; si se dan,
  se ancla en absoluto y se centra (`translate(-50%,-50%)`); si se omiten, se
  renderiza **inline** para componerlo en un layout flex (lo centra el padre).
  Además `module`, `status`, `frame`, `expand` (0..1), `size`.
- **Consumidores** (9 escenas, mismo lenguaje de placa):
  - [`IntakeScene`](../src/remotion/IntakeScene.tsx) (mecánica de captura
    compartida, E-Commerce acto 2): una **pila de documentos** (`sheet` principal +
    `backSheets` asomando detrás, vía `DocStack`) **aparece, REPOSA un instante
    LEGIBLE** (`SHEET_HOLD ~1,2 s`; aparición ligera `SHEET_IN 9 f`) y luego vuela a la placa (anclada **centrada**,
    `coreX = W/2`) donde se absorbe; `expand` y `tileAppear` se calculan desde
    `SHEET_ABSORB_AT` (la placa solo aparece al final del reposo, para no
    transparentarse a través de las celdas del Excel); luego brotan fichas por el
    cuadrante **superior-izquierdo** para no pisar la placa. El beat estático se
    añadió porque "no se percibía que era un Excel" (Iván); `coreStatus` sustituye
    al antiguo `coreLabel`.
  - [`InvoiceIntakeScene`](../src/remotion/InvoiceIntakeScene.tsx) (Accounting acto
    1): un **chorro de 16 facturas** vuela desde un anillo y es **absorbido** por
    el icono de **Udon** (placa cuadrada centrada en reposo); al entrar la última,
    se abre simétrica con "Analizando facturas". Coreografía propia (no usa
    `IntakeScene`), misma placa.
  - [`AccountingLoopScene`](../src/remotion/AccountingLoopScene.tsx) (Accounting
    acto 3): la placa de **Foresight** ("Buscando patrones") como **sello**
    **debajo** del timeline `NeoReasoning` (layout en **columna**). Se renderiza
    **inline** (sin `x`/`y`) y la centra el flex; `expand` animado al entrar.
  - [`ChannelsConnectScene`](../src/remotion/ChannelsConnectScene.tsx) (Support
    acto 2): la placa de **Hotpot** ("Conectando canales") como **hub** al que se
    enchufan los 5 canales; sustituye al antiguo **núcleo circular con glow azul**
    (se eliminaron `CORE`, el halo radial y el label "Hotpot" suelto). Se envuelve
    en un div absoluto centrado en `(hubX, hubY)` que aporta la entrada
    (`opacity`/`scale` por `hubRise`); `expand` (`tileOpen`) abre la placa en
    cuanto el primer cable queda encendido. Los cables terminan en el centro →
    quedan ocultos tras la placa (parecen salir de su borde).
  - [`StaffImportScene`](../src/remotion/StaffImportScene.tsx) (Scheduling acto 2):
    **variante "dúo"** — la placa de **DocuSense + Junction** ("Unificando fuentes")
    como hub al que llegan las rutas de `empleados.xlsx` y el ERP/RRHH; sustituye al
    antiguo disco circular con glow + label "plantilla única". Mismo wrapper centrado
    en `(hubX, hubY)` con entrada por spring (`p`) y apertura del estado (`open`).
  - [`M1Stock`](../src/remotion/modules/M1Stock.tsx) (module-loop 1.3, **no es un
    flujo**): la placa de **Heartbeat** ("Reponiendo stock") es el **beat 2** del bucle
    de stock. Uno de los consumidores en los **module-loops** (con `M2LeadFunnel`),
    no en una mini-película: vive sobre `LoopStage` y su `expand` es **periódico en `DUR`**
    (abre al tocar fondo, cierra ya repuesto → decae a reposo antes del seam, regla §2.2 de
    `module-loops`). Sustituyó al antiguo chip-paquete «+200»; se quitó la placa de fondo.
  - [`M2MonthCloseRun`](../src/remotion/modules/M2MonthCloseRun.tsx) (**acto 2** de la
    mini-película «Cierre de mes», ver `M2MonthCloseVideo`): la placa de **Foresight**
    ("Cerrando junio") es el clip de ejecución del módulo — **SÓLO el cuadrado**, sin
    etiquetas (pedido de Iván). Los apuntes del mes vuelan desde fuera y son **ingeridos**
    por el icono; al entrar todos, la placa se abre (mismo patrón que `M1AbsencesProcess`).
    Lineal (`useCurrentFrame()`), no es un loop. MonthClose se partió en 3 clips el
    2026-06-11.
  - [`M2LeadFunnel`](../src/remotion/modules/M2LeadFunnel.tsx) (module-loop 2.5, **no es un
    flujo**): la placa de **Foresight** ("Reactivando leads") es el **beat 2** del Kanban de
    leads (misma UI que `M1Tickets`). Va **arriba-centro** (`x=CENTER`, `y=190`) con
    **presencia** (ausente en reposo → aparece + se abre → se cierra y desaparece) además del
    `expand`; ambos periódicos en `DUR` y a reposo antes del seam (§2.2). Acompaña un **barrido
    de escaneo** que reactiva los leads, y luego vuelan a sus columnas. Rediseño 2026-06-11
    (sustituye al hub-estrella; 2.ª iteración: UI portada de `M1Tickets` por petición de Iván).
  - [`M2Onboarding`](../src/remotion/modules/M2Onboarding.tsx) (module-loop 2.1, **no es un
    flujo NI un loop**, mini-película lineal): la placa de **Action Script**
    ("Dando de alta a María") es el **beat 2** de la narrativa de alta de empleado (FIRMA →
    **EJECUTA** → STEPS → CONFIRMA). A diferencia del resto, aquí la placa va sobre una
    `TransitionSeries.Sequence` lineal: `expand = smoother((frame−10)/22)` (abre y se queda
    abierta, no decae) — no necesita costura porque el clip no es un loop. Anclada centrada
    (`x=y=CENTER`). Añadido 2026-06-11 (Iván reconvirtió el anillo abstracto en narrativa).

### Detalles técnicos de los `.riv` individuales (verificado en binario)

- Todos exponen **`State Machine 1`** → por eso `RIVE_MODULE_STATE_MACHINE` es un
  default seguro.
- View model por fichero **inconsistente** (`ActionRunnerVM`, `DocusenseVM`,
  `Forge`, `Heartbeat`…), por eso usamos `autoBind` en vez de enlazar por nombre.
  El **trigger de replay** es del view-model (`click`, salvo SQLSense → `click2`);
  se dispara sobre `rive.viewModelInstance` auto-bound, no por `stateMachineInputs`.
- Slots de color variables: todos `colorMain`/`colorB`; solo
  **`action-runner`, `teamwork`, `sushimi`** exponen `colorBackground`. El
  re-tinte al tema (vía combinada) está **guardado** (`if (!bg?.setRgb) return`).
- El **re-tinte por tema** solo aplica por la vía combinada; en los individuales
  solo 3 ficheros lo exponen y se omite (conservan su fondo horneado). El
  **replay** (hover/click/loop) sí funciona en los individuales.
  *(Mejora futura: re-tintar `colorBackground` por-fichero donde exista.)*

---

## 3. Cómo AÑADIR un módulo nuevo (checklist)

> Regla de oro pedida: **al añadir un módulo, se añade su icono** (y su Rive).
> No se da por hecho ninguno.

1. **Icono SVG** → `src/stories/neo/modules/icons/<modulo>.svg` (kebab-case).
2. **Animación Rive** → `src/stories/neo/modules/rive/<modulo>.riv` (kebab-case;
   normaliza permisos a `644`). Confirma que trae `State Machine 1`; si no, añade
   `riveStateMachine` al spec del módulo.
3. **(Opcional) Instance en el combinado** → si el módulo también vive en
   `aikit-modules.riv`, anota su `instance` verbatim; si no, deja el `.riv`
   individual como única fuente (el fallback no se usará).
4. **Entrada en `MODULES`** (`modules.ts`): importa el `.svg` y el `.riv?url`, y
   añade la fila `{ name, icon, rive, instance, group, rotate? }`. El `satisfies`
   te obliga a rellenar `rive` → no se puede olvidar el asset.
5. **Fila en este manual** (§1, en su categoría) con SVG + `.riv` + `instance` +
   estado.
6. **(Si entra en flujos)** revisa el **kit de iconos HugeIcons** de
   [`flow-blueprints.md` §1.3](./flow-blueprints.md): el icono de cada *paso* del
   flujo (no el de marca) sale de `ICONS` en
   [`src/components/icons.tsx`](../src/components/icons.tsx). Añade el alias allí
   si falta.
7. **Verifica**: `pnpm exec tsc -b` (compila los `?url`) y revisa en Storybook
   (`AikitModule` con `animated`) que la animación reproduce.

---

## 4. Iconos de paso en los flujos (HugeIcons) — recordatorio

Dos vocabularios de icono **distintos**, no los confundas:

- **Icono de marca del módulo**: el `.svg`/`.riv` de §1 (logo del módulo).
- **Icono de paso del flujo**: un HugeIcons Pro (azul `KIT_BLUE`) que representa la
  *acción* de ese paso en el grid serpenteante. Viven en `ICONS`
  (`src/components/icons.tsx`); el catálogo y el significado de cada alias están en
  [`flow-blueprints.md` §1.3](./flow-blueprints.md). Requiere `HUGEICONS_TOKEN`
  (`.env`).

Para añadir un alias nuevo: importa el icono de
`@hugeicons-pro/core-stroke-standard` y mételo en el objeto `ICONS`.

---

## 5. Animaciones de la landing — estado

El plan completo (un flujo por "ejemplo" del pitch) está en
[`flow-blueprints.md`](./flow-blueprints.md). Cada flujo = un `concept` en
[`src/content/concepts.ts`](../src/content/concepts.ts) + un wrapper fino sobre
[`ConceptFlowVideo`](../src/remotion/ConceptFlowVideo.tsx), registrado en
[`Root.tsx`](../src/remotion/Root.tsx).

| Flujo | Composición Remotion | Estado |
|---|---|---|
| Contabilidad (facturas → velocidad de cobro → cierre, **§8 del pitch**) | `Accounting` = mini-película de **4 actos** (`InvoiceIntake` chorro de facturas **absorbido por la placa de Udon** (`OperatingModuleTile` → "Analizando facturas") → grid `cierre-trimestre` **teaser (serpenteo cs2 5×5)** → `AccountingLoop` timeline `NeoReasoning` + **placa de Foresight** ("Buscando patrones") → `AccountingClose` informe **Glimpse**+KPI+sello) · **~16 s** | ✅ construido — grid con iconos de marca (DocuSense·Junction·Foresight·Glimpse·Action Runner·Forge); actos 1 y 3 con `OperatingModuleTile` · _AccountingLoop ampliado a 122 f para leer el cierre del razonamiento_ |
| E-Commerce (tienda física → web AURELE conectada al inventario) | `Ecommerce` = mini-película de **6 actos** (`PlatformChaos` el lío de plataformas → `InventoryIntake` **pila de documentos** (Excel legible + PDF/Word detrás) que reposa y es absorbida por **DocuSense**→catálogo → grid `montar-tienda` **teaser** → `EcommerceChat` **Feedback Loop** personaliza → `StoreTerminal` **Forge** construye el código en un terminal (`aikit forge build aurele`) → `StoreCreate` **Forge** monta AURELE, reusa `StoreBuild` time-remapeada) · **~25 s** | ✅ construido — grid con iconos de marca (DocuSense·Junction·Feedback Loop·Forge·Action Runner·Heartbeat); DocuSense en acto 2; terminal en acto 5 · _colas ampliadas: PlatformChaos (HOLD 38), EcommerceChat (136 f — conversación recortada: pregunta el nombre → "AURELE" → confirma "¡Magnífico! Empezamos" y pasa a Forge; sin la 2ª iteración de envíos/devoluciones), StoreTerminal (130 f); InventoryIntake refactorizado a pila de documentos con beat estático (158 f)_ |
| Email Marketing (campañas a mano → funnel que se nutre solo) | `EmailMarketing` = mini-película de **5 actos** (`EmailGrind` borrador atascado + pila de herramientas → `ContactsMerge` fuentes dispersas convergen en **DocuSense** → grid `campana-email` **teaser (serpenteo cs2 5×5)** → `EmailCompose` **Smart Process** compone la campaña en un terminal → `CampaignLive` **Action Script** envía/nutre 24/7 + **Foresight** mide) · **~25 s** | ✅ construido — actos 1-2 con representación **propia** (no comparten coreografía con E-Commerce); grid con iconos de marca (DocuSense·Foresight·Smart Process·Forge·Action Script·Heartbeat) · _colas ampliadas: ContactsMerge (HOLD 44), EmailCompose (152 f)_ |
| Atención al cliente (caos multicanal → cliente atendido solo) | `Support` = mini-película de **5 actos** (`MessageStorm` lluvia de mensajes → `ChannelsConnect` canales→**Hotpot**→bandeja única → grid `soporte-cliente` **teaser (compacto cs2)** → `SupportChat` **Action Runner** atiende a un cliente → `SupportResolved` 3 h→30 s + cliente feliz, **Skill Hub**+**Foresight**) · **~24 s** | ✅ construido — actos 1-2 con representación **propia** (lluvia que se amontona / canales enchufados a un hub); cierre con `TestimonialWidget`; grid con iconos de marca (Hotpot·Smart Process·Foresight·Skill Hub·Heartbeat·Action Runner) · _colas ampliadas: MessageStorm (HOLD 36), ChannelsConnect (HOLD 36), SupportChat (186 f — cliente a la derecha en azul (`me`), AiKit a la izquierda en blanco (`them`): la conversación estaba invertida)_ |
| Planificación de Horarios (plantilla Excel/ERP → planillas semanales vivas) | `Scheduling` = mini-película de **6 actos** (`ShiftChaos` cuadrante manual con solapes/huecos → `StaffImport` Excel+ERP→**DocuSense/Junction**→plantilla limpia → `SchedulingRules` **Feedback Loop** confirma las reglas en un panel → grid `planificacion-horarios` **teaser** → `ScheduleTemplate` la planilla semanal se rellena sola, centrada, pill "creadas con **Glimpse**" → `ScheduleResults` en piloto automático con **Heartbeat** (rutina de 4 pasos) + KPIs (conflictos 0, cobertura 100%), hermano del cierre de Email) · **~31 s** | ✅ construido — grid con iconos de marca (DocuSense·Junction·Feedback Loop·Smart Process·Foresight·Teamwork·Glimpse·Heartbeat·Action Runner); iconos de paso RRHH añadidos a `icons.tsx` (`erp`, `alert`, `dashboard`, `employee`, `vacation`, `payroll`, `evaluation`, `database`) · _ampliados: ShiftChaos (165 f), StaffImport (190 f); cierre **dividido en 2 clips** (`ScheduleTemplate` 165 f + `ScheduleResults` 165 f)_ |
| **Hero "El ecosistema vivo"** (qué es AiKit — **no** es un flujo) | `HeroIntro` ([`hero/HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx)) — **render único** 300 f / ~10s, reglas propias en [`hero-animation.md`](./hero-animation.md) | ✅ construido (v2) — los **16 módulos reales** en 3 clusters por familia + malla + **tráfico de datos** en paralelo; cada módulo pulsa y dice su nombre al trabajar. Sin logo/gota/placas. `pnpm run render:hero` |
| **Módulos seleccionables · Módulo 1** "Tus tareas del día a día" (5 clips en **bucle perfecto**, no son flujos) | `ModAbsences` · `ModInvoices` · `ModStock` · `ModTickets` · `ModCart` (folder **Modulos-Tareas**, cuadrado 1080, 120 f · **`ModCart` 150 f · `ModTickets` 180 f**) | ✅ **rediseñado a lenguaje HÍBRIDO Tailark** (cada clip una base distinta: calendar·**flow+documents**·uptime·kanban·payment) — un objeto que se transforma; kit compartido + primitivas [`modules/loopKit.tsx`](../src/remotion/modules/loopKit.tsx); receta en [`module-loops.md`](./module-loops.md). V1 abstracta conservada en folder `Modulos-V1`. **`ModCart` → 3 momentos** (abandono con notificación → ejecución con `OperatingModuleTile` → pago limpio, sin recuadro de fondo) · **`ModAbsences` → mini-película de 3 actos** (montón de peticiones de vacaciones → `OperatingModuleTile` Action Runner «Analizando conflictos» → marcador KPI Aprobadas·A revisar·Rechazadas; tarjeta de solicitud = placa neumórfica por nombre, sin borde; loop previo en `ModAbsencesLoop`) · **`ModTickets` → 3 actos** (los tickets caen sin orden a un **Kanban real** Alta/Media/Baja → la placa `OperatingModuleTile` de Smart Process **aparece/desaparece con fade** «Priorizando tickets» → organizado en columnas; cards estándar sin bisel) |
| **Módulos seleccionables · Módulo 2** "Tu negocio funcionando conectado" (2 clips en **bucle perfecto** + 3 narrativas) | `ModOnboarding` · `ModSaleChain` · `ModDunning` · `ModMonthClose` · `ModLeadFunnel` (folder **Modulos-Conectado**, cuadrado 1080; loops 168 f, `ModOnboarding` 376 f) | ✅ **rediseñado a lenguaje HÍBRIDO Tailark** (bases: actionnable·workflow+currency·invoice·calendar+document·kanban) — nodos/cadena + pulso; `render:modules` (vía `export-clips module1 module2`). **2.1 Onboarding reconvertido a NARRATIVA (NO loop)** — 4 beats encadenados (FIRMA porte Tailark `actionnable` → EJECUTA `OperatingModuleTile` Action Script → STEPS `NeoReasoning` → CONFIRMA ✓), excepción al bucle perfecto (junto a 2.3 Dunning; Iván: el anillo «no encajaba»); loop anterior en `M2Onboarding.ringloop.bak`. **2.4 MonthClose partido en mini-película de 3 actos (NO loop)** (① libro diario que se llena + 4 áreas conectadas → ② `OperatingModuleTile` Foresight «Cerrando junio», sólo el cuadrado, ingiriendo apuntes → ③ resumen con totales que cuentan + sello ✓ «Cerrado»); `M2MonthCloseVideo` (`ModMonthClose`) + actos sueltos `ModMonthCloseLedger/Run/Summary`, export-clips flow `monthclose`. Loop legible previo en `ModMonthCloseLoop` (Modulos-V1). **2.5 LeadFunnel rehecho a Kanban de leads** (pipeline Prospectos·Contactados·Cualificados·Convertidos·Descartados; `OperatingModuleTile` Foresight «Reactivando leads»). **2.3 Dunning reconvertido a mini-película de 3 actos (NO loop)** (2026-06-11, Iván: partir el bucle único en «3 clips distintos») — ① la factura con los **días corriendo** «Vence en 5 días»→«Vencida hace 8 días» + sello VENCIDA (placa de factura **neumórfica limpia**: sin marco rojo externo, sin ring Tailark) → ② `OperatingModuleTile` Action Script «Reclamando el pago» + **aviso al cliente** (sobre→nodo Cliente, 🔔+✓) → ③ la **misma** factura, PAGADO (verde+✓+onda); `M2DunningVideo` (`ModDunning`) + actos sueltos `ModDunningOverdue/Run/Paid`, export-clips flow `dunning`, `render:dunning`. 2.3 ⚠️ sin validar arriba |
| Galería "Qué se te da mal" (Delega) | — | 📋 §3.1–§3.13 |
| Galería "Construye" (fases) | — | 📋 §4.1–§4.4 |
| Ideas de uso avanzado | — | 📋 §5.1–§5.4 |

Mecánica común (resumen — detalle en blueprint §1): grid neumórfico claro, ruta
serpenteante (disco inicio abajo-izq → meta azul arriba-der), **1 flecha entre dos
items**, emergencia + cámara derivadas de `useCurrentFrame()`, sin captions.

---

## 6. Pendientes / estado compartido (log)

- [x] **2.5 LeadFunnel → Kanban de leads, UI de `M1Tickets`** (2026-06-11, pedido por Iván
  en 2 pasos). **(1)** Primero tiré el hub-estrella Foresight + 4 leads («no gustaba nada») y
  lo rehíce como Kanban en 3 beats con `OperatingModuleTile`. **(2)** Iván: «la idea está bien
  pero la UI no me gusta nada; revisa mod tickets y copia su UI». Reconstruido reusando el
  lenguaje de `M1Tickets`: **columnas flat** (`tailarkSurface(0.22)` + ring fino + cabecera con
  punto de color + puntos), **task-cards con franja de color a la izquierda**, placa
  **`OperatingModuleTile`** **arriba-centro** con presencia (aparece/desaparece) + **barrido de
  escaneo** KIT_BLUE. Adaptado: **5 columnas** (Prospectos·Contactados·Cualificados·Convertidos·Descartados) y
  **`LeadCard`** (origen + nombre + avatar + chip de estado + id/€). La idea se mantiene: FRÍOS
  reposan → la placa REACTIVA (aparece + barrido, los leads se templan en su sitio) → ACTIVADOS
  vuelan a su columna (3 Cualificados, 2 Convertidos ✓+€, 1 Descartado gris). **Bucle = flujo continuo**
  (§2 técnica 1): foto igual en f0 y f167; relevo salida (resueltos se desvanecen) + entrada
  (tanda fría llena la izquierda), 2 sprites por lead. Base `kanban` compartida con 1.4 (única
  repetida; mecanismo distinto). Verificado: `tsc -b` limpio + stills (f0==f167; f20 reposo; f78
  placa+barrido; f116/132 activados; f150 relevo) + MP4. Solo `M2LeadFunnel.tsx`; sin tocar
  `loopKit`/`Root`/`export-clips`.
- [x] **1.1 Ausencias → mini-película de 3 actos** (2026-06-11, pedido por Iván: «el proceso
  no me convence»). Deja de ser un loop abstracto: una historia corta cuadrada (1080) encadenada
  con fundidos (`TransitionSeries`), **NO bucle**. (1) **Arreglos de look** pedidos: fuera la placa
  neumórfica grande de fondo, fuera el borde de cada fila, y **cada uno de los 5 nombres**
  (Marta·Carlos·Lucía·Iván·Nora) sobre su **propia placa neumórfica** (sin contorno). (2) **Acto 1**
  (`M1AbsencesRequests`): un montón de peticiones de vacaciones cae y se apila, contador
  «N pendientes» + tarjeta tenue «+6 más». (3) **Acto 2** (`M1AbsencesProcess`): mismo lenguaje que
  accounting/e-commerce — la placa `OperatingModuleTile` con **Action Runner** absorbe las solicitudes
  y se abre con «Analizando conflictos». (4) **Acto 3** (`M1AbsencesSummary`): marcador KPI Aprobadas 3 ·
  A revisar 1 · Rechazadas 1 (cuentan) + sello «Resuelto con Action Runner» + mini-avatares por
  veredicto. Datos + tarjeta de solicitud compartidos en `absencesShared.tsx`. Combinado `ModAbsences`
  + 3 actos sueltos en `Root.tsx`; loop previo conservado como `ModAbsencesLoop` (folder `Modulos-V1`).
  QA: `node scripts/abs-stills.mjs`.
- [x] **1.2 Invoices rediseñado a «flujo con líneas» + arco CAOS→ORDEN + carpetas de SO**
  (2026-06-11, pedido por Iván, 3 iteraciones). (1) **Fuera la placa neumórfica grande de
  fondo** (la bandeja/lector `NeoTile 640`) — no convencía. (2) Composición con base Tailark
  `flow` (el «haz de líneas» de las ilustraciones de circuito). (3) **Arco caos→orden**: un
  lote de facturas (PDF·XLS·CSV, mismo `DocChip` que e-commerce/accounting) desordenado →
  DocuSense las **ingiere** por las líneas que se encienden, **enderezándolas** → salen
  clasificadas y **divergen** a **carpetas con icono de SO macOS EN BLANCO** (`OsFolder` SVG,
  gris-blanco + borde fino + sombra; tinte azul al recibir; el emoji 📁/PNG real se descartó
  por render no-determinista) con **✓** al recibir. **Iteración 3** (este ajuste): (a) los
  documentos **ya están presentes en el frame 0** y **entran deslizándose desde la izquierda**
  (no caen desde arriba; antes el reposo dejaba líneas vacías sin conectar); (b) **haz de
  líneas SIMÉTRICO** (espejo exacto sobre DocuSense, mismo `HALF`/`CK`, 2 filas → se quitó el
  «descuadre»); (c) **2 carpetas** en vez de 3: **«Compras» y «Ventas»** (también arregla la
  asimetría). (4) Bucle = **ciclo que vuelve al reposo**: bandeja llena (caos) → se
  ingiere/clasifica → inbox limpio (~f41-68, todo organizado) → **lote nuevo entra desde la
  izquierda** y la rellena; el último doc cruza el seam (portador) → frame 0/119 idénticos
  (verificado con stills 0/15/30/55/75/95/119; **0≡119**). Receta en
  [`module-loops.md`](./module-loops.md) §6 (1.2). _Solo se tocó `M1Invoices.tsx`; sin
  cambios en `loopKit`/`Root`/`export-clips`._

- [x] **Módulos seleccionables construidos** (10 clips en **bucle perfecto**, new-landing).
  Los dos selectores de 5 elementos del acto *Picture* (zoom medio = "una tarea, un área";
  zoom macro = "una chispa, una cadena"). Tipo de asset **nuevo** (no son grids
  serpenteantes ni mini-películas): clips cortos, cuadrados (1080), deterministas y
  periódicos en su `DURATION` (técnica del **hero**: `frame mod DUR`, sin `Date`/`random`,
  Rive NO se usa). **Kit compartido** [`modules/loopKit.tsx`](../src/remotion/modules/loopKit.tsx)
  (LoopStage neumórfico, NeoTile, ModuleIcon, Wire/Packet con estela, Bubble, Check, anillos)
  → fija la estética común; cada clip aporta su **mecanismo distinto**. **M1** (`Modulos-Tareas`,
  120 f): Absences·Invoices·Stock·Tickets·Cart = un objeto que se transforma. **M2**
  (`Modulos-Conectado`, 168 f): Onboarding·SaleChain·Dunning·MonthClose·LeadFunnel = nodos
  conectados + pulso que vuelve al origen. Referencias hechas a mano (M1Stock, M2Onboarding);
  las otras 8 por agentes en paralelo contra el kit. **M2MonthClose** se reescribió (el primer
  intento descuadraba el calendario). Registrados en `Root.tsx`, en `export-clips.mjs`
  (flows `module1`/`module2`) y `render:modules`. Receta y contrato en
  [`module-loops.md`](./module-loops.md). **Lección de costura** (nueva §2 del spec): nada
  acumulado (un verde «hecho») puede sobrevivir al seam; debe decaer a reposo antes de `u→1`.
  ⚠️ **2.3 Impagos** no está en el PDF (panel) — validar con el equipo antes de defenderlo arriba.
  Copy de labels/descripciones del CMS: **redactado** (2026-06-11) — títulos y descripciones de
  los 2 tabs + los 10 vídeos en [`module-loops.md` §10](./module-loops.md). Entrega: los **10
  vídeos finales** (combinados, no los actos sueltos) se exportan con
  `node scripts/export-module-videos.mjs` → `out/modulos/modulo-1-tareas/` +
  `out/modulos/modulo-2-conectado/` + `copies.md` al lado.
- [x] **Los 10 module-loops rediseñados a lenguaje HÍBRIDO Tailark** (2026-06-11, pedido
  por Iván: la versión abstracta «estaba bastante mal»). Misma misión (enseñar el icono de
  marca del módulo + bucle perfecto) pero ahora sobre **componentes de Tailark Pro**, cada
  clip una **base distinta** (máxima variedad): calendar·documents·uptime·kanban·payment
  (M1) · flow·workflow+currency·invoice·calendar+pdf·collaboration (M2). El porte común se
  **factorizó al kit** (`TailarkCard`, `DocChip`, `StateChip`, `AvatarChip`, `MetricBar`);
  los 2 prototipos V2 (Invoices/Onboarding) se **promovieron** a canónicos y se borró el
  folder `PrototipoV2`. La V1 abstracta se conserva en el folder **`Modulos-V1`** de
  `Root.tsx` (ficheros `*V1.tsx`, re-export aliasado) para comparar lado a lado. Reglas de
  porte y slugs en [`module-loops.md`](./module-loops.md) §8. Verificado: `tsc -b` limpio
  (salvo 3 errores ajenos) + stills look/costura (`node scripts/module-stills.mjs`). Nada
  cambió en `export-clips.mjs` ni en las filas existentes de `Root.tsx` (mismos ids/nombres).
  Fuentes Tailark crudas en `vendor/tailark-pro/` (gitignored).
- [x] **Iteración post-panel** (/second-opinion: Codex + GLM; Kimi leyó todo pero opencode no
  volcó su texto). (1) **LeadFunnel rehecho** — el embudo quedaba saturado (3 iconos de módulo,
  Foresight tapado); ahora es un **hub-estrella** simple (Foresight + 4 leads que se enfrían y se
  reactivan con un toque por su cable). (2) Fixes válidos: la estela del `Packet` **envuelve** en
  bucles cerrados y sigue el trazado (fix en `loopKit`, beneficia Onboarding/SaleChain); el ✓ de
  Tickets atado a la opacidad de su card (no flotaba en el seam); factura de Dunning «Vencida hace
  8 días»/«Pagada» (antes «Vence en 15 días»); barra de Stock más roja en «bajo»; DocuSense por
  encima del doc en Invoices; cabecera de MonthClose «Cierre de junio» (UI, no marketing). (3)
  Descartados (falsos positivos): «pop» de Absences/Dunning en el seam = es la técnica del
  **portador** (continua, verificado f0 vs DUR−1). Re-render 10/10.
- [x] **M1Stock (module-loop 1.3) — reestructurado a 3 beats con `OperatingModuleTile`**
  (2026-06-11, pedido por Iván). (1) **Se eliminó la placa neumórfica de fondo** (el
  `NeoTile` 560): ahora la tarjeta de stock Tailark va sola sobre el `LoopStage` blanco,
  con la placa de módulo debajo. (2) **3 beats**: BAJA (nivel verde→rojo hasta el mínimo)
  → **GESTIONA** (al tocar fondo se abre la **misma UI de "módulo en funcionamiento"** que
  Accounting/E-Commerce — `OperatingModuleTile` con **Heartbeat** + estado **"Reponiendo
  stock"**) → COMPLETA (rellena a lleno + ✓ de chispa). Sustituye al antiguo chip-paquete
  «+200»/`BoxGlyph` (eliminados). `M1Stock` es ahora el **6.º consumidor** de
  `OperatingModuleTile` (§2) y el único en los module-loops. La apertura de la placa es
  **periódica en `DUR`** y decae a reposo antes del seam (regla §2.2 de `module-loops`).
  **Iteración (Iván):** (a) **sin respiro de cámara** (`LoopStage breathe={false}`) → todo
  **estático**, nada «flota»; (b) la placa **no está siempre visible**: aparece (fade-in)
  al agotarse el stock, se abre/reposa para leer «Reponiendo stock» y tras cerrarse
  **desaparece** (fade-out) → en el seam la placa está **ausente** (f0==f119 = lleno + sin
  placa). Verificado con stills (f46 fade-in; f58 abierta; f92 ✓; f114 fade-out; f0==f119).
- [x] **M2MonthClose (2.4) — partido en MINI-PELÍCULA de 3 clips (NO loop)** (2026-06-11,
  pedido por Iván). Primero se rehízo el loop abstracto a un loop legible de 2 actos (libro
  diario + cierre); a Iván le gustaron **todos los pasos** pero pidió hacerlo en **3 clips
  distintos**, como Dunning/Ausencias. Resultado — mini-película de 3 actos lineales con
  cross-fades (`M2MonthCloseVideo` → `ModMonthClose`), cada acto suelto y exportable:
  ① **`M2MonthCloseLedger`** (~108 f) — el libro diario «Junio» se llena de **apuntes reales**
  (día·concepto·importe) + las **4 áreas conectadas** (Ventas·Compras·Banco·Nóminas) le mandan
  un **pulso** cada una (firma M2). ② **`M2MonthCloseRun`** (~100 f) — **SÓLO el cuadrado del
  módulo** (`OperatingModuleTile`·Foresight «Cerrando junio», sin etiquetas de marca/área);
  los apuntes vuelan desde fuera y son **ingeridos** por el icono, que luego se abre (patrón de
  `M1AbsencesProcess`). ③ **`M2MonthCloseSummary`** (~136 f) — el libro se **consolida**: los
  totales **cuentan** (Ingresos 48.250 € · Gastos 34.380 € · Resultado 13.870 €) + sello
  **✓ «Cerrado»**. Piezas compartidas en `monthCloseShared.tsx` (como `absencesShared`/
  `dunningInvoice`). Registrados en `Root.tsx` (combinado en Modulos-Conectado + 3 actos);
  `export-clips` flow **`monthclose`** (MonthClose salió de `module2`, como Dunning). El **loop
  legible previo** se conserva en `M2MonthCloseLoop.tsx` (`ModMonthCloseLoop`, Modulos-V1).
  `M2MonthCloseRun` es **consumidor de `OperatingModuleTile`** (§2). Verificado con stills de
  los 3 actos + combinado (328 f); `tsc -b` limpio.
- [x] **M2Onboarding (module-loop 2.1) — reconvertido de loop abstracto a NARRATIVA**
  (2026-06-11, pedido por Iván: el anillo Contrato→Firma→Ficha→Accesos «no encajaba»). Es la
  una de las **excepciones** al bucle perfecto de la tira (con 1.1 Absences y 2.3 Dunning):
  un **único clip cuadrado (1080)** que
  cuenta el alta como **mini-película de 4 beats** encadenados con `TransitionSeries` +
  cross-fades de 8 f (376 f total), al estilo de los flujos pero en el formato del selector.
  (1) **FIRMA** — porte de la ilustración Tailark **`actionnable`** («Signatures Approved»,
  categoría Quartz `actionnable`): tarjeta de notificación con tramado verde + insignia con
  glifo **lucide `Signature`** que se **dibuja** (renglón → firma) y se sella «Contrato
  firmado · María González» con ✓ verificado. (2) **EJECUTA** — la **placa
  `OperatingModuleTile`** (Action Script, «Dando de alta a María»), la MISMA UI de
  Accounting/E-Commerce → `M2Onboarding` es **otro consumidor** de `OperatingModuleTile`
  (§2). (3) **STEPS** — la cadena del onboarding en **`NeoReasoning`** (el «3.er clip» de
  Accounting): Contrato registrado → Alta en nómina y SS → Ficha → Accesos y correo → Equipo.
  (4) **CONFIRMA** — pantalla final: ✓ grande «Alta completada», los 5 pasos en verde + sello
  «Alta ejecutada con Action Script». Driven por `useCurrentFrame()`+`spring` (no `useLoop`).
  Loop anterior preservado en `src/remotion/modules/M2Onboarding.ringloop.bak`. Exports
  intactos (`M2OnboardingScene`/`M2_ONBOARDING_DURATION` 168→376) → **sin tocar `Root.tsx`
  ni `export-clips.mjs`**. La ilustración cruda en `vendor/tailark-pro/actionnable.tsx`.
  Verificado con stills (f45/90 firma; f140 placa; f245 steps; f360 confirmación) y `tsc -b`.
  Specs actualizadas: `module-loops.md` §1/§2/§6/§8 + esta entrada.
- [ ] **AiKit Gestalt** (alt: Telos, Alma, Pulso, Geist, Ignis, Cortex): único
  módulo para humanos, mencionado en el pitch. **No tiene icono ni `.riv` aún** —
  si entra, sigue el checklist §3.
- [x] **Replay en los `.riv` individuales** (hover/click + loop) — hecho vía el
  trigger del view-model. Pendiente: **re-tinte por tema** (`colorBackground`) en
  los individuales que lo expongan (ver §2).
- [x] **E-Commerce construido** (`Ecommerce`, mini-película de **6 actos**). Reusa
  `StoreBuild` (time-remap, ver `StoreCreateScene`) como clímax "Forge monta la
  web". Concept de grid: `montar-tienda` (5×5, clon de `cierre-trimestre`). Actos
  sueltos en `Root.tsx`: `PlatformChaos`, `InventoryIntake`, `EcommerceChat`,
  `StoreTerminal`, `StoreCreate`. **Nuevo acto 5** (`StoreTerminalScene`): terminal
  oscura con `aikit forge build aurele`, componentes JSX de la tienda y ✓ AURELE
  lista — misma estética que `CodeTerminalVideo` (COLORS, shutter-blur, tarjeta
  oscura), stream propio en el propio fichero; se cierra con el chip "Construida con
  Forge". `STORE_TERMINAL_DURATION = 130` (~4,3 s @ 30 fps; ampliado desde 107
  para leer "✓ AURELE lista" + el sello). Iconos de paso
  añadidos a `icons.tsx` (confirmados en el paquete):
  `store`, `spreadsheet`, `connect`, `web`, `ecommerce`, `cart`, `stock`, `tag`.
- [x] **Email Marketing construido** (`EmailMarketing`, mini-película de 5 actos).
  Concept de grid: `campana-email` (5×5, clon de `cierre-trimestre`). Actos sueltos
  en `Root.tsx`: `EmailGrind`, `ContactsMerge`, `EmailChat`, `CampaignLive`. Iconos
  añadidos a `icons.tsx`: `email`, `send`, `campaign`, `segment`, `lead`, `automate`,
  `chart`, `predict`.
- [!] **LECCIÓN: varía la representación de los actos 1-2 entre flujos.** Email
  reusó al principio `ChaosScene`/`IntakeScene` (E-Commerce) y quedó "cutre": en la
  web se ven varias animaciones y repetir la MISMA coreografía canta. Email tiene
  ahora actos 1-2 **propios**: `EmailGrindScene` (compositor de correo atascado +
  pila de herramientas en escalera + tiempo perdido) y `ContactsMergeScene` (fuentes
  dispersas Excel/CRM/web/email que convergen en una lista). Regla para el próximo
  flujo: el grid, el chat y el cierre **pueden** parecerse (es la "firma"), pero el
  **problema (acto 1) y la captura (acto 2) deben tener un concepto visual distinto**.
- [x] **Atención al Cliente construido** (`Support`, mini-película de 5 actos).
  Concept de grid: `soporte-cliente` (5×5, clon de `cierre-trimestre`). Actos sueltos
  en `Root.tsx`: `MessageStorm`, `ChannelsConnect`, `SupportChat`, `SupportResolved`.
  Iconos añadidos a `icons.tsx`: `support`, `faq`, `task`, `chat`, `agent`,
  `whatsapp`, `phone`, `instagram`. Aplica la lección: actos 1-2 con concepto propio
  (`MessageStormScene` = lluvia de mensajes que se amontona; `ChannelsConnectScene` =
  canales que se enchufan a un hub Hotpot → bandeja única). Cierre con
  `TestimonialWidget` (cada flujo cierra distinto: firma / StoreBuild / gráfica /
  testimonial).
- [x] **Planificación de Horarios construido** (`Scheduling`, mini-película de 5
  actos). Concept de grid: `planificacion-horarios` (8×5, 9 módulos visibles en la
  foto global). Actos sueltos en `Root.tsx`: `ShiftChaos`, `StaffImport`,
  `SchedulingChat`, `ScheduleOutput`. El cierre reusa `ScheduleFill` con
  `frameOverride` para time-remap dentro de una escena con chat, KPIs y avisos.
  Iconos añadidos a `icons.tsx`: `erp`, `alert`, `dashboard`, `database`,
  `employee`, `vacation`, `payroll`, `evaluation`. Aplica la lección: problema =
  cuadrante manual que se contradice; captura = rutas Excel/ERP hacia
  DocuSense+Junction, no absorción radial ni convergencia de contactos.
- [x] **Componentes base disponibles** (genéricos, los usa E-Commerce):
  `src/remotion/ChaosScene.tsx` (centro + enjambre de chips) e
  `src/remotion/IntakeScene.tsx` (hoja vuela al núcleo → brotan fichas). Útiles como
  punto de partida, pero **reskinea/reinventa** si la nueva pieza va a convivir con
  otra que ya use esa coreografía.
- [x] **Hero del home — construido (v2, "El ecosistema vivo")** ([`hero/HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx),
  `HeroIntro` en `Root.tsx` carpeta **Hero**, 300 f). **Pivote**: la **v1 "El motor
  invisible"** (placa que se abre + 3 piezas abstractas) la rechazó Iván por *simplona
  y sin contenido*; pidió **módulos reales, más vívido, que hable de ellos** (revierte
  el consejo del panel de "no mostrar los 16"). **v2**: los **16 iconos de marca
  reales** en 3 clusters por familia (golden-angle), una **malla CURADA por semántica**
  (`RELATIONS` — quién colabora con quién de verdad, sin conexiones raras por
  proximidad; hubs: Junction=datos, Action Runner=acción) con **roles especiales por
  módulo** (Heartbeat=**trigger** que despierta en latidos y emite a varios ejecutores
  a la vez) y **paquetes** de datos KIT_BLUE que la recorren en paralelo,
  **despacio**; **no hay malla fija** — cada paquete deja una **estela en degradado que
  se desvanece** (una conexión sólo se ve mientras una bola la recorre, v2.4) y el
  **módulo destino pulsa + muestra su nombre**. Todo
  **lento y sutil**, y **en bucle perfecto** (v2.2): sin entrada/fade ni push-in
  lineal; **todo movimiento es periódico en 300 f** (tiempo modular) → el frame 299
  encadena con el 0 sin salto. Sin logo/gota/placas/bordes/glows; iconos limpios con
  drift; determinista (hash `Math.sin`). La animación
  Rive interna **no** se usa (no se captura en `renderMedia`). Verificado con stills +
  MP4. Receta en [`hero-animation.md`](./hero-animation.md). Render: `pnpm run render:hero`.
- [ ] Construir los flujos 📋 de §5 conforme se prioricen con Marketing.
- [ ] Iconos de flujo a confirmar al implementar: `signature`
  (`License`/`PencilEdit01`), `mobile`/Telegram (`DeviceAccess`) — ver
  `flow-blueprints.md` §6.
- [x] **Variedad entre las 5 animaciones de la landing** (romper Grid+Chat
  repetidos). Tres ejes:
  1. **Todas serpentean, placas al ancho del contenido** (solo datos de la `route` en
     `concepts.ts`, sin tocar el motor). Las primeras variantes no-serpenteantes
     (`cierre-trimestre` escalera; `campana-email` lineal; `soporte-cliente` vertical)
     **quedaban pobres y se revirtieron**. **Regla de placa pedida por Iván**: al
     **ancho JUSTO del contenido** (labels cortos → `cs2`), **nunca más anchas de lo
     necesario** ni **más altas de una casilla** (sin `rowSpan`). Mapa actual:
     - `montar-tienda` (Ecommerce): `cs2`, 5×5.
     - `soporte-cliente` (Support): `cs2`, 5×5.
     - `campana-email` (Email): `cs2`, 5×5.
     - `cierre-trimestre` (Accounting): `cs2`, 5×5.
     - `planificacion-horarios` (Scheduling): `cs2`, 8×5, 9 ítems — densa.

     **Consecuencia (límite conocido)**: con 6 ítems + 1 flecha + meta fija
     arriba-derecha, la silueta serpenteante es **única** (3 niveles, 5×5), así que las
     **4 animaciones de 6 ítems comparten forma** (cambian iconos/labels, no la
     geometría); solo Scheduling (9 ítems) difiere de serie. Para diferenciar más sin
     placas anchas/altas habría que **variar el nº de pasos** por flujo (pocos nº
     encajan limpio: 6→5×5, 9→8×5) o **romper la linealidad** (2 módulos→1, loop), lo
     segundo exige extender el motor de pathfinding (hoy `RouteStep[]` es una cadena
     1→1) — pendiente, no hecho. Las flechas entre ítems siguen `colSpan 1`; el teaser
     (`teaserBeats=1`) dura **148 f** (`INTRO 22 + 1·BEAT 52 + TEASER_OUTRO 74`).
  2. **Menos chats** (solo 2 de 5): se mantienen **Support** (cliente↔Action Runner,
     el chat ES el entregable) y **Ecommerce** (Feedback Loop = "pregunta por chat").
     Se sustituyen reutilizando escenas existentes: **Accounting** quita el chat (lo
     cuenta `AccountingLoop`/NeoReasoning) → 4 actos; **Email** cambia el chat por
     `EmailComposeScene` (terminal, reskin de `StoreTerminalScene`: Smart Process
     **compone** la campaña); **Scheduling** cambia el chat de reglas por
     `SchedulingRulesScene` (panel tarjeta+lista, Feedback Loop confirma reglas) y el
     `ScheduleOutput` pierde su chat lateral (planilla + KPIs + Heartbeat). Borradas:
     `AccountingChatScene`, `EmailChatScene`, `SchedulingChatScene`.
  3. **Cabeceras fuera del vídeo**: las 4 tarjetas-título H1+subtítulo de los cierres
     (Accounting/Email/Support/Scheduling) se sacaron a `specs/cabeceras-extraidas.md`
     (se inyectarán como HTML en la landing). Solo se quitó el bloque `<h1>`+`<p>`;
     sellos/KPIs/widgets se conservan.

- [x] **Módulo "en funcionamiento" → pila cuadrada** (`OperatingModuleTile`, ver
  §2). Se cambió el "núcleo" circular con glow del clip de E-Commerce por una
  **placa cuadrada neumórfica** que se **expande hacia la derecha** con un estado
  ("Procesando documentos…") + **shimmer sutil**. Aplicado en `IntakeScene` →
  afecta a `InventoryIntakeScene` (E-Commerce acto 2). Las fichas que brotan se
  movieron al cuadrante **superior-izquierdo** para no pisar la placa.
  Reutilizable para futuros "módulo trabajando".
- [x] **Iteración (pedida por Iván): placa unitaria, sin azul, sin animación de
  icono.** (1) Icono **un pelín más pequeño** (`0.5`→`0.46` del lado) y placa más
  **compacta** (`TILE` `150`→`132` en `IntakeScene`) → menos padding. (2) **Se
  descartó la animación del icono** (`react`: pulso/escala/destello): no se podía
  replicar fielmente la animación del `.riv` de forma determinista por frame, así
  que se deja **estático** (la prop `react` desaparece del componente y de
  `IntakeScene`). (3) **Se quitó el tinte azul** (la "sombrerita" azul = halo
  radial + destello `inset KIT_BLUE`): ahora es una **placa neumórfica blanca
  unitaria**, como las pastillas del grid pero con **más entidad** (`distance 14`/
  `blur 32`). Verificado con stills (frames 18 reposo / 80 expandida).
- [x] **`OperatingModuleTile` extendido a Accounting (2 clips más).** (1) **Acto 1**
  (`InvoiceIntakeScene`): se eliminó la **carpeta** genérica + el texto suelto
  "Analizando con Udon"; ahora el chorro de facturas se **absorbe en la placa de
  Udon** y, al entrar la última, la placa se abre con ese estado. Se mantiene la
  coreografía del chorro (16 facturas, anillo determinista). (2) **Acto 3**
  (`AccountingLoopScene`): el **timeline** `NeoReasoning` se conserva; el badge
  `AikitModule foresight` (icono + "Foresight"/"encuentra el patrón") se sustituye
  por la **placa de Foresight** con estado "Buscando patrones". Verificado con
  stills (acto 1 frames 30/82; acto 3 frame 60).
- [x] **`OperatingModuleTile` rediseñado a geometría simétrica de ancho intrínseco**
  (pedido por Iván). Antes: ancho fijo (`STATUS_W`) y crecía sólo a la derecha →
  padding asimétrico (sobraba a la derecha) y, para centrar el conjunto abierto,
  había que **descentrar** el ancla a la izquierda. Ahora: `inline-flex` de ancho
  intrínseco, **mismo padding por los 4 lados**, ancla `(x,y)` = **centro de la
  placa** → reposo cuadrado y, al abrirse, **crece hacia ambos lados** quedando
  centrada en el mismo punto. `x`/`y` ahora **opcionales** (sin ellas → inline para
  layouts flex, como el sello de Foresight). Consumidores actualizados: `IntakeScene`
  e `InvoiceIntakeScene` anclan en `coreX = W/2`; `AccountingLoopScene` lo renderiza
  inline. `STATUS_W` eliminado. Verificado con stills (acto 1 frames 55/82; acto 3
  frame 70; E-Commerce frame 80).
- [x] **`OperatingModuleTile` extendido a Support (acto 2, `ChannelsConnectScene`).**
  Pedido por Iván: el 2º clip de Support seguía con la **UI antigua** (núcleo circular
  con glow azul + label suelto "Hotpot"). Se sustituyó por la placa de **Hotpot** con
  estado **"Conectando canales"** (elegido por ser literal a la coreografía: los cables
  encendiéndose). Se eliminaron `CORE`, el halo radial azul y el `<div>` del label; la
  placa va envuelta en un wrapper absoluto centrado en `(hubX, hubY)` que conserva la
  entrada (`hubRise`), y `tileOpen` (spring) la abre al encenderse el primer cable. Los
  cables terminan en el centro → quedan ocultos tras la placa. Verificado con stills
  (frame 8 reposo / 60 abierta / 110 con bandeja: sin solapes). Consumidores: ahora **4**.
- [x] **`OperatingModuleTile` + variante "dúo" y extendido a Scheduling (acto 2,
  `StaffImportScene`).** Mismo caso que Support, pero el hub representaba **DOS**
  módulos (DocuSense + Junction). Decisión de Iván: **placa con los dos iconos**. Se
  añadió la prop opcional `secondary` al componente (dos iconos en flex; la placa deja
  de ser cuadrada en reposo y se ensancha para acogerlos). En `StaffImportScene` se
  reemplazó el disco circular con glow + label "plantilla única" por la placa
  `docusense`+`junction` con estado **"Unificando fuentes"** (no duplica el "Plantilla
  limpia" de la tarjeta de salida). Verificado con stills (frame 10 reposo / 60 abierta
  / 120 con la lista). Consumidores de `OperatingModuleTile`: ahora **5**. **Además** se
  **quitó el heading** del clip (H1 "Cargamos la plantilla" + subtítulo): ya no llevamos
  cabecera dentro del vídeo (alineado con §6.3); se eliminaron `headerOp`/`interpolate`.
- [x] **Scheduling — ajustes de layout (actos 1 y 5).** (1) **Acto 1**
  (`ShiftChaosScene`): el contador de conflictos del encabezado se redujo (`58→44`,
  subtítulo `19→17`) — Iván lo quería menos grande (este heading **sí** se mantiene,
  a diferencia del de los actos 2/cierre). (2) **Acto 5** (`ScheduleOutputScene`):
  la pantalla estaba desbalanceada (la planilla sangraba a la izquierda con `left:-64`,
  hueco enorme al centro y abajo). Se recompuso en **dos columnas centradas como grupo**
  (`flex` + `alignItems/justifyContent: center`): izq = pill "Plantillas creadas con
  Glimpse" (ahora **inline**, ya no absoluta) + planilla; der = KPIs + aviso Heartbeat.
  La planilla se **recorta a su tarjeta** (`CARD_SCALE 0.62`, offset `-(CARD_X/Y-BLEED)`,
  `BLEED 60` para no cortar la sombra) en vez de escalar el frame entero con sangrado.
  Verificado con stills (frames 90/140/200).
- [x] **Scheduling — cierre dividido en 2 clips** (pedido por Iván: el acto 5 mezclaba
  "dos cosas"). `ScheduleOutputScene` **eliminado** y sustituido por:
  (1) **`ScheduleTemplateScene`** (165 f) — LA PLANTILLA: la planilla (`ScheduleFillVideo`
  time-remapeada, recorte a tarjeta `CARD_SCALE 0.72`/`BLEED 46`) **centrada** con la
  pill "Plantillas creadas con Glimpse" encima; **fondo limpio** (se quitó el gris). El
  gris venía del degradado interno de `ScheduleFillVideo` que acababa en `#ececf4`:
  **corregido en origen** → ahora `… ${surface} 72%)` sin el tope gris (beneficia a todos
  los usos). (2) **`ScheduleResultsScene`** (165 f) — RESULTADOS, **hermano del cierre de
  Email** (`CampaignLiveScene`): sello **Heartbeat** ("En piloto automático con
  Heartbeat") + secuencia de **4 pasos** que se completan solos (Publica la semana ·
  Avisa al equipo · Cubre bajas · Re-cuadra cambios, checks que saltan) + 2 pruebas
  (`StatWidget` conflictos 14→0 · `ChartWidget` cobertura al 100%). `SchedulingFlowVideo`
  pasa a **6 actos** (5 transiciones); `Root.tsx` registra `ScheduleTemplate` y
  `ScheduleResults` (se quitó `ScheduleOutput`). **`ChartWidget`** ganó la prop
  `valueFormat` (`'currency'|'percent'|'plain'`, default moneda) para que el pico muestre
  "100%" en vez de "€0,1k". Verificado con stills sueltos y en la peli completa (f 720/900).

- [x] **Grid teaser — hold final más largo** (pedido por Iván desde el clip de
  Email: "el del gris se hace muy corto"). El 3.er acto de los flujos es el grid
  serpenteante en modo teaser; su outro hace pull-back a la foto global y luego la
  **sostiene**. Ese hold era de solo **6 f** (`TEASER_OUTRO 52 − TEASER_OUTRO_RAMP
  46`) → se leía corto. Se subió `TEASER_OUTRO` `52 → 74` (rampa intacta en 46) →
  hold **28 f (~0,93 s)** y teaser **126 → 148 f**. Constante **global** en
  `ConceptFlowVideo.tsx`, así que el cambio cae igual en los **5 grids** (Email ·
  Ecommerce · Accounting · Support · Scheduling) — "algo parecido en los demás",
  como pidió. `StoreFlow` no se ve afectado (recorrido completo, no teaser).

- [x] **Chats de la landing — iteración (pedida por Iván).** Los dos únicos chats
  (`EcommerceChatScene` Feedback Loop · `SupportChatScene` Action Runner) comparten
  plantilla (NeoCard `width 580` + header de marca + hilo + NeoInput). Tres ajustes:
  (1) **Menos altura**: la conversación es corta, así que el `NeoCard` baja de
  `height 760` → **`500`** en ambos (mismo valor, plantilla común; `justifyContent:
  flex-end` ancla las burbujas abajo). (2) **E-Commerce más breve**: se eliminó la 2ª
  iteración (envío gratis / devoluciones). Tras "AURELE", Feedback Loop confirma con
  **"¡Magnífico! Empezamos 🚀"** y pasa directo a Forge. `SCRIPT` de 4→3 líneas,
  `ECOMMERCE_CHAT_DURATION 188 → 136`. (3) **Support — conversación invertida (bug)**:
  el 1.er mensaje, que es del **cliente**, salía a la **izquierda en blanco** (estilo
  IA `them`). Convención de `NeoMessage`: `them` = burbuja recibida izquierda blanca;
  `me` = enviada derecha azul. El **humano** del chat siempre es `me` (como en
  E-Commerce). Corregido: cliente → `me` (derecha, azul), AiKit → `them` (izquierda,
  blanco, con "escribiendo…"). Solo se invirtió el campo `from` (la mecánica
  input/typing deriva de él). Verificado con stills.

---

## 7. Specs relacionadas

- [`flow-blueprints.md`](./flow-blueprints.md) — recetas de cada flujo (steps ·
  módulo · icono · detalle).
- [`hero-animation.md`](./hero-animation.md) — blueprint del **hero** ("El motor
  invisible"): qué es AiKit, render único, reglas propias (no es un flujo).
- [`product-video.md`](./product-video.md) — Remotion, composiciones, render.
- [`storybook-catalog.md`](./storybook-catalog.md) — primitivas + widgets neo
  (los "detalle" de los flujos).
- [`grid-and-cells.md`](./grid-and-cells.md) · [`emergence-animation.md`](./emergence-animation.md)
  · [`pathfinding-concepts.md`](./pathfinding-concepts.md) — el motor del grid.
- [`generated-assets.md`](./generated-assets.md) — imágenes generadas (image-gen).
- [`index.md`](./index.md) — índice de todas las specs.
</content>
</invoke>
