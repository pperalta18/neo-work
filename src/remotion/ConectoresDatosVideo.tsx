import { type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { BRAND, CELL } from '@/lib/neumorphism'
import { FlowPlate, GridLines, theme } from './storeFlowScene'
import { Fonts, BODY_FONT } from './fonts'

/**
 * ConectoresDatosVideo — la línea de proceso ATRAVIESA los conectores (el reverso
 * de «Conectores (rodeo)», que los esquiva). En PRIMER PLANO una línea recta de
 * cuadrados elevados con flechas pasa POR DENTRO de las apps reales (Outlook ·
 * Notion · Gmail · Jira · Zapier); al pasar la cámara por cada una florece en el
 * FONDO su «mar de datos»: fragmentos crudos en texto plano — los datos asociados a
 * ESA app — sin cards y sin rotar, y cada pieza ANIMA su destacado (subrayado /
 * recuadro / marcador / tachado se DIBUJAN).
 *
 * LOOP PERFECTO por paneo infinito: la tira de apps se repite cada 5 (patrón) y la
 * cámara avanza exactamente UN periodo por loop, así que el frame 0 y el frame
 * DURATION renderizan idéntico. Todo es función de useCurrentFrame() (solo
 * rnd(seed)+frame); el mar usa ciclos cuyo periodo divide el loop. El primer plano
 * reusa FlowPlate / GridLines de storeFlowScene; el fondo es propio.
 */

type BrandKey = keyof typeof BRAND
type LogoName = 'outlook' | 'notion' | 'gmail' | 'jira' | 'zapier'

// ── math ─────────────────────────────────────────────────────────────────────────
const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoother = (x: number) => { const t = clamp01(x); return t * t * t * (t * (t * 6 - 15) + 10) }
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3)
const rnd = (n: number) => {
  let t = (Math.imul(n | 0, 1103515245) + 12345) & 0x7fffffff
  t ^= t >> 13
  return (Math.imul(t, 2654435761) >>> 0) / 4294967296
}
const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

const MONO = "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace"

// ── geometría del mundo (tira recta, periódica) ──────────────────────────────────
const ROW_MID = 5 // fila central (1-based) por la que pasa la línea
const cx = (col: number) => (col - 0.5) * CELL
const cy = (row: number) => (row - 0.5) * CELL
const ROWS = 9
const WORLD_H = ROWS * CELL

const PATTERN: LogoName[] = ['outlook', 'notion', 'gmail', 'jira', 'zapier']
const SPACING = 7 // columnas entre apps
const PERIOD_COLS = PATTERN.length * SPACING // 35 → tras esto la tira se repite
const PERIOD_PX = PERIOD_COLS * CELL
const CENTER_COL = 10 // columna del mundo centrada en pantalla en off=0 (una app)
const APP0_COL = 3
const APP_K = 8 // instancias de app renderizadas (cubren viewport durante todo el loop)
const APPS: ReadonlyArray<{ name: LogoName; col: number }> = Array.from({ length: APP_K }, (_, k) => ({
  name: PATTERN[k % PATTERN.length],
  col: APP0_COL + k * SPACING,
}))
const CHEVRON_COLS = 62 // línea continua de chevrons que cubre la tira
const WORLD_W = CHEVRON_COLS * CELL
const VISIBLE_COLS = 8

// ── loop ──────────────────────────────────────────────────────────────────────────
const CYCLE_D = 40 // ciclo de vida de un fragmento del mar
const LOOP_REPEATS = 12 // rondas por loop → DURATION múltiplo de CYCLE_D (loop perfecto)
export const CONECTORES_DATOS_DURATION = CYCLE_D * LOOP_REPEATS // 480
const LOOP = CONECTORES_DATOS_DURATION

// la cámara avanza exactamente un periodo de la tira por loop
const offAt = (frame: number) => (frame / LOOP) * PERIOD_PX

// envelope del mar de una app según su proximidad al centro (limpio entre apps).
// Banda algo más estrecha que el frente de las flechas → el mar florece DESPUÉS de
// que la flecha topa con el logo, no antes.
const appEnv = (appCol: number, centerCol: number) => smoother(clamp01((2.2 - Math.abs(appCol - centerCol)) / 1.6))

// las FLECHAS EMERGEN al avanzar la línea: a la derecha del frente aún no han salido,
// y van elevándose conforme se acercan al centro; a la izquierda ya están arriba y se
// quedan. El frente LIDERA ligeramente al mar, de modo que la flecha "topa" con el
// logo (queda elevada) justo antes de que florezcan sus datos en el centro. Como sólo
// depende del offset EN PANTALLA (col − centerCol) y el mundo es periódico, loopea.
const FRONT_COL = 3.5 // cuánto se adelanta el frente de emergencia respecto al centro
const EMERGE_RAMP = 2.5 // columnas que tarda una flecha en elevarse del todo
const chevronGrow = (col: number, centerCol: number) => smoother(clamp01((FRONT_COL - (col - centerCol)) / EMERGE_RAMP))

// ── destacado ANIMADO (se dibuja con p: 0→1; em-based → escala con el font) ───────
type Mk = 'underline' | 'box' | 'marker' | 'strike' | 'bracket'
function HiSpan({ children, p, k, c }: { children: ReactNode; p: number; k: Mk; c: BrandKey }) {
  const color = BRAND[c]
  const lit = p > 0.04
  let mark: ReactNode = null
  if (k === 'underline') {
    mark = <span style={{ position: 'absolute', left: 0, right: 0, bottom: '-0.1em', height: '0.11em', borderRadius: 2, background: color, transformOrigin: 'left center', transform: `scaleX(${p})`, boxShadow: `0 0 0.4em ${hexA(color, 0.5 * p)}` }} />
  } else if (k === 'strike') {
    mark = <span style={{ position: 'absolute', left: 0, right: 0, top: '0.52em', height: '0.1em', borderRadius: 2, background: color, transformOrigin: 'left center', transform: `scaleX(${p})` }} />
  } else if (k === 'box') {
    const q = clamp01(p * 1.25)
    mark = <span style={{ position: 'absolute', inset: '-0.12em -0.22em', borderRadius: '0.28em', boxShadow: `inset 0 0 0 0.1em ${hexA(color, 0.85 * q)}`, background: hexA(color, 0.1 * q), transform: `scale(${1.08 - 0.08 * q})` }} />
  } else if (k === 'marker') {
    mark = (
      <span style={{ position: 'absolute', inset: '-0.06em -0.16em', borderRadius: '0.16em', overflow: 'hidden' }}>
        <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.82)} 8%, ${hexA(color, 0.72)} 92%, ${hexA(color, 0)} 100%)`, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }} />
      </span>
    )
  } else {
    return (
      <span style={{ position: 'relative', whiteSpace: 'nowrap' }}>
        <span style={{ color, fontWeight: 700, opacity: p }}>[</span>
        <span style={{ color: lit ? '#1e1e20' : 'inherit', fontWeight: p > 0.35 ? 600 : 400 }}>{children}</span>
        <span style={{ color, fontWeight: 700, opacity: p }}>]</span>
      </span>
    )
  }
  return (
    <span style={{ position: 'relative', whiteSpace: 'nowrap', display: 'inline-block' }}>
      {mark}
      <span style={{ position: 'relative', color: k === 'marker' ? '#16203a' : lit ? '#1e1e20' : undefined, fontWeight: p > 0.35 ? 600 : 400 }}>{children}</span>
    </span>
  )
}

// ── catálogo de datos por app (texto plano; cada fragmento, un destacado) ─────────
type Frag = { a: string; h: string; b?: string; k: Mk; c: BrandKey; mono?: boolean }
const APP_DATA: Record<LogoName, Frag[]> = {
  outlook: [
    { a: 'Asunto: RE: ', h: 'presupuesto', b: ' revisión', k: 'marker', c: 'blue' },
    { a: 'Bandeja de entrada ', h: '(47)', k: 'box', c: 'blue', mono: true },
    { a: 'De: ', h: 'laura@empresa.com', k: 'underline', c: 'teal', mono: true },
    { a: 'Reunión · 10:00 · ', h: 'Sala 3', k: 'box', c: 'violet' },
    { a: 'FW: ', h: 'contrato_firmado.pdf', k: 'marker', c: 'orange', mono: true },
    { a: 'Solicitud de reunión ', h: 'aceptada', k: 'underline', c: 'green' },
    { a: 'Calendario · ', h: '17 jun', k: 'box', c: 'blue' },
    { a: 'Exchange · ', h: 'sincronizando…', k: 'marker', c: 'teal', mono: true },
    { a: 'Adjunto: ', h: 'factura_2212.pdf', k: 'underline', c: 'orange', mono: true },
    { a: 'Prioridad: ', h: 'alta', k: 'box', c: 'red' },
    { a: 'Borradores ', h: '(3)', k: 'bracket', c: 'violet', mono: true },
    { a: 'CC: ', h: 'equipo@empresa.com', k: 'underline', c: 'blue', mono: true },
    { a: 'No leído desde ', h: 'ayer', k: 'marker', c: 'orange' },
    { a: 'Responder a ', h: 'todos', k: 'box', c: 'blue' },
    { a: 'Categoría: ', h: 'Seguimiento', k: 'underline', c: 'violet' },
    { a: 'Spam movido ', h: 'a la papelera', k: 'strike', c: 'red' },
  ],
  notion: [
    { a: '/ ', h: 'Untitled', k: 'marker', c: 'violet', mono: true },
    { a: 'Página · ', h: 'Roadmap Q3', k: 'underline', c: 'blue' },
    { a: 'Base de datos · ', h: 'Tareas', k: 'box', c: 'teal' },
    { a: 'Estado = ', h: 'En curso', k: 'box', c: 'orange' },
    { a: 'Toggle ▸ ', h: 'Notas de reunión', k: 'underline', c: 'violet' },
    { a: '@menciona a ', h: 'Marco', k: 'marker', c: 'blue' },
    { a: 'Relación → ', h: 'Proyectos', k: 'underline', c: 'teal', mono: true },
    { a: 'Tablero · ', h: 'Kanban', k: 'box', c: 'violet' },
    { a: 'Bloque: ', h: 'callout 💡', k: 'marker', c: 'orange' },
    { a: 'Plantilla · ', h: 'Wiki de equipo', k: 'underline', c: 'blue' },
    { a: 'Filtro: Asignado = ', h: 'yo', k: 'box', c: 'green', mono: true },
    { a: 'Editado hace ', h: '2 min', k: 'marker', c: 'teal' },
    { a: 'Propiedad: ', h: 'Fecha límite', k: 'underline', c: 'red' },
    { a: 'Vista · ', h: 'Calendario', k: 'box', c: 'violet' },
    { a: 'Subpágina ', h: 'archivada', k: 'strike', c: 'orange' },
    { a: 'Comentario de ', h: 'Ana', k: 'bracket', c: 'blue' },
  ],
  gmail: [
    { a: 'Etiqueta: ', h: 'Importante', k: 'box', c: 'red' },
    { a: 'Destacados ', h: '(12)', k: 'bracket', c: 'orange', mono: true },
    { a: 'Promociones · ', h: '87 nuevos', k: 'marker', c: 'green', mono: true },
    { a: 'Filtro: ', h: 'de:facturas@', k: 'underline', c: 'blue', mono: true },
    { a: 'Hilo · ', h: '6 mensajes', k: 'box', c: 'violet', mono: true },
    { a: 'Adjunto · ', h: 'informe.xlsx', k: 'underline', c: 'green', mono: true },
    { a: 'Buscar: ', h: 'has:attachment', k: 'marker', c: 'blue', mono: true },
    { a: 'De: ', h: 'no-reply@stripe.com', k: 'underline', c: 'teal', mono: true },
    { a: 'Responder · ', h: 'Reenviar', k: 'box', c: 'red' },
    { a: 'Movido a ', h: 'Recibidos', k: 'marker', c: 'orange' },
    { a: 'Spam ', h: '(0)', k: 'bracket', c: 'green', mono: true },
    { a: 'Asunto: ', h: 'Tu pedido ha salido', k: 'underline', c: 'blue' },
    { a: 'Estrella ', h: 'añadida', k: 'box', c: 'orange' },
    { a: 'Snooze hasta ', h: 'mañana 9:00', k: 'marker', c: 'violet' },
    { a: 'Archivado ', h: 'automáticamente', k: 'strike', c: 'red' },
    { a: 'Borrador ', h: 'guardado', k: 'underline', c: 'teal' },
  ],
  jira: [
    { a: '', h: 'PROJ-1042', b: ' · En progreso', k: 'box', c: 'blue', mono: true },
    { a: 'Sprint 24 · ', h: '8 pts', k: 'marker', c: 'green', mono: true },
    { a: 'Épica → ', h: 'Buscador', k: 'underline', c: 'violet' },
    { a: 'Estado: To Do → ', h: 'Done', k: 'box', c: 'green' },
    { a: 'Asignado: ', h: 'Laura', k: 'underline', c: 'blue' },
    { a: 'Backlog ', h: '(213)', k: 'bracket', c: 'orange', mono: true },
    { a: 'Tipo: ', h: 'Bug · crítico', k: 'box', c: 'red' },
    { a: 'Story points: ', h: '5', k: 'box', c: 'teal', mono: true },
    { a: 'Tablero · ', h: 'Sprint activo', k: 'underline', c: 'blue' },
    { a: '', h: 'PROJ-1043', b: ' bloqueado', k: 'strike', c: 'red', mono: true },
    { a: 'Comentario ', h: 'añadido', k: 'marker', c: 'violet' },
    { a: 'Prioridad: ', h: 'Highest', k: 'box', c: 'red' },
    { a: 'Versión: ', h: 'v3.2.0', k: 'underline', c: 'teal', mono: true },
    { a: 'Transición → ', h: 'In Review', k: 'marker', c: 'orange' },
    { a: 'Etiqueta: ', h: 'backend', k: 'bracket', c: 'blue', mono: true },
    { a: 'Estimación: ', h: '2 d', k: 'box', c: 'green', mono: true },
  ],
  zapier: [
    { a: 'Trigger: ', h: 'Nuevo email', k: 'box', c: 'orange' },
    { a: 'Zap ', h: 'activado ✓', k: 'underline', c: 'green' },
    { a: 'When this → ', h: 'Then that', k: 'marker', c: 'orange' },
    { a: 'Webhook · ', h: 'POST', k: 'box', c: 'blue', mono: true },
    { a: 'Filtro: solo si ', h: 'importe > 0', k: 'underline', c: 'teal', mono: true },
    { a: 'Tarea ', h: 'completada', k: 'marker', c: 'green' },
    { a: 'Ruta ', h: 'A / B', k: 'bracket', c: 'violet', mono: true },
    { a: '', h: '1.204 tareas', b: ' este mes', k: 'box', c: 'orange', mono: true },
    { a: 'Acción: ', h: 'Crear fila', k: 'underline', c: 'blue' },
    { a: 'Historial · ', h: 'ejecución 88', k: 'marker', c: 'teal', mono: true },
    { a: 'Paso 3: ', h: 'Formatear fecha', k: 'underline', c: 'violet' },
    { a: 'Reintento ', h: 'en 5 s', k: 'box', c: 'red', mono: true },
    { a: 'App: ', h: 'Google Sheets', k: 'marker', c: 'green' },
    { a: 'Estado: ', h: 'On', k: 'box', c: 'green' },
    { a: 'Error: ', h: 'tiempo agotado', k: 'strike', c: 'red' },
    { a: 'Delay · ', h: '15 min', k: 'underline', c: 'orange', mono: true },
  ],
}

// ── un fragmento del mar (posición fija, sin rotar; opacidad + destacado animado) ─
const DSEED = 9173
const TIN = 5
const TOUT = 9
const HSTART = 6
const HDRAW = 13
const LIFES = [30, 34, 38]

// ciclo de vida loopeable: el contenido se elige por (semilla, ronda mod R) para que
// el frame 0 y el frame LOOP (que difieren en LOOP/CYCLE_D rondas) coincidan.
const R = LOOP_REPEATS
function seaState(seed: number, frame: number, env: number) {
  const ph = Math.floor(rnd(seed) * CYCLE_D)
  const local = (((frame - ph) % CYCLE_D) + CYCLE_D) % CYCLE_D
  const round = Math.floor((frame - ph + CYCLE_D * 4096) / CYCLE_D) % R
  const rs = seed * 17 + round * 131
  const life = LIFES[Math.floor(rnd(rs + 1) * LIFES.length)]
  if (local >= life) return null
  const op = Math.min(easeOut(clamp01(local / TIN)), clamp01((life - local) / TOUT)) * env
  if (op <= 0.004) return null
  return { op, hp: clamp01((local - HSTART) / HDRAW), rs }
}

function DataSea({ app, appCol, frame, centerCol }: { app: LogoName; appCol: number; frame: number; centerCol: number }) {
  const env = appEnv(appCol, centerCol)
  if (env <= 0.01) return null
  const frags = APP_DATA[app]
  const pi = PATTERN.indexOf(app) // semilla por NOMBRE → todas las instancias iguales

  const COLS_N = 8
  const ROWS_N = 6
  const nodes: ReactNode[] = []
  for (let ci = 0; ci < COLS_N; ci += 1) {
    for (let ri = 0; ri < ROWS_N; ri += 1) {
      const idx = ci * ROWS_N + ri
      const seed = DSEED + pi * 1000 + idx
      const colF = appCol - 3.5 + (ci + 0.5) * (7 / COLS_N) + (rnd(seed + 3) * 2 - 1) * 0.4
      const rowF = 1.9 + (ri + 0.5) * (5.4 / ROWS_N) + (rnd(seed + 5) * 2 - 1) * 0.35
      const r = seaState(seed, frame, env)
      if (!r) continue
      const f = frags[Math.floor(rnd(r.rs + 7) * frags.length)]
      nodes.push(
        <div
          key={idx}
          style={{
            position: 'absolute',
            left: cx(colF),
            top: cy(rowF),
            transform: 'translate(-50%, -50%)',
            opacity: r.op,
            fontFamily: f.mono ? MONO : BODY_FONT,
            fontSize: 10.5,
            lineHeight: 1.3,
            color: '#586074',
            whiteSpace: 'nowrap',
            letterSpacing: f.mono ? 0 : -0.1,
          }}
        >
          {f.a}
          <HiSpan p={r.hp} k={f.k} c={f.c}>{f.h}</HiSpan>
          {f.b}
        </div>,
      )
    }
  }
  return <>{nodes}</>
}

// ── la pieza ──────────────────────────────────────────────────────────────────────
export function ConectoresDatosVideo() {
  const frame = useCurrentFrame()
  const { width: W, height: H } = useVideoConfig()

  const off = offAt(frame)
  const Px = cx(CENTER_COL) + off
  const Py = cy(ROW_MID)
  const centerCol = Px / CELL + 0.5

  // paneo lateral LINEAL: zoom constante, sin push al pasar cada app
  const Z = W / (VISIBLE_COLS * CELL)

  const camera: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    transformOrigin: '0 0',
    transform: `translate(${W / 2 - Px * Z}px, ${H / 2 - Py * Z}px) scale(${Z})`,
  }

  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface }}>
      <Fonts />
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <div style={camera}>
          <div style={{ position: 'relative', width: WORLD_W, height: WORLD_H }}>
            {/* ── FONDO: el mar de datos de cada app (recesado: dim + leve blur) ── */}
            <div style={{ position: 'absolute', inset: 0, filter: 'blur(0.4px)' }}>
              {APPS.map((a, i) => (
                <DataSea key={i} app={a.name} appCol={a.col} frame={frame} centerCol={centerCol} />
              ))}
            </div>
            {/* velo que empuja el mar al fondo */}
            <div style={{ position: 'absolute', inset: 0, background: theme.surface, opacity: 0.16 }} />

            {/* ── PRIMER PLANO: grid + flechas elevadas que EMERGEN al avanzar ── */}
            <GridLines />
            {Array.from({ length: CHEVRON_COLS }, (_, i) => {
              const col = i + 1
              const grow = chevronGrow(col, centerCol)
              if (grow <= 0.001) return null
              return <FlowPlate key={`c${i}`} step={{ at: [col, ROW_MID] }} dir="right" grow={grow} />
            })}

            {/* las apps reales, en placas elevadas — la línea pasa POR DENTRO */}
            {APPS.map((a, i) => (
              <FlowPlate
                key={`a${i}`}
                step={{ at: [a.col, ROW_MID] }}
                dir="right"
                grow={1}
                iconNode={<Img src={staticFile(`connectors/${a.name}.svg`)} style={{ width: 52, height: 52, objectFit: 'contain', display: 'block' }} />}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
      {/* viñeta sutil */}
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: `inset 0 0 260px ${hexA('#0b1020', 0.16)}` }} />
    </AbsoluteFill>
  )
}
