<template>
  <section class="library-panel card card-elevated">
    <div class="section-head">
      <p class="md-title-sm">Oefeningenbibliotheek</p>
      <button type="button" class="btn btn-tonal section-action" @click="$emit('create-custom')">
        <span class="material-symbols-rounded" style="font-size:18px">draw</span>
        Eigen oefening
      </button>
    </div>

    <ExerciseLibraryFilters
      :query="query"
      :category="category"
      :suitable-only="suitableOnly"
      :result-count="exercises.length"
      @update:query="$emit('update:query', $event)"
      @update:category="$emit('update:category', $event)"
      @update:suitable-only="$emit('update:suitableOnly', $event)"
      @reset="$emit('reset-filters')"
    />

    <div v-if="!exercises.length" class="library-empty md-body-sm">
      Geen oefeningen gevonden — pas je zoekterm of filters aan.
    </div>
    <div v-else class="manual-list">
      <div v-for="ex in exercises" :key="ex.id" class="manual-item">
        <button type="button" class="manual-item-main" @click="$emit('preview', ex)">
          <div class="manual-item-body">
            <p class="md-label-lg manual-title">
              <span v-if="isCustomExercise(ex)" class="custom-ex-badge" title="Eigen oefening">
                <span class="material-symbols-rounded" aria-hidden="true">draw</span>
              </span>
              <span class="manual-title-text">{{ getExerciseTitle(ex) }}</span>
            </p>
            <p class="md-body-sm manual-meta">
              {{ categoryLabel(ex.category) }} · {{ ex.durationMin }} min · {{ playerRangeLabel(ex) }}
            </p>
          </div>
        </button>
        <div class="manual-item-actions">
          <button
            type="button"
            class="btn-icon manual-info"
            aria-label="Details bekijken"
            title="Details bekijken"
            @click="$emit('preview', ex)"
          >
            <span class="material-symbols-rounded">info</span>
          </button>
          <button
            type="button"
            class="btn-icon manual-add"
            aria-label="Toevoegen aan training"
            title="Toevoegen"
            @click="$emit('add', ex)"
          >
            <span class="material-symbols-rounded">add</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import ExerciseLibraryFilters from '@/components/training/ExerciseLibraryFilters.vue'
import { getExerciseTitle, isCustomExercise, playerRangeLabel } from '@/utils/exerciseText'

defineProps({
  exercises: { type: Array, required: true },
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
})

defineEmits([
  'preview',
  'add',
  'create-custom',
  'update:query',
  'update:category',
  'update:suitableOnly',
  'reset-filters',
])

function categoryLabel(id) {
  return EXERCISE_CATEGORIES.find(c => c.id === id)?.label ?? id
}
</script>

<style scoped>
.library-panel {
  padding: var(--sp-4);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.section-action {
  height: 36px;
  flex-shrink: 0;
}

.library-empty {
  padding: var(--sp-4);
  text-align: center;
  color: var(--md-on-surface-variant);
}

.manual-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  max-height: min(560px, 62dvh);
  overflow-y: auto;
}

.manual-item {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  border-radius: var(--md-shape-md);
}

.manual-item-main {
  flex: 1;
  min-width: 0;
  display: block;
  padding: var(--sp-3);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--md-shape-md);
  text-align: left;
}

.manual-item-main:hover {
  background: color-mix(in srgb, var(--md-on-surface) 6%, transparent);
}

.manual-item-actions {
  display: flex;
  flex-shrink: 0;
  gap: 2px;
  padding-right: var(--sp-1);
}

.manual-info,
.manual-add {
  color: var(--md-on-surface-variant);
}

.manual-add {
  color: var(--md-primary);
}

.manual-title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  min-width: 0;
}

.manual-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.manual-meta {
  margin: 2px 0 0;
  color: var(--md-on-surface-variant);
}

.custom-ex-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--md-shape-sm);
  background: var(--md-tertiary-container);
  color: var(--md-on-tertiary-container);
  flex-shrink: 0;
}

.custom-ex-badge .material-symbols-rounded {
  font-size: 15px;
}
</style>
