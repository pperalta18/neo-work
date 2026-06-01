/**
 * ScheduleFillVideo — a weekly staff rota that fills *itself*.
 * ──────────────────────────────────────────────────────────────────────────
 * An empty neumorphic week calendar (Lun–Dom · 08–21h) sits on the soft grid.
 * Then — as if an unseen scheduler were laying out the shifts — a light "wand"
 * sweeps left→right across the days and a colour‑coded shift for each member of
 * the plantilla **emerges** under it: each block springs up from the surface
 * (scale + rise + a soft coloured shadow growing in), staggered just a couple of
 * frames apart so the whole week populates in a fast, fluid cascade. A live
 * counter ticks the turnos up as they land; the header badge flips from
 * "Generando…" to "Listo ✓" once the grid is full.
 *
 * Beautifully designed within the house language: the AiKit neumorphic surface
 * (#f4f4fa), recessed timeline well, BRAND‑coloured shifts, Universal Sans, an
 * overlapping avatar stack for the team. Overlapping shifts pack into lanes the
 * way a real calendar does (interval‑graph column layout per day).
 *
 * Determinism (house rule): every frame is a pure function of `useCurrentFrame()`
 * — the spring pops, the sweep, the counter and the badge pulse are all derived
 * from the frame number (Math.sin for the breathing glow is fine; no Math.random
 * / Date.now / CSS transitions), so frame N renders byte‑identically every time.
 */

import { type CSSProperties } from 'react'
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
} from 'remotion'
import {
  BRAND,
  KIT_BLUE,
  TEXT_FONT,
  DISPLAY_FONT,
  elevation,
  lightTheme,
  type BrandColor,
} from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts } from './fonts'

const FPS = 30
export const SCHEDULE_FILL_DURATION = 240 // 8s @ 30fps

const theme = lightTheme

// ── frame geometry (1920×1080) ─────────────────────────────────────────────────
const W = 1920
const CARD_W = 1640
const CARD_H = 900
const CARD_X = (W - CARD_W) / 2 // 140
const CARD_Y = 92
const PAD = 40
const CONTENT_W = CARD_W - PAD * 2 // 1560

// header strip inside the card
const HEAD_H = 96
const HEAD_GAP = 22

// the recessed timeline well
const WELL_W = CONTENT_W // 1560
const WELL_H = CARD_H - PAD * 2 - HEAD_H - HEAD_GAP // 702
const GPAD = 14
const GRID_W = WELL_W - GPAD * 2 // 1532
const GRID_H = WELL_H - GPAD * 2 // 674

const TIME_GUTTER = 58
const DAY_HEAD_H = 46
const BODY_H = GRID_H - DAY_HEAD_H // 628
const DAY_COL_W = (GRID_W - TIME_GUTTER) / 7 // ≈210.6

const HSTART = 8
const HEND = 21
const HSPAN = HEND - HSTART // 13
const ROW_H = BODY_H / HSPAN // ≈48.3

const TODAY = 2 // Mié — faintly lit "now" column

/** Y (px, within the timeline body) of an hour. */
const yOf = (h: number) => (h - HSTART) * ROW_H
/** Left (px, within the grid) of a day column. */
const xOf = (d: number) => TIME_GUTTER + d * DAY_COL_W

// ── easing helpers ──────────────────────────────────────────────────────────
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const easeOut = Easing.out(Easing.cubic)
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Eased 0→1 over [start, start+dur]. */
const prog = (f: number, start: number, dur: number, easing = easeOut) =>
  interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing })

/** Fade + rise: content lifts a few px into place as it appears. */
function riseIn(f: number, start: number, dur = 16, dy = 12): CSSProperties {
  const p = prog(f, start, dur)
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

const pad2 = (n: number) => String(n).padStart(2, '0')

// ── the plantilla + the week's shifts ──────────────────────────────────────────
type Person = { name: string; short: string; color: BrandColor }

const PEOPLE: Person[] = [
  { name: 'Lucía', short: 'LU', color: 'teal' },
  { name: 'Marco', short: 'MA', color: 'blue' },
  { name: 'Sofía', short: 'SO', color: 'violet' },
  { name: 'Hugo', short: 'HU', color: 'orange' },
  { name: 'Elena', short: 'EL', color: 'green' },
  { name: 'Iván', short: 'IV', color: 'pink' },
]

type Shift = { day: number; p: number; start: number; end: number }

// day: 0=Lun … 6=Dom · p = index into PEOPLE · hours within 08–21.
const SHIFTS: Shift[] = [
  // Lun — clean morning / afternoon
  { day: 0, p: 0, start: 9, end: 15 },
  { day: 0, p: 1, start: 15, end: 21 },
  // Mar — three (a mid shift bridges the day → two lanes)
  { day: 1, p: 3, start: 8, end: 14 },
  { day: 1, p: 5, start: 11, end: 17 },
  { day: 1, p: 4, start: 14, end: 21 },
  // Mié (today)
  { day: 2, p: 1, start: 9, end: 15 },
  { day: 2, p: 2, start: 15, end: 21 },
  // Jue
  { day: 3, p: 4, start: 8, end: 14 },
  { day: 3, p: 0, start: 12, end: 18 },
  { day: 3, p: 3, start: 14, end: 21 },
  // Vie
  { day: 4, p: 5, start: 9, end: 15 },
  { day: 4, p: 2, start: 13, end: 19 },
  { day: 4, p: 0, start: 15, end: 21 },
  // Sáb
  { day: 5, p: 2, start: 9, end: 15 },
  { day: 5, p: 1, start: 11, end: 17 },
  { day: 5, p: 3, start: 15, end: 21 },
  // Dom — light day
  { day: 6, p: 4, start: 10, end: 16 },
  { day: 6, p: 5, start: 16, end: 21 },
]

// ── lane packing (interval‑graph column layout, per day) ────────────────────────
type Placed = Shift & { lane: number; lanes: number }

function packDay(shifts: Shift[]): Placed[] {
  const sorted = [...shifts].sort((a, b) => a.start - b.start || a.end - b.end)
  const out: Placed[] = []
  let cluster: Shift[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (!cluster.length) return
    const laneEnds: number[] = [] // end hour currently occupying each lane
    const lanesOf: number[] = []
    for (const s of cluster) {
      let lane = laneEnds.findIndex((e) => e <= s.start)
      if (lane === -1) {
        lane = laneEnds.length
        laneEnds.push(s.end)
      } else {
        laneEnds[lane] = s.end
      }
      lanesOf.push(lane)
    }
    const lanes = laneEnds.length
    cluster.forEach((s, i) => out.push({ ...s, lane: lanesOf[i], lanes }))
    cluster = []
  }

  for (const s of sorted) {
    if (cluster.length && s.start >= clusterEnd) {
      flush()
      clusterEnd = -Infinity
    }
    cluster.push(s)
    clusterEnd = Math.max(clusterEnd, s.end)
  }
  flush()
  return out
}

/** All shifts, lane‑packed, then ordered for the left→right / top→down cascade. */
const PLACED: Placed[] = Array.from({ length: 7 }, (_, d) =>
  packDay(SHIFTS.filter((s) => s.day === d)),
)
  .flat()
  .sort((a, b) => a.day - b.day || a.start - b.start || a.lane - b.lane)

// ── fill timeline ───────────────────────────────────────────────────────────────
const INTRO = 16 // card + grid settle in
const FILL_START = 18 // first shift lands
const STAGGER = 2.4 // frames between consecutive shifts
const N = PLACED.length
const appearAt = (i: number) => FILL_START + i * STAGGER
const LAST_APPEAR = appearAt(N - 1) // ≈59
const FILL_DONE = LAST_APPEAR + 20 // springs settled (~79)

// grid x‑range the wand sweeps across (in grid coordinates)
const SWEEP_X0 = TIME_GUTTER
const SWEEP_X1 = GRID_W

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DATES = [1, 2, 3, 4, 5, 6, 7]

// ── shift block (springs out of the surface) ────────────────────────────────────
function ShiftBlock({ f, s, i }: { f: number; s: Placed; i: number }) {
  const local = f - appearAt(i)
  if (local < 0) return null

  const sp = spring({
    frame: local,
    fps: FPS,
    config: { damping: 14, stiffness: 180, mass: 0.7 },
    durationInFrames: 22,
  })
  const opacity = interpolate(local, [0, 5], [0, 1], clamp)
  const scale = 0.7 + 0.3 * sp // slight overshoot → a lively pop
  const dy = (1 - Math.min(1, sp)) * 12
  const sh = clamp01(sp) // shadow strength

  const person = PEOPLE[s.p]
  const color = BRAND[person.color]

  const laneW = (DAY_COL_W - 6) / s.lanes
  const left = xOf(s.day) + 3 + s.lane * laneW
  const top = DAY_HEAD_H + yOf(s.start) + 2
  const height = yOf(s.end) - yOf(s.start) - 4
  const tight = laneW < 150

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: laneW - 4,
        height,
        borderRadius: 11,
        background: `linear-gradient(157deg, ${color}30, ${color}19)`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 ${7 * sh}px ${18 * sh}px ${color}33, inset 0 1px 0 ${color}30`,
        padding: tight ? '6px 8px' : '8px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 4,
        overflow: 'hidden',
        boxSizing: 'border-box',
        fontFamily: TEXT_FONT,
        opacity,
        transform: `translateY(${dy}px) scale(${scale})`,
        transformOrigin: '50% 40%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <span
          style={{
            flex: 'none',
            width: 11,
            height: 11,
            borderRadius: 999,
            background: color,
            boxShadow: `0 0 0 2px ${color}33`,
          }}
        />
        <span
          style={{
            fontSize: tight ? 13 : 14,
            fontWeight: 650,
            color: theme.textStrong,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {person.name}
        </span>
      </div>
      <span style={{ fontSize: tight ? 11 : 12, fontWeight: 550, color: theme.textMuted }}>
        {pad2(s.start)}–{pad2(s.end)}h
      </span>
    </div>
  )
}

// ── the timeline well (recessed) — headers, hour lines, day separators ──────────
function TimelineWell({ f }: { f: number }) {
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 9, radius: 22 })
  const hours = Array.from({ length: HSPAN + 1 }, (_, i) => HSTART + i) // 8..21
  const intro = prog(f, 2, INTRO)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: HEAD_H + HEAD_GAP,
        width: WELL_W,
        height: WELL_H,
        padding: GPAD,
        boxSizing: 'border-box',
        ...well,
        opacity: intro,
      }}
    >
      <div style={{ position: 'relative', width: GRID_W, height: GRID_H }}>
        {/* today's column, faintly lit */}
        <div
          style={{
            position: 'absolute',
            left: xOf(TODAY),
            top: 0,
            width: DAY_COL_W,
            height: GRID_H,
            background: `${KIT_BLUE}0c`,
            borderRadius: 10,
          }}
        />

        {/* day header row */}
        {WEEKDAYS.map((wd, d) => {
          const isToday = d === TODAY
          return (
            <div
              key={wd}
              style={{
                position: 'absolute',
                left: xOf(d),
                top: 0,
                width: DAY_COL_W,
                height: DAY_HEAD_H,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: TEXT_FONT,
                ...riseIn(f, 4 + d * 1.5, 14, 8),
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: 0.3,
                  color: isToday ? KIT_BLUE : theme.textMuted,
                }}
              >
                {wd}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 700,
                  color: isToday ? '#fff' : theme.textStrong,
                  background: isToday ? KIT_BLUE : 'transparent',
                  boxShadow: isToday ? `0 4px 10px ${KIT_BLUE}55` : undefined,
                }}
              >
                {DATES[d]}
              </span>
            </div>
          )
        })}

        {/* hour gutter + horizontal hour lines */}
        {hours.map((h) => {
          const yy = DAY_HEAD_H + yOf(h)
          const last = h === HEND
          return (
            <div key={h} style={{ opacity: intro }}>
              <div
                style={{
                  position: 'absolute',
                  left: TIME_GUTTER - 8,
                  right: 0,
                  top: yy,
                  borderTop: `1px solid ${theme.gridLine}`,
                }}
              />
              {!last && (
                <span
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: yy + 4,
                    width: TIME_GUTTER - 14,
                    textAlign: 'right',
                    fontSize: 11,
                    fontWeight: 550,
                    color: theme.textMuted,
                    fontFamily: TEXT_FONT,
                  }}
                >
                  {pad2(h)}
                </span>
              )}
            </div>
          )
        })}

        {/* vertical day separators */}
        {Array.from({ length: 8 }, (_, d) => (
          <div
            key={d}
            style={{
              position: 'absolute',
              left: xOf(d),
              top: DAY_HEAD_H - 6,
              height: GRID_H - DAY_HEAD_H + 6,
              borderLeft: `1px solid ${theme.gridLine}`,
              opacity: intro * 0.9,
            }}
          />
        ))}

        {/* the shifts, in their own body layer */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: GRID_W, height: GRID_H }}>
          {PLACED.map((s, i) => (
            <ShiftBlock key={`${s.day}-${s.p}-${s.start}`} f={f} s={s} i={i} />
          ))}
        </div>

        {/* the generating "wand" sweeping across the week */}
        <Wand f={f} />
      </div>
    </div>
  )
}

/** A soft vertical light bar (plus a sparkle head) sweeping left→right as shifts land. */
function Wand({ f }: { f: number }) {
  const active = f >= FILL_START - 2 && f <= LAST_APPEAR + 8
  if (!active) return null
  const x = interpolate(f, [FILL_START - 2, LAST_APPEAR + 8], [SWEEP_X0, SWEEP_X1], clamp)
  const fade =
    prog(f, FILL_START - 2, 6) * (1 - prog(f, LAST_APPEAR, 10))
  const spin = f * 9
  return (
    <div style={{ opacity: fade }}>
      <div
        style={{
          position: 'absolute',
          left: x - 34,
          top: DAY_HEAD_H - 2,
          width: 68,
          height: GRID_H - DAY_HEAD_H + 2,
          background: `linear-gradient(90deg, transparent, ${KIT_BLUE}1f 45%, ${KIT_BLUE}12 55%, transparent)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 1,
          top: DAY_HEAD_H - 2,
          width: 2,
          height: GRID_H - DAY_HEAD_H + 2,
          background: `linear-gradient(${KIT_BLUE}00, ${KIT_BLUE}aa, ${KIT_BLUE}00)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: x - 13,
          top: DAY_HEAD_H - 16,
          transform: `rotate(${spin}deg)`,
          color: KIT_BLUE,
          filter: `drop-shadow(0 2px 6px ${KIT_BLUE}66)`,
        }}
      >
        <Icon name="sparkles" size={26} color={KIT_BLUE} />
      </div>
    </div>
  )
}

// ── card header — title, avatar stack, AI badge, live counter ───────────────────
function CardHeader({ f }: { f: number }) {
  const iconPlate = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 14 })
  // live count of landed shifts
  const landed = PLACED.reduce((n, _s, i) => (f >= appearAt(i) + 3 ? n + 1 : n), 0)

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: CONTENT_W,
        height: HEAD_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      {/* left — icon + titles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, ...riseIn(f, 0, 16, 10) }}>
        <div
          style={{
            width: 60,
            height: 60,
            display: 'grid',
            placeItems: 'center',
            ...iconPlate,
          }}
        >
          <Icon name="calendar" size={30} color={KIT_BLUE} strokeWidth={2} />
        </div>
        <div>
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: 2.4,
              color: theme.textMuted,
              marginBottom: 4,
            }}
          >
            HORARIO · PLANTILLA
          </div>
          <div
            style={{
              fontFamily: DISPLAY_FONT,
              fontWeight: 700,
              fontSize: 32,
              letterSpacing: -0.6,
              color: theme.textStrong,
              lineHeight: 1,
            }}
          >
            Semana del 1 al 7 de junio
          </div>
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontSize: 15,
              color: theme.textMuted,
              marginTop: 6,
            }}
          >
            <strong style={{ color: theme.textStrong, fontWeight: 650 }}>{landed}</strong> turnos
            {' · '}
            <strong style={{ color: theme.textStrong, fontWeight: 650 }}>{PEOPLE.length}</strong>{' '}
            personas
          </div>
        </div>
      </div>

      {/* right — avatar stack + AI badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <AvatarStack f={f} />
        <AiBadge f={f} />
      </div>
    </div>
  )
}

function AvatarStack({ f }: { f: number }) {
  const STEP = 30
  const D = 46
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      <div
        style={{
          fontFamily: TEXT_FONT,
          fontSize: 11.5,
          fontWeight: 600,
          letterSpacing: 1.8,
          color: theme.textMuted,
        }}
      >
        LA PLANTILLA
      </div>
      <div style={{ position: 'relative', height: D, width: D + STEP * (PEOPLE.length - 1) }}>
        {PEOPLE.map((p, i) => {
          const color = BRAND[p.color]
          const r = riseIn(f, 3 + i * 2.5, 14, 0)
          const s = prog(f, 3 + i * 2.5, 14)
          return (
            <div
              key={p.name}
              style={{
                position: 'absolute',
                left: i * STEP,
                top: 0,
                width: D,
                height: D,
                borderRadius: 999,
                background: color,
                border: '3px solid #f4f4fa',
                display: 'grid',
                placeItems: 'center',
                color: '#fff',
                fontFamily: TEXT_FONT,
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 0.3,
                boxShadow: `0 6px 14px ${color}44`,
                zIndex: i,
                opacity: r.opacity,
                transform: `scale(${0.6 + 0.4 * s})`,
              }}
            >
              {p.short}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AiBadge({ f }: { f: number }) {
  const done = f >= FILL_DONE
  const pill = elevation(theme, { depth: 'raised', distance: 4, blur: 9, radius: 999 })
  // breathing glow while generating; a soft settle pulse once done
  const pulse = done
    ? prog(f, FILL_DONE, 14)
    : (Math.sin(f / 5) + 1) / 2
  const accent = done ? BRAND.green : KIT_BLUE
  const spin = f * 8

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 20px 12px 14px',
        ...pill,
        boxShadow: `${(pill.boxShadow as string) ?? ''}, 0 0 ${10 + pulse * 16}px ${accent}${done ? '4d' : '33'}`,
        ...riseIn(f, 6, 16, 10),
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 999,
          display: 'grid',
          placeItems: 'center',
          background: `${accent}1f`,
          transform: done ? 'none' : `rotate(${spin}deg)`,
        }}
      >
        <Icon name={done ? 'check' : 'sparkles'} size={18} color={accent} strokeWidth={2.4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span
          style={{
            fontFamily: TEXT_FONT,
            fontSize: 15,
            fontWeight: 650,
            color: theme.textStrong,
            lineHeight: 1.1,
          }}
        >
          {done ? 'Horario listo' : 'Generando horario'}
        </span>
        <span style={{ fontFamily: TEXT_FONT, fontSize: 12, color: theme.textMuted }}>
          {done ? 'Cobertura completa' : 'Asignando turnos…'}
        </span>
      </div>
    </div>
  )
}

// ── composition root ──────────────────────────────────────────────────────────
export const ScheduleFillVideo: React.FC = () => {
  const f = useCurrentFrame()
  // card lifts + settles into the workspace at the very start
  const cardIn = prog(f, 0, INTRO)
  const cardPlate = elevation(theme, { depth: 'raised', distance: 12, blur: 30, radius: 30 })
  // a gentle "complete" breath of the whole card once the grid is full
  const settle = prog(f, FILL_DONE, 18)

  return (
    <AbsoluteFill style={{ background: theme.surface }}>
      <Fonts />
      {/* soft radial depth behind the card */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(1200px 760px at 50% 36%, #ffffff 0%, ${theme.surface} 62%, #ececf4 100%)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          padding: PAD,
          boxSizing: 'border-box',
          ...cardPlate,
          boxShadow: `${(cardPlate.boxShadow as string) ?? ''}${settle > 0 ? `, 0 0 ${settle * 60}px ${KIT_BLUE}12` : ''}`,
          opacity: cardIn,
          transform: `translateY(${(1 - cardIn) * 26}px) scale(${interpolate(cardIn, [0, 1], [0.985, 1])})`,
        }}
      >
        <div style={{ position: 'relative', width: CONTENT_W, height: CARD_H - PAD * 2 }}>
          <CardHeader f={f} />
          <TimelineWell f={f} />
        </div>
      </div>
    </AbsoluteFill>
  )
}
