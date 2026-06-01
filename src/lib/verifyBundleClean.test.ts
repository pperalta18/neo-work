/**
 * Unit tests for the bundle-purity verifier (`scanBundleForForbidden` — the pure
 * half of `scripts/verify-bundle-clean.mjs`).
 *
 * webpack + the filesystem are the verifier's only impure edges and live in the
 * `.mjs` shell, so the verdict logic is exercised here against hand-built file
 * lists — no bundling, no disk walk, the same "keep the verdict pure so it's
 * node-testable" split the rest of the music-sync layer follows.
 *
 * Tests assert the documented contract — the central plan invariant that
 * essentia.js / WASM never enters the Remotion bundle — rather than echoing the
 * implementation: a clean bundle passes; a leaked code marker or a `.wasm` asset
 * fails with a distinguishing reason; and (crucially) a file that merely *mentions*
 * "essentia" in a doc comment must NOT trip the guard, because our own source does
 * exactly that. A broken verifier therefore can't quietly pass.
 */

import { describe, expect, it } from 'vitest'
import {
  scanBundleForForbidden,
  ESSENTIA_BUNDLE_MARKERS,
  WASM_BUNDLE_EXTENSIONS,
  type BundleFile,
} from '@/lib/verifyBundleClean'

/** A realistic clean Remotion bundle: minified JS chunks + copied public assets. */
const cleanBundle: BundleFile[] = [
  { path: 'bundle.js', content: 'var a=1;function r(){return useCurrentFrame()};export{r};' },
  { path: 'index.html', content: '<!doctype html><div id="root"></div>' },
  // The public dir is copied in: the beat map (JSON, text) and the song (binary).
  {
    path: 'public/audio/test-beat.beats.json',
    content: '{"duration":8,"bpm":120,"beats":[0,0.5],"downbeats":[0],"onsets":[],"sections":[]}',
  },
  { path: 'public/audio/test-beat.wav', content: null },
  { path: 'fonts/UniversalSans.woff2', content: null },
]

describe('scanBundleForForbidden — a clean bundle (the invariant holds)', () => {
  it('passes when no essentia code marker or WASM asset is present', () => {
    const report = scanBundleForForbidden(cleanBundle)
    expect(report.ok).toBe(true)
    expect(report.matches).toEqual([])
    expect(report.filesScanned).toBe(5)
    // Only the 3 text files are searched; the two binaries are judged by extension.
    expect(report.textFilesScanned).toBe(3)
    expect(report.bytesScanned).toBeGreaterThan(0)
    expect(report.reason).toMatch(/no essentia\.js \/ WASM/i)
  })

  it('does NOT false-positive on the word "essentia" in a doc comment', () => {
    // beatmap.ts / AudioTrack.tsx legitimately mention essentia in comments; if the
    // bundle kept such a comment (or a sourcemap did), it must still pass — the guard
    // keys on essentia's *code surface*, not the bare word.
    const withComment: BundleFile[] = [
      {
        path: 'bundle.js.map',
        content:
          '"// NOTE: essentia.js (the analyser) lives only in scripts/analyze-beats.mjs"',
      },
    ]
    const report = scanBundleForForbidden(withComment)
    expect(report.ok).toBe(true)
    expect(report.matches).toEqual([])
  })

  it('passes an empty bundle (nothing to find)', () => {
    const report = scanBundleForForbidden([])
    expect(report.ok).toBe(true)
    expect(report.filesScanned).toBe(0)
    expect(report.textFilesScanned).toBe(0)
    expect(report.bytesScanned).toBe(0)
  })
})

describe('scanBundleForForbidden — the leaks the bundle must never regress into', () => {
  it('fails when an essentia code marker is bundled', () => {
    const leaked: BundleFile[] = [
      ...cleanBundle,
      { path: 'chunk.123.js', content: 'class RhythmExtractor2013{compute(x){return x}}' },
    ]
    const report = scanBundleForForbidden(leaked)
    expect(report.ok).toBe(false)
    expect(report.matches).toHaveLength(1)
    expect(report.matches[0]).toMatchObject({
      file: 'chunk.123.js',
      marker: 'RhythmExtractor2013',
      kind: 'text',
    })
    expect(report.matches[0].sample).toContain('RhythmExtractor2013')
    expect(report.reason).toMatch(/essentia\.js \/ WASM leaked/i)
  })

  it('fails when a .wasm asset is emitted, regardless of content', () => {
    const leaked: BundleFile[] = [
      { path: 'bundle.js', content: 'var a=1;' },
      { path: 'a1b2.module.wasm', content: null },
    ]
    const report = scanBundleForForbidden(leaked)
    expect(report.ok).toBe(false)
    expect(report.matches).toHaveLength(1)
    expect(report.matches[0]).toMatchObject({
      file: 'a1b2.module.wasm',
      marker: '.wasm',
      kind: 'binary',
    })
    expect(report.reason).toMatch(/WASM asset/i)
  })

  it('catches the .wasm extension case-insensitively', () => {
    const report = scanBundleForForbidden([{ path: 'Essentia.WASM', content: null }])
    expect(report.ok).toBe(false)
    expect(report.matches[0].kind).toBe('binary')
  })

  it('reports every forbidden reference, across files and markers', () => {
    const leaked: BundleFile[] = [
      { path: 'a.js', content: 'EssentiaWASM().then(e=>new e.OnsetRate())' },
      { path: 'b.js', content: 'const x = RhythmExtractor2013;' },
      { path: 'essentia-wasm.wasm', content: null },
    ]
    const report = scanBundleForForbidden(leaked)
    expect(report.ok).toBe(false)
    // a.js trips two markers, b.js one, plus the .wasm binary → 4 matches.
    expect(report.matches).toHaveLength(4)
    const markers = report.matches.map((m) => m.marker).sort()
    expect(markers).toEqual(['.wasm', 'EssentiaWASM', 'OnsetRate', 'RhythmExtractor2013'])
  })
})

describe('scanBundleForForbidden — configurable markers / extensions', () => {
  it('honours custom forbidden markers (and ignores the defaults then)', () => {
    const files: BundleFile[] = [
      { path: 'a.js', content: 'import ffmpeg from "fluent-ffmpeg"' },
      { path: 'b.js', content: 'EssentiaWASM()' }, // a default marker, but overridden away
    ]
    const report = scanBundleForForbidden(files, { forbiddenMarkers: ['fluent-ffmpeg'] })
    expect(report.ok).toBe(false)
    expect(report.matches).toHaveLength(1)
    expect(report.matches[0].marker).toBe('fluent-ffmpeg')
  })

  it('honours custom forbidden extensions', () => {
    const files: BundleFile[] = [{ path: 'native.node', content: null }]
    expect(scanBundleForForbidden(files).ok).toBe(true) // .node not forbidden by default
    const report = scanBundleForForbidden(files, { forbiddenExtensions: ['.node'] })
    expect(report.ok).toBe(false)
    expect(report.matches[0].marker).toBe('.node')
  })

  it('exposes the default marker / extension sets it ships with', () => {
    expect(ESSENTIA_BUNDLE_MARKERS).toContain('EssentiaWASM')
    expect(ESSENTIA_BUNDLE_MARKERS).toContain('RhythmExtractor2013')
    expect(WASM_BUNDLE_EXTENSIONS).toContain('.wasm')
  })
})

describe('scanBundleForForbidden — purity', () => {
  it('returns an equal verdict for equal inputs and does not mutate the files', () => {
    const snapshot = JSON.stringify(cleanBundle)
    const a = scanBundleForForbidden(cleanBundle)
    const b = scanBundleForForbidden(cleanBundle)
    expect(a).toEqual(b)
    expect(JSON.stringify(cleanBundle)).toBe(snapshot)
  })
})
