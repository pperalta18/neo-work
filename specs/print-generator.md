# Print Generator

Turns the project's neumorphic React material into **print-ready files** (CMYK
PDF/X for the press, plus PNG/JPG). It is an **operator tool**: Claude lays out
each print *in code* (reusing the existing widgets, fonts and palette); the only
GUI a human needs is an **index** of all prints and a per-print **export** flow.

## Capabilities

- An author (Claude) creates a print by writing a React page under
  `src/print/pages/<doc>.tsx` and a JSON spec at `public/prints/<id>/doc.json`.
  The page composes the existing neumorphic widgets unchanged.
- When creating a document you **choose physical dimensions** (a preset like
  A4/A3/A5/Letter/business-card/poster, or a custom `mm × mm`), and optionally a
  **bleed** ("sangrado"), **safe margin**, and **crop marks**.
- A print exports to:
  - a **CMYK PDF/X** (true CMYK via an embedded ICC profile — press-ready), or
  - a high-resolution **PNG** or **JPG** (configurable quality).
  The format, **DPI** (default **300**), and JPG quality are chosen at export.
- The generator is its **own page** — `prints.html` (entry `src/print/main.tsx`),
  separate from the keynote/grid app (`index.html`). Open it at `/prints.html`
  under `npm run dev`. The user sees an **index** of every print (thumbnail + size);
  each row opens a preview with **zoom and fit-to-window** (so a very wide piece,
  e.g. a wall mural, can be seen whole) and an **Export** panel.
- Renders are **deterministic** (Remotion `renderStill`, frame-driven, no
  `Date.now`/`Math.random`), so the same spec always yields the same pixels.

## Authoring a new print (the operator flow)

1. **Choose the size & write the spec** — `public/prints/<id>/doc.json`: dimensions
   (mm), bleed, safe margin, crop marks, dpi, colour/ICC, PDF/X variant, and any
   page `props` (the page's editable content; images referenced by path).
2. **Author the page** — a React component `src/print/pages/<id>.tsx` that reads
   `{ doc, geo }`; lay out in mm/pt via `geo`, bleed backgrounds to the media edge,
   compose neumorphic widgets and/or custom vector/graphic content. Register it in
   `src/print/pages/index.ts` under its `pageComponentId`.
3. **Preview** — open `/prints.html` (`npm run dev`), select the print, check it with
   zoom / fit-to-window and the trim/safe guides.
4. **Export** — from the panel, or `npm run export -- <id> --format pdf|png|jpg
   [--dpi n] [--quality n]`. Gate with `npm run verify:print <id>`.

## How a print is produced (pipeline)

Raster-first, because the look is built on `box-shadow`/gradients that Chrome's
vector PDF export silently drops (Puppeteer #5284). Flattening to pixels first
preserves the neumorphic relief exactly, then color is converted for press:

1. **Render** — a generic `<Composition id="PrintPage">` reads `doc.json` via
   `calculateMetadata` and sizes the canvas to `round((trim + 2·bleed) · dpi/25.4)`
   px. `bundle → selectComposition → renderStill` outputs `out/prints/<id>.png`
   at the target DPI (the bleed is painted to the canvas edge; crop marks, when
   enabled, are drawn just inside the bleed).
2. **Image export** — PNG is the render itself; JPG is a quality-controlled
   conversion (ImageMagick).
3. **PDF (RGB)** — `magick <png> -density <dpi> -units PixelsPerInch <rgb>.pdf`
   at the exact physical size.
4. **PDF (CMYK PDF/X)** — Ghostscript converts sRGB→CMYK with the document's ICC
   profile and embeds it as the OutputIntent:
   ```
   gs -dPDFX -dBATCH -dNOPAUSE -dNOSAFER -dPDFXCompatibilityPolicy=1 \
      -sColorConversionStrategy=CMYK -sProcessColorModel=DeviceCMYK \
      -sDEVICE=pdfwrite -dPDFSETTINGS=/prepress \
      -sDefaultRGBProfile=public/icc/sRGB.icc \
      -sOutputICCProfile=public/icc/<CMYK>.icc \
      -sOutputFile=<cmyk>.pdf  <PDFX_def.ps>  <rgb>.pdf
   ```
   `PDFX_def.ps` declares the CMYK OutputIntent (`/N 4`). PDF/X-1a is the default
   (max compatibility, PDF 1.3); PDF/X-4 is an opt-in for shops that allow it.
5. **Boxes** — `MediaBox` = full canvas, `BleedBox` = trim+bleed, `TrimBox` =
   finished size, set via `mutool`/pdf-lib (1 mm = 2.8346 pt).
6. **Verify** — `pdfinfo` (page size + boxes) and `mutool info` (image colorspace
   is `DevCMYK`) confirm a conformant file.

## Constraints

- **300 DPI** is the default and the floor for press output; the spec carries
  `dpi` and the render scales to it. Source images must be authored at print
  resolution (the legacy `public/` PNGs are ~96 DPI and must be regenerated via
  the image-gen skill at print size before shipping a real document).
- **Text is rasterized** (baked to pixels) — the cost of keeping the neumorphic
  look. Acceptable for design material; not searchable/selectable.
- **CMYK gamut shift is expected** — e.g. `KIT_BLUE #0070f9` cannot be reproduced
  exactly in CMYK; soft-proof before a press run.
- **Rich black**: because text is flattened into the raster, dark text converts to
  CMYK via the ICC profile (usually a 4-colour rich black). For crisp pure-K (100K)
  small text and to avoid registration halos, use the hybrid vector-text overlay
  (a future option) — not v1.
- The bundled `public/icc/GenericCMYK.icc` is a **dev placeholder**. For
  production, drop the print shop's real profile (e.g. ISO Coated v2 / FOGRA39,
  PSO Coated v3 / FOGRA51) into `public/icc/` and point `doc.json` at it.
- **Rive** module icons can't be deterministically stilled — a print using them
  must use a pre-baked static SVG instead.
- For 300 DPI sharpness the `PrintRenderer` freezes animations/interactive
  states, reduces shadow blur, and bumps 1px hairlines so they don't vanish.

## File system

- `public/prints/<id>/doc.json` — the document spec: `id`, `title`, `createdAt`,
  `pageComponentId`, `theme`, `dimensions { trimWidthMm, trimHeightMm, bleedMm,
  safeMarginMm, cropMarks }`, `dpi`, `color { mode, iccProfile, pdfxVariant }`,
  and `props` (page data; images referenced by path, not inlined).
- `public/prints/<id>/assets/` — document-specific high-res imagery.
- `public/prints/index.json` — generated list (`id`, `title`, `thumb`,
  `dimensions`, `updatedAt`) the index view fetches.
- `out/prints/<id>.{png,jpg,pdf}` — export artifacts.

## Toolchain

`ghostscript`, `imagemagick`, `mupdf` (brew). Verified: gs 10.07.1, ImageMagick
7.1.2, mutool 1.27.2. `pdf-lib` sets the page boxes; Remotion `renderStill` (+
`@remotion/bundler` / `@remotion/renderer`, pinned) reused from the video pipeline.

## Verification

`npm run verify:print [id]` exports a doc and asserts the press contract on the
actual bytes: DevCMYK image (true CMYK), PDF/X-1a (PDF 1.3) with a GTS_PDFX
OutputIntent, BleedBox = MediaBox, and TrimBox = finished size inset by the bleed.

## Related specs

- [Product Video (Remotion)](./product-video.md) — the deterministic
  `bundle → selectComposition → renderStill` render path this reuses.
- [Storybook Catalog](./storybook-catalog.md) — the widgets a print composes.
- [Neumorphism Engine](./neumorphism-engine.md) — the look, and why raster-first.
- [Generated Assets (image-gen)](./generated-assets.md) — print-resolution imagery.

## Source

- [src/print/PrintRenderer.tsx](../src/print/PrintRenderer.tsx) — `PrintStage`, geometry context, crop marks, preview guides
- [src/print/geometry.ts](../src/print/geometry.ts) · [src/print/types.ts](../src/print/types.ts) — units/presets · `PrintDoc` model
- [src/print/pages/](../src/print/pages/) — page registry + authored pages (e.g. `sample-a4.tsx`)
- [src/remotion/PrintPageVideo.tsx](../src/remotion/PrintPageVideo.tsx) — the `PrintPage` composition + `calculatePrintMetadata`
- [src/print/ui/PrintsApp.tsx](../src/print/ui/PrintsApp.tsx) — index + viewport (zoom/fit) + export panel (the operator GUI)
- [prints.html](../prints.html) + [src/print/main.tsx](../src/print/main.tsx) — the standalone generator page (separate from `index.html`; both registered in `vite.config.ts` build inputs)
- [vite-plugin-prints.ts](../vite-plugin-prints.ts) — dev API (`/api/prints`, `/api/export-print`, `/api/prints-output`)
- [scripts/export-print.mjs](../scripts/export-print.mjs) — render → CMYK PDF/X + PNG/JPG (`npm run export -- <id>`)
- [scripts/verify-print.mjs](../scripts/verify-print.mjs) — acceptance gate (`npm run verify:print`)
- `public/icc/` — ICC profiles · `public/prints/<id>/doc.json` — documents · `out/prints/` — output
