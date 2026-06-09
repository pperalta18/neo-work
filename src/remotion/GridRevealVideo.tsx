/**
 * GridRevealVideo — the process grid drawing itself in.
 * ──────────────────────────────────────────────────────────────────────────
 * A reusable entrance for any grid: the hairlines trace themselves in a woven
 * cascade (horizontals, then verticals), closing with the frame that groups
 * them all, then the panel settles into its neumorphic tray. Parameterised by
 * `columns × rows` from the Studio sidebar; `calculateGridRevealMetadata` sizes
 * the timeline to the grid, so the render is exactly as long as the animation.
 *
 * The actual drawing lives in the reusable <GridDrawIn>, so the same animation
 * can front any of the path/process scenes — drop content into its children to
 * reveal the process on the freshly-drawn skeleton.
 */
import type { CalculateMetadataFunction } from 'remotion';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { darkTheme, lightTheme, TEXT_FONT } from '@/lib/neumorphism';
import { CURVE } from './motion';
import { Fonts } from './fonts';
import { GridDrawIn, gridDrawDuration, type GridLineStyle } from './GridDrawIn';

const FPS = 30;
const W = 1920;
const H = 1080;

export type GridRevealProps = {
  columns: number;
  rows: number;
  /** Uniform cell px; `null` auto-fits the grid to the frame. */
  cell?: number | null;
  lineStyle?: GridLineStyle;
  dark?: boolean;
};

export const GRID_REVEAL_DEFAULTS: GridRevealProps = {
  columns: 6,
  rows: 4,
  cell: null,
  lineStyle: 'pen',
  dark: false,
};

/** Largest cell that keeps the grid comfortably inside the 1080p safe area. */
function autoFitCell(columns: number, rows: number): number {
  const usableW = 1480;
  const usableH = 780;
  return Math.round(Math.max(70, Math.min(240, usableW / columns, usableH / rows)));
}

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

export const calculateGridRevealMetadata: CalculateMetadataFunction<GridRevealProps> = ({ props }) => {
  const { columns, rows } = { ...GRID_REVEAL_DEFAULTS, ...props };
  return {
    durationInFrames: gridDrawDuration(columns, rows),
    fps: FPS,
    width: W,
    height: H,
  };
};

export const GridRevealVideo: React.FC<GridRevealProps> = (input) => {
  const { columns, rows, cell: cellProp, lineStyle, dark } = { ...GRID_REVEAL_DEFAULTS, ...input };
  const frame = useCurrentFrame();
  const theme = dark ? darkTheme : lightTheme;
  const cell = cellProp ?? autoFitCell(columns, rows);
  const total = gridDrawDuration(columns, rows);

  // a whisper of a dolly push-in for life — on-screen move → STANDARD curve
  const dolly = interpolate(frame, [0, total], [1, 1.016], { ...clamp, easing: CURVE.standard });

  const background = dark
    ? `radial-gradient(circle at 50% 45%, #1b212b, ${darkTheme.surface} 60%, #0f131a)`
    : `radial-gradient(circle at 50% 45%, #fbfbff, ${lightTheme.surface} 62%, #edeef4)`;
  const vignette = dark
    ? 'radial-gradient(circle at 50% 45%, transparent 52%, rgba(0,0,0,0.35) 100%)'
    : 'radial-gradient(circle at 50% 45%, transparent 55%, rgba(120,134,160,0.10) 100%)';

  return (
    <AbsoluteFill style={{ background, fontFamily: TEXT_FONT, overflow: 'hidden' }}>
      <Fonts />
      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${dolly})`,
          transformOrigin: '50% 47%',
        }}
      >
        <GridDrawIn
          columns={columns}
          rows={rows}
          cell={cell}
          frame={frame}
          theme={theme}
          lineStyle={lineStyle}
        />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: vignette, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
