/**
 * StaffImportScene — acto 2 de Planificación de Horarios.
 * ──────────────────────────────────────────────────────────────────────────
 * Carga de empleados desde Excel y ERP. Las fuentes entran en DocuSense/Junction,
 * se limpian y salen como una plantilla única con disponibilidad, contrato y
 * vacaciones. Visualmente usa "rutas de datos" hacia un hub, no absorción radial
 * ni convergencia de contactos, para mantener variedad entre flujos.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion'
import { elevation, lightTheme, BRAND, KIT_BLUE, DISPLAY_FONT, TEXT_FONT, type BrandColor } from '@/lib/neumorphism'
import { Icon, type IconName } from '@/components/icons'
import { OperatingModuleTile } from './OperatingModuleTile'
import { Fonts } from './fonts'

const theme = lightTheme

type Source = {
  label: string
  sub: string
  icon: IconName
  color: BrandColor
  pos: [number, number]
}

const SOURCES: Source[] = [
  { label: 'empleados.xlsx', sub: 'nombres · roles · horas', icon: 'spreadsheet', color: 'green', pos: [0.2, 0.38] },
  { label: 'ERP / RRHH', sub: 'contratos · vacaciones', icon: 'erp', color: 'violet', pos: [0.2, 0.62] },
]

const EMPLOYEES: Array<{ name: string; meta: string; color: BrandColor }> = [
  { name: 'Lucía', meta: '40 h · mañanas', color: 'teal' },
  { name: 'Marco', meta: '32 h · tardes', color: 'blue' },
  { name: 'Sofía', meta: 'vacaciones jueves', color: 'violet' },
  { name: 'Hugo', meta: '20 h · refuerzo', color: 'orange' },
  { name: 'Elena', meta: '40 h · cierre', color: 'green' },
]

const P_START = 28
const P_STEP = 7
const P_FLIGHT = 28
const P_COUNT = 18
const LIST_AT = P_START + P_STEP * 4 + P_FLIGHT

export const STAFF_IMPORT_DURATION = 190 // cola ampliada para leer la plantilla limpia completa

const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const smoother = (x: number) => {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function pathAt(sx: number, sy: number, tx: number, ty: number, p: number, bend: number): [number, number] {
  const cx = (sx + tx) / 2
  const cy = (sy + ty) / 2 + bend
  const q = 1 - p
  return [q * q * sx + 2 * q * p * cx + p * p * tx, q * q * sy + 2 * q * p * cy + p * p * ty]
}

function SourceCard({ source, i, frame, W, H }: { source: Source; i: number; frame: number; W: number; H: number }) {
  const p = spring({ frame: frame - 6 - i * 8, fps: 30, config: { damping: 200, mass: 0.75 } })
  const plate = elevation(theme, { depth: 'raised', distance: 8, blur: 18, radius: 18 })
  const color = BRAND[source.color]
  const x = source.pos[0] * W
  const y = source.pos[1] * H

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 18}px)`,
        opacity: p,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        minWidth: 286,
        padding: '16px 18px',
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...plate,
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 13, display: 'grid', placeItems: 'center', background: `${color}1f` }}>
        <Icon name={source.icon} size={23} color={color} strokeWidth={2} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 16, fontWeight: 750, color: theme.textStrong }}>{source.label}</span>
        <span style={{ marginTop: 3, fontSize: 12.5, color: theme.textMuted }}>{source.sub}</span>
      </div>
    </div>
  )
}

function Hub({ frame, x, y }: { frame: number; x: number; y: number }) {
  // Entrada de la placa (igual que el antiguo disco) y apertura del estado en
  // cuanto empieza a fluir el primer dato hacia el hub.
  const p = spring({ frame: frame - 8, fps: 30, config: { damping: 200, mass: 0.78 } })
  const open = spring({ frame: frame - (P_START + 4), fps: 30, config: { damping: 200, mass: 0.82 } })

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        opacity: p,
        transform: `translate(-50%, -50%) scale(${0.92 + 0.08 * p})`,
      }}
    >
      <OperatingModuleTile
        module="docusense"
        secondary="junction"
        status="Unificando fuentes"
        frame={frame}
        expand={open}
        size={140}
      />
    </div>
  )
}

function CleanList({ frame, x, y }: { frame: number; x: number; y: number }) {
  const p = spring({ frame: frame - LIST_AT, fps: 30, config: { damping: 200, mass: 0.75 } })
  const card = elevation(theme, { depth: 'raised', distance: 12, blur: 28, radius: 26 })
  const well = elevation(theme, { depth: 'recessed', distance: 3, blur: 8, radius: 16 })

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: 430,
        transform: `translate(-50%, -50%) translateY(${(1 - p) * 22}px)`,
        opacity: p,
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: theme.surface,
        fontFamily: TEXT_FONT,
        ...card,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, display: 'grid', placeItems: 'center', background: `${KIT_BLUE}17` }}>
          <Icon name="employee" size={22} color={KIT_BLUE} strokeWidth={2} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 18, fontWeight: 750, color: theme.textStrong }}>Plantilla limpia</span>
          <span style={{ fontSize: 12.5, color: theme.textMuted }}>disponibilidad · contrato · ausencias</span>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 28, fontWeight: 800, color: KIT_BLUE, fontFamily: DISPLAY_FONT }}>18</span>
      </div>

      <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 5, ...well }}>
        {EMPLOYEES.map((person, i) => {
          const row = spring({ frame: frame - LIST_AT - 6 - i * 5, fps: 30, config: { damping: 200, mass: 0.7 } })
          const color = BRAND[person.color]
          return (
            <div
              key={person.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '9px 10px',
                borderRadius: 12,
                opacity: row,
                transform: `translateY(${(1 - row) * 8}px)`,
              }}
            >
              <div style={{ width: 30, height: 30, borderRadius: 999, background: color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 750 }}>
                {person.name[0]}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: theme.textStrong }}>{person.name}</span>
                <span style={{ fontSize: 11.5, color: theme.textMuted }}>{person.meta}</span>
              </div>
              <span style={{ marginLeft: 'auto', color: BRAND.green }}>
                <Icon name="check" size={16} color={BRAND.green} strokeWidth={2.2} />
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function StaffImportScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()
  const hubX = W * 0.48
  const hubY = H * 0.5
  const listX = W * 0.76
  const listY = H * 0.5

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
          {SOURCES.map((source, i) => {
            const sx = source.pos[0] * W
            const sy = source.pos[1] * H
            const p = clamp01((frame - (P_START + i * 5)) / 22)
            if (p <= 0) return null
            const bend = i === 0 ? -80 : 80
            const [mx, my] = pathAt(sx, sy, hubX, hubY, smoother(p), bend)
            return (
              <g key={source.label}>
                <path
                  d={`M ${sx} ${sy} Q ${(sx + hubX) / 2} ${(sy + hubY) / 2 + bend} ${hubX} ${hubY}`}
                  fill="none"
                  stroke={KIT_BLUE}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                  opacity={0.75}
                />
                <circle cx={mx} cy={my} r={5} fill={BRAND[source.color]} />
              </g>
            )
          })}
          {(() => {
            const p = clamp01((frame - LIST_AT + 10) / 24)
            if (p <= 0) return null
            return (
              <path
                d={`M ${hubX + 92} ${hubY} L ${listX - 238} ${listY}`}
                fill="none"
                stroke={KIT_BLUE}
                strokeWidth={2.4}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - p}
                opacity={0.8}
              />
            )
          })()}
        </svg>

        {SOURCES.map((source, i) => (
          <SourceCard key={source.label} source={source} i={i} frame={frame} W={W} H={H} />
        ))}
        <Hub frame={frame} x={hubX} y={hubY} />
        <CleanList frame={frame} x={listX} y={listY} />

        {Array.from({ length: P_COUNT }).map((_, i) => {
          const source = SOURCES[i % SOURCES.length]
          const spawn = P_START + i * P_STEP
          if (frame < spawn) return null
          const p = smoother(clamp01((frame - spawn) / P_FLIGHT))
          if (p >= 1) return null
          const sx = source.pos[0] * W
          const sy = source.pos[1] * H
          const [x, y] = pathAt(sx, sy, hubX, hubY, p, source.pos[1] < 0.5 ? -80 : 80)
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - 10,
                top: y - 10,
                width: 20,
                height: 20,
                borderRadius: 999,
                background: BRAND[source.color],
                boxShadow: `0 3px 10px ${BRAND[source.color]}55`,
                opacity: 1 - clamp01((p - 0.82) / 0.18),
              }}
            />
          )
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
