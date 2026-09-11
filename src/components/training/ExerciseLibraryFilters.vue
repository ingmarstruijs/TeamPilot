<template>
  <div class="library-filters" role="search" :aria-label="t('library.searchAria')">
    <label class="search-field">
      <span class="material-symbols-rounded search-icon" aria-hidden="true">search</span>
      <input
        class="search-input"
        type="search"
        :value="query"
        :placeholder="t('library.searchPlaceholder')"
        :aria-label="t('library.searchLabel')"
        @input="$emit('update:query', $event.target.value)"
      />
    </label>

    <div class="filters-row">
      <div class="filter-select-wrap">
        <select
          class="filter-select"
          :value="category"
          :aria-label="t('library.category')"
          @change="$emit('update:category', $event.target.value)"
        >
          <option value="">{{ t('library.allCategories') }}</option>
          <option v-for="c in EXERCISE_CATEGORIES" :key="c.id" :value="c.id">{{ t(`category.${c.id}`) }}</option>
        </select>
        <span class="material-symbols-rounded filter-select-chevron" aria-hidden="true">expand_more</span>
      </div>

      <div class="filter-select-wrap">
        <select
          class="filter-select"
          :value="minFootballReality"
          :aria-label="t('library.reality')"
          @change="$emit('update:minFootballReality', Number($event.target.value) || 0)"
        >
          <option :value="0">{{ t('library.allReality') }}</option>
          <option :value="1">{{ t('library.minRealityOne') }}</option>
          <option v-for="n in [2, 3, 4, 5]" :key="n" :value="n">{{ t('library.minReality', { n }) }}</option>
        </select>
        <span class="material-symbols-rounded filter-select-chevron" aria-hidden="true">expand_more</span>
      </div>
    </div>

    <div class="filters-meta">
      <label
        class="suitable-toggle md-label-sm"
        :title="t('library.suitableTitle')"
      >
        <input
          type="checkbox"
          :checked="suitableOnly"
          @change="$emit('update:suitableOnly', $event.target.checked)"
        />
        <span class="suitable-label">{{ t('library.suitableOnly') }}</span>
      </label>

      <p class="result-count md-label-sm">
        {{ resultCount === 1
          ? t('library.resultOne', { n: resultCount })
          : t('library.resultMany', { n: resultCount }) }}
      </p>

      <button
        v-if="query || hasActiveFilters"
        type="button"
        class="btn btn-text reset-btn"
        @click="$emit('reset')"
      >
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
        {{ t('library.clear') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import { t } from '@/i18n'

const props = defineProps({
  query: { type: String, default: '' },
  category: { type: String, default: '' },
  suitableOnly: { type: Boolean, default: true },
  minFootballReality: { type: Number, default: 0 },
  resultCount: { type: Number, default: 0 },
})

defineEmits(['update:query', 'update:category', 'update:suitableOnly', 'update:minFootballReality', 'reset'])

const hasActiveFilters = computed(() =>
  Boolean(props.query || props.category || !props.suitableOnly || props.minFootballReality)
)
</script>

<style scoped>
.library-filters {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  --filter-control-height: 36px;
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

.filters-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--sp-2);
}

.filter-select-wrap {
  position: relative;
  min-width: 0;
}

.filter-select {
  box-sizing: border-box;
  width: 100%;
  height: var(--filter-control-height);
  padding: 0 28px 0 var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface-container-low);
  font: inherit;
  font-size: 13px;
  color: var(--md-on-surface);
  outline: none;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}

.filter-select:hover {
  border-color: var(--md-outline);
}

.filter-select:focus {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, var(--md-surface-container-low));
}

.filter-select-chevron {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  font-size: 18px;
  color: var(--md-on-surface-variant);
}

.filters-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2) var(--sp-3);
  min-height: 24px;
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
  min-height: 28px;
  padding: 0 var(--sp-1);
  gap: 2px;
  color: var(--md-on-surface-variant);
}

.reset-btn .material-symbols-rounded {
  font-size: 16px;
}

.result-count {
  margin: 0 0 0 auto;
  color: var(--md-on-surface-variant);
}

@media (max-width: 359px) {
  .filters-row {
    grid-template-columns: 1fr;
  }
}
</style>
