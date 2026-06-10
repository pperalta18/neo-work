/**
 * heroAltFamiliesSlides — the four "slides" of the alt-B hero.
 *  1 Controla  · le da OJOS    — make the hidden visible (focus sweep over a board)
 *  2 Delega    · le da MANOS   — turn intent into a done result (no human hands)
 *  3 Construye · REPETIBLE     — crystallise what repeats (a block that replicates)
 *  4 Flywheel  · the three words orbit; KIT_BLUE flows the loop, leaving more data.
 *
 * Everything is a pure function of the LOCAL frame `f` (0 = slide start), so the
 * render is deterministic. No glows: reveals use opacity / contrast / masks.
 */
import {
  CURVE,
  DISPLAY,
  TEXT,
  INK,
  MUTED,
  HAIRLINE,
  FAINT,
  KIT_BLUE,
  W,
  H,
  ramp,
  clamp01,
  smooth,
  hash,
  icon,
} from './heroAltFamiliesKit';
import { ModuleIcon, SlideTitle, FamilyTag } from './heroAltFamiliesParts';

// Common right-side "stage" where each slide stages its visual (titles live left).
const STAGE = { cx: 1320, cy: 560 } as const;

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 1 — CONTROLA · le da ojos
// A dim, unreadable data board sharpens under a left→right focus pass: numbers
// snap crisp, a mini sparkline draws itself, one anomaly gets flagged KIT_BLUE.
// ════════════════════════════════════════════════════════════════════════════
const BOARD = { x: 1020, y: 360, w: 620, h: 392 } as const;

// deterministic "blurred" figures for the board rows
const ROWS = [
  { label: 'Ingresos', value: '€ 48.210', d: 0 },
  { label: 'Pedidos', value: '1.284', d: 1 },
  { label: 'Margen', value: '32,4 %', d: 2 },
  { label: 'Devoluciones', value: '0,9 %', d: 3, anomaly: true },
];

export const SlideControla: React.FC<{ f: number }> = ({ f }) => {
  // the focus pass sweeps left→right across the board
  const sweep = ramp(f, 18, 64, CURVE.standard); // 0..1 position of the focus edge
  const boardIn = ramp(f, 4, 22, CURVE.enter);
  const sparkDraw = ramp(f, 40, 78, CURVE.standard);
  const flag = ramp(f, 62, 84, CURVE.enter);

  // per-row sharpen: a row is "in focus" once the sweep edge passes its centre
  const rowFocus = (i: number) => {
    const center = (i + 0.5) / ROWS.length; // 0..1 vertical position
    return clamp01((sweep - center) * 6 + 0.5);
  };

  const eyes = (['glimpse', 'foresight', 'junction'] as const).map(icon);

  return (
    <>
      <SlideTitle index={1} word="Controla" sub="Le da ojos a tu IA: ve lo que pasa." f={f} />
      <FamilyTag label="Glimpse · Foresight · Junction" f={f} in0={70} />

      {/* the data board */}
      <div
        style={{
          position: 'absolute',
          left: BOARD.x,
          top: BOARD.y,
          width: BOARD.w,
          height: BOARD.h,
          borderRadius: 22,
          background: '#fbfbff',
          boxShadow: '8px 8px 22px #d9e0ec, -8px -8px 22px #ffffff',
          opacity: boardIn,
          transform: `translateY(${(1 - boardIn) * 18}px)`,
          overflow: 'hidden',
        }}
      >
        {/* board header */}
        <div style={{ padding: '22px 30px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: INK }}>Panel · hoy</span>
          <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 15, letterSpacing: 1.5, color: MUTED }}>EN VIVO</span>
        </div>

        {/* rows */}
        <div style={{ padding: '14px 30px 0' }}>
          {ROWS.map((r, i) => {
            const fo = rowFocus(i);
            const blurPx = (1 - fo) * 7;
            const isAnom = r.anomaly;
            return (
              <div
                key={r.label}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < ROWS.length - 1 ? `1px solid ${FAINT}` : 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: TEXT,
                    fontWeight: 500,
                    fontSize: 21,
                    color: MUTED,
                    filter: `blur(${blurPx}px)`,
                    opacity: 0.45 + 0.55 * fo,
                  }}
                >
                  {r.label}
                </span>
                <span
                  style={{
                    fontFamily: DISPLAY,
                    fontWeight: 700,
                    fontSize: 26,
                    color: isAnom ? (flag > 0.5 ? KIT_BLUE : INK) : INK,
                    filter: `blur(${blurPx}px)`,
                    opacity: 0.4 + 0.6 * fo,
                  }}
                >
                  {r.value}
                  {isAnom && (
                    <span
                      style={{
                        marginLeft: 12,
                        fontFamily: TEXT,
                        fontWeight: 700,
                        fontSize: 14,
                        letterSpacing: 1,
                        color: KIT_BLUE,
                        opacity: flag,
                      }}
                    >
                      ▲ ANOMALÍA
                    </span>
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* a mini sparkline that draws itself */}
        <svg
          width={BOARD.w - 60}
          height={70}
          viewBox={`0 0 ${BOARD.w - 60} 70`}
          style={{ position: 'absolute', left: 30, bottom: 22 }}
        >
          {(() => {
            const pts = [10, 26, 18, 40, 34, 56, 44, 62];
            const innerW = BOARD.w - 60;
            const path = pts
              .map((p, i) => {
                const x = (i / (pts.length - 1)) * innerW;
                const y = 70 - (p / 70) * 64 - 3;
                return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(' ');
            const total = innerW * 1.25;
            return (
              <path
                d={path}
                fill="none"
                stroke={KIT_BLUE}
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={total}
                strokeDashoffset={total * (1 - sparkDraw)}
                opacity={0.9}
              />
            );
          })()}
        </svg>
      </div>

      {/* the focus-pass edge: a soft vertical bright line that sweeps the board */}
      {sweep > 0.02 && sweep < 0.99 && (
        <div
          style={{
            position: 'absolute',
            left: BOARD.x + sweep * BOARD.w,
            top: BOARD.y,
            width: 2,
            height: BOARD.h,
            background: `linear-gradient(180deg, transparent, ${KIT_BLUE}, transparent)`,
            opacity: 0.55,
          }}
        />
      )}

      {/* the three Controla module icons peeking in, clean */}
      <div style={{ position: 'absolute', left: BOARD.x + 30, top: BOARD.y - 96, display: 'flex', gap: 28 }}>
        {eyes.map((sp, i) => {
          const r = ramp(f, 30 + i * 8, 50 + i * 8, CURVE.enter);
          return (
            <div key={sp.name} style={{ transform: `translateY(${(1 - r) * 14}px)`, opacity: r }}>
              <ModuleIcon spec={sp} size={62} reveal={r} />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 2 — DELEGA · le da manos
// A short written intent ("cobra esta factura") becomes an EXECUTED action: a
// document processes and a check lands — no human hands.
// ════════════════════════════════════════════════════════════════════════════
export const SlideDelega: React.FC<{ f: number }> = ({ f }) => {
  const intentIn = ramp(f, 6, 26, CURVE.enter);
  // intent → action: the typed line collapses and morphs into the doc+check.
  // It fully clears (no residual) so it never sits under the module-icon row.
  const morph = ramp(f, 34, 56, CURVE.exit);
  const docIn = ramp(f, 40, 64, CURVE.enter);
  const process = ramp(f, 52, 80, CURVE.standard); // progress bar fill
  const check = ramp(f, 74, 88, CURVE.enter); //     the check lands

  const hands = (['actionRunner', 'actionScript', 'heartbeat'] as const).map(icon);

  const intentX = STAGE.cx - 200;
  const intentY = 380;
  const cardX = STAGE.cx - 170;
  const cardY = 470;

  return (
    <>
      <SlideTitle index={2} word="Delega" sub="Le da manos: y queda hecho." f={f} />
      <FamilyTag label="Action Runner · Action Script · Heartbeat" f={f} in0={74} />

      {/* the written intent — a quoted instruction */}
      <div
        style={{
          position: 'absolute',
          left: intentX,
          top: intentY,
          width: 480,
          opacity: intentIn * (1 - morph),
          transform: `translateY(${-morph * 26}px)`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: MUTED, opacity: 0.5 }} />
          <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 15, letterSpacing: 1.6, color: MUTED, textTransform: 'uppercase' }}>
            Intención
          </span>
        </div>
        <div
          style={{
            fontFamily: DISPLAY,
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1.12,
            color: INK,
            letterSpacing: -0.4,
          }}
        >
          «Cobra esta factura»
        </div>
      </div>

      {/* the executed action card: a document that processes + a check that lands */}
      <div
        style={{
          position: 'absolute',
          left: cardX,
          top: cardY,
          width: 420,
          borderRadius: 22,
          background: '#fbfbff',
          boxShadow: '8px 8px 22px #d9e0ec, -8px -8px 22px #ffffff',
          padding: '26px 28px',
          opacity: docIn,
          transform: `translateY(${(1 - docIn) * 20}px) scale(${0.96 + 0.04 * docIn})`,
          transformOrigin: '50% 30%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* doc glyph */}
            <div style={{ width: 40, height: 50, borderRadius: 6, background: '#eef1f9', boxShadow: 'inset 2px 2px 5px #d5dcec, inset -2px -2px 5px #ffffff', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 8, top: 12, right: 8, height: 3, borderRadius: 3, background: 'rgba(120,134,160,0.4)' }} />
              <div style={{ position: 'absolute', left: 8, top: 21, right: 14, height: 3, borderRadius: 3, background: 'rgba(120,134,160,0.3)' }} />
              <div style={{ position: 'absolute', left: 8, top: 30, right: 18, height: 3, borderRadius: 3, background: 'rgba(120,134,160,0.25)' }} />
            </div>
            <div>
              <div style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 22, color: INK }}>Factura #4821</div>
              <div style={{ fontFamily: TEXT, fontWeight: 500, fontSize: 16, color: MUTED }}>
                {check > 0.5 ? 'Cobrada · € 1.240' : 'Procesando · € 1.240'}
              </div>
            </div>
          </div>

          {/* the check that lands */}
          <svg width={48} height={48} viewBox="0 0 48 48" style={{ opacity: check }}>
            <circle cx="24" cy="24" r="21" fill="none" stroke={KIT_BLUE} strokeWidth="3" />
            {(() => {
              const len = 26;
              return (
                <path
                  d="M15 25 L21 31 L33 17"
                  fill="none"
                  stroke={KIT_BLUE}
                  strokeWidth="3.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - clamp01((check - 0.3) / 0.7))}
                />
              );
            })()}
          </svg>
        </div>

        {/* progress bar — the action executing */}
        <div style={{ marginTop: 22, height: 8, borderRadius: 8, background: '#e7ebf5', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${process * 100}%`,
              borderRadius: 8,
              background: KIT_BLUE,
            }}
          />
        </div>
      </div>

      {/* the three Delega module icons */}
      <div style={{ position: 'absolute', left: cardX + 6, top: cardY - 96, display: 'flex', gap: 28 }}>
        {hands.map((sp, i) => {
          const r = ramp(f, 36 + i * 8, 56 + i * 8, CURVE.enter);
          return (
            <div key={sp.name} style={{ transform: `translateY(${(1 - r) * 14}px)`, opacity: r }}>
              <ModuleIcon spec={sp} size={62} reveal={r} />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 3 — CONSTRUYE · repetible
// The action from slide 2 miniaturises into a compact block that replicates
// (×3, ×5…) and keeps running periodically in the background.
// ════════════════════════════════════════════════════════════════════════════
export const SlideConstruye: React.FC<{ f: number }> = ({ f }) => {
  const seedIn = ramp(f, 8, 30, CURVE.enter); // the single block crystallises
  // it shrinks to "master" size and the copies fan out
  const crystallise = ramp(f, 26, 48, CURVE.standard);

  const build = (['smartProcess', 'forge', 'skillHub'] as const).map(icon);

  // grid of replicas (master + copies). 5 across, 2 down.
  const COLS = 5;
  const ROWSN = 2;
  const N = COLS * ROWSN;
  const gx = STAGE.cx - 250;
  const gy = 430;
  const cell = 116;
  const tileW = 96;

  return (
    <>
      <SlideTitle index={3} word="Construye" sub="Repetible: y se repite solo." f={f} />
      <FamilyTag label="Smart Process · Forge · Skill Hub" f={f} in0={70} />

      {/* the replica grid */}
      <div style={{ position: 'absolute', left: gx, top: gy, width: COLS * cell, height: ROWSN * cell }}>
        {Array.from({ length: N }).map((_, k) => {
          const col = k % COLS;
          const row = Math.floor(k / COLS);
          const isMaster = k === 0;
          // copies appear staggered; master is present first
          const appear = isMaster
            ? seedIn
            : ramp(f, 30 + k * 5, 48 + k * 5, CURVE.enter);
          // periodic "working" pulse — each tile ticks on its own phase (deterministic)
          const phase = hash(k * 3.7) * 30;
          const beat = Math.max(0, Math.sin((f - phase) * 0.18));
          const beatLvl = appear * smooth(beat) * (isMaster ? 1 : 0.8);

          const cx = col * cell + (cell - tileW) / 2;
          const cy = row * cell + (cell - tileW) / 2;
          // master sits centred-left at seed time, then settles into its grid cell
          const settle = isMaster ? 1 : crystallise;

          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: cx,
                top: cy,
                width: tileW,
                height: tileW,
                borderRadius: 18,
                background: '#fbfbff',
                boxShadow: isMaster
                  ? `6px 6px 16px #d6dded, -6px -6px 16px #ffffff`
                  : `4px 4px 12px #dde3ee, -4px -4px 12px #ffffff`,
                opacity: appear * (0.55 + 0.45 * settle),
                transform: `scale(${0.86 + 0.14 * appear})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* a tiny "process" glyph inside each replica + a periodic tick dot */}
              <div style={{ position: 'relative', width: 52, height: 52 }}>
                <ModuleIcon
                  spec={build[k % build.length]}
                  size={48}
                  reveal={appear}
                  style={{ position: 'absolute', left: 2, top: 2, opacity: 0.32 + 0.5 * appear }}
                />
                {/* periodic activity dot (KIT_BLUE) — it's running on its own */}
                <span
                  style={{
                    position: 'absolute',
                    right: -2,
                    top: -2,
                    width: 11,
                    height: 11,
                    borderRadius: 11,
                    background: KIT_BLUE,
                    opacity: 0.25 + 0.75 * beatLvl,
                    transform: `scale(${0.7 + 0.6 * beatLvl})`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {/* a "×N" multiplier badge that counts up as copies land */}
        {(() => {
          const landed = Math.min(
            N,
            Math.floor(ramp(f, 30, 90, CURVE.standard) * N) + 1,
          );
          const op = ramp(f, 40, 58, CURVE.enter);
          return (
            <div
              style={{
                position: 'absolute',
                right: -118,
                top: ROWSN * cell - 70,
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 56,
                color: KIT_BLUE,
                opacity: op,
                letterSpacing: -1,
              }}
            >
              ×{landed}
            </div>
          );
        })()}
      </div>

      {/* the three Construye module icons */}
      <div style={{ position: 'absolute', left: gx, top: gy - 92, display: 'flex', gap: 28 }}>
        {build.map((sp, i) => {
          const r = ramp(f, 14 + i * 8, 34 + i * 8, CURVE.enter);
          return (
            <div key={sp.name} style={{ transform: `translateY(${(1 - r) * 14}px)`, opacity: r }}>
              <ModuleIcon spec={sp} size={62} reveal={r} />
            </div>
          );
        })}
      </div>
    </>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SLIDE 4 — THE FLYWHEEL
// The three words relocate into a ring; KIT_BLUE flows around it. Each turn
// leaves more data + more control. Final claim, legible hold.
// ════════════════════════════════════════════════════════════════════════════
const WORDS = ['Controla', 'Delega', 'Construye'] as const;

export const SlideFlywheel: React.FC<{ f: number }> = ({ f }) => {
  const cx = W / 2;
  const cy = H / 2 + 24;
  const R = 250;

  const ringIn = ramp(f, 8, 40, CURVE.enter);
  const wordsIn = ramp(f, 16, 50, CURVE.enter);
  const claimIn = ramp(f, 50, 74, CURVE.enter);
  // the blue flow travels the ring continuously
  const flow = (f / 30) * 0.6; // ~0.6 turn/sec
  const arcLen = 2 * Math.PI * R;

  // word anchors at 3 vertices of an upward triangle (−90°, 30°, 150°)
  const angles = [-90, 30, 150].map((d) => (d * Math.PI) / 180);

  return (
    <>
      {/* heading, sibling grammar but centred eyebrow */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 110, textAlign: 'center', opacity: ramp(f, 4, 22, CURVE.enter) }}>
        <span style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 20, letterSpacing: 3, color: MUTED, textTransform: 'uppercase' }}>
          04 · El flywheel
        </span>
      </div>

      {/* the ring + flowing arc */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: 'absolute', inset: 0 }}>
        {/* base ring (hairline) */}
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={HAIRLINE} strokeWidth={2} opacity={ringIn} />
        {/* flowing highlight arc */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={KIT_BLUE}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={ringIn * 0.9}
          strokeDasharray={`${arcLen * 0.22} ${arcLen * 0.78}`}
          strokeDashoffset={-flow * arcLen}
        />
        {/* three direction arrows between vertices to imply the cycle turns */}
        {angles.map((a, i) => {
          const mid = a + (Math.PI * 2) / 6; // between this vertex and the next
          const ax = cx + Math.cos(mid) * R;
          const ay = cy + Math.sin(mid) * R;
          const tang = mid + Math.PI / 2;
          const op = ramp(f, 30 + i * 4, 48 + i * 4, CURVE.enter) * 0.8;
          return (
            <g key={i} opacity={op} transform={`translate(${ax} ${ay}) rotate(${(tang * 180) / Math.PI})`}>
              <path d="M -7 -7 L 7 0 L -7 7" fill="none" stroke={KIT_BLUE} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      </svg>

      {/* the three words on the ring vertices */}
      {WORDS.map((w, i) => {
        const a = angles[i];
        const x = cx + Math.cos(a) * R;
        const y = cy + Math.sin(a) * R;
        const op = ramp(f, 18 + i * 7, 46 + i * 7, CURVE.enter);
        // each word brightens as the flow head passes its vertex (data accrues)
        const vertexPos = ((-flow + i / 3) % 1 + 1) % 1;
        const near = Math.max(0, 1 - Math.min(vertexPos, 1 - vertexPos) * 6);
        return (
          <div
            key={w}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              transform: 'translate(-50%, -50%)',
              opacity: op,
            }}
          >
            <div
              style={{
                fontFamily: DISPLAY,
                fontWeight: 800,
                fontSize: 46,
                letterSpacing: -0.5,
                color: near > 0.5 ? KIT_BLUE : INK,
                whiteSpace: 'nowrap',
                textAlign: 'center',
                transform: `scale(${1 + 0.05 * near})`,
              }}
            >
              {w}
            </div>
          </div>
        );
      })}

      {/* centre: a small accruing-data readout (each turn leaves more) */}
      <div
        style={{
          position: 'absolute',
          left: cx,
          top: cy,
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: wordsIn,
        }}
      >
        <div style={{ fontFamily: TEXT, fontWeight: 600, fontSize: 15, letterSpacing: 2, color: MUTED, textTransform: 'uppercase' }}>
          Cada vuelta
        </div>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 38, color: INK, marginTop: 4 }}>
          + datos · + control
        </div>
      </div>

      {/* final claim, legible hold */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 96, textAlign: 'center', opacity: claimIn }}>
        <div style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 50, letterSpacing: -0.6, color: INK }}>
          Cada vuelta, más fácil.
        </div>
      </div>
    </>
  );
};
