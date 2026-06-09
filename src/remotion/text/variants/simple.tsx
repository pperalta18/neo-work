/**
 * simple — "Simple"
 * ──────────────────────────────────────────────────────────────────────────
 * The most restrained reveal in the set: the whole line fades up as ONE block
 * with a small rise on EASE.out (soft takeoff, long elegant settle), then holds.
 * No per-word stagger, no blur, no scale punch — just clean type arriving. The
 * workhorse title for when the motion should stay out of the way. Flat, one
 * colour, deterministic.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { type TextAnimProps, PALETTE, DISPLAY_FONT, TEXT_FONT, EASE, prog, clamp01 } from '../shared';

const ENTER_END = 28; // the line has fully arrived here, then it breathes

export const Simple: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();

  const enter = prog(frame, 0, ENTER_END, EASE.out);
  const sub = prog(frame, 12, 12 + ENTER_END, EASE.out); // flows in just behind the line

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
      <div
        style={{
          fontSize: 124,
          fontWeight: 550,
          letterSpacing: '-0.025em',
          lineHeight: 1.02,
          textAlign: 'center',
          maxWidth: '86%',
          color: palette.fg,
          opacity: clamp01(enter),
          transform: `translateY(${(1 - enter) * 26}px)`,
          willChange: 'transform, opacity',
        }}
      >
        {text}
      </div>

      {subtitle && (
        <div
          style={{
            marginTop: 34,
            fontFamily: TEXT_FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: palette.muted,
            opacity: clamp01(sub),
            transform: `translateY(${(1 - sub) * 16}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
