/**
 * line-wipe — "Cortinilla · Clip-path wipe"
 * ──────────────────────────────────────────────────────────────────────────
 * A cinematic curtain reveal. The whole headline is unveiled left→right by
 * animating `clip-path: inset(0 <r>% 0 0)` from r=100 (fully clipped) to r=0
 * (fully shown) on a smooth both-ends curve (EASE.inOut) over ~28 frames — a
 * soft takeoff into a long, elegant settle. A SLIM vertical accent bar rides at
 * the wipe's leading edge (a mechanic, NOT an underline) — its x-position tracks
 * the reveal fraction of the line's own width — then slips off and fades the
 * instant the wipe lands, leaving the clean line to hold.
 *
 * On arrival the line does a tiny rack-focus micro-settle: a faint blur sharpens
 * and a 1.02→1 scale relaxes (EASE.outSoft) — worked, never bouncy. The single
 * accent is carried by COLOUR only (the bar tints palette.accent); there are no
 * horizontal lines or underlines anywhere.
 *
 * No DOM measurement: the bar lives in a `position: relative` wrapper sized to
 * the headline, positioned with `left: <frac*100>%`, so the geometry is purely
 * a function of frame and stays resolution- & length-independent. The line
 * weight is 550 — elegant medium, never heavy.
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
} from '../shared';

const WIPE_START = 0;
const WIPE_END = 28; // the curtain finishes opening here, then the line settles & holds

export const LineWipe: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();

  // ── the wipe: clip the line from the right, retreating left → right ──────────
  // EASE.inOut → soft takeoff, smooth landing: a tasteful theatrical sweep.
  const reveal = prog(frame, WIPE_START, WIPE_END, EASE.inOut); // 0 (hidden) → 1 (full)
  const insetRight = (1 - reveal) * 100; // r%: 100 → 0

  // ── the leading accent bar rides the wipe edge, then exits once it lands ─────
  const landed = clamp01((frame - WIPE_END) / 8); // 0 while wiping → 1 just after
  const barLeft = reveal * 100; // % of line width → the wipe edge
  const barSlide = landed * 5; // gentle push past the edge on the way out
  const barFade = prog(frame, WIPE_END, WIPE_END + 8, EASE.out); // graceful fade-off
  const barOpacity = (1 - barFade) * (reveal > 0.001 ? 1 : 0);

  // ── micro-settle on arrival: faint rack-focus + a 1.02→1 relax (no bounce) ───
  const settle = prog(frame, WIPE_END - 6, WIPE_END + 16, EASE.outSoft); // 0 → 1
  const lineScale = lerp(1.02, 1, settle);
  const lineBlur = lerp(2.2, 0, settle); // px — blurry edge sharpens as it lands

  // ── subtitle settles in beneath, overlapping the tail of the wipe ────────────
  const sub = prog(frame, WIPE_END - 10, WIPE_END + 20, EASE.out);
  const subBlur = lerp(3, 0, sub);

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
      {/* wrapper sized to the headline → the bar can position relative to it */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          transform: `scale(${lineScale})`,
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
      >
        {/* the headline, unveiled by the clip-path inset, sharpening on arrival */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 550,
            letterSpacing: '-0.02em',
            lineHeight: 1.0,
            whiteSpace: 'nowrap',
            color: palette.fg,
            clipPath: `inset(0 ${insetRight}% 0 0)`,
            WebkitClipPath: `inset(0 ${insetRight}% 0 0)`,
            filter: lineBlur > 0.01 ? `blur(${lineBlur}px)` : 'none',
            willChange: 'clip-path, filter',
          }}
        >
          {text}
        </div>

        {/* leading accent bar — slim vertical reveal edge (mechanic, not an underline) */}
        <div
          style={{
            position: 'absolute',
            top: '-4%',
            bottom: '-4%',
            left: `${barLeft + barSlide}%`,
            width: 4,
            borderRadius: 2,
            background: palette.accent,
            opacity: barOpacity,
            willChange: 'left, opacity',
          }}
        />
      </div>

      {/* subtitle — rises in beneath once the curtain has opened */}
      {subtitle && (
        <div
          style={{
            marginTop: 40,
            fontFamily: TEXT_FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: palette.muted,
            opacity: sub,
            transform: `translateY(${lerp(18, 0, sub)}px)`,
            filter: subBlur > 0.01 ? `blur(${subBlur}px)` : 'none',
            willChange: 'opacity, transform, filter',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
