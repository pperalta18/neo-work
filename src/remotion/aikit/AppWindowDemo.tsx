import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { AppWindow } from './AppWindow'
import { appWindowTimeline } from './windowScript'
import { CAST } from './cast'

/** TEMP — visual smoke check for AppWindow; not part of the event deck.
 * Three windows, one per entrance: draw/pen · rise · draw/hairline. */

const ENTER_A = 8 // CRM — draw, pen
const ENTER_B = 56 // browser — rise
const ENTER_C = 96 // plain app — draw, hairline

export const APP_WINDOW_DEMO_DURATION =
  appWindowTimeline('draw', ENTER_C).settledAt + 45

export function AppWindowDemo() {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: lightTheme.surface,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 48,
        fontFamily: BODY_FONT,
      }}
    >
      <Fonts />
      <AppWindow
        title="CRM · Clientes"
        icon="user"
        width={560}
        height={420}
        enter="draw"
        enterAt={ENTER_A}
      >
        <Skeleton rows={5} />
      </AppWindow>
      <AppWindow
        title={CAST.company}
        icon="global"
        url="aikit.es"
        width={560}
        height={420}
        enter="rise"
        enterAt={ENTER_B}
      >
        <Skeleton rows={4} hero />
      </AppWindow>
      <AppWindow
        title="Presupuesto"
        icon="check"
        width={560}
        height={420}
        enter="draw"
        traceStyle="hairline"
        enterAt={ENTER_C}
      >
        <Skeleton rows={6} />
      </AppWindow>
    </AbsoluteFill>
  )
}

/** Soft placeholder page — stand-in for real app content. */
function Skeleton({ rows, hero = false }: { rows: number; hero?: boolean }) {
  const muted = lightTheme.textMuted
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {hero && (
        <div
          style={{
            height: 64,
            borderRadius: 12,
            background: 'linear-gradient(120deg, #3f80f6, #5aa6ff)',
            opacity: 0.9,
          }}
        />
      )}
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          style={{
            height: i === 0 && !hero ? 14 : 10,
            width: `${[72, 100, 92, 84, 96, 60][i % 6]}%`,
            borderRadius: 6,
            background: muted,
            opacity: i === 0 && !hero ? 0.34 : 0.22,
          }}
        />
      ))}
    </div>
  )
}
