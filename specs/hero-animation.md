# Hero Animation — "El ecosistema vivo"

> Blueprint de la animación del **hero** de la home: la pieza que explica **qué es
> AiKit** (no un caso de uso). Tiene **reglas propias**, distintas a las 5
> animaciones de flujo — por eso vive en su propia spec y no en
> [`flow-blueprints.md`](./flow-blueprints.md). Cárgalo junto al
> [`operations-manual.md`](./operations-manual.md) al trabajar el hero.

**Estado:** ✅ *construido (v2.2 · **loop perfecto**) — [`src/remotion/hero/HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx),
composición `HeroIntro` (carpeta **Hero** en `Root.tsx`), 300 f / ~10s, pensado para
reproducirse **en bucle continuo** (frame 299 → 0 sin salto). Render: `pnpm run render:hero`.*
**Vocabulario de motion:** [`motion-language.md`](./motion-language.md).

> **Pivote (2026-06-10).** La **v1 "El motor invisible"** (una placa que se abría y
> 3 piezas abstractas formando un motor) **se descartó**: Iván la vio *simplona y sin
> contenido* — la gota inicial pobre, los bordes/placas alrededor de los iconos no
> los quería, y los módulos abstractos (○ ▶ ▦) no decían nada. Pedido explícito:
> **más vívido, con los módulos REALES, que la pieza hable de ellos.** Esto **revierte
> la recomendación del panel** (§6) de "no mostrar los 16 para no saturar": manda el
> cliente, y su activo más rico son los 16 módulos con identidad propia. El reto pasó
> a ser que el sistema se sienta **vivo** (no un mapa de features estático).

---

## 1. Qué es y en qué se diferencia

El hero acompaña, **al lado**, este texto:

> *"AiKit es una plataforma que integra un ERP completo con un ecosistema digital
> diseñado para delegar el trabajo en IAs que lo manejan de manera autónoma. Es
> decir: es una herramienta muy sencilla que te ayuda con tu trabajo."*

La animación **ilustra la sensación con sustancia**: el **ecosistema completo de
AiKit, vivo y trabajando en paralelo**. Reglas de encargo:

- **Un render único** (no clips sueltos como los flujos).
- **Corto** (~10 s / 300 f @30fps), **muy visual**, **vívido y denso**.
- **No** se parece a las 5 animaciones de flujo: ni grid serpenteante, ni chat.

### Disciplina de hero — qué EVITAR (vigente tras el pivote)

- ❌ **Grid serpenteante, ruta, flechas, meta azul** (la firma de los 5 flujos).
- ❌ **Chat / burbuja**, captions, micro-etiquetas permanentes.
- ❌ **`OperatingModuleTile`** (placa cuadrada que se abre / enciende en cadena) — es
  el lenguaje de Intake/Invoice/Channels/Staff/AccountingLoop. Repetirlo = repetir el clip.
- ❌ **Placas / bordes neumórficos alrededor de los iconos** (pedido de Iván: los
  módulos van **limpios**, sin placa).
- ❌ **Abrir/cerrar con el logo de AiKit** (no tiene sentido repetir la marca al
  principio y al final).
- ❌ **Glows / halos de color.** La vida es **movimiento + tráfico KIT_BLUE**, no un halo.
- ❌ **Módulos abstractos / inventados.** Se usan los **iconos de marca reales** de los 16.

---

## 2. El concepto — "El ecosistema vivo"

Los **16 módulos reales** pueblan el lienzo claro, agrupados en sus **3 familias**
(Controla · Delega · Construye). Una **malla fina** los conecta y por ella viajan sin
parar **paquetes de datos** (el trabajo, en `KIT_BLUE`): el sistema trabaja **en
paralelo**. Cuando el trabajo **llega a un módulo, éste pulsa y dice su nombre** un
instante — así la pieza *habla de los módulos* sin saturar con 16 etiquetas fijas. La
densidad de tráfico **crece** (la máquina se enciende) y **se sostiene hasta el final**
(queda en marcha). No hay logo, ni gota, ni placas.

**Por qué funciona con el texto:** el texto enumera ("ERP + ecosistema + autónomo");
la animación lo **encarna** — un organismo de piezas reales que se coordinan solas.

**Decisiones fijadas (Iván, 2026-06-10):**

| Decisión | Elegido | Implicación |
|---|---|---|
| **Protagonista** | **Muchos módulos a la vez** | Los 16 iconos reales poblando la escena (ecosistema lleno, denso). |
| **Acción** | **Ecosistema vivo en paralelo** | Tráfico de datos entre módulos, varios activos a la vez. |
| **Look** | **Claro y limpio, sin placas** | Fondo neumórfico claro de marca; iconos sin borde + mucho movimiento. |

---

## 3. Cómo está construido (v2)

- **Fichero:** [`src/remotion/hero/HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx)
  (carpeta propia `hero/`), exporta `HeroIntroVideo` + `HERO_INTRO_DURATION = 300`.
  Registrado en [`Root.tsx`](../src/remotion/Root.tsx) como `HeroIntro` (carpeta **Hero**).
- **Módulos:** se leen de [`modules.ts`](../src/stories/neo/modules/modules.ts) (`MODULES`/
  `MODULE_NAMES`); el icono es `spec.icon` (SVG real, multicolor), con `rotate` para
  Foresight. Se pintan como `<img>` **sin placa**.
- **Layout:** 3 **clusters por familia** (`CLUSTERS`), empaquetado **golden-angle**
  (girasol) → equilibrado y orgánico. Controla izquierda (8), Delega arriba-derecha
  (5), Construye abajo-derecha (3).
- **Malla (`EDGES`) — CURADA por semántica (no proximidad):** las conexiones se
  definen a mano en **`RELATIONS`** (quién colabora de verdad con quién), para que
  **ninguna sea "rara"**. Es el lugar a editar para añadir/quitar relaciones. Hubs
  naturales que emergen: **Junction** (hub de datos: reúne Hotpot/SQLSense/Udon/
  DocuSense y alimenta Foresight/Glimpse) y **Action Runner** (hub de acción: actúa
  *a través de* los conectores — combo del pitch). El grosor del borde marca los
  **puentes** entre familias (`bridge = grupos distintos`).
- **Roles especiales por módulo (`HEARTBEAT_TARGETS`, `WAKES`, …):** no todos se
  comportan igual. **Heartbeat = TRIGGER**: no recibe inputs; **despierta** en latidos
  periódicos (`WAKES`, 3/loop) y en cada latido **emite a la vez** a varios destinos
  (Action Runner · Action Script · Smart Process · Teamwork · **Foresight** — un latido
  puede arrancar un análisis predictivo) — sus aristas son **salientes** (`trigger`). Late con un **doble pulso cardíaco** (`heartbeatPulse`,
  lub-dub) y su escala pulsa más fuerte. Hueco para más customizaciones por módulo.
- **Tráfico (`PACKETS`):** 150 paquetes deterministas (hash `Math.sin`, sin random)
  que recorren aristas **despacio** (34–58 f en cruzar); `t0` sesgado a la 2ª mitad
  (densidad creciente) pero repartido hasta ~300 (no se apaga). La arista **se ilumina**
  KIT_BLUE mientras lleva un paquete; el módulo **destino se activa** (`ARRIVALS` →
  `activation()`, rampa lenta + decaimiento largo de 40 f): pulso de escala + opacidad
  + **su nombre** aparece y permanece legible un instante.
- **Vida de cada módulo:** **drift** flotante suave (sin/cos del ángulo de loop, 2
  vueltas, fase por icono), pulso contenido al recibir trabajo. **Sin entrada/fade**:
  todo está presente desde el frame 0.
- **Cámara:** breathing + deriva circular muy sutiles, **periódicos** (sin push-in
  lineal). Light mode, sin glows, determinista.
- **BUCLE PERFECTO (v2.2):** la pieza se reproduce **en bucle continuo**. No hay
  entrada ni push-in lineal (no serían loopables); **todo movimiento es periódico en
  `LOOP = 300` frames** vía **tiempo modular** (`mod(frame − t0, LOOP)` para el tráfico
  y los pulsos; el ángulo `ca = (frame/LOOP)·2π` para drift y cámara). Así el frame 299
  encadena con el 0 sin salto. Los `PACKETS` tienen `t0` **uniforme** en `[0, LOOP)`
  (sin sesgo de arranque) → densidad constante.
- **Ritmo (afinado · cada vez más suave/sutil a petición de Iván):** tráfico **lento**
  (paquetes 50–80 f en cruzar, HB 58 f) y menos denso (≈105 paquetes); dots pequeños
  (r≈3.6 / 4.6 trigger); pulsos contenidos (escala +0.10, HB +0.18) y drift suave.
- **Sin malla fija — sólo estelas (v2.4):** las aristas **no se dibujan en reposo**;
  cada paquete deja una **estela en degradado** (`linearGradient` KIT_BLUE, transparente
  detrás → opaca en la cabeza, `TAIL_PX≈175`) que lo sigue y se desvanece, con fade-in/out
  en los extremos. Una conexión **sólo es visible mientras una bola la recorre**. `EDGES`
  sigue existiendo (la malla curada gobierna por dónde puede ir el tráfico), pero no se
  pinta como líneas estáticas.
- **Encuadre:** el layout se **recentra** en el canvas y se agranda un punto (`SPREAD ≈
  1.08`) → menos padding alrededor, ocupa algo más sin tocar bordes.
- **NOTA Rive:** la animación Rive interna de cada módulo **no se usa** (no se captura
  bien en `renderMedia`); todo el movimiento es por frame.

### Iteración futura posible
- El cluster Controla (8 módulos) es el más denso; si se quiere más aire, subir su
  `r` o repartir en dos sub-grupos.
- Se podría rematar con un leve pull-back final que encuadre todo el ecosistema.

---

## 4. Qué ilustra del texto (mapa concepto → mensaje)

| Frase del hero | Cómo se siente en la pieza |
|---|---|
| "ERP completo + ecosistema digital" | Los **16 módulos reales** + la malla que los une. |
| "delegar el trabajo en IAs autónomas" | El **tráfico** que fluye solo entre módulos, sin manos. |
| "herramienta muy sencilla que te ayuda" | El conjunto **se coordina solo**; tú solo lo ves trabajar. |

---

## 5. Registro del panel (second opinion · 2026-06-09)

El panel (Codex + Kimi + GLM) revisó la idea **original** ("organismo/constelación de
16 que late"). Aportes que **siguen vigentes**: evitar grid/chat (firma de los flujos),
evitar `OperatingModuleTile`, no abrir explicación redundante con el texto. Su
recomendación de **no mostrar los 16 módulos** llevó a la **v1 "El motor invisible"**
(3 piezas abstractas) — que **Iván rechazó por simplona**. La **v2** retoma los 16
módulos reales, pero resolviendo el miedo del panel ("mapa de features") con **vida**:
tráfico constante, activación por trabajo y nombres al vuelo, no un diagrama estático.

---

## 6. Specs relacionadas

- [`motion-language.md`](./motion-language.md) — curvas, ritmo, reglas de la casa.
- [`operations-manual.md`](./operations-manual.md) — estado compartido; §5 tabla de animaciones.
- [`flow-blueprints.md`](./flow-blueprints.md) — las 5 animaciones de **flujo** (lo que el hero **no** es).
- [`product-video.md`](./product-video.md) — Remotion, composiciones, render.
</content>
