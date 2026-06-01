# AiKit Prints — Grid Composition System

Compón **carteles / slides** colocando contenido en un **grid** de celdas, con
profundidad **neumórfica**. Modo claro y oscuro, y la fuente de luz se puede
cambiar (o animar) en tiempo real.

Reproduce el lenguaje visual del Figma "06 Grid" de *Economía de guerra*.

## Modelo mental

1. **Grid** — un espacio de `columnas × filas` de celdas (128px por defecto).
   Las pistas pueden ser uniformes o de tamaño individual (`columnSizes` /
   `rowSizes`): agranda una pista para hacer hueco → escalable.
2. **Cell** — un contenedor colocado por `(col, row)` que puede ocupar varias
   columnas/filas (`colSpan` / `rowSpan`). Dentro pones:
   - **elevación** neumórfica (`raised` / `recessed` / `flat`)
   - **imagen** a sangre (`variant="image"`, `src` o `background`)
   - **texto** (`<Label muted="20:00">Nombre</Label>`)
   - **iconos** (`<Chevron dir="down" />` u cualquier SVG)

## Componer contenido

```tsx
<Grid columns={10} rows={8} theme={lightTheme}>
  {/* cuadrado elevado vacío */}
  <Cell col={1} row={1} />

  {/* imagen que ocupa 2 columnas */}
  <Cell col={2} row={2} colSpan={2} variant="image" src="/foto.jpg" />

  {/* texto en una placa que ocupa 3 columnas */}
  <Cell col={4} row={4} colSpan={3}>
    <Label muted="20:00">Pablo Yusta</Label>
  </Cell>

  {/* icono */}
  <Cell col={7} row={4}><Chevron dir="up" /></Cell>
</Grid>
```

Añadir contenido = añadir un `<Cell>`. Eso es todo.

## Conceptos → pathfinding (`src/lib/pathfinding.ts`, `PathScene`)

La capa que representa **ideas** con las dos herramientas. Un concepto (p.ej.
"inteligencia") es una **ruta** de celdas de un **inicio** a un **objetivo**.
La dirección de cada flecha se **deriva de la geometría de la ruta**, así que
editar la ruta re-orienta todas las flechas → variaciones baratas.

```tsx
<PathScene
  theme={theme}
  spec={{
    columns: 3, rows: 2,
    route: [[1, 2], [2, 2], [2, 1], [3, 1]],  // celdas en orden
    startNode: [0, 2],   // círculo de inicio, fuera del grid
    goalNode: [4, 1],    // punto azul (objetivo), esquina superior derecha
  }}
/>
```

Para generar la ruta sola a partir de inicio + objetivo + obstáculos:

```ts
route: solve([1, 4], [6, 1], { columns: 6, rows: 4, blocked: [[3, 4], [3, 3]] })
```

Cada paso puede ser flecha, **texto** (`text: { muted, main }`) o **imagen**
(`image: { src }`), y puede ocupar varias celdas (`colSpan`). Define conceptos
en [`src/content/concepts.ts`](src/content/concepts.ts).

### Animación de emergencia
`PathScene` acepta `revealedCount`: las celdas de la ruta surgen una a una de
plana → elevada (creciendo hacia el espectador, animando sombra + escala). El
inicio y el objetivo están desde el principio. El botón **▶ play** la dispara.

### Editor en la interfaz (`✎ editor`)
Construye un concepto sobre el grid: clic en celda vacía = añadir paso (la ruta
y las flechas se recalculan solas); clic en un paso = editar su contenido
(flecha / texto / imagen / ancho). Ajusta columnas y filas, reproduce la
animación y exporta el `spec` en JSON para pegarlo en `concepts.ts`.

## Motor de neumorfismo (`src/lib/neumorphism.ts`)

En vez de `box-shadow` fijos, las sombras se **calculan** desde un `NeoTheme`
+ una `lightSource` (`tl` / `tr` / `bl` / `br`):

```ts
elevation(theme, { depth: 'raised', distance: 8, radius: 24 })
```

Cambiar `theme.lightSource` re-ilumina toda la composición (ver los botones
"luz tl/tr/bl/br" del demo). Generaliza la librería de neumorfismo de la keynote.

Temas incluidos: `lightTheme` (#f4f4fa, valores del Figma) y `darkTheme`
(#161a20, slides oscuras de la keynote).

Además exporta `BRAND`: paleta de marca secundaria (red/orange/yellow/green/
teal/purple/violet/pink) para acentos puntuales — el azul (`KIT_BLUE`) sigue
siendo el acento primario.

## Estructura

```
src/
  lib/neumorphism.ts        motor: temas, elevation(), light source
  components/Grid.tsx        Grid + contexto (CSS Grid, tracks variables)
  components/Cell.tsx        celda colocada: elevación / imagen / texto / icono
  components/content.tsx     Label, Chevron
  components/Stage.tsx       lienzo 1920×1080 escalado al viewport
  content/slide06Grid.tsx    reproducción de la slide "06 Grid" (el test)
  App.tsx                    demo con toggles de tema y de luz
```

## Storybook (catálogo de componentes)

Hay un **Storybook** (`@storybook/react-vite`) donde se desarrollan y prueban los
componentes neumórficos reutilizables y widgets compuestos, todos sobre el motor
de `elevation()`:

- Barra superior con selectores de **tema** (light/dark) y **fuente de luz**
  (tl/tr/bl/br) que re-iluminan todo en vivo (vía contexto `useNeoTheme`).
- Primitivos (`Neo/`): `NeoSurface` (placa base), `NeoButton` (pulsable, iconos
  Hugeicons, `tone="solid"` con `fill`, controles de elevación), `NeoCard`.
- Widgets (`Neo/Widgets`): alarma, PIN, gráfico de gastos multicolor, cronómetro,
  llamada, agenda y **ventana de navegador**.
- `Neo/Brand Palette`: swatches de la paleta de marca (`BRAND`).
- `Motion/Cursor`: puntero realista (flecha → mano, I-beam, click) para grabar
  vídeos demo; sigue el ratón o se guioniza por código.

```bash
npm run storybook        # http://localhost:6006
npm run build-storybook  # export estático a storybook-static/
```

Detalle en [`specs/storybook-catalog.md`](specs/storybook-catalog.md) y
[`specs/motion-cursor.md`](specs/motion-cursor.md).

## Iconos (Hugeicons Pro)

Las celdas pueden llevar iconos (solo-icono o icono + texto). Usan
`@hugeicons-pro` desde su registro privado, que requiere un token:

1. Copia `.env.example` a `.env` y pon `HUGEICONS_TOKEN=<tu-licencia>`.
2. `.npmrc` ya apunta `@hugeicons-pro` a `https://npm.hugeicons.com` con ese token.
3. `export HUGEICONS_TOKEN=… && npm install`.

El set de iconos disponible se define en
[`src/components/icons.tsx`](src/components/icons.tsx) — añade una entrada al
mapa `ICONS` para exponer un icono nuevo (aparece también en el picker del editor).

## Comandos

```bash
cp .env.example .env            # añade tu HUGEICONS_TOKEN
export HUGEICONS_TOKEN=… && npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + bundle
```
