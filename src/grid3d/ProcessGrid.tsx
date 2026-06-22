/**
 * ProcessGrid — one concept's process, drawn frame-deterministically.
 * ──────────────────────────────────────────────────────────────────────────
 * StoreFlow's emergence, generalised to ANY PathSpec: the route's plates rise
 * flat→raised (shadow grows, scales up, fades in) as a continuous `reveal`
 * count passes their index. Unlike <PathScene>/<Cell> (which emerge via a
 * wall-clock CSS transition — non-deterministic under Remotion), every plate
 * here is a pure function of `reveal`, so it renders identically in the studio
 * and in Remotion. One process plane; the 3D stack mounts N of these.
 */
import type { CSSProperties, ReactNode } from 'react';
import { CELL, elevation, KIT_BLUE, lightTheme, PLATE_INSET, TEXT_FONT, type NeoTheme } from '@/lib/neumorphism';
import { footprint, reflowRoute, routeArrows, type Coord, type Dir, type RouteStep } from '@/lib/pathfinding';
import { Grid } from '@/components/Grid';
import { Chevron, Label } from '@/components/content';
import { Icon, isIconName } from '@/components/icons';
import { MODULES, isModuleName, type ModuleSpec } from '@/stories/neo/modules/modules';
import type { PathSpec } from '@/components/PathScene';

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);

/** Hex (#rgb / #rrggbb) → rgba() string at the given alpha. */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export type ProcessGridProps = {
  spec: PathSpec;
  /** Continuous revealedCount (0..route.length); the host derives it from frame. */
  reveal: number;
  theme?: NeoTheme;
  cell?: number;
  /** Opacity of the plane's surface fill behind the hairlines (0 glass → 1 solid). */
  fill?: number;
};

/** Resolve the effective geometry of a spec (footprint-aware grid growth). */
export function resolveSpec(spec: PathSpec, cell: number) {
  const route = reflowRoute(spec.route);
  const columns = Math.max(spec.columns, ...route.map((s) => footprint(s).c1));
  const rows = Math.max(spec.rows, ...route.map((s) => footprint(s).r1));
  const startNode: Coord = spec.startNode ?? [0, route[0]?.at[1] ?? 1];
  const goalNode: Coord = [columns + 1, 1];
  const arrows = routeArrows(route, goalNode);
  return { route, columns, rows, startNode, goalNode, arrows, width: columns * cell, height: rows * cell };
}

/** A single self-emerging plate (frame-driven `grow`). Mirrors StoreFlow's FlowPlate. */
function ProcessPlate({
  step,
  dir,
  grow,
  theme,
}: {
  step: RouteStep;
  dir: Dir;
  grow: number;
  theme: NeoTheme;
}) {
  if (grow <= 0.001) return null; // not emerged yet → bare grid where it will appear
  const fp = footprint(step);
  const isSpan = (step.colSpan ?? 1) > 1 || (step.rowSpan ?? 1) > 1;
  const g = grow;
  const scale = 0.9 + 0.1 * g;
  const opacity = clamp01(g * 1.5);

  const wrap = (inner: ReactNode, extra?: CSSProperties) => (
    <div
      style={{
        position: 'absolute',
        left: (fp.c0 - 1) * CELL,
        top: (fp.r0 - 1) * CELL,
        width: (fp.c1 - fp.c0 + 1) * CELL,
        height: (fp.r1 - fp.r0 + 1) * CELL,
      }}
    >
      {isSpan ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.surface,
            boxShadow: `inset 0 0 0 1px ${theme.gridLine}`,
            opacity: clamp01(g * 1.8),
          }}
        />
      ) : null}
      <div style={{ position: 'absolute', inset: PLATE_INSET, ...extra }}>{inner}</div>
    </div>
  );

  // Image plate.
  if (step.image) {
    return wrap(null, {
      borderRadius: 24,
      overflow: 'hidden',
      background: step.image.background ?? theme.surface,
      ...(step.image.src ? { backgroundImage: `url(${step.image.src})`, backgroundSize: 'cover', backgroundPosition: 'center' } : null),
      boxShadow: `0 ${8 * g}px ${16 * g}px -6px ${theme.shadow}`,
      transform: `scale(${scale})`,
      opacity,
    });
  }

  const moduleSpec: ModuleSpec | null = isModuleName(step.module) ? MODULES[step.module] : null;
  const iconEl: ReactNode = moduleSpec ? (
    <img
      src={moduleSpec.icon}
      alt={moduleSpec.name}
      width={40}
      height={40}
      style={{ display: 'block', flexShrink: 0, transform: moduleSpec.rotate ? `rotate(${moduleSpec.rotate}deg)` : undefined }}
    />
  ) : isIconName(step.icon) ? (
    <Icon name={step.icon} />
  ) : null;

  let content: ReactNode;
  if (step.text) content = (<>{iconEl}<Label muted={step.text.muted}>{step.text.main}</Label></>);
  else if (iconEl) content = iconEl;
  else content = <Chevron dir={dir} />;

  const plate = elevation(theme, { depth: 'raised', distance: 8 * g, blur: 16 * g, radius: 24 });
  return wrap(content, {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '0 24px',
    color: theme.textStrong,
    fontFamily: TEXT_FONT,
    fontSize: 20,
    lineHeight: '28px',
    letterSpacing: -0.4,
    whiteSpace: 'nowrap',
    ...plate,
    transform: `scale(${scale})`,
    opacity,
  });
}

/** Start / goal discs — present from frame 0 (the route's endpoints). */
function ProcessNode({ coord, variant, theme }: { coord: Coord; variant: 'start' | 'goal'; theme: NeoTheme }) {
  const cx = (coord[0] - 0.5) * CELL;
  const cy = (coord[1] - 0.5) * CELL;
  const discSize = CELL - PLATE_INSET * 2;
  return (
    <div style={{ position: 'absolute', left: cx - CELL / 2, top: cy - CELL / 2, width: CELL, height: CELL }}>
      <div style={{ position: 'absolute', inset: PLATE_INSET, display: 'grid', placeItems: 'center', ...elevation(theme, { depth: 'raised', radius: 999 }) }}>
        {variant === 'goal' ? (
          <div
            style={{
              width: discSize * 0.5,
              height: discSize * 0.5,
              borderRadius: 999,
              background: KIT_BLUE,
              boxShadow: `0 0 ${discSize * 0.25}px ${KIT_BLUE}66`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export function ProcessGrid({ spec, reveal, theme = lightTheme, cell = CELL, fill = 1 }: ProcessGridProps) {
  const { route, columns, rows, startNode, goalNode, arrows } = resolveSpec(spec, cell);
  // The surface fill behind the hairlines — so a plane reads as a solid card
  // rather than see-through glass. 0 keeps it transparent.
  const fillStyle = fill > 0.001 ? { background: hexToRgba(theme.surface, clamp01(fill)) } : undefined;
  return (
    <Grid columns={columns} rows={rows} cell={cell} theme={theme} frame gridlines style={fillStyle}>
      {route.map((step, i) => (
        <ProcessPlate key={i} step={step} dir={arrows[i]} grow={clamp01(reveal - i)} theme={theme} />
      ))}
      <ProcessNode coord={startNode} variant="start" theme={theme} />
      <ProcessNode coord={goalNode} variant="goal" theme={theme} />
    </Grid>
  );
}
