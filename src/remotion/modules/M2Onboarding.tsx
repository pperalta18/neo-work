/**
 * M2Onboarding · «El alta de un empleado, de principio a fin» — Módulo 2 (conectado)
 * ──────────────────────────────────────────────────────────────────────────────
 * EXCEPCIÓN al bucle perfecto: a diferencia de los otros 4 clips del Módulo 2,
 * este NO es un loop. Iván pidió contar el alta como una pequeña NARRATIVA (la
 * idea del anillo abstracto «no encajaba»). Es un ÚNICO clip cuadrado (1080) de
 * 4 beats encadenados con cross-fades — al estilo de las mini-películas de flujo
 * (Accounting/E-Commerce) pero en el formato cuadrado del selector de módulos:
 *
 *   1. FIRMA    — se firma el contrato del nuevo empleado. Porte de la ilustración
 *                 Tailark `actionnable` («Signatures Approved»): tarjeta de
 *                 notificación con tramado verde + glifo de firma (lucide
 *                 `Signature`) que se DIBUJA y se sella en «Contrato firmado».
 *   2. EJECUTA  — el módulo AiKit en funcionamiento: `OperatingModuleTile` (la
 *                 MISMA placa de Accounting/E-Commerce) con **Action Script** y el
 *                 estado «Dando de alta a María».
 *   3. STEPS    — la cadena de pasos del onboarding completándose uno a uno
 *                 (`NeoReasoning`, el «tercer clip» de Accounting): contrato →
 *                 nómina → ficha → accesos → equipo.
 *   4. CONFIRMA — pantalla final: ✓ grande «Alta completada» + todos los pasos en
 *                 verde + sello del módulo.
 *
 * Se intuye el ERP debajo (Action Script encadena el alta). Determinista
 * (frame-driven, sin Date/Math.random). El loop abstracto anterior (anillo
 * Contrato→Firma→Ficha→Accesos) queda en `M2Onboarding.ringloop.bak` por si hay
 * que volver. Ver specs/module-loops.md §1 (fila 2.1) y §8 (slug `actionnable`).
 */

import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { TransitionSeries, linearTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { NeoThemeProvider } from '@/stories/neo/NeoTheme';
import { NeoReasoning, type ReasoningStep, type ReasoningStatus } from '@/stories/neo/NeoReasoning';
import { OperatingModuleTile } from '../OperatingModuleTile';
import {
  LoopStage,
  Check,
  StateChip,
  tailarkSurface,
  TAILARK_RING,
  CENTER,
  KIT_BLUE,
  BRAND,
  lightTheme,
  TEXT_FONT,
  DISPLAY_FONT,
  clamp01,
  smoother,
  mix,
  MODULES,
} from './loopKit';

// ── Beats (frames @30fps) y solape de los cross-fades ─────────────────────────
const FIRMA_D = 104;
const EJECUTA_D = 84;
const STEPS_D = 130;
const CONFIRM_D = 82;
const TRANSITION = 8;

/** Total = Σ beats − (nº transiciones) × solape. Lo lee Root.tsx. */
export const M2_ONBOARDING_DURATION =
  FIRMA_D + EJECUTA_D + STEPS_D + CONFIRM_D - 3 * TRANSITION; // 376 f ≈ 12,5 s

/** El nuevo empleado del clip (un único nombre — ya no es un loop de N nombres). */
const EMPLOYEE = 'María González';

const xfade = () => (
  <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
);

/** ✓ blanco escueto (para el sello «verificado» de la insignia de firma). */
const MiniTick: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M5 12.5 10 17.5 19 7" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════════════
 * Beat 1 — FIRMA: porte de la ilustración Tailark `actionnable`.
 * ══════════════════════════════════════════════════════════════════════
 * La tarjeta «Signatures Approved» reinterpretada al onboarding: la firma
 * (lucide `Signature`) se DIBUJA sobre su renglón y, al cerrarse, la tarjeta se
 * sella «Contrato firmado · <empleado>». emerald→BRAND.green, ring→TAILARK_RING.
 */
const FirmaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });

  const underline = clamp01((frame - 10) / 14); // se traza el renglón
  const sign = clamp01((frame - 22) / 40); // se firma encima
  const approved = smoother(clamp01((frame - 60) / 16)); // se sella aprobado

  const BADGE = 100;
  const GLYPH = 58;

  return (
    <LoopStage dur={FIRMA_D} breathe={false}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', width: 'fit-content', opacity: rise, transform: `translateY(${(1 - rise) * 28}px)` }}>
          {/* lámina apilada detrás (el `before:` de la ilustración) */}
          <div
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 12,
              bottom: -12,
              borderRadius: 30,
              background: tailarkSurface(0.5),
              opacity: 0.7,
              boxShadow: `inset 0 0 0 1px ${TAILARK_RING}, 0 22px 40px -26px rgba(40,52,74,0.55)`,
            }}
          />
          {/* tarjeta */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              overflow: 'hidden',
              borderRadius: 30,
              padding: 30,
              paddingRight: 54,
              background: tailarkSurface(0.62),
              boxShadow: `inset 0 0 0 1px ${TAILARK_RING}, 0 26px 50px -30px rgba(40,52,74,0.5)`,
            }}
          >
            {/* tramado verde a la izquierda (mask-r-from), se intensifica al aprobar */}
            <div
              style={{
                position: 'absolute',
                inset: 8,
                width: '46%',
                borderTopLeftRadius: 24,
                borderBottomLeftRadius: 24,
                border: `1px solid ${BRAND.green}`,
                opacity: 0.12 + 0.07 * approved,
                backgroundImage: `linear-gradient(-45deg, ${BRAND.green} 25%, transparent 25%, transparent 50%, ${BRAND.green} 50%, ${BRAND.green} 75%, transparent 75%, transparent)`,
                backgroundSize: '7px 7px',
                WebkitMaskImage: 'linear-gradient(to right, #000 35%, transparent 92%)',
                maskImage: 'linear-gradient(to right, #000 35%, transparent 92%)',
                pointerEvents: 'none',
              }}
            />

            {/* insignia circular con el glifo de firma que se dibuja */}
            <div
              style={{
                position: 'relative',
                flexShrink: 0,
                width: BADGE,
                height: BADGE,
                borderRadius: 999,
                background: mix(lightTheme.surface, '#ffffff', 0.5),
                boxShadow: `inset 0 0 0 1.5px ${mix(BRAND.green, lightTheme.surface, 0.55)}, 0 8px 18px -10px ${mix(BRAND.green, '#000000', 0.4)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width={GLYPH} height={GLYPH} viewBox="0 0 24 24" fill="none" stroke={BRAND.green} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 21h18" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - underline} />
                <path
                  d="m21 17-2.156-1.868A.5.5 0 0 0 18 15.5v.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1c0-2.545-3.991-3.97-8.5-4a1 1 0 0 0 0 5c4.153 0 4.745-11.295 5.708-13.5a2.5 2.5 0 1 1 3.31 3.284"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - sign}
                />
              </svg>
              {/* sello «verificado» al aprobar */}
              {approved > 0.01 && (
                <div
                  style={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: BRAND.green,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `scale(${0.5 + 0.5 * approved})`,
                    opacity: approved,
                    boxShadow: `0 4px 10px -3px ${mix(BRAND.green, '#000000', 0.4)}`,
                  }}
                >
                  <MiniTick size={20} />
                </div>
              )}
            </div>

            {/* bloque de texto */}
            <div style={{ position: 'relative', width: 380 }}>
              <div style={{ position: 'relative', height: 40, marginBottom: 6 }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', fontFamily: DISPLAY_FONT, fontSize: 31, fontWeight: 600, letterSpacing: -0.4, color: lightTheme.textStrong, opacity: 1 - approved, whiteSpace: 'nowrap' }}>
                  Firmando contrato…
                </span>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', fontFamily: DISPLAY_FONT, fontSize: 31, fontWeight: 600, letterSpacing: -0.4, color: lightTheme.textStrong, opacity: approved, whiteSpace: 'nowrap' }}>
                  Contrato firmado
                </span>
              </div>
              <div style={{ fontFamily: TEXT_FONT, fontSize: 20, color: lightTheme.textMuted, marginBottom: 18, whiteSpace: 'nowrap' }}>
                Nuevo empleado · {EMPLOYEE}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 10,
                  fontFamily: TEXT_FONT,
                  fontSize: 18,
                  fontWeight: 600,
                  color: lightTheme.textStrong,
                  background: mix(lightTheme.surface, '#ffffff', 0.4),
                  boxShadow: `inset 0 0 0 1px ${TAILARK_RING}, 0 3px 8px -4px rgba(40,52,74,0.4)`,
                }}
              >
                Ver contrato
              </div>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </LoopStage>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 * Beat 2 — EJECUTA: el módulo en funcionamiento (OperatingModuleTile).
 * ══════════════════════════════════════════════════════════════════════ */
const EjecutaScene: React.FC = () => {
  const frame = useCurrentFrame();
  const expand = smoother(clamp01((frame - 10) / 22));

  return (
    <LoopStage dur={EJECUTA_D} breathe={false}>
      <OperatingModuleTile
        module="actionScript"
        status={`Dando de alta a ${EMPLOYEE.split(' ')[0]}`}
        frame={frame}
        expand={expand}
        x={CENTER}
        y={CENTER}
        size={168}
      />
    </LoopStage>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 * Beat 3 — STEPS: la cadena del onboarding completándose (NeoReasoning).
 * ══════════════════════════════════════════════════════════════════════ */
type StepDef = { title: string; detail?: string; activeAt: number; doneAt: number };
const STEPS: StepDef[] = [
  { title: 'Contrato registrado', detail: 'firmado por ambas partes', activeAt: 6, doneAt: 28 },
  { title: 'Alta en nómina y Seguridad Social', activeAt: 28, doneAt: 52 },
  { title: 'Ficha de empleado creada', detail: 'datos, banco y contacto', activeAt: 52, doneAt: 76 },
  { title: 'Accesos y correo provisionados', detail: 'cuentas y permisos', activeAt: 76, doneAt: 100 },
  { title: 'Equipo y kit de bienvenida', detail: 'asignados', activeAt: 100, doneAt: 122 },
];

const statusAt = (s: StepDef, frame: number): ReasoningStatus =>
  frame < s.activeAt ? 'pending' : frame < s.doneAt ? 'active' : 'done';

const StepsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rise = spring({ frame, fps, config: { damping: 200, mass: 0.7 } });

  const steps: ReasoningStep[] = STEPS.map((s) => ({ title: s.title, detail: s.detail, status: statusAt(s, frame) }));
  const allDone = STEPS.every((s) => frame >= s.doneAt);

  return (
    <LoopStage dur={STEPS_D} breathe={false}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <NeoThemeProvider theme={lightTheme}>
          <div style={{ opacity: rise, transform: `translateY(${(1 - rise) * 22}px)` }}>
            <NeoReasoning title="Alta de empleado" elapsed={allDone ? 'listo' : 'ejecutando…'} width={660} steps={steps} />
          </div>
        </NeoThemeProvider>
      </AbsoluteFill>
    </LoopStage>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 * Beat 4 — CONFIRMA: pantalla final, todos los pasos en verde.
 * ══════════════════════════════════════════════════════════════════════ */
const CHIPS = ['Contrato', 'Nómina', 'Ficha', 'Accesos', 'Equipo'] as const;

const ConfirmScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rise = (since: number, dy = 16) => {
    const t = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.7 } });
    return { opacity: t, transform: `translateY(${(1 - t) * dy}px)` };
  };

  const checkDraw = clamp01((frame - 6) / 22);
  const spark = clamp01((frame - 26) / 16);

  return (
    <LoopStage dur={CONFIRM_D} breathe={false}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 28 }}>
        <svg width={150} height={150} viewBox="0 0 150 150" style={rise(0)}>
          <Check cx={75} cy={75} size={48} draw={checkDraw} spark={spark} />
        </svg>

        <div style={{ ...rise(8), fontFamily: DISPLAY_FONT, fontSize: 52, fontWeight: 700, letterSpacing: -1, color: lightTheme.textStrong }}>
          Alta completada
        </div>
        <div style={{ ...rise(16), fontFamily: TEXT_FONT, fontSize: 24, color: lightTheme.textMuted }}>
          {EMPLOYEE} ya forma parte del equipo
        </div>

        {/* todos los pasos, en verde */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 760, marginTop: 6 }}>
          {CHIPS.map((c, i) => {
            const rv = smoother(clamp01((frame - (30 + i * 7)) / 14));
            return (
              <div key={c} style={{ opacity: rv, transform: `translateY(${(1 - rv) * 10}px) scale(${0.9 + 0.1 * rv})` }}>
                <StateChip active={0} done={1} label={c} />
              </div>
            );
          })}
        </div>

        {/* sello del módulo */}
        <div style={{ ...rise(52), display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px 10px 14px', borderRadius: 999, background: `${KIT_BLUE}14`, marginTop: 10 }}>
          <img src={MODULES.actionScript.icon} alt="Action Script" width={30} height={30} style={{ display: 'block' }} />
          <span style={{ fontFamily: TEXT_FONT, fontSize: 18, fontWeight: 600, color: lightTheme.textStrong }}>
            Alta ejecutada con Action Script
          </span>
        </div>
      </AbsoluteFill>
    </LoopStage>
  );
};

/* ══════════════════════════════════════════════════════════════════════
 * El clip: 4 beats encadenados con cross-fades (un único MP4 secuencial).
 * ══════════════════════════════════════════════════════════════════════ */
export const M2OnboardingScene: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={FIRMA_D}>
      <FirmaScene />
    </TransitionSeries.Sequence>
    {xfade()}
    <TransitionSeries.Sequence durationInFrames={EJECUTA_D}>
      <EjecutaScene />
    </TransitionSeries.Sequence>
    {xfade()}
    <TransitionSeries.Sequence durationInFrames={STEPS_D}>
      <StepsScene />
    </TransitionSeries.Sequence>
    {xfade()}
    <TransitionSeries.Sequence durationInFrames={CONFIRM_D}>
      <ConfirmScene />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
