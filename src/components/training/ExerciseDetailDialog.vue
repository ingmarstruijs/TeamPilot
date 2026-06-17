<template>
  <Transition name="fade">
    <div
      v-if="visible"
      class="exercise-detail-backdrop"
      @click.self="close"
    >
      <Transition name="dialog">
        <div
          v-if="visible"
          class="exercise-detail-dialog"
          :class="{ 'is-preview': mode === 'preview', 'is-desktop': isDesktop }"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="exercise-detail-header">
            <div class="header-text">
              <h2 :id="titleId" class="exercise-detail-title">{{ getExerciseTitle(resolvedExercise) }}</h2>
              <p class="exercise-detail-meta">
                {{ categoryLabel(resolvedExercise.category) }}
                · {{ displayDuration }} min
                <template v-if="showPlayerRange"> · {{ playerRangeLabel(resolvedExercise) }}</template>
              </p>
            </div>
            <button type="button" class="btn-icon close-btn" aria-label="Sluiten" @click="close">
              <span class="material-symbols-rounded">close</span>
            </button>
          </header>

          <div class="exercise-detail-body">
            <ExerciseDiagram :exercise="resolvedExercise" />

            <div class="detail-text">
              <p class="md-body-md section-text">{{ description }}</p>

              <p class="md-body-sm section-muted">
                <strong>Opstelling:</strong> {{ setup }}
              </p>

              <div v-if="rules.length" class="rules-block">
                <p class="md-label-md">Spelregels</p>
                <ul class="rules-list md-body-sm">
                  <li v-for="(rule, i) in rules" :key="i">{{ rule }}</li>
                </ul>
              </div>
            </div>
          </div>

          <footer class="exercise-detail-footer">
            <a
              v-if="rinusUrl"
              :href="rinusUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="rinus-link btn btn-tonal"
            >
              <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
              Bekijk in KNVB Rinus
            </a>

            <button
              v-if="mode === 'preview'"
              type="button"
              class="btn btn-filled add-action"
              @click="$emit('add', resolvedExercise)"
            >
              <span class="material-symbols-rounded" aria-hidden="true">add</span>
              Toevoegen aan training
            </button>

            <button type="button" class="btn btn-filled close-action" @click="close">
              Sluiten
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { computed, useId, watch, onUnmounted } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import ExerciseDiagram from '@/components/training/ExerciseDiagram.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import {
  buildExerciseDescription,
  buildExerciseSetup,
  getExerciseTitle,
  getRinusRules,
  getRinusUrl,
  playerRangeLabel,
} from '@/utils/exerciseText'

const props = defineProps({
  block: { type: Object, default: null },
  exercise: { type: Object, default: null },
  mode: { type: String, default: 'session' },
  playerCount: { type: Number, default: 0 },
  showPlayerRange: { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'add'])

const titleId = useId()
const isDesktop = useMediaQuery('(min-width: 720px)')

const visible = computed(() => Boolean(props.block || props.exercise))

const resolvedExercise = computed(() =>
  props.block?.exercise ?? props.exercise ?? null
)

const displayDuration = computed(() =>
  props.block?.durationMin ?? resolvedExercise.value?.durationMin ?? 0
)

const description = computed(() =>
  resolvedExercise.value
    ? buildExerciseDescription(resolvedExercise.value, props.playerCount)
    : ''
)

const setup = computed(() =>
  resolvedExercise.value
    ? buildExerciseSetup(resolvedExercise.value, props.playerCount)
    : ''
)

const rules = computed(() =>
  resolvedExercise.value ? getRinusRules(resolvedExercise.value) : []
)

const rinusUrl = computed(() =>
  resolvedExercise.value ? getRinusUrl(resolvedExercise.value) : null
)

function categoryLabel(id) {
  return EXERCISE_CATEGORIES.find(c => c.id === id)?.label ?? id
}

function close() {
  emit('close')
}

watch(
  visible,
  isOpen => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
.exercise-detail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.44);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(var(--sp-3), env(safe-area-inset-top, 0px)) var(--sp-3)
    max(var(--sp-3), env(safe-area-inset-bottom, 0px));
}

.exercise-detail-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  max-height: min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - var(--sp-6)));
  background: var(--md-surface);
  border-radius: var(--md-shape-xl);
  box-shadow: var(--md-elevation-3);
  overflow: hidden;
}

.exercise-detail-dialog.is-preview {
  max-width: 520px;
}

.exercise-detail-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
  border-bottom: 1px solid var(--md-outline-variant);
  background: var(--md-surface);
}

.header-text {
  flex: 1;
  min-width: 0;
}

.exercise-detail-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--md-on-surface);
  word-break: break-word;
}

.exercise-detail-meta {
  margin: var(--sp-1) 0 0;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--md-on-surface-variant);
}

.close-btn {
  flex-shrink: 0;
  margin-top: -4px;
}

.exercise-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.section-text {
  margin: 0;
  line-height: 1.5;
}

.section-muted {
  margin: 0;
  color: var(--md-on-surface-variant);
  line-height: 1.5;
}

.rules-block {
  padding-top: var(--sp-3);
  border-top: 1px solid var(--md-outline-variant);
}

.rules-block .md-label-md {
  margin: 0 0 var(--sp-2);
}

.rules-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--md-on-surface-variant);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  line-height: 1.45;
}

.exercise-detail-footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
  padding-bottom: max(var(--sp-4), env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--md-outline-variant);
  background: var(--md-surface);
}

.rinus-link,
.add-action,
.close-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  width: 100%;
  text-decoration: none;
  min-height: 44px;
}

@media (max-width: 719px) {
  .exercise-detail-dialog.is-preview {
    max-width: none;
    max-height: 100dvh;
    height: 100dvh;
    border-radius: var(--md-shape-xl) var(--md-shape-xl) 0 0;
    align-self: flex-end;
  }

  .exercise-detail-backdrop:has(.is-preview) {
    align-items: flex-end;
    padding: 0;
  }
}

@media (min-width: 720px) {
  .exercise-detail-backdrop {
    padding: var(--sp-5);
  }

  .exercise-detail-dialog {
    max-width: 560px;
    max-height: min(90dvh, 720px);
  }

  .exercise-detail-dialog.is-desktop .exercise-detail-body {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--sp-5);
  }

  .exercise-detail-dialog.is-desktop .exercise-detail-body :deep(.diagram-wrap) {
    flex: 0 0 44%;
    max-width: 44%;
  }

  .detail-text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .exercise-detail-header {
    padding: var(--sp-5) var(--sp-5) var(--sp-3);
  }

  .exercise-detail-title {
    font-size: 1.375rem;
    font-weight: 400;
  }

  .exercise-detail-footer {
    padding: var(--sp-4) var(--sp-5) var(--sp-5);
    flex-direction: row;
    flex-wrap: wrap;
  }

  .rinus-link,
  .add-action {
    width: auto;
    flex: 1;
  }

  .close-action {
    display: none;
  }
}

.dialog-enter-active,
.dialog-leave-active {
  transition: transform var(--md-duration-medium) var(--md-motion-standard),
    opacity var(--md-duration-medium);
}

.dialog-enter-from,
.dialog-leave-to {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}
</style>
