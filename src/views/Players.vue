<template>
  <div class="page players-page">
    <div class="players-header-shell">
      <div class="players-header">
        <div class="players-header-text">
          <h1 class="players-title md-title-sm">{{ t('players.title') }}</h1>
          <p class="md-label-sm players-meta">
            {{ t('players.count', { count: regularCount, playerWord: regularCount === 1 ? t('word.player') : t('word.players') }) }}
            <span v-if="ageGroupConfig"> {{ t('players.min', { min: ageGroupConfig.players }) }}</span>
          </p>
        </div>
        <div class="header-btns">
          <button
            class="btn btn-outlined"
            @click="copyRoster"
            :disabled="!players.length"
            :title="t('players.copyTitle')"
          >
            <span class="material-symbols-rounded" style="font-size:18px">content_copy</span>
            <span class="btn-lbl">{{ t('common.copy') }}</span>
          </button>
          <button
            v-if="missingCount > 0"
            class="btn btn-tonal"
            @click="openQuickFill"
            :title="t('players.quickFillTitle', { count: missingCount, playerWord: missingCount === 1 ? t('word.player') : t('word.players') })"
          >
            <span class="material-symbols-rounded" style="font-size:18px">bolt</span>
            <span class="btn-lbl">{{ t('players.quickFill') }}</span>
          </button>
          <button class="btn btn-filled" @click="openAdd" :title="t('players.addPlayer')">
            <span class="material-symbols-rounded" style="font-size:18px">add</span>
            <span class="btn-lbl">{{ t('common.add') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!players.length" class="empty-state">
      <span class="material-symbols-rounded empty-icon">group_off</span>
      <p class="md-title-md">{{ t('players.emptyTitle') }}</p>
      <p class="md-body-md">{{ t('players.emptyBody') }}</p>
      <div class="flex gap-3 mt-3" style="flex-wrap:wrap;justify-content:center">
        <button class="btn btn-tonal" @click="openQuickFill">
          <span class="material-symbols-rounded" style="font-size:18px">bolt</span>
          {{ t('players.quickFill') }}
        </button>
        <button class="btn btn-filled" @click="openAdd">{{ t('players.addPlayer') }}</button>
      </div>
    </div>

    <!-- Player list -->
    <ul v-if="mainPlayers.length" class="player-list">
      <li
        v-for="player in mainPlayers"
        :key="player.id"
        class="player-row card"
        :class="{ 'is-unavailable': !isPlayerAvailable(player), 'is-guest': isGuest(player) }"
      >
        <PlayerAvatar :player="player" :shirt="activeTeam?.shirt" size="md" />
        <div class="player-details">
          <span class="player-name-row">
            <span class="md-title-sm">{{ player.name }}</span>
            <span v-if="isGuest(player)" class="player-badge is-guest">
              <span class="material-symbols-rounded" aria-hidden="true">swap_horiz</span>
              {{ t('players.guest') }}
            </span>
            <span v-if="player.injured" class="player-badge is-injury">{{ t('players.injured') }}</span>
          </span>
          <span class="md-body-sm player-meta">
            {{ positionLabel(player.position) }}
            <template v-if="player.number != null"> · #{{ player.number }}</template>
            <template v-if="player.preferredFoot"> · {{ t(`players.footShort.${player.preferredFoot}`) }}</template>
          </span>
        </div>
        <div class="player-actions">
          <button
            type="button"
            class="btn-icon avail-btn"
            :class="{ on: isPlayerAvailable(player) }"
            :disabled="player.injured"
            :aria-pressed="isPlayerAvailable(player)"
            :title="availabilityTitle(player)"
            :aria-label="availabilityTitle(player)"
            @click="toggleAvailable(player)"
          >
            <span class="material-symbols-rounded">{{ player.injured ? 'personal_injury' : (isPlayerAvailable(player) ? 'check_circle' : 'cancel') }}</span>
          </button>
          <button class="btn-icon" @click="openEdit(player)" :aria-label="t('savedTraining.edit')">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="btn-icon" @click="confirmDelete(player)" :aria-label="t('common.delete')"
            style="color:var(--md-error)">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </li>
    </ul>

    <section v-if="quietGuests.length" class="guest-section">
      <button type="button" class="guest-section-toggle" @click="showQuietGuests = !showQuietGuests">
        <span class="material-symbols-rounded">{{ showQuietGuests ? 'expand_less' : 'expand_more' }}</span>
        {{ t('players.guestsCount', { count: quietGuests.length }) }}
      </button>
      <ul v-if="showQuietGuests" class="player-list guest-list">
        <li
          v-for="player in quietGuests"
          :key="player.id"
          class="player-row card is-guest is-quiet"
        >
          <PlayerAvatar :player="player" :shirt="activeTeam?.shirt" size="md" />
          <div class="player-details">
            <span class="player-name-row">
              <span class="md-title-sm">{{ player.name }}</span>
              <span class="player-badge is-guest">
                <span class="material-symbols-rounded" aria-hidden="true">swap_horiz</span>
                {{ t('players.guest') }}
              </span>
            </span>
            <span class="md-body-sm player-meta">{{ positionLabel(player.position) }}</span>
            <div class="guest-row-actions">
              <button type="button" class="btn btn-text guest-action" @click="bringGuest(player)">
                {{ t('players.bringNextMatch') }}
              </button>
              <button type="button" class="btn btn-text guest-action" @click="promoteGuest(player)">
                {{ t('players.promote') }}
              </button>
            </div>
          </div>
          <div class="player-actions">
            <button class="btn-icon" @click="confirmDelete(player)" :aria-label="t('common.delete')"
              style="color:var(--md-error)">
              <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
        </li>
      </ul>
    </section>

    <PlayerFormDialog
      :open="showDialog"
      :title="editingPlayer ? t('players.editPlayer') : t('players.addPlayer')"
      :submit-label="editingPlayer ? t('common.save') : t('common.add')"
      :player="editingPlayer"
      :shirt="activeTeam?.shirt"
      @close="closeDialog"
      @save="savePlayer"
    />

    <!-- Delete confirm -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="dialog-backdrop" @click.self="deleteTarget = null">
        <div class="dialog">
          <p class="dialog-title">{{ t('players.deleteTitle') }}</p>
          <p class="dialog-body">
            {{ t('players.deleteBody', { name: deleteTarget.name }) }}
          </p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="deleteTarget = null">{{ t('common.cancel') }}</button>
            <button class="btn btn-filled" style="background:var(--md-error)" @click="doDelete">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Quick-fill dialog -->
    <Transition name="fade">
      <div v-if="showQuickFill" class="dialog-backdrop" @click.self="showQuickFill = false">
        <div class="dialog qf-dialog">
          <div class="qf-dialog-head">
            <p class="dialog-title">
              <span class="material-symbols-rounded" style="font-size:22px;vertical-align:text-bottom;margin-right:6px">bolt</span>
              {{ t('players.quickFill') }}
            </p>
            <button
              type="button"
              class="btn-icon"
              :aria-label="t('common.close')"
              @click="showQuickFill = false"
            >
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <p class="dialog-body">{{ t('players.quickFillBody') }}</p>

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

              <button
                type="button"
                class="qf-foot"
                :title="t('players.foot')"
                :aria-label="t('players.foot')"
                @click="cycleQuickFoot(i)"
              >{{ t(`players.footShort.${p.preferredFoot || 'both'}`) }}</button>

              <!-- Editable name -->
              <input
                class="qf-name-input"
                v-model="quickPlayers[i].name"
                :placeholder="t('players.namePlaceholder')"
                maxlength="40"
              />

              <!-- Number -->
              <input
                class="qf-num-input"
                type="number"
                v-model.number="quickPlayers[i].number"
                min="1" max="99"
                :title="t('players.number')"
              />
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-outlined" @click="reshufflePlayers" :title="t('players.reshuffleTitle')">
              <span class="material-symbols-rounded" style="font-size:16px">shuffle</span>
              {{ t('players.reshuffle') }}
            </button>
            <button class="btn btn-filled" @click="confirmQuickFill">
              <span class="material-symbols-rounded" style="font-size:16px">group_add</span>
              {{ t('common.add') }}
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
import { POSITIONS } from '@/data/formations'
import PlayerAvatar from '@/components/ui/PlayerAvatar.vue'
import PlayerFormDialog from '@/components/players/PlayerFormDialog.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { generatePlayers } from '@/utils/generatePlayers'
import { t } from '@/i18n'
import {
  isGuest,
  isAvailable as isPlayerAvailable,
  mainListPlayers,
  quietGuestPlayers,
  regularPlayers,
  PREFERRED_FEET,
} from '@/utils/playerStatus'

const store = useTeamStore()
const activeTeam     = computed(() => store.activeTeam)
const ageGroupConfig = computed(() => store.ageGroupConfig)
const players        = computed(() => activeTeam.value?.players ?? [])
const mainPlayers    = computed(() => mainListPlayers(players.value))
const quietGuests    = computed(() => quietGuestPlayers(players.value))
const regularCount   = computed(() => regularPlayers(players.value).length)
const showQuietGuests = ref(false)

// How many regulars are still needed to fill the team
const missingCount = computed(() => {
  const max = ageGroupConfig.value?.players ?? 0
  return Math.max(0, max - regularCount.value)
})

// ── Dialog state ─────────────────────────────────────────────
const showDialog = ref(false)
const editingPlayer = ref(null)

function positionLabel(id) {
  return POSITIONS.find(p => p.id === id)?.label ?? id
}

function availabilityTitle(player) {
  if (player.injured) return t('players.injuredLong')
  return isPlayerAvailable(player) ? t('players.available') : t('players.unavailable')
}

function toggleAvailable(player) {
  if (player.injured) return
  store.updatePlayer(player.id, { available: !isPlayerAvailable(player) })
}

function bringGuest(player) {
  store.activateGuest(player.id)
  showSnackbar(t('players.broughtNext', { name: player.name }))
}

function promoteGuest(player) {
  store.promoteGuest(player.id)
  showSnackbar(t('players.promoted', { name: player.name }))
}

function openAdd() {
  editingPlayer.value = null
  showDialog.value = true
}

function openEdit(player) {
  editingPlayer.value = player
  showDialog.value = true
}

function closeDialog() {
  showDialog.value = false
  editingPlayer.value = null
}

function savePlayer(payload) {
  if (editingPlayer.value) {
    store.updatePlayer(editingPlayer.value.id, {
      ...payload,
      guestQuiet: payload.guest ? Boolean(editingPlayer.value.guestQuiet) : false,
    })
    showSnackbar(t('players.updated'))
  } else {
    store.addPlayer({
      ...payload,
      guestQuiet: false,
    })
    showSnackbar(t('players.addedSnackbar'))
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
  showSnackbar(t('players.deletedSnackbar', { name: deleteTarget.value.name }))
  deleteTarget.value = null
}

// ── Copy roster ──────────────────────────────────────────
function copyRoster() {
  if (!players.value.length) return
  const posOrder = ['GK', 'DEF', 'WB', 'MID', 'ATT']
  const header = `⚽ ${activeTeam.value?.name} – ${ageGroupConfig.value?.label ?? activeTeam.value?.ageGroup}`
  const lines = [...players.value]
    .sort((a, b) => posOrder.indexOf(a.position) - posOrder.indexOf(b.position))
    .map(p => {
      const num = p.number != null ? `#${p.number}` : ''
      return `${p.position.padEnd(3)}  ${num.padEnd(4)}  ${p.name}`
    })
  navigator.clipboard.writeText(header + '\n\n' + lines.join('\n'))
    .then(() => showSnackbar(t('players.copied')))
    .catch(() => showSnackbar(t('share.copyFailed')))
}

// ── Quick fill ────────────────────────────────────────────
const showQuickFill = ref(false)
const quickPlayers  = ref([])

function openQuickFill() {
  const count = missingCount.value
  if (!count) return
  quickPlayers.value = generatePlayers(count, players.value)
  showQuickFill.value = true
}

function reshufflePlayers() {
  quickPlayers.value = generatePlayers(quickPlayers.value.length, players.value)
}

function cycleQuickFoot(index) {
  const player = quickPlayers.value[index]
  if (!player) return
  const current = PREFERRED_FEET.indexOf(player.preferredFoot)
  player.preferredFoot = PREFERRED_FEET[(current + 1) % PREFERRED_FEET.length]
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
    store.addPlayer({
      name,
      number: p.number || null,
      position: p.position,
      preferredFoot: p.preferredFoot ?? null,
      injured: Boolean(p.injured),
      available: p.available !== false,
      guest: false,
      guestQuiet: false,
    })
    added++
  }
  showQuickFill.value = false
  showSnackbar(t('players.quickFillDone', {
    count: added,
    playerWord: added === 1 ? t('word.player') : t('word.players'),
  }))
}
</script>

<style scoped>
.players-page {
  padding-left: var(--sp-3);
  padding-right: var(--sp-3);
}

.players-header-shell {
  flex-shrink: 0;
  margin-bottom: var(--sp-4);
}

.players-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}

.players-header-text {
  min-width: 0;
  flex: 1;
}

.players-title {
  margin: 0;
  line-height: 1.3;
}

.players-meta {
  margin: 2px 0 0;
  color: var(--md-on-surface-variant);
}

.header-btns {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-shrink: 0;
}

@media (max-width: 899px) {
  .players-page {
    padding-top: 0;
  }

  .players-header-shell {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: calc(-1 * var(--sp-3)) calc(-1 * var(--sp-3)) 0;
    padding: var(--sp-3) var(--sp-3);
    background: var(--md-surface);
    border-bottom: 1px solid var(--md-outline-variant);
    box-shadow: var(--sticky-header-shadow);
  }

  .players-header {
    min-height: 48px;
  }

  .players-title {
    font-size: 1rem;
    font-weight: 600;
    line-height: 1.3;
  }

  .players-meta {
    font-size: 12px;
    margin-top: 4px;
  }

  .player-list,
  .empty-state {
    margin-top: var(--sp-5);
  }
}

@media (min-width: 900px) {
  .players-header-shell {
    margin-bottom: var(--sp-6);
  }

  .players-title {
    font-size: inherit;
    font-weight: inherit;
  }

  .players-title.md-title-sm {
    font-size: var(--md-headline-sm-size, 1.5rem);
    line-height: 1.2;
  }
}

@media (max-width: 719px) {
  .header-btns .btn-lbl {
    display: none;
  }

  .header-btns .btn {
    padding: var(--sp-2);
    min-width: 36px;
    justify-content: center;
  }
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

.player-name-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  min-width: 0;
}

.player-name-row .md-title-sm {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.player-meta {
  color: var(--md-on-surface-variant);
}

.player-badge {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .3px;
  padding: 2px 6px;
  border-radius: var(--md-shape-full);
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

.player-badge .material-symbols-rounded {
  font-size: 12px;
}

.player-badge.is-guest {
  background: var(--md-tertiary-container);
  color: var(--md-on-tertiary-container);
}

.player-badge.is-injury {
  background: color-mix(in srgb, var(--md-error) 16%, transparent);
  color: var(--md-error);
}

.player-row.is-guest {
  background: color-mix(in srgb, var(--md-tertiary) 12%, var(--md-surface));
  box-shadow: inset 3px 0 0 var(--md-tertiary);
}

.player-row.is-unavailable {
  opacity: 0.72;
}

.player-row.is-quiet {
  opacity: 0.64;
}

.player-row.is-quiet:not(.is-guest) {
  background: color-mix(in srgb, var(--md-on-surface) 4%, var(--md-surface));
}

.avail-btn.on {
  color: var(--md-primary);
}

.avail-btn:disabled {
  opacity: 0.45;
}

.guest-section {
  margin-top: var(--sp-5);
}

.guest-section-toggle {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  width: 100%;
  padding: var(--sp-2) 0;
  background: transparent;
  border: none;
  color: var(--md-on-surface-variant);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.guest-list {
  margin-top: var(--sp-2);
}

.guest-row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-1);
  margin-top: 2px;
}

.guest-action {
  padding: 0;
  min-height: auto;
  font-size: 12px;
}

/* Quick-fill dialog */
.qf-dialog {
  max-width: 520px;
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
}
.qf-dialog-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-3);
}
.qf-dialog-head .dialog-title {
  margin-bottom: 0;
  min-width: 0;
}
.qf-dialog-head .btn-icon {
  flex-shrink: 0;
  margin: -6px -8px 0 0;
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
.qf-foot {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: var(--md-shape-full);
  letter-spacing: .4px;
  min-width: 32px;
  text-align: center;
  flex-shrink: 0;
  border: 1px solid var(--md-outline-variant);
  background: var(--md-surface);
  color: var(--md-on-surface);
  cursor: pointer;
  font-family: inherit;
  line-height: 1.2;
}
.qf-foot:hover {
  border-color: var(--md-primary);
  color: var(--md-primary);
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
