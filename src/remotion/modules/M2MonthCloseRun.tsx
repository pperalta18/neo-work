/**
 * Acto 2 · «Cerrando junio» — el módulo en funcionamiento (Foresight).
 * ──────────────────────────────────────────────────────────────────────────────
 * SÓLO el cuadrado del módulo: la placa cuadrada neumórfica unitaria
 * `OperatingModuleTile` con el icono de **Foresight** centrado, sin etiquetas de
 * marca ni de área (pedido de Iván: «solo el cuadrado del módulo, como en otras
 * animaciones»). Los **apuntes del mes** vuelan desde fuera —chorro continuo desde
 * todas direcciones— y son ABSORBIDOS por el icono; cuando han entrado todos, la
 * placa se EXPANDE revelando el estado **«Cerrando junio»** con su shimmer.
 *
 * Mismo lenguaje que accounting/e-commerce/`M1AbsencesProcess`. Clip LINEAL
 * (`useCurrentFrame()`, hash determinista, sin random/Date).
 */

import { useCurrentFrame } from 'remotion';
import { OperatingModuleTile } from '../OperatingModuleTile';
import { lightTheme, BRAND, KIT_BLUE, TEXT_FONT, elevation, clamp01, lerp, smoother, mix } from './loopKit';
import { MonthBg, CENTER, ENTRIES } from './monthCloseShared';

// ── ritmo (30 fps) ──────────────────────────────────────────────────────────────
const CORE_RISE = 12; //   entrada de la placa
const FILE_START = 6;
const FILE_STEP = 3.6; //  separación entre apuntes (chorro continuo)
const FILE_FLIGHT = 18; // lo que tarda en volar y entrar
const FILE_COUNT = 12;
const EXPAND_IN = 16; //   apertura de la placa cuando han entrado todos
const HOLD = 36; //        reposa abierta «Cerrando junio»

const LAST_LAND = FILE_START + (FILE_COUNT - 1) * FILE_STEP + FILE_FLIGHT;
export const MC_RUN_DURATION = Math.ceil(LAST_LAND + HOLD); // ≈ 110 f · 3.7 s

const TILE = 168;

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
    const R = 540 + rnd(i, 2) * 320;
    return {
      spawn: FILE_START + i * FILE_STEP,
      scx: CENTER + Math.cos(theta) * R,
      scy: CENTER + Math.sin(theta) * R * 0.74,
      sTilt: (rnd(i, 3) - 0.5) * 80,
      idx: i % ENTRIES.length,
    };
  });
}

/** Un apunte (día + importe) que vuela hacia el icono y es absorbido (encoge y se funde). */
const FlyingEntry: React.FC<{ spec: FlySpec; frame: number }> = ({ spec, frame }) => {
  if (frame < spec.spawn - 0.001) return null;
  const p = smoother(clamp01((frame - spec.spawn) / FILE_FLIGHT));
  if (p >= 1) return null;

  const cx = lerp(spec.scx, CENTER, p);
  const cy = lerp(spec.scy, CENTER, p);
  const tilt = lerp(spec.sTilt, 0, p);
  const absorb = smoother(clamp01((p - 0.55) / 0.45));
  const scale = lerp(1.0, 0.12, absorb);
  const enter = clamp01(p / 0.14);
  const opacity = enter * (1 - absorb);

  const e = ENTRIES[spec.idx];
  const tone = e.income ? mix(BRAND.green, '#000000', 0.2) : mix(KIT_BLUE, '#000000', 0.28);

  return (
    <div
      style={{
        position: 'absolute',
        left: cx - 92,
        top: cy - 24,
        width: 184,
        height: 48,
        transform: `rotate(${tilt}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity,
        zIndex: 20,
        ...elevation(lightTheme, { depth: 'raised', distance: 7, blur: 16, radius: 16 }),
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        paddingInline: 14,
        boxSizing: 'border-box',
        background: lightTheme.surface,
      }}
    >
      <span style={{ flexShrink: 0, width: 32, textAlign: 'center', fontFamily: TEXT_FONT, fontWeight: 800, fontSize: 14, color: lightTheme.textMuted }}>{e.day}</span>
      <span style={{ flex: 1, fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 16, color: lightTheme.textStrong, whiteSpace: 'nowrap', overflow: 'hidden' }}>{e.concept}</span>
      <span style={{ flexShrink: 0, fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 16, color: tone }}>{e.amount} €</span>
    </div>
  );
};

export const M2MonthCloseRunScene: React.FC = () => {
  const frame = useCurrentFrame();
  const flights = buildFlights();
  const rise = smoother(clamp01(frame / CORE_RISE));
  const expand = smoother(clamp01((frame - LAST_LAND) / EXPAND_IN));

  return (
    <MonthBg style={{ opacity: rise }}>
      <OperatingModuleTile x={CENTER} y={CENTER} module="foresight" status="Cerrando junio" frame={frame} expand={expand} size={TILE} />
      {flights.map((f, i) => (
        <FlyingEntry key={i} spec={f} frame={frame} />
      ))}
    </MonthBg>
  );
};
