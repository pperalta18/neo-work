# Motion Language (curves, beats, principles)

**Keywords**: easing curves, cubic-bezier, ease-out, emphasized decelerate /
accelerate, Material 3 easing tokens, no bounce, duration tokens, timing &
spacing, beat / rhythm, sound-led cuts, holds, reveal arc, anticipation,
overshoot, follow-through, Apple product-film grammar, Disney 12 principles,
light & depth, rack focus, Remotion `Easing.bezier`, motion-for-video.

## Purpose

The shared vocabulary for **motion in AiKit videos** (Remotion product/brand
films) — not UI microinteractions. It answers two questions: *which curve* and
*at what rhythm*, and records what we learned about what makes a good video
animation. The reference implementation is
[`MotionShowcaseVideo.tsx`](../src/remotion/MotionShowcaseVideo.tsx).

House rules (AiKit decisions):

- **Light mode**, on the neumorphic surface. Depth = neumorphic relief
  (`elevation()`), **never coloured drop-shadows or glows**.
- **No bounce.** Entrances *decelerate* to rest. We use eased `interpolate`,
  not overshooting `spring()`. (Springs are allowed only when a gesture hands
  off velocity — which video has none of, so: ease-out.)

---

## The curves

Three named curves cover everything. They are the **Material 3 "emphasized"
set** — the most-documented, benchmark video easing (snappy take-off, soft
landing). Exact béziers, ready for Remotion's `Easing.bezier`:

| Token | cubic-bezier | Use it for |
|---|---|---|
| **`ENTER`** (emphasized decelerate) | `0.05, 0.7, 0.1, 1` | anything **appearing / arriving** — tiles flying in, the hero emerging, the wordmark rising. The default. |
| **`EXIT`** (emphasized accelerate) | `0.3, 0, 0.8, 0.15` | anything **leaving** — elements accelerating off-screen / dissolving out. |
| **`STANDARD`** (begin+end on screen) | `0.2, 0, 0, 1` | **moves that start and end on screen** — repositions, a light sweep / sheen, the camera dolly. |

```ts
import { Easing } from 'remotion';

export const CURVE = {
  enter:    Easing.bezier(0.05, 0.7, 0.1, 1),  // decelerate — appears / arrives  (DEFAULT)
  exit:     Easing.bezier(0.3, 0, 0.8, 0.15),  // accelerate — leaves / dissolves
  standard: Easing.bezier(0.2, 0, 0, 1),       // on-screen moves, sweeps, camera
} as const;
```

**Why ease-out is the default:** it starts fast and settles slow, which reads as
*responsive* — the single most repeated rule across Apple, Material 3 and the
craft canon. Linear is reserved for things that don't travel (a steady rotation,
an opacity-only cross-fade).

### Timing (durations)

Curve answers *how*; duration answers *how long*. Research consensus, in ms and
frames @30fps:

| Token | ms | frames | For |
|---|---|---|---|
| `micro` | ~130 | 4 | tiny state flips, accents |
| `quick` | ~230 | 7 | small elements appearing |
| `base` | ~330 | 10 | the workhorse reveal |
| `reveal` | ~500 | 15 | a hero element forming |
| `grand` | ~700 | 21 | large traversals across the frame |

Rule of thumb: **duration scales with the distance travelled** (small move →
short, full-frame move → long), and most things sit in 100–500 ms. Stagger
sibling elements by ~`quick` so they read as a sequence, not a clump
(*timing & spacing*).

---

## Beat & rhythm

Video motion is **edited to a beat**, not a continuous flow. Cut on a rhythm
even before audio exists, then lock the cuts to the song's downbeats once it
does (see [Music Sync](./music-sync.md), which turns a beat map into frame
timings).

The showcase uses a 5-beat **reveal arc** — a reusable shape for a brand/product
open:

| Beat | Frames | What | Principle |
|---|---|---|---|
| 0 · Anticipation | 0–10 | the quiet before the move (hero sits pressed-in) | a small counter-move announces the action |
| 1 · Assembly | 10–96 | parts glide in, **staggered**, blur→sharp | staging · timing & spacing · rack focus |
| 2 · Emerge / morph | 96–150 | parts converge + fade; the mark forms | seamless morph · light "drawn across" |
| 3 · Wordmark | 150–210 | the logo wordmark rises in | secondary action · long settle |
| 4 · Breathe | 210–300 | slow parallax + push-in; relief settles | follow-through · the shot exhales |

**Holds matter as much as motion.** The cluster pauses (beat 1 → 2) before it
morphs; the end *breathes* instead of freezing dead. Silence is part of the
rhythm.

---

## What makes a good video animation (from the research)

The doctrine behind the rules above, drawn from Apple (HIG / *Designing Fluid
Interfaces* / *Animate with Springs*), Material 3, IBM Carbon, and the film canon
(Disney's 12 principles — which were born for film, not UI):

- **Purpose over decoration.** Every move informs, reveals or directs attention.
  No motion for motion's sake.
- **Ease-out asymmetry.** Fast in, gentle settle → feels alive and responsive.
- **Timing & spacing** are the craft. *Timing* = how many frames; *spacing* =
  how the movement is distributed across them (wide gaps = speed, tight = mass).
  Non-linear spacing — i.e. the curve — is what separates polished from robotic.
- **Anticipation · overshoot · follow-through.** A counter-move before, a touch
  of settle after, trailing secondary motion. *(We express settle without
  literal bounce — a decelerating ease, not a spring overshoot.)*
- **Light & depth (the Apple product-film grammar).** Backlight/relief,
  shallow-DOF rack focus (blur→sharp on arrival), a sheen drawn across edges,
  a slow dolly. We translate "light" into **neumorphic relief**, not glows.
- **Short and proportional.** Most motion is 100–500 ms; duration grows with the
  distance covered.
- **Sound-led.** Cuts and accents land on the beat; the edit has rhythm and
  holds, it doesn't drone.

Physics-vs-curves note: 2023–2026 the field is shifting from fixed béziers to
**spring/physics** models (Apple's *duration + bounce*, Material 3's physics
schemes). We deliberately stay on **ease-out curves with bounce = 0** because
(a) there's no gesture velocity to hand off in a render, and (b) the AiKit look
is calm, not playful.

---

## Related specs

- [Product Video (Remotion)](./product-video.md) — compositions, deterministic render, beat-driven scene timing.
- [Music Sync (Beats)](./music-sync.md) — the beat map that the rhythm above locks onto.
- [Neumorphism Engine](./neumorphism-engine.md) — `elevation()`, the relief that stands in for "light & depth".
- [Emergence Animation](./emergence-animation.md) — the flat→raised reveal this language generalises.

## Source

- [src/remotion/MotionShowcaseVideo.tsx](../src/remotion/MotionShowcaseVideo.tsx) — reference implementation (curves + the 5-beat arc).
- [src/lib/neumorphism.ts](../src/lib/neumorphism.ts) — `elevation`, themes, `BRAND`.
