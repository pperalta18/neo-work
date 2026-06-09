/**
 * StoreBuildVideo — an online store that builds *itself*.
 * ──────────────────────────────────────────────────────────────────────────
 * A luxury‑fashion storefront ("AURELE") assembles from nothing inside a clean
 * browser window, as if an unseen intelligence were generating it live: the
 * address bar types the domain, skeleton placeholders shimmer and resolve, hero
 * and product photos **denoise** from blur into sharp focus (a diffusion‑style
 * reveal), headings type themselves, prices tick up, and the page scrolls down
 * to lay out section after section. There is **no caption, no UI chrome that
 * names what's happening** — only the building behaviour itself tells the story.
 *
 * Visual language is borrowed from editorial e‑commerce (à la stynra.webflow.io):
 * a thin black announcement bar, a centred letter‑spaced wordmark, full‑bleed
 * earthy hero, a three‑up product grid with rust‑red prices, and two big
 * category banners. Deliberately *not* neumorphic.
 *
 * Determinism (the house rule): every frame is a pure function of
 * `useCurrentFrame()`. No `Math.random`, no `Date.now`, no CSS transitions
 * (which run on wall‑clock) — caret blink, shimmer sweep, scroll position and
 * every denoise are derived from the frame number, so frame N is byte‑identical
 * on every render. Generated photos are committed static files under
 * `public/store/` and loaded through `staticFile`.
 */

import { type CSSProperties } from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion'
import { DISPLAY_FONT, TEXT_FONT } from '@/lib/neumorphism'
import { Fonts } from './fonts'

export const STORE_BUILD_DURATION = 516 // 17.2s @ 30fps

// ── palette ───────────────────────────────────────────────────────────────────
const INK = '#13110f' // near‑black for bars + headings
const PAPER = '#ffffff' // page background
const DESK = '#cbc7c0' // neutral workspace behind the browser
const CARD_BG = '#edebe6' // light grey product‑card field
const SKELETON = '#e3e0da'
const SKELETON_HI = '#f2f0ec'
const MUTED = '#8d8881'
const ACCENT = '#b1432a' // rust‑red (prices / caret)

// ── frame geometry (1920×1080) ─────────────────────────────────────────────────
const W = 1920
const H = 1080
const MARGIN = 46 // gap between browser window and frame edge
const WIN_X = MARGIN
const WIN_Y = MARGIN
const WIN_W = W - MARGIN * 2 // 1828
const WIN_H = H - MARGIN * 2 // 988
const CHROME_H = 58 // browser top bar
const VIEW_W = WIN_W // page is as wide as the window
const VIEW_H = WIN_H - CHROME_H // 930 — visible page viewport

/**
 * Frame + browser-window geometry, exposed so embedders (e.g. StoreCreateScene)
 * can position chrome/labels relative to the window when they re-scale the build.
 */
export const STORE_GEO = { W, H, WIN_X, WIN_Y, WIN_W, WIN_H } as const

// ── page layout (page‑coordinate space; the page is taller than the viewport) ──
const PAD = 84 // page side padding
const ANN_Y = 0
const ANN_H = 42
const NAV_Y = ANN_Y + ANN_H
const NAV_H = 84
const HERO_Y = NAV_Y + NAV_H
const HERO_H = 612
const NA_Y = HERO_Y + HERO_H // "new arrivals" block top
const NA_HEAD_H = 168
const CARD_H = 470
const NA_H = NA_HEAD_H + CARD_H + 70
const CAT_Y = NA_Y + NA_H
const CAT_H = 430
const PAGE_H = CAT_Y + CAT_H + 60

// ── easing helpers ──────────────────────────────────────────────────────────
const easeOut = Easing.out(Easing.cubic)
const easeInOut = Easing.inOut(Easing.cubic)
const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const

/** Eased 0→1 over [start, start+dur]. */
const prog = (f: number, start: number, dur: number, easing = easeOut) =>
  interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing })

/** Fade + rise: content lifts a few px into place as it appears. */
function riseIn(f: number, start: number, dur = 18, dy = 16): CSSProperties {
  const p = prog(f, start, dur)
  return { opacity: p, transform: `translateY(${(1 - p) * dy}px)` }
}

/**
 * Diffusion‑style reveal for photos: starts blurred, dark and desaturated, then
 * sharpens, brightens and saturates into place with a slow scale settle — the
 * look of an image being denoised into existence.
 */
function denoise(f: number, start: number, dur = 46) {
  const p = prog(f, start, dur, easeOut)
  const fade = prog(f, start, dur * 0.4)
  const blur = interpolate(p, [0, 1], [30, 0])
  const sat = interpolate(p, [0, 1], [0.25, 1])
  const bright = interpolate(p, [0, 1], [1.22, 1])
  const contrast = interpolate(p, [0, 1], [0.86, 1])
  const scale = interpolate(p, [0, 1], [1.09, 1])
  return {
    opacity: fade,
    filter: `blur(${blur}px) saturate(${sat}) brightness(${bright}) contrast(${contrast})`,
    transform: `scale(${scale})`,
    p, // exposed so callers can drive a scan‑line overlay
  }
}

/** How many characters of `text` are "typed" at frame f (cps chars/frame). */
const typed = (f: number, start: number, text: string, cps = 0.9) =>
  text.slice(0, Math.max(0, Math.min(text.length, Math.round((f - start) * cps))))

/** Frame‑derived caret blink (no wall‑clock). */
const caretOn = (f: number) => Math.floor(f / 8) % 2 === 0

// ── small building blocks ───────────────────────────────────────────────────

/** Shimmering skeleton placeholder; the highlight band sweeps across by frame. */
function Skeleton({
  f,
  style,
  radius = 6,
}: {
  f: number
  style: CSSProperties
  radius?: number
}) {
  const x = ((f % 60) / 60) * 220 - 60 // sweep position in %
  return (
    <div
      style={{
        position: 'absolute',
        background: SKELETON,
        borderRadius: radius,
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `linear-gradient(105deg, transparent ${x - 22}%, ${SKELETON_HI} ${x}%, transparent ${x + 22}%)`,
        }}
      />
    </div>
  )
}

/** Blinking caret bar. */
function Caret({ f, h, color = INK }: { f: number; h: number; color?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 3,
        height: h,
        marginLeft: 3,
        verticalAlign: 'middle',
        background: color,
        opacity: caretOn(f) ? 0.85 : 0,
      }}
    />
  )
}

// ── header pieces ─────────────────────────────────────────────────────────────

function AnnouncementBar({ f }: { f: number }) {
  const p = prog(f, 44, 16)
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: ANN_Y,
        width: VIEW_W,
        height: ANN_H,
        background: INK,
        color: '#e9e6df',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `0 ${PAD}px`,
        fontFamily: TEXT_FONT,
        fontSize: 12.5,
        letterSpacing: 1.4,
        opacity: p,
        transform: `translateY(${(1 - p) * -ANN_H}px)`,
      }}
    >
      <span style={{ opacity: 0.85 }}>EN · STORE LOCATOR</span>
      <span style={{ opacity: 0.95 }}>20% OFF YOUR FIRST ORDER — JOIN THE LIST</span>
      <span style={{ opacity: 0.85 }}>(+1) 888 204 119</span>
    </div>
  )
}

function NavIcon({ d }: { d: string }) {
  return (
    <svg width={19} height={19} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={1.6}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Nav({ f }: { f: number }) {
  const wordmark = typed(f, 74, 'AURELE', 0.42)
  const typingMark = f >= 74 && wordmark.length < 6
  const links = ['HOME', 'STORY', 'CATEGORIES', 'SHOP']
  const right = ['SEARCH', 'CONTACT']
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: NAV_Y,
        width: VIEW_W,
        height: NAV_H,
        background: PAPER,
        borderBottom: `1px solid #ececec`,
        display: 'flex',
        alignItems: 'center',
        padding: `0 ${PAD}px`,
        fontFamily: TEXT_FONT,
      }}
    >
      {/* left links */}
      <div style={{ display: 'flex', gap: 30, flex: 1, fontSize: 13, letterSpacing: 1.2, color: '#2a2722' }}>
        {links.map((l, i) => (
          <span key={l} style={riseIn(f, 62 + i * 5, 16, 8)}>
            {l}
          </span>
        ))}
      </div>
      {/* centred wordmark */}
      <div
        style={{
          flex: 'none',
          fontFamily: DISPLAY_FONT,
          fontWeight: 700,
          fontSize: 27,
          letterSpacing: 9,
          color: INK,
          paddingLeft: 9,
        }}
      >
        {wordmark}
        {typingMark && <Caret f={f} h={24} />}
      </div>
      {/* right links + icons */}
      <div
        style={{
          display: 'flex',
          gap: 26,
          flex: 1,
          justifyContent: 'flex-end',
          alignItems: 'center',
          fontSize: 13,
          letterSpacing: 1.2,
          color: '#2a2722',
        }}
      >
        {right.map((l, i) => (
          <span key={l} style={riseIn(f, 96 + i * 5, 16, 8)}>
            {l}
          </span>
        ))}
        <div style={{ display: 'flex', gap: 16, ...riseIn(f, 110, 16, 8) }}>
          <NavIcon d="M21 21l-4.3-4.3M11 19a8 8 0 100-16 8 8 0 000 16z" />
          <NavIcon d="M20 21a8 8 0 10-16 0M12 11a4 4 0 100-8 4 4 0 000 8z" />
          <NavIcon d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" />
        </div>
      </div>
    </div>
  )
}

// ── hero ────────────────────────────────────────────────────────────────────

function Hero({ f }: { f: number }) {
  const dn = denoise(f, 128, 50)
  const headline1 = typed(f, 186, 'TIMELESS', 0.55)
  const headline2 = typed(f, 210, 'BY DESIGN', 0.55)
  const typing1 = f >= 186 && headline1.length < 8
  const typing2 = f >= 210 && headline2.length < 9
  const para = prog(f, 232, 22)
  const cta = prog(f, 252, 18)
  const ctaFill = prog(f, 262, 14)
  return (
    <div style={{ position: 'absolute', left: 0, top: HERO_Y, width: VIEW_W, height: HERO_H, overflow: 'hidden', background: '#dfdcd6' }}>
      {/* skeleton, revealed under the photo until it has denoised in */}
      {f < 150 && <Skeleton f={f} style={{ inset: 0, borderRadius: 0 }} radius={0} />}
      <Img
        src={staticFile('store/hero.png')}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: dn.opacity, filter: dn.filter, transform: dn.transform }}
      />
      {/* legibility scrim, bottom + left */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(100deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.12) 38%, transparent 60%)', opacity: dn.p }} />
      {/* scan line sweeping once during the denoise */}
      <ScanLine f={f} start={128} dur={50} height={HERO_H} />

      {/* text overlay */}
      <div style={{ position: 'absolute', left: PAD, bottom: 64, color: PAPER }}>
        <div style={{ fontFamily: TEXT_FONT, fontSize: 13, letterSpacing: 3, opacity: prog(f, 170, 16) * 0.85, marginBottom: 14 }}>SINCE 2003</div>
        <div style={{ fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 84, lineHeight: 0.96, letterSpacing: -1 }}>
          <div>
            {headline1}
            {typing1 && <Caret f={f} h={70} color={PAPER} />}
          </div>
          <div>
            {headline2}
            {typing2 && <Caret f={f} h={70} color={PAPER} />}
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', right: PAD, bottom: 92, width: 320, color: '#efece6', fontFamily: TEXT_FONT, fontSize: 15, lineHeight: 1.5, opacity: para, transform: `translateY(${(1 - para) * 14}px)` }}>
        A curated edit of premium essentials, crafted to last a lifetime — and then some.
        <div
          style={{
            marginTop: 22,
            display: 'inline-block',
            padding: '13px 26px',
            border: `1px solid rgba(255,255,255,${0.55 * cta})`,
            background: `rgba(255,255,255,${0.96 * ctaFill})`,
            color: ctaFill > 0.5 ? INK : 'rgba(255,255,255,0.95)',
            fontSize: 12.5,
            letterSpacing: 1.8,
            opacity: cta,
          }}
        >
          SHOP THE COLLECTION
        </div>
      </div>
    </div>
  )
}

/** A faint horizontal band that sweeps top→bottom once while a photo denoises. */
function ScanLine({ f, start, dur, height }: { f: number; start: number; dur: number; height: number }) {
  const p = prog(f, start, dur * 0.85, easeInOut)
  if (p <= 0 || p >= 1) return null
  const y = p * height
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y - 60, height: 120, background: 'linear-gradient(transparent, rgba(255,255,255,0.16), transparent)', pointerEvents: 'none' }} />
  )
}

// ── product grid ──────────────────────────────────────────────────────────────

type Product = { src: string; name: string; price: number }
const PRODUCTS: Product[] = [
  { src: 'store/prod-1.png', name: 'Rust Leather Jacket', price: 420 },
  { src: 'store/prod-2.png', name: 'Wool Tailored Coat', price: 560 },
  { src: 'store/prod-3.png', name: 'Olive Field Jacket', price: 295 },
]

function ProductCard({ f, p, start, x, w }: { f: number; p: Product; start: number; x: number; w: number }) {
  const imgH = CARD_H - 78
  const dn = denoise(f, start, 44)
  const name = typed(f, start + 30, p.name, 0.7)
  const typingName = f >= start + 30 && name.length < p.name.length
  const priceP = prog(f, start + 40, 20)
  const priceVal = Math.round(interpolate(priceP, [0, 1], [0, p.price]))
  return (
    <div style={{ position: 'absolute', left: x, top: NA_HEAD_H, width: w }}>
      <div style={{ position: 'relative', width: w, height: imgH, background: CARD_BG, overflow: 'hidden' }}>
        {f < start + 26 && <Skeleton f={f} style={{ inset: 0 }} radius={0} />}
        <Img
          src={staticFile(p.src)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: dn.opacity, filter: dn.filter, transform: dn.transform }}
        />
        <ScanLine f={f} start={start} dur={44} height={imgH} />
      </div>
      <div style={{ marginTop: 18, fontFamily: TEXT_FONT }}>
        <div style={{ fontSize: 16, color: INK, letterSpacing: 0.2, minHeight: 20 }}>
          {name}
          {typingName && <Caret f={f} h={15} />}
        </div>
        <div style={{ fontSize: 14, color: ACCENT, marginTop: 7, opacity: priceP }}>
          ${priceVal}.00 USD
        </div>
      </div>
    </div>
  )
}

function NewArrivals({ f }: { f: number }) {
  const gap = 40
  const w = (VIEW_W - PAD * 2 - gap * 2) / 3
  const eyebrow = prog(f, 296, 16)
  const heading = typed(f, 304, 'NEW ARRIVALS', 0.8)
  const typingHead = f >= 304 && heading.length < 12
  return (
    <div style={{ position: 'absolute', left: 0, top: NA_Y, width: VIEW_W, height: NA_H }}>
      <div style={{ position: 'absolute', left: PAD, top: 52, fontFamily: TEXT_FONT, fontSize: 12.5, letterSpacing: 2.6, color: MUTED, opacity: eyebrow }}>NEW COLLECTION</div>
      <div style={{ position: 'absolute', left: PAD, top: 74, fontFamily: DISPLAY_FONT, fontWeight: 800, fontSize: 52, color: INK, letterSpacing: -0.5 }}>
        {heading}
        {typingHead && <Caret f={f} h={44} />}
      </div>
      {PRODUCTS.map((p, i) => (
        <ProductCard key={p.name} f={f} p={p} start={316 + i * 26} x={PAD + i * (w + gap)} w={w} />
      ))}
    </div>
  )
}

// ── category banners ────────────────────────────────────────────────────────

function CategoryCard({ f, src, label, start, x, w }: { f: number; src: string; label: string; start: number; x: number; w: number }) {
  const dn = denoise(f, start, 44)
  const lab = prog(f, start + 18, 18)
  return (
    <div style={{ position: 'absolute', left: x, top: 0, width: w, height: CAT_H - 52, overflow: 'hidden', background: CARD_BG }}>
      {f < start + 26 && <Skeleton f={f} style={{ inset: 0 }} radius={0} />}
      <Img src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: dn.opacity, filter: dn.filter, transform: dn.transform }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.18)', opacity: dn.p }} />
      <ScanLine f={f} start={start} dur={44} height={CAT_H - 52} />
      <div
        style={{
          position: 'absolute',
          left: 40,
          top: 34,
          color: PAPER,
          fontFamily: DISPLAY_FONT,
          fontWeight: 800,
          fontSize: 44,
          letterSpacing: 1,
          opacity: lab,
          transform: `translateY(${(1 - lab) * 12}px)`,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function Categories({ f }: { f: number }) {
  const gap = 40
  const w = (VIEW_W - PAD * 2 - gap) / 2
  return (
    <div style={{ position: 'absolute', left: 0, top: CAT_Y, width: VIEW_W, height: CAT_H, padding: `0 ${PAD}px` }}>
      <div style={{ position: 'relative', height: CAT_H - 52 }}>
        <CategoryCard f={f} src="store/cat-men.png" label="MEN'S" start={430} x={0} w={w} />
        <CategoryCard f={f} src="store/cat-women.png" label="WOMEN'S" start={452} x={w + gap} w={w} />
      </div>
    </div>
  )
}

// ── browser chrome ────────────────────────────────────────────────────────────

function Chrome({ f }: { f: number }) {
  const domain = typed(f, 14, 'aurele.store', 0.7)
  const typingDomain = f >= 14 && domain.length < 12
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: WIN_W, height: CHROME_H, background: '#f4f2ee', borderBottom: '1px solid #e4e1db', display: 'flex', alignItems: 'center', padding: '0 22px', gap: 18 }}>
      <div style={{ display: 'flex', gap: 9 }}>
        {['#f0625b', '#f5c043', '#5bd06e'].map((c) => (
          <div key={c} style={{ width: 13, height: 13, borderRadius: '50%', background: c }} />
        ))}
      </div>
      <div
        style={{
          flex: 1,
          height: 32,
          background: PAPER,
          border: '1px solid #e1ded7',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          gap: 9,
          maxWidth: 520,
          margin: '0 auto',
          fontFamily: TEXT_FONT,
          fontSize: 14,
          color: '#54504a',
        }}
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#8d8881" strokeWidth={1.8}>
          <path d="M6 10V8a6 6 0 1112 0v2M5 10h14v10H5V10z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>
          {domain}
          {typingDomain && <Caret f={f} h={15} color="#54504a" />}
        </span>
      </div>
      <div style={{ width: 64 }} />
    </div>
  )
}

// ── the page (scrolls inside the viewport) ─────────────────────────────────────

function Page({ f }: { f: number }) {
  // The camera scrolls down as each new section is generated, then holds.
  const scrollY = interpolate(
    f,
    [0, 276, 300, 404, 430, STORE_BUILD_DURATION],
    [0, 0, NA_Y - 96, NA_Y - 96, PAGE_H - VIEW_H, PAGE_H - VIEW_H],
    { ...clamp, easing: easeInOut },
  )
  return (
    <div style={{ position: 'absolute', inset: 0, width: VIEW_W, height: VIEW_H, overflow: 'hidden', background: PAPER }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: VIEW_W, height: PAGE_H, transform: `translateY(${-scrollY}px)` }}>
        <AnnouncementBar f={f} />
        <Nav f={f} />
        <Hero f={f} />
        <NewArrivals f={f} />
        <Categories f={f} />
      </div>
    </div>
  )
}

// ── composition root ──────────────────────────────────────────────────────────

export const StoreBuildVideo: React.FC<{ frameOverride?: number; transparent?: boolean }> = ({
  frameOverride,
  transparent,
} = {}) => {
  const localFrame = useCurrentFrame()
  // When embedded (e.g. in StorePitch) the parent drives a time-remapped frame so
  // the build can be re-paced / beat-synced; standalone it uses its own frame.
  const f = frameOverride ?? localFrame
  // Browser window fades + lifts into the workspace at the very start.
  const win = prog(f, 0, 18)
  // `transparent` drops the grey workspace + blueprint grid so an embedder can
  // place just the browser window on its own background (e.g. StoreCreateScene).
  return (
    <AbsoluteFill style={{ background: transparent ? 'transparent' : DESK }}>
      <Fonts />
      {/* faint design grid that flashes then clears — a "canvas" cue */}
      {!transparent && <GenGrid f={f} />}
      <div
        style={{
          position: 'absolute',
          left: WIN_X,
          top: WIN_Y,
          width: WIN_W,
          height: WIN_H,
          borderRadius: 16,
          overflow: 'hidden',
          background: PAPER,
          boxShadow: '0 40px 90px rgba(40,36,30,0.28), 0 4px 14px rgba(40,36,30,0.16)',
          opacity: win,
          transform: `translateY(${(1 - win) * 24}px) scale(${interpolate(win, [0, 1], [0.985, 1])})`,
        }}
      >
        <Chrome f={f} />
        <div style={{ position: 'absolute', left: 0, top: CHROME_H, width: WIN_W, height: VIEW_H }}>
          <Page f={f} />
        </div>
      </div>
    </AbsoluteFill>
  )
}

/** A faint blueprint grid over the workspace that fades out as building starts. */
function GenGrid({ f }: { f: number }) {
  const op = interpolate(f, [0, 12, 40], [0, 0.5, 0], { ...clamp }) * 0.5
  if (op <= 0) return null
  return (
    <AbsoluteFill
      style={{
        opacity: op,
        backgroundImage: `linear-gradient(${INK} 1px, transparent 1px), linear-gradient(90deg, ${INK} 1px, transparent 1px)`,
        backgroundSize: '64px 64px',
      }}
    />
  )
}
