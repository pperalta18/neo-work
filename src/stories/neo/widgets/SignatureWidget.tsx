import { elevation, KIT_BLUE, BRAND, TEXT_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoButton } from '../NeoButton'
import { NeoCard } from './NeoCard'

export type SignatureWidgetProps = {
  /** Persona que firma — nombre impreso bajo la rúbrica. */
  signer?: string
  /** Cargo / rol bajo el nombre. */
  role?: string
  /** Fecha de la firma (texto libre). */
  date?: string
  /** Título del documento en la cabecera. */
  docTitle?: string
  /** true = firmado (chip verde + sello). false = pendiente (botón Firmar). */
  signed?: boolean
}

type Theme = ReturnType<typeof useNeoTheme>

/**
 * SignatureWidget — firma electrónica integrada sobre un documento.
 * ─────────────────────────────────────────────────────────────────
 * Un "papel" recesado con dos líneas de contrato esqueléticas, una línea de
 * firma de pelo de gato y, encima, una rúbrica cursiva de verdad dibujada como
 * un <path> SVG en azul AiKit. Debajo: nombre impreso, cargo y fecha. Estados:
 * firmado (chip verde "Firmado" + check) o pendiente (botón "Firmar" acento).
 * Re-iluminado en vivo por el NeoTheme activo como el resto de la galería.
 */
export function SignatureWidget({
  signer = 'María López',
  role = 'Directora de Operaciones',
  date = '30 may 2026',
  docTitle = 'Contrato de empleo · María López',
  signed = true,
}: SignatureWidgetProps) {
  const theme = useNeoTheme()
  const paper = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 16 })
  const green = BRAND.green

  return (
    <NeoCard width={360} center={false} padding={28} radius={28} style={{ gap: 20 }}>
      {/* Cabecera: icono de documento + título + estado. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <DocGlyph color={KIT_BLUE} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 0.6,
              color: theme.textMuted,
            }}
          >
            FIRMA ELECTRÓNICA
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: theme.textStrong,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {docTitle}
          </span>
        </div>
      </div>

      {/* El "papel" recesado: contrato + línea de firma + rúbrica. */}
      <div
        style={{
          padding: '20px 22px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          ...paper,
        }}
      >
        {/* Líneas de contrato esqueléticas (barras redondeadas tenues). */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          <SkeletonLine theme={theme} width="100%" />
          <SkeletonLine theme={theme} width="92%" />
          <SkeletonLine theme={theme} width="64%" />
        </div>

        {/* Rúbrica + línea de firma. */}
        <div style={{ position: 'relative', marginTop: 16, height: 52 }}>
          {/* La rúbrica cursiva, posada sobre la línea. */}
          <svg
            viewBox="0 0 260 60"
            width="78%"
            height={50}
            fill="none"
            preserveAspectRatio="xMinYMax meet"
            style={{ position: 'absolute', left: 4, bottom: 6, overflow: 'visible' }}
          >
            <path
              d="M6 44 C 14 18, 22 8, 28 14 C 33 19, 26 40, 22 46 C 20 49, 23 47, 30 40
                 C 42 28, 50 18, 56 24 C 61 29, 52 44, 50 47 C 49 49, 52 46, 62 38
                 C 78 25, 92 30, 96 36 C 99 41, 90 47, 86 44 C 82 41, 96 28, 116 26
                 C 136 24, 150 32, 160 26 C 172 19, 168 8, 178 12 C 188 16, 180 40, 196 36
                 C 210 33, 218 22, 232 30"
              stroke={KIT_BLUE}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pequeño remate / floritura final. */}
            <path
              d="M232 30 C 240 34, 246 30, 252 24"
              stroke={KIT_BLUE}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.85}
            />
          </svg>

          {/* Línea de firma — pelo de gato. */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 4,
              borderBottom: `1px solid ${theme.gridLine}`,
            }}
          />
        </div>

        {/* Nombre impreso + cargo bajo la línea. */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: theme.textStrong }}>{signer}</span>
          <span style={{ fontSize: 11.5, color: theme.textMuted }}>{role}</span>
        </div>
      </div>

      {/* Pie: estado (firmado / pendiente). */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 10.5, letterSpacing: 0.6, color: theme.textMuted }}>FECHA</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.textStrong }}>{date}</span>
        </div>

        {signed ? (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '7px 13px 7px 11px',
              borderRadius: 999,
              background: `${green}1f`,
              color: green,
            }}
          >
            <Icon name="check" size={15} color={green} strokeWidth={2.2} />
            <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: -0.2 }}>
              Firmado · {date}
            </span>
          </div>
        ) : (
          <NeoButton accent size="sm" icon="check" distance={5} blur={11}>
            Firmar
          </NeoButton>
        )}
      </div>
    </NeoCard>
  )
}

/** Barra redondeada tenue que finge una línea de texto del contrato. */
function SkeletonLine({ theme, width }: { theme: Theme; width: string }) {
  return (
    <div
      style={{
        width,
        height: 7,
        borderRadius: 999,
        background: `${theme.textMuted}22`,
      }}
    />
  )
}

/** Glifo de documento con esquina doblada — stroke geométrico simple. */
function DocGlyph({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        fontFamily: TEXT_FONT,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width={22}
        height={22}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 3 H7 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h10 a2 2 0 0 0 2 -2 V8 Z" />
        <path d="M14 3 v5 h5" />
        <path d="M9 17 c2 -3, 4 -3, 6 0" />
      </svg>
    </span>
  )
}
