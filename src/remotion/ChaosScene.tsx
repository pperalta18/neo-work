/**
 * ChaosScene — el acto del "problema" compartido entre flujos.
 * ──────────────────────────────────────────────────────────────────────────
 * El patrón de apertura común: en el centro, lo que el negocio quiere conseguir
 * ("Tu tienda", "Tu campaña"…); a su alrededor, un enjambre de opciones que van
 * apareciendo y se AMONTONAN, tiemblan y derivan hacia el centro: herramientas
 * reales (`kind: 'platform'`, punto azul) mezcladas con el ruido / las tareas
 * manuales que arrastran (`kind: 'friction'`, punto naranja), algunas con una
 * etiqueta de fricción (semanas · €€€ · técnico). La sensación es de parálisis
 * por exceso — el "dolor" que AiKit resuelve.
 *
 * Parametrizado por `centerIcon/centerTitle/centerSubtitle` + `items`, para que
 * cada flujo (E-Commerce, Email Marketing…) tenga su propio "lío" reutilizando
 * la misma mecánica. Todo derivado de `useCurrentFrame()` (azar por hash
 * determinista, sin `Math.random`/`Date.now`): reproducible frame a frame.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, BRAND, TEXT_FONT, DISPLAY_FONT } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const CORE_RISE = 14 // el centro emerge al arrancar
const CHIP_START = 8 // primer chip
const CHIP_STEP = 3.6 // separación entre chips (se amontonan rápido)
const CHIP_IN = 13 // lo que tarda un chip en aparecer
const HOLD = 38 // remate: todo vibra, abrumador (cola ampliada para leer el último chip)

const CORE_SIZE = 184

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Hash determinista por índice → 0..1 (sustituye a Math.random). */
function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

export type ChaosKind = 'platform' | 'friction'
export type ChaosItem = { label: string; kind: ChaosKind; tag?: string }

export type ChaosSceneProps = {
  /** Icono del nodo central (lo que el negocio quiere conseguir). */
  centerIcon: IconName
  /** Título del nodo central. */
  centerTitle: string
  /** Subtítulo del nodo central. */
  centerSubtitle: string
  /** El enjambre de opciones que abruma. */
  items: ChaosItem[]
}

/** Duración (frames) del acto de caos para un nº de items dado. */
export function chaosDuration(itemCount: number): number {
  const lastSpawn = CHIP_START + (itemCount - 1) * CHIP_STEP + CHIP_IN
  return Math.ceil(lastSpawn + HOLD)
}

type ChipSpec = {
  spawn: number
  bx: number
  by: number
  jitterAmp: number
  jitterPhase: number
}

function buildChips(items: ChaosItem[]): ChipSpec[] {
  return items.map((_, i): ChipSpec => {
    // Repartidos en un anillo elíptico, con ángulo casi uniforme + jitter, en dos
    // bandas (ambas lo bastante lejos para no caer sobre el núcleo + wordmark).
    const theta = (i / items.length) * Math.PI * 2 + (rnd(i, 1) - 0.5) * 0.8
    const band = i % 2 === 0 ? 1 : 0.84
    const R = (440 + rnd(i, 2) * 200) * band
    return {
      spawn: CHIP_START + i * CHIP_STEP,
      bx: Math.cos(theta) * R,
      by: Math.sin(theta) * R * 0.62,
      jitterAmp: 2.5 + rnd(i, 3) * 3.5,
      jitterPhase: rnd(i, 4) * Math.PI * 2,
    }
  })
}

/** Una opción (herramienta o tarea/ruido) que aparece y tiembla. */
function OptionChip({
  item,
  spec,
  frame,
  cx,
  cy,
  unrest,
}: {
  item: ChaosItem
  spec: ChipSpec
  frame: number
  cx: number
  cy: number
  unrest: number
}) {
  if (frame < spec.spawn - 0.001) return null
  const p = smoother(clamp01((frame - spec.spawn) / CHIP_IN))
  const pop = 0.5 + 0.5 * p + Math.sin(clamp01(p) * Math.PI) * 0.08
  const drift = smoother(clamp01((frame - spec.spawn) / 150)) * 0.12

  const jx = Math.sin(frame * 0.5 + spec.jitterPhase) * spec.jitterAmp * (0.4 + unrest)
  const jy = Math.cos(frame * 0.43 + spec.jitterPhase * 1.7) * spec.jitterAmp * (0.4 + unrest)

  const x = cx + lerp(spec.bx, 0, drift) + jx
  const y = cy + lerp(spec.by, 0, drift) + jy

  const isFriction = item.kind === 'friction'
  const plate = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 999 })
  const dotColor = isFriction ? BRAND.orange : KIT_BLUE

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${pop})`,
        opacity: clamp01(p * 1.4),
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '10px 16px',
        whiteSpace: 'nowrap',
        background: theme.surface,
        ...plate,
        fontFamily: TEXT_FONT,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 999, background: dotColor, flexShrink: 0 }} />
      <span
        style={{
          fontSize: 17,
          fontWeight: isFriction ? 500 : 600,
          letterSpacing: -0.3,
          color: isFriction ? theme.textMuted : theme.textStrong,
        }}
      >
        {item.label}
      </span>
      {item.tag && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.2,
            color: BRAND.red,
            background: `${BRAND.red}1f`,
            borderRadius: 7,
            padding: '3px 7px',
          }}
        >
          {item.tag}
        </span>
      )}
    </div>
  )
}

/** El núcleo: lo que el negocio quiere conseguir, que tiembla cuando el caos arrecia. */
function Core({ x, y, unrest, icon }: { x: number; y: number; unrest: number; icon: IconName }) {
  const disc = elevation(theme, { depth: 'raised', distance: 16, blur: 38, radius: 40 })
  const shake = Math.sin(x + unrest * 40) * unrest * 1.5
  return (
    <div
      style={{
        position: 'absolute',
        left: x - CORE_SIZE / 2,
        top: y - CORE_SIZE / 2,
        width: CORE_SIZE,
        height: CORE_SIZE,
        transform: `translateX(${shake}px)`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 40,
          display: 'grid',
          placeItems: 'center',
          background: theme.surface,
          ...disc,
        }}
      >
        <Icon name={icon} size={78} color={KIT_BLUE} strokeWidth={1.7} />
      </div>
    </div>
  )
}

export function ChaosScene({ centerIcon, centerTitle, centerSubtitle, items }: ChaosSceneProps) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const cx = W / 2
  const cy = H * 0.47
  const chips = buildChips(items)

  const rise = smoother(clamp01(frame / CORE_RISE))
  const spawned = chips.filter((c) => frame >= c.spawn).length
  const fill = spawned / chips.length
  const lastSpawn = CHIP_START + (items.length - 1) * CHIP_STEP + CHIP_IN
  const tail = clamp01((frame - lastSpawn) / HOLD)
  const unrest = clamp01(fill * 0.7 + tail * 0.9)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden', opacity: rise }}>
        {chips.map((spec, i) => (
          <OptionChip key={i} item={items[i]} spec={spec} frame={frame} cx={cx} cy={cy} unrest={unrest} />
        ))}

        <Core x={cx} y={cy} unrest={unrest} icon={centerIcon} />

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cy + CORE_SIZE / 2 + 22,
            textAlign: 'center',
            fontFamily: DISPLAY_FONT,
            color: theme.textStrong,
          }}
        >
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.8 }}>{centerTitle}</div>
          <div style={{ fontSize: 17, fontWeight: 500, color: theme.textMuted, letterSpacing: -0.3, marginTop: 4 }}>
            {centerSubtitle}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
