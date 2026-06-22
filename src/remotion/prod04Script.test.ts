import { describe, expect, it } from 'vitest'
import { validateBaGraph } from './aikit/graphScript'
import { validateCameraRig } from './aikit/cameraScript'
import { validateToastScript } from './aikit/toastScript'
import {
  BA_EDGES,
  BA_LAYOUT,
  BA_NODES,
  BA_TIMING,
  COUNTERS,
  COUNTERS_AT,
  countByKindAt,
  GUION_COUNTS,
  HEART_NODES,
  HERO_EDGES,
  LAURA_WAVE,
  MANOLO_WAVE,
  MONTAGE_NODES,
  PHASE,
  PROD04_CAM,
  PROD04_CAPTIONS,
  PROD04_DURATION,
  PROD04_TOASTS,
  PROPOSAL_AT,
  PULLBACK_NODES,
} from './prod04Script'

describe('the piece', () => {
  it('runs the spec duration (90s @30fps)', () => {
    expect(PROD04_DURATION).toBe(2700)
  })

  it('reproduces in order: heart → Manolo → Laura → montage → pull-back', () => {
    expect(PHASE.heart).toBeLessThan(PHASE.manolo)
    expect(PHASE.manolo).toBeLessThan(PHASE.laura)
    expect(PHASE.laura).toBeLessThan(PHASE.montage)
    expect(PHASE.montage).toBeLessThan(PHASE.pullback)
    expect(PHASE.pullback).toBeLessThan(PROD04_DURATION)
  })
})

describe('the organism (BaGraph)', () => {
  it('is a valid graph — unique nodes, real edge endpoints, no self-edges', () => {
    expect(validateBaGraph(BA_NODES, BA_EDGES)).toEqual([])
  })

  it('is the 40+-node organism the guión asks for', () => {
    expect(BA_NODES.length).toBeGreaterThanOrEqual(40)
    expect(BA_NODES.length).toBe(46)
  })

  it('its kind tally IS the guión headline (7 apps · 12 procesos · 3 BBDD · 24 personas)', () => {
    const tally = { app: 0, proceso: 0, bbdd: 0, persona: 0 }
    for (const n of BA_NODES) tally[n.kind]++
    expect(tally).toEqual(GUION_COUNTS)
    expect(GUION_COUNTS).toEqual({ app: 7, proceso: 12, bbdd: 3, persona: 24 })
  })

  it('every node ignites within the piece, at a non-negative frame', () => {
    for (const n of BA_NODES) {
      const at = BA_TIMING.nodeAt[n.id]
      expect(at).toBeGreaterThanOrEqual(0)
      expect(at).toBeLessThan(PROD04_DURATION)
    }
  })

  it('lays out every node (anchored hero nodes keep their composed position)', () => {
    for (const n of BA_NODES) expect(BA_LAYOUT.pos[n.id]).toBeDefined()
    expect(BA_LAYOUT.pos['p_chequeo']).toEqual({ x: 960, y: 540 })
    expect(BA_LAYOUT.pos['p_caducidades']).toEqual({ x: 620, y: 360 })
    expect(BA_LAYOUT.pos['app_prediccion']).toEqual({ x: 1320, y: 680 })
  })
})

describe('the reproduction waves', () => {
  it('opens on the Acto-3 process alone, alight from the first frame', () => {
    expect(BA_TIMING.nodeAt['p_chequeo']).toBe(0)
    const ignitedAtStart = BA_NODES.filter((n) => BA_TIMING.nodeAt[n.id] === 0)
    expect(ignitedAtStart.map((n) => n.id)).toContain('p_chequeo')
  })

  it('Manolo ignites exactly 3 tiles, all inside his beat', () => {
    expect(MANOLO_WAVE).toHaveLength(3)
    for (const n of MANOLO_WAVE) {
      expect(n.at).toBeGreaterThanOrEqual(PHASE.manolo)
      expect(n.at!).toBeLessThan(PHASE.laura)
    }
  })

  it('Laura distributes exactly 8 tiles, born from an app de predicción', () => {
    expect(LAURA_WAVE).toHaveLength(8)
    expect(LAURA_WAVE[0].kind).toBe('app')
    expect(LAURA_WAVE[0].id).toBe('app_prediccion')
    for (const n of LAURA_WAVE) {
      expect(n.at).toBeGreaterThanOrEqual(PHASE.laura)
      expect(n.at!).toBeLessThan(PHASE.montage)
    }
  })

  it('the montage is the densest wave — everyone else, fast', () => {
    expect(MONTAGE_NODES).toHaveLength(24)
    expect(MONTAGE_NODES.length).toBeGreaterThan(HEART_NODES.length)
    expect(MONTAGE_NODES.length).toBeGreaterThan(LAURA_WAVE.length)
    for (const n of MONTAGE_NODES) {
      expect(n.at!).toBeGreaterThanOrEqual(PHASE.montage)
      expect(n.at!).toBeLessThan(PHASE.pullback)
    }
  })

  it('the system proposes a brand-new process LAST, after a held beat', () => {
    const proposal = PULLBACK_NODES[PULLBACK_NODES.length - 1]
    expect(proposal.id).toBe('p_anticipar')
    expect(proposal.kind).toBe('proceso')
    expect(proposal.at).toBe(PROPOSAL_AT)
    const last = Math.max(...BA_NODES.map((n) => BA_TIMING.nodeAt[n.id]))
    expect(BA_TIMING.nodeAt['p_anticipar']).toBe(last)
    // the proposal lands with room to breathe before the end
    expect(PROD04_DURATION - PROPOSAL_AT).toBeGreaterThanOrEqual(120)
  })
})

describe('the live counters', () => {
  it('only count nodes that have already ignited — monotonic, never ahead of itself', () => {
    let prev = 0
    for (let f = 0; f <= PROD04_DURATION; f += 90) {
      const total = COUNTERS.reduce((s, c) => s + countByKindAt(f, c.kind), 0)
      expect(total).toBeGreaterThanOrEqual(prev)
      prev = total
    }
  })

  it('settle exactly on the guión tally by the final still', () => {
    for (const c of COUNTERS) {
      expect(countByKindAt(PROD04_DURATION - 1, c.kind)).toBe(GUION_COUNTS[c.kind])
    }
  })

  it('start below the tally — the organism is still growing when they appear', () => {
    expect(countByKindAt(COUNTERS_AT, 'persona')).toBeLessThan(GUION_COUNTS.persona)
    expect(COUNTERS_AT).toBeLessThan(PHASE.pullback)
  })

  it('cover all four node kinds', () => {
    expect(COUNTERS.map((c) => c.kind).sort()).toEqual(['app', 'bbdd', 'persona', 'proceso'])
  })
})

describe('the edges', () => {
  it('AiKit links two branches proactively, after both branches exist', () => {
    expect(HERO_EDGES).toHaveLength(2)
    const ids = new Set(BA_NODES.map((n) => n.id))
    for (const e of HERO_EDGES) {
      expect(ids.has(e.from)).toBe(true)
      expect(ids.has(e.to)).toBe(true)
      const bothLit = Math.max(BA_TIMING.nodeAt[e.from], BA_TIMING.nodeAt[e.to])
      expect(e.at!).toBeGreaterThan(bothLit) // proactive = after the branches grew
      expect(e.pulseEvery!).toBeGreaterThan(0) // the link stays alive
    }
  })

  it('connects predicción → compra automática and caducidades → negociación', () => {
    expect(HERO_EDGES.map((e) => `${e.from}→${e.to}`)).toEqual([
      'app_prediccion→p_autocompra',
      'p_caducidades→p_negociacion',
    ])
  })

  it('grows a web, not a wheel — more edges than a single hub would give', () => {
    expect(BA_EDGES.length).toBeGreaterThan(BA_NODES.length - 1)
  })
})

describe('the notifications', () => {
  it('are a valid toast script', () => {
    expect(validateToastScript(PROD04_TOASTS)).toEqual([])
  })

  it('open with Manolo adapting the process', () => {
    expect(PROD04_TOASTS[0].title.toLowerCase()).toContain('manolo')
    expect(PROD04_TOASTS[0].showAt).toBeGreaterThanOrEqual(PHASE.heart)
    expect(PROD04_TOASTS[0].showAt).toBeLessThan(PHASE.manolo)
  })

  it('close with the system proposing a new process — and it stays for the final still', () => {
    const last = PROD04_TOASTS[PROD04_TOASTS.length - 1]
    expect(last.title.toLowerCase()).toContain('propone')
    expect(last.hideAt).toBeUndefined() // held to the end
    expect(last.showAt).toBeLessThan(PROD04_DURATION)
    expect(last.showAt).toBeGreaterThanOrEqual(PHASE.pullback)
  })

  it('quote the wave sizes the guión promises (3, then 8)', () => {
    expect(PROD04_TOASTS.some((t) => (t.message ?? '').includes('3'))).toBe(true)
    expect(PROD04_TOASTS.some((t) => (t.message ?? '').includes('8'))).toBe(true)
  })
})

describe('the captions', () => {
  it('are ordered and never overlap', () => {
    for (let i = 0; i < PROD04_CAPTIONS.length; i++) {
      const c = PROD04_CAPTIONS[i]
      expect(c.hideAt).toBeGreaterThan(c.showAt)
      if (i > 0) expect(c.showAt).toBeGreaterThanOrEqual(PROD04_CAPTIONS[i - 1].hideAt)
    }
  })

  it('hold the last line to the end — a stable, readable final still', () => {
    const last = PROD04_CAPTIONS[PROD04_CAPTIONS.length - 1]
    expect(last.hideAt).toBe(PROD04_DURATION)
  })
})

describe('the camera', () => {
  it('is a valid rig', () => {
    expect(validateCameraRig(PROD04_CAM)).toEqual([])
  })

  it('pulls back — each framing is wider (or equal) than the last by the end', () => {
    const first = PROD04_CAM[0]
    const last = PROD04_CAM[PROD04_CAM.length - 1]
    expect(last.zoom).toBeLessThan(first.zoom) // the WIDE_CAM pull-back
  })

  it('holds the final wide framing as a stable still', () => {
    const last = PROD04_CAM[PROD04_CAM.length - 1]
    expect(PROD04_DURATION - last.at).toBeGreaterThanOrEqual(45)
  })
})
