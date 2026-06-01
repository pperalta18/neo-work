/**
 * verify-bundle-clean — does the Remotion bundle stay free of essentia.js / WASM?
 * ────────────────────────────────────────────────────────────────────────────
 * Acceptance gate for the central invariant of plans/music-sync-beats.md and
 * specs/music-sync.md: the offline analyser (essentia.js, WASM) is confined to
 * `scripts/analyze-beats.mjs` and must NEVER enter the Remotion render bundle.
 * A single stray `import 'essentia.js'` reached transitively by a composition
 * would pull its WASM glue + a `.wasm` asset into the webpack output, bloating it
 * and breaking the "analysis is offline, the render reads JSON only" design — yet
 * every frame would still look fine, so nothing else catches it.
 *
 * Pipeline:
 *   1. Bundle the Remotion entry with webpack (the same `@`-alias / asset rules as
 *      remotion.config.ts) into a throwaway dir — the only impure edge, plus…
 *   2. …walk that dir, reading text chunks (.js/.map/.html/…) and noting binaries
 *      (.wasm/fonts/audio) by name.
 *   3. Hand the files to the pure `scanBundleForForbidden` (src/lib/verifyBundleClean.ts),
 *      which decides pass/fail; print the verdict and exit 0 (clean) or 1 (leaked).
 *
 * The verdict logic lives in src/lib and is unit-tested without webpack; this file
 * is just the bundle/walk shell, the same split verify-tour-audio.mjs uses. Node
 * strips the `.ts` types on import, so no build step is needed.
 *
 * Usage:
 *   node scripts/verify-bundle-clean.mjs [options]
 *   npm run verify:bundle
 *
 * Options:
 *   --entry <path>   Remotion entry to bundle (default src/remotion/index.ts)
 *   --out <dir>      bundle output dir (default out/.bundle-scan)
 *   --keep           keep the bundle dir afterwards (default: delete it)
 */
import { existsSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { scanBundleForForbidden } from '../src/lib/verifyBundleClean.ts'

const DEFAULT_ENTRY = 'src/remotion/index.ts'
const DEFAULT_OUT = 'out/.bundle-scan'

/** Extensions we read as UTF-8 text and search for markers; everything else is binary. */
const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.cjs', '.map', '.html', '.htm', '.css', '.json', '.txt', '.svg', '.xml',
])

function parseArgs(argv) {
  const args = { entry: DEFAULT_ENTRY, out: DEFAULT_OUT, keep: false }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--keep') args.keep = true
    else if (a === '--entry') args.entry = argv[++i]
    else if (a === '--out') args.out = argv[++i]
  }
  return args
}

/**
 * Mirror remotion.config.ts so the programmatic bundle resolves the same modules
 * the CLI render does: the `@` → src alias and the `.riv` / `?raw` asset rules.
 * (The CLI auto-loads remotion.config.ts; the programmatic `bundle()` does not.)
 */
function applyProjectWebpack(current) {
  return {
    ...current,
    resolve: {
      ...current.resolve,
      alias: {
        ...(current.resolve?.alias ?? {}),
        '@': path.join(process.cwd(), 'src'),
      },
    },
    module: {
      ...current.module,
      rules: [
        ...(current.module?.rules ?? []),
        { test: /\.riv$/, type: 'asset/resource' },
        { resourceQuery: /raw/, type: 'asset/source' },
      ],
    },
  }
}

/** Bundle the Remotion entry into `outDir` and return its path. */
async function bundleProject(entry, outDir) {
  console.error(`Bundling ${entry} → ${outDir} …`)
  const { bundle } = await import('@remotion/bundler')
  let lastLogged = -1
  return bundle({
    entryPoint: path.resolve(entry),
    outDir: path.resolve(outDir),
    webpackOverride: applyProjectWebpack,
    onProgress: (progress) => {
      if (progress >= lastLogged + 25) {
        lastLogged = progress
        console.error(`  bundling… ${progress}%`)
      }
    },
  })
}

/** Recursively collect every file under `dir` as `{ path, content }`. */
function readBundleFiles(dir) {
  const files = []
  const walk = (current) => {
    for (const entry of readdirSync(current)) {
      const full = path.join(current, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      const rel = path.relative(dir, full)
      const ext = path.extname(full).toLowerCase()
      const content = TEXT_EXTENSIONS.has(ext) ? readFileSync(full, 'utf8') : null
      files.push({ path: rel, content })
    }
  }
  walk(dir)
  return files
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const bundleDir = await bundleProject(args.entry, args.out)
  try {
    const files = readBundleFiles(bundleDir)
    const report = scanBundleForForbidden(files)

    const tag = report.ok ? 'OK' : 'FAIL'
    console.log(`[${tag}] ${args.entry}: ${report.reason}`)
    if (!report.ok) {
      for (const m of report.matches) {
        const detail = m.kind === 'text' ? `  ${m.sample}` : ''
        console.log(`      ${m.kind}: ${m.marker} → ${m.file}${detail}`)
      }
    }
    process.exitCode = report.ok ? 0 : 1
  } finally {
    if (!args.keep && existsSync(bundleDir)) {
      rmSync(bundleDir, { recursive: true, force: true })
    }
  }
}

// Only run when executed directly — importing for tests must stay silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack ?? err.message : err)
    process.exit(1)
  })
}

// Exported for reuse / testing; the verdict logic itself is in src/lib/verifyBundleClean.ts.
export { parseArgs, readBundleFiles, applyProjectWebpack }
export const __mainPath = fileURLToPath(import.meta.url)
