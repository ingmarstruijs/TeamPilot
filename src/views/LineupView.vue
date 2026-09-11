<template>
  <div class="view-page">
    <div v-if="payload" class="view-content">
      <div class="view-header">
        <div>
          <p class="md-title-md view-lineup-name">{{ headerTitle }}</p>
          <p class="md-body-sm view-meta">{{ headerMeta }}</p>
        </div>
        <button class="btn btn-filled" @click="showImportDialog = true">
          <span class="material-symbols-rounded" style="font-size:18px">download</span>
          {{ t('lineupShare.import') }}
        </button>
      </div>

      <ShareImportSummary v-bind="importSummary" />
    </div>

    <div v-else class="view-error">
      <span class="material-symbols-rounded" style="font-size:48px;color:var(--md-outline)">link_off</span>
      <p class="md-body-md">{{ t('lineupShare.invalidLink') }}</p>
      <RouterLink to="/" class="btn btn-tonal">{{ t('trainingShare.toApp') }}</RouterLink>
    </div>

    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="showImportDialog && payload" class="dialog-backdrop" @click.self="showImportDialog = false">
          <div class="dialog">
            <p class="dialog-title">{{ t('lineupShare.importTitle') }}</p>

            <template v-if="payload.type === 'bundle'">
              <p class="md-body-sm import-hint">
                {{ t('lineupShare.bundleBody') }}
              </p>
              <template v-if="conflictTeam">
                <p class="dialog-body">{{ t('lineupShare.conflictBody', { team: payload.teamName }) }}</p>
                <div class="dialog-actions" style="flex-wrap:wrap;gap:var(--sp-2)">
                  <button class="btn btn-text" @click="showImportDialog = false">{{ t('common.cancel') }}</button>
                  <button class="btn btn-outlined" @click="importAsNew">{{ t('lineupShare.newTeam') }}</button>
                  <button class="btn btn-filled" @click="importToExisting">{{ t('lineupShare.addToTeam', { name: conflictTeam.name }) }}</button>
                </div>
              </template>
              <template v-else>
                <div class="dialog-actions">
                  <button class="btn btn-text" @click="showImportDialog = false">{{ t('common.cancel') }}</button>
                  <button class="btn btn-filled" @click="importBundle">{{ t('lineupShare.import') }}</button>
                </div>
              </template>
            </template>

            <template v-else>
              <p class="md-body-sm import-hint">
                {{ t('lineupShare.lineupOnlyBody', { team: payload.teamName }) }}
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
                    {{ t('lineupShare.matched', { matched: matchCount(team), total: filledSlotCount }) }}
                  </span>
                </button>
              </div>
              <div class="dialog-actions" style="margin-top:var(--sp-3)">
                <button class="btn btn-text" @click="showImportDialog = false">{{ t('common.cancel') }}</button>
                <button class="btn btn-filled" :disabled="!selectedTeamId" @click="importLineupOnly">{{ t('lineupShare.import') }}</button>
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
import { summaryFromLineupShare } from '@/utils/shareSummary'
import { showSnackbar } from '@/composables/useSnackbar'
import ShareImportSummary from '@/components/share/ShareImportSummary.vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import { t } from '@/i18n'

const route  = useRoute()
const router = useRouter()
const store  = useTeamStore()

const payload = computed(() => {
  const raw = route.query.lineup
  if (!raw) return null
  return decodeSharePayload(String(raw))
})

const importSummary = computed(() => (
  payload.value ? summaryFromLineupShare(payload.value) : null
))

const headerTitle = computed(() => (
  payload.value?.lineupName || payload.value?.teamName || t('lineupShare.defaultName')
))

const headerMeta = computed(() => {
  if (!payload.value) return ''
  const parts = [payload.value.teamName]
  if (payload.value.periodMode === 'quarters') parts.push(t('lineup.archiveQuarters'))
  else if (payload.value.periodMode === 'halves') parts.push(t('lineup.archiveHalves'))
  else if (payload.value.formationId) parts.push(payload.value.formationId)
  return parts.filter(Boolean).join(' · ')
})

const filledSlotCount = computed(() => {
  const p = payload.value
  if (!p) return 0
  const slots = p.periods?.length
    ? p.periods.flatMap(period => period.slots)
    : p.slots
  return slots.filter(s => s.pn).length
})

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

function importBundle() {
  const p = payload.value
  const team = store.importTeam({
    name: p.teamName,
    ageGroup: p.ageGroup,
    knvbClass: p.knvbClass,
    shirt: p.shirt,
    players: p.players,
  })
  _saveLineupToTeam(team)
  showSnackbar(t('lineupShare.importedBundle'))
  showImportDialog.value = false
}

function importAsNew() {
  const p = payload.value
  const team = store.importTeam({
    name: p.teamName + ' (2)',
    ageGroup: p.ageGroup,
    knvbClass: p.knvbClass,
    shirt: p.shirt,
    players: p.players,
  })
  _saveLineupToTeam(team)
  showSnackbar(t('lineupShare.importedBundle'))
  showImportDialog.value = false
}

function importToExisting() {
  const p  = payload.value
  const team = conflictTeam.value
  store.mergeTeam(team.id, { players: p.players })
  const freshTeam = store.teams.find(t => t.id === team.id)
  _saveLineupToTeam(freshTeam)
  showSnackbar(t('lineupShare.addedToTeam', { name: team.name }))
  showImportDialog.value = false
}

function importLineupOnly() {
  const team = store.teams.find(t => t.id === selectedTeamId.value)
  if (!team) return
  _saveLineupToTeam(team)
  showSnackbar(t('lineupShare.addedToTeam', { name: team.name }))
  showImportDialog.value = false
}

function _saveLineupToTeam(team) {
  const p = payload.value
  const slots = resolveSlotsForTeam(p.slots, team.players)
  const periods = p.periodMode && p.periods?.length
    ? p.periods.map(period => ({
        formationId: period.formationId ?? null,
        slots: resolveSlotsForTeam(period.slots, team.players),
      }))
    : null
  store.setActiveTeam(team.id)
  const saved = store.saveLineup({
    teamId:      team.id,
    name:        p.lineupName || t('lineupShare.importedName'),
    formationId: p.formationId ?? null,
    flipped:     p.flipped ?? true,
    slots,
    periodMode:  p.periodMode,
    activePeriod: p.activePeriod ?? 0,
    periods,
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

.import-hint {
  color: var(--md-on-surface-variant);
  margin: 0 0 var(--sp-3);
}

.view-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-3);
  margin-top: var(--sp-8);
  color: var(--md-on-surface-variant);
}

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
