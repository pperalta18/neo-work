import type { CSSProperties, ReactNode } from 'react'
import { useCurrentFrame } from 'remotion'
import {
  BRAND,
  elevation,
  KIT_BLUE,
  TEXT_FONT,
  lightTheme,
  type BrandColor,
  type NeoTheme,
} from '@/lib/neumorphism'
import { MODULES, isModuleName, type ModuleSpec } from '@/stories/neo/modules/modules'
import { avatarInitials } from './cast'
import { breathPose } from './graphScript'
import {
  TILE_RADIUS,
  TILE_SIZE,
  type TileMorphSpec,
  avatarPop,
  tileIgnitePose,
  tileMorphGlyphStart,
  tileMorphPose,
} from './tileScript'

export type { TileMorphSpec }

// The KanbanWidget avatar cycle — chip i wears colour i mod 5.
const AVATAR_CYCLE: readonly BrandColor[] = ['blue', 'pink', 'green', 'orange', 'violet']

/** Face glyph: the workspace's module icon, else the process chevron
 * (InventoryTableVideo's tile arrow). `progress` drives the resolve scale. */
function Glyph({
  module,
  size,
  theme,
  progress,
}: {
  module?: string
  size: number
  theme: NeoTheme
  progress: number
}) {
  const spec: ModuleSpec | null = module != null && isModuleName(module) ? MODULES[module] : null
  const scale = 0.7 + 0.3 * progress
  if (spec) {
    return (
      <img
        src={spec.icon}
        alt=""
        width={size * 0.46}
        height={size * 0.46}
        style={{
          display: 'block',
          transform: `scale(${scale})${spec.rotate ? ` rotate(${spec.rotate}deg)` : ''}`,
        }}
      />
    )
  }
  return (
    <svg
      width={size * 0.31}
      height={size * 0.31}
      viewBox="0 0 24 24"
      fill="none"
      stroke={theme.textMuted}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: `rotate(-90deg) scale(${scale})` }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** The overlapping initials chips, each popping on its avatarPop beat.
 * Render centred on the tile's bottom edge (the parent positions it). */
function AvatarStack({
  people,
  frame,
  at,
  tileSize,
  theme,
}: {
  people: readonly string[]
  frame: number
  at: number
  tileSize: number
  theme: NeoTheme
}) {
  const chip = Math.round(tileSize * 0.2)
  return (
    <div style={{ display: 'flex' }}>
      {people.map((name, i) => {
        const pop = avatarPop(frame, at, i)
        if (pop <= 0.002) return null
        return (
          <div
            key={i}
            style={{
              width: chip,
              height: chip,
              borderRadius: '50%',
              background: BRAND[AVATAR_CYCLE[i % AVATAR_CYCLE.length]],
              border: `2.5px solid ${theme.surface}`,
              marginLeft: i === 0 ? 0 : -chip * 0.3,
              display: 'grid',
              placeItems: 'center',
              fontSize: chip * 0.38,
              fontWeight: 700,
              letterSpacing: 0.2,
              color: '#fff',
              opacity: pop,
              transform: `scale(${0.4 + 0.6 * pop})`,
            }}
          >
            {avatarInitials(name)}
          </div>
        )
      })}
    </div>
  )
}

/** Quiet caption under the tile (the BaGraph node caption). */
function TileLabel({
  label,
  opacity,
  hasPeople,
  theme,
}: {
  label: string
  opacity: number
  hasPeople: boolean
  theme: NeoTheme
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: hasPeople ? 22 : 9,
        maxWidth: 170,
        fontSize: 12.5,
        lineHeight: '16px',
        textAlign: 'center',
        letterSpacing: -0.1,
        color: theme.textMuted,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        opacity,
      }}
    >
      {label}
    </div>
  )
}

export type WorkspaceTileProps = {
  /** Ignite frame — the tile powers on here (tileScript.tileIgnitePose). */
  at: number
  /** Quiet caption under the tile. */
  label?: string
  /** AiKit module id (modules.ts) for the face icon; default = process chevron. */
  module?: string
  /** Who shares the workspace — initials chips straddling the bottom edge. */
  people?: readonly string[]
  /** Tile edge (px). Default TILE_SIZE (128). */
  size?: number
  /** Glow colour. Default KIT_BLUE. */
  accent?: string
  /** Idle bob once settled. Default 0 — workspace panels sit still. */
  breathe?: number
  /** Crowd index for breath phase variety (only matters when breathe > 0). */
  index?: number
  theme?: NeoTheme
  showLabel?: boolean
  /** Local frame override; defaults to useCurrentFrame() (wrap in <Sequence> to offset). */
  frame?: number
  style?: CSSProperties
}

/**
 * WorkspaceTile — the 128px workspace/process tile.
 * ─────────────────────────────────────────────────
 * The grid module screens collapse into: a raised plate that powers on with
 * the GoalDisc beat (tileIgnitePose — settles at InventoryTableVideo's tile
 * relief, so ignited and morph-landed tiles match), a module icon or process
 * chevron on the face, and a KanbanWidget avatar-stack popping in along the
 * bottom edge. Footprint is size×size; the label hangs below like a BaGraph
 * caption. Themed by prop, deterministic per frame.
 */
export function WorkspaceTile({
  at,
  label,
  module,
  people,
  size = TILE_SIZE,
  accent = KIT_BLUE,
  breathe = 0,
  index = 0,
  theme = lightTheme,
  showLabel = true,
  frame: frameProp,
  style,
}: WorkspaceTileProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  const pose = tileIgnitePose(frame, at)
  if (pose.opacity <= 0.002) return null

  const k = size / TILE_SIZE
  const breath = breathPose(frame, index, breathe * pose.content)
  const plate = elevation(theme, {
    depth: 'raised',
    distance: Math.max(2, pose.distance * k),
    blur: Math.max(4, pose.blur * k),
    radius: TILE_RADIUS * k,
  })

  const glowAlphaHex = Math.round(pose.glowAlpha * 255)
    .toString(16)
    .padStart(2, '0')
  const glow =
    pose.glowAlpha > 0.01
      ? `0 0 ${Math.max(0, pose.glowBlur * k)}px ${accent}${glowAlphaHex}`
      : undefined

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        fontFamily: TEXT_FONT,
        opacity: pose.opacity,
        transform: `translateY(${breath.dy}px) scale(${pose.scale * breath.scale})`,
        transformOrigin: '50% 50%',
        ...style,
      }}
    >
      <div style={{ ...plate, width: '100%', height: '100%', display: 'grid', placeItems: 'center' }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            opacity: pose.content,
            transform: `scale(${pose.content})`,
            transformOrigin: '50% 50%',
            borderRadius: 999,
            boxShadow: glow,
          }}
        >
          <Glyph module={module} size={size} theme={theme} progress={1} />
        </div>
      </div>

      {people && people.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            transform: 'translate(-50%, 50%)',
          }}
        >
          <AvatarStack people={people} frame={frame} at={at} tileSize={size} theme={theme} />
        </div>
      )}

      {showLabel && label && (
        <TileLabel
          label={label}
          opacity={pose.content}
          hasPeople={!!people && people.length > 0}
          theme={theme}
        />
      )}
    </div>
  )
}

export type TileMorphProps = {
  /** The morph script (tileScript) — source rect, landing centre, startAt. */
  spec: TileMorphSpec
  /** The screen's content, rendered at the source rect's size; it fades out
   * and is clipped as the box folds down (never reflows). */
  children?: ReactNode
  /** Tile face that resolves in. */
  label?: string
  module?: string
  people?: readonly string[]
  theme?: NeoTheme
  showLabel?: boolean
  /** Local frame override; defaults to useCurrentFrame(). */
  frame?: number
  style?: CSSProperties
}

/**
 * TileMorph — the screen→tile gesture (InventoryTableVideo's outro as a kit
 * piece). ONE absolutely-positioned box: the source screen sits at rest until
 * `spec.startAt`, then its content fades, the box shrinks and travels to the
 * landing centre while radius + relief interpolate to the tile's, and the
 * tile face (glyph, then avatars) resolves inside it. Position it inside the
 * stage container the `spec` coordinates are authored in.
 */
export function TileMorph({
  spec,
  children,
  label,
  module,
  people,
  theme = lightTheme,
  showLabel = true,
  frame: frameProp,
  style,
}: TileMorphProps) {
  const globalFrame = useCurrentFrame()
  const frame = frameProp ?? globalFrame
  const pose = tileMorphPose(spec, frame)
  const size = spec.size ?? TILE_SIZE
  const avatarsAt = tileMorphGlyphStart(spec)

  const boxShadow = elevation(theme, {
    depth: 'raised',
    distance: pose.distance,
    blur: pose.blur,
  }).boxShadow as string

  return (
    <div
      style={{
        position: 'absolute',
        left: pose.x,
        top: pose.y,
        width: pose.width,
        height: pose.height,
        fontFamily: TEXT_FONT,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: pose.radius,
          backgroundColor: theme.surface,
          boxShadow,
          overflow: 'hidden',
        }}
      >
        {children != null && pose.source > 0.002 && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: spec.from.width,
              height: spec.from.height,
              opacity: pose.source,
            }}
          >
            {children}
          </div>
        )}

        {pose.glyph > 0.002 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              opacity: pose.glyph,
            }}
          >
            <Glyph module={module} size={size} theme={theme} progress={pose.glyph} />
          </div>
        )}
      </div>

      {people && people.length > 0 && pose.glyph > 0.002 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: 0,
            transform: 'translate(-50%, 50%)',
          }}
        >
          <AvatarStack people={people} frame={frame} at={avatarsAt} tileSize={size} theme={theme} />
        </div>
      )}

      {showLabel && label && pose.glyph > 0.002 && (
        <TileLabel
          label={label}
          opacity={pose.glyph}
          hasPeople={!!people && people.length > 0}
          theme={theme}
        />
      )}
    </div>
  )
}
