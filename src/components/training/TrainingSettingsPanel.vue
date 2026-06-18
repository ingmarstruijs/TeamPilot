<template>
  <component
    :is="wrapperTag"
    class="settings-panel"
    :class="{
      'is-sidebar': variant === 'sidebar',
      'is-embedded': variant === 'embedded',
      'is-nested': nested,
    }"
    v-bind="wrapperAttrs"
  >
    <summary v-if="variant === 'collapsible'" class="settings-summary md-label-lg">
      <span class="summary-text">{{ summary }}</span>
      <span class="material-symbols-rounded summary-chevron">expand_more</span>
    </summary>

    <div class="settings-body" :class="{ 'card card-elevated': variant !== 'embedded' && !nested }">
      <p v-if="variant === 'sidebar'" class="md-title-sm settings-heading">
        {{ showConfig ? 'Instellingen' : 'Wie is er?' }}
      </p>

      <!-- 1. Wie is er? -->
      <div v-if="showPresent" class="section-block">
        <div class="section-head" :class="{ 'section-head--action-only': nested }">
          <p v-if="!nested" class="md-title-sm section-title">Wie is er?</p>
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
          <span v-if="balance.needsAttackFocus" class="balance-hint"> — extra aanval</span>
          <span v-else-if="balance.needsDefenceFocus" class="balance-hint"> — extra verdediging</span>
        </p>
      </div>

      <div v-if="showPresent && showConfig" class="divider" />

      <!-- 2. Type & duur -->
      <div v-if="showConfig" class="section-block section-block--config">
        <p v-if="!nested" class="md-title-sm section-title">Opzet</p>
        <div class="settings-grid">
          <div class="field-wrap">
            <label class="field-label field-label--icon" for="training-type-select">
              <span class="material-symbols-rounded field-icon" aria-hidden="true">{{ trainingTypeIcon }}</span>
              Type
            </label>
            <select
              id="training-type-select"
              class="field field-select"
              :value="trainingType"
              @change="$emit('update:trainingType', $event.target.value)"
            >
              <option v-for="t in trainingTypes" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <div class="field-wrap">
            <label class="field-label" for="training-duration-input">Duur (min)</label>
            <input
              id="training-duration-input"
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
      </div>

      <p v-if="showCycleInfo" class="md-body-sm cycle-info">
        <span class="material-symbols-rounded cycle-theme-icon" aria-hidden="true">{{ cycleThemeIcon }}</span>
        Weekthema (cyclus week {{ cycleWeek }}/4): <strong>{{ cycleThemeLabel }}</strong>
      </p>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { getCycleTheme } from '@/utils/trainingEngine'
import { getCycleThemeIcon, getTrainingTypeIcon } from '@/utils/trainingIcons'

const props = defineProps({
  variant: { type: String, default: 'collapsible' },
  forceOpen: { type: Boolean, default: false },
  summary: { type: String, default: '' },
  showCycleInfo: { type: Boolean, default: true },
  showPresent: { type: Boolean, default: true },
  showConfig: { type: Boolean, default: true },
  nested: { type: Boolean, default: false },
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
const trainingTypeIcon = computed(() => getTrainingTypeIcon(props.trainingType))
const cycleThemeIcon = computed(() => getCycleThemeIcon(getCycleTheme(props.cycleWeek)))
</script>

<style scoped>
.settings-panel {
  margin-bottom: var(--sp-3);
}

.settings-panel.is-sidebar {
  margin-bottom: 0;
}

.settings-panel.is-embedded {
  margin: 0;
}

.settings-panel.is-embedded .settings-body {
  padding: 0;
  background: transparent;
  box-shadow: none;
  border: none;
}

.settings-panel.is-embedded .section-block {
  margin-bottom: var(--sp-3);
}

.settings-panel.is-embedded .section-block--config {
  margin-bottom: 0;
}

.settings-panel.is-embedded .settings-grid {
  margin-bottom: 0;
}

.settings-panel.is-nested {
  margin: 0 0 var(--sp-3);
}

.settings-panel.is-nested .settings-summary {
  padding: var(--sp-2) 0;
  margin-bottom: 0;
  font-weight: 500;
}

.settings-panel.is-nested .settings-body {
  padding: var(--sp-2) 0 0;
  background: transparent;
  box-shadow: none;
  border: none;
}

.settings-panel.is-nested .section-block {
  margin-bottom: 0;
}

.settings-panel.is-nested .section-head {
  margin-bottom: var(--sp-2);
}

.section-title {
  margin: 0;
}

.section-block--config .section-title {
  margin-bottom: var(--sp-2);
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

.section-head--action-only {
  justify-content: flex-end;
  margin-bottom: var(--sp-2);
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin: 0;
  color: var(--md-on-surface-variant);
}

.cycle-theme-icon,
.field-icon {
  font-size: 18px;
  color: var(--md-primary);
}

.field-label--icon {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-1);
}

.is-sidebar .settings-body {
  position: sticky;
  top: var(--sp-3);
}
</style>
