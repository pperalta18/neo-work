/**
 * Acto 2 · «El módulo lo gestiona» — Action Runner en funcionamiento.
 * ──────────────────────────────────────────────────────────────────────────────
 * MISMO lenguaje que accounting/e-commerce: la placa cuadrada neumórfica unitaria
 * `OperatingModuleTile` con el icono de **Action Runner** centrado. Las solicitudes
 * de ausencia vuelan desde fuera —en chorro continuo desde todas direcciones— hacia
 * el icono y son ABSORBIDAS (se encogen y se funden al llegar). Cuando han entrado
 * todas, la placa se EXPANDE revelando el estado «Aprobando ausencias» con su
 * shimmer. Todo derivado de `useCurrentFrame()` (hash determinista, sin random/Date).
 */

import { useCurrentFrame } from 'remotion';
import { OperatingModuleTile } from '../OperatingModuleTile';
import { lightTheme, TEXT_FONT, elevation, clamp01, lerp, smoother } from './loopKit';
import { AbsBg, REQUESTS } from './absencesShared';

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────────
const CORE_RISE = 12;
const FILE_START = 6;
const FILE_STEP = 3.4; // separación entre solicitudes (chorro continuo)
const FILE_FLIGHT = 18; // lo que tarda en volar y entrar
const FILE_COUNT = 12;
const EXPAND_IN = 16;
const HOLD = 34;

const LAST_LAND = FILE_START + (FILE_COUNT - 1) * FILE_STEP + FILE_FLIGHT;
export const ABS_PROCESS_DURATION = Math.ceil(LAST_LAND + HOLD);

const STAGE = 1080;
const CENTER = STAGE / 2;
const TILE = 168;
const CHIP_W = 214;
const CHIP_H = 74;

/** Hash determinista por índice → 0..1 (sustituye a Math.random). */
function rnd(i: number, salt = 0): number {
  const x = Math.sin((i + 1) * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

type FlySpec = { spawn: number; scx: number; scy: number; sTilt: number; idx: number };

/** Punto de partida: anillo amplio fuera de pantalla, repartido en todas direcciones. */
function buildFlights(): FlySpec[] {
  return Array.from({ length: FILE_COUNT }, (_, i): FlySpec => {
    const theta = 2 * Math.PI * rnd(i, 1) - Math.PI / 2;
    const R = 560 + rnd(i, 2) * 320;
    return {
      spawn: FILE_START + i * FILE_STEP,
      scx: CENTER + Math.cos(theta) * R,
      scy: CENTER + Math.sin(theta) * R * 0.74,
      sTilt: (rnd(i, 3) - 0.5) * 90,
      idx: i % REQUESTS.length,
    };
  });
}

/** Una solicitud que vuela hacia el icono y es absorbida (encoge y se funde). */
const FlyingRequest: React.FC<{ spec: FlySpec; frame: number }> = ({ spec, frame }) => {
  if (frame < spec.spawn - 0.001) return null;
  const p = smoother(clamp01((frame - spec.spawn) / FILE_FLIGHT));
  if (p >= 1) return null; // ya dentro

  const cx = lerp(spec.scx, CENTER, p);
  const cy = lerp(spec.scy, CENTER, p);
  const tilt = lerp(spec.sTilt, 0, p);
  const absorb = smoother(clamp01((p - 0.55) / 0.45));
  const scale = lerp(1.0, 0.12, absorb);
  const enter = clamp01(p / 0.14);
  const opacity = enter * (1 - absorb);

  const req = REQUESTS[spec.idx];
  const first = req.name.split(' ')[0];

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - CHIP_W / 2,
        top: cy - CHIP_H / 2,
        width: CHIP_W,
        height: CHIP_H,
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity,
        zIndex: 20, // por encima de la placa: entra «sobre» el icono
        ...elevation(lightTheme, { depth: 'raised', distance: 7, blur: 16, radius: 20 }),
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        paddingInline: 14,
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          flexShrink: 0,
          background: lightTheme.surface,
          ...elevation(lightTheme, { depth: 'recessed', distance: 2, blur: 5, radius: 999 }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: TEXT_FONT,
          fontWeight: 800,
          fontSize: 14,
          color: lightTheme.textMuted,
        }}
      >
        {req.initials}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 18, color: lightTheme.textStrong, whiteSpace: 'nowrap' }}>{first}</span>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 14, color: lightTheme.textStrong, opacity: 0.6, whiteSpace: 'nowrap' }}>🌴 {req.days} días</span>
      </div>
    </div>
  );
};

export const M1AbsencesProcessScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flights = buildFlights();
  const rise = smoother(clamp01(frame / CORE_RISE));
  const expand = smoother(clamp01((frame - LAST_LAND) / EXPAND_IN));

  return (
    <AbsBg style={{ opacity: rise }}>
      <OperatingModuleTile x={CENTER} y={CENTER} module="actionRunner" status="Analizando conflictos" frame={frame} expand={expand} size={TILE} />
      {flights.map((f, i) => (
        <FlyingRequest key={i} spec={f} frame={frame} />
      ))}
    </AbsBg>
  );
};
