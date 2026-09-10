<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open && guide"
        class="dialog-backdrop"
        @click.self="emit('close')"
      >
        <div
          class="dialog formation-info-dialog"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titleId"
        >
          <header class="formation-info-head">
            <div>
              <p :id="titleId" class="dialog-title">{{ t('formationGuide.dialogTitle', { formation: guide.label }) }}</p>
              <p v-if="guide.shape" class="md-label-sm formation-info-shape">{{ guide.shape }}</p>
            </div>
            <button
              type="button"
              class="btn-icon"
              :aria-label="t('common.close')"
              @click="emit('close')"
            >
              <span class="material-symbols-rounded" aria-hidden="true">close</span>
            </button>
          </header>

          <p class="md-body-md formation-info-summary">{{ guide.summary }}</p>

          <section v-if="guide.strengths.length" class="formation-info-section">
            <p class="md-label-lg">{{ t('formationGuide.strengths') }}</p>
            <ul class="formation-info-list md-body-sm">
              <li v-for="(item, i) in guide.strengths" :key="`s-${i}`">{{ item }}</li>
            </ul>
          </section>

          <section v-if="guide.watchouts.length" class="formation-info-section">
            <p class="md-label-lg">{{ t('formationGuide.watchouts') }}</p>
            <ul class="formation-info-list md-body-sm">
              <li v-for="(item, i) in guide.watchouts" :key="`w-${i}`">{{ item }}</li>
            </ul>
          </section>

          <section v-if="guide.withBall" class="formation-info-section">
            <p class="md-label-lg">{{ t('formationGuide.withBall') }}</p>
            <p class="md-body-sm">{{ guide.withBall }}</p>
          </section>

          <section v-if="guide.withoutBall" class="formation-info-section">
            <p class="md-label-lg">{{ t('formationGuide.withoutBall') }}</p>
            <p class="md-body-sm">{{ guide.withoutBall }}</p>
          </section>

          <p class="md-label-sm formation-info-tip">{{ t('formationGuide.tip') }}</p>

          <div class="dialog-actions">
            <button type="button" class="btn btn-filled" @click="emit('close')">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, useId } from 'vue'
import { t } from '@/i18n'
import { getFormationGuide } from '@/utils/formationGuide'

const props = defineProps({
  open: { type: Boolean, default: false },
  formationId: { type: String, default: null },
})

const emit = defineEmits(['close'])

const titleId = useId()
const guide = computed(() => getFormationGuide(props.formationId))
</script>

<style scoped>
.formation-info-dialog {
  max-width: 28rem;
  width: min(100% - 2rem, 28rem);
  max-height: min(85dvh, 40rem);
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.formation-info-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
}

.formation-info-shape {
  margin: 2px 0 0;
  color: var(--md-on-surface-variant);
}

.formation-info-summary {
  margin: 0;
}

.formation-info-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.formation-info-section .md-label-lg,
.formation-info-section .md-body-sm {
  margin: 0;
}

.formation-info-list {
  margin: 0;
  padding-left: 1.15rem;
  color: var(--md-on-surface-variant);
}

.formation-info-list li + li {
  margin-top: 2px;
}

.formation-info-tip {
  margin: 0;
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--md-shape-md);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
  color: var(--md-on-surface-variant);
  line-height: 1.4;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--md-duration-short);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
