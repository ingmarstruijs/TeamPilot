<template>
  <component
    :is="collapsible ? 'details' : 'section'"
    class="ai-model-settings"
    :class="{ 'is-collapsible': collapsible }"
  >
    <summary v-if="collapsible" class="ai-model-summary md-label-lg">
      <span class="summary-text">{{ summaryText }}</span>
      <span class="material-symbols-rounded summary-chevron" aria-hidden="true">expand_more</span>
    </summary>

    <div class="ai-model-body">
      <div class="ai-model-head">
        <p v-if="!collapsible" class="md-title-sm ai-model-title">{{ t('aiModel.title') }}</p>
        <p class="md-body-sm ai-model-copy">
          {{ t('aiModel.copy', { make: t('training.make') }) }}
        </p>
        <p class="md-label-sm ai-model-note">
          {{ t('aiModel.note') }}
        </p>
      </div>

      <label class="ai-model-toggle">
        <input
          type="checkbox"
          :checked="preferLocalLlm"
          :disabled="!supported || busy"
          @change="onToggle($event.target.checked)"
        />
        <span class="md-body-sm">{{ t('aiModel.toggle') }}</span>
      </label>

      <p class="md-label-sm ai-model-status" aria-live="polite">
        {{ t('aiModel.status', { label: statusLabel }) }}
      </p>
      <p v-if="storageLabel" class="md-label-sm ai-model-note">
        {{ storageLabel }}
      </p>
      <p v-if="lastErrorHint" class="md-label-sm ai-model-hint">
        {{ lastErrorHint }}
      </p>

      <div class="ai-model-actions">
        <button
          v-if="supported && preferLocalLlm && !downloaded"
          type="button"
          class="btn btn-tonal ai-model-btn"
          :disabled="busy"
          @click="downloadModel()"
        >
          {{ busy ? progressLabel : t('aiModel.download') }}
        </button>
        <button
          v-if="supported && preferLocalLlm && !downloaded && lastErrorHint"
          type="button"
          class="btn btn-text ai-model-btn"
          :disabled="busy"
          @click="clearAndRetry"
        >
          {{ t('aiModel.clearRetry') }}
        </button>
        <button
          v-if="downloaded"
          type="button"
          class="btn btn-text ai-model-btn"
          :disabled="busy"
          @click="removeModel"
        >
          {{ t('aiModel.remove') }}
        </button>
      </div>

      <div
        v-if="busy"
        class="ai-model-progress"
        role="progressbar"
        :aria-valuenow="Math.round(progress * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="ai-model-progress-bar" :style="{ width: `${Math.round(progress * 100)}%` }" />
      </div>
    </div>
  </component>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { canRunLocalLlm } from '@/ai/canRunLocalLlm'
import {
  clearWebLlmStorage,
  DEFAULT_LOCAL_MODEL_ID,
  estimateBrowserStorage,
  isStorageQuotaError,
  readAiPreferences,
  requestPersistentStorage,
  writeAiPreferences,
} from '@/ai/aiPreferences'
import { createWebLlmCoach, resetWebLlmEngineCache } from '@/ai/models/webllmCoach'
import { showSnackbar } from '@/composables/useSnackbar'
import { t } from '@/i18n'

const emit = defineEmits(['change'])

const props = defineProps({
  collapsible: { type: Boolean, default: false },
})

const supported = ref(true)
const preferLocalLlm = ref(false)
const downloaded = ref(false)
const modelId = ref('')
const busy = ref(false)
const progress = ref(0)
const progressText = ref('')
const lastError = ref('')
const lastErrorHint = ref('')
const storageLabel = ref('')

const statusLabel = computed(() => {
  if (!supported.value) return t('aiModel.statusUnsupported')
  if (busy.value) {
    const pct = Math.round(progress.value * 100)
    const extra = progressText.value ? ` · ${progressText.value}` : ''
    return t('aiModel.statusBusy', { pct: `${pct}%`, extra })
  }
  if (!preferLocalLlm.value) return t('aiModel.statusOff')
  if (lastError.value) return t('aiModel.statusFailed', { error: lastError.value })
  if (!downloaded.value) return t('aiModel.statusNotDownloaded')
  return t('aiModel.statusOn')
})

const progressLabel = computed(() => t('aiModel.statusBusy', { pct: `${Math.round(progress.value * 100)}%`, extra: '' }))

const summaryText = computed(() => {
  if (!supported.value) return t('aiModel.summaryUnsupported')
  if (!preferLocalLlm.value) return t('aiModel.summaryOff')
  if (downloaded.value) return t('aiModel.summaryOn')
  if (lastError.value) return t('aiModel.summaryFailed')
  return t('aiModel.summaryNotDownloaded')
})

async function refreshStorageLabel() {
  const est = await estimateBrowserStorage()
  storageLabel.value = est
    ? t('aiModel.storage', { used: est.usageLabel, free: est.freeLabel })
    : ''
}

function hydrateFromPrefs() {
  const prefs = readAiPreferences()
  preferLocalLlm.value = prefs.preferLocalLlm
  downloaded.value = Boolean(prefs.downloadAcceptedAt)
  modelId.value = prefs.modelId
}

function persist(patch) {
  const next = writeAiPreferences(patch)
  preferLocalLlm.value = next.preferLocalLlm
  downloaded.value = Boolean(next.downloadAcceptedAt)
  modelId.value = next.modelId
  emit('change', next)
}

async function onToggle(checked) {
  if (!supported.value) return
  if (!checked) {
    persist({ preferLocalLlm: false })
    lastError.value = ''
    lastErrorHint.value = ''
    showSnackbar(t('aiModel.backToRules'))
    return
  }
  persist({ preferLocalLlm: true })
  if (!downloaded.value) {
    showSnackbar(t('aiModel.downloadHint'))
  }
}

async function runEnsureReady(id) {
  const coach = createWebLlmCoach({ modelId: id })
  await coach.ensureReady?.(({ progress: p, text }) => {
    progress.value = Math.max(0, Math.min(1, p || 0))
    progressText.value = text || ''
  })
}

async function downloadModel() {
  if (!supported.value || busy.value) return
  busy.value = true
  progress.value = 0
  progressText.value = t('aiModel.clearingStorage')
  lastError.value = ''
  lastErrorHint.value = ''

  const prefs = readAiPreferences()
  const targetId = prefs.modelId || DEFAULT_LOCAL_MODEL_ID

  try {
    resetWebLlmEngineCache()
    await clearWebLlmStorage()
    await requestPersistentStorage()
    await refreshStorageLabel()

    progressText.value = t('aiModel.startDownload')
    await runEnsureReady(targetId)
    persist({
      preferLocalLlm: true,
      modelId: targetId,
      downloadAcceptedAt: Date.now(),
    })
    await refreshStorageLabel()
    showSnackbar(t('aiModel.enabled'))
  } catch (err) {
    console.error(err)
    await refreshStorageLabel()
    if (isStorageQuotaError(err)) {
      lastError.value = t('aiModel.quotaError')
      lastErrorHint.value = t('aiModel.quotaHint')
      showSnackbar(t('aiModel.quotaSnackbar'))
    } else {
      lastError.value = err?.message ? String(err.message).slice(0, 120) : t('aiModel.unknownError')
      lastErrorHint.value = ''
      showSnackbar(t('aiModel.downloadFailed'))
    }
  } finally {
    busy.value = false
    progress.value = 0
    progressText.value = ''
  }
}

async function clearAndRetry() {
  busy.value = true
  progressText.value = t('aiModel.cacheClearing')
  try {
    resetWebLlmEngineCache()
    await clearWebLlmStorage()
    persist({ modelId: DEFAULT_LOCAL_MODEL_ID, downloadAcceptedAt: null })
    lastError.value = ''
    lastErrorHint.value = ''
    await refreshStorageLabel()
    showSnackbar(t('aiModel.cacheCleared'))
  } finally {
    busy.value = false
    progressText.value = ''
  }
  await downloadModel()
}

async function removeModel() {
  resetWebLlmEngineCache()
  await clearWebLlmStorage()
  persist({ downloadAcceptedAt: null })
  lastError.value = ''
  lastErrorHint.value = ''
  await refreshStorageLabel()
  showSnackbar(t('aiModel.removedFallback'))
}

onMounted(async () => {
  hydrateFromPrefs()
  const prefs = readAiPreferences()
  if (!prefs.downloadAcceptedAt && prefs.modelId !== DEFAULT_LOCAL_MODEL_ID) {
    persist({ modelId: DEFAULT_LOCAL_MODEL_ID })
  } else if (prefs.modelId !== modelId.value) {
    persist({ modelId: prefs.modelId })
  }
  supported.value = await canRunLocalLlm()
  if (!supported.value && preferLocalLlm.value) {
    persist({ preferLocalLlm: false })
  }
  await refreshStorageLabel()
})
</script>

<style scoped>
.ai-model-settings {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--md-outline-variant);
  margin-top: var(--sp-1);
}

.ai-model-settings.is-collapsible {
  gap: 0;
  padding-top: 0;
  margin-top: 0;
  border-top: 0;
}

.ai-model-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-1) 0;
  cursor: pointer;
  list-style: none;
  color: var(--md-on-surface);
  font-weight: 500;
}

.ai-model-summary::-webkit-details-marker {
  display: none;
}

.summary-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.summary-chevron {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-short);
}

.ai-model-settings[open] .summary-chevron {
  transform: rotate(180deg);
}

.ai-model-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.ai-model-settings.is-collapsible .ai-model-body {
  padding-top: var(--sp-1);
}

.ai-model-title {
  margin: 0;
}

.ai-model-copy {
  margin: 4px 0 0;
  color: var(--md-on-surface-variant);
  line-height: 1.4;
}

.ai-model-settings.is-collapsible .ai-model-copy {
  margin-top: 0;
}

.ai-model-note {
  margin: 4px 0 0;
  color: var(--md-outline);
}

.ai-model-toggle {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: 0;
  cursor: pointer;
}

.ai-model-toggle input {
  width: 18px;
  height: 18px;
  accent-color: var(--md-primary);
}

.ai-model-status {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.ai-model-hint {
  margin: 0;
  color: var(--md-tertiary);
  line-height: 1.4;
}

.ai-model-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.ai-model-btn {
  height: 36px;
  min-height: 36px;
  padding: 0 var(--sp-3);
  font-size: 13px;
}

.ai-model-progress {
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--md-on-surface) 10%, transparent);
  overflow: hidden;
}

.ai-model-progress-bar {
  height: 100%;
  background: var(--md-primary);
  transition: width var(--md-duration-short) linear;
}
</style>
