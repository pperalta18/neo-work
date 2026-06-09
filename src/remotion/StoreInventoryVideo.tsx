/**
 * StoreInventoryVideo — "Crea mi tienda online · te dejo mi inventario".
 * ──────────────────────────────────────────────────────────────────────────
 * Edited as a sequence of SHOTS with hard cuts (no zoom-in/zoom-out camera):
 *
 *   PLANO 1 · SALUDO    — the agent's "Hola, soy tu agente de AiKit" appears.
 *   PLANO 2 · PETICIÓN  — the composer fills in with «Crea mi tienda online»,
 *                         then sends.
 *   PLANO 3 · ADJUNTAR  — the inventory Excel drops into the composer and the
 *                         caption «Te dejo mi inventario» is typed.
 *   PLANO 4 · CHAT      — the file lands in the thread as a chat attachment
 *                         (+ caption) and the agent replies.
 *
 * Colour treatment follows ConversationVideo: the neumorphic lightTheme, with
 * NeoMessage bubbles (received = a surface-coloured raised plate so the relief
 * reads; sent = solid KIT blue) and a NeoInput composer. No card chrome, no
 * header bar — just the thread + composer, plus the AiKit mark as the agent's
 * avatar. The file glyph is an inline port of Tailark's `document-xlx`.
 *
 * Determinism: every pixel is a pure function of the (sequence-local) frame.
 */

import { type ReactNode } from 'react';
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from 'remotion';
import { lightTheme, KIT_BLUE, BRAND, elevation, TEXT_FONT } from '@/lib/neumorphism';
import { NeoThemeProvider } from '@/stories/neo/NeoTheme';
import { NeoMessage } from '@/stories/neo/NeoMessage';
import { NeoInput } from '@/stories/neo/NeoInput';
import { AikitLogo } from '@/components/AikitLogo';
import { Icon } from '@/components/icons';
import { CURVE, DUR, ease } from './motion';
import { Fonts, BODY_FONT } from './fonts';

const SURFACE = lightTheme.surface;
const INK = lightTheme.textStrong;
const MUTED = lightTheme.textMuted;
const LINE = lightTheme.gridLine;
const GREEN = BRAND.green;

// ── shot lengths (30 fps) ─────────────────────────────────────────────────────
const S1 = 70; //  greeting
const S2 = 74; //  compose the request
const S3 = 78; //  attach the inventory
const S4 = 112; // the chat: attachment lands + reply
export const STORE_INVENTORY_DURATION = S1 + S2 + S3 + S4; // 348

const clampE = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/** Letters revealed of `text` as the local frame crosses [start, end]. */
function typed(text: string, start: number, end: number, frame: number) {
  const n = Math.round(interpolate(frame, [start, end], [0, text.length], clampE));
  return text.slice(0, Math.max(0, n));
}

// ─────────────────────────────────────────────────────────────────────────────
export const StoreInventoryVideo: React.FC = () => {
  return (
    <NeoThemeProvider theme={lightTheme}>
      <AbsoluteFill style={{ backgroundColor: SURFACE, fontFamily: BODY_FONT }}>
        <Fonts />
        <Sequence durationInFrames={S1}>
          <ShotGreeting />
        </Sequence>
        <Sequence from={S1} durationInFrames={S2}>
          <ShotCompose />
        </Sequence>
        <Sequence from={S1 + S2} durationInFrames={S3}>
          <ShotAttach />
        </Sequence>
        <Sequence from={S1 + S2 + S3} durationInFrames={S4}>
          <ShotThread />
        </Sequence>
      </AbsoluteFill>
    </NeoThemeProvider>
  );
};

// ── PLANO 1 — the greeting ────────────────────────────────────────────────────
function ShotGreeting() {
  const frame = useCurrentFrame();
  const typing = frame < 14;
  // ease-out, no bounce — the agreed motion language (specs/motion-language.md)
  const pop = ease(frame, 14, 14 + DUR.reveal, CURVE.enter);

  return (
    <Stage scale={1.5}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, width: 560 }}>
        <Avatar />
        <div style={{ flex: 1, display: 'flex' }}>
          {typing ? (
            <NeoMessage from="them" typing />
          ) : (
            <div style={{ opacity: clamp01(pop * 1.4), transform: `translateY(${(1 - pop) * 14}px) scale(${0.97 + 0.03 * pop})` }}>
              <NeoMessage from="them">Hola 👋 Soy tu agente de AiKit. ¿Qué montamos hoy?</NeoMessage>
            </div>
          )}
        </div>
      </div>
    </Stage>
  );
}

// ── PLANO 2 — composing the request ───────────────────────────────────────────
function ShotCompose() {
  const frame = useCurrentFrame();
  const SEND = 52;
  const value = frame < SEND ? typed('Crea mi tienda online', 5, 46, frame) : '';
  const sent = ease(frame, SEND, SEND + DUR.reveal, CURVE.enter);
  const drift = interpolate(frame, [0, S2], [-5, 5], clampE); // a gentle pan

  return (
    <Stage scale={1.45}>
      <div style={{ width: 560, transform: `translateX(${drift}px)`, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {/* full-width row: the bubble's 78% cap resolves against 560 (no wrap) and pins flush to the input's right edge */}
        <div style={{ minHeight: 56, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {frame >= SEND && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: clamp01(sent * 1.5), transform: `translateY(${(1 - sent) * 20}px)` }}>
              <NeoMessage from="me">Crea mi tienda online</NeoMessage>
            </div>
          )}
        </div>
        <NeoInput value={value} placeholder="Escribe un mensaje…" icon="plus" style={{ width: '100%' }} />
      </div>
    </Stage>
  );
}

// ── PLANO 3 — attaching the inventory ─────────────────────────────────────────
function ShotAttach() {
  const frame = useCurrentFrame();
  const value = typed('Te dejo mi inventario', 26, 68, frame);
  const drop = ease(frame, 4, 4 + DUR.reveal, CURVE.enter);
  const drift = interpolate(frame, [0, S3], [5, -5], clampE);

  return (
    <Stage scale={1.45}>
      <div style={{ width: 560, transform: `translateX(${drift}px)`, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ alignSelf: 'flex-start', opacity: drop, transform: `translateY(${(1 - drop) * 14}px) scale(${0.94 + 0.06 * drop})` }}>
          <ComposerChip />
        </div>
        <NeoInput value={value} placeholder="Añade un mensaje…" icon="plus" style={{ width: '100%' }} />
      </div>
    </Stage>
  );
}

// ── PLANO 4 — the chat: attachment lands + the agent replies ───────────────────
function ShotThread() {
  const frame = useCurrentFrame();
  const land = ease(frame, 0, DUR.reveal, CURVE.enter);
  const caption = ease(frame, 8, 8 + DUR.reveal, CURVE.enter);
  const replyTyping = frame >= 26 && frame < 64;
  const reply = ease(frame, 64, 64 + DUR.reveal, CURVE.enter);

  return (
    <Stage scale={1.16}>
      <div style={{ width: 780, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* context — already happened */}
        <Row from="them">
          <NeoMessage from="them">Hola 👋 Soy tu agente de AiKit. ¿Qué montamos hoy?</NeoMessage>
        </Row>
        <NeoMessage from="me">Crea mi tienda online</NeoMessage>

        {/* the file, as a chat attachment */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ opacity: clamp01(land * 1.4), transform: `translateY(${(1 - land) * 18}px) scale(${0.96 + 0.04 * land})`, transformOrigin: 'bottom right' }}>
            <FileAttachment />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', opacity: clamp01(caption * 1.4), transform: `translateY(${(1 - caption) * 14}px)` }}>
          <NeoMessage from="me">Te dejo mi inventario 📊</NeoMessage>
        </div>

        {/* the agent reads it */}
        {replyTyping && (
          <Row from="them">
            <NeoMessage from="them" typing />
          </Row>
        )}
        {frame >= 64 && (
          <Row from="them">
            <div style={{ opacity: clamp01(reply * 1.4), transform: `translateY(${(1 - reply) * 14}px)` }}>
              <NeoMessage from="them">Genial 🙌 Estoy leyendo tu inventario y montando tu tienda online…</NeoMessage>
            </div>
          </Row>
        )}
      </div>
    </Stage>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared building blocks.
// ─────────────────────────────────────────────────────────────────────────────

/** Centres + scales a shot's content in the frame (the per-shot framing). */
function Stage({ scale = 1, children }: { scale?: number; children: ReactNode }) {
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: '50% 50%' }}>{children}</div>
    </AbsoluteFill>
  );
}

/** A received chat row: the agent avatar + its bubble. */
function Row({ from, children }: { from: 'me' | 'them'; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 11, justifyContent: from === 'me' ? 'flex-end' : 'flex-start' }}>
      {from === 'them' && <Avatar size={34} />}
      {children}
    </div>
  );
}

/** The AiKit mark on a neumorphic tile — the agent's avatar (not a header). */
function Avatar({ size = 40 }: { size?: number }) {
  const plate = elevation(lightTheme, { depth: 'raised', distance: 4, blur: 10, radius: Math.round(size * 0.32) });
  return (
    <div
      style={{
        ...plate,
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AikitLogo variant="mark" height={Math.round(size * 0.46)} markColor={KIT_BLUE} />
    </div>
  );
}

/** The compact file chip shown inside the composer while attaching. */
function ComposerChip() {
  const plate = elevation(lightTheme, { depth: 'raised', distance: 3, blur: 9, radius: 16 });
  return (
    <div style={{ ...plate, display: 'inline-flex', alignItems: 'center', gap: 11, padding: '9px 13px 9px 9px', fontFamily: TEXT_FONT }}>
      <XlsSheet size={36} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: INK }}>Inventario.xlsx</span>
        <span style={{ fontSize: 12, color: MUTED }}>Hoja de cálculo · 86 KB</span>
      </div>
      <div
        style={{
          ...elevation(lightTheme, { depth: 'recessed', distance: 2, blur: 5, radius: 999 }),
          width: 22,
          height: 22,
          marginLeft: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="close" size={12} color={MUTED} strokeWidth={2} />
      </div>
    </div>
  );
}

/** The sent file as a chat attachment: a neumorphic plate + the Excel glyph. */
function FileAttachment() {
  const plate = elevation(lightTheme, { depth: 'raised', distance: 5, blur: 12, radius: 20 });
  return (
    <div
      style={{
        ...plate,
        borderBottomRightRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        maxWidth: 440,
        padding: '14px 18px',
        fontFamily: TEXT_FONT,
      }}
    >
      <XlsSheet size={54} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 16, fontWeight: 600, color: INK }}>Inventario.xlsx</span>
        <span style={{ fontSize: 13.5, color: MUTED }}>Hoja de cálculo · 1.248 artículos</span>
      </div>
    </div>
  );
}

/**
 * XlsSheet — a small spreadsheet glyph derived from Tailark's `document-xlx`,
 * recoloured to our palette: a white sheet with a beveled top-right corner, a
 * brand-green header row over our gridlines, and a green XLS badge.
 */
function XlsSheet({ size = 54 }: { size?: number }) {
  const w = size;
  const h = Math.round(size * 1.16);
  const pad = Math.round(size * 0.14);
  const bevel = Math.round(size * 0.32);
  const gap = Math.max(1.5, size * 0.03);
  const cellH = Math.max(3, Math.round(size * 0.12));
  const badge = Math.max(8, Math.round(size * 0.17));

  return (
    <div style={{ position: 'relative', width: w, height: h, flexShrink: 0 }}>
      <div
        style={{
          width: w,
          height: h,
          boxSizing: 'border-box',
          padding: pad,
          background: '#fff',
          border: `1px solid ${LINE}`,
          borderRadius: Math.round(size * 0.14),
          borderTopRightRadius: bevel,
          boxShadow: '0 3px 9px rgba(40,50,70,0.12)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap,
            background: LINE,
            padding: gap,
            borderRadius: 4,
            borderTopRightRadius: Math.round(bevel * 0.55),
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`h${i}`} style={{ height: cellH, background: GREEN, borderRadius: 1.5 }} />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={`b${i}`} style={{ height: cellH, background: '#fff', borderRadius: 1.5 }} />
          ))}
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          right: -Math.round(size * 0.1),
          bottom: Math.round(size * 0.12),
          background: GREEN,
          color: '#fff',
          fontSize: badge,
          fontWeight: 700,
          letterSpacing: 0.4,
          padding: `${Math.round(size * 0.03)}px ${Math.round(size * 0.1)}px`,
          borderRadius: 5,
          lineHeight: 1,
          boxShadow: '0 3px 8px rgba(11,122,35,0.3)',
          fontFamily: TEXT_FONT,
        }}
      >
        XLS
      </div>
    </div>
  );
}
