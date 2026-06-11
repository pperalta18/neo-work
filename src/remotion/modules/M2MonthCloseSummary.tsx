/**
 * Acto 3 · «El resumen del mes» — el libro se consolida en el cierre.
 * ──────────────────────────────────────────────────────────────────────────────
 * Arranca con el libro diario lleno (continúa el acto 2) y lo CONSOLIDA: los apuntes
 * se desvanecen hacia arriba mientras emerge el **estado de cierre** — los totales
 * **se animan contando** (Ingresos 48.250 € · Gastos 34.380 € · Resultado 13.870 €) y
 * aparece el sello **✓ «Cerrado»** con chispa.
 *
 * Clip LINEAL (`useCurrentFrame()`), no es un bucle. Pieza compartida en
 * `monthCloseShared.tsx` (misma tarjeta-libro que el acto 1).
 */

import { useCurrentFrame } from 'remotion';
import { clamp01, smooth } from './loopKit';
import { MonthBg, MonthHeader, LedgerCard, APUNTES_TOTAL } from './monthCloseShared';

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────────
const INTRO = 8; //         entrada (la tarjeta ya llena)
const CONSUME_AT = 24; //   los apuntes empiezan a consolidarse (tras un instante legible)
const CONSUME_SPAN = 30;
const SUMMARY_AT = 30; //   emerge el panel de resumen
const SUMMARY_SPAN = 28;
const TICK_AT = 40; //      los totales cuentan
const TICK_SPAN = 42;
const CHECK_AT = 86; //     se sella el ✓ «Cerrado»
const CHECK_SPAN = 14;
const SPARK_AT = 98;
const SPARK_SPAN = 16;
const TAIL = 22; //         reposa el cierre antes del corte

export const MC_SUMMARY_DURATION = SPARK_AT + SPARK_SPAN + TAIL; // 136 f · 4.5 s

export const M2MonthCloseSummaryScene: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = smooth(clamp01(frame / INTRO));
  const consume = smooth(clamp01((frame - CONSUME_AT) / CONSUME_SPAN));
  const summary = smooth(clamp01((frame - SUMMARY_AT) / SUMMARY_SPAN));
  const tick = smooth(clamp01((frame - TICK_AT) / TICK_SPAN));
  const checkDraw = clamp01((frame - CHECK_AT) / CHECK_SPAN);
  const checkSpark = clamp01((frame - SPARK_AT) / SPARK_SPAN);

  return (
    <MonthBg>
      <MonthHeader opacity={appear} />
      <LedgerCard
        appear={appear}
        fill={1}
        counter={APUNTES_TOTAL}
        consume={consume}
        summary={summary}
        tick={tick}
        checkDraw={checkDraw}
        checkSpark={checkSpark}
      />
    </MonthBg>
  );
};
