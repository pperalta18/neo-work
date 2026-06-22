import { type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { BRAND } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'

/**
 * WebSweepVideo — el hermano de DocumentsVideo, pero para "búsqueda en web
 * extremadamente rápida". En vez de una palabra clavada en el centro, es un
 * ALUD de pantallas web reales vistas MUY de cerca, cortadas a toda velocidad:
 * buscador, resultados de imágenes, una noticia, una enciclopedia, un mapa,
 * vídeos, una ficha de producto, un foro, una red social, un dashboard, una
 * receta, viajes, compras, una galería, reseñas… La cámara está pegada a cada
 * pantalla (el contenido se sale por los cuatro bordes) y en CADA una hay
 * VARIAS palabras destacadas, distintas en cada pantalla — como si la IA fuese
 * marcando lo relevante a su paso. El tempo acelera hasta el máximo y luego se
 * CALMA (los cortes se alargan); no aterriza en ningún hero ni lockup: termina
 * sostenido, en reposo, sobre una pantalla cualquiera.
 *
 * Reglas de la casa: todo es función pura de useCurrentFrame() (sin CSS
 * animations / Math.random / Date.now). Las imágenes web se generan con el skill
 * image-gen y viven en public/websweep/ (cargadas con <Img>+staticFile para que
 * Remotion espere a su carga al renderizar). Estilo deliberadamente heterogéneo
 * (la web no es una sola marca): stacks de fuentes del sistema + Universal Sans.
 */

type BrandKey = keyof typeof BRAND

// ── helpers ────────────────────────────────────────────────────────────────────
const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
// PRNG determinista para el jitter de cámara por corte (sin Math.random).
const rnd = (n: number) => {
  let t = (Math.imul(n | 0, 1103515245) + 12345) & 0x7fffffff
  t ^= t >> 13
  return (Math.imul(t, 2654435761) >>> 0) / 4294967296
}

const F = {
  sans: BODY_FONT,
  display: "'Universal Sans Display', system-ui, sans-serif",
  ui: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  news: "'Times New Roman', Georgia, serif",
  mono: "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace",
  humanist: "'Optima', 'Gill Sans', 'Avenir Next', sans-serif",
} as const

const A = {
  gridA: 'websweep/img-grid-a.png',
  gridB: 'websweep/img-grid-b.png',
  video: 'websweep/video-thumbs.png',
  article: 'websweep/article-hero.png',
  wikiSubject: 'websweep/wiki-subject.png',
  wikiPortrait: 'websweep/wiki-portrait.png',
  map: 'websweep/map-tiles.png',
  productHero: 'websweep/product-hero.png',
  productGrid: 'websweep/product-grid.png',
  recipe: 'websweep/recipe-dish.png',
  travel: 'websweep/travel-grid.png',
  social: 'websweep/social-photo.png',
  avatars: 'websweep/avatars.png',
  gallery: 'websweep/gallery-art.png',
}

// ── la palabra destacada (varias por pantalla) ──────────────────────────────────
type Mk = 'marker' | 'box' | 'underline' | 'wavy' | 'bracket' | 'outline' | 'tag'
function H({ children, k = 'marker', c = 'yellow' }: { children: ReactNode; k?: Mk; c?: BrandKey }) {
  const color = BRAND[c]
  const base: CSSProperties = {
    position: 'relative',
    borderRadius: '0.12em',
    WebkitBoxDecorationBreak: 'clone',
    fontWeight: 600,
  }
  switch (k) {
    case 'marker':
      return (
        <span style={{ ...base, padding: '0.02em 0.18em', borderRadius: '0.16em', background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.88)} 6%, ${hexA(color, 0.8)} 94%, ${hexA(color, 0)} 100%)` }}>{children}</span>
      )
    case 'box':
      return <span style={{ ...base, background: color, color: '#fff', padding: '0.04em 0.26em', borderRadius: '0.24em' }}>{children}</span>
    case 'underline':
      return <span style={{ ...base, fontWeight: 'inherit', boxShadow: `inset 0 -0.16em 0 ${hexA(color, 0.5)}` }}>{children}</span>
    case 'wavy':
      return <span style={{ ...base, fontWeight: 'inherit', textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: color, textDecorationThickness: '0.06em', textUnderlineOffset: '0.18em' }}>{children}</span>
    case 'bracket':
      return (
        <span style={{ ...base, fontWeight: 'inherit' }}>
          <span style={{ color, fontWeight: 700 }}>[</span>{children}<span style={{ color, fontWeight: 700 }}>]</span>
        </span>
      )
    case 'outline':
      return <span style={{ ...base, padding: '0.02em 0.22em', borderRadius: '0.2em', boxShadow: `inset 0 0 0 0.09em ${color}` }}>{children}</span>
    case 'tag':
      return <span style={{ ...base, background: hexA(color, 0.16), color, padding: '0.04em 0.3em', borderRadius: '0.4em' }}>{children}</span>
  }
}

// ── átomos web ───────────────────────────────────────────────────────────────────
function Chrome({ url, accent = '#5f6368', dark = false }: { url: ReactNode; accent?: string; dark?: boolean }) {
  const bar = dark ? '#202225' : '#dee1e6'
  const tab = dark ? '#2b2d31' : '#fff'
  const field = dark ? '#1b1c1f' : '#f1f3f4'
  const tx = dark ? '#c7c9cf' : accent
  return (
    <div style={{ background: bar, paddingTop: 14, fontFamily: F.ui }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px 10px' }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
          <span key={c} style={{ width: 14, height: 14, borderRadius: '50%', background: c, flex: '0 0 14px' }} />
        ))}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, marginLeft: 14 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 220, height: 40, borderRadius: '10px 10px 0 0', background: i === 0 ? tab : 'transparent', opacity: i === 0 ? 1 : 0.5 }} />
          ))}
        </div>
      </div>
      <div style={{ background: tab, padding: '12px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ color: tx, fontSize: 26, opacity: 0.7 }}>‹ › ⟳</span>
        <div style={{ flex: 1, background: field, borderRadius: 24, padding: '12px 22px', color: tx, fontSize: 26, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ opacity: 0.6 }}>🔒</span>
          <span style={{ whiteSpace: 'nowrap' }}>{url}</span>
        </div>
      </div>
    </div>
  )
}

function Chip({ children, color, on = false }: { children: ReactNode; color?: string; on?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 22, fontSize: 24, fontFamily: F.ui, whiteSpace: 'nowrap', background: on ? (color ?? '#1a73e8') : hexA(color ?? '#5f6368', 0.1), color: on ? '#fff' : (color ?? '#3c4043'), boxShadow: on ? 'none' : `inset 0 0 0 1px ${hexA('#000', 0.08)}` }}>{children}</span>
  )
}

function Stars({ val = 4.5, size = 22, color = BRAND.orange }: { val?: number; size?: number; color?: string }) {
  return (
    <span style={{ color, fontSize: size, letterSpacing: 2, lineHeight: 1, whiteSpace: 'nowrap' }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} style={{ opacity: i + 1 <= val ? 1 : i < val ? 0.55 : 0.25 }}>★</span>
      ))}
    </span>
  )
}

function Favicon({ color, glyph }: { color: string; glyph?: string }) {
  return (
    <span style={{ width: 34, height: 34, borderRadius: 8, flex: '0 0 34px', background: color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700 }}>{glyph}</span>
  )
}

// recorta la celda i de una hoja de cols×celdas usando <Img> (Remotion espera su carga)
function Cell({ src, cols, rows, i, style, radius = 0 }: { src: string; cols: number; rows: number; i: number; style?: CSSProperties; radius?: number }) {
  const c = i % cols
  const r = Math.floor(i / cols)
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, ...style }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', width: `${cols * 100}%`, height: `${rows * 100}%`, left: `${-c * 100}%`, top: `${-r * 100}%`, objectFit: 'fill' }} />
    </div>
  )
}

function Avatar({ i = 0, size = 48 }: { i?: number; size?: number }) {
  return <Cell src={A.avatars} cols={4} rows={2} i={i % 8} radius={size} style={{ width: size, height: size, flex: `0 0 ${size}px`, boxShadow: `inset 0 0 0 1px ${hexA('#000', 0.08)}` }} />
}

function Hero({ src, style, radius = 0 }: { src: string; style?: CSSProperties; radius?: number }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, ...style }}>
      <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
    </div>
  )
}

// recorta un rectángulo arbitrario (fracciones 0..1 del original) — para hojas
// que no son rejillas regulares (p. ej. el collage de viajes: 1 grande + 2).
function Region({ src, x, y, w, h, radius = 0, style, children }: { src: string; x: number; y: number; w: number; h: number; radius?: number; style?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: radius, ...style }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', width: `${(100 / w).toFixed(3)}%`, height: `${(100 / h).toFixed(3)}%`, left: `${((-x / w) * 100).toFixed(3)}%`, top: `${((-y / h) * 100).toFixed(3)}%`, objectFit: 'fill' }} />
      {children}
    </div>
  )
}

const TRAVEL_RECTS: Array<[number, number, number, number]> = [
  [0, 0, 1, 0.52], // habitación (arriba, ancha)
  [0, 0.54, 0.5, 0.46], // piscina (abajo-izq)
  [0.5, 0.54, 0.5, 0.46], // calle (abajo-der)
]
function TravelThumb({ i, size = 120, radius = 12, style }: { i: number; size?: number; radius?: number; style?: CSSProperties }) {
  const [x, y, w, h] = TRAVEL_RECTS[i % 3]
  return <Region src={A.travel} x={x} y={y} w={w} h={h} radius={radius} style={{ width: size, height: size, flex: `0 0 ${size}px`, ...style }} />
}

// fondo de página completo
const Page = ({ bg, font, children }: { bg: string; font: string; children: ReactNode }) => (
  <div style={{ width: '100%', height: '100%', background: bg, fontFamily: font, overflow: 'visible' }}>{children}</div>
)

// ── arquetipos de pantalla ───────────────────────────────────────────────────────

// 0 · buscador (SERP) con panel de conocimiento (zorro)
function SerpFox() {
  const Result = ({ fav, dom, title, snip }: { fav: ReactNode; dom: ReactNode; title: ReactNode; snip: ReactNode }) => (
    <div style={{ marginBottom: 38 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>{fav}<span style={{ fontSize: 24, color: '#202124' }}>{dom}</span></div>
      <div style={{ fontSize: 40, color: '#1a0dab', lineHeight: 1.2, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 27, color: '#4d5156', lineHeight: 1.5 }}>{snip}</div>
    </div>
  )
  return (
    <Page bg="#fff" font={F.ui}>
      <Chrome url={<>https://buscar.example/?q=<H k="underline" c="blue">zorro rojo</H></>} />
      <div style={{ padding: '34px 0 0 220px', maxWidth: 1700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: 920, background: '#fff', borderRadius: 32, padding: '16px 28px', boxShadow: `0 1px 8px ${hexA('#000', 0.18)}`, marginBottom: 18 }}>
          <span style={{ fontSize: 30, opacity: 0.5 }}>🔍</span>
          <span style={{ fontSize: 32, color: '#202124' }}>zorro rojo <H c="yellow">hábitat</H> y <H c="green" k="underline">comportamiento</H></span>
        </div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>
          {['Todo', 'Imágenes', 'Noticias', 'Vídeos', 'Mapas'].map((t, i) => (
            <Chip key={t} on={i === 0} color="#1a73e8">{t}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 22, color: '#70757a', marginBottom: 22 }}>Cerca de 48.300.000 resultados (0,000031 segundos)</div>
        <div style={{ display: 'flex', gap: 70 }}>
          <div style={{ width: 980 }}>
            <Result fav={<Favicon color={BRAND.red} glyph="N" />} dom="natura-iberica.example › fauna › canidos" title={<>El <H c="yellow">zorro rojo</H> (Vulpes vulpes): ficha completa</>} snip={<>El cánido más extendido del planeta. Su <H c="green" k="underline">dieta omnívora</H> y su <H c="blue" k="underline">adaptabilidad</H> le permiten habitar desde el bosque boreal hasta…</>} />
            <Result fav={<Favicon color={BRAND.blue} glyph="W" />} dom="es.enciclopedia.example › wiki › Vulpes_vulpes" title={<>Zorro rojo — Enciclopedia libre</>} snip={<>Pesa entre <H c="orange" k="box">3 y 7 kg</H>. Es <H c="violet" k="underline">crepuscular</H> y mantiene un territorio que marca con…</>} />
            <Result fav={<Favicon color={BRAND.teal} glyph="V" />} dom="videos.example › watch" title={<>Cómo caza el zorro en la nieve (4K)</>} snip={<>El característico <H c="pink" k="wavy">salto de caza</H> sobre la presa enterrada bajo la nieve, grabado a cámara…</>} />
            <Result fav={<Favicon color={BRAND.green} glyph="B" />} dom="blog.naturalista.example › avistamientos" title={<>Diez datos sorprendentes sobre el zorro</>} snip={<>Pueden oír un ratón a <H c="red" k="box">40 metros</H> de distancia gracias a un oído…</>} />
          </div>
          <div style={{ width: 470, border: `1px solid ${hexA('#000', 0.12)}`, borderRadius: 16, overflow: 'hidden', flex: '0 0 470px', alignSelf: 'flex-start' }}>
            <Hero src={A.wikiSubject} style={{ width: '100%', height: 300 }} />
            <div style={{ padding: '22px 26px' }}>
              <div style={{ fontSize: 40, color: '#202124', marginBottom: 4 }}>Zorro rojo</div>
              <div style={{ fontSize: 24, color: '#70757a', marginBottom: 18 }}>Especie de mamífero</div>
              {[['Familia', <H key="f" c="blue" k="underline">Cánidos</H>], ['Longevidad', <H key="l" c="orange" k="box">2–5 años</H>], ['Velocidad', <>hasta <H c="green" k="underline">50 km/h</H></>], ['Estado', <H key="s" c="green" k="tag">Preocupación menor</H>]].map(([k, v], i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, padding: '10px 0', borderBottom: `1px solid ${hexA('#000', 0.07)}`, color: '#3c4043' }}>
                  <span style={{ color: '#70757a' }}>{k}</span><span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

// 1 · resultados de imágenes (hoja A)
function ImageSearch({ sheet = A.gridA, query = 'fotografía de naturaleza' }: { sheet?: string; query?: ReactNode }) {
  const caps: Array<[number, ReactNode, BrandKey, Mk]> = [
    [0, 'leopardo de las nieves', 'blue', 'marker'], [1, 'atardecer', 'orange', 'underline'], [4, 'coche clásico', 'red', 'box'],
    [6, 'café', 'teal', 'tag'], [9, 'bosque en otoño', 'green', 'underline'], [11, 'skyline nocturno', 'violet', 'marker'],
  ]
  return (
    <Page bg="#0f1012" font={F.ui}>
      <Chrome dark url={<>https://imagenes.example/buscar?q=<H k="underline" c="teal">{query}</H></>} />
      <div style={{ padding: '24px 36px', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
        {[['Todo', true], ['Paisaje', false], ['Animales', false], ['Comida', false], ['Ciudad', false], ['HD', false]].map(([t, on], i) => (
          <Chip key={i} on={on as boolean} color="#3ea6ff">{t as string}</Chip>
        ))}
        <span style={{ color: '#8a8d93', fontSize: 24, marginLeft: 8 }}>1.240.000 imágenes</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, padding: '0 36px 36px' }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const cap = caps.find((c) => c[0] === i)
          return (
            <div key={i} style={{ position: 'relative' }}>
              <Cell src={sheet} cols={4} rows={3} i={i} radius={12} style={{ width: '100%', height: 230 }} />
              {cap && (
                <div style={{ position: 'absolute', left: 12, bottom: 12, fontSize: 22 }}>
                  <H c={cap[2]} k={cap[3]}>{cap[1]}</H>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Page>
  )
}

// 2 · noticia
function Article() {
  return (
    <Page bg="#fbfbf9" font={F.news}>
      <Chrome url={<>https://eldiario.example/ciudad/movilidad-2026</>} accent="#9a3b3b" />
      <div style={{ padding: '40px 220px 0', maxWidth: 1700 }}>
        <div style={{ fontFamily: F.ui, fontSize: 24, letterSpacing: 3, color: BRAND.red, fontWeight: 700, marginBottom: 18 }}>MOVILIDAD · INVESTIGACIÓN</div>
        <div style={{ fontSize: 78, lineHeight: 1.08, color: '#14130f', fontWeight: 700, marginBottom: 26 }}>
          La ciudad rediseña sus <H c="yellow">avenidas</H> y promete recortar a la mitad el <H c="green" k="underline">tiempo de viaje</H>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: F.ui, fontSize: 26, color: '#5b574e', marginBottom: 28 }}>
          <Avatar i={2} size={56} /> <span>Por <b>Laura Méndez</b> · hace <H c="blue" k="tag">12 min</H> · 4 min de lectura</span>
        </div>
        <Hero src={A.article} style={{ width: '100%', height: 520, marginBottom: 14 }} radius={6} />
        <div style={{ fontFamily: F.ui, fontSize: 23, color: '#8a857a', fontStyle: 'italic', marginBottom: 30 }}>El nuevo eje central durante la hora punta de ayer. / Archivo</div>
        <div style={{ columnCount: 2, columnGap: 70, fontSize: 33, lineHeight: 1.62, color: '#23211c' }}>
          <p style={{ margin: 0 }}>El consistorio confirmó ayer un plan que reordena el tráfico en torno a tres <H c="orange" k="underline">corredores prioritarios</H>. La medida, según fuentes municipales, busca reducir la congestión en un <H c="red" k="box">38%</H> antes de fin de año y devolver espacio al peatón.</p>
          <p>Los comerciantes piden cautela, pero los datos de la fase piloto apuntan a una caída notable de los <H c="violet" k="wavy">tiempos de espera</H> y a un aire más limpio en el centro histórico durante todo el día.</p>
        </div>
      </div>
    </Page>
  )
}

// 3 · enciclopedia (persona)
function WikiPerson() {
  return (
    <Page bg="#fff" font={F.serif}>
      <Chrome url={<>https://es.enciclopedia.example/wiki/Ada_Lovelace</>} accent="#3366cc" />
      <div style={{ display: 'flex', padding: '36px 90px 0', gap: 56 }}>
        <div style={{ flex: 1, maxWidth: 1080 }}>
          <div style={{ fontSize: 70, color: '#101418', borderBottom: `1px solid ${hexA('#000', 0.15)}`, paddingBottom: 14, marginBottom: 8, fontFamily: F.serif }}>Ada Lovelace</div>
          <div style={{ fontSize: 26, color: '#54595d', marginBottom: 30 }}>De la enciclopedia libre</div>
          <div style={{ fontSize: 33, lineHeight: 1.7, color: '#202122' }}>
            <p style={{ marginTop: 0 }}>Fue una <span style={{ color: '#3366cc' }}>matemática</span> reconocida por escribir el primer <H c="yellow">algoritmo</H> pensado para ser procesado por una <span style={{ color: '#3366cc' }}>máquina</span>. Por ello se la considera la primera <H c="green" k="underline">programadora</H> de la historia.</p>
            <p>Anticipó que las máquinas podrían ir más allá del <H c="blue" k="underline">cálculo</H> puro y llegar a manipular <H c="violet" k="wavy">símbolos</H> de cualquier tipo, una idea visionaria para su época.</p>
            <div style={{ fontSize: 40, margin: '30px 0 14px', fontFamily: F.serif, borderBottom: `1px solid ${hexA('#000', 0.12)}`, paddingBottom: 8 }}>Legado</div>
            <p style={{ marginTop: 0 }}>Su nombre se dio a un <H c="orange" k="tag">lenguaje de programación</H> y cada año se celebra una jornada en honor a las mujeres en la <span style={{ color: '#3366cc' }}>ciencia</span>.</p>
          </div>
        </div>
        <div style={{ width: 420, flex: '0 0 420px', border: `1px solid ${hexA('#000', 0.18)}`, background: '#f8f9fa', borderRadius: 4 }}>
          <div style={{ textAlign: 'center', fontSize: 30, fontWeight: 700, padding: '14px 10px', background: '#eaecf0' }}>Ada Lovelace</div>
          <Hero src={A.wikiPortrait} style={{ width: '100%', height: 470 }} />
          <div style={{ padding: '16px 20px', fontFamily: F.ui }}>
            {[['Nacimiento', <H key="n" c="blue" k="underline">1815</H>], ['Campo', <>Matemáticas</>], ['Conocida por', <H key="c" c="yellow">primer algoritmo</H>], ['Nacionalidad', <H key="na" c="green" k="tag">Británica</H>]].map(([k, v], i) => (
              <div key={i} style={{ display: 'flex', gap: 14, fontSize: 25, padding: '9px 0', borderTop: i ? `1px solid ${hexA('#000', 0.08)}` : 'none', color: '#202122' }}>
                <span style={{ width: 150, color: '#54595d', flex: '0 0 150px' }}>{k}</span><span>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
}

// 4 · mapas
function MapScreen() {
  return (
    <Page bg="#e8eae6" font={F.ui}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Img src={staticFile(A.map)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* pines */}
      {[[0.46, 0.34, BRAND.red], [0.6, 0.52, BRAND.blue], [0.38, 0.62, BRAND.green], [0.7, 0.3, BRAND.violet]].map(([x, y, c], i) => (
        <div key={i} style={{ position: 'absolute', left: `${(x as number) * 100}%`, top: `${(y as number) * 100}%`, transform: 'translate(-50%,-100%)', filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.3))' }}>
          <svg width="56" height="72" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20s12-11 12-20C24 5.4 18.6 0 12 0z" fill={c as string} /><circle cx="12" cy="12" r="5" fill="#fff" /></svg>
        </div>
      ))}
      {/* panel izquierdo de resultados */}
      <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 560, background: '#fff', boxShadow: '4px 0 24px rgba(0,0,0,.15)', padding: '28px 28px 0' }}>
        <div style={{ background: '#f1f3f4', borderRadius: 28, padding: '16px 26px', fontSize: 30, color: '#202124', marginBottom: 24 }}>🔍 <H c="blue" k="underline">cafeterías</H> cerca de mí</div>
        {[['Café del Mercado', 4.6, '320 m · Cafetería', BRAND.red, 'green', 'Abierto'], ['Tostadero Norte', 4.8, '480 m · Especialidad', BRAND.blue, 'orange', '€€'], ['La Esquina Lenta', 4.4, '650 m · Brunch', BRAND.green, 'violet', 'Terraza']].map(([n, r, meta, c, tagc, tag], i) => (
          <div key={i} style={{ display: 'flex', gap: 18, padding: '20px 0', borderBottom: `1px solid ${hexA('#000', 0.08)}` }}>
            <TravelThumb i={i} />
            <div>
              <div style={{ fontSize: 32, color: '#202124', marginBottom: 6 }}>{n as string}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><span style={{ fontSize: 26, color: '#202124' }}>{r as number}</span><Stars val={r as number} size={22} /></div>
              <div style={{ fontSize: 23, color: '#70757a', marginBottom: 8 }}>{meta as string}</div>
              <H c={tagc as BrandKey} k="tag">{tag as string}</H>
            </div>
          </div>
        ))}
      </div>
      {/* tarjeta flotante */}
      <div style={{ position: 'absolute', right: 60, bottom: 60, width: 460, background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 18px 50px rgba(0,0,0,.3)' }}>
        <Hero src={A.recipe} style={{ width: '100%', height: 230 }} />
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 34, color: '#202124' }}>Café del Mercado</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '8px 0' }}><Stars val={4.6} /><span style={{ fontSize: 24, color: '#70757a' }}>(1.204)</span></div>
          <div style={{ fontSize: 25, color: '#3c4043' }}>Hoy: <H c="green" k="box">8:00–20:00</H> · <H c="orange" k="underline">muy concurrido</H></div>
        </div>
      </div>
    </Page>
  )
}

// 5 · vídeos
function VideoGrid() {
  const meta: Array<[ReactNode, ReactNode, string, BrandKey, Mk, ReactNode]> = [
    [<>Cómo grabar <H c="yellow">vídeo cinematográfico</H> con el móvil</>, 'Estudio Lumen', '12:04', 'red', 'box', '1,2 M'],
    [<>Mi setup de escritorio <H c="teal" k="tag">2026</H></>, 'TecnoDía', '8:31', 'orange', 'underline', '840 K'],
    [<>Receta de ramen en <H c="green" k="underline">20 minutos</H></>, 'Cocina Rápida', '15:22', 'green', 'box', '3,4 M'],
    [<>Ruta costera en <H c="blue" k="marker">dron</H> (4K)</>, 'AeroViajes', '6:48', 'blue', 'tag', '512 K'],
    [<>El cuarto gamer <H c="violet" k="underline">definitivo</H></>, 'PixelRoom', '10:10', 'violet', 'box', '2,1 M'],
    [<>Rutina de <H c="pink" k="wavy">fuerza</H> para empezar</>, 'Fit&Co', '18:59', 'pink', 'tag', '978 K'],
  ]
  return (
    <Page bg="#0f0f0f" font={F.ui}>
      <Chrome dark url={<>https://vid.example/resultados?buscar=<H k="underline" c="red">tutoriales</H></>} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28, padding: '30px 40px' }}>
        {meta.map(([title, chan, dur, c, k, views], i) => (
          <div key={i}>
            <div style={{ position: 'relative' }}>
              <Cell src={A.video} cols={2} rows={3} i={i} radius={14} style={{ width: '100%', height: 280 }} />
              <span style={{ position: 'absolute', right: 12, bottom: 12, background: 'rgba(0,0,0,.85)', color: '#fff', fontSize: 22, padding: '3px 9px', borderRadius: 6 }}>{dur}</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
              <Avatar i={i + 1} size={54} />
              <div>
                <div style={{ fontSize: 28, color: '#f1f1f1', lineHeight: 1.25, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 23, color: '#aaa' }}>{chan} · <H c={c} k={k}>{views}</H> vistas</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Page>
  )
}

// 6 · ficha de producto
function Product() {
  return (
    <Page bg="#fff" font={F.ui}>
      <Chrome url={<>https://tienda.example/p/auriculares-aura</>} accent="#067d62" />
      <div style={{ display: 'flex', gap: 60, padding: '40px 90px 0' }}>
        <Hero src={A.productHero} style={{ width: 720, height: 720, flex: '0 0 720px', background: '#f6f6f6' }} radius={18} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 52, color: '#0f1111', lineHeight: 1.18, marginBottom: 14 }}>Auriculares inalámbricos <H c="yellow">Aura Pro</H> · cancelación de ruido</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}><Stars val={4.5} size={28} /><span style={{ color: '#007185', fontSize: 26 }}>12.480 valoraciones</span></div>
          <div style={{ fontSize: 30, color: '#565959', marginBottom: 8 }}>Precio</div>
          <div style={{ marginBottom: 26 }}><span style={{ fontSize: 64, color: '#0f1111' }}><H c="green">199 €</H></span> <span style={{ fontSize: 28, color: '#565959', textDecoration: 'line-through', marginLeft: 14 }}>249 €</span> <H c="red" k="box">-20%</H></div>
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>{['Negro', 'Plata', 'Azul'].map((v, i) => <Chip key={v} on={i === 0} color="#067d62">{v}</Chip>)}</div>
          <ul style={{ fontSize: 30, color: '#0f1111', lineHeight: 1.7, paddingLeft: 28, margin: '0 0 26px' }}>
            <li><H c="blue" k="underline">40 h</H> de batería con el estuche</li>
            <li>Cancelación activa <H c="violet" k="tag">adaptativa</H></li>
            <li>Resistencia al agua <H c="teal" k="box">IPX4</H></li>
          </ul>
          <div style={{ fontSize: 28, color: '#067d62', marginBottom: 18 }}>Entrega <H c="green" k="underline">mañana</H> si pides en las próximas 3 h</div>
          <div style={{ display: 'inline-block', background: '#ffd814', borderRadius: 30, padding: '16px 56px', fontSize: 32, color: '#0f1111' }}>Añadir a la cesta</div>
          <div style={{ marginTop: 36 }}>
            <div style={{ fontSize: 28, color: '#565959', marginBottom: 14 }}>Quien vio esto también vio</div>
            <div style={{ display: 'flex', gap: 16 }}>{[0, 1, 2, 3].map((i) => <Cell key={i} src={A.productGrid} cols={3} rows={3} i={i} radius={12} style={{ width: 150, height: 150, flex: '0 0 150px', background: '#f6f6f6' }} />)}</div>
          </div>
        </div>
      </div>
    </Page>
  )
}

// 7 · foro / Q&A
function Forum() {
  return (
    <Page bg="#fff" font={F.ui}>
      <Chrome url={<>https://preguntas.example/q/48213/optimizar-consulta</>} accent="#0a95ff" />
      <div style={{ padding: '36px 90px 0', maxWidth: 1640 }}>
        <div style={{ fontSize: 52, color: '#232629', lineHeight: 1.2, marginBottom: 14 }}>¿Cómo <H c="yellow">optimizar</H> una consulta lenta sobre una tabla de millones de filas?</div>
        <div style={{ display: 'flex', gap: 14, marginBottom: 26 }}>{[['índices', 'blue'], ['rendimiento', 'green'], ['base-de-datos', 'violet']].map(([t, c], i) => <H key={i} c={c as BrandKey} k="tag">{t}</H>)}</div>
        <div style={{ display: 'flex', gap: 30 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#6a737c', fontSize: 30, width: 70 }}>
            <span>▲</span><span style={{ fontSize: 40, color: '#232629' }}><H c="orange" k="box">214</H></span><span>▼</span><span style={{ color: BRAND.green, fontSize: 40 }}>✓</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 31, color: '#232629', lineHeight: 1.6, marginBottom: 22 }}>La causa casi siempre es un <H c="red" k="underline">escaneo completo</H>. Crea un índice sobre la columna del filtro y revisa el plan de ejecución antes y después.</div>
            <pre style={{ fontFamily: F.mono, fontSize: 27, background: '#f6f6f6', borderRadius: 12, padding: '24px 28px', color: '#1b3a57', overflow: 'visible', lineHeight: 1.6, margin: '0 0 22px' }}>
{`CREATE INDEX idx_pedidos_fecha
  ON pedidos (fecha);

EXPLAIN ANALYZE
SELECT * FROM pedidos
WHERE fecha > '2026-01-01';`}
            </pre>
            <div style={{ fontSize: 30, color: '#232629', lineHeight: 1.6 }}>Pasó de <H c="red" k="box">3,2 s</H> a <H c="green" k="box">8 ms</H>. La clave es medir con datos reales, no suponer.</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 22, fontSize: 25, color: '#6a737c' }}>
              <Avatar i={5} size={48} /> respondido por <b style={{ color: '#0a95ff' }}>mariodb</b> · hace <H c="blue" k="tag">2 h</H>
            </div>
          </div>
        </div>
      </div>
    </Page>
  )
}

// 8 · red social
function Social() {
  const Post = ({ av, name, handle, time, body, photo }: { av: number; name: string; handle: ReactNode; time: string; body: ReactNode; photo?: boolean }) => (
    <div style={{ background: '#fff', borderRadius: 20, padding: '28px 32px', boxShadow: `0 1px 3px ${hexA('#000', 0.1)}`, marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <Avatar i={av} size={62} />
        <div><div style={{ fontSize: 30, color: '#0f1419' }}>{name}</div><div style={{ fontSize: 24, color: '#536471' }}>{handle} · {time}</div></div>
      </div>
      <div style={{ fontSize: 32, color: '#0f1419', lineHeight: 1.5, marginBottom: photo ? 18 : 6 }}>{body}</div>
      {photo && <Hero src={A.social} style={{ width: '100%', height: 420 }} radius={18} />}
      <div style={{ display: 'flex', gap: 60, marginTop: 18, fontSize: 26, color: '#536471' }}>
        <span>💬 <H c="blue" k="tag">128</H></span><span>🔁 <H c="green" k="tag">2,4 K</H></span><span>♥ <H c="pink" k="box">18,9 K</H></span>
      </div>
    </div>
  )
  return (
    <Page bg="#eef3f6" font={F.ui}>
      <div style={{ padding: '36px 0', width: 1100, margin: '0 auto' }}>
        <Post av={3} name="Marina Ríos" handle={<H c="blue" k="underline">@marina.viaja</H>} time="hace 4 min" body={<>Amanecer en la cima después de cuatro horas subiendo. Cada paso <H c="yellow">valió la pena</H>. #montaña #<H c="teal" k="tag">amanecer</H></>} photo />
        <Post av={6} name="Datos Curiosos" handle="@curioso" time="hace 22 min" body={<>Dato del día: un zorro puede oír a su presa <H c="orange" k="box">bajo la nieve</H> y calcular el salto con una precisión <H c="violet" k="underline">asombrosa</H>.</>} />
      </div>
    </Page>
  )
}

// 9 · dashboard / analítica (gráficas dibujadas en código)
function Dashboard() {
  const pts = [40, 62, 55, 78, 70, 96, 88, 120, 110, 142, 158, 150]
  const max = 170
  const w = 1180, h = 360
  const path = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i / (pts.length - 1)) * w} ${h - (v / max) * h}`).join(' ')
  const area = `${path} L ${w} ${h} L 0 ${h} Z`
  return (
    <Page bg="#0f1117" font={F.ui}>
      <div style={{ padding: '44px 70px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
          <div style={{ fontSize: 44, color: '#e6e8ee', fontFamily: F.display }}>Panel de actividad</div>
          <div style={{ display: 'flex', gap: 12 }}>{['Hoy', '7 días', '30 días'].map((t, i) => <Chip key={t} on={i === 1} color={BRAND.blue}>{t}</Chip>)}</div>
        </div>
        <div style={{ display: 'flex', gap: 26, marginBottom: 30 }}>
          {[['Visitas', '184,2 K', '+12,4%', 'green'], ['Conversión', '3,8%', '+0,6 pp', 'blue'], ['Ingresos', '€ 92.300', '+18%', 'violet'], ['Rebote', '34%', '−4 pp', 'orange']].map(([l, v, d, c], i) => (
            <div key={i} style={{ flex: 1, background: '#171a22', borderRadius: 18, padding: '24px 28px', boxShadow: `inset 0 0 0 1px ${hexA('#fff', 0.05)}` }}>
              <div style={{ fontSize: 26, color: '#8b90a0', marginBottom: 12 }}>{l}</div>
              <div style={{ fontSize: 50, color: '#f2f4f8', marginBottom: 10 }}><H c={c as BrandKey} k="box">{v}</H></div>
              <div style={{ fontSize: 25, color: BRAND.green }}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{ background: '#171a22', borderRadius: 18, padding: '30px 34px' }}>
          <div style={{ fontSize: 28, color: '#c7cbd6', marginBottom: 18 }}>Tráfico — <H c="green" k="underline">tendencia al alza</H> sostenida</div>
          <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
            <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={hexA(BRAND.blue, 0.5)} /><stop offset="100%" stopColor={hexA(BRAND.blue, 0)} /></linearGradient></defs>
            <path d={area} fill="url(#g)" />
            <path d={path} fill="none" stroke={BRAND.blue} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={w} cy={h - (pts[pts.length - 1] / max) * h} r={10} fill={BRAND.blue} stroke="#171a22" strokeWidth={4} />
          </svg>
        </div>
      </div>
    </Page>
  )
}

// 10 · receta
function Recipe() {
  return (
    <Page bg="#fffdf8" font={F.humanist}>
      <Chrome url={<>https://recetas.example/ramen-en-casa</>} accent="#c2410c" />
      <div style={{ display: 'flex', gap: 60, padding: '40px 90px 0' }}>
        <div style={{ flex: '0 0 760px' }}>
          <Hero src={A.recipe} style={{ width: 760, height: 620 }} radius={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 64, color: '#1c1917', lineHeight: 1.1, marginBottom: 18, fontFamily: F.humanist }}>Ramen casero en <H c="yellow">30 minutos</H></div>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center', fontSize: 28, color: '#57534e', marginBottom: 30 }}>
            <Stars val={4.8} /> <span>(2.310)</span> · <span>⏱ <H c="blue" k="tag">30 min</H></span> · <span>🍜 <H c="green" k="tag">4 raciones</H></span>
          </div>
          <div style={{ fontSize: 34, color: '#1c1917', marginBottom: 12 }}>Ingredientes</div>
          <ul style={{ fontSize: 30, color: '#292524', lineHeight: 1.7, paddingLeft: 28, margin: '0 0 28px' }}>
            <li><H c="orange" k="box">400 g</H> de fideos ramen</li>
            <li><H c="red" k="underline">2</H> huevos cocidos a la mitad</li>
            <li>caldo de <H c="violet" k="underline">miso</H> y jengibre</li>
            <li>cebolleta, nori y <H c="green" k="tag">setas</H></li>
          </ul>
          <div style={{ fontSize: 34, color: '#1c1917', marginBottom: 12 }}>Preparación</div>
          <ol style={{ fontSize: 29, color: '#292524', lineHeight: 1.7, paddingLeft: 28, margin: 0 }}>
            <li><H c="teal" k="underline">Hierve</H> el caldo y añade el miso fuera del fuego.</li>
            <li>Cuece los fideos <H c="orange" k="box">3 min</H> y escúrrelos.</li>
            <li>Monta el bol y corona con el huevo.</li>
          </ol>
        </div>
      </div>
    </Page>
  )
}

// 11 · viajes / alojamiento
function Travel() {
  return (
    <Page bg="#fff" font={F.ui}>
      <Chrome url={<>https://reservas.example/alojamiento/costa-azul</>} accent="#e0245e" />
      <div style={{ padding: '34px 80px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: '300px 230px', gap: 12, marginBottom: 30 }}>
          <Region src={A.travel} x={0} y={0} w={1} h={0.52} radius={16} style={{ gridColumn: 'span 2', width: '100%', height: '100%' }} />
          <Cell src={A.gallery} cols={3} rows={2} i={3} radius={16} style={{ width: '100%', height: '100%' }} />
          <Region src={A.travel} x={0} y={0.54} w={0.5} h={0.46} radius={16} style={{ width: '100%', height: '100%' }} />
          <Region src={A.travel} x={0.5} y={0.54} w={0.5} h={0.46} radius={16} style={{ width: '100%', height: '100%' }} />
          <div style={{ position: 'relative' }}>
            <Cell src={A.gallery} cols={3} rows={2} i={1} radius={16} style={{ width: '100%', height: '100%' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 30 }}>+18 fotos</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 1000 }}>
            <div style={{ fontSize: 52, color: '#222', marginBottom: 12 }}>Villa con vistas al mar en la <H c="yellow">Costa Azul</H></div>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 28, color: '#555', marginBottom: 18 }}><Stars val={4.9} /><b style={{ color: '#222' }}>4,9</b> · <H c="blue" k="underline">312 reseñas</H> · Superanfitrión</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>{[['Piscina', 'teal'], ['Wifi', 'blue'], ['Vistas al mar', 'green'], ['Cancelación gratis', 'violet']].map(([t, c], i) => <H key={i} c={c as BrandKey} k="tag">{t}</H>)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 50, color: '#222' }}><H c="green">240 €</H></div>
            <div style={{ fontSize: 26, color: '#777' }}>por noche</div>
            <div style={{ marginTop: 16, background: '#e0245e', color: '#fff', borderRadius: 30, padding: '14px 44px', fontSize: 30 }}>Reservar</div>
          </div>
        </div>
      </div>
    </Page>
  )
}

// 12 · compras (rejilla de productos)
function Shopping() {
  const meta: Array<[ReactNode, ReactNode, BrandKey]> = [
    [<>Zapatillas urbanas</>, '79 €', 'green'], [<>Reloj minimalista</>, '129 €', 'blue'], [<>Mochila impermeable</>, '54 €', 'violet'],
    [<>Taza de cerámica</>, '15 €', 'orange'], [<>Gafas de sol</>, '89 €', 'teal'], [<>Lámpara de mesa</>, '42 €', 'red'],
    [<>Cámara compacta</>, '349 €', 'pink'], [<>Perfume floral</>, '68 €', 'violet'], [<>Auriculares</>, '199 €', 'green'],
  ]
  return (
    <Page bg="#f3f4f6" font={F.ui}>
      <Chrome url={<>https://tienda.example/buscar?q=<H k="underline" c="green">regalos</H></>} accent="#067d62" />
      <div style={{ display: 'flex', padding: '28px 60px 0', gap: 40 }}>
        <div style={{ width: 300, flex: '0 0 300px' }}>
          <div style={{ fontSize: 30, color: '#111', marginBottom: 18 }}>Filtros</div>
          {[['Hasta 50 €', 'green', true], ['Envío gratis', 'blue', true], ['4★ y más', 'orange', false], ['En oferta', 'red', false]].map(([t, c, on], i) => (
            <div key={i} style={{ marginBottom: 16 }}><Chip on={on as boolean} color={BRAND[c as BrandKey]}>{t as string}</Chip></div>
          ))}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 26, color: '#6b7280', marginBottom: 18 }}>1.482 resultados · ordenar por <H c="blue" k="underline">relevancia</H></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
            {meta.map(([n, price, c], i) => (
              <div key={i} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: `0 1px 4px ${hexA('#000', 0.08)}` }}>
                <Cell src={A.productGrid} cols={3} rows={3} i={i} style={{ width: '100%', height: 220, background: '#fff' }} />
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ fontSize: 27, color: '#111', marginBottom: 8 }}>{n}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}><Stars val={4.5} size={20} /><span style={{ fontSize: 22, color: '#6b7280' }}>(2{i}3)</span></div>
                  <div style={{ fontSize: 34, color: '#111' }}><H c={c} k="box">{price}</H></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Page>
  )
}

// 13 · galería / descubrimiento visual
function Gallery() {
  const caps: Array<[number, ReactNode, BrandKey, Mk]> = [
    [0, 'arte abstracto', 'violet', 'marker'], [1, 'silla mid-century', 'orange', 'tag'], [2, 'arreglo floral', 'pink', 'underline'],
    [3, 'interior minimalista', 'blue', 'box'], [4, 'patrón textil', 'teal', 'tag'], [5, 'escultura', 'green', 'underline'],
  ]
  const heights = [320, 420, 300, 380, 340, 440, 360, 300, 400, 330, 420, 310]
  return (
    <Page bg="#fafafa" font={F.ui}>
      <div style={{ padding: '30px 50px 0' }}>
        <div style={{ display: 'flex', gap: 14, marginBottom: 26, alignItems: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '14px 30px', fontSize: 30, color: '#333', boxShadow: `0 1px 6px ${hexA('#000', 0.12)}` }}>🔍 ideas de <H c="violet" k="underline">decoración</H></div>
          {['Salón', 'Arte', 'Diseño'].map((t, i) => <Chip key={t} on={i === 1} color={BRAND.violet}>{t}</Chip>)}
        </div>
        <div style={{ columnCount: 4, columnGap: 20 }}>
          {Array.from({ length: 12 }).map((_, i) => {
            const cap = caps.find((c) => c[0] === (i % 6))
            return (
              <div key={i} style={{ breakInside: 'avoid', marginBottom: 20, position: 'relative' }}>
                <Cell src={A.gallery} cols={3} rows={2} i={i % 6} radius={18} style={{ width: '100%', height: heights[i] }} />
                {i < 6 && cap && <div style={{ position: 'absolute', left: 14, bottom: 14, fontSize: 22 }}><H c={cap[2]} k={cap[3]}>{cap[1]}</H></div>}
              </div>
            )
          })}
        </div>
      </div>
    </Page>
  )
}

// 14 · imágenes (hoja B)
function ImageSearchB() {
  return <ImageSearch sheet={A.gridB} query="ideas de estilo de vida" />
}

// 15 · reseñas (lugar)
function Reviews() {
  const Review = ({ av, name, val, c, text }: { av: number; name: string; val: number; c: BrandKey; text: ReactNode }) => (
    <div style={{ display: 'flex', gap: 20, padding: '24px 0', borderBottom: `1px solid ${hexA('#000', 0.08)}` }}>
      <Avatar i={av} size={64} />
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}><span style={{ fontSize: 30, color: '#1c1917' }}>{name}</span><Stars val={val} size={22} /></div>
        <div style={{ fontSize: 28, color: '#44403c', lineHeight: 1.55 }}>{text}</div>
      </div>
    </div>
  )
  return (
    <Page bg="#fff" font={F.ui}>
      <Chrome url={<>https://opiniones.example/lugar/trattoria-luna</>} accent="#ea580c" />
      <div style={{ display: 'flex', gap: 60, padding: '40px 90px 0' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 56, color: '#1c1917', marginBottom: 14 }}>Trattoria Luna</div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 54, color: '#1c1917' }}><H c="orange" k="box">4,7</H></span><Stars val={4.7} size={32} /><span style={{ fontSize: 28, color: '#78716c' }}>2.104 reseñas</span>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 30, flexWrap: 'wrap' }}>{[['Italiana', 'red'], ['Romántico', 'pink'], ['€€', 'green'], ['Reserva recomendada', 'blue']].map(([t, c], i) => <H key={i} c={c as BrandKey} k="tag">{t}</H>)}</div>
          <Review av={1} name="Carlos R." val={5} c="green" text={<>La <H c="green" k="underline">pasta fresca</H> es de otro nivel y el servicio, impecable. Volveremos sin duda.</>} />
          <Review av={4} name="Nadia P." val={4} c="orange" text={<>Ambiente <H c="violet" k="underline">acogedor</H>; los postres, <H c="yellow">espectaculares</H>. Algo de espera sin reserva.</>} />
          <Review av={7} name="Tomás L." val={5} c="blue" text={<>Relación calidad-precio <H c="blue" k="box">excelente</H>. El tiramisú, obligatorio.</>} />
        </div>
        <div style={{ width: 420, flex: '0 0 420px' }}>
          <Hero src={A.recipe} style={{ width: '100%', height: 320 }} radius={16} />
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Region src={A.travel} x={0} y={0.54} w={0.5} h={0.46} radius={12} style={{ width: '100%', height: 150 }} />
            <Region src={A.travel} x={0.5} y={0.54} w={0.5} h={0.46} radius={12} style={{ width: '100%', height: 150 }} />
            <Cell src={A.gallery} cols={3} rows={2} i={3} radius={12} style={{ width: '100%', height: 150 }} />
            <Cell src={A.gallery} cols={3} rows={2} i={1} radius={12} style={{ width: '100%', height: 150 }} />
          </div>
          <div style={{ marginTop: 18, fontSize: 26, color: '#44403c', lineHeight: 1.7 }}>
            <div>Hoy: <H c="green" k="tag">abierto</H> · 13:00–23:30</div>
            <div>Reservar mesa para <H c="blue" k="underline">esta noche</H></div>
          </div>
        </div>
      </div>
    </Page>
  )
}

// ── catálogo de pantallas ─────────────────────────────────────────────────────────
type Screen = { Comp: () => ReactNode; bg: string; w: number; h: number; scale: number; dx: number; dy: number }
const S = (Comp: () => ReactNode, bg: string, w: number, h: number, scale: number, dx = 0, dy = 0): Screen => ({ Comp, bg, w, h, scale, dx, dy })

const SCREENS: Screen[] = [
  S(SerpFox, '#ffffff', 1920, 1240, 1.32, -40, 40), // 0
  S(ImageSearch, '#0f1012', 1920, 1180, 1.34, 60, 30), // 1
  S(Article, '#fbfbf9', 1920, 1320, 1.3, 0, 90), // 2
  S(WikiPerson, '#ffffff', 1920, 1220, 1.34, -30, 30), // 3
  S(MapScreen, '#e8eae6', 1920, 1080, 1.42, 60, 0), // 4
  S(VideoGrid, '#0f0f0f', 1920, 1180, 1.36, 30, 40), // 5
  S(Product, '#ffffff', 1920, 1300, 1.3, -20, 70), // 6
  S(Forum, '#ffffff', 1920, 1220, 1.36, 20, 30), // 7
  S(Social, '#eef3f6', 1480, 1240, 1.5, 0, 60), // 8
  S(Dashboard, '#0f1117', 1920, 1080, 1.38, 0, 10), // 9
  S(Recipe, '#fffdf8', 1920, 1180, 1.34, -20, 40), // 10
  S(Travel, '#ffffff', 1920, 1240, 1.32, 0, 50), // 11
  S(Shopping, '#f3f4f6', 1920, 1240, 1.34, 30, 50), // 12
  S(Gallery, '#fafafa', 1920, 1300, 1.3, 0, 80), // 13
  S(ImageSearchB, '#0f1012', 1920, 1180, 1.34, -60, 30), // 14
  S(Reviews, '#ffffff', 1920, 1220, 1.34, 20, 40), // 15
]

// El alud: índices de pantalla + duración por corte. Arranca legible, se acelera
// al máximo, luego se CALMA (cortes que se alargan) y termina sostenido en una
// pantalla cualquiera (sin hero ni lockup).
const SEQ = [0, 1, 2, 4, 5, 3, 10, 6, 8, 12, 9, 7, 11, 13, 1, 5, 15, 2, 6, 10, 4, 8, 14, 12, 0, 11, 9, 3, 7, 15, 13, 6, 4, 10, 3]
const DURATIONS = [16, 12, 10, 9, 8, 7, 6, 5, 5, 4, 4, 3, 3, 3, 3, 3, 3, 3, 4, 4, 5, 5, 6, 7, 8, 10, 12, 15, 18, 22, 26, 30, 34, 40, 96]

const STARTS: number[] = []
{
  let acc = 0
  for (const d of DURATIONS) {
    STARTS.push(acc)
    acc += d
  }
}
export const WEBSWEEP_DURATION = STARTS[STARTS.length - 1] + DURATIONS[DURATIONS.length - 1]

export function WebSweepVideo() {
  const frame = useCurrentFrame()

  let step = 0
  for (let i = 0; i < STARTS.length; i++) if (frame >= STARTS[i]) step = i
  const sc = SCREENS[SEQ[step]]
  const local = frame - STARTS[step]
  const dur = DURATIONS[step]
  const isLast = step === STARTS.length - 1
  const isDark = sc.bg === '#0f0f0f' || sc.bg === '#0f1012' || sc.bg === '#0f1117'

  // jitter determinista por corte: cada aparición de una pantalla encuadra una
  // zona distinta (arriba, una tarjeta, la imagen) para que nunca se repita igual.
  const jx = (rnd(step * 7 + 1) * 2 - 1) * 150
  const jy = (rnd(step * 7 + 53) * 2 - 1) * 110
  const js = 1 + rnd(step * 7 + 11) * 0.14

  // golpe del corte alrededor del centro + deriva lenta + micro-pan de "escaneo".
  const pop = interpolate(local, [0, 2], [1.06, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  const drift = interpolate(local, [2, Math.max(dur, 4)], [1, isLast ? 1.012 : 1.03], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panx = interpolate(local, [0, Math.max(dur, 4)], [0, (rnd(step + 3) * 2 - 1) * (isLast ? 18 : 70)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pany = interpolate(local, [0, Math.max(dur, 4)], [0, (rnd(step + 91) * 2 - 1) * (isLast ? 12 : 44)], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = sc.scale * js * pop * drift
  const flash = isLast ? 0 : interpolate(local, [0, 1, 3], [0.05, 0.1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const dx = sc.dx + jx + panx
  const dy = sc.dy + jy + pany

  const Comp = sc.Comp

  return (
    <AbsoluteFill style={{ backgroundColor: sc.bg, overflow: 'hidden' }}>
      <Fonts />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: sc.w, height: sc.h, transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: 'center center' }}>
          <Comp />
        </div>
      </AbsoluteFill>

      {/* viñeta común (cohesión + aire de "metraje") */}
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: `inset 0 0 360px ${hexA('#000', isDark ? 0.62 : 0.26)}` }} />
      {/* destello del corte */}
      {flash > 0 && <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: '#ffffff', opacity: flash }} />}
    </AbsoluteFill>
  )
}
