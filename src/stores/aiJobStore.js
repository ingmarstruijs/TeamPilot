import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/**
 * Survives Training route leave/remount so generate progress stays visible.
 */
export const useAiJobStore = defineStore('aiJob', () => {
  /** @type {import('vue').Ref<'idle'|'running'|'done'|'error'>} */
  const status = ref('idle')
  const progress = ref(0)
  const text = ref('')
  const teamId = ref(null)
  /** @type {import('vue').Ref<import('@/ai/types.js').SessionPlan|null>} */
  const resultPlan = ref(null)
  const structureReady = ref(false)
  const errorMessage = ref('')
  const startedAt = ref(0)
  /** @type {AbortController|null} */
  let abortController = null

  const isRunning = computed(() => status.value === 'running')

  function start(nextTeamId) {
    abortController?.abort()
    abortController = new AbortController()
    status.value = 'running'
    progress.value = 0.02
    text.value = ''
    teamId.value = nextTeamId
    resultPlan.value = null
    structureReady.value = false
    errorMessage.value = ''
    startedAt.value = Date.now()
    return abortController.signal
  }

  /**
   * @param {{ progress?: number, text?: string }} patch
   */
  function setProgress(patch = {}) {
    if (typeof patch.progress === 'number') {
      progress.value = Math.max(progress.value, Math.min(1, patch.progress))
    }
    if (patch.text) text.value = patch.text
  }

  /**
   * @param {import('@/ai/types.js').SessionPlan} plan
   */
  function markStructure(plan) {
    structureReady.value = true
    resultPlan.value = plan
    setProgress({ progress: Math.max(progress.value, 0.4), text: 'Oefeningen klaar' })
  }

  /**
   * @param {import('@/ai/types.js').SessionPlan} plan
   */
  function complete(plan) {
    status.value = 'done'
    resultPlan.value = plan
    progress.value = 1
    text.value = 'Klaar'
    abortController = null
  }

  /**
   * @param {string} message
   */
  function fail(message) {
    status.value = 'error'
    errorMessage.value = message || 'Mislukt'
    abortController = null
  }

  function abort() {
    abortController?.abort()
    abortController = null
    if (status.value === 'running') {
      status.value = structureReady.value && resultPlan.value ? 'done' : 'idle'
      if (status.value === 'done') text.value = 'Gestopt — slimme planning behouden'
    }
  }

  function clear() {
    status.value = 'idle'
    progress.value = 0
    text.value = ''
    teamId.value = null
    resultPlan.value = null
    structureReady.value = false
    errorMessage.value = ''
    startedAt.value = 0
    abortController = null
  }

  /**
   * After UI has consumed a finished job, reset to idle without losing applied session.
   */
  function acknowledge() {
    if (status.value === 'done' || status.value === 'error') {
      clear()
    }
  }

  return {
    status,
    progress,
    text,
    teamId,
    resultPlan,
    structureReady,
    errorMessage,
    startedAt,
    isRunning,
    start,
    setProgress,
    markStructure,
    complete,
    fail,
    abort,
    clear,
    acknowledge,
  }
})
