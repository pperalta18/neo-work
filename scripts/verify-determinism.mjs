/**
 * verify-determinism — does ProductTour render byte-identically twice?
 * ────────────────────────────────────────────────────────────────────
 * Acceptance gate for the bedrock guarantee of plans/music-sync-beats.md and
 * specs/music-sync.md: every animation derives from `useCurrentFrame()` (never
 * wall-clock time, never live audio analysis), so the SAME frame index must
 * always rasterise to the SAME pixels. That is what makes parallel/distributed
 * rendering safe and what lets a Studio preview match the rendered MP4 frame for
 * frame. A frame that rendered differently on a second pass would break both.
 *
 * Pipeline:
 *   1. Read the committed beat map JSON (default test-beat) and bundle the
 *      Remotion entry; select the `ProductTour` composition (its registered
 *      fps + durationInFrames are authoritative).
 *   2. Ask the pure `chooseSampleFrames` (src/lib/verifyDeterminism.ts) which
 *      frames to check: endpoints, the scene-cut frames (`planBeatScenes` —
 *      transition boundaries are where non-determinism would most likely show),
 *      and even coverage in between.
 *   3. Render each sampled frame TWICE to separate PNGs, sha256 each file, and
 *      hand the (frame, hashA, hashB) pairs to the pure `determinismReport`,
 *      which fails on any mismatch — and on an empty sample set, so a no-op can't
 *      pass. Print the verdict; exit non-zero on failure.
 *
 * The verdict logic lives in src/lib and is unit-tested without Remotion; this
 * file is just the bundle/render/hash shell, the same split verify-fps.mjs and
 * verify-tour-audio.mjs use. Node strips the `.ts` types on import, so no build
 * step is needed.
 *
 * Usage:
 *   node scripts/verify-determinism.mjs [map.beats.json] [options]
 *   npm run verify:determinism            (defaults to public/audio/test-beat.beats.json)
 *
 * Options:
 *   --samples <n>    even-coverage frame count to sample (default 8)
 *   --frames a,b,c   render exactly these frames instead (overrides --samples)
 *   --scenes <n>     scene count whose cut frames are always sampled (default 3)
 *   --keep           keep the rendered stills (default: delete them)
 *   --entry <path>   Remotion entry to bundle (default src/remotion/index.ts)
 */
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { chooseSampleFrames, determinismReport } from '../src/lib/verifyDeterminism.ts'
import { planBeatScenes } from '../src/lib/beatScenes.ts'

const DEFAULT_MAP = 'public/audio/test-beat.beats.json'
const DEFAULT_ENTRY = 'src/remotion/index.ts'
const DEFAULT_OUT = 'out/.determinism-stills'
const DEFAULT_SAMPLES = 8
/** The ProductTour lays out 3 scenes; keep this in sync with its SCENES length. */
const DEFAULT_SCENES = 3
const COMPOSITION_ID = 'ProductTour'

function parseArgs(argv) {
  const args = {
    samples: DEFAULT_SAMPLES,
    scenes: DEFAULT_SCENES,
    frames: null,
    keep: false,
    entry: DEFAULT_ENTRY,
  }
  const positionals = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--keep') args.keep = true
    else if (a === '--samples') args.samples = Number(argv[++i])
    else if (a === '--scenes') args.scenes = Number(argv[++i])
    else if (a === '--frames') args.frames = argv[++i].split(',').map((s) => Number(s.trim()))
    else if (a === '--entry') args.entry = argv[++i]
    else positionals.push(a)
  }
  args.map = positionals[0] ?? DEFAULT_MAP
  return args
}

/**
 * Mirror remotion.config.ts (the programmatic `bundle()` does not auto-load it):
 * the `@` → src alias and the `.riv` / `?raw` asset rules, same as
 * verify-fps.mjs and verify-bundle-clean.mjs.
 */
function applyProjectWebpack(current) {
  return {
    ...current,
    resolve: {
      ...current.resolve,
      alias: { ...(current.resolve?.alias ?? {}), '@': path.join(process.cwd(), 'src') },
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

/** sha256 hex of a file's bytes. */
function hashFile(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/**
 * Render each frame in `frames` twice (to separate PNGs), hash both, and return
 * the `(frame, hashA, hashB)` pairs `determinismReport` consumes.
 */
async function renderTwice(frames, base, serveUrl, outDir, keep) {
  const { renderStill } = await import('@remotion/renderer')
  mkdirSync(outDir, { recursive: true })
  const pairs = []
  try {
    for (const frame of frames) {
      const outA = path.join(outDir, `a-${frame}.png`)
      const outB = path.join(outDir, `b-${frame}.png`)
      await renderStill({ composition: base, serveUrl, output: outA, frame })
      await renderStill({ composition: base, serveUrl, output: outB, frame })
      pairs.push({ frame, hashA: hashFile(outA), hashB: hashFile(outB) })
    }
  } finally {
    if (!keep && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
  }
  return pairs
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!existsSync(args.map)) {
    console.error(`Beat map not found: ${args.map}`)
    process.exit(1)
  }
  const map = JSON.parse(readFileSync(args.map, 'utf8'))

  const { bundle } = await import('@remotion/bundler')
  const { selectComposition } = await import('@remotion/renderer')

  console.error(`Bundling ${args.entry} …`)
  const serveUrl = await bundle({
    entryPoint: path.resolve(args.entry),
    webpackOverride: applyProjectWebpack,
  })
  const base = await selectComposition({ serveUrl, id: COMPOSITION_ID })

  // Which frames to compare: explicit override, else endpoints + scene cuts + coverage.
  let frames
  if (args.frames) {
    frames = [...new Set(args.frames.filter((f) => f >= 0 && f < base.durationInFrames))].sort(
      (a, b) => a - b,
    )
  } else {
    const cutFrames = planBeatScenes(map, base.fps, { sceneCount: args.scenes }).cutFrames
    frames = chooseSampleFrames(base.durationInFrames, cutFrames, args.samples)
  }

  console.log(
    `${COMPOSITION_ID}: ${base.width}×${base.height} @ ${base.fps}fps, ` +
      `${base.durationInFrames}f — sampling ${frames.length} frame(s): [${frames.join(', ')}]`,
  )

  const pairs = await renderTwice(frames, base, serveUrl, DEFAULT_OUT, args.keep)
  for (const p of pairs) {
    const same = p.hashA === p.hashB
    console.log(
      same
        ? `  frame ${p.frame}: identical (${p.hashA.slice(0, 8)})`
        : `  frame ${p.frame}: DIFFERS (${p.hashA.slice(0, 8)} ≠ ${p.hashB.slice(0, 8)})`,
    )
  }

  const report = determinismReport(pairs)
  const tag = report.ok ? 'OK' : 'FAIL'
  console.log(`[${tag}] ${args.map}: ${report.reason}`)
  process.exit(report.ok ? 0 : 1)
}

// Only run when executed directly — importing for tests must stay silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack ?? err.message : err)
    process.exit(1)
  })
}

// Exported for reuse / testing; the verdict logic itself is in src/lib/verifyDeterminism.ts.
export { parseArgs, applyProjectWebpack, hashFile }
export const __mainPath = fileURLToPath(import.meta.url)
