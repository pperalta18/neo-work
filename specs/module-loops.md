# Module loops — 10 clips en bucle perfecto (módulos seleccionables, new-landing)

> **Cárgame al inicio de cualquier tarea sobre los 10 clips de los módulos**
> (junto a [`operations-manual.md`](./operations-manual.md) y
> [`flow-blueprints.md`](./flow-blueprints.md)). Soy el **contrato** de estas
> animaciones y el sitio donde viven sus reglas. **Mantenme vivo**: al iterar un
> clip, actualiza su fila y sus notas aquí.

Brief de origen (concepto cerrado con Iván, 2026-06-10): los dos **módulos
seleccionables** de la new-landing (no los 5 flujos del Grupo 1). Cada uno tiene 5
elementos → **10 animaciones nuevas**, más pequeñas y simples que los flujos. En el
CMS las alimenta el bloque `modules` (label + descripción por tab; copy **redactado**,
ver §10).

**Eje que separa los dos módulos — el alcance:**

- **Módulo 1 · «Tus tareas del día a día»** — *una tarea, un área*. **UN solo
  cuadro/objeto** que se transforma. Bucles ~4 s.
- **Módulo 2 · «Tu negocio funcionando conectado»** — *una chispa, una cadena entre
  áreas*. **VARIOS cuadros conectados por cables** + un **pulso** que recorre el
  circuito y vuelve a su origen. Bucles ~5,6 s.
- **Regla visual que lo hace evidente**: aunque no se lea el título, se *ve* «una
  cosa» (M1) vs «un sistema» (M2).

Producción aquí (Remotion); el CMS de la landing consume los MP4. Estética y
matemática comunes en [`src/remotion/modules/loopKit.tsx`](../src/remotion/modules/loopKit.tsx).
Referencias = `M1Stock` (arquetipo M1) y `M2SaleChain` (arquetipo M2 en bucle).
`M2Onboarding` **dejó de ser un loop** (Iván lo reconvirtió en una narrativa lineal
de 4 beats — la idea del anillo abstracto «no encajaba»; ver §2 «Excepción» y §6 2.1).

---

## 1. Las 10 de un vistazo

> **Rediseño Tailark (2026-06-11)**: los 10 se rehicieron desde cero con el lenguaje
> **HÍBRIDO** (placa neumórfica AiKit + **UI interna portada de Tailark Pro**), cada uno
> sobre una **base Tailark distinta** (máxima variedad). Sustituyen a la versión
> «abstracta» previa (glifos SVG a mano), que se conserva en el folder **`Modulos-V1`**
> de `Root.tsx` (ficheros `*V1.tsx`) sólo para comparación lado a lado en Studio. Las
> primitivas compartidas viven en el kit (`TailarkCard`, `DocChip`, `StateChip`,
> `AvatarChip`, `MetricBar`). Verificado con stills (look + costura) y `tsc -b`.

| # | id (Root) | Fichero | Mód. | Base Tailark | Mecanismo (único por clip) | Estado |
|---|---|---|---|---|---|---|
| 1.1 | `ModAbsences` | `M1Absences.tsx` | M1 | `calendar` | **mini-película de 3 actos (NO loop)**: montón de peticiones de vacaciones → `OperatingModuleTile` (Action Runner) «Analizando conflictos» → marcador Aprobadas·A revisar·Rechazadas. Tarjeta de solicitud = placa neumórfica por nombre (sin borde). Loop previo en `M1AbsencesLoop.tsx` | ✅ |
| 1.2 | `ModInvoices` | `M1Invoices.tsx` | M1 | `flow` + `document-pdf/xlx/csv` | **arco CAOS→ORDEN, haz SIMÉTRICO**: flujo continuo de facturas que entran por las 2 ramas izquierdas → DocuSense las **ingiere** por las líneas que se encienden, **enderezándolas** → salen clasificadas y **divergen** a **2 carpetas macOS en blanco** «Compras·Ventas» (pulso + ✓). **Bandeja de entrada VIVA**: el ciclo de vida de cada factura empieza con una fase `stack` — aparece por DEBAJO en el origen de la rama, asciende en la pila (`RISE`) y la de la cima se despega hacia DocuSense; con `LIFE == DUR` hay siempre 2-3 docs ascendiendo a distintas alturas → la línea nace de un montón vivo, nunca «del aire» NI estático (Iván: una pila fija «se ve artificial»). **DocuSense sobre placa neumórfica** (`DocuSensePlate`, `elevation`) → el icono de marca es transparente y el doc en proceso asomaba por debajo; la placa lo oculta | ✅ |
| 1.3 | `ModStock` | `M1Stock.tsx` | M1 | `uptime` | **3 beats, sin placa de fondo, estático** (`breathe={false}`): tarjeta de stock + `MetricBar` se agota verde→rojo → la **placa «módulo en funcionamiento»** (`OperatingModuleTile`·Heartbeat, "Reponiendo stock") **aparece** (fade-in)→abre→cierra→**desaparece** (fade-out) → rellena a lleno + ✓ | ✅ |
| 1.4 | `ModTickets` | `M1Tickets.tsx` | M1 | `kanban` | **3 actos, sin placa de fondo (180 f)**: (1) CAOS — un montón de tickets cae sobre un **Kanban real** (cols Alta/Media/Baja, flat) y se amontona SIN orden (solapados/rotados, sin prioridad); (2) caídos todos, la placa **`OperatingModuleTile`** de **Smart Process** APARECE (fade-in, cerrada), se abre («Priorizando tickets») + barrido que asigna prioridad (franja+chip); (3) ORDEN — las cards se enderezan a su columna; ✓ «resuelto» + la placa cierra y DESAPARECE (fade-out) → tablero vacío = frame 0. **Cards estándar (sin bisel)** | ✅ |
| 1.5 | `ModCart` | `M1Cart.tsx` | M1 | `payment` | **3 momentos (150f), sin recuadro de fondo**: ABANDONO (checkout Email+tarjeta+CVV apagado/gris + **notificación** «Compra sin terminar · 48,90 €» abajo, no el sello atravesado) → EJECUCIÓN (placa **`OperatingModuleTile`**·Action Script «Recuperando carrito» + shimmer rellena los campos) → PAGO (botón→KIT_BLUE→«✓ Pagado», ✓ **inline** en el botón) → relevo a carrito nuevo gris. **La tarjeta-checkout es NEUMÓRFICA** (`elevation` raised, mismo lenguaje que la notificación/botón): sin ring de contorno ni esquina sup-der biselada — NO usa `TailarkCard` (Iván: «fuera el borde negro y el radius grande») | ✅ |
| 2.1 | `ModOnboarding` | `M2Onboarding.tsx` | M2 | `actionnable` (firma) | **NO es loop** (excepción §2): narrativa de 4 beats encadenados con cross-fades — FIRMA (porte Tailark `actionnable` «Signatures Approved», la firma se dibuja) → EJECUTA (`OperatingModuleTile`·Action Script «Dando de alta a María») → STEPS (`NeoReasoning`, el «3.er clip» de Accounting) → CONFIRMA (✓ «Alta completada» + pasos en verde). Loop anterior en `M2Onboarding.ringloop.bak` | ✅ |
| 2.2 | `ModSaleChain` | `M2SaleChain.tsx` | M2 | `workflow` + `currency` | árbol RAMIFICADO POS→Inventario→{Compra ‖ Factura→Cliente}; moneda € dispara, dos pulsos paralelos tras Inventario, retorno lateral al POS | ✅ |
| 2.3 | `ModDunning` | `M2DunningVideo.tsx` (3 actos) | M2 | `invoice` | **mini-película de 3 actos (NO loop)**: ① la factura con los **días corriendo** «Vence en 5 días»→«Vencida hace 8 días» + sello **VENCIDA** al agotar el plazo → ② `OperatingModuleTile` (Action Script) «Reclamando el pago» + **aviso al cliente** (sobre vuela al nodo Cliente, 🔔 + ✓) → ③ la **misma** factura, **PAGADO** (verde + ✓ + onda). Tarjeta = **placa neumórfica limpia** (sin marco rojo externo, sin ring Tailark) compartida en `dunningInvoice.tsx`; actos sueltos `ModDunningOverdue/Run/Paid` | ✅ ⚠️ |
| 2.4 | `ModMonthClose` | `M2MonthCloseVideo.tsx` (3 actos) | M2 | `calendar`+`document` | **mini-película de 3 actos (NO loop)**: ① **libro diario** «Junio» se llena de apuntes reales (día·concepto·importe) + 4 áreas conectadas (Ventas·Compras·Banco·Nóminas) le mandan un pulso → ② **`OperatingModuleTile`** (Foresight «Cerrando junio», SÓLO el cuadrado, sin etiquetas) ingiriendo los apuntes → ③ **resumen**: el libro se consolida, los totales (Ingresos·Gastos·Resultado) **cuentan** + sello ✓ «Cerrado». Piezas compartidas en `monthCloseShared.tsx`; actos sueltos `ModMonthCloseLedger/Run/Summary`; loop previo en `M2MonthCloseLoop.tsx` | ✅ |
| 2.5 | `ModLeadFunnel` | `M2LeadFunnel.tsx` | M2 | `kanban` | **misma UI que 1.4 Tickets** (columnas flat + cards con franja de color). **5 columnas** (Prospectos·Contactados·Cualificados·Convertidos·Descartados); 6 leads (Prospectos/Contactados) reposan → placa **`OperatingModuleTile`** arriba (Foresight «Reactivando leads», aparece/desaparece) + barrido de escaneo → vuelan a su columna (3 Cualificados, 2 Convertidos €✓, 1 Descartado); relevo frío entra y cierra el bucle | ✅ |

> ⚠️ **2.3 sin validar arriba**: el caso no está en el PDF (aportación del panel); el
> clip está hecho pero **falta confirmar con el equipo** que AiKit ejecuta cobros/morosidad
> antes de defenderlo. Ahora es una **mini-película de 3 actos lineales** (no un bucle) a
> la espera de esa validación.

> **Mecanismo DISTINTO por clip** (nota de producción del brief): que la tira de 10
> no se perciba repetitiva. Misma estética (kit), distinto mecanismo.

---

## 2. El principio de bucle (las reglas duras)

Cada clip es **un solo clip, loop perfecto**: el último frame encadena con el
primero sin costura. El bucle *es* el mensaje («esto funciona solo, sin parar»).

> **Excepción deliberada — `2.1 ModOnboarding` NO es un loop** (Iván, 2026-06-11). El
> anillo abstracto «no encajaba», así que el alta se cuenta como una **narrativa
> lineal** de 4 beats encadenados con cross-fades (un único MP4 cuadrado, estilo
> mini-película de flujo pero en formato del selector). No le aplican las reglas de
> costura de abajo: usa `useCurrentFrame()` + `spring` + `TransitionSeries`, no
> `useLoop`. No es el único: otros clips también se cuentan ya como mini-película (ver §1).

**Tres técnicas para cerrar sin costura:**
1. **Flujo continuo** — entran objetos por un lado mientras salen por el otro; la
   foto de la pantalla es igual al principio y al final. (1.5, 2.5) · *2.3 y 2.4 dejaron de
   ser loop: ahora son mini-películas de 3 actos lineales.*
2. **Ciclo que vuelve al reposo** — un estado se llena/transforma y regresa a su
   inicio por naturaleza. (1.2 arco caos→orden, 1.3, 1.4 caos→orden, 2.1, 2.2)
3. **Portador a través de la costura** — N «slots» solapados con ventana `WINDOW =
   SLOT + OVERLAP`, de modo que SIEMPRE hay un elemento «portador» (un globito, una
   moneda, un pulso) presente cuando el bucle cierra; el seam cae **en mitad de su
   plateau**, no entre dos. Así nunca hay un frame «vacío» y el portador cruza intacto.
   Usado en 1.1 (siempre un globito arriba) y como base del relevo moneda/pulso de M2.

**Reglas técnicas innegociables** (las impone el kit, respétalas):

- **Periódico en `DURATION` frames.** Todo movimiento es función de `frame mod DUR`.
  Usa `useLoop(DUR)`. Sin entrada/fade: todo presente desde el frame 0.
- **Determinista.** Solo `Math.sin`/`hash(n)` del kit. **Jamás** `Date`/`Math.random`
  (rompen el render y el determinismo).
- **NADA acumulado puede sobrevivir al seam.** ⚠️ *Lección del loop original de
  `M2Onboarding`* (hoy en `.ringloop.bak`, ya no es loop): un
  estado que se «engancha» (p. ej. un nodo que se queda verde «hecho» hasta el final
  de la vuelta) **revienta la costura**, porque en `frame DUR-1` está verde y en
  `frame 0` neutro → *pop*. Todo destello/acento debe **decaer a su estado de reposo
  ANTES de cerrar el periodo** (haz que en `u→1` valga lo mismo que en `u=0`).
- **Nunca un reset brusco que deshaga trabajo a la vista** (parece glitch). Un objeto
  nuevo idéntico sustituye al ya resuelto cuando este sale.
- **Cambios de texto en el seam** (p. ej. «alta de María»→«Carlos»): permitidos solo
  si coinciden con un momento que los enmascara (el pulso llegando al origen) y si el
  ciclo de textos vuelve al primero al cerrar (N vueltas = N nombres). Patrón
  `NAMES`/`LAPS` del loop original de `M2Onboarding` (`.ringloop.bak`).
- **Legibilidad en una vuelta** (~3–5 s): una idea, un objeto, una transformación. El
  bucle solo lo reafirma.

**Durar:** `M1_DURATION = 120` (4 s) · `M2_DURATION = 168` (5,6 s, muy divisible →
sub-ciclos enteros). Usa la canónica; solo override si tu mecanismo necesita un
divisor concreto (vueltas, monedas) y mantente cerca (±pocos frames). **Excepciones
deliberadas (visto bueno de Iván)**: `ModCart` = 150 f (5 s) y `ModTickets` = 180 f
(6 s) — al pasar a **3 actos** (en Tickets, además, la placa **aparece/desaparece**
con fade en vez de estar siempre visible) los 120 f quedaban justos para que cada
beat se leyera. Cada tab del selector reproduce su MP4 en bucle por separado, así que
la duración distinta no rompe la uniformidad.

---

## 3. Tono y lenguaje visual (del brief)

- **Estética:** fondo **PLANO casi blanco `#F4F4FA`** (`CANVAS_BG` en `loopKit`; sin
  degradado radial ni viñeta — pedido por Iván), **neumorfismo**, «cuadrados», motion
  graphics, UIs abstractas y «mensajitos». **NUNCA capturas reales.**
- **Tono:** friendly y desenfadado — *«esto es lo fácil, te quita marrones»*.
  Aliviado, no épico. Sin sobrepromesa (nada de «100x»). Cabe la imperfección
  relatable (un *«uff, hecho»*, un ✓ verde con chispa).
- **Que se intuya el ERP debajo** (módulos reales conectados), no solo «chat mágico»:
  usa `ModuleIcon` discreto del módulo AiKit que protagoniza el caso.
- Reglas de la casa (ver [`motion-language.md`](./motion-language.md)): light mode,
  relieve = `elevation()`, **sin glows, sin bounce**, curvas ease-out (`CURVE`).

---

## 4. El kit (`loopKit.tsx`) — API que debes usar

Importa **todo** desde `'./loopKit'`. No reimplementes lo que ya está.

**Lienzo / ritmo:** `STAGE` (1080, cuadrado), `CENTER` (540), `FPS`, `M1_DURATION`,
`M2_DURATION`, `TAU`, `RAD`.

**Matemática pura:** `clamp01`, `lerp`, `smooth`, `smoother`, `mod`, `hash(n)`,
`triangle`, `mix(hexA,hexB,t)`, `CURVE.{enter,exit,standard}`.

**Bucle:** `useLoop(dur) → {frame, t, ca}` · `eventProgress(frame,dur,t0,span) →
0..1|null` (coreografía un paso discreto, loop-aware).

**Geometría (M2):** `ringPoints(n,cx,cy,r,start=-90) → Pt[]` · `pointAt(pts,u,closed)
→ Pt` (punto a lo largo de una polilínea por arc-length).

**Componentes:**
- `<LoopStage dur breathe? vignette?>` — escenario neumórfico común + fuentes. Fondo
  **plano `CANVAS_BG`**; `breathe` y `vignette` default **false** — Iván pidió eliminar
  el «floating» (respiro de cámara) y la viñeta en TODOS los module-loops: todo
  **estático**. Quedan como opciones apagadas. **Envuelve siempre tu escena en él.**
- `<NeoTile size x? y? radius? depth? distance? blur? press? accent? accentAmount?
  scale? opacity?>` — placa cuadrada (el «cuadro»/nodo). `accent`+`accentAmount` la
  tiñen suave sin glow. Con `x,y` se ancla centrada; sin ellos, inline.
- `<ModuleIcon name size x? y? active?>` — icono de marca del módulo (`active` 0..1 lo
  hace «trabajar»). `name` ∈ claves de `MODULES` (`heartbeat`, `actionRunner`,
  `docusense`, `foresight`…).
- `<ModuleLabel name x y opacity>` — su nombre, aparece solo al trabajar.
- `<Wire a b lit? width?>` + `<Packet path t closed? tailFrac? r? id>` — cable y pulso
  con estela KIT_BLUE (M2). Van dentro de un `<StageSvg>`.
- `<Bubble x y appear? accent?>{…}` — globito/mensajito con colita.
- `<Check cx cy size draw spark?>` — ✓ verde con chispa (dentro de `<StageSvg>`).
- `<StageSvg>` — `<svg>` a tamaño del lienzo para cables/pulsos/checks.

Colores: `KIT_BLUE` (único primario), `BRAND.{green,red,orange,…}` (acentos
reclusivos: estado), `lightTheme`, `elevation`, `TEXT_FONT`, `DISPLAY_FONT`.

---

## 5. Contrato de fichero (para registrar e integrar)

1. **Un fichero por clip** en `src/remotion/modules/<Name>.tsx`. **No** edites
   ficheros compartidos (`Root.tsx`, `loopKit.tsx`, `export-clips.mjs`) — de eso se
   encarga la integración central (evita conflictos en paralelo).
2. **Exports obligatorios:** el componente `export const <Name>Scene: React.FC` y la
   duración `export const <NAME>_DURATION = M1_DURATION | M2_DURATION` (o tu override).
3. **Cero props** (la composición se renderiza tal cual). Determinista.
4. **Compila limpio**: sin imports sin usar (`noUnusedLocals`), sin `any`.
5. Registro en `Root.tsx` (folders `Modulos-Tareas` / `Modulos-Conectado`, `width =
   height = 1080`), en `export-clips.mjs` (flows `module1`/`module2`) y un
   `render:mod-*` en `package.json` → **lo hace la integración**.

Verificación: `pnpm exec tsc -b` (limpio salvo 3 errores preexistentes ajenos) +
`remotion still … --frame=N` repartidos por el bucle, comparando **frame 0 vs frame
DUR-1** para confirmar la costura.

---

## 6. Las 10 — recetas (del brief, perfiladas)

> Módulo del PDF entre paréntesis. El `ModuleIcon` sugerido «intuye el ERP».

**Módulo 1 (un objeto, una transformación):**

- **1.1 Aprobar ausencias** (`ModAbsences`, *Control de asistencia y vacaciones*) —
  mini-rejilla de la semana; una celda levanta un globito `🌴 1–5?` → un OK la pulsa →
  se tiñe de verde suave → se calma justo cuando **otra** celda levanta su globito.
  *Cierra:* siempre hay «un globito arriba», solo rota cuál. Módulo: `actionRunner`.
- **1.2 Facturas se ordenan** (`ModInvoices`, *Gestión documental*) — **rediseñado**
  (Iván, 2 iteraciones: fuera la placa neumórfica grande de fondo, mejor un **flujo con
  líneas SIMÉTRICO** tipo Tailark `flow` + **arco caos→orden**). Geometría en **espejo
  exacto** sobre DocuSense (x=CENTER): a ambos lados, mismo `HALF`/`CK` y filas
  simétricas → no hay «descuadre». 3 zonas: **izq** = un lote de facturas (PDF·XLS·CSV,
  `DocChip`) **ya presente en el frame 0**, desordenado (montón inclinado y solapado =
  **caos**) — *no cae desde arriba* (antes sí, y dejaba 3 líneas vacías al inicio);
  **centro** = DocuSense las **ingiere** una a una por las 2 líneas que se encienden,
  **enderezándolas** (pulsa, las lee); **der** = salen clasificadas y **divergen** por
  las 2 líneas de salida a **2 carpetas con icono de SO macOS en blanco** (`OsFolder`
  SVG; el emoji 📁/PNG real se descartó por render no-determinista y por perder el
  tinte/pulso) etiquetadas **«Compras·Ventas»** = **orden**, con ✓ al recibir.
  *Cierra:* **ciclo que vuelve al reposo** (técnica §2.2) — al vaciarse la bandeja
  (inbox limpio = todo organizado, ~f41-68) **entra un lote nuevo deslizándose desde la
  izquierda** (no cae) que la rellena; el último doc cruza el seam (portador) y en el
  frame 0/119 la bandeja vuelve a estar llena = idéntico (verificado 0≡119). El ✓/tinte
  de carpeta es transitorio. Módulo: `docusense`.
- **1.3 Stock se repone** (`ModStock`, ✅) — **3 beats, sin placa neumórfica de fondo**:
  el nivel baja verde→rojo (por debajo del mínimo) → al tocar fondo se abre la **placa de
  «módulo en funcionamiento»** (`OperatingModuleTile`, la MISMA UI de Accounting/E-Commerce)
  con Heartbeat + estado **«Reponiendo stock»** → rellena a lleno + ✓. La placa **no está
  siempre visible**: aparece (fade-in) al agotarse, se abre/reposa para leer, y tras
  cerrarse **desaparece** (fade-out); su `expand` y su presencia son periódicas en `DUR` y
  decaen a reposo antes del seam (§2.2, placa **ausente** en f0==f119). **Estático**, sin
  respiro de cámara (`LoopStage breathe={false}`). Reemplazó al chip «+200». Módulo: `heartbeat`.
- **1.4 Tickets se priorizan** (`ModTickets`, *Soporte al cliente*) — **rediseñado a 3
  actos** (pedido por Iván, 180 f) sobre un **Kanban real** (base Tailark `kanban`: 3
  columnas Alta/Media/Baja flat con ring + puntos, sin la mesa-tablero ni drop-zones
  neumórficas; cards estándar **sin bisel**): (1) **CAOS** — un montón de tickets cae y
  se amontona SIN orden (solapados/rotados, sin prioridad), la placa **aún no es
  visible**; (2) **TRABAJO** — caídos todos, la placa **`OperatingModuleTile`** de Smart
  Process **APARECE (fade-in, cerrada)**, se abre («Priorizando tickets») y un barrido
  asigna prioridad (franja de color + chip); (3) **ORDEN** — las cards se enderezan y
  vuelan a su columna; ✓ «resuelto», la placa **cierra y DESAPARECE (fade-out)** y el
  tablero se vacía. *Cierra:* ciclo que vuelve al reposo — tablero vacío + placa ausente
  = frame 0 (la `presence` de la placa va aparte del `expand`, ambas → 0 antes del seam).
  Módulo: `smartProcess`.
- **1.5 Carrito abandonado** (`ModCart`, *Calificación de leads*) — **rediseñado a 3
  momentos** (pedido por Iván, 150 f): (1) **ABANDONO** — el checkout (Email+tarjeta+CVV)
  está apagado/gris y abajo asoma una **notificación** «Compra sin terminar · 48,90 €»
  (sustituye al antiguo sello atravesado «Carrito abandonado», que no gustaba). (2)
  **EJECUCIÓN** — entra el lenguaje de «módulo trabajando» de Accounting/Ecommerce: la
  placa **`OperatingModuleTile`** de Action Script se abre con «Recuperando carrito»
  mientras un shimmer rellena los campos y la tarjeta revive (gris→color). (3) **PAGO** —
  el botón vira a KIT_BLUE → «✓ Pagado» con el ✓ **inline en el botón** (ya no flota
  encima del texto); **se eliminó el recuadro contenedor** (la placa gris→verde de fondo).
  *Cierra:* relevo — la tarjeta pagada se cruza con una nueva gris/abandonada; el verde y
  la placa de ejecución decaen antes del seam (u→1 == u=0). Módulo: `actionScript`.

**Módulo 2 (varios nodos conectados + pulso que vuelve al origen; normalmente una
sola ruta de cable, pero cabe ramificar a ramas paralelas — ver 2.2):**

- **2.1 Alta de empleado** (`ModOnboarding`, ✅) — **NO es loop** (excepción §2, pedido
  por Iván: el anillo abstracto «no encajaba»). Narrativa lineal de **4 beats** en un
  único MP4 cuadrado (376 f), encadenados con cross-fades de 8 f: **(1) FIRMA** — porte
  de la ilustración Tailark **`actionnable`** («Signatures Approved»): tarjeta de
  notificación con tramado verde + glifo **lucide `Signature`** que se **dibuja** (renglón
  → firma) y se sella «Contrato firmado · María González» con ✓ verificado. **(2) EJECUTA**
  — el módulo en funcionamiento: **`OperatingModuleTile`**·**Action Script** con el estado
  «Dando de alta a María» + etiqueta del módulo. **(3) STEPS** — la cadena del onboarding
  completándose en **`NeoReasoning`** (el «3.er clip» de Accounting): Contrato registrado →
  Alta en nómina y SS → Ficha de empleado → Accesos y correo → Equipo y kit de bienvenida.
  **(4) CONFIRMA** — pantalla final: ✓ grande «Alta completada», los 5 pasos en verde y el
  sello «Alta ejecutada con Action Script». El loop anterior (anillo) queda en
  `M2Onboarding.ringloop.bak`. Módulo: `actionScript`.
- **2.2 Una venta mueve la cadena** (`ModSaleChain`, *Tienda que se gestiona sola*) —
  **árbol RAMIFICADO** (rediseño pedido por Iván; antes timeline lineal con borde negro
  y cabecera «Cadena completa»). Cae una moneda en el **POS** → onda baja a Inventario →
  ahí se **bifurca en dos ramas PARALELAS** (Compra/reposición ‖ Factura→Cliente) →
  dos cables de retorno laterales devuelven el pulso al POS justo cuando **cae otra
  moneda**. *Cierra:* los pulsos sólo existen en su ventana (null en el seam) y el ✓
  verde decae a idle antes de u→1; en el frame 0/DUR sólo la moneda aterriza + POS pulsa.
  Módulo: `actionRunner`.
- **2.3 Impagos se persiguen** (`ModDunning`) — ⚠️ *no está en el PDF* (aportación del
  panel, conservado por su fuerza; **validar con el equipo** que AiKit ejecuta
  cobros/morosidad antes de defenderlo arriba). **Rehecho** (2026-06-11, pedido por Iván:
  partir el bucle único en **3 clips lineales** «en vez de ejecutar todo en el mismo»):
  **mini-película de 3 actos** (patrón de los flujos, ya NO un loop).
  ① **`M2DunningOverdue`** (140f) — una sola factura y los **días corriendo**: el
  contador de vencimiento avanza «Vence en 5 días» → «Vence hoy» → «Vencida hace 8 días»
  y, al agotar el plazo (cruce del día 0), cae el sello **VENCIDA**. La factura es una
  **placa neumórfica limpia** (`DunningInvoiceCard`): se quitó el marco rojo externo
  («fondo suave») y el ring negro de Tailark → solo la factura con relieve neumórfico.
  ② **`M2DunningRun`** (140f) — la **ejecución del módulo** (misma UI de los flujos,
  `OperatingModuleTile`·Action Script «Reclamando el pago») + **aviso al cliente**: un
  sobre vuela por el cable a un nodo Cliente que recibe «🔔 Recordatorio de pago» + ✓.
  ③ **`M2DunningPaid`** (120f) — la **misma** factura (mismo nº/importe), ahora **PAGADO**
  (vira a verde, sello PAGADO, ✓ con chispa, onda verde de cobro). Combinada en
  `M2DunningVideo.tsx` (`ModDunning`, cross-fades 8f); export-clips flow `dunning`
  (`render:dunning` / `render:modules`). Módulo: `actionScript`.
- **2.4 Cierre de mes** (`ModMonthClose`, *Contabilidad*) — **partido en 3 clips lineales**
  (2026-06-11, pedido por Iván: tras el rediseño a loop legible, pidió separarlo en clips
  distintos, como Dunning/Ausencias). Ya **NO es un bucle**: mini-película de 3 actos con
  cross-fades (`M2MonthCloseVideo.tsx` → `ModMonthClose`), cada acto suelto y exportable
  (export-clips flow `monthclose`):
  - **① Libro diario** (`M2MonthCloseLedger`, ~108 f) — la tarjeta central «Junio» se llena
    de **apuntes reales** (día·concepto·importe, ingreso verde / gasto azul) en cascada;
    **4 áreas conectadas** (Ventas·Compras·Banco·Nóminas) le mandan un pulso cada una por su
    cable (firma M2 «negocio conectado»). Termina con «318 apuntes».
  - **② Cerrando junio** (`M2MonthCloseRun`, ~100 f) — **SÓLO el cuadrado del módulo**
    (`OperatingModuleTile`·**Foresight**, sin etiquetas de marca/área, como `M1AbsencesProcess`):
    los apuntes vuelan desde fuera y son **ingeridos** por el icono; al entrar todos, la placa
    se abre con **«Cerrando junio»**.
  - **③ Resumen** (`M2MonthCloseSummary`, ~136 f) — el libro se **consolida**: los apuntes se
    desvanecen hacia arriba y emergen los totales que **cuentan** (Ingresos 48.250 € · Gastos
    34.380 € · Resultado 13.870 €) + sello **✓ «Cerrado»** con chispa.
  Piezas compartidas (tarjeta-libro, áreas, totales, `eur()`) en `monthCloseShared.tsx`
  (como `absencesShared`/`dunningInvoice`). Lineales (`useCurrentFrame()`), no aplican reglas
  de costura. Módulo: `foresight` (Contabilidad). El **loop legible previo** se conserva en
  `M2MonthCloseLoop.tsx` (`ModMonthCloseLoop`, folder Modulos-V1) para comparar. Verificado
  con stills de los 3 actos + combinado (328 f). `M2MonthCloseRun` es **consumidor de
  `OperatingModuleTile`**.
- **2.5 Leads no se enfrían** (`ModLeadFunnel`, *Funnel de ventas*) — **rediseñado a
  Kanban con la MISMA UI que 1.4 Tickets** (2026-06-11, pedido por Iván: «la idea está
  bien pero la UI no me gusta nada; copia la de mod tickets»). Reusa el lenguaje de
  `M1Tickets`: **columnas flat** (`tailarkSurface(0.22)` + ring fino + cabecera con punto
  de color + fondo de puntos), **task-cards estándar con franja de color a la izquierda**,
  placa **`OperatingModuleTile`** **arriba-centro** con *presencia* (ausente en reposo →
  aparece + se abre → se cierra y desaparece) y un **barrido de escaneo** KIT_BLUE. Adaptado
  a leads: **5 columnas** (el ciclo de vida del lead) y **`LeadCard`** (origen + nombre +
  avatar + chip de estado/temperatura + id/€). La **idea** (validada por Iván) se mantiene en
  3 beats:
  - **1 · EN REPOSO** — 6 leads reposan en **Prospectos**(3) y **Contactados**(3); las columnas
    **Cualificados·Convertidos·Descartados** vacías; la placa **ausente**.
  - **2 · REACTIVA** — la placa **`OperatingModuleTile`** (`foresight` «Reactivando leads»)
    **aparece** arriba, se abre, y un **barrido** escanea el tablero → cada lead se templa
    (franja + chip de estado pasan de prospecto/contactado a su color de destino).
  - **3 · RESUELTOS** — todos **vuelan a su columna**: 3→Cualificados, 2→Convertidos (✓ + «€
    comprado»), **1→Descartados** (gris, atenuado). Llegados, la placa se cierra y **desaparece**.
  *Cierra:* **flujo continuo** (§2 técnica 1) — la foto (frío izq, derecha vacía, placa
  ausente) es **igual en frame 0 y DUR**. Relevo **salida + entrada**: los resueltos se
  desvanecen en su destino en `[FO_AT, FO_END]` mientras la **tanda fría siguiente** entra en
  los huecos de la izquierda en `[ARRIVE_IN_AT, DUR]` (dos sprites por lead: principal +
  relevo, que se solapan en el seam → sin parpadeo). Nada latcheado (franja, ✓, tinte y
  **presencia/apertura de la placa** decaen antes de u→1). Base `kanban` compartida con 1.4
  (única base repetida; mecanismo distinto). Verificado con stills (f0==f167; f20 reposo; f78
  placa+barrido; f116/132 activados; f150 relevo) + MP4. Módulo: `foresight`. Consumidor de
  `OperatingModuleTile`.
---

## 7. Trazabilidad

9 de 10 nacen del PDF de estrategia. El único añadido fuera del documento es **2.3
Impagos** (panel de second-opinion). Se retiró *Monitorización de la competencia* (por
sonar a humo). Banca de suplentes: *Cliente feliz que no te llama* · *Propuesta
comercial en 2 min* · *Reporte por Telegram* · *Análisis de caja y financiación*.

## 8. Tailark Pro — ilustraciones como base visual (acceso y uso)

Como base de UI «de producto» (hoja de cálculo, documento, kanban, timeline de pasos,
circuitos de flujo, factura…) usamos las **ilustraciones de Tailark Pro** (línea
«Quartz»). Son la fuente de los detalles internos del lenguaje **híbrido** (placa
neumórfica AiKit + UI interna estilo Tailark). Aquí queda **cómo acceder** y **cómo
usarlas** para no redescubrirlo cada vez.

### 8.1 Acceso al registry Pro

- El registry **ya está configurado** en [`components.json`](../components.json)
  (namespace `@tailark-pro`):
  ```jsonc
  "registries": {
    "@tailark-pro": {
      "url": "https://pro.tailark.com/registry/{name}",
      "headers": { "Authorization": "Bearer ${TAILARK_API_KEY}" }
    }
  }
  ```
- La **clave** (`TAILARK_API_KEY`, se genera en el Dashboard de pro.tailark.com) vive en
  **`.env`** (ya gitignored junto a `.env.local` y `*.local`). **Nunca** se commitea ni
  se imprime. Si se filtra, rótala en el Dashboard.
- **Descargar un item** (sin instalar nada — ver §8.4 por qué NO usamos el CLI):
  ```bash
  set -a; . ./.env; set +a                       # carga TAILARK_API_KEY sin imprimirla
  curl -s -H "Authorization: Bearer $TAILARK_API_KEY" \
       "https://pro.tailark.com/registry/<slug>" | jq .
  ```
  Devuelve un **registry item** shadcn:
  `{ name, type, title, description, registryDependencies[], dependencies[], files:[{ path, type, target, content }] }`.
  **El código fuente del `.tsx` está en `files[].content`** (string). Lo vuelcas a disco
  con `jq -r '.files[0].content'`.
- **Rate-limit**: las ráfagas devuelven `429` (y `curl` puede dar `HTTP 000` por
  reset). Sondea/descarga **en serie con `sleep ~0.8–1 s`** entre requests y reintenta
  ante `429` con backoff. Sin clave el endpoint responde `401`; slug inexistente → `404`.

### 8.2 Catálogo de ilustraciones (slugs verificados con la clave)

| Grupo | Slugs (`@tailark-pro/…`) | Encaja en |
|---|---|---|
| **Documentos** (`Document Illustration`, tarjeta de archivo + badge por extensión) | `document-pdf` · `document-docx` · `document-xlx` · `document-csv` · `document-json` · `document-txt` · `document-md` · `document-html` · `document-zip` · `document-img` *(y `document-ppt`)* | 1.2 Facturas · 2.4 Cierre de mes |
| **Flows / circuitos** (SVG nodo→hub→salidas con cable animado) | `flow-2`, `flow-3` … `flow-12` (≈11 variantes) | **Módulo 2** (2.2) |
| **Negocio** | `invoice` · `uptime` · `poll` | 1.2/2.3 facturas · KPIs |
| **Notificación / acción** (callout: tramado lateral + insignia + título/subtítulo + botón) | `actionnable` («Signatures Approved», insignia con glifo **lucide `Signature`** en emerald + botón «View Report») | **2.1 Firma del contrato** |
| **UI / IA** | `workflow` (timeline de pasos) · `ai-autocomplete` (sugerencias) · `kanban` (carriles) · `collaboration` · `collaboration-comment` · `meeting-4` · `face-scan-2` | 1.4 Tickets (kanban) · chats (ai-autocomplete) · cadenas (workflow) |

> En la web Pro se ven muchas más (BTC/USD/EURO, *Loyalty program*, *Spending limit*,
> *User analytics*, *Dotted map*…) y **su slug NO es el título visible**. **Truco para
> mapear título→slug** (verificado): descarga la galería con la clave y lee los
> atributos `data-visitors-category`/`-variant` que rodean cada ilustración —
> `curl -s -H "Authorization: Bearer $TAILARK_API_KEY" https://pro.tailark.com/illustrations`
> → busca el título (p. ej. «Signatures Approved») y la **`data-visitors-category`
> inmediatamente posterior** es el slug del registry (`actionnable`, con su errata de
> doble-n). El listado completo de categorías sale con
> `grep -oE 'data-visitors-category="[^"]+"'`. Confirma luego con un `GET /registry/<slug>`.

### 8.3 Cómo USARLAS (no son «plug-and-play»)

Son componentes **React + Tailwind** en estilo flat/«notion» (tarjetas blancas, rings
finos, indigo+emerald). Tres adaptaciones obligatorias antes de meterlas en un clip:

1. **Desacoplar de Next + Tailwind v4.** Traen `next/dynamic`, `next/image`,
   `<style jsx>`, tokens shadcn (`--foreground`, `--card`, `--muted`) y utilidades
   custom Tailwind v4 (`bg-illustration`, `corner-tr-bevel`, `ring-border-illustration`,
   definidas con `@theme`/`@utility`). Nuestro stack es **Vite + Tailwind 3.4**: hay que
   sustituir esos tokens/utilidades por estilos inline o por el `loopKit` (ver §4).
2. **La animación CSS NO se captura en Remotion** (misma piedra que Rive): su movimiento
   son `@keyframes`/`group-hover`. En `renderMedia` no avanza. Lo aprovechable es la
   **geometría / composición / estética**; el **movimiento se reimplementa por frame**
   con `useCurrentFrame()` y la matemática de bucle del kit.
3. **Traducir al híbrido AiKit**: indigo→`KIT_BLUE`, emerald→`BRAND.green`, y montar la
   UI interna de Tailark **dentro** de una placa neumórfica (`NeoTile`). El porte común
   está **factorizado en el kit** (`loopKit.tsx`): `TailarkCard` (card con ring fino +
   bisel `corner-tr-bevel`), `DocChip` (document-pdf/xlx/csv/doc con badge), `StateChip`
   (idle→azul→✓), `AvatarChip` (sustituto determinista de `next/image`) y `MetricBar`
   (uptime). **Sin imágenes remotas** (los `next/image`/avatares de GitHub de Tailark se
   sustituyen por `AvatarChip`). Ejemplos de porte ya hechos (los 10 clips): doc-cards en
   `M1Invoices.tsx`, kanban en `M1Tickets.tsx`, checkout en `M1Cart.tsx`, factura en
   `M2Dunning.tsx`, timeline+moneda en `M2SaleChain.tsx`, **tablero-kanban de leads
   (`LeadCard` avatar+estado)** en `M2LeadFunnel.tsx`.

> **Slugs Tailark en uso** (ver tabla §1): `calendar` (1.1) · `flow`+`document-*`
> (1.2) · `document-*` (2.4) · `uptime` (1.3) · `kanban` (1.4 **y 2.5**) · `payment` (1.5) ·
> `actionnable` (2.1, firma) · `workflow`+`currency` (2.2) · `invoice` (2.3) · `kanban` (2.5). `kanban` la
> comparten 1.4 (Tickets) y 2.5 (LeadFunnel) — única base repetida, por petición explícita de
> Iván; sus **mecanismos** son distintos (flujo continuo de tickets vs. 3-beat batch con
> `OperatingModuleTile`), que es la regla dura. `schedule` se
> sondeó pero NO es una rejilla (es una toolbar) → la rejilla-mes de 2.4 se hace a mano.
> Fuentes crudas en `vendor/tailark-pro/` (gitignored). QA de stills: `node
> scripts/module-stills.mjs` (bundlea 1 vez, saca frame 0/medio/DUR−1 de los 10).

**Flujo recomendado:** `curl` el item → guardar el `.tsx` en **`vendor/tailark-pro/`**
(scratch **gitignored**) → estudiarlo/portarlo a `src/remotion/modules/` ya adaptado.
**No** usar `npx shadcn add @tailark-pro/<name>`: instala ficheros y arrastra deps
Next/RSC que chocan con Vite + TW 3.4 (§8.4).

### 8.4 Licencia y precauciones

- El repo público [`tailark/blocks`](https://github.com/tailark/blocks) es **MIT** (la
  versión *free* de cada ilustración).
- Los items **Pro** son contenido de **suscripción**: su código se usa según la
  **licencia de Tailark Pro**, no se redistribuye. → mantén el source crudo en
  `vendor/tailark-pro/` **fuera de git** y commitea solo nuestra **adaptación** propia.
- La `TAILARK_API_KEY` es un secreto: solo en `.env`, nunca en commits, logs ni en el
  código de los clips.

## 9. Specs relacionadas

- [`operations-manual.md`](./operations-manual.md) — registro de los 16 módulos +
  estado de animaciones (§5).
- [`flow-blueprints.md`](./flow-blueprints.md) — los flujos del Grupo 1 (zoom medio).
- [`motion-language.md`](./motion-language.md) — curvas/ritmo de la casa.
- [`hero-animation.md`](./hero-animation.md) — el otro render en **bucle perfecto** (la
  fuente de la técnica «todo periódico en N frames»).

---

## 10. Copies del CMS (título + descripción) — redactados 2026-06-11

> Copy de los dos tabs del bloque `modules` y de cada vídeo. **Export de entrega**:
> `node scripts/export-module-videos.mjs` renderiza los **10 vídeos FINALES** (los
> combinados `ModDunning`/`ModMonthClose`/`ModAbsences`, nunca los actos sueltos) a
> `out/modulos/modulo-1-tareas/` y `out/modulos/modulo-2-conectado/`, con estos copies
> en `out/modulos/copies.md` (out/ es gitignored; la copia canónica es esta sección).
> Tono §3: aliviado, friendly, sin sobrepromesa.
>
> **Formato en la landing** (captura de Iván, 2026-06-11): un **acordeón** de items a la
> derecha (icono + título en UNA línea + descripción de 3–4 líneas, ~250 caracteres máx)
> junto al recuadro donde se reproduce el vídeo del item seleccionado; el copy del
> **tab/módulo** va como H1 + párrafo de la sección. El **Título** principal es la
> frase-resultado (tono del brief); el **Título corto (alt.)** es la variante etiqueta
> por si el acordeón cerrado escanea mejor con sustantivos (estilo del placeholder
> «Planificación de horarios»).

**Módulo 1 · tab** — **«Tus tareas del día a día se hacen solas»** — *Esas pequeñas
tareas que se comen la jornada —aprobar vacaciones, archivar facturas, reponer
stock— las resuelve un módulo de AiKit de principio a fin. Una tarea, un área, un ✓:
tú solo ves el resultado.*

| Vídeo (fichero) | Título | Título corto (alt.) | Descripción |
|---|---|---|---|
| `01-aprobar-ausencias.mp4` | Las vacaciones se aprueban solas | Aprobación de ausencias | Las peticiones se acumulan y AiKit cruza fechas, detecta conflictos y te devuelve el equipo organizado: aprobadas, a revisar y rechazadas. Sin perseguir calendarios. |
| `02-facturas-se-ordenan.mp4` | Cada factura, a su carpeta | Facturas ordenadas | El montón de PDFs y excels deja de ser un montón: DocuSense los lee, los clasifica y los archiva en Compras o Ventas. La bandeja siempre amanece limpia. |
| `03-stock-se-repone.mp4` | El stock se repone antes de fallar | Reposición de stock | Cuando un producto toca el mínimo, Heartbeat lanza la reposición sin que nadie esté mirando el almacén. Del rojo al lleno, solo. |
| `04-tickets-se-priorizan.mp4` | Los tickets llegan ya priorizados | Tickets priorizados | Los avisos caen todos a la vez y sin orden; Smart Process los lee, les asigna prioridad y los deja en su columna. Tu equipo empieza por lo importante, no por lo último que entró. |
| `05-carrito-recuperado.mp4` | La venta que se iba, recuperada | Carritos recuperados | Un cliente deja la compra a medias y AiKit la rescata: retoma el checkout, lo completa y lo convierte en un pago. De «compra sin terminar» a ✓ Pagado. |

**Módulo 2 · tab** — **«Tu negocio entero funciona conectado»** — *En AiKit las
áreas no trabajan aisladas: una venta, una firma o un vencimiento encienden una
cadena que recorre inventario, facturación, contabilidad y clientes sin que nadie la
empuje. Pasa algo en un punto y el resto del negocio responde solo.*

| Vídeo (fichero) | Título | Título corto (alt.) | Descripción |
|---|---|---|---|
| `01-alta-empleado.mp4` | Una firma, un alta completa | Alta de empleados | En cuanto se firma el contrato, Action Script encadena todo lo demás: alta en nómina y Seguridad Social, ficha de empleado, accesos, correo y kit de bienvenida. Incorporar a alguien sin pasar por cinco departamentos. |
| `02-venta-mueve-cadena.mp4` | Una venta mueve toda la cadena | Venta conectada | Cada cobro en el TPV recorre tu negocio: descuenta inventario, lanza la reposición y emite la factura al cliente, todo a la vez. Tú vendes; el resto se encadena solo. |
| `03-impagos-se-persiguen.mp4` | Los impagos se reclaman solos | Reclamación de impagos | Una factura vence y AiKit no la deja morir: reclama el pago, avisa al cliente y la sigue hasta verla cobrada. El dinero entra sin que tengas que perseguir a nadie. |
| `04-cierre-de-mes.mp4` | El cierre de mes se hace solo | Cierre de mes | Ventas, compras, banco y nóminas vuelcan sus apuntes en el libro; Foresight los consolida y cierra el mes con sus totales: ingresos, gastos y resultado. Sin maratón de fin de mes. |
| `05-leads-no-se-enfrian.mp4` | Ningún lead se queda frío | Reactivación de leads | Los contactos que llevaban días parados en el pipeline se reactivan solos: Foresight los repasa, los recalifica y los mueve a su etapa — algunos, directos a convertidos. El funnel nunca se para. |

⚠️ El copy de `03-impagos-se-persiguen` hereda la reserva de §1 (2.3 sin validar con
el equipo): no publicarlo hasta confirmar que AiKit ejecuta cobros/morosidad.
