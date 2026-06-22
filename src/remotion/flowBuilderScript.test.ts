import { describe, expect, it } from 'vitest'
import { validateCameraRig } from './aikit/cameraScript'
import {
  BLOCKS,
  BUILD_END,
  FLOW_ANCHORS,
  FLOW_CAM,
  FLOW_BUILDER_DURATION,
  NB,
  blockStart,
  cardStartFrame,
  cardSettleFrame,
  connectorPath,
} from './flowBuilderScript'

describe('the camera rig', () => {
  it('validates and has one framing per block plus the pull-back', () => {
    expect(validateCameraRig(FLOW_CAM)).toEqual([])
    expect(FLOW_CAM).toHaveLength(NB + 1)
  })
})

describe('the flow is a deep, real branching automation', () => {
  it('has grown well past the original (≥ 11 blocks)', () => {
    expect(NB).toBeGreaterThanOrEqual(11)
  })

  it('expresses TWO conditionals (a Filtro on each side) plus the Rutas split', () => {
    expect(BLOCKS.filter((b) => b.kind === 'filter')).toHaveLength(2)
    const paths = BLOCKS.findIndex((b) => b.kind === 'paths')
    expect(paths).toBeGreaterThanOrEqual(0)
    const branches = BLOCKS.filter((b) => b.parent === paths)
    expect(branches).toHaveLength(2)
    expect(branches.every((b) => Boolean(b.branchLabel))).toBe(true)
  })

  it('uses concrete blocks, not abstractions', () => {
    const apps = new Set(BLOCKS.map((b) => b.app))
    for (const app of ['Gmail', 'Filtro', 'Rutas', 'HubSpot', 'Slack', 'Google Sheets', 'Trello']) {
      expect(apps.has(app)).toBe(true)
    }
  })

  it('every non-trigger block has a parent built before it and an incoming wire', () => {
    BLOCKS.forEach((b, i) => {
      if (b.kind === 'trigger') {
        expect(b.parent).toBe(-1)
        expect(connectorPath(i)).toBeNull()
      } else {
        expect(b.parent).toBeGreaterThanOrEqual(0)
        expect(b.parent).toBeLessThan(i) // topological build order
        expect(connectorPath(i)).toMatch(/^M /)
      }
    })
  })

  it('the nested filter sits inside a branch, after a path head', () => {
    const nested = BLOCKS.find((b) => b.id === 'b2')
    expect(nested?.kind).toBe('filter')
    expect(BLOCKS[nested!.parent].id).toBe('b1')
  })
})

describe('the build is ordered, causal — and at least twice as long', () => {
  it('cards form after their wire starts and after their parent has settled', () => {
    for (let k = 0; k < NB; k++) {
      expect(FLOW_ANCHORS[k].plateAt).toBeGreaterThanOrEqual(FLOW_ANCHORS[k].connStart)
      const parent = BLOCKS[k].parent
      if (parent >= 0) {
        expect(blockStart(k)).toBeGreaterThan(cardStartFrame(parent))
      }
    }
  })

  it('builds the whole tree before BUILD_END', () => {
    expect(cardSettleFrame(NB - 1)).toBeLessThanOrEqual(BUILD_END)
  })

  it('the build runs more than twice the previous 434-frame version', () => {
    const buildSpan = BUILD_END - blockStart(0)
    expect(buildSpan).toBeGreaterThanOrEqual(2 * 434)
  })

  it('the composition holds past the build for the pull-back', () => {
    expect(FLOW_BUILDER_DURATION).toBeGreaterThan(BUILD_END)
  })
})
