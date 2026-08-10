import { getExerciseTitle, getRinusRules, isCustomExercise } from '@/utils/exerciseText'

/**
 * Convert a Training session block into a PlannedBlock for adaptBlock.
 *
 * @param {{ exercise: object, durationMin: number, ai?: object }} sessionBlock
 * @returns {import('./types.js').PlannedBlock}
 */
export function sessionBlockToPlanned(sessionBlock) {
  const exercise = sessionBlock.exercise ?? {}
  const ai = sessionBlock.ai ?? {}
  const source = isCustomExercise(exercise)
    ? (exercise.source === 'AI Coach' ? 'generated' : 'library')
    : (String(exercise.id ?? '').startsWith('rinus') ? 'rinus' : 'library')

  const baseRules = Array.isArray(ai.rules) && ai.rules.length
    ? ai.rules
    : getRinusRules(exercise)

  return {
    source,
    exerciseId: exercise.id,
    title: getExerciseTitle(exercise),
    category: exercise.category,
    durationMin: sessionBlock.durationMin,
    minPlayers: exercise.minPlayers ?? 1,
    maxPlayers: exercise.maxPlayers ?? 22,
    description: exercise.description ?? '',
    setup: exercise.setup ?? '',
    rules: [...baseRules],
    adaptations: [...(ai.adaptations ?? [])],
    coachingCues: [...(ai.coachingCues ?? [])],
    whyThis: ai.whyThis ?? '',
  }
}

/**
 * Apply an adapted PlannedBlock back onto a session block.
 *
 * @param {{ uid: number, exercise: object, durationMin: number, ai?: object }} sessionBlock
 * @param {import('./types.js').PlannedBlock} adapted
 * @param {{ engine?: string, modelId?: string }} [meta]
 */
export function applyAdaptedBlock(sessionBlock, adapted, meta = {}) {
  const prevAi = sessionBlock.ai ?? {}
  const exercise = sessionBlock.exercise

  if (isCustomExercise(exercise) && Array.isArray(adapted.rules)) {
    exercise.rules = [...adapted.rules]
  }

  return {
    ...sessionBlock,
    durationMin: adapted.durationMin ?? sessionBlock.durationMin,
    ai: {
      whyThis: adapted.whyThis ?? '',
      adaptations: adapted.adaptations ?? [],
      coachingCues: adapted.coachingCues ?? [],
      rules: adapted.rules ?? [],
      engine: prevAi.engine ?? meta.engine ?? 'rules',
      modelId: prevAi.modelId ?? meta.modelId,
    },
  }
}
