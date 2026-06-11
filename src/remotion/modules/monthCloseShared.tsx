/**
 * monthCloseShared — datos + piezas comunes de la mini-película «Cierre de mes» (3 actos).
 * ──────────────────────────────────────────────────────────────────────────────
 * `ModMonthClose` dejó de ser un bucle perfecto (un único loop que mezclaba llenar +
 * ejecutar + cerrar). Iván pidió partirlo en TRES clips lineales, como los flujos del
 * Grupo 1 y como Dunning/Ausencias:
 *   1. LIBRO DIARIO — la tarjeta «Junio» se llena de apuntes reales + las 4 áreas
 *      conectadas (Ventas·Compras·Banco·Nóminas) le mandan un pulso cada una.
 *   2. CERRANDO JUNIO — sólo el cuadrado del módulo (`OperatingModuleTile`·Foresight),
 *      sin etiquetas, ingiriendo los apuntes (como `M1AbsencesProcess`).
 *   3. RESUMEN — el libro se consolida en el cierre: los totales cuentan y aparece el ✓
 *      «Cerrado».
 *
 * Este fichero centraliza lo que comparten los actos 1 y 3 (la tarjeta-libro, las áreas,
 * los totales, el formateo €) para que sean una familia y los cross-fades queden limpios.
 * Los actos son LINEALES (`useCurrentFrame()`), ya NO hay regla de costura de bucle.
 */

import type { CSSProperties, ReactNode } from 'react';
import { AbsoluteFill } from 'remotion';
import {
  StageSvg,
  Wire,
  Packet,
  Check,
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
import { Fonts } from '../fonts';

export const STAGE = 1080;
export const CENTER = STAGE / 2;

// ── tarjeta central «Junio» (libro diario → estado de cierre) ───────────────────
export const CARD_W = 560;
export const CARD_H = 480;
export const CARD_CX = CENTER;
export const CARD_CY = 548; // centrada, con aire arriba para la cabecera
export const CARD_X = CARD_CX - CARD_W / 2;
export const CARD_Y = CARD_CY - CARD_H / 2;
export const CARD_R = 36;

// ── apuntes del libro diario (muestra legible del mes) ──────────────────────────
export type Entry = { day: string; concept: string; amount: string; income: boolean };
export const ENTRIES: Entry[] = [
  { day: '03', concept: 'Factura A-118', amount: '+1.250', income: true },
  { day: '05', concept: 'Compra material', amount: '−820', income: false },
  { day: '09', concept: 'Nómina parcial', amount: '−2.100', income: false },
  { day: '12', concept: 'Cobro cliente', amount: '+3.480', income: true },
  { day: '16', concept: 'Suministros', amount: '−640', income: false },
  { day: '21', concept: 'Factura A-142', amount: '+2.190', income: true },
  { day: '24', concept: 'Comisión banco', amount: '−95', income: false },
  { day: '28', concept: 'Cobro cliente', amount: '+1.870', income: true },
];
export const N_ENTRIES = ENTRIES.length;
export const APUNTES_TOTAL = 318;

// ── totales del cierre (cuentan hacia arriba en el acto 3) ──────────────────────
export const TOTALS = [
  { label: 'Ingresos', value: 48250, tone: BRAND.green },
  { label: 'Gastos', value: 34380, tone: mix(lightTheme.textStrong, '#ffffff', 0.25) },
  { label: 'Resultado', value: 13870, tone: KIT_BLUE },
] as const;

/** Formatea un entero a «48.250 €» (separador de millares es-ES, determinista). */
export function eur(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
}

// ── 4 áreas que alimentan el cierre (firma M2: varios cuadros conectados) ────────
export type Source = { key: string; label: string; value: string; tone: string; at: Pt; edge: Pt; t0: number };
export const CHIP_W = 182;
export const CHIP_H = 80;
const SRC_INNER = CHIP_W / 2 - 2;
const L_CX = 150;
const R_CX = STAGE - 150;
const TOP_Y = CARD_CY - 112;
const BOT_Y = CARD_CY + 112;

export const SOURCES: Source[] = [
  { key: 'ventas', label: 'Ventas', value: '+48.250 €', tone: BRAND.green, at: { x: L_CX, y: TOP_Y }, edge: { x: CARD_X, y: TOP_Y }, t0: 0.05 },
  { key: 'compras', label: 'Compras', value: '−21.480 €', tone: KIT_BLUE, at: { x: R_CX, y: TOP_Y }, edge: { x: CARD_X + CARD_W, y: TOP_Y }, t0: 0.17 },
  { key: 'banco', label: 'Banco', value: '152 mov.', tone: BRAND.teal, at: { x: L_CX, y: BOT_Y }, edge: { x: CARD_X, y: BOT_Y }, t0: 0.29 },
  { key: 'nominas', label: 'Nóminas', value: '−12.900 €', tone: KIT_BLUE, at: { x: R_CX, y: BOT_Y }, edge: { x: CARD_X + CARD_W, y: BOT_Y }, t0: 0.41 },
];

/** Punto interior del chip (de donde sale el pulso hacia la tarjeta). */
function chipOut(s: Source): Pt {
  const dir = s.at.x < CARD_CX ? 1 : -1;
  return { x: s.at.x + dir * SRC_INNER, y: s.at.y };
}

// ── fondo común estático (familia con `LoopStage`, sin breathe) ─────────────────
export const MonthBg: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(circle at 50% 47%, #fbfbff, ${lightTheme.surface} 58%, #e9eaf2)`,
      fontFamily: TEXT_FONT,
      overflow: 'hidden',
      ...style,
    }}
  >
    <Fonts />
    {children}
    {/* viñeta neutra muy sutil, como en LoopStage */}
    <AbsoluteFill style={{ background: 'radial-gradient(circle at 50% 47%, transparent 60%, rgba(120,134,160,0.10) 100%)', pointerEvents: 'none' }} />
  </AbsoluteFill>
);

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

/** Cabecera «Cierre de junio» (título de UI, no marketing). Compartida por actos 1 y 3. */
export const MonthHeader: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    style={{
      position: 'absolute',
      left: CENTER,
      top: CARD_Y - 92,
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      opacity,
    }}
  >
    <CalendarGlyph />
    <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: 34, letterSpacing: -0.5, color: lightTheme.textStrong, opacity: 0.92 }}>
      Cierre de junio
    </span>
  </div>
);

// ── estado de la tarjeta-libro (controlado por cada acto) ───────────────────────
export type LedgerState = {
  /** 0..1 — entrada/relieve de la tarjeta entera. */
  appear?: number;
  /** 0..1 — los apuntes aparecen en cascada (stagger interno por fila). */
  fill: number;
  /** número de apuntes mostrado en la cabecera. */
  counter: number;
  /** 0..1 — los apuntes se desvanecen al consolidarse (acto 3). */
  consume?: number;
  /** 0..1 — revelado del panel de resumen (acto 3). */
  summary?: number;
  /** 0..1 — cuenta de los totales (acto 3). */
  tick?: number;
  /** 0..1 — dibujo del ✓ «Cerrado». */
  checkDraw?: number;
  checkSpark?: number;
  /** 0..1 — intensidad del barrido de escaneo + posición vertical 0..1. */
  scan?: number;
  scanFrac?: number;
};

/**
 * Tarjeta central «Junio»: libro diario que se llena de apuntes y, opcionalmente, se
 * consolida en el estado de cierre (totales + sello ✓). Reusada por los actos 1 y 3.
 */
export const LedgerCard: React.FC<LedgerState> = ({
  appear = 1,
  fill,
  counter,
  consume = 0,
  summary = 0,
  tick = 0,
  checkDraw = 0,
  checkSpark = 0,
  scan = 0,
  scanFrac = 0,
}) => {
  const a = clamp01(appear);
  const ledgerOp = 1 - summary; // el libro cede sitio al resumen
  const cardTint = mix(
    mix(lightTheme.surface, KIT_BLUE, 0.03 * ledgerOp),
    BRAND.green,
    0.05 * summary,
  );

  return (
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
        opacity: a,
        transform: `scale(${0.965 + 0.035 * a})`,
        transformOrigin: '50% 50%',
        ...elevation(lightTheme, { depth: 'raised', distance: 16, blur: 38, radius: CARD_R }),
      }}
    >
      {/* cabecera interna: mes + contador de apuntes (cede con el resumen) */}
      <div style={{ position: 'absolute', left: 30, right: 30, top: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', opacity: 0.5 + 0.5 * ledgerOp }}>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 27, color: lightTheme.textStrong }}>Libro diario</span>
        <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 21, color: lightTheme.textMuted, opacity: ledgerOp }}>
          {counter} apuntes
        </span>
      </div>

      {/* filas de apunte (aparecen en cascada; se consolidan en el resumen) */}
      <div style={{ position: 'absolute', left: 26, right: 26, top: 80 }}>
        {ENTRIES.map((e, i) => {
          const appearAt = (i / N_ENTRIES) * 0.9;
          const rowIn = smooth(clamp01((fill - appearAt) / 0.12));
          const rowConsume = smooth(clamp01((consume - (i / N_ENTRIES) * 0.5) / 0.5));
          const op = rowIn * (1 - rowConsume) * (0.5 + 0.5 * ledgerOp);
          const tone = e.income ? mix(BRAND.green, '#000000', 0.2) : mix(KIT_BLUE, '#000000', 0.28);
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 13,
                height: 38,
                opacity: op,
                transform: `translateX(${(1 - rowIn) * -18}px) translateY(${rowConsume * -16}px) scale(${1 - 0.05 * rowConsume})`,
              }}
            >
              <span style={{ flexShrink: 0, width: 40, textAlign: 'center', fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 16, color: lightTheme.textMuted, ...elevation(lightTheme, { depth: 'recessed', distance: 4, blur: 9, radius: 9 }), padding: '4px 0', borderRadius: 9 }}>
                {e.day}
              </span>
              <span style={{ flex: 1, fontFamily: TEXT_FONT, fontWeight: 500, fontSize: 20, color: lightTheme.textStrong, whiteSpace: 'nowrap', overflow: 'hidden' }}>{e.concept}</span>
              <span style={{ flexShrink: 0, fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 20, color: tone }}>{e.amount} €</span>
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
            top: lerp(70, CARD_H - 30, clamp01(scanFrac)),
            height: 3,
            background: `linear-gradient(90deg, transparent, ${KIT_BLUE}, transparent)`,
            opacity: 0.5 * scan,
          }}
        />
      )}

      {/* ── estado de CIERRE: totales + sello «Cerrado ✓» ── */}
      {summary > 0.01 && (
        <div
          style={{
            position: 'absolute',
            left: 32,
            right: 32,
            top: 88,
            opacity: summary,
            transform: `translateY(${(1 - summary) * 20}px)`,
          }}
        >
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 23, color: lightTheme.textMuted }}>Resumen del mes</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 24 }}>
            {TOTALS.map((t, i) => {
              const result = i === TOTALS.length - 1;
              return (
                <div
                  key={t.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: result ? '14px 18px' : '5px 2px',
                    borderRadius: 16,
                    ...(result ? elevation(lightTheme, { depth: 'recessed', distance: 5, blur: 12, radius: 16 }) : {}),
                    background: result ? mix(lightTheme.surface, KIT_BLUE, 0.08) : undefined,
                    borderTop: result ? undefined : `1px solid ${mix(lightTheme.surface, '#7886a0', 0.18)}`,
                  }}
                >
                  <span style={{ fontFamily: TEXT_FONT, fontWeight: result ? 700 : 600, fontSize: result ? 27 : 23, color: lightTheme.textStrong }}>{t.label}</span>
                  <span style={{ fontFamily: DISPLAY_FONT, fontWeight: 700, fontSize: result ? 34 : 27, letterSpacing: -0.5, color: mix(t.tone, '#000000', 0.12) }}>
                    {eur(t.value * tick)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* sello «Cerrado ✓» */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 30, opacity: checkDraw }}>
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
  );
};

/**
 * Las 4 áreas conectadas + sus cables + pulsos hacia la tarjeta. `feed` (0..1)
 * coreografía las 4 entregas escalonadas (firma M2 «negocio conectado»). `appear`
 * (0..1) funde los chips a la entrada.
 */
export const SourceAreas: React.FC<{ feed: number; appear?: number }> = ({ feed, appear = 1 }) => {
  const a = clamp01(appear);
  return (
    <>
      <StageSvg>
        {SOURCES.map((s) => {
          const out = chipOut(s);
          const p = clamp01((feed - s.t0) / 0.34);
          const active = p > 0.001 && p < 0.999;
          const lit = active ? Math.sin(p * Math.PI) : 0;
          return (
            <g key={s.key} opacity={a}>
              <Wire a={out} b={s.edge} lit={lit * 0.9} width={3} />
              {active && <Packet path={[out, s.edge]} t={smooth(p)} tailFrac={0.4} r={6} id={`mc-${s.key}`} />}
            </g>
          );
        })}
      </StageSvg>

      {SOURCES.map((s) => {
        const p = clamp01((feed - s.t0) / 0.34);
        const emit = p > 0 && p < 0.4 ? 1 - p / 0.4 : 0;
        return (
          <div key={s.key} style={{ position: 'absolute', left: s.at.x - CHIP_W / 2, top: s.at.y - CHIP_H / 2, opacity: a, transform: `scale(${1 + 0.03 * emit})`, transformOrigin: '50% 50%' }}>
            <div
              style={{
                width: CHIP_W,
                height: CHIP_H,
                borderRadius: 22,
                borderTopRightRadius: 44,
                background: mix(lightTheme.surface, s.tone, 0.05 + 0.1 * emit),
                boxShadow: `inset 0 0 0 1px ${mix('rgba(120,134,160,0.22)', s.tone, 0.4 * emit)}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 5,
                padding: '0 20px',
                boxSizing: 'border-box',
                ...elevation(lightTheme, { depth: 'raised', distance: 10, blur: 22, radius: 22 }),
              }}
            >
              <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 19, color: lightTheme.textMuted }}>{s.label}</span>
              <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 23, color: mix(s.tone, '#000000', 0.22) }}>{s.value}</span>
            </div>
          </div>
        );
      })}
    </>
  );
};
