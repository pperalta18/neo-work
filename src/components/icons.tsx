import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain04Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  BellIcon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  DialpadCircle01Icon,
  Flag02Icon,
  GlobalIcon,
  Location01Icon,
  Megaphone01Icon,
  Mic01Icon,
  MicOff01Icon,
  PauseIcon,
  PlusSignIcon,
  ReloadIcon,
  SparklesIcon,
  SquareLock01Icon,
  StarIcon,
  Target02Icon,
  User02Icon,
} from '@hugeicons-pro/core-stroke-standard'

/**
 * A small, curated Hugeicons set for grid content. Add an entry here to make a
 * new icon available everywhere (concepts + editor picker). Requires the
 * HUGEICONS_TOKEN (.env) to install the @hugeicons-pro packages.
 */
export const ICONS = {
  brain: AiBrain04Icon,
  target: Target02Icon,
  clock: Clock01Icon,
  user: User02Icon,
  calendar: Calendar03Icon,
  location: Location01Icon,
  sparkles: SparklesIcon,
  star: StarIcon,
  mic: Mic01Icon,
  megaphone: Megaphone01Icon,
  check: CheckmarkCircle02Icon,
  flag: Flag02Icon,
  arrow: ArrowRight01Icon,
  bell: BellIcon,
  close: Cancel01Icon,
  pause: PauseIcon,
  dialpad: DialpadCircle01Icon,
  micOff: MicOff01Icon,
  call: Call02Icon,
  lock: SquareLock01Icon,
  back: ArrowLeft01Icon,
  reload: ReloadIcon,
  plus: PlusSignIcon,
  global: GlobalIcon,
} as const

export type IconName = keyof typeof ICONS
export const ICON_NAMES = Object.keys(ICONS) as IconName[]
export const isIconName = (v: unknown): v is IconName =>
  typeof v === 'string' && v in ICONS

export function Icon({
  name,
  size = 28,
  color = 'currentColor',
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
}) {
  return <HugeiconsIcon icon={ICONS[name]} size={size} color={color} strokeWidth={strokeWidth} />
}
