/**
 * PulseOverdrive — a second from-scratch test of the music-sync system, proving
 * the analyse → read summary → place motion workflow is song- AND scene-agnostic.
 * ────────────────────────────────────────────────────────────────────────────
 * MusicPulse (the first demo) animated a circle + square off the map. This is a
 * *different* visual reading the *same kind* of map — `pulse-overdrive.mp3`,
 * analysed by `npm run beats` (135 BPM, 6 energy-cut sections, 7 typed moments,
 * headline drop at f1475). Nothing here decodes audio; every pixel is derived
 * from the committed beat map via `useCurrentFrame()`, so the render is
 * deterministic ("state in, frame out").
 *
 * The scene is a neumorphic "drive console":
 *
 *   • a RADIAL SPECTRUM CORONA — 84 bars in a ring, bottom bars bulging with the
 *     low band (the kick), top bars sparkling with the highs, sides riding the
 *     mids; the whole ring punches on every bar (`useBeatPulse`) and rides the
 *     committed energy envelopes (`useEnergy`);
 *   • EMITTED SHOCKWAVE RINGS — a ring fires outward on every downbeat and a big
 *     one on every `drop` moment, computed purely from the downbeat/moment frames;
 *   • an ENGINE CORE that breathes with the bass and slams on a drop, ringed by an
 *     OVERDRIVE redline meter (overall energy → a rev gauge that redlines on hits);
 *   • a corner TACHOMETER (the thematic gauge) whose needle revs with the song;
 *   • a NEXT-HIT countdown (`useNextMoment`) and a STRUCTURE RIBBON timeline that
 *     marks every section + typed moment, with a moving playhead.
 *
 * Each structural MOMENT gets a designer's treatment scaled by its 0..1 strength
 * (drop → slam + white flash + giant shockwave; break → pull back / dim; lift →
 * a continuous charge ramp — this track has none, but the path stays in so the
 * scene drops onto ANY analysed song, exactly like MusicPulse).
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)).
 */
import { useMemo } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, type CalculateMetadataFunction } from 'remotion'
import { lightTheme, elevation, KIT_BLUE, BRAND, TEXT_FONT, DISPLAY_FONT } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { secondsToFrame, downbeatFrames, sectionAt, type BeatMap, type MomentType } from '@/lib/beatmap'
import {
  AudioTrack,
  useBeatPulse,
  useEnergy,
  useOverallEnergy,
  useMusicSection,
  useMomentPulse,
  useRangedMoment,
  useNextMoment,
  useBeatMap,
} from './AudioTrack'
import { Fonts } from './fonts'
import beatMapJson from '../../public/audio/pulse-overdrive.beats.json'

const MAP = beatMapJson as BeatMap
const FPS = 30
/** The composition spans the whole song — its length, not a magic constant. */
export const PULSE_OVERDRIVE_DURATION = secondsToFrame(MAP.duration, FPS)

/** The hero sits a touch above centre, leaving room for the console + ribbon. */
const CX = 960
const CY = 540

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** Tension easing — flat then explosive, so a build leans hardest at the resolve. */
const easeInExpo = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, 10 * (p - 1)))

/** Map an energy-derived section name to a palette mood (cool → warm by drive). */
function accentFor(name: string): string {
  if (name.startsWith('intro') || name.startsWith('quiet')) return BRAND.blue
  if (name.startsWith('groove')) return BRAND.teal
  if (name.startsWith('build')) return BRAND.orange
  if (name.startsWith('drop') || name.startsWith('peak')) return BRAND.red
  if (name.startsWith('break') || name.startsWith('bridge')) return BRAND.violet
  if (name.startsWith('outro')) return BRAND.purple
  return KIT_BLUE
}

/** Per-moment-type colour + glyph for the ribbon markers and callout. */
const MOMENT_COLOR: Record<MomentType, string> = { drop: BRAND.red, lift: BRAND.orange, break: BRAND.violet, dropout: BRAND.teal }
const MOMENT_GLYPH: Record<MomentType, string> = { drop: '▲', lift: '△', break: '▼', dropout: '○' }

/** [min, max] section intensity — lets the macro size arc auto-scale to ANY song. */
function sectionIntensityRange(map: BeatMap): [number, number] {
  const xs = map.sections.map((s) => s.intensity).filter((x): x is number => x != null)
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 1]
}

// ── radial spectrum corona ──────────────────────────────────────────────────────
// 84 bars in a ring. Each bar's length blends the three committed energy bands by
// its angle (bass at the bottom, treble at the top, mids on the sides) plus a
// beat punch and a travelling shimmer — a live, song-reactive halo around the core.
const N_BARS = 84
const CORONA_R0 = 150 // inner radius where bars start
const CORONA_BASE = 12 // shortest bar
const CORONA_EXT = 122 // longest extra reach

function Corona() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const low = useEnergy('low')
  const mid = useEnergy('mid')
  const high = useEnergy('high')
  const overall = useOverallEnergy()
  const bar = useBeatPulse({ on: 'downbeat', decay: Math.round(fps * 0.5) })
  const beat = useBeatPulse({ on: 'beat', decay: Math.round(fps * 0.16) })
  const impact = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.55) })

  const bars = []
  for (let i = 0; i < N_BARS; i++) {
    const a = i / N_BARS // bar 0 points down (6 o'clock); a sweeps the full ring
    const ang = a * 2 * Math.PI
    const wLow = (1 + Math.cos(ang)) / 2 // bass peaks at the bottom (the kick)
    const wHigh = (1 - Math.cos(ang)) / 2 // treble peaks at the top
    const wMid = (1 - Math.cos(2 * ang)) / 2 // mids peak on the sides
    const wsum = wHigh + wLow + wMid || 1
    const e = (low * wLow + mid * wMid + high * wHigh) / wsum
    const ripple = 0.12 * overall * Math.sin(a * Math.PI * 12 - frame * 0.22)
    const pulse = 0.22 * bar + 0.1 * beat + 0.3 * impact
    const len = CORONA_BASE + CORONA_EXT * clamp01(e + ripple + pulse)
    // Colour by the dominant band → the ring doubles as a spectrum legend.
    const color = wLow >= wMid && wLow >= wHigh ? BRAND.teal : wHigh >= wMid && wHigh >= wLow ? BRAND.orange : BRAND.blue
    const opacity = 0.32 + 0.6 * clamp01(e + 0.3 * bar + 0.4 * impact)
    bars.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          left: CX,
          top: CY,
          width: 7,
          height: len,
          marginLeft: -3.5,
          borderRadius: 4,
          background: color,
          opacity,
          transformOrigin: '50% 0%',
          transform: `rotate(${a * 360}deg) translateY(${CORONA_R0}px)`,
          boxShadow: `0 0 ${6 + 22 * clamp01(e)}px ${color}`,
        }}
      />,
    )
  }
  return <AbsoluteFill>{bars}</AbsoluteFill>
}

// ── emitted shockwaves ──────────────────────────────────────────────────────────
// A ring fires on every downbeat and travels outward as it fades; a far bigger,
// redder ring fires on every `drop` moment (scaled by its strength). Both are pure
// functions of the (downbeat / moment) frame list — no per-ring state.
function Shockwaves() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const map = useBeatMap()
  const dbFrames = useMemo(() => downbeatFrames(map, fps), [map, fps])
  const dropFrames = useMemo(
    () => (map.moments ?? []).filter((m) => m.type === 'drop').map((m) => ({ f: secondsToFrame(m.time, fps), s: m.strength })),
    [map, fps],
  )
  const beatLife = Math.round(fps * 1.5)
  const dropLife = Math.round(fps * 1.9)
  const rings: React.ReactNode[] = []

  for (const f of dbFrames) {
    const age = frame - f
    if (age < 0 || age >= beatLife) continue
    const p = age / beatLife
    const r = 70 + p * 280
    const accent = accentFor(sectionAt(map, f, fps)?.name ?? '')
    rings.push(
      <div
        key={`db${f}`}
        style={{
          position: 'absolute',
          left: CX - r,
          top: CY - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${Math.max(1, (1 - p) * 5)}px solid ${accent}`,
          opacity: (1 - p) * 0.4,
        }}
      />,
    )
  }

  for (const { f, s } of dropFrames) {
    const age = frame - f
    if (age < 0 || age >= dropLife) continue
    const p = age / dropLife
    const r = 90 + p * (360 + 320 * s)
    rings.push(
      <div
        key={`dr${f}`}
        style={{
          position: 'absolute',
          left: CX - r,
          top: CY - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${Math.max(1, (1 - p) * (6 + 8 * s))}px solid ${BRAND.red}`,
          opacity: (1 - p) * (0.35 + 0.5 * s),
          boxShadow: `0 0 ${40 * (1 - p) * s}px ${BRAND.red}`,
        }}
      />,
    )
  }

  return <AbsoluteFill>{rings}</AbsoluteFill>
}

// ── engine core + overdrive redline ring ────────────────────────────────────────
function Core() {
  const { fps } = useVideoConfig()
  const map = useBeatMap()
  const ms = useMusicSection()
  const name = ms?.section.name ?? ''
  const intensity = ms?.section.intensity ?? 0.2
  const accent = accentFor(name)

  const bar = useBeatPulse({ on: 'downbeat', decay: Math.round(fps * 0.5) })
  const low = useEnergy('low')
  const overall = useOverallEnergy()
  const dropHit = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.6) })
  const breakPull = useMomentPulse({ type: 'break', decay: Math.round(fps * 1.1) })
  const ranged = useRangedMoment()
  const liftRamp = ranged && ranged.moment.type === 'lift' ? easeInExpo(ranged.progress) * ranged.moment.strength : 0

  // Macro size auto-scaled to THIS song's dynamic range (quietest → 0, loudest → 1).
  const [minI, maxI] = sectionIntensityRange(map)
  const tInt = maxI > minI ? clamp01((intensity - minI) / (maxI - minI)) : 0.5
  const macro = 0.86 + 0.32 * tInt
  const scale = macro * (1 + 0.16 * bar + 0.1 * low + 0.32 * dropHit + 0.12 * liftRamp - 0.1 * breakPull)

  // The "overdrive" rev: how hard the engine is pushing right now (0..1).
  const rev = clamp01(0.1 + 0.62 * overall + 0.45 * dropHit + 0.12 * bar + 0.5 * liftRamp)
  const D = 264 // core diameter
  const ring = 132 // redline ring radius
  const C = 2 * Math.PI * ring
  const revColor = rev > 0.82 ? BRAND.red : rev > 0.6 ? BRAND.orange : accent

  return (
    <div style={{ position: 'absolute', left: CX, top: CY, width: 0, height: 0, transform: `scale(${scale})` }}>
      {/* Engine core — a raised neumorphic disc, centred on the (CX, CY) anchor. */}
      <div
        style={{
          position: 'absolute',
          left: -D / 2,
          top: -D / 2,
          width: D,
          height: D,
          borderRadius: '50%',
          ...elevation(lightTheme, { depth: 'raised', distance: 16, blur: 34, radius: D }),
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: D - 64,
            height: D - 64,
            borderRadius: '50%',
            ...elevation(lightTheme, { depth: 'recessed', distance: 8, blur: 18, radius: D }),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <div style={{ fontFamily: DISPLAY_FONT, fontSize: 64, fontWeight: 800, color: revColor, lineHeight: 1 }}>
            {Math.round(rev * 100)}
          </div>
          <div style={{ fontFamily: TEXT_FONT, fontSize: 16, letterSpacing: 4, color: lightTheme.textMuted }}>OVERDRIVE</div>
        </div>
      </div>
      {/* Redline ring — overall energy fills it clockwise; reds out on a hit. */}
      <svg width={D + 80} height={D + 80} style={{ position: 'absolute', left: -(D + 80) / 2, top: -(D + 80) / 2, transform: 'rotate(-90deg)' }}>
        <circle cx={(D + 80) / 2} cy={(D + 80) / 2} r={ring} fill="none" stroke={lightTheme.shadow} strokeWidth={6} opacity={0.5} />
        <circle
          cx={(D + 80) / 2}
          cy={(D + 80) / 2}
          r={ring}
          fill="none"
          stroke={revColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${rev * C} ${C}`}
          style={{ filter: `drop-shadow(0 0 ${10 + 26 * rev}px ${revColor})` }}
        />
      </svg>
    </div>
  )
}

// ── corner tachometer (the thematic "overdrive" gauge) ──────────────────────────
function Tachometer() {
  const { fps } = useVideoConfig()
  const overall = useOverallEnergy()
  const dropHit = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.6) })
  const bar = useBeatPulse({ on: 'downbeat', decay: Math.round(fps * 0.45) })
  const rev = clamp01(0.08 + 0.64 * overall + 0.5 * dropHit + 0.12 * bar)

  const W = 300
  const H = 168
  const cx = W / 2
  const cy = H - 18
  const r = 116
  // Semicircle from 180° (left, idle) through 270° (top) to 360° (right, redline).
  const angOf = (v: number) => (180 + v * 180) * (Math.PI / 180)
  const pt = (v: number, rr = r) => [cx + rr * Math.cos(angOf(v)), cy + rr * Math.sin(angOf(v))]
  const [nx, ny] = pt(rev, r - 14)
  const L = Math.PI * r // arc length of the semicircle track
  const revColor = rev > 0.82 ? BRAND.red : rev > 0.6 ? BRAND.orange : KIT_BLUE
  const ticks = Array.from({ length: 11 }, (_, i) => i / 10)

  return (
    <div
      style={{
        position: 'absolute',
        left: 96,
        bottom: 132,
        width: W + 36,
        padding: '18px 18px 14px',
        ...elevation(lightTheme, { depth: 'raised', distance: 10, blur: 24, radius: 28 }),
      }}
    >
      <svg width={W} height={H} style={{ display: 'block' }}>
        {/* idle track */}
        <path d={`M ${pt(0)[0]} ${pt(0)[1]} A ${r} ${r} 0 0 1 ${pt(1)[0]} ${pt(1)[1]}`} fill="none" stroke={lightTheme.shadow} strokeWidth={10} opacity={0.55} />
        {/* live fill */}
        <path
          d={`M ${pt(0)[0]} ${pt(0)[1]} A ${r} ${r} 0 0 1 ${pt(1)[0]} ${pt(1)[1]}`}
          fill="none"
          stroke={revColor}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={`${rev * L} ${L}`}
          style={{ filter: `drop-shadow(0 0 ${8 + 20 * rev}px ${revColor})` }}
        />
        {ticks.map((v, i) => {
          const [x1, y1] = pt(v, r + 8)
          const [x2, y2] = pt(v, r - 2)
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i >= 8 ? BRAND.red : lightTheme.textMuted} strokeWidth={i >= 8 ? 3 : 2} opacity={i >= 8 ? 0.8 : 0.45} />
        })}
        {/* needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={revColor} strokeWidth={4} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={9} fill={lightTheme.surface} stroke={revColor} strokeWidth={3} />
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
        <span style={{ fontFamily: TEXT_FONT, fontSize: 16, letterSpacing: 3, color: lightTheme.textMuted }}>TACHO ×1k RPM</span>
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 24, fontWeight: 800, color: revColor }}>{(rev * 9.5).toFixed(1)}</span>
      </div>
    </div>
  )
}

// ── next-hit countdown (uses the typed moment list to look ahead) ────────────────
function NextHit() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const next = useNextMoment()
  const LEAD = 4 // seconds of countdown lead-in
  if (!next) return null
  const framesUntil = Math.max(0, secondsToFrame(next.time, fps) - frame)
  const secs = framesUntil / fps
  const color = MOMENT_COLOR[next.type]
  const fill = clamp01(1 - secs / LEAD)
  return (
    <div
      style={{
        position: 'absolute',
        right: 96,
        bottom: 132,
        width: 300,
        padding: '18px 22px',
        ...elevation(lightTheme, { depth: 'raised', distance: 10, blur: 24, radius: 28 }),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: TEXT_FONT, fontSize: 17, letterSpacing: 3, color: lightTheme.textMuted }}>NEXT HIT</span>
        <span style={{ fontSize: 22, color }}>{MOMENT_GLYPH[next.type]}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
        <span style={{ fontFamily: DISPLAY_FONT, fontSize: 40, fontWeight: 800, color: lightTheme.textStrong }}>{secs.toFixed(1)}s</span>
        <span style={{ fontFamily: TEXT_FONT, fontSize: 22, fontWeight: 700, letterSpacing: 2, color }}>{next.type.toUpperCase()}</span>
      </div>
      <div style={{ marginTop: 12, height: 12, borderRadius: 6, ...elevation(lightTheme, { depth: 'recessed', distance: 3, blur: 6, radius: 6 }), overflow: 'hidden' }}>
        <div style={{ width: `${fill * 100}%`, height: '100%', background: color, borderRadius: 6 }} />
      </div>
    </div>
  )
}

// ── top label: section name + intensity + shape, then the moment callout ─────────
function SectionLabel() {
  const ms = useMusicSection()
  const name = ms?.section.name ?? ''
  const intensity = ms?.section.intensity ?? 0
  const shape = ms?.section.shape ?? 'steady'
  const accent = accentFor(name)
  return (
    <div style={{ position: 'absolute', top: 56, width: '100%', textAlign: 'center' }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 60, fontWeight: 800, color: accent, letterSpacing: -1 }}>{name}</div>
      <div style={{ marginTop: 10, display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center', fontFamily: TEXT_FONT, fontSize: 22, color: lightTheme.textMuted }}>
        <div style={{ width: 160, height: 11, borderRadius: 6, ...elevation(lightTheme, { depth: 'recessed', distance: 3, blur: 6, radius: 6 }), overflow: 'hidden' }}>
          <div style={{ width: `${clamp01(intensity) * 100}%`, height: '100%', background: accent, borderRadius: 6 }} />
        </div>
        <span style={{ color: lightTheme.textStrong, fontWeight: 600 }}>{intensity.toFixed(2)}</span>
        <span>· {shape}</span>
      </div>
    </div>
  )
}

function MomentCallout() {
  const { fps } = useVideoConfig()
  const dropHit = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.6) })
  const breakPull = useMomentPulse({ type: 'break', decay: Math.round(fps * 1.0) })
  const ranged = useRangedMoment()
  const liftRamp = ranged && ranged.moment.type === 'lift' ? easeInExpo(ranged.progress) * ranged.moment.strength : 0

  let label = ''
  let color = lightTheme.textStrong
  let strength = 0
  if (dropHit > 0.25) {
    label = 'DROP'
    color = MOMENT_COLOR.drop
    strength = dropHit
  } else if (liftRamp > 0.18) {
    label = 'BUILD'
    color = MOMENT_COLOR.lift
    strength = liftRamp
  } else if (breakPull > 0.2) {
    label = 'BREAK'
    color = MOMENT_COLOR.break
    strength = breakPull
  }
  if (!label) return null
  return (
    <div
      style={{
        position: 'absolute',
        top: 188,
        width: '100%',
        textAlign: 'center',
        fontFamily: DISPLAY_FONT,
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 8,
        color,
        opacity: 0.35 + 0.65 * clamp01(strength),
      }}
    >
      {label}
    </div>
  )
}

// ── structure ribbon: sections + typed moment markers + a moving playhead ────────
function StructureRibbon() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const map = useBeatMap()
  const ms = useMusicSection()
  const W = 1920 - 220
  const X0 = 110
  const baseY = 1044
  const maxH = 60
  const playX = X0 + clamp01(frame / durationInFrames) * W
  const xAt = (t: number) => X0 + (t / map.duration) * W

  return (
    <AbsoluteFill>
      {map.sections.map((s, i) => {
        const left = xAt(s.start)
        const width = Math.max(2, xAt(s.end) - left)
        const intensity = s.intensity ?? 0.3
        const h = 14 + intensity * maxH
        const accent = accentFor(s.name)
        const current = ms?.index === i
        return (
          <div key={i} style={{ position: 'absolute', left, top: baseY - h, width, height: h }}>
            <div style={{ width: '100%', height: '100%', background: accent, opacity: current ? 0.95 : 0.28, borderRadius: 4, boxShadow: current ? `0 0 18px ${accent}` : 'none' }} />
            {current && (
              <div style={{ position: 'absolute', top: -28, left: 0, fontFamily: TEXT_FONT, fontSize: 17, fontWeight: 600, color: lightTheme.textStrong, whiteSpace: 'nowrap' }}>{s.name}</div>
            )}
          </div>
        )
      })}

      {(map.moments ?? []).map((m, i) => {
        const x = xAt(m.time)
        const color = MOMENT_COLOR[m.type]
        return (
          <div key={`m${i}`} style={{ position: 'absolute', left: x, top: baseY - maxH - 56 }}>
            {m.end != null && <div style={{ position: 'absolute', left: 0, top: 26, width: xAt(m.end) - x, height: 3, background: color, opacity: 0.5, borderRadius: 2 }} />}
            <div style={{ transform: 'translateX(-50%)', fontSize: 12 + m.strength * 20, lineHeight: 1, color, opacity: 0.35 + 0.65 * m.strength }}>{MOMENT_GLYPH[m.type]}</div>
          </div>
        )
      })}

      <div style={{ position: 'absolute', left: playX - 1, top: baseY - maxH - 20, width: 2, height: maxH + 28, background: lightTheme.textStrong }} />
    </AbsoluteFill>
  )
}

// ── reactive heat backdrop + drop flash ─────────────────────────────────────────
function Backdrop() {
  const { fps } = useVideoConfig()
  const overall = useOverallEnergy()
  const dropHit = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.5) })
  const heat = clamp01(overall * 0.8 + dropHit)
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 46%, ${BRAND.red}22, transparent 60%)`, opacity: 0.12 + 0.5 * heat, pointerEvents: 'none' }} />
      <AbsoluteFill style={{ background: '#ffffff', opacity: 0.6 * dropHit, pointerEvents: 'none' }} />
    </>
  )
}

/**
 * The "pull back" on a `break`: a soft surface-colour wash over the whole frame
 * that makes the scene recede and breathe, then releases — the negative-space
 * gesture the spec calls for. Sits above the hero, below the HUD callouts.
 */
function BreakPull() {
  const { fps } = useVideoConfig()
  const breakPull = useMomentPulse({ type: 'break', decay: Math.round(fps * 1.1) })
  if (breakPull < 0.01) return null
  return <AbsoluteFill style={{ background: lightTheme.surface, opacity: 0.3 * breakPull, pointerEvents: 'none' }} />
}

/**
 * Props let you point this scene at ANY analysed song — `<PulseOverdriveVideo
 * map={…} audioSrc={staticFile('audio/other.mp3')} />`. It reads the song's own
 * structure / dynamics / moments and auto-scales to its range. Both default to the
 * committed Pulse Overdrive track.
 */
export type PulseOverdriveProps = {
  map: BeatMap
  audioSrc: string
}

/** Make the composition's length follow the song, so a swapped-in map gets its span. */
export const calculatePulseOverdriveMetadata: CalculateMetadataFunction<Partial<PulseOverdriveProps>> = ({ props }) => ({
  durationInFrames: secondsToFrame((props.map ?? MAP).duration, FPS),
})

export function PulseOverdriveVideo({ map = MAP, audioSrc }: Partial<PulseOverdriveProps> = {}) {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill style={{ backgroundColor: lightTheme.surface, fontFamily: TEXT_FONT }}>
        <Fonts />
        <AudioTrack src={audioSrc ?? staticFile('audio/pulse-overdrive.mp3')} map={map} volume={0.9}>
          <Backdrop />
          <Shockwaves />
          <Corona />
          <Core />
          <BreakPull />
          <SectionLabel />
          <MomentCallout />
          <Tachometer />
          <NextHit />
          <StructureRibbon />
        </AudioTrack>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
