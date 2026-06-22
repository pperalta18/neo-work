import type { CSSProperties } from 'react'
import { useCurrentFrame } from 'remotion'
import { BRAND, KIT_BLUE, TEXT_FONT, elevation, lightTheme, type BrandColor, type NeoTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { DUR, ease } from '../motion'

export type MonthEvent = {
  /** Day of month (1-based) the chip sits on. */
  date: number
  /** Accent colour of the chip. */
  color?: BrandColor
  /** Frame the chip pops onto its day (the recurrence landing). Omit = already there. */
  appearAt?: number
}

export type CalendarMonthProps = {
  /** Period label in the header. Default the event month. */
  period?: string
  /** Event chips placed by day-of-month. */
  events?: readonly MonthEvent[]
  /** Highlighted day-of-month (the blue "today" ring). */
  today?: number
  /** Weekday of day 1 (0 = Monday … 6 = Sunday). Junio 2026 starts Monday → 0. */
  firstOffset?: number
  daysInMonth?: number
  width?: number
  theme?: NeoTheme
  /** Draw the raised card plate. Turn off inside an AppWindow viewport. */
  plate?: boolean
  /** Panel entrance start. Default 0. */
  enterAt?: number
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

/**
 * CalendarMonth — CalendarWidget's month view ported inline, frame-driven.
 * ────────────────────────────────────────────────────────────────────────
 * The mode Prod03 uses: the month grid with the header chrome (nav, period,
 * the segmented switch resting on "Mes"), where event chips pop onto their
 * days at `appearAt` — the blue event repeating Monday after Monday across
 * the month. Themed by prop, deterministic per frame.
 */
export function CalendarMonth({
  period = 'Junio 2026',
  events = [],
  today = 17,
  firstOffset = 0,
  daysInMonth = 30,
  width = 420,
  theme = lightTheme,
  plate = true,
  enterAt = 0,
  frame: frameProp,
  style,
}: CalendarMonthProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame

  const enter = ease(frame, enterAt, enterAt + DUR.reveal)
  const card = plate
    ? elevation(theme, { depth: 'raised', distance: 10, blur: 22, radius: 28 })
    : {}
  const surface = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })

  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - firstOffset + 1
    return day >= 1 && day <= daysInMonth ? day : null
  })
  const eventsOn = (day: number) => events.filter((e) => e.date === day)

  return (
    <div
      style={{
        width,
        boxSizing: 'border-box',
        padding: plate ? 22 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        fontFamily: TEXT_FONT,
        ...card,
        opacity: enter,
        transform: `translateY(${(1 - enter) * 16}px)`,
        ...style,
      }}
    >
      <Header period={period} theme={theme} />

      <div style={{ padding: 10, ...surface }}>
        {/* Weekday header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: theme.textMuted }}
            >
              {d}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {cells.map((day, i) => {
            if (day === null) return <div key={i} />
            const isToday = day === today
            const dayEvents = eventsOn(day)
            return (
              <div
                key={i}
                style={{
                  minHeight: 50,
                  borderRadius: 9,
                  padding: '5px 4px 4px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  background: isToday ? `${KIT_BLUE}14` : 'transparent',
                  boxShadow: isToday ? `inset 0 0 0 1.5px ${KIT_BLUE}` : undefined,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: isToday ? 700 : 500,
                    fontVariantNumeric: 'tabular-nums',
                    color: isToday ? KIT_BLUE : theme.textStrong,
                  }}
                >
                  {day}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                  {dayEvents.slice(0, 2).map((e, j) => {
                    // The chip lands: sweeps open from the left + fades in.
                    const pop = e.appearAt != null ? ease(frame, e.appearAt, e.appearAt + DUR.quick) : 1
                    if (pop === 0) return null
                    return (
                      <div
                        key={j}
                        style={{
                          height: 5,
                          borderRadius: 2.5,
                          background: BRAND[e.color ?? 'blue'],
                          opacity: pop,
                          transform: `scaleX(${pop})`,
                          transformOrigin: 'left center',
                        }}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Header({ period, theme }: { period: string; theme: NeoTheme }) {
  const seg = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 11 })
  const navPlate = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 10 })
  const labels = ['Día', 'Semana', 'Mes']

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NavButton plate={navPlate} theme={theme} icon="back" />
        <span style={{ fontSize: 17, fontWeight: 600, color: theme.textStrong, minWidth: 96 }}>
          {period}
        </span>
        <NavButton plate={navPlate} theme={theme} icon="arrow" />
      </div>

      {/* Segmented switch resting on "Mes" — the only view this port renders. */}
      <div style={{ display: 'flex', gap: 4, padding: 4, ...seg }}>
        {labels.map((label) => {
          const active = label === 'Mes'
          return (
            <span
              key={label}
              style={{
                padding: '5px 11px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: active ? '#fff' : theme.textMuted,
                background: active ? KIT_BLUE : 'transparent',
              }}
            >
              {label}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function NavButton({
  plate,
  theme,
  icon,
}: {
  plate: CSSProperties
  theme: NeoTheme
  icon: 'back' | 'arrow'
}) {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...plate,
      }}
    >
      <Icon name={icon} size={16} color={theme.textMuted} strokeWidth={2} />
    </div>
  )
}
