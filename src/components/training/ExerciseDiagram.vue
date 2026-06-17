<template>
  <figure class="diagram-wrap">
    <button
      v-if="svgUrl && !loadFailed && zoomable"
      type="button"
      class="diagram-zoom-btn btn-icon"
      aria-label="Schema vergroten"
      title="Vergroten"
      @click="zoomOpen = true"
    >
      <span class="material-symbols-rounded">zoom_in</span>
    </button>

    <button
      v-if="svgUrl && !loadFailed && zoomable"
      type="button"
      class="diagram-click-area"
      aria-label="Schema vergroten"
      @click="zoomOpen = true"
    >
      <img
        :src="svgUrl"
        :alt="`Schema: ${getExerciseTitle(exercise)}`"
        class="rinus-diagram"
        loading="lazy"
        @error="loadFailed = true"
      />
    </button>
    <img
      v-else-if="svgUrl && !loadFailed"
      :src="svgUrl"
      :alt="`Schema: ${getExerciseTitle(exercise)}`"
      class="rinus-diagram"
      loading="lazy"
      @error="loadFailed = true"
    />
    <div v-else class="diagram-fallback">
      <span class="material-symbols-rounded" aria-hidden="true">image_not_supported</span>
      <p>{{ fallbackText }}</p>
    </div>
    <figcaption v-if="svgUrl && !loadFailed" class="diagram-caption">
      {{ caption }}
      <span v-if="zoomable" class="zoom-hint"> · tik om te vergroten</span>
    </figcaption>

    <ExerciseDiagramZoom
      :open="zoomOpen"
      :src="svgUrl"
      :alt="`Schema: ${getExerciseTitle(exercise)}`"
      @close="zoomOpen = false"
    />
  </figure>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { getRinusSvgUrl, getExerciseTitle, isCustomExercise } from '@/utils/exerciseText'
import ExerciseDiagramZoom from '@/components/training/ExerciseDiagramZoom.vue'

const props = defineProps({
  exercise: { type: Object, required: true },
  zoomable: { type: Boolean, default: true },
})

const loadFailed = ref(false)
const zoomOpen = ref(false)

const svgUrl = computed(() => getRinusSvgUrl(props.exercise))

const caption = computed(() =>
  isCustomExercise(props.exercise) ? 'Eigen schema' : 'Schema (KNVB Rinus)'
)

const fallbackText = computed(() =>
  isCustomExercise(props.exercise)
    ? 'Geen schema toegevoegd.'
    : 'Schema niet beschikbaar. Bekijk de oefening in KNVB Rinus.'
)

watch(() => props.exercise?.id, () => {
  loadFailed.value = false
  zoomOpen.value = false
})
</script>

<style scoped>
.diagram-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin: 0;
}

.diagram-click-area {
  display: block;
  width: 100%;
  padding: 0;
  border: none;
  background: transparent;
  cursor: zoom-in;
  border-radius: var(--md-shape-md);
}

.diagram-zoom-btn {
  position: absolute;
  top: var(--sp-2);
  right: var(--sp-2);
  z-index: 1;
  background: color-mix(in srgb, var(--md-surface) 92%, transparent);
  box-shadow: var(--md-elevation-1);
  color: var(--md-on-surface);
}

.rinus-diagram {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  background: #f8faf8;
  border-radius: var(--md-shape-md);
  border: 1px solid color-mix(in srgb, var(--md-primary) 20%, var(--md-outline-variant));
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

@media (max-width: 599px) {
  .rinus-diagram {
    max-height: min(36dvh, 220px);
  }
}

@media (min-width: 720px) {
  .rinus-diagram {
    max-height: 280px;
  }
}

.diagram-caption {
  font-size: 11px;
  color: var(--md-on-surface-variant);
  text-align: center;
}

.zoom-hint {
  opacity: 0.85;
}

.diagram-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-6) var(--sp-4);
  text-align: center;
  color: var(--md-on-surface-variant);
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-md);
  border: 1px dashed var(--md-outline-variant);
}

.diagram-fallback .material-symbols-rounded {
  font-size: 32px;
  opacity: 0.6;
}

.diagram-fallback p {
  margin: 0;
  font-size: 13px;
}
</style>
