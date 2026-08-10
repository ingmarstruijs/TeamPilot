<template>
  <Transition name="briefing">
    <aside
      v-if="text"
      class="ai-briefing"
      role="status"
      aria-live="polite"
    >
      <div class="ai-briefing-main">
        <span class="material-symbols-rounded ai-briefing-icon" aria-hidden="true">psychology</span>
        <div class="ai-briefing-copy">
          <p class="md-label-sm ai-briefing-badge">{{ engineLabel }}</p>
          <p class="md-body-sm ai-briefing-text">{{ text }}</p>
        </div>
      </div>
      <button
        type="button"
        class="btn-icon ai-briefing-dismiss"
        aria-label="Briefing sluiten"
        @click="$emit('dismiss')"
      >
        <span class="material-symbols-rounded" aria-hidden="true">close</span>
      </button>
    </aside>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
  engine: { type: String, default: 'rules' },
})

defineEmits(['dismiss'])

const engineLabel = computed(() =>
  props.engine === 'local-llm' ? 'Lokale AI' : 'Slimme planning'
)
</script>

<style scoped>
.ai-briefing {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-3);
  border-radius: var(--md-shape-md);
  background: color-mix(in srgb, var(--md-primary) 8%, var(--md-surface));
  border: 1px solid color-mix(in srgb, var(--md-primary) 18%, transparent);
}

.ai-briefing-main {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-2);
  flex: 1;
  min-width: 0;
}

.ai-briefing-icon {
  flex-shrink: 0;
  margin-top: 2px;
  font-size: 20px;
  color: var(--md-primary);
}

.ai-briefing-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ai-briefing-badge {
  margin: 0;
  color: var(--md-primary);
  font-weight: 600;
  letter-spacing: 0.01em;
}

.ai-briefing-text {
  margin: 0;
  color: var(--md-on-surface);
  line-height: 1.45;
}

.ai-briefing-dismiss {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
}

.briefing-enter-active,
.briefing-leave-active {
  transition: opacity var(--md-duration-medium) var(--md-motion-standard),
    transform var(--md-duration-medium) var(--md-motion-standard);
}

.briefing-enter-from,
.briefing-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
