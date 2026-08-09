import { describe, it, expect } from 'vitest'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { hydrateSessionPlan } from '@/ai/hydrateSessionPlan'
import { buildCustomExercise } from '@/utils/customExercises'
import { isCustomExercise } from '@/utils/customExercises'

describe('hydrateSessionPlan', () => {
  it('resolves library ids and attaches ai meta', () => {
    const presentPlayers = Array.from({ length: 10 }, (_, i) => ({
      id: `p${i}`,
      name: `S${i}`,
      position: 'MID',
    }))
    const ctx = buildCoachContext({
      ageGroup: 'O11',
      knvbLevel: 3,
      trainingType: 'gemengd',
      durationMin: 60,
      cycleWeek: 1,
      presentPlayers,
    })
    const plan = planSessionSync(ctx)
    const hydrated = hydrateSessionPlan(plan, { ageGroup: 'O11' })

    expect(hydrated.length).toBe(plan.blocks.length)
    for (const row of hydrated) {
      expect(row.exercise?.id).toBeTruthy()
      expect(row.durationMin).toBeGreaterThanOrEqual(4)
      expect(row.ai.engine).toBe('rules')
      expect(Array.isArray(row.ai.adaptations)).toBe(true)
      expect(Array.isArray(row.ai.coachingCues)).toBe(true)
    }
  })

  it('builds custom exercise for generated blocks', () => {
    const plan = {
      title: 'AI',
      coachBriefing: 'Test',
      durationMin: 10,
      theme: 'techniek',
      engine: 'rules',
      modelId: 'rules-v1',
      blocks: [{
        source: 'generated',
        title: 'Druk zetten 3v2',
        category: 'tactiek',
        durationMin: 10,
        minPlayers: 5,
        maxPlayers: 12,
        description: 'Kleine partij met druk.',
        setup: '20x15m',
        rules: ['5 seconden druk'],
        adaptations: [],
        coachingCues: ['Praat'],
        whyThis: 'Focus druk',
      }],
    }
    const [row] = hydrateSessionPlan(plan, { ageGroup: 'O11' })
    expect(isCustomExercise(row.exercise)).toBe(true)
    expect(row.exercise.source).toBe('AI Coach')
    expect(row.exercise.title).toBe('Druk zetten 3v2')
    expect(row.ai.whyThis).toBe('Focus druk')
  })

  it('can resolve custom library exercises by id', () => {
    const custom = buildCustomExercise({
      id: 'custom-test-1',
      title: 'Eigen passing',
      category: 'techniek',
      durationMin: 12,
      description: 'Passvorm',
      setup: 'Cones',
      rules: ['2 touches'],
    }, 'O11')
    const plan = {
      title: 'Custom',
      coachBriefing: 'Brief',
      durationMin: 12,
      theme: 'techniek',
      engine: 'rules',
      blocks: [{
        source: 'library',
        exerciseId: custom.id,
        title: custom.title,
        category: custom.category,
        durationMin: 12,
        minPlayers: custom.minPlayers,
        maxPlayers: custom.maxPlayers,
        description: custom.description,
        setup: custom.setup,
        rules: custom.rules,
        adaptations: [],
        coachingCues: [],
        whyThis: 'Eigen oefening',
      }],
    }
    const [row] = hydrateSessionPlan(plan, { customExercises: [custom] })
    expect(row.exercise.id).toBe('custom-test-1')
    expect(row.ai.whyThis).toBe('Eigen oefening')
  })
})
