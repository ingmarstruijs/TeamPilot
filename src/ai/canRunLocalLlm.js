import { DEFAULT_MODEL_BYTES, estimateBrowserStorage } from './aiPreferences.js'

/** Refuse download/run on very low-RAM devices when the API reports it. */
export const MIN_DEVICE_MEMORY_GB = 4

/** Require this multiple of packed model size free before offering download. */
export const DOWNLOAD_FREE_STORAGE_FACTOR = 1.3

/**
 * @typedef {'ok'|'no-webgpu'|'low-memory'|'low-storage'} LocalLlmGateReason
 */

/**
 * @typedef {object} LocalLlmGate
 * @property {boolean} ok
 * @property {LocalLlmGateReason} reason
 * @property {boolean} webgpu
 * @property {number|null} deviceMemoryGb
 * @property {number|null} freeBytes
 */

/**
 * Probe WebGPU + light device heuristics before offering local LLM.
 * @returns {Promise<LocalLlmGate>}
 */
export async function probeLocalLlmGate() {
  let webgpu = false
  try {
    if (typeof navigator !== 'undefined' && navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter()
      webgpu = Boolean(adapter)
    }
  } catch {
    webgpu = false
  }

  if (!webgpu) {
    return {
      ok: false,
      reason: 'no-webgpu',
      webgpu: false,
      deviceMemoryGb: readDeviceMemoryGb(),
      freeBytes: null,
    }
  }

  const deviceMemoryGb = readDeviceMemoryGb()
  if (deviceMemoryGb != null && deviceMemoryGb < MIN_DEVICE_MEMORY_GB) {
    return {
      ok: false,
      reason: 'low-memory',
      webgpu: true,
      deviceMemoryGb,
      freeBytes: null,
    }
  }

  return {
    ok: true,
    reason: 'ok',
    webgpu: true,
    deviceMemoryGb,
    freeBytes: null,
  }
}

/**
 * Probe WebGPU availability before offering local LLM download.
 * @returns {Promise<boolean>}
 */
export async function canRunLocalLlm() {
  const gate = await probeLocalLlmGate()
  return gate.ok
}

/**
 * Extra free-storage check before starting a download.
 * @param {{ modelBytes?: number }} [options]
 * @returns {Promise<LocalLlmGate>}
 */
export async function probeDownloadGate(options = {}) {
  const base = await probeLocalLlmGate()
  if (!base.ok) return base

  const need = (options.modelBytes ?? DEFAULT_MODEL_BYTES) * DOWNLOAD_FREE_STORAGE_FACTOR
  const est = await estimateBrowserStorage()
  if (!est) {
    return { ...base, freeBytes: null }
  }
  if (est.free < need) {
    return {
      ok: false,
      reason: 'low-storage',
      webgpu: true,
      deviceMemoryGb: base.deviceMemoryGb,
      freeBytes: est.free,
    }
  }
  return { ...base, freeBytes: est.free }
}

/**
 * Prefer rules enrichment skip when battery is low and not charging.
 * @returns {Promise<boolean>}
 */
export async function shouldSkipLlmForBattery() {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.getBattery !== 'function') {
      return false
    }
    const battery = await navigator.getBattery()
    if (!battery) return false
    return !battery.charging && Number(battery.level) < 0.2
  } catch {
    return false
  }
}

/**
 * @returns {number|null}
 */
function readDeviceMemoryGb() {
  try {
    if (typeof navigator === 'undefined') return null
    const mem = Number(navigator.deviceMemory)
    return Number.isFinite(mem) && mem > 0 ? mem : null
  } catch {
    return null
  }
}
