import { filterExercises, scoreExercise } from '@/utils/trainingEngine'
import { getExerciseTitle } from '@/utils/exerciseText'

/**
 * Compact card for prompting / later WebLLM allow-lists.
 * @param {object} ex
 * @returns {import('./types.js').CandidateCard}
 */
export function toCandidateCard(ex) {
  return {
    id: ex.id,
    title: getExerciseTitle(ex),
    category: ex.category,
    durationMin: ex.durationMin,
    minPlayers: ex.minPlayers,
    maxPlayers: ex.maxPlayers,
    focusPositions: ex.focusPositions ?? [],
    intensity: ex.intensity ?? 'medium',
  }
}

/**
 * Rank library exercises for each skeleton slot.
 * Seam: later swap body for vector search.
 *
 * @param {import('./types.js').CoachContext} ctx
 * @param {{ blocks?: Array<{ exercise: object, durationMin: number }> }} [skeleton]
 * @param {{ perSlot?: number }} [options]
 * @returns {{ bySlot: Array<{ category: string, targetMin: number, candidates: import('./types.js').CandidateCard[] }>, flat: import('./types.js').CandidateCard[] }}
 */
export function retrieveCandidates(ctx, skeleton = {}, options = {}) {
  const perSlot = options.perSlot ?? 5
  const scoreCtx = {
    cycleTheme: ctx.cycleTheme,
    recentIds: ctx.recentExerciseIds ?? [],
    needsAttackFocus: ctx.balance?.needsAttackFocus,
    needsDefenceFocus: ctx.balance?.needsDefenceFocus,
    focusPositions: (ctx.presentPlayers ?? []).map(p => p.position),
  }

  const slots = (skeleton.blocks ?? []).map(b => ({
    category: b.exercise?.category,
    targetMin: b.durationMin,
    usedId: b.exercise?.id,
  }))

  // If no skeleton, retrieve a mixed pool per common categories
  const fallbackSlots = slots.length
    ? slots
    : [
        { category: 'warming-up', targetMin: Math.round(ctx.durationMin * 0.1) },
        { category: 'techniek', targetMin: Math.round(ctx.durationMin * 0.25) },
        { category: 'tactiek', targetMin: Math.round(ctx.durationMin * 0.25) },
        { category: 'partijvorm', targetMin: Math.round(ctx.durationMin * 0.25) },
        { category: 'afsluiting', targetMin: Math.round(ctx.durationMin * 0.1) },
      ]

  const seen = new Set()
  const bySlot = fallbackSlots.map(slot => {
    const pool = filterExercises({
      ageGroup: ctx.ageGroup,
      knvbLevel: ctx.knvbLevel,
      playerCount: ctx.playerCount || undefined,
      trainingType: ctx.trainingType,
      category: slot.category,
    })

    const ranked = [...pool]
      .sort((a, b) => scoreExercise(b, scoreCtx, slot.targetMin) - scoreExercise(a, scoreCtx, slot.targetMin))
      .slice(0, perSlot)

    const candidates = ranked.map(toCandidateCard)
    for (const c of candidates) seen.add(c.id)

    return {
      category: slot.category,
      targetMin: slot.targetMin,
      candidates,
    }
  })

  return {
    bySlot,
    flat: bySlot.flatMap(s => s.candidates).filter((c, i, arr) => arr.findIndex(x => x.id === c.id) === i),
  }
}
