/**
 * perspective-cards — "Flip 3D · Cartas"
 * ──────────────────────────────────────────────────────────────────────────
 * Each word is a flat card that settles onto the table. The headline row owns a
 * shared 3D scene (`perspective: 1100px`, `transform-style: preserve-3d`) and
 * every word flips about its bottom edge from rotateX(-88deg) → 0, rising a
 * touch as it lands and fading up — staggered left→right with GENEROUS overlap
 * so the cards flow into one another rather than landing one isolated tile at a
 * time. While a card is still tilted its face dims gently (its "edge" turns away
 * from the light) so depth reads without looking harsh; on arrival each card
 * does a soft micro-settle (scale 1.03→1) and a slight blur→sharp rack-focus.
 * Strictly ease-out via EASE.out / EASE.outSoft — no spring, no overshoot — then
 * the row HOLDS calm and dead-still, letting the line breathe.
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

// Generous OVERLAP: each card begins well before its predecessor has settled,
// so siblings flow into one another instead of clumping or marching.
const STEP = 9; // frames between successive cards STARTING (left→right)
const FLIP_DUR = 26; // frames for one card to fall flat (long, elegant settle)
const SETTLE = 12; // micro-settle tail (scale + rack-focus) after the flip lands
const BASE = 6; // first card starts here

export const PerspectiveCards: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);

  // the whole line is settled once the last card has finished flip + micro-settle
  const lastStart = stagger(words.length - 1, STEP, BASE);
  const revealEnd = lastStart + FLIP_DUR + SETTLE;

  // subtitle rises in on a gentle long tail as the final card settles
  const sub = prog(frame, revealEnd - 16, revealEnd + 22, EASE.outSoft);

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
      {/* the shared 3D stage — perspective + preserve-3d live on the row */}
      <div
        style={{
          // em gap resolves against this font-size; match the headline so the
          // word spacing is real (otherwise it collapses to the ~16px root em).
          fontSize: 116,
          display: 'inline-flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          gap: '0.28em',
          perspective: 1100,
          transformStyle: 'preserve-3d',
        }}
      >
        {words.map((w, i) => {
          const start = stagger(i, STEP, BASE);
          // primary fall — soft, quick takeoff, long elegant settle
          const flip = prog(frame, start, start + FLIP_DUR, EASE.out); // 0→1 landing
          // secondary micro-settle that runs into the tail of the flip
          const settle = prog(frame, start + FLIP_DUR - 8, start + FLIP_DUR + SETTLE, EASE.outSoft);

          // card falls flat about its bottom edge: -88deg (face away) → 0
          const rotX = lerp(-88, 0, flip);
          // a small lift as it lands — settles to 0
          const ty = (1 - flip) * 0.16; // em
          // micro-settle on arrival: a gentle scale 1.03 → 1 (no bounce, pure ease-out)
          const scale = lerp(1.03, 1, settle);
          // rack-focus: a touch of blur while tilted that sharpens as it lands flat
          const blur = (1 - flip) * 4; // px
          // dim the tilted face so the 3D reads, brighten as it lands flat —
          // softened range so depth shows without looking harsh
          const faceDim = lerp(0.52, 1, clamp01(flip * 1.15));
          const isLast = i === words.length - 1;

          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                transformStyle: 'preserve-3d',
                transformOrigin: 'center bottom',
                transform: `translateY(${ty}em) rotateX(${rotX}deg) scale(${scale})`,
                opacity: clamp01(flip * 1.4),
                fontSize: 116,
                fontWeight: 550,
                letterSpacing: '-0.02em',
                lineHeight: 0.98,
                // flat colour darkened while tilted — single accent on the last word
                color: isLast ? palette.accent : palette.fg,
                filter:
                  faceDim < 0.999 || blur > 0.05
                    ? `brightness(${faceDim}) blur(${blur}px)`
                    : undefined,
                willChange: 'transform, opacity, filter',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* subtitle — rises in beneath once the last card has settled */}
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
