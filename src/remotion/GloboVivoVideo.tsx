/**
 * GloboVivoVideo — «Globo Vivo» hero scene host (@remotion/three).
 * ──────────────────────────────────────────────────────────────────────────
 * Phase 2: a photorealistic NASA Blue Marble globe on the clean light neumorphic
 * studio ground, **colonized by the living-tissue grid**. The PBR surface carries
 * the color map, a tangent-space normal map for terrain relief, and a roughness
 * map **baked from the ocean specular map** ({@link oceanRoughnessFromSpecular})
 * so oceans catch a glossy sun-glint while land stays matte; a separate
 * slightly-larger cloud shell drifts a touch faster for parallax.
 *
 * The equirectangular tissue atlas ({@link renderAtlas}) is mounted as a
 * per-frame `CanvasTexture` and **blended over the Earth by the geodesic growth
 * mask** inside the Earth material's fragment shader (`onBeforeCompile`): a GLSL
 * twin of {@link tissueMaskAtUV} mixes the grid into the albedo where colonized,
 * pulls roughness matte + metalness flat there, **drains the terrain normal relief
 * back to the smooth sphere** so the vast orb is a pure neumorphic grid (no Earth
 * mountains poke through the white grid), and the clouds dissolve globally as
 * coverage completes. The night-lights map is vendored for the Phase-4
 * terminator-aware emissive.
 *
 * Determinism: every motion is a pure function of `useCurrentFrame()` (no
 * `useFrame` clock / `Date.now()` / `Math.random()`); the Earth maps load once
 * behind a `delayRender()` handle and are baked with pure pixel math, the atlas
 * repaints deterministically per frame, and the shader uniforms come straight
 * from {@link maskUniformsAt} — so two renders of the same frame are
 * pixel-identical. See plans/globo-vivo.md · specs/globo-vivo.md.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { ThreeCanvas } from '@remotion/three'
import { useThree } from '@react-three/fiber'
import {
  CanvasTexture,
  ClampToEdgeWrapping,
  MeshStandardMaterial,
  NoColorSpace,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  Vector2,
  type WebGLProgramParametersWithUniforms,
} from 'three'
import {
  BASE_NORMAL_SCALE,
  CAMERA_FOV,
  CLOUD_RADIUS_SCALE,
  CLOUD_ROT_PERIOD_FRAMES,
  EARTH_TEXTURES,
  EARTH_TILT_RAD,
  GLOBO_VIVO_DURATION,
  ORBIT_RIG,
  SPHERE_RADIUS,
  SPHERE_SEGMENTS,
  STUDIO_BG,
  cloudYawAt,
  driftedOrbitPose,
  maskUniformsAt,
  oceanRoughnessFromSpecular,
  orbitPoseAt,
  sphereYawAt,
  type MaskUniforms,
} from './globoVivoScript'
import { renderAtlas } from './tissueAtlas'

export { GLOBO_VIVO_DURATION }

// ── Texture loading + baking (host-only; pure pixel math, runs once) ──────────

/** The bound Earth maps the meshes consume once preloading completes. */
type EarthMaps = {
  /** sRGB albedo (NASA day color). */
  color: Texture
  /** Linear roughness baked from the ocean specular map (oceans glossy, land matte). */
  roughness: Texture
  /** Tangent-space normal map for terrain relief. */
  normal: Texture
  /** sRGB cloud albedo (white clouds, transparent elsewhere). */
  clouds: Texture
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // staticFile is same-origin; harmless + keeps the canvas untainted
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`GloboVivo: failed to load ${url}`))
    img.src = url
  })
}

/** Wrap a loaded image as a three texture. Equirectangular maps are POT (4096×2048
 *  / 2048×1024 / 1024×512), so mipmaps stay on for crisp minification. */
function imageTexture(img: HTMLImageElement, srgb: boolean): Texture {
  const tex = new Texture(img)
  tex.colorSpace = srgb ? SRGBColorSpace : NoColorSpace
  tex.wrapS = RepeatWrapping // seam wraps cleanly around the sphere
  tex.wrapT = ClampToEdgeWrapping
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

/**
 * Bake the deterministic surface roughness map from the ocean specular map: per
 * pixel, invert the specular luminance via {@link oceanRoughnessFromSpecular} so
 * oceans read glossy and land matte. Pure pixel math on a same-origin canvas →
 * identical bytes in → identical texture out (no `Math.random`/clock).
 */
function bakeRoughnessTexture(img: HTMLImageElement): Texture {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  const data = ctx.getImageData(0, 0, w, h)
  const px = data.data
  for (let i = 0; i < px.length; i += 4) {
    // Rec. 601 luminance of the specular (ocean) map → inverted roughness.
    const luma = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255
    const v = Math.round(oceanRoughnessFromSpecular(luma) * 255)
    px[i] = v
    px[i + 1] = v
    px[i + 2] = v
    px[i + 3] = 255
  }
  ctx.putImageData(data, 0, 0)
  const tex = new CanvasTexture(canvas)
  tex.colorSpace = NoColorSpace // linear data map, not color
  tex.wrapS = RepeatWrapping
  tex.wrapT = ClampToEdgeWrapping
  tex.anisotropy = 8
  tex.needsUpdate = true
  return tex
}

/**
 * Preload the vendored Earth maps once, holding the Remotion render behind a
 * `delayRender()` handle until they are decoded and baked — so frame 0 already
 * has its textures and the render is never captured bare. Returns `null` until
 * ready; the host gates the meshes on it.
 */
function useEarthMaps(): EarthMaps | null {
  const [handle] = useState(() => delayRender('Preload Earth maps', { timeoutInMilliseconds: 30000 }))
  const [maps, setMaps] = useState<EarthMaps | null>(null)
  const continued = useRef(false)
  const release = () => {
    if (!continued.current) {
      continued.current = true
      continueRender(handle)
    }
  }
  useEffect(() => {
    let cancelled = false
    Promise.all([
      loadImage(staticFile(EARTH_TEXTURES.color)),
      loadImage(staticFile(EARTH_TEXTURES.specular)),
      loadImage(staticFile(EARTH_TEXTURES.normal)),
      loadImage(staticFile(EARTH_TEXTURES.clouds)),
    ])
      .then(([color, specular, normal, clouds]) => {
        if (cancelled) return
        setMaps({
          color: imageTexture(color, true),
          roughness: bakeRoughnessTexture(specular),
          normal: imageTexture(normal, false),
          clouds: imageTexture(clouds, true),
        })
        release()
      })
      .catch((err) => {
        // Never strand the render: log and continue (the globe just renders bare).
        console.error(err)
        release()
      })
    return () => {
      cancelled = true
      release()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return maps
}

/**
 * Build the living-tissue atlas `CanvasTexture` once: {@link renderAtlas} owns a
 * single reused 4096×2048 canvas, so the texture binds to it forever and only its
 * `needsUpdate` flag is flipped per frame (no per-frame texture/canvas realloc).
 * sRGB so the baked kit-surface plate colours read correctly on the lit sphere.
 */
function useAtlasTexture(): CanvasTexture {
  const [tex] = useState(() => {
    const canvas = renderAtlas(0) as unknown as HTMLCanvasElement
    const t = new CanvasTexture(canvas)
    t.colorSpace = SRGBColorSpace
    t.wrapS = RepeatWrapping
    t.wrapT = ClampToEdgeWrapping
    t.anisotropy = 8
    t.needsUpdate = true
    return t
  })
  return tex
}

// ── Geodesic tissue blend (GLSL twin of `tissueMaskAtUV`) ─────────────────────
// Injected into the Earth `meshStandardMaterial` via `onBeforeCompile`. The mask
// is computed per fragment from the map UV (same equirectangular convention as
// `tissueMaskAtUV` / the NASA maps), so the colonized cap stays anchored to the
// seed geography and aligns texel-for-texel with the atlas plates + Earth maps.

/** Custom uniform declarations prepended to the fragment shader. */
const GV_MASK_UNIFORMS_GLSL = `
uniform sampler2D uAtlas;
uniform float uCoverage;
uniform float uFrontRadius;
uniform float uMaskEdge;
uniform float uSeedLatRad;
uniform float uSeedLonDeg;
`

/**
 * The mask + albedo blend, injected right after `<map_fragment>` (which sets
 * `diffuseColor`). Mirrors {@link tissueMaskAtUV} line for line: hard endpoints,
 * else spherical-law-of-cosines geodesic distance to the seed vs the soft front.
 * Declares `gvMask` for the roughness/metalness injections below to reuse.
 * `0.017453292519943295` = π/180.
 */
const GV_MASK_BLEND_GLSL = `
  float gvMask = 0.0;
  if (uCoverage >= 1.0) {
    gvMask = 1.0;
  } else if (uCoverage > 0.0) {
    float gvLon = vMapUv.x * 360.0 - 180.0;
    float gvLat = 90.0 - vMapUv.y * 180.0;
    float gvLatR = gvLat * 0.017453292519943295;
    float gvDLon = (gvLon - uSeedLonDeg) * 0.017453292519943295;
    float gvCos = sin(gvLatR) * sin(uSeedLatRad) + cos(gvLatR) * cos(uSeedLatRad) * cos(gvDLon);
    gvCos = clamp(gvCos, -1.0, 1.0);
    float gvD = acos(gvCos);
    gvMask = 1.0 - smoothstep(uFrontRadius - uMaskEdge, uFrontRadius + uMaskEdge, gvD);
  }
  vec4 gvAtlas = texture2D(uAtlas, vMapUv);
  diffuseColor.rgb = mix(diffuseColor.rgb, gvAtlas.rgb, gvMask);
`

/** Roughness of the neumorphic grid where colonized — matte, not glossy ocean. */
const GV_GRID_ROUGHNESS = 0.9

/**
 * The Earth → grid **relief drain**, injected right after `<normal_fragment_maps>`
 * (which has perturbed `normal` by the terrain normal map). Lerps that perturbed
 * normal back to the smooth sphere normal (`nonPerturbedNormal`, declared in
 * `<normal_fragment_begin>`) by `gvMask`, so where the grid has colonized the
 * surface goes geometrically flat — the vast white orb is a pure neumorphic albedo
 * grid (its plate relief is the baked atlas sprite shadow), with no Earth mountains
 * poking through. The CPU twin of the surviving-relief weight (`1 − gvMask`) is
 * {@link reliefStrengthAtUV}. `gvMask` is in scope (declared at `<map_fragment>`).
 */
const GV_NORMAL_DRAIN_GLSL = `
  normal = normalize(mix(normal, nonPerturbedNormal, gvMask));
`

/** The live three uniform objects (`{ value }`) shared with the compiled shader. */
type GvShaderUniforms = {
  uAtlas: { value: CanvasTexture }
  uCoverage: { value: number }
  uFrontRadius: { value: number }
  uMaskEdge: { value: number }
  uSeedLatRad: { value: number }
  uSeedLonDeg: { value: number }
}

// ── Meshes ────────────────────────────────────────────────────────────────────

/** Subtle terrain relief from the normal map (shared, read-only — no per-frame alloc).
 *  Sized from the single-source {@link BASE_NORMAL_SCALE}; drained to flat where the
 *  grid colonizes by {@link GV_NORMAL_DRAIN_GLSL}. */
const NORMAL_SCALE = new Vector2(BASE_NORMAL_SCALE, BASE_NORMAL_SCALE)

/**
 * The photorealistic Earth: a PBR surface sphere (color + normal relief +
 * baked-from-specular roughness) **with the tissue atlas blended over it by the
 * geodesic growth mask** — where colonized the albedo becomes the grid, roughness
 * goes matte, metalness flat, and the **terrain relief drains to the smooth sphere**
 * ({@link GV_NORMAL_DRAIN_GLSL}) so the finished orb is a pure neumorphic grid. It
 * is wrapped by a slightly larger translucent cloud shell that dissolves as coverage
 * completes. Both spin purely from frame-derived yaw props (handed down, never read
 * from a three clock) inside an axis-tilted group; the mask uniforms are mutated
 * each frame from the pure {@link MaskUniforms}.
 */
function Earth({
  maps,
  atlasTex,
  yaw,
  cloudYaw,
  mask,
}: {
  maps: EarthMaps
  atlasTex: CanvasTexture
  yaw: number
  cloudYaw: number
  mask: MaskUniforms
}) {
  // Stable uniform objects shared with the compiled shader (mutated per frame).
  const uniforms = useMemo<GvShaderUniforms>(
    () => ({
      uAtlas: { value: atlasTex },
      uCoverage: { value: mask.coverage },
      uFrontRadius: { value: mask.frontRadius },
      uMaskEdge: { value: mask.maskEdge },
      uSeedLatRad: { value: mask.seedLatRad },
      uSeedLonDeg: { value: mask.seedLonDeg },
    }),
    // Rebuilt only if the atlas texture identity changes (it never does).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [atlasTex],
  )

  const earthMat = useMemo(() => {
    const m = new MeshStandardMaterial({
      map: maps.color,
      roughnessMap: maps.roughness,
      roughness: 1,
      metalness: 0.04,
      normalMap: maps.normal,
      normalScale: NORMAL_SCALE,
    })
    m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, uniforms)
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${GV_MASK_UNIFORMS_GLSL}`)
        .replace('#include <map_fragment>', `#include <map_fragment>\n${GV_MASK_BLEND_GLSL}`)
        .replace(
          '#include <roughnessmap_fragment>',
          `#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor, ${GV_GRID_ROUGHNESS.toFixed(2)}, gvMask);`,
        )
        .replace(
          '#include <metalnessmap_fragment>',
          '#include <metalnessmap_fragment>\n  metalnessFactor = mix(metalnessFactor, 0.0, gvMask);',
        )
        // Terrain relief drains to flat where colonized → pure neumorphic orb.
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\n${GV_NORMAL_DRAIN_GLSL}`,
        )
    }
    // Pin a distinct program cache key so three never reuses a vanilla
    // MeshStandardMaterial program (without our injection) for this material.
    m.customProgramCacheKey = () => 'globo-vivo-earth-v2'
    return m
  }, [maps, uniforms])

  const cloudMat = useMemo(
    () =>
      new MeshStandardMaterial({
        map: maps.clouds,
        transparent: true,
        depthWrite: false,
        roughness: 1,
        metalness: 0,
      }),
    [maps],
  )

  // Per-frame mutations — pure functions of the frame (determinism preserved).
  uniforms.uCoverage.value = mask.coverage
  uniforms.uFrontRadius.value = mask.frontRadius
  // Clouds dissolve globally as the grid takes the surface (gone at full coverage).
  cloudMat.opacity = 0.9 * (1 - mask.coverage)

  return (
    <group rotation={[0, 0, EARTH_TILT_RAD]}>
      <mesh rotation={[0, yaw, 0]} material={earthMat}>
        <sphereGeometry args={[SPHERE_RADIUS, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
      </mesh>
      <mesh rotation={[0, cloudYaw, 0]} material={cloudMat}>
        <sphereGeometry args={[SPHERE_RADIUS * CLOUD_RADIUS_SCALE, SPHERE_SEGMENTS, SPHERE_SEGMENTS]} />
      </mesh>
    </group>
  )
}

/**
 * Drives the r3f camera along the cinematic orbital rig ({@link ORBIT_RIG}) — a
 * multi-beat move that follows the colonization (wide Earth → push-in → survey).
 * Pure + frame-driven: the pose comes straight from {@link orbitPoseAt} +
 * {@link driftedOrbitPose}, mutated imperatively each frame (no `useFrame` clock),
 * so two renders of the same frame place the camera identically. The camera always
 * looks at the globe centre. Lives inside the canvas so `useThree` can reach it.
 */
function CameraRig({ frame }: { frame: number }) {
  const camera = useThree((s) => s.camera)
  const pose = orbitPoseAt(ORBIT_RIG, frame)
  const drifted = driftedOrbitPose(pose, frame)
  camera.position.set(drifted.position[0], drifted.position[1], drifted.position[2])
  camera.lookAt(0, 0, 0)
  return null
}

export function GloboVivoVideo() {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const yaw = sphereYawAt(frame)
  const cloudYaw = cloudYawAt(frame, CLOUD_ROT_PERIOD_FRAMES)
  const mask = maskUniformsAt(frame)
  const maps = useEarthMaps()
  const atlasTex = useAtlasTexture()

  // Repaint the living-tissue atlas for this frame and flag the GPU re-upload.
  // `renderAtlas` reuses one canvas, so the texture just re-reads it.
  renderAtlas(frame)
  atlasTex.needsUpdate = true

  // Initial camera framing = the rig's frame-0 pose, so the first painted frame
  // already sits on the wide opening beat (CameraRig then drives it per frame).
  const initialPose = orbitPoseAt(ORBIT_RIG, 0)

  return (
    <AbsoluteFill style={{ backgroundColor: STUDIO_BG }}>
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ position: initialPose.position, fov: CAMERA_FOV }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <CameraRig frame={frame} />
        {/* Simple studio key + soft fill — Phase 4 swaps in HDRI/fresnel/bloom. */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.35} />
        <directionalLight position={[-4, -2, -3]} intensity={0.28} />
        {maps && <Earth maps={maps} atlasTex={atlasTex} yaw={yaw} cloudYaw={cloudYaw} mask={mask} />}
      </ThreeCanvas>
    </AbsoluteFill>
  )
}
