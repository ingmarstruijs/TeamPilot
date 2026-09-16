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
        {{ showConfig ? t('settings.title') : t('settings.who') }}
      </p>

      <!-- 1. Wie is er? -->
      <div v-if="showPresent" class="section-block">
        <div class="section-head" :class="{ 'section-head--action-only': nested }">
          <p v-if="!nested" class="md-title-sm section-title">{{ t('settings.who') }}</p>
          <button type="button" class="btn btn-text section-action" @click="$emit('toggle-all')">
            {{ allPresent ? t('common.none') : t('common.all') }}
          </button>
        </div>

        <section
          v-if="attendance.regularPresent.length"
          class="attendance-group attendance-group--present"
          :aria-label="t('settings.groupPresent', { count: attendance.regularPresent.length })"
        >
          <p class="md-label-sm attendance-group-label">
            {{ t('settings.groupPresent', { count: attendance.regularPresent.length }) }}
          </p>
          <div class="player-chips">
            <RosterChip
              v-for="p in attendance.regularPresent"
              :key="p.id"
              tag="button"
              type="button"
              :player="p"
              :shirt="teamShirt"
              :selected="true"
              @click="$emit('toggle-player', p.id)"
            />
          </div>
        </section>

        <section
          v-if="attendance.regularAbsent.length"
          class="attendance-group attendance-group--absent"
          :aria-label="t('settings.groupAbsent', { count: attendance.regularAbsent.length })"
        >
          <p class="md-label-sm attendance-group-label">
            {{ t('settings.groupAbsent', { count: attendance.regularAbsent.length }) }}
          </p>
          <div class="player-chips">
            <RosterChip
              v-for="p in attendance.regularAbsent"
              :key="p.id"
              tag="button"
              type="button"
              :player="p"
              :shirt="teamShirt"
              :selected="false"
              @click="$emit('toggle-player', p.id)"
            />
          </div>
        </section>

        <section
          v-if="attendance.injured.length"
          class="attendance-group attendance-group--injured"
          :aria-label="t('settings.groupInjured', { count: attendance.injured.length })"
        >
          <p class="md-label-sm attendance-group-label">
            {{ t('settings.groupInjured', { count: attendance.injured.length }) }}
          </p>
          <div class="player-chips">
            <RosterChip
              v-for="p in attendance.injured"
              :key="p.id"
              :player="p"
              :shirt="teamShirt"
              static-chip
            />
          </div>
        </section>

        <section
          v-if="attendance.guests.length"
          class="attendance-group attendance-group--guests"
          :aria-label="t('settings.groupGuests', { count: attendance.guests.length })"
        >
          <div class="attendance-guests-head">
            <p class="md-label-sm attendance-group-label">
              {{ t('settings.groupGuests', { count: attendance.guests.length }) }}
            </p>
            <button
              type="button"
              class="btn btn-text section-action guests-toggle-all"
              @click="$emit('toggle-all-guests')"
            >
              {{ allGuestsInTraining ? t('settings.guestsLeaveAll') : t('settings.guestsJoinAll') }}
            </button>
          </div>
          <p class="md-body-sm attendance-guests-hint">{{ t('settings.guestsTrainingHint') }}</p>
          <div class="player-chips">
            <RosterChip
              v-for="p in attendance.guests"
              :key="p.id"
              tag="button"
              type="button"
              :player="p"
              :shirt="teamShirt"
              :selected="presentIds.has(p.id)"
              @click="$emit('toggle-player', p.id)"
            />
          </div>
        </section>

        <p v-if="balance" class="md-body-sm balance-line">
          {{ t('settings.defenders', { n: balance.counts.DEF + balance.counts.GK }) }} ·
          {{ t('settings.mid', { n: balance.counts.MID }) }} ·
          {{ t('settings.attackers', { n: balance.counts.ATT + balance.counts.WB }) }}
          <span v-if="balance.needsAttackFocus" class="balance-hint">{{ t('settings.extraAttack') }}</span>
          <span v-else-if="balance.needsDefenceFocus" class="balance-hint">{{ t('settings.extraDefence') }}</span>
        </p>
      </div>

      <div v-if="showPresent && showConfig" class="divider" />

      <!-- 2. Type & duur -->
      <div v-if="showConfig" class="section-block section-block--config">
            <p v-if="!nested" class="md-title-sm section-title">{{ t('training.setup') }}</p>
            <div class="settings-grid">
              <div class="field-wrap">
                <label class="field-label field-label--icon" for="training-type-select">
                  <span class="material-symbols-rounded field-icon" aria-hidden="true">{{ trainingTypeIcon }}</span>
                  {{ t('settings.type') }}
                </label>
                <select
                  id="training-type-select"
                  class="field field-select"
                  :value="trainingType"
                  @change="$emit('update:trainingType', $event.target.value)"
                >
                  <option v-for="type in trainingTypes" :key="type.id" :value="type.id">{{ type.label }}</option>
                </select>
                <p v-if="typeFollowsTheme" class="md-label-sm type-theme-hint">
                  {{ t('settings.followsTheme') }}
                </p>
                <p v-else class="md-label-sm type-theme-hint type-theme-hint--override">
                  {{ t('settings.overrideTheme', { theme: cycleThemeLabel }) }}
                  <button
                    type="button"
                    class="btn btn-text type-follow-btn"
                    @click="$emit('follow-theme')"
                  >
                    {{ t('settings.followTheme') }}
                  </button>
            </p>
          </div>
          <div class="field-wrap">
            <label class="field-label" for="training-duration-input">{{ t('settings.duration') }}</label>
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
        {{ t('settings.weekThemeCycle', { week: cycleWeek }) }} <strong>{{ cycleThemeLabel }}</strong>
      </p>
    </div>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import { getCycleTheme } from '@/utils/trainingEngine'
import { getCycleThemeIcon, getTrainingTypeIcon } from '@/utils/trainingIcons'
import {
  allGuestsJoiningTraining,
  splitTrainingAttendance,
} from '@/utils/trainingAttendance'
import RosterChip from '@/components/ui/RosterChip.vue'
import { t } from '@/i18n'

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
  typeFollowsTheme: { type: Boolean, default: true },
  teamShirt: {
    type: Object,
    default: () => ({ style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }),
  },
})

defineEmits([
  'toggle-all',
  'toggle-all-guests',
  'toggle-player',
  'update:trainingType',
  'update:durationMin',
  'follow-theme',
])

const wrapperTag = computed(() => (props.variant === 'collapsible' ? 'details' : 'div'))

const wrapperAttrs = computed(() => {
  if (props.variant !== 'collapsible') return {}
  if (props.forceOpen) return { open: true }
  return {}
})
const trainingTypeIcon = computed(() => getTrainingTypeIcon(props.trainingType))
const cycleThemeIcon = computed(() => getCycleThemeIcon(getCycleTheme(props.cycleWeek)))
const attendance = computed(() => splitTrainingAttendance(props.roster, props.presentIds))
const allGuestsInTraining = computed(() =>
  allGuestsJoiningTraining(attendance.value.guests, props.presentIds),
)
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

.attendance-group {
  margin-bottom: var(--sp-3);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--md-shape-medium);
  border: 1px solid var(--md-outline-variant);
}

.attendance-group--present {
  background: color-mix(in srgb, var(--md-primary-container) 45%, var(--md-surface));
  border-color: color-mix(in srgb, var(--md-primary) 35%, var(--md-outline-variant));
}

.attendance-group--absent {
  background: color-mix(in srgb, var(--md-surface-variant) 35%, var(--md-surface));
}

.attendance-group--injured {
  background: color-mix(in srgb, var(--md-error-container) 55%, var(--md-surface));
  border-color: color-mix(in srgb, var(--md-error) 35%, var(--md-outline-variant));
}

.attendance-group--guests {
  background: color-mix(in srgb, var(--md-tertiary-container) 50%, var(--md-surface));
  border-color: color-mix(in srgb, var(--md-tertiary) 40%, var(--md-outline-variant));
}

.attendance-group-label {
  margin: 0 0 var(--sp-2);
  font-weight: 700;
  color: var(--md-on-surface);
}

.attendance-guests-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
}

.attendance-guests-head .attendance-group-label {
  margin-bottom: 0;
  flex: 1;
}

.guests-toggle-all {
  flex-shrink: 0;
  height: 28px;
  font-size: 12px;
  max-width: 48%;
  text-align: right;
  line-height: 1.2;
}

.attendance-guests-hint {
  margin: var(--sp-1) 0 var(--sp-2);
  color: var(--md-on-surface-variant);
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

.type-theme-hint {
  margin: var(--sp-1) 0 0;
  color: var(--md-on-surface-variant);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
}

.type-theme-hint--override {
  color: var(--md-on-surface-variant);
}

.type-follow-btn {
  height: 28px;
  padding-inline: var(--sp-2);
  font-size: 12px;
}

.is-sidebar .settings-body {
  position: sticky;
  top: var(--sp-3);
}
</style>
