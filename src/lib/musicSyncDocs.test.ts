/**
 * musicSyncDocs.test.ts — documentation guard for the music-sync workflow header.
 *
 * The Phase-4 task "Document the workflow (analyse → read summary → place motion)
 * in a short header comment in AudioTrack.tsx and the script" has no runtime
 * behaviour to assert, so the unbiased check is that the header comments actually
 * exist and narrate the three-stage workflow with the real commands / symbols a
 * reader needs:
 *
 *   1. AudioTrack.tsx — the *render-side* entry point — opens with a block comment
 *      that walks analyse → read the frame summary → place motion → wrap in
 *      <AudioTrack>, points at specs/music-sync.md, and explains the deterministic
 *      "state in, frame out" guarantee (why the hooks key off useCurrentFrame).
 *   2. analyze-beats.mjs — the *offline* entry point — opens with a block comment
 *      that explains it runs once offline, names the essentia.js + ffmpeg pipeline,
 *      states it writes the BeatMap JSON + prints a frame summary, and shows the
 *      `npm run beats` / node invocation so a reader can actually run it.
 *
 * We match concepts (case-insensitively, with synonyms) against the *leading*
 * block comment of each file — not exact prose — so a reword can't break the test
 * but gutting/removing the header will. No magic numbers are asserted.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (rel: string) => readFileSync(path.join(repoRoot, rel), 'utf8');

/** The leading `/** ... *\/` block comment of a source file, or '' if absent. */
function leadingBlockComment(src: string): string {
  const trimmed = src.replace(/^﻿/, '').trimStart();
  if (!trimmed.startsWith('/*')) return '';
  const end = trimmed.indexOf('*/');
  return end === -1 ? '' : trimmed.slice(0, end + 2);
}

const AUDIO_TRACK_HEADER = leadingBlockComment(read('src/remotion/AudioTrack.tsx'));
const ANALYZE_HEADER = leadingBlockComment(read('scripts/analyze-beats.mjs'));

describe('music-sync workflow is documented in the entry-point headers', () => {
  it('AudioTrack.tsx opens with a substantial header block comment', () => {
    expect(AUDIO_TRACK_HEADER).not.toBe('');
    // A one-liner is not "documenting the workflow" — require real prose.
    expect(AUDIO_TRACK_HEADER.length).toBeGreaterThan(200);
  });

  it('AudioTrack.tsx header narrates analyse → read summary → place/lock motion', () => {
    const h = AUDIO_TRACK_HEADER.toLowerCase();
    // 1. analyse the song (and how: the beats command).
    expect(h).toMatch(/analy[sz]e/);
    expect(AUDIO_TRACK_HEADER).toMatch(/npm run beats|analyze-beats/);
    // 2. read the frame-indexed summary.
    expect(h).toMatch(/summary/);
    expect(h).toMatch(/frame/);
    // 3. place / lock / drive motion against it.
    expect(h).toMatch(/place|lock|drive|choreograph|sync/);
    expect(h).toMatch(/motion|beat|downbeat/);
  });

  it('AudioTrack.tsx header points at the spec and the <AudioTrack> wrap + determinism', () => {
    expect(AUDIO_TRACK_HEADER).toMatch(/music-sync\.md/);
    expect(AUDIO_TRACK_HEADER).toMatch(/AudioTrack/);
    // Why the hooks are frame-derived: deterministic preview ↔ render.
    expect(AUDIO_TRACK_HEADER.toLowerCase()).toMatch(/usecurrentframe|state in, frame out|determinist/);
  });

  it('analyze-beats.mjs opens with a substantial header block comment', () => {
    expect(ANALYZE_HEADER).not.toBe('');
    expect(ANALYZE_HEADER.length).toBeGreaterThan(200);
  });

  it('analyze-beats.mjs header explains the once-offline essentia/ffmpeg pipeline', () => {
    const h = ANALYZE_HEADER.toLowerCase();
    expect(h).toMatch(/offline|once/);
    expect(h).toMatch(/essentia/);
    expect(h).toMatch(/ffmpeg/);
    // It produces the committed BeatMap JSON and prints a frame summary.
    expect(h).toMatch(/json/);
    expect(h).toMatch(/summary|frame/);
  });

  it('analyze-beats.mjs header shows a runnable invocation and links the spec', () => {
    expect(ANALYZE_HEADER).toMatch(/npm run beats|node scripts\/analyze-beats\.mjs/);
    expect(ANALYZE_HEADER).toMatch(/music-sync\.md/);
  });
});
