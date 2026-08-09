import { analyzePlayerBalance, getCycleTheme } from '@/utils/trainingEngine'
import { normalizeAgeGroup } from '@/data/formations'

/**
 * Pure builder — no Pinia imports.
 *
 * @param {object} input
 * @param {string} input.ageGroup
 * @param {number} input.knvbLevel
 * @param {string} [input.knvbClass]
 * @param {string} [input.trainingType]
 * @param {number} [input.durationMin]
 * @param {number} [input.cycleWeek]
 * @param {Array<{id:string,name:string,position:string}>} [input.presentPlayers]
 * @param {string[]} [input.recentExerciseIds]
 * @param {string} [input.focus]
 * @returns {import('./types.js').CoachContext}
 */
export function buildCoachContext(input) {
  const presentPlayers = Array.isArray(input.presentPlayers) ? input.presentPlayers : []
  const cycleWeek = Math.max(1, Number(input.cycleWeek) || 1)
  const cycleTheme = getCycleTheme(cycleWeek)
  const balance = analyzePlayerBalance(presentPlayers)
  const focus = String(input.focus ?? '').trim().slice(0, 80)

  return {
    ageGroup: normalizeAgeGroup(input.ageGroup) || 'O11',
    knvbLevel: Math.max(1, Math.min(7, Number(input.knvbLevel) || 1)),
    knvbClass: input.knvbClass ?? '',
    trainingType: input.trainingType || 'gemengd',
    durationMin: Math.max(30, Math.min(120, Number(input.durationMin) || 60)),
    cycleWeek,
    cycleTheme,
    playerCount: presentPlayers.length || Number(input.playerCount) || 0,
    presentPlayers,
    recentExerciseIds: Array.isArray(input.recentExerciseIds) ? input.recentExerciseIds : [],
    focus: focus || undefined,
    balance,
    locale: 'nl',
  }
}
