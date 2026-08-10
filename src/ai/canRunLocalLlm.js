/**
 * Probe WebGPU availability before offering local LLM download.
 * @returns {Promise<boolean>}
 */
export async function canRunLocalLlm() {
  try {
    if (typeof navigator === 'undefined' || !navigator.gpu) return false
    const adapter = await navigator.gpu.requestAdapter()
    return Boolean(adapter)
  } catch {
    return false
  }
}
