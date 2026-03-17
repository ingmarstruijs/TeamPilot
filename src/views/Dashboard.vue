<template>
  <div class="page">
    <!-- Quick actions -->
    <div class="quick-section">
      <p class="section-title md-title-sm">Snel starten</p>
      <div class="quick-grid">
        <RouterLink to="/lineup/new" class="quick-card card">
          <span class="material-symbols-rounded quick-icon" style="color:var(--md-primary)">sports_soccer</span>
          <p class="md-title-sm">Nieuwe opstelling</p>
          <p class="md-body-sm" style="color:var(--md-on-surface-variant)">Maak een opstelling met formatie</p>
        </RouterLink>
        <RouterLink to="/players" class="quick-card card">
          <span class="material-symbols-rounded quick-icon" style="color:var(--md-secondary)">group_add</span>
          <p class="md-title-sm">Spelers beheren</p>
          <p class="md-body-sm" style="color:var(--md-on-surface-variant)">Spelers toevoegen of bewerken</p>
        </RouterLink>
        <RouterLink to="/lineups" class="quick-card card">
          <span class="material-symbols-rounded quick-icon" style="color:var(--md-tertiary)">folder_open</span>
          <p class="md-title-sm">Opgeslagen</p>
          <p class="md-body-sm" style="color:var(--md-on-surface-variant)">Bekijk al je opstellingen</p>
        </RouterLink>
      </div>
    </div>

    <!-- Recent lineups -->
    <div v-if="recentLineups.length" class="quick-section">
      <div class="section-row">
        <p class="section-title md-title-sm">Recent opgeslagen</p>
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

    <!-- Team settings -->
    <div class="quick-section">
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
          <div class="color-row">
            <button
              v-for="c in TEAM_COLORS"
              :key="c"
              class="color-swatch"
              :style="{ background: c, outline: activeTeam?.shirt?.primary === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }"
              @click="updateShirt('primary', c)"
              :aria-label="`Kleur ${c}`"
            ></button>
          </div>
        </div>
        <template v-if="activeTeam?.shirt?.style !== 'solid'">
          <div class="divider"></div>
          <div class="settings-row">
            <span class="md-body-md">Secundaire kleur</span>
            <div class="color-row">
              <button
                v-for="c in TEAM_COLORS"
                :key="c"
                class="color-swatch"
                :style="{ background: c, outline: activeTeam?.shirt?.secondary === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }"
                @click="updateShirt('secondary', c)"
                :aria-label="`Kleur ${c}`"
              ></button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { AGE_GROUPS } from '@/data/formations'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const store = useTeamStore()
const activeTeam     = computed(() => store.activeTeam)
const ageGroupConfig = computed(() => store.ageGroupConfig)
const playerCount    = computed(() => activeTeam.value?.players?.length ?? 0)

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

const TEAM_COLORS = [
  '#1a6b3c', '#0d47a1', '#b71c1c', '#e65100',
  '#4a148c', '#006064', '#1b5e20', '#212121',
  '#ffffff', '#f5c518',
]
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

.quick-section { margin-bottom: var(--sp-5); }
.section-title { margin-bottom: var(--sp-3); color: var(--md-on-surface-variant); }
.section-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-3); }

.quick-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: var(--sp-3);
}
.quick-card {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  padding: var(--sp-3);
  text-decoration: none;
  color: var(--md-on-surface);
  transition: box-shadow var(--md-duration-short);
  min-height: 130px;
  justify-content: flex-start;
}
.quick-card:hover { box-shadow: var(--md-elevation-2); }
.quick-icon { font-size: 28px; }
.quick-card p { margin: 0; line-height: 1.3; font-size: 13px; }
.quick-card .md-title-sm { font-size: 13px; }
.quick-card .md-body-sm { font-size: 12px; }

.recent-list { display: flex; flex-direction: column; gap: var(--sp-1); }
.recent-item {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-1) var(--sp-2);
  height: 40px;
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
  .recent-item { gap: var(--sp-3); padding: var(--sp-2) var(--sp-3); }
  .recent-dot-field { width: 56px; height: 40px; }
  .rdot { width: 6px; height: 6px; }
}

/* Team settings */
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

.color-row { display: flex; gap: var(--sp-1); flex-wrap: wrap; }
.color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,.1);
  cursor: pointer;
  transition: transform var(--md-duration-short);
}
.color-swatch:hover { transform: scale(1.15); }

/* Desktop adjustments */
@media (min-width: 720px) {
  .quick-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  }
  .quick-card {
    padding: var(--sp-4);
    min-height: 160px;
  }
  .quick-icon { font-size: 36px; }
  .quick-card p { font-size: 1em; }
  .quick-card .md-title-sm { font-size: 1em; }
  .quick-card .md-body-sm { font-size: 1em; }
}
</style>
