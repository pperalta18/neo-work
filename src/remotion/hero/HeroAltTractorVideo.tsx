/**
 * HeroAltTractorVideo — Hero alternativo C · "El combustible y el tractor"
 * ─────────────────────────────────────────────────────────────────────────────
 * Escenifica la frase literal del pitch: «La IA es el combustible. AiKit es el
 * tractor». AiKit no vende IA; vende la MAQUINARIA que la convierte en trabajo
 * útil. Tres "slides" en un ÚNICO plano continuo que la cámara recorre de
 * izquierda a derecha siguiendo el flujo:
 *
 *   1 (0–100)   El combustible — un enjambre de partículas KIT_BLUE en caos
 *               browniano determinista: energía cruda, sin dirección, no produce.
 *   2 (100–220) La máquina — entra una estructura neumórfica abstracta (canal +
 *               rodillos). El enjambre es absorbido por su boca y al atravesarla
 *               el caos se vuelve FLUJO LAMINAR (carriles paralelos, orden). 3
 *               iconos de módulos reales como "piezas" de la máquina.
 *   3 (220–330) El trabajo hecho — a la salida, el flujo se materializa en
 *               resultados tangibles (documento ✓, factura cobrada, KPI que sube)
 *               apilados en una fila ordenada. El sistema queda en marcha.
 *
 * Reglas de la casa (specs/motion-language.md · specs/hero-animation.md):
 * light mode, KIT_BLUE primario, SIN glows/halos/sombras de color, sin bounce,
 * neumorfismo sutil. La energía es MOVIMIENTO y densidad, no brillo. Determinista
 * por frame (useCurrentFrame / interpolate / hash Math.sin · sin random/Date).
 * No grid serpenteante, no chat, no logo, no tractor literal.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { DISPLAY_FONT, TEXT_FONT } from '@/lib/neumorphism';
import { MODULES } from '@/stories/neo/modules/modules';
import { Fonts } from '../fonts';
import {
  W,
  H,
  TAU,
  BLUE,
  INK,
  MUTED,
  SURFACE,
  clamp01,
  smooth,
  easeOut,
  easeInOut,
  lerp,
  hash,
  swirl,
  Machine,
  ResultCard,
  type ResultKind,
  SWARM_CX,
  MACHINE_X,
  OUTPUT_X,
} from './heroAltTractorParts';

export const HERO_ALT_TRACTOR_DURATION = 330; // 11 s @30fps

// ── act boundaries (frames) ─────────────────────────────────────────────────────
const ACT1_END = 100; // fuel
const ACT2_END = 220; // machine
// act 3 runs to the end (330)

// machine geometry shared with the particle math
const MOUTH_X = MACHINE_X - 290; // world X where the swarm gets drawn in
const THROAT_IN = MACHINE_X - 220;
const THROAT_OUT = MACHINE_X + 320; // world X where laminar flow exits the body
const LANE_GAP = 34; // vertical spacing between laminar lanes
const N_LANES = 5;

// ── camera: a single plane the camera glides across (L→R), eased per act ─────────
// Returns the world-X that should sit at screen centre on a given frame.
function cameraWorldX(f: number): number {
  if (f <= ACT1_END) {
    // hold on the swarm, drift a hair right as energy builds
    return lerp(SWARM_CX, SWARM_CX + 70, easeInOut(f / ACT1_END));
  }
  if (f <= ACT2_END) {
    // travel from the swarm to centre on the machine
    const t = easeInOut((f - ACT1_END) / (ACT2_END - ACT1_END));
    return lerp(SWARM_CX + 70, MACHINE_X + 40, t);
  }
  // travel from the machine to the field of results, then settle.
  // easeOut → it sets off promptly so the results are framed early, then eases to
  // a hold that keeps BOTH the machine exit (left) and the result field (right) in
  // shot — the "máquina trabajando, campo arado" final composition.
  const t = easeOut((f - ACT2_END) / (HERO_ALT_TRACTOR_DURATION - ACT2_END));
  return lerp(MACHINE_X + 40, OUTPUT_X - 230, t);
}

// ── particles ───────────────────────────────────────────────────────────────────
// Each particle lives in WORLD coords. Its life has 3 regimes blended by the act
// progress so the SAME points morph from chaos → laminar → consumed-into-results.
const N_PARTICLES = 96;

type Pt = { x: number; y: number; trail: number; op: number };

function particle(i: number, f: number): Pt | null {
  const seed = i * 1.0;
  // staggered loop so the stream feels continuous (each particle has its own phase)
  const period = 150 + Math.floor(hash(seed * 2.1) * 90); // 150–240 f to traverse
  const birth = Math.floor(hash(seed * 3.7) * period);
  const age = ((f - birth) % period + period) % period;
  const u = age / period; // 0..1 progress through this particle's journey

  // global act blend: how "machined" the world is right now
  const machineOn = clamp01((f - 70) / 60); // machine starts pulling ~70, full by 130
  const outputOn = clamp01((f - 200) / 40); // results start materialising ~200

  // ── chaos home: brownian swirl around the swarm centre ──
  const sx = SWARM_CX + swirl(seed + 0.1, f / 34) * 230 + Math.cos(f * 0.02 + seed * 9) * 40;
  const sy = H / 2 + swirl(seed + 5.3, f / 31) * 250 + Math.sin(f * 0.023 + seed * 7) * 38;

  // ── laminar lane assignment (ordered parallel carriers after the machine) ──
  const lane = i % N_LANES;
  const laneY = H / 2 + (lane - (N_LANES - 1) / 2) * LANE_GAP;

  // ── the journey when the machine is on: chaos → mouth → throat → exit lanes ──
  // map u to a world-X path; before machineOn it just churns in place
  let x: number;
  let y: number;
  let op = 1;
  let trail = 1;

  if (machineOn < 0.5) {
    // pure chaos (act 1): swirl in place
    x = sx;
    y = sy;
    trail = 1;
  } else {
    // act 2/3: particle travels left→right being ordered by the machine.
    // u<0.45 approaching/entering the mouth (still some swirl, converging to centre line)
    // 0.45..0.75 inside the throat → snap to its lane (laminar)
    // 0.75..1 exits toward the output, fades as it's "consumed" into a result
    if (u < 0.45) {
      const k = u / 0.45;
      const conv = easeInOut(k);
      // start point biased to the swarm, end at the mouth on the lane Y
      const startX = SWARM_CX + (hash(seed * 4.4) - 0.5) * 360;
      const startY = H / 2 + swirl(seed + 2.2, f / 30) * 220;
      x = lerp(startX, MOUTH_X, conv);
      // residual swirl that dies out as it nears the mouth
      const swirlAmt = (1 - conv) * 180;
      y = lerp(startY, laneY, conv) + swirl(seed + 8.1, f / 26) * swirlAmt * 0.4;
      trail = 1 + conv * 1.4;
    } else if (u < 0.78) {
      const k = (u - 0.45) / 0.33;
      x = lerp(THROAT_IN, THROAT_OUT, easeInOut(k));
      y = laneY; // dead-straight: laminar flow
      trail = 2.4; // long clean streak
    } else {
      const k = (u - 0.78) / 0.22;
      x = lerp(THROAT_OUT, OUTPUT_X - 120, easeOut(k));
      y = laneY;
      trail = lerp(2.4, 0.6, k);
      // fade out as the work is absorbed into the result cards (only once output is on)
      op = lerp(1, 0, easeInOut(k) * outputOn);
    }
  }

  if (op <= 0.02) return null;
  return { x, y, trail, op };
}

// ── the three module "pieces" embedded in the machine body ───────────────────────
const MACHINE_PIECES = [
  { key: 'junction' as const, dx: -150 }, // data hub — gathers the fuel
  { key: 'actionRunner' as const, dx: 0 }, // action hub — does the work
  { key: 'smartProcess' as const, dx: 150 }, // makes it repeatable
];

// ── result cards at the exit (the "campo arado") ─────────────────────────────────
const RESULTS: { kind: ResultKind; t0: number; col: number; row: number }[] = [
  { kind: 'invoice', t0: 232, col: 0, row: 0 },
  { kind: 'doc', t0: 250, col: 1, row: 0 },
  { kind: 'kpi', t0: 268, col: 0, row: 1 },
  { kind: 'doc', t0: 284, col: 1, row: 1 },
];

// ──────────────────────────────────────────────────────────────────────────────────
export const HeroAltTractorVideo: React.FC = () => {
  const frame = useCurrentFrame();

  // camera transform: world-X at screen centre → translate the world plane
  const camX = cameraWorldX(frame);
  const worldTx = W / 2 - camX;
  // gentle breathing scale, no push-in jolt
  const ca = (frame / HERO_ALT_TRACTOR_DURATION) * TAU;
  const camScale = 1 + 0.01 * (1 - Math.cos(ca)) * 0.5;

  // machine appearance + roller phase
  const machineOpen = easeOut(clamp01((frame - 96) / 34)); // slides/fades in ~96–130
  const rollerT = frame * 0.11; // continuous roller spin

  // ── titles per slide (short micro-headlines, Universal Sans Display) ──
  const t1 = titleProps(frame, 14, 96); // "La IA es el combustible"
  const t2 = titleProps(frame, 118, 214); // "AiKit es el tractor"
  // Closing claim: fades IN and then HOLDS at full opacity to the last frame
  // (no fade-out) so the final hold reads with full contrast — never a ghost.
  const t3 = titleProps(frame, 248, HERO_ALT_TRACTOR_DURATION, true); // "Trabajo hecho"

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 120% at 50% 42%, #fbfbff 0%, ${SURFACE} 55%, #e9eaf2 100%)`,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      {/* ── THE WORLD PLANE (camera translates it under a fixed viewport) ── */}
      <AbsoluteFill style={{ transform: `scale(${camScale})`, transformOrigin: '50% 50%' }}>
        <div style={{ position: 'absolute', inset: 0, transform: `translateX(${worldTx}px)`, willChange: 'transform' }}>
          {/* particles + their trails (SVG, world coords) */}
          <svg
            width={4200}
            height={H}
            viewBox={`0 0 4200 ${H}`}
            style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}
          >
            <defs>
              {/* one shared trail gradient, oriented per-particle via gradientTransform */}
              <linearGradient id="tractorTrail" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor={BLUE} stopOpacity="0" />
                <stop offset="1" stopColor={BLUE} stopOpacity="0.9" />
              </linearGradient>
            </defs>
            {Array.from({ length: N_PARTICLES }).map((_, i) => {
              const p = particle(i, frame);
              if (!p) return null;
              // trail points backward (in chaos: opposite the swirl velocity; in flow: -x)
              const prev = particle(i, frame - 2);
              let vx = -6;
              let vy = 0;
              if (prev) {
                vx = p.x - prev.x;
                vy = p.y - prev.y;
              }
              const vlen = Math.hypot(vx, vy) || 1;
              const tailLen = 26 * p.trail;
              const tx = p.x - (vx / vlen) * tailLen;
              const ty = p.y - (vy / vlen) * tailLen;
              const gid = `trl${i}`;
              const r = 3.4;
              return (
                <g key={i} opacity={p.op}>
                  <linearGradient id={gid} x1={tx} y1={ty} x2={p.x} y2={p.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={BLUE} stopOpacity="0" />
                    <stop offset="1" stopColor={BLUE} stopOpacity={0.5} />
                  </linearGradient>
                  <line x1={tx} y1={ty} x2={p.x} y2={p.y} stroke={`url(#${gid})`} strokeWidth={2} strokeLinecap="round" />
                  <circle cx={p.x} cy={p.y} r={r} fill={BLUE} />
                </g>
              );
            })}
          </svg>

          {/* the abstract neumorphic machine */}
          <Machine open={machineOpen} rollerT={rollerT} />

          {/* three real module icons embedded as machine "pieces" */}
          {MACHINE_PIECES.map((pc, i) => {
            const icon = MODULES[pc.key].icon;
            const rot = (MODULES[pc.key] as { rotate?: number }).rotate ?? 0;
            // sit just above the throat, fade in with the machine, gentle pulse
            const px = MACHINE_X + pc.dx;
            const py = H / 2 - 168;
            const pulse = 1 + 0.06 * Math.max(0, Math.sin(frame * 0.16 - i * 1.8));
            const op = machineOpen * 0.94;
            return (
              <div key={pc.key} style={{ position: 'absolute', left: px, top: py, width: 0, height: 0 }}>
                <img
                  src={icon}
                  alt=""
                  width={56}
                  height={56}
                  style={{
                    position: 'absolute',
                    left: -28,
                    top: -28,
                    opacity: op,
                    transform: `scale(${pulse})${rot ? ` rotate(${rot}deg)` : ''}`,
                    transformOrigin: '50% 50%',
                  }}
                />
                {/* a hairline stem tying the piece to the body */}
                <div
                  style={{
                    position: 'absolute',
                    left: -1,
                    top: 26,
                    width: 2,
                    height: 64,
                    background: 'rgba(120,134,160,0.32)',
                    opacity: op,
                  }}
                />
              </div>
            );
          })}

          {/* the field of results (act 3) */}
          {RESULTS.map((r, i) => {
            const rise = clamp01((frame - r.t0) / 26);
            const baseX = OUTPUT_X - 30;
            const x = baseX + r.col * 234;
            const y = H / 2 - 168 + r.row * 168;
            return <ResultCard key={i} kind={r.kind} x={x} y={y} rise={rise} />;
          })}
        </div>
      </AbsoluteFill>

      {/* ── SLIDE TITLES (screen-fixed, not in the world plane) ── */}
      <Title {...t1} eyebrow="Combustible" headline="La IA es el combustible" sub="Energía cruda, sin dirección" align="center" />
      <Title {...t2} eyebrow="La máquina" headline="AiKit es el tractor" sub="La maquinaria que convierte IA en trabajo" align="center" />
      <Title {...t3} eyebrow="El trabajo hecho" headline="Trabajo hecho, no promesas" sub="El sistema queda en marcha" align="center" />

      {/* a whisper of neutral vignette for focus (never coloured) */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(120% 120% at 50% 46%, transparent 58%, rgba(120,134,160,0.10) 100%)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};

// ── title timing: fade/slide in, hold, fade out (decelerate, no bounce) ──────────
// `hold` skips the fade-out entirely: the title arrives and then stays at full
// opacity to the end (used by the closing claim so the final hold is fully legible).
function titleProps(f: number, inAt: number, outAt: number, hold = false): { op: number; ty: number } {
  const inDur = 16;
  const outDur = 16;
  const fadeIn = clamp01(smooth((f - inAt) / inDur));
  const fadeOut = hold ? 1 : clamp01(smooth((outAt - f) / outDur));
  const op = fadeIn * fadeOut;
  const ty = lerp(18, 0, easeOut(fadeIn));
  return { op, ty };
}

function Title({
  op,
  ty,
  eyebrow,
  headline,
  sub,
}: {
  op: number;
  ty: number;
  eyebrow: string;
  headline: string;
  sub: string;
  align: 'center';
}) {
  if (op <= 0.01) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 116,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        opacity: op,
        transform: `translateY(${ty}px)`,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 19,
          letterSpacing: 2.4,
          textTransform: 'uppercase',
          color: BLUE,
          marginBottom: 14,
        }}
      >
        {eyebrow}
      </span>
      <h1
        style={{
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: 76,
          lineHeight: 1,
          letterSpacing: -1.2,
          color: INK,
          margin: 0,
        }}
      >
        {headline}
      </h1>
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 400, fontSize: 24, color: MUTED, marginTop: 16 }}>{sub}</span>
    </div>
  );
}
