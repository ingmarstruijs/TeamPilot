import { generateTraining, getCycleThemeLabel } from '@/utils/trainingEngine'
import { getExerciseTitle, getRinusRules, formatPlayerNote } from '@/utils/exerciseText'
import { retrieveCandidates } from './retrieveCandidates.js'
import { validateSessionPlan } from './validateSessionPlan.js'
import { redistributeDurations } from './models/rulesCoach.js'
import { ageGroupLabel } from '@/data/formations'

/**
 * @param {import('./types.js').CoachContext} ctx
 */
export function buildSkeletonFromRules(ctx) {
  return generateTraining({
    ageGroup: ctx.ageGroup,
    knvbLevel: ctx.knvbLevel,
    playerCount: ctx.playerCount || undefined,
    trainingType: ctx.trainingType,
    durationMin: ctx.durationMin,
    cycleWeek: ctx.cycleWeek,
    recentIds: ctx.recentExerciseIds ?? [],
    presentPlayers: ctx.presentPlayers ?? [],
  })
}

/**
 * @param {object} skeleton
 * @param {import('./types.js').CoachContext} ctx
 * @param {string[]} [errors]
 * @returns {import('./types.js').SessionPlan}
 */
export function finalizeRulesFallback(skeleton, ctx, errors = []) {
  const theme = getCycleThemeLabel(ctx.cycleTheme)
  let blocks = (skeleton.blocks ?? []).map(b => {
    const exercise = b.exercise
    const note = formatPlayerNote(exercise, ctx.playerCount || null).trim()
    return {
      source: exercise.rinusId ? 'rinus' : 'library',
      exerciseId: exercise.id,
      title: getExerciseTitle(exercise),
      category: exercise.category,
      durationMin: b.durationMin,
      minPlayers: exercise.minPlayers,
      maxPlayers: exercise.maxPlayers,
      description: exercise.description ?? '',
      setup: exercise.setup ?? '',
      rules: getRinusRules(exercise).length ? getRinusRules(exercise) : (exercise.rules ?? []),
      adaptations: note ? [note] : [],
      coachingCues: ['Doorgaan met de geplande oefening.'],
      whyThis: 'Fallback op regel-engine na ongeldig AI-plan',
    }
  })
  blocks = redistributeDurations(blocks, ctx.durationMin)

  const briefingBits = [
    `Veilige planning voor ${ageGroupLabel(ctx.ageGroup)} (${ctx.playerCount} spelers).`,
    theme ? `Thema: ${theme}.` : '',
  ]
  if (errors.length) {
    briefingBits.push('AI-plan was ongeldig; regelskeleton gebruikt.')
  }

  return {
    title: `${theme}-training`,
    coachBriefing: briefingBits.filter(Boolean).join(' '),
    durationMin: blocks.reduce((s, b) => s + b.durationMin, 0),
    theme,
    blocks,
    engine: 'rules',
    modelId: 'rules-fallback',
  }
}

/**
 * Product brain: skeleton → candidates → coach → validate → fallback.
 *
 * @param {import('./types.js').CoachContext} ctx
 * @param {import('./coachModel.js').CoachModel} coach
 * @param {{ customExercises?: object[] }} [options]
 * @returns {Promise<import('./types.js').SessionPlan>}
 */
export async function orchestrateSession(ctx, coach, options = {}) {
  const skeleton = buildSkeletonFromRules(ctx)
  const candidates = retrieveCandidates(ctx, skeleton)
  const enriched = { ...ctx, skeleton, candidates }

  let plan
  try {
    plan = await coach.planSession(enriched)
  } catch {
    return finalizeRulesFallback(skeleton, ctx, ['planSession failed'])
  }

  const validated = validateSessionPlan(plan, ctx, {
    customExercises: options.customExercises,
  })

  if (!validated.ok) {
    return finalizeRulesFallback(skeleton, ctx, validated.errors)
  }

  return validated.plan
}
