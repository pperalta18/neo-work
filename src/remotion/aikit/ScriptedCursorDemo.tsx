import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BRAND, elevation, lightTheme } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts, BODY_FONT } from '../fonts'
import { CURVE } from '../motion'
import { AppWindow } from './AppWindow'
import { appWindowTimeline, phase } from './windowScript'
import { ScriptedCursor } from './ScriptedCursor'
import { CLICK_SETTLE, type CursorWaypoint, clickLandFrame, cursorScriptDuration } from './cursorScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for ScriptedCursor; not part of the event deck.
 * A CRM window draws in; the cursor enters once it settles, picks a client row,
 * presses Guardar (the UI reacts exactly at clickLandFrame) and vanishes. */

const theme = lightTheme

// ── stage geometry (absolute 1920×1080 coords; the cursor scripts against these)
const W = 760
const H = 520
const X = (1920 - W) / 2
const Y = (1080 - H) / 2
/** Viewport content origin: window padding 18 + chrome ≈31 + gap 14 + viewport padding 18. */
const CONTENT_X = X + 36
const CONTENT_Y = Y + 81
const CONTENT_W = W - 72

const BTN_W = 220
const BTN_H = 54
const BTN_LOCAL = { x: CONTENT_W - BTN_W, y: 300 }
const ROW_H = 56
const rowLocalY = (i: number) => 46 + i * (ROW_H + 12)

// ── choreography: window settles → cursor acts
const WIN_ENTER = 8
const TL = appWindowTimeline('draw', WIN_ENTER)
const S = TL.settledAt

const SCRIPT: CursorWaypoint[] = [
  { at: S + 4, x: X + W + 110, y: Y + H + 50 }, // waits just off the window's corner
  {
    at: S + 30, // picks the client row
    x: CONTENT_X + 180,
    y: CONTENT_Y + rowLocalY(0) + ROW_H / 2,
    state: 'arrow',
    click: true,
    travel: 18,
  },
  {
    at: S + 68, // presses Guardar
    x: CONTENT_X + BTN_LOCAL.x + BTN_W / 2,
    y: CONTENT_Y + BTN_LOCAL.y + BTN_H / 2,
    state: 'arrow',
    click: true,
    travel: 16,
  },
  { at: S + 108, x: X + W + 60, y: Y + H - 40, state: 'arrow', travel: 18, vanish: 22 },
]

const ROW_CLICK = clickLandFrame(SCRIPT[1])
const SAVE_AT = SCRIPT[2].at
const SAVE_CLICK = clickLandFrame(SCRIPT[2])

export const SCRIPTED_CURSOR_DEMO_DURATION = cursorScriptDuration(SCRIPT)

export function ScriptedCursorDemo() {
  const frame = useCurrentFrame()

  const rowSel = CURVE.enter(phase(frame, ROW_CLICK, ROW_CLICK + 8))
  const pressed = frame >= SAVE_AT && frame < SAVE_AT + CLICK_SETTLE
  const savedP = CURVE.enter(phase(frame, SAVE_CLICK + 2, SAVE_CLICK + 12))

  const rows = [
    { name: CAST.clientCompany, contact: CAST.clientContact },
    { name: CAST.company, contact: CAST.owner },
  ]

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.surface,
        fontFamily: BODY_FONT,
        color: theme.textStrong,
      }}
    >
      <Fonts />
      <div style={{ position: 'absolute', left: X, top: Y }}>
        <AppWindow title="CRM · Clientes" icon="user" width={W} height={H} enter="draw" enterAt={WIN_ENTER}>
          <div style={{ position: 'relative', width: '100%', height: '100%', fontSize: 15 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, color: theme.textMuted, fontSize: 13, letterSpacing: 0.3 }}>
              Clientes recientes
            </div>
            {rows.map((row, i) => {
              const sel = i === 0 ? rowSel : 0
              const lift = elevation(theme, {
                depth: sel > 0.5 ? 'recessed' : 'flat',
                distance: 3,
                blur: 7,
                radius: 14,
              })
              return (
                <div
                  key={row.name}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: rowLocalY(i),
                    width: '100%',
                    height: ROW_H,
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '0 18px',
                    ...lift,
                    boxShadow: sel > 0.5 ? lift.boxShadow : 'none',
                  }}
                >
                  <span
                    style={{
                      width: 4,
                      height: 26,
                      borderRadius: 2,
                      background: BRAND.blue,
                      opacity: sel,
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{row.name}</span>
                  <span style={{ color: theme.textMuted, fontSize: 13 }}>{row.contact}</span>
                </div>
              )
            })}

            {/* Guardar — gives under the press, exactly at the click */}
            <div
              style={{
                position: 'absolute',
                left: BTN_LOCAL.x,
                top: BTN_LOCAL.y,
                width: BTN_W,
                height: BTN_H,
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontWeight: 600,
                ...elevation(theme, { depth: pressed ? 'recessed' : 'raised', distance: pressed ? 3 : 5, blur: pressed ? 7 : 10, radius: 16 }),
              }}
            >
              Guardar cambios
            </div>

            {/* the saved chip rises once the click lands */}
            <div
              style={{
                position: 'absolute',
                left: BTN_LOCAL.x + 18,
                top: BTN_LOCAL.y - 52,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                fontSize: 13,
                color: theme.textMuted,
                opacity: savedP,
                transform: `translateY(${(1 - savedP) * 8}px)`,
                ...elevation(theme, { depth: 'raised', distance: 4, blur: 8, radius: 999 }),
              }}
            >
              <Icon name="check" size={14} color={BRAND.green} />
              Guardado
            </div>
          </div>
        </AppWindow>
      </div>

      <ScriptedCursor script={SCRIPT} />
    </AbsoluteFill>
  )
}
