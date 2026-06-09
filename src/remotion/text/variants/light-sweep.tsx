/**
 * light-sweep — "Barrido de luz"
 * ──────────────────────────────────────────────────────────────────────────
 * The line rises + racks into focus (EASE.out: soft takeoff, long settle),
 * then a single specular highlight rakes left→right across the glyphs on a
 * smooth EASE.inOut traversal. Implemented as TWO stacked copies of the
 * headline: a base copy painted solid (palette.fg) that is ALWAYS fully
 * visible, and an accent-coloured copy on top that is revealed only inside a
 * narrow, moving diagonal mask band. The band starts off the right edge and
 * travels off the left, so the shine crosses exactly once and then the fill
 * settles back to solid base. Using a mask (not background-clip) guarantees the
 * type can never drop out.
 *
 * House look: flat, elegant medium weight (550 — no heavy display face), one
 * accent colour carried by the sweep only — NO underline, NO hairline rule, NO
 * neumorphic relief, NO glow. Ease-out only: no bounce, no overshoot. Every
 * pixel is a pure function of `frame`.
 */
import { type CSSProperties } from 'react';
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

// ── beats (frames @30fps) ─────────────────────────────────────────────────
// Generous, overlapping timing: the line takes off softly and keeps settling
// while the sweep already begins, so nothing clumps; then a calm, long hold.
const ENTER_END = 26; // line has fully risen + racked into focus
const SETTLE_END = 40; // micro-settle (1.03 → 1) finishes well after the entrance
const SWEEP_START = 16; // shine starts before the entrance fully resolves (overlap)
const SWEEP_END = 70; // shine has cleared the left edge; fill is solid base
const SUB_START = ENTER_END - 12; // subtitle flows in under the still-arriving line
const SUB_END = ENTER_END + 18;

// Shared headline type so the base + shine copies lay out pixel-identically.
const TYPE: CSSProperties = {
  margin: 0,
  fontFamily: DISPLAY_FONT,
  fontSize: 124,
  fontWeight: 550, // elegant medium — Universal Sans Display 550 face
  letterSpacing: '-0.025em',
  lineHeight: 1.0,
  textAlign: 'center',
  maxWidth: 1600, // long copy wraps instead of overflowing the frame
};

export const LightSweep: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();

  // ── enter: fade up + a small rise, soft takeoff / long settle ──────────────
  const enter = prog(frame, 0, ENTER_END, EASE.out);
  const rise = (1 - enter) * 22; // px the line lifts from
  // rack focus: arrives slightly soft, sharpens as it lands
  const blur = (1 - enter) * 6; // px of blur, → 0 on arrival

  // ── micro-settle: a calm 1.03 → 1 scale that resolves after the entrance ────
  // (secondary motion — strictly ease-out, no bounce / no overshoot past 1)
  const settle = prog(frame, 0, SETTLE_END, EASE.outSoft);
  const scale = lerp(1.03, 1, settle);

  // ── the sweep: a narrow band crosses the glyphs once, right → left ──────────
  // EASE.inOut so the shine eases in, glides, and settles calmly off-edge.
  const sweep = prog(frame, SWEEP_START, SWEEP_END, EASE.inOut);
  const pos = lerp(122, -22, sweep); // % across the line: off-right → off-left
  // a diagonal stripe of "visible" inside an otherwise-transparent mask
  const maskBand = `linear-gradient(105deg,
    transparent ${pos - 18}%,
    rgba(0,0,0,1) ${pos}%,
    transparent ${pos + 18}%)`;

  // subtitle flows in just under the entering line (overlapping stagger)
  const sub = prog(frame, SUB_START, SUB_END, EASE.out);

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
      {/* base + shine, stacked exactly; the wrapper sizes to the base copy */}
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          opacity: clamp01(enter),
          transform: `translateY(${rise}px) scale(${scale})`,
          filter: blur > 0.05 ? `blur(${blur}px)` : 'none',
          willChange: 'transform, opacity, filter',
        }}
      >
        {/* base — solid fill, always fully visible */}
        <div style={{ ...TYPE, color: palette.fg }}>{text}</div>

        {/* shine — accent copy revealed only inside the moving mask band */}
        <div
          aria-hidden
          style={{
            ...TYPE,
            position: 'absolute',
            inset: 0,
            color: palette.accent,
            WebkitMaskImage: maskBand,
            maskImage: maskBand,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat',
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            willChange: 'mask-image',
          }}
        >
          {text}
        </div>
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
