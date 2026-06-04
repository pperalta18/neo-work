/**
 * line-stack — "Pila multilínea"
 * ──────────────────────────────────────────────────────────────────────────
 * The editorial poster. The hero line is broken into 2–3 balanced lines (roughly
 * even word counts) and stacked vertically, left-aligned with a tight line-height
 * so the block reads as one solid mass. Each line lives in its own
 * `overflow:hidden` mask and slides in from an ALTERNATING side — line 0 enters
 * from the left, line 1 from the right, line 2 from the left again — while also
 * rising on translateY and racking from a hair of blur into focus. Lines use a
 * GENEROUS OVERLAPPING stagger so siblings flow into one another, and each
 * settles with a tiny scale 1.03→1 micro-move (no bounce). All motion is
 * EASE.out / EASE.outSoft — quick soft takeoff, long elegant settle. The single
 * accent colours the last word (colour only — no underline / hairline). After
 * the stack lands it HOLDS, calm and breathing (the showcase owns any exit).
 * Flat: no relief, no glow, no horizontal rules.
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
  stagger,
} from '../shared';

const BASE = 6; // the first line starts entering here
const STEP = 11; // nominal frames between successive line starts (overlaps SLIDE)
const SLIDE = 30; // each line's own enter duration (slide + rise + rack-focus)
const SHIFT = 0.42; // horizontal slide distance, in em — soft editorial drift

/**
 * Break `words` into `n` lines with roughly even word counts, preserving order.
 * Deterministic: depends only on the word array length. 2 lines for short heads,
 * 3 for longer ones, but never more lines than words.
 */
function balanceLines(words: string[]): string[][] {
  const n = Math.min(words.length, words.length > 4 ? 3 : 2);
  if (n <= 1) return [words];
  const per = Math.ceil(words.length / n);
  const lines: string[][] = [];
  for (let i = 0; i < words.length; i += per) lines.push(words.slice(i, i + per));
  return lines;
}

export const LineStack: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);
  const lines = balanceLines(words);

  // the last word of the last line carries the single accent (colour only)
  const lastLine = lines.length - 1;
  const lastWord = lines[lastLine].length - 1;

  // subtitle rises in once the final line is well on its way (overlap, not after)
  const lastStart = stagger(lines.length - 1, STEP, BASE);
  const sub = prog(frame, lastStart + SLIDE * 0.5, lastStart + SLIDE + 14, EASE.outSoft);

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
      {/* the stacked block — left-aligned, tight leading, one column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          maxWidth: '86%',
        }}
      >
        {lines.map((line, li) => {
          const start = stagger(li, STEP, BASE);
          // primary eased slide of THIS line — soft takeoff, long settle
          const enter = prog(frame, start, start + SLIDE, EASE.out);
          // opacity solidifies a touch faster, so the line is opaque as it clears the edge
          const fade = clamp01(prog(frame, start, start + SLIDE * 0.55, EASE.out));
          // secondary micro-settle: a gentle scale 1.03 → 1 on a softer, longer curve
          const settle = prog(frame, start, start + SLIDE * 1.15, EASE.outSoft);
          const scale = lerp(1.03, 1, settle);
          // rack-focus: a hair of blur racking to sharp as the line arrives (no bounce)
          const blurPx = (1 - settle) * 5;
          // alternate the entry side: even lines from the left, odd from the right
          const dir = li % 2 === 0 ? -1 : 1;
          const dx = (1 - enter) * dir * SHIFT; // em — slides to 0
          const dy = (1 - enter) * 0.2; // em — small rise to baseline

          return (
            // the MASK: clips its line so it appears to emerge from the column edge
            <span
              key={li}
              style={{
                display: 'block',
                overflow: 'hidden',
                // a hair of vertical padding so ascenders/descenders aren't shaved
                padding: '0.07em 0',
                lineHeight: 0.98,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  fontSize: 100,
                  fontWeight: 550,
                  letterSpacing: '-0.025em',
                  lineHeight: 0.98,
                  color: palette.fg,
                  opacity: fade,
                  // transform-origin at the entry edge so the scale settle reads as a lean-in
                  transformOrigin: dir < 0 ? 'left center' : 'right center',
                  transform: `translate(${dx}em, ${dy}em) scale(${scale})`,
                  filter: blurPx > 0.04 ? `blur(${blurPx}px)` : 'none',
                  willChange: 'transform, opacity, filter',
                }}
              >
                {line.map((w, wi) => {
                  const isAccent = li === lastLine && wi === lastWord;
                  const isLastInLine = wi === line.length - 1;
                  return (
                    <span
                      key={wi}
                      style={{ color: isAccent ? palette.accent : undefined }}
                    >
                      {w}
                      {isLastInLine ? '' : ' '}
                    </span>
                  );
                })}
              </span>
            </span>
          );
        })}
      </div>

      {/* subtitle — rises in beneath once the stack is landing (flows, no underline) */}
      {subtitle && (
        <div
          style={{
            marginTop: 36,
            alignSelf: 'center',
            fontFamily: TEXT_FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: palette.muted,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 18}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
