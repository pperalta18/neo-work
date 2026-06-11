/**
 * M1Stock · «El stock se repone solo» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Baja del mínimo y AiKit te trae el mejor precio.»
 * Bucle: una barra de stock baja de verde a rojo → al tocar el mínimo cae un
 *   paquete «+200» y la barra se rellena → vuelve a bajar.
 * Cierra porque: bajar→rellenar→bajar es cíclico por definición (el loop más limpio).
 * Origen PDF: ¿Qué se te da mal? → Compras y aprovisionamiento. Módulo: Heartbeat
 *   (vigila el inventario) → Smart Process repone.
 *
 * ── REFERENCIA del Módulo 1 ──────────────────────────────────────────────────
 * Es la plantilla de «un solo cuadro/objeto que se transforma». Las otras 4
 * animaciones de M1 copian esta estructura: LoopStage + UN NeoTile central + una
 * transformación PERIÓDICA en `DURATION` frames, determinista, sin costura. El
 * icono de marca (esquina) deja «intuir el ERP debajo» sin protagonizar.
 */

import { ModuleIcon } from './loopKit';
import {
  LoopStage,
  NeoTile,
  Check,
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
  smoother,
  mix,
} from './loopKit';

export const M1_STOCK_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del ciclo (todo dentro de [0,120), sin tocar la costura del bucle) ────
const DUR = M1_STOCK_DURATION;
const HI = 0.95; //   nivel lleno (= frame 0 = frame 120 → loop perfecto)
const LO = 0.1; //    nivel bajo mínimo
const DESCEND_END = 84; // baja durante ~2.8 s (consumo constante)
const DROP_IN = 84; //  el paquete empieza a caer al tocar el mínimo
const DROP_LAND = 102; // aterriza
const SPARK_AT = 102; //  ✓ con chispa al reponer (lejos de la costura)

// ── geometría del cuadro ────────────────────────────────────────────────────────
const TILE = 540;
const TRACK_W = 168; //  ancho del carril (recessed)
const TRACK_H = 348; //  alto del carril
const TRACK_X = CENTER - TRACK_W / 2;
const TRACK_TOP = CENTER - TRACK_H / 2 + 26; // un pelín abajo (deja sitio al «Stock»)

/** Nivel de stock 0..1 — baja lineal (consumo) y se rellena eased (sin bounce). Loop-aware. */
function stockLevel(f: number): number {
  if (f <= DESCEND_END) {
    const u = f / DESCEND_END;
    return lerp(HI, LO, u); // descenso constante = «se va gastando»
  }
  const u = (f - DESCEND_END) / (DUR - DESCEND_END);
  return lerp(LO, HI, smoother(u)); // reposición sedosa
}

export const M1StockScene: React.FC = () => {
  const { frame } = useLoop(DUR);
  const level = stockLevel(frame);

  // color del nivel: verde (lleno) → ámbar → rojo (mínimo)
  const fillColor = level > 0.5 ? mix(BRAND.orange, BRAND.green, (level - 0.5) / 0.5) : mix(BRAND.red, BRAND.orange, level / 0.5);
  const low = clamp01((0.32 - level) / 0.22); // 0..1 «zona de alarma»

  // paquete +200 que cae sobre el carril
  const dropP = frame >= DROP_IN && frame <= DROP_LAND + 6 ? clamp01((frame - DROP_IN) / (DROP_LAND - DROP_IN)) : null;
  const packY = dropP != null ? lerp(TRACK_TOP - 230, TRACK_TOP - 36, smooth(dropP)) : 0;
  const packScale = dropP != null && frame > DROP_LAND ? 1 - (frame - DROP_LAND) / 6 : 1; // se «funde» al aterrizar

  // ✓ con chispa al reponer
  const spark = clamp01((frame - SPARK_AT) / 12);
  const checkDraw = clamp01((frame - SPARK_AT) / 8);
  const checkShow = frame >= SPARK_AT && frame <= SPARK_AT + 16;

  const fillH = TRACK_H * level;

  return (
    <LoopStage dur={DUR}>
      {/* el cuadro único */}
      <NeoTile size={TILE} x={CENTER} y={CENTER} radius={48} distance={14} blur={34} accent={low > 0.2 ? BRAND.red : undefined} accentAmount={low * 0.5}>
        <></>
      </NeoTile>

      {/* título del producto + módulo que lo vigila (intuir el ERP) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER,
          top: TRACK_TOP - 64,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 30,
          color: lightTheme.textStrong,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        Stock
      </div>

      {/* carril + relleno (HTML para el gradiente vivo del líquido) */}
      <div
        style={{
          position: 'absolute',
          left: TRACK_X,
          top: TRACK_TOP,
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: 26,
          ...elevation(lightTheme, { depth: 'recessed', distance: 7, blur: 16, radius: 26 }),
          overflow: 'hidden',
        }}
      >
        {/* relleno */}
        <div
          style={{
            position: 'absolute',
            left: 6,
            right: 6,
            bottom: 6,
            height: Math.max(0, fillH - 12),
            borderRadius: 20,
            background: `linear-gradient(180deg, ${mix(fillColor, '#ffffff', 0.22)}, ${fillColor})`,
            boxShadow: `inset 0 2px 0 ${mix(fillColor, '#ffffff', 0.4)}`,
          }}
        />
        {/* línea de mínimo (dashed) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: TRACK_H * 0.3,
            height: 0,
            borderTop: `2px dashed ${mix('#9fb0c6', BRAND.red, low)}`,
            opacity: 0.85,
          }}
        />
      </div>

      {/* paquete +200 que repone */}
      {dropP != null && (
        <div
          style={{
            position: 'absolute',
            left: CENTER,
            top: packY,
            transform: `translate(-50%, -50%) scale(${packScale})`,
            opacity: packScale,
          }}
        >
          <div
            style={{
              ...elevation(lightTheme, { depth: 'raised', distance: 8, blur: 18, radius: 16 }),
              backgroundColor: mix(lightTheme.surface, KIT_BLUE, 0.1),
              padding: '12px 20px',
              fontFamily: TEXT_FONT,
              fontWeight: 700,
              fontSize: 34,
              color: KIT_BLUE,
            }}
          >
            +200
          </div>
        </div>
      )}

      {/* ✓ con chispa al reponer */}
      {checkShow && (
        <StageSvg>
          <Check cx={CENTER + TRACK_W / 2 + 70} cy={TRACK_TOP + 30} size={40} draw={checkDraw} spark={spark} />
        </StageSvg>
      )}

      {/* módulo de marca: Heartbeat vigila el inventario (esquina, discreto) */}
      <ModuleIcon name="heartbeat" size={62} x={CENTER + TILE / 2 - 18} y={CENTER + TILE / 2 - 18} active={low} />
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M1StockScene as M1StockV1Scene, M1_STOCK_DURATION as M1_STOCK_V1_DURATION };
