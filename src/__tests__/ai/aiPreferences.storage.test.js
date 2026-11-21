import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  clearWebLlmStorage,
  isWebLlmCacheName,
  probeWebLlmStoragePresent,
  syncDownloadAcceptedWithProbe,
  writeAiPreferences,
  AI_PREFS_KEY,
} from '@/ai/aiPreferences'

describe('aiPreferences storage helpers', () => {
  beforeEach(() => {
    localStorage.removeItem(AI_PREFS_KEY)
  })

  afterEach(() => {
    localStorage.removeItem(AI_PREFS_KEY)
    vi.restoreAllMocks()
  })

  it('detects WebLLM-related cache names', () => {
    expect(isWebLlmCacheName('webllm-cache-qwen')).toBe(true)
    expect(isWebLlmCacheName('mlc-model')).toBe(true)
    expect(isWebLlmCacheName('vite-asset-cache')).toBe(false)
  })

  it('clears only matching caches by default', async () => {
    const deleted = []
    vi.stubGlobal('caches', {
      keys: async () => ['webllm-foo', 'vite-prefetch', 'mlc-bar'],
      delete: async (k) => { deleted.push(k); return true },
    })
    const result = await clearWebLlmStorage({ aggressive: false })
    expect(deleted.sort()).toEqual(['mlc-bar', 'webllm-foo'])
    expect(result.clearedCaches).toBe(2)
  })

  it('clears all caches when aggressive', async () => {
    const deleted = []
    vi.stubGlobal('caches', {
      keys: async () => ['webllm-foo', 'vite-prefetch'],
      delete: async (k) => { deleted.push(k); return true },
    })
    const result = await clearWebLlmStorage({ aggressive: true })
    expect(deleted.sort()).toEqual(['vite-prefetch', 'webllm-foo'])
    expect(result.clearedCaches).toBe(2)
  })

  it('syncs stale downloadAcceptedAt when probe finds nothing', async () => {
    writeAiPreferences({ preferLocalLlm: true, downloadAcceptedAt: Date.now() })
    vi.stubGlobal('caches', { keys: async () => [] })
    const synced = await syncDownloadAcceptedWithProbe()
    expect(synced.present).toBe(false)
    expect(synced.downloadAcceptedAt).toBeNull()
  })

  it('probe returns true when a webllm cache exists', async () => {
    vi.stubGlobal('caches', {
      keys: async () => ['webllm-model-cache'],
    })
    await expect(probeWebLlmStoragePresent()).resolves.toBe(true)
  })
})
