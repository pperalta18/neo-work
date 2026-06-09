/**
 * export-clips — render the individual ACTS of each flow as standalone MP4s.
 * ────────────────────────────────────────────────────────────────────────────
 * Each landing flow (Accounting / Ecommerce / Email / Support / Scheduling) is a
 * mini-película stitched from several acts via <TransitionSeries>. For the web
 * montage we don't want the full stitched video — we want every act as its own
 * clip, named with its running order so it's obvious how they go back together.
 *
 * This renders each act's standalone composition (already registered in Root.tsx,
 * including the per-flow "grid recorrido" = ConceptFlowVideo with teaserBeats=1)
 * to out/clips/<flow>/<NN>-<slug>.mp4. The acts come out CLEAN — without the
 * cross-fades, which live in the orchestrator — so you add transitions in the web.
 *
 * The programmatic bundle() does NOT auto-load remotion.config.ts, so we mirror
 * its webpack overrides (the `@` → src alias and the .riv asset rule) here, same
 * as scripts/verify-*.mjs.
 *
 * Usage:
 *   node scripts/export-clips.mjs                 # all flows
 *   node scripts/export-clips.mjs accounting email   # only these flows
 *   pnpm run export:clips
 */
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENTRY = path.join(ROOT, 'src/remotion/index.ts')
const OUT_DIR = path.join(ROOT, 'out/clips')

// Each flow's acts in running order. `id` = composition id in Root.tsx.
const CLIPS = [
  // ── Accounting (4 actos) ──
  { flow: 'accounting', n: 1, id: 'InvoiceIntake', slug: 'facturas-udon' },
  { flow: 'accounting', n: 2, id: 'AccountingGrid', slug: 'grid-recorrido' },
  { flow: 'accounting', n: 3, id: 'AccountingLoop', slug: 'foresight-analiza' },
  { flow: 'accounting', n: 4, id: 'AccountingClose', slug: 'cierre-informe' },
  // ── Ecommerce (6 actos) ──
  { flow: 'ecommerce', n: 1, id: 'PlatformChaos', slug: 'caos-plataformas' },
  { flow: 'ecommerce', n: 2, id: 'InventoryIntake', slug: 'inventario-docusense' },
  { flow: 'ecommerce', n: 3, id: 'EcommerceGrid', slug: 'grid-recorrido' },
  { flow: 'ecommerce', n: 4, id: 'EcommerceChat', slug: 'chat-feedbackloop' },
  { flow: 'ecommerce', n: 5, id: 'StoreTerminal', slug: 'terminal-codigo' },
  { flow: 'ecommerce', n: 6, id: 'StoreCreate', slug: 'web-creada-forge' },
  // ── Email Marketing (5 actos) ──
  { flow: 'email', n: 1, id: 'EmailGrind', slug: 'borrador-atascado' },
  { flow: 'email', n: 2, id: 'ContactsMerge', slug: 'contactos-docusense' },
  { flow: 'email', n: 3, id: 'EmailGrid', slug: 'grid-recorrido' },
  { flow: 'email', n: 4, id: 'EmailCompose', slug: 'compose-smartprocess' },
  { flow: 'email', n: 5, id: 'CampaignLive', slug: 'campana-viva' },
  // ── Support (5 actos) ──
  { flow: 'support', n: 1, id: 'MessageStorm', slug: 'lluvia-mensajes' },
  { flow: 'support', n: 2, id: 'ChannelsConnect', slug: 'canales-hotpot' },
  { flow: 'support', n: 3, id: 'SupportGrid', slug: 'grid-recorrido' },
  { flow: 'support', n: 4, id: 'SupportChat', slug: 'chat-actionrunner' },
  { flow: 'support', n: 5, id: 'SupportResolved', slug: 'cliente-resuelto' },
  // ── Scheduling (6 actos) ──
  { flow: 'scheduling', n: 1, id: 'ShiftChaos', slug: 'cuadrante-caos' },
  { flow: 'scheduling', n: 2, id: 'StaffImport', slug: 'import-staff' },
  { flow: 'scheduling', n: 3, id: 'SchedulingRules', slug: 'reglas-feedbackloop' },
  { flow: 'scheduling', n: 4, id: 'SchedulingGrid', slug: 'grid-recorrido' },
  { flow: 'scheduling', n: 5, id: 'ScheduleTemplate', slug: 'plantilla-glimpse' },
  { flow: 'scheduling', n: 6, id: 'ScheduleResults', slug: 'resultados-heartbeat' },
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
  const filter = process.argv.slice(2).map((s) => s.toLowerCase())
  const todo = filter.length ? CLIPS.filter((c) => filter.includes(c.flow)) : CLIPS
  if (!todo.length) {
    console.error(`No clips match ${JSON.stringify(filter)}. Flows: accounting, ecommerce, email, support, scheduling.`)
    process.exit(1)
  }

  const { bundle } = await import('@remotion/bundler')
  const { selectComposition, renderMedia } = await import('@remotion/renderer')

  console.error(`Bundling ${path.relative(ROOT, ENTRY)} …`)
  const serveUrl = await bundle({ entryPoint: ENTRY, webpackOverride: applyProjectWebpack })

  let ok = 0
  const failures = []
  for (let i = 0; i < todo.length; i++) {
    const clip = todo[i]
    const dir = path.join(OUT_DIR, clip.flow)
    mkdirSync(dir, { recursive: true })
    const nn = String(clip.n).padStart(2, '0')
    const outputLocation = path.join(dir, `${nn}-${clip.slug}.mp4`)
    const tag = `[${i + 1}/${todo.length}] ${clip.flow}/${nn}-${clip.slug} (${clip.id})`
    try {
      const composition = await selectComposition({ serveUrl, id: clip.id })
      process.stderr.write(`▶ ${tag} — ${composition.durationInFrames}f … `)
      await renderMedia({
        serveUrl,
        composition,
        codec: 'h264',
        outputLocation,
        // x264 reasonable quality for web; deterministic content compresses well.
        crf: 18,
      })
      ok++
      console.error('✓')
      console.log(`DONE ${path.relative(ROOT, outputLocation)}`)
    } catch (err) {
      failures.push({ tag, message: err?.message ?? String(err) })
      console.error('✗')
      console.log(`FAIL ${tag}: ${err?.message ?? err}`)
    }
  }

  console.error(`\n${ok}/${todo.length} clips → ${path.relative(ROOT, OUT_DIR)}/`)
  if (failures.length) {
    console.error(`${failures.length} failed:`)
    for (const f of failures) console.error(`  - ${f.tag}: ${f.message}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
