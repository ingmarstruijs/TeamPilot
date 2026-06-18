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
      <TrainingTabBar v-model="activeTab" :tabs="tabItems" />

      <!-- Tab: Sessie -->
      <div v-show="activeTab === 'session'" class="tab-panel session-panel">
        <div class="session-layout">
          <div class="session-main">
            <TrainingSettingsPanel
              v-if="!isDesktop"
              variant="collapsible"
              :force-open="!sessionBlocks.length"
              :summary="settingsSummary"
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
              @update:training-type="trainingType = $event"
              @update:duration-min="durationMin = +$event || 60"
            />

            <div class="status-bar card" :class="{ 'status-bar--warn': sessionTiming.totalMin !== durationMin }">
              <span class="md-label-md status-count">
                {{ sessionBlocks.length }}
                {{ sessionBlocks.length === 1 ? 'oefening' : 'oefeningen' }}
              </span>
              <span class="status-sep" aria-hidden="true">·</span>
              <span class="md-label-sm status-timing">
                {{ sessionTiming.totalMin }}/{{ durationMin }} min
              </span>
            </div>

            <button
              type="button"
              class="btn btn-filled generate-btn"
              :disabled="!presentPlayers.length"
              @click="generate"
            >
              <span class="material-symbols-rounded" aria-hidden="true">auto_fix_high</span>
              Genereer training
            </button>

            <section v-if="sessionBlocks.length" class="card card-elevated session-card">
              <div class="session-card-head">
                <p class="md-title-sm">Trainingsoverzicht</p>
                <button type="button" class="btn btn-tonal share-btn" @click="shareTraining">
                  <span class="material-symbols-rounded" style="font-size:18px">share</span>
                  Delen
                </button>
              </div>

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
                Genereer een training of kies oefeningen in de Bibliotheek.
              </p>
              <button type="button" class="btn btn-tonal" @click="activeTab = 'library'">
                <span class="material-symbols-rounded" aria-hidden="true">library_books</span>
                Naar bibliotheek
              </button>
            </div>
          </div>

          <aside v-if="isDesktop" class="session-sidebar">
            <TrainingSettingsPanel
              variant="sidebar"
              :summary="settingsSummary"
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
              @update:training-type="trainingType = $event"
              @update:duration-min="durationMin = +$event || 60"
            />
          </aside>
        </div>
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
import { encodeTrainingSession, buildTrainingShareUrl } from '@/utils/trainingShare'
import { getKnvbLevel } from '@/data/knvbClasses'
import ExerciseDetailDialog from '@/components/training/ExerciseDetailDialog.vue'
import ExerciseLibraryPanel from '@/components/training/ExerciseLibraryPanel.vue'
import TrainingSettingsPanel from '@/components/training/TrainingSettingsPanel.vue'
import TrainingTabBar from '@/components/training/TrainingTabBar.vue'
import CustomExerciseDialog from '@/components/training/CustomExerciseDialog.vue'
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
    id: 'library',
    label: 'Bibliotheek',
    icon: 'library_books',
    badge: null,
  },
])

const trainingTypeLabel = computed(() =>
  TRAINING_TYPES.find(t => t.id === trainingType.value)?.label ?? trainingType.value
)

const settingsSummary = computed(() =>
  `${presentPlayers.value.length} aanwezig · ${durationMin.value} min · ${trainingTypeLabel.value} · Week ${syncedCycleWeek.value}: ${cycleThemeLabel.value}`
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

onMounted(() => {
  loadDraft()
  if (route.query.library === '1') activeTab.value = 'library'
})

onUnmounted(() => {
  resetTouchReorder()
  resetPointerDrag()
  if (highlightTimer) clearTimeout(highlightTimer)
})

function loadDraft() {
  const draft = trainingState.value.draftSession
  const customList = store.getCustomExercises(store.activeTeamId)
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
    return
  }
  store.saveDraftSession(store.activeTeamId, {
    trainingType: trainingType.value,
    durationMin: durationMin.value,
    playerCount: presentPlayers.value.length,
    presentPlayerIds: [...presentIds.value],
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
  store.recordTrainingSession(
    store.activeTeamId,
    result.blocks.map(b => b.exercise.id),
  )
  persistDraft()
  activeTab.value = 'session'
  showSnackbar(`Training gegenereerd (${result.blocks.length} oefeningen, ${result.totalMin} min)`)
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

.status-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: var(--md-surface-container-low);
  border: 1px solid var(--md-outline-variant);
}

.status-bar--warn {
  border-color: color-mix(in srgb, var(--md-tertiary) 50%, var(--md-outline-variant));
}

.status-sep {
  color: var(--md-outline);
}

.status-timing {
  color: var(--md-on-surface-variant);
}

.generate-btn {
  width: 100%;
  min-height: 44px;
}

.session-card,
.session-empty {
  padding: var(--sp-3);
}

.session-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.share-btn {
  height: 36px;
  flex-shrink: 0;
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
