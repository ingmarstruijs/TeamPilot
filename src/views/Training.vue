<template>
  <div class="page">
    <div class="training-header">
      <div>
        <h1 class="md-headline-sm">Training</h1>
        <p class="md-body-md" style="color:var(--md-on-surface-variant)">
          {{ activeTeam?.name }} · {{ knvbClassConfig.label }} · Cyclus week {{ syncedCycleWeek }}/4
        </p>
      </div>
    </div>

    <!-- Empty roster -->
    <div v-if="!roster.length" class="empty-state card card-elevated">
      <span class="material-symbols-rounded empty-icon">group_off</span>
      <p class="md-title-md">Geen spelers</p>
      <p class="md-body-md">Voeg eerst spelers toe om een training te plannen.</p>
      <RouterLink to="/players" class="btn btn-filled mt-3">Naar spelers</RouterLink>
    </div>

    <template v-else>
      <!-- Attendance -->
      <section class="card card-elevated section">
        <div class="section-head">
          <p class="md-title-sm">Aanwezige spelers</p>
          <button class="btn btn-text" style="height:32px;font-size:13px" @click="toggleAll">
            {{ allPresent ? 'Geen' : 'Alle' }}
          </button>
        </div>
        <div class="player-chips">
          <button
            v-for="p in roster"
            :key="p.id"
            class="chip"
            :class="{ active: presentIds.has(p.id) }"
            @click="togglePlayer(p.id)"
          >
            {{ p.name }}
          </button>
        </div>
        <p v-if="balance" class="md-body-sm balance-line">
          {{ balance.counts.DEF + balance.counts.GK }} verdedigers ·
          {{ balance.counts.MID }} midden ·
          {{ balance.counts.ATT + balance.counts.WB }} aanvallers
          <span v-if="balance.needsAttackFocus" class="balance-hint"> — extra aanvalsoefeningen</span>
          <span v-else-if="balance.needsDefenceFocus" class="balance-hint"> — extra verdedigingsoefeningen</span>
        </p>
      </section>

      <!-- Settings -->
      <section class="card card-elevated section">
        <div class="settings-grid">
          <div class="field-wrap">
            <label class="field-label">Type training</label>
            <select class="field field-select" v-model="trainingType">
              <option v-for="t in TRAINING_TYPES" :key="t.id" :value="t.id">{{ t.label }}</option>
            </select>
          </div>
          <div class="field-wrap">
            <label class="field-label">Duur (min)</label>
            <input class="field" type="number" v-model.number="durationMin" min="30" max="120" step="5" />
          </div>
        </div>
        <p class="md-body-sm cycle-info">
          Weekthema (cyclus week {{ syncedCycleWeek }}/4): <strong>{{ cycleThemeLabel }}</strong>
        </p>
        <div class="action-row">
          <button class="btn btn-filled" @click="generate" :disabled="!presentPlayers.length">
            <span class="material-symbols-rounded" style="font-size:18px">auto_fix_high</span>
            Genereer training
          </button>
          <button class="btn btn-tonal" @click="showManual = !showManual">
            <span class="material-symbols-rounded" style="font-size:18px">library_books</span>
            {{ showManual ? 'Verberg bibliotheek' : 'Handmatig kiezen' }}
          </button>
        </div>
      </section>

      <!-- Manual browse -->
      <section v-if="showManual" class="card card-elevated section">
        <div class="section-head">
          <div>
            <p class="md-title-sm">Oefeningenbibliotheek</p>
            <p class="md-label-sm" style="color:var(--md-on-surface-variant)">{{ manualExercises.length }} oefeningen</p>
          </div>
          <button class="btn btn-tonal" style="height:36px" @click="showCustomDialog = true">
            <span class="material-symbols-rounded" style="font-size:18px">draw</span>
            Eigen oefening
          </button>
        </div>
        <div class="manual-list">
          <button
            v-for="ex in manualExercises"
            :key="ex.id"
            class="manual-item"
            @click="addManualExercise(ex)"
          >
            <div class="manual-item-body">
              <p class="md-label-lg manual-title">
                <span
                  v-if="isCustomExercise(ex)"
                  class="custom-ex-badge"
                  title="Eigen oefening"
                >
                  <span class="material-symbols-rounded" aria-hidden="true">draw</span>
                </span>
                <span class="manual-title-text">{{ getExerciseTitle(ex) }}</span>
              </p>
              <p class="md-body-sm manual-meta">
                {{ categoryLabel(ex.category) }} · {{ ex.durationMin }} min · {{ playerRangeLabel(ex) }}
              </p>
            </div>
            <span class="material-symbols-rounded manual-add">add</span>
          </button>
        </div>
      </section>

      <!-- Session overview -->
      <section v-if="sessionBlocks.length" class="card card-elevated section">
        <div class="section-head">
          <div>
            <p class="md-title-sm">Trainingsoverzicht</p>
            <p class="md-label-sm saved-hint">Automatisch opgeslagen per team</p>
          </div>
          <div class="section-head-actions">
            <p class="md-label-md" :class="{ 'time-warn': totalMin !== durationMin }">
              {{ totalMin }} / {{ durationMin }} min
            </p>
            <button class="btn btn-tonal" style="height:36px" @click="shareTraining" title="Deel via WhatsApp">
              <span class="material-symbols-rounded" style="font-size:18px">share</span>
              Delen
            </button>
          </div>
        </div>
        <div
          class="session-list"
          @dragover.prevent
        >
          <div
            v-for="(block, i) in sessionBlocks"
            :key="block.uid"
            class="session-row"
            :class="{ 'drag-over': dragOverIndex === i, 'is-dragging': dragIndex === i }"
            :data-session-index="i"
            @dragover.prevent="onDragOver(i)"
            @drop.prevent="onDrop(i)"
          >
            <button
              class="drag-handle btn-icon"
              draggable="true"
              aria-label="Sleep om te verplaatsen"
              @dragstart="onDragStart(i, $event)"
              @dragend="onDragEnd"
              @touchstart.passive="onTouchStart(i)"
              @touchmove.prevent="onTouchMove"
              @touchend="onTouchEnd"
            >
              <span class="material-symbols-rounded">drag_indicator</span>
            </button>
            <span class="session-num md-label-md">{{ i + 1 }}</span>
            <button class="session-info session-info-btn" @click="openDetail(block)">
              <p class="md-title-sm session-title">
                <span
                  v-if="isCustomExercise(block.exercise)"
                  class="custom-ex-badge"
                  title="Eigen oefening"
                >
                  <span class="material-symbols-rounded" aria-hidden="true">draw</span>
                </span>
                <span class="session-title-text">{{ getExerciseTitle(block.exercise) }}</span>
              </p>
              <p class="md-body-sm" style="color:var(--md-on-surface-variant)">
                {{ categoryLabel(block.exercise.category) }} · {{ playerRangeLabel(block.exercise) }}
              </p>
            </button>
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
            <button class="btn-icon" @click="removeBlock(i)" aria-label="Verwijderen" style="color:var(--md-error)">
              <span class="material-symbols-rounded">delete</span>
            </button>
          </div>
        </div>
      </section>
    </template>

    <!-- Exercise detail -->
    <ExerciseDetailDialog
      :block="detailBlock"
      :player-count="presentPlayers.length"
      show-feedback
      @close="detailBlock = null"
      @feedback="giveFeedback"
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
import { ref, computed, watch, onMounted } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { TRAINING_TYPES, EXERCISE_CATEGORIES, getExerciseById } from '@/data/exercises'
import { generateTraining, getCycleTheme, getCycleThemeLabel, browseExercises, analyzePlayerBalance } from '@/utils/trainingEngine'
import { encodeTrainingSession, buildTrainingShareUrl } from '@/utils/trainingShare'
import { getKnvbLevel } from '@/data/knvbClasses'
import ExerciseDetailDialog from '@/components/training/ExerciseDetailDialog.vue'
import CustomExerciseDialog from '@/components/training/CustomExerciseDialog.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { playerRangeLabel, getExerciseTitle, isCustomExercise } from '@/utils/exerciseText'

const store = useTeamStore()

const activeTeam = computed(() => store.activeTeam)
const knvbClassConfig = computed(() => store.knvbClassConfig)
const roster = computed(() => activeTeam.value?.players ?? [])
const trainingState = computed(() => store.getTrainingState())

const presentIds = ref(new Set())
const trainingType = ref('gemengd')
const durationMin = ref(60)
const sessionBlocks = ref([])
const showManual = ref(false)
const showCustomDialog = ref(false)
const detailBlock = ref(null)
const dragIndex = ref(null)
const dragOverIndex = ref(null)
let nextBlockUid = 1
let touchDragIndex = null

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

onMounted(() => loadDraft())

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

function onDragStart(index, e) {
  dragIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(index))
}

function onDragOver(index) {
  if (dragIndex.value === null) return
  dragOverIndex.value = index
}

function onDrop(index) {
  reorderBlocks(dragIndex.value, index)
  onDragEnd()
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function reorderBlocks(from, to) {
  if (from == null || to == null || from === to) return
  const arr = [...sessionBlocks.value]
  const [item] = arr.splice(from, 1)
  arr.splice(to, 0, item)
  sessionBlocks.value = arr
}

function onTouchStart(index) {
  touchDragIndex = index
  dragIndex.value = index
}

function onTouchMove(e) {
  if (touchDragIndex === null) return
  const touch = e.touches[0]
  const el = document.elementFromPoint(touch.clientX, touch.clientY)
  const row = el?.closest('[data-session-index]')
  if (!row) return
  const overIndex = Number(row.dataset.sessionIndex)
  if (!Number.isNaN(overIndex)) dragOverIndex.value = overIndex
}

function onTouchEnd() {
  if (touchDragIndex !== null && dragOverIndex.value !== null) {
    reorderBlocks(touchDragIndex, dragOverIndex.value)
    persistDraft()
  }
  touchDragIndex = null
  onDragEnd()
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

const totalMin = computed(() =>
  sessionBlocks.value.reduce((s, b) => s + b.durationMin, 0)
)

const manualExercises = computed(() => {
  const custom = store.getCustomExercises(store.activeTeamId)
  const builtIn = browseExercises({
    ageGroup: activeTeam.value?.ageGroup,
    knvbLevel: getKnvbLevel(activeTeam.value?.knvbClass),
  })
  return [...custom, ...builtIn].sort((a, b) =>
    getExerciseTitle(a).localeCompare(getExerciseTitle(b), 'nl')
  )
})

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
    feedback: trainingState.value.exerciseFeedback ?? {},
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
  showSnackbar(`Training gegenereerd (${result.totalMin} min)`)
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
  sessionBlocks.value = [...sessionBlocks.value, makeBlock(ex, ex.durationMin)]
  showSnackbar(`${getExerciseTitle(ex)} toegevoegd`)
  persistDraft()
}

function onCustomExerciseSaved(exercise) {
  store.addCustomExercise(store.activeTeamId, exercise)
  showCustomDialog.value = false
  showManual.value = true
  showSnackbar(`"${exercise.title}" opgeslagen in je bibliotheek`)
}

function openDetail(block) {
  detailBlock.value = block
}

function giveFeedback(exerciseId, type) {
  store.recordExerciseFeedback(store.activeTeamId, exerciseId, {
    like: type === 'like',
    dislike: type === 'dislike',
  })
  showSnackbar('Feedback opgeslagen — volgende training leert hiervan')
}
</script>

<style scoped>
.training-header { margin-bottom: var(--sp-4); }
.section { padding: var(--sp-4); margin-bottom: var(--sp-4); }
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-3);
}
.player-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}
.balance-line { margin-top: var(--sp-3); color: var(--md-on-surface-variant); }
.balance-hint { color: var(--md-primary); font-weight: 500; }
.settings-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-bottom: var(--sp-3);
}
@media (max-width: 480px) { .settings-grid { grid-template-columns: 1fr; } }
.cycle-info { color: var(--md-on-surface-variant); margin-bottom: var(--sp-3); }
.action-row { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
.section-head-actions { display: flex; align-items: center; gap: var(--sp-2); flex-wrap: wrap; }
.saved-hint { color: var(--md-outline); margin-top: 2px; }
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
  transition: background var(--md-duration-short), opacity var(--md-duration-short);
}
.session-row.is-dragging { opacity: 0.45; }
.session-row:hover {
  background: color-mix(in srgb, var(--md-on-surface) 4%, transparent);
}
.session-row.drag-over {
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
  box-shadow: inset 0 0 0 2px var(--md-primary);
}
.drag-handle {
  flex-shrink: 0;
  cursor: grab;
  color: var(--md-on-surface-variant);
  touch-action: none;
}
.drag-handle:active { cursor: grabbing; }
.session-info-btn {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  padding: var(--sp-1) var(--sp-2);
  border-radius: var(--md-shape-sm);
}
.session-info-btn:hover { background: color-mix(in srgb, var(--md-on-surface) 4%, transparent); }
.session-duration {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.duration-input {
  width: 3.25rem;
  min-width: 3.25rem;
  padding: var(--sp-2) var(--sp-2);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  font: inherit;
  font-size: 15px;
  text-align: center;
  background: var(--md-surface);
  color: var(--md-on-surface);
  -moz-appearance: textfield;
}
.duration-input::-webkit-outer-spin-button,
.duration-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.duration-suffix { color: var(--md-on-surface-variant); white-space: nowrap; }
.session-num {
  width: 28px;
  height: 28px;
  border-radius: var(--md-shape-full);
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.session-info { flex: 1; min-width: 0; }
.time-warn { color: var(--md-tertiary); }
.manual-list { display: flex; flex-direction: column; gap: var(--sp-1); max-height: min(420px, 50vh); overflow-y: auto; }
.manual-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
  padding: var(--sp-3);
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: var(--md-shape-md);
  text-align: left;
  width: 100%;
}
.manual-item-body {
  flex: 1;
  min-width: 0;
}
.manual-title,
.session-title {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  margin: 0;
  min-width: 0;
}
.manual-title-text,
.session-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.manual-meta {
  margin: 2px 0 0;
  color: var(--md-on-surface-variant);
}
.manual-add {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
}
.manual-item:hover { background: color-mix(in srgb, var(--md-on-surface) 6%, transparent); }
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
.empty-icon { font-size: 48px; color: var(--md-outline); display: block; margin-bottom: var(--sp-3); }
</style>
