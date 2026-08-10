import { createRulesCoach } from './models/rulesCoach.js'
import { createWebLlmCoach } from './models/webllmCoach.js'
import { canRunLocalLlm } from './canRunLocalLlm.js'
import { readAiPreferences } from './aiPreferences.js'

/**
 * Factory: rules by default; WebLLM when opted-in + WebGPU + download accepted.
 *
 * @param {object} [overrides]
 * @param {boolean} [overrides.preferLocalLlm]
 * @param {string} [overrides.modelId]
 * @param {number|null} [overrides.downloadAcceptedAt]
 * @param {() => Promise<boolean>} [overrides.canRun]
 * @param {object} [overrides.webLlmOptions] passed to createWebLlmCoach (tests)
 * @returns {Promise<import('./coachModel.js').CoachModel>}
 */
export async function createCoach(overrides = {}) {
  const prefs = { ...readAiPreferences(), ...overrides }
  const canRun = overrides.canRun || canRunLocalLlm

  if (!prefs.preferLocalLlm) {
    return createRulesCoach()
  }

  const supported = await canRun()
  if (!supported) {
    return createRulesCoach()
  }

  if (!prefs.downloadAcceptedAt) {
    return createRulesCoach()
  }

  return createWebLlmCoach({
    modelId: prefs.modelId,
    ...(overrides.webLlmOptions || {}),
  })
}

export { readAiPreferences } from './aiPreferences.js'
