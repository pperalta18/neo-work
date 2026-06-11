/**
 * M1Invoices · «Tus facturas se ordenan solas» — Módulo 1 (Tus tareas del día a día)
 * ──────────────────────────────────────────────────────────────────────────────
 * Gancho: «Sueltas el PDF, AiKit hace el resto.»
 * Bucle: un PDF cae desde arriba sobre AiKit → un barrido de luz lo «lee» (banda
 *   translúcida que cruza el documento) → sale como ficha etiquetada que vuela a
 *   1 de 3 carpetas (3 NeoTile abajo) → al aterrizar, cae otro PDF.
 * Cierra porque: FLUJO CONTINUO — la bandeja nunca se vacía; con 3 PDFs de ciclos
 *   ESCALONADOS (offsets de t0 = DUR/3) el composite es periódico en DUR: en cualquier
 *   frame hay «uno cayendo, uno leyéndose, uno volando a carpeta». Frame DUR-1 == 0.
 * Origen PDF: ¿Qué se te da mal? → Gestión documental. Módulo: Docusense (lee/extrae).
 *
 * ── Hermano de M1Stock ───────────────────────────────────────────────────────
 * Comparte la plantilla de M1 (LoopStage + UN ModuleIcon protagonista + una
 * transformación PERIÓDICA en DURATION, determinista, sin costura). Aquí «el objeto»
 * no es un único cuadro estático sino el FLUJO del documento; el icono central
 * `docusense` es quien lo lee y `active` durante cada barrido.
 */

import {
  LoopStage,
  NeoTile,
  ModuleIcon,
  Check,
  StageSvg,
  useLoop,
  eventProgress,
  hash,
  M1_DURATION,
  CENTER,
  KIT_BLUE,
  lightTheme,
  elevation,
  clamp01,
  lerp,
  smooth,
  smoother,
  mix,
} from './loopKit';

export const M1_INVOICES_DURATION = M1_DURATION; // 120 f · 4 s

// ── ritmo del ciclo de cada PDF (relativo a su propio t0, loop-aware vía mod) ────
const DUR = M1_INVOICES_DURATION;
const FALL_END = 18; //  [0,18]  cae desde arriba hasta el lector central
const READ_END = 34; //  [18,34] barrido de luz: docusense lo «lee»
const FLY_END = 56; //   [34,56] sale como ficha y vuela a su carpeta
const LIFE = FLY_END; // dura 56 f; luego ese PDF descansa hasta su próximo t0

// 3 PDFs escalonados DUR/3 = 40 f → composite periódico en DUR (uno cae / uno se lee /
// uno vuela en todo frame). t0 múltiplos de 40 ⇒ mod(frame−t0,DUR) cierra exacto.
const STAGGER = DUR / 3; // 40
const PDF_T0 = [0, STAGGER, STAGGER * 2] as const; // 0, 40, 80

// ── geometría ───────────────────────────────────────────────────────────────────
const READER_Y = CENTER - 96; //  el lector (docusense) vive arriba-centro
const DROP_TOP = -120; //          de dónde cae el PDF (fuera de cuadro, arriba)
const ICON = 168; //               tamaño del icono central

const DOC_W = 150; //              ficha/PDF abstracto (rectángulo, NUNCA captura real)
const DOC_H = 196;

// 3 carpetas abajo (NeoTile): destino determinista por índice de PDF (hash)
const FOLDER_Y = CENTER + 286;
const FOLDER_GAP = 268;
const FOLDER_X = [CENTER - FOLDER_GAP, CENTER, CENTER + FOLDER_GAP] as const;
const FOLDER_SIZE = 184;

/** Carpeta destino de un PDF, determinista (sin contadores → no acumula → loopea). */
function folderOf(pdf: number): number {
  return Math.floor(hash(pdf * 7.3 + 1.4) * 3) % 3;
}

// ── trayectoria de un PDF dentro de su vida [0,LIFE] ─────────────────────────────
type Doc = {
  x: number;
  y: number;
  scale: number;
  rot: number;
  opacity: number;
  read: number; //   0..1 progreso del barrido de luz (solo en fase lectura)
  phase: 'fall' | 'read' | 'fly';
};

function docState(life: number, pdf: number): Doc {
  const fx = FOLDER_X[folderOf(pdf)];
  // ligera deriva horizontal de entrada, determinista por PDF (cae «un poco torcido»)
  const driftX = (hash(pdf * 3.1) - 0.5) * 70;

  if (life <= FALL_END) {
    const u = smooth(life / FALL_END);
    return {
      x: CENTER + driftX * (1 - u),
      y: lerp(DROP_TOP, READER_Y, u),
      scale: lerp(0.86, 1, u),
      rot: lerp((hash(pdf) - 0.5) * 14, 0, u), // se endereza al entrar
      opacity: clamp01(life / 6), // aparece nada más entrar por arriba
      read: 0,
      phase: 'fall',
    };
  }
  if (life <= READ_END) {
    const u = (life - FALL_END) / (READ_END - FALL_END);
    return {
      x: CENTER,
      y: READER_Y,
      scale: 1,
      rot: 0,
      opacity: 1,
      read: u, // la banda de luz cruza el documento de arriba a abajo
      phase: 'read',
    };
  }
  // vuela a su carpeta como ficha etiquetada (encoge al aterrizar)
  const u = (life - READ_END) / (FLY_END - READ_END);
  const e = smoother(u);
  return {
    x: lerp(CENTER, fx, e),
    y: lerp(READER_Y, FOLDER_Y - 8, e),
    scale: lerp(1, 0.4, smooth(u)),
    rot: lerp(0, (hash(pdf * 5.7) - 0.5) * 16, e), // cae a la carpeta con un leve giro
    opacity: u > 0.86 ? clamp01((1 - u) / 0.14) : 1, // se funde justo al posarse
    read: 0,
    phase: 'fly',
  };
}

export const M1InvoicesScene: React.FC = () => {
  const { frame } = useLoop(DUR);

  // estado vivo de los 3 PDFs (cada uno en su fase según su t0)
  const docs = PDF_T0.map((t0, pdf) => {
    const p = eventProgress(frame, DUR, t0, LIFE); // null si ese PDF descansa ahora
    return { pdf, t0, life: p == null ? null : p * LIFE, doc: p == null ? null : docState(p * LIFE, pdf) };
  });

  // docusense «trabaja» = suma de actividad de lectura de los PDFs que estén leyéndose.
  // Es periódico en DUR por construcción (cada t0 es múltiplo de STAGGER) → sin costura.
  const reading = docs.reduce((acc, d) => acc + (d.doc?.phase === 'read' ? Math.sin(d.doc.read * Math.PI) : 0), 0);
  const iconActive = clamp01(reading);

  // destello de carpeta al recibir una ficha: DECAE a 0 dentro de la vida del PDF
  // (no acumula contadores). flash[folder] = pico breve al aterrizar (life≈FLY_END).
  const flash = [0, 0, 0];
  docs.forEach((d) => {
    if (d.life == null) return;
    const land = clamp01((d.life - (FLY_END - 8)) / 8); // 0→1 en los últimos 8 f de vuelo
    if (d.life <= FLY_END && land > 0) {
      const f = folderOf(d.pdf);
      flash[f] = Math.max(flash[f], Math.sin(land * Math.PI)); // sube y baja, vuelve a 0
    }
  });

  return (
    <LoopStage dur={DUR}>
      {/* el cuadro único: la bandeja/lector donde docusense recibe los documentos */}
      <NeoTile size={620} x={CENTER} y={READER_Y + 18} radius={52} distance={14} blur={34}>
        <></>
      </NeoTile>

      {/* icono protagonista: Docusense lee y extrae (active durante el barrido) */}
      <ModuleIcon name="docusense" size={ICON} x={CENTER} y={READER_Y} active={iconActive} />

      {/* boca del lector: una hendidura recessed justo encima del icono (entra el PDF) */}
      <div
        style={{
          position: 'absolute',
          left: CENTER - 132,
          top: READER_Y - 150,
          width: 264,
          height: 16,
          borderRadius: 10,
          ...elevation(lightTheme, { depth: 'recessed', distance: 5, blur: 11, radius: 10 }),
        }}
      />

      {/* 3 carpetas destino (NeoTile): destello breve al recibir, decae antes del seam */}
      {FOLDER_X.map((fx, i) => (
        <NeoTile
          key={i}
          size={FOLDER_SIZE}
          x={fx}
          y={FOLDER_Y}
          radius={30}
          distance={10}
          blur={22}
          accent={KIT_BLUE}
          accentAmount={flash[i] * 0.5}
          scale={1 + flash[i] * 0.03}
        >
          <FolderGlyph lit={flash[i]} />
        </NeoTile>
      ))}

      {/* los PDFs en vuelo (rectángulos abstractos: un par de líneas, NUNCA un doc real) */}
      {docs.map((d) =>
        d.doc == null ? null : <DocCard key={d.pdf} doc={d.doc} />
      )}

      {/* ✓ con chispa en la carpeta que acaba de recibir (refuerzo «ordenado», decae) */}
      <StageSvg>
        {flash.map((lit, i) =>
          lit > 0.04 ? (
            <Check key={i} cx={FOLDER_X[i] + FOLDER_SIZE / 2 - 24} cy={FOLDER_Y - FOLDER_SIZE / 2 + 6} size={26} draw={lit} spark={1 - lit} />
          ) : null
        )}
      </StageSvg>
    </LoopStage>
  );
};

// ── ficha/PDF abstracto ──────────────────────────────────────────────────────────
/** Rectángulo neumórfico con un par de líneas y una pestaña de color = «documento».
 *  Durante la lectura cruza una banda de luz translúcida (el barrido de docusense). */
const DocCard: React.FC<{ doc: Doc }> = ({ doc }) => {
  const tagged = doc.phase === 'fly'; // ya «leído»: muestra su etiqueta de color KIT_BLUE
  return (
    <div
      style={{
        position: 'absolute',
        left: doc.x,
        top: doc.y,
        width: DOC_W,
        height: DOC_H,
        transform: `translate(-50%, -50%) rotate(${doc.rot}deg) scale(${doc.scale})`,
        opacity: doc.opacity,
        ...elevation(lightTheme, { depth: 'raised', distance: 9, blur: 20, radius: 14 }),
        backgroundColor: mix(lightTheme.surface, '#ffffff', 0.4),
        overflow: 'hidden',
      }}
    >
      {/* pestaña de etiqueta: aparece teñida cuando el doc ya está clasificado */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 22,
          background: tagged ? mix(lightTheme.surface, KIT_BLUE, 0.7) : mix(lightTheme.surface, '#cfd6e4', 0.6),
        }}
      />
      {/* un par de líneas de «contenido» (abstracto, sin texto real) */}
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: 18,
            top: 44 + i * 24,
            width: i === 3 ? DOC_W * 0.4 : DOC_W - 36,
            height: 7,
            borderRadius: 4,
            background: mix(lightTheme.surface, '#aeb8cc', 0.7),
            opacity: 0.85,
          }}
        />
      ))}
      {/* barrido de luz: banda translúcida que cruza el documento de arriba a abajo */}
      {doc.read > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: lerp(-30, DOC_H, doc.read),
            height: 46,
            background: `linear-gradient(180deg, ${mix(lightTheme.surface, KIT_BLUE, 0)}00, ${KIT_BLUE}3a, ${mix(lightTheme.surface, KIT_BLUE, 0)}00)`,
            opacity: Math.sin(clamp01(doc.read) * Math.PI), // entra y sale sin dejar rastro
          }}
        />
      )}
    </div>
  );
};

// ── glifo de carpeta dentro del NeoTile (abstracto) ──────────────────────────────
const FolderGlyph: React.FC<{ lit: number }> = ({ lit }) => {
  const c = mix('#9aa6bd', KIT_BLUE, clamp01(lit));
  return (
    <svg width={92} height={72} viewBox="0 0 92 72" style={{ display: 'block' }}>
      {/* pestaña + cuerpo de la carpeta, trazo redondeado */}
      <path
        d="M8 20 L8 14 Q8 8 14 8 L34 8 Q38 8 41 12 L44 16 L78 16 Q84 16 84 22 L84 58 Q84 64 78 64 L14 64 Q8 64 8 58 Z"
        fill="none"
        stroke={c}
        strokeWidth={5}
        strokeLinejoin="round"
        opacity={0.5 + 0.5 * clamp01(lit)}
      />
    </svg>
  );
};

/* Backup V1 (comparación lado a lado) — re-export aliasado. */
export { M1InvoicesScene as M1InvoicesV1Scene, M1_INVOICES_DURATION as M1_INVOICES_V1_DURATION };
