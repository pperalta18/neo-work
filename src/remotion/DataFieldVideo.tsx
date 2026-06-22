import { type CSSProperties, type ReactNode } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { BRAND } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from './fonts'

/**
 * DataFieldVideo — la prima de DataSweep, pero en lugar de UNA pantalla de datos a
 * pantalla completa cortando muy rápido, aquí los datos aparecen MUY PEQUEÑOS y
 * por TODOS los puntos de la página a la vez: docenas de fragmentos crudos en texto
 * plano (SQL, JSON, código, logs, hex, ADN, métricas, triples, ledgers, diffs,
 * tests, mini-gráficas dibujadas en código…) que POPEAN en su sitio, se sostienen
 * un instante con su destacado y DESAPARECEN, dejando hueco para otro. El campo
 * entero respira: en cualquier frame ~la mitad de las celdas están encendidas y la
 * otra mitad parpadeando dentro o fuera. Es la IA leyendo todo, en todas partes.
 *
 * Como DataSweep: TODO es función pura de useCurrentFrame() (sin CSS animations /
 * Math.random / Date.now). Cada celda tiene un ciclo de CYCLE frames con una fase
 * propia; el contenido y las variaciones se siembran por (celda, ronda mod M), de
 * modo que el frame F y el F+M*CYCLE renderizan IDÉNTICO → loop perfecto.
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
const clamp01 = (x: number) => Math.max(0, Math.min(1, x))
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3)

const F = {
  mono: "'SF Mono', 'JetBrains Mono', 'Courier New', ui-monospace, Menlo, monospace",
  serif: "Georgia, 'Times New Roman', serif",
  sans: BODY_FONT,
} as const

// grounds de datos (idénticos a DataSweep, todo en modo claro)
const EDITOR = { bg: '#fbfbfa', ink: '#1f2328', mut: '#8a9099', line: '#e7eaee', kw: '#8250df', str: '#0a7d33', num: '#0550ae' }
const PAPER = { bg: '#ffffff', ink: '#1a1a1a', mut: '#73726e', line: '#ebebe8' }
const SHEET = { bg: '#f6f7f9', ink: '#1f2328', mut: '#70757a', line: '#dde1e6' }
const TERM = { bg: '#f3f4f1', ink: '#222730', mut: '#7b828c', line: '#e2e5e0', green: '#0a7d33' }
const DVIZ = { bg: '#ffffff', ink: '#1f2328', mut: '#6e7781', line: '#eceff2' }
type Ground = { bg: string; ink: string; mut: string; line: string }

// ── destacado inline (em-based → escala con el font-size del fragmento) ──────────
type Mk = 'marker' | 'box' | 'underline' | 'bracket' | 'outline' | 'tag'
function H({ children, k = 'marker', c = 'yellow' }: { children: ReactNode; k?: Mk; c?: BrandKey }) {
  const color = BRAND[c]
  const base: CSSProperties = { position: 'relative', borderRadius: '0.12em', WebkitBoxDecorationBreak: 'clone' }
  switch (k) {
    case 'marker':
      return <span style={{ ...base, padding: '0.02em 0.16em', borderRadius: '0.14em', background: `linear-gradient(100deg, ${hexA(color, 0)} 0%, ${hexA(color, 0.85)} 8%, ${hexA(color, 0.78)} 92%, ${hexA(color, 0)} 100%)` }}>{children}</span>
    case 'box':
      return <span style={{ ...base, background: color, color: '#fff', padding: '0.02em 0.22em', borderRadius: '0.24em', fontWeight: 600 }}>{children}</span>
    case 'underline':
      return <span style={{ ...base, boxShadow: `inset 0 -0.16em 0 ${hexA(color, 0.5)}` }}>{children}</span>
    case 'bracket':
      return <span style={{ ...base }}><span style={{ color, fontWeight: 700 }}>[</span>{children}<span style={{ color, fontWeight: 700 }}>]</span></span>
    case 'outline':
      return <span style={{ ...base, padding: '0.02em 0.18em', borderRadius: '0.2em', boxShadow: `inset 0 0 0 0.1em ${color}` }}>{children}</span>
    case 'tag':
      return <span style={{ ...base, background: hexA(color, 0.18), color, padding: '0.02em 0.26em', borderRadius: '0.4em', fontWeight: 600 }}>{children}</span>
  }
}

// ── primitivas compactas ─────────────────────────────────────────────────────────
function FLines({ rows, size = 11.5, lh = 1.55, color, mut, num = false }: { rows: ReactNode[]; size?: number; lh?: number; color: string; mut?: string; num?: boolean }) {
  return (
    <div style={{ fontFamily: F.mono, fontSize: size, lineHeight: lh, color }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', whiteSpace: 'pre' }}>
          {num && <span style={{ width: '1.5em', textAlign: 'right', marginRight: '0.8em', color: mut, opacity: 0.6, flex: '0 0 auto' }}>{i + 1}</span>}
          <span style={{ whiteSpace: 'pre' }}>{r}</span>
        </div>
      ))}
    </div>
  )
}

function FGrid({ head, rows, widths, g, size = 11, title }: { head: ReactNode[]; rows: ReactNode[][]; widths: number[]; g: Ground; size?: number; title?: ReactNode }) {
  const tmpl = widths.map((w) => `${w}fr`).join(' ')
  return (
    <div style={{ fontFamily: F.mono, fontSize: size, color: g.ink }}>
      {title && <div style={{ color: g.mut, marginBottom: 6, fontSize: size }}>{title}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: tmpl, gap: '0 14px', padding: '0 0 5px', borderBottom: `1.5px solid ${g.line}`, color: g.mut, fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {head.map((h, i) => <div key={i}>{h}</div>)}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: tmpl, gap: '0 14px', padding: '4px 0', borderBottom: `1px solid ${g.line}`, whiteSpace: 'nowrap' }}>
          {r.map((cc, j) => <div key={j}>{cc}</div>)}
        </div>
      ))}
    </div>
  )
}

// mini-gráficas (las únicas "imágenes", dibujadas en código)
function Spark({ data, color, w = 168, h = 50, area = true }: { data: number[]; color: string; w?: number; h?: number; area?: boolean }) {
  const max = Math.max(...data), min = Math.min(...data)
  const X = (i: number) => (i / (data.length - 1)) * w
  const Y = (v: number) => h - ((v - min) / ((max - min) || 1)) * h
  const line = data.map((v, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(' ')
  const gid = `df-${color.replace('#', '')}-${w}`
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={hexA(color, 0.4)} /><stop offset="100%" stopColor={hexA(color, 0)} /></linearGradient></defs>
      {area && <path d={`${line} L ${w} ${h} L 0 ${h} Z`} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={X(data.length - 1)} cy={Y(data[data.length - 1])} r={3.2} fill={color} />
    </svg>
  )
}
function MiniBars({ data, color, grid, w = 168, h = 52 }: { data: number[]; color: string; grid: string; w?: number; h?: number }) {
  const max = Math.max(...data)
  const bw = w / data.length
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <line x1={0} x2={w} y1={h - 0.5} y2={h - 0.5} stroke={grid} strokeWidth={1} />
      {data.map((v, i) => {
        const bh = (v / max) * (h - 4)
        return <rect key={i} x={i * bw + bw * 0.18} y={h - bh} width={bw * 0.64} height={bh} rx={2} fill={v === max ? BRAND.yellow : color} />
      })}
    </svg>
  )
}
function MiniScatter({ pts, color, grid, w = 150, h = 64 }: { pts: Array<[number, number]>; color: string; grid: string; w?: number; h?: number }) {
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {[0.5].map((t) => <line key={t} x1={0} x2={w} y1={h * t} y2={h * t} stroke={grid} strokeWidth={1} />)}
      {pts.map(([x, y], i) => <circle key={i} cx={x * w} cy={(1 - y) * h} r={i === pts.length - 1 ? 5 : 3} fill={i === pts.length - 1 ? BRAND.red : hexA(color, 0.8)} />)}
    </svg>
  )
}

// ── catálogo de fragmentos pequeños ──────────────────────────────────────────────
// Cada uno devuelve { g: ground, el: nodo }. Reciben una semilla para variar
// pequeños detalles (valores, qué token se destaca) y evitar gemelos idénticos.
type Frag = { g: Ground; el: ReactNode }
const HUES: BrandKey[] = ['blue', 'green', 'violet', 'orange', 'teal', 'red', 'yellow', 'pink']
const pick = <T,>(arr: T[], s: number) => arr[Math.floor(rnd(s) * arr.length)]

const FRAGMENTS: Array<(s: number) => Frag> = [
  // 0 · SQL
  (_s) => ({
    g: SHEET,
    el: (
      <FGrid g={SHEET} size={10.5} title={<><H c="violet" k="tag">SELECT</H> * FROM clientes</>} head={['id', 'razón', 'saldo €']} widths={[1, 2.4, 1.6]} rows={[
        ['1042', 'Aguilar', <H c="green" k="box">12.480</H>],
        ['1044', 'Riera', <H c="red" k="box">−842</H>],
        ['1047', 'Quantic', '24.010'],
        ['1050', 'Bórea', '18.650'],
      ]} />
    ),
  }),
  // 1 · JSON
  (_s) => {
    const k = (x: string) => <span style={{ color: EDITOR.kw }}>"{x}"</span>
    const st = (x: ReactNode) => <span style={{ color: EDITOR.str }}>{x}</span>
    const nu = (x: ReactNode) => <span style={{ color: EDITOR.num }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} num size={11.5} rows={[
        <>{'{'}</>,
        <>{'  '}{k('id')}: {st(<H c="blue" k="underline">"usr_8841"</H>)},</>,
        <>{'  '}{k('rol')}: {st(<H c="violet" k="tag">"admin"</H>)},</>,
        <>{'  '}{k('saldo')}: {nu(<H c="green" k="box">{(2400 + Math.floor(rnd(_s) * 600))}.55</H>)},</>,
        <>{'  '}{k('riesgo')}: {nu(<H c="red" k="box">0.{80 + Math.floor(rnd(_s + 1) * 19)}</H>)}</>,
        <>{'}'}</>,
      ]} />,
    }
  },
  // 2 · código python
  (_s) => {
    const kw = (x: string) => <span style={{ color: EDITOR.kw, fontWeight: 600 }}>{x}</span>
    const co = (x: string) => <span style={{ color: EDITOR.mut }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} num size={11.5} rows={[
        <>{kw('def')} <H c="blue" k="underline">resumir</H>(docs):</>,
        <>{'  '}{kw('for')} d {kw('in')} docs:</>,
        <>{'    '}{kw('if')} d.score &gt; <H c="yellow">0.7</H>:</>,
        <>{'      '}out += <H c="green" k="underline">embed</H>(d)</>,
        <>{'  '}{kw('return')} gen(out, max=<H c="teal" k="box">512</H>)</>,
        <>{co('# 1.482 docs · 3.1 s')}</>,
      ]} />,
    }
  },
  // 3 · log
  (_s) => {
    const ok = (x: string) => <span style={{ color: TERM.green }}>{x}</span>
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={11} rows={[
        <>{ok('[ OK ]')} sync node-eu-1</>,
        <><span style={{ color: BRAND.orange }}>[WARN]</span> latencia <H c="orange" k="box">842ms</H></>,
        <><span style={{ color: BRAND.red, fontWeight: 700 }}>[ERR ]</span> timeout <H c="red" k="underline">apac-2</H></>,
        <>{ok('[ OK ]')} <H c="green" k="box">1.204/1.204</H></>,
      ]} />,
    }
  },
  // 4 · hex
  (_s) => {
    const off = (x: string) => <span style={{ color: BRAND.violet }}>{x}</span>
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={10.5} lh={1.7} rows={[
        <>{off('0000')}  41 49 4b 69 74 20 <H c="yellow">4c 69</H> 76 65</>,
        <>{off('000a')}  <H c="green" k="box">00 00 07 80</H> 00 00 04 38 08</>,
        <>{off('0014')}  de ad be ef <H c="red" k="underline">ca fe</H> 00 01 02</>,
        <>{off('001e')}  73 65 63 3d <H c="teal" k="tag">31 33 33 37</H></>,
      ]} />,
    }
  },
  // 5 · ADN
  (_s) => {
    const seq = (str: string, a: number, b: number, c: BrandKey) => <>{str.slice(0, a)}<H c={c} k="box">{str.slice(a, b)}</H>{str.slice(b)}</>
    const hue = pick(HUES, _s + 4)
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={11.5} lh={1.75} rows={[
        <span style={{ color: BRAND.violet }}>&gt;seq_00412 · cr.7</span>,
        seq('ATGCGCTAACGGATCCGGT', 8, 14, hue),
        seq('GGATCCGTTAACGGCTAGC', 2, 9, 'green'),
        seq('TTAACGGCATCGGATCGTA', 11, 17, 'blue'),
        <span style={{ color: TERM.mut }}>GC 58% · <H c="green" k="tag">GGATCC</H>×14</span>,
      ]} />,
    }
  },
  // 6 · métricas
  (_s) => {
    const ok = (x: ReactNode) => <span style={{ color: TERM.green }}>{x}</span>
    const cpu = 84 + Math.floor(rnd(_s) * 14)
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={11} lh={1.7} rows={[
        <>cpu1=<H c="green" k="box">42%</H> mem=61%</>,
        <>cpu3=<H c="red" k="box">{cpu}%</H> q=<H c="red" k="box">1.880</H></>,
        <>p95=<H c="orange" k="tag">120ms</H> p99=<H c="red" k="tag">842ms</H></>,
        <>req {ok('18.4k/s')} err <H c="red" k="box">0,03%</H></>,
      ]} />,
    }
  },
  // 7 · triples
  (_s) => {
    const T = ({ a, p, o }: { a: ReactNode; p: string; o: ReactNode }) => (
      <div style={{ display: 'flex', gap: 8, whiteSpace: 'nowrap' }}>
        <span style={{ color: BRAND.blue }}>{a}</span><span style={{ color: EDITOR.mut, fontStyle: 'italic' }}>{p}</span><span style={{ color: EDITOR.mut }}>▸</span><span>{o}</span>
      </div>
    )
    return {
      g: EDITOR,
      el: <div style={{ fontFamily: F.mono, fontSize: 11, lineHeight: 1.7, color: EDITOR.ink }}>
        <T a="Aguilar" p="cliente_de" o={<H c="violet" k="tag">AiKit</H>} />
        <T a="Aguilar" p="saldo" o={<H c="green" k="box">12.480€</H>} />
        <T a="Fra#2212" p="estado" o={<H c="red" k="tag">vencida</H>} />
        <T a="SKU-5512" p="stock" o={<H c="red" k="box">0</H>} />
      </div>,
    }
  },
  // 8 · ledger
  (_s) => ({
    g: PAPER,
    el: <FGrid g={PAPER} size={10.5} title={<>Mayor · <H c="violet" k="tag">572 banco</H></>} head={['fecha', 'concepto', 'saldo']} widths={[1.3, 2, 1.4]} rows={[
      ['05/01', 'Fra #2210', '13.190'],
      ['07/01', 'Nómina', <H c="red" k="box">4.770</H>],
      ['14/01', 'Fra #2212', <H c="green" k="underline">31.413</H>],
      ['19/01', 'Fra #2213', <H c="yellow">34.525</H>],
    ]} />,
  }),
  // 9 · redis / KV
  (_s) => {
    const c = (x: string) => <span style={{ color: BRAND.violet }}>{x}</span>
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={11} lh={1.65} rows={[
        <>{c('SET')} sesion:<H c="blue" k="underline">8841</H> EX <H c="orange" k="box">3600</H></>,
        <>{c('INCR')} req → <H c="green" k="box">1.204.882</H></>,
        <>{c('GET')} flag:<H c="violet" k="tag">buscador</H> "on"</>,
        <>{c('ZADD')} rank 0.91 usr_8841</>,
      ]} />,
    }
  },
  // 10 · git diff
  (_s) => {
    const add = (x: ReactNode) => <span style={{ background: hexA(BRAND.green, 0.16), color: '#0a7d33', display: 'block' }}>{x}</span>
    const del = (x: ReactNode) => <span style={{ background: hexA(BRAND.red, 0.14), color: '#b42318', display: 'block' }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={11} rows={[
        <span style={{ color: BRAND.blue }}>@@ -18,7 +18,9 @@</span>,
        del(<>- for x: y = lento(x)</>),
        add(<>+ for x: y = <H c="green" k="underline">rápido</H>(x)</>),
        del(<>- timeout = <H c="red" k="box">30</H></>),
        add(<>+ timeout = <H c="green" k="box">5</H></>),
      ]} />,
    }
  },
  // 11 · yaml
  (_s) => {
    const key = (x: string) => <span style={{ color: EDITOR.kw }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} num size={11} rows={[
        <>{key('servicio')}: <H c="blue" k="underline">api-gateway</H></>,
        <>{key('replicas')}: <H c="orange" k="box">8</H></>,
        <>{key('cpu')}: <H c="teal" k="tag">2000m</H></>,
        <>{key('max')}: <H c="yellow">40</H></>,
        <>{key('clave')}: <H c="red" k="underline">DB_PASSWORD</H></>,
      ]} />,
    }
  },
  // 12 · respuesta API
  (_s) => {
    const k = (x: string) => <span style={{ color: BRAND.violet }}>"{x}"</span>
    const st = (x: ReactNode) => <span style={{ color: TERM.green }}>{x}</span>
    return {
      g: TERM,
      el: <FLines color={TERM.ink} mut={TERM.mut} size={11} lh={1.6} rows={[
        <>GET /v1/clientes/8841</>,
        <><span style={{ color: TERM.mut }}>200</span> · <H c="green" k="tag">38ms</H> · 1.2KB</>,
        <>{k('plan')}: {st(<H c="violet" k="tag">"enterprise"</H>)},</>,
        <>{k('mrr')}: <H c="green" k="box">2480</H>,</>,
        <>{k('churn')}: <H c="red" k="box">0.81</H></>,
      ]} />,
    }
  },
  // 13 · tests
  (_s) => {
    const ok = <span style={{ color: '#0a7d33' }}>✓</span>
    const no = <span style={{ color: BRAND.red, fontWeight: 700 }}>✗</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={10.5} lh={1.65} rows={[
        <>{ok} indexa 1M docs   <H c="green" k="box">PASS</H></>,
        <>{ok} recall@10 ≥ 0,90  <H c="green" k="box">PASS</H></>,
        <>{no} p99 &lt; 200ms      <H c="red" k="box">FAIL</H></>,
        <><H c="green" k="underline">142</H> ok · <H c="red" k="underline">3</H> fail</>,
      ]} />,
    }
  },
  // 14 · commit log
  (_s) => {
    const h = (x: string) => <span style={{ color: '#a855f7' }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={10} lh={1.7} rows={[
        <>{h('a1f9d3b')} feat: índice <H c="blue" k="underline">denso</H></>,
        <>{h('e4471bd')} perf: <H c="green" k="box">−38%</H> latencia</>,
        <>{h('3f88e1c')} feat: rotación <H c="violet" k="tag">tokens</H></>,
        <>{h('b5a3e07')} fix: <H c="red" k="underline">fuga memoria</H></>,
        <>{h('63a8d70')} chore: <H c="blue" k="box">v3.2.0</H></>,
      ]} />,
    }
  },
  // 15 · catálogo de errores
  (_s) => {
    const e = (x: string) => <span style={{ color: '#a855f7' }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={10.5} lh={1.65} rows={[
        <>{e('E014')} token <H c="red" k="underline">expirado</H> <H c="red" k="tag">crít</H></>,
        <>{e('E021')} rate limit  <H c="orange" k="tag">aviso</H></>,
        <>{e('E055')} sin memoria  <H c="red" k="tag">crít</H></>,
        <>{e('E070')} <H c="red" k="underline">denegado</H>  <H c="red" k="tag">crít</H></>,
      ]} />,
    }
  },
  // 16 · científica
  (_s) => ({
    g: PAPER,
    el: <FGrid g={PAPER} size={10.5} title={<>Tabla 3 · n=<H c="blue" k="underline">412</H></>} head={['grupo', 'media', 'p']} widths={[1.8, 1, 1.2]} rows={[
      ['control', '4,82', '—'],
      ['5mg', '5,91', <H c="green" k="tag">0,03</H>],
      ['20mg', '7,55', <H c="green" k="box">&lt;0,001</H>],
      ['placebo', '4,79', <H c="red" k="tag">0,71</H>],
    ]} />,
  }),
  // 17 · csv
  (_s) => ({
    g: EDITOR,
    el: <FLines color={EDITOR.ink} mut={EDITOR.mut} num size={10.5} rows={[
      <span style={{ color: EDITOR.mut }}>fecha,sku,uds,importe</span>,
      <>01-12,4471,128,<H c="green" k="underline">3.840</H></>,
      <>01-12,9930,0,<H c="red" k="tag">0,00</H></>,
      <>01-14,4471,311,<H c="yellow">9.330</H></>,
      <>01-15,1180,142,4.260</>,
    ]} />,
  }),
  // 18 · access log
  (_s) => {
    const st = (x: string, c: BrandKey, k: Mk = 'tag') => <H c={c} k={k}>{x}</H>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={9.5} lh={1.7} rows={[
        <>192.168.4.18 "GET /search" {st('200', 'green')}</>,
        <>203.0.113.7 "GET /admin" {st('403', 'red')}</>,
        <>198.51.100.2 "GET /search" {st('500', 'red', 'box')}</>,
        <>192.168.4.55 "POST /search" {st('429', 'orange', 'box')}</>,
      ]} />,
    }
  },
  // 19 · env / config
  (_s) => {
    const k = (x: string) => <span style={{ color: EDITOR.kw }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={10.5} lh={1.6} rows={[
        <>{k('PORT')}=<H c="orange" k="box">8080</H></>,
        <>{k('API_KEY')}=<H c="red" k="underline">sk_live_••4471</H></>,
        <>{k('MODEL')}=<H c="violet" k="tag">claude</H></>,
        <>{k('REPLICAS')}=<H c="green" k="box">8</H></>,
        <>{k('NEW_SEARCH')}=true</>,
      ]} />,
    }
  },
  // 20 · sparkline
  (_s) => ({
    g: DVIZ,
    el: (
      <div style={{ fontFamily: F.sans, color: DVIZ.ink }}>
        <div style={{ fontSize: 11.5, marginBottom: 2 }}>Peticiones/min</div>
        <div style={{ fontSize: 10, color: DVIZ.mut, marginBottom: 6 }}>pico <H c="green" k="box">168k</H></div>
        <Spark data={[42, 55, 50, 68, 62, 80, 96, 88, 132, 150, 142, 168]} color={BRAND.blue} />
      </div>
    ),
  }),
  // 21 · mini bars
  (_s) => ({
    g: DVIZ,
    el: (
      <div style={{ fontFamily: F.sans, color: DVIZ.ink }}>
        <div style={{ fontSize: 11.5, marginBottom: 2 }}>Conversiones</div>
        <div style={{ fontSize: 10, color: DVIZ.mut, marginBottom: 6 }}>el <H c="yellow">jueves</H> +<H c="green" k="box">23%</H></div>
        <MiniBars data={[62, 88, 47, 120, 75, 33, 98]} color={hexA(BRAND.blue, 0.85)} grid={DVIZ.line} />
      </div>
    ),
  }),
  // 22 · scatter
  (_s) => ({
    g: DVIZ,
    el: (
      <div style={{ fontFamily: F.sans, color: DVIZ.ink }}>
        <div style={{ fontSize: 11.5, marginBottom: 2 }}>Gasto·retención</div>
        <div style={{ fontSize: 10, color: DVIZ.mut, marginBottom: 6 }}><H c="green" k="box">r=0,89</H> · <H c="red" k="underline">1 atípico</H></div>
        <MiniScatter pts={[[0.1, 0.14], [0.26, 0.2], [0.41, 0.44], [0.55, 0.58], [0.7, 0.72], [0.85, 0.84], [0.93, 0.2]]} color={BRAND.teal} grid={DVIZ.line} />
      </div>
    ),
  }),
  // 23 · stack trace
  (_s) => ({
    g: TERM,
    el: <FLines color={TERM.ink} mut={TERM.mut} size={10.5} lh={1.6} rows={[
      <><span style={{ color: BRAND.red, fontWeight: 700 }}>Traceback</span>:</>,
      <>{'  '}pipeline.py:<H c="orange" k="box">88</H> procesar</>,
      <>{'  '}embed.py:142 encode(<H c="yellow">batch</H>)</>,
      <><span style={{ color: BRAND.red, fontWeight: 700 }}>RuntimeError</span>: CUDA OOM <H c="red" k="box">14.2GiB</H></>,
    ]} />,
  }),
  // 24 · markdown / KPI
  (_s) => {
    const tk = (x: string) => <span style={{ color: BRAND.blue }}>{x}</span>
    return {
      g: EDITOR,
      el: <FLines color={EDITOR.ink} mut={EDITOR.mut} size={11} lh={1.6} rows={[
        <>{tk('#')} Q4 <H c="yellow">2025</H></>,
        <>ingresos {tk('**')}<H c="green" k="box">+18%</H>{tk('**')}</>,
        <>- margen <H c="teal" k="underline">62%</H></>,
        <>- retención <H c="violet" k="box">114%</H></>,
      ]} />,
    }
  },
  // 25 · inventario / SKU
  (_s) => ({
    g: SHEET,
    el: <FGrid g={SHEET} size={10.5} head={['sku', 'stock', 'estado']} widths={[1.6, 1, 1.6]} rows={[
      ['4471', '1.204', 'OK'],
      ['2210', <H c="red" k="box">12</H>, <H c="red" k="tag">BAJO</H>],
      ['1180', <H c="orange" k="box">47</H>, <H c="orange" k="tag">REPONER</H>],
      ['5512', <H c="red" k="box">0</H>, <H c="red" k="tag">AGOTADO</H>],
    ]} />,
  }),
]

// ── geometría del campo + ciclo ──────────────────────────────────────────────────
const W = 1920
const Hgt = 1080
const COLS = 9
const ROWS = 6
const N = COLS * ROWS
const MX = 36
const MY = 36
const CELL_W = (W - 2 * MX) / COLS
const CELL_H = (Hgt - 2 * MY) / ROWS

// ciclo por celda; fase propia → el campo nunca pulsa al unísono
const CYCLE = 28
const M = 12 // rondas por loop → loop = M*CYCLE
const TIN = 3
const TOUT = 5
const LIFES = [13, 15, 18]
const SKIP = 0.12

export const DATA_FIELD_DURATION = M * CYCLE

// anclas + fases precomputadas (deterministas, constantes en todo el loop)
const ANCHORS = Array.from({ length: N }, (_, c) => {
  const col = c % COLS
  const row = Math.floor(c / COLS)
  return {
    x: MX + (col + 0.5) * CELL_W + (rnd(c * 31 + 5) * 2 - 1) * CELL_W * 0.16,
    y: MY + (row + 0.5) * CELL_H + (rnd(c * 31 + 17) * 2 - 1) * CELL_H * 0.16,
  }
})
const PHASE = Array.from({ length: N }, (_, c) => Math.floor(rnd(c * 53 + 7) * CYCLE))

const plate = (g: Ground): CSSProperties => ({
  background: g.bg,
  border: `1px solid ${g.line}`,
  borderRadius: 9,
  boxShadow: `0 6px 16px ${hexA('#141820', 0.1)}, 0 1px 3px ${hexA('#141820', 0.06)}`,
  padding: '10px 12px',
  maxWidth: 250,
})

function FieldTile({ c, frame }: { c: number; frame: number }) {
  const ph = PHASE[c]
  const local = (((frame - ph) % CYCLE) + CYCLE) % CYCLE
  const kAbs = Math.floor((frame - ph + CYCLE * 4096) / CYCLE)
  const kk = kAbs % M
  const seed = c * 131 + kk * 977

  if (rnd(seed + 3) < SKIP) return null
  const life = LIFES[Math.floor(rnd(seed + 7) * LIFES.length)]
  if (local >= life) return null

  const e = clamp01(local / TIN)
  const x = clamp01((life - local) / TOUT)
  const op = Math.min(easeOut(e), x)
  if (op <= 0.002) return null

  const fi = Math.floor(rnd(seed + 11) * FRAGMENTS.length)
  const frag = FRAGMENTS[fi](seed + 101)

  const s0 = 0.88 + rnd(seed + 13) * 0.22
  const sc = s0 * (0.9 + 0.1 * easeOut(e)) * (0.97 + 0.03 * x)
  const rot = (rnd(seed + 17) * 2 - 1) * 2.2
  const jx = (rnd(seed + 19) * 2 - 1) * CELL_W * 0.28
  const jy = (rnd(seed + 23) * 2 - 1) * CELL_H * 0.28
  const ty = (1 - x) * -7

  const ax = ANCHORS[c].x + jx
  const ay = ANCHORS[c].y + jy + ty
  const z = Math.round(op * 40) + (life - local)

  return (
    <div
      style={{
        position: 'absolute',
        left: ax,
        top: ay,
        transform: `translate(-50%, -50%) scale(${sc}) rotate(${rot}deg)`,
        opacity: op,
        zIndex: z,
        willChange: 'transform, opacity',
      }}
    >
      <div style={plate(frag.g)}>{frag.el}</div>
    </div>
  )
}

export function DataFieldVideo() {
  const frame = useCurrentFrame()
  return (
    <AbsoluteFill style={{ background: `radial-gradient(120% 100% at 50% 44%, #eef0f3 0%, #e6e8ec 68%, #e0e2e7 100%)`, overflow: 'hidden' }}>
      <Fonts />
      <AbsoluteFill>
        {ANCHORS.map((_, c) => (
          <FieldTile key={c} c={c} frame={frame} />
        ))}
      </AbsoluteFill>
      {/* viñeta sutil para cohesión de "footage" */}
      <AbsoluteFill style={{ pointerEvents: 'none', boxShadow: `inset 0 0 320px ${hexA('#0b1020', 0.16)}` }} />
    </AbsoluteFill>
  )
}
