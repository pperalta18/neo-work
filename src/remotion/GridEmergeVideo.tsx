/**
 * GridEmergeVideo — andamiaje: el grid neumórfico emerge celda a celda.
 * ─────────────────────────────────────────────────────────────────────
 * Cada placa pasa de plana (sombra 0, encogida, tenue) → elevada, escalonada en
 * el tiempo (un "stagger"). La emergencia se DERIVA de `useCurrentFrame()` — NO
 * usamos las transiciones CSS de `<Cell animate>`, que son wall-clock y rompen
 * el render determinista de Remotion. En su lugar pasamos el progreso (`grow`,
 * 0→1) al `<Cell>` real del design system vía `distance` / `blur` + `style`.
 *
 * Para componer: edita PLATES. El orden del array = orden de aparición. Ajusta
 * el ritmo con START / STAGGER / RISE / HOLD. La duración se calcula sola.
 *
 * Patrón de referencia más avanzado (cámara + ruta): src/remotion/StoreFlowVideo.tsx
 */

import type { CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { CELL, lightTheme, type Depth } from '@/lib/neumorphism'
import { Grid } from '@/components/Grid'
import { Cell } from '@/components/Cell'
import { Chevron, Label } from '@/components/content'
import { Fonts } from './fonts'

const theme = lightTheme

// ── lienzo del grid ─────────────────────────────────────────────────────────
const COLUMNS = 8
const ROWS = 5

type Plate = {
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
  variant?: 'elevation' | 'image'
  depth?: Depth
  /** fondo para variant="image" (un gradiente de relleno mientras no hay foto) */
  background?: string
  /** texto dentro de la placa */
  label?: { muted?: string; main?: string }
  /** icono chevron dentro de la placa */
  chevron?: 'up' | 'down' | 'left' | 'right'
}

/**
 * Las celdas a revelar. EL ORDEN DEL ARRAY = ORDEN DE EMERGENCIA.
 * Esto es lo único que tienes que tocar para componer una animación nueva.
 */
const PLATES: Plate[] = [
  { col: 1, row: 1 },
  { col: 2, row: 1 },
  { col: 3, row: 1 },
  {
    col: 4,
    row: 1,
    colSpan: 2,
    variant: 'image',
    background: 'linear-gradient(120deg, #1a0f2e 0%, #6d3bd1 45%, #ff7ac6 100%)',
  },
  { col: 6, row: 1 },
  { col: 7, row: 1 },
  { col: 8, row: 1 },
  { col: 1, row: 3, colSpan: 3, label: { muted: '20:00', main: 'Pablo Yusta' } },
  { col: 6, row: 2, chevron: 'up' },
  { col: 6, row: 3 },
  { col: 7, row: 3 },
  { col: 8, row: 3 },
  { col: 3, row: 5 },
  { col: 4, row: 5 },
  { col: 5, row: 5 },
  { col: 7, row: 5, depth: 'recessed' },
]

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const START = 12 // espera antes de la primera emergencia
const STAGGER = 5 // separación entre celdas consecutivas
const RISE = 26 // cuánto tarda una celda en emerger del todo
const HOLD = 40 // tiempo sostenido al final con todo elevado

/** Duración total de la composición, en frames. */
export const GRID_EMERGE_DURATION =
  START + (PLATES.length - 1) * STAGGER + RISE + HOLD

// ── curva ───────────────────────────────────────────────────────────────────
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Progreso de emergencia (0→1) de la celda `index` en un `frame` dado. */
function growAt(frame: number, index: number): number {
  return smoother((frame - (START + index * STAGGER)) / RISE)
}

// ── celda emergente (Cell real, look derivado del frame) ─────────────────────
function EmergeCell({ plate, grow }: { plate: Plate; grow: number }) {
  const g = grow
  const common = {
    col: plate.col,
    row: plate.row,
    colSpan: plate.colSpan,
    rowSpan: plate.rowSpan,
  }
  // Emergencia: encoge + se desvanece cuando está plana, crece hacia el espectador.
  const emerge: CSSProperties = {
    transform: `scale(${0.9 + 0.1 * g})`,
    opacity: clamp01(g * 1.5),
  }

  if (plate.variant === 'image') {
    return <Cell {...common} variant="image" background={plate.background} style={emerge} />
  }

  return (
    <Cell
      {...common}
      depth={plate.depth ?? 'raised'}
      // El relieve crece con la emergencia: de sombra 0 (plano) a la sombra plena.
      distance={8 * g}
      blur={16 * g}
      style={emerge}
    >
      {plate.label ? <Label muted={plate.label.muted}>{plate.label.main}</Label> : null}
      {plate.chevron ? <Chevron dir={plate.chevron} /> : null}
    </Cell>
  )
}

// ── composición ──────────────────────────────────────────────────────────────
export function GridEmergeVideo() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ display: 'grid', placeItems: 'center' }}>
        <Grid columns={COLUMNS} rows={ROWS} cell={CELL} theme={theme} frame gridlines>
          {PLATES.map((plate, i) => (
            <EmergeCell key={`${plate.col}-${plate.row}-${i}`} plate={plate} grow={growAt(frame, i)} />
          ))}
        </Grid>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
