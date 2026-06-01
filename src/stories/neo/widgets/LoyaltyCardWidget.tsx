import { elevation, KIT_BLUE, BRAND, TEXT_FONT, DISPLAY_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'
import { NeoCard } from './NeoCard'

export type LoyaltyCardWidgetProps = {
  /** Member name printed on the card. */
  name?: string
  /** Tier label (e.g. "Socio Gold"). */
  tier?: string
  /** Big points balance, pre-formatted (e.g. "1.240 pts"). */
  points?: string
  /** Points still needed for the next reward. */
  nextRewardPts?: number
  /** Progress toward the next reward, 0–1. */
  progress?: number
  /** Wallet balance shown in the quiet row below (e.g. "€24,50"). */
  walletBalance?: string
  /** Gradient palette of the hero card. */
  scheme?: 'gold' | 'blue'
}

/**
 * Each scheme is *anchored* on a single brand accent (KIT_BLUE for 'blue',
 * BRAND.orange for 'gold') — no opaque hand-picked hexes. Lighter / darker
 * gradient stops are derived by laying a translucent neutral white (to lift) or
 * black (to deepen) over the solid accent, so the whole card re-tints to its
 * accent. `lighten` / `darken` give us those stops; the chip fill + chip stroke
 * are likewise derived from the same anchor.
 */
function lighten(color: string, amount: number) {
  return `color-mix(in srgb, ${color}, white ${Math.round(amount * 100)}%)`
}
function darken(color: string, amount: number) {
  return `color-mix(in srgb, ${color}, black ${Math.round(amount * 100)}%)`
}

/** Rich gradient + sheen + glow for each scheme. White text reads on both. */
const SCHEMES = {
  gold: {
    anchor: BRAND.orange,
    // Top → bottom: lifted toward BRAND.yellow, the orange anchor, then deepened.
    gradient: `linear-gradient(135deg, ${BRAND.yellow} 0%, ${BRAND.orange} 40%, ${darken(BRAND.orange, 0.18)} 72%, ${darken(BRAND.orange, 0.34)} 100%)`,
    sheen: 'linear-gradient(120deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 42%)',
    glow: `${BRAND.orange}59`,
    chip: lighten(BRAND.orange, 0.74),
  },
  blue: {
    anchor: KIT_BLUE,
    gradient: `linear-gradient(135deg, ${lighten(KIT_BLUE, 0.32)} 0%, ${KIT_BLUE} 42%, ${darken(KIT_BLUE, 0.18)} 74%, ${darken(KIT_BLUE, 0.36)} 100%)`,
    sheen: 'linear-gradient(120deg, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 42%)',
    glow: `${KIT_BLUE}59`,
    chip: lighten(KIT_BLUE, 0.78),
  },
} as const

/**
 * LoyaltyCardWidget — a wallet / points card.
 * ──────────────────────────────────────────────
 * A raised hero card with a rich gradient (gold or blue) carrying the member's
 * name, tier, a big points balance, a little contactless + chip mark and a thin
 * progress bar toward the next reward. Below it, a quiet line with the e-wallet
 * balance — the kind of housekeeping you'd rather not look at, so we keep it.
 */
export function LoyaltyCardWidget({
  name = 'Pablo Peralta',
  tier = 'Socio Gold',
  points = '1.240 pts',
  nextRewardPts = 60,
  progress = 0.78,
  walletBalance = '€24,50',
  scheme = 'gold',
}: LoyaltyCardWidgetProps) {
  const theme = useNeoTheme()
  const s = SCHEMES[scheme]
  const pct = Math.max(0, Math.min(1, progress)) * 100

  const wallet = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })

  return (
    <NeoCard width={360} center={false} padding={26} radius={30} style={{ gap: 18 }}>
      <style>{`@keyframes neo-loyalty-shine{0%{transform:translateX(-120%)}100%{transform:translateX(120%)}}`}</style>

      {/* Tiny header above the card. */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: 0.6,
            color: theme.textMuted,
            fontFamily: TEXT_FONT,
          }}
        >
          TU TARJETA
        </span>
        <span style={{ fontSize: 12, color: theme.textMuted }}>AiKit Rewards</span>
      </div>

      {/* HERO gradient card. */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 22,
          borderRadius: 22,
          color: '#fff',
          background: s.gradient,
          boxShadow: `0 14px 30px -12px ${s.glow}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          fontFamily: TEXT_FONT,
        }}
      >
        {/* Moving sheen sweep. */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '60%',
            height: '100%',
            background: s.sheen,
            animation: 'neo-loyalty-shine 4.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        {/* Static corner highlight for depth. */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(120% 90% at 100% 0%, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 55%)',
            pointerEvents: 'none',
          }}
        />

        {/* Row: chip + contactless · tier badge. */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ChipMark fill={s.chip} anchor={s.anchor} />
            <ContactlessMark />
          </div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.7,
              padding: '5px 11px',
              borderRadius: 999,
              color: '#fff',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(2px)',
            }}
          >
            {tier.toUpperCase()}
          </span>
        </div>

        {/* Points balance — the hero figure. */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 11.5, letterSpacing: 0.5, opacity: 0.82 }}>SALDO DE PUNTOS</span>
          <span
            style={{
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1,
              fontFamily: DISPLAY_FONT,
            }}
          >
            {points}
          </span>
        </div>

        {/* Progress toward next reward. */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.28)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: 999,
                background: '#fff',
                boxShadow: '0 0 8px rgba(255,255,255,0.5)',
              }}
            />
          </div>
          <span style={{ fontSize: 11.5, opacity: 0.9 }}>
            {nextRewardPts} pts para tu próxima recompensa
          </span>
        </div>

        {/* Member name — printed bottom. */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: 0.4 }}>{name}</span>
          <span style={{ fontSize: 11, opacity: 0.8, letterSpacing: 1 }}>•••• 2480</span>
        </div>
      </div>

      {/* Quiet wallet row below the card. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 16px',
          ...wallet,
        }}
      >
        <WalletMark color={theme.textMuted} />
        <span style={{ fontSize: 13, color: theme.textMuted, fontFamily: TEXT_FONT }}>
          Monedero electrónico
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: -0.3,
            color: theme.textStrong,
            fontFamily: TEXT_FONT,
          }}
        >
          {walletBalance}
        </span>
      </div>
    </NeoCard>
  )
}

/**
 * A little EMV-style contact chip. The plate fill is the scheme-derived gradient
 * (a lightened wash of the anchor) and the contact lines are a translucent
 * *darkening* of that same anchor — so the chip stays tied to the scheme colour,
 * never a fixed brown.
 */
function ChipMark({ fill, anchor }: { fill: string; anchor: string }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 30,
        height: 23,
        borderRadius: 5,
        background: fill,
        opacity: 0.95,
        overflow: 'hidden',
      }}
      aria-hidden
    >
      <svg
        width={30}
        height={23}
        viewBox="0 0 30 23"
        fill="none"
        style={{ position: 'absolute', inset: 0, color: `${anchor}66` }}
      >
        <g stroke="currentColor" strokeWidth={1.2}>
          <path d="M10 0.6 V22.4 M20 0.6 V22.4" />
          <path d="M0.6 8 H10 M20 8 H29.4 M0.6 15 H10 M20 15 H29.4" />
          <rect x={10} y={6} width={10} height={11} rx={2} fill="none" />
        </g>
      </svg>
    </div>
  )
}

/** The four-arc contactless / NFC mark. */
function ContactlessMark() {
  return (
    <svg
      width={20}
      height={22}
      viewBox="0 0 20 22"
      fill="none"
      stroke="#fff"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M5 5 a8 8 0 0 1 0 12" opacity={0.95} />
      <path d="M9 3 a12 12 0 0 1 0 16" opacity={0.7} />
      <path d="M13 1.5 a16 16 0 0 1 0 19" opacity={0.45} />
    </svg>
  )
}

/** A tiny wallet glyph for the quiet row. */
function WalletMark({ color }: { color: string }) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 8 a2 2 0 0 1 2 -2 h12 a2 2 0 0 1 2 2 v9 a2 2 0 0 1 -2 2 H5 a2 2 0 0 1 -2 -2 Z" />
      <path d="M3 9 h13 a2 2 0 0 1 2 2 v2 a2 2 0 0 1 -2 2 H3" />
      <circle cx={16.5} cy={13} r={0.9} fill={color} stroke="none" />
    </svg>
  )
}
