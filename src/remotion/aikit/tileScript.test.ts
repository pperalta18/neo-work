import { describe, expect, it } from 'vitest'
import { IGNITE_SETTLED } from './graphScript'
import {
  AVATAR_LEAD,
  AVATAR_POP,
  AVATAR_STAGGER,
  SCREEN_RELIEF,
  TILE_BLUR,
  TILE_DIST,
  TILE_MORPH,
  TILE_MORPH_SETTLE,
  TILE_RADIUS,
  TILE_SIZE,
  type TileMorphSpec,
  avatarPop,
  tileCascade,
  tileIgnitePose,
  tileMorphGlyphStart,
  tileMorphPose,
  tileMorphSettledAt,
  tileSettledAt,
  validateTileMorph,
} from './tileScript'

describe('tileIgnitePose', () => {
  it('is invisible before its ignite frame', () => {
    const pose = tileIgnitePose(10, 40)
    expect(pose.opacity).toBe(0)
    expect(pose.emerge).toBe(0)
    expect(pose.content).toBe(0)
  })

  it('settles exactly at the tile relief (the InventoryTable tile end-state)', () => {
    // Guards drift: if graphScript's ignitePose rest values change, the remap
    // must change with them or morph-landed and ignited tiles diverge.
    const pose = tileIgnitePose(10_000, 40)
    expect(pose.distance).toBeCloseTo(TILE_DIST, 6)
    expect(pose.blur).toBeCloseTo(TILE_BLUR, 6)
    expect(pose.opacity).toBe(1)
    expect(pose.content).toBe(1)
    expect(pose.scale).toBe(1)
  })

  it('over-swells past the rest relief before settling (follow-through)', () => {
    let peak = 0
    for (let f = 40; f <= 40 + IGNITE_SETTLED; f++) {
      peak = Math.max(peak, tileIgnitePose(f, 40).distance)
    }
    expect(peak).toBeGreaterThan(TILE_DIST)
  })

  it('is fully lit by at + IGNITE_SETTLED', () => {
    const pose = tileIgnitePose(40 + IGNITE_SETTLED, 40)
    expect(pose.opacity).toBe(1)
    expect(pose.content).toBeCloseTo(1, 6)
  })
})

describe('avatarPop', () => {
  const AT = 30

  it('avatar 0 stays at 0 until at + AVATAR_LEAD, hits 1 after its pop', () => {
    expect(avatarPop(AT + AVATAR_LEAD - 1, AT, 0)).toBe(0)
    expect(avatarPop(AT + AVATAR_LEAD, AT, 0)).toBe(0)
    expect(avatarPop(AT + AVATAR_LEAD + AVATAR_POP, AT, 0)).toBe(1)
    expect(avatarPop(10_000, AT, 0)).toBe(1)
  })

  it('staggers: earlier chips are always at least as far along', () => {
    for (let f = AT; f < AT + AVATAR_LEAD + 5 * AVATAR_STAGGER + AVATAR_POP; f++) {
      for (let i = 0; i < 4; i++) {
        expect(avatarPop(f, AT, i)).toBeGreaterThanOrEqual(avatarPop(f, AT, i + 1))
      }
    }
    // strictly ahead mid-pop
    const mid = AT + AVATAR_LEAD + AVATAR_STAGGER + 2
    expect(avatarPop(mid, AT, 0)).toBeGreaterThan(avatarPop(mid, AT, 1))
  })

  it('grows monotonically frame by frame', () => {
    let prev = -1
    for (let f = AT - 2; f <= AT + AVATAR_LEAD + AVATAR_POP + 2; f++) {
      const cur = avatarPop(f, AT, 0)
      expect(cur).toBeGreaterThanOrEqual(prev)
      prev = cur
    }
  })
})

describe('tileSettledAt', () => {
  it('with no people it is the ignite settle', () => {
    expect(tileSettledAt(40)).toBe(40 + IGNITE_SETTLED)
    expect(tileSettledAt(40, 0)).toBe(40 + IGNITE_SETTLED)
  })

  it('a crowd of avatars pushes the settle past the ignite', () => {
    const at = 40
    const three = tileSettledAt(at, 3)
    expect(three).toBe(at + AVATAR_LEAD + 2 * AVATAR_STAGGER + AVATAR_POP)
    expect(three).toBeGreaterThan(at + IGNITE_SETTLED)
    // and everything really is at rest there
    for (let i = 0; i < 3; i++) expect(avatarPop(three, at, i)).toBe(1)
    expect(tileIgnitePose(three, at).content).toBeCloseTo(1, 6)
  })

  it('one avatar still lands inside the ignite settle window', () => {
    expect(tileSettledAt(40, 1)).toBe(40 + IGNITE_SETTLED)
  })
})

describe('tileCascade', () => {
  it('assigns staggered ignite frames and keeps the tile fields', () => {
    const tiles = tileCascade(
      [{ label: 'Caducidades' }, { label: 'Pedidos' }, { label: 'Almacén' }],
      { startAt: 24, stagger: 10 },
    )
    expect(tiles.map((t) => t.at)).toEqual([24, 34, 44])
    expect(tiles.map((t) => t.label)).toEqual(['Caducidades', 'Pedidos', 'Almacén'])
  })

  it('defaults to startAt 0, stagger 12', () => {
    const tiles = tileCascade([{}, {}, {}])
    expect(tiles.map((t) => t.at)).toEqual([0, 12, 24])
  })
})

describe('tileMorphPose', () => {
  const SPEC: TileMorphSpec = {
    from: { x: 900, y: 120, width: 640, height: 400 },
    to: { x: 300, y: 800 },
    startAt: 100,
  }

  it('before startAt the pose IS the source rect at rest', () => {
    const pose = tileMorphPose(SPEC, 0)
    expect(pose.x).toBe(900)
    expect(pose.y).toBe(120)
    expect(pose.width).toBe(640)
    expect(pose.height).toBe(400)
    expect(pose.radius).toBe(SCREEN_RELIEF.radius)
    expect(pose.distance).toBe(SCREEN_RELIEF.distance)
    expect(pose.blur).toBe(SCREEN_RELIEF.blur)
    expect(pose.source).toBe(1)
    expect(pose.glyph).toBe(0)
  })

  it('lands as the settled tile, centred on `to`', () => {
    const pose = tileMorphPose(SPEC, 10_000)
    expect(pose.width).toBe(TILE_SIZE)
    expect(pose.height).toBe(TILE_SIZE)
    expect(pose.x).toBe(300 - TILE_SIZE / 2)
    expect(pose.y).toBe(800 - TILE_SIZE / 2)
    expect(pose.radius).toBe(TILE_RADIUS)
    expect(pose.distance).toBe(TILE_DIST)
    expect(pose.blur).toBe(TILE_BLUR)
    expect(pose.source).toBe(0)
    expect(pose.glyph).toBe(1)
  })

  it('without `to` it collapses in place (centre preserved)', () => {
    const inPlace = tileMorphPose({ ...SPEC, to: undefined }, 10_000)
    expect(inPlace.x + inPlace.width / 2).toBeCloseTo(900 + 640 / 2, 6)
    expect(inPlace.y + inPlace.height / 2).toBeCloseTo(120 + 400 / 2, 6)
  })

  it('the box only ever shrinks', () => {
    let prevW = Infinity
    let prevH = Infinity
    for (let f = SPEC.startAt - 5; f <= SPEC.startAt + TILE_MORPH_SETTLE + 5; f++) {
      const pose = tileMorphPose(SPEC, f)
      expect(pose.width).toBeLessThanOrEqual(prevW + 1e-9)
      expect(pose.height).toBeLessThanOrEqual(prevH + 1e-9)
      prevW = pose.width
      prevH = pose.height
    }
  })

  it('the content is gone before the fold finishes, and the glyph waits for it', () => {
    // fade completes at startAt + FADE…
    expect(tileMorphPose(SPEC, SPEC.startAt + TILE_MORPH.FADE).source).toBe(0)
    // …before the collapse ends
    expect(TILE_MORPH.FADE).toBeLessThan(TILE_MORPH.COLLAPSE_DELAY + TILE_MORPH.COLLAPSE)
    // glyph is still dark when the box starts folding
    expect(tileMorphPose(SPEC, tileMorphGlyphStart(SPEC) - 1).glyph).toBe(0)
    expect(tileMorphPose(SPEC, tileMorphGlyphStart(SPEC) + TILE_MORPH.GLYPH).glyph).toBe(1)
  })

  it('a custom size scales the landed relief', () => {
    const pose = tileMorphPose({ ...SPEC, size: 64 }, 10_000)
    expect(pose.width).toBe(64)
    expect(pose.radius).toBeCloseTo(TILE_RADIUS / 2, 6)
    expect(pose.distance).toBeCloseTo(TILE_DIST / 2, 6)
    expect(pose.blur).toBeCloseTo(TILE_BLUR / 2, 6)
  })

  it('settle matches InventoryTableVideo’s beat (+48) and avatars extend it', () => {
    expect(TILE_MORPH_SETTLE).toBe(48)
    expect(tileMorphSettledAt(SPEC)).toBe(SPEC.startAt + 48)
    const withCrowd = tileMorphSettledAt(SPEC, 3)
    expect(withCrowd).toBe(
      tileMorphGlyphStart(SPEC) + AVATAR_LEAD + 2 * AVATAR_STAGGER + AVATAR_POP,
    )
    expect(withCrowd).toBeGreaterThan(tileMorphSettledAt(SPEC))
  })
})

describe('validateTileMorph', () => {
  it('accepts a sane spec', () => {
    expect(
      validateTileMorph({ from: { x: 0, y: 0, width: 640, height: 400 }, startAt: 0 }),
    ).toEqual([])
  })

  it('flags bad dimensions, size and startAt', () => {
    const errors = validateTileMorph({
      from: { x: 0, y: 0, width: 0, height: -10 },
      size: 0,
      startAt: -5,
    })
    expect(errors).toHaveLength(4)
    expect(errors.join('\n')).toMatch(/from\.width/)
    expect(errors.join('\n')).toMatch(/from\.height/)
    expect(errors.join('\n')).toMatch(/size/)
    expect(errors.join('\n')).toMatch(/startAt/)
  })
})
