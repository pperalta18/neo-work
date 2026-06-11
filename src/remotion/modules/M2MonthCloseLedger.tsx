/**
 * Acto 1 · «El libro diario» — el mes se llena de apuntes.
 * ──────────────────────────────────────────────────────────────────────────────
 * La tarjeta central «Junio» (libro diario) se llena de apuntes reales en cascada
 * (día·concepto·importe, ingreso verde / gasto azul) mientras las **4 áreas
 * conectadas** (Ventas·Compras·Banco·Nóminas) le mandan un pulso cada una por su
 * cable — la firma M2 «negocio conectado». Termina con el libro lleno: «318 apuntes».
 *
 * Clip LINEAL (`useCurrentFrame()`), no es un bucle. Pieza compartida en
 * `monthCloseShared.tsx`; los actos 2 y 3 continúan la historia.
 */

import { useCurrentFrame } from 'remotion';
import { clamp01, smooth } from './loopKit';
import { MonthBg, MonthHeader, LedgerCard, SourceAreas, APUNTES_TOTAL } from './monthCloseShared';

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────────
const INTRO = 8; //        entrada de la tarjeta
const FILL_START = 10; //  arranca el llenado de apuntes
const FILL_END = 86; //    libro lleno
const HOLD = 22; //        reposa lleno antes del corte (lo enmascara el cross-fade)

export const MC_LEDGER_DURATION = FILL_END + HOLD; // 108 f · 3.6 s

export const M2MonthCloseLedgerScene: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = smooth(clamp01(frame / INTRO));
  const fill = smooth(clamp01((frame - FILL_START) / (FILL_END - FILL_START)));
  const counter = Math.round(APUNTES_TOTAL * fill);
  // las 4 áreas entregan su pulso escalonadas a lo largo del llenado
  const feed = clamp01((frame - FILL_START) / (FILL_END - FILL_START));

  return (
    <MonthBg>
      <MonthHeader opacity={appear} />
      <SourceAreas feed={feed} appear={appear} />
      <LedgerCard appear={appear} fill={fill} counter={counter} />
    </MonthBg>
  );
};
