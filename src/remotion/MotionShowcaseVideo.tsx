/**
 * MotionShowcaseVideo — "AiKit · Reveal" (light · neumorphic)
 * ──────────────────────────────────────────────────────────────────────────
 * A calm, light-mode brand reveal that embodies the motion-for-video grammar
 * researched for AiKit — but on our neumorphic surface, with NO bounce and NO
 * coloured glows. Depth comes only from neumorphic relief (a lit edge + a soft
 * shade computed by `elevation()`), never from drop shadows in a brand colour.
 *
 * Beats (sound-led rhythm, 30 fps):
 *
 *   BEAT 0 · ANTICIPATION (0–10)    the hero plate sits pressed-in (recessed),
 *                                   the quiet beat before it rises.
 *   BEAT 1 · ASSEMBLY     (10–96)   six neumorphic module tiles glide in from
 *                                   the edges, staggered, blur→sharp. Pure
 *                                   ease-out — they decelerate, never overshoot.
 *   BEAT 2 · EMERGE       (96–150)  the tiles converge + fade as the hero plate
 *                                   presses up out of the surface (recessed →
 *                                   raised) holding the real AiKit mark; a soft
 *                                   sheen is drawn across it.
 *   BEAT 3 · WORDMARK     (150–210) the "Aikit" wordmark rises in, smooth.
 *   BEAT 4 · BREATHE      (210–300) a slow parallax + push-in; relief settles.
 *
 * Principle → code map:
 *   · Easing                CURVE.enter / CURVE.standard (shared ./motion tokens)
 *   · NO bounce             every entrance is a decelerating ease-out, no spring
 *                           overshoot (this replaces the earlier bouncy springs)
 *   · Timing & spacing      per-tile stagger; non-linear spacing via the curve
 *   · Anticipation          the recessed → raised neumorphic "press" of the hero
 *   · Staging / choreography sequenced, depth-sorted tile entrances
 *   · Follow-through        the breathing hold at the end
 *   · Light & depth         neumorphic relief + rack-focus blur + a soft sheen
 *
 * Determinism: every pixel is a pure function of the frame (no Date/random).
 */

import { type CSSProperties } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { KIT_BLUE, BRAND, lightTheme, elevation, TEXT_FONT } from '@/lib/neumorphism';
import { AikitLogo } from '@/components/AikitLogo';
import { CURVE } from './motion';
import { Fonts } from './fonts';

// ── timeline (30 fps) ───────────────────────────────────────────────────────
const B_ASSEMBLE = 10;
const B_MORPH = 96;
const B_WORD = 150;
const B_HOLD = 210;
export const MOTION_SHOWCASE_DURATION = 300; // 10 s

// Easing curves live in ./motion (CURVE.enter / exit / standard) — the shared
// AiKit motion language. See specs/motion-language.md.
const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const RAD = Math.PI / 180;

/** Eased progress of `frame` across [start, end], clamped to 0…1. */
const ease = (frame: number, start: number, end: number, easing = CURVE.enter) =>
  interpolate(frame, [start, end], [0, 1], { ...clampE, easing });

// ── the module tiles that assemble into the mark ──────────────────────────────
type Glyph = 'grid' | 'bars' | 'dot' | 'ring' | 'rows' | 'spark';
type Tile = { color: string; glyph: Glyph; finalAngle: number; entrySpread: number };

const TILES: Tile[] = [
  { color: BRAND.blue, glyph: 'spark', finalAngle: -90, entrySpread: -24 },
  { color: BRAND.green, glyph: 'bars', finalAngle: -30, entrySpread: 22 },
  { color: BRAND.teal, glyph: 'dot', finalAngle: 30, entrySpread: -18 },
  { color: BRAND.purple, glyph: 'ring', finalAngle: 90, entrySpread: 24 },
  { color: BRAND.orange, glyph: 'rows', finalAngle: 150, entrySpread: -22 },
  { color: BRAND.pink, glyph: 'grid', finalAngle: -150, entrySpread: 20 },
];

const CLUSTER_R = 210; // resting radius of the hex cluster
const TILE = 116; // tile edge
const HERO = 224; // hero plate edge

// ─────────────────────────────────────────────────────────────────────────────
export const MotionShowcaseVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // Slow dolly push-in across the whole piece (cinematic, very subtle).
  const dolly = interpolate(frame, [0, MOTION_SHOWCASE_DURATION], [1.0, 1.03], { ...clampE, easing: CURVE.standard });
  // Camera breathing once we settle — a gentle parallax drift.
  const after = frame > B_HOLD;
  const camX = after ? Math.sin((frame - B_HOLD) / 46) * 6 : 0;
  const camY = after ? Math.sin((frame - B_HOLD) / 60) * 3.5 : 0;

  // BEAT 2 · convergence of tiles → centre (decelerate, no overshoot)
  const converge = ease(frame, B_MORPH, B_MORPH + 44, CURVE.enter);
  // hero plate: anticipation (recessed) → emerge (raised), smooth
  const emerge = ease(frame, B_MORPH + 8, B_MORPH + 52, CURVE.enter);
  const heroScale = lerp(0.86, 1, emerge);
  const heroOpacity = clamp01(emerge * 1.8);
  const sheen = interpolate(frame, [B_MORPH + 26, B_MORPH + 60], [-1.3, 1.3], { ...clampE, easing: CURVE.standard });

  return (
    <AbsoluteFill
      style={{
        // light neumorphic surface — a faint neutral lift in the centre, no colour
        background: `radial-gradient(circle at 50% 43%, #fbfbff, ${lightTheme.surface} 62%, #edeef4)`,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translate(${camX}px, ${camY}px) scale(${dolly})`,
          transformOrigin: '50% 45%',
        }}
      >
        {/* a 1×1 anchor at the centre; the mark sits on it, wordmark below */}
        <div style={{ position: 'relative', width: 1, height: 1, marginBottom: 96 }}>
          {/* BEAT 1 + 2 · the module tiles (assemble, then converge + fade) */}
          {TILES.map((t, i) => {
            const delay = i * 5; // stagger — staging & choreography
            const a = t.finalAngle * RAD;
            const cluster = { x: Math.cos(a) * CLUSTER_R, y: Math.sin(a) * CLUSTER_R * 0.9 };
            const ea = (t.finalAngle + t.entrySpread) * RAD;
            const from = { x: Math.cos(ea) * 640, y: Math.sin(ea) * 360 - 24 };

            // pure ease-out entrance — decelerates to rest, NO overshoot
            const enter = ease(frame, B_ASSEMBLE + delay, B_ASSEMBLE + delay + 34, CURVE.enter);
            // rack focus — sharpens as it arrives (shallow depth of field)
            const blur = (1 - clamp01(enter * 1.15)) * 14;

            let x = lerp(from.x, cluster.x, enter);
            let y = lerp(from.y, cluster.y, enter);
            let scale = lerp(0.7, 1, enter);
            let opacity = clamp01(enter * 1.5);

            // BEAT 2 · converge into the centre and dissolve into the mark
            if (frame >= B_MORPH) {
              x = lerp(cluster.x, 0, converge);
              y = lerp(cluster.y, 0, converge);
              scale = lerp(1, 0.4, converge);
              opacity = 1 - clamp01((frame - (B_MORPH + 16)) / 24);
            }

            // relief grows a touch as the tile lands (settles onto the surface)
            const relief = lerp(0.55, 1, enter);
            return (
              <ModuleTile key={i} x={x} y={y} scale={scale} blur={blur} opacity={opacity} relief={relief} color={t.color} glyph={t.glyph} />
            );
          })}

          {/* BEAT 2 · the hero plate with the real AiKit mark */}
          {frame >= B_MORPH && (
            <HeroMark scale={heroScale} opacity={heroOpacity} emerge={emerge} sheen={sheen} />
          )}

          {/* BEAT 3 · the official AiKit wordmark, rising in (smooth) */}
          <Wordmark frame={frame} />
        </div>
      </AbsoluteFill>

      {/* a whisper of a vignette for focus — neutral, not coloured */}
      <AbsoluteFill
        style={{ background: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(120,134,160,0.10) 100%)', pointerEvents: 'none' }}
      />
    </AbsoluteFill>
  );
};

// ── the neumorphic hero plate + AiKit mark ──────────────────────────────────────
function HeroMark({ scale, opacity, emerge, sheen }: { scale: number; opacity: number; emerge: number; sheen: number }) {
  // anticipation → emerge: the plate presses up out of the surface as relief grows
  const plate = elevation(lightTheme, {
    depth: 'raised',
    distance: lerp(3, 12, emerge),
    blur: lerp(8, 30, emerge),
    radius: 52,
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: -HERO / 2,
        top: -HERO / 2,
        width: HERO,
        height: HERO,
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      <div
        style={{
          ...plate,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <AikitLogo variant="mark" height={104} markColor={KIT_BLUE} />
        {/* a soft neutral sheen drawn across the plate (a highlight, not a glow) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(108deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)',
            transform: `translateX(${sheen * 100}%)`,
          }}
        />
      </div>
    </div>
  );
}

// ── the module tile ──────────────────────────────────────────────────────────
function ModuleTile({
  x,
  y,
  scale,
  blur,
  opacity,
  relief,
  color,
  glyph,
}: {
  x: number;
  y: number;
  scale: number;
  blur: number;
  opacity: number;
  relief: number;
  color: string;
  glyph: Glyph;
}) {
  const plate = elevation(lightTheme, { depth: 'raised', distance: lerp(3, 7, relief), blur: lerp(8, 18, relief), radius: 26 });
  return (
    <div
      style={{
        position: 'absolute',
        left: -TILE / 2,
        top: -TILE / 2,
        width: TILE,
        height: TILE,
        opacity,
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        filter: blur > 0.4 ? `blur(${blur}px)` : undefined,
        willChange: 'transform, filter, opacity',
      }}
    >
      <div style={{ ...plate, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <TileGlyph kind={glyph} color={color} />
      </div>
    </div>
  );
}

/** Minimal geometric glyphs — distinct per tile, in the tile's brand accent (no glow). */
function TileGlyph({ kind, color }: { kind: Glyph; color: string }) {
  const c = color;
  switch (kind) {
    case 'bars':
      return (
        <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
          {[20, 36, 28, 44].map((h, i) => (
            <span key={i} style={{ width: 8, height: h, borderRadius: 3, background: c, opacity: 0.6 + i * 0.1 }} />
          ))}
        </div>
      );
    case 'rows':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[44, 32, 38].map((w, i) => (
            <span key={i} style={{ width: w, height: 8, borderRadius: 4, background: c, opacity: 0.55 + i * 0.18 }} />
          ))}
        </div>
      );
    case 'grid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 20, height: 20, borderRadius: 6, background: c, opacity: 0.55 + (i % 2) * 0.3 }} />
          ))}
        </div>
      );
    case 'ring':
      return <span style={{ width: 44, height: 44, borderRadius: '50%', border: `7px solid ${c}`, opacity: 0.85 }} />;
    case 'dot':
      return <span style={{ width: 30, height: 30, borderRadius: '50%', background: c }} />;
    case 'spark':
    default:
      return <span style={{ color: c, fontSize: 46, fontWeight: 800, lineHeight: 1 }}>✦</span>;
  }
}

// ── the official AiKit wordmark, cropped from the lockup ─────────────────────────
function Wordmark({ frame }: { frame: number }) {
  const t = ease(frame, B_WORD, B_WORD + 30, CURVE.enter);
  const tag = ease(frame, B_WORD + 18, B_WORD + 50, CURVE.enter);
  const H = 66;
  const lockupW = H * (360 / 76);
  const cropFrac = 136 / 360; // the wordmark "Aikit" starts ~x=140; crop a touch earlier for left margin

  return (
    <div
      style={{
        position: 'absolute',
        top: HERO / 2 + 44,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      {/* crop the official lockup to just the "Aikit" wordmark (real brand asset) */}
      <div
        style={{
          width: lockupW * (1 - cropFrac),
          height: H,
          overflow: 'hidden',
          opacity: clamp01(t * 1.4),
          transform: `translateY(${(1 - t) * 26}px)`,
        }}
      >
        <div style={{ transform: `translateX(${-lockupW * cropFrac}px)` }}>
          <AikitLogo variant="lockup" height={H} tone="light" markColor={KIT_BLUE} />
        </div>
      </div>

      {/* tagline as secondary action — placeholder copy, easy to swap */}
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 23,
          letterSpacing: 0.3,
          whiteSpace: 'nowrap',
          color: lightTheme.textMuted,
          opacity: clamp01(tag * 1.4),
          transform: `translateY(${(1 - tag) * 12}px)`,
        }}
      >
        Agentes de IA para tu negocio
      </span>
    </div>
  );
}
