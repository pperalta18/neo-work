/**
 * focus-in — "Rack focus"
 * ──────────────────────────────────────────────────────────────────────────
 * The Apple-keynote one. The whole line is treated as a single optical block:
 * a lens racks from soft to sharp. blur(22px)→0, scale(1.04)→1, opacity 0→1 and
 * — the move that sells it — the tracking pulls in from a wide 0.30em down to a
 * tight -0.01em. The simultaneous de-blur + letter-spacing tighten reads as the
 * words snapping into the focal plane.
 *
 * Pure EASE.out (smooth expo decelerate): a quick soft takeoff and a long elegant
 * settle. NO underline — the lone accent is carried by colour on the last word.
 * NO bounce / overshoot. Holds dead sharp once focused, then breathes.
 * Display weight 550 — elegant medium, never heavy.
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

// the rack-focus pull lands here, then a brief micro-settle, then a long hold
const FOCUS_END = 34; // the optical rack: soft → sharp
const SETTLE_END = 48; // the last sliver of scale eases out (1.008 → 1)

export const FocusIn: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);

  // ── the rack focus: one long, eased pull for the whole block ───────────────
  // quick soft takeoff, long elegant settle — strictly ease-out, no overshoot.
  const focus = prog(frame, 0, FOCUS_END, EASE.out);
  const blur = lerp(22, 0, focus); // soft → crisp
  const tracking = lerp(0.3, -0.01, focus); // wide → tight (em)
  const opacity = clamp01(focus * 1.15);

  // secondary motion: a touch of scale that overlaps past the focus landing and
  // micro-settles to rest — the words ease the last hair into the focal plane.
  const settle = prog(frame, 0, SETTLE_END, EASE.outSoft);
  const scale = lerp(1.04, 1, settle); // gentle, no bounce

  // subtitle drifts up softly, overlapping the tail of the rack-focus
  const sub = prog(frame, FOCUS_END - 10, FOCUS_END + 24, EASE.out);

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
      {/* the line as one optical block — a single transform + filter racks focus */}
      <div
        style={{
          position: 'relative',
          display: 'inline-flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          letterSpacing: `${tracking}em`,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          willChange: 'transform, filter, letter-spacing',
        }}
      >
        {words.map((w, i) => {
          const isLast = words.length > 1 && i === words.length - 1;
          return (
            <span
              key={i}
              style={{
                fontSize: 118,
                fontWeight: 550, // elegant medium — never heavy
                lineHeight: 0.98,
                color: isLast ? palette.accent : palette.fg, // accent by COLOUR only
                // a non-collapsing space between words (tracking handles the rest)
                marginRight: i < words.length - 1 ? '0.26em' : 0,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* subtitle — resolves once the line is in focus */}
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
            transform: `translateY(${(1 - sub) * 14}px)`,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};
