import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, TEXT_FONT, elevation, lightTheme, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { DUR, ease } from '../motion'
import { countUp, euro, invoiceTotals, type InvoiceLineSpec, type InvoiceSchedule } from './widgetScript'

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft'

export type InvoiceProps = {
  /** Invoice number shown in the header (e.g. "PRE-0042"). */
  number?: string
  /** Who issued it. */
  from?: string
  /** Who it is billed to. */
  billTo?: string
  /** Issue date, free text. */
  date?: string
  /** Line items. Totals are computed from these. */
  items: readonly InvoiceLineSpec[]
  /** Tax rate (0–1) applied to the subtotal. */
  taxRate?: number
  /** Currency symbol prefixed to every amount. */
  currency?: string
  /** Payment status — sets the badge label + colour. */
  status?: InvoiceStatus
  /** Accent colour for the issuer mark + total. */
  accent?: BrandColor
  /** Big title. Default "Presupuesto" (the doc the pieces materialise). */
  docTitle?: string
  /** Materialisation timeline from invoiceSchedule(). Omit = fully at rest. */
  schedule?: InvoiceSchedule
  width?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

const STATUS: Record<InvoiceStatus, { label: string; color: BrandColor }> = {
  paid: { label: 'Pagada', color: 'green' },
  pending: { label: 'Pendiente', color: 'orange' },
  overdue: { label: 'Vencida', color: 'red' },
  draft: { label: 'Borrador', color: 'teal' },
}

/**
 * Invoice — InvoiceWidget ported inline, frame-driven.
 * ────────────────────────────────────────────────────
 * The mode Prod01/Prod02 use: the calm receipt as a document that
 * materialises — header and parties settle in, the line rows land one by one,
 * the muted subtotal/IVA appear and the big accent total counts up to its
 * figure (the presupuesto writing itself). Pass a `schedule` from
 * invoiceSchedule() to run the beat, omit it for the resting document.
 * Amounts derive from `items` so the maths always adds up. Themed by prop,
 * deterministic per frame.
 */
export function Invoice({
  number = 'PRE-0042',
  from = 'AiKit Studio',
  billTo = 'Acme S.L.',
  date = '17 Jun 2026',
  items,
  taxRate = 0.21,
  currency = '€',
  status = 'draft',
  accent = 'blue',
  docTitle = 'Presupuesto',
  schedule,
  width = 340,
  theme = lightTheme,
  plate = true,
  frame: frameProp,
  style,
}: InvoiceProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const accentColor = BRAND[accent]
  const badge = STATUS[status]
  const badgeColor = BRAND[badge.color]

  const { subtotal, tax, total } = invoiceTotals(items, taxRate)
  const money = (n: number) => `${currency}${euro(n)}`
  const hairline = `1px solid ${theme.gridLine}`

  // Materialisation poses — all 1 (at rest) when no schedule is given.
  const enter = schedule ? ease(frame, schedule.enterAt, schedule.enterAt + DUR.reveal) : 1
  const lineIn = (i: number) =>
    schedule ? ease(frame, schedule.lineAt[i], schedule.lineAt[i] + DUR.base) : 1
  const totalsIn = schedule ? ease(frame, schedule.totalsAt, schedule.totalsAt + DUR.base) : 1
  const totalShown = schedule
    ? countUp(frame, schedule.totalAt, schedule.countFrames, 0, total)
    : total
  const totalIn = schedule ? ease(frame, schedule.totalAt, schedule.totalAt + DUR.quick) : 1

  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 28 })
    : {}

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 32 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 26,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
      {/* Top line: issuer (accent dot) · status (dot + label). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: accentColor }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.textStrong }}>{from}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: badgeColor }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, color: theme.textMuted }}>{badge.label}</span>
        </div>
      </div>

      {/* Title block: big doc title + number / date. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: theme.textStrong }}>
          {docTitle}
        </span>
        <span style={{ fontSize: 13, color: theme.textMuted }}>
          {number} · {date}
        </span>
      </div>

      {/* From / To, two quiet columns. */}
      <div style={{ display: 'flex', gap: 24 }}>
        <Party label="De" name={from} theme={theme} />
        <Party label="Para" name={billTo} theme={theme} />
      </div>

      {/* Line items: plain rows divided by hairlines, landing one by one. */}
      <div style={{ display: 'flex', flexDirection: 'column', borderTop: hairline }}>
        {items.map((it, i) => {
          const land = lineIn(i)
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 12,
                padding: '12px 0',
                borderBottom: hairline,
                opacity: land,
                transform: `translateY(${(1 - land) * 8}px)`,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
                <span style={{ fontSize: 13.5, color: theme.textStrong }}>{it.description}</span>
                <span style={{ fontSize: 11.5, color: theme.textMuted }}>
                  {it.qty ?? 1} × {money(it.price)}
                </span>
              </div>
              <span style={{ fontSize: 13.5, color: theme.textStrong, whiteSpace: 'nowrap' }}>
                {money(it.price * (it.qty ?? 1))}
              </span>
            </div>
          )
        })}
      </div>

      {/* Totals: muted subtotal + tax, then one big accent total counting up. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ opacity: totalsIn, display: 'flex', flexDirection: 'column', gap: 9 }}>
          <Row label="Subtotal" value={money(subtotal)} theme={theme} />
          <Row label={`IVA (${Math.round(taxRate * 100)}%)`} value={money(tax)} theme={theme} />
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 6,
            opacity: totalIn,
          }}
        >
          <span style={{ fontSize: 13, color: theme.textMuted }}>Total</span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: -0.8,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {money(totalShown)}
          </span>
        </div>
      </div>
    </div>
  )
}

function Party({ label, name, theme }: { label: string; name: string; theme: NeoTheme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: theme.textMuted }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.textStrong }}>{name}</span>
    </div>
  )
}

function Row({ label, value, theme }: { label: string; value: string; theme: NeoTheme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: theme.textStrong }}>{value}</span>
    </div>
  )
}
