/**
 * HeroAltClicksVideo — Hero alternativo A · "Cero clicks"
 * ──────────────────────────────────────────────────────────────────────────────
 * Narrativa de presentación en 4 slides (~11 s) que dramatiza el titular de la web
 * ("No pierdas el tiempo haciendo clicks") SIN repetirlo literal. Abre con TUS
 * clicks frenéticos saltando entre apps y cierra con CERO.
 *
 *   S1 «Esto eres tú»        (0–105)   — caen mini-ventanas de apps genéricas; un
 *                                          cursor real salta haciendo click (ripple)
 *                                          a ritmo creciente; contador de clicks sube.
 *   S2 «La entrega»          (105–210) — un último click delega; las ventanas se
 *                                          pliegan hacia una superficie central de la
 *                                          que emergen Controla · Delega · Construye,
 *                                          cada palabra con iconos de módulo reales.
 *   S3 «El trabajo se hace solo» (210–280) — una factura cruza 3 etapas que se
 *                                          encienden KIT_BLUE (se lee → se ejecuta →
 *                                          queda automatizada) y sale como ✓; entran
 *                                          más piezas en paralelo, acelerando.
 *   S4 «Cero clicks»         (280–340) — resultados apilados, el contador reaparece
 *                                          marcando 0, claim final.
 *
 * Reglas de la casa: 1920×1080@30, determinista por frame (sin random/Date), light
 * mode de marca, KIT_BLUE, Universal Sans Display/Text, sin glows/halos/sombras de
 * color, sin bounce, neumorfismo sutil. NO grid serpenteante, NO chat/burbujas, NO
 * OperatingModuleTile, NO logo en apertura/cierre. Iconos = SVG reales de MODULES.
 */

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { KIT_BLUE, lightTheme } from '@/lib/neumorphism';
import { MODULES } from '@/stories/neo/modules/modules';
import { Fonts } from '../fonts';

// Hero alternativo A — "Cero clicks" (narrativa en 4 slides).
export const HERO_ALT_CLICKS_DURATION = 340;

// ── canvas ──────────────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const DISPLAY = "'Universal Sans Display', ui-sans-serif, system-ui, sans-serif";
const TEXT = "'Universal Sans Text', ui-sans-serif, system-ui, sans-serif";

// ── house curves (motion-language.md · Material emphasized, no bounce) ────────
const CURVE = {
  enter: Easing.bezier(0.05, 0.7, 0.1, 1),
  exit: Easing.bezier(0.3, 0, 0.8, 0.15),
  standard: Easing.bezier(0.2, 0, 0, 1),
} as const;

// ── slide boundaries ──────────────────────────────────────────────────────────
const S2 = 105;
const S3 = 210;
const S4 = 280;

// ── pure helpers ──────────────────────────────────────────────────────────────
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 11.7) * 43758.5453;
  return x - Math.floor(x);
};
/** interpolate with clamping (the default we want everywhere). */
const lerp = (
  f: number,
  input: [number, number],
  output: [number, number],
  easing = CURVE.standard,
) => interpolate(f, input, output, { easing, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

// ──────────────────────────────────────────────────────────────────────────────
// SLIDE 1 — «Esto eres tú»: app windows pile up, frantic cursor, click counter
// ──────────────────────────────────────────────────────────────────────────────

type WindowKind = 'sheet' | 'mail' | 'erp' | 'chat' | 'calendar' | 'docs';

type AppWindow = {
  kind: WindowKind;
  title: string;
  x: number; // centre
  y: number;
  w: number;
  h: number;
  rot: number; // deg
  appear: number; // frame it drops in
};

// 7 generic app windows, hand-placed so they saturate the canvas without colliding
// hard, slightly rotated. Centres are in canvas px; the cursor visits each.
const WINDOWS: AppWindow[] = [
  { kind: 'sheet', title: 'Hoja de cálculo', x: 470, y: 360, w: 420, h: 300, rot: -4, appear: 6 },
  { kind: 'mail', title: 'Bandeja de entrada', x: 1120, y: 300, w: 430, h: 300, rot: 3, appear: 16 },
  { kind: 'calendar', title: 'Calendario', x: 1500, y: 560, w: 400, h: 300, rot: -3, appear: 28 },
  { kind: 'erp', title: 'ERP · Pedidos', x: 760, y: 690, w: 440, h: 300, rot: 4, appear: 40 },
  { kind: 'chat', title: 'Mensajes', x: 320, y: 720, w: 360, h: 280, rot: -5, appear: 52 },
  { kind: 'docs', title: 'Documentos', x: 1300, y: 800, w: 410, h: 290, rot: 2.5, appear: 62 },
  { kind: 'erp', title: 'Facturación', x: 1010, y: 540, w: 400, h: 290, rot: -2, appear: 74 },
];

// Cursor click schedule — accelerating. Each click lands on a window's title-ish
// spot. Times chosen to ramp from slow → frantic, the last one (the "delegate"
// click) lands at the very end of S1 / start of S2.
const CLICKS: { t: number; wi: number }[] = [
  { t: 18, wi: 0 },
  { t: 32, wi: 1 },
  { t: 44, wi: 2 },
  { t: 54, wi: 3 },
  { t: 63, wi: 4 },
  { t: 71, wi: 5 },
  { t: 78, wi: 6 },
  { t: 84, wi: 1 },
  { t: 89, wi: 0 },
  { t: 93, wi: 3 },
  { t: 97, wi: 2 },
  { t: 101, wi: 5 },
];
// The final "delegate" click that triggers S2.
const DELEGATE_CLICK = 108;

// where each click points (offset a bit inside the window so it feels like real UI)
function clickTarget(wi: number): { x: number; y: number } {
  const w = WINDOWS[wi];
  return { x: w.x - w.w / 2 + 60 + hash(wi * 3.7) * (w.w - 120), y: w.y - w.h / 2 + 70 + hash(wi * 9.1) * 60 };
}

// The cursor position at any frame: ease between consecutive click targets, with
// a small press-dip on each landing. Deterministic.
function cursorPos(frame: number): { x: number; y: number; press: number } {
  const all = [...CLICKS, { t: DELEGATE_CLICK, wi: -1 }];
  // start parked top-left-ish
  let from = { x: 360, y: 220 };
  let fromT = 0;
  for (let i = 0; i < all.length; i++) {
    const c = all[i];
    const tgt = c.wi < 0 ? { x: W / 2, y: 470 } : clickTarget(c.wi);
    if (frame <= c.t) {
      const p = lerp(frame, [fromT, c.t], [0, 1], CURVE.standard);
      // press dip right at the landing
      const press = frame > c.t - 4 ? lerp(frame, [c.t - 4, c.t], [0, 1]) : 0;
      return { x: from.x + (tgt.x - from.x) * p, y: from.y + (tgt.y - from.y) * p, press };
    }
    from = tgt;
    fromT = c.t;
  }
  return { x: from.x, y: from.y, press: 0 };
}

/** the click counter value at a frame — counts CLICKS landed, scaled to ~312. */
function clickCount(frame: number): number {
  // base count from scheduled clicks (each adds a chunk so the number flies up)
  let landed = 0;
  for (const c of CLICKS) if (frame >= c.t) landed++;
  if (frame >= DELEGATE_CLICK) landed++;
  // map landed clicks (0..13) onto a believable "you did this many today" number
  const perClick = 24;
  const base = landed * perClick;
  // add a smooth ticking between clicks so it never sits still while accelerating
  const next = CLICKS.find((c) => frame < c.t);
  if (next && landed > 0) {
    const prevT = [...CLICKS].reverse().find((c) => frame >= c.t)?.t ?? 0;
    const frac = clamp01((frame - prevT) / (next.t - prevT));
    return Math.round(base + frac * perClick);
  }
  return base;
}

// schematic content for each window kind (no text labels, just shapes)
function WindowChrome({ w }: { w: AppWindow }) {
  const dot = (c: string) => (
    <span style={{ width: 9, height: 9, borderRadius: '50%', background: c, display: 'inline-block' }} />
  );
  return (
    <div
      style={{
        width: w.w,
        height: w.h,
        borderRadius: 16,
        background: '#ffffff',
        boxShadow: '0 18px 40px rgba(60,72,100,0.14), 0 2px 6px rgba(60,72,100,0.10)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* title bar */}
      <div
        style={{
          height: 34,
          background: '#f1f2f7',
          borderBottom: '1px solid rgba(120,134,160,0.16)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
        }}
      >
        {dot('#e0e2ea')}
        {dot('#e0e2ea')}
        {dot('#e0e2ea')}
        <span style={{ marginLeft: 10, fontFamily: TEXT, fontSize: 13, fontWeight: 600, color: '#9aa0b4' }}>{w.title}</span>
      </div>
      {/* schematic body */}
      <div style={{ flex: 1, padding: 16 }}>
        <SchematicBody kind={w.kind} w={w.w - 32} h={w.h - 34 - 32} />
      </div>
    </div>
  );
}

function SchematicBody({ kind, h }: { kind: WindowKind; w: number; h: number }) {
  const muted = '#e6e8f0';
  const muted2 = '#eef0f6';
  if (kind === 'sheet' || kind === 'erp') {
    const cols = 5;
    const rows = Math.max(3, Math.floor(h / 30));
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gridAutoRows: 24, gap: 4 }}>
        {Array.from({ length: cols * rows }).map((_, i) => (
          <div key={i} style={{ background: i < cols ? '#dfe6f2' : i % 7 === 0 ? '#d8e3f5' : muted, borderRadius: 4 }} />
        ))}
      </div>
    );
  }
  if (kind === 'mail' || kind === 'chat') {
    const rows = Math.max(3, Math.floor(h / 44));
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: muted, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 7, width: '55%', background: muted, borderRadius: 4, marginBottom: 6 }} />
              <div style={{ height: 6, width: '85%', background: muted2, borderRadius: 4 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (kind === 'calendar') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridAutoRows: 1, gap: 5, height: '100%' }}>
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: [9, 15, 16, 23, 28].includes(i) ? '#d8e3f5' : muted,
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    );
  }
  // docs
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {Array.from({ length: Math.max(4, Math.floor(h / 18)) }).map((_, i) => (
        <div key={i} style={{ height: 8, width: `${88 - (i % 4) * 14}%`, background: i === 0 ? '#d8e3f5' : muted, borderRadius: 4 }} />
      ))}
    </div>
  );
}

const Slide1: React.FC = () => {
  const frame = useCurrentFrame();
  const cur = cursorPos(frame);

  // S1 fades out as windows get absorbed in S2 (handled there); here we just
  // render windows + cursor + counter while in S1's active range.
  return (
    <>
      {WINDOWS.map((w, i) => {
        const appear = lerp(frame, [w.appear, w.appear + 12], [0, 1], CURVE.enter);
        const dropY = lerp(frame, [w.appear, w.appear + 14], [-60, 0], CURVE.enter);
        const op = appear;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: w.x - w.w / 2,
              top: w.y - w.h / 2 + dropY,
              opacity: op,
              transform: `rotate(${w.rot}deg) scale(${0.92 + 0.08 * appear})`,
              transformOrigin: '50% 50%',
            }}
          >
            <WindowChrome w={w} />
          </div>
        );
      })}

      {/* click ripples — one per scheduled click, expanding rings */}
      {[...CLICKS, { t: DELEGATE_CLICK, wi: -1 }].map((c, i) => {
        const dt = frame - c.t;
        if (dt < 0 || dt > 16) return null;
        const tgt = c.wi < 0 ? { x: W / 2, y: 470 } : clickTarget(c.wi);
        const p = dt / 16;
        const r = 8 + p * 46;
        const op = (1 - p) * 0.7;
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: tgt.x - r,
              top: tgt.y - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              border: `2.5px solid ${KIT_BLUE}`,
              opacity: op,
            }}
          />
        );
      })}

      <RealisticCursor x={cur.x} y={cur.y} press={cur.press} />

      <ClickCounter frame={frame} value={clickCount(frame)} />
    </>
  );
};

// A clean OS-style pointer drawn inline (frame-driven, no DOM events).
function RealisticCursor({ x, y, press, faded = 1 }: { x: number; y: number; press: number; faded?: number }) {
  const s = 1 - press * 0.12;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `scale(${s})`,
        transformOrigin: '0 0',
        opacity: faded,
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <svg width={30} height={30} viewBox="0 0 24 24" style={{ display: 'block', filter: 'drop-shadow(0 2px 3px rgba(40,50,72,0.35))' }}>
        <path
          d="M3 2 L3 18.2 L7.2 14.2 L10 20.4 L12.7 19.2 L9.9 13.1 L15.4 13.1 Z"
          fill="#fff"
          stroke="#1e1e20"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function ClickCounter({ frame, value }: { frame: number; value: number }) {
  // appears early, lives through S1, leaves as S2 begins (it returns in S4 at 0)
  const op = lerp(frame, [10, 22], [0, 1], CURVE.enter) * (1 - lerp(frame, [S2 + 2, S2 + 16], [0, 1], CURVE.exit));
  if (op <= 0.01) return null;
  // tiny scale kick on every increment to feel frantic
  const kick = 1 + 0.08 * Math.max(0, Math.sin((frame % 8) / 8 * Math.PI)) * (frame < 102 ? 1 : 0);
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 64,
        opacity: op,
        textAlign: 'right',
        transform: `scale(${kick})`,
        transformOrigin: '100% 50%',
      }}
    >
      <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 92, lineHeight: 0.95, color: '#1e1e20', letterSpacing: -1 }}>
        {value}
      </div>
      <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 22, color: '#9aa0b4', letterSpacing: 2, textTransform: 'uppercase' }}>
        clicks hoy
      </div>
    </div>
  );
}

// micro-headline for S1, low corner so it doesn't fight the windows
function Headline({ text, frame, in0, hold, x, y, align = 'left' }: { text: string; frame: number; in0: number; hold: number; x: number; y: number; align?: 'left' | 'center' }) {
  const op =
    lerp(frame, [in0, in0 + 12], [0, 1], CURVE.enter) * (1 - lerp(frame, [hold, hold + 12], [0, 1], CURVE.exit));
  const yOff = lerp(frame, [in0, in0 + 16], [14, 0], CURVE.enter);
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y + yOff,
        opacity: op,
        transform: align === 'center' ? 'translateX(-50%)' : 'none',
        fontFamily: DISPLAY,
        fontWeight: 700,
        fontSize: 40,
        color: '#1e1e20',
        letterSpacing: -0.5,
        textAlign: align,
      }}
    >
      {text}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SLIDE 2 — «La entrega»: windows fold into a central surface; the three pitch
// words emerge, each with real module icons cascading.
// ──────────────────────────────────────────────────────────────────────────────

const PITCH: { word: string; mods: (keyof typeof MODULES)[]; cx: number }[] = [
  { word: 'Controla', mods: ['glimpse', 'foresight', 'junction'], cx: W / 2 - 520 },
  { word: 'Delega', mods: ['actionRunner', 'heartbeat'], cx: W / 2 },
  { word: 'Construye', mods: ['smartProcess', 'forge'], cx: W / 2 + 520 },
];

const Slide2: React.FC = () => {
  const frame = useCurrentFrame();
  // local time inside S2
  const f = frame - S2;

  // windows get absorbed: each flies toward centre, shrinks and fades (staggered)
  const surfaceCx = W / 2;
  const surfaceCy = 470;

  // central surface: a clean neumorphic plate that forms as windows arrive
  const surfaceIn = lerp(f, [10, 30], [0, 1], CURVE.enter);
  const surfaceFade = 1 - lerp(f, [78, 96], [0, 1], CURVE.exit); // dissolves as words settle

  return (
    <>
      {/* absorbed windows */}
      {WINDOWS.map((w, i) => {
        const start = 2 + i * 3.5;
        const p = lerp(f, [start, start + 22], [0, 1], CURVE.exit);
        if (p >= 1) return null;
        const x = w.x + (surfaceCx - w.x) * p;
        const y = w.y + (surfaceCy - w.y) * p;
        const sc = (1 - p) * (0.94) + 0.06;
        const op = (1 - p);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x - w.w / 2,
              top: y - w.h / 2,
              opacity: op,
              transform: `rotate(${w.rot * (1 - p)}deg) scale(${sc})`,
              transformOrigin: '50% 50%',
            }}
          >
            <WindowChrome w={w} />
          </div>
        );
      })}

      {/* the clean central surface the work is delegated onto */}
      <div
        style={{
          position: 'absolute',
          left: surfaceCx - 700,
          top: surfaceCy - 130,
          width: 1400,
          height: 260,
          borderRadius: 28,
          background: lightTheme.surface,
          boxShadow: '10px 10px 26px #d6dcec, -10px -10px 26px #ffffff',
          opacity: surfaceIn * surfaceFade,
          transform: `scale(${0.9 + 0.1 * surfaceIn})`,
          transformOrigin: '50% 50%',
        }}
      />

      {/* the three pitch words emerging from the surface */}
      {PITCH.map((p, pi) => {
        const start = 40 + pi * 10;
        const op = lerp(f, [start, start + 16], [0, 1], CURVE.enter);
        const yOff = lerp(f, [start, start + 20], [26, 0], CURVE.enter);
        return (
          <div key={p.word} style={{ position: 'absolute', left: p.cx, top: surfaceCy - 24, transform: 'translateX(-50%)', opacity: op }}>
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 54,
                color: '#1e1e20',
                letterSpacing: -1,
                textAlign: 'center',
                transform: `translateY(${yOff}px)`,
                whiteSpace: 'nowrap',
              }}
            >
              {p.word}
            </div>
            {/* module icons cascading below the word */}
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 22 }}>
              {p.mods.map((m, mi) => {
                const ms = start + 16 + mi * 6;
                const mop = lerp(f, [ms, ms + 12], [0, 1], CURVE.enter);
                const my = lerp(f, [ms, ms + 14], [-18, 0], CURVE.enter);
                const spec = MODULES[m];
                return (
                  <img
                    key={m}
                    src={spec.icon}
                    alt={spec.name}
                    width={64}
                    height={64}
                    style={{
                      display: 'block',
                      opacity: mop,
                      transform: `translateY(${my}px)${(spec as { rotate?: number }).rotate ? ` rotate(${(spec as { rotate?: number }).rotate}deg)` : ''}`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      {/* the delegate cursor makes its last move out of frame and never returns */}
      {(() => {
        const leave = lerp(f, [0, 28], [0, 1], CURVE.exit);
        const x = W / 2 + leave * 380;
        const y = 470 + leave * 360;
        const op = 1 - lerp(f, [10, 28], [0, 1], CURVE.exit);
        if (op <= 0.01) return null;
        return <RealisticCursor x={x} y={y} press={0} faded={op} />;
      })()}
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// SLIDE 3 — «El trabajo se hace solo»: a work piece crosses 3 stages that light up
// KIT_BLUE, then more pieces enter in parallel, accelerating.
// ──────────────────────────────────────────────────────────────────────────────

const STAGES = [
  { label: 'Se lee', x: W / 2 - 480 },
  { label: 'Se ejecuta', x: W / 2 },
  { label: 'Automatizado', x: W / 2 + 480 },
];
const TRACK_Y = 540;
const TRACK_X0 = W / 2 - 720;
const TRACK_X1 = W / 2 + 720;

// each piece: when it enters, how long it takes to cross (later pieces faster)
type Piece = { t0: number; dur: number; lane: number };
const PIECES: Piece[] = [
  { t0: 6, dur: 46, lane: 0 }, //   the hero piece, full speed
  { t0: 40, dur: 40, lane: -1 },
  { t0: 40, dur: 40, lane: 1 },
  { t0: 56, dur: 34, lane: 0 },
  { t0: 56, dur: 34, lane: -1 },
  { t0: 56, dur: 34, lane: 1 },
];

/** progress 0..1 of a piece at local frame f (S3-relative). */
function pieceProg(p: Piece, f: number): number | null {
  if (f < p.t0 || f > p.t0 + p.dur) return null;
  return lerp(f, [p.t0, p.t0 + p.dur], [0, 1], CURVE.standard);
}

/** stage lit amount 0..1 — lights when any piece is passing through its zone. */
function stageLit(si: number, f: number): number {
  let best = 0;
  const center = (STAGES[si].x - TRACK_X0) / (TRACK_X1 - TRACK_X0);
  for (const p of PIECES) {
    const prog = pieceProg(p, f);
    if (prog == null) continue;
    const d = Math.abs(prog - center);
    const v = clamp01(1 - d / 0.16);
    if (v > best) best = v;
  }
  return best;
}

const Slide3: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame - S3;
  const inOp = lerp(f, [0, 14], [0, 1], CURVE.enter);

  return (
    <div style={{ opacity: inOp }}>
      {/* the track */}
      <div
        style={{
          position: 'absolute',
          left: TRACK_X0,
          top: TRACK_Y - 1,
          width: TRACK_X1 - TRACK_X0,
          height: 2,
          background: 'rgba(120,134,160,0.22)',
        }}
      />

      {/* stages */}
      {STAGES.map((st, si) => {
        const lit = stageLit(si, f);
        const isLast = si === STAGES.length - 1;
        return (
          <div key={st.label} style={{ position: 'absolute', left: st.x, top: TRACK_Y, transform: 'translate(-50%,-50%)' }}>
            <div
              style={{
                width: 132,
                height: 132,
                borderRadius: 26,
                background: lightTheme.surface,
                boxShadow:
                  lit > 0.05
                    ? `inset 4px 4px 10px #d6dcec, inset -4px -4px 10px #ffffff`
                    : `7px 7px 18px #d6dcec, -7px -7px 18px #ffffff`,
                border: `2px solid ${lit > 0.05 ? `rgba(0,112,249,${0.25 + lit * 0.6})` : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'none',
              }}
            >
              {/* a small mark per stage; last shows a check when lit */}
              <StageMark si={si} lit={lit} />
            </div>
            <div
              style={{
                marginTop: 16,
                textAlign: 'center',
                fontFamily: TEXT,
                fontWeight: 600,
                fontSize: 22,
                letterSpacing: 0.3,
                color: lit > 0.3 ? KIT_BLUE : '#8a90a4',
              }}
            >
              {st.label}
            </div>
            {isLast && <></>}
          </div>
        );
      })}

      {/* the work pieces crossing */}
      {PIECES.map((p, i) => {
        const prog = pieceProg(p, f);
        if (prog == null) return null;
        const x = TRACK_X0 + prog * (TRACK_X1 - TRACK_X0);
        // pieces ride just above the track; parallel lanes fan out vertically
        const yLane = TRACK_Y - 78 + p.lane * 64;
        // becomes a check as it finishes
        const done = prog > 0.9;
        const op = lerp(prog, [0, 0.06], [0, 1]);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: yLane,
              transform: 'translate(-50%,-50%)',
              opacity: op,
            }}
          >
            <WorkPiece done={done} />
          </div>
        );
      })}
    </div>
  );
};

function StageMark({ si, lit }: { si: number; lit: number }) {
  const col = lit > 0.2 ? KIT_BLUE : '#c3c9d8';
  if (si === 0) {
    // reading: lines
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[64, 50, 58].map((wd, k) => (
          <div key={k} style={{ width: wd, height: 7, borderRadius: 4, background: col }} />
        ))}
      </div>
    );
  }
  if (si === 1) {
    // executing: gear-ish play
    return (
      <svg width={54} height={54} viewBox="0 0 24 24">
        <path d="M9 7 L17 12 L9 17 Z" fill={col} />
      </svg>
    );
  }
  // automated: check
  return (
    <svg width={56} height={56} viewBox="0 0 24 24">
      <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke={col} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WorkPiece({ done }: { done: boolean }) {
  // a small invoice/document card; turns into a check at the end
  if (done) {
    return (
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: KIT_BLUE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(0,112,249,0.25)',
        }}
      >
        <svg width={30} height={30} viewBox="0 0 24 24">
          <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }
  return (
    <div
      style={{
        width: 62,
        height: 80,
        borderRadius: 8,
        background: '#fff',
        boxShadow: '0 10px 22px rgba(60,72,100,0.16)',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ height: 8, width: '70%', background: KIT_BLUE, borderRadius: 3, opacity: 0.85 }} />
      {[80, 60, 75, 50].map((wd, k) => (
        <div key={k} style={{ height: 5, width: `${wd}%`, background: '#e6e8f0', borderRadius: 3 }} />
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// SLIDE 4 — «Cero clicks»: results stack, counter returns at 0, final claim.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Descending click counter for S4. Starts at the high S1 value (~312) and races
 * down to a hard 0 between local frames f0..f1, then stays pinned at 0 for the
 * whole hold. Deterministic, eased so it decelerates into 0.
 */
function clickCountdown(f: number): number {
  const start = 312;
  const f0 = 6;
  const f1 = 28;
  if (f <= f0) return start;
  if (f >= f1) return 0;
  // eased descent that lands exactly on 0
  return Math.round(lerp(f, [f0, f1], [start, 0], CURVE.exit));
}

const Slide4: React.FC = () => {
  const frame = useCurrentFrame();
  const f = frame - S4;

  // Layout: a centred, balanced two-column composition.
  //  · left  — the giant "0" counter (the conceptual punch line)
  //  · right — the stacked result checks
  //  · below — the claim ("Cero clicks" + subtitle), centred, with a long hold.
  const groupCx = W / 2;
  const groupCy = 410;

  const counterVal = clickCountdown(f);
  const counterIn = lerp(f, [4, 18], [0, 1], CURVE.enter);
  const isZero = counterVal === 0;
  // a single calm settle-scale as it reaches 0 (no bounce)
  const zeroSettle = isZero ? lerp(f, [28, 38], [0.96, 1], CURVE.standard) : 1;

  // stacked results (checks) on the right of the counter
  const RESULTS = 4;
  const stackX = groupCx + 70;
  const stackY0 = groupCy - (RESULTS - 1) * 33;

  return (
    <>
      {/* ── the giant 0 counter (left column) ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          left: groupCx - 90,
          top: groupCy,
          transform: `translate(-100%,-50%) scale(${zeroSettle})`,
          transformOrigin: '100% 50%',
          opacity: counterIn,
          textAlign: 'right',
        }}
      >
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 800,
            fontSize: 260,
            lineHeight: 0.86,
            color: isZero ? KIT_BLUE : '#1e1e20',
            letterSpacing: -8,
          }}
        >
          {counterVal}
        </div>
        <div
          style={{
            fontFamily: TEXT,
            fontWeight: 600,
            fontSize: 26,
            color: '#9aa0b4',
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          clicks hoy
        </div>
      </div>

      {/* thin divider between counter and results */}
      {(() => {
        const op = lerp(f, [10, 22], [0, 1], CURVE.enter) * 0.5;
        return (
          <div
            style={{
              position: 'absolute',
              left: groupCx,
              top: groupCy - 130,
              width: 1,
              height: 260,
              background: 'rgba(120,134,160,0.45)',
              opacity: op,
              transform: 'translateX(-50%)',
            }}
          />
        );
      })()}

      {/* ── stacked result checks (right column) ────────────────────────────── */}
      {Array.from({ length: RESULTS }).map((_, i) => {
        const start = 11 + i * 5;
        const op = lerp(f, [start, start + 12], [0, 1], CURVE.enter);
        const x = lerp(f, [start, start + 16], [34, 0], CURVE.enter);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: stackX + x,
              top: stackY0 + i * 66,
              opacity: op,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: KIT_BLUE,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width={24} height={24} viewBox="0 0 24 24">
                <path d="M5 12.5 L10 17.5 L19 7" fill="none" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={{ height: 9, width: 210, background: '#d6dbe8', borderRadius: 4 }} />
              <div style={{ height: 7, width: 140, background: '#e6e9f1', borderRadius: 4 }} />
            </div>
          </div>
        );
      })}

      {/* ── big claim, centred, with a long legible hold ────────────────────── */}
      {(() => {
        const op = lerp(f, [24, 38], [0, 1], CURVE.enter);
        const yOff = lerp(f, [24, 42], [28, 0], CURVE.enter);
        const subOp = lerp(f, [34, 46], [0, 1], CURVE.enter);
        return (
          <div
            style={{
              position: 'absolute',
              left: W / 2,
              top: groupCy + 210,
              transform: `translate(-50%, ${yOff}px)`,
              opacity: op,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 124,
                color: '#1e1e20',
                letterSpacing: -3,
                lineHeight: 0.96,
              }}
            >
              Cero clicks
            </div>
            <div
              style={{
                fontFamily: TEXT,
                fontWeight: 550,
                fontSize: 38,
                color: '#6c6c89',
                marginTop: 22,
                opacity: subOp,
              }}
            >
              El trabajo ya no lo haces tú.
            </div>
          </div>
        );
      })()}
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
export const HeroAltClicksVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // micro-fade between slides (whole-stage cross-fade on the cut)
  const fadeAt = (boundary: number) => {
    const half = 7;
    if (frame < boundary - half || frame > boundary + half) return null;
    return 1 - Math.abs(frame - boundary) / half; // 0..1..0 dip
  };

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(120% 120% at 50% 40%, #fbfbff 0%, #f4f4fa 55%, #e9eaf2 100%)',
        fontFamily: TEXT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      {/* SLIDE 1 — windows + frantic cursor (active 0..S2) */}
      {frame < S2 + 36 && (
        <AbsoluteFill style={{ opacity: frame < S2 ? 1 : 0 }}>
          <Slide1 />
        </AbsoluteFill>
      )}
      {/* S1 micro-headline lives on the S1 stage */}
      {frame < S2 && (
        <Headline text="Esto eres tú." frame={frame} in0={30} hold={96} x={120} y={H - 150} />
      )}

      {/* SLIDE 2 — delivery (active S2..S3) */}
      {frame >= S2 - 2 && frame < S3 + 8 && (
        <AbsoluteFill>
          <Slide2 />
        </AbsoluteFill>
      )}

      {/* SLIDE 3 — work runs itself (active S3..S4) */}
      {frame >= S3 - 2 && frame < S4 + 8 && (
        <AbsoluteFill>
          <Slide3 />
        </AbsoluteFill>
      )}
      {frame >= S3 && frame < S4 && (
        <Headline text="El trabajo se hace solo." frame={frame - S3} in0={10} hold={62} x={W / 2} y={H - 140} align="center" />
      )}

      {/* SLIDE 4 — cero clicks (active S4..END) */}
      {frame >= S4 - 2 && (
        <AbsoluteFill>
          <Slide4 />
        </AbsoluteFill>
      )}

      {/* slide-cut micro-fades */}
      {[S2, S3, S4].map((b) => {
        const dip = fadeAt(b);
        if (dip == null) return null;
        return (
          <AbsoluteFill
            key={b}
            style={{
              background: '#f4f4fa',
              opacity: dip * 0.55,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
