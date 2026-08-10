import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  createWebLlmCoach,
  resetWebLlmEngineCache,
} from '@/ai/models/webllmCoach'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { validateSessionPlan } from '@/ai/validateSessionPlan'

function players(n) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    name: `P${i}`,
    position: i === 0 ? 'GK' : i % 3 === 0 ? 'DEF' : i % 3 === 1 ? 'MID' : 'ATT',
  }))
}

function ctxWithSkeleton() {
  const ctx = buildCoachContext({
    ageGroup: 'O11',
    knvbLevel: 3,
    trainingType: 'gemengd',
    durationMin: 60,
    cycleWeek: 2,
    presentPlayers: players(11),
    focus: 'druk zetten',
  })
  const rulesPlan = planSessionSync(ctx)
  const skeleton = {
    blocks: rulesPlan.blocks.map(b => ({
      exercise: {
        id: b.exerciseId,
        category: b.category,
        title: b.title,
        minPlayers: b.minPlayers,
        maxPlayers: b.maxPlayers,
      },
      durationMin: b.durationMin,
    })),
  }
  const candidates = {
    bySlot: skeleton.blocks.map(b => ({
      category: b.exercise.category,
      targetMin: b.durationMin,
      candidates: [{
        id: b.exercise.id,
        title: b.exercise.title,
        minPlayers: b.exercise.minPlayers,
        maxPlayers: b.exercise.maxPlayers,
      }],
    })),
  }
  return { ...ctx, skeleton, candidates, rulesPlan }
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

describe('webllmCoach', () => {
  beforeEach(() => {
    resetWebLlmEngineCache()
  })

  afterEach(() => {
    resetWebLlmEngineCache()
  })

  it('plans a valid session from mocked engine JSON', async () => {
    const enriched = ctxWithSkeleton()
    const valid = {
      ...enriched.rulesPlan,
      engine: 'local-llm',
      modelId: 'mock-qwen',
      coachBriefing: 'Lokale AI testbriefing voor vanavond.',
    }
    const engine = mockEngine([JSON.stringify(valid)])
    const coach = createWebLlmCoach({
      modelId: 'mock-qwen',
      createEngine: async () => engine,
    })

    expect(await coach.status()).toBe('needs-download')
    await coach.ensureReady()
    expect(await coach.status()).toBe('ready')

    const plan = await coach.planSession(enriched)
    expect(plan.engine).toBe('local-llm')
    expect(validateSessionPlan(plan, enriched).ok).toBe(true)
    expect(engine.chat.completions.create).toHaveBeenCalledTimes(1)
  })

  it('repairs invalid JSON once then returns valid plan', async () => {
    const enriched = ctxWithSkeleton()
    const valid = {
      ...enriched.rulesPlan,
      engine: 'local-llm',
      coachBriefing: 'Hersteld plan.',
    }
    const engine = mockEngine([
      'not-json-at-all',
      JSON.stringify(valid),
    ])
    const coach = createWebLlmCoach({
      createEngine: async () => engine,
    })

    const plan = await coach.planSession(enriched)
    expect(plan.coachBriefing).toMatch(/Hersteld/)
    expect(engine.chat.completions.create).toHaveBeenCalledTimes(2)
  })

  it('normalizes a thin model response onto the skeleton', async () => {
    const enriched = ctxWithSkeleton()
    const engine = mockEngine([
      JSON.stringify({ title: 'Dun plan', theme: 'techniek' }),
    ])
    const coach = createWebLlmCoach({
      createEngine: async () => engine,
    })

    const plan = await coach.planSession(enriched)
    expect(plan.engine).toBe('local-llm')
    expect(plan.blocks.length).toBeGreaterThanOrEqual(4)
    expect(engine.chat.completions.create).toHaveBeenCalledTimes(1)
  })

  it('adapts Speelwijze chips via rules without calling the model', async () => {
    const enriched = ctxWithSkeleton()
    const block = {
      ...enriched.rulesPlan.blocks[0],
      durationMin: 12,
    }
    const engine = mockEngine(['{}'])
    const coach = createWebLlmCoach({
      createEngine: async () => engine,
    })
    const next = await coach.adaptBlock(enriched, block, 'makkelijker')
    expect(engine.chat.completions.create).not.toHaveBeenCalled()
    expect(next.adaptations.some(a => /verlaag weerstand|speelruimte/i.test(a))).toBe(true)
    expect(next.whyThis).toMatch(/Makkelijkere variant/)
  })

  it('falls back to rules adaptBlock when freeform model fails', async () => {
    const enriched = ctxWithSkeleton()
    const block = {
      ...enriched.rulesPlan.blocks[0],
      durationMin: 12,
    }
    const engine = {
      chat: {
        completions: {
          create: vi.fn(async () => {
            throw new Error('boom')
          }),
        },
      },
    }
    const coach = createWebLlmCoach({
      createEngine: async () => engine,
    })
    await coach.ensureReady()
    const next = await coach.adaptBlock(enriched, block, 'maak meer 1v1 duels')
    expect(next.coachingCues.some(c => /moeilijker|makkelijker/i.test(c))).toBe(true)
  })

  it('fills whyThis when the model returns a thin plan', async () => {
    const enriched = ctxWithSkeleton()
    const engine = mockEngine([
      JSON.stringify({ title: 'Dun plan', theme: 'techniek' }),
    ])
    const coach = createWebLlmCoach({
      createEngine: async () => engine,
    })

    const plan = await coach.planSession(enriched)
    expect(plan.blocks.every(b => Boolean(b.whyThis?.trim()))).toBe(true)
    expect(plan.blocks.every(b => (b.coachingCues?.length ?? 0) > 0)).toBe(true)
  })
})
