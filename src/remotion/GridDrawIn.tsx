import { type ReactElement, type ReactNode } from 'react';
import { CELL, KIT_BLUE, lightTheme, type NeoTheme } from '@/lib/neumorphism';
import { CURVE, ease } from './motion';

/**
 * GridDrawIn — the "process grid" drawing itself in.
 * ──────────────────────────────────────────────────────────────────────────
 * A scalable entrance animation for the grid we use across the path/process
 * scenes. Every hairline TRACES its own length (SVG stroke-dashoffset reveal),
 * woven in a cascade: first the interior horizontals (top→bottom, a little
 * delay between each), then the interior verticals (left→right), and finally
 * the outer frame — "the line that groups them all" — wraps the whole thing,
 * after which the panel settles into its soft neumorphic tray.
 *
 * It's frame-driven (give it `frame`) and dimension-driven (`columns × rows`),
 * so the same component animates any grid: the timeline auto-derives from the
 * number of lines. Drop content into `children` to overlay the process on top
 * once the skeleton is drawn.
 *
 * House rules (specs/motion-language.md): ease-out, NO bounce, depth = neumorphic
 * relief (never coloured glows). The pen accent is the only colour, and it dries
 * to the resting neutral hairline.
 */

export type GridLineStyle =
  /** A KIT_BLUE "pen" draws each line, then it dries to the neutral hairline. */
  | 'pen'
  /** Drawn straight in the resting neutral hairline — silent, like the real grid. */
  | 'hairline'
  /** A bright leading head with a short trail, leaving the hairline behind. */
  | 'comet';

export type GridDrawTiming = {
  /** Quiet anticipation hold before the first line starts (frames). */
  startH: number;
  /** How long one line takes to trace its full length (frames). */
  lineDraw: number;
  /** Delay between consecutive sibling lines — the cascade (frames). */
  stagger: number;
  /** How much the vertical pass overlaps the tail of the horizontal pass. */
  weaveOverlap: number;
  /** Gap after the last interior line before the frame begins (frames). */
  frameGap: number;
  /** How long the grouping frame takes to wrap the perimeter (frames). */
  frameDraw: number;
  /** Per-line settle: the pen/head fading from accent → neutral (frames). */
  settle: number;
  /** The soft tray shadow fading in after the frame closes (frames). */
  lift: number;
  /** End hold so the shot breathes instead of cutting dead (frames). */
  breathe: number;
};

/**
 * Defaults @30fps. Mapped to the motion duration tokens (DUR): a line is a
 * `base`-ish on-screen sweep, the stagger is `micro` ("un poco de delay"), and
 * the frame is a `grand` traversal because it spans the whole perimeter.
 */
export const DEFAULT_GRID_TIMING: GridDrawTiming = {
  startH: 6,
  lineDraw: 13,
  stagger: 3.5,
  weaveOverlap: 5,
  frameGap: 3,
  frameDraw: 24,
  settle: 11,
  lift: 16,
  breathe: 18,
};

export type GridDrawTimeline = {
  nH: number;
  nV: number;
  hStart: (i: number) => number;
  vStart: (j: number) => number;
  frameStart: number;
  frameEnd: number;
  /** Total frames the whole reveal occupies (incl. lift + breathe). */
  total: number;
};

/**
 * Derive the cascade timeline for a `columns × rows` grid. Pure — the source of
 * truth shared by the component and the composition's `durationInFrames`, so the
 * render is always exactly as long as the animation.
 */
export function gridDrawTimeline(
  columns: number,
  rows: number,
  timing: Partial<GridDrawTiming> = {},
): GridDrawTimeline {
  const t = { ...DEFAULT_GRID_TIMING, ...timing };
  const nH = Math.max(0, rows - 1); // interior horizontal lines
  const nV = Math.max(0, columns - 1); // interior vertical lines

  const hStart = (i: number) => t.startH + i * t.stagger;
  const hEnd = nH > 0 ? hStart(nH - 1) + t.lineDraw : t.startH;

  // Verticals begin as the last horizontal is still landing — a smooth weave,
  // not two disjoint phases — but they clearly follow ("luego las verticales").
  const vBase = nH > 0 ? hEnd - t.weaveOverlap : t.startH;
  const vStart = (j: number) => vBase + j * t.stagger;
  const vEnd = nV > 0 ? vStart(nV - 1) + t.lineDraw : vBase;

  const frameStart = vEnd + t.frameGap;
  const frameEnd = frameStart + t.frameDraw;
  const total = Math.ceil(frameEnd + t.lift + t.breathe);

  return { nH, nV, hStart, vStart, frameStart, frameEnd, total };
}

/** Total frames a grid's draw-in occupies — for the composition duration. */
export function gridDrawDuration(
  columns: number,
  rows: number,
  timing: Partial<GridDrawTiming> = {},
): number {
  return gridDrawTimeline(columns, rows, timing).total;
}

export type GridDrawInProps = {
  columns: number;
  rows: number;
  /** Uniform cell edge in px. Defaults to the 128px Figma module. */
  cell?: number;
  /** Current frame (drives the whole animation). */
  frame: number;
  theme?: NeoTheme;
  lineStyle?: GridLineStyle;
  /** Pen / comet colour. Defaults to KIT_BLUE. */
  accent?: string;
  timing?: Partial<GridDrawTiming>;
  /** Corner radius of the grouping frame. */
  frameRadius?: number;
  /** Overlaid on top of the skeleton — the process content, once drawn. */
  children?: ReactNode;
};

type StrokeVisual = {
  stroke: string;
  strokeWidth: number;
  fill: 'none';
  strokeLinecap: 'round';
  /** Omit → dash units are px (the natural path length). Set 1 → normalised. */
  pathLength?: number;
  strokeDasharray: number | string;
  strokeDashoffset: number;
  opacity?: number;
};

type Geometry = (v: StrokeVisual) => ReactElement;

/**
 * The accent "tip" — stacked segments that all END at the moving draw front,
 * with decreasing opacity as they reach further back, so only the leading edge
 * glows and it fades (the degradado) into the neutral hairline behind it.
 * `len` is a fraction of a cell, so the blue tip + trail keep the same visual
 * proportion at any grid scale — and the trail runs ~1 cell long, clearly
 * visible rather than a tiny dot.
 */
type TipSeg = { len: number; opacity: number; width: number };
const PEN_TIP: TipSeg[] = [
  { len: 0.12, opacity: 1, width: 0.4 }, // the bright moving tip
  { len: 0.34, opacity: 0.55, width: 0.2 }, // upper gradient
  { len: 0.66, opacity: 0.3, width: 0.05 }, // mid gradient
  { len: 1.1, opacity: 0.12, width: 0 }, // long soft tail into the hairline
];
const COMET_TIP: TipSeg[] = [
  { len: 0.1, opacity: 1, width: 1 },
  { len: 0.32, opacity: 0.62, width: 0.4 },
  { len: 0.72, opacity: 0.34, width: 0.1 },
  { len: 1.35, opacity: 0.16, width: 0 },
];

/**
 * One self-drawing line. The permanent neutral "ink" is always revealed up to
 * the draw progress; the accent tip rides the moving front and lifts off once
 * the line completes (the "settle"), leaving just the hairline.
 */
function Stroke({
  frame,
  start,
  draw,
  settle,
  lineStyle,
  accent,
  ink,
  width,
  length,
  unit,
  geometry,
}: {
  frame: number;
  start: number;
  draw: number;
  settle: number;
  lineStyle: GridLineStyle;
  accent: string;
  ink: string;
  width: number;
  /** Real path length in px — positions the tip along the line. */
  length: number;
  /** Reference unit (the cell) the tip lengths scale to. */
  unit: number;
  geometry: Geometry;
}): ReactElement | null {
  const p = ease(frame, start, start + draw, CURVE.standard);
  if (p <= 0) return null;

  // permanent neutral ink, revealed up to the draw front. pathLength=1
  // normalises it, so the reveal needs no length math — scales for free.
  const reveal = geometry({
    stroke: ink,
    strokeWidth: width,
    fill: 'none',
    strokeLinecap: 'round',
    pathLength: 1,
    strokeDasharray: 1,
    strokeDashoffset: 1 - p,
  });

  if (lineStyle === 'hairline') return <g>{reveal}</g>;

  // the accent tip rides the front (front = px along the path), then fades.
  const tipLevel = 1 - ease(frame, start + draw, start + draw + settle);
  const front = p * length;
  const profile = lineStyle === 'comet' ? COMET_TIP : PEN_TIP;

  return (
    <g>
      {reveal}
      {tipLevel > 0.001
        ? profile.map((seg, k) => {
            const segLen = seg.len * unit; // fraction of a cell → px
            return (
              <g key={k}>
                {geometry({
                  stroke: accent,
                  strokeWidth: width + seg.width,
                  fill: 'none',
                  strokeLinecap: 'round',
                  opacity: seg.opacity * tipLevel,
                  // a single lit segment of `segLen` px ending at the front
                  strokeDasharray: `${segLen} ${length + segLen}`,
                  strokeDashoffset: segLen - front,
                })}
              </g>
            );
          })
        : null}
    </g>
  );
}

export function GridDrawIn({
  columns,
  rows,
  cell = CELL,
  frame,
  theme = lightTheme,
  lineStyle = 'pen',
  accent = KIT_BLUE,
  timing,
  frameRadius = 28,
  children,
}: GridDrawInProps) {
  const t = { ...DEFAULT_GRID_TIMING, ...timing };
  const tl = gridDrawTimeline(columns, rows, t);
  const W = columns * cell;
  const H = rows * cell;
  const ink = theme.gridLine;
  // perimeter of the rounded frame rect (straight runs + the 4 quarter-arcs)
  const frameLen = 2 * (W - 1.5 + (H - 1.5)) - 2 * frameRadius * (4 - Math.PI);

  // After the frame closes, the panel rises into its soft neumorphic tray —
  // depth from relief, never a coloured glow.
  const lift = ease(frame, tl.frameEnd, tl.frameEnd + t.lift, CURVE.enter);

  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {/* the soft tray the grid settles onto (fades in last) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: frameRadius,
          boxShadow: lift > 0.001 ? `0 ${18 * lift}px ${50 * lift}px -20px ${theme.shadow}` : 'none',
        }}
      />

      <svg
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
      >
        {/* PASS 1 · interior horizontals — trace left→right, cascade top→bottom */}
        {Array.from({ length: tl.nH }, (_, i) => {
          const y = (i + 1) * cell;
          return (
            <Stroke
              key={`h${i}`}
              frame={frame}
              start={tl.hStart(i)}
              draw={t.lineDraw}
              settle={t.settle}
              lineStyle={lineStyle}
              accent={accent}
              ink={ink}
              width={1}
              length={W}
              unit={cell}
              geometry={(v) => <line x1={0} y1={y} x2={W} y2={y} {...v} />}
            />
          );
        })}

        {/* PASS 2 · interior verticals — trace top→bottom, cascade left→right */}
        {Array.from({ length: tl.nV }, (_, j) => {
          const x = (j + 1) * cell;
          return (
            <Stroke
              key={`v${j}`}
              frame={frame}
              start={tl.vStart(j)}
              draw={t.lineDraw}
              settle={t.settle}
              lineStyle={lineStyle}
              accent={accent}
              ink={ink}
              width={1}
              length={H}
              unit={cell}
              geometry={(v) => <line x1={x} y1={0} x2={x} y2={H} {...v} />}
            />
          );
        })}

        {/* PASS 3 · the frame that groups them all — wraps the perimeter last */}
        <Stroke
          frame={frame}
          start={tl.frameStart}
          draw={t.frameDraw}
          settle={t.settle}
          lineStyle={lineStyle}
          accent={accent}
          ink={ink}
          width={1.5}
          length={frameLen}
          unit={cell}
          geometry={(v) => (
            <rect x={0.75} y={0.75} width={W - 1.5} height={H - 1.5} rx={frameRadius} ry={frameRadius} {...v} />
          )}
        />
      </svg>

      {children}
    </div>
  );
}
