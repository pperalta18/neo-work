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

// A short assistant chat that builds itself, frame-driven end to end.
const SCRIPT: Line[] = [
  { from: 'them', text: 'Hola 👋 Soy tu asistente de AiKit. ¿En qué te ayudo?', time: '9:41', showAt: 8 },
  { from: 'me', text: '¿Cómo empiezo un cartel?', time: '9:41', typeStart: 28, showAt: 92 },
  { from: 'them', text: 'Abre el editor y dibuja una ruta sobre la rejilla.', time: '9:41', typeStart: 108, showAt: 168 },
  { from: 'me', text: '¿Y la animación?', time: '9:42', typeStart: 188, showAt: 244 },
  { from: 'them', text: 'Pulsa play ▶ y cada paso emerge en 3D ✨', time: '9:42', typeStart: 262, showAt: 322 },
];

export const CONVERSATION_DURATION = 372; // last showAt + tail

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
                <NeoMessage from="them" typing />
              </div>
            )}
          </div>
          <NeoInput value={inputValue} placeholder="Escribe un mensaje…" icon="plus" style={{ width: '100%' }} />
        </NeoCard>
      </AbsoluteFill>
    </NeoThemeProvider>
  );
}
