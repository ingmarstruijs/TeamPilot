import { generateTraining } from '@/utils/trainingEngine'
import { retrieveCandidates } from './retrieveCandidates.js'
import { validateSessionPlan } from './validateSessionPlan.js'
import { planSessionSync } from './models/rulesCoach.js'

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
 * Use the normal rules coach output when local AI fails.
 * No user-facing "fallback/AI failed" copy on blocks or briefing.
 *
 * @param {object} _skeleton
 * @param {import('./types.js').CoachContext} ctx
 * @param {string[]} [_errors]
 * @returns {import('./types.js').SessionPlan}
 */
export function finalizeRulesFallback(_skeleton, ctx, _errors = []) {
  const plan = planSessionSync(ctx)
  return {
    ...plan,
    engine: 'rules',
    modelId: 'rules-v1',
  }
}

/**
 * Product brain: skeleton → candidates → coach → validate → fallback.
 *
 * @param {import('./types.js').CoachContext} ctx
 * @param {import('./coachModel.js').CoachModel} coach
 * @param {{
 *   customExercises?: object[],
 *   onProgress?: (p:{progress:number,text:string})=>void,
 * }} [options]
 * @returns {Promise<import('./types.js').SessionPlan>}
 */
export async function orchestrateSession(ctx, coach, options = {}) {
  const onProgress = options.onProgress || (() => {})

  onProgress({ progress: 0.04, text: 'Basisplanning maken…' })
  const skeleton = buildSkeletonFromRules(ctx)

  onProgress({ progress: 0.1, text: 'Oefeningen zoeken…' })
  const candidates = retrieveCandidates(ctx, skeleton)
  const enriched = { ...ctx, skeleton, candidates }

  let plan
  try {
    onProgress({ progress: 0.14, text: 'Coach starten…' })
    plan = await coach.planSession(enriched, {
      onProgress: (p) => {
        const local = Math.max(0, Math.min(1, Number(p.progress) || 0))
        onProgress({
          progress: 0.14 + local * 0.78,
          text: p.text || 'Training plannen…',
        })
      },
    })
  } catch {
    onProgress({ progress: 0.92, text: 'Terugvallen op slimme planning…' })
    return finalizeRulesFallback(skeleton, ctx, ['planSession failed'])
  }

  onProgress({ progress: 0.94, text: 'Plan controleren…' })
  const validated = validateSessionPlan(plan, ctx, {
    customExercises: options.customExercises,
  })

  if (!validated.ok) {
    onProgress({ progress: 0.96, text: 'Terugvallen op slimme planning…' })
    return finalizeRulesFallback(skeleton, ctx, validated.errors)
  }

  onProgress({ progress: 1, text: 'Klaar' })
  return validated.plan
}
