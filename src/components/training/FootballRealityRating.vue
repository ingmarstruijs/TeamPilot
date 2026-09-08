<template>
  <span
    v-if="rating"
    class="reality-rating"
    :title="title"
    :aria-label="title"
  >
    <span
      v-for="n in max"
      :key="n"
      class="material-symbols-rounded reality-ball"
      :class="{ 'is-filled': n <= rating }"
      aria-hidden="true"
    >sports_soccer</span>
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
    ? `${t('reality.label')} · ${t('reality.balls', { n: props.rating })}`
    : t('reality.unknown')
))
</script>

<style scoped>
.reality-rating {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  line-height: 1;
  flex-shrink: 0;
}

.reality-ball {
  font-size: 14px;
  color: var(--md-outline);
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
}

.reality-ball.is-filled {
  color: var(--md-primary);
  font-variation-settings: 'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 20;
}
</style>
