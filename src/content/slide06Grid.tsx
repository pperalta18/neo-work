import { Cell } from '@/components/Cell'
import { Chevron, Label } from '@/components/content'
import { Grid } from '@/components/Grid'
import type { NeoTheme } from '@/lib/neumorphism'

/**
 * "06 Grid" — reproduction of the Figma light-mode reference, built entirely
 * with the composition system. This is the test: a 10×8 grid of cells with
 * empty raised plates, images spanning cells, text plates spanning 3 columns,
 * and icon plates.
 *
 * Adding content is just adding a <Cell> — that's the "ahora ponemos esto" API.
 */

// Scattered empty raised plates, [col, row] (1-indexed).
const RAISED: Array<[number, number]> = [
  [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1],
  [1, 2], [5, 2], [6, 2],
  [1, 3], [2, 3], [3, 3], [4, 3], [6, 3],
  [1, 4], [2, 4],
  [1, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5], [10, 5],
  [1, 6], [2, 6], [6, 6], [7, 6], [8, 6], [9, 6], [10, 6],
  [1, 7], [7, 7], [8, 7], [9, 7], [10, 7],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 8], [7, 8], [8, 8], [9, 8],
]

// Pressed / recessed plates — the inverse elevation (carved into the surface).
const PRESSED: Array<[number, number]> = [
  [3, 6], [4, 6], [5, 6],
]

export function Slide06Grid({ theme }: { theme: NeoTheme }) {
  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {/* Title plate, centred near the top. */}
      <div style={{ position: 'absolute', left: 808, top: 120 }}>
        <Grid columns={3} rows={1} cell={101} gridlines={false} theme={theme}>
          <Cell col={1} row={1} colSpan={3}>
            <Label muted="06">Grid</Label>
          </Cell>
        </Grid>
      </div>

      {/* Main composition grid: 10 columns × 8 rows of 128px cells. */}
      <div style={{ position: 'absolute', left: 323, top: 315 }}>
        <Grid columns={10} rows={8} cell={128} theme={theme}>
          {RAISED.map(([col, row]) => (
            <Cell key={`r-${col}-${row}`} col={col} row={row} />
          ))}
          {PRESSED.map(([col, row]) => (
            <Cell key={`p-${col}-${row}`} col={col} row={row} depth="recessed" />
          ))}

          {/* Images spanning cells */}
          <Cell
            col={2}
            row={2}
            colSpan={2}
            variant="image"
            background="linear-gradient(120deg, #1a0f2e 0%, #6d3bd1 45%, #ff7ac6 100%)"
          />
          <Cell
            col={10}
            row={2}
            variant="image"
            background="linear-gradient(90deg, #3a1d0a 0%, #ff9b3d 50%, #ffe39a 100%)"
          />

          {/* Text plates spanning 3 columns */}
          <Cell col={7} row={3} colSpan={3} align="center">
            <Label muted="20:00">David William Wood</Label>
          </Cell>
          <Cell col={3} row={4} colSpan={3} align="center">
            <Label muted="20:00">Pablo Yusta</Label>
          </Cell>
          <Cell col={3} row={7} colSpan={3} align="center">
            <Label muted="20:00">Eliana Martin</Label>
          </Cell>

          {/* Icon plates */}
          <Cell col={7} row={4}>
            <Chevron dir="up" />
          </Cell>
          <Cell col={10} row={4}>
            <Chevron dir="down" />
          </Cell>
          <Cell col={6} row={4}>
            <Chevron dir="up" />
          </Cell>
        </Grid>
      </div>
    </div>
  )
}
