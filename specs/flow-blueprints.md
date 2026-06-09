# Blueprint de animaciones de flujos — AiKit

Base de diseño **unificada** para todas las animaciones de la landing. Cada
"ejemplo" del guion (`pitch_aikit.pdf` + documento de flujos) se traduce aquí a
una receta lista para construir: **steps · módulo AiKit · icono · detalle**.

El objetivo es que **todas tengan el mismo aspecto y la misma mecánica**, y que
construir una nueva sea: copiar el patrón, definir un `concept` y un wrapper.
Referencia ya construida: **Contabilidad** (composición `Accounting`).

---

## Cómo usar este blueprint

Para cada flujo:

1. Lee la fila **▶ inicio** (el problema) y **● meta** (el resultado/mensaje).
2. Cada fila numerada = un **item del grid** (pastilla neumórfica): lleva una
   **micro-etiqueta**, un **icono** (HugeIcons Pro, azul `KIT_BLUE`) y, según el
   "detalle", un **artefacto** (widget) en lugar del icono simple.
3. El **módulo AiKit** es la lógica que representa el paso (del pitch) — no se
   escribe en pantalla, guía la elección de icono/detalle y el storytelling.
4. Construcción → nuevo `concept` en `src/content/concepts.ts` + wrapper sobre
   `ConceptFlowVideo` (ver `specs/product-video.md`). Iconos nuevos → añádelos a
   `src/components/icons.tsx`.

---

## 1. Sistema común

### 1.1 Patrón base (mecánica)

- **Lienzo**: grid neumórfico claro (`lightTheme`), celdas de 128px, con bandeja
  (`frame`) y `gridlines`.
- **Ruta serpenteante** (forma por defecto): disco de **inicio** abajo-izquierda
  (el problema) → serpentea fila a fila → **meta** (punto azul `KIT_BLUE`)
  arriba-derecha (el resultado). Filas impares (3 ó 5) para terminar arriba-derecha.
- **Variedad de forma** (para que las 5 animaciones de la landing no canten como
  idénticas): **todas serpentean** (las variantes no-serpenteantes —Email lineal,
  Support vertical, Accounting escalera— quedaban pobres y se revirtieron). La
  **Regla de placa pedida por Iván**: al **ancho JUSTO del contenido** (labels cortos
  → `colSpan 2`), **nunca más anchas de lo necesario** ni **más altas de una casilla**
  (sin `rowSpan`). Consecuencia: con 6 ítems + 1 flecha + meta fija arriba-derecha, la
  silueta serpenteante es **única** (3 niveles, 5×5), así que las 4 animaciones de 6
  ítems (Ecommerce, Support, Email, Accounting) **comparten forma** — cambia el
  contenido (iconos/labels), no la geometría. La única que difiere de serie es
  **Scheduling** (9 ítems → 8×5 denso). Para diferenciar más sin placas anchas/altas
  habría que **variar el nº de pasos** por flujo (pocos nº encajan limpio: 6→5×5,
  9→8×5) o **romper la linealidad** (2 módulos→1, loop), lo segundo exige extender el
  motor de pathfinding. Misma mecánica de ruta + 1 flecha entre ítems; flechas de giro
  `colSpan 1`.
- **Regla de oro**: **exactamente 1 flecha entre dos items**. Estrecha el grid
  para que `item(colSpan 2) + 1 flecha + item(colSpan 2)` llene la fila (un flujo
  de 6 items cabe en un grid 5×5; de 9 items en 8×5).
- **Emergencia + cámara**: derivado de `useCurrentFrame()` (sin transiciones CSS).
  La cámara hace pan/zoom de item en item; cada placa emerge (plano→elevado) al
  llegar la lente; pull-back final sobre todo el flujo + la meta.
- **Sin captions**: el mensaje se cuenta con la animación y las micro-etiquetas.

### 1.2 Niveles de zoom (del guion)

| Galería | Tono | Zoom | Formato de pasos |
|---|---|---|---|
| Tu mayor marrón (**Controla**) | el "marrón" concreto | **micro** | slides paso a paso, UI abstracta |
| Qué se te da mal (**Delega**) | ayuda en lo que flojeas | **medio** | más abstracto, apoyo en motion |
| Construye | construcción progresiva | **macro** | **Fases**: Digitalizar→Conectar→Automatizar→Autónomo→Mejora |

### 1.3 Kit de iconos (HugeIcons Pro · azul `KIT_BLUE`)

Vocabulario compartido — **reutilízalo entre flujos para mantener unidad**. Clave
= alias en `ICONS` (icons.tsx); valor = export de `@hugeicons-pro/core-stroke-standard`.

| Alias | Icono HugeIcons | Significado |
|---|---|---|
| `invoice` | `Invoice01` | factura / cobro |
| `spreadsheet` | `GoogleSheet` | excel / inventario en hoja |
| `document` | `File02` | documento genérico |
| `contract` | `Contracts` | contrato / política |
| `signature` | `License` *(o `PencilEdit01`)* | firma electrónica |
| `read` | `FileSearch` | leer / extraer (OCR) |
| `classify` | `FolderLibrary` | clasificar / archivar |
| `database` | `Database` | base de datos |
| `api` | `Api` | API externa (Hotpot) |
| `erp` | `Building06` | ERP / Odoo / empresa |
| `connect` | `PlugSocket` | conectar / integrar (Junction) |
| `stock` | `Package` | stock / inventario |
| `purchase` | `ShoppingCart01` | compra / cotización |
| `supplier` | `DeliveryTruck01` | proveedor |
| `dashboard` | `DashboardSquare01` | panel en tiempo real (Glimpse) |
| `chart` | `Analytics01` | análisis / gráfico |
| `predict` | `ChartUp` | predecir / anomalía (Foresight) |
| `alert` | `Alert01` | alerta / aviso (Heartbeat) |
| `chat` | `BubbleChat` | pedir por chat |
| `email` | `Mail01` | email / campaña de correo |
| `campaign` | `Megaphone01` | campaña / promo |
| `segment` | `UserGroup` | segmentar / grupos |
| `lead` | `UserSearch01` | lead / CRM |
| `support` | `Headset` | soporte / ticket |
| `faq` | `HelpCircle` | FAQ / autoservicio |
| `web` | `Globe` | web / publicar online |
| `ecommerce` | `ShoppingBasket01` | e-commerce / pedido |
| `store` | `Store01` | tienda física |
| `cart` | `ShoppingCart01` | carrito / pedido entrante |
| `tag` | `Tag01` | precio / etiqueta |
| `pos` | `CreditCard` | caja / POS / pago |
| `loyalty` | `GiftCard` | lealtad / tarjeta |
| `wallet` | `Wallet01` | monedero / saldo |
| `calendar` | `Calendar03` | calendario / turnos |
| `vacation` | `Beach02` | vacaciones |
| `payroll` | `MoneyBag02` | nómina / dinero |
| `employee` | `UserAdd01` | alta / onboarding empleado |
| `evaluation` | `UserStar01` | evaluación / rendimiento |
| `task` | `CheckList` | tarea / checklist |
| `process` | `AiChip` | motor IA procesa |
| `configure` | `Configuration01` | configurar el motor |
| `automate` | `WorkflowSquare01` | proceso / automatización (Smart Process) |
| `build` | `Layout01` | construir app / panel (Forge) |
| `question` | `BubbleChatQuestion` | hace preguntas |
| `certificate` | `Certificate01` | entregable legal / cierre |
| `mobile` | `DeviceAccess` *(telegram, confirmar)* | aviso a móvil / Telegram |
| `monitor` | `Binoculars` | vigilar / competencia |
| `agent` | `AiBrain01` | agente IA / Teamwork |

> Al implementar, confirma los nombres marcados *(…)*; el resto está verificado en
> el paquete instalado.

### 1.4 Catálogo de "detalle" (artefacto → widget de Storybook)

El **detalle** es un artefacto visual más rico que el icono+etiqueta. Reutiliza
los widgets ya existentes en `src/stories/neo/widgets/`:

| Tipo de detalle | Widget | Cuándo |
|---|---|---|
| `spreadsheet` | `SpreadsheetWidget` | subir/ver un excel, inventario |
| `invoice` | `InvoiceWidget` | factura individual |
| `document` | `FileWidget` / `ArtifactCard` | contrato / doc / artifact |
| `signature` | `SignatureWidget` | firma electrónica |
| `chart` | `ChartWidget` | análisis, cash-flow, correlación |
| `dashboard` | `DashboardWidget` | visión en tiempo real |
| `stat` | `StatWidget` | KPI / número clave |
| `calendar` | `CalendarWidget` / `ScheduleWidget` | turnos, fichajes, vacaciones |
| `kanban` | `KanbanWidget` | proyectos / pipeline |
| `inbox` | `InboxWidget` | tickets, correos, multicanal |
| `browser` | `BrowserWidget` | web/landing publicada |
| `storefront` | `StorefrontWidget` | tienda online |
| `pos` | `POSWidget` | caja / TPV |
| `loyalty` | `LoyaltyCardWidget` | tarjeta / monedero |
| `pricing` | `PricingWidget` | planes / contratos de soporte |
| `comparison` | `ComparisonWidget` | comparar proveedores/opciones |
| `jobpost` | `JobPostWidget` | vacante publicada |
| `timeline` | `TimelineWidget` | onboarding / pasos |
| `toast` | `ToastWidget` | alerta / notificación |
| `dropzone` | `DropzoneWidget` | arrastrar archivos |
| `—` | — | solo icono + micro-etiqueta |

### 1.5 Plantilla de tabla por flujo

```
**Mensaje**: <una línea> · **Zoom**: micro/medio/macro · **Módulos**: …
| # | Step (etiqueta) | Módulo AiKit | Icono | Detalle |
| ▶ | <el problema>   | —            | —     | —       |
| 1 | <Etiqueta>      | <Módulo>     | <alias> | <tipo o —> |
| ● | <el resultado>  | —            | (meta) | —       |
```

---

## 2. Galería "Tu mayor marrón" · Controla · zoom **micro**

### 2.1 Contabilidad ✅ *(construido — composición `Accounting`, mini-película de 5 actos)*

**Mensaje**: facturas → análisis de velocidad de cobro → cierre del trimestre.
Adaptación del **§8 del pitch** ("facturas y velocidad de cobro").
**Zoom**: micro · **Módulos**: Udon (acto 1) · DocuSense · Junction · Foresight ·
Glimpse · Action Runner · Forge

`Accounting` es una **mini-película de 4 actos** encadenados con fades cortos
(`@remotion/transitions`, ver `src/remotion/AccountingFlowVideo.tsx`), **ágil
(~13 s)**. El grid es **solo el acto 2** (el "recorrido"), en modo *teaser*. **Sin
chat**: la ejecución la cuenta el razonamiento de Foresight (no todos los flujos
llevan chat).

1. **Facturas → Udon** · `InvoiceIntakeScene` (`InvoiceIntake` suelto): las
   tarjetas-factura vuelan y son **absorbidas por el módulo Udon** (su icono de
   marca en un núcleo con glow azul que late). Sin contador, sin carpeta — §8.1
   "Udon se conecta con Odoo". Determinista (hash por índice, sin `Math.random`).
2. **Proceso (teaser, en ESCALERA)** · `ConceptFlowVideo` (`cierre-trimestre`,
   `teaserBeats={1}`): la cámara da **UN paso** (DocuSense · "Extrae", icono de marca
   + label custom) y se **abre a la foto global** del grid, que aquí serpentea con
   un **serpenteo estándar** (`colSpan 2`, grid 5×5; placas al ancho del contenido).
   Cruza Controla → Delega → Construye.
3. **Foresight analiza** · `AccountingLoopScene` (`AccountingLoop` suelto):
   `NeoReasoning` que avanza por frame (cruza datos → patrón "las del miércoles se
   cobran antes" → mide correlación → informe) + el badge del módulo **Foresight**.
   Es el corazón del §8 (§8.4).
4. **Cierre** · `AccountingCloseScene` (`AccountingClose` suelto): chip **"Informe
   creado con Glimpse"** (§8.5) + `StatWidget` (3 días → 5 min) + `SignatureWidget`
   (sello firmado). El titular "Trimestre cerrado" se inyecta **fuera del vídeo**
   (ver `cabeceras-extraidas.md`). Cómodo, rápido y seguro.

**Acto 2 — grid `cierre-trimestre`** (cada Icono = icono de marca del módulo):

| # | Step | Módulo AiKit | Icono | Familia |
|---|---|---|---|---|
| ▶ | Facturas ya en Udon (viene del acto 1) | — | — | — |
| 1 | Extrae | DocuSense | `docusense` | Controla |
| 2 | Combina | Junction | `junction` | Controla |
| 3 | Analiza | Foresight | `foresight` | Controla |
| 4 | Presenta | Glimpse | `glimpse` | Controla |
| 5 | Registra | Action Runner | `actionRunner` | Delega |
| 6 | Cierre | Forge | `forge` | Construye |
| ● | Trimestre cerrado | — | meta | — |

> **Patrón "mini-película multi-acto"**: cuando un flujo gana contando una
> secuencia (problema → personalización → recorrido → detalle → cierre), encadena
> escenas con `TransitionSeries` + `fade`. Reutiliza escenas existentes
> (`InvoiceIntakeScene`, chat con `NeoMessage`, `ConceptFlowVideo` para el grid) y
> construye solo las que falten. El grid se usa **para el recorrido**, en modo
> **teaser** (`teaserBeats`): un paso + foto global, sin recorrerlo entero.
> Mantén el total **ágil** (~15–16 s): fades cortos (~8f) y escenas comprimidas.
> Duración total = Σ actos − (nº transiciones)×solape. Registra cada acto suelto en
> `Root.tsx` para iterarlo aislado. `AccountingFlowVideo` es la referencia.

### 2.2 E-Commerce ✅ *(construido — composición `Ecommerce`, mini-película de 6 actos)*

**Mensaje**: tienda física → web (AURELE) conectada al inventario, lista para vender.
**Zoom**: micro · **Módulos**: DocuSense · Junction · Feedback Loop · Forge ·
Action Runner · Heartbeat

`Ecommerce` es una **mini-película de 6 actos** encadenados con fades cortos
(`TransitionSeries`, ver `src/remotion/EcommerceFlowVideo.tsx`), **~22 s**. El grid
es **solo el acto 3** (el "recorrido"), en modo *teaser*. Toda la historia gira en
torno a una tienda de ropa llamada **AURELE** para casar con `StoreBuild`:

1. **El lío de plataformas** · `PlatformChaosScene`: "Tu tienda" en el centro
   rodeada de un enjambre de opciones que se amontonan y tiemblan —plataformas
   reales (Shopify, WooCommerce, PrestaShop, Magento, BigCommerce, Wix,
   Squarespace) mezcladas con su ruido técnico (plugins, themes, extensiones,
   hosting, pasarela de pago, SSL, mantenimiento)— con etiquetas de fricción
   (semanas · €€€ · técnico). El "dolor": elegir e implementar es lento y caro.
2. **Inventario → DocuSense** · `InventoryIntakeScene` (sobre `IntakeScene`):
   `inventario.xlsx` (un `SpreadsheetWidget`) vuela y es **absorbido por DocuSense**,
   representado como una **pila cuadrada neumórfica** (`OperatingModuleTile`) que al
   recibir el documento **se expande hacia la derecha** mostrando "Procesando
   documentos…" con shimmer y el icono reacciona; del módulo **brotan fichas de
   producto** (arriba-izquierda) → el inventario en crudo se vuelve catálogo. Ver
   `operations-manual.md` §2 (pila cuadrada) para el componente.
3. **Proceso (teaser)** · `ConceptFlowVideo` (`montar-tienda`, `teaserBeats={1}`):
   la cámara da **UN paso** (DocuSense · "Catálogo") y se **abre a la foto global**
   del grid; el resto emerge al alejarse. Cruza Controla → Delega → Construye.
4. **Chat (personalizar)** · `EcommerceChatScene` (gemela de `AccountingChat`):
   **Feedback Loop** pregunta lo justo para configurar la tienda (su nombre,
   "AURELE"; el envío gratis), y respondes por chat. Header de marca del módulo.
5. **Forge construye el código** · `StoreTerminalScene` *(nuevo)*: un terminal oscuro
   muestra `aikit forge build aurele` en directo — componentes JSX (Hero, ProductGrid),
   CSS de marca, stock conectado desde DocuSense — hasta el sello ✓ **AURELE lista**.
   Es el "cómo" antes del "resultado". Misma estética que `CodeTerminalVideo` (tarjeta
   oscura, COLORS, motion-blur); cierra con el chip "Construida con Forge" para enlazar
   con el acto siguiente. ~3,6 s.
6. **Forge monta la web** · `StoreCreateScene`: reusa **`StoreBuild`** (la web que
   se construye sola en un navegador) **time-remapeada** (~17 s → ~5,5 s) para que
   AURELE aparezca terminada en un acto, con el sello **"Creada con Forge"**.

**Acto 3 — grid `montar-tienda`** (cada Icono = icono de marca del módulo):

| # | Step | Módulo AiKit | Icono | Familia |
|---|---|---|---|---|
| ▶ | Catálogo ya en DocuSense (viene del acto 2) | — | — | — |
| 1 | Catálogo | DocuSense | `docusense` | Controla |
| 2 | Conecta | Junction | `junction` | Controla |
| 3 | Pregunta | Feedback Loop | `feedbackLoop` | Delega |
| 4 | Monta web | Forge | `forge` | Construye |
| 5 | Publica | Action Runner | `actionRunner` | Delega |
| 6 | Stock | Heartbeat | `heartbeat` | Delega |
| ● | Tienda online viva | — | meta | — |

> Variante del patrón "mini-película multi-acto" de §2.1, con tres giros propios:
> (a) un **acto de problema** dedicado (`PlatformChaos`) que abre con el dolor;
> (b) un **acto de construcción** (`StoreTerminal`) que muestra cómo Forge levanta
> el código antes de enseñar la web terminada — el "cómo" antes del "resultado";
> (c) el clímax **reutiliza una composición existente** (`StoreBuild`) embebida y
> time-remapeada en vez de un widget — ver `StoreCreateScene` (patrón de
> `frameOverride`, tomado de `StorePitchVideo`). El KPI/storefront neumórfico
> quedó descartado a favor de "enseñar una web real montándose".

### 2.3 Email Marketing ✅ *(construido — composición `EmailMarketing`, mini-película de 5 actos)*

**Mensaje**: de campañas a mano a un funnel que se nutre (y vende) solo.
**Zoom**: micro · **Módulos**: DocuSense · Foresight · Smart Process · Forge ·
Action Script · Heartbeat

`EmailMarketing` es una **mini-película de 5 actos** encadenados con fades cortos
(`TransitionSeries`, ver `src/remotion/EmailFlowVideo.tsx`), **~23 s**. El grid es
**solo el acto 3** (el "recorrido"), en modo *teaser*:

1. **El borrador atascado** · `EmailGrindScene`: en primer plano, un compositor de
   correo que no avanza (asunto que se teclea y se borra, "Para: 1.240 contactos ·
   sin segmentar", botón Enviar apagado, "borrador · 3 semanas sin enviar"); detrás,
   una **pila en escalera** de herramientas reales (Mailchimp, HubSpot, Klaviyo,
   Brevo, Sendinblue, ActiveCampaign) y arriba el tiempo perdido que sube.
   *Representación propia — NO reusa el `ChaosScene` de E-Commerce (ver §6).*
2. **Contactos dispersos → DocuSense** · `ContactsMergeScene`: cuatro fuentes
   (Excel, CRM, web, email) en las esquinas emiten contactos que **viajan y
   convergen** en una lista central que se llena (contador → 1.240) con el sello de
   **DocuSense**. *Representación propia — NO reusa el `IntakeScene` de absorción.*
3. **Proceso (teaser, placas ANCHAS)** · `ConceptFlowVideo` (`campana-email`,
   `teaserBeats={1}`): la cámara da **UN paso** (DocuSense · "Contactos") y se
   **abre a la foto global** del grid, un **serpenteo estándar** (`colSpan 2`, grid
   5×5; placas al ancho del contenido). Cruza Controla → Construye → Delega.
4. **Smart Process compone** · `EmailComposeScene` (`EmailCompose` suelto): en vez de
   un chat, un **terminal** muestra a **Smart Process** componiendo la campaña
   (segmenta inactivos 90d → diseña la secuencia de 3 pasos → conecta el contenido de
   Forge → programa envíos), con sello "Compuesta con Smart Process". Reskin de
   `StoreTerminalScene` (misma carta oscura + shutter-blur).
5. **La campaña, viva** · `CampaignLiveScene`: **Action Script** la envía y nutre
   24/7 (secuencia Bienvenida → Recordatorio → Promo, con checks que aparecen solos)
   y **Foresight** mide — `StatWidget` (apertura 12 % → 34 %) + `ChartWidget`
   (ventas por campaña subiendo).

**Acto 3 — grid `campana-email`** (cada Icono = icono de marca del módulo):

| # | Step | Módulo AiKit | Icono | Familia |
|---|---|---|---|---|
| ▶ | Contactos ya en DocuSense (viene del acto 2) | — | — | — |
| 1 | Contactos | DocuSense | `docusense` | Controla |
| 2 | Segmenta | Foresight | `foresight` | Controla |
| 3 | Diseña | Smart Process | `smartProcess` | Construye |
| 4 | Redacta | Forge | `forge` | Construye |
| 5 | Envía | Action Script | `actionScript` | Delega |
| 6 | Nutre | Heartbeat | `heartbeat` | Delega |
| ● | Funnel que se nutre solo | — | meta | — |

> **Variedad entre flujos (lección):** los actos 1-2 NO comparten coreografía con
> E-Commerce. El grid, el chat y el cierre pueden parecerse (es la "firma" del
> sistema), pero el *problema* y la *captura* tienen un concepto visual propio en
> cada pieza, porque en la web se ven varias y repetir la misma animación queda
> pobre. `ChaosScene`/`IntakeScene` siguen disponibles como base genérica (los usa
> E-Commerce) — reskinea o reinventa antes de reusarlos. Ver `operations-manual.md` §6.

### 2.4 Atención al cliente ✅ *(construido — composición `Support`, mini-película de 5 actos)*

**Mensaje**: del caos multicanal a un cliente atendido al momento, casi solo.
**Zoom**: micro · **Módulos**: Hotpot · Smart Process · Foresight · Skill Hub ·
Heartbeat · Action Runner

`Support` es una **mini-película de 5 actos** encadenados con fades cortos
(`TransitionSeries`, ver `src/remotion/SupportFlowVideo.tsx`), **~22 s**. El grid es
**solo el acto 3** (el "recorrido"), en modo *teaser*:

1. **La lluvia de mensajes** · `MessageStormScene`: consultas de todos los canales
   (WhatsApp, email, chat, teléfono, Instagram) **caen y se amontonan** sin
   responder; contador "47 sin responder". *Representación propia — concepto de
   caída/gravedad, distinto del enjambre y del borrador atascado (ver §6).*
2. **Conecta los canales → Hotpot** · `ChannelsConnectScene`: cada canal se
   **enchufa** a un hub **Hotpot** (cables que se encienden con un pulso) y emerge la
   **bandeja única** (`InboxWidget`). *Representación propia — gesto de "conectar".*
3. **Proceso (teaser, placas ALTAS)** · `ConceptFlowVideo` (`soporte-cliente`,
   `teaserBeats={1}`): un paso (Hotpot · "Canales") y foto global del grid, que
   serpentea **compacto** (`colSpan 2`, grid 5×5 → la silueta más compacta, triaje
   denso). Cruza Controla → Construye → Delega.
4. **Chat (la IA atiende)** · `SupportChatScene`: un **cliente** pregunta ("¿dónde
   está mi pedido?") y **Action Runner** responde y resuelve al instante.
5. **Cliente atendido** · `SupportResolvedScene`: primera respuesta 3 h → 30 s
   (`StatWidget`) + cliente feliz (`TestimonialWidget`); sello **Skill Hub** ("68%
   sin tocar nada") + **Foresight** aprende.

**Acto 3 — grid `soporte-cliente`** (cada Icono = icono de marca del módulo):

| # | Step | Módulo AiKit | Icono | Familia |
|---|---|---|---|---|
| ▶ | Canales ya conectados (viene del acto 2) | — | — | — |
| 1 | Canales | Hotpot | `hotpot` | Controla |
| 2 | Tickets | Smart Process | `smartProcess` | Construye |
| 3 | Prioriza | Foresight | `foresight` | Controla |
| 4 | Resuelve | Skill Hub | `skillHub` | Construye |
| 5 | Escala | Heartbeat | `heartbeat` | Delega |
| 6 | Responde | Action Runner | `actionRunner` | Delega |
| ● | Cliente atendido | — | meta | — |

> Tercer flujo que aplica la lección de variedad (§6): actos 1-2 con concepto visual
> propio. Cierre con `TestimonialWidget` para no repetir el remate de los otros.

---

## 3. Galería "Qué se te da mal" · Delega · zoom **medio**

### 3.1 Planificación de horarios ✅ *(construido — composición `Scheduling`, mini-película de 6 actos)*

**Mensaje**: de cuadrar turnos a mano a planillas semanales vivas por chat.
**Zoom**: medio · **Módulos**: DocuSense · Junction · Feedback Loop · Smart
Process · Foresight · Teamwork · Glimpse · Heartbeat · Action Runner

`Scheduling` es una **mini-película de 6 actos** encadenados con fades cortos
(`TransitionSeries`, ver `src/remotion/SchedulingFlowVideo.tsx`), **~31 s**. El
grid es **solo el acto 4** (el "recorrido"), en modo *teaser*:

1. **El cuadrante manual se rompe** · `ShiftChaosScene`: una planilla semanal con
   solapes, huecos, notas de WhatsApp, vacaciones y restricciones de contrato. El
   caos aquí es una **tabla que se contradice**, distinto de lluvia/enjambre/chat.
2. **Excel/ERP → plantilla única** · `StaffImportScene`: `empleados.xlsx` y el
   ERP/RRHH viajan hacia un hub **DocuSense + Junction**; sale una lista limpia con
   disponibilidad, contratos y ausencias.
3. **Reglas (panel)** · `SchedulingRulesScene` (`SchedulingRules` suelto): en vez de
   un chat, un **panel** tarjeta+lista donde **Feedback Loop** recoge y **confirma**
   las reglas una a una con check ("nadie más de 5 días seguidos", "refuerza viernes
   tarde", "respeta contratos y vacaciones"). Reskin del patrón de `StaffImportScene`.
4. **Proceso (teaser)** · `ConceptFlowVideo` (`planificacion-horarios`,
   `teaserBeats={1}`): un paso (DocuSense · "Plantilla") y foto global del grid
   (sigue **serpenteando**, es el más largo: 9 módulos). Cruza Controla → Construye → Delega.
5. **La plantilla** · `ScheduleTemplateScene`: la planilla semanal se rellena sola
   (reusa `ScheduleFillVideo` time-remapeada con `frameOverride`, recortada a su
   tarjeta) **centrada** como héroe único, con la pill "Plantillas creadas con
   **Glimpse**" encima. Fondo limpio (sin gris). **Sin chat**: la planilla
   rellenándose es la prueba.
6. **Resultados (piloto automático)** · `ScheduleResultsScene`: hermano del cierre de
   Email (`CampaignLiveScene`). Sello **Heartbeat** ("En piloto automático") + una
   **rutina de 4 pasos** que se completan solos (Publica la semana · Avisa al equipo ·
   Cubre bajas · Re-cuadra cambios) + 2 pruebas: `StatWidget` (conflictos 14→0) y
   `ChartWidget` (cobertura al 100%, `valueFormat="percent"`). Los titulares se inyectan
   fuera del vídeo (`cabeceras-extraidas.md`).

**Acto 4 — grid `planificacion-horarios`** (cada Icono = icono de marca del módulo):

| # | Step | Módulo AiKit | Icono | Familia |
|---|---|---|---|---|
| ▶ | Plantilla limpia (viene del acto 2) | — | — | — |
| 1 | Plantilla | DocuSense | `docusense` | Controla |
| 2 | ERP | Junction | `junction` | Controla |
| 3 | Reglas | Feedback Loop | `feedbackLoop` | Delega |
| 4 | Reparte | Smart Process | `smartProcess` | Construye |
| 5 | Conflictos | Foresight | `foresight` | Controla |
| 6 | Ajusta | Teamwork | `teamwork` | Delega |
| 7 | Planillas | Glimpse | `glimpse` | Controla |
| 8 | Avisos | Heartbeat | `heartbeat` | Delega |
| 9 | Cambios | Action Runner | `actionRunner` | Delega |
| ● | Planilla semanal viva | — | meta | — |

> Aplica la lección de variedad (§6): actos 1-2 propios. `ScheduleFillVideo` queda
> como composición standalone (`ScheduleFill`) y como pieza embebible mediante
> `frameOverride`.

### 3.2 Reclutamiento y onboarding

**Mensaje**: de vacante a empleado dado de alta, casi solo.
**Módulos**: Forge · Foresight · Action Script · Signature

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Necesitas contratar | — | — | — |
| 1 | Redacta y publica vacante | Forge | `lead` | `jobpost` |
| 2 | Candidatos aplican | — | `employee` | — |
| 3 | Filtra CVs, agenda entrevistas | Foresight | `evaluation` | — |
| 4 | Lanza onboarding (tareas, docs) | Action Script | `task` | `timeline` |
| 5 | Firma + ficha de empleado | Action Runner | `signature` | `signature` |
| ● | Nuevo fichaje en marcha | — | meta | — |

### 3.3 Evaluación de rendimiento

**Mensaje**: campañas 360º, patrones y planes de mejora.
**Módulos**: Smart Process · Foresight · Feedback Loop

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Evaluar al equipo es tedioso | — | — | — |
| 1 | Crea campaña de evaluación | Smart Process | `evaluation` | — |
| 2 | Envía feedback 360º | Action Script | `email` | — |
| 3 | Compila y detecta patrones | Foresight | `chart` | `chart` |
| 4 | Plan de mejora individual | Feedback Loop | `task` | — |
| ● | Equipo que crece | — | meta | — |

### 3.4 Control de asistencia y vacaciones

**Mensaje**: fichajes, ausencias y vacaciones en un panel vivo.
**Módulos**: Action Runner · Heartbeat · Junction

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | ¿Quién está hoy? ¿Quién libra? | — | — | — |
| 1 | Fichan (app / chat / navegador) | Action Runner | `calendar` | — |
| 2 | Dashboard en tiempo real | Glimpse | `dashboard` | `dashboard` |
| 3 | Cruza con planificación, avisa | Heartbeat | `alert` | — |
| 4 | Aprobar vacaciones por chat | — | `vacation` | — |
| 5 | Refleja en nóminas y calendario | Junction | `connect` | — |
| ● | Todo cuadrado solo | — | meta | — |

### 3.5 Compras y aprovisionamiento

**Mensaje**: reposición automática con el mejor proveedor.
**Módulos**: Heartbeat · Smart Process · Foresight · Action Runner

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Quedarte sin stock cuesta dinero | — | — | — |
| 1 | Conecta proveedores | Junction | `supplier` | — |
| 2 | Monitoriza inventario | Heartbeat | `stock` | — |
| 3 | Bajo mínimo → pide cotización | Smart Process | `purchase` | — |
| 4 | Compara precios, informe | Foresight | `chart` | `comparison` |
| 5 | Decides → orden de compra | Action Runner | `task` | — |
| ● | Sincronizado con todo | — | meta | — |

### 3.6 Gestión documental inteligente

**Mensaje**: documentos que se clasifican, leen y archivan solos.
**Módulos**: DocuSense · Action Runner · Signature · Smart Process

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Facturas, contratos e imágenes sueltas | — | — | — |
| 1 | Clasifica por tipo/proveedor | DocuSense | `classify` | — |
| 2 | Pide documento faltante | Action Script | `email` | — |
| 3 | Lee y extrae datos (IA) | DocuSense | `read` | `invoice` |
| 4 | Firma por chat | Action Runner | `signature` | `signature` |
| 5 | Archiva y notifica (reglas) | Smart Process | `classify` | — |
| ● | Archivo siempre al día | — | meta | — |

### 3.7 Onboarding con documentos bajo demanda

**Mensaje**: de 78 min a 75 s por contratación.
**Módulos**: Forge · Signature · Action Script

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Generar contrato, políticas, NSS… | — | — | — |
| 1 | Genera docs desde plantilla | Forge | `contract` | `document` |
| 2 | Envía con firma electrónica | Action Runner | `signature` | `signature` |
| 3 | Archiva y avisa a nóminas | Action Script | `classify` | — |
| 4 | Paquete de bienvenida día 1 | — | `employee` | — |
| ● | **78 min → 75 s** | — | meta | `stat` |

### 3.8 Punto de venta minorista

**Mensaje**: TPV que funciona con o sin internet, en cualquier dispositivo.
**Módulos**: Forge · Action Runner · Junction

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Montar una caja es complicado | — | — | — |
| 1 | Conecta productos/precios | Junction | `stock` | — |
| 2 | Cajeros abren con NIP | — | `pos` | `pos` |
| 3 | Con o sin internet | Smart Process | `connect` | — |
| 4 | Descuentos/reembolsos por chat | Action Runner | `chat` | — |
| 5 | Cualquier dispositivo | — | `pos` | — |
| ● | Vendes siempre | — | meta | — |

### 3.9 Lealtad y venta omnicanal

**Mensaje**: puntos, monedero y click&collect, conectado a todo.
**Módulos**: Smart Process · Action Script · Junction

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Fidelizar sin herramientas caras | — | — | — |
| 1 | Crea programa por chat | Smart Process | `loyalty` | `loyalty` |
| 2 | Puntos y monedero | — | `wallet` | — |
| 3 | Click & collect | Action Runner | `ecommerce` | — |
| 4 | Promos automáticas | Action Script | `campaign` | — |
| 5 | Conecta inventario/CRM/email | Junction | `connect` | — |
| ● | Clientes que vuelven | — | meta | — |

### 3.10 Soporte al cliente

**Mensaje**: tickets multicanal, priorizados y casi auto-resueltos.
**Módulos**: Hotpot · Foresight · Action Runner · Skill Hub

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Consultas por correo, chat, WhatsApp | — | — | — |
| 1 | Conecta canales → tickets | Hotpot | `support` | `inbox` |
| 2 | Borrador / resumen ejecutivo | — | `chat` | — |
| 3 | Prioriza, clasifica, sugiere | Foresight | `task` | — |
| 4 | Escala o investiga historial | Action Runner | `lead` | — |
| 5 | Base de conocimiento | Skill Hub | `faq` | — |
| ● | Cliente resuelto | — | meta | — |

### 3.11 Autoservicio y contratos de soporte

**Mensaje**: vende soporte, controla horas, el cliente se sirve solo.
**Módulos**: Forge · Heartbeat · Feedback Loop

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Vender soporte y controlarlo | — | — | — |
| 1 | Vende contratos desde la web | Forge | `pricing` | `pricing` |
| 2 | Vincula horas por ticket | Junction | `stat` | `stat` |
| 3 | Alertas de consumo/renovación | Heartbeat | `alert` | `toast` |
| 4 | Cliente cierra sus tickets | — | `task` | — |
| 5 | FAQs y artículos en el foro | Skill Hub | `faq` | — |
| ● | Menos ruido, más autoservicio | — | meta | — |

### 3.12 Automatización de marketing

**Mensaje**: campañas multi-etapa con lógica if-then, solas.
**Módulos**: Smart Process · Action Script · Foresight · Forge

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Diseña tu campaña por chat | — | `chat` | — |
| 1 | Dibuja el flujo (if-then) | Smart Process | `automate` | `kanban` |
| 2 | Genera contenido (emails, CTAs) | Forge | `email` | — |
| 3 | Segmenta la base | Foresight | `segment` | — |
| 4 | Corre 24/7 sola | Action Script | `campaign` | — |
| ● | Funnel que nutre mientras duermes | — | meta | — |

### 3.13 Calificación y enriquecimiento de leads

**Mensaje**: los mejores leads a ventas, el resto se nutre solo.
**Módulos**: Foresight · Action Script · Heartbeat · Junction

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | No todos los leads valen igual | — | — | — |
| 1 | Califica por criterios | Foresight | `lead` | — |
| 2 | Enriquece los tibios | Action Script | `segment` | — |
| 3 | Recupera carritos | Heartbeat | `ecommerce` | — |
| 4 | Recordatorios y feedback | Action Script | `email` | — |
| 5 | Conecta CRM/e-commerce/SMS | Junction | `connect` | — |
| ● | Más conversión, mismo trabajo | — | meta | — |

---

## 4. Galería "Construye" · zoom **macro** · formato **Fases**

> Patrón distinto: 4–5 **fases** fijas (Digitalizar → Conectar → Automatizar por
> chat → Flujos autónomos → Mejora continua). Mismo serpenteo, pero cada item es
> una **fase** y el "detalle" tiende a ser un panel (dashboard/kanban) que muestra
> el sistema ya montado.

### 4.1 Contratar y gestionar personal

**Módulos**: DocuSense · Junction · Action Script · Heartbeat

| # | Fase | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | RRHH en silos y papeleo | — | — | — |
| 1 | Digitalizar (plantilla, contratos) | DocuSense | `classify` | `document` |
| 2 | Conectar (nóminas, firma, chat) | Junction | `connect` | — |
| 3 | Automatizar por chat ("contrata a María") | Action Script | `chat` | — |
| 4 | Flujos autónomos (bienvenida día 1) | Heartbeat | `employee` | `dashboard` |
| ● | RRHH que se gestiona solo | — | meta | — |

### 4.2 Mejora tu funnel de ventas

**Módulos**: DocuSense · Junction · Action Runner · Heartbeat · Foresight

| # | Fase | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Clientes y datos dispersos | — | — | — |
| 1 | Digitalizar (clientes, productos) | DocuSense | `spreadsheet` | — |
| 2 | Conectar (CRM, facturación, email) | Junction | `connect` | — |
| 3 | Automatizar por chat (promos) | Action Runner | `campaign` | — |
| 4 | Flujos autónomos (carritos, alertas) | Heartbeat | `alert` | `kanban` |
| 5 | Mejora continua (qué convierte) | Foresight | `chart` | `chart` |
| ● | Funnel optimizado | — | meta | — |

### 4.3 Una tienda que se gestiona sola

**Módulos**: DocuSense · Junction · Action Runner · Smart Process · Foresight

| # | Fase | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Excel con 47 pestañas | — | — | — |
| 1 | Digitalizar (productos, precios) | DocuSense | `stock` | — |
| 2 | Conectar (POS + e-comm + conta) | Junction | `connect` | `dashboard` |
| 3 | Automatizar por chat (ventas) | Action Runner | `chat` | — |
| 4 | Flujos autónomos (reposición) | Smart Process | `automate` | — |
| 5 | Mejora continua (predice demanda) | Foresight | `predict` | `chart` |
| ● | Tienda en piloto automático | — | meta | — |

### 4.4 Un cliente feliz que no te llama nunca

**Módulos**: DocuSense · Junction · Action Runner · Skill Hub · Foresight

| # | Fase | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Tickets por correo, chat, WhatsApp | — | — | — |
| 1 | Digitalizar (clasifica y prioriza) | DocuSense | `support` | `inbox` |
| 2 | Conectar (contratos, KB, portal) | Junction | `connect` | — |
| 3 | Automatizar por chat (estado/upsell) | Action Runner | `chat` | — |
| 4 | Flujos autónomos (FAQs 40%) | Skill Hub | `faq` | — |
| 5 | Mejora continua (tema/sentimiento) | Foresight | `chart` | `chart` |
| ● | Cliente feliz, silencio en soporte | — | meta | — |

---

## 5. Ideas de uso avanzado *(guion breve — propuestas cortas)*

> Flujos cortos (3–4 items). Ideales como "remate" o piezas sueltas.

### 5.1 Reporte semanal por Telegram

**Módulos**: Heartbeat · Glimpse · Hotpot

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Cada viernes, sin moverte | — | — | — |
| 1 | Se despierta (viernes) | Heartbeat | `calendar` | — |
| 2 | Compila el reporte | Glimpse | `chart` | `chart` |
| 3 | Lo envía a tu móvil | Hotpot | `mobile` | — |
| ● | Informe en el bolsillo | — | meta | — |

### 5.2 Hoja de servicio con botón de pago

**Módulos**: Forge · Action Runner

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | Cobrar un servicio a medida | — | — | — |
| 1 | Genera la hoja personalizada | Forge | `document` | `document` |
| 2 | Añade botón de pago | Action Runner | `pos` | — |
| 3 | Publica el enlace | — | `web` | `browser` |
| ● | Cobrado sin fricción | — | meta | — |

### 5.3 Análisis de caja y financiación

**Módulos**: SQLSense · Foresight · Glimpse

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | ¿Cómo está mi caja? | — | — | — |
| 1 | Lee la caja | SQLSense | `database` | — |
| 2 | Cash-flow + deep research | Foresight | `chart` | `chart` |
| 3 | Opciones de financiación | Glimpse | `dashboard` | `comparison` |
| ● | Decisión con datos | — | meta | — |

### 5.4 Monitorización de la competencia

**Módulos**: Heartbeat · Hotpot · Foresight

| # | Step | Módulo AiKit | Icono | Detalle |
|---|---|---|---|---|
| ▶ | ¿Qué hace la competencia? | — | — | — |
| 1 | Vigila tiendas rivales | Heartbeat | `monitor` | — |
| 2 | Detecta ofertas/precios nuevos | Hotpot | `predict` | — |
| 3 | Informe y alertas | Foresight | `alert` | `toast` |
| ● | Siempre un paso por delante | — | meta | — |

---

## 6. Notas y pendientes

- **Guion incompleto** en el documento original: *Email Marketing*, *Atención al
  cliente* (solo "etc…") e *Ideas de uso avanzado* (descripciones breves). Las
  tablas de §2.3, §2.4 y §5 son **propuestas** a validar con Marketing.
- **Iconos a confirmar** al implementar: `signature` (`License`/`PencilEdit01`),
  `mobile`/Telegram (`DeviceAccess`). El resto está verificado en
  `@hugeicons-pro/core-stroke-standard`.
- **Detalle = widget**: antes de inventar un artefacto nuevo, comprueba si ya
  existe en `src/stories/neo/widgets/` (§1.4). Si falta (p. ej. un widget de
  "reporte Telegram"), créalo primero en Storybook y enlázalo aquí.
- **Construcción**: cada flujo = un `concept` en `concepts.ts` + wrapper sobre
  `ConceptFlowVideo`. Mantén **1 flecha entre items** y grid impar para terminar
  en la meta arriba-derecha.
- Los flujos de §4 (Construye) usan **fases** con etiquetas más largas; si no
  caben en `colSpan 2`, sube a `colSpan 3` y ajusta el grid (la regla de 1 flecha
  se mantiene).
