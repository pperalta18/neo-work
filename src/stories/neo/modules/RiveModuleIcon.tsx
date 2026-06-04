import { useEffect } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceColor,
  Fit,
  Alignment,
  Layout,
} from '@rive-app/react-canvas'
import { useNeoTheme } from '../NeoTheme'
import { RIVE_STATE_MACHINE, MODULES, type ModuleName, type ModuleSpec } from './modules'

export type RiveModuleIconProps = {
  /** Which module to play. */
  module: ModuleName
  /** Rendered edge in px. */
  size: number
  /**
   * Autoplay the state machine on mount. When false the icon stays on its first
   * frame and only plays on click (via the file's pointer listener).
   */
  autoplay?: boolean
}

/** "#rrggbb" → [r, g, b] (0-255). */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ]
}

/**
 * RiveModuleIcon — the animated counterpart to a module's baked SVG.
 * ──────────────────────────────────────────────────────────────────
 * Each module ships its own Rive file (`./riv/<module>.riv`). The single
 * artboard's `State Machine 1` autoplays the reveal on mount and a built-in
 * pointer listener re-plays it on click. We bind the file's default view-model
 * instance so we can tint its optional `colorBackground` plate to the active
 * NeoTheme surface (so the plate blends into the canvas, esp. in dark mode).
 */
export function RiveModuleIcon({ module, size, autoplay = true }: RiveModuleIconProps) {
  const theme = useNeoTheme()
  const spec: ModuleSpec = MODULES[module]

  const { rive, RiveComponent } = useRive({
    src: spec.riveSrc,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay,
    // We bind the default instance ourselves (below) to drive the tint.
    autoBind: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  // Bind the file's default view-model instance (one per module file).
  const vm = useViewModel(rive, { useDefault: true })
  const vmi = useViewModelInstance(vm, { useDefault: true, rive })

  // Re-tint the optional background plate to the theme surface (keeps it from
  // sitting on a hard-coded background). No-op on files without `colorBackground`.
  const bg = useViewModelInstanceColor('colorBackground', vmi)
  useEffect(() => {
    if (!bg?.setRgb) return
    const [r, g, b] = hexToRgb(theme.surface)
    bg.setRgb(r, g, b)
  }, [bg, theme.surface])

  return (
    <RiveComponent
      role="img"
      aria-label={spec.name}
      style={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        cursor: 'pointer',
      }}
    />
  )
}
