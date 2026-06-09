import type { PathSpec } from '@/components/PathScene'
import { coordsToSteps, solve, type Coord } from '@/lib/pathfinding'

/**
 * Concepts → pathfinding compositions.
 * Each entry says "this is the idea"; the engine renders it. Edit a route (or
 * the start / goal of a solved one) to spin off a new variation. A step can also
 * carry `text` or `image` instead of an arrow.
 */

export type Concept = {
  id: string
  label: string
  spec: PathSpec
}

export const CONCEPTS: Concept[] = [
  {
    // Faithful reproduction of the reference image.
    id: 'inteligencia',
    label: 'inteligencia',
    spec: {
      columns: 3,
      rows: 2,
      route: coordsToSteps([
        [1, 2],
        [2, 2],
        [2, 1],
        [3, 1],
      ]),
      startNode: [0, 2],
    },
  },
  {
    // Event-index variation: arrows interleaved with text plates.
    id: 'agenda',
    label: 'agenda',
    spec: {
      columns: 5,
      rows: 3,
      route: [
        { at: [1, 3], icon: 'sparkles' },
        { at: [2, 3], colSpan: 3, icon: 'user', text: { muted: '20:00', main: 'Pablo Yusta' } },
        { at: [2, 2] },
        { at: [3, 2], colSpan: 3, icon: 'user', text: { muted: '20:30', main: 'David W. Wood' } },
        { at: [3, 1], icon: 'mic' },
        { at: [4, 1] },
        { at: [5, 1] },
      ],
      startNode: [0, 3],
    },
  },
  {
    // AiKit reasoning chain: the steps the AI takes to launch an online store.
    // Each step is an AiKit module (brand icon + micro-action), serpentining
    // from the start disc up to the goal (the live store, blue dot top-right).
    // Crosses the three families: Controla (see) → Construye (build) → Delega (act).
    id: 'tienda-online',
    label: 'tienda online',
    spec: {
      // Reads as a PATHFINDING route, not a table: the AI navigates a sparse grid,
      // making a decision at each module (icon + micro-action chip) and "moving"
      // along arrow cells between them. Arrows turn (↑) at the corners — those
      // turns are the visible decisions. Empty rows above/below the winding line
      // are the space being searched. Bottom-left start → top-right goal (the
      // published store, blue dot). Geometry verified against reflowRoute.
      columns: 8,
      rows: 5,
      route: [
        // ── bottom row: gather the inputs (Controla), travelling right ──
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Catálogo' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'hotpot', text: { main: 'Pagos' } },
        { at: [6, 5] },
        { at: [7, 5], colSpan: 2, module: 'junction', text: { main: 'Unir datos' } },
        { at: [7, 4] }, // ↑ decision: turn up
        // ── middle row: build & scale (Construye), travelling left ──
        { at: [7, 3], colSpan: 2, module: 'foresight', text: { main: 'Demanda' } },
        { at: [6, 3] },
        { at: [4, 3], colSpan: 2, module: 'forge', text: { main: 'Montar web' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'teamwork', text: { main: 'Alta masiva' } },
        { at: [1, 2] }, // ↑ decision: turn up
        // ── top row: operate & sustain (Delega), travelling right to the goal ──
        { at: [1, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Publicar' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Stock' } },
        { at: [6, 1] },
        { at: [7, 1], colSpan: 2, module: 'smartProcess', text: { main: 'Reponer' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // AiKit reasoning chain: the "recorrido" the AI walks to manage a folder of
    // invoices and close the quarter. This is ACT 3 of the Accounting mini-film
    // (see AccountingFlowVideo) — the grid carries the journey, so each step is
    // the AiKit MODULE that intervenes (brand icon + a custom micro-label),
    // crossing Controla → Delega → Construye. Same serpentine skeleton as the other
    // flows (cs2, 5×5 — plates sized to content; verified against reflowRoute):
    // bottom-left start disc → winds up to the top-right goal (the quarter closed).
    // Brand icons via `module:` (see modules.ts / operations-manual).
    id: 'cierre-trimestre',
    label: 'cierre de trimestre',
    spec: {
      // SERPENTEO estándar (cs2, 5×5): boustrophedon de 3 niveles (abajo →der, medio
      // ←izq, arriba →der). Placas al ancho JUSTO del contenido (2 columnas) — nunca
      // más anchas de lo necesario ni más altas de una casilla. Coords ya
      // reflow-consistentes. (Ver specs/operations-manual.md §6.)
      columns: 5,
      rows: 5,
      route: [
        // ── nivel inferior (→der): extraer y combinar los datos ──
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Extrae' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'junction', text: { main: 'Combina' } },
        { at: [4, 4] }, // ↑ giro
        // ── nivel medio (←izq): analizar y presentar ──
        { at: [4, 3], colSpan: 2, module: 'foresight', text: { main: 'Analiza' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'glimpse', text: { main: 'Presenta' } },
        { at: [1, 2] }, // ↑ giro
        // ── nivel superior (→der): registrar y cerrar ──
        { at: [1, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Registra' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'forge', text: { main: 'Cierre' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // AiKit reasoning chain: the "recorrido" the AI walks to turn a physical
    // shop into a live online store. This is the GRID act of the E-Commerce
    // mini-film (see EcommerceFlowVideo) — the inventory the merchant uploaded
    // (DocuSense, act 2) now travels the modules that build the store, crossing
    // Controla → Delega → Construye. Serpentine 5×5 skeleton (cs2 plates — the
    // medium/square reference; verified against reflowRoute): bottom-left start
    // disc → winds up to the top-right goal (the store live, blue dot). Each flow
    // keeps this serpentine but varies the PLATE texture (see operations-manual
    // §6). Brand icons via `module:` (see modules.ts).
    id: 'montar-tienda',
    label: 'montar la tienda',
    spec: {
      // 5×5 so each row is exactly item(cs2) + 1 arrow + item(cs2): a single
      // arrow cell ever sits between two steps (no runs of arrows).
      columns: 5,
      rows: 5,
      route: [
        // ── bottom row (→): read the catalogue, connect the data (Controla) ──
        // (DocuSense ya capturó el inventario en el acto 2 → aquí arranca el recorrido.)
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Catálogo' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'junction', text: { main: 'Conecta' } },
        { at: [4, 4] }, // ↑ decision: turn up
        // ── middle row (←): ask to personalise, then build the web (Delega → Construye) ──
        { at: [4, 3], colSpan: 2, module: 'feedbackLoop', text: { main: 'Pregunta' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'forge', text: { main: 'Monta web' } },
        { at: [1, 2] }, // ↑ decision: turn up
        // ── top row (→): publish (Delega), then keep the stock in sync (Delega) ──
        { at: [1, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Publica' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Stock' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // AiKit reasoning chain: the "recorrido" the AI walks to turn a pile of
    // scattered contacts into an email funnel that nurtures itself. This is the
    // GRID act of the Email Marketing mini-film (see EmailFlowVideo) — the
    // contacts captured by DocuSense (act 2) travel the modules that segment,
    // write, send and nurture the campaign, crossing Controla → Construye →
    // Delega. Same serpentine skeleton as the other flows (cs2, 5×5 — plates sized to
    // content; verified against reflowRoute): bottom-left start disc → winds up to the
    // top-right goal (the funnel live, blue dot). Brand icons via `module:`.
    id: 'campana-email',
    label: 'campaña de email',
    spec: {
      // SERPENTEO estándar (cs2, 5×5): boustrophedon de 3 niveles (abajo →der, medio
      // ←izq, arriba →der). Placas al ancho JUSTO del contenido (2 columnas) — nunca
      // más anchas de lo necesario ni más altas de una casilla. Coords ya
      // reflow-consistentes. (Ver specs/operations-manual.md §6.)
      columns: 5,
      rows: 5,
      route: [
        // ── nivel inferior (→der): contactos y segmentación ──
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Contactos' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'foresight', text: { main: 'Segmenta' } },
        { at: [4, 4] }, // ↑ giro
        // ── nivel medio (←izq): diseñar y redactar la campaña ──
        { at: [4, 3], colSpan: 2, module: 'smartProcess', text: { main: 'Diseña' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'forge', text: { main: 'Redacta' } },
        { at: [1, 2] }, // ↑ giro
        // ── nivel superior (→der): enviar y nutrir 24/7 ──
        { at: [1, 1], colSpan: 2, module: 'actionScript', text: { main: 'Envía' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Nutre' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // AiKit reasoning chain: the "recorrido" the AI walks to turn a flood of
    // scattered messages into a calm, answered queue. This is the GRID act of the
    // Customer Support mini-film (see SupportFlowVideo) — the channels Hotpot
    // connected (act 2) travel the modules that ticket, prioritise, resolve and
    // answer, crossing Controla → Construye → Delega. Same serpentine skeleton as
    // the other flows, here COMPACT (cs2, 5×5) for a tight triage read (verified
    // against reflowRoute): bottom-left start disc → winds up to the top-right goal
    // (the customer attended, blue dot). Brand icons via `module:`.
    id: 'soporte-cliente',
    label: 'soporte al cliente',
    spec: {
      // SERPENTEO COMPACTO (cs2, 5×5): el mismo boustrophedon de 3 niveles que el
      // resto, con placas estándar de 2 columnas → la silueta más compacta. Variedad
      // por TEXTURA de placa (solo ancho, nunca más de una fila de alto), no por
      // romper la serpiente (ver specs/operations-manual.md §6). Coords ya
      // reflow-consistentes.
      columns: 5,
      rows: 5,
      route: [
        // ── nivel inferior (→der): canales y tickets ──
        { at: [1, 5], colSpan: 2, module: 'hotpot', text: { main: 'Canales' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'smartProcess', text: { main: 'Tickets' } },
        { at: [4, 4] }, // ↑ giro
        // ── nivel medio (←izq): priorizar y resolver ──
        { at: [4, 3], colSpan: 2, module: 'foresight', text: { main: 'Prioriza' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'skillHub', text: { main: 'Resuelve' } },
        { at: [1, 2] }, // ↑ giro
        // ── nivel superior (→der): escalar y responder ──
        { at: [1, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Escala' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Responde' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // AiKit reasoning chain: the "recorrido" the AI walks to turn a messy staff
    // rota into weekly templates that can be changed by chat. This is the GRID
    // act of the Scheduling mini-film (see SchedulingFlowVideo): the staff list
    // loaded from Excel/ERP travels the modules that read, connect, ask, generate,
    // detect conflicts, adjust, publish and keep the schedule alive.
    id: 'planificacion-horarios',
    label: 'planificación de horarios',
    spec: {
      // 8×5 allows three module plates per row while preserving the house rule:
      // item(cs2) + 1 arrow + item(cs2) + 1 arrow + item(cs2). Bottom-left start
      // disc → serpentine route → top-right goal.
      columns: 8,
      rows: 5,
      route: [
        // ── bottom row (→): load the source of truth and ask for the rules ──
        { at: [1, 5], colSpan: 2, module: 'docusense', text: { main: 'Plantilla' } },
        { at: [3, 5] },
        { at: [4, 5], colSpan: 2, module: 'junction', text: { main: 'ERP' } },
        { at: [6, 5] },
        { at: [7, 5], colSpan: 2, module: 'feedbackLoop', text: { main: 'Reglas' } },
        { at: [7, 4] }, // ↑ decision: turn up
        // ── middle row (←): generate, check conflicts, reassign ──
        { at: [7, 3], colSpan: 2, module: 'smartProcess', text: { main: 'Reparte' } },
        { at: [6, 3] },
        { at: [4, 3], colSpan: 2, module: 'foresight', text: { main: 'Conflictos' } },
        { at: [3, 3] },
        { at: [1, 3], colSpan: 2, module: 'teamwork', text: { main: 'Ajusta' } },
        { at: [1, 2] }, // ↑ decision: turn up
        // ── top row (→): output, alerts and later changes by chat ──
        { at: [1, 1], colSpan: 2, module: 'glimpse', text: { main: 'Planillas' } },
        { at: [3, 1] },
        { at: [4, 1], colSpan: 2, module: 'heartbeat', text: { main: 'Avisos' } },
        { at: [6, 1] },
        { at: [7, 1], colSpan: 2, module: 'actionRunner', text: { main: 'Cambios' } },
      ],
      startNode: [0, 5],
    },
  },
  {
    // Same concept, route AUTO-SOLVED with BFS around obstacles.
    id: 'inteligencia-solved',
    label: 'auto (BFS)',
    spec: {
      columns: 6,
      rows: 4,
      route: coordsToSteps(
        solve([1, 4], [6, 1], {
          columns: 6,
          rows: 4,
          blocked: [
            [3, 4],
            [3, 3],
            [3, 2],
            [5, 1],
            [5, 2],
          ] as Coord[],
        }),
      ),
      startNode: [0, 4],
    },
  },
]
