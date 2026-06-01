# Cursor Lottie assets

Drop LottieFiles cursor / click JSON files here and wire them into `<Cursor>`.

## Where to get them

Pick a pack on LottieFiles (free or paid), then **Download → Lottie JSON**:

- Cursor Animation Pack — https://lottiefiles.com/marketplace/cursor-2_193575
- Cursor & Pointer Pack — https://lottiefiles.com/marketplace/cursor-pointer_188389
- Click Cursor Pointer Pack — https://lottiefiles.com/marketplace/click-cursor-pointer_124231

Or paste a URL straight into the **Motion/Cursor (Lottie) → LoadFromUrl** story to
preview before committing an asset.

## How to use

Save the JSON files here, then build a `CursorLottie` map and pass it to `<Cursor>`:

```tsx
import hand from './cursors/hand.json'
import click from './cursors/click.json'
import { Cursor } from '../Cursor'

const lottie = { hand, click }

<Cursor lottie={lottie} /> // hover shows the animated hand; click plays the effect
```

Any state without a Lottie (`arrow`, `text`, `grab`, `grabbing`) falls back to the
built-in crisp SVG glyph. `lottieAnchor` controls the hotspot:
`center` (default, most packs are centred) or `topleft`.

## Remotion later

The same JSON renders frame-perfect in Remotion via `@remotion/lottie`'s `<Lottie>`
— the `<Cursor>` + timeline stay identical; only the playback host changes.
