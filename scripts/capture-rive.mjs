// capture-rive.mjs — pre-render every Rive module animation to a deterministic
// transparent PNG frame sequence Remotion can replay frame-accurately.
//
// Why: Rive's web runtime advances on wall-clock requestAnimationFrame, so it is
// NOT deterministic inside a Remotion render. Here we drive the low-level runtime
// (@rive-app/canvas-advanced-single) by ABSOLUTE SEEK — setting the animation's
// time to exactly f/fps for each frame and reading the transparent canvas — from
// inside Playwright's Chromium (which has the canvas the runtime needs). The
// result is one PNG per video frame, played back by src/remotion/RiveClip.tsx.
//
// Each module file ships two timelines: a static rest pose ("Start") and the
// lively reaction ("React") that plays on click in Storybook. We auto-detect the
// timeline that actually MOVES (most distinct sampled frames) and capture that.
//
// Usage:
//   node scripts/capture-rive.mjs            # all modules
//   node scripts/capture-rive.mjs forge      # only the named module(s)
import { createServer } from 'vite'
import { chromium } from 'playwright'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const RIV_DIR = join(ROOT, 'src/stories/neo/modules/riv')
const OUT_DIR = join(ROOT, 'public/rive-frames')

const SIZE = 512 // square render; Fit.contain centres the artboard, rest transparent
const FPS = 30 // matches the Remotion compositions
const MAXF = 120 // cap (4 s) — anything hitting this likely loops; we log it
const SETTLE_K = 8 // stop after this many byte-identical frames (animation settled)
const PROBE_TIMES = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 0.95, 1.3] // to detect the moving timeline

const MODULES = [
  ['hotpot', 'hotpot.riv'],
  ['sqlsense', 'sqlsense.riv'],
  ['udon', 'udon.riv'],
  ['sushimi', 'sushimi.riv'],
  ['docusense', 'docusense.riv'],
  ['junction', 'junction.riv'],
  ['glimpse', 'glimpse.riv'],
  ['foresight', 'foresight.riv'],
  ['actionRunner', 'action-runner.riv'],
  ['actionScript', 'action-script.riv'],
  ['teamwork', 'teamwork.riv'],
  ['feedbackLoop', 'feedback-loop.riv'],
  ['heartbeat', 'heartbeat.riv'],
  ['smartProcess', 'smart-process.riv'],
  ['forge', 'forge.riv'],
  ['skillHub', 'skill-hub.riv'],
]

const only = process.argv.slice(2)
const targets = only.length ? MODULES.filter(([k]) => only.includes(k)) : MODULES
const md5 = (dataUrl) => createHash('md5').update(dataUrl.split(',')[1]).digest('hex')

const server = await createServer({
  root: ROOT, configFile: false, logLevel: 'silent', appType: 'mpa',
  server: { port: 5191 }, optimizeDeps: { include: ['@rive-app/canvas-advanced-single'] },
})
await server.listen()
const url = `http://localhost:${server.config.server.port}/scripts/rive-capture/index.html`

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 640, height: 640 } })
page.on('pageerror', (e) => console.log('  PAGE EXC:', e.message))
await page.goto(url, { waitUntil: 'load' })
await page.waitForFunction(() => typeof window.riveLoad === 'function', null, { timeout: 30000 })
await page.evaluate(async () => { await window.__riveReady })

const manifest = {}
for (const [key, file] of targets) {
  try {
    const buf = await readFile(join(RIV_DIR, file))
    const { count, names } = await page.evaluate(
      ({ bytes, size }) => window.riveLoad(bytes, size),
      { bytes: Array.from(new Uint8Array(buf)), size: SIZE },
    )

    // 1) pick the timeline that actually moves (most distinct probe frames)
    let best = { index: 0, distinct: 0, name: names[0] ?? null }
    for (let i = 0; i < count; i++) {
      await page.evaluate((idx) => window.riveSelect(idx), i)
      const probes = []
      for (const t of PROBE_TIMES) probes.push(md5(await page.evaluate((tt) => window.riveSeekGrab(tt), t)))
      const distinct = new Set(probes).size
      if (distinct > best.distinct) best = { index: i, distinct, name: names[i] ?? null }
    }

    // 2) capture the chosen timeline frame-by-frame until it settles
    await page.evaluate((idx) => window.riveSelect(idx), best.index)
    const frames = []
    let identical = 0
    let prev = null
    for (let f = 0; f < MAXF; f++) {
      const dataUrl = await page.evaluate((t) => window.riveSeekGrab(t), f / FPS)
      const h = md5(dataUrl)
      identical = h === prev ? identical + 1 : 0
      frames.push(dataUrl)
      prev = h
      if (identical >= SETTLE_K) break
    }
    const hitCap = identical < SETTLE_K
    // trim trailing settled duplicates (keep one rest frame). The break fires when
    // `identical` reaches SETTLE_K, so the settled run holds SETTLE_K+1 identical
    // frames; drop SETTLE_K of them to leave exactly one (clean loop wrap).
    let end = hitCap ? frames.length : frames.length - SETTLE_K
    // trim leading pre-roll duplicates (keep one)
    let start = 0
    while (start + 1 < end && md5(frames[start + 1]) === md5(frames[start])) start++
    const out = frames.slice(start, Math.max(start + 1, end))

    const dir = join(OUT_DIR, key)
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
    for (let i = 0; i < out.length; i++) {
      await writeFile(join(dir, String(i).padStart(4, '0') + '.png'), Buffer.from(out[i].split(',')[1], 'base64'))
    }

    manifest[key] = {
      frames: out.length, fps: FPS, width: SIZE, height: SIZE,
      anim: best.name, animated: best.distinct > 1,
    }
    console.log(
      `  ${key.padEnd(14)} ${String(out.length).padStart(3)} frames  ` +
      `anim="${best.name}" (idx ${best.index}, ${count} total)` +
      (best.distinct <= 1 ? '  [STATIC — no moving timeline]' : '') +
      (hitCap ? '  [HIT CAP — may loop]' : '') +
      (start > 0 ? `  (trimmed ${start} lead)` : ''),
    )
  } catch (e) {
    console.log(`  ${key.padEnd(14)} FAILED: ${e.message}`)
  }
}

await browser.close()
await server.close()

const ts =
  `// AUTO-GENERATED by scripts/capture-rive.mjs — do not edit by hand.\n` +
  `// Deterministic transparent PNG frame sequences pre-rendered from the Rive\n` +
  `// module files (src/stories/neo/modules/riv/*.riv). Replayed by RiveClip.tsx.\n` +
  `export type RiveClipMeta = {\n` +
  `  frames: number\n  fps: number\n  width: number\n  height: number\n` +
  `  /** Source timeline captured (the one that moves). */\n  anim: string | null\n` +
  `  /** False when the module had no moving timeline (single rest frame). */\n  animated: boolean\n}\n\n` +
  `export const RIVE_CLIPS = ${JSON.stringify(manifest, null, 2)} satisfies Record<string, RiveClipMeta>\n\n` +
  `export type RiveClipName = keyof typeof RIVE_CLIPS\n`
await writeFile(join(ROOT, 'src/remotion/riveClips.ts'), ts)
console.log(`\nWrote ${Object.keys(manifest).length} clips -> public/rive-frames/ + manifest src/remotion/riveClips.ts`)
