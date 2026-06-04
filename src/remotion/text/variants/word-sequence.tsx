/**
 * word-sequence — "Secuencia"
 * ──────────────────────────────────────────────────────────────────────────
 * Kinetic typography read through TIME: the words of the phrase appear ONE AT A
 * TIME, alone and dead-centre, each punching in (scale 1.16→1 + fade, rising a
 * touch) then lifting away as the next takes its place — a quick, rhythmic
 * relay. You read the sentence by the cadence, not by seeing it all at once. The
 * FINAL word lands in the accent colour and HOLDS as the payoff (so the segment
 * can rest), with the subtitle easing in beneath it. Strictly ease-out, crisp
 * (no blur), deterministic.
 *
 * Each word owns a fixed SLOT = ENTER + HOLD + EXIT frames; the last word skips
 * its EXIT and stays. Pacing is "relatively fast" — ~0.47s per word @30fps.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { type TextAnimProps, PALETTE, DISPLAY_FONT, TEXT_FONT, EASE, prog, clamp01, lerp, splitWords } from '../shared';

const ENTER = 6; // punch-in
const HOLD = 4; // legible beat
const EXIT = 4; // lift away
const SLOT = ENTER + HOLD + EXIT; // 14 frames per flashing word
const LEAD = 4; // a small beat before the first word

export const WordSequence: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const words = splitWords(text);
  const n = words.length;

  const lastStart = LEAD + (n - 1) * SLOT;
  const settled = lastStart + ENTER; // last word fully in
  const sub = prog(frame, settled + 2, settled + 26, EASE.out);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        overflow: 'hidden',
        fontFamily: DISPLAY_FONT,
      }}
    >
      {words.map((w, i) => {
        const start = LEAD + i * SLOT;
        const isLast = i === n - 1;

        const inT = prog(frame, start, start + ENTER, EASE.out);
        const outStart = start + ENTER + HOLD;
        const outT = isLast ? 0 : prog(frame, outStart, outStart + EXIT, EASE.out);

        const opacity = clamp01(inT) * (1 - clamp01(outT));
        // enters scaled-up, lands at 1; on exit eases a hair smaller
        const scale = lerp(1.16, 1, inT) * lerp(1, 0.95, outT);
        // rises in from below, lifts upward as it leaves (continuous flow)
        const y = (1 - inT) * 22 - outT * 24;

        // don't paint words far outside their window (keeps the DOM light + clean)
        if (opacity <= 0.001 && frame > start) return null;

        return (
          <AbsoluteFill key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span
              style={{
                fontSize: 152,
                fontWeight: 550,
                letterSpacing: '-0.03em',
                lineHeight: 1,
                textAlign: 'center',
                maxWidth: '88%',
                color: isLast ? palette.accent : palette.fg,
                opacity,
                transform: `translateY(${y}px) scale(${scale})`,
                willChange: 'transform, opacity',
              }}
            >
              {w}
            </span>
          </AbsoluteFill>
        );
      })}

      {/* subtitle — eases in beneath the final, held word */}
      {subtitle && (
        <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              transform: `translateY(${140 + (1 - sub) * 16}px)`,
              fontFamily: TEXT_FONT,
              fontSize: 30,
              fontWeight: 500,
              letterSpacing: '0.01em',
              color: palette.muted,
              opacity: clamp01(sub),
            }}
          >
            {subtitle}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
