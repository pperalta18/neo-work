import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  ACTION_VERBS,
  DOMAINS,
  GENERATED_COUNT,
  GENERATED_PROCESSES,
  HERO_PROCESSES,
  LIBRARY_SEED,
  LIBRARY_SIZE,
  MAX_STAGES,
  MIN_STAGES,
  MODULE_POOL,
  PROCESS_LIBRARY,
  actionStage,
  generateProcesses,
  generatedProcesses,
  heroProcesses,
  isActionStage,
  isModuleStage,
  moduleStage,
  mulberry32,
  processById,
  processCellSpan,
  processSignature,
  stageSpan,
  type Process,
  type Stage,
} from './processLibrary'

// Reverse map domain label → lead module, to assert generated flows stay anchored.
const LEAD_BY_LABEL = new Map(DOMAINS.map((d) => [d.label, d.lead]))
const VERB_ACTIONS = new Set(ACTION_VERBS.map((v) => v.action))
const VERB_ICONS = new Set(ACTION_VERBS.map((v) => v.icon))
const MODULE_SET = new Set(MODULE_POOL)

/** Structural soundness check shared across hero + generated flows. */
function expectValidStage(s: Stage): void {
  // Exactly one of the two shapes, never both / neither.
  expect(isModuleStage(s) !== isActionStage(s)).toBe(true)
  if (isModuleStage(s)) {
    expect(typeof s.module).toBe('string')
    expect(s.module.length).toBeGreaterThan(0)
  } else {
    expect(typeof s.action).toBe('string')
    expect(s.action.length).toBeGreaterThan(0)
    expect(typeof s.icon).toBe('string')
    expect(s.icon.length).toBeGreaterThan(0)
  }
}

describe('processLibrary — stage vocabulary', () => {
  it('builds a module step (1 cell, module kind)', () => {
    const s = moduleStage('docusense')
    expect(s).toEqual({ kind: 'module', module: 'docusense' })
    expect(isModuleStage(s)).toBe(true)
    expect(isActionStage(s)).toBe(false)
    expect(stageSpan(s)).toBe(1)
  })

  it('builds an action step (2 cells, action kind)', () => {
    const s = actionStage('Validar', 'lock')
    expect(s).toEqual({ kind: 'action', action: 'Validar', icon: 'lock' })
    expect(isActionStage(s)).toBe(true)
    expect(isModuleStage(s)).toBe(false)
    expect(stageSpan(s)).toBe(2)
  })

  it('the discriminants are mutually exclusive', () => {
    for (const s of [moduleStage('forge'), actionStage('Medir', 'target')]) {
      expect(isModuleStage(s) !== isActionStage(s)).toBe(true)
    }
  })
})

describe('processLibrary — mulberry32 PRNG', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(0x1234)
    const b = mulberry32(0x1234)
    const seqA = Array.from({ length: 16 }, () => a())
    const seqB = Array.from({ length: 16 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('returns floats in [0, 1)', () => {
    const r = mulberry32(99)
    for (let i = 0; i < 2000; i += 1) {
      const x = r()
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })

  it('different seeds give different streams', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    const seqA = Array.from({ length: 8 }, () => a())
    const seqB = Array.from({ length: 8 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })
})

describe('processLibrary — combinatorial generator', () => {
  it('produces exactly the requested count', () => {
    const flows = generateProcesses(120, 0xabc)
    expect(flows).toHaveLength(120)
  })

  it('is fully deterministic (same seed → byte-identical flows)', () => {
    const a = generateProcesses(150, LIBRARY_SEED)
    const b = generateProcesses(150, LIBRARY_SEED)
    expect(a).toEqual(b)
  })

  it('the seed actually matters (different seed → different flows)', () => {
    const a = generateProcesses(40, 1)
    const b = generateProcesses(40, 2)
    expect(a).not.toEqual(b)
  })

  it('every generated flow is unique by content signature', () => {
    const flows = generateProcesses(GENERATED_COUNT, LIBRARY_SEED)
    const sigs = new Set<string>()
    for (const p of flows) {
      // domain label → key isn't needed for uniqueness: use label + stages.
      sigs.add(processSignature(p.domain, p.stages))
    }
    expect(sigs.size).toBe(flows.length)
  })

  it('every generated flow respects the stage-length bounds', () => {
    for (const p of GENERATED_PROCESSES) {
      expect(p.stages.length).toBeGreaterThanOrEqual(MIN_STAGES)
      expect(p.stages.length).toBeLessThanOrEqual(MAX_STAGES)
    }
  })

  it('every generated flow opens on its domain lead and closes on an action', () => {
    for (const p of GENERATED_PROCESSES) {
      const lead = LEAD_BY_LABEL.get(p.domain)
      expect(lead).toBeDefined()
      const first = p.stages[0]
      expect(isModuleStage(first)).toBe(true)
      if (isModuleStage(first)) expect(first.module).toBe(lead)
      expect(isActionStage(p.stages[p.stages.length - 1])).toBe(true)
    }
  })

  it('generated steps only ever draw from the declared pools', () => {
    for (const p of GENERATED_PROCESSES) {
      for (const s of p.stages) {
        if (isModuleStage(s)) {
          expect(MODULE_SET.has(s.module)).toBe(true)
        } else {
          expect(VERB_ACTIONS.has(s.action)).toBe(true)
          expect(VERB_ICONS.has(s.icon)).toBe(true)
        }
      }
    }
  })

  it('every generated flow is structurally valid', () => {
    for (const p of GENERATED_PROCESSES) {
      expect(p.kind).toBe('generated')
      expect(p.stages.length).toBeGreaterThan(0)
      for (const s of p.stages) expectValidStage(s)
    }
  })
})

describe('processLibrary — hero processes', () => {
  it('has a non-trivial curated set, all marked hero', () => {
    expect(HERO_PROCESSES.length).toBeGreaterThanOrEqual(12)
    for (const p of HERO_PROCESSES) expect(p.kind).toBe('hero')
  })

  it('every hero flow has a name, a domain and ≥2 valid stages', () => {
    for (const p of HERO_PROCESSES) {
      expect(p.name.length).toBeGreaterThan(0)
      expect(p.domain.length).toBeGreaterThan(0)
      expect(p.stages.length).toBeGreaterThanOrEqual(2)
      for (const s of p.stages) expectValidStage(s)
    }
  })

  it('every hero flow contains at least one tool and one action', () => {
    for (const p of HERO_PROCESSES) {
      expect(p.stages.some(isModuleStage)).toBe(true)
      expect(p.stages.some(isActionStage)).toBe(true)
    }
  })
})

describe('processLibrary — assembled library', () => {
  it('is hero flows followed by the generated density', () => {
    expect(GENERATED_PROCESSES).toHaveLength(GENERATED_COUNT)
    expect(GENERATED_COUNT).toBeGreaterThanOrEqual(200) // "cientos" (spec)
    expect(PROCESS_LIBRARY).toEqual([...HERO_PROCESSES, ...GENERATED_PROCESSES])
    expect(LIBRARY_SIZE).toBe(HERO_PROCESSES.length + GENERATED_PROCESSES.length)
  })

  it('the module-level constant equals a fresh deterministic generation', () => {
    expect(GENERATED_PROCESSES).toEqual(generateProcesses(GENERATED_COUNT, LIBRARY_SEED))
  })

  it('ids are dense and equal the array index', () => {
    PROCESS_LIBRARY.forEach((p, i) => expect(p.id).toBe(i))
  })

  it('every flow in the library is unique by content signature', () => {
    const sigs = new Set<string>()
    for (const p of PROCESS_LIBRARY) sigs.add(processSignature(`${p.kind}:${p.domain}`, p.stages))
    expect(sigs.size).toBe(PROCESS_LIBRARY.length)
  })

  it('every flow has a unique name', () => {
    const names = new Set(PROCESS_LIBRARY.map((p) => p.name))
    expect(names.size).toBe(PROCESS_LIBRARY.length)
  })

  it('processById round-trips and rejects out-of-range ids', () => {
    for (const p of PROCESS_LIBRARY) expect(processById(p.id)).toBe(p)
    expect(processById(-1)).toBeUndefined()
    expect(processById(LIBRARY_SIZE)).toBeUndefined()
  })

  it('exposes the hero / generated subsets', () => {
    expect(heroProcesses()).toBe(HERO_PROCESSES)
    expect(generatedProcesses()).toBe(GENERATED_PROCESSES)
  })
})

describe('processLibrary — geometry helpers', () => {
  it('processCellSpan sums stage spans (module 1, action 2)', () => {
    const p: Process = {
      id: -1,
      name: 't',
      domain: 'Test',
      kind: 'generated',
      stages: [moduleStage('hotpot'), actionStage('Validar', 'lock'), moduleStage('forge')],
    }
    expect(processCellSpan(p)).toBe(1 + 2 + 1)
  })

  it('every library flow has a positive cell span', () => {
    for (const p of PROCESS_LIBRARY) expect(processCellSpan(p)).toBeGreaterThan(0)
  })
})

describe('processLibrary — determinism guard', () => {
  it('the source never reaches for Math.random or Date.now', () => {
    const src = readFileSync(fileURLToPath(new URL('./processLibrary.ts', import.meta.url)), 'utf8')
    // Strip block + line comments so the guard inspects code, not the prose that
    // explains *why* these are banned (the doc comments name them on purpose).
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
    expect(code).not.toContain('Math.random')
    expect(code).not.toContain('Date.now')
  })
})
