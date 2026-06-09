/**
 * word-rise — "Palabras · Rise"
 * ──────────────────────────────────────────────────────────────────────────
 * The classic clean motion-graphics word reveal, refined. The hero line is
 * split into words; each word sits inside its own `overflow:hidden` box (a
 * "mask") and translates up from below the baseline to 0 on EASE.out — a quick,
 * soft takeoff and a long, elegant settle. The stagger OVERLAPS generously, so
 * word N begins rising before word N-1 has fully landed and the cascade flows
 * rather than clumps. As each word clears its mask edge it racks from a hair of
 * blur into sharp focus and micro-settles from 1.03 → 1 scale — secondary
 * motion, never a bounce. The last word carries the single accent COLOUR (no
 * lines anywhere). After the cascade lands the whole line HOLDS, calm and
 * breathing; the showcase owns any exit. Pure ease-out, flat, no relief.
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
  stagger,
} from '../shared';

const BASE = 6; // first word starts rising here — a soft beat before motion
const STEP = 5; // frames between successive word starts — tight, overlapping
const RISE = DUR.grand; // each word's own rise duration (~700ms) — long, elegant tail
const SETTLE = DUR.reveal; // extra window after the rise for the micro-settle to resolve

export const WordRise: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);

  // the subtitle eases in once the last word has cleared its mask — overlapped
  // so it flows out of the cascade rather than waiting for a full stop.
  const lastStart = stagger(words.length - 1, STEP, BASE);
  const sub = prog(frame, lastStart + RISE - 4, lastStart + RISE + DUR.grand, EASE.outSoft);

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
      {/* headline row — words wrap, each inside its own clipping mask */}
      <div
        style={{
          // em-based gaps resolve against THIS font-size, so set it to the
          // headline size (the word spans inherit it) — otherwise the gap would
          // resolve against the inherited ~16px root and words would touch.
          fontSize: 120,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'flex-end',
          gap: '0.06em 0.28em',
          maxWidth: '88%',
          textAlign: 'center',
        }}
      >
        {words.map((w, i) => {
          const start = stagger(i, STEP, BASE);
          const isLast = i === words.length - 1;

          // eased masked rise of THIS word across its own long window
          const rise = prog(frame, start, start + RISE, EASE.out);
          // opacity solidifies a touch faster, so the word is opaque as it
          // clears the mask edge (no see-through letters mid-rise)
          const fade = clamp01(prog(frame, start, start + RISE * 0.55, EASE.out));

          // secondary motion, all keyed to the SAME long window so it resolves
          // calmly after the rise rather than snapping:
          // · rack-focus: a hair of blur that sharpens as the word clears the mask
          const focus = prog(frame, start + RISE * 0.2, start + RISE * 0.9, EASE.outSoft);
          const blurPx = lerp(6, 0, focus);
          // · micro-settle: a gentle 1.03 → 1 scale that lands after the rise,
          //   ease-out so it eases IN to rest with no overshoot
          const settle = prog(frame, start, start + RISE + SETTLE, EASE.outSoft);
          const scale = lerp(1.03, 1, settle);

          return (
            // the MASK: clips its word to a hidden baseline
            <span
              key={i}
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                // a hair of vertical padding so descenders aren't shaved by the clip
                padding: '0.14em 0',
                lineHeight: 0.98,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 120,
                  fontWeight: 550,
                  letterSpacing: '-0.02em',
                  lineHeight: 0.98,
                  color: isLast ? palette.accent : palette.fg,
                  opacity: fade,
                  // rises from below the mask edge up to its resting baseline,
                  // with a calm micro-settle scale that resolves after the rise
                  transform: `translateY(${(1 - rise) * 116}%) scale(${scale})`,
                  filter: blurPx > 0.05 ? `blur(${blurPx}px)` : 'none',
                  transformOrigin: 'center bottom',
                  willChange: 'transform, filter',
                }}
              >
                {w}
              </span>
            </span>
          );
        })}
      </div>

      {/* subtitle — rises in beneath once the cascade has landed */}
      {subtitle && (
        <div
          style={{
            marginTop: 36,
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
