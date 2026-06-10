/**
 * heroAltTractorParts — building blocks for the "Combustible y tractor" hero (alt C).
 * ─────────────────────────────────────────────────────────────────────────────────
 * Pure, deterministic helpers + the abstract neumorphic "machine" body and the
 * "trabajo hecho" result cards. No Math.random / Date.now — everything is a pure
 * function of the frame. Light mode, no coloured glows; relief via neumorphism.
 */

import type { CSSProperties } from 'react';
import { KIT_BLUE, lightTheme } from '@/lib/neumorphism';

// ── geometry of the world (one wide plane the camera pans across L→R) ───────────
export const W = 1920;
export const H = 1080;
export const RAD = Math.PI / 180;
export const TAU = Math.PI * 2;

// ── pure helpers ────────────────────────────────────────────────────────────────
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Material 3 "emphasized decelerate" — appears / arrives (the default). */
export const easeOut = (t: number) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};
export const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** Deterministic 0..1 hash (no Date/random) — Math.sin folding (house style). */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};
/** Signed deterministic value-noise-ish in [-1,1] for smooth wandering. */
export const swirl = (seed: number, t: number) =>
  Math.sin(t * 1.7 + seed * 6.283) * 0.6 + Math.sin(t * 0.9 + seed * 12.9) * 0.4;

// ── brand colours ─────────────────────────────────────────────────────────────
export const SURFACE = lightTheme.surface;
export const INK = lightTheme.textStrong;
export const MUTED = lightTheme.textMuted;
export const BLUE = KIT_BLUE;

// world X anchors: where each act lives along the long plane
export const SWARM_CX = 760; // act 1 — the raw fuel churns here
export const MACHINE_X = 1900; // act 2 — the machine body sits here (world coords)
export const OUTPUT_X = 3040; // act 3 — the field of results stacks here

/**
 * The abstract neumorphic machine: a long recessed channel (the "throat") with a
 * lit mouth on the left, a body with internal rollers/gates, and an exit chute on
 * the right. NOT a literal tractor — a clean geometric brand object.
 *
 * `open` 0..1 drives the rollers spinning + the internal gates pulsing; `rollerT`
 * is the continuous roller phase. Drawn in WORLD coords (the camera translates).
 */
export function Machine({
  open,
  rollerT,
}: {
  open: number;
  rollerT: number;
}) {
  const bodyX = MACHINE_X - 360;
  const bodyY = H / 2 - 250;
  const bodyW = 720;
  const bodyH = 500;
  const k = lightTheme;

  // neumorphic relief via box-shadow strings (light source top-left)
  const raised: CSSProperties = {
    boxShadow: `-10px -10px 26px ${k.highlight}, 12px 14px 30px ${k.shadow}`,
  };
  const recessed: CSSProperties = {
    boxShadow: `inset 9px 9px 20px ${k.shadow}, inset -9px -9px 20px ${k.highlight}`,
  };

  // three internal rollers, evenly spaced inside the throat
  const rollers = [0, 1, 2].map((i) => {
    const rx = bodyX + 196 + i * 168;
    const ry = bodyY + bodyH / 2;
    return { rx, ry, i };
  });

  return (
    <div
      style={{
        position: 'absolute',
        left: bodyX,
        top: bodyY,
        width: bodyW,
        height: bodyH,
        opacity: open,
      }}
    >
      {/* outer body — raised plate */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 56,
          backgroundColor: SURFACE,
          ...raised,
        }}
      />

      {/* the recessed throat (the channel the fuel passes through) */}
      <div
        style={{
          position: 'absolute',
          left: 70,
          top: bodyH / 2 - 96,
          width: bodyW - 140,
          height: 192,
          borderRadius: 96,
          backgroundColor: SURFACE,
          ...recessed,
        }}
      />

      {/* lit mouth on the left — where the swarm is drawn in */}
      <div
        style={{
          position: 'absolute',
          left: 26,
          top: bodyH / 2 - 116,
          width: 64,
          height: 232,
          borderRadius: 40,
          backgroundColor: SURFACE,
          boxShadow: `inset 6px 0 16px ${k.shadow}, inset -6px 0 16px ${k.highlight}`,
        }}
      />

      {/* internal rollers — raised pucks that rotate, ordering the flow */}
      <svg
        width={bodyW}
        height={bodyH}
        viewBox={`0 0 ${bodyW} ${bodyH}`}
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        {rollers.map(({ i }) => {
          const cx = 196 + i * 168;
          const cy = bodyH / 2;
          const spin = rollerT * (i % 2 === 0 ? 1 : -1) + i * 0.7;
          const spokes = 6;
          return (
            <g key={i}>
              {/* roller disc with a neumorphic rim */}
              <circle cx={cx} cy={cy} r={48} fill={SURFACE} stroke={k.highlight} strokeWidth={3} opacity={0.96} />
              <circle cx={cx} cy={cy} r={48} fill="none" stroke={k.shadow} strokeWidth={2} opacity={0.7} />
              {/* spokes show rotation; blue tick marks the work it carries */}
              {Array.from({ length: spokes }).map((_, s) => {
                const a = spin + (s / spokes) * TAU;
                const x1 = cx + Math.cos(a) * 16;
                const y1 = cy + Math.sin(a) * 16;
                const x2 = cx + Math.cos(a) * 42;
                const y2 = cy + Math.sin(a) * 42;
                const isTick = s === 0;
                return (
                  <line
                    key={s}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isTick ? BLUE : k.shadow}
                    strokeWidth={isTick ? 4 : 2.4}
                    strokeLinecap="round"
                    opacity={isTick ? 0.9 : 0.55}
                  />
                );
              })}
              <circle cx={cx} cy={cy} r={7} fill={SURFACE} stroke={k.shadow} strokeWidth={2} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * A single "result" card at the machine exit — a tangible piece of finished work.
 * `kind` picks the glyph (document ✓ / invoice cobrada / KPI panel). `rise` 0..1
 * animates it settling into the ordered row (decelerate, no bounce).
 */
export type ResultKind = 'doc' | 'invoice' | 'kpi';

export function ResultCard({
  kind,
  x,
  y,
  rise,
}: {
  kind: ResultKind;
  x: number;
  y: number;
  rise: number;
}) {
  const k = lightTheme;
  const w = 210;
  const h = 148;
  const e = easeOut(rise);
  const ty = lerp(34, 0, e); // slide up into place
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + ty,
        width: w,
        height: h,
        opacity: e,
        borderRadius: 22,
        backgroundColor: SURFACE,
        boxShadow: `-8px -8px 20px ${k.highlight}, 10px 12px 24px ${k.shadow}`,
        padding: 18,
        boxSizing: 'border-box',
      }}
    >
      {kind === 'doc' && <DocGlyph k={k} />}
      {kind === 'invoice' && <InvoiceGlyph k={k} />}
      {kind === 'kpi' && <KpiGlyph k={k} t={e} />}
    </div>
  );
}

function DocGlyph(_props: { k: typeof lightTheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11, height: '100%', justifyContent: 'center' }}>
      {[0.92, 0.7, 0.82, 0.5].map((wd, i) => (
        <div
          key={i}
          style={{
            height: 9,
            width: `${wd * 100}%`,
            borderRadius: 6,
            background: i === 0 ? INK : 'rgba(120,134,160,0.32)',
            opacity: i === 0 ? 0.55 : 1,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          right: 16,
          bottom: 14,
          width: 34,
          height: 34,
          borderRadius: 18,
          background: BLUE,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <svg width={18} height={18} viewBox="0 0 18 18">
          <path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function InvoiceGlyph(_props: { k: typeof lightTheme }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: "'Universal Sans Display', sans-serif", fontWeight: 700, fontSize: 30, color: INK }}>€</span>
        <span style={{ fontFamily: "'Universal Sans Display', sans-serif", fontWeight: 700, fontSize: 27, color: INK, letterSpacing: 0.3 }}>4.820</span>
      </div>
      {[0.8, 0.6].map((wd, i) => (
        <div key={i} style={{ height: 8, width: `${wd * 100}%`, borderRadius: 5, background: 'rgba(120,134,160,0.3)' }} />
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 14, background: BLUE, display: 'grid', placeItems: 'center' }}>
          <svg width={14} height={14} viewBox="0 0 18 18">
            <path d="M3.5 9.5 L7.5 13.5 L14.5 5" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span style={{ fontFamily: "'Universal Sans Text', sans-serif", fontWeight: 600, fontSize: 15, color: BLUE }}>Cobrada</span>
      </div>
    </div>
  );
}

function KpiGlyph({ t }: { k: typeof lightTheme; t: number }) {
  const bars = [0.32, 0.5, 0.44, 0.7, 0.86];
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'Universal Sans Text', sans-serif", fontWeight: 600, fontSize: 14, color: MUTED }}>KPI</span>
        <span style={{ fontFamily: "'Universal Sans Display', sans-serif", fontWeight: 700, fontSize: 18, color: BLUE }}>↑ 38%</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 9, height: 72 }}>
        {bars.map((b, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: `${b * 100 * clamp01((t - i * 0.08) / 0.5)}%`,
              borderRadius: 5,
              background: i === bars.length - 1 ? BLUE : 'rgba(120,134,160,0.4)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
