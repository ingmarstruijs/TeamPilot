import { generateTraining } from '@/utils/trainingEngine'
import { retrieveCandidates } from './retrieveCandidates.js'
import { validateSessionPlan } from './validateSessionPlan.js'
import { planSessionSync } from './models/rulesCoach.js'
import { shouldSkipLlmForBattery } from './canRunLocalLlm.js'
import { withTimeout } from './withTimeout.js'

/** Soft timeout for local LLM narration enrichment (ms). */
export const ENRICH_TIMEOUT_MS = 15_000

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
 * Product brain: rules structure first → optional LLM narration enrich → fallback.
 *
 * Progressive UX: call `onStructure(plan)` as soon as exercises are ready so the
 * Training UI can hydrate before briefing/cues finish.
 *
 * @param {import('./types.js').CoachContext} ctx
 * @param {import('./coachModel.js').CoachModel} coach
 * @param {{
 *   customExercises?: object[],
 *   onProgress?: (p:{progress:number,text:string})=>void,
 *   onStructure?: (plan: import('./types.js').SessionPlan)=>void,
 *   signal?: AbortSignal,
 *   enrichTimeoutMs?: number,
 *   skipEnrich?: boolean,
 * }} [options]
 * @returns {Promise<import('./types.js').SessionPlan>}
 */
export async function orchestrateSession(ctx, coach, options = {}) {
  const onProgress = options.onProgress || (() => {})
  const onStructure = options.onStructure || (() => {})
  const enrichTimeoutMs = options.enrichTimeoutMs ?? ENRICH_TIMEOUT_MS

  onProgress({ progress: 0.04, text: 'Basisplanning maken…' })
  const skeleton = buildSkeletonFromRules(ctx)

  onProgress({ progress: 0.1, text: 'Oefeningen zoeken…' })
  const candidates = retrieveCandidates(ctx, skeleton)
  const enriched = { ...ctx, skeleton, candidates }

  onProgress({ progress: 0.2, text: 'Oefeningen klaarzetten…' })
  const structurePlan = planSessionSync(enriched)
  onStructure(structurePlan)
  onProgress({ progress: 0.4, text: 'Oefeningen klaar' })

  if (options.signal?.aborted) {
    return structurePlan
  }

  const canEnrich = typeof coach?.enrichNarration === 'function'
    && coach.id !== 'rules-v1'
    && !options.skipEnrich

  if (!canEnrich) {
    onProgress({ progress: 1, text: 'Klaar' })
    return structurePlan
  }

  if (await shouldSkipLlmForBattery()) {
    onProgress({ progress: 1, text: 'Briefing overgeslagen (batterij)' })
    return structurePlan
  }

  try {
    onProgress({ progress: 0.45, text: 'Briefing schrijven…' })
    const narrated = await withTimeout(
      coach.enrichNarration(enriched, structurePlan, {
        onProgress: (p) => {
          const local = Math.max(0, Math.min(1, Number(p.progress) || 0))
          onProgress({
            progress: 0.45 + local * 0.5,
            text: p.text || 'Briefing schrijven…',
          })
        },
        signal: options.signal,
      }),
      enrichTimeoutMs,
      'enrich-timeout',
    )

    if (options.signal?.aborted) return structurePlan

    onProgress({ progress: 0.96, text: 'Plan controleren…' })
    const validated = validateSessionPlan(narrated, ctx, {
      customExercises: options.customExercises,
    })
    if (!validated.ok) {
      onProgress({ progress: 1, text: 'Slimme planning behouden' })
      return structurePlan
    }
    onProgress({ progress: 1, text: 'Klaar' })
    return validated.plan
  } catch {
    onProgress({ progress: 1, text: 'Slimme planning behouden' })
    return structurePlan
  }
}
