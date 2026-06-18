<template>
  <section class="library-panel card card-elevated" :class="{ 'library-panel--sidebar': hideSessionStrip }">
    <div
      v-if="!hideSessionStrip"
      class="session-strip"
      :class="{ 'session-strip--empty': !sessionBlocks.length }"
    >
      <div class="session-strip-head">
        <span class="material-symbols-rounded session-strip-icon" aria-hidden="true">stadium</span>
        <p class="md-label-md session-strip-title">
          <template v-if="sessionBlocks.length">
            Jouw training · {{ sessionBlocks.length }} {{ sessionBlocks.length === 1 ? 'oefening' : 'oefeningen' }}
          </template>
          <template v-else>
            Nog geen oefeningen in je training
          </template>
        </p>
        <button
          v-if="sessionBlocks.length"
          type="button"
          class="btn btn-text session-strip-link"
          @click="$emit('go-session')"
        >
          Naar sessie
          <span class="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
        </button>
      </div>
      <div v-if="sessionBlocks.length" class="session-strip-list" role="list" aria-label="Huidige training">
        <span
          v-for="(block, i) in sessionBlocks"
          :key="block.uid"
          class="session-strip-chip md-label-sm"
          role="listitem"
        >
          <span class="chip-num">{{ i + 1 }}</span>
          {{ getExerciseTitle(block.exercise) }}
        </span>
      </div>
      <p v-else class="md-body-sm session-strip-hint">
        Oefeningen die je toevoegt komen onderaan je training te staan.
      </p>
    </div>

    <div class="section-head">
      <p class="md-title-sm">Bibliotheek</p>
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
            :aria-label="`Toevoegen als oefening ${nextPosition}`"
            :title="`Toevoegen als #${nextPosition}`"
            @click="$emit('add', ex)"
          >
            <span class="material-symbols-rounded">add</span>
            <span class="add-pos md-label-sm">#{{ nextPosition }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import ExerciseLibraryFilters from '@/components/training/ExerciseLibraryFilters.vue'
import { getExerciseTitle, isCustomExercise, playerRangeLabel } from '@/utils/exerciseText'

const props = defineProps({
  exercises: { type: Array, required: true },
  sessionBlocks: { type: Array, default: () => [] },
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  hideSessionStrip: { type: Boolean, default: false },
})

defineEmits([
  'preview',
  'add',
  'go-session',
  'create-custom',
  'update:query',
  'update:category',
  'update:suitableOnly',
  'reset-filters',
])

const nextPosition = computed(() => props.sessionBlocks.length + 1)

function categoryLabel(id) {
  return EXERCISE_CATEGORIES.find(c => c.id === id)?.label ?? id
}
</script>

<style scoped>
.library-panel {
  padding: var(--sp-3);
}

.library-panel--sidebar {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.library-panel--sidebar .manual-list {
  flex: 1;
  min-height: 0;
  max-height: none;
}

.library-panel--sidebar .manual-title-text {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
}

.session-strip {
  margin-bottom: var(--sp-3);
  padding: var(--sp-3);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
  border: 1px solid var(--md-outline-variant);
}

.session-strip--empty {
  border-style: dashed;
}

.session-strip-head {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
}

.session-strip-icon {
  font-size: 20px;
  color: var(--md-primary);
  flex-shrink: 0;
}

.session-strip-title {
  flex: 1;
  min-width: 0;
  margin: 0;
}

.session-strip-link {
  flex-shrink: 0;
  min-height: 32px;
  padding: 0 var(--sp-2);
  gap: 2px;
}

.session-strip-link .material-symbols-rounded {
  font-size: 18px;
}

.session-strip-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
  max-height: 4.5rem;
  overflow-y: auto;
}

.session-strip-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 2px 8px 2px 4px;
  border-radius: var(--md-shape-full);
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  color: var(--md-on-surface);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chip-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125rem;
  height: 1.125rem;
  border-radius: var(--md-shape-full);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-size: 10px;
  font-weight: 600;
  flex-shrink: 0;
}

.session-strip-hint {
  margin: var(--sp-1) 0 0;
  color: var(--md-on-surface-variant);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.section-action {
  height: 36px;
  flex-shrink: 0;
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
  max-height: min(520px, 58dvh);
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
  padding: var(--sp-2) var(--sp-3);
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
  padding-right: var(--sp-1);
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
