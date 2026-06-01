/**
 * Bundle-purity verification (CPU side, no webpack, no I/O)
 * ─────────────────────────────────────────────────────────
 * The pure half of `scripts/verify-bundle-clean.mjs`: it answers one question —
 * "did the offline analyser leak into the render bundle?" — from already-read
 * bundle files. The whole music-sync design rests on one invariant (see the
 * first "Key decisions" line in `plans/music-sync-beats.md`):
 *
 *   essentia.js (WASM) is confined to `scripts/analyze-beats.mjs`. It never
 *   enters the Remotion bundle or the MP4 — the render path reads JSON +
 *   decoded audio only.
 *
 * That invariant is silently breakable: any bundled module that transitively
 * `import`s `essentia.js` would pull its WASM glue (and a `.wasm` asset) into the
 * webpack output, bloating the bundle and breaking "offline-only analysis". This
 * scanner is the automated guard — given the bundle's files it fails on any
 * essentia code marker or any `.wasm` asset.
 *
 * Markers target essentia's *code surface* (`EssentiaWASM`, `RhythmExtractor2013`,
 * `OnsetRate`), never the bare word "essentia" — `beatmap.ts`, `beatAnalysis.ts`
 * and `AudioTrack.tsx` legitimately *mention* essentia in their doc comments, so a
 * substring like "essentia" would false-positive on a sourcemap. The algorithm
 * names appear nowhere in `src/`; they only show up if the library itself is
 * bundled. The `.wasm` extension check is the minification-proof backstop: even if
 * every JS identifier were mangled, essentia still ships a `.wasm` binary asset.
 *
 * Keeping the inspection here — plain objects in, a verdict out — makes it
 * node-unit-testable without booting webpack or reading the disk, the same
 * "keep the impure edge in the `.mjs`, test the verdict in `src/lib`" split the
 * audio-mux (`verifyAudioMux.ts`) and beat-map (`beatAnalysis.ts`) layers use.
 *
 * See ([spec: Music Sync (Beats)](../../specs/music-sync.md)),
 *     ([spec: Product Video](../../specs/product-video.md)).
 */

/** A single file read out of the bundle output directory. */
export type BundleFile = {
  /** Path of the file within the bundle (relative or absolute; used in messages). */
  path: string
  /**
   * UTF-8 text for inspectable files (`.js`, `.map`, `.html`, …); `null` for
   * binary / unreadable files (`.wasm`, fonts, images, audio) whose presence is
   * judged by extension alone, never by content.
   */
  content: string | null
}

/** A forbidden reference found in the bundle. */
export type BundleMatch = {
  /** The offending file's path within the bundle. */
  file: string
  /** What tripped the check: a forbidden text marker, or a forbidden extension. */
  marker: string
  /** How it was detected — a code marker in text, or a binary asset by extension. */
  kind: 'text' | 'binary'
  /** A short single-line excerpt around a `text` match (empty for `binary`). */
  sample: string
}

export type BundleScanReport = {
  /** True only when no forbidden marker / extension appears anywhere in the bundle. */
  ok: boolean
  /** Human-readable explanation of the verdict (printed by the CLI). */
  reason: string
  /** Every offending reference found, in discovery order. */
  matches: BundleMatch[]
  /** Total files considered (text + binary). */
  filesScanned: number
  /** How many of those were text files actually searched for markers. */
  textFilesScanned: number
  /** Total UTF-8 characters searched. */
  bytesScanned: number
}

export type BundleScanOptions = {
  /** Case-sensitive substrings that must not appear in any text file. */
  forbiddenMarkers?: string[]
  /** File extensions (with leading dot) whose mere presence fails the scan. */
  forbiddenExtensions?: string[]
}

/**
 * essentia's code-surface identifiers. They appear if (and only if) the library's
 * JS glue is bundled; they appear nowhere in this repo's own source.
 */
export const ESSENTIA_BUNDLE_MARKERS: readonly string[] = [
  'EssentiaWASM',
  'RhythmExtractor2013',
  'OnsetRate',
]

/** WASM assets must never reach the bundle — analysis is offline-only. */
export const WASM_BUNDLE_EXTENSIONS: readonly string[] = ['.wasm']

/** A compact, single-line excerpt around `index` for diagnostics. */
function excerpt(content: string, index: number, length: number): string {
  const pad = 24
  const start = Math.max(0, index - pad)
  const end = Math.min(content.length, index + length + pad)
  const slice = content.slice(start, end).replace(/\s+/g, ' ').trim()
  const prefix = start > 0 ? '…' : ''
  const suffix = end < content.length ? '…' : ''
  return `${prefix}${slice}${suffix}`
}

/**
 * Inspect the files of a built bundle and decide whether any forbidden analysis
 * code / WASM leaked in. Pure: same input → same verdict, no I/O, no mutation.
 */
export function scanBundleForForbidden(
  files: readonly BundleFile[],
  options: BundleScanOptions = {},
): BundleScanReport {
  const markers = options.forbiddenMarkers ?? ESSENTIA_BUNDLE_MARKERS
  const extensions = (options.forbiddenExtensions ?? WASM_BUNDLE_EXTENSIONS).map((e) =>
    e.toLowerCase(),
  )

  const matches: BundleMatch[] = []
  let textFilesScanned = 0
  let bytesScanned = 0

  for (const file of files) {
    const lowerPath = file.path.toLowerCase()
    for (const ext of extensions) {
      if (lowerPath.endsWith(ext)) {
        matches.push({ file: file.path, marker: ext, kind: 'binary', sample: '' })
      }
    }

    if (typeof file.content === 'string') {
      textFilesScanned++
      bytesScanned += file.content.length
      for (const marker of markers) {
        const idx = file.content.indexOf(marker)
        if (idx !== -1) {
          matches.push({
            file: file.path,
            marker,
            kind: 'text',
            sample: excerpt(file.content, idx, marker.length),
          })
        }
      }
    }
  }

  const filesScanned = files.length
  const ok = matches.length === 0

  if (ok) {
    return {
      ok,
      reason:
        `clean: scanned ${filesScanned} file(s) (${textFilesScanned} text, ` +
        `${bytesScanned} chars) — no essentia.js / WASM analysis code in the bundle`,
      matches,
      filesScanned,
      textFilesScanned,
      bytesScanned,
    }
  }

  const first = matches[0]
  const where = first.kind === 'binary' ? `WASM asset ${first.file}` : `"${first.marker}" in ${first.file}`
  return {
    ok,
    reason:
      `essentia.js / WASM leaked into the bundle: ${matches.length} forbidden ` +
      `reference(s), e.g. ${where}`,
    matches,
    filesScanned,
    textFilesScanned,
    bytesScanned,
  }
}
