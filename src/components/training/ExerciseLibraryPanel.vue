<template>
  <div class="library-panel" :class="{ 'library-panel--sidebar': sidebar }">
    <section class="library-card card card-elevated">
      <div class="library-toolbar">
        <p class="md-title-sm library-title">{{ t('library.title') }}</p>
        <ExerciseLibraryFilters
          :query="query"
          :category="category"
          :suitable-only="suitableOnly"
          :min-football-reality="minFootballReality"
          :result-count="exercises.length"
          @update:query="$emit('update:query', $event)"
          @update:category="$emit('update:category', $event)"
          @update:suitable-only="$emit('update:suitableOnly', $event)"
          @update:min-football-reality="$emit('update:minFootballReality', $event)"
          @reset="$emit('reset-filters')"
        />
      </div>

      <div class="library-scroll">
        <div v-if="!exercises.length" class="library-empty md-body-sm">
          {{ t('library.empty') }}
        </div>
        <div v-else class="manual-list">
          <div v-for="ex in exercises" :key="ex.id" class="manual-item">
            <button type="button" class="manual-item-main" @click="$emit('preview', ex)">
              <div class="manual-item-body">
                <p class="md-label-lg manual-title">
                  <span v-if="isCustomExercise(ex)" class="custom-ex-badge" :title="t('training.customExercise')">
                    <span class="material-symbols-rounded" aria-hidden="true">draw</span>
                  </span>
                  <span class="manual-title-text">{{ getExerciseTitle(ex) }}</span>
                </p>
                <p class="md-body-sm manual-meta">
                  {{ categoryLabel(ex.category) }} · {{ ex.durationMin }} min · {{ playerRangeLabel(ex) }}
                </p>
                <FootballRealityRating :rating="getFootballReality(ex)" />
              </div>
            </button>
            <div class="manual-item-actions">
              <button
                type="button"
                class="btn-icon manual-info"
                :aria-label="t('library.details')"
                :title="t('library.details')"
                @click="$emit('preview', ex)"
              >
                <span class="material-symbols-rounded">info</span>
              </button>
              <button
                type="button"
                class="btn-icon manual-add"
                :aria-label="t('library.addAs', { position: nextPosition })"
                :title="t('library.addAsTitle', { position: nextPosition })"
                @click="$emit('add', ex)"
              >
                <span class="material-symbols-rounded">add</span>
                <span class="add-pos md-label-sm">#{{ nextPosition }}</span>
              </button>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-tonal library-custom-btn" @click="$emit('create-custom')">
          <span class="material-symbols-rounded" style="font-size:18px">draw</span>
          {{ t('library.createCustom') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ExerciseLibraryFilters from '@/components/training/ExerciseLibraryFilters.vue'
import FootballRealityRating from '@/components/training/FootballRealityRating.vue'
import { t } from '@/i18n'
import { getExerciseTitle, getFootballReality, isCustomExercise, playerRangeLabel } from '@/utils/exerciseText'

const props = defineProps({
  exercises: { type: Array, required: true },
  sessionBlocks: { type: Array, default: () => [] },
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  minFootballReality: { type: Number, default: 0 },
  sidebar: { type: Boolean, default: false },
})

defineEmits([
  'preview',
  'add',
  'create-custom',
  'update:query',
  'update:category',
  'update:suitableOnly',
  'update:minFootballReality',
  'reset-filters',
])

const nextPosition = computed(() => props.sessionBlocks.length + 1)

function categoryLabel(id) {
  return t(`category.${id}`)
}
</script>

<style scoped>
.library-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.library-card {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.library-toolbar {
  flex-shrink: 0;
  padding: var(--sp-3) var(--sp-3) var(--sp-2);
  background: var(--md-surface);
  border-bottom: 1px solid var(--md-outline-variant);
}

.library-title {
  margin: 0 0 var(--sp-2);
  min-width: 0;
}

.library-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: var(--sp-2) var(--sp-3) var(--sp-3);
}

.library-empty {
  padding: var(--sp-3);
  text-align: center;
  color: var(--md-on-surface-variant);
}

.manual-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.manual-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: var(--sp-1);
  min-width: 0;
  border-radius: var(--md-shape-md);
}

.manual-item-main {
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  display: block;
  padding: var(--sp-2) var(--sp-2) var(--sp-2) var(--sp-3);
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
  align-items: center;
  gap: 2px;
  padding-top: var(--sp-2);
  padding-right: var(--sp-1);
  background: var(--md-surface);
}

.manual-info,
.manual-add {
  color: var(--md-on-surface-variant);
}

.manual-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  color: var(--md-primary);
  min-width: 40px;
}

.add-pos {
  font-size: 10px;
  line-height: 1;
  margin-top: -2px;
}

.manual-add .material-symbols-rounded {
  font-size: 22px;
}

.manual-title {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  margin: 0;
  min-width: 0;
  max-width: 100%;
  line-height: 1.35;
}

.manual-title-text {
  flex: 1;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.35;
}

.manual-meta {
  margin: 2px 0 0;
  max-width: 100%;
  color: var(--md-on-surface-variant);
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.manual-item-body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
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

.library-custom-btn {
  width: 100%;
  margin-top: var(--sp-4);
}
</style>
