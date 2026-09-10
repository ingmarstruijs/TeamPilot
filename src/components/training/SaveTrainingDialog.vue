<template>
  <Transition name="fade">
    <div v-if="open" class="dialog-backdrop" @click.self="close">
      <Transition name="dialog">
        <div
          v-if="open"
          class="dialog card card-elevated"
          role="dialog"
          aria-modal="true"
          aria-labelledby="save-training-title"
        >
          <header class="dialog-header">
            <h2 id="save-training-title" class="md-title-md">{{ title || t('savedTraining.saveTitle') }}</h2>
            <button type="button" class="btn-icon" :aria-label="t('common.close')" @click="close">
              <span class="material-symbols-rounded">close</span>
            </button>
          </header>

          <div class="dialog-body">
            <p v-if="hint" class="md-body-sm dialog-hint">{{ hint }}</p>

            <div class="field-wrap">
              <label class="field-label" for="st-name">{{ t('savedTraining.nameLabel') }}</label>
              <input
                id="st-name"
                ref="nameInput"
                v-model.trim="form.name"
                class="field"
                maxlength="80"
                :placeholder="t('savedTraining.namePlaceholder')"
                @keydown.enter.prevent="submit"
              />
            </div>

            <div class="field-wrap">
              <label class="field-label" for="st-theme">{{ t('savedTraining.weekThemeLabel') }}</label>
              <select id="st-theme" v-model="form.cycleTheme" class="field field-select">
                <option v-for="opt in cycleThemeOptions" :key="opt.id || 'none'" :value="opt.id">
                  {{ opt.label }}
                </option>
              </select>
            </div>
          </div>

          <footer class="dialog-footer">
            <button v-if="showSkip" type="button" class="btn btn-text" @click="skip">{{ t('savedTraining.skip') }}</button>
            <button type="button" class="btn btn-tonal" @click="close">{{ t('common.cancel') }}</button>
            <button type="button" class="btn btn-filled" :disabled="!form.name" @click="submit">
              {{ t('common.save') }}
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import { getCycleThemeOptions } from '@/utils/savedTraining'
import { t } from '@/i18n'

const cycleThemeOptions = computed(() => getCycleThemeOptions())

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  hint: { type: String, default: '' },
  defaultName: { type: String, default: '' },
  defaultTheme: { type: String, default: '' },
  showSkip: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save', 'skip'])

const nameInput = ref(null)
const form = ref({ name: '', cycleTheme: '' })

watch(
  () => props.open,
  async isOpen => {
    if (!isOpen) return
    form.value = {
      name: props.defaultName,
      cycleTheme: props.defaultTheme ?? '',
    }
    await nextTick()
    nameInput.value?.focus()
    nameInput.value?.select()
  },
)

function close() {
  emit('close')
}

function skip() {
  emit('skip')
}

function submit() {
  if (!form.value.name.trim()) return
  emit('save', {
    name: form.value.name.trim(),
    cycleTheme: form.value.cycleTheme || null,
  })
}
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--sp-4);
  background: rgba(0, 0, 0, 0.45);
}

@media (min-width: 600px) {
  .dialog-backdrop {
    align-items: center;
  }
}

.dialog {
  width: 100%;
  max-width: 420px;
  padding: 0;
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-4) var(--sp-2);
}

.dialog-header h2 {
  margin: 0;
}

.dialog-body {
  padding: var(--sp-2) var(--sp-4) var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.dialog-hint {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4) var(--sp-4);
  border-top: 1px solid var(--md-outline-variant);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--md-duration-medium);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: transform var(--md-duration-medium), opacity var(--md-duration-medium);
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
