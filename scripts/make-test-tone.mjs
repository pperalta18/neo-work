/**
 * make-test-tone — generate the committed beat-analyser fixture audio.
 * ────────────────────────────────────────────────────────────────────────────
 * Writes a deterministic, royalty-free 120 BPM 4/4 click track to
 * `public/audio/test-beat.wav`: a louder/higher click on every downbeat, a
 * softer click on the other beats. It exists so `npm run beats` has a real audio
 * file to analyse whose ground truth we already know — the detected BPM should
 * land on ~120 and beats every 0.5s — without committing any copyrighted music.
 *
 * Regenerate the fixture with:  node scripts/make-test-tone.mjs
 */

import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const SAMPLE_RATE = 44100
const BPM = 120
const BEATS_PER_BAR = 4
const BARS = 4 // 16 beats → 8.0s at 120 BPM

const secondsPerBeat = 60 / BPM
const totalBeats = BARS * BEATS_PER_BAR
const durationSeconds = totalBeats * secondsPerBeat
const sampleCount = Math.round(SAMPLE_RATE * durationSeconds)

// Synthesize: each beat is a short exponentially-decaying sine "click".
const samples = new Float32Array(sampleCount)
const clickLen = Math.round(0.08 * SAMPLE_RATE)
for (let b = 0; b < totalBeats; b++) {
  const start = Math.round(b * secondsPerBeat * SAMPLE_RATE)
  const isDownbeat = b % BEATS_PER_BAR === 0
  const freq = isDownbeat ? 1500 : 1000
  const amp = isDownbeat ? 0.9 : 0.55
  for (let i = 0; i < clickLen && start + i < sampleCount; i++) {
    const env = Math.exp(-i / (0.02 * SAMPLE_RATE))
    samples[start + i] += amp * env * Math.sin((2 * Math.PI * freq * i) / SAMPLE_RATE)
  }
}

// Encode as a 16-bit PCM mono WAV.
const bytesPerSample = 2
const dataBytes = sampleCount * bytesPerSample
const buffer = Buffer.alloc(44 + dataBytes)
buffer.write('RIFF', 0)
buffer.writeUInt32LE(36 + dataBytes, 4)
buffer.write('WAVE', 8)
buffer.write('fmt ', 12)
buffer.writeUInt32LE(16, 16) // PCM fmt chunk size
buffer.writeUInt16LE(1, 20) // audio format = PCM
buffer.writeUInt16LE(1, 22) // channels = mono
buffer.writeUInt32LE(SAMPLE_RATE, 24)
buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28) // byte rate
buffer.writeUInt16LE(bytesPerSample, 32) // block align
buffer.writeUInt16LE(16, 34) // bits per sample
buffer.write('data', 36)
buffer.writeUInt32LE(dataBytes, 40)
for (let i = 0; i < sampleCount; i++) {
  const clamped = Math.max(-1, Math.min(1, samples[i]))
  buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * bytesPerSample)
}

const out = fileURLToPath(new URL('../public/audio/test-beat.wav', import.meta.url))
writeFileSync(out, buffer)
console.log(`Wrote ${out} — ${durationSeconds.toFixed(2)}s, ${BPM} BPM, ${totalBeats} beats`)
