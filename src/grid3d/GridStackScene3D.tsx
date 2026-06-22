/**
 * GridStackScene3D — the CSS-3D stage that stacks the process planes.
 * ──────────────────────────────────────────────────────────────────────────
 * A `perspective` stage; inside it a preserve-3d "camera" layer (rotated to the
 * iso 3/4 with a calm drift) holds the N planes, each `translate3d`-ed along the
 * exploded-fan diagonal and fading/blurring with depth (atmospheric rack-focus).
 * Every plane runs its own <ProcessGrid>, started on the front→back depth wave.
 *
 * Pure CSS-3D — NO three.js — so the real neumorphic plates render pixel-exact,
 * and NO useCurrentFrame: `frame` arrives as a prop, so the same stage mounts in
 * the studio's live preview and in Remotion's deterministic render.
 */
import { darkTheme, lightTheme } from '@/lib/neumorphism';
import { ProcessGrid } from './ProcessGrid';
import { planeStepCounts, type GridStackDoc } from './doc';
import {
  blurFactor,
  cameraPoseAt,
  cameraTransformCss,
  dimFactor,
  gridStackTimeline,
  planeTransformCss,
  resolveLayout,
} from './gridStack3d';

export type GridStackScene3DProps = {
  doc: GridStackDoc;
  /** Global frame driving the depth wave + camera drift (host-supplied). */
  frame: number;
};

export function GridStackScene3D({ doc, frame }: GridStackScene3DProps) {
  const layout = resolveLayout(doc.layout);
  const theme = doc.dark ? darkTheme : lightTheme;
  const tl = gridStackTimeline(planeStepCounts(doc));
  const cam = cameraPoseAt(frame, tl.total, layout);
  const n = doc.planes.length;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        perspective: `${layout.perspective}px`,
        perspectiveOrigin: '50% 45%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 0,
          height: 0,
          transformStyle: 'preserve-3d',
          transform: cameraTransformCss(cam),
        }}
      >
        {doc.planes.map((spec, k) => {
          const blur = blurFactor(k, n, layout);
          const dim = dimFactor(k, n, layout);
          const fill = layout.fillOpacity;
          // A solid card must NOT go see-through: blend the depth-fade away as
          // fill rises. At fill=1 every plane is fully opaque; depth then reads
          // from a surface-coloured haze veil (aerial perspective) + blur.
          const planeOpacity = dim + (1 - dim) * fill;
          const veilAlpha = (1 - dim) * fill;
          return (
            <div
              key={k}
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                transformStyle: 'preserve-3d',
                transform: planeTransformCss(k, n, layout),
                opacity: planeOpacity,
                filter: blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : undefined,
                backfaceVisibility: 'hidden',
              }}
            >
              <ProcessGrid spec={spec} reveal={tl.planeReveal(k, frame)} theme={theme} cell={doc.cell} fill={fill} />
              {veilAlpha > 0.001 ? (
                <div
                  aria-hidden="true"
                  style={{ position: 'absolute', inset: 0, borderRadius: 28, background: theme.surface, opacity: veilAlpha, pointerEvents: 'none' }}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
