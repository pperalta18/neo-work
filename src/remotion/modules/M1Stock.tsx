/**
 * M1Stock · «El stock se repone solo» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Rediseño con base Tailark Pro (`uptime`): la tarjeta de stock usa el medidor de
 * ticks verticales (`MetricBar` del kit) como NIVEL. Lenguaje HÍBRIDO: tarjeta de
 * producto Tailark + UI de «módulo en funcionamiento» compartida con los flujos.
 *
 * Gancho: «Baja del mínimo y AiKit lo repone solo.»
 *
 * Bucle en 3 beats (ciclo que vuelve al reposo — técnica §2.2), SIN placa de fondo y
 * SIN respiro de cámara (`breathe={false}` → todo estático, nada «flota»):
 *   1. BAJA   — el nivel arranca LLENO y se agota despacio (consumo) hasta el umbral
 *      bajo; las barras viran verde→rojo y la tarjeta entra en alarma («bajo»).
 *   2. GESTIONA — al tocar fondo **aparece** (fade-in) la **placa de módulo en
 *      funcionamiento** (`OperatingModuleTile`, la misma UI de Accounting/E-Commerce)
 *      con **Heartbeat**, se **abre** con el estado «Reponiendo stock» y reposa abierta
 *      el tiempo de leerlo.
 *   3. COMPLETA — el nivel vuelve a subir hasta lleno, salta el ✓, la placa se **cierra**
 *      (vuelve a cuadrada) y **desaparece** (fade-out). En el seam: lleno + placa ausente
 *      (frame DUR-1) == lleno + placa ausente (frame 0).
 *
 * Todo (placa, ✓, alarma) DECAE a reposo antes de u→1. Reposición = UNA vez por loop.
 * La placa NO está siempre visible: sólo durante el beat 2-3 (fade-in→abre→cierra→fade-out).
 * Módulo de marca: Heartbeat (vigila el inventario; ejecuta la reposición).
 *
 * ── REFERENCIA del Módulo 1 ──────────────────────────────────────────────────
 * Plantilla de «un solo objeto que se transforma»: LoopStage + UNA tarjeta + una
 * transformación PERIÓDICA en DUR frames, determinista, sin costura.
 */

import {
  LoopStage,
  TailarkCard,
  MetricBar,
  Check,
  StageSvg,
  useLoop,
  M1_DURATION,
  CENTER,
  BRAND,
  lightTheme,
  TEXT_FONT,
  clamp01,
  lerp,
  smoother,
  mix,
} from './loopKit';
import { OperatingModuleTile } from '../OperatingModuleTile';

export const M1_STOCK_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del ciclo (todo dentro de [0,120); el seam cae en pleno «lleno») ──────
const DUR = M1_STOCK_DURATION;

const FULL = 1.0; //          nivel lleno (= frame 0 = frame DUR → loop perfecto)
const LOW = 0.16; //          fondo del agotamiento (por debajo de lowAt → rojo)
const DEPLETE_END = 52; //    se agota despacio hasta el mínimo (consumo constante)
const LOW_HOLD_END = 66; //   reposa en el fondo mientras el módulo «entra»
const REFILL_END = 92; //     reposición sedosa hasta lleno; luego se mantiene → seam lleno=lleno

// placa «módulo en funcionamiento» (OperatingModuleTile · Heartbeat · «Reponiendo stock»)
// no está siempre visible: aparece (fade-in) al agotarse, se abre, reposa, cierra y desaparece.
const TILE_FADE_IN_AT = 42; //  la placa cuadrada APARECE (aún cerrada) al acercarse el fondo
const TILE_FADE_IN_END = 50; // ya visible justo cuando empieza a abrirse
const TILE_OPEN_AT = 50; //     empieza a abrirse al tocar fondo
const TILE_OPEN_END = 66; //    abierta del todo (estado legible)
const TILE_CLOSE_AT = 96; //    empieza a cerrarse cuando ya está repuesto
const TILE_CLOSE_END = 110; //  cerrada del todo (vuelve a cuadrada)
const TILE_FADE_OUT_AT = 110; // tras cerrar, la placa DESAPARECE
const TILE_FADE_OUT_END = 118; // fuera del todo → reposo (ausente) antes del seam

// ✓ de «completado» (decae lejos de la costura)
const SPARK_AT = 86;
const SPARK_SPAN = 18;

// unidades mostradas: rango realista (escala con el nivel)
const U_FULL = 600;
const U_LOW = Math.round(U_FULL * LOW);

// ── geometría (sin placa de fondo: tarjeta arriba + placa de módulo debajo) ──────
const CARD_W = 432;
const CARD_H = 272;
const CARD_CY = 438;
const CARD_X = CENTER - CARD_W / 2;
const CARD_Y = CARD_CY - CARD_H / 2;
const BAR_W = CARD_W - 48;
const BAR_H = 100;
const TICKS = 40; // misma densidad que la ilustración Tailark `uptime`

const TILE_CY = 702; // centro de la placa de módulo, bajo la tarjeta
const TILE_SIZE = 150;

/** Nivel de stock 0..1 — baja lineal (consumo), reposa en el fondo y se rellena eased. Loop-aware. */
function stockLevel(f: number): number {
  if (f <= DEPLETE_END) {
    return lerp(FULL, LOW, f / DEPLETE_END); // descenso constante = «se va gastando»
  }
  if (f <= LOW_HOLD_END) {
    return LOW; // toca fondo y espera a que el módulo entre
  }
  if (f <= REFILL_END) {
    return lerp(LOW, FULL, smoother((f - LOW_HOLD_END) / (REFILL_END - LOW_HOLD_END))); // reposición sedosa
  }
  return FULL; // se mantiene lleno hasta el cierre → continuidad en el seam
}

/** Apertura de la placa de módulo 0..1 — abre al tocar fondo, cierra ya repuesto. Loop-aware. */
function tileExpand(f: number): number {
  if (f < TILE_OPEN_AT) return 0;
  if (f < TILE_OPEN_END) return clamp01((f - TILE_OPEN_AT) / (TILE_OPEN_END - TILE_OPEN_AT));
  if (f < TILE_CLOSE_AT) return 1;
  if (f < TILE_CLOSE_END) return 1 - clamp01((f - TILE_CLOSE_AT) / (TILE_CLOSE_END - TILE_CLOSE_AT));
  return 0;
}

/** Presencia de la placa 0..1 — fade-in al aparecer, fade-out tras cerrarse. Loop-aware. */
function tilePresence(f: number): number {
  if (f < TILE_FADE_IN_AT) return 0;
  if (f < TILE_FADE_IN_END) return clamp01((f - TILE_FADE_IN_AT) / (TILE_FADE_IN_END - TILE_FADE_IN_AT));
  if (f < TILE_FADE_OUT_AT) return 1;
  if (f < TILE_FADE_OUT_END) return 1 - clamp01((f - TILE_FADE_OUT_AT) / (TILE_FADE_OUT_END - TILE_FADE_OUT_AT));
  return 0;
}

export const M1StockScene: React.FC = () => {
  const { frame } = useLoop(DUR);
  const level = stockLevel(frame);

  // «zona de alarma» 0..1 (tiñe la tarjeta de rojo al bajar del mínimo)
  const low = clamp01((0.28 - level) / 0.2);

  // unidades subiendo con el nivel
  const units = Math.round(lerp(U_LOW, U_FULL, level));

  // apertura de la placa de módulo en funcionamiento + su presencia (aparece/desaparece)
  const expand = tileExpand(frame);
  const tilePres = smoother(tilePresence(frame));

  // ✓ con chispa al completar la reposición
  const sparkShow = frame >= SPARK_AT && frame <= SPARK_AT + SPARK_SPAN;
  const checkDraw = clamp01((frame - SPARK_AT) / 8);
  const spark = clamp01((frame - SPARK_AT) / SPARK_SPAN);

  return (
    <LoopStage dur={DUR} breathe={false}>
      {/* la tarjeta de producto estilo Tailark (uptime → stock): cabecera + barras */}
      <div style={{ position: 'absolute', left: CARD_X, top: CARD_Y, width: CARD_W }}>
        <TailarkCard
          width={CARD_W}
          height={CARD_H}
          radius={24}
          pad={26}
          ring={low > 0.04 ? mix('#e3e7ef', BRAND.red, clamp01(low * 0.8)) : undefined}
        >
          {/* cabecera: SKU + unidades (la cifra sube al reponer) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 23, color: lightTheme.textMuted }}>
              Stock · SKU-0420
            </span>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 26, color: mix(lightTheme.textStrong, BRAND.red, low * 0.7) }}>
              {units} u
            </span>
          </div>

          {/* el NIVEL: ticks verticales que se vacían dcha→izda y viran verde→rojo */}
          <MetricBar value={level} width={BAR_W} count={TICKS} height={BAR_H} lowAt={0.46} />

          {/* leyenda de mínimo (se enciende en alarma) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 17, color: mix('#9aa6bd', BRAND.red, low), letterSpacing: 0.2 }}>
              mínimo {U_LOW} u
            </span>
            <span style={{ fontFamily: TEXT_FONT, fontWeight: 700, fontSize: 17, color: level > 0.28 ? mix(BRAND.green, '#000', 0.18) : mix(BRAND.red, '#000', 0.12), opacity: 0.9 }}>
              {level > 0.28 ? 'OK' : 'bajo'}
            </span>
          </div>
        </TailarkCard>
      </div>

      {/* ✓ de «completado» en la esquina de la tarjeta (decae antes del seam) */}
      {sparkShow && (
        <StageSvg>
          <Check cx={CARD_X + CARD_W - 16} cy={CARD_Y - 12} size={36} draw={checkDraw} spark={spark} />
        </StageSvg>
      )}

      {/* beat 2-3: el módulo en funcionamiento (misma UI que Accounting/E-Commerce).
          NO está siempre visible: aparece (fade-in) al agotarse y desaparece (fade-out)
          tras cerrarse. El wrapper aporta presencia (opacidad + micro-escala) y centra
          el tile inline en (CENTER, TILE_CY). */}
      {tilePres > 0.001 && (
        <div
          style={{
            position: 'absolute',
            left: CENTER,
            top: TILE_CY,
            transform: `translate(-50%, -50%) scale(${lerp(0.94, 1, tilePres)})`,
            opacity: tilePres,
          }}
        >
          <OperatingModuleTile module="heartbeat" status="Reponiendo stock" frame={frame} expand={expand} size={TILE_SIZE} />
        </div>
      )}
    </LoopStage>
  );
};
