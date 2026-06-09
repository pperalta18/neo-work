import { TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { RiveModuleIcon } from './RiveModuleIcon'
import { MODULES, type ModuleName, type ModuleSpec } from './modules'

export type AikitModuleProps = {
  /** Which module to render (see modules.ts). */
  module: ModuleName
  /** Icon edge in px. The label scales with it (Figma: 120px icon → 86px text). */
  size?: number
  /** Hide the wordmark and show only the icon. */
  iconOnly?: boolean
  /** Override the label colour. Defaults to the active theme's strong text. */
  color?: string
  /**
   * Render the live Rive vector animation instead of the static SVG. Hover or
   * click the icon to re-play it.
   */
  animated?: boolean
}

// Figma node 1293:1975: a 120px icon, a 32px gap, and an 86px / 0.72 wordmark.
const BASE_ICON = 120
const GAP_RATIO = 32 / BASE_ICON
const FONT_RATIO = 86 / BASE_ICON

/**
 * AikitModule — a brand module badge (icon + wordmark).
 * ────────────────────────────────────────────────────
 * One of the 16 AiKit modules (Hotpot, SQLSense, Udon, …). The icon is a
 * baked-in vector; the wordmark is Universal Sans Text 700, re-coloured live by
 * the active NeoTheme. Everything scales off the single `size` prop.
 */
export function AikitModule({
  module,
  size = BASE_ICON,
  iconOnly = false,
  color,
  animated = false,
}: AikitModuleProps) {
  const theme = useNeoTheme()
  const spec: ModuleSpec = MODULES[module]
  const labelColor = color ?? theme.textStrong

  const icon = animated ? (
    <RiveModuleIcon module={module} size={size} />
  ) : (
    <img
      src={spec.icon}
      alt={spec.name}
      width={size}
      height={size}
      style={{
        display: 'block',
        flexShrink: 0,
        transform: spec.rotate ? `rotate(${spec.rotate}deg)` : undefined,
      }}
    />
  )

  if (iconOnly) return icon

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * GAP_RATIO }}>
      {icon}
      <span
        style={{
          fontFamily: TEXT_FONT,
          fontWeight: 700,
          fontSize: size * FONT_RATIO,
          lineHeight: 0.72,
          letterSpacing: -0.5,
          color: labelColor,
          whiteSpace: 'nowrap',
        }}
      >
        {spec.name}
      </span>
    </div>
  )
}
