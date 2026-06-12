/**
 * M1Invoices · «Tus facturas se ordenan solas» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Lenguaje HÍBRIDO (UI interna de Tailark sobre el sustrato AiKit). Base Tailark:
 *   · `flow-*` → **flujo de líneas SIMÉTRICO** (haz que converge a la izquierda +
 *     diverge a la derecha, espejo exacto sobre DocuSense).
 *   · `document-pdf/xlx/csv` (`DocChip`) → los **distintos tipos de factura** (misma
 *     UI de doc que e-commerce/accounting).
 *
 * FLUJO CONTINUO (loop perfecto, técnica «flujo continuo»): documentos **entrando
 * todo el rato** desde la izquierda por las 2 ramas → DocuSense los **procesa** (pulsa,
 * los endereza) → salen clasificados y van a su carpeta «Compras»/«Ventas». Hay un
 * flujo constante de `K` facturas equiespaciadas en el periodo (cada una recorre
 * entrada→proceso→salida), de modo que **las ramas de la izquierda NUNCA quedan
 * vacías** (siempre hay ≥1 doc recorriéndolas) y la foto en el seam es idéntica.
 * Determinista, periódico en DUR. Módulo: docusense.
 */

import {
  LoopStage,
  DocChip,
  ModuleIcon,
  Check,
  StageSvg,
  useLoop,
  eventProgress,
  hash,
  type DocKind,
  M1_DURATION,
  CENTER,
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

export const M1_INVOICES_DURATION = M1_DURATION; // 120 f · 4 s

const DUR = M1_INVOICES_DURATION;

// ── geometría SIMÉTRICA (espejo exacto sobre DocuSense en x=CENTER) ───────────────
type Pt = { x: number; y: number };
type Cubic = [Pt, Pt, Pt, Pt];

const DS: Pt = { x: CENTER, y: CENTER }; // DocuSense, hub central
const ICON = 156;
const HALF = 318; // distancia horizontal centro → nodo (igual a ambos lados)
const PX = CENTER - HALF; // x donde arrancan las líneas de entrada (izq)
const FX = CENTER + HALF; // x de las carpetas / fin de las líneas de salida (der)
const ROW_Y = [CENTER - 150, CENTER + 150] as const; // 2 filas simétricas
const CK = 150; // tirador de las curvas (mismo a ambos lados → espejo)
const FOLDER_W = 150;
const DOC_W = 104;
const DOC_RATIO = 1.3;
const PLATE = Math.round(ICON * 1.16); // placa neumórfica bajo DocuSense (tapa el doc en proceso)

const cubicAt = (p: Cubic, u: number): Pt => {
  const t = clamp01(u);
  const mt = 1 - t;
  const a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
  return { x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x, y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y };
};
const pathD = (p: Cubic) => `M ${p[0].x} ${p[0].y} C ${p[1].x} ${p[1].y} ${p[2].x} ${p[2].y} ${p[3].x} ${p[3].y}`;

/** Línea de ENTRADA (scaffold): de PX al hub. Espejo exacto de la de salida. */
const inScaffold = (row: number): Cubic => [{ x: PX, y: ROW_Y[row] }, { x: PX + CK, y: ROW_Y[row] }, { x: DS.x - CK, y: DS.y }, DS];
/** Línea de SALIDA (scaffold): del hub a la carpeta, espejo de la de entrada. */
const outBez = (row: number): Cubic => [DS, { x: DS.x + CK, y: DS.y }, { x: FX - CK, y: ROW_Y[row] }, { x: FX, y: ROW_Y[row] }];

const IN_SCAFFOLD: Cubic[] = ROW_Y.map((_, r) => inScaffold(r));
const OUT_SCAFFOLD: Cubic[] = ROW_Y.map((_, r) => outBez(r));

// ── flujo continuo: K facturas equiespaciadas en el periodo ───────────────────────
const KIND: DocKind[] = ['pdf', 'xlx', 'csv'];
const K = 8; // facturas por loop (120/8 = 15 f de separación)
const SPACING = DUR / K; // 15 f
// ciclo de vida de cada factura: BANDEJA (asciende en la pila) → ENTRA (cima → hub) →
// PROCESO → SALE. Como LIFE == DUR, hay un flujo CONTINUO: la bandeja nunca se vacía
// (varios docs ascendiendo a distintas alturas) y nada queda estático en el origen.
const STACK = 64; // en la bandeja: aparece por debajo y asciende hasta la cima (origen de la línea)
const RISE = 88; // px que asciende un doc dentro de la bandeja
const TIN = 26; // entrada (cima de la pila → hub)
const PROC = 8; // dentro de DocuSense (oculto tras la placa)
const TOUT = 22; // salida (hub → carpeta)
const LIFE = STACK + TIN + PROC + TOUT; // 120 = DUR → flujo continuo, sin huecos ni reposo
const DEST = [0, 1, 1, 0, 0, 1, 1, 0] as const; // carpeta destino por factura (4 Compras / 4 Ventas)

const TRIPS = Array.from({ length: K }, (_, k) => ({
  k,
  t0: k * SPACING,
  lane: k % 2, // entra por la rama de arriba / abajo, alternando → ambas siempre activas
  dest: DEST[k],
  kind: KIND[k % 3],
  tilt: (hash(k * 2.3 + 0.7) - 0.5) * 30, // ±15° al entrar (papel torcido) → se endereza
}));

type Phase = 'stack' | 'in' | 'proc' | 'out';
type Doc = { x: number; y: number; scale: number; rot: number; opacity: number; phase: Phase; uIn: number; uOut: number };
function docState(life: number, t: (typeof TRIPS)[number]): Doc {
  // 1) BANDEJA: la factura aparece por DEBAJO y asciende hasta la cima (origen de la
  //    línea). Con varios docs desfasados → una pila viva que avanza, nada estático.
  if (life <= STACK) {
    const u = life / STACK; // 0 base → 1 cima
    const dx = (hash(t.k * 1.7 + 0.3) - 0.5) * 34; // leve abanico horizontal (no perfecto)
    const y = lerp(ROW_Y[t.lane] + RISE, ROW_Y[t.lane], smooth(u));
    return { x: PX + dx, y, scale: lerp(0.9, 1, u), rot: lerp(t.tilt, 0, clamp01(u / 0.85)), opacity: clamp01(life / 8), phase: 'stack', uIn: 0, uOut: 0 };
  }
  // 2) ENTRA: se despega de la cima y recorre la rama hasta DocuSense.
  const li = life - STACK;
  if (li <= TIN) {
    const u = li / TIN; // LINEAL → velocidad ~constante
    const p = cubicAt(inScaffold(t.lane), u);
    return { x: p.x, y: p.y, scale: lerp(1, 0.96, smooth(u)), rot: 0, opacity: 1, phase: 'in', uIn: u, uOut: 0 };
  }
  // 3) PROCESO dentro de DocuSense (oculto tras la placa).
  if (li <= TIN + PROC) return { x: DS.x, y: DS.y, scale: 0.96, rot: 0, opacity: 1, phase: 'proc', uIn: 0, uOut: 0 };
  // 4) SALE clasificada a su carpeta.
  const u = (li - TIN - PROC) / TOUT;
  const p = cubicAt(outBez(t.dest), smoother(u));
  return { x: p.x, y: p.y, scale: lerp(0.96, 0.34, smooth(u)), rot: 0, opacity: u > 0.82 ? clamp01((1 - u) / 0.18) : 1, phase: 'out', uOut: u, uIn: 0 };
}

export const M1InvoicesScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  const docs = TRIPS.map((t) => {
    const p = eventProgress(frame, DUR, t0Of(t), LIFE);
    return { t, doc: p == null ? null : docState(p * LIFE, t), life: p == null ? null : p * LIFE };
  });

  // encendido de líneas, DocuSense procesando y flash de carpeta (todo transitorio)
  const inLit = [0, 0];
  const outLit = [0, 0];
  const flash = [0, 0];
  let proc = 0;
  docs.forEach(({ t, doc, life }) => {
    if (!doc || life == null) return;
    if (doc.phase === 'stack') return; // en la bandeja: aún no toca la línea ni el hub
    if (doc.phase === 'in') {
      inLit[t.lane] = Math.max(inLit[t.lane], Math.sin(clamp01(doc.uIn) * Math.PI));
      proc = Math.max(proc, smooth(doc.uIn));
    } else if (doc.phase === 'proc') {
      proc = 1;
    } else {
      outLit[t.dest] = Math.max(outLit[t.dest], Math.sin(doc.uOut * Math.PI));
      proc = Math.max(proc, 1 - smooth(doc.uOut));
      const landP = clamp01((life - (LIFE - 16)) / 16); // bump 0→1→0 al aterrizar
      flash[t.dest] = Math.max(flash[t.dest], Math.sin(landP * Math.PI));
    }
  });
  const iconActive = clamp01(proc);

  const behind = docs.filter((d) => d.doc && d.doc.phase !== 'out'); // entrada / proceso
  const front = docs.filter((d) => d.doc && d.doc.phase === 'out'); // clasificados, sobre el icono

  return (
    <LoopStage dur={DUR}>
      {/* ── haz de líneas SIMÉTRICO (entrada converge · salida diverge) ── */}
      <StageSvg>
        {IN_SCAFFOLD.map((lane, i) => (
          <Flowline key={`in${i}`} d={pathD(lane)} lit={inLit[i]} />
        ))}
        {OUT_SCAFFOLD.map((lane, i) => (
          <Flowline key={`out${i}`} d={pathD(lane)} lit={outLit[i]} />
        ))}
      </StageSvg>

      {/* ── carpetas destino (icono de SO macOS, en blanco) + etiqueta = orden ── */}
      {ROW_Y.map((y, i) => (
        <FolderSlot key={i} id={i} x={FX} y={y} label={FOLDER_LABELS[i]} lit={flash[i]} />
      ))}

      {/* ── docs en la bandeja / entrando / procesándose (detrás de DocuSense) ── */}
      {behind.map(({ t, doc }) => (doc ? <FlyingDoc key={t.k} doc={doc} kind={t.kind} /> : null))}

      {/* ── placa neumórfica BAJO DocuSense: el icono de marca es transparente y el doc
            en proceso asomaba por debajo; esta placa opaca lo oculta (lo «absorbe») ── */}
      <DocuSensePlate active={iconActive} />

      {/* ── DocuSense lee/clasifica (SIEMPRE por encima del doc que tiene dentro) ── */}
      <ModuleIcon name="docusense" size={ICON} x={DS.x} y={DS.y} active={iconActive} />
      <span
        style={{
          position: 'absolute',
          left: DS.x,
          top: DS.y + ICON / 2 + 14,
          transform: 'translateX(-50%)',
          fontFamily: TEXT_FONT,
          fontWeight: 600,
          fontSize: 24,
          color: lightTheme.textStrong,
          opacity: 0.5 + 0.4 * iconActive,
        }}
      >
        DocuSense
      </span>

      {/* docs ya clasificados volando a su carpeta — por encima del icono */}
      {front.map(({ t, doc }) => (doc ? <FlyingDoc key={t.k} doc={doc} kind={t.kind} /> : null))}

      {/* ── ✓ con chispa en la carpeta que recibe (decae antes del seam) ── */}
      <StageSvg>
        {flash.map((lit, i) =>
          lit > 0.04 ? <Check key={i} cx={FX + FOLDER_W / 2 - 18} cy={ROW_Y[i] - FOLDER_W * 0.4 + 6} size={26} draw={clamp01(lit * 1.6)} spark={clamp01((lit - 0.55) * 2)} /> : null,
        )}
      </StageSvg>
    </LoopStage>
  );
};

const t0Of = (t: (typeof TRIPS)[number]) => t.t0;

// ── etiquetas de las carpetas (las dos categorías que pidió Iván) ─────────────────
const FOLDER_LABELS = ['Compras', 'Ventas'] as const;

// ── línea de flujo (base tenue + trazo KIT_BLUE que se enciende al paso) ───────────
const Flowline: React.FC<{ d: string; lit: number }> = ({ d, lit }) => {
  const l = clamp01(lit);
  return (
    <g>
      <path d={d} fill="none" stroke="#c4cede" strokeWidth={3} strokeLinecap="round" opacity={0.5} />
      <path d={d} fill="none" stroke={KIT_BLUE} strokeWidth={3.4} strokeLinecap="round" opacity={l} />
    </g>
  );
};

// ── placa neumórfica de fondo para DocuSense (oculta el doc que procesa por debajo) ─
const DocuSensePlate: React.FC<{ active: number }> = ({ active }) => (
  <div style={{ position: 'absolute', left: DS.x, top: DS.y, width: 0, height: 0 }}>
    <div
      style={{
        position: 'absolute',
        left: -PLATE / 2,
        top: -PLATE / 2,
        width: PLATE,
        height: PLATE,
        transform: `scale(${1 + 0.04 * clamp01(active)})`,
        transformOrigin: '50% 50%',
        ...elevation(lightTheme, { depth: 'raised', distance: 12, blur: 30, radius: Math.round(PLATE * 0.3) }),
      }}
    />
  </div>
);

// ── documento en vuelo: DocChip (Tailark) ─────────────────────────────────────────
const FlyingDoc: React.FC<{ doc: Doc; kind: DocKind }> = ({ doc, kind }) => (
  <div
    style={{
      position: 'absolute',
      left: doc.x,
      top: doc.y,
      transform: `translate(-50%,-50%) rotate(${doc.rot}deg) scale(${doc.scale})`,
      opacity: doc.opacity,
    }}
  >
    <DocChip kind={kind} width={DOC_W} ratio={DOC_RATIO} />
  </div>
);

// ── carpeta destino: icono de SO (macOS Big Sur) en BLANCO + etiqueta ─────────────
const FolderSlot: React.FC<{ id: number; x: number; y: number; label: string; lit: number }> = ({ id, x, y, label, lit }) => {
  const l = clamp01(lit);
  const h = FOLDER_W * 0.8; // alto del icono → su centro queda en (x,y)
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0 }}>
      <div
        style={{
          position: 'absolute',
          left: -FOLDER_W / 2,
          top: -h / 2,
          width: FOLDER_W,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          transform: `scale(${1 + 0.05 * l})`,
          transformOrigin: '50% 35%',
        }}
      >
        <OsFolder id={id} size={FOLDER_W} lit={l} />
        <span
          style={{
            fontFamily: TEXT_FONT,
            fontWeight: 600,
            fontSize: 26,
            letterSpacing: 0.1,
            whiteSpace: 'nowrap',
            color: lightTheme.textStrong,
            opacity: 0.82 + 0.18 * l,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

/**
 * Icono de carpeta de macOS (Big Sur) **en blanco** — gris-blanco con borde fino y
 * sombra suave para que lea sobre el fondo claro. `lit` (0..1) la tiñe un instante
 * de azul KIT_BLUE al recibir un documento (sin glow, solo color).
 */
const OsFolder: React.FC<{ id: number; size: number; lit?: number }> = ({ id, size, lit = 0 }) => {
  const w = size;
  const h = size * 0.8;
  const t = clamp01(lit) * 0.18; // hacia KIT_BLUE al recibir
  const backTop = mix('#ffffff', KIT_BLUE, t);
  const backBot = mix('#eef1f7', KIT_BLUE, t);
  const frontTop = mix('#fdfeff', KIT_BLUE, t);
  const frontBot = mix('#e7ebf3', KIT_BLUE, t);
  const edge = mix('#d3dae6', KIT_BLUE, clamp01(lit) * 0.5);
  const bId = `folBack${id}`;
  const fId = `folFront${id}`;
  return (
    <svg width={w} height={h} viewBox="0 0 128 102" style={{ display: 'block', filter: 'drop-shadow(0 10px 18px rgba(60,72,98,0.20))' }}>
      <defs>
        <linearGradient id={bId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={backTop} />
          <stop offset="1" stopColor={backBot} />
        </linearGradient>
        <linearGradient id={fId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={frontTop} />
          <stop offset="1" stopColor={frontBot} />
        </linearGradient>
      </defs>
      {/* cuerpo + pestaña */}
      <path
        d="M14 30 C14 23 19 18 26 18 H50 C53 18 56 19.5 58 22 L63 29 H102 C109 29 114 34 114 41 V72 C114 79 109 84 102 84 H26 C19 84 14 79 14 72 Z"
        fill={`url(#${bId})`}
        stroke={edge}
        strokeWidth={1.4}
      />
      {/* tapa frontal */}
      <path
        d="M10 50 C10 44 15 40 21 40 H107 C113 40 118 44 118 50 V78 C118 86 112 92 104 92 H24 C16 92 10 86 10 78 Z"
        fill={`url(#${fId})`}
        stroke={edge}
        strokeWidth={1.4}
      />
      {/* brillo sutil del borde superior de la tapa */}
      <path d="M11 49 C11.5 44 15.5 41 21 41 H107 C112.5 41 116.5 44 117 49" fill="none" stroke="#ffffff" strokeOpacity={0.7} strokeWidth={1.4} strokeLinecap="round" />
    </svg>
  );
};
