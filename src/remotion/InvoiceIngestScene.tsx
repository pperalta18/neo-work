/**
 * InvoiceIngestScene — el prólogo de Contabilidad: un montón de facturas que
 * caen dentro de una carpeta.
 * ──────────────────────────────────────────────────────────────────────────────
 * Antes de que la IA razone sobre el grid (ver ConceptFlowVideo / cierre-trimestre)
 * contamos el PROBLEMA de forma literal y visual: decenas de tarjetas-factura
 * neumórficas llueven desde arriba y se cuelan en el bolsillo de una carpeta
 * central. Se apilan asomando tras la solapa, un contador sube, la carpeta se
 * ilumina en azul y al final hace un leve push-in para enlazar con la transición
 * hacia el grid.
 *
 * Todo se DERIVA de `useCurrentFrame()` (cero `Math.random` / `Date.now`): el
 * "azar" del vuelo de cada factura sale de un hash determinista por índice, así el
 * render es reproducible frame a frame igual que el resto de composiciones.
 *
 * Para componer: ajusta el ritmo con FILE_* / HOLD y la geometría con FOLDER_*.
 */

import type { CSSProperties } from 'react'
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion'
import {
  elevation,
  lightTheme,
  KIT_BLUE,
  TEXT_FONT,
  DISPLAY_FONT,
} from '@/lib/neumorphism'
import { Icon } from '@/components/icons'
import { Fonts } from './fonts'

const theme = lightTheme

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────
const FOLDER_RISE = 16 // la carpeta emerge al arrancar
const FILE_START = 12 // primera factura (la carpeta aún está subiendo)
const FILE_STEP = 2.6 // separación entre facturas (chorro continuo = "montón")
const FILE_FLIGHT = 24 // lo que tarda una factura en volar y posarse
const FILE_COUNT = 28 // cuántas facturas caen
const HOLD = 30 // remate: carpeta llena, brillo + push-in

const LAST_LAND = FILE_START + (FILE_COUNT - 1) * FILE_STEP + FILE_FLIGHT

/** Duración total de la composición, en frames. */
export const INVOICE_INGEST_DURATION = Math.ceil(LAST_LAND + HOLD)

// ── geometría de la carpeta + tarjetas (px de pantalla) ─────────────────────
const FILE_W = 132
const FILE_H = 168
const FOLDER_W = 600
const FOLDER_H = 380

// ── curvas ───────────────────────────────────────────────────────────────────
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

// ── trayectorias de las facturas (puras: dependen solo de W/H) ──────────────
type FileSpec = {
  spawn: number
  land: number
  /** centro de partida (fuera de pantalla, arco superior) */
  scx: number
  scy: number
  sTilt: number
  /** centro de destino (ranura en el bolsillo) */
  tcx: number
  tcy: number
  tTilt: number
  amount: string
}

const AMOUNTS = ['1.240 €', '847 €', '3.190 €', '512 €', '2.075 €', '96 €', '1.860 €', '430 €']

function buildFiles(W: number, pocketTop: number): FileSpec[] {
  const centerX = W / 2
  return Array.from({ length: FILE_COUNT }, (_, i): FileSpec => {
    const spawn = FILE_START + i * FILE_STEP
    const land = spawn + FILE_FLIGHT

    // Partida: en un arco POR ENCIMA de la carpeta, fuera de pantalla, de izq→der.
    const theta = Math.PI * (1.16 + 0.68 * rnd(i, 1)) // 1.16π..1.84π (arco superior)
    const R = 720 + rnd(i, 2) * 560
    const scx = centerX + Math.cos(theta) * R
    const scy = pocketTop - 40 + Math.sin(theta) * R // sin<0 ⇒ arriba
    const sTilt = (rnd(i, 3) - 0.5) * 90

    // Destino: abanico apilado a lo ancho del bolsillo (asoma ~88px por encima de
    // la solapa). El ladeo sigue el desplazamiento horizontal (las de los extremos
    // se inclinan hacia fuera) → lee como un montón de papeles abultando la carpeta.
    const spread = (rnd(i, 4) - 0.5) * 330
    const tcx = centerX + spread
    const tcy = pocketTop - 88 + FILE_H / 2 - rnd(i, 5) * 30
    const tTilt = spread / 26 + (rnd(i, 6) - 0.5) * 6

    return {
      spawn,
      land,
      scx,
      scy,
      sTilt,
      tcx,
      tcy,
      tTilt,
      amount: AMOUNTS[i % AMOUNTS.length],
    }
  })
}

// ── tarjeta-factura ──────────────────────────────────────────────────────────
function InvoiceCard({ file, frame }: { file: FileSpec; frame: number }) {
  if (frame < file.spawn - 0.001) return null // aún no ha salido

  const p = smoother(clamp01((frame - file.spawn) / FILE_FLIGHT))
  const cx = lerp(file.scx, file.tcx, p)
  const cy = lerp(file.scy, file.tcy, p)
  const tilt = lerp(file.sTilt, file.tTilt, p)
  const opacity = clamp01(p / 0.16)

  // Escala de entrada (1.12→1) + leve "squash" al aterrizar (últimas frames).
  const land01 = clamp01((p - 0.82) / 0.18)
  const squash = Math.sin(land01 * Math.PI) * 0.06
  const scale = lerp(1.12, 1, p)
  const sx = scale * (1 + squash * 0.6)
  const sy = scale * (1 - squash)

  const paper = elevation(theme, { depth: 'raised', distance: 7, blur: 16, radius: 14 })

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - FILE_W / 2,
        top: cy - FILE_H / 2,
        width: FILE_W,
        height: FILE_H,
        transform: `rotate(${tilt}deg) scale(${sx}, ${sy})`,
        transformOrigin: '50% 70%',
        opacity,
        ...paper,
        background: '#fbfbff',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 9,
        fontFamily: TEXT_FONT,
      }}
    >
      {/* franja superior azul (lomo de la factura) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 6,
          background: KIT_BLUE,
          borderRadius: '14px 14px 0 0',
          opacity: 0.9,
        }}
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 2 }}>
        <Icon name="invoice" size={20} color={KIT_BLUE} strokeWidth={2} />
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.textStrong, letterSpacing: -0.3 }}>
          Factura
        </span>
      </div>
      {/* líneas de contenido simuladas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 2 }}>
        {[0.95, 0.7, 0.85, 0.5].map((w, i) => (
          <div
            key={i}
            style={{
              height: 6,
              width: `${w * 100}%`,
              borderRadius: 3,
              background: theme.gridLine,
            }}
          />
        ))}
      </div>
      <span
        style={{
          marginTop: 'auto',
          alignSelf: 'flex-end',
          fontSize: 13,
          fontWeight: 600,
          color: theme.textMuted,
        }}
      >
        {file.amount}
      </span>
    </div>
  )
}

// ── carpeta neumórfica (pestaña + pared trasera + bolsillo delantero) ─────────
function FolderBack({ left, top }: { left: number; top: number }) {
  const panel = elevation(theme, { depth: 'raised', distance: 10, blur: 26, radius: 26 })
  return (
    <>
      {/* pestaña */}
      <div
        style={{
          position: 'absolute',
          left: left + 26,
          top: top - 46,
          width: 232,
          height: 74,
          borderRadius: '20px 20px 0 0',
          ...panel,
        }}
      />
      {/* pared trasera */}
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: FOLDER_W,
          height: FOLDER_H,
          borderRadius: 26,
          ...panel,
        }}
      />
    </>
  )
}

function FolderFront({
  left,
  top,
  count,
  total,
  sweep,
}: {
  left: number
  top: number
  count: number
  total: number
  sweep: number
}) {
  const pocket = elevation(theme, { depth: 'raised', distance: 12, blur: 28, radius: 26 })
  const pill = elevation(theme, { depth: 'recessed', distance: 4, blur: 10, radius: 999 })
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: FOLDER_W,
        height: 250,
        borderRadius: '14px 14px 26px 26px',
        ...pocket,
        background: theme.surface,
      }}
    >
      {/* labio del bolsillo (línea azul fina) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: 4,
          background: KIT_BLUE,
          opacity: 0.85,
          borderRadius: '14px 14px 0 0',
        }}
      />
      {/* etiqueta + contador */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 96,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span
            style={{
              fontFamily: DISPLAY_FONT,
              fontSize: 34,
              fontWeight: 600,
              color: theme.textStrong,
              letterSpacing: -0.8,
            }}
          >
            Facturas
          </span>
          {/* subrayado azul que barre al final */}
          <div
            style={{
              marginTop: 6,
              height: 4,
              width: `${sweep * 100}%`,
              maxWidth: 220,
              borderRadius: 2,
              background: KIT_BLUE,
            }}
          />
        </div>
        <div
          style={{
            ...pill,
            minWidth: 86,
            height: 52,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 16px',
            fontFamily: DISPLAY_FONT,
            fontSize: 28,
            fontWeight: 700,
            color: KIT_BLUE,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
          <span style={{ fontSize: 15, color: theme.textMuted, marginLeft: 4 }}>/{total}</span>
        </div>
      </div>
    </div>
  )
}

// ── composición ──────────────────────────────────────────────────────────────
export function InvoiceIngestScene() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const folderCenterY = H * 0.58
  const backTop = folderCenterY - FOLDER_H / 2
  const backLeft = W / 2 - FOLDER_W / 2
  const pocketTop = folderCenterY - 26 // labio del bolsillo

  const files = buildFiles(W, pocketTop)
  const landed = files.filter((f) => frame >= f.land).length

  // Entrada de la carpeta (sube + aparece) y remate (push-in al final).
  const rise = smoother(clamp01(frame / FOLDER_RISE))
  const tail = smoother(clamp01((frame - LAST_LAND) / HOLD))

  // Latido sumando un impulso corto por cada factura que aterriza.
  let pulse = 0
  for (const f of files) {
    const d = frame - f.land
    if (d >= 0 && d < 10) pulse += Math.sin((d / 10) * Math.PI) * 0.012
  }

  const fill = landed / FILE_COUNT
  const push = tail * 0.06
  const folderScale = rise * (1 + pulse + push)

  const stage: CSSProperties = {
    transform: `translateY(${(1 - rise) * 26}px) scale(${folderScale})`,
    transformOrigin: `${W / 2}px ${folderCenterY}px`,
    opacity: rise,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, ...stage }}>
          {/* resplandor azul que crece a medida que se llena */}
          <div
            style={{
              position: 'absolute',
              left: W / 2 - 360,
              top: folderCenterY - 220,
              width: 720,
              height: 520,
              borderRadius: 999,
              background: `radial-gradient(closest-side, ${KIT_BLUE}, transparent)`,
              opacity: 0.04 + 0.16 * fill + 0.12 * tail,
              filter: 'blur(8px)',
            }}
          />
          <FolderBack left={backLeft} top={backTop} />
          {files.map((f, i) => (
            <InvoiceCard key={i} file={f} frame={frame} />
          ))}
          <FolderFront
            left={backLeft}
            top={pocketTop}
            count={landed}
            total={FILE_COUNT}
            sweep={tail}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}
