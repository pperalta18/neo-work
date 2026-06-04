/**
 * TextShowcaseVideo — "Elige tu animación de texto" (the reel)
 * ──────────────────────────────────────────────────────────────────────────
 * Plays every technique in the registry back-to-back as a catalogue, so you can
 * pick the one you want for a video. Each segment shows its headline plus a
 * corner chip (index · name · description) and a progress line; clean crossfades
 * (@remotion/transitions) stitch the segments on the beat.
 *
 * Per-segment copy lives in COPY below — purely for the demo reel; the techniques
 * themselves are content-agnostic (see textAnimations.ts).
 */
import { Fragment } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { TEXT_ANIMS } from './textAnimations';
import { PALETTE, TEXT_FONT, CURVE, clamp01, envelope } from './text/shared';
import { Fonts } from './fonts';

const FPS = 30;
/** Crossfade overlap between segments (frames). */
const XFADE = 14;

/** Demo copy per technique — tuned so the reel reads like a real title sequence. */
const COPY: Record<string, { text: string; subtitle?: string }> = {
  'camera-pan': { text: 'Automatiza tu negocio', subtitle: 'Agentes de IA que trabajan por ti' },
  'simple': { text: 'Hecho para crecer', subtitle: 'Simple, claro, directo' },
  'focus-in': { text: 'Claridad instantánea', subtitle: 'Enfoca lo que de verdad importa' },
  'word-rise': { text: 'Crea. Itera. Lanza.', subtitle: 'Del prompt al producto' },
  'word-sequence': { text: 'Menos ruido. Más foco.', subtitle: 'Cada palabra cuenta' },
  'char-cascade': { text: 'Inteligencia en cada letra', subtitle: 'Cuidamos el detalle' },
  'line-wipe': { text: 'Resultados al instante', subtitle: 'Sin fricción' },
  'perspective-cards': { text: 'Ideas que cobran forma', subtitle: 'Diseño en movimiento' },
  'split-flap': { text: 'Encaja a la perfección', subtitle: 'Cada pieza en su sitio' },
  'scale-punch': { text: 'Impacto', subtitle: 'Directo al grano' },
  'light-sweep': { text: 'Brilla con luz propia', subtitle: 'Acabado premium' },
  'line-stack': { text: 'Construye el futuro de tu empresa hoy', subtitle: 'AiKit' },
  'typewriter': { text: 'Escribiendo el futuro…', subtitle: 'IA aplicada a tu día a día' },
  'counter-stat': { text: '+10.000', subtitle: 'negocios ya automatizados' },
  'top-heading': { text: 'Panel de control', subtitle: 'Todo tu negocio, en una vista' },
};

/** Total length = sum of segments minus the overlapped crossfades. */
export const TEXT_SHOWCASE_DURATION =
  TEXT_ANIMS.reduce((s, a) => s + a.duration, 0) - (TEXT_ANIMS.length - 1) * XFADE;

export { FPS as TEXT_SHOWCASE_FPS };

export const TextShowcaseVideo: React.FC = () => {
  const total = TEXT_ANIMS.length;
  return (
    <AbsoluteFill style={{ background: PALETTE.bg }}>
      <Fonts />
      <TransitionSeries>
        {TEXT_ANIMS.map((a, i) => {
          const copy = COPY[a.id] ?? { text: a.name };
          return (
            <Fragment key={a.id}>
              <TransitionSeries.Sequence durationInFrames={a.duration}>
                <a.Component text={copy.text} subtitle={copy.subtitle} />
                <Chip index={i + 1} total={total} name={a.name} blurb={a.blurb} duration={a.duration} />
              </TransitionSeries.Sequence>
              {i < total - 1 && (
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: XFADE })}
                />
              )}
            </Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};

// ── the per-segment identifier chip ─────────────────────────────────────────
function Chip({
  index,
  total,
  name,
  blurb,
  duration,
}: {
  index: number;
  total: number;
  name: string;
  blurb: string;
  duration: number;
}) {
  const frame = useCurrentFrame();
  // appears, holds, leaves — synced to its own segment
  const a = envelope(frame, duration, 9, 9, CURVE.standard);
  const bar = clamp01(frame / duration);
  const pad2 = (n: number) => String(n).padStart(2, '0');

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: 72,
          bottom: 78,
          fontFamily: TEXT_FONT,
          opacity: a,
          transform: `translateY(${(1 - a) * 12}px)`,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.18em',
            color: PALETTE.accent,
          }}
        >
          {pad2(index)} <span style={{ color: PALETTE.muted, opacity: 0.6 }}>/ {pad2(total)}</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 24, fontWeight: 600, color: PALETTE.fg, letterSpacing: '-0.01em' }}>
          {name}
        </div>
        <div style={{ marginTop: 3, fontSize: 16, color: PALETTE.muted }}>{blurb}</div>
      </div>

      {/* segment progress line */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: PALETTE.line }}>
        <div style={{ height: '100%', width: `${bar * 100}%`, background: PALETTE.accent, opacity: a }} />
      </div>
    </AbsoluteFill>
  );
}
