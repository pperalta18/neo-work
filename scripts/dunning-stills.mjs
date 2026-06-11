/**
 * dunning-stills — QA visual de los 3 actos de Dunning. Bundlea una vez y saca
 * frames clave de cada acto. Usage: node scripts/dunning-stills.mjs
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(ROOT, 'src/remotion/index.ts')
const OUT_DIR = path.join(ROOT, 'out/dunning-stills')

const SHOTS = {
  ModDunningOverdue: [0, 20, 45, 60, 100, 139],
  ModDunningRun: [0, 30, 50, 75, 95, 130],
  ModDunningPaid: [0, 26, 40, 55, 90, 119],
}

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
  mkdirSync(OUT_DIR, { recursive: true })
  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderStill } = await import('@remotion/renderer')
  console.error('Bundling …')
  const serveUrl = await bundle({ entryPoint: ENTRY, webpackOverride: applyProjectWebpack })
  for (const [id, frames] of Object.entries(SHOTS)) {
    const composition = await selectComposition({ serveUrl, id })
    for (const frame of frames) {
      const output = path.join(OUT_DIR, `${id}-f${String(frame).padStart(3, '0')}.png`)
      await renderStill({ serveUrl, composition, frame, output, imageFormat: 'png' })
      console.log(`✓ ${id} f${frame}/${composition.durationInFrames}`)
    }
  }
  console.error(`\nStills → ${path.relative(ROOT, OUT_DIR)}/`)
}

main().catch((err) => { console.error(err); process.exit(1) })
