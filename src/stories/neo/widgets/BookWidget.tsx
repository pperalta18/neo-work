import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { BRAND, elevation, TEXT_FONT } from '@/lib/neumorphism'
import { useNeoTheme } from '../NeoTheme'

/**
 * BookWidget — a neumorphic reading document with a real page-peel turn.
 * ──────────────────────────────────────────────────────────────────────
 * The whole card *is* the page (rounded, lit by the active NeoTheme). Turning
 * advances to the next page by lifting the bottom-right corner: the corner
 * curls up, casts a soft shadow on the page beneath, shows a faint mirrored
 * bleed-through of the text we just read, and sweeps off toward the spine —
 * revealing the next page underneath.
 *
 * Geometry (the honest bit): folding a corner is a *reflection* of that corner
 * region across the fold line. The fold line is the perpendicular bisector of
 * the segment from the original corner O to the dragged corner C. We:
 *   1. clip the front page to everything on the C-side of the fold (the part
 *      that stays flat),
 *   2. clip a copy of the page to the O-side corner and reflect it across the
 *      fold (the lifted flap, showing the page's back),
 *   3. let the next page show through the vacated corner underneath.
 * `C` travels a quadratic Bézier (lift up-left, then sweep to the spine) so the
 * turn starts as a soft dog-ear and finishes cleanly off-screen.
 *
 * Pure "state in, frame out": pass `page` + `progress` to drive it from a
 * Remotion frame; omit them and it auto-plays (and turns on click).
 */

export type BookPage = {
  /** Running header, centered + muted (e.g. the book title). */
  header?: string
  /** Small letter-spaced label (e.g. "CHAPTER ONE"). */
  chapter?: string
  /** Accent heading under the chapter (e.g. "HOW AND WHY"). */
  heading?: string
  /** Pull-quote, set in serif italic. */
  quote?: string
  /** Pull-quote attribution (small caps). */
  quoteBy?: string
  /** Body paragraphs, justified serif. */
  body?: string[]
  /** Page number (bottom-right). */
  page?: number
}

export type BookWidgetProps = {
  pages?: BookPage[]
  /** Card width in px; height follows `ratio`. */
  width?: number
  /** height / width. Default 1.92 (a tall reader). */
  ratio?: number
  /** Auto-advance through the pages. */
  auto?: boolean
  /** Pause on each page (ms) before turning. */
  holdMs?: number
  /** Duration of a single turn (ms). */
  turnMs?: number
  /** Controlled current page index (Remotion / external driver). */
  page?: number
  /** Controlled turn progress 0→1 of the current page turning to the next. */
  progress?: number
}

// ── Fold geometry ─────────────────────────────────────────────────────────

type Pt = [number, number]

/** Quadratic Bézier the dragged corner follows: lift up-left, sweep to spine. */
function corner(t: number, W: number, H: number): Pt {
  const p0: Pt = [W, H]
  const p1: Pt = [-0.15 * W, -0.18 * H] // pull up and to the left → diagonal peel
  const p2: Pt = [-1.25 * W, 0.85 * H] // end well past the left spine → clears
  const u = 1 - t
  return [
    u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
    u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
  ]
}

/** Clip a polygon to one half-plane through M with normal n (keep one side). */
function clipHalf(poly: Pt[], M: Pt, n: Pt, keepNegative: boolean): Pt[] {
  const side = (p: Pt) => (p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1]
  const inside = (p: Pt) => (keepNegative ? side(p) <= 0 : side(p) >= 0)
  const out: Pt[] = []
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % poly.length]
    const Ain = inside(A)
    if (Ain) out.push(A)
    if (Ain !== inside(B)) {
      const sA = side(A)
      const sB = side(B)
      const f = sA / (sA - sB)
      out.push([A[0] + f * (B[0] - A[0]), A[1] + f * (B[1] - A[1])])
    }
  }
  return out
}

type Fold = {
  flat: Pt[] // page region that stays flat (front page clip)
  folded: Pt[] // corner region that lifts (flap clip, pre-reflection)
  matrix: [number, number, number, number, number, number] // reflection across the fold
  sheenAngle: number // CSS deg: fold (crease) → free edge (highlight)
}

function computeFold(W: number, H: number, C: Pt): Fold {
  const O: Pt = [W, H]
  const M: Pt = [(O[0] + C[0]) / 2, (O[1] + C[1]) / 2] // a point on the fold line
  const n: Pt = [C[0] - O[0], C[1] - O[1]] // normal, points O → C
  const rect: Pt[] = [
    [0, 0],
    [W, 0],
    [W, H],
    [0, H],
  ]
  const folded = clipHalf(rect, M, n, true) // O-side (lifts)
  const flat = clipHalf(rect, M, n, false) // C-side (stays)

  // Reflection across the line through M with unit normal u: R = I − 2·u·uᵀ.
  const len = Math.hypot(n[0], n[1]) || 1
  const ux = n[0] / len
  const uy = n[1] / len
  const a = 1 - 2 * ux * ux
  const b = -2 * ux * uy
  const d = 1 - 2 * uy * uy
  // Keep M fixed under the map.
  const e = M[0] - (a * M[0] + b * M[1])
  const f = M[1] - (b * M[0] + d * M[1])

  // Sheen runs from the crease (toward C) to the free edge (toward O = −n).
  const sheenAngle = (Math.atan2(-ux, uy) * 180) / Math.PI

  return { flat, folded, matrix: [a, b, b, d, e, f], sheenAngle }
}

function polygon(pts: Pt[], W: number, H: number): string {
  return `polygon(${pts
    .map((p) => `${((p[0] / W) * 100).toFixed(3)}% ${((p[1] / H) * 100).toFixed(3)}%`)
    .join(', ')})`
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

// ── Component ───────────────────────────────────────────────────────────────

export function BookWidget({
  pages = DEFAULT_PAGES,
  width = 340,
  ratio = 1.92,
  auto = true,
  holdMs = 2400,
  turnMs = 1500,
  page: pageProp,
  progress: progressProp,
}: BookWidgetProps) {
  const theme = useNeoTheme()
  const W = width
  const H = Math.round(width * ratio)
  const radius = Math.round(width * 0.1)
  const len = pages.length

  const controlled = pageProp != null && progressProp != null
  const [autoPage, setAutoPage] = useState(0)
  const [autoProgress, setAutoProgress] = useState(0)
  const turning = useRef(false)

  const page = controlled ? ((pageProp as number) % len + len) % len : autoPage
  const progress = controlled ? Math.max(0, Math.min(1, progressProp as number)) : autoProgress
  const next = (page + 1) % len

  // One self-contained turn: animate progress 0→1, then swap to the next page.
  const turnOnce = useCallback(() => {
    if (controlled || turning.current || len < 2) return
    turning.current = true
    let start: number | null = null
    const step = (ts: number) => {
      if (start == null) start = ts
      const p = Math.min((ts - start) / turnMs, 1)
      setAutoProgress(easeInOut(p))
      if (p < 1) {
        requestAnimationFrame(step)
      } else {
        setAutoPage((x) => (x + 1) % len)
        setAutoProgress(0)
        turning.current = false
      }
    }
    requestAnimationFrame(step)
  }, [controlled, len, turnMs])

  useEffect(() => {
    if (controlled || !auto || len < 2) return
    const id = setInterval(turnOnce, holdMs + turnMs)
    return () => clearInterval(id)
  }, [controlled, auto, len, holdMs, turnMs, turnOnce])

  const turningNow = progress > 0.001 && len > 1
  const fold = turningNow ? computeFold(W, H, corner(progress, W, H)) : null

  const stack: CSSProperties = {
    position: 'relative',
    width: W,
    height: H,
    borderRadius: radius,
    overflow: 'hidden',
    background: theme.surface,
    cursor: controlled ? 'default' : 'pointer',
    ...elevation(theme, { depth: 'raised', distance: 14, blur: 32, radius }),
  }

  const fill: CSSProperties = { position: 'absolute', inset: 0 }

  return (
    <div onClick={() => turnOnce()} style={stack}>
      {/* Next page, revealed through the vacated corner. */}
      {turningNow && (
        <div style={fill} aria-hidden>
          <Page page={pages[next]} theme={theme} W={W} />
        </div>
      )}

      {/* Current page front — clipped to the part that stays flat. */}
      {(!fold || fold.flat.length >= 3) && (
        <div style={{ ...fill, clipPath: fold ? polygon(fold.flat, W, H) : undefined }}>
          <Page page={pages[page]} theme={theme} W={W} />
        </div>
      )}

      {/* The lifted flap: the page's back, reflected across the fold. */}
      {fold && fold.folded.length >= 3 && (
        <div
          style={{
            ...fill,
            clipPath: polygon(fold.folded, W, H),
            transform: `matrix(${fold.matrix.join(',')})`,
            transformOrigin: '0 0',
            filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.30))',
            background: theme.surface,
          }}
          aria-hidden
        >
          {/* Faint mirrored text bleeding through the paper. */}
          <div style={{ ...fill, opacity: 0.16 }}>
            <Page page={pages[page]} theme={theme} W={W} />
          </div>
          {/* Curl sheen: a crease toward the fold, a highlight at the free edge. */}
          <div
            style={{
              ...fill,
              background: `linear-gradient(${fold.sheenAngle}deg, rgba(0,0,0,0.10) 0%, rgba(255,255,255,0) 22%, rgba(255,255,255,0.18) 62%, rgba(255,255,255,0.50) 100%)`,
            }}
          />
        </div>
      )}
    </div>
  )
}

/** A page of the reader: header, chapter, accent heading, pull-quote, body, no. */
function Page({
  page,
  theme,
  W,
}: {
  page: BookPage
  theme: ReturnType<typeof useNeoTheme>
  W: number
}) {
  const serif = "Georgia, 'Times New Roman', 'Iowan Old Style', serif"
  const pad = Math.round(W * 0.105)
  const small = Math.round(W * 0.039)
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
        padding: pad,
        background: theme.surface,
        color: theme.textStrong,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: serif,
      }}
    >
      {page.header && (
        <div
          style={{
            fontFamily: TEXT_FONT,
            textAlign: 'center',
            fontSize: small + 1,
            color: theme.textMuted,
            marginBottom: pad * 0.7,
          }}
        >
          {page.header}
        </div>
      )}

      {page.chapter && (
        <div
          style={{
            fontFamily: serif,
            fontSize: small + 1,
            letterSpacing: 1.5,
            color: theme.textStrong,
          }}
        >
          {page.chapter}
        </div>
      )}
      {page.heading && (
        <div
          style={{
            fontFamily: serif,
            fontSize: small + 1,
            letterSpacing: 1.5,
            color: BRAND.red,
            marginTop: 4,
          }}
        >
          {page.heading}
        </div>
      )}

      {page.quote && (
        <div style={{ marginTop: pad * 0.95 }}>
          <div style={{ fontStyle: 'italic', fontSize: small + 4, lineHeight: 1.4 }}>
            {`“${page.quote}”`}
          </div>
          {page.quoteBy && (
            <div style={{ fontSize: small, letterSpacing: 1, marginTop: 6 }}>{page.quoteBy}</div>
          )}
        </div>
      )}

      {page.body && (
        <div style={{ marginTop: pad * 0.85, display: 'flex', flexDirection: 'column', gap: '0.7em' }}>
          {page.body.map((p, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                fontSize: small + 3,
                lineHeight: 1.5,
                textAlign: 'justify',
                hyphens: 'auto',
              }}
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {page.page != null && (
        <div
          style={{
            marginTop: 'auto',
            textAlign: 'right',
            fontSize: small + 1,
            color: theme.textMuted,
            paddingTop: pad * 0.5,
          }}
        >
          {page.page}
        </div>
      )}
    </div>
  )
}

// ── Sample content ───────────────────────────────────────────────────────────

export const DEFAULT_PAGES: BookPage[] = [
  {
    header: 'The Shape of Design',
    chapter: 'CHAPTER ONE',
    heading: 'HOW AND WHY',
    quote: 'Always the beautiful answer who asks a more beautiful question.',
    quoteBy: 'E. E. CUMMINGS',
    body: [
      'Late one evening, a maker sat at a wide table and turned an idea over in her hands as if it were a smooth stone. The work was not yet a thing — only the wish for a thing, and the patience to find its edges.',
      'She had learned that craft begins long before the first mark. It begins in the noticing: the way a question, asked well, opens a door that a hundred answers never could.',
    ],
    page: 20,
  },
  {
    header: 'The Shape of Design',
    quote: 'We do not make to be finished; we make to begin again, a little wiser.',
    quoteBy: 'A NOTE IN THE MARGIN',
    body: [
      'Every form carries an argument. A chair argues for rest; a doorway argues for passage. To design is to take a position about how a moment should feel, and then to defend it in matter.',
      'The trouble, of course, is that intentions are invisible. They survive only in the choices that remain after everything careless has been taken away.',
      'And so the maker subtracts. She removes the clever flourish, the borrowed style, the line that impressed her yesterday — until what is left can stand without apology.',
    ],
    page: 21,
  },
  {
    header: 'The Shape of Design',
    chapter: 'CHAPTER TWO',
    heading: 'THE PATH AND THE GOAL',
    body: [
      'A route is just a series of decisions made visible. Start here, the page seems to say, and it will carry you — turn by turn — toward a place you could not have named at the outset.',
      'What looks like a straight line is almost never one. It is a negotiation between where you stood and where the light was coming from, redrawn each time the ground shifts.',
      'Keep turning. The next page is only ever one fold away.',
    ],
    page: 22,
  },
]
