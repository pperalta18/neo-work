import type { PrintPageComponent } from '../types'
import { SampleA4 } from './sample-a4'
import { AikitEventBadge } from './aikit-event-badge'
import { Signage } from './signage'
import { ExhibitionWallPanel } from './exhibition-wall-panel'
import { AgiTimeline } from './agi-timeline'
import { AikitLiveMural } from './aikit-live-mural'
import { Bienvenida } from './bienvenida'
import { Llegada } from './llegada'
import { Direccional } from './direccional'
import { Plano } from './plano'
import { IdentificadorSala } from './identificador-sala'
import { Acreditacion } from './acreditacion'
import { Aseos } from './aseos'
import { AccesoRestringido } from './acceso-restringido'
import { Wifi } from './wifi'
import { Mesa } from './mesa'

/**
 * Page registry — maps a `doc.pageComponentId` to its React component. Add a new
 * print page here after authoring it under `src/print/pages/`.
 */
export const PRINT_PAGES: Record<string, PrintPageComponent> = {
  'sample-a4': SampleA4,
  'aikit-event-badge': AikitEventBadge,
  signage: Signage,
  'exhibition-wall-panel': ExhibitionWallPanel,
  'agi-timeline': AgiTimeline,
  'aikit-live-mural': AikitLiveMural,
  // ── AiKit Live signage system (editorial wayfinding family) ──
  bienvenida: Bienvenida,
  llegada: Llegada,
  direccional: Direccional,
  plano: Plano,
  'identificador-sala': IdentificadorSala,
  acreditacion: Acreditacion,
  aseos: Aseos,
  'acceso-restringido': AccesoRestringido,
  wifi: Wifi,
  mesa: Mesa,
}

export function getPrintPage(id: string): PrintPageComponent | undefined {
  return PRINT_PAGES[id]
}
