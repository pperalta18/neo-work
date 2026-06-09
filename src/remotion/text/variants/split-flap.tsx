/**
 * split-flap — "Persiana" (horizontal split-band assemble)
 * ──────────────────────────────────────────────────────────────────────────
 * The line is rendered TWICE, stacked pixel-for-pixel, and each copy is masked
 * to one horizontal half with `clip-path: inset(…)`: the top copy keeps its
 * upper half, the bottom copy its lower half. The two halves slide in from
 * opposite directions — top from above (−0.5em, slightly left), bottom from
 * below (+0.5em, slightly right) — and ease to 0 on EASE.out, converging into
 * one seamless word like a closing window blind.
 *
 * Polish: the two bands carry a hair of blur while in motion that racks to
 * sharp exactly as they meet, plus a whisper of secondary scale (1.03 → 1)
 * settling the whole word after contact. No seam line — the single accent is
 * carried by COLOUR on the last word only. Pure ease-out, no bounce, then a
 * calm generous hold.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  type TextAnimProps,
  PALETTE,
  DISPLAY_FONT,
  TEXT_FONT,
  EASE,
  prog,
  clamp01,
  lerp,
  splitWords,
} from '../shared';

const ENTER = 26; // frames for the two halves to converge
const SETTLE = 16; // micro-settle (scale + final sharpen) trails the convergence

// Shared headline type so the two clipped copies are pixel-identical.
// Weight 550 — elegant medium, never heavy (Universal Sans Display 550 face).
const HEADLINE: React.CSSProperties = {
  margin: 0,
  fontFamily: DISPLAY_FONT,
  fontSize: 122,
  fontWeight: 550,
  letterSpacing: '-0.02em',
  lineHeight: 1.02,
  whiteSpace: 'nowrap',
};

export const SplitFlap: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();

  // ── the two halves converge: top from above, bottom from below ──
  // overlapping with the settle so the move never visibly "stops"
  const assemble = prog(frame, 0, ENTER, EASE.out); // 0 → 1, soft takeoff / long tail
  const offset = (1 - assemble) * 0.5; // em the halves still have to travel

  // top half: starts up & a touch left, bottom half: down & a touch right
  const topTransform = `translate(${-offset * 0.16}em, ${-offset}em)`;
  const bottomTransform = `translate(${offset * 0.16}em, ${offset}em)`;

  // each half fades up; bias opacity so it's solid the instant it lands
  const fade = clamp01(assemble * 1.3);

  // secondary motion: a whisper of scale settling the assembled word (1.03 → 1),
  // overlapping the tail of the convergence so the two beats flow into each other
  const settle = prog(frame, ENTER * 0.55, ENTER * 0.55 + SETTLE, EASE.outSoft);
  const wordScale = lerp(1.03, 1, settle);

  // rack-focus: bands carry a hair of motion-blur that resolves to sharp as they
  // meet — driven by the SAME assemble progress, so it's a pure function of frame
  const blurPx = lerp(5, 0, prog(frame, 0, ENTER * 0.9, EASE.out));

  // subtitle rises in, overlapping the word's settle (generous stagger)
  const sub = prog(frame, ENTER - 10, ENTER + 18, EASE.out);

  // accent the last word by COLOUR only (no line) when there's more than one word
  const words = splitWords(text);
  const headlineNodes =
    words.length > 1
      ? words.map((w, i) => (
          <span key={i} style={{ color: i === words.length - 1 ? palette.accent : palette.fg }}>
            {i > 0 ? ' ' : ''}
            {w}
          </span>
        ))
      : text;

  // one clipped copy of the headline (same markup, different mask + motion)
  const half = (clip: string, transform: string) => (
    <span
      style={{
        ...HEADLINE,
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        color: palette.fg,
        clipPath: clip,
        opacity: fade,
        transform,
        filter: blurPx > 0.05 ? `blur(${blurPx}px)` : undefined,
        willChange: 'transform, opacity, filter',
      }}
    >
      {headlineNodes}
    </span>
  );

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: DISPLAY_FONT,
      }}
    >
      {/* stacking context: an in-flow ghost sets the box; the two halves overlay it.
          a whisper of scale settles the whole assembled word (secondary motion). */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          transform: `scale(${wordScale})`,
          transformOrigin: 'center',
          willChange: 'transform',
        }}
      >
        {/* invisible sizer — gives the absolutely-positioned halves their box */}
        <span style={{ ...HEADLINE, visibility: 'hidden' }}>{text}</span>

        {/* upper half — slides down from above */}
        {half('inset(0 0 50% 0)', topTransform)}

        {/* lower half — rises up from below */}
        {half('inset(50% 0 0 0)', bottomTransform)}
      </div>

      {/* subtitle — rises beneath once the word is whole */}
      {subtitle && (
        <div
          style={{
            marginTop: 38,
            fontFamily: TEXT_FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: palette.muted,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 16}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
