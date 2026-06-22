/**
 * FlowBuilderVideo — «el flujo, a mano» (1920×1080 · 30 fps).
 * ──────────────────────────────────────────────────────────────────────────
 * A real Zapier automation assembles itself, block by block: Gmail trigger →
 * Filtro (conditional) → Rutas split into two condition-labelled branches, a
 * deep action stack down each branch, and a second Filtro nested in one of
 * them (HubSpot · Slack · Calendar · Sheets · Trello…). No cursor, no captions:
 * just the relentless, slow accretion of blocks and wires. The length is the
 * message — programming like this, by hand, makes no sense.
 *
 * No CSS animation: every plate, elbow, condition chip and the camera are pure
 * functions of the frame, read from {@link flowBuilderScript}. A cinematic
 * camera glides block to block down each branch, then pulls back to the whole
 * tangle — the house rule, never a static plano.
 */

import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { KIT_BLUE, elevation, lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'
import { CURVE, DUR, ease } from './motion'
import { cameraPose, cameraTransform, driftedPose } from './aikit/cameraScript'
import {
  BLOCKS,
  BUS_Y,
  CARD_H,
  CARD_W,
  FLOW_ANCHORS,
  FLOW_CAM,
  type FlowBlock,
  FLOW_BUILDER_DURATION,
  type GlyphName,
  connectorPath,
} from './flowBuilderScript'

export { FLOW_BUILDER_DURATION }

const theme = lightTheme
const CONNECTOR_COLOR = '#b7c4d8'

const KIND_LABEL: Record<FlowBlock['kind'], string> = {
  trigger: 'Disparador',
  filter: 'Filtro',
  paths: 'Rutas',
  action: 'Acción',
}

export function FlowBuilderVideo() {
  const frame = useCurrentFrame()
  const cam = driftedPose(cameraPose(FLOW_CAM, frame, CURVE.standard), frame, 0.4)

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT, color: theme.textStrong, overflow: 'hidden' }}>
      <Fonts />
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '50% 50%', transform: cameraTransform(cam) }}>
        <Connectors frame={frame} />
        {BLOCKS.map((b, i) => (b.branchLabel ? <ConditionChip key={`chip${i}`} frame={frame} i={i} /> : null))}
        {BLOCKS.map((b, i) => (
          <BlockCard key={b.id} frame={frame} i={i} block={b} />
        ))}
        {BLOCKS.map((_, i) => (i === 0 ? null : <InsertPoint key={`add${i}`} frame={frame} i={i} />))}
      </div>
    </AbsoluteFill>
  )
}

/* ── connectors: every wire drawn in as its block is created ────────────────── */

function Connectors({ frame }: { frame: number }) {
  return (
    <svg aria-hidden style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1320, overflow: 'visible', pointerEvents: 'none' }}>
      {BLOCKS.map((_, i) => {
        const d = connectorPath(i)
        if (!d) return null
        const a = FLOW_ANCHORS[i]
        const grow = ease(frame, a.connStart, a.connStart + a.connDur, CURVE.standard)
        if (grow <= 0.001) return null
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={CONNECTOR_COLOR}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - grow}
          />
        )
      })}
    </svg>
  )
}

/* ── a Zapier block: app tile + role/event, with conditional config inside ──── */

function BlockCard({ frame, i, block }: { frame: number; i: number; block: FlowBlock }) {
  const a = FLOW_ANCHORS[i]
  const plate = ease(frame, a.plateAt, a.plateAt + DUR.reveal)
  if (plate <= 0.001) return null

  const tile = ease(frame, a.tileAt, a.tileAt + DUR.base)
  const label = ease(frame, a.labelAt, a.labelAt + DUR.reveal)

  const base = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 20 })
  const accent = block.kind === 'trigger' ? '#ea6a3a' : block.kind === 'filter' ? '#7c8aa6' : block.kind === 'paths' ? '#6b5cff' : theme.textMuted

  return (
    <div
      style={{
        position: 'absolute',
        left: block.x - CARD_W / 2,
        top: block.y,
        width: CARD_W,
        height: CARD_H,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        gap: 15,
        padding: '0 18px',
        ...base,
        opacity: plate,
        transform: `translateY(${(1 - plate) * 14}px) scale(${0.985 + 0.015 * plate})`,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          flexShrink: 0,
          borderRadius: 15,
          background: block.color,
          display: 'grid',
          placeItems: 'center',
          boxShadow: `0 6px 14px ${block.color}55`,
          opacity: tile,
          transform: `scale(${0.6 + 0.4 * tile})`,
        }}
      >
        <Glyph name={block.glyph} size={27} />
      </div>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3, opacity: label, transform: `translateX(${(1 - label) * -8}px)` }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: accent }}>
          {`${i + 1} · ${KIND_LABEL[block.kind]}`}
        </span>
        <span style={{ fontSize: 19, fontWeight: 600, letterSpacing: -0.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {block.title}
        </span>
        {block.config ? (
          <ConfigRow frame={frame} configAt={a.configAt} chips={block.config} />
        ) : (
          <span style={{ fontSize: 12.5, color: theme.textMuted, whiteSpace: 'nowrap', opacity: label }}>{block.app}</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5, opacity: 0.38 * label }}>
        {[0, 1, 2].map((d) => (
          <span key={d} style={{ width: 3.5, height: 3.5, borderRadius: 999, background: theme.textMuted }} />
        ))}
      </div>
    </div>
  )
}

/** The little pills that make a block's config look hand-assembled — set one by one. */
function ConfigRow({ frame, configAt, chips }: { frame: number; configAt: number; chips: string[] }) {
  const pill = elevation(theme, { depth: 'recessed', distance: 1.5, blur: 4, radius: 7 })
  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
      {chips.map((c, i) => {
        const reveal = ease(frame, configAt + i * 5, configAt + i * 5 + DUR.base)
        return (
          <span
            key={i}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.textMuted,
              padding: '2.5px 8px',
              whiteSpace: 'nowrap',
              ...pill,
              opacity: reveal,
              transform: `scale(${0.85 + 0.15 * reveal})`,
            }}
          >
            {c}
          </span>
        )
      })}
    </div>
  )
}

/* ── the condition chip riding each branch elbow ────────────────────────────── */

function ConditionChip({ frame, i }: { frame: number; i: number }) {
  const b = BLOCKS[i]
  const a = FLOW_ANCHORS[i]
  const reveal = ease(frame, a.configAt, a.configAt + DUR.reveal)
  if (reveal <= 0.001 || !b.branchLabel) return null
  const pill = elevation(theme, { depth: 'raised', distance: 3, blur: 8, radius: 999 })
  return (
    <div
      style={{
        position: 'absolute',
        left: b.x,
        top: BUS_Y + 2,
        transform: `translate(-50%, -50%) scale(${0.9 + 0.1 * reveal})`,
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '5px 12px',
        whiteSpace: 'nowrap',
        opacity: reveal,
        ...pill,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: KIT_BLUE }} />
      <span style={{ fontSize: 12.5, fontWeight: 600, letterSpacing: -0.1, color: theme.textStrong }}>{b.branchLabel}</span>
    </div>
  )
}

/* ── a quiet "+" insert point on each connector (Zapier flavour) ─────────────── */

function InsertPoint({ frame, i }: { frame: number; i: number }) {
  const a = FLOW_ANCHORS[i]
  const appear = ease(frame, a.addAppearAt, a.addAppearAt + DUR.base)
  if (appear <= 0.001) return null
  const size = 24
  const relief = elevation(theme, { depth: 'raised', distance: 3, blur: 7, radius: 999 })
  const { x, y } = BLOCKS[i].add
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        display: 'grid',
        placeItems: 'center',
        ...relief,
        opacity: appear,
        transform: `scale(${0.7 + 0.3 * appear})`,
        zIndex: 2,
      }}
    >
      <svg width={size * 0.46} height={size * 0.46} viewBox="0 0 24 24" fill="none" stroke={theme.textMuted} strokeWidth={2.6} strokeLinecap="round">
        <path d="M12 5 V19 M5 12 H19" />
      </svg>
    </div>
  )
}

/* ── concrete app / logic glyphs (white, on the colour tile) ───────────────── */

function Glyph({ name, size }: { name: GlyphName; size: number }) {
  const stroke = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: '#fff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
  const fill = { width: size, height: size, viewBox: '0 0 24 24', fill: '#fff' } as const

  if (name === 'mail') return (<svg {...stroke}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="M4 7 L12 13 L20 7" /></svg>)
  if (name === 'funnel') return (<svg {...fill}><path d="M3 5 H21 L14 13 V20 L10 18 V13 Z" /></svg>)
  if (name === 'branch') return (<svg {...stroke}><path d="M12 4 V10" /><path d="M12 10 C12 14 6 14 6 20" /><path d="M12 10 C12 14 18 14 18 20" /><circle cx="12" cy="4" r="1.6" fill="#fff" stroke="none" /><circle cx="6" cy="20" r="1.6" fill="#fff" stroke="none" /><circle cx="18" cy="20" r="1.6" fill="#fff" stroke="none" /></svg>)
  if (name === 'user') return (<svg {...stroke}><circle cx="12" cy="8" r="3.4" /><path d="M5 20 a7 7 0 0 1 14 0" /></svg>)
  if (name === 'hash') return (<svg {...stroke}><path d="M9 4 L7.5 20 M16.5 4 L15 20 M5 9 H19 M4 15 H18" /></svg>)
  if (name === 'grid') return (<svg {...stroke}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10 H20 M4 15 H20 M10 4 V20" /></svg>)
  if (name === 'calendar') return (<svg {...stroke}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9 H20 M8 3 V6 M16 3 V6" /></svg>)
  if (name === 'board') return (<svg {...stroke}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4 V20 M15 4 V13" /></svg>)
  // send — paper plane
  return (<svg {...fill}><path d="M3 11 L21 3 L13.5 21 L11 13.5 Z" /></svg>)
}
