/**
 * scale-punch — "Impacto"
 * ──────────────────────────────────────────────────────────────────────────
 * The percussive one (best for 1–2 words). The whole line arrives BIG and soft —
 * scale(2.3) + blur(14px) at opacity 0 — and decelerates onto its mark with a
 * quick, soft takeoff and a long elegant settle (EASE.out). Strictly ease-out:
 * no bounce, no overshoot. The punch is carried by SCALE + a blur→sharp rack-
 * focus, never by weight (a calm medium 550). After the landing a barely-there
 * secondary micro-settle (1.03 → 1) breathes the line into place, and an
 * emphasis word warms into palette.accent — the only accent, by COLOUR alone,
 * with NO underline or rule. Then it just holds, generous and calm — the
 * showcase owns any exit.
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

const PUNCH_END = 18; // the line lands here — quick soft takeoff, long settle
const SETTLE_END = PUNCH_END + 14; // micro-settle 1.03 → 1 breathes it into place
const TINT_START = PUNCH_END - 4; // the accent word warms in as the line lands
const TINT_END = TINT_START + 16; // a long, gentle colour bloom (no line)
const SUB_START = PUNCH_END + 4; // subtitle flows in, overlapping the settle
const SUB_END = SUB_START + 18;

export const ScalePunch: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();

  // ── the impact: scale 2.3 → 1, blur 14 → 0, opacity 0 → 1 (quick→soft) ──
  const punch = prog(frame, 0, PUNCH_END, EASE.out);
  const impactScale = lerp(2.3, 1, punch);
  const blur = lerp(14, 0, punch);
  const opacity = clamp01(punch * 1.25); // arrive fully opaque slightly early

  // ── secondary micro-settle: a barely-there 1.03 → 1 after the landing ──
  // overlaps the tail of the punch so the line never "freezes" on its mark.
  const settle = prog(frame, PUNCH_END - 4, SETTLE_END, EASE.outSoft);
  const settleScale = lerp(1.03, 1, settle);
  const scale = impactScale * settleScale;

  // ── the single accent: the LAST word warms into palette.accent (no line) ──
  const tint = prog(frame, TINT_START, TINT_END, EASE.outQuint);
  const words = splitWords(text);
  const accentIndex = words.length - 1; // emphasise the final word by colour

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
      {/* headline — the impact is scale + blur + colour, never a rule */}
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          opacity,
          filter: blur > 0.3 ? `blur(${blur}px)` : undefined,
          willChange: 'transform, filter, opacity',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            whiteSpace: 'nowrap',
            fontSize: 150,
            fontWeight: 550,
            letterSpacing: '-0.03em',
            lineHeight: 0.98,
            color: palette.fg,
          }}
        >
          {words.map((word, i) => {
            const isAccent = i === accentIndex;
            // the accent word blends fg → accent as `tint` blooms in
            const color = isAccent
              ? blendHex(palette.fg, palette.accent, tint)
              : palette.fg;
            return (
              <span key={i} style={{ color }}>
                {word}
                {i < words.length - 1 ? ' ' : ''}
              </span>
            );
          })}
        </span>
      </div>

      {/* subtitle — quiet kicker; flows in overlapping the headline's settle */}
      {subtitle && (
        <div
          style={{
            marginTop: 40,
            fontFamily: TEXT_FONT,
            fontSize: 30,
            fontWeight: 500,
            letterSpacing: '0.01em',
            color: palette.muted,
            opacity: prog(frame, SUB_START, SUB_END, EASE.out),
            transform: `translateY(${(1 - prog(frame, SUB_START, SUB_END, EASE.outSoft)) * 18}px)`,
            willChange: 'transform, opacity',
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
};

/**
 * Deterministic hex blend a → b by t∈[0,1]. Pure function of its inputs (no
 * Date, no random) so every frame stays reproducible. Falls back to `b` when an
 * input isn't a parseable #rrggbb (e.g. a named/rgba accent), still frame-pure.
 */
function blendHex(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  if (!pa || !pb) return t > 0.5 ? b : a;
  const k = clamp01(t);
  const r = Math.round(lerp(pa[0], pb[0], k));
  const g = Math.round(lerp(pa[1], pb[1], k));
  const bl = Math.round(lerp(pa[2], pb[2], k));
  return `rgb(${r}, ${g}, ${bl})`;
}

function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
