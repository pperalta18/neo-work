/**
 * M2DunningRun · Dunning — ACTO 2 «El módulo reclama y avisa al cliente»
 * ──────────────────────────────────────────────────────────────────────────────
 * Segundo clip: la **ejecución del módulo**, con la MISMA UI de «módulo en
 * funcionamiento» que Accounting / E-Commerce (`OperatingModuleTile`). El módulo
 * **Action Script** se abre con el estado «Reclamando el pago» y, acto seguido,
 * **se envía una notificación al cliente**: un sobre vuela por el cable hasta el
 * nodo del cliente, que recibe el recordatorio (globito 🔔 + ✓).
 *
 * Es la bisagra de la historia: vencida (acto 1) → AiKit la persigue y avisa →
 * cobrada (acto 3). One-shot lineal con HOLD final (encadena por cross-fade).
 */

import { useCurrentFrame } from 'remotion';
import {
  LoopStage,
  NeoTile,
  AvatarChip,
  Bubble,
  Wire,
  Packet,
  Check,
  StageSvg,
  CENTER,
  KIT_BLUE,
  lightTheme,
  TEXT_FONT,
  clamp01,
  lerp,
  smoother,
  pointAt,
  CURVE,
  type Pt,
} from './loopKit';
import { Envelope } from './dunningInvoice';
import { OperatingModuleTile } from '../OperatingModuleTile';

export const M2_DUNNING_RUN_DURATION = 140; // ~4.7 s

const DUR = M2_DUNNING_RUN_DURATION;

// ── ritmo del acto ────────────────────────────────────────────────────────────
const APPEAR = 14; //          entran módulo + cliente
const TILE_OPEN_AT = 18; //    el módulo se abre…
const TILE_OPEN_END = 46; //   …del todo (estado legible)
const FLY_AT = 60; //          el sobre sale hacia el cliente
const FLY_SPAN = 26; //        tiempo de vuelo
const NOTIFY_AT = FLY_AT + FLY_SPAN - 2; // el cliente recibe el aviso
const CHECK_AT = NOTIFY_AT + 8; //         ✓ «avisado»

// ── geometría ─────────────────────────────────────────────────────────────────
const TILE_CX = CENTER - 190;
const TILE_SIZE = 158;
const CLIENT_CX = CENTER + 290;
const CLIENT_SIZE = 156;
// el sobre viaja del borde derecho (aprox.) del módulo abierto al cliente
const WIRE_A: Pt = { x: TILE_CX + 200, y: CENTER };
const WIRE_B: Pt = { x: CLIENT_CX - CLIENT_SIZE / 2 - 6, y: CENTER };
const WIRE: Pt[] = [WIRE_A, WIRE_B];

/** Campanita de notificación (SVG) — sin emoji, para render determinista. */
const Bell: React.FC<{ size?: number; color?: string }> = ({ size = 22, color = KIT_BLUE }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 1.6 6.5 2.4 7.3.4.4.1 1.2-.5 1.2H4.1c-.6 0-.9-.8-.5-1.2C4.4 15.5 6 14 6 9Z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <path d="M10 20a2 2 0 0 0 4 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </svg>
);

export const M2DunningRunScene: React.FC = () => {
  const frame = useCurrentFrame();

  const appear = smoother(clamp01(frame / APPEAR));

  // apertura del módulo (la placa de «módulo en funcionamiento»)
  const expand = clamp01((frame - TILE_OPEN_AT) / (TILE_OPEN_END - TILE_OPEN_AT));

  // vuelo del sobre A→B
  const flyRaw = clamp01((frame - FLY_AT) / FLY_SPAN);
  const flying = frame >= FLY_AT && frame <= FLY_AT + FLY_SPAN + 2;
  const flyT = CURVE.standard(flyRaw);
  const envPos = pointAt(WIRE, lerp(0.02, 0.98, flyT));
  const wireLit = flying ? Math.sin(flyRaw * Math.PI) : 0;

  // notificación recibida por el cliente (globito) + ✓
  const notify = smoother(clamp01((frame - NOTIFY_AT) / 14));
  const checkDraw = clamp01((frame - CHECK_AT) / 12);
  const checkSpark = clamp01((frame - CHECK_AT) / 22);
  const clientActive = Math.max(notify, wireLit);

  return (
    <LoopStage dur={DUR} breathe={false}>
      {/* cable módulo → cliente + sobre (aviso de pago). Gateado por la entrada
          para que el cable no flote solo antes de que aparezcan los nodos. */}
      <StageSvg>
        <g opacity={appear}>
          <Wire a={WIRE_A} b={WIRE_B} lit={wireLit} width={4} />
          {flying && (
            <>
              <Packet path={[WIRE_A, envPos]} t={1} tailFrac={0.5} r={9} id="dunrun" />
              <Envelope p={envPos} />
            </>
          )}
          {checkDraw > 0.01 && (
            <Check cx={CLIENT_CX + CLIENT_SIZE / 2 - 10} cy={CENTER - CLIENT_SIZE / 2 + 10} size={28} draw={checkDraw} spark={checkSpark} />
          )}
        </g>
      </StageSvg>

      {/* el módulo en funcionamiento (misma UI que los flujos): Action Script reclama */}
      <div style={{ opacity: appear }}>
        <OperatingModuleTile
          module="actionScript"
          status="Reclamando el pago"
          frame={frame}
          expand={expand}
          x={TILE_CX}
          y={CENTER}
          size={TILE_SIZE}
        />
      </div>

      {/* nodo del cliente (recibe el aviso) */}
      <NeoTile
        size={CLIENT_SIZE}
        x={CLIENT_CX}
        y={CENTER}
        radius={34}
        distance={13}
        blur={28}
        opacity={appear}
        accent={KIT_BLUE}
        accentAmount={0.08 + 0.26 * clientActive}
        scale={1 + 0.04 * notify}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <AvatarChip initials="MD" size={66} color={KIT_BLUE} />
          <span style={{ fontFamily: TEXT_FONT, fontWeight: 600, fontSize: 22, color: lightTheme.textStrong }}>Cliente</span>
        </div>
      </NeoTile>

      {/* globito de aviso sobre el cliente */}
      {notify > 0.01 && (
        <Bubble x={CLIENT_CX} y={CENTER - CLIENT_SIZE / 2 - 6} appear={notify} accent={KIT_BLUE} fontSize={24}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
            <Bell size={22} color={KIT_BLUE} />
            Recordatorio de pago
          </span>
        </Bubble>
      )}
    </LoopStage>
  );
};
