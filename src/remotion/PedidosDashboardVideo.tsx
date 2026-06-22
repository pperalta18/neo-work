/**
 * PedidosDashboardVideo — the orders-dashboard build, front to back.
 * ──────────────────────────────────────────────────────────────────────────
 * Two shots, hard cut between them (no transition — both rest on the same
 * neumorphic surface so the cut is seamless):
 *
 *   PLANO 1 · INTRO   — the StoreCreate intro, re-copied: the pastilla
 *                       "Crear Dashboard de pedidos" emerges + expands to full
 *                       frame, the tool icon plays its reaction, "Usando
 *                       herramienta" rises.
 *   PLANO 2 · BUILD   — cut to the inventory dashboard assembling itself
 *                       ({@link InventoryDashboardVideo}).
 *
 * Both children reset to a sequence-local frame 0, so each plays exactly as it
 * does standalone; only the copy of the intro is overridden here.
 */

import { AbsoluteFill, Sequence } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { StoreCreateVideo, STORE_CREATE_DURATION } from './StoreCreateVideo'
import { InventoryDashboardVideo, INVENTORY_DASHBOARD_DURATION } from './InventoryDashboardVideo'

export const PEDIDOS_DASHBOARD_DURATION = STORE_CREATE_DURATION + INVENTORY_DASHBOARD_DURATION

export const PedidosDashboardVideo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: lightTheme.surface }}>
      <Sequence durationInFrames={STORE_CREATE_DURATION}>
        <StoreCreateVideo
          labelLead="Crear "
          labelStrong="Dashboard de pedidos"
          captionLead="Usando "
          captionStrong="herramienta"
        />
      </Sequence>
      <Sequence from={STORE_CREATE_DURATION} durationInFrames={INVENTORY_DASHBOARD_DURATION}>
        <InventoryDashboardVideo />
      </Sequence>
    </AbsoluteFill>
  )
}
