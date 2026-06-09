import hotpot from './icons/hotpot.svg'
import sqlsense from './icons/sqlsense.svg'
import udon from './icons/udon.svg'
import sushimi from './icons/sushimi.svg'
import docusense from './icons/docusense.svg'
import junction from './icons/junction.svg'
import glimpse from './icons/glimpse.svg'
import foresight from './icons/foresight.svg'
import actionRunner from './icons/action-runner.svg'
import actionScript from './icons/action-script.svg'
import teamwork from './icons/teamwork.svg'
import feedbackLoop from './icons/feedback-loop.svg'
import heartbeat from './icons/heartbeat.svg'
import smartProcess from './icons/smart-process.svg'
import forge from './icons/forge.svg'
import skillHub from './icons/skill-hub.svg'

// Per-module Rive animations (one richer `.riv` each, delivered alongside the
// brand SVGs). These are the primary animated variant; the combined
// `aikit-modules.riv` below stays as a fallback. See specs/operations-manual.md.
import hotpotRive from './rive/hotpot.riv?url'
import sqlsenseRive from './rive/sqlsense.riv?url'
import udonRive from './rive/udon.riv?url'
import sushimiRive from './rive/sushimi.riv?url'
import docusenseRive from './rive/docusense.riv?url'
import junctionRive from './rive/junction.riv?url'
import glimpseRive from './rive/glimpse.riv?url'
import foresightRive from './rive/foresight.riv?url'
import actionRunnerRive from './rive/action-runner.riv?url'
import actionScriptRive from './rive/action-script.riv?url'
import teamworkRive from './rive/teamwork.riv?url'
import feedbackLoopRive from './rive/feedback-loop.riv?url'
import heartbeatRive from './rive/heartbeat.riv?url'
import smartProcessRive from './rive/smart-process.riv?url'
import forgeRive from './rive/forge.riv?url'
import skillHubRive from './rive/skill-hub.riv?url'

/** Combined animated source (one Rive file, all icons). Fallback variant. */
export { default as RIVE_SRC } from './aikit-modules.riv?url'

/**
 * Every per-module `.riv` ships its own artboard + `State Machine 1`, so the
 * animation autoplays standalone — no shared default to override.
 */
export const RIVE_MODULE_STATE_MACHINE = 'State Machine 1'

/**
 * The Rive file is a single artboard driven by data binding: one `View Model`
 * (`SlotVM`) holds 16 named instances — one per module — and binding an instance
 * by name swaps which icon the artboard shows. Each instance exposes a `click`
 * trigger (re-plays the reveal) and a `colorBackground` colour.
 */
export const RIVE_ARTBOARD = 'FeedbackLoop 2'
export const RIVE_STATE_MACHINE = 'State Machine 1'
export const RIVE_VIEW_MODEL = 'SlotVM'

/**
 * AiKit module catalogue (from the "Economía de guerra" Figma library,
 * node 1293:1975). Each module is a brand icon + a wordmark. The icons are
 * vector SVGs exported from Figma; their fills/strokes are baked in, so they
 * render verbatim regardless of the active NeoTheme. Each module also maps to a
 * `SlotVM` instance in `aikit-modules.riv` for the animated variant.
 */
export type ModuleGroup = 'data' | 'action' | 'orchestration'

export type ModuleSpec = {
  /** Wordmark shown next to the icon. */
  name: string
  /** Imported SVG asset URL (static variant). */
  icon: string
  /** Imported per-module `.riv` URL (primary animated variant). */
  rive: string
  /**
   * `SlotVM` instance name inside `aikit-modules.riv` (combined fallback
   * variant). Names match the Rive file verbatim — including its quirks
   * (`Juction`, `SQL Sense`).
   */
  instance: string
  /** Family the module belongs to — used to order the gallery. */
  group: ModuleGroup
  /** Extra rotation (deg) baked into the Figma frame. */
  rotate?: number
}

export const MODULES = {
  hotpot: { name: 'Hotpot', icon: hotpot, rive: hotpotRive, instance: 'Hotpot', group: 'data' },
  sqlsense: { name: 'SQLSense', icon: sqlsense, rive: sqlsenseRive, instance: 'SQL Sense', group: 'data' },
  udon: { name: 'Udon', icon: udon, rive: udonRive, instance: 'Udon', group: 'data' },
  sushimi: { name: 'Sushimi', icon: sushimi, rive: sushimiRive, instance: 'Sushimi', group: 'data' },
  docusense: { name: 'Docusense', icon: docusense, rive: docusenseRive, instance: 'Docusense', group: 'data' },
  junction: { name: 'Junction', icon: junction, rive: junctionRive, instance: 'Juction', group: 'data' },
  glimpse: { name: 'Glimpse', icon: glimpse, rive: glimpseRive, instance: 'Glimpse', group: 'data' },
  foresight: { name: 'Foresight', icon: foresight, rive: foresightRive, instance: 'Foresight', group: 'data', rotate: -90 },
  actionRunner: { name: 'Action Runner', icon: actionRunner, rive: actionRunnerRive, instance: 'Action Runner', group: 'action' },
  actionScript: { name: 'Action Script', icon: actionScript, rive: actionScriptRive, instance: 'ActionScript', group: 'action' },
  teamwork: { name: 'TeamWork', icon: teamwork, rive: teamworkRive, instance: 'TeamWork', group: 'action' },
  feedbackLoop: { name: 'Feedback Loop', icon: feedbackLoop, rive: feedbackLoopRive, instance: 'FeedbackLoop', group: 'action' },
  heartbeat: { name: 'Heartbeat', icon: heartbeat, rive: heartbeatRive, instance: 'Heartbeat', group: 'action' },
  smartProcess: { name: 'Smart Process', icon: smartProcess, rive: smartProcessRive, instance: 'SmartProcess', group: 'orchestration' },
  forge: { name: 'Forge', icon: forge, rive: forgeRive, instance: 'Forge', group: 'orchestration' },
  skillHub: { name: 'Skill Hub', icon: skillHub, rive: skillHubRive, instance: 'SkillHub', group: 'orchestration' },
} satisfies Record<string, ModuleSpec>

export type ModuleName = keyof typeof MODULES
export const MODULE_NAMES = Object.keys(MODULES) as ModuleName[]
export const isModuleName = (v: unknown): v is ModuleName =>
  typeof v === 'string' && v in MODULES
