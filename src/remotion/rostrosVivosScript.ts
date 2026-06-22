/**
 * rostrosVivosScript — «Rostros vivos».
 * ───────────────────────────────────────────────────────────────────────────
 * STACKED living-tissue compositions. Each layer is «Tejido vivo» (the organism
 * of micro-processes, reused verbatim) with the user's face as a neumorphic
 * circle in its TOP-LEFT corner cell — but each layer runs its OWN processes
 * (its own seed) and carries its OWN profile. Upper layers sit ON TOP of the
 * base as offset sheets, casting a light drop shadow.
 *
 * Everything is a pure function of (frame). This module owns the faces, the
 * layer stack config and the owner-in-corner anchor; the shell builds each
 * layer's schedule via tejidoVivoScript.generateMaster(seed) and reuses its
 * camera/tissue directly.
 */
import { CELL, TEJIDO_VIVO_DURATION, clamp01, smoother } from './tejidoVivoScript'
import { CAST } from './aikit/cast'

/** The scene runs for exactly as long as «Tejido vivo». */
export const ROSTROS_VIVOS_DURATION = TEJIDO_VIVO_DURATION

export type Face = { id: string; name: string; src: string }

// ── owner anchor (world space — lives in each layer's grid, moves with camera) ──

export const OWNER_CELL_C = 1 // top-left column (1-based)
export const OWNER_CELL_R = 1 // top row
/** Circle diameter — nearly fills its single cell. */
export const OWNER_DIAM = CELL - 18
/** Pixel centre of the owner cell in grid space. */
export const OWNER_CENTER: [number, number] = [(OWNER_CELL_C - 0.5) * CELL, (OWNER_CELL_R - 0.5) * CELL]

/** Owner reveal 0→1 (gentle scale-in, early). */
export function ownerRevealAt(frame: number): number {
  return smoother(clamp01((frame - 10) / 34))
}

// ── the stacked layers ──────────────────────────────────────────────────────────
//
// Each layer = a full «Tejido vivo» composition with its own face + processes.
// `seed` omitted ⇒ the default field (identical to TejidoVivo). Upper layers are
// inset sheets, offset over the base, that slide+fade in and cast a drop shadow.

export type Layer = {
  id: string
  face: Face
  /** undefined ⇒ default field (exact Tejido vivo); a value ⇒ different processes. */
  seed?: number
  /** Sheet scale relative to the full frame (1 = full screen). */
  scale: number
  /** Top-left placement of the sheet in screen px. */
  offset: [number, number]
  /** Frame the sheet starts entering (0 = present from the first frame). */
  enterAt: number
}

export const ENTER_DUR = 44 // frames an upper sheet spends settling in

export const OWNER: Face = { id: 'dani', name: CAST.owner, src: 'rostros/dani.png' }
const SECOND: Face = { id: 'laura', name: CAST.laura, src: 'rostros/laura.png' }

export const LAYERS: Layer[] = [
  // Base — exact Tejido vivo, full screen, the owner in the corner.
  { id: 'base', face: OWNER, scale: 1, offset: [0, 0], enterAt: 0 },
  // On top — an identical composition with DIFFERENT processes + ANOTHER profile.
  { id: 'top', face: SECOND, seed: 0x5eed02, scale: 0.84, offset: [210, 120], enterAt: 30 },
]

/** Every face asset the shell must preload. */
export const ALL_FACE_SRCS: string[] = LAYERS.map((l) => l.face.src)

/** Entry state of an upper sheet (the base is always fully present). */
export type SheetState = { dy: number; opacity: number; land: number }
export function sheetStateAt(layer: Layer, frame: number): SheetState {
  if (layer.enterAt <= 0) return { dy: 0, opacity: 1, land: 1 }
  const age = frame - layer.enterAt
  if (age <= 0) return { dy: 48, opacity: 0, land: 0 }
  const e = smoother(clamp01(age / ENTER_DUR))
  return { dy: (1 - e) * 48, opacity: clamp01(age / 18), land: e }
}
