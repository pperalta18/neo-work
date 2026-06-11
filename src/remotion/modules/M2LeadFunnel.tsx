/**
 * M2LeadFunnel · «Los leads no se enfrían» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Misma UI que **`M1Tickets`** (Kanban de verdad, pedido por Iván): columnas FLAT
 * (ring fino + cabecera de texto con punto de color + fondo de puntos), **task-cards
 * estándar con franja de color a la izquierda**, y el módulo con la MISMA placa
 * «en funcionamiento» [`OperatingModuleTile`](../OperatingModuleTile.tsx) arriba-centro
 * (ausente en reposo → aparece + se abre mientras trabaja → desaparece) + un **barrido
 * de escaneo**. Adaptado a nuestro caso: **más columnas** (el ciclo de vida del lead) y
 * **cards de lead** (origen + nombre + avatar + temperatura/valor).
 *
 * Columnas (pipeline CRM): **Prospectos · Contactados · Cualificados · Convertidos ·
 * Descartados**. La IDEA (la que validó Iván) se mantiene — 3 beats:
 *   1. EN REPOSO — los leads reposan en **Prospectos** y **Contactados** (las 2 columnas de
 *      la izquierda); Cualificados·Convertidos·Descartados están vacías. Placa ausente.
 *   2. REACTIVA — la placa **`OperatingModuleTile`** (Foresight «Reactivando leads»)
 *      APARECE arriba, se abre, y un barrido escanea el tablero: cada lead se templa
 *      (franja + chip de estado pasan de prospecto/contactado a su color de destino).
 *   3. RESUELTOS — todos vuelan a su columna: **Cualificados**, **Convertidos** (✓ + €
 *      comprado) y **1 Descartado** (gris). Tras llegar, la placa se cierra y desaparece.
 *
 * ── Bucle perfecto ───────────────────────────────────────────────────────────
 * Flujo continuo (module-loops §2 técnica 1): la foto del tablero (frío izq, derecha
 * vacía, placa ausente) es igual en frame 0 y DUR. Relevo **salida + entrada**: los
 * resueltos se desvanecen en su destino en `[FO_AT, FO_END]` mientras la **tanda fría
 * siguiente** entra en los huecos de la izquierda en `[ARRIVE_IN_AT, DUR]` (dos sprites
 * por lead: principal + relevo, que se solapan en el seam → sin parpadeo). Nada
 * latcheado: franja, ✓, tinte y **presencia/apertura de la placa** decaen antes de u→1.
 */

import {
  LoopStage,
  TailarkCard,
  AvatarChip,
  StageSvg,
  Check,
  useLoop,
  M2_DURATION,
  CENTER,
  BRAND,
  KIT_BLUE,
  lightTheme,
  TEXT_FONT,
  TAILARK_RING,
  tailarkSurface,
  clamp01,
  lerp,
  smoother,
  mix,
  type Pt,
} from './loopKit';
import { OperatingModuleTile } from '../OperatingModuleTile';

export const M2_LEADFUNNEL_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_LEADFUNNEL_DURATION;

// ── geometría del Kanban (5 columnas = ciclo de vida del lead) ───────────────────
const CARD_W = 168;
const CARD_H = 100;
const COL_W = 184;
const COL_GAP = 186; // separación entre centros de columna

// colores por temperatura / desenlace
const COLD_C = '#93a6c6'; // frío (azul-gris)
const TIBIO_C = BRAND.orange;
const ACTIVO_C = KIT_BLUE;
const GANADO_C = BRAND.green;
const DESC_C = '#9aa6bd'; // descartado (gris)

type Column = { key: string; label: string; color: string; cx: number };
const COLUMNS: Column[] = [
  { key: 'prospecto', label: 'Prospectos', color: COLD_C, cx: CENTER - 2 * COL_GAP },
  { key: 'contactado', label: 'Contactados', color: TIBIO_C, cx: CENTER - COL_GAP },
  { key: 'cualificado', label: 'Cualificados', color: ACTIVO_C, cx: CENTER },
  { key: 'convertido', label: 'Convertidos', color: GANADO_C, cx: CENTER + COL_GAP },
  { key: 'descartado', label: 'Descartados', color: DESC_C, cx: CENTER + 2 * COL_GAP },
];

const HEADER_Y = 300; //   cabecera de columna (texto + punto de color)
const ZONE_TOP = 330; //   tapa de la columna (drop-zone flat con ring + puntos)
const ZONE_H = 600;
const SLOT_TOP = 392; //   centro Y del slot superior
const SLOT_GAP = 116; //   separación vertical entre cards apiladas
const BOARD_LEFT = COLUMNS[0].cx - COL_W / 2; //  para el barrido
const BOARD_W = COLUMNS[4].cx + COL_W / 2 - BOARD_LEFT;

// la placa «Foresight en funcionamiento», arriba-centro (UI de M1Tickets)
const NODE_X = CENTER;
const NODE_Y = 190;
const NODE_SIZE = 140;

const colX = (i: number) => COLUMNS[i].cx;
const slotY = (s: number) => SLOT_TOP + s * SLOT_GAP;
const pt = (col: number, slot: number): Pt => ({ x: colX(col), y: slotY(slot) });

// ── ritmo de los 3 beats (todo dentro de [0,168); el seam cae en pleno «frío») ──
// beat 1 [0,~40): los leads reposan fríos a la izquierda (reposo implícito).
const WARM_AT = 40; //       el módulo «toca»: empiezan a templarse en su sitio
const MOVE_AT = 78; //       beat 3: arrancan el vuelo a su columna de destino
const ARRIVE = 116; //       han llegado (activos/ganados/descartado)
const FO_AT = 142; //        beat 4: los resueltos empiezan a irse (deal cerrado/archivado)
const FO_END = 166; //       del todo idos justo antes de la costura
const ARRIVE_IN_AT = 138; // la tanda fría siguiente entra → llena el hueco en el seam

// placa: presencia (opacidad, ausente en reposo) y apertura (cuadrada→abierta), aparte
const PRES_IN0 = 36;
const PRES_IN1 = 52;
const EXPAND_IN0 = 50;
const EXPAND_IN1 = 72;
const EXPAND_OUT0 = 128;
const EXPAND_OUT1 = 144;
const PRES_OUT0 = 144;
const PRES_OUT1 = 158;

// barrido de escaneo (Foresight «leyendo» el tablero) — solo durante el acto 2
const SCAN_START = 54;
const SCAN_END = 104;
const scanY = (f: number) => lerp(ZONE_TOP - 6, slotY(2) + CARD_H / 2 + 20, clamp01((f - SCAN_START) / (SCAN_END - SCAN_START)));

type Outcome = 'activo' | 'ganado' | 'descartado';
type Source = { label: string; tint: string };

type Lead = {
  name: string;
  initials: string;
  seed: number;
  source: Source;
  id: string;
  homeCol: 0 | 1; //   0 = Prospectos · 1 = Contactados (temperatura de partida)
  homeSlot: number;
  outcome: Outcome;
  destCol: number; //  2 Activos · 3 Ganados · 4 Descartados
  destSlot: number;
  value?: string; //   importe para los «Ganados»
};

// orígenes del lead (de dónde entra) — etiqueta sobria + tinte, como los canales de Tickets
const SRC = {
  web: { label: 'Web', tint: KIT_BLUE },
  ref: { label: 'Referido', tint: BRAND.green },
  ads: { label: 'Anuncio', tint: BRAND.violet },
  linkedin: { label: 'LinkedIn', tint: BRAND.teal },
  email: { label: 'Email', tint: BRAND.orange },
  evento: { label: 'Evento', tint: BRAND.purple },
} satisfies Record<string, Source>;

// 6 leads: 3 fríos + 3 tibios → 3 Activos, 2 Ganados, 1 Descartado.
const LEADS: Lead[] = [
  { name: 'Sara Ríos', initials: 'SR', seed: 2, source: SRC.web, id: '#L-201', homeCol: 0, homeSlot: 0, outcome: 'activo', destCol: 2, destSlot: 0 },
  { name: 'Nora Gil', initials: 'NG', seed: 11, source: SRC.ref, id: '#L-202', homeCol: 0, homeSlot: 1, outcome: 'activo', destCol: 2, destSlot: 1 },
  { name: 'Hugo León', initials: 'HL', seed: 7, source: SRC.ads, id: '#L-203', homeCol: 0, homeSlot: 2, outcome: 'descartado', destCol: 4, destSlot: 0 },
  { name: 'Marc Vidal', initials: 'MV', seed: 4, source: SRC.email, id: '#L-204', homeCol: 1, homeSlot: 0, outcome: 'ganado', destCol: 3, destSlot: 0, value: '2,4k' },
  { name: 'Eva Soto', initials: 'ES', seed: 9, source: SRC.web, id: '#L-205', homeCol: 1, homeSlot: 1, outcome: 'ganado', destCol: 3, destSlot: 1, value: '1,8k' },
  { name: 'Leo Marín', initials: 'LM', seed: 15, source: SRC.evento, id: '#L-206', homeCol: 1, homeSlot: 2, outcome: 'activo', destCol: 2, destSlot: 2 },
];

const outcomeColor = (o: Outcome) => (o === 'ganado' ? GANADO_C : o === 'descartado' ? DESC_C : ACTIVO_C);
const outcomeLabel = (o: Outcome) => (o === 'ganado' ? 'Convertido' : o === 'descartado' ? 'Descartado' : 'Cualificado');
const baseColor = (col: 0 | 1) => (col === 0 ? COLD_C : TIBIO_C);
const baseLabel = (col: 0 | 1) => (col === 0 ? 'Prospecto' : 'Contactado');

export const M2LeadFunnelScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // templado en sitio + vuelo a la columna de destino + salida + relevo de entrada
  const warm = smoother(clamp01((frame - WARM_AT) / (ARRIVE - WARM_AT)));
  const move = smoother(clamp01((frame - MOVE_AT) / (ARRIVE - MOVE_AT)));
  const fade = clamp01((frame - FO_AT) / (FO_END - FO_AT));
  const arriveIn = smoother(clamp01((frame - ARRIVE_IN_AT) / (DUR - 1 - ARRIVE_IN_AT)));

  // placa: apertura (cuadrada→abierta→cuadrada) y presencia (ausente→presente→ausente)
  const expand = frame < EXPAND_OUT0
    ? smoother(clamp01((frame - EXPAND_IN0) / (EXPAND_IN1 - EXPAND_IN0)))
    : 1 - smoother(clamp01((frame - EXPAND_OUT0) / (EXPAND_OUT1 - EXPAND_OUT0)));
  const presence = smoother(
    frame < PRES_OUT0
      ? clamp01((frame - PRES_IN0) / (PRES_IN1 - PRES_IN0))
      : 1 - clamp01((frame - PRES_OUT0) / (PRES_OUT1 - PRES_OUT0)),
  );

  // barrido de escaneo
  const scanOp = Math.sin(Math.PI * clamp01((frame - SCAN_START) / (SCAN_END - SCAN_START)));
  const sy = scanY(frame);

  return (
    <LoopStage dur={DUR}>
      {/* las 5 columnas del Kanban (flat: ring fino + puntos, NO neumórficas) */}
      {COLUMNS.map((c) => (
        <KanbanColumn key={c.key} column={c} />
      ))}

      {/* barrido de Foresight escaneando el tablero (acto 2) */}
      {scanOp > 0.02 && (
        <StageSvg>
          <defs>
            <linearGradient id="lf-scan" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={KIT_BLUE} stopOpacity="0" />
              <stop offset="50%" stopColor={KIT_BLUE} stopOpacity="0.9" />
              <stop offset="100%" stopColor={KIT_BLUE} stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x={BOARD_LEFT} y={sy - 2} width={BOARD_W} height={4} rx={2} fill="url(#lf-scan)" opacity={0.55 * scanOp} />
          <rect x={BOARD_LEFT} y={sy - 14} width={BOARD_W} height={28} rx={14} fill={KIT_BLUE} opacity={0.06 * scanOp} />
        </StageSvg>
      )}

      {/* relevo: la tanda fría siguiente entra en los huecos de la izquierda (cierra el bucle) */}
      {arriveIn > 0.001 &&
        LEADS.map((l) => {
          const home = pt(l.homeCol, l.homeSlot);
          return (
            <LeadCard
              key={`in-${l.id}`}
              x={home.x}
              y={home.y + (1 - arriveIn) * 20}
              opacity={arriveIn}
              scale={1}
              stripe={baseColor(l.homeCol)}
              stripeAmt={0.5}
              state={{ color: baseColor(l.homeCol), label: baseLabel(l.homeCol) }}
              lead={l}
            />
          );
        })}

      {/* leads principales: reposo frío → templado → vuelo a su columna → salida */}
      {[...LEADS]
        .map((l) => {
          const home = pt(l.homeCol, l.homeSlot);
          const dest = pt(l.destCol, l.destSlot);
          const x = lerp(home.x, dest.x, move);
          const y = lerp(home.y, dest.y, move);
          const stripe = mix(baseColor(l.homeCol), outcomeColor(l.outcome), warm);
          const stateColor = stripe;
          const stateLabel = warm < 0.5 ? baseLabel(l.homeCol) : outcomeLabel(l.outcome);
          const op = 1 - smoother(fade);
          const scale = 1 + 0.04 * clamp01(1 - Math.abs(warm - 0.5) / 0.5) * (frame < MOVE_AT ? 1 : 0);
          return { l, x, y, stripe, stateColor, stateLabel, op, scale };
        })
        // pinta de arriba a abajo para un apilado correcto
        .sort((a, b) => a.y - b.y)
        .map(({ l, x, y, stripe, stateColor, stateLabel, op, scale }) => (
          <LeadCard
            key={l.id}
            x={x}
            y={y}
            opacity={op}
            scale={scale}
            stripe={stripe}
            stripeAmt={0.45 + 0.55 * warm}
            state={{ color: stateColor, label: stateLabel }}
            lead={l}
            value={l.outcome === 'ganado' && warm > 0.6 ? l.value : undefined}
            won={l.outcome === 'ganado' && warm > 0.55}
            dim={l.outcome === 'descartado' && warm > 0.5}
          />
        ))}

      {/* ✓ «comprado» con chispa en los Ganados al llegar (atado a la opacidad de su card) */}
      <StageSvg>
        {LEADS.filter((l) => l.outcome === 'ganado' && move > 0.55).map((l) => {
          const dest = pt(l.destCol, l.destSlot);
          const op = 1 - smoother(fade);
          return (
            <g key={`ck-${l.id}`} opacity={clamp01(op)}>
              <Check cx={dest.x + CARD_W / 2 - 16} cy={dest.y - CARD_H / 2 + 6} size={20} draw={clamp01((move - 0.55) / 0.45)} spark={clamp01((move - 0.7) / 0.3) * (1 - move)} />
            </g>
          );
        })}
      </StageSvg>

      {/* la placa «Foresight en funcionamiento» (misma UI que M1Tickets): ausente en
          reposo → aparece (fade-in) + se abre al reactivar → se cierra y desaparece. */}
      {presence > 0.002 && (
        <div style={{ opacity: presence }}>
          <OperatingModuleTile x={NODE_X} y={NODE_Y} module="foresight" status="Reactivando leads" frame={frame} expand={expand} size={NODE_SIZE} />
        </div>
      )}
    </LoopStage>
  );
};

// ── columna del Kanban (cabecera + zona flat con ring fino y puntos) — port de M1Tickets ─
const KanbanColumn: React.FC<{ column: Column }> = ({ column }) => (
  <>
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

// ── task-card de lead (estándar, sin bisel): franja de estado + origen + nombre + avatar ─
const LeadCard: React.FC<{
  x: number;
  y: number;
  opacity: number;
  scale: number;
  stripe: string; //      color de la franja izquierda (temperatura/desenlace)
  stripeAmt: number; //   0..1 opacidad de la franja
  state: { color: string; label: string };
  lead: Lead;
  value?: string;
  won?: boolean;
  dim?: boolean;
}> = ({ x, y, opacity, scale, stripe, stripeAmt, state, lead, value, won, dim }) => {
  const ring = won ? mix(TAILARK_RING, GANADO_C, 0.4) : TAILARK_RING;
  const bg = won ? mix(tailarkSurface(0.62), GANADO_C, 0.12) : tailarkSurface(0.62);
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity: clamp01(opacity) * (dim ? 0.6 : 1),
        width: CARD_W,
      }}
    >
      <TailarkCard width={CARD_W} height={CARD_H} radius={14} pad={0} ring={ring} bg={bg} style={{ position: 'relative' }}>
        {/* franja de estado a la izquierda (se enciende al templarse) */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: stripe, opacity: clamp01(stripeAmt) }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', padding: '12px 12px 12px 16px' }}>
          {/* fila superior: chip de origen + chip de estado (temperatura/desenlace) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: TEXT_FONT,
                fontWeight: 700,
                fontSize: 11,
                color: mix(lead.source.tint, '#000000', 0.18),
                background: mix(lightTheme.surface, lead.source.tint, 0.14),
                padding: '3px 8px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 999, background: lead.source.tint }} />
              {lead.source.label}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontFamily: TEXT_FONT,
                fontWeight: 700,
                fontSize: 11,
                color: mix(state.color, '#000000', 0.24),
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: 999, background: state.color }} />
              {state.label}
            </span>
          </div>

          {/* nombre del lead (el «título») */}
          <div
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 600,
              fontSize: 16,
              lineHeight: 1.1,
              color: lightTheme.textStrong,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lead.name}
          </div>

          {/* fila inferior: avatar + (Ganado) importe / (resto) id tenue */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <AvatarChip initials={lead.initials} size={24} seed={lead.seed} />
            {value ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontFamily: TEXT_FONT,
                  fontWeight: 800,
                  fontSize: 12,
                  color: mix(GANADO_C, '#000000', 0.3),
                  background: mix(lightTheme.surface, GANADO_C, 0.16),
                  padding: '2px 7px',
                  borderRadius: 999,
                }}
              >
                € {value}
              </span>
            ) : (
              <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 12, color: lightTheme.textMuted, opacity: 0.7 }}>{lead.id}</span>
            )}
          </div>
        </div>
      </TailarkCard>
    </div>
  );
};
