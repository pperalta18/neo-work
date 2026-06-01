import { BRAND, elevation, KIT_BLUE, type BrandColor } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type DropzoneFile = {
  /** Filename shown on the chip. */
  name: string
  /** Human-readable size, e.g. "2,4 MB". */
  size: string
  /** File type tag — PDF / XLSX / JPG / … (colours itself). */
  type: string
  /** Upload progress, 0–100. 100 shows a green check instead of the bar. */
  progress: number
}

export type DropzoneWidgetProps = {
  /** Big headline inside the dropzone. */
  title?: string
  /** Caption under the headline. */
  hint?: string
  /** Uploaded / in-flight file chips listed below the zone. */
  files?: DropzoneFile[]
}

type Theme = ReturnType<typeof useNeoTheme>

const DEFAULT_FILES: DropzoneFile[] = [
  { name: 'factura-marzo.pdf', size: '2,4 MB', type: 'PDF', progress: 100 },
  { name: 'gastos-q1.xlsx', size: '845 KB', type: 'XLSX', progress: 62 },
  { name: 'ticket-comida.jpg', size: '1,1 MB', type: 'JPG', progress: 100 },
]

/** Tag colour by file type — falls back to KIT_BLUE for anything unknown. */
const TYPE_COLOR: Record<string, BrandColor> = {
  PDF: 'red',
  XLSX: 'green',
  JPG: 'violet',
  PNG: 'teal',
  DOC: 'orange',
}

/**
 * DropzoneWidget — the "arrástralo todo a AiKit" gesture.
 * ───────────────────────────────────────────────────────
 * A big recessed dropzone with a dashed inner border and a soft round well
 * holding an upload glyph, then a list of raised file chips — colour-tagged by
 * type, with a thin recessed progress track and a green check when they land.
 * Re-lit live by the active NeoTheme like the rest of the gallery.
 */
export function DropzoneWidget({
  title = 'Arrastra tus facturas aquí',
  hint = 'o haz clic para subir · PDF, XLSX, JPG',
  files = DEFAULT_FILES,
}: DropzoneWidgetProps) {
  const theme = useNeoTheme()
  const zone = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })
  const well = elevation(theme, { depth: 'raised', distance: 5, blur: 11, radius: 999 })

  return (
    <NeoCard width={360} center={false} padding={22} radius={28} style={{ gap: 16 }}>
      {/* The dropzone: recessed plate + a dashed inner border, centred glyph. */}
      <div
        style={{
          ...zone,
          position: 'relative',
          padding: '34px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 9,
            borderRadius: 13,
            border: `1.5px dashed ${theme.gridLine}`,
            pointerEvents: 'none',
          }}
        />

        {/* Soft round well holding the upload glyph in KIT_BLUE. */}
        <div
          style={{
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: KIT_BLUE,
            ...well,
          }}
        >
          <UploadGlyph />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 16,
              fontWeight: 600,
              letterSpacing: -0.3,
              color: theme.textStrong,
            }}
          >
            {title}
          </span>
          <span style={{ fontSize: 12, color: theme.textMuted, letterSpacing: -0.1 }}>{hint}</span>
        </div>
      </div>

      {/* Uploaded file chips. */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {files.map((file, i) => (
            <FileChip key={i} file={file} theme={theme} />
          ))}
        </div>
      )}
    </NeoCard>
  )
}

function FileChip({ file, theme }: { file: DropzoneFile; theme: Theme }) {
  const plate = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 14 })
  const track = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 999 })
  const tag = (TYPE_COLOR[file.type.toUpperCase()] as BrandColor) ?? 'blue'
  const tagColor = BRAND[tag]
  const done = file.progress >= 100
  const pct = Math.max(0, Math.min(100, file.progress))

  return (
    <div
      style={{
        ...plate,
        padding: '11px 13px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Coloured file-type tag. */}
      <span
        style={{
          flexShrink: 0,
          width: 42,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 0.4,
          textAlign: 'center',
          color: tagColor,
          background: `${tagColor}1f`,
          borderRadius: 8,
          padding: '7px 0',
        }}
      >
        {file.type.toUpperCase()}
      </span>

      {/* Name + size + progress. */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: theme.textStrong,
              letterSpacing: -0.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {file.name}
          </span>
          <span style={{ flexShrink: 0, fontSize: 11, color: theme.textMuted }}>
            {done ? file.size : `${pct}%`}
          </span>
        </div>

        {/* Recessed track + KIT_BLUE fill. */}
        <div style={{ height: 5, ...track }}>
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 999,
              background: KIT_BLUE,
            }}
          />
        </div>
      </div>

      {/* Green check on completion. */}
      {done && (
        <span style={{ flexShrink: 0, display: 'flex', color: BRAND.green }}>
          <Icon name="check" size={18} color={BRAND.green} strokeWidth={1.8} />
        </span>
      )}
    </div>
  )
}

/** Upload tray + up-arrow glyph, coloured via currentColor. */
function UploadGlyph() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 15V3" />
      <path d="M7.5 7.5 12 3l4.5 4.5" />
      <path d="M4 14v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
    </svg>
  )
}
