/**
 * StoreTerminalScene — acto 4.5 (nuevo acto 5) de la mini-película E-Commerce.
 * ──────────────────────────────────────────────────────────────────────────────
 * "La IA construye con código la web que ves al final". Justo antes de que
 * aparezca la tienda AURELE terminada (`StoreCreateScene`), el usuario ve cómo
 * **Forge** la levanta: un terminal/editor oscuro donde el log de
 * `aikit forge build aurele` avanza (comandos, componentes JSX, HTML, estilos)
 * hasta el sello final ✓ AURELE lista.
 *
 * Reutiliza al máximo la infraestructura de {@link CodeTerminalVideo}:
 *   - La misma carta oscura (mismo `CARD_W`, `CARD_H`, title bar, dots, scanlines).
 *   - El mismo mecanismo de impresión determinista (emittedAt, scrollFromEmitted,
 *     renderWindow, shutter-sampling con plus-lighter).
 *   - El mismo tokenizador `highlight` + paleta `COLORS` de `codeStream`.
 * Solo cambia el **contenido** del stream: un reel de `aikit forge build aurele`
 * con componentes JSX de la tienda (Hero, ProductGrid, Checkout…) y el outro
 * con ✓ AURELE lista. El sello "Creada con Forge" se reserva para el acto
 * siguiente ({@link StoreCreateScene}), para no repetirlo.
 *
 * Todo derivado de `useCurrentFrame()`: determinista frame a frame.
 * Sin Math.random() ni Date.now().
 *
 * Timeline (30 fps):
 *   0–7     hold    — comando `aikit forge build aurele` se teclea
 *   7–17    prime   — líneas aparecen a paso legible (llena la pantalla)
 *   17–41   accel   — ramp de velocidad; scroll + motion-blur crecen
 *   41–79   cruise  — velocidad pico ("construyendo a toda pastilla")
 *   79–93   settle  — deceleración suave sobre el resumen final
 *   93–107  rest    — aparcado en ✓ AURELE lista, cursor parpadeante
 */

import { useMemo, type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { highlight, COLORS, type Tok } from './codeStream'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts } from './fonts'

export const STORE_TERMINAL_DURATION = 130 // ~4,3 s @ 30 fps (cola ampliada para leer "✓ AURELE lista")

// ── Terminal geometry (idéntica a CodeTerminalVideo) ─────────────────────────
// La carta conserva su geometría interna; solo la encogemos un punto al
// presentarla, para acercarla al tamaño del resto de elementos de la película.
const CARD_SCALE = 0.9
const CARD_W = 1320
const CARD_H = 800
const TITLE_H = 46
const PAD_X = 26
const PAD_Y = 16
const LINE_H = 34
const FONT_SIZE = 19
const BODY_H = CARD_H - TITLE_H
const VISIBLE_H = BODY_H - PAD_Y * 2

const MONO =
  "'SF Mono', 'JetBrains Mono', 'Fira Code', ui-monospace, Menlo, Consolas, 'Liberation Mono', monospace"

// ── Timeline keyframes (re-escalados a ~3,6 s — ratio ≈ 0.421 del original) ──
const HOLD = 7
const FILL_END = 17
const ACCEL_END = 41
const CRUISE_END = 79
const SETTLE = 93

const V0 = 0.8
const START_OFFSET = LINE_H * 2

// ── Stream AURELE ─────────────────────────────────────────────────────────────

/** Deterministic [0,1) pseudo-random from an integer seed. */
function seeded(i: number): number {
  let x = Math.imul(i ^ 0x9e3779b9, 2654435761) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 2246822519) >>> 0
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

const AURELE_FILES = [
  'src/components/Hero.tsx',
  'src/components/ProductGrid.tsx',
  'src/components/ProductCard.tsx',
  'src/components/Checkout.tsx',
  'src/components/CartDrawer.tsx',
  'src/components/NavBar.tsx',
  'src/components/Footer.tsx',
  'src/lib/storefront.ts',
  'src/lib/inventory.ts',
  'src/pages/index.tsx',
  'src/pages/product/[slug].tsx',
  'src/styles/globals.css',
]

function fillAurele(line: string, i: number): string {
  const pick = <T,>(arr: T[], salt: number) => arr[Math.floor(seeded(i * 17 + salt) * arr.length)]
  const int = (lo: number, hi: number, salt: number) =>
    String(lo + Math.floor(seeded(i * 17 + salt) * (hi - lo)))
  return line
    .replace(/{file}/g, () => pick(AURELE_FILES, 1))
    .replace(/{ms}/g, () => int(4, 180, 2))
    .replace(/{n}/g, () => int(8, 48, 3))
    .replace(/{kb}/g, () => int(12, 88, 4))
    .replace(/{hash2}/g, () => int(10, 99, 5))
    .replace(/{pct}/g, () => int(2, 99, 6))
    .replace(/{hash}/g, () => seeded(i * 17 + 7).toString(16).slice(2, 8))
    .replace(/{px}/g, () => int(12, 64, 9))
    .replace(/{color}/g, () => pick(['#1a1a1a', '#f5f0eb', '#c8a97e', '#e8ddd0', '#2d2926'], 10))
}

/** Plantillas de código AURELE — JSX + CSS + build log (reel corto para ~3,6 s). */
const AURELE_TEMPLATES = [
  "import { motion } from 'framer-motion'",
  "import { useInventory } from '@/lib/inventory'",
  "import { ProductCard } from './ProductCard'",
  '',
  '// AURELE — Hero section',
  'export function Hero() {',
  "  return <section className='hero' aria-label='AURELE collection'>",
  "    <img src='/hero/timeless.webp' alt='AURELE — Timeless by design' />",
  "    <h1 className='display'>TIMELESS<br/>BY DESIGN</h1>",
  "    <a href='/collection' className='btn-primary'>Shop the collection</a>",
  '  </section>',
  '}',
  '',
  '✓ {file} compiled ({ms}ms)',
  '> forge/build: scanning inventory catalogue…',
  '',
  '// Product grid — trae el catálogo desde DocuSense',
  'export function ProductGrid() {',
  "  const { products } = useInventory('aurele')",
  '  return (',
  "    <ul className='grid grid-cols-3 gap-8'>",
  "      {products.map(p => <ProductCard key={p.slug} product={p} />)}",
  '    </ul>',
  '  )',
  '}',
  '',
  '✓ {file} compiled ({ms}ms)',
  '⚡ {n} components • {kb}.{hash2} kB │ gzip: {kb}.{hash2} kB',
  '',
  ':root {',
  '  --brand-dark:  {color};',
  '  --brand-sand:  {color};',
  "  --font-display: 'Canela', serif;",
  "  --font-body:    'Inter', sans-serif;",
  '}',
  '.hero { min-height: 100svh; display: grid; place-items: center; }',
  '.grid  { padding: {px}px; gap: {px}px; }',
  '.btn-primary { background: var(--brand-dark); color: #fff; }',
  '',
  '✓ {file} compiled ({ms}ms)',
  '> forge/build: linking to inventory ({n} SKUs)…',
  '> forge/build: deploying to aikit-cdn.net…  {pct}%',
  '',
]

const AURELE_COMMAND = 'aikit forge build aurele'

type StreamLine = { toks: Tok[] }
type AureleStream = {
  lines: StreamLine[]
  command: string
  cmdIndex: number
  promptIndex: number
}

function buildAureleStream(bodyLines = 60): AureleStream {
  const intro = [
    `$ ${AURELE_COMMAND}`,
    '',
    '> aikit forge v2.4.1 — building AURELE storefront',
    '> reading catalogue from DocuSense… 184 SKUs imported',
    '> scaffolding project structure…',
    '',
  ]
  const body: string[] = []
  for (let i = 0; i < bodyLines; i++) {
    body.push(fillAurele(AURELE_TEMPLATES[i % AURELE_TEMPLATES.length], i))
  }
  const outro = [
    '',
    '✓ 12 pages built — 184 productos, 3 colecciones',
    '✓ stock feed conectado — actualización en tiempo real',
    '✓ AURELE lista — desplegada en aikit-cdn.net/aurele',
    '',
    '$ ',
    '',
    '',
    '',
    '',
  ]
  const raw = [...intro, ...body, ...outro]
  const promptIndex = raw.lastIndexOf('$ ')
  return {
    lines: raw.map((s) => ({ toks: highlight(s) })),
    command: AURELE_COMMAND,
    cmdIndex: 0,
    promptIndex,
  }
}

// ── Motion helpers (idénticos a CodeTerminalVideo) ────────────────────────────

function emittedAt(frame: number, total: number): number {
  const Tf = FILL_END - HOLD
  const Ta = ACCEL_END - FILL_END
  const Tc = CRUISE_END - ACCEL_END
  const Ts = SETTLE - CRUISE_END
  const peak = (total - 1 - V0 * (Tf + Ta / 2)) / (Ta / 2 + Tc + Ts / 2)
  const eF = 1 + V0 * Tf
  const eA = eF + ((V0 + peak) / 2) * Ta
  const eC = eA + peak * Tc

  if (frame <= HOLD) {
    return interpolate(frame, [0, 13], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  }
  if (frame <= FILL_END) return 1 + V0 * (frame - HOLD)
  if (frame <= ACCEL_END) {
    const t = frame - FILL_END
    const a = (peak - V0) / Ta
    return eF + V0 * t + 0.5 * a * t * t
  }
  if (frame <= CRUISE_END) return eA + peak * (frame - ACCEL_END)
  const t = Math.min(frame - CRUISE_END, Ts)
  const d = peak / Ts
  return eC + peak * t - 0.5 * d * t * t
}

function scrollFromEmitted(emitted: number, dEnd: number): number {
  return Math.min(dEnd, Math.max(-START_OFFSET, emitted * LINE_H - VISIBLE_H))
}

function lineLen(toks: Tok[]): number {
  let n = 0
  for (const t of toks) n += t.s.length
  return n
}

function sliceToks(toks: Tok[], n: number): Tok[] {
  const out: Tok[] = []
  let left = n
  for (const t of toks) {
    if (left <= 0) break
    if (t.s.length <= left) {
      out.push(t)
      left -= t.s.length
    } else {
      out.push({ s: t.s.slice(0, left), c: t.c })
      left = 0
    }
  }
  return out
}

// ── Sub-components (idénticos en estética a CodeTerminalVideo) ────────────────

const dot = (c: string): CSSProperties => ({
  width: 13,
  height: 13,
  borderRadius: '50%',
  background: c,
  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.18)',
})

function Cursor({ color, on }: { color: string; on: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: FONT_SIZE * 0.56,
        height: FONT_SIZE * 1.05,
        marginLeft: 1,
        transform: 'translateY(3px)',
        background: color,
        opacity: on ? 0.95 : 0,
        borderRadius: 1,
      }}
    />
  )
}

function TermLine({ top, toks, trailing }: { top: number; toks: Tok[]; trailing?: ReactNode }) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        height: LINE_H,
        lineHeight: `${LINE_H}px`,
        whiteSpace: 'pre',
        overflow: 'hidden',
      }}
    >
      {toks.map((t, i) => (
        <span key={i} style={{ color: COLORS[t.c] }}>
          {t.s}
        </span>
      ))}
      {trailing}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function StoreTerminalScene() {
  const frame = useCurrentFrame()
  const stream = useMemo(() => buildAureleStream(60), [])
  const L = stream.lines.length

  const totalH = L * LINE_H
  const dEnd = totalH - VISIBLE_H

  const emitted = emittedAt(frame, L)
  const emittedPrev = emittedAt(frame - 1, L)
  const scrollY = scrollFromEmitted(emitted, dEnd)

  const prevY = scrollFromEmitted(emittedPrev, dEnd)
  const dist = Math.abs(scrollY - prevY)
  const SAMPLES = Math.min(24, Math.max(1, Math.ceil(dist / 4)))

  const blinkOn = Math.floor(frame / 14) % 2 === 0
  const typingNow = emitted - emittedPrev > 0.02
  const caretOn = typingNow || blinkOn
  const showActiveCaret = frame <= SETTLE - 6
  const showPromptCursor = frame > SETTLE - 6
  const running = frame > HOLD && frame < SETTLE
  const pulse = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame / 3.5))

  const renderWindow = (em: number): ReactNode => {
    const y = scrollFromEmitted(em, dEnd)
    const lead = Math.min(Math.floor(em), L - 1)
    const frac = em - lead
    const first = Math.max(0, Math.floor(y / LINE_H) - 1)
    const last = Math.min(lead, Math.ceil((y + VISIBLE_H) / LINE_H) + 1)
    const out: ReactNode[] = []
    for (let idx = first; idx <= last; idx++) {
      const top = idx * LINE_H - y
      const active = idx === lead && showActiveCaret

      if (idx === stream.cmdIndex) {
        const typed = active ? Math.round(frac * stream.command.length) : stream.command.length
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={[
              { s: '$ ', c: 'prompt' },
              { s: stream.command.slice(0, typed), c: 'plain' },
            ]}
            trailing={active ? <Cursor color={COLORS.plain} on={caretOn} /> : null}
          />,
        )
      } else if (idx === stream.promptIndex) {
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={[{ s: '$ ', c: 'prompt' }]}
            trailing={
              showPromptCursor ? (
                <Cursor color={COLORS.prompt} on={blinkOn} />
              ) : active ? (
                <Cursor color={COLORS.plain} on={caretOn} />
              ) : null
            }
          />,
        )
      } else if (active) {
        const full = stream.lines[idx].toks
        out.push(
          <TermLine
            key={idx}
            top={top}
            toks={sliceToks(full, Math.round(frac * lineLen(full)))}
            trailing={<Cursor color={COLORS.plain} on={caretOn} />}
          />,
        )
      } else {
        out.push(<TermLine key={idx} top={top} toks={stream.lines[idx].toks} />)
      }
    }
    return out
  }

  const layers: ReactNode[] = []
  for (let k = 0; k < SAMPLES; k++) {
    const t = frame - 1 + (k + 0.5) / SAMPLES
    const em = emittedAt(t, L)
    const layerStyle: CSSProperties = { position: 'absolute', inset: 0, opacity: 1 / SAMPLES }
    ;(layerStyle as Record<string, string | number>).mixBlendMode = 'plus-lighter'
    layers.push(
      <div key={k} style={layerStyle}>
        {renderWindow(em)}
      </div>,
    )
  }

  return (
    <AbsoluteFill
      style={{
        backgroundColor: lightTheme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: MONO,
      }}
    >
      <Fonts />

      {/* Tarjeta oscura — misma geometría y estética que CodeTerminalVideo */}
      <div style={{ transform: `scale(${CARD_SCALE})` }}>
      <div
        style={{
          width: CARD_W,
          height: CARD_H,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e1117 0%, #0a0d13 100%)',
          boxShadow:
            '0 60px 130px -34px rgba(26,36,62,0.55), 0 22px 60px -26px rgba(26,36,62,0.40), inset 0 1px 0 rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            height: TITLE_H,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: `0 ${PAD_X}px`,
            background: 'linear-gradient(180deg, #1a2029 0%, #141923 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', gap: 9 }}>
            <span style={dot('#ff5f57')} />
            <span style={dot('#febc2e')} />
            <span style={dot('#28c840')} />
          </div>
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 13.5,
              color: '#8a94a6',
              letterSpacing: 0.2,
              pointerEvents: 'none',
            }}
          >
            zsh — aikit-forge — aurele — 120×40
          </div>
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 12.5,
              color: '#6b7689',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#2ada56',
                opacity: running ? pulse : 0.35,
                boxShadow: running ? `0 0 8px rgba(42,218,86,${pulse})` : 'none',
              }}
            />
            {running ? 'building' : 'done'}
          </div>
        </div>

        {/* Scrolling body */}
        <div
          style={{
            position: 'relative',
            height: BODY_H,
            overflow: 'hidden',
            padding: `${PAD_Y}px ${PAD_X}px`,
            fontSize: FONT_SIZE,
            maskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to bottom, transparent 0%, #000 7%, #000 90%, transparent 100%)',
          }}
        >
          <div style={{ position: 'absolute', inset: `${PAD_Y}px ${PAD_X}px`, isolation: 'isolate' }}>
            {layers}
          </div>

          {/* CRT scanlines */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              backgroundImage:
                'repeating-linear-gradient(to bottom, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)',
              mixBlendMode: 'overlay',
            }}
          />
          {/* Soft top glow */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              background:
                'radial-gradient(120% 60% at 50% -10%, rgba(122,162,255,0.10) 0%, transparent 60%)',
            }}
          />
        </div>
      </div>
      </div>
    </AbsoluteFill>
  )
}
