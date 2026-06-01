import { useState } from 'react'
import { elevation, KIT_BLUE, BRAND, TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type POSItem = {
  /** Nombre del producto en el ticket. */
  name: string
  /** Unidades vendidas. */
  qty: number
  /** Precio por unidad. */
  price: number
}

export type POSWidgetProps = {
  /** Líneas del ticket. El total se calcula solo a partir de esto. */
  items?: POSItem[]
  /** Símbolo de moneda antepuesto a cada importe. */
  currency?: string
  /** Tipo de IVA (0–1) aplicado al subtotal. */
  taxRate?: number
  /** Etiqueta del chip de cabecera. */
  cashier?: string
  /** Muestra el aviso "funciona con o sin internet". */
  offlineHint?: boolean
}

const DEFAULT_ITEMS: POSItem[] = [
  { name: 'Café con leche', qty: 2, price: 2.5 },
  { name: 'Croissant', qty: 1, price: 1.8 },
  { name: 'Zumo natural', qty: 1, price: 3.2 },
  { name: 'Tostada tomate', qty: 2, price: 2.4 },
]

type Theme = ReturnType<typeof useNeoTheme>

/**
 * POSWidget — un terminal de punto de venta neumórfico.
 * ──────────────────────────────────────────────────────
 * Abre caja con NIP y cobra en 2 min. A la izquierda, el ticket: un pozo
 * hundido con las líneas, una hairline y el total grande en azul. A la
 * derecha, un teclado numérico de plaquitas realzadas y un botón azul macizo
 * "Cobrar". Los importes salen de `items`, así que la cuenta siempre cuadra.
 * Se re-ilumina solo con el NeoTheme activo, como toda la familia.
 */
export function POSWidget({
  items = DEFAULT_ITEMS,
  currency = '€',
  taxRate = 0.1,
  cashier = 'Cajero 02',
  offlineHint = true,
}: POSWidgetProps) {
  const theme = useNeoTheme()

  const subtotal = items.reduce((sum, it) => sum + it.price * it.qty, 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax

  const money = (n: number) =>
    `${currency}${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const hairline = `1px solid ${theme.gridLine}`
  const well = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })

  return (
    <NeoCard width={480} center={false} padding={26} radius={30} style={{ gap: 20 }}>
      {/* Cabecera: chip "Caja abierta" + cajero, y aviso offline opcional. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 11px 6px 9px',
            borderRadius: 999,
            ...elevation(theme, { depth: 'recessed', distance: 2, blur: 6, radius: 999 }),
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: BRAND.green,
              boxShadow: `0 0 0 3px ${BRAND.green}22`,
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color: theme.textStrong }}>
            Caja abierta
          </span>
          <span style={{ fontSize: 12, color: theme.textMuted }}>· {cashier}</span>
        </div>

        {offlineHint && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: theme.textMuted }}>
            <WifiGlyph />
            con o sin internet
          </span>
        )}
      </div>

      {/* Dos columnas: ticket | teclado. */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'stretch' }}>
        {/* IZQUIERDA — el ticket en un pozo hundido. */}
        <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14, padding: 16, ...well }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {items.map((it, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'baseline', gap: 7, minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: theme.textMuted,
                      flexShrink: 0,
                    }}
                  >
                    ×{it.qty}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: theme.textStrong,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {it.name}
                  </span>
                </span>
                <span style={{ fontSize: 13, color: theme.textStrong, whiteSpace: 'nowrap' }}>
                  {money(it.price * it.qty)}
                </span>
              </div>
            ))}
          </div>

          <div style={{ borderTop: hairline, display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 12 }}>
            <SummaryRow label="Subtotal" value={money(subtotal)} theme={theme} />
            <SummaryRow label={`IVA (${Math.round(taxRate * 100)}%)`} value={money(tax)} theme={theme} />
          </div>

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 10,
              paddingTop: 4,
            }}
          >
            <span style={{ fontSize: 12, color: theme.textMuted }}>Total</span>
            <span style={{ fontSize: 29, fontWeight: 700, color: KIT_BLUE, letterSpacing: -0.8 }}>
              {money(total)}
            </span>
          </div>
        </div>

        {/* DERECHA — el teclado numérico + Cobrar. */}
        <Keypad theme={theme} total={money(total)} />
      </div>
    </NeoCard>
  )
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'] as const

function Keypad({ theme, total }: { theme: Theme; total: string }) {
  const [draft, setDraft] = useState('')

  const display = draft || '0'

  const press = (k: string) => {
    if (k === 'C') return setDraft('')
    if (k === '⌫') return setDraft((d) => d.slice(0, -1))
    setDraft((d) => (d.length >= 6 ? d : d + k))
  }

  return (
    <div style={{ flex: '0 0 184px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      {/* Mini-display de lo tecleado (pozo hundido). */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 12px',
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: -0.3,
          color: draft ? theme.textStrong : theme.textMuted,
          fontFamily: TEXT_FONT,
          ...elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 12 }),
        }}
      >
        {display}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {KEYS.map((k) => (
          <KeyPlate key={k} label={k} theme={theme} onPress={() => press(k)} />
        ))}
      </div>

      <PayButton theme={theme} label={`Cobrar ${total}`} />
    </div>
  )
}

function KeyPlate({ label, theme, onPress }: { label: string; theme: Theme; onPress: () => void }) {
  const [pressed, setPressed] = useState(false)
  const isAction = label === 'C' || label === '⌫'
  const color = isAction ? theme.textMuted : theme.textStrong

  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onPress}
      style={{
        border: 'none',
        cursor: 'pointer',
        height: 46,
        fontSize: 17,
        fontWeight: 600,
        letterSpacing: -0.3,
        color,
        fontFamily: TEXT_FONT,
        transition: 'box-shadow 0.12s ease, transform 0.12s ease',
        transform: pressed ? 'translateY(1px)' : 'none',
        ...elevation(theme, { depth: pressed ? 'recessed' : 'raised', distance: 4, blur: 9, radius: 13 }),
      }}
    >
      {label}
    </button>
  )
}

function PayButton({ theme, label }: { theme: Theme; label: string }) {
  const [pressed, setPressed] = useState(false)
  return (
    <button
      type="button"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      style={{
        border: 'none',
        cursor: 'pointer',
        marginTop: 2,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 50,
        fontSize: 15,
        fontWeight: 700,
        letterSpacing: -0.3,
        color: '#fff',
        fontFamily: TEXT_FONT,
        transition: 'box-shadow 0.12s ease, transform 0.12s ease',
        transform: pressed ? 'translateY(1px)' : 'none',
        ...elevation(theme, { depth: pressed ? 'recessed' : 'raised', distance: 5, blur: 11, radius: 15 }),
        backgroundColor: KIT_BLUE,
      }}
    >
      <CardGlyph />
      {label}
    </button>
  )
}

function SummaryRow({ label, value, theme }: { label: string; value: string; theme: Theme }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
      <span style={{ color: theme.textMuted }}>{label}</span>
      <span style={{ color: theme.textStrong }}>{value}</span>
    </div>
  )
}

function WifiGlyph() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 8.5a16 16 0 0 1 20 0" />
      <path d="M5 12a11 11 0 0 1 14 0" />
      <path d="M8.5 15.5a6 6 0 0 1 7 0" />
      <circle cx="12" cy="19" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  )
}

function CardGlyph() {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 9.5h19" />
      <path d="M6 15h4" />
    </svg>
  )
}
