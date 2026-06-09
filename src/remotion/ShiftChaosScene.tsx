/**
 * ShiftChaosScene — acto 1 de la mini-película Planificación de Horarios.
 * ──────────────────────────────────────────────────────────────────────────
 * El problema: cuadrar una semana a mano. Un tablero de turnos aparece lleno de
 * solapes, huecos y notas sueltas (Excel, WhatsApp, vacaciones, contrato). Es una
 * representación propia, distinta de la lluvia de soporte, el borrador de email y
 * el enjambre de e-commerce: aquí el caos es una planilla que se contradice.
 */

import { Fragment, type CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion'
import { elevation, lightTheme, BRAND, KIT_BLUE, DISPLAY_FONT, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { Fonts } from './fonts'

const theme = lightTheme
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const SLOTS = ['08-12', '12-16', '16-20', '20-00']

type ShiftNote = {
  day: number
  slot: number
  name: string
  color: BrandColor
  conflict?: boolean
  offset?: number
}

const NOTES: ShiftNote[] = [
  { day: 0, slot: 0, name: 'Lucía', color: 'teal' },
  { day: 0, slot: 2, name: 'Marco', color: 'blue' },
  { day: 1, slot: 0, name: 'Hugo', color: 'orange' },
  { day: 1, slot: 1, name: 'Elena', color: 'green', conflict: true },
  { day: 1, slot: 1, name: 'Sofía', color: 'violet', conflict: true, offset: 18 },
  { day: 2, slot: 0, name: 'Marco', color: 'blue' },
  { day: 2, slot: 3, name: 'Iván', color: 'pink' },
  { day: 3, slot: 1, name: 'Lucía', color: 'teal', conflict: true },
  { day: 3, slot: 1, name: 'Hugo', color: 'orange', conflict: true, offset: 16 },
  { day: 4, slot: 0, name: 'Elena', color: 'green' },
  { day: 4, slot: 2, name: 'Sofía', color: 'violet' },
  { day: 5, slot: 1, name: 'Marco', color: 'blue', conflict: true },
  { day: 6, slot: 2, name: 'Iván', color: 'pink' },
]

const FLOATING: Array<{ label: string; sub: string; icon: IconName; color: BrandColor; x: number; y: number }> = [
  { label: 'plantilla_v7.xlsx', sub: 'última última', icon: 'spreadsheet', color: 'green', x: 0.17, y: 0.28 },
  { label: 'Cambio por WhatsApp', sub: 'Marco no puede viernes', icon: 'chat', color: 'teal', x: 0.82, y: 0.25 },
  { label: 'Vacaciones', sub: 'Sofía · pendiente', icon: 'vacation', color: 'orange', x: 0.18, y: 0.75 },
  { label: 'Contrato 20 h', sub: 'tope semanal', icon: 'alert', color: 'red', x: 0.83, y: 0.74 },
]

export const SHIFT_CHAOS_DURATION = 165 // cola ampliada para leer las notas flotantes finales

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const ease = (x: number) => {
  const t = clamp01(x)
  return t * t * (3 - 2 * t)
}

function rise(frame: number, start: number, dur = 16, dy = 16): CSSProperties {
  const p = ease((frame - start) / dur)
  return {
    opacity: p,
    transform: `translateY(${(1 - p) * dy}px) scale(${0.97 + 0.03 * p})`,
  }
}

function ShiftChip({ note, frame, i }: { note: ShiftNote; frame: number; i: number }) {
  const color = BRAND[note.color]
  const show = spring({ frame: frame - 22 - i * 3, fps: 30, config: { damping: 16, stiffness: 150, mass: 0.75 } })
  if (show <= 0.001) return null

  const wobble = Math.sin((frame + i * 13) / 7) * (note.conflict ? 1.6 : 0.4)
  const top = 14 + (note.offset ?? 0)
  return (
    <div
      style={{
        position: 'absolute',
        left: 10,
        right: 10,
        top,
        height: 34,
        borderRadius: 10,
        background: note.conflict ? `${BRAND.red}1f` : `${color}24`,
        borderLeft: `3px solid ${note.conflict ? BRAND.red : color}`,
        boxShadow: `0 5px 12px ${note.conflict ? BRAND.red : color}22`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 10px',
        fontFamily: TEXT_FONT,
        opacity: clamp01(show),
        transform: `translateY(${(1 - show) * 12}px) rotate(${wobble}deg)`,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: note.conflict ? BRAND.red : color }} />
      <span style={{ fontSize: 13, fontWeight: 650, color: theme.textStrong }}>{note.name}</span>
      {note.conflict ? (
        <span style={{ marginLeft: 'auto', color: BRAND.red }}>
          <Icon name="alert" size={15} color={BRAND.red} strokeWidth={2.1} />
        </span>
      ) : null}
    </div>
  )
}

function Board({ frame }: { frame: number }) {
  const board = elevation(theme, { depth: 'raised', distance: 12, blur: 28, radius: 28 })
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 18 })
  const boardIn = spring({ frame: frame - 4, fps: 30, config: { damping: 200, mass: 0.75 } })
  const missing = new Set(['2-2', '5-3', '6-0'])

  return (
    <div
      style={{
        width: 1220,
        height: 650,
        padding: 28,
        boxSizing: 'border-box',
        background: theme.surface,
        opacity: boardIn,
        transform: `translateY(${(1 - boardIn) * 24}px) scale(${0.98 + 0.02 * boardIn})`,
        ...board,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '110px repeat(7, 1fr)', gap: 8, fontFamily: TEXT_FONT }}>
        <div />
        {DAYS.map((day, i) => (
          <div
            key={day}
            style={{
              height: 42,
              display: 'grid',
              placeItems: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: i >= 5 ? KIT_BLUE : theme.textStrong,
              ...rise(frame, 8 + i * 2, 12, 8),
            }}
          >
            {day}
          </div>
        ))}
        {SLOTS.map((slot, slotIndex) => (
          <Fragment key={slot}>
            <div
              style={{
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: 14,
                color: theme.textMuted,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {slot}
            </div>
            {DAYS.map((_day, dayIndex) => {
              const cellNotes = NOTES.filter((n) => n.day === dayIndex && n.slot === slotIndex)
              const isMissing = missing.has(`${dayIndex}-${slotIndex}`)
              return (
                <div
                  key={`${dayIndex}-${slotIndex}`}
                  style={{
                    position: 'relative',
                    height: 120,
                    overflow: 'hidden',
                    ...well,
                    boxShadow: `${well.boxShadow as string}${isMissing ? `, inset 0 0 0 2px ${BRAND.red}66` : ''}`,
                  }}
                >
                  {isMissing ? (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        color: BRAND.red,
                        opacity: interpolate(frame, [42, 58], [0, 1], clamp),
                      }}
                    >
                      <Icon name="alert" size={24} color={BRAND.red} strokeWidth={2.2} />
                    </div>
                  ) : null}
                  {cellNotes.map((note) => (
                    <ShiftChip key={`${note.name}-${note.day}-${note.slot}-${note.offset ?? 0}`} note={note} frame={frame} i={NOTES.indexOf(note)} />
                  ))}
                </div>
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function FloatingNote({
  item,
  i,
  frame,
  W,
  H,
}: {
  item: (typeof FLOATING)[number]
  i: number
  frame: number
  W: number
  H: number
}) {
  const plate = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 16 })
  const p = spring({ frame: frame - 34 - i * 8, fps: 30, config: { damping: 15, stiffness: 130, mass: 0.75 } })
  if (p <= 0.001) return null
  const color = BRAND[item.color]
  const tilt = (i % 2 === 0 ? -1 : 1) * (3 + Math.sin(frame / 12 + i) * 0.8)

  return (
    <div
      style={{
        position: 'absolute',
        left: item.x * W,
        top: item.y * H,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 18}px) rotate(${tilt}deg)`,
        opacity: p,
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '12px 15px',
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${color}1f` }}>
        <Icon name={item.icon} size={18} color={color} strokeWidth={2} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: theme.textStrong }}>{item.label}</span>
        <span style={{ fontSize: 12, color: theme.textMuted }}>{item.sub}</span>
      </div>
    </div>
  )
}

export function ShiftChaosScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const header = rise(frame, 0, 16, -12)
  const count = Math.round(interpolate(frame, [18, 92], [3, 14], clamp))

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'absolute',
            top: 104,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: DISPLAY_FONT,
            ...header,
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 700, color: theme.textStrong, lineHeight: 1 }}>
            <span style={{ color: BRAND.red }}>{count}</span> conflictos en una semana
          </div>
          <div style={{ marginTop: 8, fontFamily: TEXT_FONT, fontSize: 17, color: theme.textMuted }}>
            solapes · huecos · cambios por chat · contratos que no cuadran
          </div>
        </div>

        <Board frame={frame} />

        {FLOATING.map((item, i) => (
          <FloatingNote key={item.label} item={item} i={i} frame={frame} W={W} H={H} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
