import { BRAND, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type InvoiceLine = {
  /** What was billed. */
  description: string
  /** Units (defaults to 1). */
  qty?: number
  /** Price per unit in the widget currency. */
  price: number
}

export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'draft'

export type InvoiceWidgetProps = {
  /** Invoice number shown in the header (e.g. "INV-0042"). */
  number?: string
  /** Who issued it. */
  from?: string
  /** Who it is billed to. */
  billTo?: string
  /** Issue date, free text. */
  date?: string
  /** Line items. Total is computed from these. */
  items?: InvoiceLine[]
  /** Tax rate (0–1) applied to the subtotal. */
  taxRate?: number
  /** Currency symbol prefixed to every amount. */
  currency?: string
  /** Payment status — sets the badge label + colour. */
  status?: InvoiceStatus
  /** Accent colour for the logo mark + total. */
  accent?: BrandColor
}

const DEFAULT_ITEMS: InvoiceLine[] = [
  { description: 'Diseño de marca', qty: 1, price: 1200 },
  { description: 'Maquetación web', qty: 3, price: 240 },
  { description: 'Sesión de fotos', qty: 1, price: 380 },
]

const STATUS: Record<InvoiceStatus, { label: string; color: BrandColor }> = {
  paid: { label: 'Pagada', color: 'green' },
  pending: { label: 'Pendiente', color: 'orange' },
  overdue: { label: 'Vencida', color: 'red' },
  draft: { label: 'Borrador', color: 'teal' },
}

/**
 * InvoiceWidget — a clean neumorphic abstraction of an invoice.
 * ─────────────────────────────────────────────────────────────
 * A calm, airy receipt: a small accent dot beside the issuer, a status dot,
 * a big "Factura" title block, a two-column from / to, plain line rows split
 * by hairlines (no heavy boxes) and a quiet subtotal / tax block under one big
 * accent total. Amounts are derived from `items` so the maths always adds up.
 * Re-lit live by the active NeoTheme like every other neo widget.
 */
export function InvoiceWidget({
  number = 'INV-0042',
  from = 'AiKit Studio',
  billTo = 'Acme S.L.',
  date = '29 May 2026',
  items = DEFAULT_ITEMS,
  taxRate = 0.21,
  currency = '€',
  status = 'pending',
  accent = 'blue',
}: InvoiceWidgetProps) {
  const theme = useNeoTheme()
  const accentColor = BRAND[accent]
  const badge = STATUS[status]
  const badgeColor = BRAND[badge.color]

  const subtotal = items.reduce((sum, it) => sum + it.price * (it.qty ?? 1), 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const money = (n: number) =>
    `${currency}${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const hairline = `1px solid ${theme.gridLine}`

  return (
    <NeoCard width={340} center={false} padding={32} radius={28} style={{ gap: 26 }}>
      {/* Top line: issuer (accent dot) ·  status (dot + label). */}
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

      {/* Title block: big "Factura" + number / date. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.6, color: theme.textStrong }}>
          Factura
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

      {/* Line items: plain rows divided by hairlines, no box. */}
      <div style={{ display: 'flex', flexDirection: 'column', borderTop: hairline }}>
        {items.map((it, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 0',
              borderBottom: hairline,
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
        ))}
      </div>

      {/* Totals: muted subtotal + tax, then one big accent total. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Row label="Subtotal" value={money(subtotal)} theme={theme} />
        <Row label={`IVA (${Math.round(taxRate * 100)}%)`} value={money(tax)} theme={theme} />
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 13, color: theme.textMuted }}>Total</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: accentColor, letterSpacing: -0.8 }}>
            {money(total)}
          </span>
        </div>
      </div>
    </NeoCard>
  )
}

function Party({
  label,
  name,
  theme,
}: {
  label: string
  name: string
  theme: ReturnType<typeof useNeoTheme>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: theme.textMuted }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.textStrong }}>{name}</span>
    </div>
  )
}

function Row({
  label,
  value,
  theme,
}: {
  label: string
  value: string
  theme: ReturnType<typeof useNeoTheme>
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: theme.textStrong }}>{value}</span>
    </div>
  )
}
