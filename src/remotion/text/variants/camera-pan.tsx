/**
 * camera-pan — "Cámara · Pan + Zoom"
 * ──────────────────────────────────────────────────────────────────────────
 * The cinematic one. A virtual camera starts buried inside the first word at
 * heavy magnification, then dollies OUT while panning left→right across the
 * line; each word develops (blur→sharp, fades up) just as the lens sweeps past
 * it. When the move lands on the full centred line it keeps *breathing* — a slow
 * residual push-in — and the subtitle rises beneath.
 *
 * Refined: the dolly + pan ride EASE.inOut (smooth at both ends → no mechanical
 * snap on take-off, a long elegant settle on arrival); the zoom is softened
 * (~3.2 → 1); each word's blur→sharp "develop" is re-synced to the moment the
 * lens actually sweeps over it, with generous overlapping stagger; a tiny
 * scale 1.03 → 1 micro-settle and the speed-based motion blur add worked-in
 * secondary motion. Strictly ease-out — NO bounce, NO overshoot, NO underline:
 * the single accent is the last word in palette.accent, colour only.
 *
 * The camera is one transform on the headline row. To frame a point at fraction
 * `f` along the line dead-centre and magnify by `S` about it — with NO DOM
 * measurement — we use `transform-origin: center` and
 * `scale(S) translateX((0.5 - f) * 100%)`: the percent translate is relative to
 * the row's own width, so the maths is resolution- and length-independent and
 * fully deterministic.
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';
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

const REVEAL_END = 78; // the camera move completes here; then it breathes
const PAN_START = 0.06; // focus fraction the lens opens on (inside word 1)

export const CameraPan: React.FC<TextAnimProps> = ({ text, subtitle, palette = PALETTE }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const words = splitWords(text);

  // ── the camera move: dolly out + pan from the first word to the whole line ──
  // EASE.inOut → soft take-off, smooth glide, long elegant landing (a real lens).
  const move = prog(frame, 0, REVEAL_END, EASE.inOut);
  const f = lerp(PAN_START, 0.5, move); // focus fraction travels left → centre
  const scale = lerp(3.2, 1, move); // softened zoom → settled
  const tx = (0.5 - f) * 100; // % of row width → centres fraction f

  // residual breathe after the landing (follow-through, never a freeze).
  // EASE.outSoft → the push-in keeps drifting with a long, calm tail.
  const settle = frame - REVEAL_END;
  const breathe = settle > 0 ? lerp(1, 1.035, prog(frame, REVEAL_END, durationInFrames, EASE.outSoft)) : 1;
  const driftX = settle > 0 ? Math.sin(settle / 48) * 0.7 : 0;

  // arrival micro-settle: a barely-there 1.03 → 1 ease as the move finishes —
  // worked-in secondary motion, no bounce (pure ease-out).
  const arrive = prog(frame, REVEAL_END - 16, REVEAL_END + 8, EASE.out);
  const microSettle = lerp(1.03, 1, arrive);

  // speed-based motion blur: heavy while the lens races, gone on arrival —
  // subtler than before, and it clears smoothly on the inOut tail.
  const camBlur = lerp(4.5, 0, prog(frame, 0, REVEAL_END * 0.82, EASE.inOut));

  // subtitle rises in once the camera has all-but-settled, with a soft tail.
  const sub = prog(frame, REVEAL_END - 4, REVEAL_END + 30, EASE.out);

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
      {/* the camera = one transform on the headline row */}
      <div
        style={{
          // em gap resolves against this font-size — anchor it to the word size
          // so the inter-word spacing is real (not the collapsed ~16px root em).
          fontSize: 132,
          display: 'inline-flex',
          flexWrap: 'nowrap',
          whiteSpace: 'nowrap',
          gap: '0.3em',
          transform: `scale(${scale * breathe * microSettle}) translateX(${tx + driftX}%)`,
          transformOrigin: 'center center',
          filter: camBlur > 0.3 ? `blur(${camBlur}px)` : undefined,
          willChange: 'transform, filter',
        }}
      >
        {words.map((w, i) => {
          // Re-sync each word's develop to when the lens sweeps over it. The pan
          // travels f: PAN_START → 0.5 across [0, REVEAL_END] on EASE.inOut, so a
          // word sitting at fraction wf reads "in focus" at swept-time t(wf). We
          // approximate wf by even spacing along the line and place the develop
          // window around the frame the pan reaches it — generous OVERLAP so
          // siblings flow into one another rather than clumping.
          const n = Math.max(1, words.length);
          const wf = n === 1 ? 0.5 : lerp(PAN_START, 0.5, i / (n - 1));
          // invert the linear pan target to a normalized sweep time, then bias a
          // hair early so the word is already sharpening as the lens arrives.
          const sweepT = clamp01((wf - PAN_START) / (0.5 - PAN_START));
          const start = lerp(4, REVEAL_END - 22, sweepT);
          const dev = prog(frame, start, start + 30, EASE.out); // long, soft develop
          const wordBlur = lerp(14, 0, dev); // blur → sharp rack-focus on arrival
          const isLast = i === words.length - 1;
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontSize: 132,
                fontWeight: 550, // elegant medium — Universal Sans Display 550 face
                letterSpacing: '-0.025em',
                lineHeight: 0.98,
                color: isLast ? palette.accent : palette.fg, // accent = colour only
                opacity: clamp01(dev * 1.35),
                transform: `translateY(${(1 - dev) * 0.1}em)`,
                filter: wordBlur > 0.3 ? `blur(${wordBlur}px)` : undefined,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>

      {/* subtitle — rises in beneath once the camera has settled */}
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
