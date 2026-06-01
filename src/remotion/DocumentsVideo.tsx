import { type CSSProperties } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { BRAND } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'

/**
 * DocumentsVideo — un alud de documentos vistos MUY de cerca, cortados a toda
 * velocidad. Cada uno es un documento real (con encabezados, columnas, fotos,
 * figuras…) del que vemos solo un trozo: el texto se sale por los cuatro bordes,
 * como si la cámara estuviera pegada a la página. Cambian papel, tipografía,
 * color e idioma, pero en TODOS la misma palabra está resaltada e incrustada a
 * mitad de una línea (con texto antes y después), y esa palabra cae siempre en
 * el centro exacto del cuadro. Es lo único que no se mueve.
 *
 * Centrado exacto sin medir el DOM (regla de la casa: render determinista):
 * la línea de la palabra es una fila flex [antes | PALABRA | después] donde
 * "antes" y "después" tienen `flex:1 1 0` con `min-width:0`, así que ocupan
 * exactamente la mitad del hueco cada uno y la PALABRA queda centrada en el
 * ancho de la página. El texto de cada lado va en `nowrap` y se desborda hacia
 * afuera (izquierda/derecha) → la frase continúa más allá de los bordes. El
 * resto de la página (líneas, encabezados, imágenes) se posiciona en absoluto
 * respecto a esa línea, de modo que nada desplaza la palabra del centro.
 *
 * Cambia KEYWORD por la palabra que quieras (y, si es muy larga, reajusta los
 * `before`/`after` para que la frase siga teniendo sentido).
 */

export const KEYWORD = 'datos'

// ── tipografías (stacks del sistema macOS + Universal Sans del proyecto) ───────
const F = {
  book: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
  serif: "Georgia, 'Times New Roman', serif",
  news: "'Times New Roman', Georgia, serif",
  mono: "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace",
  sans: BODY_FONT,
  display: "'Universal Sans Display', system-ui, sans-serif",
  humanist: "'Optima', 'Gill Sans', 'Avenir Next', sans-serif",
  hand: "'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive",
} as const

type MarkKind = 'marker' | 'box' | 'invert' | 'underline' | 'wavy' | 'circle' | 'bracket' | 'outline'

type ImgSpec = {
  src: string
  w: number
  h: number
  /** desplazamiento del CENTRO de la imagen respecto a la palabra (px). */
  dx: number
  dy: number
  caption?: string
  border?: boolean
  rotate?: number
}

type Doc = {
  paper: string
  ink: string
  font: string
  size: number
  lh: number
  pageW?: number
  align?: 'left' | 'center' | 'justify'
  italic?: boolean
  weight?: number
  letterSpacing?: number
  upper?: boolean
  rotate?: number
  mark: MarkKind
  markColor: string
  keyScale?: number
  /** Parte de la línea de la palabra que va ANTES (acaba pegada a la palabra). */
  before: string
  /** Parte de la línea de la palabra que va DESPUÉS. */
  after: string
  header?: string
  headerStyle?: CSSProperties
  /** Párrafo(s) por encima de la línea (admite \n). */
  above?: string
  /** Párrafo(s) por debajo de la línea. */
  below?: string
  image?: ImgSpec
  texture?: 'rules' | 'grid'
}

const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const lum = (hex: string) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
}

// ── la palabra marcada (inline, dentro de la línea) ─────────────────────────────
function Mark({ kind, color, ink, paper, scale }: { kind: MarkKind; color: string; ink: string; paper: string; scale: number }) {
  const word = KEYWORD
  const base: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    fontWeight: 800,
    whiteSpace: 'nowrap',
    fontSize: `${scale}em`,
    lineHeight: 1.05,
  }
  switch (kind) {
    case 'marker':
      return (
        <span
          style={{
            ...base,
            color: ink,
            padding: '0.04em 0.2em',
            borderRadius: '0.12em',
            transform: 'rotate(-1.3deg)',
            background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.92)} 5%, ${hexA(color, 0.84)} 92%, ${hexA(color, 0)} 100%)`,
          }}
        >
          {word}
        </span>
      )
    case 'box':
      return <span style={{ ...base, color: paper, background: color, padding: '0.08em 0.3em', borderRadius: '0.16em' }}>{word}</span>
    case 'invert':
      return (
        <span style={{ ...base, color: paper, background: ink, padding: '0.06em 0.28em', borderRadius: '0.06em', boxShadow: `inset 0 0 0 2px ${color}` }}>
          {word}
        </span>
      )
    case 'underline':
      return <span style={{ ...base, color: ink, paddingBottom: '0.04em', boxShadow: `inset 0 -0.2em 0 ${hexA(color, 0.55)}` }}>{word}</span>
    case 'wavy':
      return (
        <span
          style={{
            ...base,
            color: ink,
            textDecoration: 'underline',
            textDecorationStyle: 'wavy',
            textDecorationColor: color,
            textDecorationThickness: '0.07em',
            textUnderlineOffset: '0.16em',
          }}
        >
          {word}
        </span>
      )
    case 'bracket':
      return (
        <span style={{ ...base, color: ink }}>
          <span style={{ color, fontWeight: 800, padding: '0 0.1em' }}>[</span>
          {word}
          <span style={{ color, fontWeight: 800, padding: '0 0.1em' }}>]</span>
        </span>
      )
    case 'outline':
      return <span style={{ ...base, color: ink, padding: '0.05em 0.26em', borderRadius: '0.1em', boxShadow: `inset 0 0 0 0.09em ${color}` }}>{word}</span>
    case 'circle':
      return (
        <span style={{ ...base, color: ink, padding: '0.06em 0.34em' }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '-6%', top: '-34%', width: '112%', height: '168%', overflow: 'visible' }}>
            <ellipse cx="50" cy="50" rx="47" ry="40" fill="none" stroke={color} strokeWidth={3} vectorEffect="non-scaling-stroke" transform="rotate(-4 50 50)" />
            <ellipse cx="51" cy="51" rx="45" ry="37" fill="none" stroke={hexA(color, 0.5)} strokeWidth={2} vectorEffect="non-scaling-stroke" transform="rotate(3 50 50)" />
          </svg>
          {word}
        </span>
      )
  }
}

// ── el catálogo de documentos ──────────────────────────────────────────────────
const DOCS: Doc[] = [
  {
    // 0 · novela
    paper: '#f3ead6', ink: '#2a241c', font: F.book, size: 62, lh: 1.5, align: 'justify', pageW: 2300, rotate: -0.8,
    mark: 'marker', markColor: BRAND.yellow,
    header: 'CAPÍTULO · VII', headerStyle: { fontStyle: 'italic', letterSpacing: 3 },
    above: 'Tardé muchos años en entenderlo. Las luces, las prisas interminables, las avenidas que no terminaban nunca y los silencios espesos de la madrugada me parecían entonces el corazón de algo.',
    before: 'y entonces comprendí que la ciudad entera no era sino una inmensa y paciente colección de',
    after: 'que aguardaban en silencio a que alguien, por fin, se atreviera a leerlos en voz',
    below: 'alta. Y, sin embargo, nadie lo hacía jamás, porque leerlos de veras significaba aceptar todo aquello que decían de uno mismo sin haber pedido permiso para decirlo.',
  },
  {
    // 1 · periódico (foto de servidores a la izquierda)
    paper: '#f6f4ec', ink: '#15140f', font: F.news, size: 50, lh: 1.42, align: 'justify', pageW: 2500, rotate: 0.6,
    mark: 'underline', markColor: BRAND.red,
    header: 'EL OBSERVADOR · INVESTIGACIÓN · AÑO XLII', headerStyle: { letterSpacing: 1.5 },
    above: 'Fuentes próximas al caso confirmaron ayer por la tarde, tras meses de hermetismo absoluto y desmentidos, que',
    before: 'el origen de la filtración se localizó en un único e insospechado servidor repleto de',
    after: 'personales que la compañía juraba, por activa y por pasiva, haber destruido hacía ya tres',
    below: 'años. El portavoz no quiso hacer declaraciones. La comisión se reunirá de urgencia el lunes a primera hora para depurar responsabilidades.',
    image: { src: 'docs/news-photo.png', w: 1080, h: 840, dx: -560, dy: -150, caption: 'El centro de datos clausurado, en una imagen de archivo.' },
  },
  {
    // 2 · revista (foto de tinta arriba, a sangre)
    paper: '#fff4f8', ink: '#16131a', font: F.display, size: 60, lh: 1.34, align: 'left', pageW: 2200, weight: 700,
    mark: 'box', markColor: BRAND.pink,
    before: 'todos hablan de ellos, todos los persiguen sin descanso, pero muy pocos saben qué hacer con sus',
    after: 'una vez que dejan de ser una promesa reluciente y empiezan, de pronto, a pesar de',
    below: 'verdad. La nueva generación los trata como lo que siempre fueron: materia prima, oro discreto, la moneda con la que pagamos sin darnos ni cuenta.',
    image: { src: 'docs/magazine.png', w: 2280, h: 1080, dx: 0, dy: -720 },
  },
  {
    // 3 · contrato
    paper: '#ffffff', ink: '#222', font: F.serif, size: 50, lh: 1.55, align: 'justify', pageW: 2300, rotate: -0.5,
    mark: 'outline', markColor: '#555',
    header: 'CLÁUSULA 7.2 — TRATAMIENTO DE LA INFORMACIÓN', headerStyle: { letterSpacing: 1.5 },
    above: 'Reunidas las partes que al margen se identifican, y reconociéndose mutuamente capacidad legal suficiente para obligarse en los términos del presente documento,',
    before: 'el Prestador se obliga de forma expresa e irrevocable a no ceder, vender ni transferir los',
    after: 'a ningún tercero, salvo consentimiento previo, expreso y por escrito otorgado por el',
    below: 'Titular. El incumplimiento de lo aquí dispuesto facultará a la parte perjudicada para resolver el presente contrato con efectos inmediatos y sin previo aviso.',
  },
  {
    // 4 · cuaderno (rayas, tinta azul)
    paper: '#fbfbf3', ink: '#16387a', font: F.hand, size: 60, lh: 1.55, align: 'left', pageW: 2100, texture: 'rules', rotate: 0.7,
    mark: 'marker', markColor: BRAND.blue,
    header: 'Lunes, casi medianoche.', headerStyle: { fontStyle: 'italic' },
    above: 'Otra vez lo mismo. Se me olvidan justo las cosas importantes y recuerdo, en cambio, las que preferiría borrar para siempre.',
    before: 'nota para mí mismo: dejar de fingir que me acuerdo de todo y apuntar siempre los',
    after: 'porque la memoria, ya lo sabes de sobra, inventa muchísimo más de lo que de verdad',
    below: 'guarda. Mañana sin falta: llamar al banco, no mirar el móvil antes del café y escribir aunque no salga nada de nada.',
  },
  {
    // 5 · paper científico (gráfica arriba, en inglés)
    paper: '#ffffff', ink: '#1a1a1a', font: F.serif, size: 44, lh: 1.5, align: 'justify', pageW: 2400,
    mark: 'bracket', markColor: BRAND.blue,
    header: 'Nature · vol. 612 · Methods & Data', headerStyle: { letterSpacing: 1, color: '#666' },
    before: 'all measurements were independently reproduced across three separate sites, and the complete underlying',
    after: 'are available in the supplementary materials and the public repository upon reasonable',
    below: 'request. We thank the participating laboratories for their assistance during the trials. The authors declare no competing financial interests in this work.',
    image: { src: 'docs/chart.png', w: 1480, h: 1040, dx: 0, dy: -650, border: true, caption: 'Figura 3 — Curvas de crecimiento por cepa (n = 4).' },
  },
  {
    // 6 · folleto (producto a la derecha)
    paper: '#eaf6f1', ink: '#123129', font: F.humanist, size: 56, lh: 1.46, align: 'left', pageW: 2200, rotate: 0.4,
    mark: 'underline', markColor: BRAND.green,
    header: 'NUEVO', headerStyle: { letterSpacing: 5, color: BRAND.green, fontWeight: 700 },
    above: 'Lo diseñamos pensando en ti, en tu casa y en la tranquilidad de saber que todo queda exactamente donde tiene que quedar, sin que nadie más lo toque.',
    before: 'por fin, una forma sencilla, transparente y honesta de cuidar cada día tus',
    after: 'sin letra pequeña escondida, sin sorpresas de última hora y sin una sola',
    below: 'excusa. Disponible desde hoy en todas las tiendas. Treinta días de prueba: si no te convence, te devolvemos hasta el último céntimo.',
    image: { src: 'docs/product.png', w: 1120, h: 880, dx: 880, dy: 60 },
  },
  {
    // 7 · carta (cursiva)
    paper: '#f1ead9', ink: '#3a2f24', font: F.serif, size: 56, lh: 1.6, align: 'left', pageW: 2150, italic: true, rotate: -0.9,
    mark: 'wavy', markColor: BRAND.violet,
    header: 'Querida M.:', headerStyle: { fontStyle: 'italic', fontSize: 40 },
    above: 'Te escribo a mano, como antes, porque hay cosas que la pantalla no sabe sostener y se quedan frías antes de llegar.',
    before: 'no sé cómo decirte esto sin sonar distante, así que iré al grano: lo único que conservo de aquello son unos pocos',
    after: 'y la certeza, cada día más nítida y más terca, de que no volverán a repetirse',
    below: 'jamás. Cuídate mucho, anda. Riega las plantas del balcón, que este año, contra todo pronóstico, han aguantado el invierno. Tuyo, siempre.',
  },
  {
    // 8 · email
    paper: '#ffffff', ink: '#202124', font: F.sans, size: 50, lh: 1.55, align: 'left', pageW: 2300,
    mark: 'marker', markColor: BRAND.yellow,
    header: 'Para: equipo@empresa.com   ·   Asunto: URGENTE — revisar antes de las 18:00', headerStyle: { color: '#5f6368', fontSize: 34 },
    above: 'Buenas tardes a todos:',
    before: 'reenvío esto porque me da la sensación de que nadie ha revisado todavía los',
    after: 'del último despliegue, y si no me equivoco la mitad están duplicados o directamente',
    below: 'vacíos. Decidme algo antes de que acabe el día, por favor. No quiero que esto nos estalle el lunes delante del cliente. Gracias. — Marta',
  },
  {
    // 9 · manifiesto (negro, mayúsculas)
    paper: '#0a0a0a', ink: '#f5f5f5', font: F.display, size: 70, lh: 1.32, align: 'center', pageW: 2300, weight: 800, upper: true, letterSpacing: 1,
    mark: 'marker', markColor: BRAND.yellow, keyScale: 1.02,
    header: 'MANIFIESTO', headerStyle: { letterSpacing: 8 },
    above: 'Llevamos demasiado tiempo callados.',
    before: 'no somos el producto que se vende al mejor postor. somos, al fin y al cabo, los',
    after: 'y exigimos que nos devuelvan ahora mismo hasta el último de',
    below: 'ellos. Firma. Comparte. No mires hacia otro lado. Esto también va contigo.',
  },
  {
    // 10 · diccionario
    paper: '#fcfcf6', ink: '#222', font: F.serif, size: 50, lh: 1.5, align: 'left', pageW: 2300,
    mark: 'underline', markColor: BRAND.orange,
    header: 'datos  |  dá·tos  |  s. m. pl.', headerStyle: { fontStyle: 'italic' },
    above: '1. Antecedente necesario para llegar al conocimiento exacto de una cosa o para deducir las consecuencias legítimas de un hecho.',
    before: 'información dispuesta de manera adecuada para su tratamiento; conjunto ordenado de',
    after: 'a partir de los cuales se infiere o se deduce algo, a veces, con suerte, incluso la',
    below: 'verdad. 2. Inform. Información codificada de modo que pueda ser procesada por un ordenador. ▸ base de datos · dato sensible · protección de datos.',
  },
  {
    // 11 · especificación técnica (diagrama abajo)
    paper: '#ffffff', ink: '#1b2330', font: F.sans, size: 44, lh: 1.5, align: 'left', pageW: 2400,
    mark: 'box', markColor: BRAND.teal,
    header: 'ARQUITECTURA DEL SISTEMA · v3.2', headerStyle: { letterSpacing: 2, color: '#7a8499' },
    above: 'El flujo descrito a continuación garantiza consistencia eventual incluso ante la caída simultánea de varios nodos del clúster, sin pérdida de información confirmada.',
    before: 'cada nodo valida, firma criptográficamente y replica de forma asíncrona los',
    after: 'entrantes antes de confirmar la escritura definitiva en el registro distribuido',
    below: 'principal.',
    image: { src: 'docs/diagram.png', w: 1500, h: 980, dx: 0, dy: 640, border: true, caption: 'fig. 1 — Flujo de validación y replicación entre nodos.' },
  },
  {
    // 12 · poema
    paper: '#efe7d6', ink: '#2c2620', font: F.serif, size: 58, lh: 1.7, align: 'center', pageW: 1900, italic: true, rotate: -0.6,
    mark: 'circle', markColor: BRAND.purple,
    header: 'III', headerStyle: { letterSpacing: 4 },
    above: 'No me prometas nada esta vez.\nLas promesas también son',
    before: 'quédate un poco más, le dije, aunque solo seas el rumor de unos cuantos',
    after: 'que el viento de la mañana dispersará sin remedio antes de que yo',
    below: 'despierte.\nQuédate, simplemente, mientras dure la noche\ny la lámpara aguante encendida.',
  },
  {
    // 13 · terminal / log
    paper: '#0b1410', ink: '#6ee7a0', font: F.mono, size: 40, lh: 1.65, align: 'left', pageW: 2500,
    mark: 'box', markColor: '#0f5132',
    header: '~/cluster $ tail -f /var/log/sync.log', headerStyle: { color: '#3f7a5c' },
    above: '[ OK ]  03:14:02  conexión establecida con node-eu-west-1\n[INFO]  03:14:05  iniciando réplica incremental del lote 8841',
    before: '[WARN]  03:14:07  se perdieron 12 paquetes durante la sincronización de',
    after: 'reintentando la conexión con el nodo primario en 5 segundos... intento 3 de',
    below: '5\n[WARN]  03:14:12  latencia elevada (842 ms)\n[INFO]  03:14:13  cola de escritura: 1.204 registros pendientes',
  },
  {
    // 14 · HERO (cierre limpio, rotulador amarillo de la casa)
    paper: '#ffffff', ink: '#141414', font: F.display, size: 56, lh: 1.5, align: 'center', pageW: 2000, weight: 700,
    mark: 'marker', markColor: BRAND.yellow, keyScale: 1.16,
    before: 'al final, después de todo el ruido, todo se reduce siempre a una sola cosa: tus',
    after: 'y a la única pregunta que de verdad importa: ¿en manos de quién los',
    below: 'dejas?',
  },
]

const HERO = 14

// Orden del aluvión (con repeticiones, para que parezca interminable) + cierre.
const SEQ = [0, 2, 5, 8, 11, 3, 13, 6, 1, 9, 4, 10, 7, 12, 2, 8, 5, 11, 1, 6, 0, 13, 9, HERO]
// Duraciones por corte (frames): arranca legible → se acelera al máximo → se
// frena un poco → aterriza largo en el HERO. Misma longitud que SEQ.
const DURATIONS = [13, 8, 7, 6, 6, 5, 5, 4, 4, 4, 3, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8, 46]

const STARTS: number[] = []
{
  let acc = 0
  for (const d of DURATIONS) {
    STARTS.push(acc)
    acc += d
  }
}
export const DOCUMENTS_DURATION = STARTS[STARTS.length - 1] + DURATIONS[DURATIONS.length - 1]

export function DocumentsVideo() {
  const frame = useCurrentFrame()

  let step = 0
  for (let i = 0; i < STARTS.length; i++) if (frame >= STARTS[i]) step = i
  const doc = DOCS[SEQ[step]]
  const local = frame - STARTS[step]
  const dur = DURATIONS[step]

  const pageW = doc.pageW ?? 2300
  const isDark = lum(doc.paper) < 0.4
  const keyScale = doc.keyScale ?? 1

  // Golpe del corte: micro-zoom 1.05→1 en 2 frames + deriva lenta, todo girando
  // alrededor de la palabra (centro de la página) para que no se mueva del centro.
  const pop = interpolate(local, [0, 2], [1.05, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  const drift = interpolate(local, [2, dur], [1, 1.022], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = pop * drift
  const flash = interpolate(local, [0, 1, 3], [0.06, 0.11, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const blockStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    width: pageW,
    textAlign: doc.align === 'center' ? 'center' : doc.align === 'justify' ? 'justify' : 'left',
    whiteSpace: 'pre-line',
    fontStyle: doc.italic ? 'italic' : 'normal',
    fontWeight: doc.weight ?? 400,
    letterSpacing: doc.letterSpacing,
    textTransform: doc.upper ? 'uppercase' : 'none',
    ...(doc.align === 'justify' ? { textAlignLast: 'left' as const } : null),
  }

  // Cada lado ocupa la mitad del hueco (flex:1 + min-width:0) y EMPUJA su texto
  // hacia el borde interior (pegado a la palabra) con justify-content; al ser más
  // ancho que su caja, el texto rebosa hacia AFUERA (nunca sobre la palabra).
  const sideBox = (which: 'left' | 'right'): CSSProperties => ({
    flex: '1 1 0',
    minWidth: 0,
    display: 'flex',
    justifyContent: which === 'left' ? 'flex-end' : 'flex-start',
    overflow: 'visible',
  })

  return (
    <AbsoluteFill style={{ backgroundColor: doc.paper, overflow: 'hidden', fontFamily: doc.font }}>
      <Fonts />

      {/* Texturas de papel */}
      {doc.texture === 'rules' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 56px, ${hexA('#16387a', 0.16)} 56px 57px)`, backgroundPositionY: '30px' }} />
      )}
      {doc.texture === 'grid' && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${hexA('#000', 0.05)} 1px, transparent 1px), linear-gradient(90deg, ${hexA('#000', 0.05)} 1px, transparent 1px)`, backgroundSize: '52px 52px' }} />
      )}

      {/* La página, centrada en el cuadro. Gira/escala alrededor de su centro,
          que coincide con la palabra → la palabra queda clavada en el centro. */}
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', color: doc.ink }}>
        <div
          style={{
            position: 'relative',
            width: pageW,
            fontSize: doc.size,
            lineHeight: doc.lh,
            transform: `scale(${scale}) rotate(${doc.rotate ?? 0}deg)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Imagen (sangra por el borde elegido) */}
          {doc.image && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: doc.image.w,
                transform: `translate(calc(-50% + ${doc.image.dx}px), calc(-50% + ${doc.image.dy}px)) rotate(${doc.image.rotate ?? 0}deg)`,
              }}
            >
              <Img
                src={staticFile(doc.image.src)}
                style={{
                  display: 'block',
                  width: doc.image.w,
                  height: doc.image.h,
                  objectFit: 'cover',
                  borderRadius: doc.image.border ? 2 : 4,
                  border: doc.image.border ? `1px solid ${hexA(doc.ink, 0.25)}` : 'none',
                  boxShadow: `0 40px 80px ${hexA('#000', isDark ? 0.6 : 0.28)}`,
                }}
              />
              {doc.image.caption && (
                <div style={{ fontSize: doc.size * 0.42, marginTop: 10, opacity: 0.7, fontStyle: 'italic', fontFamily: doc.font, whiteSpace: 'normal' }}>
                  {doc.image.caption}
                </div>
              )}
            </div>
          )}

          {/* Texto por encima de la línea de la palabra */}
          <div style={{ ...blockStyle, bottom: '100%', paddingBottom: '0.46em' }}>
            {doc.header && (
              <div style={{ fontSize: doc.size * 0.52, letterSpacing: 2, opacity: 0.78, marginBottom: '0.5em', textTransform: doc.upper ? 'uppercase' : 'none', ...doc.headerStyle }}>
                {doc.header}
              </div>
            )}
            {doc.above}
          </div>

          {/* La línea de la palabra: [antes | PALABRA | después], palabra centrada */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.28em', width: pageW, lineHeight: 1.3, textTransform: doc.upper ? 'uppercase' : 'none', fontWeight: doc.weight ?? 400, fontStyle: doc.italic ? 'italic' : 'normal' }}>
            <div style={sideBox('left')}>
              <span style={{ whiteSpace: 'nowrap' }}>{doc.before}</span>
            </div>
            <Mark kind={doc.mark} color={doc.markColor} ink={doc.ink} paper={doc.paper} scale={keyScale} />
            <div style={sideBox('right')}>
              <span style={{ whiteSpace: 'nowrap' }}>{doc.after}</span>
            </div>
          </div>

          {/* Texto por debajo */}
          <div style={{ ...blockStyle, top: '100%', paddingTop: '0.46em' }}>{doc.below}</div>
        </div>
      </AbsoluteFill>

      {/* Viñeta común (cohesión + aire de "metraje") */}
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: `inset 0 0 340px ${hexA('#000', isDark ? 0.6 : 0.22)}` }} />

      {/* Destello del corte */}
      <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: '#ffffff', opacity: flash }} />
    </AbsoluteFill>
  )
}
