/**
 * M2LeadFunnel · «Tus leads no se enfrían» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Nadie tiene que perseguir el funnel.»
 * Mecanismo (único de este clip): bolas-lead caen en un EMBUDO → en el punto de
 *   decisión se separan: las CALIENTES salen a Ventas (abajo) y reaparecen arriba
 *   como nuevas; las FRÍAS dan la vuelta por un CARRIL DE NURTURING (lazo lateral),
 *   su color vira frío→cálido y REENTRAN al embudo más calientes. Arriba siguen
 *   cayendo nuevas.
 * Cierra porque: la recirculación de los fríos *es* el «no se enfrían». FLUJO
 *   CONTINUO — en cualquier frame hay bolas cayendo, clasificándose y recirculando.
 * Origen PDF: Vende → Funnel de ventas / Calificación de leads.
 *
 * ── Bucle perfecto (la matemática) ───────────────────────────────────────────
 * Hay un conjunto FIJO de bolas. Cada bola tiene una FASE propia (offset) y un
 * ÚNICO recorrido CERRADO precomputado (polilínea) que ya contiene todo su viaje
 * (caída → embudo → decisión → salida-o-nurturing → arranque de la siguiente
 * caída). La posición es `pointAt(path, mod(frame+offset, DUR)/DUR)`: función pura
 * y periódica → frame DUR-1 encadena con frame 0 SIN COSTURA, sin nada acumulado.
 * La temperatura (color) también deriva de esa misma fase periódica.
 *
 * Lenguaje «conectado» (M2): las trayectorias se dibujan como CARRILES/cables
 * (embudo en V + lazo de nurturing que vuelve arriba). `foresight` (califica) en
 * la boca del embudo; `actionScript` (nutre) en el carril.
 */

import {
  LoopStage,
  NeoTile,
  StageSvg,
  ModuleIcon,
  useLoop,
  pointAt,
  hash,
  clamp01,
  smooth,
  mod,
  lerp,
  mix,
  KIT_BLUE,
  BRAND,
  lightTheme,
  elevation,
  TEXT_FONT,
  CENTER,
  M2_DURATION,
  type Pt,
} from './loopKit';

export const M2_LEADFUNNEL_DURATION = M2_DURATION; // 168 f · 5.6 s

const DUR = M2_LEADFUNNEL_DURATION;

// ── geometría del escenario ─────────────────────────────────────────────────────
// Embudo en V con boca arriba y cuello abajo; punto de decisión bajo el cuello;
// dos destinos: salida a Ventas (abajo) y lazo de nurturing (lateral, sube).
const TOP_Y = 150; //               línea de caída (las nuevas aparecen aquí)
const MOUTH_Y = 372; //             boca del embudo (ancha)
const NECK_Y = 560; //              cuello del embudo (estrecho) = punto de decisión
const MOUTH_HALF = 232; //          medio-ancho de la boca
const NECK_HALF = 58; //            medio-ancho del cuello
const SALES_Y = 880; //             bandeja de Ventas (caliente sale aquí)
const SALES_X = CENTER + 150; //    Ventas, ligeramente a la derecha del eje

// Carril de nurturing: arco amplio por la IZQUIERDA que sube del cuello a la boca.
const LANE_X = 168; //              columna del lazo de nurturing
const LANE_TOP_Y = 300; //          punto alto del lazo (vuelve a entrar por arriba)
const NURTURE_X = CENTER - 30; //   módulo actionScript en el carril

// Paredes del embudo (para dibujarlas como carriles/cables).
const FUNNEL_L: Pt[] = [
  { x: CENTER - MOUTH_HALF, y: MOUTH_Y },
  { x: CENTER - NECK_HALF, y: NECK_Y },
];
const FUNNEL_R: Pt[] = [
  { x: CENTER + MOUTH_HALF, y: MOUTH_Y },
  { x: CENTER + NECK_HALF, y: NECK_Y },
];

// ── el conjunto FIJO de bolas ───────────────────────────────────────────────────
// 7 bolas; cada una con su offset de fase. hash(i) decide caliente/fría de forma
// determinista y reproducible. Distribuimos las fases uniformemente para que el
// flujo sea constante (siempre hay caída, clasificación y recirculación a la vez).
const COUNT = 7;
const BALLS = Array.from({ length: COUNT }, (_, i) => ({
  i,
  offset: Math.round((DUR / COUNT) * i), // fases repartidas → flujo continuo
  hot: hash(i * 3.7 + 1.3) > 0.5, //       caliente (a Ventas) | fría (a nurturing)
  // jitter horizontal del punto de caída, periódico y determinista (no random):
  dropX: lerp(-MOUTH_HALF * 0.62, MOUTH_HALF * 0.62, hash(i * 9.1 + 4.2)),
  r: lerp(15, 19, hash(i * 5.3 + 2.7)), // radio variado (vida relatable)
}));

// ── recorrido cerrado de cada bola (polilínea precomputada, función de hash) ─────
// El recorrido es CERRADO: termina donde la siguiente caída empieza, así que
// `pointAt(path, u)` con u∈[0,1) es inherentemente periódico (loop perfecto).
//
// CALIENTE: caída → embudo → cuello → sale a Ventas → reaparece arriba (nueva).
// FRÍA:     caída → embudo → cuello → lazo de nurturing (sube) → reentra a la boca
//           → embudo → cuello → sale a Ventas (ya nutrida/caliente) → reaparece.
function ballPath(b: (typeof BALLS)[number]): Pt[] {
  const enterX = CENTER + b.dropX; //         dónde entra en la boca
  const mouth: Pt = { x: enterX, y: MOUTH_Y };
  const neck: Pt = { x: CENTER, y: NECK_Y }; // todas convergen al cuello
  const drop: Pt = { x: enterX, y: TOP_Y }; // arranque de caída

  if (b.hot) {
    return [
      drop, //                         cae
      mouth, //                        entra a la boca
      neck, //                         baja por el embudo al cuello (decisión)
      { x: SALES_X, y: SALES_Y }, //   sale a Ventas (abajo)
      { x: SALES_X, y: SALES_Y + 40 }, // se asienta un punto en la bandeja
      // y «reaparece» arriba: el salto al inicio queda enmascarado (la bola se
      // funde al llegar a Ventas y entra nueva con opacidad — ver alpha()).
      drop,
    ];
  }
  // FRÍA — toma el lazo de nurturing tras el cuello y reentra a la boca, luego sí
  // sale a Ventas. El arco de la izquierda la lleva del cuello a la boca subiendo.
  const laneBottom: Pt = { x: CENTER - NECK_HALF - 30, y: NECK_Y - 8 };
  const laneMid: Pt = { x: LANE_X, y: lerp(NECK_Y, LANE_TOP_Y, 0.5) };
  const laneTop: Pt = { x: LANE_X + 60, y: LANE_TOP_Y };
  const reenter: Pt = { x: CENTER - MOUTH_HALF * 0.5, y: MOUTH_Y };
  return [
    drop, //                          cae
    mouth, //                         entra a la boca
    neck, //                          baja al cuello (decisión)
    laneBottom, //                    toma el desvío del carril
    laneMid, //                       sube por el lazo (nurturing)
    laneTop, //                       cresta del lazo
    reenter, //                       reentra a la boca, ya nutrida
    { x: CENTER, y: NECK_Y }, //      vuelve a bajar al cuello
    { x: SALES_X, y: SALES_Y }, //    ahora sí sale a Ventas (caliente)
    drop, //                          reaparece arriba
  ];
}

// Fracción del recorrido en la que cada bola está «en el carril de nurturing»
// (solo fría), para teñir la temperatura y para la opacidad de reaparición.
// Devolvemos también marcadores normalizados precomputados por bola.
type BallPlan = {
  path: Pt[];
  hot: boolean;
  // u-marcadores (fracción del recorrido) — calculados por arc-length implícito de
  // pointAt usando proporciones de índice de vértice; aquí usamos fracciones de
  // segmento equivalentes a la posición del vértice clave.
  uNeck: number; //   llega al cuello (decisión)
  uReenter: number; // (fría) reentra a la boca ya nutrida
  uSales: number; //  cruza a Ventas
  uEnd: number; //    aterriza/desaparece para reaparecer
};

// Posición de un vértice como fracción de arc-length del recorrido total.
function vertexU(path: Pt[], idx: number): number {
  let total = 0;
  const segs: number[] = [];
  for (let k = 0; k < path.length - 1; k++) {
    const d = Math.hypot(path[k + 1].x - path[k].x, path[k + 1].y - path[k].y);
    segs.push(d);
    total += d;
  }
  let acc = 0;
  for (let k = 0; k < idx; k++) acc += segs[k];
  return total === 0 ? 0 : acc / total;
}

const PLANS: BallPlan[] = BALLS.map((b) => {
  const path = ballPath(b);
  if (b.hot) {
    return {
      path,
      hot: true,
      uNeck: vertexU(path, 2), //   neck es vértice 2
      uReenter: vertexU(path, 2), // n/a (sin reentrada): coincide con cuello
      uSales: vertexU(path, 3), //  Ventas es vértice 3
      uEnd: vertexU(path, 4), //    asentado en bandeja
    };
  }
  return {
    path,
    hot: false,
    uNeck: vertexU(path, 2), //     primer cuello (decisión)
    uReenter: vertexU(path, 6), //  reentra a la boca (vértice 6)
    uSales: vertexU(path, 8), //    Ventas (vértice 8)
    uEnd: vertexU(path, 8),
  };
});

// ── temperatura (color) por bola, periódica ─────────────────────────────────────
// Frío = teal/azul; caliente = orange → red, con mesura (sin glows).
// CALIENTE: nace cálida (ya calificada como buena) y se mantiene → sale a Ventas.
// FRÍA: nace fría (teal); en el lazo de nurturing se calienta (teal→orange) y
//       reentra cálida → sale a Ventas. Al reaparecer (u→1==u→0) vuelve a fría.
const COLD = BRAND.teal;
const WARM = BRAND.orange;
const HOT = BRAND.red;

function ballTemp(plan: BallPlan, u: number): number {
  // 0 = frío, 1 = caliente
  if (plan.hot) {
    // entra ya tibia-caliente, vira a caliente al cruzar el cuello, y al reaparecer
    // (final del recorrido) vuelve suavemente a su valor de nacimiento.
    const rise = smooth(clamp01(u / plan.uNeck)); // 0→1 mientras cae+califica
    const fall = smooth(clamp01((u - plan.uSales) / (1 - plan.uSales))); // vuelve a inicio
    return lerp(0.45 + 0.45 * rise, 0.45, fall);
  }
  // FRÍA: fría hasta el cuello; se calienta a lo largo del lazo de nurturing
  // (uNeck→uReenter); cálida tras reentrar; al reaparecer vuelve a fría.
  if (u < plan.uNeck) return 0.06; //                      fría cayendo
  if (u < plan.uReenter) {
    // calentándose por el carril de nurturing
    return smooth(clamp01((u - plan.uNeck) / (plan.uReenter - plan.uNeck))) * 0.92;
  }
  if (u < plan.uSales) return 0.92; //                     cálida, reentrando
  // tras Ventas → reaparece arriba: enfría de vuelta a 0.06 (cierra el periodo)
  const fall = smooth(clamp01((u - plan.uSales) / (1 - plan.uSales)));
  return lerp(0.92, 0.06, fall);
}

function tempColor(t: number): string {
  // teal → orange → red, en mesura
  if (t < 0.5) return mix(COLD, WARM, smooth(t / 0.5));
  return mix(WARM, HOT, smooth((t - 0.5) / 0.5) * 0.7);
}

// ── opacidad de reaparición (enmascara la «costura» del salto a la caída) ────────
// La bola se desvanece al asentarse en Ventas y reaparece arriba ya formada. El
// fade es periódico, así que en u→1 (alpha bajo) ≈ u→0 (alpha bajo) = sin pop.
function ballAlpha(plan: BallPlan, u: number): number {
  // fundido de salida cerca del final (al asentar en bandeja / cruzar a Ventas)
  const outStart = plan.hot ? plan.uEnd : plan.uSales + (1 - plan.uSales) * 0.45;
  const out = u > outStart ? 1 - smooth((u - outStart) / (1 - outStart)) : 1;
  // fundido de entrada al inicio de la caída
  const inEnd = 0.06;
  const inn = u < inEnd ? smooth(u / inEnd) : 1;
  return clamp01(Math.min(out, inn));
}

// ── render ───────────────────────────────────────────────────────────────────────
export const M2LeadFunnelScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // estado por bola (función pura de la fase)
  const dots = BALLS.map((b, k) => {
    const plan = PLANS[k];
    const u = mod(frame + b.offset, DUR) / DUR;
    const p = pointAt(plan.path, u);
    const temp = ballTemp(plan, u);
    const alpha = ballAlpha(plan, u);
    return { b, plan, u, p, temp, alpha };
  });

  // ¿hay alguna bola «calificándose» en la boca ahora? → activa foresight.
  const foresightActive = clamp01(
    dots.reduce((acc, d) => Math.max(acc, d.p.y > MOUTH_Y - 60 && d.p.y < NECK_Y + 20 ? 1 - Math.abs(d.p.x - CENTER) / 260 : 0), 0),
  );
  // ¿hay alguna fría en el carril ahora? → activa actionScript (nutre).
  const nurtureActive = clamp01(
    dots.reduce((acc, d) => Math.max(acc, !d.plan.hot && d.u > d.plan.uNeck && d.u < d.plan.uReenter ? 1 : 0), 0),
  );

  // pulso de la bandeja de Ventas cuando una bola caliente acaba de aterrizar
  const salesPulse = clamp01(
    dots.reduce((acc, d) => {
      const near = d.p.y > SALES_Y - 70 && Math.abs(d.p.x - SALES_X) < 90;
      return near ? Math.max(acc, d.alpha) : acc;
    }, 0),
  );

  return (
    <LoopStage dur={DUR}>
      {/* ── carriles/cables: paredes del embudo + lazo de nurturing (estáticos) ── */}
      <StageSvg>
        <defs>
          <linearGradient id="lf-lane" x1="0" y1={NECK_Y} x2="0" y2={LANE_TOP_Y} gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={mix('#c4cede', BRAND.teal, 0.2)} />
            <stop offset="1" stopColor={mix('#c4cede', KIT_BLUE, 0.35)} />
          </linearGradient>
        </defs>

        {/* paredes del embudo (V) — trazo neumórfico tenue */}
        <path
          d={`M ${FUNNEL_L[0].x} ${FUNNEL_L[0].y} L ${FUNNEL_L[1].x} ${FUNNEL_L[1].y}`}
          stroke="#c4cede"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
        <path
          d={`M ${FUNNEL_R[0].x} ${FUNNEL_R[0].y} L ${FUNNEL_R[1].x} ${FUNNEL_R[1].y}`}
          stroke="#c4cede"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
        {/* boca del embudo: un labio sutil que insinúa la entrada */}
        <path
          d={`M ${CENTER - MOUTH_HALF} ${MOUTH_Y} Q ${CENTER} ${MOUTH_Y + 26} ${CENTER + MOUTH_HALF} ${MOUTH_Y}`}
          stroke="#cdd6e4"
          strokeWidth={3.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />

        {/* carril de nurturing: arco que sube del cuello a la boca por la izquierda */}
        <path
          d={`M ${CENTER - NECK_HALF - 30} ${NECK_Y - 8}
              C ${LANE_X - 40} ${NECK_Y - 40}, ${LANE_X} ${lerp(NECK_Y, LANE_TOP_Y, 0.55)}, ${LANE_X + 60} ${LANE_TOP_Y}
              S ${CENTER - MOUTH_HALF * 0.5 - 70} ${MOUTH_Y - 20}, ${CENTER - MOUTH_HALF * 0.5} ${MOUTH_Y}`}
          stroke="url(#lf-lane)"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
          opacity={0.55 + 0.35 * nurtureActive}
          strokeDasharray="2 11"
        />

        {/* conducto del cuello a Ventas (caliente) — guía tenue */}
        <path
          d={`M ${CENTER} ${NECK_Y} Q ${CENTER + 70} ${lerp(NECK_Y, SALES_Y, 0.5)} ${SALES_X} ${SALES_Y - 30}`}
          stroke={mix('#c4cede', WARM, 0.25)}
          strokeWidth={4.5}
          strokeLinecap="round"
          fill="none"
          opacity={0.45}
          strokeDasharray="2 10"
        />

        {/* ── las bolas-lead (sobre los carriles) ── */}
        {dots.map((d) => {
          const col = tempColor(d.temp);
          const rr = d.b.r;
          return (
            <g key={d.b.i} opacity={d.alpha}>
              {/* halo de relieve sutil (sin glow): aro claro + sombra de contacto */}
              <circle cx={d.p.x} cy={d.p.y + 2} r={rr} fill="rgba(120,134,160,0.16)" />
              <circle cx={d.p.x} cy={d.p.y} r={rr} fill={col} />
              <circle cx={d.p.x - rr * 0.32} cy={d.p.y - rr * 0.34} r={rr * 0.42} fill="#ffffff" opacity={0.28} />
            </g>
          );
        })}
      </StageSvg>

      {/* ── foresight: califica en la boca del embudo ── */}
      <ModuleIcon name="foresight" size={66} x={CENTER} y={MOUTH_Y - 8} active={foresightActive} />

      {/* ── actionScript: nutre, en el carril de nurturing ── */}
      <ModuleIcon name="actionScript" size={50} x={NURTURE_X - 220} y={lerp(NECK_Y, LANE_TOP_Y, 0.5) - 6} active={nurtureActive} />

      {/* ── bandeja de Ventas (destino de las calientes) ── */}
      <NeoTile
        size={172}
        x={SALES_X}
        y={SALES_Y}
        radius={30}
        depth="recessed"
        distance={9}
        blur={20}
        accent={WARM}
        accentAmount={0.1 + 0.4 * salesPulse}
        scale={1 + 0.03 * salesPulse}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
          <ModuleIcon name="heartbeat" size={40} active={salesPulse} />
          <span
            style={{
              fontFamily: TEXT_FONT,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 0.2,
              color: mix(lightTheme.textStrong, HOT, 0.35),
            }}
          >
            Ventas
          </span>
        </div>
      </NeoTile>

      {/* ── etiqueta «Nurturing» del carril (aparece solo al trabajar) ── */}
      <span
        style={{
          position: 'absolute',
          left: LANE_X + 30,
          top: LANE_TOP_Y - 58,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 21,
          letterSpacing: 0.1,
          color: mix(lightTheme.textStrong, KIT_BLUE, 0.3),
          opacity: 0.4 + 0.5 * nurtureActive,
          whiteSpace: 'nowrap',
        }}
      >
        Nurturing
      </span>

      {/* ── el chat/origen de AiKit arriba: «de dónde caen» los leads ── */}
      {(() => {
        const dropping = clamp01(dots.reduce((a, d) => Math.max(a, d.p.y < MOUTH_Y - 40 ? d.alpha : 0), 0));
        return (
          <NeoTile
            size={132}
            x={CENTER}
            y={TOP_Y - 56}
            radius={26}
            distance={12}
            blur={26}
            accent={KIT_BLUE}
            accentAmount={0.1 + 0.18 * dropping}
            scale={1 + 0.025 * dropping}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <ModuleIcon name="actionScript" size={40} active={dropping} />
              <span
                style={{
                  ...elevation(lightTheme, { depth: 'raised', distance: 4, blur: 10, radius: 10 }),
                  backgroundColor: mix(lightTheme.surface, KIT_BLUE, 0.08),
                  padding: '4px 10px',
                  fontFamily: TEXT_FONT,
                  fontWeight: 600,
                  fontSize: 18,
                  color: lightTheme.textStrong,
                  whiteSpace: 'nowrap',
                }}
              >
                Leads
              </span>
            </div>
          </NeoTile>
        );
      })()}
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M2LeadFunnelScene as M2LeadFunnelV1Scene, M2_LEADFUNNEL_DURATION as M2_LEADFUNNEL_V1_DURATION };
