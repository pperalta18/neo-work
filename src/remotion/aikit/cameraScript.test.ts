import { describe, expect, it } from 'vitest'
import {
  type CameraFraming,
  DEFAULT_CAM_TRAVEL,
  cameraPose,
  cameraTransform,
  camTravelWindow,
  driftedPose,
  validateCameraRig,
} from './cameraScript'

const RIG: CameraFraming[] = [
  { at: 0, zoom: 1.2, fx: 400, fy: 500 },
  { at: 100, zoom: 1.0, fx: 960, fy: 540, travel: 30 },
  { at: 200, zoom: 0.9, fx: 700, fy: 600, travel: 40 },
]

describe('camTravelWindow', () => {
  it('collapses for the first framing', () => {
    expect(camTravelWindow(RIG, 0)).toEqual({ start: 0, end: 0 })
  })

  it('ends at the arrival and starts travel frames before', () => {
    expect(camTravelWindow(RIG, 1)).toEqual({ start: 70, end: 100 })
  })

  it('clamps to the previous arrival when the travel does not fit', () => {
    const tight: CameraFraming[] = [
      { at: 0, zoom: 1, fx: 0, fy: 0 },
      { at: 10, zoom: 1, fx: 100, fy: 0, travel: 50 },
    ]
    expect(camTravelWindow(tight, 1)).toEqual({ start: 0, end: 10 })
  })
})

describe('cameraPose', () => {
  it('rests on a framing at and after its arrival', () => {
    for (const f of [100, 120, 159]) {
      const p = cameraPose(RIG, f)
      expect(p).toEqual({ zoom: 1.0, fx: 960, fy: 540, moving: 0 })
    }
  })

  it('holds the first framing before any move', () => {
    expect(cameraPose(RIG, 0)).toEqual({ zoom: 1.2, fx: 400, fy: 500, moving: 0 })
    expect(cameraPose(RIG, 69)).toEqual({ zoom: 1.2, fx: 400, fy: 500, moving: 0 })
  })

  it('interpolates linearly mid-move with the default ease', () => {
    const p = cameraPose(RIG, 85) // halfway through [70, 100]
    expect(p.zoom).toBeCloseTo(1.1)
    expect(p.fx).toBeCloseTo(680)
    expect(p.fy).toBeCloseTo(520)
    expect(p.moving).toBeCloseTo(1)
  })

  it('applies the provided ease to the move', () => {
    const square = (t: number) => t * t
    const p = cameraPose(RIG, 85, square)
    expect(p.fx).toBeCloseTo(400 + (960 - 400) * 0.25)
  })

  it('rests past the last framing', () => {
    expect(cameraPose(RIG, 9999)).toEqual({ zoom: 0.9, fx: 700, fy: 600, moving: 0 })
  })

  it('returns a neutral pose for an empty rig', () => {
    expect(cameraPose([], 10)).toEqual({ zoom: 1, fx: 0, fy: 0, moving: 0 })
  })
})

describe('cameraTransform', () => {
  it('centres the focus point on the screen', () => {
    // zoom 2 about the stage centre, focusing (760, 440):
    // translate = zoom * (centre − focus) = 2*(960−760), 2*(540−440)
    expect(cameraTransform({ zoom: 2, fx: 760, fy: 440 })).toBe(
      'translate(400px, 200px) scale(2)',
    )
  })

  it('is identity at zoom 1 on the stage centre', () => {
    expect(cameraTransform({ zoom: 1, fx: 960, fy: 540 })).toBe(
      'translate(0px, 0px) scale(1)',
    )
  })
})

describe('driftedPose', () => {
  it('keeps the drift within a whisper of the pose', () => {
    const base = { zoom: 1, fx: 500, fy: 500, moving: 0 }
    for (const f of [0, 31, 250, 997]) {
      const d = driftedPose(base, f)
      expect(Math.abs(d.zoom - 1)).toBeLessThanOrEqual(0.004)
      expect(Math.abs(d.fx - 500)).toBeLessThanOrEqual(6)
      expect(Math.abs(d.fy - 500)).toBeLessThanOrEqual(3.2)
    }
  })

  it('damps the positional drift mid-move', () => {
    const still = driftedPose({ zoom: 1, fx: 500, fy: 500, moving: 0 }, 31)
    const moving = driftedPose({ zoom: 1, fx: 500, fy: 500, moving: 1 }, 31)
    expect(Math.abs(moving.fx - 500)).toBeLessThan(Math.abs(still.fx - 500))
  })

  it('is deterministic per frame', () => {
    const base = { zoom: 1, fx: 0, fy: 0, moving: 0.5 }
    expect(driftedPose(base, 123)).toEqual(driftedPose(base, 123))
  })
})

describe('validateCameraRig', () => {
  it('accepts a well-formed rig', () => {
    expect(validateCameraRig(RIG)).toEqual([])
  })

  it('rejects unordered arrivals', () => {
    const bad: CameraFraming[] = [
      { at: 50, zoom: 1, fx: 0, fy: 0 },
      { at: 50, zoom: 1, fx: 10, fy: 0 },
    ]
    expect(validateCameraRig(bad)).toHaveLength(1)
  })

  it('rejects a travel that does not fit its gap', () => {
    const bad: CameraFraming[] = [
      { at: 0, zoom: 1, fx: 0, fy: 0 },
      { at: 20, zoom: 1, fx: 10, fy: 0, travel: DEFAULT_CAM_TRAVEL },
    ]
    expect(validateCameraRig(bad)).toHaveLength(1)
  })

  it('rejects non-positive zooms', () => {
    expect(validateCameraRig([{ at: 0, zoom: 0, fx: 0, fy: 0 }])).toHaveLength(1)
  })
})
