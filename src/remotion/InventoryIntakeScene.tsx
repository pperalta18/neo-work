/**
 * InventoryIntakeScene — acto 2 de la mini-película E-Commerce.
 * ──────────────────────────────────────────────────────────────────────────
 * "Subimos o conectamos nuestro inventario en Excel". Un wrapper sobre
 * {@link IntakeScene}: una PILA de documentos —`inventario.xlsx` ENCIMA (bien
 * legible) + un PDF de proveedor y un Word asomando detrás— aparece, REPOSA un
 * instante y es absorbida por **DocuSense**, cuya placa se expande a "Procesando
 * documentos…"; de ella brotan fichas de producto — el inventario en crudo se
 * vuelve catálogo. La ropa que se sube casa con la tienda AURELE del cierre.
 * Los documentos de fondo refuerzan el mensaje de DocuSense (Excel, PDF, Word…).
 */

import { elevation, lightTheme, BRAND, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { SpreadsheetWidget } from '@/stories/neo/widgets/SpreadsheetWidget'
import { IntakeScene, intakeDuration } from './IntakeScene'

const theme = lightTheme

type Product = { name: string; price: string; stock: number; color: BrandColor }
const PRODUCTS: Product[] = [
  { name: 'Abrigo de lana', price: '560 €', stock: 12, color: 'teal' },
  { name: 'Chaqueta de piel', price: '420 €', stock: 8, color: 'orange' },
  { name: 'Vaqueros rectos', price: '95 €', stock: 40, color: 'blue' },
  { name: 'Camiseta de lino', price: '35 €', stock: 80, color: 'green' },
  { name: 'Chaqueta de campo', price: '295 €', stock: 18, color: 'violet' },
]

const SHEET: (string | number)[][] = [
  ['Producto', 'Precio', 'Stock'],
  ...PRODUCTS.map((p) => [p.name, p.price, p.stock] as (string | number)[]),
]

export const INVENTORY_INTAKE_DURATION = intakeDuration(PRODUCTS.length)

/** Ficha de producto que brota del núcleo (miniatura + nombre + precio/stock). */
function ProductCard({ product }: { product: Product }) {
  const hue = BRAND[product.color]
  const plate = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 16 })
  return (
    <div
      style={{
        width: 158,
        padding: 11,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div
        style={{
          height: 64,
          borderRadius: 11,
          background: `linear-gradient(150deg, ${hue}33 0%, ${hue}16 55%, ${theme.surface} 100%)`,
        }}
      />
      <span style={{ fontSize: 12.5, fontWeight: 500, color: theme.textStrong, letterSpacing: -0.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {product.name}
      </span>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: theme.textStrong, letterSpacing: -0.4 }}>{product.price}</span>
        <span style={{ fontSize: 10.5, color: theme.textMuted }}>{product.stock} u.</span>
      </div>
    </div>
  )
}

/** Documento de fondo (PDF / Word) que asoma detrás del Excel en la pila. */
function PaperDoc({ kind, title, accent }: { kind: string; title: string; accent: string }) {
  const plate = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 14 })
  return (
    <div style={{ width: 300, background: theme.surface, fontFamily: TEXT_FONT, overflow: 'hidden', ...plate }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 15px', borderBottom: `1px solid ${theme.gridLine}` }}>
        <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.4, color: '#fff', background: accent, padding: '3px 7px', borderRadius: 5 }}>{kind}</span>
        <span style={{ fontSize: 13, color: theme.textStrong, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
      </div>
      <div style={{ padding: '15px 17px', display: 'flex', flexDirection: 'column', gap: 9 }}>
        {[1, 0.92, 0.74, 0.96, 0.58].map((w, i) => (
          <div key={i} style={{ height: 7, borderRadius: 4, width: `${w * 100}%`, background: `${theme.textMuted}2e` }} />
        ))}
      </div>
    </div>
  )
}

export function InventoryIntakeScene() {
  return (
    <IntakeScene
      coreModule="docusense"
      coreStatus="Procesando documentos…"
      sheetScale={0.82}
      sheet={
        <SpreadsheetWidget
          title="inventario.xlsx"
          data={SHEET}
          columns={[{}, { align: 'right' }, { align: 'right', width: 64 }]}
          selected={[1, 0]}
          formulaBar
          headerRow
        />
      }
      backSheets={[
        <PaperDoc key="pdf" kind="PDF" title="catálogo-proveedor.pdf" accent="#E0492F" />,
        <PaperDoc key="doc" kind="DOCX" title="descripciones.docx" accent="#2B66E0" />,
      ]}
      sprouts={PRODUCTS.map((p, i) => <ProductCard key={i} product={p} />)}
    />
  )
}
