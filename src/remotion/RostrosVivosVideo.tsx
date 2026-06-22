/**
 * RostrosVivosVideo — «Rostros vivos».
 * ──────────────────────────────────────────────────────────────────────────
 * STACKED «Tejido vivo» compositions. Every layer is the organism of
 * micro-processes (camera + tissue reused verbatim from tejidoVivoScript) with
 * the user's face as a neumorphic circle in its top-left corner cell. The
 * cells are painted the SAME colour as the (slightly darker) brand ground, so
 * relief comes only from the neumorphic shadow. Upper layers run DIFFERENT
 * processes (their own seed) and carry ANOTHER profile, sitting on top as
 * offset sheets that slide+fade in and cast a light drop shadow.
 */
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import {
  AbsoluteFill,
  Img,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { CELL as NEO_CELL, elevation, lightTheme, type NeoTheme } from '@/lib/neumorphism'
import { Grid } from '@/components/Grid'
import { MODULES } from '@/stories/neo/modules/modules'
import { FlowPlate } from './storeFlowScene'
import { Fonts } from './fonts'
import {
  COLUMNS,
  GRID_H,
  GRID_W,
  ROWS,
  breathAt,
  cameraPZ,
  clamp01,
  generateMaster,
  isActive,
  revealAt,
  stepDecayAt,
  type FlowEvent,
} from './tejidoVivoScript'
import {
  ALL_FACE_SRCS,
  LAYERS,
  OWNER_CENTER,
  OWNER_DIAM,
  ROSTROS_VIVOS_DURATION,
  ownerRevealAt,
  sheetStateAt,
  type Face,
  type Layer,
} from './rostrosVivosScript'

export { ROSTROS_VIVOS_DURATION }

// Slightly darker brand ground — and the cells are painted this SAME colour, so
// the only thing that lifts a plate off the field is its neumorphic shadow.
const sceneTheme: NeoTheme = {
  ...lightTheme,
  surface: '#e6e8f1',
  gridLine: 'rgba(150, 168, 196, 0.42)',
}

// Each layer's process schedule, generated once from its seed.
const MASTERS: Record<string, FlowEvent[]> = {}
for (const L of LAYERS) MASTERS[L.id] = generateMaster(L.seed)

export function RostrosVivosVideo() {
  const frame = useCurrentFrame()
  const { width: FW, height: FH } = useVideoConfig()
  usePreload()

  return (
    <AbsoluteFill style={{ backgroundColor: sceneTheme.surface }}>
      <Fonts />
      {LAYERS.map((L) => {
        const lw = Math.round(FW * L.scale)
        const lh = Math.round(FH * L.scale)
        const sh = sheetStateAt(L, frame)
        if (sh.opacity <= 0.001) return null
        const isBase = L.enterAt <= 0
        const k = sh.land
        return (
          <div
            key={L.id}
            style={{
              position: 'absolute',
              left: L.offset[0],
              top: L.offset[1] + sh.dy,
              width: lw,
              height: lh,
              opacity: sh.opacity,
              borderRadius: isBase ? 0 : 30,
              overflow: 'hidden',
              background: sceneTheme.surface,
              boxShadow: isBase
                ? 'none'
                : `0 ${Math.round(26 * k + 6)}px ${Math.round(64 * k + 16)}px -${Math.round(22 * k + 8)}px rgba(40,52,74,${(0.32 * k).toFixed(3)}), 0 4px 14px -6px rgba(40,52,74,${(0.16 * k).toFixed(3)}), inset 0 0 0 1px ${sceneTheme.gridLine}`,
            }}
          >
            <TissueLayer master={MASTERS[L.id]} face={L.face} W={lw} H={lh} frame={frame} />
          </div>
        )
      })}
    </AbsoluteFill>
  )
}

/** One «Tejido vivo» composition: the breathing camera over a field of flows
 *  (from `master`) plus this layer's face in the top-left corner cell. */
function TissueLayer({
  master,
  face,
  W,
  H,
  frame,
}: {
  master: FlowEvent[]
  face: Face
  W: number
  H: number
  frame: number
}): ReactNode {
  const { P, Z } = cameraPZ(frame, W, H)
  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - P[0] * Z}px, ${H / 2 - P[1] * Z}px) scale(${Z})`,
  }
  const flows = useMemo(() => master.filter((ev) => isActive(ev, frame)), [master, frame])
  const breath = breathAt(frame)
  const oRev = ownerRevealAt(frame)

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <div style={camera}>
        <Grid
          columns={COLUMNS}
          rows={ROWS}
          cell={NEO_CELL}
          theme={sceneTheme}
          gridlines
          style={{ width: GRID_W, height: GRID_H }}
        >
          {flows.map((ev) => {
            const reveal = revealAt(ev, frame)
            const live = ev.kind === 'ephemeral'
            return ev.placed.map((p, i) => {
              const gEmerge = clamp01(reveal - i)
              if (gEmerge <= 0.001) return null
              const decay = stepDecayAt(ev, frame, i)
              const breathMul = live ? 1 + 0.02 * breath : 1
              const dist = Math.hypot(p.centerPx[0] - P[0], p.centerPx[1] - P[1])
              const dof = 1 - 0.08 * clamp01((dist - 700) / 900)
              return (
                <FlowPlate
                  key={`${ev.id}:${i}`}
                  step={p.step}
                  dir={p.dir}
                  grow={gEmerge * (1 - decay) * breathMul}
                  scaleMul={1 - 0.12 * decay}
                  opacityMul={(1 - decay) * dof}
                  surfaceTheme={sceneTheme}
                />
              )
            })
          })}

          {/* This layer's face — a neumorphic circle in the top-left corner cell. */}
          {oRev > 0.001 ? (
            <div
              style={{
                position: 'absolute',
                left: OWNER_CENTER[0] - OWNER_DIAM / 2,
                top: OWNER_CENTER[1] - OWNER_DIAM / 2,
                width: OWNER_DIAM,
                height: OWNER_DIAM,
                transform: `scale(${0.85 + 0.15 * oRev})`,
                transformOrigin: 'center',
                opacity: clamp01(oRev * 1.4),
              }}
            >
              <FaceCircle src={face.src} diameter={OWNER_DIAM} />
            </div>
          ) : null}
        </Grid>
      </div>
    </div>
  )
}

/** A face clipped into a raised neumorphic circle. */
function FaceCircle({ src, diameter }: { src: string; diameter: number }): ReactNode {
  return (
    <div
      style={{
        position: 'relative',
        width: diameter,
        height: diameter,
        borderRadius: 999,
        overflow: 'hidden',
        ...elevation(sceneTheme, { depth: 'raised', radius: 999, distance: 8, blur: 16 }),
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 999,
          boxShadow: 'inset 0 0 0 3px rgba(255,255,255,0.5), inset 0 0 0 4px rgba(150,168,196,0.25)',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

/** Warm the browser cache for all module icons + the face PNGs (frame-0 ready). */
function usePreload() {
  const [handle] = useState(() => delayRender('Preload rostros + module icons', { timeoutInMilliseconds: 16000 }))
  useEffect(() => {
    const urls = [
      ...Array.from(new Set(Object.values(MODULES).map((m) => m.icon))),
      ...ALL_FACE_SRCS.map((s) => staticFile(s)),
    ]
    if (urls.length === 0) {
      continueRender(handle)
      return
    }
    let done = 0
    const tick = () => {
      done += 1
      if (done >= urls.length) continueRender(handle)
    }
    for (const url of urls) {
      const img = new Image()
      img.onload = tick
      img.onerror = tick
      img.src = url
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
