import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { elevation, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { useNeoTheme } from './NeoTheme'

export type NeoInputProps = {
  placeholder?: string
  /** Leading icon (left). Defaults to a mic, as in the reference. */
  icon?: IconName | null
  /** Controlled value. Omit to run uncontrolled. */
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  /** Fires on Enter or the submit arrow. */
  onSubmit?: (value: string) => void
  /** Show the trailing submit arrow once focused / non-empty. */
  submit?: boolean
  disabled?: boolean
  /**
   * Let the text wrap and grow the pill *upward* instead of scrolling off to
   * the right. Swaps the single-line `<input>` for an auto-growing `<textarea>`
   * and squares the pill (radius 24) so multiple lines read cleanly. Used by the
   * chat composers so a long message keeps all its context on screen.
   */
  multiline?: boolean
  style?: CSSProperties
}

/**
 * NeoInput — a neumorphic search / text field.
 * ─────────────────────────────────────────────
 * Idle the pill sits raised; on focus it presses in (recessed). A leading mic
 * and a trailing submit arrow (fades in once focused or non-empty). Re-lit by
 * the active NeoTheme.
 */
export function NeoInput({
  placeholder = 'What are you looking for today?',
  icon = 'mic',
  value,
  defaultValue = '',
  onChange,
  onSubmit,
  submit = true,
  disabled = false,
  multiline = false,
  style,
}: NeoInputProps) {
  const theme = useNeoTheme()
  const [focused, setFocused] = useState(false)
  const [internal, setInternal] = useState(defaultValue)
  const val = value ?? internal

  // Auto-grow the textarea to fit its content: reset to 0, then take its full
  // scrollHeight. Deterministic given (value, width) — safe for Remotion.
  const taRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = taRef.current
    if (!el) return
    el.style.height = '0px'
    el.style.height = `${el.scrollHeight}px`
  }, [val, multiline])

  const pill = elevation(theme, {
    depth: focused ? 'recessed' : 'raised',
    distance: 7,
    blur: 16,
    radius: 999,
  })

  const setVal = (v: string) => {
    if (value === undefined) setInternal(v)
    onChange?.(v)
  }

  const showArrow = submit && (focused || val.length > 0)

  // Shared text styling for both the single-line input and the multiline
  // textarea, so they read identically; the textarea adds wrap/grow on top.
  const fieldStyle: CSSProperties = {
    flex: 1,
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontFamily: TEXT_FONT,
    fontSize: 16,
    lineHeight: '22px',
    letterSpacing: -0.2,
    color: theme.textStrong,
    minWidth: 0,
  }

  return (
    <div
      style={{
        display: 'flex',
        // Multiline grows upward, so pin icon + arrow to the bottom line.
        alignItems: multiline ? 'flex-end' : 'center',
        gap: 12,
        width: 420,
        maxWidth: '100%',
        padding: '16px 20px',
        opacity: disabled ? 0.5 : 1,
        transition: 'box-shadow 0.25s ease, background-color 0.25s ease',
        ...pill,
        // A full pill (radius 999) only reads on one line; square it once it can wrap.
        ...(multiline ? { borderRadius: 24 } : null),
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={20} color={theme.textMuted} strokeWidth={1.6} />}
      {multiline ? (
        <textarea
          ref={taRef}
          disabled={disabled}
          value={val}
          placeholder={placeholder}
          rows={1}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSubmit?.(val)
            }
          }}
          style={{ ...fieldStyle, resize: 'none', overflowY: 'auto', maxHeight: 154, display: 'block' }}
        />
      ) : (
        <input
          disabled={disabled}
          value={val}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit?.(val)
          }}
          style={fieldStyle}
        />
      )}
      <button
        type="button"
        tabIndex={showArrow ? 0 : -1}
        onClick={() => onSubmit?.(val)}
        aria-label="Submit"
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          color: val.length > 0 ? KIT_BLUE : theme.textMuted,
          opacity: showArrow ? 1 : 0,
          transform: showArrow ? 'translateX(0)' : 'translateX(-6px)',
          transition: 'opacity 0.22s ease, transform 0.22s ease, color 0.2s ease',
          pointerEvents: showArrow ? 'auto' : 'none',
        }}
      >
        <Icon name="arrow" size={20} strokeWidth={1.8} />
      </button>
    </div>
  )
}
