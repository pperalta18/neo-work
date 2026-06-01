# Device Mockups (3D)

Real WebGL 3D device frames (react-three-fiber) whose screens are "painted"
with arbitrary React UI, so any widget or screenshot can be shown on a phone or
laptop in a studio-lit, tiltable scene. Used for hero shots and Remotion frames.

## Capabilities

- Authors can drop any **React UI** onto a device screen (`children`) or show a
  **screenshot URL** full-bleed (`screenImage`) instead.
- Two devices are available:
  - **Phone 3D** — driven by an iPhone 15 Pro Max FBX (portrait).
  - **Laptop 3D** — driven by a MacBook Air 13" FBX (landscape).
- Authors can recolour the chassis (`bodyColor`, `bodyRoughness`, `bodyMetalness`)
  — e.g. matte white, space grey. The laptop defaults to aluminium silver.
- The device shows a soft contact **shadow**, a faint diagonal **glare**, gentle
  idle **sway** (`autoRotate`), and optional **drag-to-rotate** (`enableControls`,
  clamped to the front). A static pose (`autoRotate=false`) suits hero/Remotion frames.
- The screen background defaults to the active **Neo theme** surface; the painted
  UI sits behind a dark reflective glass material.

## Constraints

- The painted display is fitted to the model's real screen, not a guessed
  rectangle. The phone anchors to a named "screen" mesh; the **laptop** has no
  screen mesh (one multi-material body), so its display is fitted from the
  **"Screen Mat" material faces via PCA** — recovering the lid's centre, in-plane
  axes and tilt — and the UI is laid flush on the tilted lid.
- The MacBook FBX ships **two identical bodies**; the duplicate is dropped so a
  single device is shown.
- Models are normalised to a fixed size and re-centred; screens reuse the model's
  own materials except the chassis repaint and the dark glass.

## Related specs

- [Storybook Catalog](./storybook-catalog.md) — where the mockups live as stories.
- [Neumorphism Engine](./neumorphism-engine.md) — supplies the default screen surface.

## Source

- [src/stories/mockup/Phone3D.tsx](../src/stories/mockup/Phone3D.tsx)
- [src/stories/mockup/Laptop3D.tsx](../src/stories/mockup/Laptop3D.tsx)
