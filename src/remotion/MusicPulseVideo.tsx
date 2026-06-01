/**
 * MusicPulse — a from-scratch test of the music-sync system, now reacting to the
 * song's STRUCTURE like a motion designer, not a metronome.
 * ────────────────────────────────────────────────────────────────────────────
 * Every motion is read from the committed beat map of `black-paper.mp3` (analysed
 * by `npm run beats`, which hears rhythm, dynamics AND typed structural moments),
 * so the same frame always renders the same pixels:
 *
 *   • the circle PUNCHES on every bar and micro-pulses on each beat, BREATHES
 *     with the low band, and follows the SECTION's intensity / colour;
 *   • the square ticks a kick per bar and shimmers with the highs;
 *   • and — the point of this pass — the scene treats each typed MOMENT the way a
 *     pro would (grounded in the research in specs/music-sync.md):
 *       – lift (build)  → a CONTINUOUS anticipatory ramp: tighten, charge, vibrate,
 *                         easing harder as it nears the resolve (useRangedMoment);
 *       – drop          → an instant slam + white impact flash (useMomentPulse);
 *       – dropout       → the silence: a hard flash/freeze on the gap, scaled by
 *                         strength (the headline gap hits hardest);
 *       – break         → pull back — dim and contract, banking contrast.
 *     Every gesture is scaled by the moment's 0..1 strength, so the biggest hit in
 *     the track gets the biggest pop. A ribbon marks where each moment lands.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)).
 */
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, type CalculateMetadataFunction } from 'remotion'
import { lightTheme, elevation, KIT_BLUE, BRAND, TEXT_FONT, DISPLAY_FONT } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { secondsToFrame, type BeatMap, type MomentType } from '@/lib/beatmap'
import {
  AudioTrack,
  useBeatPulse,
  useEnergy,
  useOverallEnergy,
  useMusicSection,
  useMomentPulse,
  useRangedMoment,
  useBeatMap,
} from './AudioTrack'
import { Fonts } from './fonts'
import beatMapJson from '../../public/audio/black-paper.beats.json'

const MAP = beatMapJson as BeatMap
const FPS = 30
/** The composition spans the whole song — its length, not a magic constant. */
export const MUSIC_PULSE_DURATION = secondsToFrame(MAP.duration, FPS)

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

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
/** Tension easing — flat then explosive, so a build leans hardest right at the resolve. */
const easeInExpo = (p: number) => (p <= 0 ? 0 : p >= 1 ? 1 : Math.pow(2, 10 * (p - 1)))

/** [min, max] section intensity — lets the macro size arc auto-scale to ANY song. */
function sectionIntensityRange(map: BeatMap): [number, number] {
  const xs = map.sections.map((s) => s.intensity).filter((x): x is number => x != null)
  return xs.length ? [Math.min(...xs), Math.max(...xs)] : [0, 1]
}

// ── the moving shapes + their moment treatments ────────────────────────────────
function Stage() {
  const { fps } = useVideoConfig()
  const frame = useCurrentFrame()
  const ms = useMusicSection()
  const map = useBeatMap()
  const section = ms?.section
  const name = section?.name ?? ''
  const intensity = section?.intensity ?? 0.2
  const shape = section?.shape ?? 'steady'
  const accent = accentFor(name)

  // Pulses (rhythm + dynamics).
  const bar = useBeatPulse({ on: 'downbeat', decay: Math.round(fps * 0.55) })
  const beat = useBeatPulse({ on: 'beat', decay: Math.round(fps * 0.16) })
  const low = useEnergy('low')
  const high = useEnergy('high')
  const overall = useOverallEnergy()

  // Moments (structure) — each its own designed treatment.
  const dropHit = useMomentPulse({ type: 'drop', decay: Math.round(fps * 0.6) })
  const dropoutHit = useMomentPulse({ type: 'dropout', decay: Math.round(fps * 0.5) })
  const breakPull = useMomentPulse({ type: 'break', decay: Math.round(fps * 1.1) })
  const ranged = useRangedMoment()
  const liftRamp = ranged && ranged.moment.type === 'lift' ? easeInExpo(ranged.progress) * ranged.moment.strength : 0
  const impact = Math.max(dropHit, dropoutHit) // instant hits → slam + flash
  const vib = liftRamp * Math.sin(frame * 1.4) * 7 // build vibration

  // Macro arc auto-scaled to THIS song's dynamic range (its quietest section → 0,
  // loudest → 1), so the demo reads any analysed track, not just this one.
  const [minI, maxI] = sectionIntensityRange(map)
  const tInt = maxI > minI ? clamp01((intensity - minI) / (maxI - minI)) : 0.5
  const macro = 0.8 + 0.5 * tInt

  const circleScale = macro * (1 + 0.18 * bar + 0.05 * beat + 0.1 * low + 0.12 * liftRamp + 0.35 * impact - 0.12 * breakPull)
  const squareScale = macro * (1 + 0.12 * bar + 0.13 * high + 0.22 * impact)
  const squareRot = frame * 0.06 + 22 * bar + 60 * impact
  const ringGlow = clamp01(0.28 + 0.95 * overall + 0.6 * impact + 0.45 * liftRamp)
  const stageDim = 1 - 0.28 * breakPull // pull back on a break

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          opacity: stageDim,
          transform: `translateX(${vib}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
        }}
      >
        {/* Square — behind, ticks a kick per bar, shimmers with treble. */}
        <div
          style={{
            position: 'absolute',
            width: 300,
            height: 300,
            ...elevation(lightTheme, { depth: 'recessed', distance: 10, blur: 22, radius: 36 }),
            border: `2px solid ${accent}`,
            opacity: 0.5 + 0.3 * tInt,
            transform: `rotate(${squareRot}deg) scale(${squareScale})`,
          }}
        />
        {/* Charge ring — only during a build, expanding as tension rises. */}
        {liftRamp > 0.01 && (
          <div
            style={{
              position: 'absolute',
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: `3px dashed ${BRAND.orange}`,
              opacity: 0.7 * liftRamp,
              transform: `scale(${circleScale * (1.12 + 0.5 * liftRamp)})`,
            }}
          />
        )}
        {/* Circle — the pulse core. */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            ...elevation(lightTheme, { depth: 'raised', distance: 16, blur: 34, radius: 360 }),
            transform: `scale(${circleScale})`,
          }}
        />
        {/* Accent ring — brightness tracks energy + moments; colour tracks section. */}
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            border: `6px solid ${accent}`,
            opacity: ringGlow,
            boxShadow: `0 0 ${20 + 60 * overall + 90 * impact}px ${accent}`,
            transform: `scale(${circleScale * 1.04})`,
          }}
        />
      </div>

      <SectionLabel name={name} intensity={intensity} shape={shape} accent={accent} />
      <BandMeters low={low} high={high} />
      <MomentCallout liftRamp={liftRamp} dropHit={dropHit} dropoutHit={dropoutHit} breakPull={breakPull} />
      {/* Impact flash — the white hit on a drop / the silence release on a dropout. */}
      <AbsoluteFill style={{ background: '#ffffff', opacity: 0.7 * impact, pointerEvents: 'none' }} />
    </AbsoluteFill>
  )
}

/** A big corner label naming the active structural moment (the designer's cue). */
function MomentCallout({
  liftRamp,
  dropHit,
  dropoutHit,
  breakPull,
}: {
  liftRamp: number
  dropHit: number
  dropoutHit: number
  breakPull: number
}) {
  let label = ''
  let color = lightTheme.textStrong
  let strength = 0
  if (Math.max(dropHit, dropoutHit) > 0.25) {
    const isDropout = dropoutHit >= dropHit
    label = isDropout ? 'DROPOUT' : 'DROP'
    color = isDropout ? MOMENT_COLOR.dropout : MOMENT_COLOR.drop
    strength = Math.max(dropHit, dropoutHit)
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
        top: 250,
        fontFamily: DISPLAY_FONT,
        fontSize: 34,
        fontWeight: 800,
        letterSpacing: 6,
        color,
        opacity: 0.35 + 0.65 * clamp01(strength),
      }}
    >
      {label}
    </div>
  )
}

// ── legend ─────────────────────────────────────────────────────────────────────
function SectionLabel({ name, intensity, shape, accent }: { name: string; intensity: number; shape: string; accent: string }) {
  return (
    <div style={{ position: 'absolute', top: 96, textAlign: 'center' }}>
      <div style={{ fontFamily: DISPLAY_FONT, fontSize: 64, fontWeight: 800, color: accent, letterSpacing: -1 }}>{name}</div>
      <div
        style={{
          marginTop: 14,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TEXT_FONT,
          fontSize: 24,
          color: lightTheme.textMuted,
        }}
      >
        <Meter value={intensity} accent={accent} />
        <span style={{ color: lightTheme.textStrong, fontWeight: 600 }}>{intensity.toFixed(2)}</span>
        <span>· {shape}</span>
      </div>
    </div>
  )
}

function Meter({ value, accent, width = 180 }: { value: number; accent: string; width?: number }) {
  return (
    <div
      style={{
        width,
        height: 12,
        borderRadius: 6,
        ...elevation(lightTheme, { depth: 'recessed', distance: 3, blur: 6, radius: 6 }),
        overflow: 'hidden',
      }}
    >
      <div style={{ width: `${clamp01(value) * 100}%`, height: '100%', background: accent, borderRadius: 6 }} />
    </div>
  )
}

function BandMeters({ low, high }: { low: number; high: number }) {
  const mid = useEnergy('mid')
  const bands: Array<[string, number, string]> = [
    ['low', low, BRAND.teal],
    ['mid', mid, BRAND.blue],
    ['high', high, BRAND.orange],
  ]
  return (
    <div style={{ position: 'absolute', left: 110, bottom: 200, display: 'flex', gap: 22, alignItems: 'flex-end' }}>
      {bands.map(([label, v, color]) => (
        <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 160,
              borderRadius: 18,
              ...elevation(lightTheme, { depth: 'recessed', distance: 4, blur: 8, radius: 18 }),
              display: 'flex',
              alignItems: 'flex-end',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', height: `${clamp01(v) * 100}%`, background: color, borderRadius: 18 }} />
          </div>
          <span style={{ fontFamily: TEXT_FONT, fontSize: 18, color: lightTheme.textMuted }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

// ── structure ribbon: sections + a moving playhead + the typed moment markers ──
function StructureRibbon() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const map = useBeatMap()
  const ms = useMusicSection()
  const W = 1920 - 220
  const X0 = 110
  const baseY = 1000
  const maxH = 86
  const playX = X0 + clamp01(frame / durationInFrames) * W
  const xAt = (t: number) => X0 + (t / map.duration) * W

  return (
    <AbsoluteFill>
      {map.sections.map((s, i) => {
        const left = xAt(s.start)
        const width = Math.max(2, (xAt(s.end) - left))
        const intensity = s.intensity ?? 0.3
        const h = 18 + intensity * maxH
        const accent = accentFor(s.name)
        const current = ms?.index === i
        return (
          <div key={i} style={{ position: 'absolute', left, top: baseY - h, width, height: h }}>
            <div
              style={{
                width: '100%',
                height: '100%',
                background: accent,
                opacity: current ? 0.95 : 0.3,
                borderRadius: 4,
                boxShadow: current ? `0 0 18px ${accent}` : 'none',
              }}
            />
            {current && (
              <div style={{ position: 'absolute', top: -30, left: 0, fontFamily: TEXT_FONT, fontSize: 18, fontWeight: 600, color: lightTheme.textStrong, whiteSpace: 'nowrap' }}>
                {s.name}
              </div>
            )}
          </div>
        )
      })}

      {/* moment markers — glyph at the hit; a bracket spans a ranged build */}
      {(map.moments ?? []).map((m, i) => {
        const x = xAt(m.time)
        const color = MOMENT_COLOR[m.type]
        return (
          <div key={`m${i}`} style={{ position: 'absolute', left: x, top: baseY - maxH - 64 }}>
            {m.end != null && (
              <div style={{ position: 'absolute', left: 0, top: 30, width: xAt(m.end) - x, height: 3, background: color, opacity: 0.5, borderRadius: 2 }} />
            )}
            <div style={{ transform: 'translateX(-50%)', fontSize: 12 + m.strength * 20, lineHeight: 1, color, opacity: 0.35 + 0.65 * m.strength }}>
              {MOMENT_GLYPH[m.type]}
            </div>
          </div>
        )
      })}

      <div style={{ position: 'absolute', left: playX - 1, top: baseY - maxH - 26, width: 2, height: maxH + 34, background: lightTheme.textStrong }} />
    </AbsoluteFill>
  )
}

/**
 * Props let you point the demo at ANY analysed song — `<MusicPulseVideo map={…}
 * audioSrc={staticFile('audio/other.mp3')} />`. The scene reads the song's own
 * structure/dynamics/moments from the map and auto-scales to its range, so a
 * different track Just Works. Both default to the committed black-paper song.
 */
export type MusicPulseProps = {
  /** The committed beat map of the song (with bands + moments). */
  map: BeatMap
  /** The audio source — typically `staticFile('audio/<song>.mp3')`. */
  audioSrc: string
}

/** Make the composition's length follow the song, so a swapped-in map gets its span. */
export const calculateMusicPulseMetadata: CalculateMetadataFunction<Partial<MusicPulseProps>> = ({ props }) => ({
  durationInFrames: secondsToFrame((props.map ?? MAP).duration, FPS),
})

export function MusicPulseVideo({ map = MAP, audioSrc }: Partial<MusicPulseProps> = {}) {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill style={{ backgroundColor: lightTheme.surface, fontFamily: TEXT_FONT }}>
        <Fonts />
        <AudioTrack src={audioSrc ?? staticFile('audio/black-paper.mp3')} map={map} volume={0.9}>
          <Stage />
          <StructureRibbon />
        </AudioTrack>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
