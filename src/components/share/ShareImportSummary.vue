<template>
  <div class="share-summary">
    <header class="ss-hero">
      <ShirtAvatar
        :shirt="displayShirt"
        :initials="teamInitials"
        :size="44"
      />
      <div class="ss-hero-text">
        <p class="md-title-sm ss-name">{{ teamName }}</p>
        <p class="md-body-sm ss-hero-meta">{{ heroMeta }}</p>
      </div>
    </header>

    <section class="ss-card">
      <h3 class="md-label-lg ss-heading">{{ t('share.summarySettings') }}</h3>
      <dl class="ss-defs">
        <div class="ss-def">
          <dt>{{ t('team.ageGroup') }}</dt>
          <dd>{{ ageGroupLabel || ageGroup || '—' }}</dd>
        </div>
        <div class="ss-def">
          <dt>{{ t('team.knvbClass') }}</dt>
          <dd>{{ knvbClassLabel || t('share.summaryUnknownClass') }}</dd>
        </div>
        <div class="ss-def">
          <dt>{{ t('team.shirt') }}</dt>
          <dd class="ss-shirt">
            <span
              class="ss-swatch"
              :style="{ background: displayShirt.primary }"
            />
            <span
              v-if="displayShirt.style !== 'solid'"
              class="ss-swatch"
              :style="{ background: displayShirt.secondary }"
            />
            {{ shirtLabel }}
          </dd>
        </div>
      </dl>
    </section>

    <section class="ss-card">
      <h3 class="md-label-lg ss-heading">
        {{ t('share.summaryPlayers', { count: players.length }) }}
      </h3>
      <p v-if="!players.length" class="md-body-sm ss-empty">{{ t('share.summaryNoPlayers') }}</p>
      <ul v-else class="ss-player-list">
        <li v-for="player in sortedPlayers" :key="playerKey(player)">
          <RosterChip :player="chipPlayer(player)" :shirt="displayShirt" static-chip />
        </li>
      </ul>
    </section>

    <section v-if="lineup" class="ss-card">
      <h3 class="md-label-lg ss-heading">{{ t('share.summaryLineup') }}</h3>
      <p v-if="lineup.name" class="md-body-sm ss-lineup-name">{{ lineup.name }}</p>
      <div
        v-for="(period, i) in lineup.periods"
        :key="i"
        class="ss-period"
      >
        <p class="md-label-md ss-period-title">
          {{ periodTitle(i) }}
          <span class="ss-period-meta">
            {{ period.formationId || t('lineup.free') }}
            · {{ t('share.summaryOnField', { filled: period.filled, total: period.total }) }}
          </span>
        </p>
        <p v-if="period.players.length" class="md-body-sm ss-period-names">
          {{ period.players.map(p => p.name).join(', ') }}
        </p>
        <p v-else class="md-body-sm ss-empty">{{ t('share.summaryEmptyPeriod') }}</p>
      </div>
      <div v-if="lineup.bench?.length" class="ss-period">
        <p class="md-label-md ss-period-title">{{ t('lineup.bench') }}</p>
        <p class="md-body-sm ss-period-names">
          {{ lineup.bench.map(p => p.name).join(', ') }}
        </p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import { t } from '@/i18n'

const props = defineProps({
  teamName: { type: String, default: '' },
  ageGroup: { type: String, default: '' },
  ageGroupLabel: { type: String, default: '' },
  knvbClass: { type: String, default: null },
  knvbClassLabel: { type: String, default: null },
  shirt: { type: Object, default: null },
  players: { type: Array, default: () => [] },
  lineup: { type: Object, default: null },
})

const displayShirt = computed(() => (
  props.shirt ?? { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }
))

const teamInitials = computed(() => {
  const parts = String(props.teamName ?? '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const shirtLabel = computed(() => {
  const style = displayShirt.value.style
  const key = `shirt.${style}`
  const label = t(key)
  return label === key ? style : label
})

const heroMeta = computed(() => {
  const parts = [
    props.ageGroupLabel || props.ageGroup,
    props.knvbClassLabel,
    t('share.summaryPlayerCount', { count: props.players.length }),
  ].filter(Boolean)
  return parts.join(' · ')
})

const sortedPlayers = computed(() => (
  [...props.players].sort((a, b) => {
    const rank = p => (p.injured ? 2 : p.guest ? 1 : 0)
    const diff = rank(a) - rank(b)
    if (diff) return diff
    return String(a.name).localeCompare(String(b.name), 'nl')
  })
))

function chipPlayer(player) {
  return {
    name: player.name,
    number: player.number,
    guest: Boolean(player.guest),
    injured: Boolean(player.injured),
    available: player.available !== false && !player.injured,
  }
}

function playerKey(player) {
  return `${player.name}|${player.number ?? ''}|${player.position ?? ''}`
}

function periodTitle(index) {
  const mode = props.lineup?.periodMode
  const n = index + 1
  if (mode === 'quarters') return t('lineupShare.shareQuarterLabel', { n })
  if (mode === 'halves') return t('lineupShare.shareHalfLabel', { n })
  return t('nav.lineup')
}
</script>

<style scoped>
.share-summary {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.ss-hero {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
}

.ss-hero-text { min-width: 0; }
.ss-name, .ss-hero-meta { margin: 0; }
.ss-hero-meta { color: var(--md-on-surface-variant); }

.ss-card {
  background: var(--md-surface-container-low, var(--md-surface-variant));
  border-radius: var(--md-shape-md);
  padding: var(--sp-3);
}

.ss-heading { margin: 0 0 var(--sp-2); }

.ss-defs {
  display: grid;
  gap: var(--sp-2);
  margin: 0;
}

.ss-def {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
  gap: var(--sp-2);
  align-items: center;
}

.ss-def dt {
  margin: 0;
  color: var(--md-on-surface-variant);
  font-size: 12px;
}

.ss-def dd {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
}

.ss-shirt {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ss-swatch {
  width: 14px;
  height: 14px;
  border-radius: var(--md-shape-full);
  border: 1px solid var(--md-outline-variant);
  flex-shrink: 0;
}

.ss-player-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.ss-empty {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.ss-lineup-name {
  margin: 0 0 var(--sp-2);
  font-weight: 600;
}

.ss-period + .ss-period {
  margin-top: var(--sp-3);
  padding-top: var(--sp-2);
  border-top: 1px solid var(--md-outline-variant);
}

.ss-period-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px var(--sp-2);
  align-items: baseline;
}

.ss-period-meta {
  font-weight: 500;
  color: var(--md-on-surface-variant);
}

.ss-period-names {
  margin: 4px 0 0;
  color: var(--md-on-surface);
}
</style>
