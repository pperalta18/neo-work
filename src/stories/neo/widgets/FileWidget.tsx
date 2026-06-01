import type { CSSProperties } from 'react'
import { BRAND, elevation, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'

/**
 * FileWidget — neumorphic file illustrations.
 * ───────────────────────────────────────────
 * A raised "page" plate carved with a recessed preview area, a folded dog-ear
 * corner, and a coloured extension badge. The preview glyph + accent colour are
 * driven by the file kind (PDF text lines, Excel grid, slide, image, code,
 * archive), so a whole stack of file types shares one visual language.
 *
 * Lit by the active NeoTheme (Storybook toolbar) like every other neo widget.
 */

/** Each preview "ink" style — what the recessed area on the page draws. */
type Glyph = 'lines' | 'grid' | 'slide' | 'image' | 'code' | 'archive'

export type FileKind =
  | 'pdf'
  | 'docx'
  | 'txt'
  | 'xlsx'
  | 'csv'
  | 'pptx'
  | 'png'
  | 'jpg'
  | 'json'
  | 'zip'

type FileType = { label: string; color: BrandColor; glyph: Glyph }

/** The file-type registry: extension label + brand accent + preview glyph. */
export const FILE_TYPES: Record<FileKind, FileType> = {
  pdf: { label: 'PDF', color: 'red', glyph: 'lines' },
  docx: { label: 'DOC', color: 'blue', glyph: 'lines' },
  txt: { label: 'TXT', color: 'teal', glyph: 'lines' },
  xlsx: { label: 'XLS', color: 'green', glyph: 'grid' },
  csv: { label: 'CSV', color: 'teal', glyph: 'grid' },
  pptx: { label: 'PPT', color: 'orange', glyph: 'slide' },
  png: { label: 'PNG', color: 'purple', glyph: 'image' },
  jpg: { label: 'JPG', color: 'pink', glyph: 'image' },
  json: { label: 'JSON', color: 'violet', glyph: 'code' },
  zip: { label: 'ZIP', color: 'yellow', glyph: 'archive' },
}

export const FILE_KINDS = Object.keys(FILE_TYPES) as FileKind[]

export type FileWidgetProps = {
  /** Which file type to draw (sets accent colour + preview glyph + label). */
  kind?: FileKind
  /** Page width in px; height follows a portrait page ratio. */
  width?: number
  /** Caption under the page. Defaults to a sample name for the kind. */
  name?: string
  /** Show the filename caption under the page. */
  showName?: boolean
  style?: CSSProperties
}

const ASPECT = 1.28 // page height / width (portrait sheet)

export function FileWidget({
  kind = 'pdf',
  width = 150,
  name,
  showName = true,
  style,
}: FileWidgetProps) {
  const theme = useNeoTheme()
  const type = FILE_TYPES[kind]
  const accent = BRAND[type.color]

  const height = Math.round(width * ASPECT)
  const fold = Math.round(width * 0.24)
  const pad = Math.round(width * 0.12)
  const radius = Math.round(width * 0.1)

  // Raised page; the recessed window the preview ink sits in.
  const page = elevation(theme, { depth: 'raised', distance: 9, blur: 20, radius })
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: radius * 0.55 })

  const caption = name ?? SAMPLE_NAMES[kind]

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        fontFamily: TEXT_FONT,
        ...style,
      }}
    >
      <div
        style={{
          position: 'relative',
          width,
          height,
          boxSizing: 'border-box',
          padding: pad,
          paddingTop: fold * 0.7,
          display: 'flex',
          flexDirection: 'column',
          ...page,
          // Square the corner that gets folded.
          borderTopRightRadius: 2,
        }}
      >
        {/* Folded dog-ear corner (top-right). */}
        <Fold size={fold} surface={theme.surface} shadow={theme.shadow} highlight={theme.highlight} />

        {/* Recessed preview window with the type glyph drawn in the accent. */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: pad * 0.8,
            ...well,
          }}
        >
          <Preview glyph={type.glyph} accent={accent} muted={theme.textMuted} />
        </div>

        {/* Extension badge. */}
        <div
          style={{
            alignSelf: 'flex-start',
            marginTop: pad * 0.7,
            padding: `${Math.round(width * 0.025)}px ${Math.round(width * 0.06)}px`,
            borderRadius: 999,
            background: accent,
            color: '#fff',
            fontSize: Math.max(9, Math.round(width * 0.085)),
            fontWeight: 700,
            letterSpacing: 0.6,
            lineHeight: 1,
          }}
        >
          {type.label}
        </div>
      </div>

      {showName && (
        <span style={{ fontSize: 13, color: theme.textMuted, maxWidth: width + 40, textAlign: 'center' }}>
          {caption}
        </span>
      )}
    </div>
  )
}

/**
 * The dog-ear: a shaded notch where the corner is "missing" plus a folded leaf
 * lying over it, lifted with a soft drop-shadow.
 */
function Fold({
  size,
  surface,
  shadow,
  highlight,
}: {
  size: number
  surface: string
  shadow: string
  highlight: string
}) {
  return (
    <div style={{ position: 'absolute', top: 0, right: 0, width: size, height: size }}>
      {/* Notch — the recessed gap behind the fold. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
          background: shadow,
        }}
      />
      {/* Leaf — the folded-down page corner. */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          clipPath: 'polygon(0 0, 100% 100%, 0 100%)',
          background: `linear-gradient(135deg, ${highlight}, ${surface})`,
          filter: `drop-shadow(-2px 2px 3px ${shadow})`,
        }}
      />
    </div>
  )
}

/** The accent-coloured ink inside the preview window, per glyph kind. */
function Preview({ glyph, accent, muted }: { glyph: Glyph; accent: string; muted: string }) {
  switch (glyph) {
    case 'grid':
      return (
        <div
          style={{
            width: '100%',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridAutoRows: '1fr',
            gap: 3,
            aspectRatio: '1 / 0.92',
          }}
        >
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              style={{
                borderRadius: 2,
                background: i === 4 ? accent : `${accent}33`,
              }}
            />
          ))}
        </div>
      )
    case 'slide':
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ height: 6, borderRadius: 3, width: '70%', background: accent }} />
          <div style={{ flex: 1, minHeight: 34, borderRadius: 4, background: `${accent}33` }} />
        </div>
      )
    case 'image':
      return (
        <div
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: '1 / 0.78',
            borderRadius: 4,
            background: `${accent}26`,
            overflow: 'hidden',
          }}
        >
          {/* Sun */}
          <div
            style={{
              position: 'absolute',
              top: '18%',
              right: '20%',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: accent,
            }}
          />
          {/* Mountains */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '55%',
              clipPath: 'polygon(0 100%, 28% 35%, 50% 70%, 72% 20%, 100% 100%)',
              background: accent,
            }}
          />
        </div>
      )
    case 'code':
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {[0.5, 0.85, 0.7, 0.4].map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 6, paddingLeft: (i % 3) * 10 }}>
              <div style={{ height: 5, width: 5, borderRadius: 2, background: accent }} />
              <div style={{ height: 5, flex: w, borderRadius: 3, background: `${accent}40` }} />
            </div>
          ))}
        </div>
      )
    case 'archive':
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 9,
                borderRadius: 2,
                background: i % 2 === 0 ? accent : `${accent}40`,
                marginLeft: i % 2 === 0 ? -6 : 6,
              }}
            />
          ))}
        </div>
      )
    case 'lines':
    default:
      return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[1, 0.92, 0.96, 0.6].map((w, i) => (
            <div
              key={i}
              style={{
                height: 5,
                width: `${w * 100}%`,
                borderRadius: 3,
                background: i === 0 ? accent : `${muted}66`,
              }}
            />
          ))}
        </div>
      )
  }
}

const SAMPLE_NAMES: Record<FileKind, string> = {
  pdf: 'Informe_anual.pdf',
  docx: 'Propuesta.docx',
  txt: 'Notas.txt',
  xlsx: 'Ventas_Q3.xlsx',
  csv: 'export.csv',
  pptx: 'Keynote.pptx',
  png: 'Captura.png',
  jpg: 'Portada.jpg',
  json: 'config.json',
  zip: 'Recursos.zip',
}
