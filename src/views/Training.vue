<template>
  <div class="page training-page">
    <div class="training-header">
      <h1 class="md-headline-sm training-title">Training</h1>
      <p v-if="roster.length" class="md-label-sm training-meta">
        {{ activeTeam?.name }} · Week {{ syncedCycleWeek }}: {{ cycleThemeLabel }}
      </p>
    </div>

    <div v-if="!roster.length" class="empty-state card card-elevated">
      <span class="material-symbols-rounded empty-icon">group_off</span>
      <p class="md-title-md">Geen spelers</p>
      <p class="md-body-md">Voeg eerst spelers toe om een training te plannen.</p>
      <RouterLink to="/players" class="btn btn-filled mt-3">Naar spelers</RouterLink>
    </div>

    <template v-else>
      <div class="training-tabs-shell">
        <TrainingTabBar v-model="activeTab" :tabs="tabItems" />
      </div>

      <!-- Tab: Sessie -->
      <div v-show="activeTab === 'session'" class="tab-panel session-panel">
        <div class="session-layout">
          <div class="session-main">
            <div class="session-start card card-elevated">
              <div class="session-start-header">
                <h2 class="md-title-sm session-start-title">Start je training</h2>
                <p class="md-label-sm session-start-theme">
                  <span class="material-symbols-rounded session-start-theme-icon" aria-hidden="true">{{ cycleThemeIcon }}</span>
                  Week {{ syncedCycleWeek }}/4 · {{ cycleThemeLabel }}
                </p>
              </div>

              <TrainingSettingsPanel
                v-if="!isDesktop"
                variant="collapsible"
                nested
                :force-open="!sessionBlocks.length"
                :summary="presentSummary"
                :show-present="true"
                :show-config="false"
                :show-cycle-info="false"
                :roster="roster"
                :present-ids="presentIds"
                :all-present="allPresent"
                :balance="balance"
                :training-type="trainingType"
                :duration-min="durationMin"
                :cycle-week="syncedCycleWeek"
                :cycle-theme-label="cycleThemeLabel"
                :training-types="TRAINING_TYPES"
                @toggle-all="toggleAll"
                @toggle-player="togglePlayer"
              />

              <TrainingSettingsPanel
                v-if="!isDesktop"
                variant="collapsible"
                nested
                :summary="configSummary"
                :show-present="false"
                :show-config="true"
                :show-cycle-info="false"
                :roster="roster"
                :present-ids="presentIds"
                :all-present="allPresent"
                :balance="balance"
                :training-type="trainingType"
                :duration-min="durationMin"
                :cycle-week="syncedCycleWeek"
                :cycle-theme-label="cycleThemeLabel"
                :training-types="TRAINING_TYPES"
                @update:training-type="trainingType = $event"
                @update:duration-min="durationMin = +$event || 60"
              />

              <TrainingSettingsPanel
                v-if="isDesktop"
                variant="embedded"
                :show-present="false"
                :show-config="true"
                :show-cycle-info="false"
                :roster="roster"
                :present-ids="presentIds"
                :all-present="allPresent"
                :balance="balance"
                :training-type="trainingType"
                :duration-min="durationMin"
                :cycle-week="syncedCycleWeek"
                :cycle-theme-label="cycleThemeLabel"
                :training-types="TRAINING_TYPES"
                @update:training-type="trainingType = $event"
                @update:duration-min="durationMin = +$event || 60"
              />

              <div class="session-start-divider" aria-hidden="true" />

              <div class="session-start-actions">
                <button type="button" class="btn btn-tonal session-start-btn" @click="showPickSaved = true">
                  <span class="material-symbols-rounded" aria-hidden="true">bookmark</span>
                  Kies opgeslagen
                </button>
                <button
                  type="button"
                  class="btn btn-filled session-start-btn"
                  :disabled="!presentPlayers.length"
                  @click="generate"
                >
                  <span class="material-symbols-rounded" aria-hidden="true">auto_fix_high</span>
                  Genereer
                </button>
              </div>

              <p v-if="activeSavedTrainingName" class="md-label-sm session-source">
                Gebaseerd op: {{ activeSavedTrainingName }}
              </p>
            </div>

            <section v-if="sessionBlocks.length" class="card card-elevated session-card">
              <header class="session-card-head">
                <div class="session-card-intro">
                  <h2 class="md-title-sm session-card-title">Trainingsoverzicht</h2>
                  <p
                    class="md-label-sm session-card-meta"
                    :class="{ 'session-card-meta--warn': sessionTiming.totalMin !== durationMin }"
                  >
                    {{ sessionBlocks.length }}
                    {{ sessionBlocks.length === 1 ? 'oefening' : 'oefeningen' }}
                    · {{ sessionTiming.totalMin }}/{{ durationMin }} min
                  </p>
                </div>
                <div class="session-card-toolbar">
                  <button
                    v-if="activeSavedTrainingId"
                    type="button"
                    class="btn btn-outlined toolbar-btn"
                    @click="updateActiveSaved"
                  >
                    Bijwerken
                  </button>
                  <button type="button" class="btn btn-tonal toolbar-btn" @click="openSaveDialog()">
                    <span class="material-symbols-rounded toolbar-icon" aria-hidden="true">bookmark_add</span>
                    <span class="toolbar-label">Opslaan</span>
                  </button>
                  <button type="button" class="btn btn-tonal toolbar-btn" @click="shareTraining">
                    <span class="material-symbols-rounded toolbar-icon" aria-hidden="true">share</span>
                    <span class="toolbar-label">Deel sessie</span>
                  </button>
                </div>
              </header>

              <div class="session-list">
                <template v-for="(block, i) in sessionBlocks" :key="block.uid">
                  <div
                    class="session-row"
                    :class="{
                      'drag-over': dragOverIndex === i,
                      'is-dragging': dragIndex === i,
                      'is-new': block.uid === highlightUid,
                    }"
                    :data-session-index="i"
                    @touchstart="onRowTouchStart(i, $event)"
                    @touchmove="onRowTouchMove"
                    @touchend="onRowTouchEnd"
                    @touchcancel="onRowTouchCancel"
                  >
                    <div
                      class="drag-handle"
                      aria-label="Sleep om te verplaatsen"
                      title="Sleep om te verplaatsen"
                      @pointerdown="onHandlePointerDown(i, $event)"
                    >
                      <span class="material-symbols-rounded" aria-hidden="true">drag_indicator</span>
                    </div>
                    <div
                      class="session-info session-info-btn"
                      role="button"
                      tabindex="0"
                      @click="openDetail(block)"
                      @keydown.enter.prevent="openDetail(block)"
                    >
                      <p class="md-title-sm session-title">
                        <span class="session-index md-label-sm">{{ i + 1 }}</span>
                        <span
                          v-if="isCustomExercise(block.exercise)"
                          class="custom-ex-badge"
                          title="Eigen oefening"
                        >
                          <span class="material-symbols-rounded" aria-hidden="true">draw</span>
                        </span>
                        <span class="session-title-text">{{ getExerciseTitle(block.exercise) }}</span>
                      </p>
                      <p class="md-body-sm session-meta">
                        {{ categoryLabel(block.exercise.category) }} · {{ playerRangeLabel(block.exercise) }}
                      </p>
                    </div>
                    <div class="session-duration">
                      <input
                        type="number"
                        class="duration-input"
                        :value="block.durationMin"
                        min="1"
                        max="60"
                        step="1"
                        @change="e => setBlockDuration(i, +e.target.value)"
                        aria-label="Duur in minuten"
                      />
                      <span class="md-label-sm duration-suffix">min</span>
                    </div>
                    <button
                      type="button"
                      class="btn-icon"
                      aria-label="Verwijderen"
                      style="color:var(--md-error)"
                      @click="removeBlock(i)"
                    >
                      <span class="material-symbols-rounded">delete</span>
                    </button>
                  </div>
                </template>
              </div>
            </section>

            <div v-else class="session-empty card card-elevated">
              <span class="material-symbols-rounded session-empty-icon" aria-hidden="true">stadium</span>
              <p class="md-title-sm">Nog geen training</p>
              <p class="md-body-sm session-empty-text">
                Kies een opgeslagen training, genereer een sessie, of voeg oefeningen toe via de Bibliotheek.
              </p>
              <button type="button" class="btn btn-tonal" @click="activeTab = 'saved'">
                <span class="material-symbols-rounded" aria-hidden="true">bookmark</span>
                Opgeslagen trainingen
              </button>
            </div>
          </div>

          <aside v-if="isDesktop" class="session-sidebar">
            <TrainingSettingsPanel
              variant="sidebar"
              :show-present="true"
              :show-config="false"
              :show-cycle-info="false"
              :roster="roster"
              :present-ids="presentIds"
              :all-present="allPresent"
              :balance="balance"
              :training-type="trainingType"
              :duration-min="durationMin"
              :cycle-week="syncedCycleWeek"
              :cycle-theme-label="cycleThemeLabel"
              :training-types="TRAINING_TYPES"
              @toggle-all="toggleAll"
              @toggle-player="togglePlayer"
            />
          </aside>
        </div>
      </div>

      <!-- Tab: Opgeslagen -->
      <div v-show="activeTab === 'saved'" class="tab-panel">
        <SavedTrainingsPanel
          :recipes="savedRecipes"
          @use="useSavedRecipe"
          @edit="editSavedRecipe"
          @share="shareSavedRecipe"
          @duplicate="duplicateSavedRecipe"
          @delete="deleteSavedRecipe"
        />
      </div>

      <!-- Tab: Bibliotheek -->
      <div v-show="activeTab === 'library'" class="tab-panel">
        <ExerciseLibraryPanel
          :exercises="filteredExercises"
          :session-blocks="sessionBlocks"
          v-model:query="libraryQuery"
          v-model:category="libraryCategory"
          v-model:suitable-only="librarySuitableOnly"
          @preview="openPreview"
          @add="addManualExercise"
          @go-session="activeTab = 'session'"
          @create-custom="showCustomDialog = true"
          @reset-filters="resetLibraryFilters"
        />
      </div>
    </template>

    <ExerciseDetailDialog
      :block="detailBlock"
      :exercise="previewExercise"
      :mode="previewExercise ? 'preview' : 'session'"
      :player-count="presentPlayers.length"
      @close="closeDetail"
      @add="addFromPreview"
    />

    <CustomExerciseDialog
      :open="showCustomDialog"
      :age-group="activeTeam?.ageGroup ?? 'JO11'"
      @close="showCustomDialog = false"
      @save="onCustomExerciseSaved"
    />

    <SaveTrainingDialog
      :open="showSaveDialog"
      :default-name="saveDefaultName"
      :default-theme="saveDefaultTheme"
      @close="closeSaveDialog"
      @save="onSaveDialogSubmit"
    />

    <PickSavedTrainingDialog
      :open="showPickSaved"
      :recipes="savedRecipes"
      @close="showPickSaved = false"
      @select="onPickSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import { TRAINING_TYPES, EXERCISE_CATEGORIES, getExerciseById } from '@/data/exercises'
import {
  generateTraining,
  getCycleTheme,
  getCycleThemeLabel,
  browseExercisesWithFilters,
  analyzePlayerBalance,
  computeSessionTiming,
} from '@/utils/trainingEngine'
import { encodeTrainingSession, encodeRecipe, buildTrainingShareUrl, buildRecipeShareUrl } from '@/utils/trainingShare'
import {
  defaultSavedName,
  blocksToSerializable,
  resolveSavedBlocks,
  savedTrainingFromSession,
} from '@/utils/savedTraining'
import { getCycleThemeIcon } from '@/utils/trainingIcons'
import { getKnvbLevel } from '@/data/knvbClasses'
import ExerciseDetailDialog from '@/components/training/ExerciseDetailDialog.vue'
import ExerciseLibraryPanel from '@/components/training/ExerciseLibraryPanel.vue'
import TrainingSettingsPanel from '@/components/training/TrainingSettingsPanel.vue'
import TrainingTabBar from '@/components/training/TrainingTabBar.vue'
import CustomExerciseDialog from '@/components/training/CustomExerciseDialog.vue'
import SaveTrainingDialog from '@/components/training/SaveTrainingDialog.vue'
import PickSavedTrainingDialog from '@/components/training/PickSavedTrainingDialog.vue'
import SavedTrainingsPanel from '@/components/training/SavedTrainingsPanel.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { showSnackbar } from '@/composables/useSnackbar'
import { playerRangeLabel, getExerciseTitle, isCustomExercise } from '@/utils/exerciseText'

const store = useTeamStore()
const route = useRoute()
const isDesktop = useMediaQuery('(min-width: 720px)')

const activeTeam = computed(() => store.activeTeam)
const knvbClassConfig = computed(() => store.knvbClassConfig)
const roster = computed(() => activeTeam.value?.players ?? [])
const trainingState = computed(() => store.getTrainingState())

const presentIds = ref(new Set())
const trainingType = ref('gemengd')
const durationMin = ref(60)
const sessionBlocks = ref([])
const activeSavedTrainingId = ref(null)
const showSaveDialog = ref(false)
const showPickSaved = ref(false)
const activeTab = ref('session')
const showCustomDialog = ref(false)
const detailBlock = ref(null)
const previewExercise = ref(null)
const libraryQuery = ref('')
const libraryCategory = ref('')
const librarySuitableOnly = ref(true)
const dragIndex = ref(null)
const dragOverIndex = ref(null)
const highlightUid = ref(null)
let highlightTimer = null
let nextBlockUid = 1
let suppressDetailClick = false

const LONG_PRESS_MS = 450
const MOVE_CANCEL_PX = 12

/** @type {{ index: number|null, startX: number, startY: number, timer: ReturnType<typeof setTimeout>|null, active: boolean }} */
let touchReorder = {
  index: null,
  startX: 0,
  startY: 0,
  timer: null,
  active: false,
}

/** @type {{ index: number, pointerId: number } | null} */
let pointerDrag = null

const tabItems = computed(() => [
  {
    id: 'session',
    label: 'Sessie',
    icon: 'stadium',
    badge: sessionBlocks.value.length || null,
  },
  {
    id: 'saved',
    label: 'Opgeslagen',
    icon: 'bookmark',
    badge: savedRecipes.value.length || null,
  },
  {
    id: 'library',
    label: 'Bibliotheek',
    icon: 'library_books',
    badge: null,
  },
])

const savedRecipes = computed(() =>
  [...store.getSavedTrainings(store.activeTeamId)].sort((a, b) => b.updatedAt - a.updatedAt)
)

const activeSavedTrainingName = computed(() => {
  if (!activeSavedTrainingId.value) return null
  return store.getSavedTraining(store.activeTeamId, activeSavedTrainingId.value)?.name ?? null
})

const saveDefaultName = computed(() =>
  defaultSavedName({
    cycleWeek: syncedCycleWeek.value,
    cycleThemeLabel: cycleThemeLabel.value,
    trainingTypeLabel: trainingTypeLabel.value,
  })
)

const saveDefaultTheme = computed(() => getCycleTheme(syncedCycleWeek.value))

const trainingTypeLabel = computed(() =>
  TRAINING_TYPES.find(t => t.id === trainingType.value)?.label ?? trainingType.value
)

const presentSummary = computed(() => {
  const n = presentPlayers.value.length
  const count = n === 1 ? '1 aanwezig' : `${n} aanwezig`
  return `Wie is er? · ${count}`
})

const configSummary = computed(() =>
  `Opzet · ${trainingTypeLabel.value} · ${durationMin.value} min`
)

function isDragExcludedTarget(el) {
  return el?.closest('input, .session-duration, button[aria-label="Verwijderen"], .drag-handle')
}

function clearDragVisuals() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function resetPointerDrag() {
  pointerDrag = null
  document.removeEventListener('pointermove', onPointerDragMove)
  document.removeEventListener('pointerup', onPointerDragEnd)
  document.removeEventListener('pointercancel', onPointerDragEnd)
  document.body.style.removeProperty('cursor')
  document.body.style.removeProperty('user-select')
  clearDragVisuals()
}

function onHandlePointerDown(index, e) {
  if (e.pointerType === 'touch') return
  if (e.button !== 0) return

  e.preventDefault()
  e.stopPropagation()

  pointerDrag = { index, pointerId: e.pointerId }
  dragIndex.value = index
  dragOverIndex.value = index
  document.body.style.cursor = 'grabbing'
  document.body.style.userSelect = 'none'

  document.addEventListener('pointermove', onPointerDragMove)
  document.addEventListener('pointerup', onPointerDragEnd)
  document.addEventListener('pointercancel', onPointerDragEnd)
}

function onPointerDragMove(e) {
  if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return
  e.preventDefault()
  const over = findSessionRowIndexAtY(e.clientY)
  if (over !== null) dragOverIndex.value = over
}

function onPointerDragEnd(e) {
  if (!pointerDrag || e.pointerId !== pointerDrag.pointerId) return
  reorderBlocks(pointerDrag.index, dragOverIndex.value ?? pointerDrag.index)
  resetPointerDrag()
}

function clearTouchReorderTimer() {
  if (touchReorder.timer !== null) {
    window.clearTimeout(touchReorder.timer)
    touchReorder.timer = null
  }
}

function resetTouchReorder() {
  clearTouchReorderTimer()
  touchReorder = { index: null, startX: 0, startY: 0, timer: null, active: false }
  clearDragVisuals()
  document.removeEventListener('touchmove', onDocumentTouchMove)
}

function onDocumentTouchMove(e) {
  if (!touchReorder.active) return
  e.preventDefault()
}

function findSessionRowIndexAtY(clientY) {
  const rows = document.querySelectorAll('.session-list [data-session-index]')
  if (!rows.length) return null

  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    if (clientY >= rect.top && clientY <= rect.bottom) {
      return Number(row.dataset.sessionIndex)
    }
  }

  let nearest = null
  let nearestDist = Infinity
  for (const row of rows) {
    const rect = row.getBoundingClientRect()
    const centerY = rect.top + rect.height / 2
    const dist = Math.abs(clientY - centerY)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = Number(row.dataset.sessionIndex)
    }
  }
  return Number.isNaN(nearest) ? null : nearest
}

watch(roster, (players) => {
  if (!trainingState.value.draftSession?.presentPlayerIds) {
    presentIds.value = new Set(players.map(p => p.id))
  }
}, { immediate: true })

watch(
  [sessionBlocks, trainingType, durationMin, presentIds],
  () => persistDraft(),
  { deep: true },
)

watch(() => store.activeTeamId, () => loadDraft())

watch(
  () => route.query.library,
  value => {
    if (value === '1') activeTab.value = 'library'
  },
)

watch(
  () => route.query.saved,
  value => {
    if (value === '1') activeTab.value = 'saved'
  },
)

onMounted(() => {
  loadDraft()
  if (route.query.library === '1') activeTab.value = 'library'
  if (route.query.saved === '1') activeTab.value = 'saved'
})

onUnmounted(() => {
  resetTouchReorder()
  resetPointerDrag()
  if (highlightTimer) clearTimeout(highlightTimer)
})

function loadDraft() {
  const draft = trainingState.value.draftSession
  const customList = store.getCustomExercises(store.activeTeamId)
  activeSavedTrainingId.value = draft?.activeSavedTrainingId ?? null
  if (!draft?.blocks?.length) {
    sessionBlocks.value = []
    return
  }
  trainingType.value = draft.trainingType ?? trainingType.value
  durationMin.value = draft.durationMin ?? durationMin.value
  if (draft.presentPlayerIds?.length) {
    presentIds.value = new Set(draft.presentPlayerIds)
  }
  sessionBlocks.value = draft.blocks
    .map(b => {
      const exercise = getExerciseById(b.exerciseId, customList)
      if (!exercise) return null
      return { uid: nextBlockUid++, exercise, durationMin: b.durationMin }
    })
    .filter(Boolean)
}

function persistDraft() {
  if (!sessionBlocks.value.length) {
    store.saveDraftSession(store.activeTeamId, null)
    activeSavedTrainingId.value = null
    return
  }
  store.saveDraftSession(store.activeTeamId, {
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    playerCount: presentPlayers.value.length,
    presentPlayerIds: [...presentIds.value],
    activeSavedTrainingId: activeSavedTrainingId.value,
    blocks: sessionBlocks.value.map(b => ({
      exerciseId: b.exercise.id,
      durationMin: b.durationMin,
    })),
  })
}

function makeBlock(exercise, durationMin) {
  return { uid: nextBlockUid++, exercise, durationMin }
}

function reorderBlocks(from, to) {
  if (from == null || to == null || from === to) return
  const arr = [...sessionBlocks.value]
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
  sessionBlocks.value = arr
}

function onTouchMove(e) {
  if (!touchReorder.active || touchReorder.index === null) return
  e.preventDefault()
  const touch = e.touches[0]
  const overIndex = findSessionRowIndexAtY(touch.clientY)
  if (overIndex !== null) dragOverIndex.value = overIndex
}

function onRowTouchStart(index, e) {
  if (isDragExcludedTarget(e.target)) return

  resetTouchReorder()

  const touch = e.touches[0]
  touchReorder.index = index
  touchReorder.startX = touch.clientX
  touchReorder.startY = touch.clientY

  touchReorder.timer = window.setTimeout(() => {
    touchReorder.timer = null
    touchReorder.active = true
    dragIndex.value = index
    dragOverIndex.value = index
    suppressDetailClick = true
    document.addEventListener('touchmove', onDocumentTouchMove, { passive: false })
    navigator.vibrate?.(12)
  }, LONG_PRESS_MS)
}

function onRowTouchMove(e) {
  if (touchReorder.index === null) return

  const touch = e.touches[0]
  const moved = Math.hypot(
    touch.clientX - touchReorder.startX,
    touch.clientY - touchReorder.startY,
  )

  if (!touchReorder.active) {
    if (moved > MOVE_CANCEL_PX) clearTouchReorderTimer()
    return
  }

  onTouchMove(e)
}

function onRowTouchEnd() {
  if (touchReorder.active && touchReorder.index !== null) {
    const from = touchReorder.index
    const to = dragOverIndex.value ?? from
    reorderBlocks(from, to)
    suppressDetailClick = true
    window.setTimeout(() => { suppressDetailClick = false }, 300)
  } else {
    clearTouchReorderTimer()
  }

  resetTouchReorder()
}

function onRowTouchCancel() {
  suppressDetailClick = false
  resetTouchReorder()
}

function setBlockDuration(index, minutes) {
  const val = Math.max(1, Math.min(60, Number(minutes) || 1))
  sessionBlocks.value[index].durationMin = val
}

function removeBlock(index) {
  sessionBlocks.value = sessionBlocks.value.filter((_, i) => i !== index)
}

const allPresent = computed(() => presentIds.value.size === roster.value.length)

const presentPlayers = computed(() =>
  roster.value.filter(p => presentIds.value.has(p.id))
)

const balance = computed(() => {
  if (!presentPlayers.value.length) return null
  return analyzePlayerBalance(presentPlayers.value)
})

const cycleThemeLabel = computed(() =>
  getCycleThemeLabel(getCycleTheme(syncedCycleWeek.value))
)

const cycleThemeIcon = computed(() => getCycleThemeIcon(getCycleTheme(syncedCycleWeek.value)))

const syncedCycleWeek = computed(() => trainingState.value.cycleWeek ?? 1)

const sessionTiming = computed(() =>
  computeSessionTiming(sessionBlocks.value, durationMin.value)
)

const totalMin = computed(() => sessionTiming.value.totalMin)

const filteredExercises = computed(() => {
  const custom = store.getCustomExercises(store.activeTeamId)
  return browseExercisesWithFilters({
    ageGroup: activeTeam.value?.ageGroup,
    knvbLevel: getKnvbLevel(activeTeam.value?.knvbClass),
    playerCount: presentPlayers.value.length || undefined,
    category: libraryCategory.value || undefined,
    query: libraryQuery.value.trim(),
    suitableOnly: librarySuitableOnly.value,
    customExercises: custom,
  }).sort((a, b) =>
    getExerciseTitle(a).localeCompare(getExerciseTitle(b), 'nl')
  )
})

function resetLibraryFilters() {
  libraryQuery.value = ''
  libraryCategory.value = ''
  librarySuitableOnly.value = true
}

function categoryLabel(id) {
  return EXERCISE_CATEGORIES.find(c => c.id === id)?.label ?? id
}

function togglePlayer(id) {
  const next = new Set(presentIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  presentIds.value = next
}

function toggleAll() {
  if (allPresent.value) presentIds.value = new Set()
  else presentIds.value = new Set(roster.value.map(p => p.id))
}

function generate() {
  const result = generateTraining({
    ageGroup: activeTeam.value.ageGroup,
    knvbLevel: getKnvbLevel(activeTeam.value.knvbClass),
    playerCount: presentPlayers.value.length,
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    cycleWeek: syncedCycleWeek.value,
    recentIds: trainingState.value.recentExerciseIds ?? [],
    presentPlayers: presentPlayers.value,
  })
  sessionBlocks.value = result.blocks.map(b => makeBlock(b.exercise, b.durationMin))
  activeSavedTrainingId.value = null
  store.recordTrainingSession(
    store.activeTeamId,
    result.blocks.map(b => b.exercise.id),
  )
  persistDraft()
  activeTab.value = 'session'
  showSnackbar(`Training gegenereerd (${result.blocks.length} oefeningen, ${result.totalMin} min)`)
}

function loadRecipeIntoSession(recipe) {
  const customList = store.getCustomExercises(store.activeTeamId)
  const resolved = resolveSavedBlocks(recipe, customList)
  if (!resolved.length) {
    showSnackbar('Oefeningen niet beschikbaar voor dit recept')
    return false
  }
  trainingType.value = recipe.trainingType
  durationMin.value = recipe.durationMin
  sessionBlocks.value = resolved.map(b => makeBlock(b.exercise, b.durationMin))
  activeSavedTrainingId.value = recipe.id
  persistDraft()
  activeTab.value = 'session'
  return true
}

function useSavedRecipe(recipe) {
  if (loadRecipeIntoSession(recipe)) {
    showSnackbar(`"${recipe.name}" geladen`)
  }
}

function editSavedRecipe(recipe) {
  if (loadRecipeIntoSession(recipe)) {
    showSnackbar(`"${recipe.name}" bewerken in Sessie`)
  }
}

function duplicateSavedRecipe(recipe) {
  const copy = store.duplicateSavedTraining(store.activeTeamId, recipe.id)
  if (copy) showSnackbar(`"${copy.name}" aangemaakt`)
}

function deleteSavedRecipe(recipe) {
  if (activeSavedTrainingId.value === recipe.id) {
    activeSavedTrainingId.value = null
  }
  store.deleteSavedTraining(store.activeTeamId, recipe.id)
  showSnackbar('Trainingsrecept verwijderd')
}

function openSaveDialog() {
  showSaveDialog.value = true
}

function closeSaveDialog() {
  showSaveDialog.value = false
}

function onSaveDialogSubmit({ name, cycleTheme }) {
  const recipe = savedTrainingFromSession({
    name,
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    cycleTheme,
    blocks: sessionBlocks.value,
    source: 'manual',
  })
  store.addSavedTraining(store.activeTeamId, recipe)
  activeSavedTrainingId.value = recipe.id
  persistDraft()
  closeSaveDialog()
  showSnackbar(`"${name}" opgeslagen`)
}

function updateActiveSaved() {
  if (!activeSavedTrainingId.value) return
  const existing = store.getSavedTraining(store.activeTeamId, activeSavedTrainingId.value)
  if (!existing) return
  store.updateSavedTraining(store.activeTeamId, activeSavedTrainingId.value, {
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    blocks: blocksToSerializable(sessionBlocks.value),
  })
  showSnackbar(`"${existing.name}" bijgewerkt`)
}

function onPickSaved(recipe) {
  showPickSaved.value = false
  useSavedRecipe(recipe)
}

function shareSavedRecipe(recipe) {
  const customList = store.getCustomExercises(store.activeTeamId)
  const blocks = resolveSavedBlocks(recipe, customList)
  if (!blocks.length) {
    showSnackbar('Kan recept niet delen — oefeningen ontbreken')
    return
  }
  const encoded = encodeRecipe({
    name: recipe.name,
    trainingType: recipe.trainingType,
    durationMin: recipe.durationMin,
    cycleTheme: recipe.cycleTheme,
    ageGroup: activeTeam.value.ageGroup,
    knvbClass: activeTeam.value.knvbClass,
    blocks,
  })
  const url = buildRecipeShareUrl(encoded)
  const text = `${recipe.name} — TeamPilot trainingsrecept`
  if (navigator.share) {
    navigator.share({ title: 'TeamPilot trainingsrecept', text, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showSnackbar('Receptlink gekopieerd!'))
      .catch(() => showSnackbar('Kopiëren mislukt'))
  }
}

function shareTraining() {
  if (!sessionBlocks.value.length) return
  const encoded = encodeTrainingSession({
    teamName: activeTeam.value.name,
    ageGroup: activeTeam.value.ageGroup,
    knvbClass: activeTeam.value.knvbClass,
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    playerCount: presentPlayers.value.length,
    cycleWeek: syncedCycleWeek.value,
    blocks: sessionBlocks.value,
  })
  const url = buildTrainingShareUrl(encoded)
  const text = `Training ${activeTeam.value.name} (${totalMin.value} min)`
  if (navigator.share) {
    navigator.share({ title: 'Training TeamPilot', text, url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url)
      .then(() => showSnackbar('Trainingslink gekopieerd!'))
      .catch(() => showSnackbar('Kopiëren mislukt'))
  }
}

function addManualExercise(ex) {
  const position = sessionBlocks.value.length + 1
  const block = makeBlock(ex, ex.durationMin)
  sessionBlocks.value = [...sessionBlocks.value, block]
  activeTab.value = 'session'
  highlightUid.value = block.uid
  if (highlightTimer) clearTimeout(highlightTimer)
  highlightTimer = setTimeout(() => { highlightUid.value = null }, 2000)
  showSnackbar(`${getExerciseTitle(ex)} toegevoegd als oefening ${position}`)
  persistDraft()
}

function onCustomExerciseSaved(exercise) {
  store.addCustomExercise(store.activeTeamId, exercise)
  showCustomDialog.value = false
  activeTab.value = 'library'
  showSnackbar(`"${exercise.title}" opgeslagen in je bibliotheek`)
}

function openPreview(ex) {
  previewExercise.value = ex
  detailBlock.value = null
}

function openDetail(block) {
  if (suppressDetailClick) return
  detailBlock.value = block
  previewExercise.value = null
}

function closeDetail() {
  detailBlock.value = null
  previewExercise.value = null
}

function addFromPreview(ex) {
  addManualExercise(ex)
  closeDetail()
}
</script>

<style scoped>
.training-header {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-2);
}

@media (max-width: 899px) {
  .training-header {
    display: none;
  }

  .training-page {
    padding-top: 0;
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
  }

  .training-tabs-shell {
    position: sticky;
    top: 0;
    z-index: 20;
    margin: calc(-1 * var(--sp-4)) calc(-1 * var(--sp-4)) 0;
    padding: var(--sp-2) var(--sp-4);
    background: var(--md-surface);
    border-bottom: 1px solid var(--md-outline-variant);
  }

  .training-tabs-shell :deep(.training-tabs) {
    margin-bottom: 0;
  }
}

@media (min-width: 600px) and (max-width: 899px) {
  .training-tabs-shell {
    margin-top: calc(-1 * var(--sp-5));
    margin-left: calc(-1 * var(--sp-5));
    margin-right: calc(-1 * var(--sp-5));
    padding-left: var(--sp-5);
    padding-right: var(--sp-5);
  }
}

.training-title {
  margin: 0;
}

.training-meta {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.tab-panel {
  min-width: 0;
}

.session-layout {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.session-main {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  min-width: 0;
}

.session-card-head {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
  padding-bottom: var(--sp-3);
  border-bottom: 1px solid var(--md-outline-variant);
}

.session-card-intro {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.session-card-title {
  margin: 0;
  line-height: 1.3;
}

.session-card-meta {
  margin: 0;
  color: var(--md-on-surface-variant);
}

.session-card-meta--warn {
  color: var(--md-tertiary);
}

.session-card-toolbar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(6.5rem, 1fr));
  gap: var(--sp-2);
  width: 100%;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  min-height: 40px;
  padding: 0 var(--sp-2);
  font-size: 13px;
}

.toolbar-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.toolbar-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 720px) {
  .session-card-head {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: var(--sp-4);
  }

  .session-card-toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    width: auto;
    flex-shrink: 0;
  }

  .toolbar-btn {
    min-height: 36px;
    padding: 0 var(--sp-3);
    font-size: inherit;
  }
}

@media (max-width: 380px) {
  .toolbar-btn:has(.toolbar-icon) .toolbar-label {
    display: none;
  }

  .toolbar-btn:has(.toolbar-icon) {
    padding: 0;
    min-width: 40px;
  }
}

.session-start {
  padding: var(--sp-4);
}

.session-start-header {
  margin-bottom: var(--sp-3);
}

.session-start-title {
  margin: 0;
}

.session-start-theme {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-1);
  margin: var(--sp-1) 0 0;
  color: var(--md-on-surface-variant);
}

.session-start-theme-icon {
  font-size: 16px;
  color: var(--md-primary);
}

.session-start-divider {
  height: 1px;
  margin: var(--sp-3) 0;
  background: var(--md-outline-variant);
}

.session-start-label {
  margin: 0 0 var(--sp-2);
}

.session-start-actions {
  display: flex;
  gap: var(--sp-2);
}

.session-start-btn {
  flex: 1;
  min-height: 44px;
}

.session-source {
  margin: var(--sp-2) 0 0;
  color: var(--md-on-surface-variant);
}

.session-card,
.session-empty {
  padding: var(--sp-3);
}

.saved-hint {
  margin: 0 0 var(--sp-3);
  color: var(--md-outline);
}

.session-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sp-2);
  padding: var(--sp-4) var(--sp-3);
}

.session-empty-icon {
  font-size: 40px;
  color: var(--md-primary);
  opacity: 0.85;
}

.session-empty-text {
  margin: 0 0 var(--sp-2);
  color: var(--md-on-surface-variant);
  max-width: 28rem;
}

.session-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-1);
}

.session-row {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  border-radius: var(--md-shape-md);
  transition: background var(--md-duration-short), opacity var(--md-duration-short), box-shadow var(--md-duration-short);
  touch-action: manipulation;
  user-select: none;
}

.session-row.is-new {
  background: color-mix(in srgb, var(--md-primary) 10%, transparent);
  box-shadow: inset 0 0 0 2px var(--md-primary);
}

.drag-handle {
  display: none;
  flex-shrink: 0;
  cursor: grab;
  color: var(--md-on-surface-variant);
  touch-action: none;
  padding: var(--sp-1);
  border-radius: var(--md-shape-sm);
}

.drag-handle .material-symbols-rounded {
  font-size: 22px;
  pointer-events: none;
}

.drag-handle:active {
  cursor: grabbing;
}

@media (min-width: 900px) {
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.session-row.is-dragging {
  opacity: 0.55;
  touch-action: none;
}

.session-row:hover {
  background: color-mix(in srgb, var(--md-on-surface) 4%, transparent);
}

.session-row.drag-over {
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
  box-shadow: inset 0 0 0 2px var(--md-primary);
}

.session-info-btn {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  padding: 0;
  border-radius: var(--md-shape-sm);
}

.session-info-btn:hover {
  background: color-mix(in srgb, var(--md-on-surface) 4%, transparent);
}

.session-meta {
  color: var(--md-on-surface-variant);
  margin: 0;
}

.session-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
  cursor: default;
}

.duration-input {
  width: 3.25rem;
  min-width: 3.25rem;
  padding: var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  font: inherit;
  font-size: 15px;
  text-align: center;
  background: var(--md-surface);
  color: var(--md-on-surface);
}

.duration-input::-webkit-outer-spin-button,
.duration-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.duration-suffix {
  color: var(--md-on-surface-variant);
  white-space: nowrap;
}

.session-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.375rem;
  height: 1.375rem;
  flex-shrink: 0;
  border-radius: var(--md-shape-full);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  font-size: 11px;
  font-weight: 600;
}

.session-title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  min-width: 0;
}

.session-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 599px) {
  .session-title-text {
    white-space: normal;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
}


.custom-ex-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--md-shape-sm);
  background: var(--md-tertiary-container);
  color: var(--md-on-tertiary-container);
  flex-shrink: 0;
}

.custom-ex-badge .material-symbols-rounded {
  font-size: 15px;
}

.empty-state {
  text-align: center;
  padding: var(--sp-8) var(--sp-4);
}

.empty-icon {
  font-size: 48px;
  color: var(--md-outline);
  display: block;
  margin-bottom: var(--sp-3);
}

@media (min-width: 720px) {
  .session-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: var(--sp-4);
  }

  .session-main {
    flex: 1;
    min-width: 0;
  }

  .session-sidebar {
    flex: 0 0 38%;
    max-width: 340px;
    min-width: 280px;
  }
}
</style>
