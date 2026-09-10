<template>
  <Transition name="fade">
    <div v-if="open" class="dialog-backdrop" @click.self="close">
      <Transition name="dialog">
        <div
          v-if="open"
          class="dialog card card-elevated"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pick-saved-title"
        >
          <header class="dialog-header">
            <h2 id="pick-saved-title" class="md-title-md">{{ t('savedTraining.pickTitle') }}</h2>
            <button type="button" class="btn-icon" :aria-label="t('common.close')" @click="close">
              <span class="material-symbols-rounded">close</span>
            </button>
          </header>

          <div v-if="!recipes.length" class="dialog-empty md-body-sm">
            {{ t('savedTraining.pickEmpty') }}
          </div>

          <div v-else class="pick-list">
            <button
              v-for="recipe in recipes"
              :key="recipe.id"
              type="button"
              class="pick-item"
              @click="select(recipe)"
            >
              <div class="pick-text">
                <p class="md-label-lg pick-name">{{ recipe.name }}</p>
                <p class="md-body-sm pick-meta">
                  <span v-if="recipe.cycleTheme" class="theme-badge">
                    <span class="material-symbols-rounded theme-badge-icon" aria-hidden="true">{{ getCycleThemeIcon(recipe.cycleTheme) }}</span>
                    {{ cycleThemeLabel(recipe.cycleTheme) }}
                  </span>
                  {{ trainingTypeLabel(recipe.trainingType) }}
                  · {{ recipe.exerciseCount }} {{ t('savedTraining.exercisesAbbr') }} · {{ recipe.durationMin }} {{ t('common.min') }}
                </p>
              </div>
              <span class="material-symbols-rounded pick-chevron">chevron_right</span>
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { cycleThemeLabel, getCycleThemeIcon } from '@/utils/savedTraining'
import { t } from '@/i18n'

defineProps({
  open: { type: Boolean, default: false },
  recipes: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'select'])

function close() {
  emit('close')
}

function select(recipe) {
  emit('select', recipe)
}

function trainingTypeLabel(id) {
  const label = t(`trainingType.${id}`)
  return label.startsWith('trainingType.') ? id : label
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
  max-width: 480px;
  max-height: min(85vh, 560px);
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-4) var(--sp-2);
  flex-shrink: 0;
}

.dialog-header h2 {
  margin: 0;
}

.dialog-empty {
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
  color: var(--md-on-surface-variant);
}

.pick-list {
  overflow-y: auto;
  padding: var(--sp-2) var(--sp-2) var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.pick-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-3);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface);
  cursor: pointer;
  text-align: left;
  transition: background var(--md-duration-short);
}

.pick-item:hover {
  background: color-mix(in srgb, var(--md-on-surface) 4%, var(--md-surface));
}

.pick-text {
  flex: 1;
  min-width: 0;
}

.pick-name {
  margin: 0;
}

.pick-meta {
  margin: var(--sp-1) 0 0;
  color: var(--md-on-surface-variant);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
}

.theme-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 8px 1px 4px;
  border-radius: var(--md-shape-full);
  background: var(--md-tertiary-container);
  color: var(--md-on-tertiary-container);
  font-size: 11px;
  font-weight: 600;
}

.theme-badge-icon {
  font-size: 13px;
}

.pick-chevron {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
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
