/**
 * analyze-beats — the offline beat-map analyser (Phase 2 of specs/music-sync.md).
 * ────────────────────────────────────────────────────────────────────────────
 * Run ONCE per song, offline, to turn an audio file into the committed,
 * hand-editable BeatMap JSON that a Remotion composition is choreographed
 * against. essentia.js (WASM) does the heavy listening; it lives *only* here and
 * never enters the Remotion bundle or the rendered MP4 — the render path reads
 * the JSON (and the decoded audio) only, which is what keeps renders
 * deterministic ("state in, frame out").
 *
 * Pipeline:
 *   1. ffmpeg decodes any input (mp3/wav/m4a/…) to mono f32 PCM @ 44.1kHz.
 *   2. essentia.js `RhythmExtractor2013` → BPM + beat positions; `OnsetRate` →
 *      transient accents (the *golpes de efecto*).
 *   3. Pure DSP (src/lib/energyAnalysis.ts) splits the PCM into low/mid/high
 *      energy envelopes (the "dynamics ear") and segments the song where the
 *      energy regime actually changes — real sections (intro/build/drop/break),
 *      each tagged with an intensity + rising/falling/steady shape.
 *   4. Pure derivations (src/lib/beatAnalysis.ts) group beats into bars
 *      (downbeats); manual `--bpm` / `--offset` overrides correct the detection.
 *   5. The result is validated against the BeatMap shape and written next to the
 *      audio as `<name>.beats.json` (numeric arrays collapsed to one line for
 *      readability), then a frame-indexed summary — including the dynamics
 *      structure block — is printed so the author knows which frame each beat
 *      lands on AND how the song swells and drops.
 *
 * Usage:
 *   node scripts/analyze-beats.mjs <audio> [options]
 *   npm run beats -- <audio> [options]          (note the `--` so npm forwards args)
 *
 * Options:
 *   --fps <n>           frames-per-second for the printed summary (default 30)
 *   --bpm <n>           override the tempo; rebuilds the beat grid from it
 *   --offset <s>        shift every detected time by <s> seconds (alignment fix)
 *   --bar <n>           beats per bar for downbeat grouping (default 4)
 *   --sections <mode>   energy (default — cut where dynamics change) | bars
 *   --section-bars <n>  bars per derived section/phrase (only for --sections bars; default 8)
 *   --band-hz <n>       sample rate of the committed energy envelopes (default 20)
 *   --no-bands          skip the energy analysis (smaller map, no dynamics)
 *   --out <path>        output path (default `<audio>.beats.json`)
 *
 * The math is pure and unit-tested in src/lib/beatAnalysis.ts; this file is just
 * the impure shell — ffmpeg + essentia are lazy-loaded so the module imports cheap.
 */

import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { formatFrameSummary } from '../src/lib/beatmap.ts'
import {
  applyOffset,
  assembleBeatMap,
  buildBeatGrid,
  defaultOutPath,
  deriveDownbeats,
  deriveSections,
  parseArgs,
  serializeBeatMap,
  validateBeatMap,
} from '../src/lib/beatAnalysis.ts'
import { computeBands, deriveSectionsFromEnergy, detectMoments, overallEnergy } from '../src/lib/energyAnalysis.ts'

/** Sample rate ffmpeg decodes to and essentia analyses at. */
const SAMPLE_RATE = 44100

/** Decode any audio file to a mono Float32 PCM array at `sampleRate` via ffmpeg. */
function decodePcm(file, sampleRate) {
  if (!existsSync(file)) throw new Error(`Audio file not found: ${file}`)
  const res = spawnSync(
    'ffmpeg',
    ['-v', 'error', '-i', file, '-ac', '1', '-ar', String(sampleRate), '-f', 'f32le', '-'],
    { maxBuffer: 1 << 28 },
  )
  if (res.error) throw new Error(`Could not run ffmpeg (is it installed?): ${res.error.message}`)
  if (res.status !== 0) throw new Error(`ffmpeg could not decode ${file}:\n${res.stderr?.toString() ?? ''}`)
  const buf = res.stdout
  const usable = buf.byteLength - (buf.byteLength % 4)
  return new Float32Array(buf.buffer.slice(buf.byteOffset, buf.byteOffset + usable))
}

/** Instantiate essentia.js (CJS/ESM interop tolerant). */
async function loadEssentia() {
  const mod = await import('essentia.js')
  const cjs = mod.default ?? mod
  const { Essentia, EssentiaWASM } = cjs
  return new Essentia(EssentiaWASM)
}

/** Run essentia: BPM + beats (RhythmExtractor2013) and onsets (OnsetRate). */
function analyseAudio(essentia, pcm) {
  const vec = essentia.arrayToVector(pcm)
  const rhythm = essentia.RhythmExtractor2013(vec, 208, 'multifeature', 40)
  const onsets = Array.from(essentia.vectorToArray(essentia.OnsetRate(vec).onsets))
  return {
    bpm: rhythm.bpm,
    beats: Array.from(essentia.vectorToArray(rhythm.ticks)),
    onsets,
    confidence: rhythm.confidence,
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.input) {
    console.error(
      'Usage: node scripts/analyze-beats.mjs <audio> [--fps n] [--bpm n] [--offset s] [--bar n]\n' +
        '         [--sections energy|bars] [--section-bars n] [--band-hz n] [--no-bands] [--out path]',
    )
    process.exit(1)
  }
  if (!(args.fps > 0)) throw new Error('--fps must be > 0')
  if ('bpm' in args && !(args.bpm > 0)) throw new Error('--bpm must be a positive number')
  if ('offset' in args && !Number.isFinite(args.offset)) throw new Error('--offset must be a number')
  if (!(args.bar >= 1)) throw new Error('--bar must be >= 1')
  if (!(args.sectionBars >= 1)) throw new Error('--section-bars must be >= 1')
  if (!(args.bandHz > 0)) throw new Error('--band-hz must be > 0')

  console.error(`Decoding ${args.input} → mono PCM @ ${SAMPLE_RATE}Hz …`)
  const pcm = decodePcm(args.input, SAMPLE_RATE)
  const duration = pcm.length / SAMPLE_RATE

  console.error('Analysing rhythm + onsets with essentia.js …')
  const essentia = await loadEssentia()
  const detected = analyseAudio(essentia, pcm)

  let { bpm, beats, onsets } = detected
  if (args.offset) {
    beats = applyOffset(beats, args.offset, duration)
    onsets = applyOffset(onsets, args.offset, duration)
  }
  if (args.bpm) {
    bpm = args.bpm
    beats = buildBeatGrid(bpm, beats.length ? beats[0] : 0, duration)
  }

  const downbeats = deriveDownbeats(beats, args.bar)

  // The dynamics ear: low/mid/high energy envelopes from the same PCM, committed
  // so the render path reads them back deterministically (no runtime re-decode).
  let bands
  if (args.bands) {
    console.error(`Computing energy bands @ ~${args.bandHz}Hz (low/mid/high) …`)
    bands = computeBands(pcm, SAMPLE_RATE, args.bandHz)
  }

  // Sections: cut where the energy regime actually changes (default), or on a
  // fixed metric grid (`--sections bars`, the legacy behaviour).
  let sections
  if (args.sections === 'energy') {
    const overall = overallEnergy(pcm, SAMPLE_RATE, args.bandHz)
    sections = deriveSectionsFromEnergy(overall.env, overall.hz, downbeats, duration)
    console.error(`Segmenting by energy → ${sections.length} sections`)
  } else {
    sections = deriveSections(downbeats, duration, args.sectionBars)
  }

  // Typed structural moments (drops / lifts / breaks / dropouts) — the
  // motion-design hit points, derived from the sections + bands + bar grid.
  let moments
  if (bands) {
    moments = detectMoments(sections, bands, downbeats, duration)
    if (moments.length) {
      const kinds = [...new Set(moments.map((m) => m.type))].join(', ')
      console.error(`Detected ${moments.length} structural moments (${kinds})`)
    }
  }

  const map = assembleBeatMap({ duration, bpm, beats, downbeats, onsets, sections, bands, moments })
  validateBeatMap(map)

  const out = args.out ?? defaultOutPath(args.input)
  writeFileSync(out, serializeBeatMap(map) + '\n')
  console.error(
    `Wrote ${out} — ${map.beats.length} beats, ${map.downbeats.length} downbeats, ` +
      `${map.onsets.length} golpes, ${map.sections.length} sections` +
      (bands ? `, ${bands.low.length} energy samples/band @ ${bands.hz}Hz` : '') +
      (map.moments ? `, ${map.moments.length} moments` : '') +
      ` (detection confidence ${Number(detected.confidence).toFixed(2)})`,
  )
  console.log(formatFrameSummary(map, args.fps))
}

// Only run the CLI when executed directly — importing for tests must be silent.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
