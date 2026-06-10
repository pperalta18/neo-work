/**
 * HeroIntroVideo — "El ecosistema vivo" (hero de la home · light · neumórfico)
 * ──────────────────────────────────────────────────────────────────────────────
 * La pieza que explica QUÉ es AiKit (no un caso de uso). Render ÚNICO, ~10 s, en
 * BUCLE perfecto. NO es un grid serpenteante ni un chat (la firma de los 5 flujos).
 * No abre/cierra con el logo, ni usa placas/bordes: los MÓDULOS REALES (sus iconos
 * de marca) pueblan el lienzo y el TRABAJO fluye entre ellos.
 *
 * El ecosistema completo de AiKit, vivo y trabajando EN PARALELO. Los 16 módulos se
 * agrupan en sus 3 familias (Controla · Delega · Construye). Las conexiones NO son
 * por proximidad: son una malla CURADA por la semántica de cada módulo (quién
 * colabora de verdad con quién — ver `RELATIONS`), para que ninguna conexión sea
 * "rara". Por las aristas viajan paquetes de datos (KIT_BLUE); cuando el trabajo
 * llega a un módulo, éste PULSA y dice su nombre un instante.
 *
 * ROLES ESPECIALES por módulo (no todos se comportan igual):
 *   · Heartbeat = TRIGGER. No recibe inputs: "despierta" en latidos periódicos y, en
 *     cada latido, EMITE a la vez a varios ejecutores (Action Runner / Action Script /
 *     Smart Process / Teamwork). Late con un doble pulso cardíaco (lub-dub).
 *   (Hueco para más customizaciones por módulo conforme se pidan.)
 *
 * BUCLE PERFECTO: sin entrada/fade — todo presente desde el frame 0; todo movimiento
 * es PERIÓDICO en `LOOP` frames (tiempo modular) → el frame 299 encadena con el 0.
 *
 * Reglas de la casa (specs/motion-language.md): light mode, sin glows, sin bounce,
 * suave. La animación Rive interna NO se usa (no se captura en `renderMedia`).
 * Determinismo: función pura de `frame mod LOOP` (hash `Math.sin`, sin Date/random).
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { KIT_BLUE, lightTheme, TEXT_FONT } from '@/lib/neumorphism';
import { MODULES, MODULE_NAMES, type ModuleName, type ModuleGroup, type ModuleSpec } from '@/stories/neo/modules/modules';
import { Fonts } from '../fonts';

export const HERO_INTRO_DURATION = 300; // 10 s @30fps
const LOOP = HERO_INTRO_DURATION; // everything is periodic in LOOP frames → seamless loop

// ── canvas + look ─────────────────────────────────────────────────────────────
const W = 1920;
const H = 1080;
const ICON = 84; // icon edge (no plate, no border)
const RAD = Math.PI / 180;
const TAU = Math.PI * 2;
const TAIL_PX = 175; // length of the fading trail a packet leaves behind it

// ── helpers (pure) ────────────────────────────────────────────────────────────
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
const mod = (x: number, m: number) => ((x % m) + m) % m;
/** Deterministic 0..1 hash (no Date/random) — just Math.sin folding. */
const hash = (n: number) => { const x = Math.sin(n * 127.1 + 11.7) * 43758.5453; return x - Math.floor(x); };

// ── the 16 modules, placed in 3 family clusters (computed once) ────────────────
type Node = { key: ModuleName; name: string; icon: string; rotate: number; group: ModuleGroup; x: number; y: number };

const CLUSTERS: Record<ModuleGroup, { cx: number; cy: number; r: number; phase: number }> = {
  data: { cx: 568, cy: 538, r: 338, phase: 18 }, //          Controla (8) · izquierda
  action: { cx: 1362, cy: 404, r: 252, phase: 65 }, //        Delega (5)   · arriba-derecha
  orchestration: { cx: 1374, cy: 778, r: 158, phase: 140 }, // Construye (3) · abajo-derecha
};

const NODES: Node[] = (() => {
  const byGroup: Record<ModuleGroup, ModuleName[]> = { data: [], action: [], orchestration: [] };
  for (const k of MODULE_NAMES) byGroup[MODULES[k].group].push(k);
  const out: Node[] = [];
  (['data', 'action', 'orchestration'] as ModuleGroup[]).forEach((g) => {
    const c = CLUSTERS[g];
    const list = byGroup[g];
    list.forEach((key, k) => {
      const ang = (k * 137.5 + c.phase) * RAD; // golden-angle sunflower packing
      const rad = c.r * Math.sqrt((k + 0.55) / list.length);
      const x = c.cx + Math.cos(ang) * rad;
      const y = c.cy + Math.sin(ang) * rad * 0.92;
      out.push({ key, name: MODULES[key].name, icon: MODULES[key].icon, rotate: (MODULES[key] as ModuleSpec).rotate ?? 0, group: g, x, y });
    });
  });
  // fit: recentre the bounding box on the canvas and grow a touch (less padding around)
  const xs = out.map((n) => n.x);
  const ys = out.map((n) => n.y);
  const bcx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const bcy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const SPREAD = 1.08;
  out.forEach((n) => {
    n.x = W / 2 + (n.x - bcx) * SPREAD;
    n.y = H / 2 + (n.y - bcy) * SPREAD;
  });
  return out;
})();

const IDX = Object.fromEntries(NODES.map((n, i) => [n.key, i])) as Record<ModuleName, number>;

// ── CURATED semantics: who actually collaborates with whom (no proximity guesses) ─
// Edit here to add/remove a relation; by construction there are no "weird" edges.
const RELATIONS: [ModuleName, ModuleName][] = [
  // Junction = data hub: gathers every source into one integrated view
  ['junction', 'hotpot'],
  ['junction', 'sqlsense'],
  ['junction', 'udon'],
  ['junction', 'docusense'],
  // Junction feeds analysis + visualisation
  ['junction', 'foresight'],
  ['junction', 'glimpse'],
  // Foresight = prediction over the data; informs memory, processes, the view
  ['foresight', 'glimpse'],
  ['foresight', 'feedbackLoop'],
  ['foresight', 'smartProcess'],
  ['foresight', 'docusense'],
  // Action Runner = action hub: acts THROUGH the connectors (pitch: combina con udon/hotpot/sqlsense) + infra
  ['actionRunner', 'hotpot'],
  ['actionRunner', 'udon'],
  ['actionRunner', 'sqlsense'],
  ['actionRunner', 'sushimi'],
  // Orchestration of actions
  ['actionScript', 'actionRunner'], // sequences runners
  ['teamwork', 'actionRunner'], //     parallelises runners
  ['teamwork', 'actionScript'],
  ['smartProcess', 'actionScript'], // processes drive sequences
  ['smartProcess', 'actionRunner'],
  ['skillHub', 'actionRunner'], //     provides skills the actions consume
  ['skillHub', 'smartProcess'],
  // Memory closes the loop
  ['feedbackLoop', 'actionRunner'],
  ['feedbackLoop', 'smartProcess'],
  // Construye: build software (human apps / AI skills), deploy on infra
  ['forge', 'glimpse'], //  builds the human-facing panels from the view
  ['forge', 'skillHub'], // software-for-humans ↔ software-for-AIs
  ['forge', 'sushimi'], //  deploys via SSH/infra
];

// Heartbeat is a TRIGGER, not a peer: it wakes and fires OUT to these executors
// (plus Foresight — a wake can kick off a predictive analysis).
const HEARTBEAT_TARGETS: ModuleName[] = ['actionRunner', 'actionScript', 'smartProcess', 'teamwork', 'foresight'];

// ── edges (curated). `trigger` edges always point FROM heartbeat. ──────────────
type Edge = { a: number; b: number; bridge: boolean; trigger: boolean };
const EDGES: Edge[] = (() => {
  const out: Edge[] = [];
  const seen = new Set<string>();
  const push = (a: number, b: number, trigger: boolean) => {
    const key = `${a}-${b}`;
    if (seen.has(key) || seen.has(`${b}-${a}`)) return;
    seen.add(key);
    out.push({ a, b, bridge: NODES[a].group !== NODES[b].group, trigger });
  };
  RELATIONS.forEach(([x, y]) => push(IDX[x], IDX[y], false));
  HEARTBEAT_TARGETS.forEach((t) => push(IDX.heartbeat, IDX[t], true)); // a = heartbeat (source)
  return out;
})();
const NORMAL_EDGE_IDX = EDGES.map((e, i) => (e.trigger ? -1 : i)).filter((i) => i >= 0);

// ── heartbeat wakes: a few beats per loop; each fires a broadcast burst ─────────
const HB = IDX.heartbeat;
const HB_DUR = 58; // travel of a heartbeat pulse to its targets (slow, gentle)
const WAKES = [20, 120, 220]; // 3 beats per loop (kept clear of the 300-frame seam)

// ── the traffic: normal packets + heartbeat broadcast bursts (all loop-aware) ──
type Packet = { e: number; dir: 1 | -1; t0: number; dur: number };
const PACKETS: Packet[] = (() => {
  const out: Packet[] = [];
  // normal background traffic over the curated (non-trigger) edges
  const N = 105;
  for (let i = 0; i < N; i++) {
    const e = NORMAL_EDGE_IDX[Math.floor(hash(i * 3.13) * NORMAL_EDGE_IDX.length)];
    const dur = 50 + Math.floor(hash(i * 5.27) * 30); // 50–80 f to cross (slower, gentler)
    const t0 = Math.floor(hash(i * 1.77) * LOOP); // uniform over the loop (no spin-up)
    const dir: 1 | -1 = hash(i * 7.91) < 0.5 ? 1 : -1;
    out.push({ e, dir, t0, dur });
  }
  // heartbeat: every wake, fire ONE packet down each trigger edge, all at once
  EDGES.forEach((e, ei) => {
    if (!e.trigger) return;
    for (const w of WAKES) out.push({ e: ei, dir: 1, t0: w, dur: HB_DUR }); // dir 1 → from heartbeat (a)
  });
  return out;
})();

// arrivals per node → when each module lights up (its phase within the loop)
const ARRIVALS: number[][] = NODES.map(() => []);
PACKETS.forEach((p) => {
  const edge = EDGES[p.e];
  const dest = p.dir === 1 ? edge.b : edge.a;
  ARRIVALS[dest].push(mod(p.t0 + p.dur, LOOP));
});

/** Normal module activation 0..1 — quick rise as work arrives, soft long decay. Loop-aware. */
function activation(node: number, f: number): number {
  let a = 0;
  for (const fa of ARRIVALS[node]) {
    const raw = mod(f - fa, LOOP);
    let c = 0;
    if (raw <= 40) c = 1 - raw / 40; // decay after arrival
    else if (raw >= LOOP - 10) c = (raw - (LOOP - 10)) / 10; // approach before next arrival
    if (c > a) a = c;
  }
  return a;
}

/** Heartbeat's own cardiac double-beat (lub-dub) at each wake. Loop-aware. */
function heartbeatPulse(f: number): number {
  let best = 0;
  for (const w of WAKES) {
    const d = mod(f - w, LOOP);
    if (d > 13) continue;
    const lub = Math.max(0, 1 - ((d - 1.5) / 2) ** 2);
    const dub = Math.max(0, 1 - ((d - 6) / 2.2) ** 2) * 0.82;
    const v = Math.min(1, lub + dub);
    if (v > best) best = v;
  }
  return best;
}

// ──────────────────────────────────────────────────────────────────────────────
export const HeroIntroVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const ca = (frame / LOOP) * TAU; // master loop angle (one turn per loop)

  // camera: a tiny circular drift + a slow breathing — all periodic (seamless loop)
  const scale = 1 + 0.012 * (1 - Math.cos(ca)) * 0.5;
  const camX = Math.sin(ca) * 5;
  const camY = Math.sin(ca * 2) * 3;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 47%, #fbfbff, ${lightTheme.surface} 58%, #e9eaf2)`,
        fontFamily: TEXT_FONT,
        overflow: 'hidden',
      }}
    >
      <Fonts />

      <AbsoluteFill style={{ transform: `translate(${camX}px, ${camY}px) scale(${scale})`, transformOrigin: '50% 47%' }}>
        {/* ── no fixed mesh: each packet draws only a fading trail behind it ── */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
          {PACKETS.map((p, i) => {
            const tp = mod(frame - p.t0, LOOP);
            if (tp > p.dur) return null;
            const edge = EDGES[p.e];
            const A = p.dir === 1 ? NODES[edge.a] : NODES[edge.b];
            const B = p.dir === 1 ? NODES[edge.b] : NODES[edge.a];
            const t = smooth(tp / p.dur);
            const dx = B.x - A.x;
            const dy = B.y - A.y;
            const len = Math.hypot(dx, dy) || 1;
            const nx = dx / len;
            const ny = dy / len;
            const head = t * len;
            const tail = Math.max(0, head - TAIL_PX);
            const hx = A.x + nx * head;
            const hy = A.y + ny * head;
            const qx = A.x + nx * tail;
            const qy = A.y + ny * tail;
            const r = edge.trigger ? 4.6 : 3.6; // heartbeat pulses read a touch bigger
            // gentle fade-in/out at the ends so the dot doesn't pop at the nodes
            const fade = clamp01(Math.min(tp, p.dur - tp) / 7);
            const gid = `tg${i}`;
            return (
              <g key={`p${i}`} opacity={fade}>
                <linearGradient id={gid} x1={qx} y1={qy} x2={hx} y2={hy} gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor={KIT_BLUE} stopOpacity="0" />
                  <stop offset="1" stopColor={KIT_BLUE} stopOpacity={edge.trigger ? 0.5 : 0.42} />
                </linearGradient>
                <line x1={qx} y1={qy} x2={hx} y2={hy} stroke={`url(#${gid})`} strokeWidth={edge.trigger ? 2.4 : 2} strokeLinecap="round" />
                <circle cx={hx} cy={hy} r={r} fill={KIT_BLUE} />
              </g>
            );
          })}
        </svg>

        {/* ── the 16 real modules (no plate, no border) ── */}
        {NODES.map((n, i) => {
          const isHB = i === HB;
          const a = isHB ? heartbeatPulse(frame) : activation(i, frame);
          // gentle floating life — periodic in the loop (2 turns), phase-shifted per icon
          const drift = Math.sin(ca * 2 + i * 1.3) * 3.6;
          const driftX = Math.cos(ca * 2 + i * 0.9) * 2.8;
          const s = 1 + (isHB ? 0.18 : 0.1) * a; // heartbeat beats a bit stronger
          const labelOp = clamp01((a - 0.18) / 0.45);
          return (
            <div key={n.key} style={{ position: 'absolute', left: n.x, top: n.y + drift, width: 0, height: 0, transform: `translate(${driftX}px, 0)` }}>
              <img
                src={n.icon}
                alt={n.name}
                width={ICON}
                height={ICON}
                style={{
                  position: 'absolute',
                  left: -ICON / 2,
                  top: -ICON / 2,
                  display: 'block',
                  opacity: 0.85 + 0.15 * a,
                  transform: `scale(${s})${n.rotate ? ` rotate(${n.rotate}deg)` : ''}`,
                  transformOrigin: '50% 50%',
                  willChange: 'transform, opacity',
                }}
              />
              {/* the module's name — appears only while it's working (no 16 fixed labels) */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  top: ICON / 2 - 2,
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  fontFamily: TEXT_FONT,
                  fontWeight: 600,
                  fontSize: 16,
                  letterSpacing: 0.1,
                  color: lightTheme.textStrong,
                  opacity: labelOp,
                }}
              >
                {n.name}
              </span>
            </div>
          );
        })}
      </AbsoluteFill>

      {/* a whisper of a neutral vignette for focus (not coloured) */}
      <AbsoluteFill
        style={{ background: 'radial-gradient(circle at 50% 47%, transparent 60%, rgba(120,134,160,0.12) 100%)', pointerEvents: 'none' }}
      />
    </AbsoluteFill>
  );
};
