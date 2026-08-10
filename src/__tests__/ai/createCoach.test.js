import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCoach } from '@/ai/createCoach'
import { writeAiPreferences, AI_PREFS_KEY } from '@/ai/aiPreferences'

describe('createCoach', () => {
  beforeEach(() => {
    localStorage.removeItem(AI_PREFS_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(AI_PREFS_KEY)
    vi.restoreAllMocks()
  })

  it('returns rules coach when preferLocalLlm is off', async () => {
    writeAiPreferences({ preferLocalLlm: false, downloadAcceptedAt: null })
    const coach = await createCoach({ canRun: async () => true })
    expect(coach.id).toBe('rules-v1')
  })

  it('returns rules coach when WebGPU unsupported', async () => {
    writeAiPreferences({ preferLocalLlm: true, downloadAcceptedAt: Date.now() })
    const coach = await createCoach({ canRun: async () => false })
    expect(coach.id).toBe('rules-v1')
  })

  it('returns rules coach when download not accepted yet', async () => {
    writeAiPreferences({ preferLocalLlm: true, downloadAcceptedAt: null })
    const coach = await createCoach({ canRun: async () => true })
    expect(coach.id).toBe('rules-v1')
  })

  it('returns webllm coach when opted-in, supported, and downloaded', async () => {
    writeAiPreferences({ preferLocalLlm: true, downloadAcceptedAt: Date.now() })
    const coach = await createCoach({
      canRun: async () => true,
      webLlmOptions: {
        createEngine: async () => ({
          chat: { completions: { create: vi.fn() } },
        }),
      },
    })
    expect(coach.id).toBe('webllm-v1')
  })
})
