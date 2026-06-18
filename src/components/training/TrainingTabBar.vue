<template>
  <div class="training-tabs" role="tablist" aria-label="Training weergave">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      role="tab"
      class="training-tab"
      :class="{ active: modelValue === tab.id }"
      :aria-selected="modelValue === tab.id"
      @click="$emit('update:modelValue', tab.id)"
    >
      <span class="material-symbols-rounded tab-icon" aria-hidden="true">{{ tab.icon }}</span>
      <span class="tab-label md-label-lg">{{ tab.label }}</span>
      <span v-if="tab.badge" class="tab-badge md-label-sm">{{ tab.badge }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  tabs: { type: Array, required: true },
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.training-tabs {
  display: flex;
  gap: var(--sp-1);
  padding: var(--sp-1);
  background: var(--md-surface-container-low);
  border-radius: var(--md-shape-lg);
  margin-bottom: var(--sp-2);
}

.training-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 44px;
  padding: var(--sp-2);
  border: none;
  border-radius: var(--md-shape-md);
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  transition: background var(--md-duration-short), color var(--md-duration-short);
}

@media (max-width: 899px) {
  .training-tabs {
    gap: 2px;
    padding: 2px;
    border-radius: var(--md-shape-md);
  }

  .training-tab {
    flex-direction: column;
    gap: 2px;
    min-height: 48px;
    padding: var(--sp-1) var(--sp-1);
  }

  .tab-icon {
    font-size: 22px;
  }

  .tab-label {
    font-size: 11px;
    line-height: 1.2;
  }

  .tab-badge {
    position: absolute;
    top: 4px;
    right: calc(50% - 22px);
    font-size: 10px;
    min-width: 1rem;
    padding: 0 4px;
  }

  .training-tab {
    position: relative;
  }
}

.training-tab.active {
  background: var(--md-surface);
  color: var(--md-primary);
  box-shadow: var(--md-elevation-1);
}

.tab-icon {
  font-size: 20px;
}

.training-tab.active .tab-icon {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.tab-badge {
  min-width: 1.25rem;
  padding: 0 6px;
  border-radius: var(--md-shape-full);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-size: 11px;
  line-height: 1.6;
}
</style>
