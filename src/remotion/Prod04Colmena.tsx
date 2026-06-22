import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { elevation, lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'
import { BaGraph } from './aikit/BaGraph'
import { ToastStack } from './aikit/NotificationToast'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import {
  BA_EDGES,
  BA_LAYOUT,
  BA_TIMING,
  COUNTERS,
  COUNTERS_AT,
  countByKindAt,
  PROD04_CAM,
  PROD04_CAPTIONS,
  PROD04_COPY,
  PROD04_TOASTS,
} from './prod04Script'

export { PROD04_DURATION } from './prod04Script'

/**
 * Prod04Colmena — Acto 4, «se reproduce» (90s · 1920×1080).
 * ──────────────────────────────────────────────────────────
 * One delegated process becomes a living company. The Acto-3 node sits alone
 * and alight; then it reproduces — Manolo's wave (3 tiles), Laura's app de
 * predicción (8 tiles), an accelerated montage of everyone else, and two
 * branches AiKit links unprompted. The camera pulls all the way back to a
 * 46-node organism breathing, while live counters settle on the guión's tally
 * (7 apps · 12 procesos · 3 BBDD · 24 personas) and a final notification
 * announces a process the system proposed by itself. All choreography lives in
 * prod04Script.ts; this composes the kit (BaGraph + ToastStack + camera).
 */

const theme = lightTheme

export function Prod04Colmena() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(PROD04_CAM, frame, CURVE.standard), frame)

  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong, overflow: 'hidden' }}
    >
      <Fonts />

      {/* ── the organism, shot through the virtual camera ── */}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        <BaGraph layout={BA_LAYOUT} edges={BA_EDGES} timing={BA_TIMING} theme={theme} breathe={1} />
      </div>

      {/* ── screen-space rotulación ── */}
      <Eyebrow frame={frame} />
      <Counters frame={frame} />
      <Captions frame={frame} />

      {/* The notifications cascade in the quiet bottom-right corner. */}
      <div style={{ position: 'absolute', right: 64, bottom: 150, width: 360 }}>
        <ToastStack script={PROD04_TOASTS} direction="up" width={360} toastHeight={120} theme={theme} />
      </div>
    </AbsoluteFill>
  )
}

/* ── screen-space rotulación ───────────────────────────────────────────── */

function Eyebrow({ frame }: { frame: number }) {
  const enter = ease(frame, 18, 18 + DUR.reveal)
  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        top: 46,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: 2.4,
        color: theme.textMuted,
        opacity: 0.78 * enter,
      }}
    >
      {PROD04_COPY.eyebrow}
    </div>
  )
}

/** The live KPI strip — four counters that tick up with the organism and
 * settle on the guión tally. Reads the true ignited-node count per frame. */
function Counters({ frame }: { frame: number }) {
  const rise = ease(frame, COUNTERS_AT, COUNTERS_AT + DUR.reveal)
  if (rise <= 0.001) return null
  const card = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 22 })
  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: '50%',
        transform: `translate(-50%, ${(1 - rise) * 12}px)`,
        display: 'flex',
        alignItems: 'stretch',
        gap: 14,
        padding: '12px 16px',
        opacity: rise,
        ...card,
      }}
    >
      {COUNTERS.map((c, i) => (
        <div key={c.kind} style={{ display: 'flex', alignItems: 'stretch', gap: 14 }}>
          {i > 0 && <span style={{ width: 1, background: theme.gridLine, opacity: 0.6 }} />}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '2px 6px' }}>
            <span
              style={{
                fontSize: 34,
                fontWeight: 680,
                letterSpacing: -0.8,
                lineHeight: 1,
                fontVariantNumeric: 'tabular-nums',
                color: theme.textStrong,
              }}
            >
              {countByKindAt(frame, c.kind)}
            </span>
            <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: theme.textMuted }}>
              {c.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function Captions({ frame }: { frame: number }) {
  return (
    <>
      {PROD04_CAPTIONS.map((c) => {
        const enter = ease(frame, c.showAt, c.showAt + 12)
        const exit = 1 - ease(frame, c.hideAt - 10, c.hideAt)
        const p = enter * exit
        if (p <= 0.001) return null
        return (
          <div
            key={c.showAt}
            style={{
              position: 'absolute',
              left: 96,
              top: 975,
              maxWidth: 900,
              fontSize: 26,
              fontWeight: 500,
              letterSpacing: -0.3,
              lineHeight: 1.3,
              color: theme.textStrong,
              opacity: 0.88 * p,
              transform: `translateY(${(1 - enter) * 10}px)`,
            }}
          >
            {c.text}
          </div>
        )
      })}
    </>
  )
}
