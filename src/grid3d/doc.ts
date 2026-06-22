/**
 * doc — the fully-configurable contract for a 3D stacked-process composition.
 * ──────────────────────────────────────────────────────────────────────────
 * A `GridStackDoc` is just data: an ordered list of `PathSpec` planes (each a
 * complete, editable concept — its own grid size + route + per-pill content),
 * plus the shared staging (`layout`), theme and cell size. The studio
 * (grid3d.html) edits a doc by eye and "Copy doc"s the JSON; paste it as the
 * Remotion <GridStack3DVideo> props and it renders that exact stack. One shape,
 * both hosts. Pure data + CSS strings — safe to import anywhere.
 */
import type { PathSpec } from '@/components/PathScene';
import { CONCEPTS } from '@/content/concepts';
import { GRID_STACK3D_LAYOUT, type GridStackLayout } from './gridStack3d';

export type GridStackDoc = {
  /** Ordered planes, front (k=0) → back. Each is a full editable concept. */
  planes: PathSpec[];
  /** The exploded-iso-fan staging (gap / fan / dim / blur / camera). */
  layout: GridStackLayout;
  dark: boolean;
  /** Uniform cell px across the stack (one scale reads cleaner in perspective). */
  cell: number;
};

export const GRID_STACK_DOC_DEFAULTS: GridStackDoc = {
  // Seed the stack with the existing concepts — a different process per plane,
  // demonstrating "various planes of the grids". Fully editable in the studio.
  planes: CONCEPTS.map((c) => c.spec),
  layout: GRID_STACK3D_LAYOUT,
  dark: false,
  cell: 128,
};

/** Step counts per plane — feeds the depth-wave timeline. */
export function planeStepCounts(doc: Pick<GridStackDoc, 'planes'>): number[] {
  return doc.planes.map((p) => p.route.length);
}

/**
 * The page ground — the SAME radial gradient + vignette the 2D process scenes
 * sit on. Both hosts paint this in CSS behind the perspective stage.
 */
export function gridStackBackground(dark: boolean): { background: string; vignette: string; surface: string } {
  if (dark) {
    return {
      surface: '#161a20',
      background: 'radial-gradient(circle at 50% 45%, #1b212b, #161a20 60%, #0f131a)',
      vignette: 'radial-gradient(circle at 50% 45%, transparent 52%, rgba(0,0,0,0.35) 100%)',
    };
  }
  return {
    surface: '#f4f4fa',
    background: 'radial-gradient(circle at 50% 45%, #fbfbff, #f4f4fa 62%, #edeef4)',
    vignette: 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(120,134,160,0.10) 100%)',
  };
}
