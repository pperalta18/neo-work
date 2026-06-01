/**
 * SourcesActionsVideo — "de todo lo que SABES a todo lo que puedes HACER".
 * ──────────────────────────────────────────────────────────────────────────
 * Three hard-cut beats on one timeline:
 *
 * SCENE 1 — KNOWLEDGE (0 … OCEAN_DUR)
 *   A vast ocean of information a business sits on (emails, DB rows, docs,
 *   invoices, meetings, chats, tickets…) blooms from the centre as a field of
 *   neumorphic pills that bleeds off every edge, drifts like a sea, then
 *   reorganises into one tidy centred grid — chaos becomes structured knowledge.
 *
 * SCENE 2 — ACTIONS (OCEAN_DUR … 2·OCEAN_DUR)  [hard cut]
 *   The very same scene, but the pills are now ACTIONS a business can take
 *   (reponer stock, cambiar estado, enviar correo, mandar un mensaje, crear una
 *   factura, programar un envío…). Same bloom → drift → centred grid.
 *
 * SCENE 3 — TWO GRIDS (2·OCEAN_DUR … end)  [hard cut]
 *   Both grids side by side: everything you KNOW on the left (bleeding off the
 *   left edge), everything you can DO on the right (bleeding off the right edge),
 *   parted by a centre seam.
 *
 * Everything is derived from `useCurrentFrame()` (no CSS transitions); both
 * fields are generated once at module load from a *seeded* PRNG, so every render
 * is identical (Remotion determinism — no Math.random at frame time).
 */

import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Mail01Icon,
  Database01Icon,
  InternetIcon,
  DocumentValidationIcon,
  Pdf01Icon,
  Video01Icon,
  Message01Icon,
  Calendar03Icon,
  Invoice01Icon,
  ReceiptEuroIcon,
  ContactIcon,
  UserGroupIcon,
  Table01Icon,
  Image02Icon,
  Note01Icon,
  Analytics01Icon,
  ChartLineData01Icon,
  Location01Icon,
  Call02Icon,
  Folder01Icon,
  CodeIcon,
  Task01Icon,
  Notification01Icon,
  Briefcase01Icon,
  Mic01Icon,
  Link01Icon,
  News01Icon,
  PackageIcon,
  // ── action verbs ──
  PackageMovingIcon,
  CheckmarkCircle02Icon,
  SentIcon,
  AddInvoiceIcon,
  DeliveryTruck01Icon,
  Megaphone01Icon,
  PencilEdit02Icon,
  WorkflowSquare06Icon,
  Rocket01Icon,
} from '@hugeicons-pro/core-stroke-standard'
import { BRAND, TEXT_FONT, elevation, lightTheme } from '@/lib/neumorphism'
import { Fonts } from './fonts'

const theme = lightTheme

// ── canvas ──────────────────────────────────────────────────────────────────────
const W = 1920
const H = 1080
const CX = W / 2
const CY = H / 2

// ── timeline (frames @ 30fps) ────────────────────────────────────────────────────
// each ocean beat: bloom → drift → order into the centred grid → brief hold
const BLOOM_SPAN = 78
const POP = 20
const ORDER_START = 150
const ORDER_STAGGER = 44 // spread across pills (reading order) → assembles like a sweep
const ORDER_DUR = 56
const OCEAN_HOLD = 24
const OCEAN_DUR = ORDER_START + ORDER_STAGGER + ORDER_DUR + OCEAN_HOLD // 274

// final beat: both grids ease in to their sides, then hold
const TWOGRID_IN = 28
const TWOGRID_HOLD = 96
const TWOGRID_DUR = TWOGRID_IN + TWOGRID_HOLD // 124

export const SOURCES_ACTIONS_DURATION = OCEAN_DUR * 2 + TWOGRID_DUR // 672

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
const window01 = (u: number, lo: number, hi: number) => smoother((u - lo) / (hi - lo))

/** Deterministic PRNG (mulberry32) — seeded so the fields never change. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── pill content ─────────────────────────────────────────────────────────────────
// Labels are kept short (≈ ≤11 chars) so nothing clips inside the small grid cells.
type PillType = { icon: IconSvgElement; accent: string; labels: string[] }

const KNOWLEDGE_TYPES: PillType[] = [
  { icon: Mail01Icon, accent: BRAND.red, labels: ['Email', 'RE: Pedido', 'Newsletter', 'Soporte'] },
  { icon: Database01Icon, accent: BRAND.teal, labels: ['Clientes', 'Registro', 'Query', 'Backup'] },
  { icon: InternetIcon, accent: BRAND.blue, labels: ['Web', 'Artículo', 'Landing', 'Búsqueda'] },
  { icon: DocumentValidationIcon, accent: BRAND.orange, labels: ['Contrato', 'Propuesta', 'Acta', 'Informe'] },
  { icon: Pdf01Icon, accent: BRAND.red, labels: ['Factura.pdf', 'Nómina.pdf', 'Dossier', 'Ficha'] },
  { icon: Video01Icon, accent: BRAND.green, labels: ['Meet 9:00', 'Daily', 'Demo', 'Kickoff'] },
  { icon: Message01Icon, accent: BRAND.green, labels: ['WhatsApp', 'Chat', 'Slack', 'Mensaje'] },
  { icon: Calendar03Icon, accent: BRAND.violet, labels: ['Evento', 'Cita 12:30', 'Deadline', 'Recordar'] },
  { icon: Invoice01Icon, accent: BRAND.green, labels: ['Factura', 'Presupuesto', 'Pedido', 'Abono'] },
  { icon: ReceiptEuroIcon, accent: BRAND.teal, labels: ['Cobro', 'Transfer.', 'Recibo', 'Pago'] },
  { icon: ContactIcon, accent: BRAND.blue, labels: ['Lead', 'Contacto', 'Cliente', 'Proveedor'] },
  { icon: UserGroupIcon, accent: BRAND.purple, labels: ['Equipo', 'Departam.', 'Roles'] },
  { icon: Table01Icon, accent: BRAND.orange, labels: ['Ventas', 'Inventario', 'KPIs', 'Datos'] },
  { icon: Image02Icon, accent: BRAND.pink, labels: ['Foto', 'Logo', 'Captura', 'Banner'] },
  { icon: Note01Icon, accent: BRAND.yellow, labels: ['Nota', 'Idea', 'To-do', 'Borrador'] },
  { icon: Analytics01Icon, accent: BRAND.orange, labels: ['Dashboard', 'Tráfico', 'Conversión'] },
  { icon: ChartLineData01Icon, accent: BRAND.violet, labels: ['Ventas Q3', 'Tendencia', 'Funnel'] },
  { icon: Location01Icon, accent: BRAND.red, labels: ['Dirección', 'Ruta', 'Almacén', 'Tienda'] },
  { icon: Call02Icon, accent: BRAND.teal, labels: ['Llamada', 'Buzón', 'Videocall'] },
  { icon: Folder01Icon, accent: BRAND.blue, labels: ['Carpeta', 'Proyecto', 'Adjunto', 'Recurso'] },
  { icon: CodeIcon, accent: BRAND.violet, labels: ['Repo', 'Commit', 'Script', 'API'] },
  { icon: Task01Icon, accent: BRAND.green, labels: ['Tarea', 'Ticket #88', 'Pendiente', 'Sprint'] },
  { icon: Notification01Icon, accent: BRAND.orange, labels: ['Alerta', 'Aviso', 'Mención'] },
  { icon: Briefcase01Icon, accent: BRAND.purple, labels: ['Odoo', 'Pedido ERP', 'Stock', 'Albarán'] },
  { icon: Mic01Icon, accent: BRAND.pink, labels: ['Nota voz', 'Grabación', 'Audio'] },
  { icon: Link01Icon, accent: BRAND.blue, labels: ['Enlace', 'Bookmark', 'Ref'] },
  { icon: News01Icon, accent: BRAND.red, labels: ['Noticia', 'RSS', 'Boletín', 'Prensa'] },
  { icon: PackageIcon, accent: BRAND.teal, labels: ['Producto', 'SKU', 'Stock', 'Envío'] },
]

const ACTION_TYPES: PillType[] = [
  { icon: PackageMovingIcon, accent: BRAND.teal, labels: ['Reponer', 'Inventario', 'Reservar', 'Pedir stock'] },
  { icon: CheckmarkCircle02Icon, accent: BRAND.green, labels: ['Completar', 'Aprobar', 'Cerrar', 'Validar'] },
  { icon: SentIcon, accent: BRAND.blue, labels: ['Enviar', 'Responder', 'Reenviar'] },
  { icon: Message01Icon, accent: BRAND.green, labels: ['WhatsApp', 'Mensaje', 'Avisar', 'Confirmar'] },
  { icon: AddInvoiceIcon, accent: BRAND.orange, labels: ['Factura', 'Cobrar', 'Abono', 'Recibo'] },
  { icon: Calendar03Icon, accent: BRAND.violet, labels: ['Agendar', 'Cita', 'Evento', 'Recordar'] },
  { icon: Call02Icon, accent: BRAND.teal, labels: ['Llamar', 'Devolver', 'Marcar'] },
  { icon: Notification01Icon, accent: BRAND.red, labels: ['Notificar', 'Alertar', 'Escalar'] },
  { icon: DeliveryTruck01Icon, accent: BRAND.blue, labels: ['Enviar', 'Ruta', 'Etiqueta', 'Despachar'] },
  { icon: ContactIcon, accent: BRAND.purple, labels: ['Crear lead', 'Contacto', 'Asignar'] },
  { icon: Database01Icon, accent: BRAND.teal, labels: ['Actualizar', 'Guardar', 'Registrar'] },
  { icon: ChartLineData01Icon, accent: BRAND.orange, labels: ['Informe', 'KPIs', 'Exportar', 'Analizar'] },
  { icon: Briefcase01Icon, accent: BRAND.purple, labels: ['Pedido', 'ERP', 'Albarán', 'Cotizar'] },
  { icon: Megaphone01Icon, accent: BRAND.pink, labels: ['Publicar', 'Promoción', 'Campaña', 'Anunciar'] },
  { icon: ReceiptEuroIcon, accent: BRAND.green, labels: ['Cobrar', 'Conciliar', 'Pago', 'Remesa'] },
  { icon: PencilEdit02Icon, accent: BRAND.yellow, labels: ['Editar', 'Actualizar', 'Corregir', 'Revisar'] },
  { icon: WorkflowSquare06Icon, accent: BRAND.violet, labels: ['Workflow', 'Ejecutar', 'Lanzar'] },
  { icon: Task01Icon, accent: BRAND.green, labels: ['Asignar', 'Subtarea', 'Priorizar', 'Tarea'] },
  { icon: UserGroupIcon, accent: BRAND.blue, labels: ['Asignar', 'Invitar', 'Turno', 'Equipo'] },
  { icon: Folder01Icon, accent: BRAND.blue, labels: ['Archivar', 'Adjuntar', 'Compartir'] },
  { icon: Location01Icon, accent: BRAND.red, labels: ['Zona', 'Ruta', 'Ubicar', 'Mapa'] },
  { icon: Rocket01Icon, accent: BRAND.orange, labels: ['Publicar', 'Desplegar', 'Activar', 'Lanzar'] },
]

// ── shared pill geometry ─────────────────────────────────────────────────────────
const PILL_W = 162
const PILL_H = 52
const PITCH_X = 186
const PITCH_Y = 92

// ── field generation (deterministic, once) ───────────────────────────────────────
// Bleed the field well past every edge so it reads as endless.
const FIELD_X0 = -180
const FIELD_X1 = W + 180
const FIELD_Y0 = -130
const FIELD_Y1 = H + 130

type Pill = {
  x: number
  y: number
  icon: IconSvgElement
  accent: string
  label: string
  depth: number // 0 = far/dim/small, 1 = near/bright/large
  phase: number
  bobRate: number
  delay: number // emergence start (frames)
  slot: number // reading-order index → its cell in the ordered grid
  gridX: number
  gridY: number
}

const MAX_DIST = Math.hypot(FIELD_X1 - CX, FIELD_Y1 - CY)

const FIELD_COLS = Math.ceil((FIELD_X1 - FIELD_X0) / PITCH_X)
const FIELD_ROWS = Math.ceil((FIELD_Y1 - FIELD_Y0) / PITCH_Y)
const N = FIELD_COLS * FIELD_ROWS

// ── the ordered (centred) grid every pill snaps into ─────────────────────────────
const GRID_COLS = 15
const GRID_ROWS = Math.ceil(N / GRID_COLS)
const USABLE_W = 1760
const USABLE_H = 1000
const GCELL_X = USABLE_W / GRID_COLS
const GCELL_Y = USABLE_H / GRID_ROWS
const GRID_SCALE = Math.min((GCELL_X - 14) / PILL_W, (GCELL_Y - 12) / PILL_H, 1)
const GRID_W = (GRID_COLS - 1) * GCELL_X
const GRID_H = (GRID_ROWS - 1) * GCELL_Y
const GRID_ORIGIN_X = CX - GRID_W / 2
const GRID_ORIGIN_Y = CY - GRID_H / 2

// ── the two-grid split (scene 3): each grid bleeds off its outer edge ─────────────
const PILL_VIS_HALF = (PILL_W * GRID_SCALE) / 2 // visual half-width of a settled pill
// Half-gutter: centre → each grid's inner edge. Kept clearly WIDER than one column
// pitch so the two grids read as two distinct panels, not one continuous grid.
const SIDE_GAP = 120
// Shift that lands each centred grid's inner edge SIDE_GAP from the centre seam.
// (The grid is centred, so the same magnitude works mirror-wise for both sides.)
const SPLIT_SHIFT = CX + SIDE_GAP + PILL_VIS_HALF - GRID_ORIGIN_X

function buildField(types: PillType[], seed: number): Pill[] {
  const rnd = mulberry32(seed)
  const pills: Pill[] = []
  for (let r = 0; r < FIELD_ROWS; r++) {
    for (let c = 0; c < FIELD_COLS; c++) {
      // brick offset on odd rows + jitter → organic, not a rigid grid
      const offset = r % 2 ? PITCH_X / 2 : 0
      const x = FIELD_X0 + c * PITCH_X + offset + (rnd() - 0.5) * 26
      const y = FIELD_Y0 + r * PITCH_Y + (rnd() - 0.5) * 22
      const t = types[Math.floor(rnd() * types.length)]
      const label = t.labels[Math.floor(rnd() * t.labels.length)]
      const depth = rnd()
      const dist = Math.hypot(x - CX, y - CY)
      const delay = (dist / MAX_DIST) * BLOOM_SPAN + rnd() * 10
      pills.push({
        x,
        y,
        icon: t.icon,
        accent: t.accent,
        label,
        depth,
        phase: rnd() * Math.PI * 2,
        bobRate: 0.7 + rnd() * 0.7,
        delay,
        slot: 0,
        gridX: 0,
        gridY: 0,
      })
    }
  }

  // Assign grid cells in reading order of the sea (top→bottom, left→right) so the
  // reorg preserves rough spatial order — pills glide into place, not scramble.
  const order = pills.map((_, i) => i)
  order.sort((a, b) => {
    const ba = Math.round((pills[a].y - FIELD_Y0) / PITCH_Y)
    const bb = Math.round((pills[b].y - FIELD_Y0) / PITCH_Y)
    return ba !== bb ? ba - bb : pills[a].x - pills[b].x
  })
  order.forEach((pi, slot) => {
    const row = Math.floor(slot / GRID_COLS)
    const col = slot % GRID_COLS
    const rowStart = row * GRID_COLS
    const rowCount = Math.min(GRID_COLS, pills.length - rowStart)
    const colOffset = (GRID_COLS - rowCount) / 2 // centre a short last row
    pills[pi].slot = slot
    pills[pi].gridX = GRID_ORIGIN_X + (col + colOffset) * GCELL_X
    pills[pi].gridY = GRID_ORIGIN_Y + row * GCELL_Y
  })

  // far pills first so near (brighter) pills paint on top
  return pills.sort((a, b) => a.depth - b.depth)
}

const KNOWLEDGE = buildField(KNOWLEDGE_TYPES, 0x5ea0f10)
const ACTIONS = buildField(ACTION_TYPES, 0xac12053)

/** Soft vignette in screen space — pills melt away toward the borders. */
function edgeFade(x: number, y: number): number {
  const m = 200
  const fx = smoother(clamp01(Math.min(x, W - x) / m))
  const fy = smoother(clamp01(Math.min(y, H - y) / m))
  return fx * fy
}

// ── presentational plate (shared everywhere) ─────────────────────────────────────
function Plate({
  x,
  y,
  scale,
  opacity,
  blur,
  z,
  icon,
  accent,
  label,
}: {
  x: number
  y: number
  scale: number
  opacity: number
  blur: number
  z: number
  icon: IconSvgElement
  accent: string
  label: string
}) {
  const plate = elevation(theme, { depth: 'raised', distance: 5, blur: 13, radius: PILL_H / 2 })
  return (
    <div
      style={{
        position: 'absolute',
        left: x - PILL_W / 2,
        top: y - PILL_H / 2,
        width: PILL_W,
        height: PILL_H,
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '0 16px',
        ...plate,
        transform: `scale(${scale})`,
        opacity,
        filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined,
        zIndex: z,
      }}
    >
      <span
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 30,
          height: 30,
          flexShrink: 0,
          borderRadius: 9,
          color: accent,
          background: `${accent}14`,
        }}
      >
        <HugeiconsIcon icon={icon} size={17} color={accent} strokeWidth={1.9} />
      </span>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: TEXT_FONT,
          fontSize: 13.5,
          fontWeight: 600,
          letterSpacing: -0.2,
          color: theme.textStrong,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label}
      </span>
    </div>
  )
}

// ── ocean pill: bloom → drift → centred grid (scenes 1 & 2) ──────────────────────
function OceanPill({ p, frame }: { p: Pill; frame: number }) {
  const g = window01(frame, p.delay, p.delay + POP) // bloom
  if (g <= 0.001) return null

  // ordering: 0 = scattered sea, 1 = settled in its grid cell.
  const orderStart = ORDER_START + (p.slot / N) * ORDER_STAGGER
  const order = window01(frame, orderStart, orderStart + ORDER_DUR)
  const sea = 1 - order // how "sea-like" it still is

  // SEA state: depth → size / brightness / blur (layers receding into mist).
  const seaScale = lerp(0.64, 1.08, p.depth) * (0.86 + 0.14 * g)
  const seaOpacity = lerp(0.32, 1, p.depth) * clamp01(g * 1.5) * edgeFade(p.x, p.y)
  const seaBlur = (1 - p.depth) * 2.4
  // oceanic motion — bob + depth-scaled drift, calmed to nothing as it orders
  const dx = (4 + p.depth * 10) * Math.sin(frame * 0.013 + p.phase * 0.4) * sea
  const dy =
    ((3 + p.depth * 6) * Math.sin(frame * 0.045 * p.bobRate + p.phase) - (1 - g) * 22) * sea

  // Blend sea → ordered grid (one shared "visible depth": uniform scale, full
  // opacity, no blur — everything equally clear).
  const x = lerp(p.x + dx, p.gridX, order)
  const y = lerp(p.y + dy, p.gridY, order)
  const scale = lerp(seaScale, GRID_SCALE, order)
  const opacity = lerp(seaOpacity, 1, order)
  const blur = seaBlur * sea
  if (opacity <= 0.012) return null

  return (
    <Plate
      x={x}
      y={y}
      scale={scale}
      opacity={opacity}
      blur={blur}
      z={Math.round(p.depth * 100) + 1}
      icon={p.icon}
      accent={p.accent}
      label={p.label}
    />
  )
}

function OceanGridScene({ field }: { field: Pill[] }) {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {field.map((p, i) => (
        <OceanPill key={i} p={p} frame={frame} />
      ))}
    </AbsoluteFill>
  )
}

// ── two-grid pill: a settled grid, shifted to its side, eased in (scene 3) ────────
function SideGridPill({ p, frame, side }: { p: Pill; frame: number; side: -1 | 1 }) {
  const t = window01(frame, (p.slot / N) * 12, (p.slot / N) * 12 + TWOGRID_IN) // gentle sweep-in
  // enter from a touch further outboard, settle to the resting side position
  const restX = p.gridX + side * SPLIT_SHIFT
  const x = restX + side * (1 - t) * 64
  // very faint idle breathing so the held card isn't frozen
  const bob = Math.sin(frame * 0.05 * p.bobRate + p.phase) * 1.6 * t
  const y = p.gridY + bob
  const scale = GRID_SCALE * (0.965 + 0.035 * t)
  const opacity = t
  if (opacity <= 0.012) return null

  return (
    <Plate
      x={x}
      y={y}
      scale={scale}
      opacity={opacity}
      blur={0}
      z={Math.round(p.depth * 100) + 1}
      icon={p.icon}
      accent={p.accent}
      label={p.label}
    />
  )
}

function TwoGridScene() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill>
      {KNOWLEDGE.map((p, i) => (
        <SideGridPill key={`k${i}`} p={p} frame={frame} side={-1} />
      ))}
      {ACTIONS.map((p, i) => (
        <SideGridPill key={`a${i}`} p={p} frame={frame} side={1} />
      ))}
    </AbsoluteFill>
  )
}

// ── composition ────────────────────────────────────────────────────────────────

export function SourcesActionsVideo() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      {/* faint depth gradient behind the field (lighter core, dimmer edges) */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 64% at 50% 48%, #ffffff 0%, ${theme.surface} 58%, #e9e9f2 100%)`,
        }}
      />

      {/* SCENE 1 — knowledge */}
      <Sequence durationInFrames={OCEAN_DUR}>
        <OceanGridScene field={KNOWLEDGE} />
      </Sequence>
      {/* SCENE 2 — actions (hard cut) */}
      <Sequence from={OCEAN_DUR} durationInFrames={OCEAN_DUR}>
        <OceanGridScene field={ACTIONS} />
      </Sequence>
      {/* SCENE 3 — two grids side by side (hard cut) */}
      <Sequence from={OCEAN_DUR * 2} durationInFrames={TWOGRID_DUR}>
        <TwoGridScene />
      </Sequence>

      {/* side edge-fades — soften where each grid bleeds off its outer edge */}
      <AbsoluteFill
        style={{
          pointerEvents: 'none',
          background: `linear-gradient(90deg, ${theme.surface} 0%, rgba(244,244,250,0) 7%, rgba(244,244,250,0) 93%, ${theme.surface} 100%)`,
        }}
      />
    </AbsoluteFill>
  )
}
