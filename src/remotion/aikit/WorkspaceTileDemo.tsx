import { AbsoluteFill } from 'remotion'
import { lightTheme } from '@/lib/neumorphism'
import { Fonts, BODY_FONT } from '../fonts'
import { CAST } from './cast'
import {
  TILE_SIZE,
  type TileMorphSpec,
  tileCascade,
  tileMorphSettledAt,
  tileSettledAt,
  validateTileMorph,
} from './tileScript'
import { TileMorph, WorkspaceTile } from './WorkspaceTile'

/** TEMP — visual smoke check for WorkspaceTile/TileMorph; not part of the
 * event deck. Rehearses both Prod04 beats: a panel row where shared tiles
 * ignite in cascade (avatar chips popping in), and a screen folding down into
 * the row's next slot (Prod03's pantalla→nodo gesture, the InventoryTable
 * outro as a kit piece). */

const ROW_X = 200
const ROW_Y = 620
const PITCH = 200

type DemoTile = { label: string; module?: string; people: readonly string[] }

const TILES = tileCascade<DemoTile>(
  [
    { label: 'Caducidades', module: 'hotpot', people: [CAST.manolo, CAST.owner] },
    { label: 'Pedidos', module: 'teamwork', people: [CAST.manolo, CAST.laura, CAST.owner] },
    { label: 'Almacén', people: [CAST.manolo] },
  ],
  { startAt: 24, stagger: 12 },
)

const MORPH: TileMorphSpec = {
  from: { x: 980, y: 150, width: 640, height: 400 },
  to: { x: ROW_X + 3 * PITCH + TILE_SIZE / 2, y: ROW_Y + TILE_SIZE / 2 },
  startAt: 130,
}
const MORPH_PEOPLE = [CAST.laura, CAST.owner]

const issues = validateTileMorph(MORPH)
if (issues.length > 0) {
  throw new Error(`WorkspaceTileDemo morph invalid:\n${issues.join('\n')}`)
}

export const WORKSPACE_TILE_DEMO_DURATION =
  Math.max(
    ...TILES.map((t) => tileSettledAt(t.at, t.people?.length ?? 0)),
    tileMorphSettledAt(MORPH, MORPH_PEOPLE.length),
  ) + 50

/** The screen being folded down — a quiet fake sheet (title + muted rows). */
function FakeScreen() {
  const theme = lightTheme
  const bars = [0.86, 0.62, 0.74, 0.5, 0.68, 0.42]
  return (
    <div style={{ padding: '30px 34px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <span style={{ fontSize: 21, fontWeight: 600, letterSpacing: -0.2, color: theme.textStrong }}>
        Previsión de stock
      </span>
      <span style={{ fontSize: 13, color: theme.textMuted, marginTop: -8 }}>
        {CAST.company} · borrador
      </span>
      {bars.map((w, i) => (
        <div
          key={i}
          style={{
            width: `${w * 100}%`,
            height: 15,
            borderRadius: 8,
            background: `${theme.textMuted}26`,
          }}
        />
      ))}
    </div>
  )
}

export function WorkspaceTileDemo() {
  const theme = lightTheme
  return (
    <AbsoluteFill style={{ backgroundColor: theme.surface, fontFamily: BODY_FONT }}>
      <Fonts />

      <div
        style={{
          position: 'absolute',
          top: 64,
          left: ROW_X,
          fontSize: 13,
          letterSpacing: 1.6,
          textTransform: 'uppercase',
          color: theme.textMuted,
        }}
      >
        WorkspaceTile · ignite + avatar-stack · TileMorph pantalla→tile
      </div>

      {/* The workspace panel row — three shared tiles ignite in cascade. */}
      {TILES.map((t, i) => (
        <div key={i} style={{ position: 'absolute', left: ROW_X + i * PITCH, top: ROW_Y }}>
          <WorkspaceTile at={t.at} label={t.label} module={t.module} people={t.people} />
        </div>
      ))}

      {/* The screen folding down into the row's fourth slot. */}
      <TileMorph spec={MORPH} label="Previsión" module="foresight" people={MORPH_PEOPLE}>
        <FakeScreen />
      </TileMorph>
    </AbsoluteFill>
  )
}
