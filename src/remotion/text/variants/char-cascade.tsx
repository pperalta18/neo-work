/**
 * char-cascade — "Letra a letra"
 * ──────────────────────────────────────────────────────────────────────────
 * A smooth typographic ripple. The line is split into words, and each word into
 * its own characters; every character eases up from just below (+0.22em), fades
 * 0→1 and racks from a SLIM blur → sharp, on a generous OVERLAPPING per-character
 * stagger so siblings flow into one another instead of clumping — the headline
 * materialises left-to-right like a soft wave of type. Each glyph also carries a
 * tiny micro-settle (1.04→1 scale) so the arrival reads "worked", not mechanical,
 * with NO bounce / NO overshoot. Words stay whole (inline-block, real gaps) so
 * nothing breaks mid-word. The last word carries the single accent — COLOUR only,
 * no line. After the cascade lands it HOLDS, fully sharp and calm; the showcase
 * owns the outgoing transition. Pure ease-out (EASE.out).
 *
 * Weight 550 — elegant medium, never heavy. No underlines / hairline rules.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  type TextAnimProps,
  PALETTE,
  DISPLAY_FONT,
  TEXT_FONT,
  EASE,
  DUR,
  prog,
  clamp01,
  lerp,
  splitWords,
  splitChars,
  stagger,
} from '../shared';

const HEAD_WEIGHT = 550; // elegant medium — Universal Sans Display has a real 550 face
const FONT_SIZE = 110;

// Generous OVERLAPPING stagger: each char's own ramp (CHAR_DUR) is much longer
// than the gap between starts (STEP), so neighbours flow into each other.
const STEP = 1.9; // frames between consecutive characters — tight but flowing
const CHAR_DUR = DUR.reveal + DUR.quick; // ~22f per char → long, overlapping tails
const SUB_BASE = 16; // subtitle begins once the cascade is well underway

export const CharCascade: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);
  const lastWord = words.length - 1;

  // A single running character index across all words gives one continuous,
  // left-to-right stagger (the inter-word gaps don't consume a step).
  let charIndex = 0;

  // subtitle rises in softly once enough of the line has cascaded — a secondary,
  // larger move, so it gets the gentler long-tailed curve.
  const sub = prog(frame, SUB_BASE, SUB_BASE + DUR.grand, EASE.outSoft);

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
      {/* the headline row — words flow and wrap as whole units */}
      <div
        style={{
          // the inter-word gap is em-based, so anchor it to the headline size
          // (children inherit) — at the inherited ~16px root it would collapse.
          fontSize: FONT_SIZE,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'baseline',
          gap: '0 0.28em', // the real space between words; chars sit tight
          maxWidth: '90%',
          textAlign: 'center',
        }}
      >
        {words.map((word, wi) => {
          const isLast = wi === lastWord;
          const chars = splitChars(word);
          return (
            // inline-block keeps each word from breaking across a line
            <span key={wi} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
              {chars.map((ch, ci) => {
                const start = stagger(charIndex++, STEP); // continuous, overlapping cascade
                // smooth expo-out: a soft, quick takeoff and a long elegant settle
                const t = prog(frame, start, start + CHAR_DUR, EASE.out);
                const dy = lerp(0.22, 0, t); // eases up from slightly below
                const blur = lerp(5, 0, t); // slim rack-focus → sharp
                const scale = lerp(1.04, 1, t); // subtle micro-settle, never a bounce
                return (
                  <span
                    key={ci}
                    style={{
                      display: 'inline-block',
                      fontSize: FONT_SIZE,
                      fontWeight: HEAD_WEIGHT,
                      letterSpacing: '-0.015em',
                      lineHeight: 1.04,
                      color: isLast ? palette.accent : palette.fg,
                      opacity: clamp01(t),
                      transform: `translateY(${dy}em) scale(${scale})`,
                      transformOrigin: 'center bottom',
                      filter: blur > 0.25 ? `blur(${blur}px)` : undefined,
                      willChange: 'transform, opacity, filter',
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
            </span>
          );
        })}
      </div>

      {/* subtitle — rises in beneath as the line settles (colour-only, no line) */}
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
            willChange: 'transform, opacity',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
