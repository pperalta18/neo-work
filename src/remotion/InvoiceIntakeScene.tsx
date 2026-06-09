/**
 * InvoiceIntakeScene — acto 1 de la mini-película Accounting.
 * ──────────────────────────────────────────────────────────────────────────
 * Las facturas ENTRAN EN EL MÓDULO: tarjetas-factura neumórficas vuelan desde
 * fuera —en un chorro continuo desde todas direcciones— hacia la **placa de
 * Udon** ({@link OperatingModuleTile}) y son ABSORBIDAS por su icono (se
 * encogen y se funden al llegar). Cuando han entrado TODAS, la placa **se
 * expande** revelando el estado "Analizando facturas" con su shimmer (§8 del
 * pitch: Udon se conecta con Odoo y procesa la facturación).
 *
 * Antes era una carpeta genérica con el texto "Analizando con Udon" suelto
 * debajo; ahora reutiliza el lenguaje compartido del "módulo en funcionamiento".
 * Todo derivado de `useCurrentFrame()` (azar por hash determinista, sin
 * `Math.random`/`Date.now`): reproducible frame a frame.
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { elevation, lightTheme, KIT_BLUE, TEXT_FONT } from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { OperatingModuleTile } from './OperatingModuleTile'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) — corto y ágil ───────────────────────────────────────────
const CORE_RISE = 12 // la placa emerge al arrancar
const FILE_START = 6 // primera factura
const FILE_STEP = 1.6 // separación entre facturas (chorro continuo)
const FILE_FLIGHT = 18 // lo que tarda una factura en volar y entrar
const FILE_COUNT = 16 // cuántas facturas entran
const EXPAND_IN = 16 // lo que tarda la placa en abrirse tras la última factura
const HOLD = 46 // remate: placa abierta con "Analizando con Udon"

const LAST_LAND = FILE_START + (FILE_COUNT - 1) * FILE_STEP + FILE_FLIGHT
export const INVOICE_INTAKE_DURATION = Math.ceil(LAST_LAND + HOLD)

/** Lado de la placa cuadrada del módulo. */
const TILE = 132
const FILE_W = 112
const FILE_H = 142

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Hash determinista por índice → 0..1 (sustituye a Math.random). */
function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

type FileSpec = {
  spawn: number
  scx: number
  scy: number
  sTilt: number
  amount: string
}

const AMOUNTS = ['1.240 €', '847 €', '3.190 €', '512 €', '2.075 €', '96 €', '1.860 €', '430 €']

/** Punto de partida: anillo amplio fuera de pantalla, repartido en todas direcciones. */
function buildFiles(targetX: number, targetY: number): FileSpec[] {
  return Array.from({ length: FILE_COUNT }, (_, i): FileSpec => {
    const theta = 2 * Math.PI * rnd(i, 1) - Math.PI / 2
    const R = 760 + rnd(i, 2) * 460
    return {
      spawn: FILE_START + i * FILE_STEP,
      scx: targetX + Math.cos(theta) * R,
      scy: targetY + Math.sin(theta) * R * 0.62,
      sTilt: (rnd(i, 3) - 0.5) * 110,
      amount: AMOUNTS[i % AMOUNTS.length],
    }
  })
}

/**
 * Una tarjeta-factura que vuela hacia el icono del módulo y es ABSORBIDA: en el
 * tramo final se encoge hacia el centro del icono y se funde (como si el módulo
 * se la tragara).
 */
function InvoiceCard({
  file,
  frame,
  targetX,
  targetY,
}: {
  file: FileSpec
  frame: number
  targetX: number
  targetY: number
}) {
  if (frame < file.spawn - 0.001) return null
  const p = smoother(clamp01((frame - file.spawn) / FILE_FLIGHT))
  if (p >= 1) return null // ya dentro

  const cx = lerp(file.scx, targetX, p)
  const cy = lerp(file.scy, targetY, p)
  const tilt = lerp(file.sTilt, 0, p)

  // Tramo final: se hunde en el icono — escala→0 y se desvanece.
  const absorb = smoother(clamp01((p - 0.55) / 0.45))
  const scale = lerp(1.02, 0.12, absorb)
  const enter = clamp01(p / 0.14) // aparece al salir
  const opacity = enter * (1 - absorb)

  const paper = elevation(theme, { depth: 'raised', distance: 6, blur: 14, radius: 13 })

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - FILE_W / 2,
        top: cy - FILE_H / 2,
        width: FILE_W,
        height: FILE_H,
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity,
        zIndex: 20, // por encima de la placa: la factura entra "sobre" el icono
        ...paper,
        background: '#fbfbff',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 7,
        fontFamily: TEXT_FONT,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 6,
          background: KIT_BLUE,
          borderRadius: '13px 13px 0 0',
          opacity: 0.9,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
        <Icon name="invoice" size={17} color={KIT_BLUE} strokeWidth={2} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: theme.textStrong, letterSpacing: -0.3 }}>
          Factura
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
        {[0.95, 0.7, 0.85, 0.5].map((w, j) => (
          <div key={j} style={{ height: 5, width: `${w * 100}%`, borderRadius: 3, background: theme.gridLine }} />
        ))}
      </div>
      <span style={{ marginTop: 'auto', alignSelf: 'flex-end', fontSize: 11.5, fontWeight: 600, color: theme.textMuted }}>
        {file.amount}
      </span>
    </div>
  )
}

export function InvoiceIntakeScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  // Centro de la placa: las facturas convergen aquí (icono centrado en reposo) y,
  // al entrar la última, la placa se abre simétrica hacia ambos lados.
  const coreX = W / 2
  const coreY = H * 0.5

  const files = buildFiles(coreX, coreY)

  const rise = smoother(clamp01(frame / CORE_RISE))

  // La placa se abre cuando ha entrado la última factura y se queda abierta.
  const expand = smoother(clamp01((frame - LAST_LAND) / EXPAND_IN))

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden', opacity: rise }}>
        <OperatingModuleTile
          x={coreX}
          y={coreY}
          module="udon"
          status="Analizando facturas"
          frame={frame}
          expand={expand}
          size={TILE}
        />

        {files.map((f, i) => (
          <InvoiceCard key={i} file={f} frame={frame} targetX={coreX} targetY={coreY} />
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
