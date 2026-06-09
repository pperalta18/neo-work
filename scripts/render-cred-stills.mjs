/**
 * render-cred-stills — preview-render the accreditation cards in one bundle.
 * Bundles the Remotion entry once, then renders each credencial-* doc to a PNG
 * under out/prints/preview/. Fast visual-iteration helper (not the press export;
 * use scripts/export-print.mjs for the CMYK PDF/X deliverable).
 *
 *   node scripts/render-cred-stills.mjs [--dpi 200] [id ...]
 */
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { applyProjectWebpack } from './export-print.mjs'

const ROOT = process.cwd()
const ENTRY = 'src/remotion/index.ts'
const COMPOSITION_ID = 'PrintPage'

const DEFAULT_IDS = ['credencial-speaker', 'credencial-host', 'credencial-staff', 'credencial-guest']

function parse(argv) {
  let dpi = 200
  const ids = []
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--dpi') dpi = Number(argv[++i])
    else ids.push(argv[i])
  }
  return { dpi, ids: ids.length ? ids : DEFAULT_IDS }
}

function loadDoc(id) {
  const p = path.join(ROOT, 'public', 'prints', id, 'doc.json')
  if (!existsSync(p)) throw new Error(`doc not found: ${p}`)
  return JSON.parse(readFileSync(p, 'utf8'))
}

async function main() {
  const { dpi, ids } = parse(process.argv.slice(2))
  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderStill } = await import('@remotion/renderer')

  console.log(`Bundling ${ENTRY} …`)
  const serveUrl = await bundle({ entryPoint: path.resolve(ENTRY), webpackOverride: applyProjectWebpack })

  const outDir = path.join(ROOT, 'out', 'prints', 'preview')
  mkdirSync(outDir, { recursive: true })

  for (const id of ids) {
    const doc = { ...loadDoc(id), dpi }
    const inputProps = { doc, showGuides: false }
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps })
    const out = path.join(outDir, `${id}.png`)
    console.log(`${id}: ${composition.width}×${composition.height}px @ ${dpi}dpi → ${out}`)
    await renderStill({ composition, serveUrl, output: out, inputProps, imageFormat: 'png', scale: 1 })
  }
  console.log('done.')
}

main().catch((e) => {
  console.error(e instanceof Error ? (e.stack ?? e.message) : e)
  process.exit(1)
})
