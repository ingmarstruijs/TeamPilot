import { createRulesCoach } from './models/rulesCoach.js'

const PREFS_KEY = 'teampilot_ai_v1'

/**
 * @returns {{ preferLocalLlm: boolean, modelId: string, downloadAcceptedAt: number|null }}
 */
export function readAiPreferences() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(PREFS_KEY) : null
    if (!raw) {
      return {
        preferLocalLlm: false,
        modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1',
        downloadAcceptedAt: null,
      }
    }
    const parsed = JSON.parse(raw)
    return {
      preferLocalLlm: Boolean(parsed.preferLocalLlm),
      modelId: parsed.modelId || 'Qwen2.5-1.5B-Instruct-q4f16_1',
      downloadAcceptedAt: parsed.downloadAcceptedAt ?? null,
    }
  } catch {
    return {
      preferLocalLlm: false,
      modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1',
      downloadAcceptedAt: null,
    }
  }
}

/**
 * Factory — PR A always returns rules-v1; WebLLM lands in PR C.
 *
 * @param {object} [preferences]
 * @returns {Promise<import('./coachModel.js').CoachModel>}
 */
export async function createCoach(preferences = {}) {
  // Slice 2 will branch on preferLocalLlm + WebGPU.
  void preferences
  void readAiPreferences
  return createRulesCoach()
}
