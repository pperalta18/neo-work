/**
 * Acto 3 · «Resumen / marcador» — el estado final de un vistazo.
 * ──────────────────────────────────────────────────────────────────────────────
 * Tras pasar por Action Runner, las solicitudes quedan resueltas. En vez de listar
 * persona por persona, un MARCADOR con 3 contadores que suben —Aprobadas · A
 * revisar · Rechazadas— con su color, un sello «Resuelto con Action Runner» y una
 * fila de mini-avatares (cada uno con su color de veredicto) + una línea de apoyo.
 * Las cuentas salen de `REQUESTS` (3 · 1 · 1). Determinista por frame.
 */

import { useCurrentFrame } from 'remotion';
import { lightTheme, TEXT_FONT, elevation, clamp01, smoother, mix, ModuleIcon, AvatarChip } from './loopKit';
import { AbsBg, REQUESTS, VERDICT_META, type Verdict } from './absencesShared';

export const ABS_SUMMARY_DURATION = 96;

const STAGE = 1080;
const ORDER: Verdict[] = ['approved', 'review', 'rejected'];

const COUNTS: Record<Verdict, number> = REQUESTS.reduce(
  (a, r) => ({ ...a, [r.verdict]: a[r.verdict] + 1 }),
  { approved: 0, review: 0, rejected: 0 } as Record<Verdict, number>,
);

const CARD_W = 280;
const CARD_H = 250;
const CARD_GAP = 36;
const ROW_W = ORDER.length * CARD_W + (ORDER.length - 1) * CARD_GAP;
const ROW_X = (STAGE - ROW_W) / 2;
const ROW_Y = 312;

const COUNT_START = 16;

export const M1AbsencesSummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const selloIn = smoother(clamp01((frame - 4) / 16));
  const captionIn = smoother(clamp01((frame - 66) / 18));

  return (
    <AbsBg>
      {/* sello «Resuelto con Action Runner» + subtítulo */}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 0,
          width: STAGE,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          opacity: selloIn,
          transform: `translateY(${(1 - selloIn) * -10}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            ...elevation(lightTheme, { depth: 'raised', distance: 6, blur: 14, radius: 999 }),
            background: mix(lightTheme.surface, '#ffffff', 0.5),
            borderRadius: 999,
            padding: '10px 22px 10px 14px',
          }}
        >
          <ModuleIcon name="actionRunner" size={40} active={1} />
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 24, color: lightTheme.textStrong }}>Resuelto con Action Runner</span>
        </div>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 20, color: lightTheme.textStrong, opacity: 0.5 }}>Sin Excel, sin idas y venidas</span>
      </div>

      {/* marcador: 3 contadores */}
      {ORDER.map((v, i) => (
        <StatCard key={v} verdict={v} x={ROW_X + i * (CARD_W + CARD_GAP)} index={i} frame={frame} />
      ))}

      {/* fila de mini-avatares con su color de veredicto */}
      <div style={{ position: 'absolute', top: 646, left: 0, width: STAGE, display: 'flex', justifyContent: 'center', gap: 18 }}>
        {REQUESTS.map((r, i) => {
          const pop = smoother(clamp01((frame - (48 + i * 5)) / 16));
          if (pop <= 0) return null;
          const color = VERDICT_META[r.verdict].color;
          return (
            <div key={i} style={{ position: 'relative', opacity: pop, transform: `scale(${0.7 + pop * 0.3})` }}>
              <AvatarChip initials={r.initials} size={48} seed={r.seed} />
              <div
                style={{
                  position: 'absolute',
                  right: -3,
                  bottom: -3,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: color,
                  boxShadow: `0 0 0 3px ${lightTheme.surface}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: TEXT_FONT,
                  fontWeight: 900,
                  fontSize: 11,
                  lineHeight: 1,
                }}
              >
                {VERDICT_META[r.verdict].glyph}
              </div>
            </div>
          );
        })}
      </div>

      {/* línea de apoyo */}
      <div
        style={{
          position: 'absolute',
          top: 726,
          left: 0,
          width: STAGE,
          textAlign: 'center',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 19,
          color: lightTheme.textStrong,
          opacity: captionIn * 0.62,
        }}
      >
        0 solapes sin avisar · cobertura del equipo asegurada
      </div>
    </AbsBg>
  );
};

const StatCard: React.FC<{ verdict: Verdict; x: number; index: number; frame: number }> = ({ verdict, x, index, frame }) => {
  const m = VERDICT_META[verdict];
  const target = COUNTS[verdict];
  const pop = smoother(clamp01((frame - (COUNT_START + index * 8)) / 18));
  if (pop <= 0) return null;
  const countT = smoother(clamp01((frame - (COUNT_START + index * 8 + 4)) / 24));
  const n = Math.round(target * countT);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: ROW_Y,
        width: CARD_W,
        height: CARD_H,
        ...elevation(lightTheme, { depth: 'raised', distance: 13, blur: 30, radius: 30 }),
        backgroundColor: lightTheme.surface,
        opacity: pop,
        transform: `scale(${0.88 + pop * 0.12})`,
        transformOrigin: '50% 60%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: mix(lightTheme.surface, m.color, 0.2),
          color: mix(m.color, '#000000', 0.22),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TEXT_FONT,
          fontWeight: 900,
          fontSize: 27,
          lineHeight: 1,
        }}
      >
        {m.glyph}
      </div>
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 88, lineHeight: 1, color: lightTheme.textStrong, letterSpacing: -1 }}>{n}</span>
      <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 21, color: lightTheme.textStrong, opacity: 0.62 }}>{m.kpi}</span>
    </div>
  );
};
