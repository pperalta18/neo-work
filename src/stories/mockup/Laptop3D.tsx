import { Suspense, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows, Environment, Lightformer, useFBX } from '@react-three/drei'
import {
  Box3,
  Vector3,
  Matrix3,
  Quaternion,
  Mesh,
  MeshStandardMaterial,
  type BufferGeometry,
  type Group,
  type Object3D,
} from 'three'
import { useNeoTheme } from '../neo/NeoTheme'

/**
 * Laptop3D — a real WebGL 3D laptop mockup driven by a MacBook Air 13" FBX.
 * ──────────────────────────────────────────────────────────────────────────
 * Same idea as <Phone3D>, but a laptop's display lives on a *tilted lid*, so a
 * naïve "front face of the bounding box" trick (which Phone3D can lean on)
 * doesn't work. Instead we fit the screen mesh with PCA to recover its real
 * plane (centre, in-plane axes, normal) regardless of the FBX's native
 * orientation, then rotate the whole chassis so that plane faces the camera.
 * After that the painted display is a flat <Html transform> sitting on +Z,
 * exactly like the phone.
 *
 *   • pass `children`     → your React UI is rendered onto the display.
 *   • pass `screenImage`  → a screenshot URL is shown full-bleed instead.
 */

const MODEL_URL = '/models/macbook-air13.fbx'
const TARGET_WIDTH = 28 // world units the (landscape) chassis is normalised to

// Fallback display aspect (16:10, like a MacBook) if no screen mesh is found.
const FALLBACK_SCREEN_RATIO = 16 / 10

// We fit to the "Screen Emitter" material — a perfectly flat 16:10 rectangle
// that is exactly the lit display (verified from the geometry). A hair of bleed
// butts the painted UI against the black bezel with no bare rim.
const SCREEN_BLEED = 1.004

export type Laptop3DProps = {
  /** React UI painted onto the display (reuse any widget here). */
  children?: ReactNode
  /** Alternative to children — a screenshot URL shown full-bleed. */
  screenImage?: string
  /** Colour behind the display content (shows through transparency). */
  screenBackground?: string
  /** Chassis colour. Defaults to MacBook aluminium silver (the raw FBX material
   *  is an untextured tan). Pass `null` to keep the model's own materials. */
  bodyColor?: string | null
  /** Surface roughness of the repainted chassis (0 = mirror, 1 = fully matte). Default 0.55. */
  bodyRoughness?: number
  /** Metalness of the repainted chassis (0 = dielectric, 1 = metal). Default 0.85. */
  bodyMetalness?: number
  /** Gentle idle sway. Default true. */
  autoRotate?: boolean
  /** Sway amplitude in radians (peak yaw). Default 0.12 (~7°). */
  swayAmplitude?: number
  /** Allow drag-to-rotate. Default true. Rotation is clamped to the front. */
  enableControls?: boolean
  /** Initial tilt [x, y] in degrees. Default a gentle 3/4 hero pose. */
  initialTilt?: [number, number]
  /** Draw a soft contact shadow under the laptop. Default true. */
  shadow?: boolean
  /** Faint diagonal glass glare across the display. Default true. */
  glare?: boolean
  /** Canvas size. */
  width?: number | string
  height?: number | string
  className?: string
}

export function Laptop3D({
  children,
  screenImage,
  screenBackground,
  bodyColor = '#cacdd2',
  bodyRoughness = 0.5,
  bodyMetalness = 0.88,
  autoRotate = true,
  swayAmplitude = 0.12,
  enableControls = true,
  initialTilt = [8, -22],
  shadow = true,
  glare = true,
  width = 720,
  height = 520,
  className,
}: Laptop3DProps) {
  const theme = useNeoTheme()
  const bg = screenBackground ?? theme.surface

  return (
    <div style={{ width, height }} className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 2, 46], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.55} />
          <directionalLight position={[-6, 12, 8]} intensity={1.4} castShadow />
          <directionalLight position={[8, -2, 6]} intensity={0.5} color="#bcd2ff" />

          {/* Procedural studio env (no network fetch) → reflections on metal/glass. */}
          <Environment resolution={256}>
            <Lightformer intensity={2} position={[0, 6, -6]} scale={[12, 10, 1]} />
            <Lightformer intensity={1.2} position={[-8, 2, 4]} scale={[5, 12, 1]} />
            <Lightformer intensity={1} position={[8, 0, 4]} scale={[5, 12, 1]} color="#cfe0ff" />
          </Environment>

          <LaptopRig autoRotate={autoRotate} swayAmplitude={swayAmplitude} initialTilt={initialTilt}>
            <LaptopModel
              image={screenImage}
              background={bg}
              glare={glare}
              bodyColor={bodyColor}
              bodyRoughness={bodyRoughness}
              bodyMetalness={bodyMetalness}
            >
              {children}
            </LaptopModel>
          </LaptopRig>

          {shadow && (
            <ContactShadows
              position={[0, -TARGET_WIDTH / 2 - 0.5, 0]}
              opacity={0.4}
              scale={42}
              blur={2.8}
              far={14}
            />
          )}

          {enableControls && (
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              minAzimuthAngle={-0.7}
              maxAzimuthAngle={0.7}
              minPolarAngle={Math.PI / 2 - 0.55}
              maxPolarAngle={Math.PI / 2 + 0.2}
              rotateSpeed={0.6}
            />
          )}
        </Suspense>
      </Canvas>
    </div>
  )
}

/** Holds the device and applies the idle sway + initial tilt. */
function LaptopRig({
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
    group.current.rotation.x = baseX + Math.sin(t * 0.35) * swayAmplitude * 0.2
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
  screenQuat: [number, number, number, number]
  screenWidth: number
  screenHeight: number
}

/**
 * Loads + normalises the FBX, then fits the display plane with PCA. The laptop
 * keeps its natural open-on-a-desk pose; the painted UI is placed *on the
 * tilted lid* by orienting the <Html> plane with the fitted screen frame.
 */
function LaptopModel({
  children,
  image,
  background,
  glare,
  bodyColor,
  bodyRoughness,
  bodyMetalness,
}: {
  children?: ReactNode
  image?: string
  background: string
  glare: boolean
  bodyColor?: string | null
  bodyRoughness: number
  bodyMetalness: number
}) {
  const fbx = useFBX(MODEL_URL)

  const fitted = useMemo<Fitted>(() => {
    const model = fbx.clone(true)
    model.updateMatrixWorld(true)

    // This FBX ships TWO identical laptops side by side (Top_Body, Top_Body001).
    // Drop the duplicates so we mockup a single device.
    keepOneLaptop(model)
    model.updateMatrixWorld(true)

    // Normalise scale to a fixed (landscape) width, then re-centre at origin.
    let box = new Box3().setFromObject(model)
    let size = box.getSize(new Vector3())
    const s = TARGET_WIDTH / Math.max(size.x, size.y, size.z)
    model.scale.setScalar(s)
    model.updateMatrixWorld(true)

    box = new Box3().setFromObject(model)
    model.position.sub(box.getCenter(new Vector3()))
    model.updateMatrixWorld(true)

    model.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      m.castShadow = true
      m.receiveShadow = true
    })

    // Fit the display plane from the screen mesh(es) with PCA.
    const plane = fitScreenPlane(model)

    if (plane) {
      // Orient the <Html> plane so its local +X/+Y/+Z map onto the lid's
      // right/up/normal — the painted UI then sits flush on the tilted lid.
      const q = quaternionFromBasis(plane.right, plane.up, plane.normal)
      const c = plane.center.clone().add(plane.normal.clone().multiplyScalar(0.02))
      return {
        model,
        screenCenter: [c.x, c.y, c.z],
        screenQuat: [q.x, q.y, q.z, q.w],
        screenWidth: plane.width * SCREEN_BLEED,
        screenHeight: plane.height * SCREEN_BLEED,
      }
    }

    // Fallback: assume the lid is the upper, front-facing slab of the bbox.
    box = new Box3().setFromObject(model)
    size = box.getSize(new Vector3())
    const screenWidth = size.x * 0.86
    return {
      model,
      screenCenter: [box.getCenter(new Vector3()).x, size.y * 0.2, box.max.z + 0.01],
      screenQuat: [0, 0, 0, 1],
      screenWidth,
      screenHeight: screenWidth / FALLBACK_SCREEN_RATIO,
    }
  }, [fbx])

  // Material pass — re-runs when the finish changes (not the geometry fit).
  // Glass/screen meshes get a dark reflective look so the painted display reads
  // as the lit screen; the rest of the chassis is optionally repainted.
  useLayoutEffect(() => {
    fitted.model.traverse((o) => {
      const m = o as Mesh
      if (!m.isMesh) return
      // This FBX uses one multi-material mesh, so recolour per material slot.
      const recolor = (mat: Mesh['material']): Mesh['material'] => {
        const name = ((mat as { name?: string })?.name ?? '').toLowerCase()
        // The lid front (screen panel + cover glass) reads as the dark display
        // behind the painted UI.
        if (/screen|display|lcd|oled|emitter|glass/.test(name)) {
          return new MeshStandardMaterial({ color: '#050608', metalness: 0.6, roughness: 0.15 })
        }
        if (bodyColor) {
          return new MeshStandardMaterial({ color: bodyColor, metalness: bodyMetalness, roughness: bodyRoughness })
        }
        return mat
      }
      m.material = Array.isArray(m.material)
        ? (m.material.map(recolor) as Mesh['material'])
        : recolor(m.material)
    })
  }, [fitted, bodyColor, bodyRoughness, bodyMetalness])

  // Map a DOM canvas onto the detected screen rectangle.
  // drei's <Html transform> renders content where worldWidth = contentPx * scale / 40,
  // so invert that here.
  const HTML_TRANSFORM_FACTOR = 40
  const contentPxW = 640
  const contentPxH = Math.round(contentPxW * (fitted.screenHeight / fitted.screenWidth))
  const scale = (fitted.screenWidth / contentPxW) * HTML_TRANSFORM_FACTOR

  return (
    <group>
      <primitive object={fitted.model} />
      <Html
        transform
        position={fitted.screenCenter}
        quaternion={fitted.screenQuat}
        scale={scale}
        zIndexRange={[8, 0]}
        pointerEvents="none"
        style={{ pointerEvents: 'none' }}
      >
        <div
          data-laptop-screen
          style={{
            width: contentPxW,
            height: contentPxH,
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
                  'linear-gradient(118deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 32%, rgba(255,255,255,0) 78%, rgba(255,255,255,0.06) 100%)',
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

// ── Model cleanup ───────────────────────────────────────────────────────────

/**
 * The MacBook FBX contains two identical laptop bodies. Keep the first
 * screen-bearing mesh and remove the rest so we mockup a single device.
 */
function keepOneLaptop(model: Object3D) {
  const bodies: Mesh[] = []
  model.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh) return
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    if (mats.some((mat) => /screen/i.test((mat as { name?: string })?.name ?? ''))) bodies.push(m)
  })
  // Remove every duplicate after the first.
  for (let i = 1; i < bodies.length; i++) bodies[i].removeFromParent()
}

// ── Screen-plane fitting ────────────────────────────────────────────────────

type ScreenPlane = {
  center: Vector3
  right: Vector3 // unit, in-plane (long axis)
  up: Vector3 // unit, in-plane (short axis)
  normal: Vector3 // unit, faces outward (toward viewer)
  width: number
  height: number
}

/**
 * Collect world-space vertices of every face whose material name matches. Walks
 * the geometry groups (material ranges) of multi-material meshes; honours the
 * index buffer when present.
 */
function collectVerticesByMaterial(model: Object3D, match: (name: string) => boolean): Vector3[] {
  const pts: Vector3[] = []
  const v = new Vector3()
  model.traverse((o) => {
    const m = o as Mesh
    if (!m.isMesh) return
    const mats = Array.isArray(m.material) ? m.material : [m.material]
    const hit = new Set<number>()
    mats.forEach((mat, i) => {
      if (match(((mat as { name?: string })?.name ?? '').toLowerCase())) hit.add(i)
    })
    if (hit.size === 0) return

    const geo = m.geometry as BufferGeometry
    const pos = geo.getAttribute('position')
    if (!pos) return
    const index = geo.index
    m.updateWorldMatrix(true, false)
    const groups = geo.groups.length
      ? geo.groups
      : [{ start: 0, count: index ? index.count : pos.count, materialIndex: 0 }]

    for (const g of groups) {
      if (!hit.has(g.materialIndex ?? 0)) continue
      // Sub-sample dense ranges to keep the covariance pass cheap.
      const stride = Math.max(1, Math.floor(g.count / 4000))
      for (let i = g.start; i < g.start + g.count; i += stride) {
        const vi = index ? index.getX(i) : i
        v.fromBufferAttribute(pos, vi).applyMatrix4(m.matrixWorld)
        pts.push(v.clone())
      }
    }
  })
  return pts
}

/**
 * Fit a rectangle to the display via PCA. This FBX bakes the whole laptop into
 * a couple of multi-material meshes, so the screen isn't a named mesh — it's the
 * geometry assigned to a screen material. We collect exactly those faces'
 * vertices.
 *
 * Material map (measured from the geometry, in the fitted plane frame):
 *   • "Screen Emitter" — flat (thick 0.02) 26.4 × 16.4 rect, ratio 1.61 ≈ 16:10
 *     → the exact lit display. THIS is what we fit to.
 *   • "Screen Mat"     — 27.8 × 19.4, runs down to the hinge (includes the chin
 *     where the "MacBook Air" text sits) → too tall, spills onto the keyboard.
 *   • "Screen Glass"   — 28.0 × 19.6, the full lid cover glass (bezel included).
 */
function fitScreenPlane(model: Object3D): ScreenPlane | null {
  // Prefer the lit display rect; fall back to mat, then the glass cover.
  const matchers: Array<(name: string) => boolean> = [
    (n) => n.includes('screen emitter'),
    (n) => n.includes('screen mat') && !n.includes('text'),
    (n) => n.includes('screen glass'),
    (n) => n.includes('screen'),
  ]
  let pts: Vector3[] = []
  for (const match of matchers) {
    pts = collectVerticesByMaterial(model, match)
    if (pts.length >= 3) break
  }
  if (pts.length < 3) return null

  // Centroid + covariance.
  const center = new Vector3()
  for (const p of pts) center.add(p)
  center.divideScalar(pts.length)

  let cxx = 0, cyy = 0, czz = 0, cxy = 0, cxz = 0, cyz = 0
  const d = new Vector3()
  for (const p of pts) {
    d.copy(p).sub(center)
    cxx += d.x * d.x
    cyy += d.y * d.y
    czz += d.z * d.z
    cxy += d.x * d.y
    cxz += d.x * d.z
    cyz += d.y * d.z
  }
  const cov = new Matrix3().set(cxx, cxy, cxz, cxy, cyy, cyz, cxz, cyz, czz)

  const { vectors, values } = jacobiEigen3(cov)
  // Sort axes by eigenvalue descending: [0]=long in-plane, [1]=short in-plane, [2]=normal.
  const order = [0, 1, 2].sort((a, b) => values[b] - values[a])
  const up = vectors[order[1]].clone().normalize()
  const normal = vectors[order[2]].clone().normalize()

  // Orient the normal toward the viewer. A laptop lid faces up-and-forward, so
  // pick the sign pointing along (+Y a little, +Z). (A centroid heuristic fails
  // here: a back-leaning lid sits *behind* the chassis centroid.)
  const viewer = new Vector3(0, 0.25, 1).normalize()
  if (normal.dot(viewer) < 0) normal.negate()
  // "up" should point toward the top of the screen (roughly world up).
  if (up.dot(new Vector3(0, 1, 0)) < 0) up.negate()
  // Re-orthonormalise into a right-handed frame {right, up, normal} → {X, Y, Z}.
  up.addScaledVector(normal, -up.dot(normal)).normalize()
  const right = up.clone().cross(normal).normalize() // right = up × normal

  // Extents along each in-plane axis.
  let minR = Infinity, maxR = -Infinity, minU = Infinity, maxU = -Infinity
  for (const p of pts) {
    d.copy(p).sub(center)
    const pr = d.dot(right)
    const pu = d.dot(up)
    if (pr < minR) minR = pr
    if (pr > maxR) maxR = pr
    if (pu < minU) minU = pu
    if (pu > maxU) maxU = pu
  }

  // Centre on the rectangle's geometric mid-point, NOT the vertex centroid: the
  // emitter mesh is denser toward the top, so its centroid sits ~1 unit high and
  // would push the painted UI up (leaving an oversized bottom bezel).
  const rectCenter = center
    .clone()
    .add(right.clone().multiplyScalar((minR + maxR) / 2))
    .add(up.clone().multiplyScalar((minU + maxU) / 2))

  return {
    center: rectCenter,
    right,
    up,
    normal,
    width: maxR - minR,
    height: maxU - minU,
  }
}

/** Quaternion whose columns are the given orthonormal basis vectors. */
function quaternionFromBasis(x: Vector3, y: Vector3, z: Vector3): Quaternion {
  // three's Matrix4.makeBasis builds a rotation matrix from column vectors.
  const q = new Quaternion()
  const m = new Matrix3().set(x.x, y.x, z.x, x.y, y.y, z.y, x.z, y.z, z.z)
  // Convert the 3x3 rotation to a quaternion (column-major → row layout above).
  setQuaternionFromMatrix3(q, m)
  return q
}

function setQuaternionFromMatrix3(q: Quaternion, m: Matrix3) {
  const te = m.elements
  // te is column-major: m11 m21 m31 m12 m22 m32 m13 m23 m33
  const m11 = te[0], m12 = te[3], m13 = te[6]
  const m21 = te[1], m22 = te[4], m23 = te[7]
  const m31 = te[2], m32 = te[5], m33 = te[8]
  const trace = m11 + m22 + m33
  if (trace > 0) {
    const s = 0.5 / Math.sqrt(trace + 1.0)
    q.set((m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, 0.25 / s)
  } else if (m11 > m22 && m11 > m33) {
    const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33)
    q.set(0.25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s)
  } else if (m22 > m33) {
    const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33)
    q.set((m12 + m21) / s, 0.25 * s, (m23 + m32) / s, (m13 - m31) / s)
  } else {
    const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22)
    q.set((m13 + m31) / s, (m23 + m32) / s, 0.25 * s, (m21 - m12) / s)
  }
  q.normalize()
}

/**
 * Jacobi eigenvalue decomposition for a symmetric 3×3 matrix. Returns three
 * eigenvectors (as Vector3) and their eigenvalues. Plenty fast for one matrix.
 */
function jacobiEigen3(mat: Matrix3): { vectors: [Vector3, Vector3, Vector3]; values: [number, number, number] } {
  const e = mat.elements
  // Working symmetric matrix a[3][3].
  const a = [
    [e[0], e[3], e[6]],
    [e[1], e[4], e[7]],
    [e[2], e[5], e[8]],
  ]
  // Eigenvector accumulator (identity).
  const vt = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]

  for (let sweep = 0; sweep < 24; sweep++) {
    const off = Math.abs(a[0][1]) + Math.abs(a[0][2]) + Math.abs(a[1][2])
    if (off < 1e-12) break
    for (let p = 0; p < 2; p++) {
      for (let qi = p + 1; qi < 3; qi++) {
        if (Math.abs(a[p][qi]) < 1e-15) continue
        const theta = (a[qi][qi] - a[p][p]) / (2 * a[p][qi])
        const t = Math.sign(theta) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const sn = t * c
        // Rotate a.
        for (let i = 0; i < 3; i++) {
          const aip = a[i][p]
          const aiq = a[i][qi]
          a[i][p] = c * aip - sn * aiq
          a[i][qi] = sn * aip + c * aiq
        }
        for (let i = 0; i < 3; i++) {
          const api = a[p][i]
          const aqi = a[qi][i]
          a[p][i] = c * api - sn * aqi
          a[qi][i] = sn * api + c * aqi
        }
        // Accumulate eigenvectors.
        for (let i = 0; i < 3; i++) {
          const vip = vt[i][p]
          const viq = vt[i][qi]
          vt[i][p] = c * vip - sn * viq
          vt[i][qi] = sn * vip + c * viq
        }
      }
    }
  }

  return {
    vectors: [
      new Vector3(vt[0][0], vt[1][0], vt[2][0]),
      new Vector3(vt[0][1], vt[1][1], vt[2][1]),
      new Vector3(vt[0][2], vt[1][2], vt[2][2]),
    ],
    values: [a[0][0], a[1][1], a[2][2]],
  }
}

useFBX.preload(MODEL_URL)
