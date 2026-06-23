# Hero Animation — "Inteligencia" (el grid)

> Blueprint de la animación del **hero** de la home: la pieza que abre la web. Tiene
> **reglas propias** y vive en su propia spec. Cárgalo junto al
> [`operations-manual.md`](./operations-manual.md) al trabajar el hero.

**Estado:** ✅ *construido (v3.1 · **loop perfecto**) — [`src/remotion/hero/HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx),
composición `HeroIntro` (carpeta **Hero** en `Root.tsx`), **159 f / ~5,3 s** @30fps, pensado para
reproducirse **en bucle continuo** (frame 158 → 0 sin salto). Render: `pnpm run render:hero`.*
**Vocabulario de motion:** [`motion-language.md`](./motion-language.md).

> **Pivote (2026-06-12).** La **v2 "El ecosistema vivo"** (los 16 módulos reales en 3
> clusters + malla + tráfico de datos) **se descartó**: Iván la vio *floja, no servía*.
> Pedido explícito y nuevo rumbo: **simplemente EL GRID de la referencia** (el concept
> `inteligencia`) con una animación **muy suave y sutil, en bucle**. Esto **revierte la
> disciplina anterior** ("evitar grid/ruta/flechas en el hero"): ya no aplica — el hero ES
> ahora ese grid.
>
> **v3.1 (mismo día).** La primera v3 hacía recorrer el grid una **línea azul**; no
> convencía. Iván: *que vayan EMERGIENDO los ítems del grid* (como `GridEmergeVideo`); la
> "rayita" puede quedarse pero **mucho más pequeña y tenue**, como guía. Esta es la versión
> vigente. El historial de v1/v2 queda al pie (§5).

---

## 1. Qué es

El hero es **el grid de la imagen de referencia** y nada más: el concept `inteligencia`
de [`concepts.ts`](../src/content/concepts.ts) — una rejilla neumórfica **3×2** con una
**ruta serpenteante** (disco de inicio vacío abajo-izquierda → flechas `→ ↑ → →` → punto
azul de meta arriba-derecha). Sobre ese grid corre **una única animación**:

> Los **6 ítems del grid EMERGEN escalonados** a lo largo de la ruta (disco de inicio →
> 4 flechas → punto de meta): cada uno brota de plano → elevado. Un **puntito azul
> diminuto y muy tenue** recorre la ruta sincronizado, guiando el frente (cada ítem emerge
> cuando el punto llega a él). Al completarse, los ítems **desaparecen en el MISMO orden**
> en que aparecieron (FIFO: el disco de inicio primero, la meta al final) → **ola continua**
> de aparecer/desaparecer en la misma dirección; arranca casi en cuanto el grid se completa, y
> **vuelve a empezar**. La rejilla-bandeja (frame redondeado) es lo único permanente.

Encargo de Iván (2026-06-12), literal: *"que vayan emergiendo los distintos ítems… aun así
sí podemos meter algo visual, tal vez esa rayita que has dejado, pero mucho más sutil y
pequeña."*

### Disciplina de hero (v3.1)

- ✅ **El grid + las flechas + los dos discos**, fieles a la referencia (mismos primitivos
  neumórficos que el resto: `Grid`/`Cell`, `elevation`, `KIT_BLUE`).
- ✅ **La animación es la EMERGENCIA** de los ítems (patrón `GridEmergeVideo`). Cámara estática.
- ✅ **La "rayita"** queda como **puntito azul diminuto y tenue** que guía la emergencia.
- ✅ **Muy suave y sutil**: `smootherstep`, sombras/escala que crecen con la emergencia.
- ❌ **Nada de texto, logo, módulos, chat, captions.** "Simplemente ese grid."
- ❌ **Sin línea azul que barre todo el grid** (era la v3 inicial, descartada), sin glows duros.

---

## 2. Cómo está construido (v3.1)

- **Fichero:** [`HeroIntroVideo.tsx`](../src/remotion/hero/HeroIntroVideo.tsx) — exporta
  `HeroIntroVideo` + `HERO_INTRO_DURATION = 159`. Registrado en `Root.tsx` como `HeroIntro`.
- **Grid base:** misma geometría que [`PathScene`](../src/components/PathScene.tsx) —
  `reflowRoute(coordsToSteps([[1,2],[2,2],[2,1],[3,1]]))`, `startNode [0,2]`, meta `[4,1]`,
  flechas vía `routeArrows`. Se dibuja con `Grid` (frame redondeado, **permanente**) + `Cell`
  neumórficas; las dos celdas fuera de ruta ([1,1] y [3,2]) quedan vacías (igual que la
  referencia). `CELL = 300`, centrado en el lienzo 1920×1080.
- **Emergencia (patrón `GridEmergeVideo`):** 6 ítems en orden de ruta — `[0]` disco inicio,
  `[1..4]` flechas, `[5]` disco meta. Cada ítem tiene `grow = emerge·(1 − recede)` derivado
  de `frame mod LOOP`: `emerge = smoother((f − T(i))/RISE)` con stagger `T(i)=START_F+i·STAGGER`;
  `recede = smoother((f − RT(i))/FALL)` con stagger **FIFO** (`RT(i)=RECEDE_START+i·STAGGER_OUT` → el disco de inicio se va primero, la meta al final).
  `grow` conduce el `distance`/`blur` del `Cell` real (sombra 0→plena) + `scale 0.9→1` +
  `opacity` — exactamente como `GridEmerge` (NO se usan las transiciones CSS de `<Cell animate>`,
  que son wall-clock y romperían el render determinista). Los discos (`Node`) emergen igual.
- **El puntito guía (la "rayita", diminuta):** se calcula la **polilínea** inicio → centros
  de flechas → meta (`VERTS`/`SEGS`/`CUM`). `guideArc(f)` interpola el arco sincronizado con
  el stagger (el punto está en `CUM[i]` justo cuando el ítem `i` arranca a emerger), así el
  punto **lidera** la aparición. Es minúsculo (`r ≈ CELL·0.022` + núcleo blanco) con estela
  cortísima y muy tenue (`opacity ≤ 0.28`); aparece con el primer ítem y se va al cerrar el
  barrido (`guideOpacity`).
- **BUCLE PERFECTO:** todo se deriva de `frame mod LOOP`. En la costura **todo está plano**
  (`grow=0` en todos los ítems: el `emerge` aún no arrancó en `f≈0` y el `recede` ya terminó
  en `f≈LOOP−1`) → sólo queda la bandeja vacía, idéntica en ambos extremos. Ritmo: `START_F 0`
  (el primero emerge ya en f0) · `STAGGER 13` · `RISE 28` (build ~f0–93) → desaparición **FIFO**
  casi inmediata (`RECEDE_START 100`, `RT(i)=RECEDE_START+i·STAGGER_OUT`) · `STAGGER_OUT 8` ·
  `FALL 18` (~f100–158) → **reposo de costura ~1 f**: el último desaparece y el primero
  reaparece casi sin hueco (`LOOP 159`, ajustado a que `recede(meta)` cierre justo en f158).
- **Determinismo total:** función pura de `frame mod LOOP` (sin Rive, sin `Date`/`random`)
  → idéntico en preview y en `renderMedia`. Verificado: `f0` ≡ `f158` (byte-idénticos).

---

## 3. Specs relacionadas

- [`motion-language.md`](./motion-language.md) — curvas, ritmo, reglas de la casa.
- [`operations-manual.md`](./operations-manual.md) — estado compartido; §5 tabla de animaciones.
- [`concepts.ts`](../src/content/concepts.ts) / [`PathScene.tsx`](../src/components/PathScene.tsx) — el grid `inteligencia` y su motor de ruta.
- [`product-video.md`](./product-video.md) — Remotion, composiciones, render.

---

## 4. Qué EVITAR (errores de tomas pasadas)

- ❌ Recargar el grid con módulos, texto o segundas animaciones — el brief es minimalista.
- ❌ Romper el bucle: todo lo animado debe llegar a su **estado de reposo** (grow=0, bandeja
  vacía) antes de la costura, derivado de `frame mod LOOP`, para que `f158→f0` no dé un salto.
- ❌ Volver a la **línea azul que barre** el grid (descartada) o subir el puntito guía: es
  diminuto y tenido a propósito; la emergencia es la protagonista, el grid manda.

---

## 5. Historial (descartado)

- **v1 "El motor invisible"** (placa que se abre + 3 piezas abstractas formando un motor)
  — Iván: *simplona y sin contenido*. Descartada.
- **v2 "El ecosistema vivo"** (16 módulos reales en 3 clusters + malla curada `RELATIONS` +
  tráfico `KIT_BLUE` + Heartbeat como trigger + bucle perfecto por tiempo modular) — Iván
  (2026-06-12): *no servía*. Descartada en favor del grid (v3). El código histórico está en
  git si hiciera falta recuperar la mecánica de tráfico/estelas.
