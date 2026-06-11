/**
 * M2Onboarding · «El alta de un empleado, sin papeles» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Pides el alta; los papeles se hacen solos.»
 * Bucle: el chat lanza un pulso «alta de María» → recorre el anillo Contrato →
 *   Firma → Ficha → Accesos → vuelve al chat, que ya muestra «alta de [otro]».
 * Cierra porque: el pulso regresa al nodo de origen; solo cambia el nombre.
 * Origen PDF: Construye → Contratar y gestionar personal.
 *
 * ── REFERENCIA del Módulo 2 ──────────────────────────────────────────────────
 * Plantilla de «varios cuadros conectados por cables + UN pulso que recorre el
 * circuito y vuelve a su origen». Las otras 4 animaciones de M2 copian esto:
 * LoopStage + un anillo de ≤4 nodos (`ringPoints`) + cables (`Wire`) + el pulso
 * con estela (`Packet`). El nodo destino PULSA cuando el trabajo llega.
 *
 * Truco de bucle perfecto con cambio de nombre: el clip contiene N VUELTAS con N
 * nombres; tras la última vuelta vuelve al primer nombre → frame final == frame 0.
 */

import {
  LoopStage,
  NeoTile,
  Wire,
  Packet,
  StageSvg,
  ModuleIcon,
  useLoop,
  ringPoints,
  M2_DURATION,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  clamp01,
  mod,
  mix,
  type Pt,
} from './loopKit';

export const M2_ONBOARDING_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_ONBOARDING_DURATION;
const NAMES = ['María', 'Carlos']; // N nombres = N vueltas → loop perfecto al volver al 1.º
const LAPS = NAMES.length;
const LAP = DUR / LAPS; // 84 f por «alta» (papeles hechos en ~2.8 s = alivio)

// ── el anillo: origen (chat) + 4 pasos. ringPoints con start=90 → nodo 0 abajo ──
const R = 312;
const RING: Pt[] = ringPoints(5, CENTER, CENTER, R, 90);
const STEPS = [
  { label: 'Contrato', glyph: 'doc' },
  { label: 'Firma', glyph: 'sign' },
  { label: 'Ficha', glyph: 'card' },
  { label: 'Accesos', glyph: 'key' },
] as const;
const NODE = 158;

/** Bump 0..1: cuán «recién recorrido» está el punto del anillo en `u0` por el pulso en `u`. */
function nearPulse(u: number, u0: number, width = 0.12): number {
  const d = Math.min(mod(u - u0, 1), mod(u0 - u, 1));
  return clamp01(1 - d / width);
}

/** Glifos abstractos de cada paso (UIs abstractas, nunca capturas reales). */
const Glyph: React.FC<{ kind: string; c: string }> = ({ kind, c }) => {
  const s = 52;
  const common = { fill: 'none', stroke: c, strokeWidth: 4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={s} height={s} viewBox="0 0 52 52">
      {kind === 'doc' && (
        <>
          <rect x="13" y="8" width="26" height="36" rx="4" {...common} />
          <line x1="19" y1="18" x2="33" y2="18" {...common} />
          <line x1="19" y1="26" x2="33" y2="26" {...common} />
          <line x1="19" y1="34" x2="28" y2="34" {...common} />
        </>
      )}
      {kind === 'sign' && (
        <>
          <path d="M10 38 Q18 20 24 32 T38 26" {...common} />
          <line x1="10" y1="44" x2="42" y2="44" {...common} />
        </>
      )}
      {kind === 'card' && (
        <>
          <rect x="9" y="14" width="34" height="24" rx="4" {...common} />
          <circle cx="19" cy="24" r="4" {...common} />
          <line x1="28" y1="22" x2="37" y2="22" {...common} />
          <line x1="28" y1="30" x2="37" y2="30" {...common} />
        </>
      )}
      {kind === 'key' && (
        <>
          <circle cx="19" cy="22" r="8" {...common} />
          <path d="M25 28 L40 43 M35 38 L31 42 M40 43 L36 47" {...common} />
        </>
      )}
    </svg>
  );
};

export const M2OnboardingScene: React.FC = () => {
  const { frame } = useLoop(DUR);
  const lap = Math.floor(frame / LAP) % LAPS;
  const u = (frame % LAP) / LAP; // pulso 0..1 a lo largo del anillo cerrado, una vuelta por alta
  const name = NAMES[lap];

  // u del nodo i en el anillo (0=chat origen, 1..4 = pasos)
  const uOf = (i: number) => i / 5;

  return (
    <LoopStage dur={DUR}>
      {/* cables del anillo + pulso con estela (SVG) */}
      <StageSvg>
        {RING.map((p, i) => {
          const q = RING[(i + 1) % 5];
          const lit = nearPulse(u, (uOf(i) + uOf(i + 1)) / 2, 0.1);
          return <Wire key={i} a={p} b={q} lit={lit} width={3.5} />;
        })}
        <Packet path={RING} t={u} closed tailFrac={0.22} r={7} id="onb" />
      </StageSvg>

      {/* los 4 nodos-paso */}
      {STEPS.map((s, k) => {
        const p = RING[k + 1];
        const act = nearPulse(u, uOf(k + 1), 0.13);
        // «hecho»: destello verde TRANSITORIO justo al pasar el pulso, que decae a
        // neutro antes de cerrar la vuelta (passT>0.15) → en u→1 todos los nodos
        // vuelven a neutro = estado de u=0. Si fuera un latch, el verde «engancharía»
        // y reventaría la costura del bucle. (REGLA: nada acumulado puede sobrevivir al seam.)
        const passT = mod(u - uOf(k + 1), 1); // cuánto hace que pasó el pulso (0..1 de la vuelta)
        const done = passT <= 0.15 ? clamp01(1 - passT / 0.15) : 0;
        const accent = act > 0.05 ? KIT_BLUE : done > 0.04 ? BRAND.green : undefined;
        return (
          <div key={s.label}>
            <NeoTile
              size={NODE}
              x={p.x}
              y={p.y}
              radius={32}
              distance={11}
              blur={24}
              scale={1 + 0.08 * act}
              accent={accent}
              accentAmount={Math.max(act, done * 0.5)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <Glyph kind={s.glyph} c={act > 0.1 ? KIT_BLUE : lightTheme.textStrong} />
              </div>
            </NeoTile>
            <span
              style={{
                position: 'absolute',
                left: p.x,
                top: p.y + NODE / 2 + 6,
                transform: 'translateX(-50%)',
                fontFamily: TEXT_FONT,
                fontWeight: 600,
                fontSize: 24,
                color: lightTheme.textStrong,
                opacity: 0.55 + 0.45 * act,
                whiteSpace: 'nowrap',
              }}
            >
              {s.label}
            </span>
          </div>
        );
      })}

      {/* nodo origen = el chat de AiKit (lanza el alta y recibe la vuelta) */}
      {(() => {
        const p = RING[0];
        const emit = clamp01(1 - u / 0.1); //   pulsa al salir (u≈0)
        const recv = nearPulse(u, 1, 0.1); //    pulsa al volver (u≈1)
        const pulse = Math.max(emit, recv);
        return (
          <NeoTile size={NODE + 36} x={p.x} y={p.y} radius={30} distance={13} blur={28} scale={1 + 0.06 * pulse} accent={KIT_BLUE} accentAmount={0.12 + 0.4 * pulse}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '0 8px' }}>
              <ModuleIcon name="actionScript" size={46} active={pulse} />
              <div
                style={{
                  ...elevation(lightTheme, { depth: 'raised', distance: 5, blur: 12, radius: 12 }),
                  backgroundColor: mix(lightTheme.surface, KIT_BLUE, 0.08),
                  padding: '6px 12px',
                  fontFamily: TEXT_FONT,
                  fontWeight: 600,
                  fontSize: 22,
                  color: lightTheme.textStrong,
                  whiteSpace: 'nowrap',
                }}
              >
                alta de <span style={{ color: KIT_BLUE, fontWeight: 700 }}>{name}</span>
              </div>
            </div>
          </NeoTile>
        );
      })()}
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M2OnboardingScene as M2OnboardingV1Scene, M2_ONBOARDING_DURATION as M2_ONBOARDING_V1_DURATION };
