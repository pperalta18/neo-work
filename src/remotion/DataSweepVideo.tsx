import { type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { BRAND } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'

/**
 * DataSweepVideo — la hermana de WebSweep, pero esto es lo que ve una IA cuando
 * accede a TODOS los datos: no pantallas web maquetadas, sino DATOS CRUDOS en
 * texto plano, vistos muy de cerca y cortados sin parar — tablas SQL, CSV, JSON,
 * código, logs, YAML, diffs, hex dumps, secuencias de ADN, contratos, ledgers,
 * transcripciones, triples de conocimiento… Las únicas "imágenes" son GRÁFICAS,
 * dibujadas en código (deterministas). En cada pantalla hay VARIAS palabras /
 * cifras destacadas, distintas en cada una, como si la IA marcara lo relevante
 * a su paso.
 *
 * A diferencia de WebSweep: NO hay aceleración ni deceleración. Todos los cortes
 * duran lo mismo (D frames) → la pieza LOOPEA de forma perfecta:
 *   step = floor(frame/D) % N · local = frame % D · duración = N*D
 * por lo que el último frame empalma exactamente con el primero. Todo es función
 * pura de useCurrentFrame() (sin CSS animations / Math.random / Date.now).
 */

type BrandKey = keyof typeof BRAND

const hexA = (hex: string, a: number) => {
  const h = hex.replace('#', '')
  const f = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(f, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}
const rnd = (n: number) => {
  let t = (Math.imul(n | 0, 1103515245) + 12345) & 0x7fffffff
  t ^= t >> 13
  return (Math.imul(t, 2654435761) >>> 0) / 4294967296
}

const F = {
  mono: "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace",
  serif: "Georgia, 'Times New Roman', serif",
  news: "'Times New Roman', Georgia, serif",
  sans: BODY_FONT,
  display: "'Universal Sans Display', system-ui, sans-serif",
} as const

// paletas de "grounds" de datos
const EDITOR = { bg: '#fbfbfa', ink: '#1f2328', mut: '#8a9099', line: '#e7eaee', kw: '#8250df', str: '#0a7d33', num: '#0550ae' }
const PAPER = { bg: '#ffffff', ink: '#1a1a1a', mut: '#73726e', line: '#ebebe8' }
const SHEET = { bg: '#f6f7f9', ink: '#1f2328', mut: '#70757a', line: '#dde1e6' }
// "terminal" y "dataviz" en MODO CLARO (todo claro: nada de fondos oscuros)
const TERM = { bg: '#f3f4f1', ink: '#222730', mut: '#7b828c', line: '#e2e5e0', green: '#0a7d33' }
const DVIZ = { bg: '#ffffff', ink: '#1f2328', mut: '#6e7781', line: '#eceff2' }

// ── destacado inline (varios por pantalla) ─────────────────────────────────────
type Mk = 'marker' | 'box' | 'underline' | 'wavy' | 'bracket' | 'outline' | 'tag'
function H({ children, k = 'marker', c = 'yellow' }: { children: ReactNode; k?: Mk; c?: BrandKey }) {
  const color = BRAND[c]
  const base: CSSProperties = { position: 'relative', borderRadius: '0.12em', WebkitBoxDecorationBreak: 'clone' }
  switch (k) {
    case 'marker':
      return <span style={{ ...base, padding: '0.02em 0.16em', borderRadius: '0.14em', background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.85)} 7%, ${hexA(color, 0.78)} 93%, ${hexA(color, 0)} 100%)` }}>{children}</span>
    case 'box':
      return <span style={{ ...base, background: color, color: '#fff', padding: '0.02em 0.24em', borderRadius: '0.22em', fontWeight: 600 }}>{children}</span>
    case 'underline':
      return <span style={{ ...base, boxShadow: `inset 0 -0.16em 0 ${hexA(color, 0.5)}` }}>{children}</span>
    case 'wavy':
      return <span style={{ ...base, textDecoration: 'underline', textDecorationStyle: 'wavy', textDecorationColor: color, textDecorationThickness: '0.06em', textUnderlineOffset: '0.16em' }}>{children}</span>
    case 'bracket':
      return <span style={{ ...base }}><span style={{ color, fontWeight: 700 }}>[</span>{children}<span style={{ color, fontWeight: 700 }}>]</span></span>
    case 'outline':
      return <span style={{ ...base, padding: '0.02em 0.2em', borderRadius: '0.18em', boxShadow: `inset 0 0 0 0.09em ${color}` }}>{children}</span>
    case 'tag':
      return <span style={{ ...base, background: hexA(color, 0.18), color, padding: '0.02em 0.28em', borderRadius: '0.35em', fontWeight: 600 }}>{children}</span>
  }
}

// ── primitivas de datos ────────────────────────────────────────────────────────
const Page = ({ bg, ink, font, children }: { bg: string; ink: string; font: string; children: ReactNode }) => (
  <div style={{ width: '100%', height: '100%', background: bg, color: ink, fontFamily: font, overflow: 'visible' }}>{children}</div>
)

// líneas monoespaciadas (código, json, logs, hex…) con número de línea opcional
function Lines({ rows, size = 30, lh = 1.5, numbers = false, gutter = '#9aa0a6', pad = 64 }: { rows: ReactNode[]; size?: number; lh?: number; numbers?: boolean; gutter?: string; pad?: number }) {
  return (
    <div style={{ padding: `44px ${pad}px`, fontSize: size, lineHeight: lh }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre' }}>
          {numbers && <span style={{ width: '2.6em', textAlign: 'right', marginRight: '1.4em', color: gutter, opacity: 0.6, flex: '0 0 auto' }}>{i + 1}</span>}
          <span style={{ whiteSpace: 'pre' }}>{r}</span>
        </div>
      ))}
    </div>
  )
}

// tabla monoespaciada (SQL, CSV, ledger, científica…)
function Grid({ head, rows, widths, size = 28, headColor, lineColor, mut, pad = 56 }: { head: ReactNode[]; rows: ReactNode[][]; widths: number[]; size?: number; headColor: string; lineColor: string; mut: string; pad?: number }) {
  const tmpl = widths.map((w) => `${w}fr`).join(' ')
  return (
    <div style={{ padding: `40px ${pad}px`, fontSize: size, fontFamily: F.mono }}>
      <div style={{ display: 'grid', gridTemplateColumns: tmpl, gap: '0 44px', padding: '0 0 14px', borderBottom: `2px solid ${lineColor}`, color: mut, fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 1 }}>
        {head.map((h, i) => <div key={i}>{h}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: tmpl, gap: '0 44px', padding: '12px 0', borderBottom: `1px solid ${lineColor}`, whiteSpace: 'nowrap', color: headColor }}>
          {r.map((c, j) => <div key={j}>{c}</div>)}
        </div>
      ))}
    </div>
  )
}

function Prose({ font = F.serif, size = 34, lh = 1.62, paras, pad = 120, header }: { font?: string; size?: number; lh?: number; paras: ReactNode[]; pad?: number; header?: ReactNode }) {
  return (
    <div style={{ padding: `50px ${pad}px`, fontFamily: font }}>
      {header && <div style={{ fontSize: size * 0.62, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.6, marginBottom: '0.7em' }}>{header}</div>}
      <div style={{ fontSize: size, lineHeight: lh }}>
        {paras.map((p, i) => <p key={i} style={{ margin: '0 0 0.7em' }}>{p}</p>)}
      </div>
    </div>
  )
}

// ── gráficas (las únicas "imágenes", dibujadas en código) ───────────────────────
function LineChartSvg({ data, w, h, color, grid, area = true }: { data: number[]; w: number; h: number; color: string; grid: string; area?: boolean }) {
  const max = Math.max(...data), min = Math.min(...data)
  const X = (i: number) => (i / (data.length - 1)) * w
  const Y = (v: number) => h - ((v - min) / ((max - min) || 1)) * h
  const line = data.map((v, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const ar = `${line} L ${w} ${h} L 0 ${h} Z`
  const gid = `lg-${color.replace('#', '')}`
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={hexA(color, 0.45)} /><stop offset="100%" stopColor={hexA(color, 0)} /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={0} x2={w} y1={h * t} y2={h * t} stroke={grid} strokeWidth={1} />)}
      {area && <path d={ar} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={9} fill={color} />
    </svg>
  )
}
function BarsSvg({ data, w, h, color, grid }: { data: number[]; w: number; h: number; color: string; grid: string }) {
  const max = Math.max(...data)
  const bw = w / data.length
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={t} x1={0} x2={w} y1={h * t} y2={h * t} stroke={grid} strokeWidth={1} />)}
      {data.map((v, i) => {
        const bh = (v / max) * h
        const hi = v === max
        return <rect key={i} x={i * bw + bw * 0.16} y={h - bh} width={bw * 0.68} height={bh} rx={6} fill={hi ? BRAND.yellow : color} />
      })}
    </svg>
  )
}
function ScatterSvg({ pts, w, h, color, grid }: { pts: Array<[number, number]>; w: number; h: number; color: string; grid: string }) {
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={`x${t}`} x1={0} x2={w} y1={h * t} y2={h * t} stroke={grid} strokeWidth={1} />)}
      {[0, 0.25, 0.5, 0.75, 1].map((t) => <line key={`y${t}`} x1={w * t} x2={w * t} y1={0} y2={h} stroke={grid} strokeWidth={1} />)}
      {pts.map(([x, y], i) => <circle key={i} cx={x * w} cy={(1 - y) * h} r={i === pts.length - 1 ? 16 : 9} fill={i === pts.length - 1 ? BRAND.red : hexA(color, 0.8)} />)}
    </svg>
  )
}

// ── catálogo de pantallas de datos ───────────────────────────────────────────────
// 0 · resultado SQL
function SqlTable() {
  const rows = [
    ['1042', 'Aguilar S.L.', 'compras@aguilar.es', <H c="green" k="box">12.480,00</H>, '2026‑01‑14'],
    ['1043', 'Nórdica Tech', 'info@nordica.io', '3.190,50', '2026‑01‑15'],
    ['1044', 'Talleres Riera', 'r@riera.cat', <H c="red" k="box">−842,00</H>, '2026‑01‑15'],
    ['1045', 'Delgado e Hijos', 'cuentas@delgado.com', '7.733,20', '2026‑01‑16'],
    ['1046', 'Marisol Vega', 'mvega@correo.es', '1.299,99', '2026‑01‑16'],
    ['1047', 'Quantic Labs', 'ar@quantic.dev', <H c="green" k="box">24.010,00</H>, '2026‑01‑17'],
    ['1048', 'Patiño Foods', 'admin@patino.mx', '5.420,75', '2026‑01‑17'],
    ['1049', 'Estudio Lumen', 'hola@lumen.studio', '988,40', '2026‑01‑18'],
    ['1050', 'Bórea Energía', 'compras@borea.eu', '18.650,00', '2026‑01‑18'],
    ['1051', 'Carmona Hnos.', 'pedidos@carmona.es', '2.114,30', '2026‑01‑19'],
    ['1052', 'Nimbus Cloud', 'billing@nimbus.sh', '9.402,10', '2026‑01‑19'],
    ['1053', 'Sastre & Co', 'a@sastre.co', '640,00', '2026‑01‑20'],
  ]
  return (
    <Page bg={SHEET.bg} ink={SHEET.ink} font={F.mono}>
      <div style={{ padding: '32px 56px 0', color: SHEET.mut, fontSize: 26 }}>
        <H c="violet" k="tag">SELECT</H> * FROM <H c="blue" k="underline">clientes</H> WHERE saldo &lt;&gt; 0 ORDER BY alta DESC; <span style={{ opacity: 0.7 }}>— 12 / 84.213 filas</span>
      </div>
      <Grid head={['id', 'razón_social', 'email', 'saldo €', 'alta']} widths={[1, 3, 4, 2, 2]} rows={rows} headColor={SHEET.ink} lineColor={SHEET.line} mut={SHEET.mut} />
    </Page>
  )
}

// 1 · CSV
function Csv() {
  const r = (a: ReactNode[]) => a
  const rows = [
    r(['2026-01-12', 'SKU-4471', '128', <H c="green" k="underline">3.840,00</H>, 'EU-WEST']),
    r(['2026-01-12', 'SKU-2210', '12', '359,88', 'EU-WEST']),
    r(['2026-01-12', 'SKU-9930', '0', <H c="red" k="tag">0,00</H>, 'LATAM']),
    r(['2026-01-13', 'SKU-4471', '204', <H c="green" k="underline">6.120,00</H>, 'NA-EAST']),
    r(['2026-01-13', 'SKU-1180', '57', '1.710,00', 'EU-WEST']),
    r(['2026-01-13', 'SKU-7702', '9', '404,91', 'APAC']),
    r(['2026-01-14', 'SKU-2210', '38', '1.139,62', 'NA-EAST']),
    r(['2026-01-14', 'SKU-9930', '76', '2.280,00', 'LATAM']),
    r(['2026-01-14', 'SKU-4471', '311', <H c="yellow">9.330,00</H>, 'EU-WEST']),
    r(['2026-01-15', 'SKU-1180', '142', '4.260,00', 'APAC']),
    r(['2026-01-15', 'SKU-7702', '5', '224,95', 'NA-EAST']),
    r(['2026-01-15', 'SKU-3325', '88', '2.640,00', 'EU-WEST']),
  ]
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines numbers gutter={EDITOR.mut} size={29} rows={[
        <span style={{ color: EDITOR.mut }}>fecha,sku,unidades,importe,region</span>,
        ...rows.map((c, i) => <span key={i}>{c[0]},{c[1]},{c[2]},{c[3]},{c[4]}</span>),
        <span style={{ color: EDITOR.mut }}># 1.204.882 registros · separador=','</span>,
      ]} />
    </Page>
  )
}

// 2 · JSON
function Json() {
  const k = (s: string) => <span style={{ color: EDITOR.kw }}>"{s}"</span>
  const s = (v: ReactNode) => <span style={{ color: EDITOR.str }}>{v}</span>
  const n = (v: ReactNode) => <span style={{ color: EDITOR.num }}>{v}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines numbers gutter={EDITOR.mut} size={29} rows={[
        <>{'{'}</>,
        <>{'  '}{k('id')}: {s(<H c="blue" k="underline">"usr_8841"</H>)},</>,
        <>{'  '}{k('nombre')}: {s('"Laura Méndez"')},</>,
        <>{'  '}{k('rol')}: {s(<H c="violet" k="tag">"admin"</H>)},</>,
        <>{'  '}{k('activo')}: <span style={{ color: EDITOR.kw }}>true</span>,</>,
        <>{'  '}{k('saldo')}: {n(<H c="green" k="box">2480.55</H>)},</>,
        <>{'  '}{k('etiquetas')}: [{s('"vip"')}, {s('"mora"')}, {s('"beta"')}],</>,
        <>{'  '}{k('ultimo_acceso')}: {s('"2026-01-19T23:14:02Z"')},</>,
        <>{'  '}{k('preferencias')}: {'{'}</>,
        <>{'    '}{k('idioma')}: {s('"es-ES"')}, {k('tema')}: {s('"oscuro"')},</>,
        <>{'    '}{k('notificaciones')}: {n('false')}</>,
        <>{'  '}{'}'},</>,
        <>{'  '}{k('riesgo')}: {n(<H c="red" k="box">0.91</H>)}</>,
        <>{'}'}</>,
      ]} />
    </Page>
  )
}

// 3 · código (Python)
function Code() {
  const kw = (s: string) => <span style={{ color: EDITOR.kw, fontWeight: 600 }}>{s}</span>
  const st = (s: string) => <span style={{ color: EDITOR.str }}>{s}</span>
  const co = (s: string) => <span style={{ color: EDITOR.mut }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines numbers gutter={EDITOR.mut} size={29} rows={[
        <>{kw('def')} <H c="blue" k="underline">resumir</H>(docs, <H c="violet" k="tag">modelo</H>={st("'claude'")}):</>,
        <>{'    '}{co('# agrega y prioriza por relevancia')}</>,
        <>{'    '}out = []</>,
        <>{'    '}{kw('for')} d {kw('in')} docs:</>,
        <>{'        '}{kw('if')} d.score &gt; <H c="yellow">0.7</H>:</>,
        <>{'            '}out.append(<H c="green" k="underline">embed</H>(d.texto))</>,
        <>{'    '}vec = mean(out, axis=<H c="orange" k="box">0</H>)</>,
        <>{'    '}{kw('return')} modelo.generar(vec, max_tokens=<H c="teal" k="box">512</H>)</>,
        <> </>,
        <>{co('# 1.482 documentos · 3.1 s')}</>,
        <>resultado = resumir(corpus, modelo=<H c="violet" k="tag">'claude'</H>)</>,
        <>{kw('assert')} resultado.<H c="red" k="underline">confianza</H> &gt;= 0.95</>,
      ]} />
    </Page>
  )
}

// 4 · YAML
function Yaml() {
  const key = (s: string) => <span style={{ color: EDITOR.kw }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines numbers gutter={EDITOR.mut} size={29} rows={[
        <>{key('servicio')}: <H c="blue" k="underline">api-gateway</H></>,
        <>{key('replicas')}: <H c="orange" k="box">8</H></>,
        <>{key('region')}: eu-west-1</>,
        <>{key('recursos')}:</>,
        <>{'  '}{key('cpu')}: <H c="teal" k="tag">2000m</H></>,
        <>{'  '}{key('memoria')}: <H c="teal" k="tag">4Gi</H></>,
        <>{key('escalado')}:</>,
        <>{'  '}{key('min')}: 4</>,
        <>{'  '}{key('max')}: <H c="yellow">40</H></>,
        <>{'  '}{key('objetivo_cpu')}: 65%</>,
        <>{key('secretos')}:</>,
        <>{'  '}- {key('clave')}: <H c="red" k="underline">DB_PASSWORD</H></>,
        <>{'    '}{key('origen')}: vault://prod/db</>,
        <>{key('healthcheck')}: <span style={{ color: EDITOR.str }}>/status</span></>,
      ]} />
    </Page>
  )
}

// 5 · git diff
function Diff() {
  const add = (s: ReactNode) => <span style={{ background: hexA(BRAND.green, 0.16), color: '#0a7d33', display: 'block' }}>{s}</span>
  const del = (s: ReactNode) => <span style={{ background: hexA(BRAND.red, 0.14), color: '#b42318', display: 'block' }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={29} gutter={EDITOR.mut} rows={[
        <span style={{ color: EDITOR.mut }}>diff --git a/pipeline.py b/pipeline.py</span>,
        <span style={{ color: BRAND.blue }}>@@ -18,7 +18,9 @@ def procesar(lote):</span>,
        <>{'   '}cache = {'{}'}</>,
        del(<>- {'    '}for x in lote: y = lento(x)</>),
        add(<>+ {'    '}for x in lote: y = <H c="green" k="underline">rápido</H>(x)</>),
        add(<>+ {'    '}métricas.<H c="teal" k="box">incr</H>("procesados")</>),
        <>{'   '}return y</>,
        <span style={{ color: BRAND.blue }}>@@ -54,3 +56,4 @@ class Cola:</span>,
        del(<>- {'    '}timeout = <H c="red" k="box">30</H></>),
        add(<>+ {'    '}timeout = <H c="green" k="box">5</H></>),
        <span style={{ color: EDITOR.mut }}>2 archivos · +<H c="green" k="tag">3</H> −<H c="red" k="tag">2</H></span>,
      ]} />
    </Page>
  )
}

// 6 · markdown source
function Markdown() {
  const tk = (s: string) => <span style={{ color: BRAND.blue }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={30} gutter={EDITOR.mut} rows={[
        <>{tk('#')} Informe trimestral — <H c="yellow">Q4 2025</H></>,
        <> </>,
        <>{tk('##')} Resumen ejecutivo</>,
        <>Los ingresos crecieron un {tk('**')}<H c="green" k="box">18%</H>{tk('**')} interanual.</>,
        <> </>,
        <>- Margen bruto: <H c="teal" k="underline">62%</H></>,
        <>- Coste de adquisición: {tk('`')}<H c="orange" k="tag">−9%</H>{tk('`')}</>,
        <>- Retención neta: {tk('**')}<H c="violet" k="box">114%</H>{tk('**')}</>,
        <> </>,
        <>{tk('##')} Riesgos</>,
        <>&gt; La concentración en <H c="red" k="underline">tres clientes</H> supera el 40%.</>,
        <> </>,
        <>[ver anexo](#anexo) · {tk('![gráfica](chart.svg)')}</>,
      ]} />
    </Page>
  )
}

// 7 · hoja de cálculo (texto)
function SheetGrid() {
  const cols = ['', 'A', 'B', 'C', 'D', 'E']
  const data = [
    ['1', 'Mes', 'Altas', 'Bajas', 'Neto', '% var'],
    ['2', 'Ene', '1.204', '210', <H c="green" k="box">994</H>, '+4,1%'],
    ['3', 'Feb', '1.388', '198', '1.190', '+19,7%'],
    ['4', 'Mar', '1.020', <H c="red" k="box">412</H>, '608', '−48,9%'],
    ['5', 'Abr', '1.560', '233', '1.327', '+118%'],
    ['6', 'May', '1.702', '301', <H c="yellow">1.401</H>, '+5,6%'],
    ['7', 'Jun', '1.890', '288', '1.602', '+14,3%'],
    ['8', 'Σ', '=SUMA(B2:B7)', '=SUMA(C2:C7)', <H c="teal" k="underline">=SUMA(D2:D7)</H>, ''],
  ]
  return (
    <Page bg={SHEET.bg} ink={SHEET.ink} font={F.mono}>
      <div style={{ padding: '40px 50px', fontSize: 30 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(5, 1fr)', borderTop: `1px solid ${SHEET.line}`, borderLeft: `1px solid ${SHEET.line}` }}>
          {[cols, ...data.map((d) => d)].flatMap((row, ri) =>
            row.map((cell, ci) => (
              <div key={`${ri}-${ci}`} style={{ borderRight: `1px solid ${SHEET.line}`, borderBottom: `1px solid ${SHEET.line}`, padding: '12px 16px', background: ri === 0 || ci === 0 ? '#eef1f4' : '#fff', color: ri === 0 || ci === 0 ? SHEET.mut : SHEET.ink, fontWeight: ri === 0 || ci === 0 ? 700 : 400, whiteSpace: 'nowrap' }}>{cell}</div>
            )),
          )}
        </div>
      </div>
    </Page>
  )
}

// 8 · ledger / contabilidad
function Ledger() {
  const rows = [
    ['2026-01-02', 'Apertura', '', '', <H c="blue" k="underline">10.000,00</H>],
    ['2026-01-05', 'Factura #2210', '', '3.190,50', '13.190,50'],
    ['2026-01-07', 'Nómina enero', '8.420,00', '', <H c="red" k="box">4.770,50</H>],
    ['2026-01-09', 'Factura #2211', '', '7.733,20', '12.503,70'],
    ['2026-01-11', 'Proveedor Bórea', '5.100,00', '', '7.403,70'],
    ['2026-01-14', 'Factura #2212', '', <H c="green" k="underline">24.010,00</H>, '31.413,70'],
    ['2026-01-16', 'Impuestos', '6.290,00', '', '25.123,70'],
    ['2026-01-19', 'Factura #2213', '', '9.402,10', <H c="yellow">34.525,80</H>],
  ]
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.mono}>
      <div style={{ padding: '34px 56px 0', fontSize: 30, fontFamily: F.serif }}>Libro mayor — <H c="violet" k="tag">cuenta 572</H> · banco</div>
      <Grid head={['fecha', 'concepto', 'debe', 'haber', 'saldo']} widths={[2, 4, 2, 2, 2]} rows={rows} headColor={PAPER.ink} lineColor={PAPER.line} mut={PAPER.mut} />
    </Page>
  )
}

// 9 · tabla científica
function Scientific() {
  const rows = [
    ['A-01', 'control', '4,82', '0,11', '—'],
    ['A-02', 'dosis 5mg', '5,91', '0,14', <H c="green" k="tag">0,032</H>],
    ['A-03', 'dosis 10mg', '7,40', '0,19', <H c="green" k="tag">0,004</H>],
    ['A-04', 'dosis 20mg', '7,55', '0,21', <H c="green" k="box">&lt;0,001</H>],
    ['A-05', 'placebo', '4,79', '0,10', <H c="red" k="tag">0,71</H>],
    ['B-01', 'control', '4,90', '0,12', '—'],
    ['B-02', 'dosis 10mg', '7,28', '0,17', <H c="green" k="tag">0,006</H>],
    ['B-03', 'dosis 40mg', <H c="yellow">8,02</H>, '0,24', <H c="green" k="box">&lt;0,001</H>],
  ]
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.mono}>
      <div style={{ padding: '34px 56px 0', fontSize: 28, fontFamily: F.serif, color: PAPER.mut }}>Tabla 3 — respuesta por cohorte (n=<H c="blue" k="underline">412</H>)</div>
      <Grid head={['muestra', 'grupo', 'media', 'sd', 'p-valor']} widths={[2, 3, 2, 1.5, 2]} rows={rows} headColor={PAPER.ink} lineColor={PAPER.line} mut={PAPER.mut} />
    </Page>
  )
}

// 10 · inventario / SKU
function Sku() {
  const rows = [
    ['SKU-4471', 'Sensor de presión v3', '1.204', '24,90', 'OK'],
    ['SKU-2210', 'Cable USB-C 2m', <H c="red" k="box">12</H>, '4,50', <H c="red" k="tag">BAJO</H>],
    ['SKU-9930', 'Carcasa aluminio', '388', '18,00', 'OK'],
    ['SKU-1180', 'Batería 5000mAh', <H c="orange" k="box">47</H>, '29,90', <H c="orange" k="tag">REPONER</H>],
    ['SKU-7702', 'Adaptador 65W', '903', '32,00', 'OK'],
    ['SKU-3325', 'Soporte ajustable', '1.560', '14,20', 'OK'],
    ['SKU-5512', 'Kit de tornillos', <H c="red" k="box">0</H>, '2,10', <H c="red" k="tag">AGOTADO</H>],
    ['SKU-8841', 'Hub 7 puertos', '276', <H c="green" k="underline">39,90</H>, 'OK'],
  ]
  return (
    <Page bg={SHEET.bg} ink={SHEET.ink} font={F.mono}>
      <Grid head={['sku', 'descripción', 'stock', 'precio €', 'estado']} widths={[2, 5, 1.5, 2, 2]} rows={rows} headColor={SHEET.ink} lineColor={SHEET.line} mut={SHEET.mut} />
    </Page>
  )
}

// 11 · bibliografía / citas
function Biblio() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.serif}>
      <Prose font={F.serif} size={31} lh={1.7} header="Referencias" paras={[
        <>[1] Méndez, L. &amp; Rivas, A. <i>Modelos de recuperación densa a escala.</i> <H c="blue" k="underline">Nature</H>, vol. 612, pp. 44–59, <H c="yellow">2025</H>.</>,
        <>[2] Aguilar, P. <i>Indexación vectorial para corpus heterogéneos.</i> JMLR, <H c="yellow">2024</H>. doi:<H c="teal" k="tag">10.1162/jmlr.4471</H>.</>,
        <>[3] Vega, M. et al. <i>Síntesis multi-documento con verificación adversarial.</i> ACL, 2026. arXiv:<H c="violet" k="tag">2601.0934</H>.</>,
        <>[4] Bórea, J. <i>Latencia y coste en pipelines de inferencia.</i> <H c="blue" k="underline">SOSP</H>, pp. 210–227, 2025.</>,
        <>[5] Delgado, R. <i>Privacidad diferencial en datos tabulares.</i> <H c="red" k="underline">CCS</H>, 2024.</>,
        <>[6] Quantic Labs. <i>Informe técnico TR-88.</i> 2026. <span style={{ color: PAPER.mut }}>citado 3.402 veces</span>.</>,
      ]} />
    </Page>
  )
}

// 12 · glosario / diccionario de datos
function Dictionary() {
  const E = ({ t, d }: { t: ReactNode; d: ReactNode }) => (
    <div style={{ marginBottom: 22 }}><span style={{ fontWeight: 700 }}>{t}</span> <span style={{ color: PAPER.mut }}>{d}</span></div>
  )
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.serif}>
      <div style={{ padding: '46px 90px', fontSize: 31, lineHeight: 1.5 }}>
        <E t={<H c="blue" k="underline">embedding</H>} d={<>· vector denso que representa el <H c="yellow">significado</H> de un texto en un espacio continuo.</>} />
        <E t={<H c="violet" k="underline">corpus</H>} d={<>· conjunto ordenado de <H c="teal" k="tag">documentos</H> sobre el que opera el modelo.</>} />
        <E t={<H c="green" k="underline">recall</H>} d="· proporción de elementos relevantes efectivamente recuperados." />
        <E t={<H c="orange" k="underline">latencia</H>} d={<>· tiempo entre la consulta y la respuesta; objetivo &lt; <H c="orange" k="box">200 ms</H>.</>} />
        <E t={<H c="red" k="underline">deriva</H>} d="· degradación de un modelo cuando los datos nuevos difieren de los de entrenamiento." />
        <E t={<H c="blue" k="underline">tokenización</H>} d={<>· segmentación del texto en <H c="pink" k="tag">unidades</H> mínimas procesables.</>} />
        <E t={<H c="teal" k="underline">ground truth</H>} d="· conjunto de referencia tomado como verdad para evaluar." />
      </div>
    </Page>
  )
}

// 13 · triples de conocimiento
function Triples() {
  const T = ({ s, p, o }: { s: ReactNode; p: ReactNode; o: ReactNode }) => (
    <div style={{ display: 'flex', gap: 24, whiteSpace: 'nowrap' }}>
      <span style={{ color: BRAND.blue }}>{s}</span><span style={{ color: EDITOR.mut }}>——</span><span style={{ color: EDITOR.mut, fontStyle: 'italic' }}>{p}</span><span style={{ color: EDITOR.mut }}>——▸</span><span>{o}</span>
    </div>
  )
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={30} gutter={EDITOR.mut} rows={[
        <T s="Aguilar S.L." p="es_cliente_de" o={<H c="violet" k="tag">AiKit</H>} />,
        <T s="Aguilar S.L." p="tiene_saldo" o={<H c="green" k="box">12.480 €</H>} />,
        <T s="Laura Méndez" p="trabaja_en" o="Aguilar S.L." />,
        <T s="Laura Méndez" p="rol" o={<H c="blue" k="underline">administradora</H>} />,
        <T s="Factura #2212" p="emitida_por" o="Quantic Labs" />,
        <T s="Factura #2212" p="estado" o={<H c="red" k="tag">vencida</H>} />,
        <T s="Quantic Labs" p="ubicada_en" o="Berlín" />,
        <T s="SKU-5512" p="stock" o={<H c="red" k="box">0</H>} />,
        <T s="SKU-5512" p="proveedor" o="Bórea Energía" />,
        <T s="proceso_88" p="depende_de" o={<H c="yellow">SKU-5512</H>} />,
      ]} />
    </Page>
  )
}

// 14 · contrato (prosa serif)
function Contract() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.serif}>
      <Prose font={F.serif} size={33} lh={1.66} header="Cláusula 7.2 — Tratamiento de la información" paras={[
        <>El <H c="blue" k="underline">Prestador</H> se obliga de forma expresa e irrevocable a no ceder, vender ni transferir los <H c="yellow">datos personales</H> a ningún tercero sin consentimiento previo y por escrito del <H c="blue" k="underline">Titular</H>.</>,
        <>El incumplimiento facultará a la parte perjudicada para resolver el contrato con efectos inmediatos y una penalización de <H c="red" k="box">50.000 €</H>.</>,
        <>El periodo de conservación no excederá de <H c="orange" k="tag">24 meses</H> desde la finalización del servicio, salvo obligación legal.</>,
        <>Las partes se someten a los juzgados de <H c="violet" k="underline">Madrid</H>, con renuncia a cualquier otro fuero que pudiera corresponderles.</>,
      ]} />
    </Page>
  )
}

// 15 · informe (prosa serif a dos columnas)
function Report() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.news}>
      <div style={{ padding: '48px 100px' }}>
        <div style={{ fontFamily: F.sans, fontSize: 24, letterSpacing: 3, color: PAPER.mut, marginBottom: 18 }}>INFORME INTERNO · CONFIDENCIAL</div>
        <div style={{ fontSize: 58, lineHeight: 1.12, marginBottom: 26 }}>Análisis de rentabilidad por <H c="yellow">segmento</H></div>
        <div style={{ columnCount: 2, columnGap: 64, fontSize: 31, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>El segmento <H c="green" k="underline">enterprise</H> aporta el <H c="green" k="box">71%</H> del margen pese a representar solo el 12% de las cuentas. Su coste de servicio cayó un <H c="teal" k="tag">9%</H> tras automatizar el alta.</p>
          <p>En el extremo opuesto, el segmento <H c="red" k="underline">freemium</H> arroja un margen <H c="red" k="box">negativo</H>: cada cuenta cuesta 1,40 € al mes y la conversión a pago se estanca en el <H c="orange" k="tag">2,1%</H>.</p>
          <p>La recomendación es reasignar el gasto de adquisición hacia los canales con mayor <H c="violet" k="underline">retención neta</H> y revisar el modelo gratuito antes del cierre del ejercicio.</p>
        </div>
      </div>
    </Page>
  )
}

// 16 · transcripción
function Transcript() {
  const L = ({ t, who, c, text }: { t: string; who: string; c: BrandKey; text: ReactNode }) => (
    <div style={{ marginBottom: 20, display: 'flex', gap: 22, whiteSpace: 'normal' }}>
      <span style={{ color: PAPER.mut, fontFamily: F.mono, flex: '0 0 auto' }}>{t}</span>
      <div><span style={{ color: BRAND[c], fontWeight: 700 }}>{who}: </span>{text}</div>
    </div>
  )
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.sans}>
      <div style={{ padding: '46px 80px', fontSize: 31, lineHeight: 1.5 }}>
        <L t="00:12" who="Cliente" c="blue" text={<>Necesito el <H c="yellow">presupuesto</H> antes del viernes, es bastante urgente.</>} />
        <L t="00:19" who="Agente" c="green" text={<>Claro. ¿Para cuántas <H c="teal" k="underline">unidades</H> y a qué <H c="teal" k="underline">región</H> lo enviamos?</>} />
        <L t="00:27" who="Cliente" c="blue" text={<>Unas <H c="orange" k="box">300</H>, a la planta de Valencia.</>} />
        <L t="00:34" who="Agente" c="green" text={<>Perfecto. Te lo paso con el <H c="violet" k="tag">descuento por volumen</H> aplicado.</>} />
        <L t="00:41" who="Cliente" c="blue" text={<>Y si hay <H c="red" k="underline">stock</H>, ¿cuándo llegaría?</>} />
        <L t="00:46" who="Agente" c="green" text={<>Con stock confirmado, entrega en <H c="green" k="box">48 h</H>.</>} />
      </div>
    </Page>
  )
}

// 17 · log (terminal)
function Log() {
  const ok = (s: string) => <span style={{ color: TERM.green }}>{s}</span>
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={28} gutter={TERM.mut} rows={[
        <>{ok('[ OK ]')} 03:14:02 conexión node-eu-west-1 establecida</>,
        <>{ok('[INFO]')} 03:14:05 réplica incremental lote <H c="blue" k="underline">8841</H></>,
        <><span style={{ color: BRAND.orange }}>[WARN]</span> 03:14:07 latencia elevada <H c="orange" k="box">842 ms</H></>,
        <>{ok('[INFO]')} 03:14:08 cola de escritura: 1.204 pendientes</>,
        <><span style={{ color: BRAND.red, fontWeight: 700 }}>[ERR ]</span> 03:14:09 timeout en <H c="red" k="underline">node-apac-2</H> (intento 3/5)</>,
        <><span style={{ color: BRAND.orange }}>[WARN]</span> 03:14:10 reintentando en 5 s…</>,
        <>{ok('[INFO]')} 03:14:15 failover → <H c="teal" k="tag">node-apac-3</H></>,
        <>{ok('[ OK ]')} 03:14:16 sincronización completa <H c="green" k="box">1.204/1.204</H></>,
        <>{ok('[INFO]')} 03:14:17 checkpoint guardado offset=<H c="violet" k="tag">0x1f4a2</H></>,
        <><span style={{ color: TERM.mut }}>~/cluster $ tail -f /var/log/sync.log</span></>,
      ]} />
    </Page>
  )
}

// 18 · respuesta API
function Api() {
  const k = (s: string) => <span style={{ color: BRAND.violet }}>"{s}"</span>
  const s = (v: ReactNode) => <span style={{ color: TERM.green }}>{v}</span>
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={27} gutter={TERM.mut} rows={[
        <>GET /v1/clientes/8841 HTTP/2</>,
        <><span style={{ color: TERM.mut }}>200 OK</span> · <H c="green" k="tag">38 ms</H> · 1.2 KB</>,
        <>content-type: application/json</>,
        <>x-ratelimit-remaining: <H c="orange" k="box">12</H></>,
        <> </>,
        <>{'{'}</>,
        <>{'  '}{k('id')}: {s('"usr_8841"')}, {k('estado')}: {s(<H c="green" k="underline">"activo"</H>)},</>,
        <>{'  '}{k('plan')}: {s(<H c="violet" k="tag">"enterprise"</H>)}, {k('mrr')}: <span style={{ color: BRAND.blue }}>{<H c="green" k="box">2480</H>}</span>,</>,
        <>{'  '}{k('riesgo_churn')}: <span style={{ color: BRAND.blue }}>{<H c="red" k="box">0.81</H>}</span>,</>,
        <>{'  '}{k('flags')}: [{s('"vip"')}, {s('"mora"')}]</>,
        <>{'}'}</>,
      ]} />
    </Page>
  )
}

// 19 · stack trace
function StackTrace() {
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={27} gutter={TERM.mut} rows={[
        <><span style={{ color: BRAND.red, fontWeight: 700 }}>Traceback</span> (most recent call last):</>,
        <>{'  '}File <H c="blue" k="underline">"pipeline.py"</H>, line <H c="orange" k="box">88</H>, in procesar</>,
        <>{'    '}vec = embed(d.texto)</>,
        <>{'  '}File "embed.py", line 142, in embed</>,
        <>{'    '}return modelo.encode(<H c="yellow">batch</H>)</>,
        <>{'  '}File "torch/nn.py", line 1104, in encode</>,
        <>{'    '}raise <H c="red" k="underline">RuntimeError</H>(msg)</>,
        <><span style={{ color: BRAND.red, fontWeight: 700 }}>RuntimeError</span>: CUDA out of memory — <H c="red" k="box">14.2 GiB</H> / 16 GiB</>,
        <><span style={{ color: TERM.mut }}>durante <H c="teal" k="tag">batch=512</H> · sugerencia: reducir a 128</span></>,
      ]} />
    </Page>
  )
}

// 20 · hex dump
function HexDump() {
  const off = (s: string) => <span style={{ color: BRAND.violet }}>{s}</span>
  const row = (o: string, hex: ReactNode, asc: ReactNode) => (
    <>{off(o)}  {hex}  <span style={{ color: TERM.mut }}>|{asc}|</span></>
  )
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={27} gutter={TERM.mut} rows={[
        row('00000000', <>41 49 4b 69 74 20 4c 69 76 65 20 <H c="yellow">64 61 74</H> 61</>, 'AIKit Live data'),
        row('00000010', <>89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52</>, '.PNG........IHDR'),
        row('00000020', <><H c="green" k="box">00 00 07 80</H> 00 00 04 38 08 06 00 00 00 2d 1e 7a</>, '...x...8.....-.z'),
        row('00000030', <>de ad be ef <H c="red" k="underline">ca fe</H> 00 01 02 03 04 05 06 07</>, '..............'),
        row('00000040', <>10 11 12 13 14 15 16 17 18 19 1a 1b 1c 1d 1e 1f</>, '................'),
        row('00000050', <>73 65 63 72 65 74 3d <H c="teal" k="tag">31 33 33 37</H> 0a 00 ff fe</>, 'secret=1337....'),
        row('00000060', <>20 4d 61 6e 6f 6c 6f 20 42 61 72 72 6f 73 6f 21</>, ' Manolo Barroso!'),
        row('00000070', <>00 00 00 00 <H c="orange" k="box">49 45 4e 44</H> ae 42 60 82 00 00</>, '....IEND.B`...'),
      ]} />
    </Page>
  )
}

// 21 · secuencia (ADN)
function Dna() {
  const seq = (s: string, hi?: [number, number, BrandKey]) => {
    if (!hi) return <span>{s}</span>
    const [a, b, c] = hi
    return <>{s.slice(0, a)}<H c={c} k="box">{s.slice(a, b)}</H>{s.slice(b)}</>
  }
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={30} lh={1.7} gutter={TERM.mut} rows={[
        <><span style={{ color: BRAND.violet }}>&gt;seq_00412</span> · cromosoma 7 · 8.412 pb</>,
        <>{seq('ATGCGCTAACGGATCCGGTAACGTTAGCCGATCGTTAGC', [12, 18, 'green'])}</>,
        <>{seq('GGATCCGTTAACGGCTAGCATCGGATCGTAGCTAGCTAGC', [22, 30, 'yellow'])}</>,
        <>{seq('TTAACGGCATCGGATCGTAGCATCGGATCGTAGCATCGGA', [4, 10, 'blue'])}</>,
        <>{seq('CGTAGCATCGGATCGTAGCATGCGCTAACGGATCCGGTAA', [26, 33, 'red'])}</>,
        <>{seq('CGGATCCGGTAACGTTAGCCGATCGTTAGCGGATCCGTTA', [0, 6, 'teal'])}</>,
        <>{seq('ACGGCTAGCATCGGATCGTAGCTAGCTAGCTTAACGGCAT', [14, 22, 'orange'])}</>,
        <>{seq('CGGATCGTAGCATCGGATCGTAGCATGCGCTAACGGATCC', [30, 38, 'violet'])}</>,
        <><span style={{ color: TERM.mut }}>GC: 58,2% · motivos: <H c="green" k="tag">GGATCC</H> ×14</span></>,
      ]} />
    </Page>
  )
}

// 22 · KV dump (redis)
function Redis() {
  const c = (s: string) => <span style={{ color: BRAND.violet }}>{s}</span>
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={28} gutter={TERM.mut} rows={[
        <>{c('SET')} sesion:<H c="blue" k="underline">8841</H> "{'{token:…}'}" EX <H c="orange" k="box">3600</H></>,
        <>{c('INCR')} contador:peticiones → <H c="green" k="box">1.204.882</H></>,
        <>{c('LPUSH')} cola:emails "factura#2212"</>,
        <>{c('GET')} feature:<H c="violet" k="tag">nuevo_buscador</H> → "on"</>,
        <>{c('HSET')} cliente:8841 plan "enterprise" mrr <H c="green" k="box">2480</H></>,
        <>{c('EXPIRE')} cache:resumen:c7 <H c="orange" k="box">120</H></>,
        <>{c('ZADD')} ranking 0.91 "usr_8841"</>,
        <>{c('DEL')} bloqueo:proceso_88 → <H c="red" k="tag">1</H></>,
        <>{c('PING')} → <span style={{ color: TERM.green }}>PONG</span> · <H c="teal" k="tag">0.2 ms</H></>,
      ]} />
    </Page>
  )
}

// 23 · stream de métricas
function Metrics() {
  const ok = (s: ReactNode) => <span style={{ color: TERM.green }}>{s}</span>
  return (
    <Page bg={TERM.bg} ink={TERM.ink} font={F.mono}>
      <Lines size={28} gutter={TERM.mut} rows={[
        <>cpu.node1=<H c="green" k="box">42%</H>  mem=61%  net.in=120MB/s  q=204</>,
        <>cpu.node2=<H c="orange" k="box">88%</H>  mem=74%  net.in=98MB/s   q=512</>,
        <>cpu.node3=<H c="red" k="box">97%</H>  mem=<H c="red" k="underline">93%</H>  net.in=140MB/s  q=<H c="red" k="box">1.880</H></>,
        <>req.p50={ok('8ms')}  req.p95=<H c="orange" k="tag">120ms</H>  req.p99=<H c="red" k="tag">842ms</H></>,
        <>throughput=<H c="green" k="box">18.4k</H> req/s  errores=<H c="red" k="box">0,03%</H></>,
        <>db.conns=204/300  cache.hit=<H c="teal" k="box">96,2%</H></>,
        <>gpu.util=<H c="yellow">99%</H>  vram=14,2/16 GiB  temp=71°C</>,
        <>tokens/s=<H c="green" k="underline">2.480</H>  coste/1k=<H c="violet" k="tag">0,002 €</H></>,
      ]} />
    </Page>
  )
}

// 24 · gráfica de líneas
function ChartLine() {
  const data = [42, 55, 50, 68, 62, 80, 74, 96, 88, 110, 104, 132, 150, 142, 168]
  return (
    <Page bg={DVIZ.bg} ink={DVIZ.ink} font={F.sans}>
      <div style={{ padding: '50px 70px' }}>
        <div style={{ fontSize: 40, fontFamily: F.display, marginBottom: 8 }}>Peticiones por minuto</div>
        <div style={{ fontSize: 27, color: DVIZ.mut, marginBottom: 30 }}>últimas 24 h · pico de <H c="green" k="box">168k</H> a las 19:40 · <H c="green" k="underline">tendencia al alza</H></div>
        <LineChartSvg data={data} w={1700} h={620} color={BRAND.blue} grid={DVIZ.line} />
        <div style={{ display: 'flex', gap: 40, marginTop: 24, fontSize: 26, color: DVIZ.mut }}>
          <span>media <H c="blue" k="tag">96k</H></span><span>mín 42k</span><span>máx <H c="yellow">168k</H></span><span>σ 38k</span>
        </div>
      </div>
    </Page>
  )
}

// 25 · gráfica de barras
function ChartBars() {
  const data = [62, 88, 47, 120, 75, 33, 98]
  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  return (
    <Page bg={DVIZ.bg} ink={DVIZ.ink} font={F.sans}>
      <div style={{ padding: '50px 90px' }}>
        <div style={{ fontSize: 40, fontFamily: F.display, marginBottom: 8 }}>Conversiones por día</div>
        <div style={{ fontSize: 27, color: DVIZ.mut, marginBottom: 30 }}>el <H c="yellow">jueves</H> concentra el <H c="green" k="box">23%</H> del total semanal</div>
        <BarsSvg data={data} w={1640} h={560} color={hexA(BRAND.blue, 0.85)} grid={DVIZ.line} />
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${labels.length}, 1fr)`, marginTop: 16, fontSize: 30, color: DVIZ.mut, textAlign: 'center' }}>
          {labels.map((l, i) => <div key={i}>{i === 3 ? <H c="yellow">{l}</H> : l}</div>)}
        </div>
      </div>
    </Page>
  )
}

// 26 · scatter / correlación
function ChartScatter() {
  const pts: Array<[number, number]> = [[0.08, 0.12], [0.18, 0.22], [0.26, 0.2], [0.32, 0.38], [0.41, 0.44], [0.48, 0.4], [0.55, 0.58], [0.62, 0.6], [0.7, 0.72], [0.78, 0.7], [0.85, 0.84], [0.93, 0.2]]
  return (
    <Page bg={DVIZ.bg} ink={DVIZ.ink} font={F.sans}>
      <div style={{ padding: '50px 90px' }}>
        <div style={{ fontSize: 40, fontFamily: F.display, marginBottom: 8 }}>Gasto vs. retención</div>
        <div style={{ fontSize: 27, color: DVIZ.mut, marginBottom: 30 }}>correlación <H c="green" k="box">r = 0,89</H> · <H c="red" k="underline">1 atípico</H> detectado</div>
        <ScatterSvg pts={pts} w={1500} h={560} color={BRAND.teal} grid={DVIZ.line} />
        <div style={{ marginTop: 18, fontSize: 26, color: DVIZ.mut }}>n=412 · p<H c="green" k="tag">&lt;0,001</H> · el punto <H c="red" k="tag">rojo</H> rompe la tendencia</div>
      </div>
    </Page>
  )
}

// 27 · área / acumulado
function ChartArea() {
  const data = [10, 14, 13, 20, 26, 24, 33, 40, 38, 52, 60, 58, 71, 80]
  return (
    <Page bg={DVIZ.bg} ink={DVIZ.ink} font={F.sans}>
      <div style={{ padding: '50px 90px' }}>
        <div style={{ fontSize: 40, fontFamily: F.display, marginBottom: 8 }}>Ingresos acumulados</div>
        <div style={{ fontSize: 27, color: DVIZ.mut, marginBottom: 30 }}>YTD <H c="green" k="box">€ 80,2 M</H> · objetivo <H c="violet" k="tag">€ 75 M</H> <H c="green" k="underline">superado</H></div>
        <LineChartSvg data={data} w={1640} h={600} color={BRAND.green} grid={DVIZ.line} />
        <div style={{ display: 'flex', gap: 40, marginTop: 22, fontSize: 26, color: DVIZ.mut }}>
          <span>Q1 18M</span><span>Q2 <H c="blue" k="tag">21M</H></span><span>Q3 19M</span><span>Q4 <H c="yellow">22M</H></span>
        </div>
      </div>
    </Page>
  )
}

// ── MÁS pantallas: muchísimo texto plano (todo modo claro) ──────────────────────
// 28 · términos / política (prosa densa)
function Terms() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.serif}>
      <div style={{ padding: '46px 110px', fontSize: 28, lineHeight: 1.62, textAlign: 'justify' }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>Política de tratamiento de datos</div>
        <p style={{ margin: '0 0 0.7em' }}>El presente documento regula la forma en que el Responsable recoge, almacena y trata la información facilitada por el Usuario. Al aceptar estas condiciones, el Usuario reconoce haber leído y comprendido la totalidad de sus <H c="blue" k="underline">cláusulas</H>, así como los derechos que le asisten conforme a la normativa vigente.</p>
        <p style={{ margin: '0 0 0.7em' }}>Los datos se conservarán durante un plazo máximo de <H c="orange" k="box">veinticuatro meses</H>, transcurrido el cual serán suprimidos o anonimizados de forma irreversible, salvo que una obligación legal exija su conservación por un periodo superior, en cuyo caso quedarán debidamente bloqueados.</p>
        <p style={{ margin: '0 0 0.7em' }}>El Usuario podrá ejercer en cualquier momento sus derechos de <H c="green" k="underline">acceso, rectificación, supresión y portabilidad</H>, así como oponerse al tratamiento o solicitar su limitación, dirigiendo una comunicación escrita a la dirección que figura en el encabezamiento.</p>
        <p style={{ margin: '0 0 0.7em' }}>En ningún caso los datos serán cedidos a terceros con fines comerciales sin el <H c="yellow">consentimiento expreso</H> del interesado. Las transferencias internacionales, de producirse, se ampararán en las garantías adecuadas previstas por la ley.</p>
        <p style={{ margin: 0 }}>El incumplimiento de lo aquí dispuesto facultará a la parte perjudicada para resolver la relación con efectos inmediatos y reclamar los daños que en su caso se hubieran ocasionado, sin perjuicio de las <H c="red" k="underline">acciones legales</H> que correspondan.</p>
      </div>
    </Page>
  )
}

// 29 · git log
function CommitLog() {
  const h = (s: string) => <span style={{ color: '#a855f7' }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={25} lh={1.55} rows={[
        <>{h('a1f9d3b')}  feat(index): índice vectorial para <H c="blue" k="underline">recuperación densa</H></>,
        <>{h('7c2e90a')}  fix(api): corrige <H c="red" k="underline">timeout</H> en lotes grandes</>,
        <>{h('e4471bd')}  perf: cachea embeddings — <H c="green" k="box">−38%</H> latencia</>,
        <>{h('0b5a8f2')}  docs: actualiza la guía de despliegue</>,
        <>{h('9d12c07')}  refactor: extrae el cliente HTTP reutilizable</>,
        <>{h('3f88e1c')}  feat(auth): rotación automática de <H c="violet" k="tag">tokens</H></>,
        <>{h('a90b4d6')}  test: cobertura del pipeline al <H c="green" k="box">96%</H></>,
        <>{h('c1d7e3a')}  fix: condición de carrera en la cola de escritura</>,
        <>{h('5e2af90')}  chore: sube dependencias menores</>,
        <>{h('8b3c1f4')}  feat: soporte CSV con <H c="orange" k="underline">200 columnas</H></>,
        <>{h('2a7d9e0')}  revert: «feat: caché agresiva»</>,
        <>{h('f6c0b18')}  fix(ui): contraste insuficiente en botones</>,
        <>{h('d3e91a5')}  perf: índice invertido en memoria</>,
        <>{h('41b7c2e')}  feat: reintentos con backoff exponencial</>,
        <>{h('9028fd3')}  docs: ejemplos de la API en español</>,
        <>{h('b5a3e07')}  fix: <H c="red" k="underline">fuga de memoria</H> en el worker</>,
        <>{h('7e1cd49')}  chore: formateo y linting global</>,
        <>{h('c8f04a2')}  feat(export): a Parquet y a JSONL</>,
        <>{h('1d6b9e8')}  test: casos límite de tokenización</>,
        <>{h('a47f203')}  fix: zona horaria en los informes</>,
        <>{h('e90c5b1')}  feat: panel de métricas en vivo</>,
        <>{h('63a8d70')}  chore: release <H c="blue" k="box">v3.2.0</H></>,
      ]} />
    </Page>
  )
}

// 30 · .env / config
function EnvConfig() {
  const k = (s: string) => <span style={{ color: EDITOR.kw }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={26} lh={1.55} rows={[
        <span style={{ color: EDITOR.mut }}># configuración de entorno · producción</span>,
        <>{k('NODE_ENV')}=production</>,
        <>{k('PORT')}=<H c="orange" k="box">8080</H></>,
        <>{k('DATABASE_URL')}=postgres://db.internal:5432/aikit</>,
        <>{k('REDIS_URL')}=redis://cache.internal:6379</>,
        <>{k('API_KEY')}=<H c="red" k="underline">sk_live_••••••••4471</H></>,
        <>{k('JWT_SECRET')}=<H c="red" k="underline">••••••••••••••••</H></>,
        <>{k('MAX_TOKENS')}=<H c="teal" k="box">512</H></>,
        <>{k('MODEL')}=<H c="violet" k="tag">claude</H></>,
        <>{k('EMBED_DIM')}=1536</>,
        <>{k('BATCH_SIZE')}=128</>,
        <>{k('RATE_LIMIT')}=1000/min</>,
        <>{k('CACHE_TTL')}=120</>,
        <>{k('LOG_LEVEL')}=info</>,
        <>{k('REGION')}=eu-west-1</>,
        <>{k('REPLICAS')}=<H c="green" k="box">8</H></>,
        <>{k('TIMEOUT_MS')}=5000</>,
        <>{k('FEATURE_NEW_SEARCH')}=true</>,
        <>{k('FEATURE_LEGACY')}=false</>,
        <>{k('SENTRY_DSN')}=https://••••@sentry.io/4471</>,
        <>{k('S3_BUCKET')}=aikit-prod-data</>,
        <>{k('SMTP_HOST')}=smtp.correo.es</>,
      ]} />
    </Page>
  )
}

// 31 · changelog
function Changelog() {
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={26} lh={1.55} rows={[
        <><H c="blue" k="box">v3.2.0</H>  2026-01-18</>,
        <>  + buscador semántico <H c="green" k="underline">2× más rápido</H></>,
        <>  + exportación a Parquet y JSONL</>,
        <>  ! <H c="red" k="tag">BREAKING</H>: /v1/query renombrado a /v2/search</>,
        <>  - elimina la caché heredada</>,
        <> </>,
        <><H c="blue" k="box">v3.1.4</H>  2026-01-09</>,
        <>  fix: <H c="orange" k="underline">fuga de memoria</H> en el worker</>,
        <>  fix: zona horaria en informes mensuales</>,
        <>  perf: índice invertido residente en memoria</>,
        <> </>,
        <><H c="blue" k="box">v3.1.3</H>  2025-12-21</>,
        <>  fix: reintentos con backoff exponencial</>,
        <>  docs: guía de migración a v3</>,
        <> </>,
        <><H c="blue" k="box">v3.1.2</H>  2025-12-08</>,
        <>  + soporte de <H c="violet" k="tag">200 columnas</H> en CSV</>,
        <>  fix: contraste en modo claro</>,
        <>  chore: actualización de dependencias</>,
      ]} />
    </Page>
  )
}

// 32 · man page
function ManPage() {
  const b = (s: string) => <span style={{ fontWeight: 700 }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={27} lh={1.55} rows={[
        b('NAME'),
        <>{'    '}aikit — <H c="blue" k="underline">motor de recuperación</H> y síntesis</>,
        <> </>,
        b('SYNOPSIS'),
        <>{'    '}aikit search [--top <H c="orange" k="box">k</H>] [--model M] «consulta»</>,
        <> </>,
        b('DESCRIPTION'),
        <>{'    '}Indexa un <H c="violet" k="tag">corpus</H> heterogéneo y responde</>,
        <>{'    '}con respuestas citadas y <H c="green" k="underline">verificadas</H>.</>,
        <> </>,
        b('OPTIONS'),
        <>{'    '}--top k        nº de resultados (def. <H c="green" k="box">10</H>)</>,
        <>{'    '}--model M      claude | local</>,
        <>{'    '}--json         salida estructurada</>,
        <>{'    '}--stream       respuesta incremental</>,
        <>{'    '}--verbose      traza de depuración</>,
        <> </>,
        b('EXIT STATUS'),
        <>{'    '}0 éxito · <H c="red" k="box">1</H> error · 2 uso incorrecto</>,
      ]} />
    </Page>
  )
}

// 33 · especificación / requisitos
function Requirements() {
  const R = ({ id, must, c, text }: { id: string; must: string; c: BrandKey; text: ReactNode }) => (
    <div style={{ marginBottom: 16, display: 'flex', gap: 22 }}>
      <span style={{ color: PAPER.mut, fontFamily: F.mono, flex: '0 0 auto' }}>{id}</span>
      <div>El sistema <H c={c} k="box">{must}</H> {text}</div>
    </div>
  )
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.sans}>
      <div style={{ padding: '46px 90px', fontSize: 29, lineHeight: 1.45 }}>
        <div style={{ fontSize: 44, marginBottom: 24, fontFamily: F.display }}>Especificación funcional</div>
        <R id="REQ-001" must="DEBE" c="green" text="indexar un millón de documentos en menos de cinco minutos." />
        <R id="REQ-002" must="DEBE" c="green" text={<>responder consultas con una latencia p95 inferior a <H c="orange" k="underline">200 ms</H>.</>} />
        <R id="REQ-003" must="DEBERÍA" c="blue" text="ofrecer resultados con cita verificable a la fuente original." />
        <R id="REQ-004" must="DEBE" c="green" text="cifrar los datos en reposo y en tránsito." />
        <R id="REQ-005" must="DEBERÍA" c="blue" text="degradar de forma controlada ante la caída de un nodo." />
        <R id="REQ-006" must="DEBE" c="green" text={<>registrar cada acceso para auditoría durante <H c="violet" k="tag">12 meses</H>.</>} />
        <R id="REQ-007" must="PODRÁ" c="orange" text="exponer un modo sin conexión para corpus pequeños." />
        <R id="REQ-008" must="DEBE" c="green" text={<>respetar el derecho de <H c="red" k="underline">supresión</H> en menos de 30 días.</>} />
        <R id="REQ-009" must="DEBERÍA" c="blue" text="permitir exportar los resultados en formato abierto." />
      </div>
    </Page>
  )
}

// 34 · resultados de tests
function TestResults() {
  const ok = <span style={{ color: '#0a7d33' }}>✓</span>
  const no = <span style={{ color: BRAND.red, fontWeight: 700 }}>✗</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={25} lh={1.6} rows={[
        <>{ok}  indexa 1M de documentos en &lt; 5 s            <H c="green" k="box">PASS</H></>,
        <>{ok}  recall@10 ≥ 0,90                              <H c="green" k="box">PASS</H></>,
        <>{ok}  deduplica entradas idénticas                  <H c="green" k="box">PASS</H></>,
        <>{no}  latencia p99 &lt; 200 ms                        <H c="red" k="box">FAIL</H></>,
        <>{ok}  reintenta ante error transitorio              <H c="green" k="box">PASS</H></>,
        <>{ok}  cifra credenciales en reposo                  <H c="green" k="box">PASS</H></>,
        <>{no}  maneja CSV malformado                          <H c="red" k="box">FAIL</H></>,
        <>{ok}  tokeniza Unicode correctamente                <H c="green" k="box">PASS</H></>,
        <>{ok}  respeta el límite de tasa                      <H c="green" k="box">PASS</H></>,
        <>{ok}  exporta a Parquet sin pérdida                  <H c="green" k="box">PASS</H></>,
        <>{no}  failover &lt; 3 s                                <H c="red" k="box">FAIL</H></>,
        <>{ok}  cita la fuente original                        <H c="green" k="box">PASS</H></>,
        <>{ok}  borra datos bajo solicitud                     <H c="green" k="box">PASS</H></>,
        <> </>,
        <><H c="green" k="underline">142 passed</H> · <H c="red" k="underline">3 failed</H> · 2 skipped · 11,4 s</>,
      ]} />
    </Page>
  )
}

// 35 · catálogo de errores
function ErrorCatalog() {
  const e = (s: string) => <span style={{ color: '#a855f7' }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={26} lh={1.6} rows={[
        <>{e('E001')}  conexión rechazada por el host          <H c="orange" k="tag">aviso</H></>,
        <>{e('E007')}  cuerpo de la petición demasiado grande   <H c="orange" k="tag">aviso</H></>,
        <>{e('E014')}  token <H c="red" k="underline">expirado</H> o inválido         <H c="red" k="tag">crítico</H></>,
        <>{e('E021')}  límite de tasa superado                 <H c="orange" k="tag">aviso</H></>,
        <>{e('E033')}  esquema de entrada no válido            <H c="yellow">error</H></>,
        <>{e('E048')}  tiempo de espera agotado               <H c="red" k="tag">crítico</H></>,
        <>{e('E055')}  memoria insuficiente en el nodo        <H c="red" k="tag">crítico</H></>,
        <>{e('E062')}  documento no encontrado                 info</>,
        <>{e('E070')}  permiso <H c="red" k="underline">denegado</H>                  <H c="red" k="tag">crítico</H></>,
        <>{e('E081')}  formato de fecha incorrecto             <H c="yellow">error</H></>,
        <>{e('E090')}  dependencia externa no disponible       <H c="orange" k="tag">aviso</H></>,
        <>{e('E099')}  error interno no controlado            <H c="red" k="tag">crítico</H></>,
        <> </>,
        <span style={{ color: EDITOR.mut }}># 12 códigos · <H c="red" k="underline">4 críticos</H> en la última hora</span>,
      ]} />
    </Page>
  )
}

// 36 · chat / hilo
function ChatLog() {
  const L = ({ n, c, t }: { n: string; c: BrandKey; t: ReactNode }) => (
    <div style={{ marginBottom: 15 }}><span style={{ color: BRAND[c], fontWeight: 700 }}>{n}</span> <span style={{ color: PAPER.mut }}>›</span> {t}</div>
  )
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.sans}>
      <div style={{ padding: '44px 80px', fontSize: 30, lineHeight: 1.4 }}>
        <L n="ana" c="blue" t={<>¿alguien ha visto el pico de <H c="red" k="underline">errores</H> de esta mañana?</>} />
        <L n="marco" c="green" t="sí, viene del nodo apac-2, ya está failover" />
        <L n="ana" c="blue" t="vale. ¿afecta a clientes?" />
        <L n="marco" c="green" t={<>solo a 3, recuperados en <H c="green" k="box">16 s</H></>} />
        <L n="laura" c="violet" t="he subido un fix, a revisión" />
        <L n="ana" c="blue" t="lo miro" />
        <L n="laura" c="violet" t={<>gracias. también bajé el timeout a <H c="orange" k="box">5 s</H></>} />
        <L n="marco" c="green" t="👍 mergeo cuando pase CI" />
        <L n="ci-bot" c="teal" t={<>build <H c="green" k="box">verde</H> · 142 tests · 11,4 s</>} />
        <L n="ana" c="blue" t={<>perfecto, <H c="yellow">desplegamos</H> a las 18:00</>} />
        <L n="laura" c="violet" t="aviso al canal de soporte" />
        <L n="marco" c="green" t="hecho ✅" />
      </div>
    </Page>
  )
}

// 37 · access log
function AccessLog() {
  const st = (s: string, c: BrandKey, k: Mk = 'tag') => <H c={c} k={k}>{s}</H>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={23} lh={1.6} rows={[
        <>192.168.4.18 — [19/Ene:08:14:02] "GET /v2/search" {st('200', 'green')} 1.204</>,
        <>192.168.4.31 — [19/Ene:08:14:03] "POST /index" {st('201', 'green')} 88</>,
        <>10.0.2.9 — [19/Ene:08:14:03] "GET /health" {st('200', 'green')} 12</>,
        <>192.168.4.18 — [19/Ene:08:14:04] "GET /doc/8841" {st('404', 'orange')} 33</>,
        <>203.0.113.7 — [19/Ene:08:14:05] "GET /admin" {st('403', 'red')} 0</>,
        <>192.168.4.55 — [19/Ene:08:14:05] "POST /v2/search" {st('200', 'green')} 2.480</>,
        <>10.0.2.9 — [19/Ene:08:14:06] "GET /metrics" {st('200', 'green')} 904</>,
        <>198.51.100.2 — [19/Ene:08:14:07] "GET /v2/search" {st('500', 'red', 'box')} 0</>,
        <>192.168.4.18 — [19/Ene:08:14:08] "GET /export.parquet" {st('200', 'green')} 1.9e6</>,
        <>192.168.4.31 — [19/Ene:08:14:08] "DELETE /doc/5512" {st('204', 'green')} 0</>,
        <>203.0.113.7 — [19/Ene:08:14:09] "GET /admin" {st('403', 'red')} 0</>,
        <>10.0.2.9 — [19/Ene:08:14:10] "GET /health" {st('200', 'green')} 12</>,
        <>192.168.4.55 — [19/Ene:08:14:11] "POST /v2/search" {st('429', 'orange', 'box')} 0</>,
        <>192.168.4.18 — [19/Ene:08:14:12] "GET /doc/1042" {st('200', 'green')} 740</>,
        <>198.51.100.2 — [19/Ene:08:14:13] "GET /v2/search" {st('200', 'green')} 1.330</>,
        <>10.0.2.9 — [19/Ene:08:14:14] "GET /metrics" {st('200', 'green')} 904</>,
        <span style={{ color: EDITOR.mut }}># 18.412 req/min · <H c="red" k="underline">0,03% 5xx</H> · p95 120 ms</span>,
      ]} />
    </Page>
  )
}

// 38 · dependencias
function Deps() {
  const v = (s: string) => <span style={{ color: EDITOR.num }}>{s}</span>
  return (
    <Page bg={EDITOR.bg} ink={EDITOR.ink} font={F.mono}>
      <Lines size={25} lh={1.55} rows={[
        <>aikit-core@{v('3.2.0')}</>,
        <>├─ react@{v('19.0.0')}</>,
        <>├─ remotion@{v('4.0.469')}</>,
        <>├─ pg@{v('8.13.1')}</>,
        <>├─ ioredis@{v('5.4.1')}  <H c="orange" k="tag">desactualizado</H></>,
        <>├─ zod@{v('3.24.0')}</>,
        <>├─ undici@{v('6.21.0')}  <H c="red" k="tag">CVE-2026-0042</H></>,
        <>├─ pino@{v('9.5.0')}</>,
        <>├─ sharp@{v('0.33.5')}</>,
        <>├─ parquetjs@{v('1.7.0')}</>,
        <>│  └─ thrift@{v('0.21.0')}</>,
        <>├─ tiktoken@{v('1.0.18')}</>,
        <>├─ p-retry@{v('6.2.0')}</>,
        <>├─ date-fns@{v('4.1.0')}</>,
        <>├─ nanoid@{v('5.0.9')}</>,
        <>└─ dotenv@{v('16.4.7')}</>,
        <> </>,
        <span style={{ color: EDITOR.mut }}># 412 paquetes · <H c="green" k="underline">0 vulnerabilidades altas</H> · 1 media</span>,
      ]} />
    </Page>
  )
}

// 39 · acta de reunión
function Minutes() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.serif}>
      <div style={{ padding: '46px 100px', fontSize: 30, lineHeight: 1.55 }}>
        <div style={{ fontSize: 46, marginBottom: 10 }}>Acta — Comité de producto</div>
        <div style={{ fontSize: 25, color: PAPER.mut, marginBottom: 26 }}>18 de enero de 2026 · asisten: Ana, Marco, Laura, Pedro</div>
        <p style={{ margin: '0 0 0.6em' }}><b>1.</b> Se aprueba priorizar el <H c="blue" k="underline">buscador semántico</H> para el próximo trimestre.</p>
        <p style={{ margin: '0 0 0.6em' }}><b>2.</b> Se acuerda fijar el objetivo de latencia p95 en <H c="orange" k="box">200 ms</H>.</p>
        <p style={{ margin: '0 0 0.6em' }}><b>3.</b> Marco asume la migración a la API v2 antes del <H c="violet" k="tag">28 de febrero</H>.</p>
        <p style={{ margin: '0 0 0.6em' }}><b>4.</b> Laura revisará la <H c="red" k="underline">deuda técnica</H> del worker y propondrá plan.</p>
        <p style={{ margin: '0 0 0.6em' }}><b>5.</b> Se descarta, por ahora, el modo sin conexión.</p>
        <p style={{ margin: '0 0 0.6em' }}><b>6.</b> Próxima reunión: <H c="green" k="underline">1 de febrero</H>, 10:00.</p>
        <p style={{ margin: 0, color: PAPER.mut }}>Cierre de la sesión a las 11:42. Redacta el acta: Pedro.</p>
      </div>
    </Page>
  )
}

// 40 · email
function EmailThread() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.sans}>
      <div style={{ padding: '44px 90px', fontSize: 29, lineHeight: 1.5 }}>
        <div style={{ fontSize: 25, color: PAPER.mut, marginBottom: 4 }}>De: laura@empresa.com · Para: equipo@empresa.com</div>
        <div style={{ fontSize: 38, margin: '6px 0 20px' }}>Asunto: <H c="red" k="underline">URGENTE</H> — revisar antes de las 18:00</div>
        <p style={{ margin: '0 0 0.7em' }}>Buenas tardes:</p>
        <p style={{ margin: '0 0 0.7em' }}>Reenvío esto porque nadie ha validado todavía los <H c="yellow">presupuestos</H> del último despliegue. La mitad están duplicados o vacíos y el cliente los espera <H c="orange" k="box">hoy</H>.</p>
        <p style={{ margin: '0 0 0.7em' }}>¿Podéis confirmar antes de las <H c="blue" k="box">18:00</H>? No quiero que esto estalle el lunes.</p>
        <p style={{ margin: '0 0 0.9em' }}>Gracias. — Laura</p>
        <div style={{ borderLeft: `3px solid ${PAPER.line}`, paddingLeft: 24, color: PAPER.mut, fontSize: 27 }}>
          <p style={{ margin: '0 0 0.4em' }}>El 17 ene, Marco escribió:</p>
          <p style={{ margin: 0 }}>&gt; Lo miro mañana a primera hora, dejo nota en el <H c="violet" k="tag">tablero</H>.</p>
        </div>
      </div>
    </Page>
  )
}

// 41 · artículo (prosa a dos columnas, denso)
function LongArticle() {
  return (
    <Page bg={PAPER.bg} ink={PAPER.ink} font={F.news}>
      <div style={{ padding: '46px 90px' }}>
        <div style={{ fontFamily: F.sans, fontSize: 23, letterSpacing: 3, color: PAPER.mut, marginBottom: 16 }}>TECNOLOGÍA · ANÁLISIS</div>
        <div style={{ fontSize: 60, lineHeight: 1.1, marginBottom: 24 }}>La máquina que <H c="yellow">lee</H> más rápido de lo que podemos escribir</div>
        <div style={{ columnCount: 3, columnGap: 56, fontSize: 27, lineHeight: 1.58, textAlign: 'justify' }}>
          <p style={{ margin: '0 0 0.7em' }}>Durante décadas, el cuello de botella de cualquier organización fue la <H c="blue" k="underline">atención humana</H>: alguien tenía que leer, entender y decidir. Hoy ese límite se ha movido de sitio.</p>
          <p style={{ margin: '0 0 0.7em' }}>Los sistemas actuales recorren millones de registros por segundo, cruzan tablas, contratos y mensajes, y extraen lo relevante sin fatiga. La diferencia no es de grado, es de <H c="green" k="underline">naturaleza</H>.</p>
          <p style={{ margin: '0 0 0.7em' }}>Lo que antes ocupaba a un equipo durante <H c="orange" k="box">semanas</H> se resuelve ahora en el tiempo que tarda en cargarse esta página. Y lo hace, además, dejando un rastro citable de cada fuente.</p>
          <p style={{ margin: '0 0 0.7em' }}>Quedan preguntas abiertas sobre <H c="red" k="underline">privacidad</H>, sesgo y verificación, pero la dirección parece clara: la lectura deja de ser un recurso escaso.</p>
          <p style={{ margin: 0 }}>El reto, dicen los expertos, ya no es acceder a la información, sino decidir <H c="violet" k="tag">qué preguntar</H>.</p>
        </div>
      </div>
    </Page>
  )
}

// ── catálogo + secuencia ───────────────────────────────────────────────────────
type Screen = { Comp: () => ReactNode; bg: string; w: number; h: number; scale: number; dx: number; dy: number }
const S = (Comp: () => ReactNode, bg: string, w: number, h: number, scale: number, dx = 0, dy = 0): Screen => ({ Comp, bg, w, h, scale, dx, dy })

const SCREENS: Screen[] = [
  S(SqlTable, SHEET.bg, 1920, 1500, 1.26, 0, 40), // 0
  S(Csv, EDITOR.bg, 1920, 1480, 1.26, 40, 30), // 1
  S(Json, EDITOR.bg, 1700, 1500, 1.3, -20, 20), // 2
  S(Code, EDITOR.bg, 1820, 1460, 1.28, 0, 30), // 3
  S(Yaml, EDITOR.bg, 1700, 1500, 1.3, 30, 30), // 4
  S(Diff, EDITOR.bg, 1820, 1440, 1.28, 0, 30), // 5
  S(Markdown, EDITOR.bg, 1820, 1440, 1.28, 20, 30), // 6
  S(SheetGrid, SHEET.bg, 1860, 1320, 1.26, 0, 30), // 7
  S(Ledger, PAPER.bg, 1920, 1460, 1.26, 0, 40), // 8
  S(Scientific, PAPER.bg, 1860, 1440, 1.26, 0, 40), // 9
  S(Sku, SHEET.bg, 1920, 1380, 1.28, 0, 30), // 10
  S(Biblio, PAPER.bg, 1820, 1420, 1.28, 0, 40), // 11
  S(Dictionary, PAPER.bg, 1820, 1440, 1.28, 0, 30), // 12
  S(Triples, EDITOR.bg, 1860, 1420, 1.28, 20, 30), // 13
  S(Contract, PAPER.bg, 1760, 1440, 1.3, 0, 40), // 14
  S(Report, PAPER.bg, 1920, 1380, 1.26, 0, 40), // 15
  S(Transcript, PAPER.bg, 1820, 1420, 1.28, 0, 40), // 16
  S(Log, TERM.bg, 1920, 1380, 1.28, 0, 30), // 17
  S(Api, TERM.bg, 1820, 1420, 1.3, 0, 30), // 18
  S(StackTrace, TERM.bg, 1860, 1380, 1.3, 0, 30), // 19
  S(HexDump, TERM.bg, 1960, 1380, 1.28, 0, 30), // 20
  S(Dna, TERM.bg, 1900, 1420, 1.3, -20, 30), // 21
  S(Redis, TERM.bg, 1900, 1400, 1.3, 0, 30), // 22
  S(Metrics, TERM.bg, 1960, 1380, 1.28, 0, 30), // 23
  S(ChartLine, DVIZ.bg, 1920, 1080, 1.22, 0, 0), // 24
  S(ChartBars, DVIZ.bg, 1920, 1080, 1.22, 0, 0), // 25
  S(ChartScatter, DVIZ.bg, 1920, 1080, 1.22, 0, 0), // 26
  S(ChartArea, DVIZ.bg, 1920, 1080, 1.22, 0, 0), // 27
  S(Terms, PAPER.bg, 1820, 1500, 1.2, 0, 40), // 28
  S(CommitLog, EDITOR.bg, 1880, 1560, 1.2, 20, 40), // 29
  S(EnvConfig, EDITOR.bg, 1800, 1560, 1.22, 0, 40), // 30
  S(Changelog, EDITOR.bg, 1820, 1520, 1.22, 0, 40), // 31
  S(ManPage, EDITOR.bg, 1820, 1500, 1.22, 0, 40), // 32
  S(Requirements, PAPER.bg, 1880, 1480, 1.2, 0, 40), // 33
  S(TestResults, EDITOR.bg, 1900, 1500, 1.2, 0, 40), // 34
  S(ErrorCatalog, EDITOR.bg, 1900, 1480, 1.2, 0, 40), // 35
  S(ChatLog, PAPER.bg, 1820, 1460, 1.22, 0, 40), // 36
  S(AccessLog, EDITOR.bg, 1980, 1480, 1.2, 0, 40), // 37
  S(Deps, EDITOR.bg, 1820, 1520, 1.22, 0, 40), // 38
  S(Minutes, PAPER.bg, 1840, 1460, 1.2, 0, 40), // 39
  S(EmailThread, PAPER.bg, 1820, 1440, 1.22, 0, 40), // 40
  S(LongArticle, PAPER.bg, 1920, 1380, 1.2, 0, 40), // 41
]

// Orden del flujo (loopea). Entrelaza datos claros / terminal oscuro / gráficas.
const SEQ = [
  0, 17, 28, 24, 1, 18, 29, 2, 19, 30, 3, 20, 31, 25, 4, 21, 32, 5, 22, 33, 6,
  23, 34, 26, 7, 8, 35, 9, 36, 10, 37, 11, 38, 27, 12, 39, 13, 40, 14, 41, 15, 16,
  29, 2, 17, 33, 5, 24, 40, 8, 30, 13, 36, 25, 20, 11,
]

// Velocidad CONSTANTE: cada corte dura D frames → loop perfecto (N*D).
const D = 6
export const DATASWEEP_DURATION = SEQ.length * D

export function DataSweepVideo() {
  const frame = useCurrentFrame()
  const step = Math.floor(frame / D) % SEQ.length
  const local = frame % D
  const sc = SCREENS[SEQ[step]]

  // jitter determinista por corte (cada reaparición encuadra otra zona)
  const jx = (rnd(step * 7 + 1) * 2 - 1) * 150
  const jy = (rnd(step * 7 + 53) * 2 - 1) * 120
  const js = 1 + rnd(step * 7 + 11) * 0.12

  // las páginas de datos llevan el texto pegado a la izquierda en un plate ancho;
  // al centrar+escalar quedaba cortado por la izquierda → lo empujamos a la derecha.
  // las gráficas (única altura 1080) ya van centradas, no se tocan.
  const dataShiftX = sc.h <= 1100 ? 0 : 240

  // golpe del corte + deriva/pan lentos, IDÉNTICOS en cada corte (sin accel global)
  const pop = interpolate(local, [0, 2], [1.05, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  const drift = interpolate(local, [2, D], [1, 1.02], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const panx = interpolate(local, [0, D], [0, (rnd(step + 3) * 2 - 1) * 64], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const pany = interpolate(local, [0, D], [0, (rnd(step + 91) * 2 - 1) * 44], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = sc.scale * js * pop * drift
  const flash = interpolate(local, [0, 1, 3], [0.06, 0.12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const Comp = sc.Comp

  return (
    <AbsoluteFill style={{ backgroundColor: sc.bg, overflow: 'hidden' }}>
      <Fonts />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: sc.w, height: sc.h, transform: `translate(${sc.dx + dataShiftX + jx + panx}px, ${sc.dy + jy + pany}px) scale(${scale})`, transformOrigin: 'center center' }}>
          <Comp />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: `inset 0 0 360px ${hexA('#000', 0.2)}` }} />
      <AbsoluteFill style={{ pointerEvents: 'none', backgroundColor: '#ffffff', opacity: flash }} />
    </AbsoluteFill>
  )
}
