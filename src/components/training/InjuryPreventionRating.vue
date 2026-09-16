<template>
  <span
    v-if="rating"
    class="prevention-rating"
    :title="title"
    :aria-label="title"
  >
    <span
      v-for="n in max"
      :key="n"
      class="material-symbols-rounded prevention-icon"
      :class="{ 'is-filled': n <= rating }"
      aria-hidden="true"
    >health_and_safety</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { t } from '@/i18n'

const props = defineProps({
  rating: { type: Number, default: null },
  max: { type: Number, default: 5 },
})

const title = computed(() => (
  props.rating
    ? `${t('prevention.label')} · ${t('prevention.levels', { n: props.rating })}`
    : t('prevention.unknown')
))
</script>

<style scoped>
.prevention-rating {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  line-height: 1;
  flex-shrink: 0;
}

.prevention-icon {
  font-size: 14px;
  color: var(--md-outline);
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
}

.prevention-icon.is-filled {
  color: var(--md-tertiary, #2e7d32);
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
}
</style>
