import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserIcon, CodeIcon, ArrowDataTransferHorizontalIcon } from '@hugeicons-pro/core-stroke-standard'
import { BRAND, KIT_BLUE, elevation, lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import { inkReveal } from './aikit/trace'
import { euro } from './aikit/widgetScript'
import {
  budgetAt,
  BUDGET_TICKS,
  CHART,
  CHART_BEAT_AT,
  CHART_BEAT_END,
  CHART_MAX_BUDGET,
  COLUMN_SHOW,
  COLUMNS,
  COST_MAX,
  counterText,
  CROSS_N,
  CROSS_POINT,
  crossReveal,
  type EconBar,
  type EconColumn,
  humanCostAt,
  humanProjPath,
  humanSolidPath,
  INVERSION_AT,
  pointHuman,
  pointSoftware,
  savingsBandPath,
  softwareCostAt,
  softwareProjPath,
  softwareSolidPath,
  xOfBudget,
  yOfCost,
  YUSTA03_CAM,
  YUSTA03_CAPTIONS,
  YUSTA03_COPY,
} from './yusta03Script'

export { YUSTA03_DURATION } from './yusta03Script'

/**
 * Yusta03Economics — «los economics: humano vs software» (25 s · 1920×1080).
 * ───────────────────────────────────────────────────────────────────────────
 * Apoyo de la charla de Yusta. Two columns show the inverted economics of a
 * human core (cheap to program, dear to execute) vs bespoke software (dear to
 * program, near-free to execute); a cumulative-cost chart then runs the
 * amortización counter up to 9.999, where the two lines are about to cross — up
 * to that budget the human core was the cheaper option. All choreography lives
 * in yusta03Script.ts; this only spreads it. Absorbs the StatWidget comparison,
 * CounterStat and ChartWidget idioms (ported inline — no Tailwind here).
 */

const theme = lightTheme
const TONE: Record<string, string> = { barato: BRAND.green, caro: BRAND.red }
const HUMAN_LINE = BRAND.red
const SOFTWARE_LINE = KIT_BLUE

export function Yusta03Economics() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(YUSTA03_CAM, frame, CURVE.standard), frame)

  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong, overflow: 'hidden' }}
    >
      <Fonts />
      {/* faint depth gradient — the shared clean-white core ground */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 66% 62% at 52% 48%, #ffffff 0%, ${theme.surface} 60%, #e9e9f2 100%)`,
        }}
      />

      {/* ── the living scene, shot through the virtual camera ── */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        {/* LA INVERSIÓN — the two columns (left) */}
        <Column column={COLUMNS[0]} x={96} y={246} showAt={COLUMN_SHOW.humano} frame={frame} icon="human" />
        <Column column={COLUMNS[1]} x={96} y={560} showAt={COLUMN_SHOW.software} frame={frame} icon="code" />
        <InversionTie frame={frame} />

        {/* LA AMORTIZACIÓN — the cumulative-cost chart (right) */}
        <ChartHeader frame={frame} />
        <Chart frame={frame} />
      </div>

      {/* ── screen-space rotulación ── */}
      <Eyebrow frame={frame} />
      <Captions frame={frame} />
    </AbsoluteFill>
  )
}

/* ── LA INVERSIÓN: a column (human / software) with two economics bars ───── */

function Column({
  column,
  x,
  y,
  showAt,
  frame,
  icon,
}: {
  column: EconColumn
  x: number
  y: number
  showAt: number
  frame: number
  icon: 'human' | 'code'
}) {
  const enter = ease(frame, showAt, showAt + DUR.reveal)
  if (enter <= 0.001) return null
  const W = 540
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: W,
        padding: '22px 26px 26px',
        ...elevation(theme, { depth: 'raised', distance: 12, blur: 26, radius: 28 }),
        opacity: enter,
        transform: `translateY(${(1 - enter) * 18}px)`,
        zIndex: 20,
      }}
    >
      {/* title row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <span
          style={{
            display: 'grid',
            placeItems: 'center',
            width: 38,
            height: 38,
            borderRadius: 12,
            color: KIT_BLUE,
            ...elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 12 }),
          }}
        >
          <HugeiconsIcon icon={icon === 'human' ? UserIcon : CodeIcon} size={20} color={KIT_BLUE} strokeWidth={1.8} />
        </span>
        <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: 0.4, color: theme.textStrong }}>
          {column.title}
        </span>
      </div>

      <BarRow bar={column.programar} showAt={showAt + 8} frame={frame} />
      <div style={{ height: 14 }} />
      <BarRow bar={column.ejecutar} showAt={showAt + 16} frame={frame} />
    </div>
  )
}

function BarRow({ bar, showAt, frame }: { bar: EconBar; showAt: number; frame: number }) {
  const enter = ease(frame, showAt, showAt + DUR.base)
  const grow = ease(frame, showAt + 4, showAt + 4 + DUR.grand, CURVE.standard)
  const c = TONE[bar.tone]
  const TRACK_W = 488
  return (
    <div style={{ opacity: enter }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 1.6, color: theme.textMuted }}>{bar.label}</span>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: c }}>
          {bar.tone}
        </span>
      </div>
      {/* the bar track + fill (StatWidget comparison idiom) */}
      <div
        style={{
          position: 'relative',
          width: TRACK_W,
          height: 30,
          borderRadius: 10,
          ...elevation(theme, { depth: 'recessed', distance: 3, blur: 9, radius: 10 }),
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: TRACK_W * bar.magnitude * grow,
            borderRadius: 10,
            background: `linear-gradient(90deg, ${c}cc, ${c})`,
            boxShadow: `0 0 14px ${c}40`,
          }}
        />
      </div>
      {/* the figure + qualifier */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 9 }}>
        <span style={{ fontSize: 21, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>{bar.value}</span>
        <span style={{ fontSize: 13, color: theme.textMuted }}>· {bar.sub}</span>
      </div>
    </div>
  )
}

/** The "justo los inversos" tie between the two stacked columns. */
function InversionTie({ frame }: { frame: number }) {
  const enter = ease(frame, INVERSION_AT, INVERSION_AT + DUR.reveal)
  if (enter <= 0.001) return null
  const c = BRAND.violet
  return (
    <div
      style={{
        position: 'absolute',
        left: 96 + 540 / 2 - 130,
        top: 246 + 288 + 8,
        width: 260,
        display: 'grid',
        placeItems: 'center',
        zIndex: 25,
        opacity: enter,
        transform: `translateY(${(1 - enter) * -10}px)`,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 16px',
          borderRadius: 999,
          background: `${c}16`,
          color: c,
          fontSize: 13.5,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={17} color={c} strokeWidth={2} />
        {YUSTA03_COPY.inversion}
      </span>
    </div>
  )
}

/* ── LA AMORTIZACIÓN: chart header (counter + cost readouts) ─────────────── */

function ChartHeader({ frame }: { frame: number }) {
  const enter = ease(frame, CHART_BEAT_AT - 24, CHART_BEAT_AT - 24 + DUR.reveal)
  if (enter <= 0.001) return null
  const running = frame >= CHART_BEAT_AT && frame < CHART_BEAT_END
  return (
    <div style={{ position: 'absolute', left: CHART.x, top: 132, width: CHART.w, opacity: enter, zIndex: 30 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        {/* the amortización counter — the hero number (CounterStat idiom) */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.textMuted }}>
            {YUSTA03_COPY.counterLabel}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 76,
              fontWeight: 700,
              letterSpacing: -2,
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
              color: theme.textStrong,
              transform: `scale(${running ? 1 + 0.012 * Math.sin(frame / 3) : 1})`,
              transformOrigin: '0% 50%',
            }}
          >
            {counterText(frame)}
          </div>
        </div>

        {/* live cumulative cost readouts */}
        <div style={{ display: 'flex', gap: 16 }}>
          <CostReadout label={YUSTA03_COPY.humanCost} value={humanCostAt(frame)} color={HUMAN_LINE} />
          <CostReadout label={YUSTA03_COPY.softwareCost} value={softwareCostAt(frame)} color={SOFTWARE_LINE} />
        </div>
      </div>
    </div>
  )
}

function CostReadout({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        minWidth: 196,
        padding: '12px 16px',
        ...elevation(theme, { depth: 'raised', distance: 7, blur: 16, radius: 16 }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.4, color: theme.textMuted }}>{label}</span>
      </div>
      <div
        style={{
          marginTop: 6,
          fontSize: 26,
          fontWeight: 700,
          letterSpacing: -0.6,
          fontVariantNumeric: 'tabular-nums',
          color: theme.textStrong,
        }}
      >
        {euro(value, 0)} €
      </div>
    </div>
  )
}

/* ── LA AMORTIZACIÓN: the cumulative-cost chart (ChartWidget idiom) ──────── */

function Chart({ frame }: { frame: number }) {
  const enter = ease(frame, CHART_BEAT_AT - 30, CHART_BEAT_AT - 30 + DUR.grand)
  if (enter <= 0.001) return null
  const playN = budgetAt(frame)
  const cross = crossReveal(frame)
  const head = playN > 0 ? pointHuman(playN) : null

  const yGrid = [0, 80_000, 160_000, COST_MAX]

  return (
    <svg
      width={STAGE_W()}
      height={1080}
      style={{ position: 'absolute', inset: 0, overflow: 'visible', zIndex: 22, opacity: enter }}
    >
      {/* plot frame */}
      <rect x={CHART.x} y={CHART.y} width={CHART.w} height={CHART.h} fill="none" stroke={theme.textMuted} strokeWidth={1} opacity={0.18} rx={8} />

      {/* horizontal cost gridlines */}
      {yGrid.map((c) => (
        <line key={`gy${c}`} x1={CHART.x} y1={yOfCost(c)} x2={CHART.x + CHART.w} y2={yOfCost(c)} stroke={theme.textMuted} strokeWidth={1} opacity={0.1} />
      ))}
      {/* budget axis ticks */}
      {BUDGET_TICKS.map((n) => (
        <g key={`gx${n}`}>
          <line x1={xOfBudget(n)} y1={CHART.y} x2={xOfBudget(n)} y2={CHART.y + CHART.h} stroke={theme.textMuted} strokeWidth={1} opacity={0.08} />
          <text x={xOfBudget(n)} y={CHART.y + CHART.h + 26} textAnchor="middle" fontSize={14} fill={theme.textMuted} fontFamily={BODY_FONT}>
            {euro(n, 0)}
          </text>
        </g>
      ))}

      {/* savings band — where the human core wins */}
      <path d={savingsBandPath(frame)} fill={BRAND.green} opacity={0.1} />

      {/* projections (faint dashed, where each line is heading) */}
      <path d={humanProjPath(frame)} fill="none" stroke={HUMAN_LINE} strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" opacity={0.3} />
      <path d={softwareProjPath(frame)} fill="none" stroke={SOFTWARE_LINE} strokeWidth={2} strokeDasharray="3 7" strokeLinecap="round" opacity={0.3} />

      {/* the lived solid lines, drawn up to the counter */}
      <path d={softwareSolidPath(frame)} fill="none" stroke={SOFTWARE_LINE} strokeWidth={3.4} strokeLinecap="round" {...inkReveal(1)} />
      <path d={humanSolidPath(frame)} fill="none" stroke={HUMAN_LINE} strokeWidth={3.4} strokeLinecap="round" {...inkReveal(1)} />

      {/* the playhead head dot on the human line */}
      {head && <circle cx={head.x} cy={head.y} r={6} fill={HUMAN_LINE} />}

      {/* PUNTO DE CRUCE — the crossing */}
      {cross > 0.001 && (
        <g opacity={cross}>
          <line x1={CROSS_POINT.x} y1={CHART.y} x2={CROSS_POINT.x} y2={CHART.y + CHART.h} stroke={theme.textStrong} strokeWidth={1} strokeDasharray="4 5" opacity={0.4} />
          <circle cx={CROSS_POINT.x} cy={CROSS_POINT.y} r={11} fill="none" stroke={theme.textStrong} strokeWidth={2} />
          <circle cx={CROSS_POINT.x} cy={CROSS_POINT.y} r={4.5} fill={theme.textStrong} />
          <text x={CROSS_POINT.x} y={CROSS_POINT.y - 26} textAnchor="middle" fontSize={15} fontWeight={700} fill={theme.textStrong} fontFamily={BODY_FONT} letterSpacing={1}>
            {YUSTA03_COPY.crossLabel}
          </text>
          <text x={CROSS_POINT.x} y={CROSS_POINT.y - 8} textAnchor="middle" fontSize={13} fill={theme.textMuted} fontFamily={BODY_FONT}>
            {YUSTA03_COPY.crossSub}
          </text>
        </g>
      )}

      {/* axis labels */}
      <text x={CHART.x + CHART.w / 2} y={CHART.y + CHART.h + 50} textAnchor="middle" fontSize={14} fontWeight={600} fill={theme.textMuted} fontFamily={BODY_FONT}>
        {YUSTA03_COPY.axisX}
      </text>
      <text x={CHART.x - 16} y={CHART.y - 14} textAnchor="start" fontSize={14} fontWeight={600} fill={theme.textMuted} fontFamily={BODY_FONT}>
        {YUSTA03_COPY.axisY}
      </text>

      {/* the human-cheaper region label, set under the band */}
      <RegionLabel frame={frame} />
    </svg>
  )
}

function RegionLabel({ frame }: { frame: number }) {
  const enter = ease(frame, CHART_BEAT_AT + 80, CHART_BEAT_AT + 80 + DUR.reveal)
  if (enter <= 0.001) return null
  const midN = Math.min(CROSS_N * 0.46, CHART_MAX_BUDGET)
  const x = xOfBudget(midN)
  const y = (pointHuman(midN).y + pointSoftware(midN).y) / 2
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={13.5} fontWeight={700} fill={BRAND.green} fontFamily={BODY_FONT} letterSpacing={0.6} opacity={enter * 0.95}>
      {YUSTA03_COPY.regionLabel}
    </text>
  )
}

/* ── screen-space rotulación ─────────────────────────────────────────────── */

function Eyebrow({ frame }: { frame: number }) {
  const enter = ease(frame, 16, 16 + DUR.reveal)
  return (
    <div
      style={{ position: 'absolute', left: 96, top: 46, fontSize: 12.5, fontWeight: 600, letterSpacing: 2.4, color: theme.textMuted, opacity: 0.78 * enter }}
    >
      {YUSTA03_COPY.eyebrow}
    </div>
  )
}

function Captions({ frame }: { frame: number }) {
  return (
    <>
      {YUSTA03_CAPTIONS.map((c) => {
        const enter = ease(frame, c.showAt, c.showAt + 12)
        const exit = 1 - ease(frame, c.hideAt - 10, c.hideAt)
        const p = enter * exit
        if (p <= 0.001) return null
        return (
          <div
            key={c.showAt}
            style={{ position: 'absolute', left: '50%', transform: `translate(-50%, ${(1 - enter) * 10}px)`, top: 988, maxWidth: 1280, textAlign: 'center', fontSize: 26, fontWeight: 500, letterSpacing: -0.3, lineHeight: 1.3, color: theme.textStrong, opacity: 0.9 * p }}
          >
            {c.text}
          </div>
        )
      })}
    </>
  )
}

/* stage width helper (kept a fn so the svg always spans the full frame) */
function STAGE_W() {
  return 1920
}
