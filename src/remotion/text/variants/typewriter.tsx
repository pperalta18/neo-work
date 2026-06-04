/**
 * typewriter — "Máquina de escribir"
 * ──────────────────────────────────────────────────────────────────────────
 * The "information" feel. A growing substring of the hero line is revealed one
 * character at a time. The carriage `progress` eases (EASE.out) from frame 6
 * over ~len·PER_CHAR frames with a quick, soft take-off and a long elegant
 * settle, so the last few letters land slowly — a calm arrival rather than a
 * uniform clatter. `count = round(progress · len)` drives the typed substring.
 *
 * A caret BLOCK in the one accent colour sits right after the typed text and
 * BLINKS deterministically off the timeline: `floor(frame / (fps/2)) % 2`
 * toggles it every half-second — no Date, no random. While typing it stays
 * solid; once the line is complete the blink resumes but its presence is eased
 * (a soft fade between states, not a hard flip) so the hold breathes.
 *
 * The type stays perfectly crisp and steady the whole time — NO blur, NO scale
 * settle (a typewriter shouldn't drift or focus-pull). The accent is carried by
 * COLOUR only (the caret); there is no underline, hairline or rule anywhere.
 * Left-aligned text, centred as a unit.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
import {
  type TextAnimProps,
  PALETTE,
  TEXT_FONT,
  EASE,
  prog,
  clamp01,
  lerp,
  splitChars,
} from '../shared';

const TYPE_START = 6; // hold a beat, then the carriage starts
const PER_CHAR = 2.2; // frames spent per character (typing tempo, eased)
const SUB_DELAY = 10; // subtitle eases in shortly after the line is typed

export const Typewriter: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const chars = splitChars(text);
  const len = chars.length;

  // ── the carriage: an eased substring grows from empty → whole line ──────────
  // EASE.out gives a soft take-off and a long tail, so the closing characters
  // arrive slowly and the line resolves onto a calm hold (no mechanical clatter).
  const typeEnd = TYPE_START + len * PER_CHAR;
  const progress = prog(frame, TYPE_START, typeEnd, EASE.out);
  const count = Math.round(clamp01(progress) * len);
  const typed = chars.slice(0, count).join('');
  const done = count >= len;

  // ── deterministic caret blink: on/off every ~half-second, off the fps ───────
  const blinkPeriod = Math.max(1, Math.round(fps / 2));
  const caretOn = Math.floor(frame / blinkPeriod) % 2 === 0;
  // Ease the caret's presence: solid while typing, then a soft fade into the
  // blink once done — a gentle breath rather than a hard on/off flip.
  const blinkIn = prog(frame, typeEnd, typeEnd + 8, EASE.out);
  const caretOpacity = done ? lerp(1, caretOn ? 1 : 0, blinkIn) : 1;

  // subtitle rises in once the line has finished typing (generous overlap)
  const sub = prog(frame, typeEnd + SUB_DELAY, typeEnd + SUB_DELAY + 26, EASE.out);

  return (
    <AbsoluteFill
      style={{
        background: palette.bg,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TEXT_FONT,
      }}
    >
      {/* the typed line + caret — left-aligned as a unit, centred in frame */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'baseline',
          justifyContent: 'flex-start',
          maxWidth: '90%',
          fontSize: 84,
          fontWeight: 550,
          letterSpacing: 0,
          lineHeight: 1.08,
          color: palette.fg,
          textAlign: 'left',
          whiteSpace: 'pre-wrap',
        }}
      >
        <span>{typed}</span>
        {/* the caret: a thin solid block in the one accent colour, blinking */}
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: '0.06em',
            height: '0.92em',
            marginLeft: '0.06em',
            transform: 'translateY(0.06em)',
            background: palette.accent,
            opacity: caretOpacity,
          }}
        />
      </div>

      {/* subtitle — eases in beneath once the line is fully typed */}
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
