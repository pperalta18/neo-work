/**
 * export-module-videos — render the 10 FINAL module videos (not the individual acts).
 * ────────────────────────────────────────────────────────────────────────────
 * The two selectable modules of the new-landing have 5 videos each. Some of them
 * (Dunning, MonthClose, Absences) are mini-películas stitched from several acts —
 * here we render the COMBINED compositions only (ModDunning = M2DunningVideo,
 * ModMonthClose = M2MonthCloseVideo…), never the standalone acts.
 *
 * Output: out/modulos/modulo-1-tareas/<NN>-<slug>.mp4
 *         out/modulos/modulo-2-conectado/<NN>-<slug>.mp4
 *
 * Usage: node scripts/export-module-videos.mjs
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(ROOT, 'src/remotion/index.ts')
const OUT_DIR = path.join(ROOT, 'out/modulos')

const VIDEOS = [
  // ── Módulo 1 · «Tus tareas del día a día» ──
  { dir: 'modulo-1-tareas', n: 1, id: 'ModAbsences', slug: 'aprobar-ausencias' },
  { dir: 'modulo-1-tareas', n: 2, id: 'ModInvoices', slug: 'facturas-se-ordenan' },
  { dir: 'modulo-1-tareas', n: 3, id: 'ModStock', slug: 'stock-se-repone' },
  { dir: 'modulo-1-tareas', n: 4, id: 'ModTickets', slug: 'tickets-se-priorizan' },
  { dir: 'modulo-1-tareas', n: 5, id: 'ModCart', slug: 'carrito-recuperado' },
  // ── Módulo 2 · «Tu negocio funcionando conectado» ──
  { dir: 'modulo-2-conectado', n: 1, id: 'ModOnboarding', slug: 'alta-empleado' },
  { dir: 'modulo-2-conectado', n: 2, id: 'ModSaleChain', slug: 'venta-mueve-cadena' },
  { dir: 'modulo-2-conectado', n: 3, id: 'ModDunning', slug: 'impagos-se-persiguen' },
  { dir: 'modulo-2-conectado', n: 4, id: 'ModMonthClose', slug: 'cierre-de-mes' },
  { dir: 'modulo-2-conectado', n: 5, id: 'ModLeadFunnel', slug: 'leads-no-se-enfrian' },
]

/** Mirror remotion.config.ts: the `@` → src alias and the .riv asset rule. */
function applyProjectWebpack(current) {
  return {
    ...current,
    resolve: {
      ...current.resolve,
      alias: { ...(current.resolve?.alias ?? {}), '@': path.join(ROOT, 'src') },
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

async function main() {
  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderMedia } = await import('@remotion/renderer')

  console.error(`Bundling ${path.relative(ROOT, ENTRY)} …`)
  const serveUrl = await bundle({ entryPoint: ENTRY, webpackOverride: applyProjectWebpack })

  let ok = 0
  const failures = []
  for (let i = 0; i < VIDEOS.length; i++) {
    const v = VIDEOS[i]
    const dir = path.join(OUT_DIR, v.dir)
    mkdirSync(dir, { recursive: true })
    const nn = String(v.n).padStart(2, '0')
    const outputLocation = path.join(dir, `${nn}-${v.slug}.mp4`)
    const tag = `[${i + 1}/${VIDEOS.length}] ${v.dir}/${nn}-${v.slug} (${v.id})`
    try {
      const composition = await selectComposition({ serveUrl, id: v.id })
      process.stderr.write(`▶ ${tag} — ${composition.durationInFrames}f … `)
      await renderMedia({ serveUrl, composition, codec: 'h264', outputLocation, crf: 18 })
      ok++
      console.error('✓')
      console.log(`DONE ${path.relative(ROOT, outputLocation)}`)
    } catch (err) {
      failures.push({ tag, message: err?.message ?? String(err) })
      console.error('✗')
      console.log(`FAIL ${tag}: ${err?.message ?? err}`)
    }
  }

  console.error(`\n${ok}/${VIDEOS.length} videos → ${path.relative(ROOT, OUT_DIR)}/`)
  if (failures.length) {
    failures.forEach((f) => console.error(`  - ${f.tag}: ${f.message}`))
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
