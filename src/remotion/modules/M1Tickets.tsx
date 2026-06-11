/**
 * M1Tickets · «Los tickets se priorizan solos» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * REDISEÑO (pedido por Iván): se elimina el lenguaje anterior —la mesa-tablero
 * neumórfica gigante, las dos drop-zones hundidas y el nodo cuadrado del icono
 * («un montón de cuadrados»)— y se cuenta la historia en **3 ACTOS** sobre un
 * **Kanban de verdad** (base Tailark `kanban`: columnas flat con ring fino,
 * cabeceras de texto, zonas punteadas) con **task-cards estándar** (sin bisel).
 *
 * El módulo **Smart Process** se muestra con la MISMA UI que en los demás flujos:
 * la placa «módulo en funcionamiento» [`OperatingModuleTile`](../OperatingModuleTile.tsx)
 * (cerrada en reposo → se abre con «Priorizando tickets» mientras trabaja).
 *
 * LOS 3 ACTOS (en un solo clip, bucle perfecto):
 *   1. CAOS    — un montón de tickets caen sobre el tablero y se amontonan SIN
 *                orden (solapados, rotados, sin prioridad). La placa AÚN NO está
 *                visible: el foco es la lluvia de tickets.
 *   2. TRABAJO — una vez caídos TODOS, la placa de Smart Process APARECE (fade-in,
 *                cerrada), se abre, y un barrido la «escanea» asignando a cada
 *                ticket su PRIORIDAD (franja de color + chip Alta/Media/Baja).
 *   3. ORDEN   — las cards se enderezan y vuelan a su columna (Alta/Media/Baja),
 *                apiladas y alineadas: el tablero queda priorizado y organizado.
 *                Tras cerrarse, la placa DESAPARECE (fade-out) → menos protagonista.
 *
 * Cierra (técnica «ciclo que vuelve al reposo», ver module-loops.md §2): tras el
 * acto 3 las cards se resuelven (✓) y se desvanecen → el tablero queda LIMPIO
 * (solo columnas + cabeceras, placa AUSENTE). El frame DUR-1 es **idéntico** al
 * frame 0 (tablero vacío, placa ausente) → costura invisible y trivial. NADA
 * latcheado sobrevive al seam: prioridad, ✓, y la **presencia + apertura** de la
 * placa decaen a 0 antes de cerrar.
 *
 * Determinista (hash/Math.sin), periódico en DUR (useLoop). Módulo: Smart Process.
 */

import {
  LoopStage,
  TailarkCard,
  AvatarChip,
  StageSvg,
  Check,
  useLoop,
  CENTER,
  BRAND,
  KIT_BLUE,
  lightTheme,
  TEXT_FONT,
  TAILARK_RING,
  tailarkSurface,
  clamp01,
  lerp,
  smooth,
  smoother,
  hash,
  mix,
} from './loopKit';
import { OperatingModuleTile } from '../OperatingModuleTile';

// 3 actos + aparición/desaparición de la placa → algo más largo que un loop M1
// estándar (4 s). 180 f (6 s) da aire a los momentos. Mismo papel en el selector.
export const M1_TICKETS_DURATION = 180; // 6 s

const DUR = M1_TICKETS_DURATION;

// ── geometría del Kanban ─────────────────────────────────────────────────────────
const CARD_W = 260;
const CARD_H = 104;

// 3 columnas de prioridad (el «Kanban»): centros equiespaciados, hueco pequeño
const COL_W = 288;
type Column = { label: string; color: string; cx: number };
const COLUMNS: Column[] = [
  { label: 'Alta', color: BRAND.red, cx: CENTER - 300 },
  { label: 'Media', color: BRAND.orange, cx: CENTER },
  { label: 'Baja', color: KIT_BLUE, cx: CENTER + 300 },
];

const HEADER_Y = 312; //   cabecera de columna (texto + punto de color)
const ZONE_TOP = 340; //   tapa de la columna (drop-zone flat con ring + puntos)
const ZONE_H = 600;
const SLOT_TOP = 404; //   centro Y del slot superior de cada columna
const SLOT_GAP = 114; //   separación vertical entre cards apiladas

// la placa «Smart Process en funcionamiento» (UI de los demás flujos)
const NODE_X = CENTER;
const NODE_Y = 192;

// montón de caos: las cards caen a un clúster solapado y rotado en el centro
const SPAWN_Y = 30; //     caen desde el borde superior (por detrás de la placa)
const HEAP_CY = 470;
const HEAP_RX = 206; //    dispersión horizontal del montón (abarca las 3 columnas)
const HEAP_RY = 116; //    dispersión vertical
const HEAP_ROT = 11; //    rotación máxima (deg) del desorden

// ── ritmo de los 3 actos (todo dentro de [0,180); el seam cae en tablero vacío) ──
const N = 8; //                         «un montón» de tickets, sin saturar (3·3·2)
const FALL = 30; //                     frames de caída de cada card
const ARRIVE_STEP = 4; //               escalonado de llegada (delay_i = i·4 → 0..28; última asienta ~58)
// la placa de Smart Process NO está visible al principio: APARECE (fade-in, cerrada)
// SÓLO cuando ya han caído todos los tickets; luego se abre, trabaja, cierra y
// DESAPARECE (fade-out). `presence` (opacidad) va separado de `expand` (abrir/cerrar).
const TILE_FADE_IN0 = 62; //  aparece cerrada, justo tras asentar el último ticket
const TILE_FADE_IN1 = 76;
const EXPAND_IN0 = 84; //   ACTO 2: …y SÓLO entonces empieza a abrirse
const EXPAND_IN1 = 104;
const SCAN_START = 92; //   un barrido escanea el montón asignando prioridad
const SCAN_END = 128;
const ORG_BASE = 118; //    ACTO 3: las cards vuelan a su columna (escalonadas)
const ORG_STEP = 1.4;
const ORG_DUR = 24;
const RESOLVE_BASE = 158; // cierre: ✓ + disuelto → tablero limpio antes del seam
const RESOLVE_STEP = 0.5;
const RESOLVE_DUR = 14;
const EXPAND_OUT0 = 158; //  la placa se cierra (vuelve a cuadrada)…
const EXPAND_OUT1 = 170;
const TILE_FADE_OUT0 = 170; // …y tras cerrarse DESAPARECE con un fade
const TILE_FADE_OUT1 = 178;

// reparto fijo de prioridad por card → columnas equilibradas (Alta 3 · Media 3 · Baja 2)
const PRI_OF = [0, 1, 2, 0, 1, 2, 0, 1];

// canales del ticket (de dónde entra): etiqueta sobria + tinte
type Channel = { label: string; tint: string };
const CHANNELS: Channel[] = [
  { label: 'Correo', tint: KIT_BLUE },
  { label: 'Chat', tint: BRAND.violet },
  { label: 'WhatsApp', tint: BRAND.green },
];

const TITLES = [
  'No puedo iniciar sesión',
  '¿Dónde está mi pedido?',
  'Error al pagar',
  'Quiero cambiar mi plan',
  'Falta una factura',
  'Duda sobre el envío',
  'No llega el email',
  'Solicito reembolso',
];
const INITIALS = ['ML', 'JC', 'RP', 'AT', 'SG', 'DV', 'NF', 'CB'];

// posición Y del barrido de escaneo en el frame f (baja sobre el montón)
const scanY = (f: number) => lerp(ZONE_TOP - 6, HEAP_CY + HEAP_RY + 20, clamp01((f - SCAN_START) / (SCAN_END - SCAN_START)));

/**
 * Estado de UNA card (índice i) en el frame local f∈[0,DUR). Función pura →
 * loop-safe. Devuelve posición/rotación/escala, opacidad (espejo arrive/resolve),
 * cuánta prioridad ya tiene asignada (`prio` 0..1) y cuánto se resuelve (`resolve`).
 */
function cardState(i: number, f: number) {
  const pri = PRI_OF[i];
  // slot dentro de su columna = nº de cards anteriores en la misma columna
  let slot = 0;
  for (let j = 0; j < i; j++) if (PRI_OF[j] === pri) slot++;

  const col = COLUMNS[pri];
  const slotX = col.cx;
  const slotY = SLOT_TOP + slot * SLOT_GAP;

  // parámetros deterministas del desorden
  const heapX = CENTER + (hash(i * 1.7 + 0.5) - 0.5) * 2 * HEAP_RX;
  const heapY = HEAP_CY + (hash(i * 2.3 + 1.1) - 0.5) * 2 * HEAP_RY;
  const heapRot = (hash(i * 3.1 + 0.7) - 0.5) * 2 * HEAP_ROT;

  const delay = i * ARRIVE_STEP;
  const settle = delay + FALL;
  const orgStart = ORG_BASE + i * ORG_STEP;
  const orgEnd = orgStart + ORG_DUR;
  const resolveStart = RESOLVE_BASE + i * RESOLVE_STEP;

  // opacidad: aparece al caer, se disuelve al resolver (en el seam ambas → 0)
  const appear = smooth(clamp01((f - delay) / 12));
  const resolve = smoother(clamp01((f - resolveStart) / RESOLVE_DUR));
  const opacity = appear * (1 - resolve);

  // prioridad: el barrido la asigna al pasar por la Y del montón; queda fijada
  const priT = smooth(clamp01((scanY(f) - (heapY - 12)) / 32));

  let x: number;
  let y: number;
  let rot: number;
  let scale: number;
  if (f <= settle) {
    // ACTO 1: cae desde arriba a su sitio en el montón (rotando al desorden)
    const u = smoother(clamp01((f - delay) / FALL));
    x = heapX;
    y = lerp(SPAWN_Y, heapY, u);
    rot = heapRot * u;
    scale = lerp(0.9, 1, u);
  } else if (f <= orgStart) {
    // espera en el montón mientras Smart Process escanea (ACTO 2)
    x = heapX;
    y = heapY;
    rot = heapRot;
    scale = 1;
  } else if (f <= orgEnd) {
    // ACTO 3: se endereza y vuela a su columna/slot
    const u = smoother(clamp01((f - orgStart) / ORG_DUR));
    x = lerp(heapX, slotX, u);
    y = lerp(heapY, slotY, u);
    rot = lerp(heapRot, 0, u);
    scale = 1;
  } else {
    // asentada en columna; al resolver se eleva un poco y se va
    x = slotX;
    y = slotY - 18 * resolve;
    rot = 0;
    scale = 1 - 0.05 * resolve;
  }

  return { x, y, rot, scale, opacity, prio: priT, resolve, slotY };
}

export const M1TicketsScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  const cards = Array.from({ length: N }, (_, i) => {
    const channel = CHANNELS[Math.floor(hash(i * 4.3 + 2.0) * 3) % 3];
    const title = TITLES[i % TITLES.length];
    const initials = INITIALS[i % INITIALS.length];
    const column = COLUMNS[PRI_OF[i]];
    const st = cardState(i, frame);
    return { i, channel, title, initials, column, ...st };
  });

  // orden de pintado: las más bajas/al fondo primero; resueltas (arriba) al final
  const ordered = [...cards].sort((a, b) => a.y - b.y || a.i - b.i);

  // apertura de la placa de Smart Process (cerrada → abierta → cerrada)
  const expand = frame < EXPAND_OUT0
    ? smoother(clamp01((frame - EXPAND_IN0) / (EXPAND_IN1 - EXPAND_IN0)))
    : 1 - smoother(clamp01((frame - EXPAND_OUT0) / (EXPAND_OUT1 - EXPAND_OUT0)));

  // PRESENCIA de la placa (opacidad): ausente durante el caos → aparece cerrada al
  // caer todos los tickets → 1 mientras trabaja/organiza → fade-out tras cerrarse.
  // En el seam vale 0 (igual que en el frame 0) → la placa no rompe la costura.
  const presence = smoother(
    frame < TILE_FADE_OUT0
      ? clamp01((frame - TILE_FADE_IN0) / (TILE_FADE_IN1 - TILE_FADE_IN0))
      : 1 - clamp01((frame - TILE_FADE_OUT0) / (TILE_FADE_OUT1 - TILE_FADE_OUT0)),
  );

  // barrido de escaneo (solo visible durante el ACTO 2)
  const scanOp = Math.sin(Math.PI * clamp01((frame - SCAN_START) / (SCAN_END - SCAN_START)));
  const sy = scanY(frame);

  return (
    <LoopStage dur={DUR}>
      {/* las 3 columnas del Kanban (flat: ring fino + puntos, NO neumórficas) */}
      {COLUMNS.map((c) => (
        <KanbanColumn key={c.label} column={c} />
      ))}

      {/* barrido de Smart Process escaneando el montón (ACTO 2) */}
      {scanOp > 0.02 && (
        <StageSvg>
          <defs>
            <linearGradient id="tk-scan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={KIT_BLUE} stopOpacity="0" />
              <stop offset="50%" stopColor={KIT_BLUE} stopOpacity="0.9" />
              <stop offset="100%" stopColor={KIT_BLUE} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={108} y={sy - 2} width={864} height={4} rx={2} fill="url(#tk-scan)" opacity={0.55 * scanOp} />
          <rect x={108} y={sy - 14} width={864} height={28} rx={14} fill={KIT_BLUE} opacity={0.06 * scanOp} />
        </StageSvg>
      )}

      {/* las task-cards (estándar, sin bisel) */}
      {ordered.map((c) => (
        <TicketCard key={c.i} card={c} />
      ))}

      {/* la placa «Smart Process en funcionamiento» (misma UI que los demás flujos):
          NO está siempre visible — aparece (fade-in) tras el caos y desaparece
          (fade-out) tras cerrarse. La opacidad va aparte del `expand` (abrir/cerrar). */}
      {presence > 0.002 && (
        <div style={{ opacity: presence }}>
          <OperatingModuleTile
            x={NODE_X}
            y={NODE_Y}
            module="smartProcess"
            status="Priorizando tickets"
            frame={frame}
            expand={expand}
          />
        </div>
      )}

      {/* ✓ «resuelto» en cada card al cerrar (atado a su opacidad → no flota en el seam) */}
      <StageSvg>
        {cards
          .filter((c) => c.resolve > 0.02 && c.opacity > 0.05)
          .map((c) => (
            <g key={c.i} opacity={clamp01(c.opacity)}>
              <Check
                cx={c.x + CARD_W / 2 - 18}
                cy={c.y - CARD_H / 2 + 6}
                size={22}
                draw={clamp01(c.resolve * 1.6)}
                spark={clamp01((c.resolve - 0.4) / 0.6) * (1 - c.resolve)}
              />
            </g>
          ))}
      </StageSvg>
    </LoopStage>
  );
};

// ── columna del Kanban (cabecera + zona flat con ring fino y puntos) ──────────────
const KanbanColumn: React.FC<{ column: Column }> = ({ column }) => (
  <>
    {/* cabecera: punto de color + nombre de la prioridad */}
    <div
      style={{
        position: 'absolute',
        left: column.cx - COL_W / 2 + 16,
        top: HEADER_Y,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: TEXT_FONT,
        fontWeight: 700,
        fontSize: 17,
        letterSpacing: 0.2,
        color: lightTheme.textStrong,
      }}
    >
      <span style={{ width: 9, height: 9, borderRadius: 999, background: column.color }} />
      {column.label}
    </div>

    {/* zona de la columna: tarjeta clara plana (ring fino) + fondo de puntos tenue */}
    <div
      style={{
        position: 'absolute',
        left: column.cx - COL_W / 2,
        top: ZONE_TOP,
        width: COL_W,
        height: ZONE_H,
        borderRadius: 22,
        background: tailarkSurface(0.22),
        boxShadow: `inset 0 0 0 1px ${TAILARK_RING}`,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 10,
          opacity: 0.16,
          backgroundImage: `radial-gradient(circle at 1px 1px, ${mix(column.color, '#8f9cb4', 0.5)} 1px, transparent 0)`,
          backgroundSize: '13px 13px',
        }}
      />
    </div>
  </>
);

// ── task-card estándar (sin bisel): franja de prioridad + canal + título + avatar ─
const TicketCard: React.FC<{
  card: {
    i: number;
    x: number;
    y: number;
    rot: number;
    scale: number;
    opacity: number;
    prio: number; //   0..1 cuánta prioridad le ha asignado Smart Process
    resolve: number;
    channel: Channel;
    title: string;
    initials: string;
    column: Column;
  };
}> = ({ card }) => {
  const { i, x, y, rot, scale, opacity, prio, resolve, channel, title, initials, column } = card;
  // tinte verde transitorio al resolver (decae con el disuelto → no toca el seam)
  const ring = resolve > 0.04 ? mix(TAILARK_RING, BRAND.green, clamp01(resolve)) : TAILARK_RING;
  const bg = resolve > 0.04 ? mix(tailarkSurface(0.62), BRAND.green, resolve * 0.14) : tailarkSurface(0.62);

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${scale})`,
        opacity,
        width: CARD_W,
      }}
    >
      <TailarkCard width={CARD_W} height={CARD_H} radius={14} pad={0} ring={ring} bg={bg} style={{ position: 'relative' }}>
        {/* franja de prioridad a la izquierda — aparece cuando Smart Process la asigna */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            background: column.color,
            opacity: prio,
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '13px 14px 13px 18px' }}>
          {/* fila superior: chip de canal + (al priorizar) chip de prioridad */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: TEXT_FONT,
                fontWeight: 700,
                fontSize: 12,
                color: mix(channel.tint, '#000000', 0.18),
                background: mix(lightTheme.surface, channel.tint, 0.14),
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: channel.tint }} />
              {channel.label}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontFamily: TEXT_FONT,
                fontWeight: 700,
                fontSize: 12,
                color: mix(column.color, '#000000', 0.24),
                opacity: prio,
              }}
            >
              <span style={{ width: 9, height: 9, borderRadius: 999, background: column.color }} />
              {column.label}
            </span>
          </div>

          {/* título corto del ticket */}
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.15,
              color: lightTheme.textStrong,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </div>

          {/* fila inferior: avatar + id de ticket tenue */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <AvatarChip initials={initials} size={26} seed={initials.charCodeAt(0)} />
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 12, color: lightTheme.textMuted, opacity: 0.7 }}>
              #{1042 + i}
            </span>
          </div>
        </div>
      </TailarkCard>
    </div>
  );
};
