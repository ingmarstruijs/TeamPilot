import { describe, it, expect } from 'vitest'
import { blocksToSerializable } from '@/utils/savedTraining'
import { hydrateSessionPlan } from '@/ai/hydrateSessionPlan'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { getExerciseById } from '@/data/exercises'

describe('draft ai meta round-trip', () => {
  it('persists and restores ai fields on session blocks', () => {
    const presentPlayers = Array.from({ length: 11 }, (_, i) => ({
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
    const hydrated = hydrateSessionPlan(plan).map((b, i) => ({
      uid: i + 1,
      exercise: b.exercise,
      durationMin: b.durationMin,
      ai: b.ai,
    }))

    const serialized = blocksToSerializable(hydrated)
    expect(serialized.every(b => b.ai?.engine === 'rules')).toBe(true)

    const restored = serialized.map(b => {
      const exercise = getExerciseById(b.exerciseId)
      return { exercise, durationMin: b.durationMin, ai: b.ai }
    })
    expect(restored[0].ai.whyThis).toBe(hydrated[0].ai.whyThis)
    expect(restored[0].ai.coachingCues).toEqual(hydrated[0].ai.coachingCues)
  })
})
