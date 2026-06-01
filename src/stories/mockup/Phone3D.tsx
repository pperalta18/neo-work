import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows, Environment, Lightformer, useFBX } from '@react-three/drei'
import { Box3, Vector3, Mesh, MeshStandardMaterial, type Group, type Object3D } from 'three'
import { useNeoTheme } from '../neo/NeoTheme'

/**
 * Phone3D — a real WebGL 3D phone mockup driven by an iPhone 15 Pro Max FBX.
 * ──────────────────────────────────────────────────────────────────────────
 * The chassis is the supplied 3D model, auto-fitted (centred, scaled, stood
 * upright) and lit in a small studio so it can be tilted, swayed and dragged.
 * The screen is "painted" with arbitrary React content via drei's
 * <Html transform>, so any existing widget can be dropped onto the display.
 *
 *   • pass `children`     → your React UI is rendered onto the glass.
 *   • pass `screenImage`  → a screenshot URL is shown full-bleed instead.
 */

const MODEL_URL = '/models/iphone15.fbx'
const TARGET_HEIGHT = 17 // world units the model is normalised to

// Fallback screen geometry (used if no "screen" mesh is found in the model).
const FALLBACK_SCREEN_RATIO = 0.462 // width / height of a modern phone screen

// Match the painted screen to the detected glass mesh. >1 bleeds past it (can
// spill over a thin top bezel); <1 insets it.
const SCREEN_BLEED = 1.0

export type Phone3DProps = {
  /** React UI painted onto the screen (reuse any widget here). */
  children?: ReactNode
  /** Alternative to children — a screenshot URL shown full-bleed. */
  screenImage?: string
  /** Colour behind the screen content (shows through transparency). */
  screenBackground?: string
  /** Repaint the chassis with this colour. Omit to keep the model's materials. */
  bodyColor?: string
  /** Surface roughness of the repainted chassis (0 = mirror, 1 = fully matte). Default 0.62. */
  bodyRoughness?: number
  /** Metalness of the repainted chassis (0 = dielectric, 1 = metal). Default 0.08. */
  bodyMetalness?: number
  /** Screen corner radius as a fraction of screen width (matches the cutout). Default 0.12. */
  screenCornerRatio?: number
  /** Gentle idle sway. Default true. */
  autoRotate?: boolean
  /** Sway amplitude in radians (peak yaw). Default 0.22 (~12.5°). */
  swayAmplitude?: number
  /** Allow drag-to-rotate. Default true. Rotation is clamped to the front. */
  enableControls?: boolean
  /** Initial tilt [x, y] in degrees. */
  initialTilt?: [number, number]
  /** Draw a soft contact shadow under the phone. Default true. */
  shadow?: boolean
  /** Faint diagonal glass glare across the screen. Default true. */
  glare?: boolean
  /** Canvas size. */
  width?: number | string
  height?: number | string
  className?: string
}

export function Phone3D({
  children,
  screenImage,
  screenBackground,
  bodyColor,
  bodyRoughness = 0.62,
  bodyMetalness = 0.08,
  screenCornerRatio = 0.12,
  autoRotate = true,
  swayAmplitude = 0.22,
  enableControls = true,
  initialTilt = [-4, -18],
  shadow = true,
  glare = true,
  width = 420,
  height = 640,
  className,
}: Phone3DProps) {
  const theme = useNeoTheme()
  const bg = screenBackground ?? theme.surface

  return (
    <div style={{ width, height }} className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0, 39], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[-6, 10, 8]} intensity={1.4} castShadow />
          <directionalLight position={[8, -4, 6]} intensity={0.5} color="#bcd2ff" />

          {/* Procedural studio env (no network fetch) → reflections on metal/glass. */}
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 4, -6]} scale={[10, 10, 1]} />
            <Lightformer intensity={1.2} position={[-6, 2, 4]} scale={[4, 10, 1]} />
            <Lightformer intensity={1} position={[6, 0, 4]} scale={[4, 10, 1]} color="#cfe0ff" />
          </Environment>

          <PhoneRig autoRotate={autoRotate} swayAmplitude={swayAmplitude} initialTilt={initialTilt}>
            <PhoneModel
              image={screenImage}
              background={bg}
              glare={glare}
              bodyColor={bodyColor}
              bodyRoughness={bodyRoughness}
              bodyMetalness={bodyMetalness}
              screenCornerRatio={screenCornerRatio}
            >
              {children}
            </PhoneModel>
          </PhoneRig>

          {shadow && (
            <ContactShadows
              position={[0, -TARGET_HEIGHT / 2 - 1.2, 0]}
              opacity={0.45}
              scale={26}
              blur={2.6}
              far={12}
            />
          )}

          {enableControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minAzimuthAngle={-0.7}
              maxAzimuthAngle={0.7}
              minPolarAngle={Math.PI / 2 - 0.5}
              maxPolarAngle={Math.PI / 2 + 0.5}
              rotateSpeed={0.6}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

/** Holds the device and applies the idle sway + initial tilt. */
function PhoneRig({
  children,
  autoRotate,
  swayAmplitude,
  initialTilt,
}: {
  children: ReactNode
  autoRotate: boolean
  swayAmplitude: number
  initialTilt: [number, number]
}) {
  const group = useRef<Group>(null)
  const baseX = (initialTilt[0] * Math.PI) / 180
  const baseY = (initialTilt[1] * Math.PI) / 180

  useFrame(({ clock }) => {
    if (!group.current || !autoRotate) return
    const t = clock.getElapsedTime()
    group.current.rotation.y = baseY + Math.sin(t * 0.5) * swayAmplitude
    group.current.rotation.x = baseX + Math.sin(t * 0.35) * swayAmplitude * 0.25
  })

  return (
    <group ref={group} rotation={[baseX, baseY, 0]}>
      {children}
    </group>
  )
}

type Fitted = {
  model: Object3D
  screenCenter: [number, number, number]
  screenWidth: number
  screenHeight: number
}

/**
 * Loads + normalises the FBX, then positions the painted screen over the
 * model's "screen" mesh. The whole thing is baked into world units so the
 * <Html> overlay can be a plain sibling at the screen's world position.
 */
function PhoneModel({
  children,
  image,
  background,
  glare,
  bodyColor,
  bodyRoughness,
  bodyMetalness,
  screenCornerRatio,
}: {
  children?: ReactNode
  image?: string
  background: string
  glare: boolean
  bodyColor?: string
  bodyRoughness: number
  bodyMetalness: number
  screenCornerRatio: number
}) {
  const fbx = useFBX(MODEL_URL)

  const fitted = useMemo<Fitted>(() => {
    const model = fbx.clone(true)

    // Some phone FBXs are modelled lying flat (thinnest axis = Y). Stand it up
    // so the screen faces +Z (toward the camera).
    const pre = new Box3().setFromObject(model)
    const preSize = pre.getSize(new Vector3())
    const thinnest = Math.min(preSize.x, preSize.y, preSize.z)
    if (thinnest === preSize.y) {
      model.rotation.x = -Math.PI / 2
    }
    model.updateMatrixWorld(true)

    // Normalise scale to a fixed height, then re-centre at the origin.
    let box = new Box3().setFromObject(model)
    let size = box.getSize(new Vector3())
    const s = TARGET_HEIGHT / size.y
    model.scale.setScalar(s)
    model.updateMatrixWorld(true)

    box = new Box3().setFromObject(model)
    const center = box.getCenter(new Vector3())
    model.position.sub(center)
    model.updateMatrixWorld(true)

    model.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
    })

    // Find the screen mesh + the chassis front plane. The screen glass often
    // sits slightly proud of the frame; we anchor the painted UI to the FRAME
    // front so it reads flush (not a card floating over the bezel).
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
      if (/screen|display|lcd|oled/.test(name)) {
        // Prefer the largest front-facing flat mesh.
        if (!screenBox || s.y > screenBox.getSize(new Vector3()).y) screenBox = b
      } else if (s.x * s.y > bodyFootprint) {
        // Largest non-screen footprint = the chassis; its front face is the frame.
        bodyFootprint = s.x * s.y
        frameFrontZ = b.max.z
      }
    })

    if (screenBox) {
      const sb = screenBox as Box3
      const c = sb.getCenter(new Vector3())
      const sz = sb.getSize(new Vector3())
      // Anchor to the frame front (never behind it), so the screen is flush
      // with the bezel rather than perched on the proud glass.
      const z = Math.min(sb.max.z, frameFrontZ) + 0.004
      return {
        model,
        screenCenter: [c.x, c.y, z],
        screenWidth: sz.x * SCREEN_BLEED,
        screenHeight: sz.y * SCREEN_BLEED,
      }
    }

    // Fallback: front face of the bounding box, inset slightly.
    const screenHeight = size.y * 0.92
    return {
      model,
      screenCenter: [box.getCenter(new Vector3()).x, box.getCenter(new Vector3()).y, box.max.z + 0.002],
      screenWidth: screenHeight * FALLBACK_SCREEN_RATIO,
      screenHeight,
    }
  }, [fbx])

  // Material pass — re-runs when the finish changes (not the geometry fit).
  // Glass/screen meshes get a dark reflective look so the painted screen reads
  // as the lit display; the rest of the chassis is optionally repainted matte.
  useLayoutEffect(() => {
    fitted.model.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      const isGlass = /glass|screen|display|lcd|oled/.test(m.name.toLowerCase())
      if (isGlass) {
        m.material = new MeshStandardMaterial({ color: '#050608', metalness: 0.6, roughness: 0.15 })
      } else if (bodyColor) {
        m.material = new MeshStandardMaterial({
          color: bodyColor,
          metalness: bodyMetalness,
          roughness: bodyRoughness,
        })
      }
    })
  }, [fitted, bodyColor, bodyRoughness, bodyMetalness])

  // Map a DOM canvas onto the detected screen rectangle.
  // drei's <Html transform> renders content where worldWidth = contentPx * scale / 40
  // (the 400/(distanceFactor||10) factor in its source), so invert that here.
  const HTML_TRANSFORM_FACTOR = 40
  const contentPxW = 360
  const contentPxH = Math.round(contentPxW * (fitted.screenHeight / fitted.screenWidth))
  const scale = (fitted.screenWidth / contentPxW) * HTML_TRANSFORM_FACTOR
  // Corner radius to hug the model's rounded screen cutout.
  const cornerRadius = Math.round(contentPxW * screenCornerRatio)

  return (
    <group>
      <primitive object={fitted.model} />
      <Html
        transform
        position={fitted.screenCenter}
        scale={scale}
        zIndexRange={[8, 0]}
        pointerEvents="none"
        style={{ pointerEvents: 'none' }}
      >
        <div
          data-phone-screen
          style={{
            width: contentPxW,
            height: contentPxH,
            borderRadius: cornerRadius,
            overflow: 'hidden',
            background,
            position: 'relative',
            fontFamily: "'Universal Sans Text', ui-sans-serif, system-ui, -apple-system, sans-serif",
          }}
        >
          {image ? (
            <img
              src={image}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            children
          )}

          {/* Glass glare */}
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
      </Html>
    </group>
  )
}

useFBX.preload(MODEL_URL)
