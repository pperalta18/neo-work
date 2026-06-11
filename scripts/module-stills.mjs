/**
 * module-stills — quick visual QA for the 10 module-loop clips.
 * Bundles ONCE, then renders 3 stills per clip (frame 0, mid, DUR-1) so we can
 * eyeball the Tailark hybrid look + the loop seam (frame 0 must match DUR-1).
 *
 * Usage: node scripts/module-stills.mjs [id ...]   (default: all 10)
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(ROOT, 'src/remotion/index.ts')
const OUT_DIR = path.join(ROOT, 'out/module-stills')

const IDS = [
  'ModAbsences', 'ModInvoices', 'ModStock', 'ModTickets', 'ModCart',
  'ModOnboarding', 'ModSaleChain', 'ModDunning', 'ModMonthClose', 'ModLeadFunnel',
]

function applyProjectWebpack(current) {
  return {
    ...current,
    resolve: { ...current.resolve, alias: { ...(current.resolve?.alias ?? {}), '@': path.join(ROOT, 'src') } },
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

async function main() {
  const filter = process.argv.slice(2)
  const todo = filter.length ? IDS.filter((id) => filter.includes(id)) : IDS
  mkdirSync(OUT_DIR, { recursive: true })

  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderStill } = await import('@remotion/renderer')

  console.error(`Bundling …`)
  const serveUrl = await bundle({ entryPoint: ENTRY, webpackOverride: applyProjectWebpack })

  for (const id of todo) {
    const composition = await selectComposition({ serveUrl, id })
    const D = composition.durationInFrames
    const frames = [0, Math.floor(D / 2), D - 1]
    for (const frame of frames) {
      const outputLocation = path.join(OUT_DIR, `${id}-f${String(frame).padStart(3, '0')}.png`)
      await renderStill({ serveUrl, composition, frame, output: outputLocation, imageFormat: 'png' })
      console.log(`✓ ${id} f${frame}/${D}`)
    }
  }
  console.error(`\nStills → ${path.relative(ROOT, OUT_DIR)}/`)
}

main().catch((err) => { console.error(err); process.exit(1) })
