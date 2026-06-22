import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from 'remotion';
import { lightTheme } from '@/lib/neumorphism';
import { NeoThemeProvider } from '@/stories/neo/NeoTheme';
import { NeoMessage } from '@/stories/neo/NeoMessage';
import { NeoInput } from '@/stories/neo/NeoInput';
import { NeoCard } from '@/stories/neo/widgets/NeoCard';
import { Fonts, BODY_FONT } from './fonts';

type Line = {
  from: 'me' | 'them';
  text: string;
  time: string;
  /** Frame the bubble commits to the thread. */
  showAt: number;
  /**
   * When set, the lead-up is animated: a 'me' line is typed into the input from
   * this frame until showAt; a 'them' line shows a "typing…" bubble in that
   * window. Omit for a line that's simply already there.
   */
  typeStart?: number;
};

// El humano abre la conversación y explica, paso a paso, cómo arma un
// presupuesto en su empresa (el mismo proceso manual de Prod01: plantilla →
// CRM → tarifas → mano de obra + material → descuento + IVA → PDF → enviar).
// Sin marca: el interlocutor solo asiente y pregunta, breve y neutro. Acaba a
// media explicación — «Y así con cada uno» — y la respuesta de la IA NO llega:
// se queda con los tres puntos pensando, en loop, sobre todo ese tedio.
// Frame-driven de principio a fin.

/** showAt para una línea que nunca llega a comprometerse: la burbuja de puntos
 * de su lead-up (typeStart) se queda en loop hasta el final de la composición. */
const NEVER = 1e9;

const SCRIPT: Line[] = [
  { from: 'me', text: 'Te explico cómo hacemos aquí los presupuestos.', time: '9:41', typeStart: 12, showAt: 84 },
  { from: 'them', text: 'Claro, ¿por dónde empiezas?', time: '9:41', typeStart: 92, showAt: 126 },
  { from: 'me', text: 'Un cliente nos pide presupuesto del material. Abro la plantilla de Excel y la guardo con su número.', time: '9:41', typeStart: 134, showAt: 266 },
  { from: 'them', text: 'Vale. ¿Y los datos del cliente?', time: '9:42', typeStart: 274, showAt: 306 },
  { from: 'me', text: 'Los saco del CRM: razón social, CIF y contacto. Los copio uno a uno.', time: '9:42', typeStart: 314, showAt: 410 },
  { from: 'them', text: 'Entiendo. ¿Y los precios?', time: '9:42', typeStart: 418, showAt: 448 },
  { from: 'me', text: 'De la lista de tarifas. Calculo la mano de obra por horas y sumo el material del catálogo.', time: '9:42', typeStart: 456, showAt: 580 },
  { from: 'me', text: 'Luego aplico el descuento, sumo el IVA y exporto el PDF.', time: '9:43', typeStart: 588, showAt: 672 },
  { from: 'me', text: 'Lo adjunto al correo, lo reviso y se lo envío. Y así con cada uno.', time: '9:43', typeStart: 680, showAt: 776 },
  // La IA se queda pensando: los tres puntos aparecen tras el último mensaje y
  // siguen en loop hasta el final (showAt = NEVER, así nunca se resuelve).
  { from: 'them', text: '', time: '9:43', typeStart: 792, showAt: NEVER },
];

export const CONVERSATION_DURATION = 990; // last bubble at 776, then ~7s de puntos pensando (frame-driven) antes del loop

export function ConversationVideo() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bubble entrance: settle from slightly down + faded. The wrapper must be a
  // flex column so each NeoMessage's own `alignSelf` (left for them, right for
  // me) is honored — otherwise the 78%-capped bubble stays left-anchored.
  const enter = (since: number, from: 'me' | 'them') => {
    const s = spring({ frame: frame - since, fps, config: { damping: 200, mass: 0.6 } });
    return {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: from === 'me' ? 'flex-end' : 'flex-start',
      opacity: s,
      transform: `translateY(${(1 - s) * 14}px) scale(${0.97 + 0.03 * s})`,
    };
  };

  const shown = SCRIPT.filter((l) => frame >= l.showAt);

  // A 'them' line shows a typing bubble during its lead-up window.
  const thinking = SCRIPT.find(
    (l) => l.from === 'them' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  );

  // A 'me' line is typed, letter by letter, into the input during its window.
  const composing = SCRIPT.find(
    (l) => l.from === 'me' && l.typeStart != null && frame >= l.typeStart && frame < l.showAt,
  );
  const inputValue = composing
    ? composing.text.slice(
        0,
        Math.round(
          interpolate(frame, [composing.typeStart!, composing.showAt - 8], [0, composing.text.length], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        ),
      )
    : '';

  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill
        style={{
          backgroundColor: lightTheme.surface,
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: BODY_FONT,
        }}
      >
        <Fonts />
        <NeoCard
          width={580}
          padding={28}
          radius={40}
          center={false}
          style={{ height: 760, justifyContent: 'flex-end', gap: 0 }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              justifyContent: 'flex-end',
              flex: 1,
              minHeight: 0,
              paddingBottom: 22,
              // Hilo largo: el historial se recorta por arriba (lo ya scrolleado)
              // en vez de desbordar la tarjeta.
              overflow: 'hidden',
            }}
          >
            {shown.map((l) => (
              <div key={l.text} style={enter(l.showAt, l.from)}>
                <NeoMessage from={l.from} time={l.time}>
                  {l.text}
                </NeoMessage>
              </div>
            ))}
            {thinking && (
              <div style={enter(thinking.typeStart!, 'them')}>
                {/* Frame-driven dots so the "thinking" bob survives the MP4 export. */}
                <NeoMessage from="them" typing typingFrame={frame} />
              </div>
            )}
          </div>
          <NeoInput value={inputValue} placeholder="Escribe un mensaje…" icon="plus" multiline style={{ width: '100%' }} />
        </NeoCard>
      </AbsoluteFill>
    </NeoThemeProvider>
  );
}
