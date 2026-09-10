<template>
  <section class="saved-panel card card-elevated">
    <div class="panel-head">
      <p class="md-title-sm">{{ t('training.savedTrainings') }}</p>
      <span class="md-label-sm count">{{ filtered.length }}/{{ recipes.length }}</span>
    </div>

    <div class="theme-filters" role="tablist" :aria-label="t('savedTraining.filterAria')">
      <button
        v-for="chip in themeChips"
        :key="chip.id || 'all'"
        type="button"
        class="theme-chip md-label-sm"
        :class="{ active: themeFilter === chip.id }"
        @click="themeFilter = chip.id"
      >
        <span v-if="chip.icon" class="material-symbols-rounded chip-icon" aria-hidden="true">{{ chip.icon }}</span>
        {{ chip.label }}
      </button>
    </div>

    <div v-if="!filtered.length" class="saved-empty md-body-sm">
      <template v-if="recipes.length">
        {{ t('savedTraining.emptyFilter') }}
      </template>
      <template v-else>
        {{ t('savedTraining.empty') }}
      </template>
    </div>

    <div v-else class="saved-list">
      <article v-for="recipe in filtered" :key="recipe.id" class="saved-item">
        <div class="saved-item-main">
          <p class="md-label-lg saved-name">{{ recipe.name }}</p>
          <p class="md-body-sm saved-meta">
            <span v-if="recipe.cycleTheme" class="theme-badge">
              <span class="material-symbols-rounded theme-badge-icon" aria-hidden="true">{{ getCycleThemeIcon(recipe.cycleTheme) }}</span>
              {{ cycleThemeLabel(recipe.cycleTheme) }}
            </span>
            {{ trainingTypeLabel(recipe.trainingType) }}
            · {{ recipe.durationMin }} {{ t('common.min') }}
            · {{ recipe.exerciseCount }} {{ t('savedTraining.exercisesAbbr') }}
          </p>
          <p v-if="recipe.sharedFrom?.name" class="md-label-sm shared-from">
            {{ t('savedTraining.via', { name: recipe.sharedFrom.name }) }}
          </p>
        </div>
        <div class="saved-actions">
          <button
            type="button"
            class="btn btn-filled btn-sm"
            @click="$emit('use', recipe)"
          >
            {{ t('savedTraining.use') }}
          </button>
          <button
            type="button"
            class="btn btn-tonal btn-sm"
            @click="$emit('edit', recipe)"
          >
            {{ t('savedTraining.edit') }}
          </button>
          <button
            type="button"
            class="btn-icon"
            :aria-label="t('savedTraining.duplicate')"
            :title="t('savedTraining.duplicate')"
            @click="$emit('duplicate', recipe)"
          >
            <span class="material-symbols-rounded">content_copy</span>
          </button>
          <button
            type="button"
            class="btn-icon"
            :aria-label="t('common.share')"
            :title="t('savedTraining.shareRecipe')"
            @click="$emit('share', recipe)"
          >
            <span class="material-symbols-rounded">share</span>
          </button>
          <button
            type="button"
            class="btn-icon danger"
            :aria-label="t('common.delete')"
            :title="t('common.delete')"
            @click="confirmDelete(recipe)"
          >
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { getCycleThemeOptions, cycleThemeLabel, getCycleThemeIcon } from '@/utils/savedTraining'
import { t } from '@/i18n'

const props = defineProps({
  recipes: { type: Array, required: true },
})

const emit = defineEmits(['use', 'edit', 'share', 'duplicate', 'delete'])

const themeFilter = ref('')

const themeChips = computed(() => [
  { id: '', label: t('common.all'), icon: null },
  ...getCycleThemeOptions().filter(o => o.id && props.recipes.some(r => r.cycleTheme === o.id)),
])

const filtered = computed(() => {
  if (!themeFilter.value) return props.recipes
  return props.recipes.filter(r => r.cycleTheme === themeFilter.value)
})

function trainingTypeLabel(id) {
  const label = t(`trainingType.${id}`)
  return label.startsWith('trainingType.') ? id : label
}

function confirmDelete(recipe) {
  if (window.confirm(t('savedTraining.deleteConfirm', { name: recipe.name }))) {
    emit('delete', recipe)
  }
}
</script>

<style scoped>
.saved-panel {
  padding: var(--sp-3);
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.count {
  color: var(--md-on-surface-variant);
}

.theme-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-bottom: var(--sp-3);
}

.theme-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--md-shape-full);
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface);
  color: var(--md-on-surface-variant);
  cursor: pointer;
}

.theme-chip.active {
  border-color: var(--md-primary);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}

.saved-empty {
  padding: var(--sp-4) var(--sp-2);
  text-align: center;
  color: var(--md-on-surface-variant);
}

.saved-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.saved-item {
  padding: var(--sp-3);
  border-radius: var(--md-shape-md);
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface-container-low);
}

.saved-name {
  margin: 0;
}

.saved-meta {
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

.theme-badge-icon,
.chip-icon {
  font-size: 14px;
}

.theme-badge-icon {
  font-size: 13px;
}

.shared-from {
  margin: var(--sp-1) 0 0;
  color: var(--md-outline);
}

.saved-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
}

.btn-sm {
  min-height: 36px;
  padding: 0 var(--sp-3);
  font-size: 13px;
}

.danger {
  color: var(--md-error);
}
</style>
