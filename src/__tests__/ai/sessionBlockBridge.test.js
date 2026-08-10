import { describe, it, expect } from 'vitest'
import { applyAdaptedBlock, sessionBlockToPlanned } from '@/ai/sessionBlockBridge'
import { adaptBlockSync } from '@/ai/models/rulesCoach'
import { buildCoachContext } from '@/ai/buildCoachContext'

const libraryExercise = {
  id: 'pass-square',
  title: 'Passvierkant',
  category: 'techniek',
  durationMin: 12,
  minPlayers: 6,
  maxPlayers: 14,
  description: 'Passen in een vierkant',
  setup: '4 pionnen',
  rules: ['2 touches'],
}

function sessionBlock(overrides = {}) {
  return {
    uid: 7,
    exercise: { ...libraryExercise },
    durationMin: 12,
    ai: {
      whyThis: 'Past bij techniekweek',
      adaptations: ['Speel in 2 groepjes indien nodig'],
      coachingCues: ['Eis tempo'],
      engine: 'rules',
    },
    ...overrides,
  }
}

describe('sessionBlockBridge', () => {
  it('round-trips adaptBlock into session ai meta', () => {
    const block = sessionBlock()
    const planned = sessionBlockToPlanned(block)
    expect(planned.exerciseId).toBe('pass-square')
    expect(planned.adaptations).toContain('Speel in 2 groepjes indien nodig')

    const ctx = buildCoachContext({
      ageGroup: 'O11',
      knvbLevel: 3,
      presentPlayers: Array.from({ length: 11 }, (_, i) => ({
        id: `p${i}`,
        name: `P${i}`,
        position: i === 0 ? 'GK' : 'MID',
      })),
    })
    const adapted = adaptBlockSync(ctx, planned, 'korter')
    const next = applyAdaptedBlock(block, adapted)

    expect(next.uid).toBe(7)
    expect(next.durationMin).toBe(9)
    expect(next.ai.adaptations.some(a => /ingekort/i.test(a))).toBe(true)
    expect(next.ai.engine).toBe('rules')
  })

  it('stores adapted rules on ai for dialog display', () => {
    const block = sessionBlock()
    const planned = sessionBlockToPlanned(block)
    const ctx = buildCoachContext({
      ageGroup: 'O11',
      knvbLevel: 3,
      presentPlayers: [{ id: 'p1', name: 'A', position: 'ATT' }],
    })
    const adapted = adaptBlockSync(ctx, planned, 'moeilijker')
    const next = applyAdaptedBlock(block, adapted)
    expect(next.ai.rules.some(r => /Moeilijker/i.test(r))).toBe(true)
  })
})
