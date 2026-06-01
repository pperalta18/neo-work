import { BRAND, elevation, type BrandColor } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type ToastVariant = 'success' | 'warning' | 'info' | 'error'

export type ToastWidgetProps = {
  /** Sets the rail colour + status icon. */
  variant?: ToastVariant
  /** Bold headline of the toast. */
  title?: string
  /** Muted line under the title. */
  message?: string
  /** Tiny timestamp shown top-right (free text). */
  time?: string
  /** Show the close button + wire its click. */
  onClose?: () => void
  /** Subtle slide-up + fade entrance. On by default. */
  animate?: boolean
}

const VARIANTS: Record<ToastVariant, { color: BrandColor; icon: IconName; tag: string }> = {
  success: { color: 'green', icon: 'check', tag: 'Listo' },
  warning: { color: 'orange', icon: 'flag', tag: 'Aviso' },
  info: { color: 'blue', icon: 'bell', tag: 'Info' },
  error: { color: 'red', icon: 'close', tag: 'Error' },
}

/**
 * ToastWidget — a soft neumorphic notification toast.
 * ───────────────────────────────────────────────────
 * A raised plate with a colored left rail, a recessed status-icon chip, a bold
 * title, a muted message line, a tiny timestamp and an optional close button.
 * `variant` picks the colour + glyph. Think "alerta de AiKit que te llega por
 * Telegram": el reporte semanal listo, el stock bajo... lo aburrido que odias,
 * resuelto sin que muevas un dedo. Re-lit live by the active NeoTheme.
 */
export function ToastWidget({
  variant = 'success',
  title = 'Reporte semanal listo 📊',
  message = 'Te lo he dejado en Telegram. Échale un ojo cuando quieras, sin prisa.',
  time = 'ahora',
  onClose,
  animate = true,
}: ToastWidgetProps) {
  const theme = useNeoTheme()
  const v = VARIANTS[variant]
  const accent = BRAND[v.color]

  const chip = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 13 })

  return (
    <>
      {animate && (
        <style>{`@keyframes neo-toast-rise{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      )}
      <NeoCard
        width={340}
        center={false}
        padding={0}
        radius={22}
        style={{
          gap: 0,
          overflow: 'hidden',
          animation: animate ? 'neo-toast-rise 0.5s cubic-bezier(0.22,1,0.36,1) both' : undefined,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {/* Colored left rail. */}
          <div
            style={{
              width: 5,
              flexShrink: 0,
              background: accent,
              boxShadow: `inset 1px 0 0 ${accent}, 0 0 14px ${accent}44`,
            }}
          />

          {/* Body. */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 13,
              padding: '18px 18px 18px 17px',
            }}
          >
            {/* Recessed status-icon chip. */}
            <div
              style={{
                flexShrink: 0,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                background: `${accent}1f`,
                ...chip,
              }}
            >
              <Icon name={v.icon} size={18} color={accent} strokeWidth={2} />
            </div>

            {/* Text column. */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Tag + timestamp. */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: accent,
                  }}
                >
                  {v.tag}
                </span>
                <span style={{ width: 3, height: 3, borderRadius: '50%', background: theme.textMuted, opacity: 0.5 }} />
                <span style={{ fontSize: 11, color: theme.textMuted }}>{time}</span>
              </div>

              <span
                style={{
                  fontSize: 14.5,
                  fontWeight: 700,
                  letterSpacing: -0.2,
                  color: theme.textStrong,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </span>

              {message && (
                <span
                  style={{
                    fontSize: 12.5,
                    letterSpacing: -0.2,
                    color: theme.textMuted,
                    lineHeight: 1.45,
                  }}
                >
                  {message}
                </span>
              )}
            </div>

            {/* Optional close button. */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                style={{
                  flexShrink: 0,
                  marginTop: -2,
                  marginRight: -4,
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 8,
                  cursor: 'pointer',
                  color: theme.textMuted,
                }}
              >
                <Icon name="close" size={15} color={theme.textMuted} strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </NeoCard>
    </>
  )
}
