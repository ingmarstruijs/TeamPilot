<template>
  <div class="library-panel" :class="{ 'library-panel--sidebar': hideSessionStrip }">
    <section
      v-if="!hideSessionStrip"
      class="session-card card card-elevated"
    >
      <div class="session-strip-head">
        <span class="material-symbols-rounded session-strip-icon" aria-hidden="true">stadium</span>
        <p class="md-label-md session-strip-title">
          <template v-if="sessionBlocks.length">
            Jouw training · {{ sessionBlocks.length }} {{ sessionBlocks.length === 1 ? 'oefening' : 'oefeningen' }}
            · {{ totalMin }} min
          </template>
          <template v-else>
            Nog geen oefeningen in je training
          </template>
        </p>
      </div>
      <div
        v-if="sessionBlocks.length"
        ref="sessionStripListRef"
        class="session-strip-list"
        role="list"
        aria-label="Huidige training"
      >
        <span
          v-for="(block, i) in sessionBlocks"
          :key="block.uid"
          class="session-strip-chip md-label-sm"
          :class="{ 'is-new': block.uid === highlightUid }"
          :data-block-uid="block.uid"
          role="listitem"
        >
          <span class="chip-num">{{ i + 1 }}</span>
          <span class="chip-label">{{ getExerciseTitle(block.exercise) }}</span>
          <span class="chip-duration md-label-sm">{{ block.durationMin }} min</span>
          <button
            type="button"
            class="chip-remove btn-icon"
            :aria-label="`Verwijder ${getExerciseTitle(block.exercise)}`"
            @click="$emit('remove-block', block.uid)"
          >
            <span class="material-symbols-rounded">close</span>
          </button>
        </span>
      </div>
      <p v-else class="md-body-sm session-strip-hint">
        Oefeningen die je toevoegt komen onderaan je training te staan.
      </p>
    </section>

    <section class="library-card card card-elevated">
      <div class="library-head">
        <p class="md-title-sm library-title">Bibliotheek</p>
        <ExerciseLibraryFilters
          class="library-head-filters"
          :query="query"
          :category="category"
          :suitable-only="suitableOnly"
          :result-count="exercises.length"
          @update:query="$emit('update:query', $event)"
          @update:category="$emit('update:category', $event)"
          @update:suitable-only="$emit('update:suitableOnly', $event)"
          @reset="$emit('reset-filters')"
        />
      </div>

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

      <button type="button" class="btn btn-tonal library-custom-btn" @click="$emit('create-custom')">
        <span class="material-symbols-rounded" style="font-size:18px">draw</span>
        Creëer eigen oefening
      </button>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import ExerciseLibraryFilters from '@/components/training/ExerciseLibraryFilters.vue'
import { getExerciseTitle, isCustomExercise, playerRangeLabel } from '@/utils/exerciseText'

const props = defineProps({
  exercises: { type: Array, required: true },
  sessionBlocks: { type: Array, default: () => [] },
  highlightUid: { type: String, default: null },
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  hideSessionStrip: { type: Boolean, default: false },
})

defineEmits([
  'preview',
  'add',
  'create-custom',
  'remove-block',
  'update:query',
  'update:category',
  'update:suitableOnly',
  'reset-filters',
])

const nextPosition = computed(() => props.sessionBlocks.length + 1)
const totalMin = computed(() =>
  props.sessionBlocks.reduce((sum, block) => sum + block.durationMin, 0)
)
const sessionStripListRef = ref(null)

watch(() => props.highlightUid, async (uid) => {
  if (!uid) return
  await nextTick()
  const list = sessionStripListRef.value
  if (!list) return
  const chip = list.querySelector(`[data-block-uid="${uid}"]`)
  chip?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
})

function categoryLabel(id) {
  return EXERCISE_CATEGORIES.find(c => c.id === id)?.label ?? id
}
</script>

<style scoped>
.library-panel {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  overflow: visible;
}

.session-card,
.library-card {
  padding: var(--sp-3);
  overflow: visible;
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

.session-strip-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
  margin-top: var(--sp-2);
}

.session-strip-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 4px 4px 6px;
  border-radius: var(--md-shape-md);
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  color: var(--md-on-surface);
}

.session-strip-chip.is-new {
  animation: chip-highlight 2s ease-out;
}

@keyframes chip-highlight {
  0%, 40% { background: color-mix(in srgb, var(--md-primary) 16%, var(--md-surface)); }
  100% { background: var(--md-surface); }
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

.chip-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chip-duration {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  font-size: 11px;
  white-space: nowrap;
}

.chip-remove {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  color: var(--md-on-surface-variant);
}

.chip-remove .material-symbols-rounded {
  font-size: 18px;
}

.session-strip-hint {
  margin: var(--sp-1) 0 0;
  color: var(--md-on-surface-variant);
}

.library-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.library-title {
  margin: 0;
  flex: 1;
  min-width: 0;
}

.library-head-filters {
  flex-shrink: 0;
  margin-bottom: 0;
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
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  border-radius: var(--md-shape-md);
  flex-shrink: 0;
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

.library-panel--sidebar .manual-title-text {
  white-space: normal;
  overflow: visible;
  text-overflow: unset;
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

.library-custom-btn {
  width: 100%;
  margin-top: var(--sp-4);
}
</style>
