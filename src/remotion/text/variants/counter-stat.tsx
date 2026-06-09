/**
 * counter-stat — "Contador" (number count-up stat)
 * ──────────────────────────────────────────────────────────────────────────
 * The hero line is read as a FIGURE: an optional prefix (e.g. "+"), a numeric
 * core (e.g. "10.000"), and an optional suffix (e.g. "%", "x"). We parse the
 * affixes off the digits, then count the numeric value from 0 up to the target
 * with an EASE.out `interpolate` so the value decelerates into its final target
 * (a soft, satisfying settle — never linear), re-formatting on every frame with
 * the SAME thousands / decimal separators we detected in the input — never the
 * host locale — so the render is byte-for-byte deterministic.
 *
 * Look: elegant medium weight (550, not display-heavy). The number is `fg`; the
 * affix carries the ONE accent — by COLOUR only, never a line. As the figure
 * arrives it rack-focuses (blur → sharp) and micro-settles (1.03 → 1) WITHOUT
 * any bounce. The label rises in on EASE.out after the count lands, then the
 * whole thing holds calmly (the showcase owns the exit).
 *
 * If the input contains no digits we degrade gracefully to a plain fade-in.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import {
  type TextAnimProps,
  PALETTE,
  DISPLAY_FONT,
  TEXT_FONT,
  EASE,
  prog,
} from '../shared';

const HEAD_WEIGHT = 550; // elegant medium — Universal Sans Display has a real 550 face
const COUNT_END = 46; // frames for the value to ease from 0 → target

/**
 * Pull the hero string apart into { prefix, number, suffix } and learn its
 * separator style — purely from the characters present, never from a locale.
 *   "+10.000" → prefix "+", core "10.000", suffix ""
 *   "98%"     → core "98",  suffix "%"
 *   "3,2x"    → core "3,2", suffix "x"
 */
type Figure = {
  prefix: string;
  suffix: string;
  /** Numeric target as a plain JS number. */
  value: number;
  /** Decimal places to preserve while counting (0 for integers). */
  decimals: number;
  /** Char used to group thousands ('.' , ',', ' ', or '' if none seen). */
  groupSep: string;
  /** Char used as the decimal point ('.' or ','). */
  decimalSep: string;
};

const parseFigure = (raw: string): Figure | null => {
  // The numeric core: digits with optional grouping/decimal separators inside.
  const m = raw.match(/[0-9][0-9.,   ]*[0-9]|[0-9]/);
  if (!m) return null;

  const core = m[0];
  const prefix = raw.slice(0, m.index ?? 0);
  const suffix = raw.slice((m.index ?? 0) + core.length);

  // The LAST separator in the core is the decimal point IF it's followed by a
  // short run of digits (1–2) and there's exactly one of that separator —
  // otherwise every separator is a thousands grouping mark.
  const seps = core.match(/[.,   ]/g) ?? [];
  let decimalSep = '';
  let groupSep = '';
  let decimals = 0;

  if (seps.length > 0) {
    const last = seps[seps.length - 1];
    const lastIdx = core.lastIndexOf(last);
    const tail = core.slice(lastIdx + 1);
    const onlyOneOfLast = seps.filter((s) => s === last).length === 1;
    const isDecimal = onlyOneOfLast && (last === '.' || last === ',') && tail.length > 0 && tail.length <= 2;

    if (isDecimal) {
      decimalSep = last;
      decimals = tail.length;
      // grouping separator = any OTHER separator kind that appears
      groupSep = seps.find((s) => s !== last) ?? '';
    } else {
      groupSep = last;
    }
  }

  // Normalise to a plain number: drop grouping, force '.' as the decimal point.
  let normal = core;
  if (groupSep) normal = normal.split(groupSep).join('');
  if (decimalSep) normal = normal.split(decimalSep).join('.');
  const value = Number(normal);
  if (!Number.isFinite(value)) return null;

  return { prefix, suffix, value, decimals, groupSep, decimalSep };
};

/** Group the integer part of `s` with `sep` every three digits (deterministic). */
const groupThousands = (s: string, sep: string): string => {
  if (!sep) return s;
  // walk from the right, inserting `sep` every 3 chars
  let out = '';
  for (let i = 0; i < s.length; i++) {
    if (i > 0 && (s.length - i) % 3 === 0) out += sep;
    out += s[i];
  }
  return out;
};

/** Render `v` back into the detected style (grouping + decimal separators). */
const formatValue = (v: number, fig: Figure): string => {
  const fixed = v.toFixed(fig.decimals); // always '.' as the decimal point
  const dot = fixed.indexOf('.');
  const intPart = dot === -1 ? fixed : fixed.slice(0, dot);
  const fracPart = dot === -1 ? '' : fixed.slice(dot + 1);

  const grouped = groupThousands(intPart, fig.groupSep);
  if (fig.decimals > 0) {
    const sep = fig.decimalSep || '.';
    return `${grouped}${sep}${fracPart}`;
  }
  return grouped;
};

export const CounterStat: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const fig = parseFigure(text);

  // ── graceful fallback: no digits → just fade the raw text in ──
  if (!fig) {
    const fade = prog(frame, 0, 22, EASE.out);
    const settle = prog(frame, 0, 30, EASE.outSoft); // 1.03 → 1 micro-settle, no bounce
    const focus = prog(frame, 0, 26, EASE.out); // blur → sharp rack-focus
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
        <span
          style={{
            fontSize: 132,
            fontWeight: HEAD_WEIGHT,
            letterSpacing: '-0.025em',
            color: palette.fg,
            opacity: fade,
            filter: `blur(${(1 - focus) * 7}px)`,
            transform: `translateY(${(1 - fade) * 16}px) scale(${1.03 - settle * 0.03})`,
            willChange: 'transform, opacity, filter',
          }}
        >
          {text}
        </span>
        {subtitle && (
          <div
            style={{
              marginTop: 38,
              fontFamily: TEXT_FONT,
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: palette.muted,
              opacity: prog(frame, 16, 38, EASE.out),
              transform: `translateY(${(1 - prog(frame, 16, 38, EASE.out)) * 14}px)`,
            }}
          >
            {subtitle}
          </div>
        )}
      </AbsoluteFill>
    );
  }

  // ── the count-up: 0 → target, EASE.out so the value decelerates into target ──
  const climb = prog(frame, 0, COUNT_END, EASE.out); // 0 → 1, soft long settle
  const current = fig.value * climb;
  const display = formatValue(current, fig);

  // the whole figure fades + rises up as the count takes off (quick soft takeoff)
  const fade = prog(frame, 0, 18, EASE.out);

  // micro-settle on the figure: a subtle 1.03 → 1, eased soft, NO bounce
  const settle = prog(frame, 0, COUNT_END, EASE.outSoft);

  // rack-focus: the figure resolves from a slight blur to crisp as it climbs
  const focus = prog(frame, 0, COUNT_END - 8, EASE.out);

  // the affixes (prefix + suffix) drift + sharpen in just behind the leading
  // digit — overlapping the figure's own arrival so siblings flow together
  const affix = prog(frame, 8, 30, EASE.out);

  // subtitle (label) rises in AFTER the count lands, on EASE.out, then holds
  const sub = prog(frame, COUNT_END - 4, COUNT_END + 24, EASE.out);

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
      {/* the figure: [accent prefix] big number [accent suffix] */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          whiteSpace: 'nowrap',
          opacity: fade,
          filter: `blur(${(1 - focus) * 8}px)`,
          transform: `translateY(${(1 - fade) * 18}px) scale(${1.03 - settle * 0.03})`,
          transformOrigin: 'center bottom',
          willChange: 'transform, opacity, filter',
        }}
      >
        {fig.prefix && (
          <span
            style={{
              fontSize: 190,
              fontWeight: HEAD_WEIGHT,
              letterSpacing: '-0.035em',
              lineHeight: 0.95,
              color: palette.accent, // the ONE accent — colour only, no line
              opacity: affix,
              transform: `translateX(${(1 - affix) * -10}px)`,
            }}
          >
            {fig.prefix}
          </span>
        )}

        {/* the counting number — tabular figures keep the width steady */}
        <span
          style={{
            fontSize: 190,
            fontWeight: HEAD_WEIGHT,
            letterSpacing: '-0.035em',
            lineHeight: 0.95,
            color: palette.fg,
            fontVariantNumeric: 'tabular-nums',
            fontFeatureSettings: '"tnum" 1',
          }}
        >
          {display}
        </span>

        {fig.suffix && (
          <span
            style={{
              fontSize: 190,
              fontWeight: HEAD_WEIGHT,
              letterSpacing: '-0.035em',
              lineHeight: 0.95,
              color: palette.accent, // the ONE accent — colour only, no line
              opacity: affix,
              transform: `translateX(${(1 - affix) * 10}px)`,
            }}
          >
            {fig.suffix}
          </span>
        )}
      </div>

      {/* label — rises in beneath as the value lands */}
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
