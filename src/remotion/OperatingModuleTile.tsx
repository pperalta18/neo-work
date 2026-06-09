/**
 * OperatingModuleTile — un módulo AiKit "en funcionamiento".
 * ──────────────────────────────────────────────────────────────────────────
 * El lenguaje visual compartido para representar un módulo trabajando (p. ej.
 * DocuSense ingiriendo documentos en el clip de E-Commerce). En reposo es una
 * **placa cuadrada neumórfica unitaria** —misma familia que las pastillas del
 * grid, pero con algo más de relieve— con el icono de marca centrado. Cuando se
 * activa —`expand` sube a 1— la placa **se expande hacia AMBOS lados** (queda
 * centrada donde está) y revela un estado ("Procesando documentos…") con un
 * **shimmer sutil** sobre el texto.
 *
 * Geometría **simétrica y de ancho intrínseco**: el ancla `(x, y)` es el **centro
 * de la placa** (no del icono), así que tanto en reposo como expandida queda
 * centrada en el mismo punto — no hay que "ponerla a la izquierda" para compensar.
 * El ancho lo fija el contenido (icono + texto), con el **mismo padding a ambos
 * lados**; al abrirse, el icono se desliza a la izquierda del centro y el texto
 * aparece a la derecha, manteniendo el conjunto centrado.
 *
 * El icono **no se anima**: la reacción tipo Rive no se puede replicar de forma
 * determinista por frame (y el `.riv` real no se captura bien en `renderMedia`),
 * así que el icono queda estático y limpio. Todo lo que se mueve —la apertura de
 * la placa y el shimmer del estado— se deriva de las props `frame`/`expand`,
 * idéntico en el preview de Remotion Studio y en el MP4 exportado.
 *
 * Posicionamiento: si se pasan `x`/`y`, el componente se ancla en absoluto y se
 * centra ahí (`translate(-50%, -50%)`); si se omiten, se renderiza como bloque
 * `inline-flex` para componerlo dentro de un layout flex (lo centra el padre).
 */

import { elevation, lightTheme, KIT_BLUE, DISPLAY_FONT } from '@/lib/neumorphism'
import { MODULES, type ModuleName, type ModuleSpec } from '@/stories/neo/modules/modules'

const theme = lightTheme

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Quintic smootherstep — sin tirón al arrancar ni al parar. */
function smoother(x: number): number {
  const t = clamp01(x)
  return t * t * t * (t * (t * 6 - 15) + 10)
}

export type OperatingModuleTileProps = {
  /** Centro de la PLACA (no del icono). Si se omiten `x`/`y`, el componente se
   *  renderiza inline para componerlo en un layout flex. */
  x?: number
  y?: number
  /** Módulo cuyo icono de marca protagoniza la placa. */
  module: ModuleName
  /** Módulo secundario opcional: si se da, la placa muestra AMBOS iconos juntos
   *  (p. ej. DocuSense + Junction trabajando en pareja). En reposo la placa deja
   *  de ser cuadrada y se ensancha para acoger los dos iconos. */
  secondary?: ModuleName
  /** Texto de estado que se revela al expandirse ("Procesando documentos…"). */
  status: string
  /** Frame actual — sólo para la fase del shimmer (determinista). */
  frame: number
  /** 0..1 — cuánto se ha abierto la placa + revelado del estado. */
  expand: number
  /** Lado de la placa cuadrada en px. */
  size?: number
}

/** Separación icono↔texto cuando la placa está abierta. */
const GAP = 16
/** Ancho máximo reservado para el texto (cota del revelado; el ancho real lo
 *  fija el propio texto, siempre ≤ esto, así el padding derecho nunca sobra). */
const TEXT_MAX = 320

/**
 * Shimmer sutil sobre el texto de estado: una banda clara que barre el texto en
 * bucle, derivada del frame (sin CSS animations de tiempo real).
 */
function shimmerStyle(frame: number) {
  const cycle = 96 // frames por barrido
  const t = (frame % cycle) / cycle
  const pos = lerp(-30, 130, t)
  const gradient = `linear-gradient(100deg,
    ${theme.textMuted} 0%,
    ${theme.textMuted} 40%,
    ${KIT_BLUE} 48%,
    #d7e8ff 50%,
    ${KIT_BLUE} 52%,
    ${theme.textMuted} 60%,
    ${theme.textMuted} 100%)`
  return {
    background: gradient,
    backgroundSize: '230% 100%',
    backgroundPosition: `${pos}% 50%`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    color: 'transparent',
  } as const
}

export function OperatingModuleTile({
  x,
  y,
  module,
  secondary,
  status,
  frame,
  expand,
  size = 132,
}: OperatingModuleTileProps) {
  const spec: ModuleSpec = MODULES[module]
  const spec2: ModuleSpec | null = secondary ? MODULES[secondary] : null
  const e = smoother(clamp01(expand))

  const radius = Math.round(size * 0.22)
  const plate = elevation(theme, { depth: 'raised', distance: 14, blur: 32, radius })

  // Icono algo más pequeño que el badge normal. El padding horizontal de la
  // placa = el aire vertical del icono → en reposo la placa es cuadrada (lado
  // `size`) y el padding queda IGUAL por los cuatro lados.
  const iconSize = Math.round(size * 0.46)
  const padX = (size - iconSize) / 2
  // Separación entre los dos iconos cuando hay módulo secundario.
  const pairGap = Math.round(iconSize * 0.24)

  // Revelado del texto: opacidad que entra un poco después de empezar a abrir.
  const textReveal = smoother(clamp01((e - 0.15) / 0.6))

  const renderIcon = (s: ModuleSpec) => (
    <img
      src={s.icon}
      alt={s.name}
      width={iconSize}
      height={iconSize}
      style={{
        display: 'block',
        flexShrink: 0,
        transform: s.rotate ? `rotate(${s.rotate}deg)` : undefined,
        transformOrigin: '50% 50%',
      }}
    />
  )

  // Uno o dos iconos de marca. Con dos, van en un flex con `pairGap` y la placa
  // deja de ser cuadrada en reposo (se ensancha lo justo para acogerlos).
  const iconBlock = spec2 ? (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: pairGap, flexShrink: 0 }}>
      {renderIcon(spec)}
      {renderIcon(spec2)}
    </div>
  ) : (
    renderIcon(spec)
  )

  // La placa: inline-flex de ancho intrínseco. En reposo (e=0) el hueco del
  // texto vale 0 y el gap 0 → queda exactamente cuadrada; al abrirse crece hacia
  // ambos lados (la centra el wrapper con translate / el padre flex).
  const core = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: size,
        paddingLeft: padX,
        paddingRight: padX,
        gap: e * GAP,
        overflow: 'hidden',
        ...plate,
      }}
    >
      {iconBlock}

      {/* hueco del texto: su ancho = min(ancho real del texto, e·TEXT_MAX), así
          revela de izquierda a derecha y el padding derecho queda justo. */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          height: size,
          maxWidth: e * TEXT_MAX,
          overflow: 'hidden',
          opacity: textReveal,
        }}
      >
        <span
          style={{
            fontFamily: DISPLAY_FONT,
            fontSize: 21,
            fontWeight: 600,
            letterSpacing: -0.5,
            whiteSpace: 'nowrap',
            ...shimmerStyle(frame),
          }}
        >
          {status}
        </span>
      </div>
    </div>
  )

  // Con coordenadas → anclado y centrado en (x, y). Sin ellas → inline (lo
  // centra el layout flex del padre).
  if (x != null && y != null) {
    return (
      <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}>
        {core}
      </div>
    )
  }
  return core
}
