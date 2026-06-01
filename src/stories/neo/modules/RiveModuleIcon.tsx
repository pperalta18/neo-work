import { useEffect } from 'react'
import {
  useRive,
  useViewModel,
  useViewModelInstance,
  useViewModelInstanceColor,
  useViewModelInstanceTrigger,
  Fit,
  Alignment,
  Layout,
} from '@rive-app/react-canvas'
import { useNeoTheme } from '../NeoTheme'
import {
  RIVE_SRC,
  RIVE_ARTBOARD,
  RIVE_STATE_MACHINE,
  RIVE_VIEW_MODEL,
  MODULES,
  type ModuleName,
  type ModuleSpec,
} from './modules'

export type RiveModuleIconProps = {
  /** Which module to play. */
  module: ModuleName
  /** Rendered edge in px. */
  size: number
  /**
   * Autoplay the state machine on mount. When false the icon stays on its first
   * frame and only plays on click (via the `click` trigger).
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
 * The Rive file is a single artboard (`FeedbackLoop 2`) driven by data binding:
 * a `SlotVM` view model with one named instance per module. We bind the module's
 * instance to swap which icon renders, tint its `colorBackground` to the active
 * NeoTheme surface (so the plate blends into the canvas), and fire its `click`
 * trigger on tap to re-play the reveal.
 */
export function RiveModuleIcon({ module, size, autoplay = true }: RiveModuleIconProps) {
  const theme = useNeoTheme()
  const spec: ModuleSpec = MODULES[module]

  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    artboard: RIVE_ARTBOARD,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay,
    // We bind a specific named instance ourselves (below), so disable auto-bind.
    autoBind: false,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
  })

  // Bind this module's SlotVM instance — this is what selects the icon.
  const vm = useViewModel(rive, { name: RIVE_VIEW_MODEL })
  const vmi = useViewModelInstance(vm, { name: spec.instance, rive })

  // Re-tint the plate to the theme surface (keeps it from sitting on a
  // hard-coded background, esp. in dark mode).
  const bg = useViewModelInstanceColor('colorBackground', vmi)
  useEffect(() => {
    if (!bg?.setRgb) return
    const [r, g, b] = hexToRgb(theme.surface)
    bg.setRgb(r, g, b)
  }, [bg, theme.surface])

  // The `click` trigger re-plays the icon when tapped.
  const click = useViewModelInstanceTrigger('click', vmi)

  return (
    <RiveComponent
      role="img"
      aria-label={spec.name}
      onClick={() => click?.trigger?.()}
      style={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        cursor: 'pointer',
        transform: spec.rotate ? `rotate(${spec.rotate}deg)` : undefined,
      }}
    />
  )
}
