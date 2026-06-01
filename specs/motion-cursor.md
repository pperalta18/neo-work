# Cursor (Motion)

A realistic on-screen **pointer** for demo videos — an OS-style arrow that
becomes a pointing hand over interactive elements, with a click ripple.
Deliberately **not** neumorphic; it lives in the [Storybook Catalog](./storybook-catalog.md)
(group `Motion/`).

## Capabilities

- Authors wrap any surface with `<Cursor>…</Cursor>`; the native cursor is hidden
  (`cursor: none`) inside that area only.
- The pointer changes shape by what's under it: blank → **arrow**, elements marked
  `data-cursor="hand"` (links / buttons) → **pointing hand**, `data-cursor="text"`
  → **I-beam**, `data-cursor="grab"` → open hand (and **fist** while pressed).
- A **click ripple** plays on press (or via the controlled `clicking` prop).
- **Designed/animated assets** can replace any state: pass a `lottie` map
  (`{ arrow?, hand?, text?, grab?, grabbing?, click? }`) of LottieFiles JSON
  (via `lottie-react`). Provided states render the animation; the rest keep the
  crisp SVG fallback. The **Cursor (Lottie)** story loads a pasted URL live; drop
  committed JSON in `src/stories/motion/cursors/` (see its README).
- Two drive modes:
  - **Follow mouse** (default) — tracks the real pointer; `stiffness < 1` adds
    smooth lag.
  - **Scripted** — `followMouse={false}` + a controlled `at={{x,y}}`, `state`, and
    `clicking`, so motion can be choreographed for a recording.
- Choreography is a **pure timeline**: a list of `CursorKeyframe`s (`at`, `t`,
  `state?`, `ease?`, `click?`) sampled by `sampleCursorTimeline(kfs, t)` →
  `{ at, state, clicking }`. Eases: `linear`, `easeIn`, `easeOut`, `easeInOut`,
  `spring` (back-out overshoot). `useCursorTimeline(kfs, { loop, tail })` plays it
  with a rAF clock for live preview.
- Controls: `size`, `stiffness`, `state`, `followMouse`.

## Remotion-ready

The sampler is a pure function of time, so the same script renders identically in
Remotion later: instead of `useCursorTimeline`, call
`sampleCursorTimeline(kfs, (useCurrentFrame() / fps) * 1000)` and pass the result
to `<Cursor followMouse={false} … />`. No library is installed yet — the cursor and
timeline stand alone today.

## Constraints

- Built-in cursor glyphs are hand-drawn SVGs filled white with a dark outline (the
  outline is a thick dark stroke layer behind a white fill layer — no per-shape
  seams), so they stay legible on any background. Each glyph's hotspot sits at its
  origin. Lottie assets are optional overrides, not required.
- Lottie playback uses `lottie-react`; `@remotion/lottie` is the frame-perfect
  equivalent for the future render path. Both consume the same JSON.
- Animation runs on `requestAnimationFrame` writing transforms to a ref (no
  per-frame React re-render); no animation library.
- Pointer position is measured relative to the wrapper's bounding rect.
- Demo stories use a fixed-size rounded canvas so they sit cleanly inside the
  centered preview decorator.

## Related specs

- [Storybook Catalog](./storybook-catalog.md) — the workspace that hosts it.

## Source

- [src/stories/motion/Cursor.tsx](../src/stories/motion/Cursor.tsx) — the pointer (SVG glyphs + Lottie support)
- [src/stories/motion/cursorTimeline.ts](../src/stories/motion/cursorTimeline.ts) — pure sampler + eases
- [src/stories/motion/useCursorTimeline.ts](../src/stories/motion/useCursorTimeline.ts) — rAF playback hook
- [src/stories/motion/cursors/](../src/stories/motion/cursors/) — drop-in Lottie JSON + how-to
