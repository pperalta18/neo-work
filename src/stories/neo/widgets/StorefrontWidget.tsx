import { BRAND, elevation, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'
import { NeoButton } from '../NeoButton'

export type StorefrontProduct = {
  /** Product name (kept short — one line). */
  name: string
  /** Price, free text incl. currency (e.g. "€24"). */
  price: string
  /** Optional ribbon chip ("Nuevo", "-20%"…). */
  tag?: string
  /** Hue of the placeholder image block + tag chip. */
  color?: BrandColor
}

export type StorefrontWidgetProps = {
  /** Store name shown bold in the header. */
  store?: string
  /** Items in the cart (the little chip count). */
  cart?: number
  /** The product grid. 4–6 reads best at width 460. */
  products?: StorefrontProduct[]
}

const DEFAULT_PRODUCTS: StorefrontProduct[] = [
  { name: 'Vela de soja', price: '€18', color: 'orange', tag: 'Nuevo' },
  { name: 'Taza artesana', price: '€14', color: 'teal' },
  { name: 'Tote de lino', price: '€24', color: 'green' },
  { name: 'Cuaderno kraft', price: '€9', color: 'violet', tag: '-20%' },
  { name: 'Jabón natural', price: '€7', color: 'pink' },
  { name: 'Set de postales', price: '€12', color: 'blue' },
]

type Theme = ReturnType<typeof useNeoTheme>

/**
 * StorefrontWidget — a tidy neumorphic e-commerce card.
 * ─────────────────────────────────────────────────────
 * "AiKit crea y lanza tu e-commerce": a store name + a recessed cart chip with
 * a live count, then a grid of raised product tiles. Each tile gets a soft
 * gradient placeholder (hue per product), a name, a bold price and a round
 * add button. One tile wears a tinted "Nuevo" / "-20%" ribbon. Re-lit live by
 * the active NeoTheme like the rest of the gallery.
 */
export function StorefrontWidget({
  store = 'La Tiendita',
  cart = 3,
  products = DEFAULT_PRODUCTS,
}: StorefrontWidgetProps) {
  const theme = useNeoTheme()

  return (
    <NeoCard width={460} center={false} padding={26} radius={30} style={{ gap: 20 }}>
      {/* Header: store name + tagline · cart chip with count. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>
            {store}
          </span>
          <span style={{ fontSize: 11.5, color: theme.textMuted, letterSpacing: -0.2 }}>
            AiKit crea y lanza tu e-commerce
          </span>
        </div>
        <CartChip count={cart} theme={theme} />
      </div>

      {/* Product grid — 3 cols, soft raised tiles. */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {products.map((p, i) => (
          <ProductTile key={i} product={p} theme={theme} />
        ))}
      </div>
    </NeoCard>
  )
}

function CartChip({ count, theme }: { count: number; theme: Theme }) {
  const chip = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 12 })
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 13px',
        flexShrink: 0,
        ...chip,
      }}
    >
      <CartGlyph color={theme.textMuted} />
      <span style={{ fontSize: 13, fontWeight: 700, color: theme.textStrong, letterSpacing: -0.2 }}>
        {count}
      </span>
    </div>
  )
}

function ProductTile({ product, theme }: { product: StorefrontProduct; theme: Theme }) {
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 10, radius: 16 })
  const hue = BRAND[product.color ?? 'blue']

  return (
    <div
      style={{
        position: 'relative',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      {/* Placeholder image: soft hue gradient well. */}
      <div
        style={{
          position: 'relative',
          height: 74,
          borderRadius: 11,
          background: `linear-gradient(150deg, ${hue}30 0%, ${hue}14 55%, ${theme.surface} 100%)`,
          overflow: 'hidden',
        }}
      >
        {/* Faint mountain/photo motif so it reads as an image slot. */}
        <PhotoGlyph color={hue} />
        {product.tag && (
          <span
            style={{
              position: 'absolute',
              top: 7,
              left: 7,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: 0.3,
              color: '#fff',
              background: hue,
              borderRadius: 7,
              padding: '2px 7px',
            }}
          >
            {product.tag}
          </span>
        )}
      </div>

      {/* Name. */}
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 500,
          color: theme.textStrong,
          letterSpacing: -0.2,
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {product.name}
      </span>

      {/* Price · add button. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.textStrong, letterSpacing: -0.4 }}>
          {product.price}
        </span>
        <NeoButton size="sm" icon="plus" iconOnly accent distance={4} blur={8} radius={11} />
      </div>
    </div>
  )
}

/* ── Inline glyphs (no curated icon fits the cart / photo motif) ── */

function CartGlyph({ color }: { color: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'block' }}
    >
      <path d="M3 4h2l2.2 11.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.2L20.5 7H6.2" />
      <circle cx="9.5" cy="20" r="1.2" />
      <circle cx="18" cy="20" r="1.2" />
    </svg>
  )
}

function PhotoGlyph({ color }: { color: string }) {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ position: 'absolute', bottom: 8, right: 9, opacity: 0.55 }}
    >
      <circle cx="8" cy="8.5" r="1.6" />
      <path d="M3.5 17l5-5.5 4 4 3-3 5 4.5" />
    </svg>
  )
}
