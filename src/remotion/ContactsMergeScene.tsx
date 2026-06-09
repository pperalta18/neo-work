/**
 * ContactsMergeScene — acto 2 de la mini-película Email Marketing.
 * ──────────────────────────────────────────────────────────────────────────
 * "Conectas o subes tus contactos estén donde estén". Tus contactos están
 * DISPERSOS en cuatro sitios (Excel, CRM, web, email); cada fuente emite
 * contactos que VIAJAN y CONVERGEN en una sola lista limpia en el centro, que se
 * va llenando (contador hacia 1.240) bajo el sello de **DocuSense**.
 *
 * A propósito DISTINTO de la absorción radial de E-Commerce (`IntakeScene`):
 * aquí no hay una hoja que se traga ni fichas que brotan, sino un flujo de varias
 * fuentes que se unifica. Todo derivado de `useCurrentFrame()` (azar por hash
 * determinista, sin `Math.random`/`Date.now`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, BRAND, TEXT_FONT, DISPLAY_FONT, type BrandColor } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { MODULES } from '@/stories/neo/modules/modules'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const CENTER_RISE = 8
const P_START = 22 // primer contacto en viajar
const P_STEP = 4 // separación entre contactos (chorro continuo)
const P_FLIGHT = 26 // lo que tarda en llegar al centro
const P_COUNT = 22 // cuántos contactos cruzan (representan el flujo)
const HOLD = 44 // cola ampliada para leer la lista unificada + contador

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

const LAST_ARRIVAL = P_START + (P_COUNT - 1) * P_STEP + P_FLIGHT
export const CONTACTS_MERGE_DURATION = Math.ceil(LAST_ARRIVAL + HOLD)

type Source = { label: string; sub: string; icon: IconName; color: BrandColor; pos: [number, number] }
const SOURCES: Source[] = [
  { label: 'Excel', sub: '480 contactos', icon: 'spreadsheet', color: 'green', pos: [0.22, 0.30] },
  { label: 'CRM', sub: '512 contactos', icon: 'lead', color: 'violet', pos: [0.78, 0.30] },
  { label: 'Web', sub: '180 altas', icon: 'web', color: 'orange', pos: [0.22, 0.74] },
  { label: 'Email', sub: '68 respuestas', icon: 'email', color: 'blue', pos: [0.78, 0.74] },
]

// Filas de muestra que aparecen en la lista unificada conforme entra el flujo.
const ROWS: Array<{ name: string; email: string; color: BrandColor }> = [
  { name: 'Lucía Marín', email: 'lucia@mail.com', color: 'blue' },
  { name: 'Carlos Vidal', email: 'carlos@mail.com', color: 'green' },
  { name: 'Marta Ruiz', email: 'marta@mail.com', color: 'violet' },
  { name: 'Diego Soler', email: 'diego@mail.com', color: 'orange' },
  { name: 'Ana Pérez', email: 'ana@mail.com', color: 'pink' },
]

/** Trayectoria curva (bézier cuadrática) de la fuente al centro. */
function pathAt(sx: number, sy: number, tx: number, ty: number, arc: number, p: number): [number, number] {
  const mx = (sx + tx) / 2 + (sy - ty) * arc
  const my = (sy + ty) / 2 + (tx - sx) * arc
  const q = 1 - p
  return [q * q * sx + 2 * q * p * mx + p * p * tx, q * q * sy + 2 * q * p * my + p * p * ty]
}

export function ContactsMergeScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H, fps } = useVideoConfig()

  const cx = W / 2
  const cy = H * 0.52

  // cuántos contactos han llegado → contador + filas reveladas
  const arrived = Array.from({ length: P_COUNT }).filter((_, i) => frame >= P_START + i * P_STEP + P_FLIGHT).length
  const arrivedFrac = arrived / P_COUNT
  const count = Math.round(
    interpolate(frame, [P_START + P_FLIGHT, LAST_ARRIVAL], [0, 1240], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
  )

  // latido del panel central cuando entra un contacto
  let pulse = 0
  for (let i = 0; i < P_COUNT; i++) {
    const d = frame - (P_START + i * P_STEP + P_FLIGHT)
    if (d >= -1 && d < 7) pulse += Math.sin(((d + 1) / 8) * Math.PI) * 0.02
  }

  const centerRise = spring({ frame: frame - CENTER_RISE, fps, config: { damping: 200, mass: 0.7 } })
  const card = elevation(theme, { depth: 'raised', distance: 14, blur: 32, radius: 26 })
  const list = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 18 })

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        {/* fuentes en las esquinas */}
        {SOURCES.map((s, i) => (
          <SourceCard key={s.label} source={s} i={i} frame={frame} fps={fps} W={W} H={H} />
        ))}

        {/* contactos viajando de cada fuente al centro */}
        {Array.from({ length: P_COUNT }).map((_, i) => {
          const src = SOURCES[i % SOURCES.length]
          const spawn = P_START + i * P_STEP
          if (frame < spawn) return null
          const p = smoother(clamp01((frame - spawn) / P_FLIGHT))
          if (p >= 1) return null
          const sx = src.pos[0] * W
          const sy = src.pos[1] * H
          const arc = (i % 2 === 0 ? 1 : -1) * 0.1
          const [x, y] = pathAt(sx, sy, cx, cy, arc, p)
          const appear = clamp01(p / 0.12)
          const merge = clamp01((p - 0.82) / 0.18)
          const size = lerp(22, 13, p)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - size / 2,
                top: y - size / 2,
                width: size,
                height: size,
                borderRadius: '50%',
                background: BRAND[src.color],
                boxShadow: `0 2px 6px ${BRAND[src.color]}55`,
                opacity: appear * (1 - merge),
                zIndex: 5,
              }}
            />
          )
        })}

        {/* lista unificada en el centro */}
        <div
          style={{
            position: 'absolute',
            left: cx,
            top: cy,
            transform: `translate(-50%, -50%) scale(${(0.96 + 0.04 * centerRise) * (1 + pulse)})`,
            opacity: centerRise,
            width: 400,
            background: theme.surface,
            fontFamily: TEXT_FONT,
            zIndex: 20,
            padding: 22,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            ...card,
          }}
        >
          {/* cabecera: título + sello DocuSense */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={MODULES.docusense.icon} alt="DocuSense" width={30} height={30} style={{ display: 'block' }} />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>
                Contactos
              </span>
              <span style={{ fontSize: 12, color: theme.textMuted, letterSpacing: -0.2 }}>unificados con DocuSense</span>
            </div>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: DISPLAY_FONT,
                fontSize: 30,
                fontWeight: 800,
                letterSpacing: -1,
                color: KIT_BLUE,
              }}
            >
              {count.toLocaleString('es-ES')}
            </span>
          </div>

          {/* lista que se va llenando */}
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4, ...list }}>
            {ROWS.map((r, i) => {
              const show = arrivedFrac > i / (ROWS.length + 0.5)
              const op = show ? clamp01((arrivedFrac - i / (ROWS.length + 0.5)) * 6) : 0
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                    padding: '9px 10px',
                    borderRadius: 12,
                    opacity: op,
                    transform: `translateY(${(1 - op) * 6}px)`,
                  }}
                >
                  <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: '50%', background: BRAND[r.color], color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>
                    {r.name[0]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.textStrong, letterSpacing: -0.2 }}>{r.name}</span>
                    <span style={{ fontSize: 11, color: theme.textMuted }}>{r.email}</span>
                  </div>
                  <Icon name="check" size={16} color={BRAND.green} strokeWidth={2} />
                </div>
              )
            })}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

/** Una fuente de contactos (Excel, CRM, web, email) en una esquina. */
function SourceCard({ source, i, frame, fps, W, H }: { source: Source; i: number; frame: number; fps: number; W: number; H: number }) {
  const s = spring({ frame: frame - i * 4, fps, config: { damping: 200, mass: 0.7 } })
  if (s <= 0.001) return null
  const plate = elevation(theme, { depth: 'raised', distance: 7, blur: 16, radius: 16 })
  const x = source.pos[0] * W
  const y = source.pos[1] * H
  const hue = BRAND[source.color]
  // pulso al emitir un contacto desde esta fuente
  let glow = 0
  for (let k = i; k < P_COUNT; k += SOURCES.length) {
    const d = frame - (P_START + k * P_STEP)
    if (d >= -1 && d < 8) glow += Math.sin(((d + 1) / 9) * Math.PI) * 0.5
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - s) * 14}px)`,
        opacity: s,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 17px',
        background: theme.surface,
        fontFamily: TEXT_FONT,
        zIndex: 8,
        ...plate,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          color: hue,
          background: `${hue}1f`,
          boxShadow: glow > 0.01 ? `0 0 ${14 * glow}px ${hue}` : undefined,
        }}
      >
        <Icon name={source.icon} size={22} color={hue} strokeWidth={1.9} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.3, color: theme.textStrong }}>{source.label}</span>
        <span style={{ fontSize: 12, color: theme.textMuted, letterSpacing: -0.2 }}>{source.sub}</span>
      </div>
    </div>
  )
}
