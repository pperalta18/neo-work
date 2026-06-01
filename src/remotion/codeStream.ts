/**
 * codeStream — deterministic source-of-truth for the "code flying by" terminal.
 *
 * Two parts:
 *   1. highlight(line)  — a tiny, dependency-free TS/log syntax tokenizer so we
 *      can author believable code as plain strings and still get colours.
 *   2. buildStream()    — tiles a pool of code + build-log templates into a long
 *      reel, substituting numbers/paths per line index (NOT Math.random, so the
 *      render stays frame-deterministic) and bookending it with the `pnpm build`
 *      prompt and a success summary the scroll lands on.
 */

export type TokColor =
  | 'plain'
  | 'keyword'
  | 'string'
  | 'comment'
  | 'number'
  | 'func'
  | 'type'
  | 'punct'
  | 'ok'
  | 'warn'
  | 'err'
  | 'prompt'
  | 'muted'

export type Tok = { s: string; c: TokColor }

/** Terminal palette — bright enough to read on the near-black surface. */
export const COLORS: Record<TokColor, string> = {
  plain: '#c9d4e3',
  keyword: '#7aa2ff',
  string: '#3ee06b',
  comment: '#5b6675',
  number: '#ffb454',
  func: '#22d3ee',
  type: '#c792ff',
  punct: '#8a94a6',
  ok: '#2ada56',
  warn: '#ffcf22',
  err: '#ff5d54',
  prompt: '#2ada56',
  muted: '#6b7689',
}

const KEYWORDS = new Set([
  'import', 'from', 'export', 'const', 'let', 'var', 'function', 'return',
  'await', 'async', 'if', 'else', 'for', 'while', 'type', 'interface', 'new',
  'class', 'extends', 'implements', 'of', 'in', 'as', 'default', 'void',
  'null', 'true', 'false', 'this',
])

/** Tokenize a single line of pseudo-TypeScript / build output for colouring. */
export function highlight(line: string): Tok[] {
  // Whole-line cases (prompts, log badges) win before per-token scanning.
  if (line.startsWith('$ ')) {
    return [{ s: '$ ', c: 'prompt' }, { s: line.slice(2), c: 'plain' }]
  }
  const head = line.trimStart()[0]
  if (head === '✓' || head === '✔') return [{ s: line, c: 'ok' }]
  if (head === '⚡') return [{ s: line, c: 'warn' }]
  if (head === '✗' || head === '×') return [{ s: line, c: 'err' }]
  if (line.trimStart().startsWith('>')) return [{ s: line, c: 'muted' }]

  const toks: Tok[] = []
  const n = line.length
  let i = 0
  const push = (s: string, c: TokColor) => { if (s) toks.push({ s, c }) }

  while (i < n) {
    const ch = line[i]

    // whitespace run
    if (ch === ' ' || ch === '\t') {
      let j = i
      while (j < n && (line[j] === ' ' || line[j] === '\t')) j++
      push(line.slice(i, j), 'plain'); i = j; continue
    }
    // line comment
    if (ch === '/' && line[i + 1] === '/') { push(line.slice(i), 'comment'); break }
    // string (single / double / template) — consume through the closing quote
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1
      while (j < n && line[j] !== ch) { if (line[j] === '\\') j++; j++ }
      j = Math.min(j + 1, n)
      push(line.slice(i, j), 'string'); i = j; continue
    }
    // number (int / float / hex)
    if (ch >= '0' && ch <= '9') {
      let j = i
      while (j < n && /[0-9._a-fxA-FX]/.test(line[j])) j++
      push(line.slice(i, j), 'number'); i = j; continue
    }
    // identifier / keyword / type / function-call
    if (/[A-Za-z_$@]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_$]/.test(line[j])) j++
      const word = line.slice(i, j)
      let c: TokColor = 'plain'
      if (KEYWORDS.has(word)) c = 'keyword'
      else if (line[j] === '(') c = 'func'
      else if (/^[A-Z]/.test(word)) c = 'type'
      push(word, c); i = j; continue
    }
    // punctuation run (stop before a comment opener)
    let j = i
    while (
      j < n &&
      /[^A-Za-z0-9_$\s'"`]/.test(line[j]) &&
      !(line[j] === '/' && line[j + 1] === '/')
    ) j++
    if (j === i) j++ // safety: always advance
    push(line.slice(i, j), 'punct'); i = j
  }
  return toks
}

// ── reel generation ──────────────────────────────────────────────────────────

/** Deterministic [0,1) pseudo-random from an integer seed (mulberry-ish hash). */
function seeded(i: number): number {
  let x = Math.imul(i ^ 0x9e3779b9, 2654435761) >>> 0
  x ^= x >>> 15
  x = Math.imul(x, 2246822519) >>> 0
  x ^= x >>> 13
  return (x >>> 0) / 4294967296
}

const FILES = [
  'src/components/Editor.tsx',
  'src/lib/neumorphism.ts',
  'src/remotion/Root.tsx',
  'src/stories/neo/widgets/NeoCard.tsx',
  'src/components/PathScene.tsx',
  'src/lib/beatmap.ts',
  'src/stories/neo/widgets/BrowserWidget.tsx',
  'src/remotion/ConversationVideo.tsx',
  'src/components/Cell.tsx',
  'src/components/Grid.tsx',
  'src/stories/neo/NeoMessage.tsx',
  'src/lib/pathfinding.ts',
]

/** Resolve {placeholders} deterministically from the line index. */
function fill(line: string, i: number): string {
  const pick = <T,>(arr: T[], salt: number) => arr[Math.floor(seeded(i * 13 + salt) * arr.length)]
  const int = (lo: number, hi: number, salt: number) =>
    String(lo + Math.floor(seeded(i * 13 + salt) * (hi - lo)))
  return line
    .replace(/{file}/g, () => pick(FILES, 1))
    .replace(/{ms}/g, () => int(6, 280, 2))
    .replace(/{n}/g, () => int(112, 340, 3))
    .replace(/{kb}/g, () => int(8, 96, 4))
    .replace(/{hash2}/g, () => int(10, 99, 5))
    .replace(/{pct}/g, () => int(2, 99, 6))
    .replace(/{hash}/g, () => seeded(i * 13 + 7).toString(16).slice(2, 8))
    .replace(/{frame}/g, () => int(1, 290, 8))
}

/** Code + build-log templates. {curly} tokens are filled per line index. */
const TEMPLATES = [
  "import { interpolate, spring, Easing } from 'remotion'",
  "import { elevation, lightTheme } from '@/lib/neumorphism'",
  "import { NeoCard } from '@/stories/neo/widgets/NeoCard'",
  '',
  '// emerge a plate from the grid as the path advances',
  'export function emerge(frame: number, fps: number): number {',
  '  const s = spring({ frame, fps, config: { damping: {n}, mass: 0.6 } })',
  '  return interpolate(s, [0, 1], [0, 1], { easing: Easing.out(Easing.cubic) })',
  '}',
  '',
  "const plate = elevation(theme, { depth: 'raised', distance: 8, blur: 16 })",
  'const route = reflowRoute(spec.route).slice(0, revealedCount)',
  '',
  '✓ {file} transformed ({ms}ms)',
  '✓ {file} transformed ({ms}ms)',
  '⚡ {n} modules • {kb}.{hash2} kB │ gzip: {kb}.{hash2} kB',
  '> vite v8.0.10 building for production…',
  '> rendering frame {frame}/290 — {pct}%  [{hash}]',
  '',
  'type Coord = [number, number]',
  'interface RouteStep { at: Coord; colSpan?: number; text?: TextSpec }',
  '',
  'export const NeoMessage = ({ from, time, children }: Props) => {',
  "  const align = from === 'me' ? 'flex-end' : 'flex-start'",
  '  return <Bubble style={{ alignSelf: align }}>{children}</Bubble>',
  '}',
  '',
  '  const s = spring({ frame: frame - showAt, fps, config })',
  '  const opacity = interpolate(s, [0, 1], [0, 1])',
  '  const y = (1 - s) * 14',
  '',
  '✓ src/remotion/Root.tsx transformed ({ms}ms)',
  '⚡ chunk index-{hash}.js  {kb}.{hash2} kB',
  '> transforming ({n} modules) {file}',
  '',
  'for (const step of route) renderCell(step, theme, frame)',
  'const scale = Math.min(1, 900 / (cols * 128))',
  'await bundle({ entryPoint, webpackOverride })',
  '',
  '// neumorphic shadow: highlight on the lit corner, shadow opposite',
  'const boxShadow = `${litOffset} ${highlight}, ${darkOffset} ${shadow}`',
  '',
  '✓ {file} transformed ({ms}ms)',
  '> optimizing dependencies… {pct}%',
  '',
]

export type StreamLine = { toks: Tok[] }

export type Stream = {
  lines: StreamLine[]
  /** Raw command typed at the top prompt (without the `$ `). */
  command: string
  /** Index of the opening `$ pnpm build` line (its cursor types the command). */
  cmdIndex: number
  /** Index of the trailing `$ ` prompt the scroll settles on (blinking cursor). */
  promptIndex: number
}

const COMMAND = 'pnpm build --turbo'

/** Build the full, deterministic reel. */
export function buildStream(bodyLines = 300): Stream {
  const intro = [
    `$ ${COMMAND}`,
    '',
    '> aikit-prints@0.1.0 build /Users/aikit/prints',
    '> tsc -b && vite build',
    '',
  ]
  const body: string[] = []
  for (let i = 0; i < bodyLines; i++) {
    body.push(fill(TEMPLATES[i % TEMPLATES.length], i))
  }
  const outro = [
    '',
    '✓ 290 frames rendered → out/aikit.mp4',
    '✓ 312 modules transformed.',
    '⚡ built in 4.21s  •  1.84 MB │ gzip: 486 kB',
    '',
    '$ ',
    '',
    '',
    '',
    '',
  ]

  const raw = [...intro, ...body, ...outro]
  const promptIndex = raw.lastIndexOf('$ ')
  return {
    lines: raw.map((s) => ({ toks: highlight(s) })),
    command: COMMAND,
    cmdIndex: 0,
    promptIndex,
  }
}
