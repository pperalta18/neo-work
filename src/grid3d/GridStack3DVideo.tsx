/**
 * GridStack3DVideo — the Remotion face of the 3D stacked-process generator.
 * ──────────────────────────────────────────────────────────────────────────
 * The thin deterministic renderer: it paints the page ground and mounts the
 * SAME <GridStackScene3D> the studio uses, driven by useCurrentFrame(). Pure
 * CSS-3D (no three.js) → the neumorphic plates render pixel-exact and the whole
 * thing is frame-deterministic. Its props ARE the studio's `GridStackDoc`, so a
 * doc copied out of grid3d.html renders here verbatim. `calculateGridStack3DMetadata`
 * sizes the timeline to the depth wave.
 *
 * All staging/timing math lives in `gridStack3d`; this file owns none.
 */
import { useEffect, useState } from 'react';
import type { CalculateMetadataFunction } from 'remotion';
import { AbsoluteFill, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { TEXT_FONT } from '@/lib/neumorphism';
import { MODULES, isModuleName, type ModuleName } from '@/stories/neo/modules/modules';
import { Fonts } from '../remotion/fonts';
import { GridStackScene3D } from './GridStackScene3D';
import { GRID_STACK_DOC_DEFAULTS, gridStackBackground, planeStepCounts, type GridStackDoc } from './doc';
import { gridStackTimeline } from './gridStack3d';

const FPS = 30;
const W = 1920;
const H = 1080;

export type GridStack3DProps = GridStackDoc;

export const GRID_STACK3D_DEFAULTS: GridStack3DProps = GRID_STACK_DOC_DEFAULTS;

export const calculateGridStack3DMetadata: CalculateMetadataFunction<GridStack3DProps> = ({ props }) => {
  const doc = { ...GRID_STACK3D_DEFAULTS, ...props };
  return {
    durationInFrames: gridStackTimeline(planeStepCounts(doc)).total,
    fps: FPS,
    width: W,
    height: H,
  };
};

/** Warm the browser cache for every module icon across all planes, so the
 *  plates have them on frame 0 (module icons are images → must preload). */
function useModuleIconPreload(doc: GridStackDoc) {
  const [handle] = useState(() => delayRender('Preload module icons', { timeoutInMilliseconds: 12000 }));
  useEffect(() => {
    const names = new Set<ModuleName>();
    for (const plane of doc.planes) {
      for (const step of plane.route) if (isModuleName(step.module)) names.add(step.module);
    }
    const urls = Array.from(names).map((n) => MODULES[n].icon);
    if (urls.length === 0) {
      continueRender(handle);
      return;
    }
    let done = 0;
    const tick = () => {
      done += 1;
      if (done >= urls.length) continueRender(handle);
    };
    for (const url of urls) {
      const img = new Image();
      img.onload = tick;
      img.onerror = tick;
      img.src = url;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export const GridStack3DVideo: React.FC<GridStack3DProps> = (input) => {
  const doc: GridStackDoc = { ...GRID_STACK3D_DEFAULTS, ...input };
  const frame = useCurrentFrame();
  useModuleIconPreload(doc);
  const ground = gridStackBackground(doc.dark);

  return (
    <AbsoluteFill style={{ background: ground.background, fontFamily: TEXT_FONT, overflow: 'hidden' }}>
      <Fonts />
      <GridStackScene3D doc={doc} frame={frame} />
      <AbsoluteFill style={{ background: ground.vignette, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
