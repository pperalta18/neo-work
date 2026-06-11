/**
 * M2MonthCloseVideo — «El cierre de mes se hace solo», en 3 actos.
 * ──────────────────────────────────────────────────────────────────────────────
 * Antes MonthClose era UN bucle perfecto donde llenar / ejecutar / cerrar pasaban a
 * la vez. Iván pidió partirlo en TRES clips lineales, como Dunning/Ausencias. Esta
 * mini-película los encadena con cross-fades cortos; cada acto está también registrado
 * suelto en Root.tsx y se exporta como MP4 propio (flow `monthclose` en export-clips):
 *
 *   1. {@link M2MonthCloseLedgerScene}  — el libro diario «Junio» se llena de apuntes
 *      + las 4 áreas conectadas le mandan un pulso.
 *   2. {@link M2MonthCloseRunScene}     — sólo el cuadrado del módulo (Foresight),
 *      «Cerrando junio», ingiriendo los apuntes.
 *   3. {@link M2MonthCloseSummaryScene} — el libro se consolida: totales que cuentan
 *      + sello ✓ «Cerrado».
 *
 * Ya NO es un bucle perfecto (era un module-loop): es una secuencia narrativa. El loop
 * anterior se conserva en `M2MonthCloseLoop.tsx` (folder Modulos-V1) para comparar.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { M2MonthCloseLedgerScene, MC_LEDGER_DURATION } from './M2MonthCloseLedger';
import { M2MonthCloseRunScene, MC_RUN_DURATION } from './M2MonthCloseRun';
import { M2MonthCloseSummaryScene, MC_SUMMARY_DURATION } from './M2MonthCloseSummary';

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8;

/** Total = Σ actos − (nº de transiciones) × solape. */
export const M2_MONTHCLOSE_DURATION =
  MC_LEDGER_DURATION + MC_RUN_DURATION + MC_SUMMARY_DURATION - 2 * TRANSITION;

const crossFade = () => (
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
);

export const M2MonthCloseVideo: React.FC = () => (
  <TransitionSeries>
    {/* Acto 1 — el libro diario se llena */}
    <TransitionSeries.Sequence durationInFrames={MC_LEDGER_DURATION}>
      <M2MonthCloseLedgerScene />
    </TransitionSeries.Sequence>
    {crossFade()}

    {/* Acto 2 — el módulo cierra el mes */}
    <TransitionSeries.Sequence durationInFrames={MC_RUN_DURATION}>
      <M2MonthCloseRunScene />
    </TransitionSeries.Sequence>
    {crossFade()}

    {/* Acto 3 — el resumen, cerrado */}
    <TransitionSeries.Sequence durationInFrames={MC_SUMMARY_DURATION}>
      <M2MonthCloseSummaryScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
