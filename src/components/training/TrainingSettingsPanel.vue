<template>
  <component :is="wrapperTag" class="settings-panel" :class="{ 'is-sidebar': variant === 'sidebar' }" v-bind="wrapperAttrs">
    <summary v-if="variant === 'collapsible'" class="settings-summary md-label-lg">
      <span class="summary-text">{{ summary }}</span>
      <span class="material-symbols-rounded summary-chevron">expand_more</span>
    </summary>

    <div class="settings-body card card-elevated">
      <p v-if="variant === 'sidebar'" class="md-title-sm settings-heading">Instellingen</p>

      <div class="section-block">
        <div class="section-head">
          <p class="md-title-sm">Aanwezige spelers</p>
          <button type="button" class="btn btn-text section-action" @click="$emit('toggle-all')">
            {{ allPresent ? 'Geen' : 'Alle' }}
          </button>
        </div>
        <div class="player-chips">
          <button
            v-for="p in roster"
            :key="p.id"
            type="button"
            class="chip"
            :class="{ active: presentIds.has(p.id) }"
            @click="$emit('toggle-player', p.id)"
          >
            {{ p.name }}
          </button>
        </div>
        <p v-if="balance" class="md-body-sm balance-line">
          {{ balance.counts.DEF + balance.counts.GK }} verdedigers ·
          {{ balance.counts.MID }} midden ·
          {{ balance.counts.ATT + balance.counts.WB }} aanvallers
          <span v-if="balance.needsAttackFocus" class="balance-hint"> — extra aanvalsoefeningen</span>
          <span v-else-if="balance.needsDefenceFocus" class="balance-hint"> — extra verdedigingsoefeningen</span>
        </p>
      </div>

      <div class="divider" />

      <div class="settings-grid">
        <div class="field-wrap">
          <label class="field-label">Type training</label>
          <select
            class="field field-select"
            :value="trainingType"
            @change="$emit('update:trainingType', $event.target.value)"
          >
            <option v-for="t in trainingTypes" :key="t.id" :value="t.id">{{ t.label }}</option>
          </select>
        </div>
        <div class="field-wrap">
          <label class="field-label">Duur (min)</label>
          <input
            class="field"
            type="number"
            :value="durationMin"
            min="30"
            max="120"
            step="5"
            @change="$emit('update:durationMin', +$event.target.value)"
          />
        </div>
      </div>

      <p class="md-body-sm cycle-info">
        Weekthema (cyclus week {{ cycleWeek }}/4): <strong>{{ cycleThemeLabel }}</strong>
      </p>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'collapsible' },
  forceOpen: { type: Boolean, default: false },
  summary: { type: String, required: true },
  roster: { type: Array, required: true },
  presentIds: { type: Object, required: true },
  allPresent: { type: Boolean, default: false },
  balance: { type: Object, default: null },
  trainingType: { type: String, required: true },
  durationMin: { type: Number, required: true },
  cycleWeek: { type: Number, required: true },
  cycleThemeLabel: { type: String, required: true },
  trainingTypes: { type: Array, required: true },
})

defineEmits([
  'toggle-all',
  'toggle-player',
  'update:trainingType',
  'update:durationMin',
])

const wrapperTag = computed(() => (props.variant === 'collapsible' ? 'details' : 'div'))

const wrapperAttrs = computed(() => {
  if (props.variant !== 'collapsible') return {}
  if (props.forceOpen) return { open: true }
  return {}
})
</script>

<style scoped>
.settings-panel {
  margin-bottom: var(--sp-3);
}

.settings-panel.is-sidebar {
  margin-bottom: 0;
}

.settings-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-1);
  cursor: pointer;
  list-style: none;
  color: var(--md-on-surface);
}

.settings-summary::-webkit-details-marker {
  display: none;
}

.summary-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}

.summary-chevron {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-short);
}

.settings-panel[open] .summary-chevron {
  transform: rotate(180deg);
}

.settings-body {
  padding: var(--sp-4);
}

.settings-heading {
  margin: 0 0 var(--sp-3);
}

.section-block {
  margin-bottom: var(--sp-3);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-3);
}

.section-action {
  height: 32px;
  font-size: 13px;
}

.player-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.balance-line {
  margin-top: var(--sp-3);
  color: var(--md-on-surface-variant);
}

.balance-hint {
  color: var(--md-primary);
  font-weight: 500;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}

@media (max-width: 480px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

.cycle-info {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.is-sidebar .settings-body {
  position: sticky;
  top: var(--sp-3);
}
</style>
