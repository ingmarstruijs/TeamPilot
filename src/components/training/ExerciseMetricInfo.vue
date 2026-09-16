<template>
  <span class="metric-info">
    <button
      type="button"
      class="btn-icon metric-info-btn"
      :aria-label="infoLabel"
      @click="open = true"
    >
      <span class="material-symbols-rounded" aria-hidden="true">info</span>
    </button>

    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="open"
          class="metric-info-backdrop"
          @click.self="open = false"
        >
          <div
            class="metric-info-dialog"
            role="dialog"
            aria-modal="true"
            :aria-labelledby="titleId"
          >
            <header class="metric-info-head">
              <h3 :id="titleId" class="metric-info-title">{{ title }}</h3>
              <button
                type="button"
                class="btn-icon"
                :aria-label="t('common.close')"
                @click="open = false"
              >
                <span class="material-symbols-rounded" aria-hidden="true">close</span>
              </button>
            </header>
            <p class="md-body-md metric-info-body">{{ body }}</p>
            <a
              v-if="readMoreUrl"
              :href="readMoreUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="metric-info-link md-label-lg"
            >
              {{ readMoreLabel }}
              <span class="material-symbols-rounded" aria-hidden="true">open_in_new</span>
            </a>
            <button type="button" class="btn btn-filled metric-info-close" @click="open = false">
              {{ t('common.close') }}
            </button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </span>
</template>

<script setup>
import { ref, useId } from 'vue'
import { t } from '@/i18n'

defineProps({
  title: { type: String, required: true },
  body: { type: String, required: true },
  infoLabel: { type: String, required: true },
  readMoreUrl: { type: String, default: '' },
  readMoreLabel: { type: String, default: '' },
})

const open = ref(false)
const titleId = useId()
</script>

<style scoped>
.metric-info {
  display: inline-flex;
  vertical-align: middle;
}

.metric-info-btn {
  width: 28px;
  height: 28px;
  color: var(--md-on-surface-variant);
}

.metric-info-btn .material-symbols-rounded {
  font-size: 18px;
}

.metric-info-backdrop {
  position: fixed;
  inset: 0;
  z-index: 950;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--sp-4);
  background: rgba(0, 0, 0, 0.44);
}

.metric-info-dialog {
  width: 100%;
  max-width: 400px;
  max-height: min(85dvh, 520px);
  overflow-y: auto;
  padding: var(--sp-4);
  border-radius: var(--md-shape-xl);
  background: var(--md-surface);
  box-shadow: var(--md-elevation-3);
}

.metric-info-head {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}

.metric-info-title {
  flex: 1;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--md-on-surface);
}

.metric-info-body {
  margin: 0;
  line-height: 1.55;
  color: var(--md-on-surface-variant);
}

.metric-info-link {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
  margin-top: var(--sp-3);
  color: var(--md-primary);
  text-decoration: none;
}

.metric-info-link .material-symbols-rounded {
  font-size: 16px;
}

.metric-info-close {
  width: 100%;
  margin-top: var(--sp-4);
  min-height: 44px;
}
</style>
