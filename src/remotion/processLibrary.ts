/**
 * processLibrary — the **hybrid process catalogue** for «Globo Vivo».
 * ──────────────────────────────────────────────────────────────────────────
 * The living grid that colonizes the globe must read as «muchísimos procesos»
 * (spec: Capacidades de usuario): a handful of **legible, recognizable AiKit
 * business flows** ("hero") mixed with **hundreds** of unique flows produced by
 * a **seeded combinatorial generator** (AiKit modules × action verbs × business
 * domains) — "densidad infinita" with no two flows identical.
 *
 * A *process* is an ordered chain of {@link Stage}s: **module** steps (an AiKit
 * tool — icon only) and **action** steps (a concrete verb — label + icon), the
 * exact authoring vocabulary of `tejidoVivoScript.ts`. This module owns only the
 * **logical definitions** (which tools / verbs / how long); the *placement* of a
 * flow onto the equirectangular surface and its reveal/decay choreography live in
 * `globoVivoScript.ts` (the flow schedule, next Phase-3 task), and the per-frame
 * stamping lives in `tissueAtlas.ts`.
 *
 * **Determinism** (spec: Restricciones). Everything is built once at module load
 * from a single **seeded `mulberry32` stream** — no `Date.now()` / `Math.random()`.
 * `generateProcesses(count, seed)` returns byte-for-byte identical output every
 * run, so the library is unit-testable in node and the render is reproducible.
 *
 * **Purity** (node-testable). The only project imports are the **type-only**
 * `ModuleName` / `IconName` (erased at compile, exactly like `tejidoVivoScript`),
 * so no `.svg` / `.riv` asset import is pulled in — the module loads in the `unit`
 * vitest project. The valid module / icon *values* are listed locally as typed
 * literals (TS checks them against the catalogue) rather than imported at runtime.
 */
import { type ModuleName } from '@/stories/neo/modules/modules'
import { type IconName } from '@/components/icons'

// ── Stage vocabulary (a tool step or a verb step) ───────────────────────────
// Mirrors the `m()` / `a()` authoring grammar of tejidoVivoScript, but with an
// explicit `kind` discriminant so the schedule + tests can switch without a
// `'module' in s` probe. A module step occupies 1 grid cell; an action step
// spans 2 (it carries a label).

/** A tool step: an AiKit module, rendered as its icon only (1 cell wide). */
export type ModuleStage = { kind: 'module'; module: ModuleName }
/** A verb step: a concrete action with a label + icon (2 cells wide). */
export type ActionStage = { kind: 'action'; action: string; icon: IconName }
/** One step in a process chain — either an AiKit tool or a concrete action. */
export type Stage = ModuleStage | ActionStage

/** Build a tool step. */
export const moduleStage = (module: ModuleName): ModuleStage => ({ kind: 'module', module })
/** Build a verb step. */
export const actionStage = (action: string, icon: IconName): ActionStage => ({
  kind: 'action',
  action,
  icon,
})

export const isModuleStage = (s: Stage): s is ModuleStage => s.kind === 'module'
export const isActionStage = (s: Stage): s is ActionStage => s.kind === 'action'

/** Grid-cell span of a stage: a tool is 1 cell, a labelled action is 2. */
export const stageSpan = (s: Stage): number => (isModuleStage(s) ? 1 : 2)

// ── Deterministic PRNG (mulberry32) — one stream, seeded once ────────────────

/**
 * Deterministic PRNG (mulberry32): a single 32-bit stream seeded once, returning
 * floats in `[0, 1)`. No global RNG, no `Math.random` — same seed → same
 * sequence, so the whole combinatorial library is reproducible. The generator
 * draws from one stream so flow `n` always sees the same numbers.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Pick a deterministic element of `arr` using one draw of `rng`. */
function pick<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)]
}

// ── Combinatorial pools (modules × verbs × domains) ─────────────────────────
// The three axes the generator crosses. All module / icon names are typed
// literals — TS validates them against the real catalogues at compile time
// without importing the asset-bearing runtime modules.

/** Every AiKit module the generator may stamp into a flow (all 16, by group). */
export const MODULE_POOL: readonly ModuleName[] = [
  // data
  'hotpot', 'sqlsense', 'udon', 'sushimi', 'docusense', 'junction', 'glimpse', 'foresight',
  // action
  'actionRunner', 'actionScript', 'teamwork', 'feedbackLoop', 'heartbeat',
  // orchestration
  'smartProcess', 'forge', 'skillHub',
] as const

/** A concrete action verb + the icon that depicts it. */
export type ActionVerb = { action: string; icon: IconName }

/**
 * The verb pool the generator draws action steps from — concrete business
 * actions, each mapped to a valid grid icon. Crossed with {@link MODULE_POOL}
 * and {@link DOMAINS} this yields an effectively unbounded space of flows.
 */
export const ACTION_VERBS: readonly ActionVerb[] = [
  { action: 'Validar', icon: 'lock' },
  { action: 'Aprobar', icon: 'check' },
  { action: 'Revisar', icon: 'star' },
  { action: 'Enviar', icon: 'bell' },
  { action: 'Notificar', icon: 'megaphone' },
  { action: 'Asignar', icon: 'user' },
  { action: 'Resolver', icon: 'check' },
  { action: 'Cerrar', icon: 'check' },
  { action: 'Cobrar', icon: 'target' },
  { action: 'Facturar', icon: 'check' },
  { action: 'Segmentar', icon: 'user' },
  { action: 'Medir', icon: 'target' },
  { action: 'Publicar', icon: 'global' },
  { action: 'Programar', icon: 'calendar' },
  { action: 'Recordar', icon: 'bell' },
  { action: 'Generar', icon: 'sparkles' },
  { action: 'Clasificar', icon: 'flag' },
  { action: 'Sincronizar', icon: 'reload' },
  { action: 'Escalar', icon: 'flag' },
  { action: 'Priorizar', icon: 'target' },
  { action: 'Conciliar', icon: 'check' },
  { action: 'Auditar', icon: 'lock' },
  { action: 'Reponer', icon: 'reload' },
  { action: 'Prever', icon: 'brain' },
  { action: 'Analizar', icon: 'brain' },
  { action: 'Llamar', icon: 'call' },
  { action: 'Localizar', icon: 'location' },
  { action: 'Etiquetar', icon: 'flag' },
  { action: 'Confirmar', icon: 'check' },
  { action: 'Archivar', icon: 'check' },
  { action: 'Calificar', icon: 'target' },
  { action: 'Verificar', icon: 'lock' },
] as const

/** Draw a random action verb as an {@link ActionStage}. */
function pickVerb(rng: () => number): ActionStage {
  const v = pick(ACTION_VERBS, rng)
  return actionStage(v.action, v.icon)
}

/** A business domain + the AiKit data/orchestration tool a flow there starts from. */
export type Domain = { key: string; label: string; lead: ModuleName }

/**
 * Business domains the generated flows are anchored in. Each names the **lead
 * module** the flow opens on so a generated chain still reads as belonging to
 * its domain (e.g. Finanzas opens on `hotpot`), before the combinatorial body.
 */
export const DOMAINS: readonly Domain[] = [
  { key: 'ventas', label: 'Ventas', lead: 'junction' },
  { key: 'soporte', label: 'Soporte', lead: 'docusense' },
  { key: 'marketing', label: 'Marketing', lead: 'glimpse' },
  { key: 'finanzas', label: 'Finanzas', lead: 'hotpot' },
  { key: 'rrhh', label: 'RRHH', lead: 'teamwork' },
  { key: 'logistica', label: 'Logística', lead: 'smartProcess' },
  { key: 'inventario', label: 'Inventario', lead: 'sqlsense' },
  { key: 'operaciones', label: 'Operaciones', lead: 'actionRunner' },
  { key: 'compras', label: 'Compras', lead: 'docusense' },
  { key: 'datos', label: 'Datos', lead: 'sqlsense' },
  { key: 'producto', label: 'Producto', lead: 'forge' },
  { key: 'legal', label: 'Legal', lead: 'docusense' },
] as const

// ── A process (a named chain of stages) ─────────────────────────────────────

/** Whether a process is a curated hero flow or a combinatorially-generated one. */
export type ProcessKind = 'hero' | 'generated'

/** A complete process: a named, domain-tagged chain of tool + action steps. */
export type Process = {
  /** Stable index into {@link PROCESS_LIBRARY} (hero first, then generated). */
  id: number
  /** Human-readable name (legible for hero flows; "Verbo · Dominio" generated). */
  name: string
  /** Business domain label. */
  domain: string
  /** `hero` (hand-authored, legible) or `generated` (combinatorial density). */
  kind: ProcessKind
  /** The ordered chain of steps. */
  stages: Stage[]
}

/** Stable content signature of a flow — used to dedupe and to prove uniqueness. */
export function processSignature(domainKey: string, stages: readonly Stage[]): string {
  const body = stages
    .map((s) => (isModuleStage(s) ? `m:${s.module}` : `a:${s.action}`))
    .join('>')
  return `${domainKey}|${body}`
}

/** Total grid-cell width of a process (Σ stage spans) — modules 1, actions 2. */
export function processCellSpan(p: Process): number {
  return p.stages.reduce((n, s) => n + stageSpan(s), 0)
}

// ── Curated hero processes (legible, recognizable AiKit flows) ──────────────
// The handful the camera can push in on and a human reads as a real business
// process. Authored with the same vocabulary the generator uses, so hero and
// generated flows render identically — heroes are simply hand-tuned to be clear.

const M = moduleStage
const A = actionStage

type HeroDef = { name: string; domain: string; stages: Stage[] }

const HERO_DEFS: readonly HeroDef[] = [
  { name: 'Pedido a entrega', domain: 'Ventas', stages: [M('docusense'), A('Validar', 'lock'), M('hotpot'), A('Facturar', 'check'), A('Avisar', 'megaphone'), M('smartProcess'), A('Reponer', 'reload')] },
  { name: 'Soporte a cierre', domain: 'Soporte', stages: [M('docusense'), A('Asignar', 'user'), M('actionRunner'), A('Resolver', 'check'), A('Cerrar', 'check')] },
  { name: 'Reseña a respuesta', domain: 'Marketing', stages: [A('Reseña', 'star'), M('glimpse'), A('Responder', 'megaphone'), M('forge'), A('Publicar', 'global')] },
  { name: 'Reserva a recordatorio', domain: 'Operaciones', stages: [A('Reservar', 'calendar'), M('junction'), A('Confirmar', 'check'), A('Recordar', 'bell')] },
  { name: 'Lead a venta', domain: 'Ventas', stages: [M('junction'), A('Calificar', 'target'), M('teamwork'), A('Llamar', 'call'), M('hotpot'), A('Cobrar', 'target')] },
  { name: 'Campaña a métrica', domain: 'Marketing', stages: [M('glimpse'), A('Segmentar', 'user'), M('forge'), A('Enviar', 'bell'), M('foresight'), A('Medir', 'target')] },
  { name: 'Stock a reposición', domain: 'Inventario', stages: [M('sqlsense'), A('Sincronizar', 'reload'), M('foresight'), A('Prever', 'brain'), M('smartProcess'), A('Pedir', 'check')] },
  { name: 'Alta de empleado', domain: 'RRHH', stages: [M('docusense'), A('Alta', 'user'), M('junction'), A('Verificar', 'lock'), M('teamwork')] },
  { name: 'Albarán a entrega', domain: 'Logística', stages: [M('docusense'), A('Albarán', 'check'), M('junction'), A('Rutar', 'arrow'), M('actionRunner'), A('Enviar', 'bell'), A('Entregado', 'check')] },
  { name: 'Horas a nómina', domain: 'RRHH', stages: [M('sqlsense'), A('Horas', 'clock'), M('hotpot'), A('Nómina', 'check'), A('Pagar', 'check')] },
  { name: 'Brief a publicación', domain: 'Producto', stages: [M('skillHub'), A('Brief', 'star'), M('forge'), A('Generar', 'sparkles'), M('glimpse'), A('Publicar', 'global')] },
  { name: 'Vigilancia a alerta', domain: 'Operaciones', stages: [M('heartbeat'), A('Vigilar', 'target'), M('foresight'), A('Alertar', 'flag'), M('teamwork')] },
  { name: 'Factura a cobro', domain: 'Finanzas', stages: [M('docusense'), A('Facturar', 'check'), A('Cobrar', 'target')] },
  { name: 'Difusión de reseñas', domain: 'Marketing', stages: [M('feedbackLoop'), A('Reseña', 'star'), A('Responder', 'megaphone'), A('Publicar', 'global')] },
  { name: 'Conciliación bancaria', domain: 'Finanzas', stages: [M('hotpot'), A('Sincronizar', 'reload'), A('Conciliar', 'check'), M('sqlsense'), A('Auditar', 'lock')] },
  { name: 'Ticket a SLA', domain: 'Soporte', stages: [M('docusense'), A('Clasificar', 'flag'), A('Priorizar', 'target'), M('actionRunner'), A('Resolver', 'check'), A('Cerrar', 'check')] },
  { name: 'Contrato a firma', domain: 'Legal', stages: [M('docusense'), A('Revisar', 'star'), A('Aprobar', 'check'), A('Firmar', 'lock'), A('Archivar', 'check')] },
  { name: 'Compra a recepción', domain: 'Compras', stages: [M('docusense'), A('Aprobar', 'check'), M('junction'), A('Pedir', 'check'), A('Recibir', 'check'), M('sqlsense'), A('Conciliar', 'check')] },
]

/** The curated hero flows, ids `0 … HERO_PROCESSES.length-1`. */
export const HERO_PROCESSES: Process[] = HERO_DEFS.map((d, id) => ({
  id,
  name: d.name,
  domain: d.domain,
  kind: 'hero',
  stages: d.stages,
}))

// ── Seeded combinatorial generator ──────────────────────────────────────────

/** Shortest / longest generated chain (in stages). */
export const MIN_STAGES = 3
export const MAX_STAGES = 7

/** How many combinatorial flows to generate (→ "hundreds", spec). */
export const GENERATED_COUNT = 300

/** The single seed the whole generated library derives from. */
export const LIBRARY_SEED = 0x6105f00d

/**
 * Build one domain-anchored chain of exactly `len` stages: it **opens** on the
 * domain's lead module, **closes** on a concrete action verb, and **alternates**
 * tool / verb in between — so every generated flow reads as "tool → do → tool →
 * do …", a plausible process rather than noise. All choices come from `rng`.
 */
function buildChain(domain: Domain, len: number, rng: () => number): Stage[] {
  const stages: Stage[] = [moduleStage(domain.lead)]
  for (let i = 1; i < len; i += 1) {
    const isLast = i === len - 1
    // Even interior indices are tool slots; the last index always closes on a verb.
    const moduleSlot = i % 2 === 0 && !isLast
    stages.push(moduleSlot ? moduleStage(pick(MODULE_POOL, rng)) : pickVerb(rng))
  }
  return stages
}

/** Headline a generated flow by its first action verb, tagged with the domain. */
function chainName(domain: Domain, stages: Stage[]): string {
  const firstAction = stages.find(isActionStage)
  const head = firstAction ? firstAction.action : domain.label
  return `${head} · ${domain.label}`
}

/**
 * Generate `count` **unique** deterministic flows from `seed`. One `mulberry32`
 * stream drives every choice (domain, length, each step), so the result is
 * byte-identical across runs. Flows are deduped by {@link processSignature} and
 * names disambiguated with a numeric suffix, so both **flows and names are
 * unique**. Ids continue after the hero block ({@link HERO_PROCESSES}).
 */
export function generateProcesses(count: number, seed: number): Process[] {
  const rng = mulberry32(seed)
  const out: Process[] = []
  const seenSig = new Set<string>()
  const seenName = new Set<string>()
  const idBase = HERO_PROCESSES.length
  // Bounded so an exhausted space can never spin forever (it never gets close).
  const maxAttempts = count * 64
  for (let attempt = 0; attempt < maxAttempts && out.length < count; attempt += 1) {
    const domain = pick(DOMAINS, rng)
    const len = MIN_STAGES + Math.floor(rng() * (MAX_STAGES - MIN_STAGES + 1))
    const stages = buildChain(domain, len, rng)

    const sig = processSignature(domain.key, stages)
    if (seenSig.has(sig)) continue
    seenSig.add(sig)

    let name = chainName(domain, stages)
    if (seenName.has(name)) name = `${name} ${out.length + 1}`
    seenName.add(name)

    out.push({ id: idBase + out.length, name, domain: domain.label, kind: 'generated', stages })
  }
  return out
}

/** The generated flows (built once at module load, deterministic). */
export const GENERATED_PROCESSES: Process[] = generateProcesses(GENERATED_COUNT, LIBRARY_SEED)

/**
 * The full hybrid library: curated hero flows first, then the combinatorial
 * density. Built once; `id` equals the array index. The flow schedule
 * (`globoVivoScript.ts`) samples this to populate the colonizing surface.
 */
export const PROCESS_LIBRARY: Process[] = [...HERO_PROCESSES, ...GENERATED_PROCESSES]

/** Total flows in the library. */
export const LIBRARY_SIZE = PROCESS_LIBRARY.length

/** Look up a flow by its id (= index into {@link PROCESS_LIBRARY}). */
export function processById(id: number): Process | undefined {
  return PROCESS_LIBRARY[id]
}

/** The curated subset (the legible hero flows the camera can read). */
export const heroProcesses = (): Process[] => HERO_PROCESSES
/** The combinatorial subset (the hundreds of density flows). */
export const generatedProcesses = (): Process[] => GENERATED_PROCESSES
