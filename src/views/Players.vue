<template>
  <div class="page">
    <!-- Header -->
    <div class="players-header">
      <div>
        <h1 class="md-headline-sm">Spelerslijst</h1>
        <p class="md-body-md" style="color:var(--md-on-surface-variant)">
          {{ activeTeam?.name }} · {{ players.length }} speler{{ players.length !== 1 ? 's' : '' }}
          <span v-if="ageGroupConfig" style="opacity:.7">
            (max {{ ageGroupConfig.players }})
          </span>
        </p>
      </div>
      <div class="header-btns">
        <button
          v-if="missingCount > 0"
          class="btn btn-tonal"
          @click="openQuickFill"
          :title="`Vul ${missingCount} speler${missingCount !== 1 ? 's' : ''} aan met standaardnamen`"
        >
          <span class="material-symbols-rounded" style="font-size:18px">bolt</span>
          Snel aanvullen
        </button>
        <button class="btn btn-filled" @click="openAdd">
          <span class="material-symbols-rounded" style="font-size:18px">add</span>
          Toevoegen
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!players.length" class="empty-state">
      <span class="material-symbols-rounded empty-icon">group_off</span>
      <p class="md-title-md">Nog geen spelers</p>
      <p class="md-body-md">Voeg je eerste speler toe of vul het team in één klik aan.</p>
      <div class="flex gap-3 mt-3" style="flex-wrap:wrap;justify-content:center">
        <button class="btn btn-tonal" @click="openQuickFill">
          <span class="material-symbols-rounded" style="font-size:18px">bolt</span>
          Snel aanvullen
        </button>
        <button class="btn btn-filled" @click="openAdd">Speler toevoegen</button>
      </div>
    </div>

    <!-- Player list -->
    <ul v-else class="player-list">
      <li
        v-for="player in players"
        :key="player.id"
        class="player-row card"
      >
        <PlayerAvatar :player="player" :color="activeTeam?.color" size="md" />
        <div class="player-details">
          <span class="md-title-sm">{{ player.name }}</span>
          <span class="md-body-sm" style="color:var(--md-on-surface-variant)">
            {{ positionLabel(player.position) }}
            <template v-if="player.number != null"> · #{{ player.number }}</template>
          </span>
        </div>
        <div class="player-actions">
          <button class="btn-icon" @click="openEdit(player)" aria-label="Bewerken">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn-icon" @click="confirmDelete(player)" aria-label="Verwijderen"
            style="color:var(--md-error)">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </li>
    </ul>

    <!-- Add/Edit dialog -->
    <Transition name="fade">
      <div v-if="showDialog" class="dialog-backdrop" @click.self="closeDialog">
        <div class="dialog" role="dialog" :aria-label="editingId ? 'Speler bewerken' : 'Speler toevoegen'">
          <p class="dialog-title">{{ editingId ? 'Speler bewerken' : 'Speler toevoegen' }}</p>

          <div class="form-grid">
            <div class="field-wrap" style="grid-column: 1/-1">
              <label class="field-label" for="f-name">Naam *</label>
              <input id="f-name" class="field" v-model.trim="form.name"
                placeholder="Voornaam Achternaam" maxlength="40" autofocus />
            </div>
            <div class="field-wrap">
              <label class="field-label" for="f-num">Rugnummer</label>
              <input id="f-num" class="field" v-model.number="form.number"
                type="number" min="1" max="99" placeholder="–" />
            </div>
            <div class="field-wrap">
              <label class="field-label" for="f-pos">Positie</label>
              <select id="f-pos" class="field field-select" v-model="form.position">
                <option v-for="p in POSITIONS" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </div>
          </div>

          <!-- Preview -->
          <div class="avatar-preview">
            <PlayerAvatar :player="formAsPlayer" :color="activeTeam?.color" size="lg" />
            <span class="md-label-md" style="color:var(--md-on-surface-variant)">Voorbeeld</span>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-text" @click="closeDialog">Annuleren</button>
            <button class="btn btn-filled" :disabled="!form.name" @click="savePlayer">
              {{ editingId ? 'Opslaan' : 'Toevoegen' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete confirm -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="dialog-backdrop" @click.self="deleteTarget = null">
        <div class="dialog">
          <p class="dialog-title">Speler verwijderen?</p>
          <p class="dialog-body">
            <strong>{{ deleteTarget.name }}</strong> wordt permanent verwijderd uit het team.
          </p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="deleteTarget = null">Annuleren</button>
            <button class="btn btn-filled" style="background:var(--md-error)" @click="doDelete">Verwijderen</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Quick-fill dialog -->
    <Transition name="fade">
      <div v-if="showQuickFill" class="dialog-backdrop" @click.self="showQuickFill = false">
        <div class="dialog qf-dialog">
          <p class="dialog-title">
            <span class="material-symbols-rounded" style="font-size:22px;vertical-align:text-bottom;margin-right:6px">bolt</span>
            Snel aanvullen
          </p>
          <p class="dialog-body">
            Pas de namen aan en klik op <strong>Toevoegen</strong>.
            Posities en rugnummers zijn al ingevuld.
          </p>

          <div class="qf-list">
            <div
              v-for="(p, i) in quickPlayers"
              :key="i"
              class="qf-row"
            >
              <!-- Avatar preview -->
              <div class="qf-avatar" :style="{ background: activeTeam?.color }">
                {{ qfInitials(p.name) }}
              </div>

              <!-- Position badge -->
              <span class="qf-pos-badge" :class="'pos-' + p.position">{{ p.position }}</span>

              <!-- Editable name -->
              <input
                class="qf-name-input"
                v-model="quickPlayers[i].name"
                :placeholder="`Speler ${i+1}`"
                maxlength="40"
              />

              <!-- Number -->
              <input
                class="qf-num-input"
                type="number"
                v-model.number="quickPlayers[i].number"
                min="1" max="99"
                title="Rugnummer"
              />
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-text" @click="showQuickFill = false">Annuleren</button>
            <button class="btn btn-outlined" @click="reshufflePlayers" title="Nieuwe namen genereren">
              <span class="material-symbols-rounded" style="font-size:16px">shuffle</span>
              Nieuwe namen
            </button>
            <button class="btn btn-filled" @click="confirmQuickFill">
              <span class="material-symbols-rounded" style="font-size:16px">group_add</span>
              Toevoegen
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { POSITIONS } from '@/data/formations'
import PlayerAvatar from '@/components/ui/PlayerAvatar.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { generatePlayers } from '@/utils/generatePlayers'

const store = useTeamStore()
const activeTeam     = computed(() => store.activeTeam)
const ageGroupConfig = computed(() => store.ageGroupConfig)
const players        = computed(() => activeTeam.value?.players ?? [])

// How many players are still needed to fill the team
const missingCount = computed(() => {
  const max = ageGroupConfig.value?.players ?? 0
  return Math.max(0, max - players.value.length)
})

// ── Dialog state ─────────────────────────────────────────────
const showDialog = ref(false)
const editingId  = ref(null)
const form = reactive({ name: '', number: null, position: 'MID' })

const formAsPlayer = computed(() => ({
  name:   form.name || 'Naam',
  number: form.number || null,
}))

function positionLabel(id) {
  return POSITIONS.find(p => p.id === id)?.label ?? id
}

function openAdd() {
  form.name     = ''
  form.number   = null
  form.position = 'MID'
  editingId.value = null
  showDialog.value = true
}

function openEdit(player) {
  form.name     = player.name
  form.number   = player.number
  form.position = player.position
  editingId.value = player.id
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingId.value  = null
}

function savePlayer() {
  if (!form.name) return
  if (editingId.value) {
    store.updatePlayer(editingId.value, {
      name: form.name,
      number: form.number || null,
      position: form.position,
    })
    showSnackbar('Speler bijgewerkt')
  } else {
    store.addPlayer({
      name: form.name,
      number: form.number || null,
      position: form.position,
    })
    showSnackbar('Speler toegevoegd')
  }
  closeDialog()
}

// ── Delete ────────────────────────────────────────────────────
const deleteTarget = ref(null)

function confirmDelete(player) {
  deleteTarget.value = player
}

function doDelete() {
  store.removePlayer(deleteTarget.value.id)
  showSnackbar(`${deleteTarget.value.name} verwijderd`)
  deleteTarget.value = null
}

// ── Quick fill ────────────────────────────────────────────
const showQuickFill = ref(false)
const quickPlayers  = ref([])

function openQuickFill() {
  const count = missingCount.value
  if (!count) return
  quickPlayers.value = generatePlayers(count, players.value.length)
  showQuickFill.value = true
}

function reshufflePlayers() {
  quickPlayers.value = generatePlayers(quickPlayers.value.length, players.value.length)
}

function qfInitials(name) {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function confirmQuickFill() {
  let added = 0
  for (const p of quickPlayers.value) {
    const name = p.name?.trim()
    if (!name) continue
    store.addPlayer({ name, number: p.number || null, position: p.position })
    added++
  }
  showQuickFill.value = false
  showSnackbar(`${added} speler${added !== 1 ? 's' : ''} toegevoegd ✓`)
}
</script>

<style scoped>
.players-header {
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

.player-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
.player-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3) var(--sp-4);
}
.player-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.player-details .md-title-sm {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.player-actions {
  display: flex;
  gap: var(--sp-1);
  flex-shrink: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}

/* Header buttons group */
.header-btns {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Quick-fill dialog */
.qf-dialog {
  max-width: 520px;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
}
.qf-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
  padding-right: 2px;
}
.qf-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  background: var(--md-surface-variant);
  border-radius: var(--md-shape-sm);
  padding: var(--sp-2) var(--sp-3);
}
.qf-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}
.qf-pos-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--md-shape-full);
  letter-spacing: .4px;
  min-width: 32px;
  text-align: center;
  flex-shrink: 0;
}
.pos-GK  { background: #f59e0b22; color: #92400e; border: 1px solid #f59e0b55; }
.pos-DEF { background: #3b82f622; color: #1e40af; border: 1px solid #3b82f655; }
.pos-MID { background: #22c55e22; color: #14532d; border: 1px solid #22c55e55; }
.pos-ATT { background: #ef444422; color: #7f1d1d; border: 1px solid #ef444455; }
.pos-WB  { background: #8b5cf622; color: #4c1d95; border: 1px solid #8b5cf655; }

.qf-name-input {
  flex: 1;
  height: 36px;
  padding: 0 var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-xs);
  background: var(--md-surface);
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  color: var(--md-on-surface);
  outline: none;
  min-width: 0;
}
.qf-name-input:focus {
  border-color: var(--md-primary);
  border-width: 2px;
}
.qf-num-input {
  width: 52px;
  height: 36px;
  padding: 0 var(--sp-1);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-xs);
  background: var(--md-surface);
  font-family: 'Roboto', sans-serif;
  font-size: 14px;
  color: var(--md-on-surface);
  outline: none;
  text-align: center;
  flex-shrink: 0;
}
.qf-num-input:focus {
  border-color: var(--md-primary);
  border-width: 2px;
}
</style>
