/**
 * verify-tour-audio — does the rendered ProductTour MP4 contain the muxed song?
 * ────────────────────────────────────────────────────────────────────────────
 * Acceptance gate for Phase 4 of specs/music-sync.md: a beat-driven composition
 * is only correct if the `<AudioTrack>`'s `<Audio>` survives `remotion render`
 * into a real audio stream of the right length. A silent or audio-less MP4 is a
 * regression even when every frame looks right, so this probes the output and
 * asserts the track is there.
 *
 * Pipeline:
 *   1. (optional) render the tour if the MP4 is missing, or always with --render.
 *   2. ffprobe the MP4's streams + format as JSON (the only impure edge).
 *   3. Hand the parsed JSON to the pure `audioStreamReport` (src/lib/verifyAudioMux.ts),
 *      which decides pass/fail; print the verdict and exit 0 (ok) or 1 (missing).
 *
 * The verdict logic lives in src/lib and is unit-tested without ffprobe; this
 * file is just the ffprobe/render shell, the same split analyze-beats.mjs uses.
 * Node strips the `.ts` types on import, so no build step is needed.
 *
 * Usage:
 *   node scripts/verify-tour-audio.mjs [mp4] [options]
 *   npm run verify:tour-audio                       (defaults to out/product-tour.mp4)
 *
 * Options:
 *   --render            (re)render the tour before probing, even if the MP4 exists
 *   --expect <seconds>  require the audio length to match this (±tolerance)
 *   --tolerance <s>     allowed drift for --expect (default 0.5)
 */
import { existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { audioStreamReport } from '../src/lib/verifyAudioMux.ts'

const DEFAULT_MP4 = 'out/product-tour.mp4'

function parseArgs(argv) {
  const args = { render: false }
  const positionals = []
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--render') args.render = true
    else if (a === '--expect') args.expect = Number(argv[++i])
    else if (a === '--tolerance') args.tolerance = Number(argv[++i])
    else positionals.push(a)
  }
  args.mp4 = positionals[0] ?? DEFAULT_MP4
  return args
}

/** Render the tour to `mp4` via the project's render:tour script. */
function renderTour(mp4) {
  console.error(`Rendering ProductTour → ${mp4} …`)
  execFileSync(
    'npx',
    ['remotion', 'render', 'src/remotion/index.ts', 'ProductTour', mp4],
    { stdio: 'inherit' },
  )
}

/** Probe `mp4` and return parsed `{ streams, format }` JSON. */
function ffprobe(mp4) {
  const stdout = execFileSync(
    'ffprobe',
    ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', mp4],
    { encoding: 'utf8' },
  )
  return JSON.parse(stdout)
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

  const probe = ffprobe(args.mp4)
  const report = audioStreamReport(probe, {
    expectedDurationSeconds: args.expect,
    durationToleranceSeconds: args.tolerance,
  })

  const tag = report.ok ? 'OK' : 'FAIL'
  console.log(`[${tag}] ${args.mp4}: ${report.reason}`)
  console.log(
    `      streams: ${report.streamCounts.audio} audio, ` +
      `${report.streamCounts.video} video (${report.streamCounts.total} total)`,
  )
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

// Exported for completeness / potential reuse; the verdict logic itself is in
// src/lib/verifyAudioMux.ts.
export { parseArgs, ffprobe }
export const __mainPath = fileURLToPath(import.meta.url)
