<template>
  <div class="page dashboard" :class="{ 'dashboard--setup': needsTeamSetup }">
    <!-- Hero -->
    <section class="hero card card-elevated">
      <div class="hero-inner">
        <div class="hero-text">
          <h1 class="md-headline-sm">{{ needsTeamSetup ? 'Welkom bij TeamPilot' : activeTeam?.name }}</h1>
          <p class="md-body-md hero-sub">
            <template v-if="needsTeamSetup">
              Stel je team in om trainingen en opstellingen te plannen
            </template>
            <template v-else>
              {{ ageGroupConfig?.label }} · {{ knvbClassConfig?.label }}
            </template>
          </p>
          <div class="hero-meta">
            <span v-if="needsTeamSetup && activeTeam?.name !== 'Mijn Team'" class="hero-chip md-label-sm">
              {{ activeTeam?.name }}
            </span>
            <span v-if="!needsTeamSetup" class="hero-chip md-label-sm">
              <span class="material-symbols-rounded" aria-hidden="true">group</span>
              {{ playerCount }} spelers
            </span>
            <span v-if="!needsTeamSetup" class="hero-chip md-label-sm">
              <span class="material-symbols-rounded" aria-hidden="true">calendar_today</span>
              Cyclus week {{ cycleWeek }}/4
            </span>
          </div>
        </div>
        <div class="hero-shirt-badge" aria-hidden="true">
          <ShirtAvatar :shirt="teamShirt" :size="56" />
        </div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="quick-actions dashboard-actions">
      <p class="section-title md-title-sm">Snelle acties</p>
      <div class="action-grid">
        <RouterLink to="/training" class="action-tile card">
          <span class="material-symbols-rounded action-icon">stadium</span>
          <span class="md-label-lg">Training</span>
        </RouterLink>
        <RouterLink to="/lineup/new" class="action-tile card">
          <span class="material-symbols-rounded action-icon">grid_view</span>
          <span class="md-label-lg">Opstelling</span>
        </RouterLink>
        <RouterLink to="/players" class="action-tile card" :class="{ 'action-tile--highlight': needsTeamSetup }">
          <span class="material-symbols-rounded action-icon">groups</span>
          <span class="md-label-lg">Spelers</span>
          <span v-if="needsTeamSetup" class="action-hint md-label-sm">Volgende stap</span>
        </RouterLink>
        <RouterLink to="/training?library=1" class="action-tile card">
          <span class="material-symbols-rounded action-icon">library_books</span>
          <span class="md-label-lg">Bibliotheek</span>
        </RouterLink>
      </div>
    </section>

    <!-- Recent lineups -->
    <section v-if="recentLineups.length" class="recent-section">
      <p class="section-title md-title-sm">Recente opstellingen</p>
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
              <p class="md-label-sm recent-date">{{ formatDate(lineup.updatedAt) }}</p>
            </div>
          </div>
          <span class="material-symbols-rounded recent-chevron">chevron_right</span>
        </RouterLink>
      </div>
    </section>

    <!-- Share team -->
    <div v-if="!needsTeamSetup" class="card share-card dashboard-share">
      <div class="share-row">
        <div>
          <p class="md-body-md">Team delen</p>
          <p class="md-body-sm share-desc">Stuur een link met jouw team en spelers</p>
        </div>
        <button class="btn btn-tonal share-btn" @click="shareTeam">
          <span class="material-symbols-rounded" style="font-size:18px">share</span>
          Deel link
        </button>
      </div>
    </div>

    <!-- Team settings -->
    <details
      class="settings-details dashboard-settings"
      :class="{ 'settings-details--setup': needsTeamSetup }"
      :open="settingsOpen"
    >
      <summary v-if="!needsTeamSetup" class="settings-summary md-title-sm">
        <span>Team instellingen</span>
        <span class="material-symbols-rounded settings-chevron">expand_more</span>
      </summary>

      <div v-if="needsTeamSetup" class="setup-intro">
        <p class="md-title-sm setup-title">Stel je team in</p>
        <p class="md-body-sm setup-desc">
          Vul je teamgegevens in. Daarna voeg je spelers toe om te starten.
        </p>
        <ol class="setup-steps md-body-sm">
          <li>Teamnaam en leeftijdsgroep</li>
          <li>Competitieklasse en shirtkleur</li>
          <li>Spelers toevoegen</li>
        </ol>
      </div>

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
        <div class="settings-row">
          <span class="md-body-md">Competitieklasse</span>
          <select class="settings-input field-select" :value="activeTeam?.knvbClass" @change="e => updateTeam('knvbClass', e.target.value)">
            <option v-for="c in KNVB_CLASSES" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </div>
        <div class="divider"></div>
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
          <div class="color-picker-group">
            <div v-if="recentColors.length" class="color-swatches-group">
              <span class="color-swatches-label">Recent</span>
              <div class="color-swatches">
                <button
                  v-for="color in recentColors"
                  :key="color"
                  type="button"
                  class="color-swatch"
                  :style="{ background: color }"
                  @click="updateShirt('primary', color)"
                  :title="color"
                />
              </div>
            </div>
            <input
              type="color"
              :value="activeTeam?.shirt?.primary ?? defaultShirtFallback.primary"
              @input="e => updateShirt('primary', e.target.value)"
              class="color-picker"
            />
          </div>
        </div>
        <template v-if="activeTeam?.shirt?.style !== 'solid'">
          <div class="divider"></div>
          <div class="settings-row">
            <span class="md-body-md">Secundaire kleur</span>
            <div class="color-picker-group">
              <div v-if="recentColors.length" class="color-swatches-group">
                <span class="color-swatches-label">Recent</span>
                <div class="color-swatches">
                  <button
                    v-for="color in recentColors"
                    :key="color"
                    type="button"
                    class="color-swatch"
                    :style="{ background: color }"
                    @click="updateShirt('secondary', color)"
                    :title="color"
                  />
                </div>
              </div>
              <input
                type="color"
                :value="activeTeam?.shirt?.secondary ?? defaultShirtFallback.secondary"
                @input="e => updateShirt('secondary', e.target.value)"
                class="color-picker"
              />
            </div>
          </div>
        </template>
      </div>

      <div v-if="needsTeamSetup" class="setup-footer">
        <RouterLink to="/players" class="btn btn-filled setup-players-btn">
          <span class="material-symbols-rounded" aria-hidden="true">group_add</span>
          Spelers toevoegen
        </RouterLink>
      </div>
    </details>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { AGE_GROUPS } from '@/data/formations'
import { KNVB_CLASSES } from '@/data/knvbClasses'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { useMediaQuery } from '@/composables/useMediaQuery'

const store = useTeamStore()
const isDesktop = useMediaQuery('(min-width: 720px)')

const activeTeam = computed(() => store.activeTeam)
const ageGroupConfig = computed(() => store.ageGroupConfig)
const knvbClassConfig = computed(() => store.knvbClassConfig)
const recentColors = computed(() => store.recentColors.slice(0, 3))
const playerCount = computed(() => activeTeam.value?.players?.length ?? 0)
const cycleWeek = computed(() => store.getTrainingState().cycleWeek ?? 1)

/** Team not yet configured — no players added yet. */
const needsTeamSetup = computed(() => playerCount.value === 0)

const settingsOpen = computed(() => needsTeamSetup.value || isDesktop.value)

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
  if (key === 'primary' || key === 'secondary') store.addRecentColors(value)
}

const defaultShirtFallback = { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }

const teamShirt = computed(() => activeTeam.value?.shirt ?? defaultShirtFallback)

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
  const bytes = new TextEncoder().encode(JSON.stringify(data))
  const b64url = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  const url = `${window.location.origin}${window.location.pathname}#/?import=${b64url}`
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
.dashboard {
  display: flex;
  flex-direction: column;
  gap: var(--sp-5);
}

.dashboard-settings {
  order: 10;
}

.dashboard--setup .dashboard-settings {
  order: 1;
}

.dashboard--setup .dashboard-actions {
  order: 2;
}

.dashboard--setup .recent-section {
  order: 3;
}

.settings-details--setup {
  margin-bottom: 0;
}

.setup-intro {
  margin-bottom: var(--sp-3);
}

.setup-title {
  margin: 0 0 var(--sp-1);
  color: var(--md-on-surface);
}

.setup-desc {
  margin: 0 0 var(--sp-3);
  color: var(--md-on-surface-variant);
  line-height: 1.45;
}

.setup-steps {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--md-on-surface-variant);
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.settings-details--setup .team-settings {
  border: 2px solid color-mix(in srgb, var(--md-primary) 35%, var(--md-outline-variant));
  box-shadow: var(--md-elevation-1);
}

.setup-footer {
  margin-top: var(--sp-3);
}

.setup-players-btn {
  width: 100%;
  min-height: 48px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
}

.hero {
  border: none;
  overflow: hidden;
  position: relative;
  color: var(--md-on-primary);
  background: linear-gradient(
    135deg,
    var(--md-primary) 0%,
    var(--md-secondary) 55%,
    color-mix(in srgb, var(--md-on-primary-container) 88%, var(--md-primary)) 100%
  );
  box-shadow: var(--md-elevation-2);
}

.hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 70% 80% at 100% -10%, rgba(255, 255, 255, 0.14) 0%, transparent 55%),
    radial-gradient(circle at 0% 100%, rgba(255, 255, 255, 0.07) 0%, transparent 45%);
  pointer-events: none;
}

.hero-inner {
  display: flex;
  align-items: center;
  gap: var(--sp-4);
  padding: var(--sp-5);
  position: relative;
  z-index: 1;
}

.hero-text {
  flex: 1;
  min-width: 0;
}

.hero-text h1 {
  margin: 0;
  color: var(--md-on-primary);
  font-weight: 500;
}

.hero-sub {
  margin: var(--sp-1) 0 0;
  color: color-mix(in srgb, var(--md-on-primary) 88%, transparent);
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  margin-top: var(--sp-3);
}

.hero-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: var(--md-shape-full);
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.22);
  color: var(--md-on-primary);
  backdrop-filter: blur(6px);
}

.hero-chip .material-symbols-rounded {
  font-size: 16px;
}

.hero-shirt-badge {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: var(--md-shape-lg);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 4px 16px rgba(5, 150, 105, 0.25);
}

.section-title {
  color: var(--md-on-surface-variant);
  margin: 0 0 var(--sp-3);
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-2);
}

.action-tile {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
  padding: var(--sp-4);
  text-decoration: none;
  color: var(--md-on-surface);
  min-height: 88px;
  transition: box-shadow var(--md-duration-short), transform var(--md-duration-short);
}

.action-tile:hover {
  box-shadow: var(--md-elevation-2);
  transform: translateY(-1px);
}

.action-tile--highlight {
  border: 2px solid color-mix(in srgb, var(--md-primary) 40%, transparent);
  background: color-mix(in srgb, var(--md-primary) 6%, var(--md-surface));
}

.action-hint {
  color: var(--md-primary);
  margin-top: auto;
}

.action-icon {
  font-size: 28px;
  color: var(--md-primary);
}

.share-card {
  padding: var(--sp-3) var(--sp-4);
}

.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.share-desc {
  color: var(--md-on-surface-variant);
  margin: 2px 0 0;
}

.settings-details {
  margin-bottom: var(--sp-5);
}

.settings-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  color: var(--md-on-surface-variant);
  margin-bottom: var(--sp-3);
  list-style: none;
}

.settings-summary::-webkit-details-marker {
  display: none;
}

.settings-chevron {
  transition: transform var(--md-duration-short);
}

.settings-details[open] .settings-chevron {
  transform: rotate(180deg);
}

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
.settings-input:hover { border-color: var(--md-outline); }
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
}
.color-picker-group {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
}
.color-swatches-group {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.color-swatches-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  color: var(--md-on-surface-variant);
  opacity: .6;
}
.color-swatches { display: flex; gap: 5px; }
.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(0,0,0,.12);
  cursor: pointer;
  padding: 0;
}

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
.recent-info { flex: 1; min-width: 0; }
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
.recent-date {
  color: var(--md-on-surface-variant);
  white-space: nowrap;
  flex-shrink: 0;
  margin: 0;
}
.recent-chevron { color: var(--md-outline); }

@media (min-width: 720px) {
  .action-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--sp-3);
  }

  .action-tile {
    min-height: 100px;
  }

  .dashboard-body-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-5);
  }

  .settings-details {
    margin-bottom: 0;
  }

  .settings-details:not(.settings-details--setup) .settings-summary {
    pointer-events: none;
  }

  .settings-details:not(.settings-details--setup) .settings-chevron {
    display: none;
  }

  .recent-list { gap: var(--sp-2); }
}
</style>
