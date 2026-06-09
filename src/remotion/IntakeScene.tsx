/**
 * IntakeScene — el acto "se lo das a un módulo y te lo deja listo", compartido.
 * ──────────────────────────────────────────────────────────────────────────
 * El patrón común de captura: una PILA de documentos (un Excel encima + PDFs /
 * Word asomando detrás) aparece, REPOSA un instante LEGIBLE y luego vuela hacia
 * un módulo AiKit —representado por la **pila cuadrada** {@link OperatingModuleTile}—
 * donde es ABSORBIDA; al recibirla, la placa se expande con su estado
 * ("Procesando…"); acto seguido, del módulo BROTAN fichas en un arco
 * superior-izquierdo — el dato en crudo se ha vuelto algo útil (un catálogo…).
 *
 * Parametrizado por `coreModule` (el icono de marca), el `coreStatus` que muestra
 * la placa, la `sheet` protagonista + las `backSheets` que asoman detrás y los
 * `sprouts` que brotan, para que cada flujo reutilice la mecánica. Todo derivado
 * de `useCurrentFrame()` (sin `Math.random`/`Date.now`).
 */

import type { ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { NeoThemeProvider } from '@/stories/neo/NeoTheme'
import { MODULES, type ModuleName } from '@/stories/neo/modules/modules'
import { OperatingModuleTile } from './OperatingModuleTile'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const CORE_RISE = 12
const SHEET_START = 6 // la pila de documentos empieza a aparecer
const SHEET_IN = 9 // aparición ligera y rápida (fade + micro-subida)
const SHEET_HOLD = 37 // reposo ESTÁTICO ~1,2 s para leer que es un Excel
const SHEET_FLIGHT = 26 // viaje hacia el módulo + absorción
const SHEET_ABSORB_AT = SHEET_START + SHEET_IN + SHEET_HOLD // empieza a volar (52)
const SPROUT_START = 70 // las fichas brotan una vez la pila se absorbe
const SPROUT_STEP = 7
const SPROUT_FLIGHT = 24
const HOLD = 36 // cola: respiro para asimilar el catálogo completo
/** Lado de la pila cuadrada del módulo. */
const TILE = 132

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/** Duración (frames) del acto de intake para un nº de fichas que brotan. */
export function intakeDuration(sproutCount: number): number {
  const last = SPROUT_START + (sproutCount - 1) * SPROUT_STEP + SPROUT_FLIGHT
  return Math.ceil(last + HOLD)
}

export type IntakeSceneProps = {
  /** Módulo cuyo icono de marca protagoniza la pila. */
  coreModule: ModuleName
  /** Estado que revela la pila al expandirse ("Procesando documentos…"). */
  coreStatus?: string
  /** El widget protagonista de la pila (p.ej. un SpreadsheetWidget). */
  sheet: ReactNode
  /** Documentos que asoman DETRÁS de `sheet` en la pila (PDF, Word…). */
  backSheets?: ReactNode[]
  /** Escala de la pila en reposo / vuelo. */
  sheetScale?: number
  /** Contenido de cada ficha que brota de la pila (define su propio tamaño). */
  sprouts: ReactNode[]
}

/** Offsets de los documentos de fondo: asoman por las esquinas tras el principal. */
const BACK_OFFSETS = [
  { dx: 196, dy: -176, rot: 6 }, // arriba-derecha
  { dx: -198, dy: 168, rot: -5 }, // abajo-izquierda
  { dx: 188, dy: 170, rot: 4 },
]

/**
 * La pila de documentos: APARECE, REPOSA legible en (restX,restY) y luego vuela
 * hacia el módulo (coreX,coreY) encogiéndose hasta desaparecer dentro de él. El
 * documento principal va al frente; las `back` asoman detrás y se absorben juntas.
 */
function DocStack({
  frame,
  coreX,
  coreY,
  restX,
  restY,
  scale,
  main,
  back,
}: {
  frame: number
  coreX: number
  coreY: number
  restX: number
  restY: number
  scale: number
  main: ReactNode
  back: ReactNode[]
}) {
  if (frame < SHEET_START - 0.001) return null

  const inP = smoother(clamp01((frame - SHEET_START) / SHEET_IN))
  const flyRaw = clamp01((frame - SHEET_ABSORB_AT) / SHEET_FLIGHT)
  if (flyRaw >= 1) return null // ya absorbida
  const fly = smoother(flyRaw)
  const absorb = smoother(clamp01((flyRaw - 0.45) / 0.55))

  const appearY = restY + 14
  const y0 = lerp(appearY, restY, inP) // posición de reposo (alcanzada al aparecer)
  const cx = lerp(restX, coreX, fly)
  const cy = lerp(y0, coreY, fly)
  const s = scale * lerp(0.985, 1, inP) * (1 - absorb * 0.95)
  const opacity = inP * (1 - absorb)

  return (
    <div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        transform: `translate(-50%, -50%) scale(${s})`,
        transformOrigin: '50% 50%',
        opacity,
      }}
    >
      {back.map((node, i) => {
        const o = BACK_OFFSETS[i % BACK_OFFSETS.length]
        return (
          <div
            key={`back-${i}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(-50%, -50%) translate(${o.dx}px, ${o.dy}px) rotate(${o.rot}deg)`,
            }}
          >
            {node}
          </div>
        )
      })}
      <div style={{ position: 'relative' }}>{main}</div>
    </div>
  )
}

/** Una ficha que brota del núcleo y se asienta en un arco superior. */
function Sprout({ i, count, frame, cx, cy, children }: { i: number; count: number; frame: number; cx: number; cy: number; children: ReactNode }) {
  const spawn = SPROUT_START + i * SPROUT_STEP
  if (frame < spawn - 0.001) return null
  const p = smoother(clamp01((frame - spawn) / SPROUT_FLIGHT))

  // Abanico hacia ARRIBA-IZQUIERDA: la pila crece hacia la derecha, así que las
  // fichas que brotan se reparten por el cuadrante superior-izquierdo y no la
  // pisan.
  const t = count === 1 ? 0.5 : i / (count - 1)
  const theta = lerp(-Math.PI * 0.98, -Math.PI * 0.46, t)
  const R = 360
  const rx = cx + Math.cos(theta) * R
  const ry = cy + Math.sin(theta) * R * 0.8

  const x = lerp(cx, rx, p)
  const y = lerp(cy, ry, p)
  const scale = lerp(0.2, 1, p)
  const opacity = clamp01(p * 1.6)

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      {children}
    </div>
  )
}

export function IntakeScene({ coreModule, coreStatus, sheet, backSheets = [], sheetScale = 0.72, sprouts }: IntakeSceneProps) {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  // Centro de la placa: la placa se abre simétrica (hacia ambos lados), así que
  // se ancla centrada en pantalla sin desplazarla.
  const coreX = W / 2
  const coreY = H * 0.52
  const status = coreStatus ?? `Procesando con ${MODULES[coreModule].name}…`

  const rise = smoother(clamp01(frame / CORE_RISE))

  // La placa se expande cuando la pila empieza a ser absorbida (tras el reposo)
  // y se mantiene abierta el resto de la escena.
  const expand = smoother(clamp01((frame - (SHEET_ABSORB_AT + 4)) / 22))
  // La placa solo aparece al final del reposo (justo antes de absorber la pila),
  // para no transparentarse a través de las celdas del Excel mientras se lee.
  const tileAppear = smoother(clamp01((frame - (SHEET_ABSORB_AT - 10)) / 12))

  return (
    <NeoThemeProvider theme={theme}>
      <AbsoluteFill style={{ backgroundColor: theme.surface }}>
        <Fonts />
        <AbsoluteFill style={{ overflow: 'hidden', opacity: rise }}>
          {sprouts.map((node, i) => (
            <Sprout key={i} i={i} count={sprouts.length} frame={frame} cx={coreX} cy={coreY}>
              {node}
            </Sprout>
          ))}

          <div style={{ opacity: tileAppear }}>
            <OperatingModuleTile
              x={coreX}
              y={coreY}
              module={coreModule}
              status={status}
              frame={frame}
              expand={expand}
              size={TILE}
            />
          </div>

          <DocStack
            frame={frame}
            coreX={coreX}
            coreY={coreY}
            restX={coreX}
            restY={coreY - 14}
            scale={sheetScale}
            main={sheet}
            back={backSheets}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    </NeoThemeProvider>
  )
}
