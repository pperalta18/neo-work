/**
 * heroAltFamiliesParts — shared on-screen furniture for the alt-B hero.
 * The four slides reuse these so they feel like SIBLINGS: same title anchor,
 * same micro-sub grammar, same clean module-icon rendering (no plate, no border).
 */
import { CSSProperties } from 'react';
import { CURVE, DISPLAY, TEXT, INK, MUTED, KIT_BLUE, TITLE, ramp, clamp01, IconSpec } from './heroAltFamiliesKit';

/** A clean brand module icon — no plate, no border (Foresight carries rotate). */
export const ModuleIcon: React.FC<{
  spec: IconSpec;
  size: number;
  style?: CSSProperties;
  /** 0..1 — opacity floor lifts as it "wakes". */
  reveal?: number;
}> = ({ spec, size, style, reveal = 1 }) => (
  <img
    src={spec.src}
    alt={spec.name}
    width={size}
    height={size}
    style={{
      display: 'block',
      opacity: 0.4 + 0.6 * clamp01(reveal),
      transform: spec.rotate ? `rotate(${spec.rotate}deg)` : undefined,
      ...style,
    }}
  />
);

/**
 * The slide title block — the load-bearing "sibling" element. Same x/y anchor
 * on every slide; the word + the micro-sub share one grammar. The word reveals
 * with a soft mask wipe (opacity/contrast, never a glow).
 */
export const SlideTitle: React.FC<{
  index: number; //  01 / 02 / 03
  word: string; //   Controla / Delega / Construye
  sub: string; //    micro-sub
  /** local frame inside the slide (0 = slide start). */
  f: number;
  /** family tint dot for the eyebrow. */
}> = ({ index, word, sub, f }) => {
  const inWord = ramp(f, 6, 26, CURVE.enter);
  const inSub = ramp(f, 20, 40, CURVE.enter);
  const inEye = ramp(f, 2, 16, CURVE.enter);
  // a thin rule under the eyebrow draws across as the word lands
  const rule = ramp(f, 10, 34, CURVE.standard);

  return (
    <div style={{ position: 'absolute', left: TITLE.x, top: TITLE.y, width: 760 }}>
      {/* eyebrow: 0N · familia */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: inEye,
          transform: `translateY(${(1 - inEye) * 8}px)`,
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 9, background: KIT_BLUE, display: 'inline-block' }} />
        <span
          style={{
            fontFamily: TEXT,
            fontWeight: 600,
            fontSize: 20,
            letterSpacing: 3,
            color: MUTED,
            textTransform: 'uppercase',
          }}
        >
          0{index} · AiKit
        </span>
      </div>

      {/* hairline rule that draws across */}
      <div
        style={{
          marginTop: 18,
          height: 1,
          width: `${rule * 100}%`,
          maxWidth: 560,
          background: 'rgba(120,134,160,0.35)',
        }}
      />

      {/* the word */}
      <h1
        style={{
          margin: '22px 0 0',
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: 132,
          lineHeight: 0.96,
          letterSpacing: -2,
          color: INK,
          opacity: inWord,
          transform: `translateY(${(1 - inWord) * 16}px)`,
          // soft left-to-right reveal mask (contrast, not glow)
          WebkitMaskImage: `linear-gradient(90deg, #000 ${inWord * 130 - 15}%, transparent ${inWord * 130}%)`,
          maskImage: `linear-gradient(90deg, #000 ${inWord * 130 - 15}%, transparent ${inWord * 130}%)`,
        }}
      >
        {word}
      </h1>

      {/* micro-sub */}
      <p
        style={{
          margin: '20px 0 0',
          fontFamily: TEXT,
          fontWeight: 500,
          fontSize: 30,
          letterSpacing: 0.2,
          color: MUTED,
          opacity: inSub,
          transform: `translateY(${(1 - inSub) * 10}px)`,
        }}
      >
        {sub}
      </p>
    </div>
  );
};

/** Small caption that names the modules a slide leans on (right-aligned, faint). */
export const FamilyTag: React.FC<{ label: string; f: number; in0: number }> = ({ label, f, in0 }) => {
  const op = ramp(f, in0, in0 + 18, CURVE.enter) * 0.9;
  return (
    <div
      style={{
        position: 'absolute',
        left: TITLE.x,
        top: TITLE.y + 470,
        fontFamily: TEXT,
        fontWeight: 600,
        fontSize: 17,
        letterSpacing: 1.4,
        color: 'rgba(108,108,137,0.85)',
        textTransform: 'uppercase',
        opacity: op,
      }}
    >
      {label}
    </div>
  );
};
