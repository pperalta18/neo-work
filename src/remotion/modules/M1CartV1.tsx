/**
 * M1Cart · «El carrito abandonado se recupera» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Tú ni te enteras; el cliente vuelve.»
 * Bucle: un carrito lleno y brillante (azul, 3 ítems) se va apagando hasta «gris =
 *   abandonado» → un globito de AiKit («¿lo retomamos?») y un pulso del módulo lo
 *   empujan → revive con un ✓ verde con chispa → vuelve a llenarse y brillar =
 *   frame 0 otra vez… y a apagarse.
 * Cierra porque: abandono→empujón→vuelta ES el ciclo de recuperación (CICLO QUE
 *   VUELVE AL REPOSO). Una sola fase periódica `life(f)` rige todo: en `f=0` y
 *   `f=DUR` vale 1 (lleno+brillante) con pendiente continua → costura invisible.
 *   El globito y el ✓ desvanecen, y el tinte verde decae a azul, ANTES de cerrar.
 * Origen PDF: Calificación de leads. Módulo: Heartbeat (vigila el carrito y lo recupera).
 *
 * ── Estructura del Módulo 1 ─────────────────────────────────────────────────────
 * Copia la plantilla de M1Stock: LoopStage + UN NeoTile central + una transformación
 * PERIÓDICA en `DURATION` frames, determinista, sin costura. El icono de marca
 * (esquina) deja «intuir el ERP debajo» sin protagonizar.
 */

import {
  LoopStage,
  NeoTile,
  Bubble,
  Check,
  ModuleIcon,
  StageSvg,
  useLoop,
  M1_DURATION,
  CENTER,
  BRAND,
  KIT_BLUE,
  lightTheme,
  TEXT_FONT,
  clamp01,
  lerp,
  smooth,
  smoother,
  mix,
} from './loopKit';

export const M1_CART_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del ciclo (todo dentro de [0,120), nada cruza la costura) ─────────────
const DUR = M1_CART_DURATION;
const VALLEY = 0.16; //   «vida» mínima en el fondo del abandono (gris desaturado)
const ABANDON_AT = 50; //  frame donde toca fondo (carrito más apagado)
const NUDGE_AT = 52; //   empieza el empujón de AiKit (globito + pulso del módulo)
const NUDGE_SPAN = 18; //  dura el empujón
const SPARK_AT = 68; //   ✓ con chispa al revivir (bien lejos de la costura)
const SPARK_SPAN = 18; //  el ✓ aparece y se desvanece dentro de esta ventana

// ── geometría del cuadro ────────────────────────────────────────────────────────
const TILE = 540;
const CART_W = 300; //   ancho del glifo de carrito
const CART_TOP = CENTER - 36; // el carrito vive un pelín bajo el centro (deja sitio al globito)

/**
 * «Vida» del carrito 0..1 — la fase periódica única. En `f=0` y `f=DUR` vale 1
 * (lleno+brillante = reposo) con pendiente continua en la costura: usa medio coseno
 * para el descenso (consumo→abandono) y `smoother` para la reanimación.
 * Loop-aware: life(0) === life(DUR) === 1, sin pop.
 */
function cartLife(f: number): number {
  if (f <= ABANDON_AT) {
    // 1 → VALLEY con medio coseno (derivada 0 en f=0 → empalma con la subida final)
    const u = f / ABANDON_AT;
    const eased = (1 - Math.cos(u * Math.PI)) / 2; // 0→1 suave por ambos lados
    return lerp(1, VALLEY, eased);
  }
  // VALLEY → 1, reanimación sedosa (derivada 0 en f=DUR → empalma con el inicio)
  const u = (f - ABANDON_AT) / (DUR - ABANDON_AT);
  return lerp(VALLEY, 1, smoother(u));
}

export const M1CartScene: React.FC = () => {
  const { frame } = useLoop(DUR);
  const life = cartLife(frame);

  // saturación/brillo del carrito: azul vivo (life=1) → gris desaturado (life→VALLEY)
  const grayed = clamp01((0.55 - life) / 0.42); // 0..1 «cuán abandonado se ve»

  // el empujón de AiKit: globito «¿lo retomamos?» + el módulo trabaja
  const nudge = frame >= NUDGE_AT && frame <= NUDGE_AT + NUDGE_SPAN ? clamp01((frame - NUDGE_AT) / NUDGE_SPAN) : 0;
  const nudgeAppear = smooth(Math.sin(nudge * Math.PI)); // sube y baja dentro del span (desvanece antes de la costura)
  const moduleActive = nudgeAppear; // Heartbeat «trabaja» solo durante el empujón

  // ✓ con chispa al revivir (aparece, se dibuja y se desvanece dentro de la ventana)
  const sparkU = frame >= SPARK_AT && frame <= SPARK_AT + SPARK_SPAN ? clamp01((frame - SPARK_AT) / SPARK_SPAN) : 0;
  const checkDraw = clamp01((frame - SPARK_AT) / 8);
  const spark = clamp01((frame - SPARK_AT - 4) / 10);
  const checkFade = smooth(Math.sin(sparkU * Math.PI)); // entra y sale → 0 antes del seam
  const checkShow = sparkU > 0;

  // tinte de recuperación: verde justo tras el ✓, decae a azul mucho antes de cerrar
  const revived = frame > SPARK_AT ? clamp01((frame - SPARK_AT) / 16) * clamp01((SPARK_AT + 30 - frame) / 14) : 0;

  // color del carrito: azul (vivo) ↔ gris (abandonado), con un guiño verde al revivir
  const liveBlue = mix('#aeb7c6', KIT_BLUE, clamp01((life - VALLEY) / (1 - VALLEY)));
  const cartColor = mix(liveBlue, BRAND.green, revived * 0.7);

  // ítems del carrito: 3 «productos» que se llenan/vacían con la vida (abandono = vacío)
  const itemsLit = (i: number) => clamp01((life - 0.18 - i * 0.16) / 0.2); // se vacían de derecha a izquierda

  // el carrito «pulsa» (recessed) cuando recibe el empujón; reposo = raised
  const press = nudgeAppear * 0.9;

  return (
    <LoopStage dur={DUR}>
      {/* el cuadro único: el carrito. Se tiñe de gris al abandonarse, de verde al revivir */}
      <NeoTile
        size={TILE}
        x={CENTER}
        y={CENTER}
        radius={48}
        distance={14}
        blur={34}
        press={press}
        accent={revived > 0.05 ? BRAND.green : grayed > 0.2 ? '#9aa3b2' : undefined}
        accentAmount={revived > 0.05 ? revived * 0.55 : grayed * 0.4}
      >
        <></>
      </NeoTile>

      {/* etiqueta del estado del carrito (intuir el CRM/leads debajo) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER,
          top: CART_TOP - 184,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 30,
          color: mix(lightTheme.textStrong, '#9aa3b2', grayed * 0.7),
          opacity: 1,
        }}
      >
        Carrito
      </div>

      {/* glifo de carrito abstracto + 3 ítems (SVG, escala del lienzo) */}
      <StageSvg>
        {/* los 3 ítems en la cesta — se «apagan» (vacían) al abandonarse */}
        {[0, 1, 2].map((i) => {
          const lit = itemsLit(i);
          const ix = CENTER - 78 + i * 64;
          const iy = CART_TOP - 18;
          const isz = 40;
          return (
            <rect
              key={i}
              x={ix - isz / 2}
              y={iy - isz / 2 - lit * 6}
              width={isz}
              height={isz}
              rx={11}
              fill={mix('#d7dce4', cartColor, lit)}
              opacity={0.35 + lit * 0.65}
            />
          );
        })}

        {/* cesta (trapecio) + asa + 2 ruedas — trazo que pierde color al abandonarse */}
        <g
          fill="none"
          stroke={cartColor}
          strokeWidth={11}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.55 + clamp01((life - VALLEY) / (1 - VALLEY)) * 0.45}
        >
          {/* cesta */}
          <path
            d={`M ${CENTER - CART_W / 2 + 30} ${CART_TOP + 8}
                L ${CENTER + CART_W / 2 - 14} ${CART_TOP + 8}
                L ${CENTER + CART_W / 2 - 44} ${CART_TOP + 76}
                L ${CENTER - CART_W / 2 + 58} ${CART_TOP + 76} Z`}
          />
          {/* asa */}
          <path
            d={`M ${CENTER - CART_W / 2 + 30} ${CART_TOP + 8}
                L ${CENTER - CART_W / 2 + 6} ${CART_TOP - 28}
                L ${CENTER - CART_W / 2 - 24} ${CART_TOP - 28}`}
          />
        </g>
        {/* ruedas (sólidas, mismo desvaído) */}
        <g fill={cartColor} opacity={0.55 + clamp01((life - VALLEY) / (1 - VALLEY)) * 0.45}>
          <circle cx={CENTER - 52} cy={CART_TOP + 104} r={13} />
          <circle cx={CENTER + 60} cy={CART_TOP + 104} r={13} />
        </g>

        {/* ✓ verde con chispa al revivir — entra y sale dentro de su ventana */}
        {checkShow && (
          <g opacity={checkFade}>
            <Check cx={CENTER + 132} cy={CART_TOP - 40} size={40} draw={checkDraw} spark={spark} />
          </g>
        )}
      </StageSvg>

      {/* globito de AiKit: el empujón «¿lo retomamos?» — aparece y desvanece antes del seam */}
      {nudgeAppear > 0.01 && (
        <Bubble x={CENTER} y={CART_TOP - 110} appear={nudgeAppear} accent={KIT_BLUE} fontSize={28}>
          ¿lo retomamos?
        </Bubble>
      )}

      {/* módulo de marca: Heartbeat vigila el carrito y lo recupera (esquina, discreto) */}
      <ModuleIcon name="heartbeat" size={62} x={CENTER + TILE / 2 - 18} y={CENTER + TILE / 2 - 18} active={moduleActive} />
    </LoopStage>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M1CartScene as M1CartV1Scene, M1_CART_DURATION as M1_CART_V1_DURATION };
