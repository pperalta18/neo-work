/**
 * Acto 1 · «Un montón de peticiones» — todas de vacaciones (el problema).
 * ──────────────────────────────────────────────────────────────────────────────
 * Las 5 solicitudes nombradas (placa neumórfica por nombre, sin borde) van CAYENDO
 * en cascada hasta apilarse, con un contador de pendientes que sube y una tarjeta
 * tenue «+N más» al pie que deja claro que hay muchas. Sin aprobaciones todavía:
 * esto es el marrón antes de que el módulo entre (acto 2). Determinista por frame.
 */

import { useCurrentFrame } from 'remotion';
import { lightTheme, KIT_BLUE, TEXT_FONT, elevation, clamp01, smoother, mix } from './loopKit';
import { AbsBg, REQUESTS, RequestCard, ROW_H, CARD_W } from './absencesShared';

export const ABS_REQUESTS_DURATION = 84;

const STAGE = 1080;
const GAP = 16;
const STACK_TOP = 312;
const CARD_X = (STAGE - CARD_W) / 2;

// ritmo de la cascada
const START = 6;
const STEP = 8;
const FLIGHT = 20;
const EXTRA = 6; // peticiones implícitas («+6 más»)

const cardTop = (i: number) => STACK_TOP + i * (ROW_H + GAP);

export const M1AbsencesRequestsScene: React.FC = () => {
  const frame = useCurrentFrame();

  // cuántas nombradas han aterrizado (para el contador, sin latch raro)
  const landed = REQUESTS.reduce((a, _, i) => a + (frame >= START + i * STEP + FLIGHT * 0.5 ? 1 : 0), 0);
  const ghostIn = clamp01((frame - (START + REQUESTS.length * STEP)) / FLIGHT);
  const pending = landed + Math.round(EXTRA * ghostIn);

  return (
    <AbsBg>
      {/* título + contador */}
      <div style={{ position: 'absolute', top: 132, left: 0, width: STAGE, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 34, color: lightTheme.textStrong, letterSpacing: 0.1 }}>Vacaciones · Julio</span>
        <PendingPill n={pending} />
      </div>

      {/* cascada de solicitudes */}
      {REQUESTS.map((req, i) => {
        const p = smoother(clamp01((frame - (START + i * STEP)) / FLIGHT));
        if (p <= 0) return null;
        const y = cardTop(i) - (1 - p) * 46; // cae desde un poco más arriba
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: CARD_X,
              top: y,
              opacity: p,
              transform: `scale(${0.96 + p * 0.04})`,
              transformOrigin: '50% 0%',
            }}
          >
            <RequestCard req={req} />
          </div>
        );
      })}

      {/* tarjeta tenue «+N más» (el resto del montón) */}
      <div
        style={{
          position: 'absolute',
          left: CARD_X + 14,
          top: cardTop(REQUESTS.length) - (1 - ghostIn) * 40,
          width: CARD_W - 28,
          height: 58,
          opacity: ghostIn * 0.6,
          ...elevation(lightTheme, { depth: 'raised', distance: 7, blur: 16, radius: 22 }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TEXT_FONT,
          fontWeight: 700,
          fontSize: 19,
          color: lightTheme.textMuted,
        }}
      >
        + {EXTRA} solicitudes más
      </div>
    </AbsBg>
  );
};

const PendingPill: React.FC<{ n: number }> = ({ n }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 9,
      background: mix(lightTheme.surface, '#ffffff', 0.55),
      ...elevation(lightTheme, { depth: 'raised', distance: 5, blur: 12, radius: 999 }),
      borderRadius: 999,
      padding: '9px 18px',
      fontFamily: TEXT_FONT,
      fontWeight: 700,
      fontSize: 19,
      color: lightTheme.textStrong,
    }}
  >
    <span style={{ width: 10, height: 10, borderRadius: 999, background: KIT_BLUE }} />
    {n} pendientes
  </div>
);
