/**
 * StorePitchVideo — "del chat a la tienda, al ritmo de Pulse Overdrive".
 * ──────────────────────────────────────────────────────────────────────────
 * A motion-graphics piece choreographed to `pulse-overdrive.mp3`:
 *
 *   ACT A · CALM (chat)      — a neumorphic conversation: the user asks for an
 *                              online clothing store, the agent answers. Messages
 *                              land on the beat.
 *   ACT B · BUILD (adjunto)  — the agent's reply carries an ATTACHMENT: an
 *                              ArtifactCard (the generated website).
 *   ACT C · HIT (close-up)   — the chat recedes; only the adjunto remains, grown
 *                              to a centred hero. A cursor presses it; bright rings
 *                              IMPLODE into the contact point as the bar resolves…
 *   ACT D · EXPLODE (store)  — …and on the DROP the click detonates (white flash +
 *                              shockwave). The store now assembles itself IN TIME
 *                              with the groove: each bar fires a surge of building
 *                              (window → hero → products → categories), so the page
 *                              snaps into existence on the downbeats.
 *   ACT E · RESOLVE          — the finished store settles and holds.
 *
 * MUSIC SYNC. One continuous track. Pulse Overdrive's headline drop (strength 1.0)
 * is at 49.168s = absolute frame 1475 — the top of the high-energy "groove". We
 * start playback at frame {@link AUDIO_OFFSET} (37.0s) so the chat rides the
 * pre-drop build and the drop lands on our click at composition frame {@link CLICK}.
 * The store build is then *time-remapped* against a bar grid derived from the
 * tempo ({@link BAR} frames/bar), so its reveals fire on the beat rather than at a
 * constant crawl.
 *
 * Determinism: every pixel is a pure function of `useCurrentFrame()`. Reactive
 * pulses reuse the pure helpers in `@/lib/beatmap`. No wall-clock, no randomness.
 */

import { type CSSProperties } from 'react'
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { lightTheme, KIT_BLUE, DISPLAY_FONT, TEXT_FONT } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { NeoCard } from '@/stories/neo/widgets/NeoCard'
import { NeoMessage } from '@/stories/neo/NeoMessage'
import { NeoInput } from '@/stories/neo/NeoInput'
import { ArtifactCard, type ArtifactPalette } from '@/stories/neo/widgets/ArtifactCard'
import { secondsToFrame, downbeatFrames, beatPulseAt, overallEnergyAt, type BeatMap } from '@/lib/beatmap'
import { StoreBuildVideo } from './StoreBuildVideo'
import { Fonts, BODY_FONT } from './fonts'
import beatMapJson from '../../public/audio/pulse-overdrive.beats.json'

// ── timing anchors ──────────────────────────────────────────────────────────
const FPS = 30
const MAP = beatMapJson as BeatMap

/** Where in the track playback starts (frames). 1110 = 37.0s. */
const AUDIO_OFFSET = 1110
/** The song's headline drop (strength 1.0): 49.168s → absolute frame 1475. */
const DROP_ABS = secondsToFrame(49.168, FPS) // 1475
/** The click / detonation, in our composition's frame space. */
const CLICK = DROP_ABS - AUDIO_OFFSET // 365

/** Tempo-derived grid (135.11 BPM): frames per beat / per 4-beat bar. */
const SPB = (60 / MAP.bpm) * FPS // ≈ 13.32
const BAR = SPB * 4 // ≈ 53.29

// ── the store build, re-paced onto the song's real down-beats ─────────────────
const STORE_FROM = CLICK
// The groove's down-beats (bar starts) in composition frames — the surge points.
// Using the *analysed* down-beats (not a synthetic grid) locks every reveal to the
// track: 365(drop) · 420 · 473 · 527 · 581 · 634 · 688 …
const DB = downbeatFrames(MAP, FPS)
  .map((d) => d - AUDIO_OFFSET)
  .filter((d) => d >= CLICK)
const STORE_DOWNBEATS = DB.slice(0, 8)
const L = (k: number) => DB[k] - CLICK // a down-beat as a composition-local frame

// Keyframes remap composition-local frames → StoreBuild's content frame (0…516).
// Reveals snap on the down-beat (easeOutExpo); camera scrolls glide (quint).
const EXPO = Easing.bezier(0.16, 1, 0.3, 1)
const QUINT = Easing.bezier(0.83, 0, 0.17, 1)
// Paced by where the eye should go. The empty page/loader is blown past in ~0.5s
// (and mostly hidden under the drop flash); then the hero photo, the headline and
// the CTA each get their own bar so the build reads, instead of crawling on the
// skeleton and flashing the CTA by.
const STORE_KF: Array<[number, number, (t: number) => number]> = [
  [0, 0, EXPO], //           db0 (the drop) — page frame slams in, under the flash
  [16, 122, EXPO], //        +0.5s — chrome + nav snap in fast (skip the empty loader)
  [L(1), 185, QUINT], //     db1 — hero photo denoises in              (eye → the shot)
  [L(2), 250, QUINT], //     db2 — "TIMELESS / BY DESIGN" types         (eye → headline)
  [L(3), 300, QUINT], //     db3 — paragraph + "SHOP THE COLLECTION" CTA (eye → the CTA)
  [L(4), 430, EXPO], //      db4 — scroll → New Arrivals; product cards (eye → products)
  [L(5), 516, QUINT], //     db5 — category banners + settle; built
]
const STORE_BUILT_AT = DB[5] // built exactly on a down-beat (≈ 634)
export const STORE_PITCH_DURATION = DB[6] + 20 // hold ~2.5s past the build, then end (≈ 708)

/** Map a composition-local frame (0 = the drop) to StoreBuild's content frame. */
function storeFrameAt(local: number): number {
  if (local <= 0) return 0
  for (let i = 0; i < STORE_KF.length - 1; i++) {
    const [a, av, ease] = STORE_KF[i]
    const [b, bv] = STORE_KF[i + 1]
    if (local < b) {
      const p = clamp01((local - a) / (b - a))
      return av + (bv - av) * ease(p)
    }
  }
  return 516
}

const W = 1920
const H = 1080
const CX = W / 2
const CY = H / 2

const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))

// House easings — intentional curves, not stock cubic.
const easeOutExpo = Easing.bezier(0.16, 1, 0.3, 1)
const easeInOutQuint = Easing.bezier(0.83, 0, 0.17, 1)
const easeInExpo = Easing.bezier(0.7, 0, 0.84, 0)
const easeOutQuint = Easing.bezier(0.22, 1, 0.36, 1)

// Spring feels.
const POP = { damping: 13, stiffness: 170, mass: 0.85 } // a touch of overshoot
const SNAP = { damping: 24, stiffness: 220, mass: 0.9 } // snappy, near-critical

/** Committed loudness of the part actually playing at composition `frame`. */
const energyAt = (frame: number) => overallEnergyAt(MAP, frame + AUDIO_OFFSET, FPS)

// ── the adjunto (shared by the in-thread bubble + the close-up hero) ─────────
const ARTIFACT_PALETTE: ArtifactPalette = {
  left: '#d9d3c9',
  right: '#e8e2d8',
  ink: '#a99e8b',
  strong: '#2a2722',
  muted: '#8d8881',
}

function Adjunto({ width }: { width: number }) {
  return (
    <ArtifactCard
      kind="link"
      eyebrow="AURELE"
      date="TIENDA NUEVA"
      title="Tienda de ropa"
      subtitle="SITIO WEB · MODA"
      footer="AURELE.STORE"
      stat="5"
      statWords={['SECCIONES', 'LISTAS']}
      url="https://aurele.store"
      time="ahora"
      palette={ARTIFACT_PALETTE}
      width={width}
      cols={6}
      rows={5}
    />
  )
}

// ── chat script (events land on the beat) ─────────────────────────────────────
type Msg = { id: string; from: 'me' | 'them'; text: string; time: string; showAt: number }
const USER_TEXT = 'Quiero una tienda de ropa online'
const TYPE_START = 24
const SEND_AT = CLICK - Math.round(20 * SPB) // ≈ 99  (a downbeat)
const REPLY_TYPING_FROM = SEND_AT + 14
const REPLY_AT = CLICK - Math.round(14 * SPB) // ≈ 178
const ARTIFACT_AT = CLICK - Math.round(12 * SPB) // ≈ 205

const MSGS: Msg[] = [
  { id: 'a', from: 'them', text: 'Hola 👋 Soy tu agente de AiKit. ¿Qué montamos hoy?', time: '9:41', showAt: 6 },
  { id: 'b', from: 'me', text: USER_TEXT, time: '9:41', showAt: SEND_AT },
  { id: 'c', from: 'them', text: '¡Hecho! Tu tienda de ropa ya está lista 🛍️', time: '9:41', showAt: REPLY_AT },
]

// ── close-up / hit choreography ───────────────────────────────────────────────
const RECEDE_FROM = CLICK - Math.round(6 * SPB) // ≈ 285
const RECEDE_TO = CLICK - Math.round(3 * SPB) // ≈ 325
const HERO_FROM = RECEDE_FROM + 4
const CURSOR_FROM = CLICK - 64
const CURSOR_TRAVEL_A = CLICK - 58
const CURSOR_TRAVEL_B = CLICK - 9
const CHARGE_FROM = CLICK - Math.round(2.4 * SPB) // ≈ 333
const IMPLODE_FROM = CLICK - 16
const PRESS_FROM = CLICK - 11

// ─────────────────────────────────────────────────────────────────────────────
// ACT A·B·C — the chat, the adjunto, the close-up, the cursor + implosion.
// ─────────────────────────────────────────────────────────────────────────────
function ChatStage() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const energy = energyAt(frame)
  const beat = beatPulseAt(
    [3, 4, 5, 6].map((k) => REPLY_AT + Math.round((k - 3) * BAR)).concat([SEND_AT]),
    frame,
    { decay: 9 },
  )

  // The whole chat card recedes (fades + blurs + shrinks) into the close-up.
  const recede = interpolate(frame, [RECEDE_FROM, RECEDE_TO], [0, 1], { ...clampE, easing: easeInOutQuint })
  const chatOpacity = 1 - recede
  const chatScale = 1 - 0.12 * recede
  const chatBlur = 14 * recede

  // Card intro: lifts + overshoots gently into place.
  const intro = spring({ frame, fps, config: SNAP })

  const enterStyle = (since: number, from: 'me' | 'them'): CSSProperties => {
    const s = spring({ frame: frame - since, fps, config: SNAP })
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: from === 'me' ? 'flex-end' : 'flex-start',
      opacity: clamp01(s * 1.4),
      transform: `translateY(${(1 - s) * 20}px) scale(${0.96 + 0.04 * s})`,
    }
  }

  // The user's line types into the input, then commits.
  const inputValue =
    frame < SEND_AT
      ? USER_TEXT.slice(
          0,
          Math.max(0, Math.round(interpolate(frame, [TYPE_START, SEND_AT - 8], [0, USER_TEXT.length], clampE))),
        )
      : ''

  const shown = MSGS.filter((m) => frame >= m.showAt)
  const replyTyping = frame >= REPLY_TYPING_FROM && frame < REPLY_AT

  // Artifact entrance: a confident pop with overshoot.
  const artifactPop = spring({ frame: frame - ARTIFACT_AT, fps, config: POP })

  // Hero adjunto (close-up): blooms to centre, then a pre-drop charge tightens it,
  // then a tactile press dip right before the hit.
  const heroBloom = spring({ frame: frame - HERO_FROM, fps, config: POP })
  const charge = interpolate(frame, [CHARGE_FROM, CLICK], [0, 1], { ...clampE, easing: easeInExpo })
  const press = interpolate(frame, [PRESS_FROM, CLICK - 2], [0, 1], { ...clampE, easing: easeOutExpo })
  const heroBase = interpolate(heroBloom, [0, 1], [0.8, 1]) + 0.05 * charge + 0.012 * beat
  const heroScale = heroBase * (1 - 0.03 * press)

  return (
    <AbsoluteFill>
      {/* Energy-reactive heat that warms the room as the drop approaches. */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 46%, rgba(177,67,42,${0.05 + 0.26 * energy}), transparent 60%)`,
          opacity: 0.6 + 0.4 * (1 - recede),
        }}
      />

      {/* ── the conversation card ── */}
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          opacity: chatOpacity,
          transform: `scale(${chatScale})`,
          filter: chatBlur > 0.1 ? `blur(${chatBlur}px)` : undefined,
        }}
      >
        <div style={{ opacity: intro, transform: `translateY(${(1 - intro) * 30}px)` }}>
          <NeoCard width={640} padding={30} radius={42} center={false} style={{ height: 860, gap: 0 }}>
            {/* brand header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 14 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: KIT_BLUE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontFamily: DISPLAY_FONT,
                  fontWeight: 800,
                  fontSize: 20,
                  transform: `scale(${1 + 0.08 * beat})`,
                  boxShadow: `0 0 ${10 + 18 * beat}px rgba(0,112,249,${0.25 + 0.4 * beat})`,
                }}
              >
                ✦
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 19, color: lightTheme.textStrong }}>
                  AiKit
                </span>
                <span style={{ fontFamily: TEXT_FONT, fontSize: 12.5, color: lightTheme.textMuted, letterSpacing: 0.2 }}>
                  Agente · en línea
                </span>
              </div>
            </div>

            {/* thread */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                justifyContent: 'flex-end',
                flex: 1,
                minHeight: 0,
                paddingBottom: 20,
              }}
            >
              {shown.map((m) => (
                <div key={m.id} style={enterStyle(m.showAt, m.from)}>
                  <NeoMessage from={m.from} time={m.time}>
                    {m.text}
                  </NeoMessage>
                </div>
              ))}

              {replyTyping && (
                <div style={enterStyle(REPLY_TYPING_FROM, 'them')}>
                  <NeoMessage from="them" typing />
                </div>
              )}

              {/* the ADJUNTO, attached under the agent's reply */}
              {frame >= ARTIFACT_AT && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    opacity: clamp01(artifactPop * 1.3),
                    transform: `translateY(${(1 - artifactPop) * 26}px) scale(${0.9 + 0.1 * artifactPop})`,
                  }}
                >
                  <AttachmentChip pulse={beat} />
                  <Adjunto width={480} />
                </div>
              )}
            </div>

            <NeoInput value={inputValue} placeholder="Escribe un mensaje…" icon="plus" style={{ width: '100%' }} />
          </NeoCard>
        </div>
      </AbsoluteFill>

      {/* ── close-up: ONLY the adjunto, grown to a hero, spotlit ── */}
      {frame >= HERO_FROM && (
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          {/* spotlight that isolates the card */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0), rgba(20,17,15,${0.2 * heroBloom + 0.22 * charge}) 70%)`,
              opacity: heroBloom,
            }}
          />
          {/* charge ring tightening before the hit */}
          {charge > 0 && (
            <div
              style={{
                position: 'absolute',
                width: 780 - 380 * charge,
                height: 780 - 380 * charge,
                borderRadius: 36,
                border: `2px solid rgba(177,67,42,${0.12 + 0.5 * charge})`,
                opacity: 0.65 * charge,
                boxShadow: `0 0 ${26 * charge}px rgba(177,67,42,${0.45 * charge})`,
              }}
            />
          )}
          <div
            style={{
              opacity: heroBloom,
              transform: `scale(${heroScale})`,
              filter: `drop-shadow(0 30px 60px rgba(40,36,30,${0.26 - 0.1 * press}))`,
            }}
          >
            <Adjunto width={600} />
          </div>
        </AbsoluteFill>
      )}

      {/* bright rings that IMPLODE into the contact point as the bar resolves */}
      <ClickImplosion />

      {/* ── the cursor ── */}
      <PointerCursor />
    </AbsoluteFill>
  )
}

/** A small "📎 adjunto" tag above the in-thread artifact. */
function AttachmentChip({ pulse }: { pulse: number }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        marginBottom: 10,
        borderRadius: 999,
        background: '#fff',
        boxShadow: `0 2px 8px rgba(40,36,30,${0.12 + 0.06 * pulse})`,
        fontFamily: TEXT_FONT,
        fontSize: 13,
        color: lightTheme.textMuted,
      }}
    >
      <span style={{ fontSize: 14 }}>📎</span>
      <span style={{ letterSpacing: 0.2 }}>adjunto · tienda-de-ropa</span>
    </div>
  )
}

/** Two thin glowing rings that rush inward and collapse onto the click point. */
function ClickImplosion() {
  const frame = useCurrentFrame()
  if (frame < IMPLODE_FROM || frame >= CLICK) return null
  const rings = [0, 5].map((delay) => {
    const p = interpolate(frame, [IMPLODE_FROM + delay, CLICK], [0, 1], { ...clampE, easing: easeInExpo })
    const r = interpolate(p, [0, 1], [180, 6])
    const op = interpolate(p, [0, 0.6, 1], [0, 0.7, 0.95], clampE)
    return (
      <div
        key={delay}
        style={{
          position: 'absolute',
          left: CX - r,
          top: CY - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `2px solid rgba(0,112,249,${op})`,
          boxShadow: `0 0 16px rgba(0,112,249,${op * 0.7})`,
        }}
      />
    )
  })
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>{rings}</AbsoluteFill>
}

/** A frame-driven OS pointer that glides in and presses on the drop. */
function PointerCursor() {
  const frame = useCurrentFrame()
  if (frame < CURSOR_FROM || frame > CLICK + 2) return null

  const appear = interpolate(frame, [CURSOR_FROM, CURSOR_FROM + 7], [0, 1], clampE)
  const x = interpolate(frame, [CURSOR_TRAVEL_A, CURSOR_TRAVEL_B], [1500, CX], { ...clampE, easing: easeOutQuint })
  const y = interpolate(frame, [CURSOR_TRAVEL_A, CURSOR_TRAVEL_B], [1000, CY + 8], { ...clampE, easing: easeOutQuint })
  // Press dip into the drop (released by the flash that follows).
  const press = interpolate(frame, [PRESS_FROM, CLICK - 1], [1, 0.8], clampE)
  const size = 46

  return (
    <div style={{ position: 'absolute', left: 0, top: 0, opacity: appear }}>
      <div style={{ position: 'absolute', left: x, top: y, transform: `scale(${press})`, transformOrigin: 'top left' }}>
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: 'translate(-12.5%, -8.3%)' }}>
          <path
            d="M3 2 L3 18.2 L7.2 14.2 L10 20.4 L12.7 19.2 L9.9 13.1 L15.4 13.1 Z"
            fill="#fff"
            stroke="#1e1e20"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// THE DROP — white flash + shockwave that detonate the click into the build.
// ─────────────────────────────────────────────────────────────────────────────
function DropFx() {
  const frame = useCurrentFrame()
  if (frame < CLICK - 4 || frame > CLICK + 40) return null

  const flash = interpolate(frame, [CLICK - 3, CLICK, CLICK + 8, CLICK + 22], [0, 0.98, 0.42, 0], clampE)
  // a warm core bloom that lingers a touch longer than the white blowout
  const bloom = interpolate(frame, [CLICK, CLICK + 6, CLICK + 26], [0.9, 0.5, 0], clampE)

  const rings: React.ReactNode[] = []
  const waves: Array<[number, string, number]> = [
    [0, 'rgba(255,255,255,', 9],
    [4, 'rgba(255,255,255,', 6],
    [10, 'rgba(0,112,249,', 5],
  ]
  for (const [delay, rgba, w] of waves) {
    const age = frame - (CLICK + delay)
    const life = 30
    if (age < 0 || age >= life) continue
    const p = easeOutExpo(age / life)
    const r = 70 + p * 820
    rings.push(
      <div
        key={delay}
        style={{
          position: 'absolute',
          left: CX - r,
          top: CY - r,
          width: r * 2,
          height: r * 2,
          borderRadius: '50%',
          border: `${Math.max(1, (1 - p) * w)}px solid ${rgba}${(1 - p) * 0.85})`,
          boxShadow: `0 0 ${30 * (1 - p)}px ${rgba}${(1 - p) * 0.4})`,
        }}
      />,
    )
  }

  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill
        style={{ background: `radial-gradient(circle at 50% 50%, rgba(255,237,213,${bloom}), transparent 55%)` }}
      />
      {rings}
      <AbsoluteFill style={{ background: '#ffffff', opacity: flash }} />
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACT D·E — the store assembles itself on the beat, then holds.
// ─────────────────────────────────────────────────────────────────────────────
function StoreStage() {
  const frame = useCurrentFrame()
  if (frame < STORE_FROM) return null

  const local = frame - STORE_FROM
  const storeFrame = storeFrameAt(local)

  // A subtle whole-frame punch on each surge downbeat — the page "moves with it".
  const surge = beatPulseAt(STORE_DOWNBEATS, frame, { decay: 9 })
  const scale = 1 + 0.012 * surge
  // a faint exposure lift on the beat (camera flash), strongest while still building
  const buildLeft = clamp01((STORE_BUILT_AT - frame) / (STORE_BUILT_AT - STORE_FROM))
  const expose = 0.05 * surge * buildLeft

  return (
    <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>
      <StoreBuildVideo frameOverride={storeFrame} />
      {expose > 0.001 && <AbsoluteFill style={{ background: '#ffffff', opacity: expose, pointerEvents: 'none' }} />}
    </AbsoluteFill>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export const StorePitchVideo: React.FC = () => {
  const frame = useCurrentFrame()
  const fadeIn = interpolate(frame, [0, 16], [0, 0.95], clampE)
  const fadeOut = interpolate(frame, [STORE_PITCH_DURATION - 16, STORE_PITCH_DURATION], [0.95, 0.62], clampE)
  const volume = Math.min(fadeIn, fadeOut)

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill style={{ backgroundColor: lightTheme.surface, fontFamily: BODY_FONT }}>
        <Fonts />
        <Audio src={staticFile('audio/pulse-overdrive.mp3')} startFrom={AUDIO_OFFSET} volume={volume} />

        {/* ACT A·B·C — chat → adjunto → close-up → cursor (unmounts after the flash) */}
        {frame < STORE_FROM + 4 && <ChatStage />}

        {/* ACT D·E — the store builds itself on the beat, then holds */}
        <StoreStage />

        {/* the golpe de efecto, above everything, bridging the worlds */}
        <DropFx />
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
