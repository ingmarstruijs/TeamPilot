import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  applyNarrationEnrichment,
  createWebLlmCoach,
  resetWebLlmEngineCache,
} from '@/ai/models/webllmCoach'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { buildEnrichNarrationMessages } from '@/ai/prompts/planSessionPrompt'
import { validateSessionPlan } from '@/ai/validateSessionPlan'

function players(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    position: i === 0 ? 'GK' : 'MID',
  }))
}

function structureCtx() {
  const ctx = buildCoachContext({
    ageGroup: 'O11',
    knvbLevel: 3,
    trainingType: 'gemengd',
    durationMin: 60,
    cycleWeek: 2,
    presentPlayers: players(11),
    focus: 'druk zetten',
  })
  const plan = planSessionSync(ctx)
  return { ctx, plan }
}

function mockEngine(responses) {
  let i = 0
  return {
    chat: {
      completions: {
        create: vi.fn(async () => {
          const content = responses[Math.min(i, responses.length - 1)]
          i += 1
          return { choices: [{ message: { content } }] }
        }),
      },
    },
  }
}

describe('enrichNarration', () => {
  beforeEach(() => resetWebLlmEngineCache())
  afterEach(() => resetWebLlmEngineCache())

  it('buildEnrichNarrationMessages asks for briefing only', () => {
    const { ctx, plan } = structureCtx()
    const messages = buildEnrichNarrationMessages(ctx, plan)
    expect(messages[0].content).toMatch(/do NOT change exerciseId/i)
    expect(messages[0].content).toMatch(/coachBriefing/)
    expect(messages[1].content).toContain(plan.blocks[0].exerciseId)
  })

  it('applyNarrationEnrichment merges briefing and cues onto structure', () => {
    const { ctx, plan } = structureCtx()
    const next = applyNarrationEnrichment(plan, {
      coachBriefing: 'Vanavond druk zetten op de linkerflank.',
      blocks: [
        { index: 0, whyThis: 'Past bij druk zetten', coachingCues: ['Hoge druk', 'Compact'] },
      ],
    }, ctx, { modelId: 'mock' })
    expect(next.engine).toBe('local-llm')
    expect(next.coachBriefing).toMatch(/druk zetten/)
    expect(next.blocks[0].whyThis).toMatch(/druk zetten/)
    expect(next.blocks[0].coachingCues).toEqual(['Hoge druk', 'Compact'])
    expect(next.blocks[0].exerciseId).toBe(plan.blocks[0].exerciseId)
  })

  it('webllm enrichNarration uses compact max tokens path', async () => {
    const { ctx, plan } = structureCtx()
    const payload = {
      coachBriefing: 'Korte AI briefing.',
      blocks: plan.blocks.map((_, i) => ({ index: i, coachingCues: ['Cue'] })),
    }
    const engine = mockEngine([JSON.stringify(payload)])
    const coach = createWebLlmCoach({
      modelId: 'mock-qwen',
      createEngine: async () => engine,
    })
    const enriched = await coach.enrichNarration(ctx, plan)
    expect(enriched.coachBriefing).toMatch(/Korte AI/)
    expect(validateSessionPlan(enriched, ctx).ok).toBe(true)
    expect(engine.chat.completions.create).toHaveBeenCalledTimes(1)
    const call = engine.chat.completions.create.mock.calls[0][0]
    expect(call.max_tokens).toBeLessThanOrEqual(768)
  })
})
