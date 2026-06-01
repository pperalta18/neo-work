/**
 * verify-fps — does the same beat map drive the tour correctly at 24/30/60 fps?
 * ────────────────────────────────────────────────────────────────────────────
 * Acceptance gate for the headline guarantee of plans/music-sync-beats.md and
 * specs/music-sync.md: beat-map times are in **seconds**, a frame is
 * `round(t · fps)`, so the *same song* must lay out the *same musical structure*
 * at any frame rate — every scene cut on the same downbeat, the composition still
 * exactly the song's length — with no hardcoded fps hiding in the helpers. The
 * per-fps layout tests check each rate in isolation; this gate checks the rates
 * *against each other* (and can render at each to prove the React tree builds).
 *
 * Pipeline:
 *   1. Read the committed beat map JSON (the only required input).
 *   2. Hand it to the pure `fpsInvarianceReport` (src/lib/verifyFps.ts), which
 *      lays the tour out at each fps and decides pass/fail; print the verdict.
 *   3. (optional, --render) bundle the Remotion entry and render ONE still per
 *      fps — at that fps's first downbeat cut, with fps + duration overridden —
 *      to confirm the composition actually renders at non-30 frame rates.
 *
 * The verdict logic lives in src/lib and is unit-tested without Remotion; this
 * file is just the read/render shell, the same split verify-tour-audio.mjs and
 * verify-bundle-clean.mjs use. Node strips the `.ts` types on import, so no build
 * step is needed.
 *
 * Usage:
 *   node scripts/verify-fps.mjs [map.beats.json] [options]
 *   npm run verify:fps                 (defaults to public/audio/test-beat.beats.json)
 *
 * Options:
 *   --fps 24,30,60   comma-separated frame rates to check (default 24,30,60)
 *   --scenes <n>     scene count to lay out (default 3, matching ProductTour)
 *   --render         also render one still per fps (proves the tree builds)
 *   --keep           keep rendered stills (default: delete them)
 *   --entry <path>   Remotion entry to bundle for --render (default src/remotion/index.ts)
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fpsInvarianceReport } from '../src/lib/verifyFps.ts'
import { formatFrameSummary, secondsToFrame } from '../src/lib/beatmap.ts'

const DEFAULT_MAP = 'public/audio/test-beat.beats.json'
const DEFAULT_ENTRY = 'src/remotion/index.ts'
const DEFAULT_OUT = 'out/.fps-stills'
/** The ProductTour lays out 3 scenes; keep this in sync with its SCENES length. */
const DEFAULT_SCENES = 3

function parseArgs(argv) {
  const args = {
    fps: [24, 30, 60],
    scenes: DEFAULT_SCENES,
    render: false,
    keep: false,
    entry: DEFAULT_ENTRY,
  }
  const positionals = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--render') args.render = true
    else if (a === '--keep') args.keep = true
    else if (a === '--fps') args.fps = argv[++i].split(',').map((s) => Number(s.trim()))
    else if (a === '--scenes') args.scenes = Number(argv[++i])
    else if (a === '--entry') args.entry = argv[++i]
    else positionals.push(a)
  }
  args.map = positionals[0] ?? DEFAULT_MAP
  return args
}

/**
 * Mirror remotion.config.ts (the programmatic `bundle()` does not auto-load it):
 * the `@` → src alias and the `.riv` / `?raw` asset rules, same as
 * verify-bundle-clean.mjs.
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

/**
 * Render one still per fps. For each rate we override the ProductTour's fps and
 * durationInFrames (the composition is registered at 30fps) and render its first
 * downbeat cut — if the layout had a hardcoded-fps bug it would crash or place
 * the frame out of range here. Returns `{ ok, results }`.
 */
async function renderStills(map, report, entry, outDir, keep) {
  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderStill } = await import('@remotion/renderer')

  console.error(`Bundling ${entry} for --render …`)
  const serveUrl = await bundle({
    entryPoint: path.resolve(entry),
    webpackOverride: applyProjectWebpack,
  })
  const base = await selectComposition({ serveUrl, id: 'ProductTour' })

  mkdirSync(outDir, { recursive: true })
  const results = []
  try {
    for (const facts of report.facts) {
      const fps = facts.fps
      const durationInFrames = secondsToFrame(map.duration, fps)
      const frame = facts.cutFrames[0] ?? 0 // first downbeat cut at this fps
      const output = path.join(outDir, `tour-${fps}fps.png`)
      try {
        await renderStill({
          composition: { ...base, fps, durationInFrames },
          serveUrl,
          output,
          frame,
        })
        results.push({ fps, frame, ok: existsSync(output), output })
      } catch (err) {
        results.push({ fps, frame, ok: false, error: err instanceof Error ? err.message : String(err) })
      }
    }
  } finally {
    if (!keep && existsSync(outDir)) rmSync(outDir, { recursive: true, force: true })
  }
  return { ok: results.every((r) => r.ok), results }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!existsSync(args.map)) {
    console.error(`Beat map not found: ${args.map}`)
    process.exit(1)
  }
  const map = JSON.parse(readFileSync(args.map, 'utf8'))

  // Per-fps frame summaries, then the cross-fps verdict.
  for (const fps of args.fps) {
    console.log(formatFrameSummary(map, fps))
    console.log('')
  }

  const report = fpsInvarianceReport(map, args.scenes, args.fps)
  for (const f of report.facts) {
    console.log(
      `  ${f.fps}fps → ${f.totalFrames}f total, cuts on ${f.cutOn} ` +
        `[${f.cutFrames.join(', ')}] (indices [${f.cutEventIndices.join(', ')}])`,
    )
  }
  const tag = report.ok ? 'OK' : 'FAIL'
  console.log(`[${tag}] ${args.map}: ${report.reason}`)
  if (!report.ok) {
    for (const p of report.problems) console.log(`      ${p.fps}fps: ${p.reason}`)
    process.exit(1)
  }

  if (args.render) {
    const { ok, results } = await renderStills(map, report, args.entry, DEFAULT_OUT, args.keep)
    for (const r of results) {
      console.log(
        r.ok
          ? `[OK] rendered ${r.fps}fps still at frame ${r.frame}` +
              (args.keep ? ` → ${r.output}` : '')
          : `[FAIL] ${r.fps}fps still: ${r.error ?? 'no output produced'}`,
      )
    }
    if (!ok) process.exit(1)
  }

  process.exit(0)
}

// Only run when executed directly — importing for tests must stay silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack ?? err.message : err)
    process.exit(1)
  })
}

// Exported for reuse / testing; the verdict logic itself is in src/lib/verifyFps.ts.
export { parseArgs, applyProjectWebpack }
export const __mainPath = fileURLToPath(import.meta.url)
