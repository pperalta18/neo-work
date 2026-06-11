/**
 * M2DunningVideo — «Los impagos se persiguen solos», en 3 actos.
 * ──────────────────────────────────────────────────────────────────────────────
 * Antes Dunning era UN bucle perfecto donde vencer / reclamar / cobrar pasaban a
 * la vez (dos facturas solapadas). Iván pidió partirlo en TRES clips lineales,
 * como los flujos del Grupo 1. Esta mini-película los encadena con cross-fades
 * cortos; cada acto está también registrado suelto en Root.tsx y se exporta como
 * MP4 propio (flow `dunning` en export-clips):
 *
 *   1. {@link M2DunningOverdueScene} — la factura y los días corriendo → VENCIDA.
 *   2. {@link M2DunningRunScene}     — Action Script reclama y avisa al cliente.
 *   3. {@link M2DunningPaidScene}    — la misma factura, ya cobrada (PAGADO + ✓).
 *
 * Ya NO es un bucle perfecto (era un module-loop): es una secuencia narrativa.
 */

import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { M2DunningOverdueScene, M2_DUNNING_OVERDUE_DURATION } from './M2DunningOverdue';
import { M2DunningRunScene, M2_DUNNING_RUN_DURATION } from './M2DunningRun';
import { M2DunningPaidScene, M2_DUNNING_PAID_DURATION } from './M2DunningPaid';

/** Solapamiento de cada fade entre actos (frames @30fps). */
const TRANSITION = 8;

/** Total = Σ actos − (nº de transiciones) × solape. */
export const M2_DUNNING_DURATION =
  M2_DUNNING_OVERDUE_DURATION + M2_DUNNING_RUN_DURATION + M2_DUNNING_PAID_DURATION - 2 * TRANSITION;

const crossFade = () => (
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
);

export const M2DunningVideo: React.FC = () => (
  <TransitionSeries>
    {/* Acto 1 — la factura vence */}
    <TransitionSeries.Sequence durationInFrames={M2_DUNNING_OVERDUE_DURATION}>
      <M2DunningOverdueScene />
    </TransitionSeries.Sequence>
    {crossFade()}

    {/* Acto 2 — el módulo reclama y avisa al cliente */}
    <TransitionSeries.Sequence durationInFrames={M2_DUNNING_RUN_DURATION}>
      <M2DunningRunScene />
    </TransitionSeries.Sequence>
    {crossFade()}

    {/* Acto 3 — la factura, cobrada */}
    <TransitionSeries.Sequence durationInFrames={M2_DUNNING_PAID_DURATION}>
      <M2DunningPaidScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
