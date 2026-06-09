import { useCallback, useEffect } from 'react'
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
  RIVE_MODULE_STATE_MACHINE,
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
   * frame and only plays on click (via the `click` trigger, combined file only).
   */
  autoplay?: boolean
  /**
   * Re-fire the icon's animation on hover/click. The per-module `.riv` plays a
   * one-shot entry on mount and then freezes; re-firing its state-machine
   * trigger replays the lively reaction. Default `true`.
   */
  playOnHover?: boolean
  /**
   * Keep re-firing the animation on an interval so the icon reads as "alive"
   * (showcases/galleries). Off by default. Per-module `.riv` only.
   */
  loop?: boolean
}

/**
 * Trigger names that re-play a module `.riv`'s reaction. These are view-model
 * (data-binding) triggers, not classic state-machine inputs — every file uses
 * `click`, except SQLSense which uses `click2`. We fire the first one present.
 */
const REPLAY_TRIGGERS = ['click', 'click2'] as const

/** Re-fire a module `.riv`'s reaction via its auto-bound view-model trigger. */
function fireRiveReplay(rive: ReturnType<typeof useRive>['rive']) {
  const vmi = rive?.viewModelInstance
  if (!vmi) return
  for (const name of REPLAY_TRIGGERS) {
    const trigger = vmi.trigger(name)
    if (trigger) {
      trigger.trigger()
      return
    }
  }
}

const LAYOUT = new Layout({ fit: Fit.Contain, alignment: Alignment.Center })

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
 * Primary variant — the module's own `.riv` (`spec.rive`): a self-contained
 * artboard + `State Machine 1` that autoplays its reveal. We `autoBind` its own
 * default view model (whose name varies per file), so no shared binding contract
 * is assumed and the canvas stays free of "view model not found" noise.
 */
function RiveIndividualIcon({
  spec,
  size,
  autoplay,
  playOnHover,
  loop,
}: {
  spec: ModuleSpec
  size: number
  autoplay: boolean
  playOnHover: boolean
  loop: boolean
}) {
  const { rive, RiveComponent } = useRive({
    src: spec.rive,
    stateMachines: RIVE_MODULE_STATE_MACHINE,
    autoplay,
    autoBind: true,
    layout: LAYOUT,
  })

  const replay = useCallback(() => fireRiveReplay(rive), [rive])

  // "Alive" mode: re-fire on an interval so the icon keeps reacting.
  useEffect(() => {
    if (!loop || !rive) return
    const id = setInterval(replay, 2600)
    return () => clearInterval(id)
  }, [loop, rive, replay])

  return (
    <RiveComponent
      role="img"
      aria-label={spec.name}
      onMouseEnter={playOnHover ? replay : undefined}
      onClick={playOnHover ? replay : undefined}
      style={{
        width: size,
        height: size,
        display: 'block',
        flexShrink: 0,
        cursor: playOnHover ? 'pointer' : undefined,
        transform: spec.rotate ? `rotate(${spec.rotate}deg)` : undefined,
      }}
    />
  )
}

/**
 * Fallback variant — the combined `aikit-modules.riv` (artboard `FeedbackLoop 2`)
 * driven by data binding: a `SlotVM` view model with one named instance per
 * module. We bind the module's instance to select the icon, tint its
 * `colorBackground` to the active NeoTheme surface, and fire its `click` trigger
 * on tap to re-play the reveal. Used only for modules without a `spec.rive`.
 */
function RiveCombinedIcon({
  spec,
  size,
  autoplay,
}: {
  spec: ModuleSpec
  size: number
  autoplay: boolean
}) {
  const theme = useNeoTheme()

  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    artboard: RIVE_ARTBOARD,
    stateMachines: RIVE_STATE_MACHINE,
    autoplay,
    // We bind a specific named instance ourselves (below), so disable auto-bind.
    autoBind: false,
    layout: LAYOUT,
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

/**
 * RiveModuleIcon — the animated counterpart to a module's baked SVG.
 * ──────────────────────────────────────────────────────────────────
 * Picks the per-module `.riv` when present (primary), else the combined
 * `aikit-modules.riv` (fallback). The branch is at the component level — each
 * variant keeps its own stable hook order — so no hook runs against a file that
 * lacks its bindings. See specs/operations-manual.md §2.
 */
export function RiveModuleIcon({
  module,
  size,
  autoplay = true,
  playOnHover = true,
  loop = false,
}: RiveModuleIconProps) {
  const spec: ModuleSpec = MODULES[module]
  return spec.rive ? (
    <RiveIndividualIcon
      spec={spec}
      size={size}
      autoplay={autoplay}
      playOnHover={playOnHover}
      loop={loop}
    />
  ) : (
    <RiveCombinedIcon spec={spec} size={size} autoplay={autoplay} />
  )
}
