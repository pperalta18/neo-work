/**
 * yusta03Script.ts — pure choreography for Yusta03Economics
 * («los economics: humano vs software, justo los inversos»). See
 * specs/aikit-live-animations.md, inventario Yusta03.
 * ───────────────────────────────────────────────────────────────────────────
 * A 25-second talk support for Yusta's charla. The thesis of the guión, in one
 * legible read:
 *
 *   LA INVERSIÓN   two columns — NÚCLEO HUMANO vs SOFTWARE A MEDIDA — each with
 *                 two bars (PROGRAMAR · EJECUTAR). The human is cheap to program
 *                 (one sentence) and dear to execute (23:14 every budget). The
 *                 software is the mirror image: dear to program (months, a team,
 *                 ≈160.000 €) and almost free to execute. «los economics del
 *                 software son justo los inversos».
 *
 *   LA AMORTIZACIÓN a cumulative-cost chart answers the guión's question — how
 *                 many budgets to amortise a bespoke program? A counter runs the
 *                 budget number up; the human cumulative cost climbs steeply from
 *                 0 while the software line sits high (the upfront) and barely
 *                 rises. They meet at the PUNTO DE CRUCE — budget 10.000. Up to
 *                 the 9.999th, the human core was the cheaper option the whole
 *                 way.
 *
 * The crossing is not hand-placed: CROSS_N is derived from the four economics
 * constants, and the counter freezes one short of it (9.999 — the guión's
 * number). The human execution cost quotes the canonical 23:14 imported from
 * Prod01, never retyped. Everything is a pure function of `frame` (or a
 * constant) so the columns, the counter, the cost lines, the crossing, the
 * camera and the captions all unit-test without rendering; the visual
 * (Yusta03Economics.tsx) only spreads these values.
 */
import { type CameraFraming } from './aikit/cameraScript'
import { euro } from './aikit/widgetScript'
import { mmss, STOPWATCH_POINTS } from './prod01Script'

export const YUSTA03_DURATION = 750 // 25 s @30fps — the spec duration

export const STAGE_W = 1920
export const STAGE_H = 1080

export type Pt = { readonly x: number; readonly y: number }

/* ── shared math (pure; self-contained so the tests stay fast) ──────────── */

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — zero 1st & 2nd derivative at both ends. */
export function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}
/** Eased 0→1 ramp of `u` across [lo,hi]; safe (no NaN) when hi ≤ lo. */
export const window01 = (u: number, lo: number, hi: number) =>
  hi <= lo ? (u >= hi ? 1 : 0) : smoother((u - lo) / (hi - lo))

/* ── THE ECONOMICS — the four numbers the whole piece is built from ─────── */

/**
 * The cumulative-cost model (placeholder euros; the SHAPE is the message). A
 * human core costs `HUMAN_PER` to run one budget; bespoke software costs a big
 * `SOFTWARE_UPFRONT` to build, then almost nothing (`SOFTWARE_PER`) to run.
 * These four numbers PLACE the crossing — they are not chosen after it.
 */
export const HUMAN_PER = 18 // € per budget executed by a human (≈ 23 min of work)
export const SOFTWARE_PER = 2 // € per budget once the software exists (≈ free)
export const SOFTWARE_UPFRONT = 160_000 // € to build the bespoke program

/** Cumulative cost of producing `n` budgets, each side. */
export const humanCumulative = (n: number) => HUMAN_PER * n
export const softwareCumulative = (n: number) => SOFTWARE_UPFRONT + SOFTWARE_PER * n

/** Where the two cumulative costs meet — DERIVED, exactly 10.000 by design. */
export const CROSS_N = Math.round(SOFTWARE_UPFRONT / (HUMAN_PER - SOFTWARE_PER))
/** The cost both options reach at the crossing. */
export const CROSS_COST = humanCumulative(CROSS_N)

/** Up to this budget the human core is the cheaper option — the guión's 9.999. */
export const BUDGET_HERO = CROSS_N - 1

/** Which option is cheaper for `n` budgets ('humano' until CROSS_N). */
export const cheaperFor = (n: number): 'humano' | 'software' =>
  humanCumulative(n) <= softwareCumulative(n) ? 'humano' : 'software'

/**
 * The canonical execution cost — 23 min 14 s — imported from Prod01's frozen
 * stopwatch, never retyped. This is what one budget costs a human to EXECUTE.
 */
export const HUMAN_EXEC_SECONDS = STOPWATCH_POINTS[STOPWATCH_POINTS.length - 1][1]
export const HUMAN_EXEC_CLOCK = mmss(HUMAN_EXEC_SECONDS) // '23:14'

/* ── LA INVERSIÓN — the two columns (humano vs software), mirror images ──── */

export type Tone = 'barato' | 'caro'

export type EconBar = {
  /** PROGRAMAR or EJECUTAR. */
  readonly label: string
  /** The headline figure, e.g. 'Una frase' / '160.000 €'. */
  readonly value: string
  /** Quiet qualifier, e.g. '≈ gratis' / 'meses · un equipo'. */
  readonly sub: string
  /** Qualitative magnitude 0..1 (drives the bar length). */
  readonly magnitude: number
  /** barato → calm green · caro → red — the colour of the claim. */
  readonly tone: Tone
}

export type EconColumn = {
  readonly id: 'humano' | 'software'
  readonly title: string
  readonly programar: EconBar
  readonly ejecutar: EconBar
}

export const COLUMN_HUMANO: EconColumn = {
  id: 'humano',
  title: 'NÚCLEO HUMANO',
  programar: { label: 'PROGRAMAR', value: 'Una frase', sub: '≈ gratis · al instante', magnitude: 0.12, tone: 'barato' },
  ejecutar: { label: 'EJECUTAR', value: `${HUMAN_EXEC_CLOCK} / presupuesto`, sub: 'lento · caro · no escala', magnitude: 0.92, tone: 'caro' },
}

export const COLUMN_SOFTWARE: EconColumn = {
  id: 'software',
  title: 'SOFTWARE A MEDIDA',
  programar: { label: 'PROGRAMAR', value: `${euro(SOFTWARE_UPFRONT, 0)} €`, sub: 'meses · un equipo · riesgo', magnitude: 0.95, tone: 'caro' },
  ejecutar: { label: 'EJECUTAR', value: '≈ 0 €', sub: 'instantáneo · escala infinito', magnitude: 0.08, tone: 'barato' },
}

export const COLUMNS: readonly EconColumn[] = [COLUMN_HUMANO, COLUMN_SOFTWARE]

/** When each column animates in, and when the "inversos" tie lands. */
export const COLUMN_SHOW = { humano: 28, software: 96 } as const
export const INVERSION_AT = 156 // the swap arc that says "justo los inversos"

/* ── LA AMORTIZACIÓN — the cumulative-cost chart ────────────────────────── */

/** The plot box in content space. */
export const CHART = { x: 768, y: 300, w: 1044, h: 560 } as const
/** Right edge of the x-axis (budgets) and top of the y-axis (cost). Headroom
 * above the crossing so the meeting point sits comfortably inside the box. */
export const CHART_MAX_BUDGET = 12_000
export const COST_MAX = 220_000

/** Budget number → x px (clamped to the box). */
export const xOfBudget = (n: number) => CHART.x + CHART.w * clamp01(n / CHART_MAX_BUDGET)
/** Cost € → y px (inverted: more cost = higher up = smaller y). */
export const yOfCost = (c: number) => CHART.y + CHART.h * (1 - clamp01(c / COST_MAX))

export const pointHuman = (n: number): Pt => ({ x: xOfBudget(n), y: yOfCost(humanCumulative(n)) })
export const pointSoftware = (n: number): Pt => ({ x: xOfBudget(n), y: yOfCost(softwareCumulative(n)) })

/** The crossing in chart space (where the two lines meet). */
export const CROSS_POINT: Pt = pointHuman(CROSS_N)

/** Axis ticks on the budget axis (0, 5.000, 10.000). */
export const BUDGET_TICKS: readonly number[] = [0, 5_000, 10_000]

/* the running amortización counter ─────────────────────────────────────── */

export const CHART_BEAT_AT = 210 // the counter starts running
export const CHART_BEAT_DUR = 420 // …and reaches 9.999 here (ends frame 630)
export const CHART_BEAT_END = CHART_BEAT_AT + CHART_BEAT_DUR

/** The budget number at `frame` — 0 → 9.999 (eased), frozen after. */
export const budgetAt = (frame: number) => BUDGET_HERO * window01(frame, CHART_BEAT_AT, CHART_BEAT_END)
/** The integer counter reading (the hero number on screen). */
export const counterBudget = (frame: number) => Math.round(budgetAt(frame))
/** Grouped es-ES display of the counter, e.g. '9.999'. */
export const counterText = (frame: number) => euro(counterBudget(frame), 0)

/** Live cumulative cost readouts as the counter runs. */
export const humanCostAt = (frame: number) => humanCumulative(counterBudget(frame))
export const softwareCostAt = (frame: number) => softwareCumulative(counterBudget(frame))

/* SVG path builders for the chart (pure → unit-testable) ────────────────── */

const seg = (a: Pt, b: Pt) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`

/** The solid (already-lived) part of each cost line, up to the counter. */
export const humanSolidPath = (frame: number) => seg(pointHuman(0), pointHuman(counterBudget(frame)))
export const softwareSolidPath = (frame: number) => seg(pointSoftware(0), pointSoftware(counterBudget(frame)))

/** The faint projection from the counter out to the edge (where it's heading). */
export const humanProjPath = (frame: number) => seg(pointHuman(counterBudget(frame)), pointHuman(CHART_MAX_BUDGET))
export const softwareProjPath = (frame: number) => seg(pointSoftware(counterBudget(frame)), pointSoftware(CHART_MAX_BUDGET))

/**
 * The "humano más barato" savings band — the polygon between the two solid
 * lines from budget 0 to the counter. Reads as the territory where the human
 * core wins; it stops growing the instant the lines would cross.
 */
export function savingsBandPath(frame: number): string {
  const n = Math.min(counterBudget(frame), CROSS_N)
  const h0 = pointHuman(0)
  const hN = pointHuman(n)
  const sN = pointSoftware(n)
  const s0 = pointSoftware(0)
  return `M ${h0.x} ${h0.y} L ${hN.x} ${hN.y} L ${sN.x} ${sN.y} L ${s0.x} ${s0.y} Z`
}

/** The crossing dot reveals as the counter approaches it. */
export const CROSS_SHOW_AT = CHART_BEAT_AT + Math.round(CHART_BEAT_DUR * 0.55)
export const crossReveal = (frame: number) => window01(frame, CROSS_SHOW_AT, CROSS_SHOW_AT + 24)

/* ── copy (refined es-ES; tone calmado premium) ─────────────────────────── */

export const YUSTA03_COPY = {
  eyebrow: 'LOS ECONOMICS: PROGRAMAR vs EJECUTAR',
  programar: 'PROGRAMAR',
  ejecutar: 'EJECUTAR',
  inversion: 'JUSTO LOS INVERSOS',
  counterLabel: 'PRESUPUESTOS PRODUCIDOS',
  crossLabel: 'PUNTO DE CRUCE',
  crossSub: `presupuesto ${euro(CROSS_N, 0)}`,
  regionLabel: 'EL NÚCLEO HUMANO SALE MÁS BARATO',
  axisX: 'nº de presupuestos',
  axisY: 'coste acumulado (€)',
  humanCost: 'coste humano',
  softwareCost: 'coste software',
} as const

/* ── camera rig (multi-step, following the action) ──────────────────────── */

export const YUSTA03_CAM: readonly CameraFraming[] = [
  { at: 0, zoom: 0.95, fx: 960, fy: 540 }, // establishing — the whole stage
  { at: 120, zoom: 1.08, fx: 380, fy: 540, travel: 40 }, // push to the inversion columns
  { at: 300, zoom: 1.0, fx: 1180, fy: 560, travel: 70 }, // pan right to the chart
  { at: 560, zoom: 1.1, fx: 1520, fy: 470, travel: 60 }, // push into the crossing
  { at: 654, zoom: 0.92, fx: 980, fy: 540, travel: 60 }, // pull back — the whole story
  { at: 690, zoom: 0.92, fx: 980, fy: 540, travel: 36 }, // hold wide as a stable still
]

/* ── captions (screen-space narration, ordered, non-overlapping) ────────── */

export type Yusta03Caption = { text: string; showAt: number; hideAt: number }

export const YUSTA03_CAPTIONS: readonly Yusta03Caption[] = [
  { text: 'Programar a un humano es barato; ejecutarlo, lento y caro.', showAt: 40, hideAt: 230 },
  { text: 'Con el software a medida, los economics son justo los inversos.', showAt: 240, hideAt: 430 },
  { text: '¿Cuántos presupuestos para amortizar un software a medida?', showAt: 440, hideAt: 620 },
  { text: 'Hasta el presupuesto 9.999, el núcleo humano sale más barato.', showAt: 630, hideAt: 744 },
]
