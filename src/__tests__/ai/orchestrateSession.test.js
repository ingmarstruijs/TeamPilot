import { describe, it, expect, vi } from 'vitest'
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
  it('returns a validated rules plan and calls onStructure early', async () => {
    const onStructure = vi.fn()
    const plan = await orchestrateSession(baseCtx(), await createRulesCoach(), { onStructure })
    expect(plan.engine).toBe('rules')
    expect(plan.blocks.length).toBeGreaterThanOrEqual(4)
    expect(plan.coachBriefing).toBeTruthy()
    expect(plan.modelId).toBe('rules-v1')
    expect(onStructure).toHaveBeenCalledTimes(1)
    expect(onStructure.mock.calls[0][0].blocks.length).toBeGreaterThanOrEqual(4)
  })

  it('keeps structure when enrichNarration fails', async () => {
    const enrichCoach = {
      id: 'webllm-v1',
      async status() { return 'ready' },
      async planSession() { throw new Error('should not be called') },
      async enrichNarration() { throw new Error('boom') },
      async adaptBlock(_c, b) { return b },
      async explainBlock() { return '' },
    }
    const onStructure = vi.fn()
    const plan = await orchestrateSession(baseCtx(), enrichCoach, { onStructure })
    expect(onStructure).toHaveBeenCalled()
    expect(plan.engine).toBe('rules')
    expect(plan.blocks.length).toBeGreaterThan(0)
    expect(plan.modelId).toBe('rules-v1')
  })

  it('applies enrichNarration when local LLM succeeds', async () => {
    const enrichCoach = {
      id: 'webllm-v1',
      async status() { return 'ready' },
      async planSession() { throw new Error('should not be called') },
      async enrichNarration(_ctx, structurePlan) {
        return {
          ...structurePlan,
          engine: 'local-llm',
          modelId: 'mock',
          coachBriefing: 'Lokale briefing vanavond.',
        }
      },
      async adaptBlock(_c, b) { return b },
      async explainBlock() { return '' },
    }
    const plan = await orchestrateSession(baseCtx(), enrichCoach)
    expect(plan.engine).toBe('local-llm')
    expect(plan.coachBriefing).toMatch(/Lokale briefing/)
  })

  it('skips enrich when skipEnrich is set', async () => {
    const enrich = vi.fn()
    const enrichCoach = {
      id: 'webllm-v1',
      async status() { return 'ready' },
      async planSession() { throw new Error('no') },
      enrichNarration: enrich,
      async adaptBlock(_c, b) { return b },
      async explainBlock() { return '' },
    }
    const plan = await orchestrateSession(baseCtx(), enrichCoach, { skipEnrich: true })
    expect(enrich).not.toHaveBeenCalled()
    expect(plan.engine).toBe('rules')
  })
})
