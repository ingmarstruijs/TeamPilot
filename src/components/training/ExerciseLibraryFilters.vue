<template>
  <div ref="rootRef" class="library-filters">
    <button
      type="button"
      class="filters-trigger md-label-md"
      :class="{ 'is-open': open }"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click.stop="open = !open"
    >
      <span class="material-symbols-rounded filters-trigger-icon" aria-hidden="true">tune</span>
      <span class="filters-trigger-text">Zoeken &amp; filters</span>
      <span v-if="hasActiveFilters" class="filters-active-dot" aria-label="Filters actief" />
      <span class="material-symbols-rounded filters-chevron" aria-hidden="true">expand_more</span>
    </button>

    <div
      v-if="open"
      class="filters-popover"
      role="dialog"
      aria-label="Zoeken en filters"
      @click.stop
    >
      <div class="filters-body">
        <label class="search-field">
          <span class="material-symbols-rounded search-icon" aria-hidden="true">search</span>
          <input
            ref="searchInputRef"
            class="search-input"
            type="search"
            :value="query"
            placeholder="Zoek oefening…"
            aria-label="Zoek oefening"
            @input="$emit('update:query', $event.target.value)"
          />
        </label>

        <select
          class="filter-select"
          :value="category"
          aria-label="Categorie"
          @change="$emit('update:category', $event.target.value)"
        >
          <option value="">Alle categorieën</option>
          <option v-for="c in EXERCISE_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
        </select>

        <label
          class="suitable-toggle md-label-sm"
          title="Verberg oefeningen die niet passen bij leeftijd, klasse en aantal spelers van je team"
        >
          <input
            type="checkbox"
            :checked="suitableOnly"
            @change="$emit('update:suitableOnly', $event.target.checked)"
          />
          <span class="suitable-label">Alleen passend</span>
        </label>

        <button
          v-if="query || hasActiveFilters"
          type="button"
          class="btn btn-text reset-btn"
          @click="$emit('reset')"
        >
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
          Filters wissen
        </button>
      </div>

      <p class="result-count md-label-sm">
        {{ resultCount }} {{ resultCount === 1 ? 'oefening' : 'oefeningen' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'

const props = defineProps({
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  resultCount: { type: Number, default: 0 },
})

defineEmits(['update:query', 'update:category', 'update:suitableOnly', 'reset'])

const open = ref(false)
const rootRef = ref(null)
const searchInputRef = ref(null)

const hasActiveFilters = computed(() =>
  Boolean(props.query || props.category || !props.suitableOnly)
)

watch(open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  searchInputRef.value?.focus()
})

function onDocumentClick(event) {
  if (!open.value || !rootRef.value) return
  if (!rootRef.value.contains(event.target)) open.value = false
}

function onDocumentKeydown(event) {
  if (event.key === 'Escape') open.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<style scoped>
.library-filters {
  position: relative;
  flex-shrink: 0;
}

.filters-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 34px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
  color: var(--md-on-surface);
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  font: inherit;
  white-space: nowrap;
}

.filters-trigger:hover {
  background: color-mix(in srgb, var(--md-on-surface) 6%, var(--md-surface-container-low));
}

.filters-trigger.is-open {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, var(--md-surface-container-low));
}

.filters-trigger-icon {
  font-size: 17px;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
}

.filters-trigger-text {
  font-size: 12px;
}

.filters-active-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--md-shape-full);
  background: var(--md-primary);
  flex-shrink: 0;
}

.filters-chevron {
  font-size: 18px;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
  transition: transform var(--md-duration-short);
}

.filters-trigger.is-open .filters-chevron {
  transform: rotate(180deg);
}

.filters-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 40;
  width: min(17.5rem, calc(100vw - 2rem));
  padding: var(--sp-3);
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  box-shadow: var(--md-elevation-3);
}

.filters-body {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  --filter-control-height: 40px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  box-sizing: border-box;
  width: 100%;
  height: var(--filter-control-height);
  padding: 0 var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
}

.search-icon {
  font-size: 18px;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 14px;
  color: var(--md-on-surface);
  outline: none;
}

.search-input::placeholder {
  color: var(--md-on-surface-variant);
}

.filter-select {
  box-sizing: border-box;
  width: 100%;
  height: var(--filter-control-height);
  padding: 0 var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
  font: inherit;
  font-size: 14px;
  color: var(--md-on-surface);
  outline: none;
  appearance: none;
  cursor: pointer;
}

.filter-select:hover {
  border-color: var(--md-outline);
}

.filter-select:focus {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, transparent);
}

.suitable-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--md-on-surface-variant);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.suitable-toggle input {
  width: 14px;
  height: 14px;
  accent-color: var(--md-primary);
  flex-shrink: 0;
}

.suitable-label {
  font-size: 12px;
  line-height: 1.2;
}

.reset-btn {
  align-self: flex-start;
  min-height: 32px;
  padding: 0 var(--sp-2);
  gap: var(--sp-1);
  color: var(--md-on-surface-variant);
}

.reset-btn .material-symbols-rounded {
  font-size: 16px;
}

.result-count {
  margin: var(--sp-2) 0 0;
  padding-top: var(--sp-2);
  border-top: 1px solid var(--md-outline-variant);
  color: var(--md-on-surface-variant);
}

@media (max-width: 399px) {
  .filters-trigger-text {
    display: none;
  }
}
</style>
