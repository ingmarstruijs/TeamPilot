<template>
  <div class="page">
    <!-- Team settings -->
    <div class="team-settings-section">
      <p class="section-title md-title-sm">Team instellingen</p>
      <div class="card team-settings">
        <div class="settings-row">
          <span class="md-body-md">Teamnaam</span>
          <input
            class="settings-input"
            :value="activeTeam?.name"
            @blur="e => updateTeam('name', e.target.value)"
            maxlength="40"
          />
        </div>
        <div class="divider"></div>
        <div class="settings-row">
          <span class="md-body-md">Leeftijdsgroep</span>
          <select class="settings-input field-select" :value="activeTeam?.ageGroup" @change="e => updateTeam('ageGroup', e.target.value)">
            <option v-for="g in AGE_GROUPS" :key="g.id" :value="g.id">{{ g.label }}</option>
          </select>
        </div>
        <div class="divider"></div>
        <!-- Shirt style selector -->
        <div class="settings-row settings-row--col">
          <span class="md-body-md">Shirtkleur</span>
          <div class="shirt-styles">
            <button
              v-for="s in SHIRT_STYLES"
              :key="s.id"
              class="shirt-style-btn"
              :class="{ active: activeTeam?.shirt?.style === s.id }"
              @click="updateShirt('style', s.id)"
              :aria-label="s.label"
            >
              <ShirtAvatar :shirt="{ ...( activeTeam?.shirt ?? defaultShirtFallback), style: s.id }" :size="28" />
              <span class="shirt-style-label">{{ s.label }}</span>
            </button>
          </div>
        </div>
        <div class="divider"></div>
        <div class="settings-row">
          <span class="md-body-md">Primaire kleur</span>
          <input
            type="color"
            :value="activeTeam?.shirt?.primary ?? defaultShirtFallback.primary"
            @input="e => updateShirt('primary', e.target.value)"
            class="color-picker"
          />
        </div>
        <template v-if="activeTeam?.shirt?.style !== 'solid'">
          <div class="divider"></div>
          <div class="settings-row">
            <span class="md-body-md">Secundaire kleur</span>
            <input
              type="color"
              :value="activeTeam?.shirt?.secondary ?? defaultShirtFallback.secondary"
              @input="e => updateShirt('secondary', e.target.value)"
              class="color-picker"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- Share team -->
    <div class="card team-settings" style="margin-bottom:var(--sp-5)">
      <div class="settings-row">
        <div>
          <p class="md-body-md">Team delen</p>
          <p class="md-body-sm" style="color:var(--md-on-surface-variant)">Stuur een link met jouw team en spelers</p>
        </div>
        <button class="btn btn-tonal" @click="shareTeam">
          <span class="material-symbols-rounded" style="font-size:18px">share</span>
          Deel link
        </button>
      </div>
    </div>

    <!-- Recent lineups -->
    <div v-if="recentLineups.length" class="recent-section">
      <div class="section-row">
        <p class="section-title md-title-sm">Recente opstellingen</p>
        <RouterLink to="/lineups" class="btn btn-text" style="height:32px;font-size:13px">Alle bekijken</RouterLink>
      </div>
      <div class="recent-list">
        <RouterLink
          v-for="lineup in recentLineups"
          :key="lineup.id"
          :to="`/lineup/${lineup.id}`"
          class="recent-item card"
        >
          <div class="recent-info">
            <div class="recent-header">
              <p class="md-title-sm">{{ lineup.name }}</p>
              <p class="md-label-sm" style="color:var(--md-on-surface-variant);white-space:nowrap">{{ formatDate(lineup.updatedAt) }}</p>
            </div>
          </div>
          <span class="material-symbols-rounded" style="color:var(--md-outline)">chevron_right</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { AGE_GROUPS } from '@/data/formations'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import { showSnackbar } from '@/composables/useSnackbar'

const store = useTeamStore()
const activeTeam     = computed(() => store.activeTeam)
const ageGroupConfig = computed(() => store.ageGroupConfig)

const recentLineups = computed(() =>
  [...store.teamLineups]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3)
)

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function updateTeam(field, value) {
  if (!value?.toString().trim()) return
  store.updateTeam(store.activeTeamId, { [field]: value })
}

function updateShirt(key, value) {
  const current = activeTeam.value?.shirt ?? defaultShirtFallback
  store.updateTeam(store.activeTeamId, { shirt: { ...current, [key]: value } })
}

const defaultShirtFallback = { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }

const SHIRT_STYLES = [
  { id: 'solid',    label: 'Effen'    },
  { id: 'gradient', label: 'Verloop'  },
  { id: 'halves-v', label: 'Links/Re' },
  { id: 'halves-h', label: 'Boven/On' },
  { id: 'stripes',  label: 'Strepen'  },
  { id: 'sash',     label: 'Sjerp'    },
]

function shareTeam() {
  const team = activeTeam.value
  if (!team) return
  const data = {
    n: team.name,
    a: team.ageGroup,
    sh: team.shirt ? [team.shirt.style, team.shirt.primary, team.shirt.secondary] : null,
    p: (team.players ?? []).map(p => [p.name, p.number ?? null, p.position]),
  }
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
  const url = `${window.location.origin}${window.location.pathname}#/?import=${encodeURIComponent(encoded)}`
  if (navigator.share) {
    navigator.share({ title: team.name, text: `Bekijk mijn team ${team.name} in TeamPilot`, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showSnackbar('Team-link gekopieerd!'))
      .catch(() => showSnackbar('Kopiëren mislukt'))
  }
}
</script>

<style scoped>
.hero {
  margin-bottom: var(--sp-5);
  background: linear-gradient(135deg, var(--md-primary) 0%, color-mix(in srgb, var(--md-primary) 70%, #000) 100%);
  color: white;
  border-radius: var(--md-shape-lg);
}
.hero-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-5);
}
.hero-text h1, .hero-text .md-label-lg { color: white; }
.hero-ball { font-size: 56px; opacity: .8; }
.team-meta { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-2); }
.hero .chip {
  background: rgba(255,255,255,.2);
  color: white;
  border-color: rgba(255,255,255,.3);
}

/* Team settings */
.team-settings-section { margin-bottom: var(--sp-5); }
.section-title { color: var(--md-on-surface-variant); margin-bottom: var(--sp-3); }
.section-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-3); }

.team-settings { padding: 0; }
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-3) var(--sp-4);
  gap: var(--sp-3);
}
.settings-input {
  background: var(--md-surface);
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  padding: var(--sp-1) var(--sp-3);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
  outline: none;
  text-align: right;
  height: 40px;
  max-width: 180px;
  transition: border-color var(--md-duration-short), background var(--md-duration-short);
}
.settings-input:hover { 
  border-color: var(--md-outline);
}
.settings-input:focus { 
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, transparent);
}

.settings-row--col {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
}

.shirt-styles {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.shirt-style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--md-surface-container);
  border: 2px solid transparent;
  border-radius: var(--md-shape-sm);
  padding: var(--sp-1) var(--sp-2);
  cursor: pointer;
  transition: border-color var(--md-duration-short), background var(--md-duration-short);
}
.shirt-style-btn:hover { background: var(--md-surface-container-high); }
.shirt-style-btn.active {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}
.shirt-style-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  white-space: nowrap;
}
.shirt-style-btn.active .shirt-style-label { color: var(--md-primary); }

.color-picker {
  width: 48px;
  height: 48px;
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  cursor: pointer;
  transition: border-color var(--md-duration-short);
}
.color-picker:hover {
  border-color: var(--md-outline);
}
.color-picker:active {
  border-color: var(--md-primary);
}

/* Recent lineups */
.recent-section { margin-bottom: var(--sp-5); }

.recent-list { display: flex; flex-direction: column; gap: var(--sp-1); }
.recent-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  text-decoration: none;
  color: var(--md-on-surface);
  transition: box-shadow var(--md-duration-short);
}
.recent-item:hover { box-shadow: var(--md-elevation-2); }

.recent-info {
  flex: 1;
  min-width: 0;
}
.recent-header {
  display: flex;
  align-items: baseline;
  gap: var(--sp-2);
  min-width: 0;
}
.recent-header .md-title-sm {
  flex-shrink: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent-header .md-label-sm {
  flex-shrink: 0;
  margin: 0;
}
.recent-info .md-title-sm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Desktop: restore full size for recent lineups */
@media (min-width: 720px) {
  .recent-list { gap: var(--sp-2); }
  .recent-item { gap: var(--sp-3); padding: var(--sp-3) var(--sp-4); }
}
</style>
