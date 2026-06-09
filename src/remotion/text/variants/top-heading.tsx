/**
 * top-heading — "Encabezado superior"
 * ──────────────────────────────────────────────────────────────────────────
 * A gentle heading that settles into the TOP of the frame and stays, leaving the
 * area below free for other animations to play under it (a section header with
 * support text). The motion is deliberately soft: a slow, smooth fade + small
 * rise on EASE.outSoft (no blur, no scale, no punch), with the support line
 * easing in just behind. The last word of the heading carries the single accent
 * colour. Holds calmly for the whole shot. Flat, deterministic.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { type TextAnimProps, PALETTE, DISPLAY_FONT, TEXT_FONT, EASE, prog, clamp01, splitWords } from '../shared';

const HEAD_END = 38; // slow, soft heading arrival
const SUPPORT_LAG = 12; // support text follows just behind

export const TopHeading: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);

  const head = prog(frame, 0, HEAD_END, EASE.outSoft);
  const supp = prog(frame, SUPPORT_LAG, SUPPORT_LAG + HEAD_END, EASE.outSoft);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 132,
        fontFamily: DISPLAY_FONT,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '78%' }}>
        {/* the heading — soft fade + rise, last word in accent */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 550,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: palette.fg,
            opacity: clamp01(head),
            transform: `translateY(${(1 - head) * 24}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {words.map((w, i) => (
            <span key={i} style={{ color: i === words.length - 1 ? palette.accent : palette.fg }}>
              {w}
              {i < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </div>

        {/* support text — eases in just behind the heading */}
        {subtitle && (
          <div
            style={{
              marginTop: 18,
              fontFamily: TEXT_FONT,
              fontSize: 27,
              fontWeight: 500,
              letterSpacing: '0.01em',
              lineHeight: 1.35,
              color: palette.muted,
              opacity: clamp01(supp),
              transform: `translateY(${(1 - supp) * 16}px)`,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* the space below is intentionally left clear for content / animations */}
    </AbsoluteFill>
  );
};
