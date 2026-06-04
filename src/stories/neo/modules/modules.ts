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

// Animated source for every module — one self-contained Rive file per module
// (the "good" exports). Each file ships a single artboard, a `State Machine 1`
// that autoplays its reveal, and a default view-model instance.
import hotpotRive from './riv/hotpot.riv?url'
import sqlsenseRive from './riv/sqlsense.riv?url'
import udonRive from './riv/udon.riv?url'
import sushimiRive from './riv/sushimi.riv?url'
import docusenseRive from './riv/docusense.riv?url'
import junctionRive from './riv/junction.riv?url'
import glimpseRive from './riv/glimpse.riv?url'
import foresightRive from './riv/foresight.riv?url'
import actionRunnerRive from './riv/action-runner.riv?url'
import actionScriptRive from './riv/action-script.riv?url'
import teamworkRive from './riv/teamwork.riv?url'
import feedbackLoopRive from './riv/feedback-loop.riv?url'
import heartbeatRive from './riv/heartbeat.riv?url'
import smartProcessRive from './riv/smart-process.riv?url'
import forgeRive from './riv/forge.riv?url'
import skillHubRive from './riv/skill-hub.riv?url'

/**
 * Every module's Rive file uses the same conventions: a single artboard whose
 * `State Machine 1` autoplays the reveal, a pointer listener that re-plays it on
 * click, and a default view-model instance exposing the module colours
 * (`colorMain`, `colorB`, …) and — on a few — a `colorBackground` plate.
 */
export const RIVE_STATE_MACHINE = 'State Machine 1'

/**
 * AiKit module catalogue (from the "Economía de guerra" Figma library,
 * node 1293:1975). Each module is a brand icon + a wordmark. The icons are
 * vector SVGs exported from Figma; their fills/strokes are baked in, so they
 * render verbatim regardless of the active NeoTheme. Each module also ships a
 * self-contained Rive file (`./riv/<module>.riv`) for the animated variant.
 */
export type ModuleGroup = 'data' | 'action' | 'orchestration'

export type ModuleSpec = {
  /** Wordmark shown next to the icon. */
  name: string
  /** Imported SVG asset URL (static variant). */
  icon: string
  /** Imported Rive asset URL (animated variant). */
  riveSrc: string
  /** Family the module belongs to — used to order the gallery. */
  group: ModuleGroup
  /** Extra rotation (deg) baked into the Figma SVG frame (static variant only). */
  rotate?: number
}

export const MODULES = {
  hotpot: { name: 'Hotpot', icon: hotpot, riveSrc: hotpotRive, group: 'data' },
  sqlsense: { name: 'SQLSense', icon: sqlsense, riveSrc: sqlsenseRive, group: 'data' },
  udon: { name: 'Udon', icon: udon, riveSrc: udonRive, group: 'data' },
  sushimi: { name: 'Sushimi', icon: sushimi, riveSrc: sushimiRive, group: 'data' },
  docusense: { name: 'Docusense', icon: docusense, riveSrc: docusenseRive, group: 'data' },
  junction: { name: 'Junction', icon: junction, riveSrc: junctionRive, group: 'data' },
  glimpse: { name: 'Glimpse', icon: glimpse, riveSrc: glimpseRive, group: 'data' },
  foresight: { name: 'Foresight', icon: foresight, riveSrc: foresightRive, group: 'data', rotate: -90 },
  actionRunner: { name: 'Action Runner', icon: actionRunner, riveSrc: actionRunnerRive, group: 'action' },
  actionScript: { name: 'Action Script', icon: actionScript, riveSrc: actionScriptRive, group: 'action' },
  teamwork: { name: 'TeamWork', icon: teamwork, riveSrc: teamworkRive, group: 'action' },
  feedbackLoop: { name: 'Feedback Loop', icon: feedbackLoop, riveSrc: feedbackLoopRive, group: 'action' },
  heartbeat: { name: 'Heartbeat', icon: heartbeat, riveSrc: heartbeatRive, group: 'action' },
  smartProcess: { name: 'Smart Process', icon: smartProcess, riveSrc: smartProcessRive, group: 'orchestration' },
  forge: { name: 'Forge', icon: forge, riveSrc: forgeRive, group: 'orchestration' },
  skillHub: { name: 'Skill Hub', icon: skillHub, riveSrc: skillHubRive, group: 'orchestration' },
} satisfies Record<string, ModuleSpec>

export type ModuleName = keyof typeof MODULES
export const MODULE_NAMES = Object.keys(MODULES) as ModuleName[]
export const isModuleName = (v: unknown): v is ModuleName =>
  typeof v === 'string' && v in MODULES
