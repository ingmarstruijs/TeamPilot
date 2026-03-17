<template>
  <div class="bench-panel" :class="{ 'bench-h': horizontal }">
    <p class="bench-title md-label-lg">
      <span class="material-symbols-rounded" style="font-size:16px;vertical-align:text-bottom">weekend</span>
      <span class="bench-title-text">Bank / Beschikbare spelers</span>
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
      </div>
      <div v-if="!benchPlayers.length" class="bench-empty">
        <span class="md-body-sm">Alle spelers staan opgesteld</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const props = defineProps({
  benchPlayers: { type: Array, required: true },
  teamShirt:    { type: Object, default: () => ({ style: 'solid', primary: '#059669', secondary: '#ffffff' }) },
  horizontal:   { type: Boolean, default: false },
})

const emit = defineEmits(['bench-drag-start', 'bench-touch-start'])

const draggingPlayerId = ref(null)

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
</script>

<style scoped>
.bench-panel {
  background: var(--md-surface-variant);
  border-radius: var(--md-shape-md);
  padding: var(--sp-3);
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

.bench-empty {
  color: var(--md-on-surface-variant);
  padding: var(--sp-2) var(--sp-1);
  white-space: nowrap;
}
</style>
