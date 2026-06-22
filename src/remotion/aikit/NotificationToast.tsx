import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, elevation, lightTheme, TEXT_FONT, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import {
  type ToastSpec,
  type ToastVariant,
  isOnScreen,
  toastPose,
  toastSlot,
} from './toastScript'

export type { ToastSpec, ToastVariant }

/** Variant → rail colour, status glyph, uppercase tag (ToastWidget's table). */
export const TOAST_VARIANTS: Record<ToastVariant, { color: BrandColor; icon: IconName; tag: string }> = {
  success: { color: 'green', icon: 'check', tag: 'Listo' },
  warning: { color: 'orange', icon: 'flag', tag: 'Aviso' },
  info: { color: 'blue', icon: 'bell', tag: 'Info' },
  error: { color: 'red', icon: 'close', tag: 'Error' },
}

export type NotificationToastProps = {
  /** The scripted toast — pose (rise/exit) derives from its showAt/hideAt. */
  toast: ToastSpec
  width?: number
  theme?: NeoTheme
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

/**
 * NotificationToast — ToastWidget ported to frames.
 * ─────────────────────────────────────────────────
 * The soft neumorphic alert plate (colored left rail, recessed status chip,
 * tag + timestamp, bold title, muted message), with the CSS `neo-toast-rise`
 * entrance replaced by the deterministic pose from toastScript. Themed by
 * prop, not context, so it drops into any scene. No close button — nothing
 * is clickable in a render.
 */
export function NotificationToast({
  toast,
  width = 340,
  theme = lightTheme,
  frame: frameProp,
  style,
}: NotificationToastProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  if (!isOnScreen(toast, frame)) return null

  const v = TOAST_VARIANTS[toast.variant ?? 'success']
  const accent = BRAND[v.color]
  const pose = toastPose(toast, frame)

  const plate = elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 22 })
  const chip = elevation(theme, { depth: 'recessed', distance: 3, blur: 7, radius: 13 })

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        overflow: 'hidden',
        fontFamily: TEXT_FONT,
        color: theme.textStrong,
        opacity: pose.opacity,
        transform: `translate(${pose.x}px, ${pose.y}px)`,
        ...plate,
        ...style,
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
              {toast.time && (
                <>
                  <span style={{ width: 3, height: 3, borderRadius: '50%', background: theme.textMuted, opacity: 0.5 }} />
                  <span style={{ fontSize: 11, color: theme.textMuted }}>{toast.time}</span>
                </>
              )}
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
              {toast.title}
            </span>

            {toast.message && (
              <span
                style={{
                  fontSize: 12.5,
                  letterSpacing: -0.2,
                  color: theme.textMuted,
                  lineHeight: 1.45,
                }}
              >
                {toast.message}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export type ToastStackProps = {
  /** The scripted toasts. See toastScript.ts for the timeline contract. */
  script: readonly ToastSpec[]
  /** Where older toasts get pushed as new ones land at the anchor:
   * 'down' = anchored top (slot 0 at the top), 'up' = anchored bottom. */
  direction?: 'down' | 'up'
  /** Toast width (px). */
  width?: number
  /** Vertical pitch reserved per toast — expected card height. */
  toastHeight?: number
  /** Air between stacked toasts. */
  gap?: number
  theme?: NeoTheme
  /** Local frame override; defaults to useCurrentFrame(). */
  frame?: number
  style?: CSSProperties
}

/**
 * ToastStack — the cascade. Newest toast lands at the anchor; older ones
 * slide a slot away (fractionally, eased) and ease back when one leaves.
 * Position the stack by its anchor corner; it owns no background.
 */
export function ToastStack({
  script,
  direction = 'down',
  width = 340,
  toastHeight = 104,
  gap = 14,
  theme = lightTheme,
  frame: frameProp,
  style,
}: ToastStackProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  const pitch = toastHeight + gap

  return (
    <div style={{ position: 'relative', width, ...style }}>
      {script.map((toast, i) => {
        if (!isOnScreen(toast, frame)) return null
        const offset = toastSlot(script, i, frame) * pitch
        return (
          <div
            key={`${toast.showAt}-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              ...(direction === 'down' ? { top: offset } : { bottom: offset }),
            }}
          >
            <NotificationToast toast={toast} width={width} theme={theme} frame={frame} />
          </div>
        )
      })}
    </div>
  )
}
