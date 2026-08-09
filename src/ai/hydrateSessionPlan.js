import { getExerciseById } from '@/data/exercises'
import { buildCustomExercise } from '@/utils/customExercises'

/**
 * Hydrate a validated SessionPlan into Training session block shapes.
 *
 * @param {import('./types.js').SessionPlan} plan
 * @param {{ customExercises?: object[], ageGroup?: string }} [options]
 * @returns {Array<{ exercise: object, durationMin: number, ai: object }>}
 */
export function hydrateSessionPlan(plan, options = {}) {
  const customExercises = options.customExercises ?? []
  const ageGroup = options.ageGroup
  const engine = plan.engine ?? 'rules'

  return (plan.blocks ?? []).map((block, index) => {
    let exercise = null

    if (block.source === 'generated') {
      exercise = buildCustomExercise({
        id: block.exerciseId || `custom-ai-${Date.now()}-${index}`,
        title: block.title,
        category: block.category,
        durationMin: block.durationMin,
        minPlayers: block.minPlayers,
        maxPlayers: block.maxPlayers,
        description: block.description,
        setup: block.setup,
        rules: block.rules,
      }, ageGroup)
      exercise.source = 'AI Coach'
    } else {
      exercise = getExerciseById(block.exerciseId, customExercises)
      if (!exercise) {
        throw new Error(`Kan oefening niet laden: ${block.exerciseId}`)
      }
    }

    return {
      exercise,
      durationMin: block.durationMin,
      ai: {
        whyThis: block.whyThis ?? '',
        adaptations: block.adaptations ?? [],
        coachingCues: block.coachingCues ?? [],
        engine,
        modelId: plan.modelId,
      },
    }
  })
}
