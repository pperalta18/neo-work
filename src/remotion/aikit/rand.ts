/**
 * rand.ts — deterministic randomness for the AiKit Live kit.
 * ──────────────────────────────────────────────────────────
 * Remotion house rule: frame N must render byte-identically every time, so
 * nothing in `src/remotion/` may call Math.random()/Date.now(). Every kit
 * component that needs jitter, scatter or procedural data derives it from a
 * seeded PRNG so layouts are stable across frames, renders and machines.
 */

/** mulberry32 — tiny seeded PRNG, returns a () => number in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Stateless hash-to-[0,1) for "random per index" lookups (stable, no stream). */
export function seeded(index: number, salt = 0): number {
  let h = (index * 374761393 + salt * 668265263) >>> 0
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/** Pick from an array by seeded index. */
export function pick<T>(arr: readonly T[], index: number, salt = 0): T {
  return arr[Math.floor(seeded(index, salt) * arr.length)]
}
