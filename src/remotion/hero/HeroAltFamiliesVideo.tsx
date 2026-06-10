/**
 * HeroAltFamiliesVideo — Hero alternativo B · "Ojos, manos, repetible"
 * ──────────────────────────────────────────────────────────────────────────────
 * Una presentación de QUÉ es AiKit en 4 "slides" (~11,6 s) que recorre las 3
 * familias del pitch y cierra con el flywheel:
 *   1 · Controla  — le da OJOS    (hacer visible lo oculto)
 *   2 · Delega    — le da MANOS   (convertir intención en resultado)
 *   3 · Construye — REPETIBLE     (cristalizar lo que se repite)
 *   4 · Flywheel  — el ciclo: cada vuelta deja más datos y más control
 *
 * Reglas de la casa (specs/hero-animation.md · motion-language.md): light mode de
 * marca, KIT_BLUE como único acento, tipografías Universal Sans; SIN glows/halos
 * /sombras de color, sin bounce; reveals por opacidad/contraste/máscara. NO grid
 * serpenteante, NO chat, NO OperatingModuleTile, NO logo en apertura/cierre.
 * Iconos de módulos = los SVG reales de MODULES, limpios, sin placa.
 *
 * Determinismo total: cada slide es función pura del frame LOCAL (sin Date/random).
 * Las 4 slides comparten gramática (mismo ancla de titular, misma transición) → se
 * sienten "hermanas". Las transiciones son cross-fades limpios de 12 f.
 */
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Fonts } from '../fonts';
import { CURVE, SLIDES, TOTAL, W, H, ramp, clamp01 } from './heroAltFamiliesKit';
import { SlideControla, SlideDelega, SlideConstruye, SlideFlywheel } from './heroAltFamiliesSlides';

export const HERO_ALT_FAMILIES_DURATION = TOTAL; // 348 f ≈ 11,6 s @30fps

const XFADE = 9; // cross-fade overlap between slides (brief, crisp)

/** A slide host: cross-fades in at its start and out before the next one. */
const Slide: React.FC<{
  start: number;
  end: number;
  frame: number;
  children: (localFrame: number) => React.ReactNode;
  /** true for the last slide — no fade-out (holds to the end). */
  last?: boolean;
}> = ({ start, end, frame, children, last }) => {
  // The incoming slide starts rising XFADE frames BEFORE its nominal start, so it
  // overlaps the outgoing slide's fade-out → a true cross-fade (no white dip).
  if (frame < start - XFADE || frame > end + 2) return null;
  const f = Math.max(0, frame - start); // local frame (clamped during the pre-roll)
  const inOp = ramp(frame, start - XFADE, start, CURVE.standard);
  const outOp = last ? 1 : 1 - ramp(frame, end - XFADE, end, CURVE.standard);
  const op = clamp01(Math.min(inOp, outOp));
  // a whisper of upward drift on entry / downward on exit (no scale push-in)
  const dy = (1 - inOp) * 10 - (last ? 0 : (1 - outOp) * 10);
  return (
    <AbsoluteFill style={{ opacity: op, transform: `translateY(${dy}px)` }}>{children(f)}</AbsoluteFill>
  );
};

export const HeroAltFamiliesVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // master camera: an almost-imperceptible periodic breathing (no linear push-in)
  const breathe = 1 + 0.004 * (1 - Math.cos((frame / TOTAL) * Math.PI * 2)) * 0.5;

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 120% at 50% 40%, #fbfbff 0%, #f4f4fa 55%, #e9eaf2 100%)',
        overflow: 'hidden',
      }}
    >
      <Fonts />

      <AbsoluteFill style={{ width: W, height: H, transform: `scale(${breathe})`, transformOrigin: '50% 46%' }}>
        <Slide start={SLIDES.controla.start} end={SLIDES.controla.end} frame={frame}>
          {(f) => <SlideControla f={f} />}
        </Slide>
        <Slide start={SLIDES.delega.start} end={SLIDES.delega.end} frame={frame}>
          {(f) => <SlideDelega f={f} />}
        </Slide>
        <Slide start={SLIDES.construye.start} end={SLIDES.construye.end} frame={frame}>
          {(f) => <SlideConstruye f={f} />}
        </Slide>
        <Slide start={SLIDES.flywheel.start} end={SLIDES.flywheel.end} frame={frame} last>
          {(f) => <SlideFlywheel f={f} />}
        </Slide>
      </AbsoluteFill>

      {/* a whisper of a neutral vignette for focus (not coloured) */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(circle at 50% 46%, transparent 62%, rgba(120,134,160,0.10) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};
