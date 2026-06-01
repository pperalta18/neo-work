/**
 * verify-cut-timing — do the ProductTour's scene cuts land on the downbeats in
 * the RENDERED PIXELS (not just in the layout math)?
 * ────────────────────────────────────────────────────────────────────────────
 * The last open item of plans/music-sync-beats.md's Verification section asks
 * that "the rendered MP4 contains an audio track, and scene cuts land on
 * downbeats when previewed against the music." Two sibling gates cover most of
 * it from the math: `verify:tour-audio` proves the song is muxed in, and
 * `verify:fps` proves each cut *frame* equals `round(downbeatSeconds · fps)`. But
 * neither looks at the video — a composition could compute the right cut frame
 * yet render the transition elsewhere (or drop it) and both would still pass.
 *
 * This gate closes that loop without a human watching: it decodes the actual MP4
 * to a tiny grayscale frame stack, measures the per-frame visual change, and
 * checks that the transition energy is concentrated on the downbeat cut frames
 * the beat map predicts — i.e. the pixels really cut on the music.
 *
 * Pipeline:
 *   1. (optional) render the tour if the MP4 is missing, or always with --render.
 *   2. ffmpeg → downscaled grayscale rawvideo on stdout (the only impure edge);
 *      no temp PNGs, so it's safe on a near-full disk.
 *   3. `changeSignalFromGray` builds the per-frame change signal; `planBeatScenes`
 *      (the SAME layout the composition uses) gives the expected downbeat cuts and
 *      the transition length; `analyzeCutTiming` (src/lib/verifyCutTiming.ts)
 *      decides pass/fail. Print the verdict, exit 0 (ok) or 1 (off the downbeats).
 *
 * The verdict logic lives in src/lib and is unit-tested without ffmpeg; this file
 * is just the render/decode shell, the same split verify-tour-audio.mjs and
 * verify-fps.mjs use. Node strips the `.ts` types on import, so no build step.
 *
 * Usage:
 *   node scripts/verify-cut-timing.mjs [mp4] [options]
 *   npm run verify:cuts                 (defaults to out/product-tour.mp4 @30fps, 3 scenes)
 *
 * Options:
 *   --render          (re)render the tour before checking, even if the MP4 exists
 *   --fps <n>         the composition fps (default 30, matching Root.tsx)
 *   --scenes <n>      scene count to lay out (default 3, matching ProductTour)
 *   --map <path>      beat map JSON (default public/audio/test-beat.beats.json)
 *   --width <px>      decode width  (default 64; tiny on purpose — only motion matters)
 *   --height <px>     decode height (default 36)
 */
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { analyzeCutTiming, changeSignalFromGray } from '../src/lib/verifyCutTiming.ts'
import { planBeatScenes } from '../src/lib/beatScenes.ts'
import { secondsToFrame } from '../src/lib/beatmap.ts'

const DEFAULT_MP4 = 'out/product-tour.mp4'
const DEFAULT_MAP = 'public/audio/test-beat.beats.json'

function parseArgs(argv) {
  const args = { render: false, fps: 30, scenes: 3, map: DEFAULT_MAP, width: 64, height: 36 }
  const positionals = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--render') args.render = true
    else if (a === '--fps') args.fps = Number(argv[++i])
    else if (a === '--scenes') args.scenes = Number(argv[++i])
    else if (a === '--map') args.map = argv[++i]
    else if (a === '--width') args.width = Number(argv[++i])
    else if (a === '--height') args.height = Number(argv[++i])
    else positionals.push(a)
  }
  args.mp4 = positionals[0] ?? DEFAULT_MP4
  return args
}

/** Render the tour to `mp4` via the project's render:tour composition. */
function renderTour(mp4) {
  console.error(`Rendering ProductTour → ${mp4} …`)
  execFileSync('npx', ['remotion', 'render', 'src/remotion/index.ts', 'ProductTour', mp4], {
    stdio: 'inherit',
  })
}

/**
 * Decode `mp4` to a `width × height` grayscale rawvideo buffer (one byte per
 * pixel, frames concatenated) — the impure edge. Tiny by design: cuts are about
 * large-scale motion, which survives heavy downscaling, and a 64×36 stream keeps
 * the whole clip well under a megabyte (no temp files, disk-safe).
 */
function decodeGray(mp4, width, height) {
  return execFileSync(
    'ffmpeg',
    ['-v', 'error', '-i', mp4, '-an', '-vf', `scale=${width}:${height},format=gray`, '-f', 'rawvideo', '-'],
    { encoding: 'buffer', maxBuffer: 1 << 28 },
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))

  if (args.render || !existsSync(args.mp4)) {
    if (!args.render) console.error(`${args.mp4} not found — rendering it first.`)
    renderTour(args.mp4)
  }
  if (!existsSync(args.mp4)) {
    console.error(`Render did not produce ${args.mp4}.`)
    process.exit(1)
  }
  if (!existsSync(args.map)) {
    console.error(`Beat map not found: ${args.map}`)
    process.exit(1)
  }

  const map = JSON.parse(readFileSync(args.map, 'utf8'))

  // The exact layout the composition renders: cut frames on downbeats + the
  // transition length (= the window a transition may occupy around its cut).
  const layout = planBeatScenes(map, args.fps, { sceneCount: args.scenes })
  const expectedTotal = secondsToFrame(map.duration, args.fps)

  // Decode and build the per-frame visual change signal.
  const buffer = decodeGray(args.mp4, args.width, args.height)
  const pixelsPerFrame = args.width * args.height
  const changes = changeSignalFromGray(buffer, pixelsPerFrame)

  if (Math.abs(changes.length - expectedTotal) > 2) {
    console.error(
      `[warn] decoded ${changes.length} frames but the map expects ${expectedTotal} at ${args.fps}fps — ` +
        `is --fps right for this MP4?`,
    )
  }

  const report = analyzeCutTiming(changes, layout.cutFrames, {
    windowRadius: layout.transitionFrames,
    openingFrames: layout.transitionFrames,
  })

  const tag = report.ok ? 'OK' : 'FAIL'
  console.log(`[${tag}] ${args.mp4}: ${report.reason}`)
  console.log(
    `      ${changes.length} frames @${args.fps}fps, cuts on ${layout.cutOn} ` +
      `[${layout.cutFrames.join(', ')}], transition ±${layout.transitionFrames}f`,
  )
  console.log(
    `      concentration ${(report.concentration * 100).toFixed(1)}% ` +
      `(in-window ${report.inWindowEnergy.toFixed(1)} / interior ${report.interiorEnergy.toFixed(1)}), ` +
      `noise floor ${report.noiseFloor.toFixed(4)}, peak ${report.peakChange.toFixed(2)}`,
  )
  for (const f of report.findings) {
    console.log(
      `      cut ${String(f.cut).padStart(4)}: prominence ${f.peakProminence.toFixed(2)} ` +
        `(peak@${f.peakFrame}), centroid ${f.centroid.toFixed(1)} (off ${f.centroidOffset.toFixed(1)}f) ` +
        `${f.ok ? '✓' : '✗'}`,
    )
  }
  if (report.strayPeak) {
    console.log(
      `      strongest non-cut change: frame ${report.strayPeak.frame} ` +
        `(prominence ${report.strayPeak.prominence.toFixed(2)})`,
    )
  }
  process.exit(report.ok ? 0 : 1)
}

// Only run when executed directly — importing for tests must stay silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main()
  } catch (err) {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

// Exported for reuse; the verdict logic itself is in src/lib/verifyCutTiming.ts.
export { parseArgs, decodeGray }
export const __mainPath = fileURLToPath(import.meta.url)
