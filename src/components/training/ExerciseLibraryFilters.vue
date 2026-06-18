<template>
  <div class="library-filters">
    <div class="search-row">
      <span class="material-symbols-rounded search-icon" aria-hidden="true">search</span>
      <input
        class="search-input"
        type="search"
        :value="query"
        placeholder="Zoek oefening…"
        aria-label="Zoek oefening"
        @input="$emit('update:query', $event.target.value)"
      />
      <button
        v-if="query || hasActiveFilters"
        type="button"
        class="btn-icon reset-btn"
        aria-label="Filters wissen"
        title="Filters wissen"
        @click="$emit('reset')"
      >
        <span class="material-symbols-rounded">close</span>
      </button>
    </div>

    <div class="filter-row">
      <select
        class="filter-select field field-select"
        :value="category"
        aria-label="Categorie"
        @change="$emit('update:category', $event.target.value)"
      >
        <option value="">Alle categorieën</option>
        <option v-for="c in EXERCISE_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
      </select>

      <label class="suitable-toggle md-body-sm" title="Verberg oefeningen die niet passen bij leeftijd, klasse en aantal spelers van je team">
        <input
          type="checkbox"
          :checked="suitableOnly"
          @change="$emit('update:suitableOnly', $event.target.checked)"
        />
        Alleen passend
      </label>
    </div>

    <p class="result-count md-label-sm">{{ resultCount }} {{ resultCount === 1 ? 'oefening' : 'oefeningen' }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'

const props = defineProps({
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  resultCount: { type: Number, default: 0 },
})

defineEmits(['update:query', 'update:category', 'update:suitableOnly', 'reset'])

const hasActiveFilters = computed(() =>
  Boolean(props.category || !props.suitableOnly)
)
</script>

<style scoped>
.library-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.search-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: 0 var(--sp-3);
  min-height: 44px;
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
}

.search-icon {
  font-size: 20px;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  font: inherit;
  font-size: 15px;
  color: var(--md-on-surface);
  outline: none;
}

.search-input::placeholder {
  color: var(--md-on-surface-variant);
}

.reset-btn {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  align-items: center;
}

.filter-select {
  flex: 1;
  min-width: 140px;
  min-height: 40px;
  font-size: 14px;
}

.suitable-toggle {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  color: var(--md-on-surface-variant);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
}

.suitable-toggle input {
  width: 18px;
  height: 18px;
  accent-color: var(--md-primary);
}

.result-count {
  margin: 0;
  color: var(--md-on-surface-variant);
}

@media (min-width: 720px) {
  .filter-row {
    flex-wrap: nowrap;
  }
}
</style>
