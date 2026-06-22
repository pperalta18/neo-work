import type { ComponentType } from 'react'
import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { elevation, lightTheme, DISPLAY_FONT } from '@/lib/neumorphism'
import { DUR, ease } from '../motion'
import { Fonts, BODY_FONT } from '../fonts'
import { ChatPanelDemo, CHAT_PANEL_DEMO_DURATION } from './ChatPanelDemo'
import { AppWindowDemo, APP_WINDOW_DEMO_DURATION } from './AppWindowDemo'
import { ScriptedCursorDemo, SCRIPTED_CURSOR_DEMO_DURATION } from './ScriptedCursorDemo'
import { ProgramRunnerDemo, PROGRAM_RUNNER_DEMO_DURATION } from './ProgramRunnerDemo'
import { BaGraphDemo, BA_GRAPH_DEMO_DURATION } from './BaGraphDemo'
import { NotificationToastDemo, NOTIFICATION_TOAST_DEMO_DURATION } from './NotificationToastDemo'
import { WorkspaceTileDemo, WORKSPACE_TILE_DEMO_DURATION } from './WorkspaceTileDemo'
import { WidgetKitDemo, WIDGET_KIT_DEMO_DURATION } from './WidgetKitDemo'
import { type GalleryChapterSpec, gallerySchedule, galleryStills } from './galleryScript'

/** TEMP — the Phase-1 smoke story: the eight kit demos folded into ONE
 * chaptered composition (hard cuts, a chapter chip naming what to check) so
 * the whole shared kit is validated visually with a handful of stills.
 * Not part of the event deck — Phase 4 retires it together with the demos. */

const theme = lightTheme

type Chapter = GalleryChapterSpec & { Scene: ComponentType }

const CHAPTERS: Chapter[] = [
  {
    id: 'chat',
    title: 'ChatPanel',
    note: 'tecleo letra a letra · typing bubble',
    duration: CHAT_PANEL_DEMO_DURATION,
    Scene: ChatPanelDemo,
  },
  {
    id: 'window',
    title: 'AppWindow',
    note: 'chrome + viewport recessed · entrada GridDrawIn',
    duration: APP_WINDOW_DEMO_DURATION,
    Scene: AppWindowDemo,
  },
  {
    id: 'cursor',
    title: 'ScriptedCursor',
    note: 'waypoints · glifos · press + ripple',
    duration: SCRIPTED_CURSOR_DEMO_DURATION,
    Scene: ScriptedCursorDemo,
  },
  {
    id: 'program',
    title: 'ProgramRunner',
    note: 'tempo paramétrico · holds · scroll-follow',
    duration: PROGRAM_RUNNER_DEMO_DURATION,
    Scene: ProgramRunnerDemo,
  },
  {
    id: 'graph',
    title: 'BaGraph',
    note: 'ignite + aristas comet · 3 → 40+ nodos',
    duration: BA_GRAPH_DEMO_DURATION,
    Scene: BaGraphDemo,
  },
  {
    id: 'toast',
    title: 'NotificationToast',
    note: 'cascada · desplazamiento de pila',
    duration: NOTIFICATION_TOAST_DEMO_DURATION,
    Scene: NotificationToastDemo,
  },
  {
    id: 'tile',
    title: 'WorkspaceTile',
    note: 'ignite + avatares · morph pantalla → tile',
    duration: WORKSPACE_TILE_DEMO_DURATION,
    Scene: WorkspaceTileDemo,
  },
  {
    id: 'widgets',
    title: 'Widget ports',
    note: 'sheet · inbox · mes · curva · stat · factura',
    duration: WIDGET_KIT_DEMO_DURATION,
    Scene: WidgetKitDemo,
  },
]

export const KIT_GALLERY_SCHEDULE = gallerySchedule(CHAPTERS)
export const KIT_GALLERY_DURATION = KIT_GALLERY_SCHEDULE.total
/** The smoke contract: render these frames to validate the whole kit. */
export const KIT_GALLERY_STILLS = galleryStills(KIT_GALLERY_SCHEDULE)

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Bottom-left chapter label; frame-relative to its Sequence. */
function ChapterChip({ index, title, note }: { index: number; title: string; note?: string }) {
  const frame = useCurrentFrame()
  const enter = ease(frame, 4, 4 + DUR.reveal)
  return (
    <div
      style={{
        position: 'absolute',
        left: 28,
        bottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px 12px 12px',
        ...elevation(theme, { depth: 'raised', distance: 5, blur: 12, radius: 16 }),
        opacity: enter,
        transform: `translateY(${(1 - enter) * 14}px)`,
        fontFamily: BODY_FONT,
      }}
    >
      <div
        style={{
          ...elevation(theme, { depth: 'recessed', distance: 3, blur: 6, radius: 10 }),
          padding: '8px 12px',
          fontFamily: DISPLAY_FONT,
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: '0.04em',
          color: theme.textMuted,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {pad2(index + 1)} / {pad2(CHAPTERS.length)}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 17, color: theme.textStrong }}>{title}</div>
        {note ? (
          <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{note}</div>
        ) : null}
      </div>
    </div>
  )
}

export function KitGallery() {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT }}>
      <Fonts />
      {KIT_GALLERY_SCHEDULE.entries.map((entry) => {
        const { Scene } = CHAPTERS[entry.index]
        return (
          <Sequence
            key={entry.spec.id}
            from={entry.startAt}
            durationInFrames={entry.endAt - entry.startAt}
            name={`${pad2(entry.index + 1)} ${entry.spec.title}`}
          >
            <Scene />
            <ChapterChip index={entry.index} title={entry.spec.title} note={entry.spec.note} />
          </Sequence>
        )
      })}
    </AbsoluteFill>
  )
}
