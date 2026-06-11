/**
 * M2MonthCloseLoop · «El cierre de mes se hace solo» — BUCLE (archivado en Modulos-V1)
 * ──────────────────────────────────────────────────────────────────────────────
 * ⚠️ NO es el clip canónico. Iván pidió partir el cierre de mes en **3 clips lineales**
 * (ver `M2MonthCloseVideo.tsx` + actos `M2MonthCloseLedger/Run/Summary`). Este fichero
 * conserva la versión en **bucle perfecto** (los 2 actos a la vez en 168 f) sólo para
 * comparar lado a lado en Studio (folder Modulos-V1), como `M1AbsencesLoop`.
 *
 * Gancho: «Llegas a fin de mes y está hecho.»
 *
 * REDISEÑO (2026-06-11, pedido por Iván: la versión anterior «no se entendía»).
 * El clip antiguo metía 2 ciclos de 2,8 s de una rejilla-calendario que se llenaba
 * de puntitos abstractos → demasiado rápido y poco legible. Ahora es **UN solo
 * ciclo de 168 f (5,6 s)** con DOS actos claros, al estilo de los flujos
 * (accounting/ecommerce) + la placa «módulo en funcionamiento» de `M1Stock`:
 *
 *   ACTO 1 · EL MES SE EJECUTA — la tarjeta central «Junio» (libro diario) se llena
 *     de **apuntes reales** (día·concepto·importe, ingreso verde / gasto azul) en
 *     cascada; 4 **áreas conectadas** (Ventas·Compras·Banco·Nóminas) emiten un pulso
 *     por su cable hacia el cierre (identidad M2 «negocio conectado»); y la placa de
 *     **Foresight** (`OperatingModuleTile`, la MISMA UI de los flujos) se abre con
 *     «Cerrando junio» + un barrido de escaneo sobre la tarjeta.
 *
 *   ACTO 2 · EL MES SE CIERRA — los apuntes se **consolidan** y la tarjeta revela el
 *     estado de cierre: totales que cuentan (Ingresos·Gastos·Resultado) + sello
 *     **«Cerrado ✓»** con chispa y pulso de Foresight.
 *
 * BUCLE PERFECTO por «ciclo que vuelve al reposo»: todo se deriva de `u`∈[0,1) sobre
 * los 168 f. En `u=0` el libro está VACÍO y la placa cerrada; el estado de cierre, el
 * ✓/verde, la placa y los pulsos DECAEN a reposo antes de cerrar el periodo → el seam
 * global (167→0) es el mismo estado de reposo. Nada latcheado sobrevive a la costura.
 *
 * Base Tailark (línea «Quartz»): tarjeta `TailarkCard` + filas de apunte; el cierre es
 * el estado «document» consolidado. Módulo de marca: **Foresight** (Contabilidad:
 * detecta el patrón y prepara el cierre legal y al detalle).
 */

import {
  LoopStage,
  StageSvg,
  Wire,
  Packet,
  Check,
  TailarkCard,
  useLoop,
  M2_DURATION,
  STAGE,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  DISPLAY_FONT,
  clamp01,
  lerp,
  smooth,
  mix,
  type Pt,
} from './loopKit';
import { OperatingModuleTile } from '../OperatingModuleTile';

export const M2_MONTHCLOSE_LOOP_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_MONTHCLOSE_LOOP_DURATION;

// ── rampas loop-aware (función pura de u∈[0,1)) ──────────────────────────────────
const ramp = (u: number, a: number, b: number) => smooth(clamp01((u - a) / (b - a)));

// ── geometría: tarjeta central + 4 áreas conectadas + placa de módulo abajo ──────
const CARD_W = 524;
const CARD_H = 468;
const CARD_CX = CENTER;
const CARD_CY = 500;
const CARD_X = CARD_CX - CARD_W / 2; // 278
const CARD_Y = CARD_CY - CARD_H / 2; // 266
const CARD_R = 34;

// placa «módulo en funcionamiento» (Foresight · «Cerrando junio»), bajo la tarjeta
const TILE_CY = 886;
const TILE_SIZE = 150;

// ── áreas que alimentan el cierre (firma M2: varios cuadros conectados) ──────────
type Source = { key: string; label: string; value: string; tone: string; at: Pt; edge: Pt; t0: number };
const CHIP_W = 178;
const CHIP_H = 78;
const SRC_INNER = CHIP_W / 2 - 2; // medio chip (su borde interior)
const L_CX = 150;
const R_CX = STAGE - 150; // a la derecha, simétrico
const TOP_Y = 374;
const BOT_Y = 612;

const SOURCES: Source[] = [
  { key: 'ventas', label: 'Ventas', value: '+48.250 €', tone: BRAND.green, at: { x: L_CX, y: TOP_Y }, edge: { x: CARD_X, y: TOP_Y }, t0: 0.06 },
  { key: 'compras', label: 'Compras', value: '−21.480 €', tone: KIT_BLUE, at: { x: R_CX, y: TOP_Y }, edge: { x: CARD_X + CARD_W, y: TOP_Y }, t0: 0.13 },
  { key: 'banco', label: 'Banco', value: '152 mov.', tone: BRAND.teal, at: { x: L_CX, y: BOT_Y }, edge: { x: CARD_X, y: BOT_Y }, t0: 0.2 },
  { key: 'nominas', label: 'Nóminas', value: '−12.900 €', tone: KIT_BLUE, at: { x: R_CX, y: BOT_Y }, edge: { x: CARD_X + CARD_W, y: BOT_Y }, t0: 0.27 },
];

// punto «interior» del chip (de donde sale el pulso hacia la tarjeta)
function chipOut(s: Source): Pt {
  const dir = s.at.x < CARD_CX ? 1 : -1;
  return { x: s.at.x + dir * SRC_INNER, y: s.at.y };
}

// ── apuntes del libro diario (muestra legible del mes) ───────────────────────────
type Entry = { day: string; concept: string; amount: string; income: boolean };
const ENTRIES: Entry[] = [
  { day: '03', concept: 'Factura A-118', amount: '+1.250', income: true },
  { day: '05', concept: 'Compra material', amount: '−820', income: false },
  { day: '09', concept: 'Nómina parcial', amount: '−2.100', income: false },
  { day: '12', concept: 'Cobro cliente', amount: '+3.480', income: true },
  { day: '16', concept: 'Suministros', amount: '−640', income: false },
  { day: '21', concept: 'Factura A-142', amount: '+2.190', income: true },
  { day: '24', concept: 'Comisión banco', amount: '−95', income: false },
  { day: '28', concept: 'Cobro cliente', amount: '+1.870', income: true },
];
const APUNTES_TOTAL = 318;

// ── totales del cierre (cuentan hacia arriba en el Acto 2) ───────────────────────
const TOTALS = [
  { label: 'Ingresos', value: 48250, tone: BRAND.green },
  { label: 'Gastos', value: 34380, tone: mix(lightTheme.textStrong, '#ffffff', 0.25) },
  { label: 'Resultado', value: 13870, tone: KIT_BLUE },
] as const;

/** Formatea un entero a «48.250 €» (separador de millares es-ES, determinista). */
function eur(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
}

export const M2MonthCloseLoopScene: React.FC = () => {
  const { frame } = useLoop(DUR);
  const u = frame / DUR;

  // ── envolventes maestras (todas vuelven a reposo antes de u→1) ──────────────────
  // El estado de cierre entra y, en el decay, se va → en el seam == reposo (u=0).
  const decay = ramp(u, 0.9, 0.995); // pliegue final a reposo
  const closeReveal = ramp(u, 0.58, 0.72) * (1 - decay); // panel de cierre presente
  const ledgerVis = 1 - closeReveal; // el libro cede sitio al cierre y REGRESA en el decay (costura)

  // contador de apuntes: sube al llenarse, baja al consolidarse (0 en el seam)
  const counter = Math.round(APUNTES_TOTAL * ramp(u, 0.03, 0.38) * (1 - ramp(u, 0.56, 0.72)));

  // totales del cierre: cuentan hacia arriba dentro del Acto 2
  const tick = ramp(u, 0.6, 0.78);

  // sello «Cerrado ✓»
  const checkDraw = ramp(u, 0.7, 0.8);
  const checkSpark = ramp(u, 0.78, 0.9);

  // barrido de escaneo sobre la tarjeta mientras el módulo trabaja
  const scan = ramp(u, 0.44, 0.56) * (1 - ramp(u, 0.62, 0.72));
  const scanY = lerp(CARD_Y + 70, CARD_Y + CARD_H - 30, ramp(u, 0.44, 0.7));

  // apertura de la placa de módulo (abre al ejecutar, cierra antes del seam)
  const tileExpand = ramp(u, 0.42, 0.54) * (1 - ramp(u, 0.8, 0.92));
  // Foresight «trabaja» mientras la placa está abierta y al sellar
  const foreActive = clamp01(tileExpand + checkDraw * (1 - decay));

  // tinte de la tarjeta: leve azul al llenarse, leve verde al cerrarse
  const cardTint = mix(
    mix(lightTheme.surface, KIT_BLUE, 0.03 * ledgerVis),
    BRAND.green,
    0.05 * closeReveal,
  );

  return (
    <LoopStage dur={DUR}>
      {/* cabecera-UI de la tarjeta (título del cierre, no marketing) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER,
          top: CARD_Y - 96,
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <CalendarGlyph />
        <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 34, letterSpacing: -0.5, color: lightTheme.textStrong, opacity: 0.92 }}>
          Cierre de junio
        </span>
      </div>

      {/* ── cables área→cierre + pulsos (firma M2: negocio conectado) ── */}
      <StageSvg>
        {SOURCES.map((s) => {
          const out = chipOut(s);
          const p = clamp01((u - s.t0) / 0.16); // 0..1 viaje del pulso
          const active = p > 0.001 && p < 0.999;
          const lit = active ? Math.sin(p * Math.PI) : 0;
          return (
            <g key={s.key}>
              <Wire a={out} b={s.edge} lit={lit * 0.9} width={3} />
              {active && <Packet path={[out, s.edge]} t={smooth(p)} tailFrac={0.4} r={6} id={`mc-${s.key}`} />}
            </g>
          );
        })}
      </StageSvg>

      {/* ── 4 áreas conectadas (chips Tailark) ── */}
      {SOURCES.map((s) => {
        const p = clamp01((u - s.t0) / 0.16);
        const emit = p > 0 && p < 0.4 ? 1 - p / 0.4 : 0; // micro-pulso al emitir
        return (
          <div key={s.key} style={{ position: 'absolute', left: s.at.x - CHIP_W / 2, top: s.at.y - CHIP_H / 2, transform: `scale(${1 + 0.03 * emit})`, transformOrigin: '50% 50%' }}>
            <TailarkCard width={CHIP_W} height={CHIP_H} radius={20} bevel pad={0} bg={mix(lightTheme.surface, s.tone, 0.05 + 0.1 * emit)} ring={mix('rgba(120,134,160,0.22)', s.tone, 0.4 * emit)}
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, padding: '0 18px', ...elevation(lightTheme, { depth: 'raised', distance: 9, blur: 20, radius: 20 }) }}>
              <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 18, color: lightTheme.textMuted }}>{s.label}</span>
              <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 22, color: mix(s.tone, '#000000', 0.22) }}>{s.value}</span>
            </TailarkCard>
          </div>
        );
      })}

      {/* ── tarjeta central «Junio»: libro diario → estado de cierre ── */}
      <div
        style={{
          position: 'absolute',
          left: CARD_X,
          top: CARD_Y,
          width: CARD_W,
          height: CARD_H,
          borderRadius: CARD_R,
          background: cardTint,
          overflow: 'hidden',
          ...elevation(lightTheme, { depth: 'raised', distance: 15, blur: 36, radius: CARD_R }),
        }}
      >
        {/* cabecera interna: mes + contador de apuntes (cede con el cierre) */}
        <div style={{ position: 'absolute', left: 28, right: 28, top: 22, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: 0.5 + 0.5 * ledgerVis }}>
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 26, color: lightTheme.textStrong }}>Libro diario</span>
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 20, color: lightTheme.textMuted, opacity: ledgerVis }}>
            {counter} apuntes
          </span>
        </div>

        {/* filas de apunte (aparecen en cascada, se consolidan en el cierre) */}
        <div style={{ position: 'absolute', left: 24, right: 24, top: 76 }}>
          {ENTRIES.map((e, i) => {
            const appearU = 0.05 + i * 0.04;
            const rowIn = ramp(u, appearU, appearU + 0.05);
            const consume = ramp(u, 0.56 + i * 0.012, 0.56 + i * 0.012 + 0.1);
            const op = rowIn * (1 - consume) * (0.55 + 0.45 * ledgerVis);
            const tone = e.income ? mix(BRAND.green, '#000000', 0.2) : mix(KIT_BLUE, '#000000', 0.28);
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  height: 36,
                  opacity: op,
                  transform: `translateX(${(1 - rowIn) * -18}px) translateY(${consume * -14}px) scale(${1 - 0.04 * consume})`,
                }}
              >
                {/* pastilla de día */}
                <span style={{ flexShrink: 0, width: 38, textAlign: 'center', fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 16, color: lightTheme.textMuted, ...elevation(lightTheme, { depth: 'recessed', distance: 4, blur: 9, radius: 9 }), padding: '3px 0', borderRadius: 9 }}>
                  {e.day}
                </span>
                {/* concepto */}
                <span style={{ flex: 1, fontFamily: TEXT_FONT, fontWeight: 500, fontSize: 19, color: lightTheme.textStrong, whiteSpace: 'nowrap', overflow: 'hidden' }}>{e.concept}</span>
                {/* importe */}
                <span style={{ flexShrink: 0, fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 19, color: tone }}>{e.amount} €</span>
              </div>
            );
          })}
        </div>

        {/* barrido de escaneo (módulo «leyendo/cuadrando» el libro) */}
        {scan > 0.01 && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: scanY - CARD_Y,
              height: 3,
              background: `linear-gradient(90deg, transparent, ${KIT_BLUE}, transparent)`,
              opacity: 0.5 * scan,
            }}
          />
        )}

        {/* ── estado de CIERRE (Acto 2): totales + sello «Cerrado ✓» ── */}
        {closeReveal > 0.01 && (
          <div
            style={{
              position: 'absolute',
              left: 30,
              right: 30,
              top: 84,
              opacity: closeReveal,
              transform: `translateY(${(1 - closeReveal) * 20}px)`,
            }}
          >
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 22, color: lightTheme.textMuted }}>Resumen del mes</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22 }}>
              {TOTALS.map((t, i) => {
                const result = i === TOTALS.length - 1;
                return (
                  <div
                    key={t.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: result ? '14px 18px' : '4px 2px',
                      borderRadius: 16,
                      ...(result ? elevation(lightTheme, { depth: 'recessed', distance: 5, blur: 12, radius: 16 }) : {}),
                      background: result ? mix(lightTheme.surface, KIT_BLUE, 0.08) : undefined,
                      borderTop: result ? undefined : `1px solid ${mix(lightTheme.surface, '#7886a0', 0.18)}`,
                    }}
                  >
                    <span style={{ fontFamily: TEXT_FONT, fontWeight: result ? 700 : 600, fontSize: result ? 26 : 22, color: lightTheme.textStrong }}>{t.label}</span>
                    <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: result ? 32 : 26, letterSpacing: -0.5, color: mix(t.tone, '#000000', 0.12) }}>
                      {eur(t.value * tick)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* sello «Cerrado ✓» */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28, opacity: checkDraw }}>
              <svg width={48} height={48} viewBox="0 0 48 48" style={{ overflow: 'visible' }}>
                <Check cx={24} cy={24} size={22} draw={checkDraw} spark={checkSpark} />
              </svg>
              <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 28, letterSpacing: -0.3, color: mix(BRAND.green, '#000000', 0.25) }}>
                Cerrado
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── ACTO 1: el módulo en funcionamiento (misma UI que accounting/e-commerce) ── */}
      <OperatingModuleTile
        module="foresight"
        status="Cerrando junio"
        frame={frame}
        expand={tileExpand}
        x={CENTER}
        y={TILE_CY}
        size={TILE_SIZE}
      />

      {/* Foresight presidiendo: su nombre asoma solo mientras trabaja */}
      <span
        style={{
          position: 'absolute',
          left: CENTER,
          top: TILE_CY + TILE_SIZE / 2 + 4,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 20,
          color: lightTheme.textMuted,
          opacity: 0.7 * foreActive,
          whiteSpace: 'nowrap',
        }}
      >
        Foresight · Contabilidad
      </span>
    </LoopStage>
  );
};

/** Glifo de calendario sobrio para la cabecera (motivo «mes»). */
const CalendarGlyph: React.FC = () => {
  const c = lightTheme.textStrong;
  const common = { fill: 'none', stroke: c, strokeWidth: 2.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg width={36} height={36} viewBox="0 0 40 40">
      <rect x="6" y="9" width="28" height="25" rx="5" {...common} />
      <line x1="6" y1="16" x2="34" y2="16" {...common} />
      <line x1="13" y1="6" x2="13" y2="12" {...common} />
      <line x1="27" y1="6" x2="27" y2="12" {...common} />
      <circle cx="14" cy="23" r="1.8" fill={KIT_BLUE} stroke="none" />
      <circle cx="20" cy="23" r="1.8" fill={KIT_BLUE} stroke="none" />
      <circle cx="26" cy="23" r="1.8" fill={KIT_BLUE} stroke="none" />
      <circle cx="14" cy="29" r="1.8" fill={KIT_BLUE} stroke="none" />
      <circle cx="20" cy="29" r="1.8" fill={mix(BRAND.green, '#000000', 0.1)} stroke="none" />
    </svg>
  );
};
