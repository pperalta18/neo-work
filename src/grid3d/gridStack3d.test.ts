import { describe, expect, it } from 'vitest';
import {
  blurFactor,
  cameraPoseAt,
  dimFactor,
  GRID_STACK3D_LAYOUT,
  gridStackTimeline,
  planeProcessFrames,
  planeTransform,
  PLANE_BEAT,
  PLANE_INTRO,
  resolveLayout,
  STACK_BREATHE,
} from './gridStack3d';

describe('gridStackTimeline — front→back process depth wave', () => {
  it('plane 0 starts at frame 0', () => {
    expect(gridStackTimeline([5, 7, 4]).planeStart(0)).toBe(0);
  });

  it('plane starts are strictly increasing and overlap (< the plane that precedes them)', () => {
    const counts = [5, 7, 4, 6];
    const tl = gridStackTimeline(counts);
    for (let k = 1; k < counts.length; k++) {
      expect(tl.planeStart(k)).toBeGreaterThan(tl.planeStart(k - 1));
      // overlap: plane k starts before plane k-1 finishes building
      expect(tl.planeStart(k)).toBeLessThan(tl.planeStart(k - 1) + tl.planeFrames(k - 1));
    }
  });

  it('per-plane build length follows its own step count', () => {
    const tl = gridStackTimeline([3, 9]);
    expect(tl.planeFrames(0)).toBe(planeProcessFrames(3));
    expect(tl.planeFrames(1)).toBe(planeProcessFrames(9));
    expect(tl.planeFrames(1)).toBeGreaterThan(tl.planeFrames(0));
  });

  it('total = deepest plane end + breathe', () => {
    const counts = [5, 7, 4];
    const tl = gridStackTimeline(counts);
    const deepest = Math.max(...counts.map((_, k) => tl.planeStart(k) + tl.planeFrames(k)));
    expect(tl.total).toBe(Math.ceil(deepest + STACK_BREATHE));
  });

  it('a single plane ≈ its own process + breathe', () => {
    const tl = gridStackTimeline([6]);
    expect(tl.planes).toBe(1);
    expect(tl.planeStart(0)).toBe(0);
    expect(tl.total).toBe(Math.ceil(planeProcessFrames(6) + STACK_BREATHE));
  });

  it('an empty step list never produces NaN', () => {
    const tl = gridStackTimeline([]);
    expect(tl.planes).toBe(1);
    expect(Number.isFinite(tl.total)).toBe(true);
  });
});

describe('planeReveal — continuous emergence per plane', () => {
  it('is 0 before the plane starts and through its intro hold', () => {
    const tl = gridStackTimeline([4, 4]);
    expect(tl.planeReveal(0, 0)).toBe(0);
    expect(tl.planeReveal(0, PLANE_INTRO)).toBe(0);
    // plane 1 hasn't even started at frame 0
    expect(tl.planeReveal(1, 0)).toBe(0);
  });

  it('grows ~1 step per beat after the intro and caps at the step count', () => {
    const tl = gridStackTimeline([4]);
    expect(tl.planeReveal(0, PLANE_INTRO + PLANE_BEAT)).toBeCloseTo(1, 6);
    expect(tl.planeReveal(0, PLANE_INTRO + 2 * PLANE_BEAT)).toBeCloseTo(2, 6);
    expect(tl.planeReveal(0, 100000)).toBe(4); // capped at steps
  });
});

describe('planeTransform — exploded iso fan, stack centred on the origin', () => {
  it('a single plane sits at the origin', () => {
    const [x, y, z] = planeTransform(0, 1);
    expect(x).toBeCloseTo(0, 6);
    expect(y).toBeCloseTo(0, 6);
    expect(z).toBeCloseTo(0, 6);
  });

  it('planes recede in −z and fan out, centred (front +z, back −z about 0)', () => {
    const front = planeTransform(0, 4);
    const back = planeTransform(3, 4);
    expect(front[2]).toBeGreaterThan(0); // nearest the camera
    expect(back[2]).toBeLessThan(0); // farthest
    expect(front[2] + back[2]).toBeCloseTo(0, 6); // symmetric about origin
    expect(back[0]).toBeGreaterThan(front[0]); // fanned +x
  });

  it('depth is linear in k and scales with gapPx', () => {
    const wide = resolveLayout({ gapPx: 500 });
    const d = planeTransform(0, 3, wide)[2] - planeTransform(1, 3, wide)[2];
    expect(d).toBeCloseTo(500, 6);
  });
});

describe('dimFactor / blurFactor — atmospheric rack-focus', () => {
  it('front plane is crisp (dim 1, blur 0), back plane hits the floor', () => {
    expect(dimFactor(0, 4)).toBe(1);
    expect(blurFactor(0, 4)).toBe(0);
    expect(dimFactor(3, 4)).toBeCloseTo(GRID_STACK3D_LAYOUT.dimFloor, 6);
    expect(blurFactor(3, 4)).toBeCloseTo(GRID_STACK3D_LAYOUT.blurFar, 6);
  });

  it('dim is monotonically decreasing with depth', () => {
    for (let k = 1; k < 4; k++) expect(dimFactor(k, 4)).toBeLessThan(dimFactor(k - 1, 4));
  });

  it('a single plane is fully crisp (no div-by-zero)', () => {
    expect(dimFactor(0, 1)).toBe(1);
    expect(blurFactor(0, 1)).toBe(0);
  });

  it('respects layout overrides', () => {
    expect(dimFactor(3, 4, resolveLayout({ dimFloor: 0.1 }))).toBeCloseTo(0.1, 6);
  });
});

describe('cameraPoseAt — calm iso drift, frame-pure', () => {
  it('frame 0 sits on the base pose', () => {
    const p = cameraPoseAt(0, 300);
    expect(p.rotX).toBeCloseTo(GRID_STACK3D_LAYOUT.rotX, 6);
    expect(p.rotY).toBeCloseTo(GRID_STACK3D_LAYOUT.rotY, 6);
    expect(p.scale).toBeCloseTo(GRID_STACK3D_LAYOUT.scale, 6);
  });

  it('drifts a little and pushes in by the end, staying finite + clamped', () => {
    const end = cameraPoseAt(300, 300);
    expect(end.scale).toBeGreaterThan(GRID_STACK3D_LAYOUT.scale); // push-in
    for (const key of ['rotX', 'rotY', 'scale'] as const) {
      expect(Number.isFinite(end[key])).toBe(true);
      expect(Number.isFinite(cameraPoseAt(99999, 300)[key])).toBe(true); // clamps past the end
    }
  });
});
