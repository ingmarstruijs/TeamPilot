<template>
  <div class="page">
    <div class="lineups-header">
      <div>
        <h1 class="md-headline-sm">Opstellingen</h1>
        <p class="md-body-md" style="color:var(--md-on-surface-variant)">
          {{ teamLineups.length }} opgeslagen opstelling{{ teamLineups.length !== 1 ? 'en' : '' }}
        </p>
      </div>
      <RouterLink to="/lineup/new" class="btn btn-filled">
        <span class="material-symbols-rounded" style="font-size:18px">add</span>
        Nieuw
      </RouterLink>
    </div>

    <!-- Empty state -->
    <div v-if="!teamLineups.length" class="empty-state">
      <span class="material-symbols-rounded empty-icon">folder_open</span>
      <p class="md-title-md">Geen opgeslagen opstellingen</p>
      <p class="md-body-md">Maak een opstelling en sla hem op.</p>
      <RouterLink to="/lineup/new" class="btn btn-filled mt-3">Opstelling maken</RouterLink>
    </div>

    <!-- Lineup cards -->
    <div v-else class="lineup-grid">
      <div
        v-for="lineup in sortedLineups"
        :key="lineup.id"
        class="lineup-card card card-elevated"
      >
        <!-- Mini field preview -->
        <div class="mini-field" :style="{ '--fc': activeTeam?.color }">
          <svg class="mini-markings" viewBox="0 0 100 160" preserveAspectRatio="none">
            <rect x="0" y="0" width="100" height="160" fill="none"/>
            <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(255,255,255,.4)" stroke-width="1"/>
            <circle cx="50" cy="80" r="15" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>
            <rect x="2" y="2" width="96" height="156" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="1"/>
            <rect x="22" y="2"  width="56" height="22" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
            <rect x="22" y="136" width="56" height="22" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="1"/>
          </svg>
          <!-- Player dots -->
          <div
            v-for="slot in lineup.slots.filter(s => s.playerId)"
            :key="slot.slotId"
            class="mini-dot"
            :style="{ left: slot.x + '%', top: slot.y + '%', background: activeTeam?.color }"
            :title="playerName(slot.playerId)"
          ></div>
        </div>

        <div class="lineup-info">
          <p class="md-title-sm lineup-name">{{ lineup.name }}</p>
          <p class="md-body-sm" style="color:var(--md-on-surface-variant)">
            {{ lineup.slots.filter(s=>s.playerId).length }} spelers
            <template v-if="lineup.formationId"> · {{ lineup.formationId }}</template>
          </p>
          <p class="md-label-sm date-label">{{ formatDate(lineup.updatedAt) }}</p>
        </div>

        <div class="lineup-actions">
          <RouterLink
            :to="`/lineup/${lineup.id}`"
            class="btn btn-tonal"
          >
            <span class="material-symbols-rounded" style="font-size:16px">edit</span>
            Bewerken
          </RouterLink>
          <button class="btn-icon" @click="confirmDelete(lineup)"
            style="color:var(--md-error)" aria-label="Verwijderen">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Delete confirm -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="dialog-backdrop" @click.self="deleteTarget=null">
        <div class="dialog">
          <p class="dialog-title">Opstelling verwijderen?</p>
          <p class="dialog-body">
            <strong>{{ deleteTarget.name }}</strong> wordt permanent verwijderd.
          </p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="deleteTarget=null">Annuleren</button>
            <button class="btn btn-filled" style="background:var(--md-error)" @click="doDelete">
              Verwijderen
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { showSnackbar } from '@/composables/useSnackbar'

const store = useTeamStore()
const activeTeam   = computed(() => store.activeTeam)
const teamLineups  = computed(() => store.teamLineups)

const sortedLineups = computed(() =>
  [...teamLineups.value].sort((a, b) => b.updatedAt - a.updatedAt)
)

const playersMap = computed(() => {
  const map = {}
  for (const p of (activeTeam.value?.players ?? [])) map[p.id] = p
  return map
})

function playerName(id) {
  return playersMap.value[id]?.name ?? '?'
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const deleteTarget = ref(null)

function confirmDelete(lineup) {
  deleteTarget.value = lineup
}
function doDelete() {
  store.deleteLineup(deleteTarget.value.id)
  showSnackbar('Opstelling verwijderd')
  deleteTarget.value = null
}
</script>

<style scoped>
.lineups-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-3);
  margin-bottom: var(--sp-5);
  flex-wrap: wrap;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sp-3);
  padding: var(--sp-8) var(--sp-4);
  color: var(--md-on-surface-variant);
}
.empty-icon { font-size: 64px; opacity: .4; }

.lineup-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--sp-3);
}
.lineup-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.mini-field {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 4;
  background: color-mix(in srgb, var(--fc, #1a6b3c) 85%, #2d5a1b);
  overflow: hidden;
}
.mini-markings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.mini-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  border: 1.5px solid rgba(255,255,255,.7);
  box-shadow: 0 1px 3px rgba(0,0,0,.4);
}
.lineup-info {
  padding: var(--sp-3) var(--sp-4) var(--sp-2);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lineup-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.date-label { color: var(--md-outline); margin-top: 2px; }
.lineup-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-2) var(--sp-4) var(--sp-3);
}
</style>
