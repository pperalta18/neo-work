import { useMemo, type ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { KIT_BLUE, DISPLAY_FONT, TEXT_FONT } from '@/lib/neumorphism'
import { Fonts } from './fonts'

/**
 * DocumentVideo — a blank page that writes *itself*.
 * ──────────────────────────────────────────────────
 * A document inside a clean writing app fills in at an inhuman speed: the caret
 * races ahead, words land behind it, and the page scrolls up to keep the caret
 * in view as the doc outgrows the sheet. No "AI" chrome anywhere — just paper
 * filling itself faster than anyone could type.
 *
 * Determinism (the house rule): the whole document is authored up front as a
 * fixed list of pre-wrapped LINES. A single monotonic curve, charsAt(frame),
 * says how many characters have been "written" so far; everything else —
 * which line the caret is on, how far the page has scrolled, the word count in
 * the header — is derived from that one number. No Math.random, no layout
 * measurement, so every render of frame N is byte-identical.
 *
 * Timeline (30fps):
 *   0–8      rest    — empty sheet, caret blinking at the start
 *   8–48     accel   — ease-in: the first words appear, readably
 *   48–249   cruise  — near-linear at peak speed (the "a toda pastilla" stretch)
 *   249–285  settle  — ease-out, the final sentence lands
 *   285–330  done    — parked on the finished doc, "Guardado", caret blinking
 */

export const DOCUMENT_DURATION = 330

// ── Window + page geometry (px) ──────────────────────────────────────────────
const CARD_W = 1000
const CARD_H = 940
const HEADER_H = 58
const PAD_X = 92 // left/right document margins inside the sheet
const PAD_TOP = 54
const PAD_BOTTOM = 44
const BODY_H = CARD_H - HEADER_H
// The caret is pinned this far down the page; written lines scroll up past it.
const ANCHOR = BODY_H * 0.56

// ── Timeline keyframes ───────────────────────────────────────────────────────
const WRITE_START = 8
const ACCEL_END = 48
const SETTLE_START = 249
const REVEAL_END = 285

type LineType = 'title' | 'meta' | 'h2' | 'body' | 'bullet'

type LineStyle = {
  size: number
  weight: number
  lh: number // line-box height (drives layout + scroll maths)
  gap: number // default space above a line of this type
  color: string
  font: string
  indent: number // extra left padding (bullets)
  bullet: boolean
}

const STYLES: Record<LineType, LineStyle> = {
  title: { size: 38, weight: 800, lh: 50, gap: 0, color: '#15151c', font: DISPLAY_FONT, indent: 0, bullet: false },
  meta: { size: 16, weight: 500, lh: 26, gap: 8, color: '#9a9ab2', font: TEXT_FONT, indent: 0, bullet: false },
  h2: { size: 23, weight: 700, lh: 34, gap: 34, color: '#1e1e26', font: DISPLAY_FONT, indent: 0, bullet: false },
  body: { size: 19, weight: 400, lh: 31, gap: 4, color: '#33333f', font: TEXT_FONT, indent: 0, bullet: false },
  bullet: { size: 19, weight: 400, lh: 31, gap: 9, color: '#33333f', font: TEXT_FONT, indent: 30, bullet: true },
}

type Line = { t: LineType; s: string; gap?: number }

/**
 * The document, authored as pre-wrapped lines (~78 chars max so they fit the
 * 816px text column without reflow). `gap` overrides the type's default top
 * spacing — paragraph continuation lines set gap:0 to sit tight under the line
 * above; the first line of a paragraph keeps the larger default.
 */
const LINES: Line[] = [
  { t: 'title', s: 'Propuesta de campaña — Lanzamiento Q3' },
  { t: 'meta', s: 'Equipo de Marketing · Actualizado hoy' },

  { t: 'body', s: 'Este documento reúne la estrategia de comunicación para el', gap: 26 },
  { t: 'body', s: 'lanzamiento de la nueva línea de producto durante el tercer', gap: 0 },
  { t: 'body', s: 'trimestre del año. El objetivo es generar notoriedad y captar', gap: 0 },
  { t: 'body', s: 'contactos cualificados con una narrativa visual coherente.', gap: 0 },

  { t: 'h2', s: 'Objetivos principales' },
  { t: 'bullet', s: 'Aumentar el reconocimiento de marca en un 40 %.' },
  { t: 'bullet', s: 'Conseguir 1.200 registros cualificados antes de septiembre.' },
  { t: 'bullet', s: 'Posicionar el producto como referente en su categoría.' },

  { t: 'h2', s: 'Público objetivo' },
  { t: 'body', s: 'Profesionales de entre 28 y 45 años interesados en herramientas', gap: 16 },
  { t: 'body', s: 'de productividad y diseño. Valoran el detalle, la rapidez y las', gap: 0 },
  { t: 'body', s: 'soluciones que se integran sin fricción en su día a día.', gap: 0 },

  { t: 'h2', s: 'Estrategia creativa' },
  { t: 'body', s: 'La campaña se articula en cuatro fases: expectación, revelación,', gap: 16 },
  { t: 'body', s: 'demostración y conversión. Todas comparten un sistema visual', gap: 0 },
  { t: 'body', s: 'común basado en superficies suaves, relieve sutil y una', gap: 0 },
  { t: 'body', s: 'tipografía clara y contemporánea.', gap: 0 },

  { t: 'h2', s: 'Calendario' },
  { t: 'bullet', s: 'Julio — Teaser en redes y prensa especializada.' },
  { t: 'bullet', s: 'Agosto — Revelación del producto y demostraciones en directo.' },
  { t: 'bullet', s: 'Septiembre — Cierre de campaña y análisis de resultados.' },
]

// Pre-compute static layout + char offsets once (independent of frame).
type Laid = Line & { st: LineStyle; top: number; charStart: number }

const LAYOUT: { lines: Laid[]; total: number; contentBottom: number; words: number } = (() => {
  const lines: Laid[] = []
  let y = PAD_TOP
  let chars = 0
  for (let i = 0; i < LINES.length; i++) {
    const l = LINES[i]
    const st = STYLES[l.t]
    const gap = l.gap ?? st.gap
    y += gap
    lines.push({ ...l, st, top: y, charStart: chars })
    y += st.lh
    chars += l.s.length
  }
  const words = LINES.map((l) => l.s).join(' ').trim().split(/\s+/).length
  return { lines, total: chars, contentBottom: y, words }
})()

/** Cumulative characters "written" at a (possibly fractional) frame. */
function charsAt(frame: number): number {
  const { total } = LAYOUT
  if (frame <= WRITE_START) return 0
  if (frame <= ACCEL_END) {
    // Ease-in so the first ~7% reads before the page goes full speed.
    return interpolate(frame, [WRITE_START, ACCEL_END], [0, total * 0.07], {
      easing: Easing.in(Easing.quad),
      extrapolateRight: 'clamp',
    })
  }
  if (frame <= SETTLE_START) {
    return interpolate(frame, [ACCEL_END, SETTLE_START], [total * 0.07, total * 0.93], {
      extrapolateRight: 'clamp',
    })
  }
  // Ease-out onto the last sentence.
  return interpolate(frame, [SETTLE_START, REVEAL_END], [total * 0.93, total], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function Caret({ size, on }: { size: number; on: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 2.5,
        height: size * 1.02,
        marginLeft: 2,
        borderRadius: 1,
        background: KIT_BLUE,
        boxShadow: `0 0 8px ${KIT_BLUE}66`,
        opacity: on ? 1 : 0,
      }}
    />
  )
}

export function DocumentVideo() {
  const frame = useCurrentFrame()
  const { lines, total, contentBottom, words } = useMemo(() => LAYOUT, [])

  const revealed = charsAt(frame)

  // The caret sits on the last line the writing has *entered*. Strictly-greater
  // keeps it at the end of a finished line until the next line actually starts,
  // so it never flickers to the next line a frame early.
  let cur = 0
  for (let i = 0; i < lines.length; i++) {
    if (revealed > lines[i].charStart) cur = i
  }
  const curLine = lines[cur]
  const revealedInCur = Math.max(0, Math.min(curLine.s.length, Math.round(revealed - curLine.charStart)))
  const finished = revealed >= total

  // Smooth scroll: advance a virtual write-head fractionally *within* the
  // current line so the page glides instead of jumping a whole line at a time.
  const frac = curLine.s.length > 0 ? revealedInCur / curLine.s.length : 0
  const writeY = curLine.top + frac * curLine.st.lh
  const maxScroll = Math.max(0, contentBottom + PAD_BOTTOM - BODY_H)
  const scroll = Math.max(0, Math.min(maxScroll, writeY - ANCHOR))

  // Caret: solid while actively writing, blinking when idle (start / finished).
  const writing = revealed > 0 && !finished && frame > WRITE_START
  const blink = Math.floor(frame / 12) % 2 === 0
  const caretOn = writing ? true : blink

  // Header activity: a green pulse + live word count while writing, "Guardado"
  // once the page is full.
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.5))
  const wordCount = Math.round((revealed / total) * words)

  const renderLine = (l: Laid, idx: number): ReactNode => {
    const isCur = idx === cur
    const text = idx < cur ? l.s : l.s.slice(0, revealedInCur)
    return (
      <div
        key={idx}
        style={{
          position: 'absolute',
          top: l.top,
          left: PAD_X + l.st.indent,
          right: PAD_X,
          height: l.st.lh,
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'pre',
          fontFamily: l.st.font,
          fontSize: l.st.size,
          fontWeight: l.st.weight,
          color: l.st.color,
          letterSpacing: l.t === 'title' ? -0.5 : 0,
        }}
      >
        {l.st.bullet && (
          <span
            style={{
              flexShrink: 0,
              width: 7,
              height: 7,
              marginLeft: -22,
              marginRight: 15,
              borderRadius: '50%',
              background: KIT_BLUE,
              opacity: text.length > 0 ? 1 : 0,
            }}
          />
        )}
        <span>{text}</span>
        {isCur && <Caret size={l.st.size} on={caretOn} />}
      </div>
    )
  }

  return (
    <AbsoluteFill
      style={{
        background: 'radial-gradient(circle at 50% 24%, #ffffff 0%, #eef0f6 55%, #e3e6f0 100%)',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: TEXT_FONT,
      }}
    >
      <Fonts />
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 26,
          overflow: 'hidden',
          background: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            '0 60px 130px -40px rgba(40,55,90,0.42), 0 20px 56px -32px rgba(40,55,90,0.30), inset 0 1px 0 rgba(255,255,255,0.9)',
        }}
      >
        {/* Header — filename + live word count + activity dot */}
        <div
          style={{
            height: HEADER_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 26px',
            gap: 12,
            background: 'linear-gradient(180deg, #fbfbfe 0%, #f4f5f9 100%)',
            borderBottom: '1px solid rgba(30,40,70,0.07)',
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 7,
              background: KIT_BLUE,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: `0 4px 10px -3px ${KIT_BLUE}88`,
            }}
          >
            {/* Tiny document glyph */}
            <div style={{ width: 11, height: 13, borderRadius: 2, background: '#fff', opacity: 0.95 }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#3a3a4c', fontFamily: TEXT_FONT }}>
            Propuesta_de_campaña.doc
          </span>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13.5, color: '#9a9ab2', fontFamily: TEXT_FONT, fontVariantNumeric: 'tabular-nums' }}>
              {wordCount} palabras
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: finished ? '#2ada56' : KIT_BLUE,
                  opacity: finished ? 0.9 : pulse,
                  boxShadow: finished ? 'none' : `0 0 8px ${KIT_BLUE}${Math.round(pulse * 99)}`,
                }}
              />
              <span style={{ fontSize: 13, color: '#9a9ab2', fontFamily: TEXT_FONT }}>
                {finished ? 'Guardado' : 'Editando'}
              </span>
            </div>
          </div>
        </div>

        {/* Page body — written lines scroll up under a soft top fade */}
        <div
          style={{
            position: 'relative',
            height: BODY_H,
            overflow: 'hidden',
            background: '#ffffff',
            maskImage: 'linear-gradient(to bottom, transparent 0%, #000 6%, #000 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, #000 6%, #000 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`, willChange: 'transform' }}>
            {lines.slice(0, cur + 1).map((l, i) => renderLine(l, i))}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}
