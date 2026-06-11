/**
 * M1Tickets · «Los tickets se priorizan solos» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Entran por donde sea, salen ordenados.»
 * Bucle: burbujas-mensaje de 3 canales (correo / chat / WhatsApp, distinguidos por
 *   color + glifo abstracto) entran por la IZQUIERDA sobre una cinta → pasan por el
 *   nodo AiKit central (Smart Process) que les pone un PUNTO de color (prioridad) →
 *   caen en 1 de 3 CARRILES apilados a la derecha → suben por el carril hasta arriba,
 *   donde el ticket se RESUELVE y se desvanece (✓), mientras entran nuevas.
 * Cierra porque: cinta de entrada + carril que se vacía por arriba = FLUJO CONTINUO.
 *   La «foto» tiene siempre ~la misma cantidad de burbujas → frame 0 == frame 119.
 * Origen PDF: ¿Qué se te da mal? → Soporte al cliente. Módulo: Smart Process
 *   (clasifica/prioriza cada mensaje entrante).
 *
 * ── ESTRUCTURA (hermana de M1Stock) ─────────────────────────────────────────────
 * LoopStage + UN NeoTile central (el «cuadro» del Módulo 1, aquí la mesa de trabajo)
 * + una transformación PERIÓDICA en `DURATION` frames, determinista, sin costura. El
 * ModuleIcon de marca protagoniza el nodo (no es esquina discreta: aquí ÉL clasifica).
 *
 * NADA acumulado sobrevive al seam: cada burbuja es una FASE pura `mod(frame-off,DUR)`;
 * el carril no es un array que crece, es N ranuras coreografiadas → el ascenso/disuelto
 * de arriba se compensa exactamente con una nueva entrada por la izquierda.
 */

import {
  LoopStage,
  NeoTile,
  ModuleIcon,
  StageSvg,
  useLoop,
  M1_DURATION,
  CENTER,
  BRAND,
  KIT_BLUE,
  lightTheme,
  elevation,
  TEXT_FONT,
  clamp01,
  lerp,
  smooth,
  mod,
  hash,
  mix,
} from './loopKit';

export const M1_TICKETS_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del flujo (todo dentro de [0,120), sin tocar la costura) ───────────────
const DUR = M1_TICKETS_DURATION;
/**
 * N burbujas en vuelo simultáneo, escalonadas un periodo entero entre sí. 6 divide a
 * 120 (offset = 20 f), así que el reparto de fases es exactamente uniforme y periódico.
 */
const N = 6;
const STEP = DUR / N; // 20 f entre burbujas → siempre hay ~2 en cinta + ~3 en carriles

// Fases de la vida de una burbuja (en frames, dentro de su periodo propio de DUR):
const BELT_END = 42; //   recorre la cinta de izquierda al nodo
const SORT_AT = 42; //    instante en que el nodo le asigna prioridad (recibe el punto)
const FALL_END = 60; //   cae del nodo a la boca de su carril
const CLIMB_END = 108; // asciende por el carril hasta la cima
const RESOLVE_END = 118; // ✓ + disuelto justo ANTES de cerrar (no toca el seam)

// ── geometría ────────────────────────────────────────────────────────────────────
const TILE = 600; // la «mesa» neumórfica única (el cuadro del Módulo 1)

// cinta de entrada (recessed) — horizontal, entra por la izquierda hacia el nodo
const BELT_Y = CENTER - 168;
const BELT_X0 = CENTER - 380; // boca de entrada (izquierda)
const NODE_X = CENTER - 28; //  el nodo está algo a la izquierda del centro
const NODE_Y = BELT_Y;

// 3 carriles apilados a la derecha (recessed verticales)
const LANE_X = CENTER + 196; //   eje X del carril central
const LANE_W = 96;
const LANE_TOP = CENTER - 196; //  cima del carril (donde se resuelve)
const LANE_BOT = CENTER + 196; //  boca del carril (donde aterriza la burbuja)
const LANE_GAP = 116; //           separación horizontal entre los 3 carriles

// X de cada uno de los 3 carriles (apilados en columna a la derecha)
const laneX = (lane: number) => LANE_X + (lane - 1) * LANE_GAP;

// ── canales (correo / chat / WhatsApp): color + glifo abstracto ──────────────────
type Channel = { tint: string; glyph: 'mail' | 'chat' | 'whats' };
const CHANNELS: Channel[] = [
  { tint: KIT_BLUE, glyph: 'mail' }, //    correo
  { tint: BRAND.orange, glyph: 'chat' }, // chat
  { tint: BRAND.green, glyph: 'whats' }, // WhatsApp
];

// colores de prioridad (el «punto» que pone el nodo) — alta / media / baja
const PRIORITY = [BRAND.red, BRAND.orange, KIT_BLUE];

/** Glifo abstracto del canal (nunca una captura/logo real). SVG dentro de StageSvg. */
const ChannelGlyph: React.FC<{ kind: Channel['glyph']; cx: number; cy: number; s: number; color: string }> = ({
  kind,
  cx,
  cy,
  s,
  color,
}) => {
  if (kind === 'mail') {
    // sobre abstracto
    return (
      <g stroke={color} strokeWidth={s * 0.12} strokeLinejoin="round" strokeLinecap="round" fill="none">
        <rect x={cx - s} y={cy - s * 0.66} width={s * 2} height={s * 1.32} rx={s * 0.26} />
        <path d={`M ${cx - s} ${cy - s * 0.5} L ${cx} ${cy + s * 0.18} L ${cx + s} ${cy - s * 0.5}`} />
      </g>
    );
  }
  if (kind === 'chat') {
    // bocadillo de chat con 3 puntos
    return (
      <g fill={color}>
        <path
          d={`M ${cx - s} ${cy - s * 0.7} h ${s * 2} a ${s * 0.3} ${s * 0.3} 0 0 1 ${s * 0.3} ${s * 0.3} v ${s * 0.8} a ${s * 0.3} ${s * 0.3} 0 0 1 ${-s * 0.3} ${s * 0.3} h ${-s * 0.9} l ${-s * 0.4} ${s * 0.42} v ${-s * 0.42} h ${-s * 0.0} a ${s * 0.3} ${s * 0.3} 0 0 1 ${-s * 0.3} ${-s * 0.3} v ${-s * 0.8} a ${s * 0.3} ${s * 0.3} 0 0 1 ${s * 0.3} ${-s * 0.3} z`}
          opacity={0.92}
        />
        {[-1, 0, 1].map((i) => (
          <circle key={i} cx={cx + i * s * 0.42} cy={cy - s * 0.18} r={s * 0.12} fill={lightTheme.surface} />
        ))}
      </g>
    );
  }
  // whats — burbuja redonda con colita (abstracta)
  return (
    <g fill={color}>
      <circle cx={cx} cy={cy - s * 0.1} r={s * 0.92} />
      <path d={`M ${cx - s * 0.7} ${cy + s * 0.5} L ${cx - s * 0.1} ${cy + s * 1.0} L ${cx + s * 0.1} ${cy + s * 0.3} z`} />
      <path
        d={`M ${cx - s * 0.34} ${cy - s * 0.34} a ${s * 0.34} ${s * 0.34} 0 1 0 ${s * 0.5} ${s * 0.42}`}
        fill="none"
        stroke={lightTheme.surface}
        strokeWidth={s * 0.16}
        strokeLinecap="round"
      />
    </g>
  );
};

/**
 * Estado de UNA burbuja en su fase local `e`∈[0,DUR). Devuelve posición, escala,
 * opacidad, si el nodo está «tocándola», y cuánto ✓-resuelve. Función pura → loop-safe.
 */
function bubbleState(e: number, lane: number, top: number) {
  // — tramo 1: cinta (izquierda → nodo) —
  if (e <= BELT_END) {
    const u = smooth(e / BELT_END);
    return {
      x: lerp(BELT_X0, NODE_X, u),
      y: BELT_Y,
      scale: 1,
      // fade-in espejo del fade-out del tramo 4: cruzando el seam la suma de
      // opacidades de las 6 burbujas se mantiene constante → costura invisible.
      opacity: clamp01(e / (DUR - RESOLVE_END)),
      hasDot: false,
      sorting: clamp01((e - (SORT_AT - 8)) / 8), // el nodo «trabaja» al final del tramo
      resolve: 0,
    };
  }
  // — tramo 2: caída del nodo a la boca del carril —
  if (e <= FALL_END) {
    const u = smooth((e - BELT_END) / (FALL_END - BELT_END));
    return {
      x: lerp(NODE_X, laneX(lane), u),
      y: lerp(NODE_Y, LANE_BOT - 30, u),
      scale: 1,
      opacity: 1,
      hasDot: true, // ya lleva su punto de prioridad
      sorting: 1 - u, // el destello del nodo se apaga al salir
      resolve: 0,
    };
  }
  // — tramo 3: ascenso por el carril (boca → cima) —
  if (e <= CLIMB_END) {
    const u = (e - FALL_END) / (CLIMB_END - FALL_END);
    return {
      x: laneX(lane),
      y: lerp(LANE_BOT - 30, top, u),
      scale: 1,
      opacity: 1,
      hasDot: true,
      sorting: 0,
      resolve: 0,
    };
  }
  // — tramo 4: resuelto + disuelto en la cima (✓, se desvanece antes del seam) —
  const u = clamp01((e - CLIMB_END) / (RESOLVE_END - CLIMB_END));
  return {
    x: laneX(lane),
    y: top,
    scale: 1 - 0.18 * u,
    opacity: 1 - u, // → 0 antes de DUR: en frame 119 esta burbuja ya no está
    hasDot: true,
    sorting: 0,
    resolve: u,
  };
}

export const M1TicketsScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // ¿está el nodo clasificando AHORA mismo alguna burbuja? (para animar el ModuleIcon)
  let nodeActive = 0;
  const bubbles = Array.from({ length: N }, (_, i) => {
    const off = i * STEP;
    const e = mod(frame - off, DUR);
    const channel = CHANNELS[Math.floor(hash(i * 3.1 + 1.7) * 3) % 3];
    const lane = Math.floor(hash(i * 7.3 + 4.2) * 3) % 3; // carril determinista por burbuja
    const top = LANE_TOP + 24; // cima donde se resuelve (misma para los 3 carriles)
    const st = bubbleState(e, lane, top);
    const prio = PRIORITY[Math.floor(hash(i * 5.9 + 2.4) * 3) % 3];
    nodeActive = Math.max(nodeActive, st.sorting);
    return { i, channel, lane, prio, ...st };
  });

  return (
    <LoopStage dur={DUR}>
      {/* la mesa única (el «cuadro» del Módulo 1) */}
      <NeoTile size={TILE} x={CENTER} y={CENTER} radius={52} distance={14} blur={34}>
        <></>
      </NeoTile>

      {/* título + módulo que clasifica (intuir el ERP debajo) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER,
          top: CENTER - TILE / 2 + 30,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 28,
          color: lightTheme.textStrong,
        }}
      >
        Bandeja de soporte
      </div>

      {/* cinta de entrada (recessed) — guía visual de la izquierda al nodo */}
      <div
        style={{
          position: 'absolute',
          left: BELT_X0 - 26,
          top: BELT_Y - 40,
          width: NODE_X - BELT_X0 + 52,
          height: 80,
          borderRadius: 40,
          ...elevation(lightTheme, { depth: 'recessed', distance: 6, blur: 14, radius: 40 }),
        }}
      />

      {/* 3 carriles apilados a la derecha (recessed) — se vacían por arriba */}
      {[0, 1, 2].map((lane) => (
        <div
          key={lane}
          style={{
            position: 'absolute',
            left: laneX(lane) - LANE_W / 2,
            top: LANE_TOP,
            width: LANE_W,
            height: LANE_BOT - LANE_TOP,
            borderRadius: 28,
            ...elevation(lightTheme, { depth: 'recessed', distance: 6, blur: 14, radius: 28 }),
          }}
        >
          {/* boca inferior (entra) y línea de «resuelto» arriba, muy sutiles */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 16,
              height: 0,
              borderTop: `2px dashed ${mix('#9fb0c6', PRIORITY[lane], 0.35)}`,
              opacity: 0.5,
            }}
          />
        </div>
      ))}

      {/* las burbujas-mensaje (HTML: relieve neumórfico + punto de prioridad) */}
      {bubbles.map((b) => (
        <div
          key={b.i}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            transform: `translate(-50%, -50%) scale(${b.scale})`,
            opacity: b.opacity,
            width: 78,
            height: 78,
            borderRadius: 24,
            ...elevation(lightTheme, { depth: 'raised', distance: 8, blur: 16, radius: 24 }),
            backgroundColor: mix(lightTheme.surface, b.channel.tint, 0.12),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* punto de prioridad que pone el nodo (aparece tras la clasificación) */}
          {b.hasDot && (
            <div
              style={{
                position: 'absolute',
                top: -7,
                right: -7,
                width: 22,
                height: 22,
                borderRadius: 11,
                background: b.prio,
                boxShadow: `inset 0 1px 2px ${mix(b.prio, '#000000', 0.18)}`,
              }}
            />
          )}
          {/* glifo abstracto del canal */}
          <svg width={48} height={48} viewBox="0 0 48 48" style={{ display: 'block' }}>
            <ChannelGlyph kind={b.channel.glyph} cx={24} cy={24} s={13} color={b.channel.tint} />
          </svg>
        </div>
      ))}

      {/* ✓ de «resuelto» en la cima de cada carril (se dibuja con el disuelto) */}
      <StageSvg>
        {bubbles
          .filter((b) => b.resolve > 0.01)
          .map((b) => {
            const cx = laneX(b.lane);
            const cy = LANE_TOP + 24;
            const d = clamp01(b.resolve * 1.4);
            const size = 26;
            const len = size * 1.6;
            return (
              <g key={b.i} opacity={clamp01(1 - b.resolve)}>
                <circle cx={cx} cy={cy} r={size * 0.78} fill={mix(lightTheme.surface, BRAND.green, 0.26)} />
                <path
                  d={`M ${cx - size * 0.34} ${cy + size * 0.02} L ${cx - size * 0.06} ${cy + size * 0.3} L ${cx + size * 0.4} ${cy - size * 0.32}`}
                  fill="none"
                  stroke={BRAND.green}
                  strokeWidth={size * 0.14}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={len}
                  strokeDashoffset={len * (1 - d)}
                />
              </g>
            );
          })}
      </StageSvg>

      {/* el nodo AiKit: Smart Process clasifica/prioriza cada ticket al pasar */}
      <NeoTile size={150} x={NODE_X} y={NODE_Y} radius={32} distance={10} blur={22} press={nodeActive * 0.6} accent={KIT_BLUE} accentAmount={nodeActive * 0.5}>
        <ModuleIcon name="smartProcess" size={92} active={nodeActive} />
      </NeoTile>
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M1TicketsScene as M1TicketsV1Scene, M1_TICKETS_DURATION as M1_TICKETS_V1_DURATION };
