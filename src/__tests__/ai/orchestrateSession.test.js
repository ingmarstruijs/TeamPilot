import { describe, it, expect } from 'vitest'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { createRulesCoach } from '@/ai/models/rulesCoach'
import { orchestrateSession } from '@/ai/orchestrateSession'

function baseCtx() {
  const presentPlayers = Array.from({ length: 11 }, (_, i) => ({
    id: `p${i}`,
    name: `S${i}`,
    position: i === 0 ? 'GK' : 'MID',
  }))
  return buildCoachContext({
    ageGroup: 'O11',
    knvbLevel: 3,
    trainingType: 'techniek',
    durationMin: 60,
    cycleWeek: 1,
    presentPlayers,
  })
}

describe('orchestrateSession', () => {
  it('returns a validated rules plan', async () => {
    const plan = await orchestrateSession(baseCtx(), await createRulesCoach())
    expect(plan.engine).toBe('rules')
    expect(plan.blocks.length).toBeGreaterThanOrEqual(4)
    expect(plan.coachBriefing).toBeTruthy()
    expect(plan.modelId).toBe('rules-v1')
  })

  it('falls back when coach returns an invalid plan', async () => {
    const badCoach = {
      id: 'bad',
      async status() { return 'ready' },
      async planSession() {
        return {
          title: 'Broken',
          coachBriefing: 'x',
          theme: 'techniek',
          engine: 'rules',
          durationMin: 10,
          blocks: [],
        }
      },
      async adaptBlock(_c, b) { return b },
      async explainBlock() { return '' },
    }
    const plan = await orchestrateSession(baseCtx(), badCoach)
    expect(plan.modelId).toBe('rules-v1')
    expect(plan.engine).toBe('rules')
    expect(plan.blocks.length).toBeGreaterThan(0)
    expect(plan.coachBriefing).not.toMatch(/ongeldig|fallback|bruikbaar plan/i)
    expect(plan.blocks.every(b => !/fallback|ongeldig|regel-engine/i.test(b.whyThis || ''))).toBe(true)
  })

  it('falls back when planSession throws', async () => {
    const exploding = {
      id: 'boom',
      async status() { return 'ready' },
      async planSession() { throw new Error('boom') },
      async adaptBlock(_c, b) { return b },
      async explainBlock() { return '' },
    }
    const plan = await orchestrateSession(baseCtx(), exploding)
    expect(plan.modelId).toBe('rules-v1')
    expect(plan.blocks.length).toBeGreaterThan(0)
  })
})
