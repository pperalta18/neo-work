# Storybook Catalog

A Storybook workspace (`@storybook/react-vite`) that hosts reusable neumorphic
components and composed widgets, all driven by the [Neumorphism Engine](./neumorphism-engine.md).
It is the design playground where new neumorphic pieces are added and tuned.

## Capabilities

- Authors run the catalog with `npm run storybook` (dev, port 6006) or
  `npm run build-storybook` (static export).
- A global **toolbar** re-lights every component live: a **Theme** picker
  (light / dark) and a **Light** picker (light-source corner `tl`/`tr`/`bl`/`br`).
- Components read the active theme through a React context (`useNeoTheme`),
  populated by the preview decorator from the toolbar globals — no per-story prop
  threading.
- **Primitives** (group `Neo/`):
  - `NeoSurface` — the base plate (`raised` / `recessed` / `flat`) with
    `distance`, `blur`, `radius`, `padding`, `align` controls.
  - `NeoButton` — a pressable button that sinks (`raised`→`recessed`) on press;
    supports a Hugeicon (left / right / icon-only), `accent` (blue tint), elevation
    controls (`distance`, `blur`, `radius`), and `tone="solid"` with a custom
    `fill` (the dark / coloured action button).
  - `NeoCard` — the rounded raised panel widgets sit on.
  - `NeoMessage` / `NeoInput` — chat bubble + input for mini-chat compositions.
  - `NeoReasoning` — an LLM **chain-of-thought** trace: ordered reasoning steps
    wired by a vertical rail, each `done` (blue check) / `active` (spinner) /
    `pending` (muted dot), with an optional elapsed-time header.
- **Widgets** (group `Neo/Widgets`) — refined sample compositions: Alarm, PIN
  (recessed slots), Expenses (multi-series bar chart), Stopwatch, Call (red
  hang-up), Schedule, a `Browser` window (tab strip with brand traffic dots,
  toolbar + recessed address bar, recessed viewport), a `Spreadsheet` (an
  Excel-style table sunk into a recessed sheet — A/B/C column header + numbered
  row gutter, gridlines, the active cell drawn with the blue accent + fill handle,
  and a formula bar), and a `Landing` — a
  configurable abstraction of a marketing landing page (header with logo + nav +
  CTA, hero with eyebrow pill / headline / subhead / two actions + recessed
  preview, and a row of feature tiles). A `Gallery` story shows them together.
- **Landing kit** — a second wave of widgets built to illustrate the AiKit landing
  (Promise / Picture / Proof / Push): `ModuleGalleryWidget` (tabbed
  Controla/Delega/Construye catalogue, group `Neo/AiKit`), `TimelineWidget` (phase
  stepper, horizontal / vertical), `DropzoneWidget` (drag-drop upload + progress),
  `SignatureWidget` (e-signature on a document), `StatWidget` (KPI tile + before→after),
  `ChartWidget` (smoothed line/area cash-flow chart — sibling of Expenses bars),
  `DashboardWidget` (composed executive summary), `InboxWidget` (multichannel inbox:
  email/WhatsApp/chat/web), `ToastWidget` (success/warning/info/error alert),
  `StorefrontWidget` (product grid), `POSWidget` (point of sale: ticket + keypad),
  `LoyaltyCardWidget` (gradient wallet/points card), `JobPostWidget` (vacancy +
  candidate match), `SecurityWidget` (privacy/encryption panel), `PricingWidget`
  (plan card), `ComparisonWidget` (AiKit vs ChatGPT table), `TestimonialWidget`
  (quote card). An overview story `Neo/Widgets > LandingKit` shows them together;
  every widget also has its own story with variants.
- **AikitModule** (group `Neo/AikitModule`) — a brand module badge (icon +
  wordmark) for each of the 16 AiKit modules. The icon defaults to the baked
  SVG, but an `animated` flag swaps in the module's **Rive** vector animation
  (`aikit-modules.riv`, one artboard per module). Each artboard runs
  `State Machine 1`, re-plays on click (the `click` trigger), and has its
  `colorBackground` bound live to the active theme surface. Stories: `Animated`,
  `AnimatedCatalogue`, `AnimatedIconGrid` alongside the static `Catalogue` / `IconGrid`.
- **Brand palette** (story `Neo/Brand Palette`) — swatches of the `BRAND` colours
  with name + hex for reference.

## Constraints

- The preview decorator (`.storybook/preview.tsx`) imports `src/index.css` (the
  Universal Sans fonts) and paints the canvas with the active theme's `surface`.
- Stories live under `src/stories/**` matching `*.stories.@(js|jsx|mjs|ts|tsx)`
  (see `.storybook/main.ts`). Neo pieces are in `src/stories/neo/`, widgets in
  `src/stories/neo/widgets/`.
- Adding a new icon means adding it to the curated set in `src/components/icons.tsx`;
  it then appears in `NeoButton`'s `icon` selector automatically.
- `storybook-static/` (build output) is gitignored.

## Related specs

- [Neumorphism Engine](./neumorphism-engine.md) — themes, elevation, brand palette.
- [Cursor (Motion)](./motion-cursor.md) — non-neumorphic motion component in the same catalog.

## Source

- [.storybook/main.ts](../.storybook/main.ts), [.storybook/preview.tsx](../.storybook/preview.tsx)
- [src/stories/neo/](../src/stories/neo/) — `NeoTheme`, `NeoSurface`, `NeoButton`, `NeoCard`, widgets
- [src/components/icons.tsx](../src/components/icons.tsx) — curated Hugeicons set
- [src/stories/neo/modules/](../src/stories/neo/modules/) — `AikitModule`, `RiveModuleIcon`, `modules.ts`, `aikit-modules.riv`
