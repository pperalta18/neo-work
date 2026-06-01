import type { CSSProperties } from 'react'
import { BRAND, elevation, KIT_BLUE, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type CalendarView = 'day' | 'week' | 'month'

export type CalendarEvent = {
  title: string
  /** Accent colour of the event chip. */
  color?: BrandColor
  /** Day of month (1-based) — used by the month view. */
  date?: number
  /** Weekday index (0 = Mon … 6 = Sun) — used by the week + day views. */
  weekday?: number
  /** Start hour as a decimal (9.5 = 09:30) — used by the day + week views. */
  start?: number
  /** End hour as a decimal — used by the day + week views. */
  end?: number
}

export type CalendarWidgetProps = {
  /** Which layout to render. */
  view?: CalendarView
  /** Period label shown in the header. */
  title?: string
  /** Events placed across the grid / timeline. */
  events?: CalendarEvent[]
  /** Highlighted day-of-month in the month view. */
  today?: number
  /** Weekday focused by the day view (0 = Mon … 6 = Sun). */
  focusWeekday?: number
}

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
const WEEKDAYS_LONG = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const DAY_START = 8
const DAY_END = 19

/** Row height per hour (px). The day agenda breathes; the week stays compact. */
const HOUR_H_DAY = 46
const HOUR_H_WEEK = 26

const DEFAULT_EVENTS: CalendarEvent[] = [
  { title: 'Standup', color: 'blue', date: 3, weekday: 0, start: 9, end: 9.5 },
  { title: 'Diseño', color: 'violet', date: 5, weekday: 1, start: 11, end: 12.5 },
  { title: 'Comida cliente', color: 'orange', date: 12, weekday: 1, start: 14, end: 15 },
  { title: 'Review', color: 'green', date: 18, weekday: 3, start: 16, end: 17 },
  { title: 'Demo', color: 'pink', date: 24, weekday: 4, start: 10, end: 11 },
  { title: 'Sprint plan', color: 'teal', date: 27, weekday: 4, start: 12, end: 13.5 },
]

/**
 * CalendarWidget — a neumorphic calendar abstraction with three layouts.
 * ─────────────────────────────────────────────────────────────────────
 * One events array drives all three views: the month grid reads `date`, the
 * week + day timelines read `weekday` / `start` / `end`. A recessed surface
 * holds the grid, the period header carries prev / next nav + a segmented
 * day / week / month switch (the active view lit blue), and each event is a
 * coloured chip. Re-lit live by the active NeoTheme.
 */
export function CalendarWidget({
  view = 'month',
  title,
  events = DEFAULT_EVENTS,
  today = 12,
  focusWeekday = 1,
}: CalendarWidgetProps) {
  const theme = useNeoTheme()
  const surface = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })

  const width = view === 'month' ? 420 : view === 'week' ? 500 : 340
  const period = title ?? (view === 'day' ? `${WEEKDAYS_LONG[focusWeekday]} 12` : 'Mayo 2026')

  return (
    <NeoCard width={width} center={false} padding={22} radius={28} style={{ gap: 18 }}>
      <Header period={period} view={view} theme={theme} />
      {view === 'month' && <MonthView events={events} today={today} theme={theme} surface={surface} />}
      {view === 'week' && <WeekView events={events} theme={theme} surface={surface} />}
      {view === 'day' && (
        <DayView events={events} focusWeekday={focusWeekday} theme={theme} surface={surface} />
      )}
    </NeoCard>
  )
}

/* ───────────── Three dedicated calendars (day / week / month) ───────────── */

/** Month grid — events placed by day-of-month, the `today` cell lit blue. */
export function CalendarMonth(props: Omit<CalendarWidgetProps, 'view' | 'focusWeekday'>) {
  return <CalendarWidget {...props} view="month" />
}

/** Seven-day timeline — events placed by `weekday` + `start` / `end`. */
export function CalendarWeek(props: Omit<CalendarWidgetProps, 'view' | 'today' | 'focusWeekday'>) {
  return <CalendarWidget {...props} view="week" />
}

/** Single-day agenda — the events of `focusWeekday` on an hourly timeline. */
export function CalendarDay(props: Omit<CalendarWidgetProps, 'view' | 'today'>) {
  return <CalendarWidget {...props} view="day" />
}

type Theme = ReturnType<typeof useNeoTheme>

function Header({ period, view, theme }: { period: string; view: CalendarView; theme: Theme }) {
  const seg = elevation(theme, { depth: 'recessed', distance: 2, blur: 5, radius: 11 })
  const navPlate = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 10 })
  const views: CalendarView[] = ['day', 'week', 'month']
  const labels: Record<CalendarView, string> = { day: 'Día', week: 'Semana', month: 'Mes' }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <NavButton plate={navPlate} theme={theme} icon="back" />
        <span style={{ fontSize: 17, fontWeight: 600, color: theme.textStrong, minWidth: 96 }}>
          {period}
        </span>
        <NavButton plate={navPlate} theme={theme} icon="arrow" />
      </div>

      {/* Segmented day / week / month switch — the active view lit blue. */}
      <div style={{ display: 'flex', gap: 4, padding: 4, ...seg }}>
        {views.map((v) => {
          const active = v === view
          return (
            <span
              key={v}
              style={{
                padding: '5px 11px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: active ? '#fff' : theme.textMuted,
                background: active ? KIT_BLUE : 'transparent',
              }}
            >
              {labels[v]}
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
  theme: Theme
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

/* ─────────────────────────── Month ─────────────────────────── */

function MonthView({
  events,
  today,
  theme,
  surface,
}: {
  events: CalendarEvent[]
  today: number
  theme: Theme
  surface: CSSProperties
}) {
  // May 2026 starts on a Friday → 4 leading blanks (Mon-indexed).
  const FIRST_OFFSET = 4
  const DAYS_IN_MONTH = 31
  const cells = Array.from({ length: 42 }, (_, i) => {
    const day = i - FIRST_OFFSET + 1
    return day >= 1 && day <= DAYS_IN_MONTH ? day : null
  })
  const eventsOn = (day: number) => events.filter((e) => e.date === day)

  return (
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
                  color: isToday ? KIT_BLUE : theme.textStrong,
                }}
              >
                {day}
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
                {dayEvents.slice(0, 2).map((e, j) => (
                  <div
                    key={j}
                    title={e.title}
                    style={{
                      height: 4,
                      borderRadius: 2,
                      background: BRAND[e.color ?? 'blue'],
                    }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────────── Week ─────────────────────────── */

function WeekView({
  events,
  theme,
  surface,
}: {
  events: CalendarEvent[]
  theme: Theme
  surface: CSSProperties
}) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
  const GRID_H = (DAY_END - DAY_START) * HOUR_H_WEEK
  const y = (h: number) => (h - DAY_START) * HOUR_H_WEEK

  return (
    <div style={{ padding: 12, ...surface }}>
      {/* Weekday header (offset to clear the time gutter). */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `34px repeat(7, 1fr)`,
          marginBottom: 6,
        }}
      >
        <div />
        {WEEKDAYS_LONG.map((d, i) => (
          <div
            key={i}
            style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: theme.textMuted }}
          >
            {d}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `34px repeat(7, 1fr)`, height: GRID_H }}>
        {/* Hour gutter */}
        <div style={{ position: 'relative' }}>
          {hours.map((h) => (
            <span
              key={h}
              style={{
                position: 'absolute',
                top: y(h),
                right: 6,
                transform: 'translateY(-50%)',
                fontSize: 9.5,
                color: theme.textMuted,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Seven day columns */}
        {WEEKDAYS_LONG.map((_, col) => (
          <div
            key={col}
            style={{
              position: 'relative',
              borderLeft: `1px solid ${theme.gridLine}`,
            }}
          >
            {/* Hour lines */}
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  position: 'absolute',
                  top: y(h),
                  left: 0,
                  right: 0,
                  borderTop: `1px solid ${theme.gridLine}`,
                }}
              />
            ))}
            {/* Events for this weekday */}
            {events
              .filter((e) => e.weekday === col && e.start != null && e.end != null)
              .map((e, j) => (
                <EventBlock key={j} event={e} top={y(e.start!)} height={y(e.end!) - y(e.start!)} dense />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ─────────────────────────── Day ─────────────────────────── */

function DayView({
  events,
  focusWeekday,
  theme,
  surface,
}: {
  events: CalendarEvent[]
  focusWeekday: number
  theme: Theme
  surface: CSSProperties
}) {
  const hours = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)
  const GRID_H = (DAY_END - DAY_START) * HOUR_H_DAY
  const y = (h: number) => (h - DAY_START) * HOUR_H_DAY
  const dayEvents = events.filter(
    (e) => e.weekday === focusWeekday && e.start != null && e.end != null,
  )

  return (
    <div style={{ padding: 12, ...surface }}>
      <div style={{ display: 'grid', gridTemplateColumns: `48px 1fr`, height: GRID_H }}>
        {/* Hour gutter + lines */}
        <div style={{ position: 'relative' }}>
          {hours.map((h) => (
            <span
              key={h}
              style={{
                position: 'absolute',
                top: y(h),
                right: 10,
                transform: 'translateY(-50%)',
                fontSize: 11,
                color: theme.textMuted,
              }}
            >
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        <div style={{ position: 'relative', borderLeft: `1px solid ${theme.gridLine}` }}>
          {hours.map((h) => (
            <div
              key={h}
              style={{
                position: 'absolute',
                top: y(h),
                left: 0,
                right: 0,
                borderTop: `1px solid ${theme.gridLine}`,
              }}
            />
          ))}
          {dayEvents.map((e, j) => (
            <EventBlock key={j} event={e} top={y(e.start!)} height={y(e.end!) - y(e.start!)} />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── Shared event chip ─────────────────────────── */

function EventBlock({
  event,
  top,
  height,
  dense = false,
}: {
  /** `top` + `height` are absolute pixels within the timeline column. */
  event: CalendarEvent
  top: number
  height: number
  dense?: boolean
}) {
  const color = BRAND[event.color ?? 'blue']
  const hhmm = (h?: number) => {
    if (h == null) return ''
    const hours = Math.floor(h)
    const mins = Math.round((h - hours) * 60)
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
  }
  // Only show the time line when the block is tall enough to fit both rows.
  const showTime = !dense && height >= 40

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: dense ? 2 : 6,
        right: dense ? 2 : 6,
        height: Math.max(height, dense ? 14 : 22),
        borderRadius: dense ? 5 : 8,
        borderLeft: `3px solid ${color}`,
        background: `${color}26`,
        padding: dense ? '2px 5px' : '5px 10px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: showTime ? 1 : 0,
        overflow: 'hidden',
        fontFamily: TEXT_FONT,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          fontSize: dense ? 9.5 : 12.5,
          fontWeight: 600,
          color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.25,
        }}
      >
        {event.title}
      </div>
      {showTime && (
        <div style={{ fontSize: 10.5, color, opacity: 0.85, lineHeight: 1.2 }}>
          {hhmm(event.start)}–{hhmm(event.end)}
        </div>
      )}
    </div>
  )
}
