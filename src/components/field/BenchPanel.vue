<template>
  <div class="bench-panel" :class="{ 'bench-h': horizontal, 'drop-target': isDragOverBench }" @dragover.prevent="isDragOverBench=true" @dragleave="isDragOverBench=false" @drop.prevent="onBenchDrop">
    <p class="bench-title md-label-lg">
      <span class="material-symbols-rounded" style="font-size:16px;vertical-align:text-bottom">weekend</span>
      <span class="bench-title-text">{{ t('bench.title') }}</span>
      <span v-if="horizontal && benchPlayers.length" class="bench-count">{{ benchPlayers.length }}</span>
    </p>
    <div class="bench-scroll">
      <div
        v-for="player in benchPlayers"
        :key="player.id"
        class="bench-player"
        draggable="true"
        @dragstart="onDragStart($event, player)"
        @touchstart.passive="onTouchStart($event, player)"
        :class="{ dragging: draggingPlayerId === player.id }"
      >
        <ShirtAvatar :shirt="teamShirt" :initials="initials(player)" :size="28" />
        <span class="bp-name md-label-sm">{{ shortName(player) }}</span>
        <span v-if="player.number" class="bp-num">#{{ player.number }}</span>
        <span v-if="player.guest" class="bp-guest">{{ t('players.guest') }}</span>
      </div>
      <div v-if="!benchPlayers.length" class="bench-empty">
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
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

function initials(player) {
  const parts = player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function shortName(player) {
  const parts = player.name.trim().split(/\s+/)
  const first = parts[0]
  const last  = parts.length > 1 ? parts[parts.length - 1] : ''
  const display = last ? `${first} ${last[0]}.` : first
  return display.length > 14 ? display.slice(0, 13) + '…' : display
}

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

/* Vertical (desktop): full list, no height cap */
.bench-scroll {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
  padding: 2px;
  max-height: none;
  overflow-y: auto;
}

/* Horizontal (mobile): single-row scroll strip */
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

.bench-player {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  background: var(--md-surface);
  border-radius: var(--md-shape-full);
  padding: 4px 10px 4px 4px;
  cursor: grab;
  touch-action: none;
  transition: box-shadow var(--md-duration-short), opacity var(--md-duration-short);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--md-elevation-1);
  flex-shrink: 0;
}
.bench-player:active,
.bench-player.dragging { opacity: .5; cursor: grabbing; }

.bp-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}
.bp-name { font-size: 12px; color: var(--md-on-surface); }
.bp-num  { font-size: 10px; color: var(--md-on-surface-variant); }
.bp-guest {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .2px;
  padding: 1px 5px;
  border-radius: var(--md-shape-full);
  background: var(--md-secondary-container);
  color: var(--md-on-secondary-container);
}

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
</style>
