<template>
  <div class="bench-panel" :class="{ 'bench-h': horizontal, 'drop-target': isDragOverBench }" @dragover.prevent="isDragOverBench=true" @dragleave="isDragOverBench=false" @drop.prevent="onBenchDrop">
    <p class="bench-title md-label-lg">
      <span class="material-symbols-rounded" style="font-size:16px;vertical-align:text-bottom">weekend</span>
      <span class="bench-title-text">{{ t('bench.title') }}</span>
      <span v-if="horizontal && availablePlayers.length" class="bench-count">{{ availablePlayers.length }}</span>
    </p>
    <div class="bench-scroll">
      <RosterChip
        v-for="player in availablePlayers"
        :key="player.id"
        class="bench-player"
        :player="player"
        :shirt="teamShirt"
        :dragging="draggingPlayerId === player.id"
        draggable="true"
        @dragstart="onDragStart($event, player)"
        @touchstart.passive="onTouchStart($event, player)"
      />
      <div v-if="!availablePlayers.length" class="bench-empty">
        <span class="md-body-sm">{{ t('bench.allOnField') }}</span>
      </div>
      <button
        v-if="canAddGuest"
        type="button"
        class="bench-add-guest"
        @click="$emit('add-guest')"
      >
        <span class="material-symbols-rounded" aria-hidden="true">person_add</span>
        {{ t('bench.addGuest') }}
      </button>
    </div>

    <section v-if="unavailablePlayers.length" class="bench-unavailable">
      <button type="button" class="bench-unavailable-toggle" @click="showUnavailable = !showUnavailable">
        <span class="material-symbols-rounded">{{ showUnavailable ? 'expand_less' : 'expand_more' }}</span>
        {{ t('bench.unavailable', { count: unavailablePlayers.length }) }}
      </button>
      <div v-if="showUnavailable" class="bench-scroll bench-unavailable-list">
        <RosterChip
          v-for="player in unavailablePlayers"
          :key="player.id"
          class="bench-player"
          :player="player"
          :shirt="teamShirt"
          static-chip
        />
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import RosterChip from '@/components/ui/RosterChip.vue'
import { splitBenchPlayers } from '@/utils/playerStatus'
import { t } from '@/i18n'

const props = defineProps({
  benchPlayers: { type: Array, required: true },
  teamShirt:    { type: Object, default: () => ({ style: 'solid', primary: '#059669', secondary: '#ffffff' }) },
  horizontal:   { type: Boolean, default: false },
  canAddGuest:  { type: Boolean, default: false },
})

const emit = defineEmits(['bench-drag-start', 'bench-touch-start', 'field-drop', 'add-guest'])

const draggingPlayerId = ref(null)
const isDragOverBench = ref(false)
const showUnavailable = ref(true)

const availablePlayers = computed(() => splitBenchPlayers(props.benchPlayers).available)
const unavailablePlayers = computed(() => splitBenchPlayers(props.benchPlayers).unavailable)

function onDragStart(event, player) {
  draggingPlayerId.value = player.id
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({ type: 'bench', playerId: player.id }))
  emit('bench-drag-start', { event, player })
  setTimeout(() => { draggingPlayerId.value = null }, 200)
}

function onTouchStart(event, player) {
  emit('bench-touch-start', { event, player })
}

function onBenchDrop(event) {
  isDragOverBench.value = false
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) return
  const data = JSON.parse(raw)
  if (data.type === 'slot') {
    emit('field-drop', { slotId: data.slotId })
  }
}
</script>

<style scoped>
.bench-panel {
  background: var(--md-surface-variant);
  border-radius: var(--md-shape-md);
  padding: var(--sp-3);
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
}
.bench-panel.drop-target {
  background: color-mix(in srgb, var(--md-primary) 15%, var(--md-surface-variant));
  border: 2px solid var(--md-primary);
}
.bench-title {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  margin-bottom: var(--sp-2);
  color: var(--md-on-surface-variant);
}
.bench-title-text { flex: 1; }
.bench-count {
  font-size: 11px;
  font-weight: 700;
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border-radius: var(--md-shape-full);
  padding: 1px 7px;
}

.bench-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding: 2px;
  max-height: none;
  overflow-y: auto;
}

.bench-h { padding: var(--sp-2) var(--sp-3); }
.bench-h .bench-title { margin-bottom: var(--sp-1); }
.bench-h .bench-title-text { display: none; }
.bench-h .bench-scroll {
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 4px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.bench-h .bench-scroll::-webkit-scrollbar { display: none; }

.bench-empty {
  color: var(--md-on-surface-variant);
  padding: var(--sp-2) var(--sp-1);
  white-space: nowrap;
}

.bench-add-guest {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
  margin-top: var(--sp-2);
  padding: var(--sp-2) var(--sp-3);
  background: transparent;
  border: 1px dashed var(--md-outline);
  border-radius: var(--md-shape-md);
  color: var(--md-primary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.bench-add-guest .material-symbols-rounded {
  font-size: 18px;
}

.bench-unavailable {
  margin-top: var(--sp-3);
  padding-top: var(--sp-2);
  border-top: 1px dashed var(--md-outline-variant);
}
.bench-unavailable-toggle {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  width: 100%;
  margin-bottom: var(--sp-2);
  padding: 0;
  background: transparent;
  border: none;
  color: var(--md-on-surface-variant);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}
.bench-unavailable-toggle .material-symbols-rounded {
  font-size: 18px;
}
</style>
