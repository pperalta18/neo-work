import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ContactShadows } from '@react-three/drei'
import { ThreeCanvas } from '@remotion/three'
import { continueRender, delayRender, staticFile } from 'remotion'
import {
  Box3,
  Euler,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three'
import { FBXLoader } from 'three-stdlib'

/**
 * Phone3DStage — a Remotion-safe sibling of `stories/mockup/Phone3D`.
 * ──────────────────────────────────────────────────────────────────────────
 * The Storybook `Phone3D` paints onto a real iPhone-15 FBX, but it drives its
 * sway from a wall-clock `useFrame` and runs in a plain `@react-three/fiber`
 * <Canvas>, so `remotion render` can't capture it deterministically.
 *
 * This stage renders the SAME model inside `@remotion/three`'s <ThreeCanvas>
 * (GloboVivo's proven export path) and is built around two hard-won facts about
 * headless Remotion rendering:
 *
 *   1. Effects inside the r3f canvas subtree are NOT reliably run during a still
 *      capture — so the FBX is loaded in the MAIN tree (via `delayRender`, like
 *      GloboVivo's `useEarthMaps`) and the chassis materials are baked
 *      synchronously inside the fit `useMemo`, never in a canvas-side effect.
 *   2. drei's `<Html transform>` does not paint in a headless still — so the
 *      screen UI is a plain DOM overlay (a sibling of the canvas) projected onto
 *      the glass with a `matrix3d` computed from the SAME camera that draws the
 *      WebGL phone. Pure per-frame math → deterministic, always captured.
 */

const MODEL_URL = staticFile('models/iphone15.fbx')
const TARGET_HEIGHT = 17 // world units the model is normalised to
const FALLBACK_SCREEN_RATIO = 0.462
const NEAR = 0.1
const FAR = 1000
/** Logical width of the painted screen UI (design your screen at this width). */
export const PHONE_SCREEN_PX = 360

export type Phone3DStageProps = {
  /** Canvas size (usually the composition width/height). */
  width: number
  height: number
  /** React UI painted onto the glass — design it at PHONE_SCREEN_PX wide, height:'100%'. */
  screen: ReactNode
  /** Colour behind the screen content (shows through transparency). Default near-black. */
  screenBackground?: string
  /** Rig rotation [x, y] in radians (feed sway/tilt from the frame). */
  rotation?: [number, number]
  /** Uniform zoom of the whole device (push-in). Default 1. */
  zoom?: number
  /** Vertical offset of the device in world units (rise-in). Default 0. */
  posY?: number
  /** Camera distance — smaller = larger phone. Default 44. */
  cameraZ?: number
  /** Repaint the chassis (omit to keep the model's own materials). */
  bodyColor?: string
  bodyRoughness?: number
  bodyMetalness?: number
  /** Screen corner radius as a fraction of screen width. Default 0.12. */
  screenCornerRatio?: number
  /** Faint diagonal glass glare. Default true. */
  glare?: boolean
  /** Soft contact shadow under the phone. Default true. */
  shadow?: boolean
}

export function Phone3DStage({
  width,
  height,
  screen,
  screenBackground = '#05070b',
  rotation = [-0.087, -0.31],
  zoom = 1,
  posY = 0,
  cameraZ = 44,
  bodyColor,
  bodyRoughness = 0.62,
  bodyMetalness = 0.08,
  screenCornerRatio = 0.12,
  glare = true,
  shadow = true,
}: Phone3DStageProps) {
  // Load the FBX in the MAIN React tree (canvas-subtree effects don't fire during
  // a headless still) — Remotion reliably honours this `delayRender` handle.
  const fbx = useFbxModel(MODEL_URL)
  const fitted = useMemo(
    () => (fbx ? fitPhone(fbx, { bodyColor, bodyRoughness, bodyMetalness }) : null),
    [fbx, bodyColor, bodyRoughness, bodyMetalness],
  )

  // Project the screen rectangle's four corners through the same camera the canvas
  // uses, then derive the CSS matrix3d that maps the flat lock-screen DOM onto the
  // tilted glass. Pure function of the frame-driven rig props.
  const overlay = useMemo(() => {
    if (!fitted) return null
    const cam = new PerspectiveCamera(30, width / height, NEAR, FAR)
    cam.position.set(0, 0, cameraZ)
    cam.lookAt(0, 0, 0)
    cam.updateMatrixWorld(true)
    cam.updateProjectionMatrix()

    const group = new Matrix4().compose(
      new Vector3(0, posY, 0),
      new Quaternion().setFromEuler(new Euler(rotation[0], rotation[1], 0)),
      new Vector3(zoom, zoom, zoom),
    )

    const [cx, cy, cz] = fitted.screenCenter
    const hw = fitted.screenWidth / 2
    const hh = fitted.screenHeight / 2
    const toPx = (lx: number, ly: number) => {
      const v = new Vector3(lx, ly, cz).applyMatrix4(group).project(cam)
      return [(v.x * 0.5 + 0.5) * width, (-v.y * 0.5 + 0.5) * height] as const
    }
    // Corner order: TL, TR, BR, BL (world +y is up → top edge = +hh).
    const tl = toPx(cx - hw, cy + hh)
    const tr = toPx(cx + hw, cy + hh)
    const br = toPx(cx + hw, cy - hh)
    const bl = toPx(cx - hw, cy - hh)

    const contentPxW = PHONE_SCREEN_PX
    const contentPxH = Math.round(contentPxW * (fitted.screenHeight / fitted.screenWidth))
    const m = matrix3dForQuad(contentPxW, contentPxH, tl, tr, br, bl)
    return { contentPxW, contentPxH, matrix: m, cornerRadius: Math.round(contentPxW * screenCornerRatio) }
  }, [fitted, width, height, cameraZ, posY, rotation, zoom, screenCornerRatio])

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: [0, 0, cameraZ], fov: 30, near: NEAR, far: FAR }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', inset: 0, background: 'transparent' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[-6, 10, 8]} intensity={1.45} castShadow />
        <directionalLight position={[8, -3, 6]} intensity={0.55} color="#bcd2ff" />
        {/* Cool rim from behind to carve the chassis edge out of the light ground. */}
        <directionalLight position={[0, 2, -8]} intensity={0.8} color="#dfe8ff" />

        {fitted && (
          <group rotation={[rotation[0], rotation[1], 0]} position={[0, posY, 0]} scale={zoom}>
            <primitive object={fitted.model} />
          </group>
        )}

        {shadow && (
          <ContactShadows
            position={[0, -TARGET_HEIGHT / 2 - 1.2, 0]}
            opacity={0.4}
            scale={26}
            blur={2.6}
            far={12}
          />
        )}
      </ThreeCanvas>

      {/* Lock-screen UI projected onto the glass (drei <Html> doesn't paint headless). */}
      {overlay && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <div
            data-phone-screen
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: overlay.contentPxW,
              height: overlay.contentPxH,
              transformOrigin: '0 0',
              transform: `matrix3d(${overlay.matrix.join(',')})`,
              borderRadius: overlay.cornerRadius,
              overflow: 'hidden',
              background: screenBackground,
              fontFamily: "'Universal Sans Text', ui-sans-serif, system-ui, -apple-system, sans-serif",
            }}
          >
            {screen}
            {glare && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(125deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.05) 100%)',
                  pointerEvents: 'none',
                  zIndex: 6,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type Fitted = {
  model: Object3D
  /** Screen-rect centre in the rig group's local space (the model is centred at origin). */
  screenCenter: [number, number, number]
  screenWidth: number
  screenHeight: number
}

/**
 * Clone + normalise the FBX, bake its materials (dark reflective glass; optional
 * chassis repaint) SYNCHRONOUSLY, and locate the screen rectangle. Everything is
 * done here (not in a canvas-side effect) so a headless still captures it.
 * Mirrors the fit logic of `stories/mockup/Phone3D`.
 */
function fitPhone(
  fbx: Group,
  finish: { bodyColor?: string; bodyRoughness: number; bodyMetalness: number },
): Fitted {
  const model = fbx.clone(true)

  // Stand it up so the screen faces +Z (some phone FBXs are modelled flat).
  const pre = new Box3().setFromObject(model)
  const preSize = pre.getSize(new Vector3())
  if (Math.min(preSize.x, preSize.y, preSize.z) === preSize.y) {
    model.rotation.x = -Math.PI / 2
  }
  model.updateMatrixWorld(true)

  // Normalise height, then re-centre at the origin.
  let box = new Box3().setFromObject(model)
  let size = box.getSize(new Vector3())
  model.scale.setScalar(TARGET_HEIGHT / size.y)
  model.updateMatrixWorld(true)
  box = new Box3().setFromObject(model)
  model.position.sub(box.getCenter(new Vector3()))
  model.updateMatrixWorld(true)

  // Bake materials + shadows synchronously.
  model.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh) return
    m.castShadow = true
    m.receiveShadow = true
    const isGlass = /glass|screen|display|lcd|oled/.test(m.name.toLowerCase())
    if (isGlass) {
      m.material = new MeshStandardMaterial({ color: '#050608', metalness: 0.6, roughness: 0.15 })
    } else if (finish.bodyColor) {
      m.material = new MeshStandardMaterial({
        color: finish.bodyColor,
        metalness: finish.bodyMetalness,
        roughness: finish.bodyRoughness,
      })
    }
  })

  // Locate the screen mesh + the chassis front plane (anchor the UI to the frame
  // front, not the proud glass, so it reads flush with the bezel).
  box = new Box3().setFromObject(model)
  size = box.getSize(new Vector3())
  let screenBox: Box3 | null = null
  let bodyFootprint = 0
  let frameFrontZ = box.max.z
  model.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh) return
    const b = new Box3().setFromObject(m)
    const s = b.getSize(new Vector3())
    const name = m.name.toLowerCase()
    if (/glass|screen|display|lcd|oled/.test(name)) {
      if (!screenBox || s.y > screenBox.getSize(new Vector3()).y) screenBox = b
    } else if (s.x * s.y > bodyFootprint) {
      bodyFootprint = s.x * s.y
      frameFrontZ = b.max.z
    }
  })

  if (screenBox) {
    const sb = screenBox as Box3
    const c = sb.getCenter(new Vector3())
    const sz = sb.getSize(new Vector3())
    const z = Math.min(sb.max.z, frameFrontZ) + 0.004
    return { model, screenCenter: [c.x, c.y, z], screenWidth: sz.x, screenHeight: sz.y }
  }

  // Fallback: front face of the bounding box, inset slightly (no named screen mesh).
  const screenHeight = size.y * 0.92
  const center = box.getCenter(new Vector3())
  return {
    model,
    screenCenter: [center.x, center.y, box.max.z + 0.002],
    screenWidth: screenHeight * FALLBACK_SCREEN_RATIO,
    screenHeight,
  }
}

/**
 * Loads an FBX once, holding the Remotion render behind a `delayRender()` handle
 * until it's parsed (so the first painted frame already has the model). Returns
 * `null` until ready — mirrors GloboVivo's `useEarthMaps` gating, for geometry.
 */
function useFbxModel(url: string): Group | null {
  const [handle] = useState(() => delayRender('Load phone FBX', { timeoutInMilliseconds: 60000 }))
  const [model, setModel] = useState<Group | null>(null)
  const released = useRef(false)
  const release = () => {
    if (!released.current) {
      released.current = true
      continueRender(handle)
    }
  }
  useEffect(() => {
    let cancelled = false
    new FBXLoader().load(
      url,
      (group) => {
        if (cancelled) return
        setModel(group as unknown as Group)
        release()
      },
      undefined,
      (err) => {
        console.error('Phone3DStage: failed to load', url, err)
        release()
      },
    )
    return () => {
      cancelled = true
      release()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return model
}

// ── CSS matrix3d for a 4-corner projective map ────────────────────────────────
// Standard 2D projective transform: map the element's natural rectangle
// (0,0)-(w,h) onto four destination points, returned as a column-major matrix3d.

type Pt = readonly [number, number]

function adj(m: number[]): number[] {
  return [
    m[4] * m[8] - m[5] * m[7],
    m[2] * m[7] - m[1] * m[8],
    m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8],
    m[0] * m[8] - m[2] * m[6],
    m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6],
    m[1] * m[6] - m[0] * m[7],
    m[0] * m[4] - m[1] * m[3],
  ]
}

function multmm(a: number[], b: number[]): number[] {
  const r = new Array(9)
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      let s = 0
      for (let k = 0; k < 3; k++) s += a[3 * i + k] * b[3 * k + j]
      r[3 * i + j] = s
    }
  }
  return r
}

function multmv(m: number[], v: number[]): number[] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ]
}

function basisToPoints(p1: Pt, p2: Pt, p3: Pt, p4: Pt): number[] {
  const m = [p1[0], p2[0], p3[0], p1[1], p2[1], p3[1], 1, 1, 1]
  const v = multmv(adj(m), [p4[0], p4[1], 1])
  return multmm(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]])
}

function matrix3dForQuad(w: number, h: number, tl: Pt, tr: Pt, br: Pt, bl: Pt): number[] {
  const src = basisToPoints([0, 0], [w, 0], [w, h], [0, h])
  const dst = basisToPoints(tl, tr, br, bl)
  const t = multmm(dst, adj(src))
  for (let i = 0; i < 9; i++) t[i] /= t[8]
  // Column-major 4×4 for CSS matrix3d.
  return [t[0], t[3], 0, t[6], t[1], t[4], 0, t[7], 0, 0, 1, 0, t[2], t[5], 0, t[8]]
}
