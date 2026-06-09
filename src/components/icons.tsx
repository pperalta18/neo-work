import { HugeiconsIcon } from '@hugeicons/react'
import {
  AiBrain01Icon,
  AiBrain04Icon,
  AiChipIcon,
  Analytics01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Alert01Icon,
  BalanceScaleIcon,
  Beach02Icon,
  BellIcon,
  BubbleChatIcon,
  BubbleChatQuestionIcon,
  Calendar03Icon,
  Call02Icon,
  Cancel01Icon,
  Certificate01Icon,
  ChartUpIcon,
  CheckListIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Configuration01Icon,
  DashboardSquare01Icon,
  DatabaseIcon,
  DialpadCircle01Icon,
  Flag02Icon,
  GlobalIcon,
  GoogleSheetIcon,
  HeadsetIcon,
  HelpCircleIcon,
  InstagramIcon,
  Invoice01Icon,
  Location01Icon,
  Mail01Icon,
  MailSend01Icon,
  Megaphone01Icon,
  Mic01Icon,
  MicOff01Icon,
  MoneyBag02Icon,
  Building06Icon,
  Package01Icon,
  PauseIcon,
  PlugSocketIcon,
  PlusSignIcon,
  ReloadIcon,
  ShoppingBasket01Icon,
  ShoppingCart01Icon,
  SparklesIcon,
  SquareLock01Icon,
  StarIcon,
  Store01Icon,
  Tag01Icon,
  Target02Icon,
  TelephoneIcon,
  User02Icon,
  UserAdd01Icon,
  UserGroupIcon,
  UserSearch01Icon,
  UserStar01Icon,
  WhatsappIcon,
  WorkflowSquare01Icon,
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
  // Accounting flow (cierre-trimestre)
  invoice: Invoice01Icon,
  configure: Configuration01Icon,
  process: AiChipIcon,
  balance: BalanceScaleIcon,
  question: BubbleChatQuestionIcon,
  certificate: Certificate01Icon,
  database: DatabaseIcon,
  erp: Building06Icon,
  dashboard: DashboardSquare01Icon,
  alert: Alert01Icon,
  // E-commerce flow (montar-tienda)
  store: Store01Icon,
  spreadsheet: GoogleSheetIcon,
  connect: PlugSocketIcon,
  web: GlobalIcon,
  ecommerce: ShoppingBasket01Icon,
  cart: ShoppingCart01Icon,
  stock: Package01Icon,
  tag: Tag01Icon,
  // Email marketing flow (campana-email)
  email: Mail01Icon,
  send: MailSend01Icon,
  campaign: Megaphone01Icon,
  segment: UserGroupIcon,
  lead: UserSearch01Icon,
  automate: WorkflowSquare01Icon,
  chart: Analytics01Icon,
  predict: ChartUpIcon,
  // Customer support flow (soporte-cliente)
  support: HeadsetIcon,
  faq: HelpCircleIcon,
  task: CheckListIcon,
  chat: BubbleChatIcon,
  agent: AiBrain01Icon,
  whatsapp: WhatsappIcon,
  phone: TelephoneIcon,
  instagram: InstagramIcon,
  // Scheduling / HR flows
  vacation: Beach02Icon,
  payroll: MoneyBag02Icon,
  employee: UserAdd01Icon,
  evaluation: UserStar01Icon,
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
