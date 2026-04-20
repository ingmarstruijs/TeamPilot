<template>
  <div class="view-page">
    <div v-if="payload" class="view-content">
      <!-- Header -->
      <div class="view-header">
        <div>
          <p class="md-title-md view-lineup-name">{{ payload.lineupName || 'Opstelling' }}</p>
          <p class="md-body-sm view-meta">
            {{ payload.teamName }}
            <span v-if="payload.formationId"> · {{ payload.formationId }}</span>
          </p>
        </div>
        <button class="btn btn-filled" @click="showImportDialog = true">
          <span class="material-symbols-rounded" style="font-size:18px">download</span>
          Importeren
        </button>
      </div>

      <!-- Field (read-only) -->
      <FootballField
        :slots="displaySlots"
        :players="ghostPlayersMap"
        :team-shirt="shirtForDisplay"
        :flipped="payload.flipped"
        export-id="view-field"
      />

      <!-- Bench -->
      <div v-if="benchPlayers.length" class="view-bench">
        <p class="md-label-lg view-bench-title">
          <span class="material-symbols-rounded" style="font-size:16px;vertical-align:text-bottom">weekend</span>
          Bank
        </p>
        <div class="view-bench-list">
          <div v-for="(p, i) in benchPlayers" :key="i" class="view-bench-player">
            <ShirtAvatar :shirt="shirtForDisplay" :initials="initials(p.pn)" :size="28" />
            <span class="bp-name md-label-sm">{{ shortName(p.pn) }}</span>
            <span v-if="p.num" class="bp-num">#{{ p.num }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Invalid link -->
    <div v-else class="view-error">
      <span class="material-symbols-rounded" style="font-size:48px;color:var(--md-outline)">link_off</span>
      <p class="md-body-md">Ongeldige of verlopen link.</p>
      <RouterLink to="/" class="btn btn-tonal">Naar TeamPilot</RouterLink>
    </div>

    <!-- Import dialog -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="showImportDialog && payload" class="dialog-backdrop" @click.self="showImportDialog = false">
          <div class="dialog">
            <p class="dialog-title">Opstelling importeren</p>

            <!-- Bundle: has full team data -->
            <template v-if="payload.type === 'bundle'">
              <p class="md-body-sm" style="color:var(--md-on-surface-variant);margin-bottom:var(--sp-3)">
                <strong>{{ payload.teamName }}</strong> · {{ payload.ageGroup }} · {{ payload.players.length }} spelers
              </p>
              <template v-if="conflictTeam">
                <p class="dialog-body">
                  Er bestaat al een team <strong>{{ payload.teamName }}</strong>. Wil je de opstelling toevoegen aan dat team, of een nieuw team aanmaken?
                </p>
                <div class="dialog-actions" style="flex-wrap:wrap;gap:var(--sp-2)">
                  <button class="btn btn-text" @click="showImportDialog = false">Annuleren</button>
                  <button class="btn btn-outlined" @click="importAsNew">Nieuw team</button>
                  <button class="btn btn-filled" @click="importToExisting">Toevoegen aan {{ conflictTeam.name }}</button>
                </div>
              </template>
              <template v-else>
                <p class="dialog-body">Team en opstelling worden geïmporteerd in TeamPilot.</p>
                <div class="dialog-actions">
                  <button class="btn btn-text" @click="showImportDialog = false">Annuleren</button>
                  <button class="btn btn-filled" @click="importBundle">Importeren</button>
                </div>
              </template>
            </template>

            <!-- Lineup only: need to pick a local team -->
            <template v-else>
              <p class="md-body-sm" style="color:var(--md-on-surface-variant);margin-bottom:var(--sp-3)">
                Opstelling voor <strong>{{ payload.teamName }}</strong>. Kies een lokaal team om de opstelling aan toe te voegen.
              </p>
              <div class="team-picker">
                <button
                  v-for="team in store.teams"
                  :key="team.id"
                  class="team-pick-btn"
                  :class="{ selected: selectedTeamId === team.id }"
                  @click="selectedTeamId = team.id"
                >
                  <ShirtAvatar :shirt="team.shirt" :initials="team.name.slice(0,2).toUpperCase()" :size="24" />
                  <span>{{ team.name }}</span>
                  <span class="match-hint" v-if="matchCount(team) !== null">
                    {{ matchCount(team) }}/{{ filledSlotCount }} gematcht
                  </span>
                </button>
              </div>
              <div class="dialog-actions" style="margin-top:var(--sp-3)">
                <button class="btn btn-text" @click="showImportDialog = false">Annuleren</button>
                <button class="btn btn-filled" :disabled="!selectedTeamId" @click="importLineupOnly">Importeren</button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import { decodeSharePayload, resolveSlotsForTeam } from '@/utils/lineupShare'
import { showSnackbar } from '@/composables/useSnackbar'
import FootballField from '@/components/field/FootballField.vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const route  = useRoute()
const router = useRouter()
const store  = useTeamStore()

// ── Decode payload from ?lineup= query param ─────────────────────────────────
const payload = computed(() => {
  const raw = route.query.lineup
  if (!raw) return null
  return decodeSharePayload(String(raw))
})

// ── Display helpers ───────────────────────────────────────────────────────────

const shirtForDisplay = computed(() => {
  if (payload.value?.type === 'bundle' && payload.value.shirt) return payload.value.shirt
  return { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }
})

// Build a ghost players map (id = slot id) for read-only rendering
const ghostPlayersMap = computed(() => {
  if (!payload.value) return {}
  const map = {}
  for (const s of payload.value.slots) {
    if (s.pn) {
      map[s.sid] = { id: s.sid, name: s.pn, number: s.num ?? null, position: s.pos }
    }
  }
  return map
})

// Slots use sid as both slotId and playerId so FootballField renders them filled
const displaySlots = computed(() => {
  if (!payload.value) return []
  return payload.value.slots.map(s => ({
    slotId:   s.sid,
    position: s.pos,
    x:        s.x,
    y:        s.y,
    playerId: s.pn ? s.sid : null,
  }))
})

const benchPlayers = computed(() => payload.value?.bench ?? [])

const filledSlotCount = computed(() => payload.value?.slots.filter(s => s.pn).length ?? 0)

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function shortName(name) {
  if (!name) return ''
  const parts = name.trim().split(/\s+/)
  const first = parts[0]
  const last  = parts.length > 1 ? parts[parts.length - 1] : ''
  const display = last ? `${first} ${last[0]}.` : first
  return display.length > 14 ? display.slice(0, 13) + '…' : display
}

// ── Import dialog ─────────────────────────────────────────────────────────────
const showImportDialog = ref(false)
const selectedTeamId   = ref(null)

const conflictTeam = computed(() =>
  payload.value
    ? store.teams.find(t => t.name.trim().toLowerCase() === payload.value.teamName?.trim().toLowerCase())
    : null
)

function matchCount(team) {
  if (!payload.value) return null
  const slots = payload.value.slots.filter(s => s.pn)
  const resolved = resolveSlotsForTeam(slots, team.players)
  return resolved.filter(s => s.playerId).length
}

// Bundle: import team + lineup as new
function importBundle() {
  const p = payload.value
  const team = store.importTeam({ name: p.teamName, ageGroup: p.ageGroup, shirt: p.shirt, players: p.players })
  _saveLineupToTeam(team)
  showSnackbar(`Team & opstelling geïmporteerd ✓`)
  showImportDialog.value = false
  router.replace('/')
}

// Bundle: team name conflict → create new team copy
function importAsNew() {
  const p = payload.value
  const team = store.importTeam({ name: p.teamName + ' (2)', ageGroup: p.ageGroup, shirt: p.shirt, players: p.players })
  _saveLineupToTeam(team)
  showSnackbar(`Team & opstelling geïmporteerd ✓`)
  showImportDialog.value = false
  router.replace('/')
}

// Bundle: team name conflict → add lineup to existing team, match players by name
function importToExisting() {
  const p  = payload.value
  const team = conflictTeam.value
  // Add any missing players
  store.mergeTeam(team.id, { players: p.players })
  // Re-fetch team after merge so new IDs are available
  const freshTeam = store.teams.find(t => t.id === team.id)
  _saveLineupToTeam(freshTeam)
  showSnackbar(`Opstelling toegevoegd aan "${team.name}" ✓`)
  showImportDialog.value = false
  router.replace('/')
}

// Lineup-only: match against selected local team
function importLineupOnly() {
  const team = store.teams.find(t => t.id === selectedTeamId.value)
  if (!team) return
  _saveLineupToTeam(team)
  showSnackbar(`Opstelling toegevoegd aan "${team.name}" ✓`)
  showImportDialog.value = false
  router.replace('/')
}

function _saveLineupToTeam(team) {
  const p     = payload.value
  const slots = resolveSlotsForTeam(p.slots, team.players)
  store.setActiveTeam(team.id)
  const saved = store.saveLineup({
    teamId:      team.id,
    name:        p.lineupName || 'Geïmporteerde opstelling',
    formationId: p.formationId ?? null,
    flipped:     p.flipped ?? true,
    slots,
  })
  store.setActiveLineup(saved.id)
  router.replace(`/lineup/${saved.id}`)
}
</script>

<style scoped>
.view-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--sp-4);
  gap: var(--sp-4);
  min-height: 0;
  flex: 1;
}

.view-content {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  width: 100%;
  max-width: 480px;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.view-lineup-name { margin: 0; }
.view-meta { color: var(--md-on-surface-variant); margin: 2px 0 0; }

.view-bench {
  background: var(--md-surface-variant);
  border-radius: var(--md-shape-md);
  padding: var(--sp-3);
}
.view-bench-title {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-bottom: var(--sp-2);
}
.view-bench-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.view-bench-player {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  background: var(--md-surface);
  border-radius: var(--md-shape-full);
  padding: 4px 10px 4px 4px;
}
.bp-num { color: var(--md-outline); font-size: 11px; }

.view-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-8);
  color: var(--md-on-surface-variant);
}

/* Team picker */
.team-picker {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.team-pick-btn {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  background: var(--md-surface);
  cursor: pointer;
  text-align: left;
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
}
.team-pick-btn:hover {
  background: color-mix(in srgb, var(--md-on-surface) 6%, var(--md-surface));
}
.team-pick-btn.selected {
  border-color: var(--md-primary);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}
.match-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--md-outline);
}
.team-pick-btn.selected .match-hint {
  color: var(--md-on-primary-container);
  opacity: .75;
}
</style>
