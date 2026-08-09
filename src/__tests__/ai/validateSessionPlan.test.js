import { describe, it, expect } from 'vitest'
import { validateSessionPlan } from '@/ai/validateSessionPlan'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { EXERCISES } from '@/data/exercises'

function baseCtx(overrides = {}) {
  const players = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i}`,
    name: `Speler ${i}`,
    position: i === 0 ? 'GK' : i < 5 ? 'DEF' : i < 8 ? 'MID' : 'ATT',
  }))
  return buildCoachContext({
    ageGroup: 'O11',
    knvbLevel: 3,
    knvbClass: '5e',
    trainingType: 'gemengd',
    durationMin: 60,
    cycleWeek: 1,
    presentPlayers: players,
    ...overrides,
  })
}

describe('validateSessionPlan', () => {
  it('accepts a rules coach plan', () => {
    const ctx = baseCtx()
    const plan = planSessionSync(ctx)
    const result = validateSessionPlan(plan, ctx)
    expect(result.ok).toBe(true)
    expect(result.plan.blocks.length).toBeGreaterThanOrEqual(4)
    expect(result.plan.coachBriefing).toBeTruthy()
  })

  it('rejects empty plan', () => {
    const result = validateSessionPlan(null, baseCtx())
    expect(result.ok).toBe(false)
    expect(result.errors[0]).toMatch(/ontbreekt/)
  })

  it('rejects too few blocks', () => {
    const ctx = baseCtx()
    const ex = EXERCISES.find(e => e.ageGroups.includes('O11'))
    const plan = {
      title: 'Test',
      coachBriefing: 'Brief',
      durationMin: 40,
      theme: 'techniek',
      engine: 'rules',
      blocks: Array.from({ length: 3 }, () => ({
        source: 'library',
        exerciseId: ex.id,
        title: ex.title,
        category: 'techniek',
        durationMin: 10,
        minPlayers: ex.minPlayers,
        maxPlayers: ex.maxPlayers,
        description: '',
        setup: '',
        rules: [],
        adaptations: [],
        coachingCues: [],
      })),
    }
    const result = validateSessionPlan(plan, ctx)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.includes('4–8'))).toBe(true)
  })

  it('rejects unknown exercise ids', () => {
    const ctx = baseCtx()
    const plan = {
      title: 'Test',
      coachBriefing: 'Brief',
      durationMin: 60,
      theme: 'techniek',
      engine: 'rules',
      blocks: Array.from({ length: 4 }, (_, i) => ({
        source: 'library',
        exerciseId: `does-not-exist-${i}`,
        title: 'X',
        category: i === 0 ? 'warming-up' : i === 3 ? 'afsluiting' : 'techniek',
        durationMin: 15,
        minPlayers: 4,
        maxPlayers: 16,
        description: '',
        setup: '',
        rules: [],
        adaptations: [],
        coachingCues: [],
      })),
    }
    const result = validateSessionPlan(plan, ctx)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.includes('onbekend'))).toBe(true)
  })

  it('rejects duration sum outside ±15%', () => {
    const ctx = baseCtx({ durationMin: 60 })
    const pool = EXERCISES.filter(e => e.ageGroups.includes('O11'))
    const plan = {
      title: 'Test',
      coachBriefing: 'Brief',
      durationMin: 20,
      theme: 'techniek',
      engine: 'rules',
      blocks: [
        { source: 'library', exerciseId: pool[0].id, title: 'A', category: 'warming-up', durationMin: 5, minPlayers: 4, maxPlayers: 16, description: '', setup: '', rules: [], adaptations: [], coachingCues: [] },
        { source: 'library', exerciseId: pool[1].id, title: 'B', category: 'techniek', durationMin: 5, minPlayers: 4, maxPlayers: 16, description: '', setup: '', rules: [], adaptations: [], coachingCues: [] },
        { source: 'library', exerciseId: pool[2].id, title: 'C', category: 'tactiek', durationMin: 5, minPlayers: 4, maxPlayers: 16, description: '', setup: '', rules: [], adaptations: [], coachingCues: [] },
        { source: 'library', exerciseId: pool[3].id, title: 'D', category: 'afsluiting', durationMin: 5, minPlayers: 4, maxPlayers: 16, description: '', setup: '', rules: [], adaptations: [], coachingCues: [] },
      ],
    }
    const result = validateSessionPlan(plan, ctx)
    expect(result.ok).toBe(false)
    expect(result.errors.some(e => e.includes('duur-som'))).toBe(true)
  })
})
