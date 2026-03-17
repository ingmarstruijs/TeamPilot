<template>
  <!-- Responsive football pitch rendered as an SVG overlay on a div -->
  <div class="field-wrapper" ref="wrapperRef">
    <div
      class="pitch"
      ref="fieldRef"
      :id="exportId"
      :style="{ '--field-color': teamColor }"
      @dragover.prevent
      @drop="onFieldDrop"
      @touchmove.prevent="onTouchMove"
      @touchend="onTouchEnd"
    >
      <!-- Pitch markings SVG (decorative) -->
      <svg class="field-markings" viewBox="0 0 100 160" preserveAspectRatio="none">
        <!-- Grass stripes -->
        <rect x="0"  y="0"   width="100" height="20" fill="rgba(0,0,0,.04)" />
        <rect x="0"  y="40"  width="100" height="20" fill="rgba(0,0,0,.04)" />
        <rect x="0"  y="80"  width="100" height="20" fill="rgba(0,0,0,.04)" />
        <rect x="0"  y="120" width="100" height="20" fill="rgba(0,0,0,.04)" />

        <!-- Outer border -->
        <rect x="2" y="2" width="96" height="156" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5" />

        <!-- Centre line -->
        <line x1="2" y1="80" x2="98" y2="80" stroke="rgba(255,255,255,.6)" stroke-width="1" />

        <!-- Centre circle -->
        <circle cx="50" cy="80" r="15" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1" />
        <circle cx="50" cy="80" r="1.2" fill="rgba(255,255,255,.6)" />

        <!-- Top penalty area (opponent) -->
        <rect x="22" y="2" width="56" height="28" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1" />
        <rect x="35" y="2" width="30" height="12" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1" />
        <!-- Top goal -->
        <rect x="40" y=".5" width="20" height="5" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.6)" stroke-width="1" />

        <!-- Bottom penalty area (own goal) -->
        <rect x="22" y="130" width="56" height="28" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1" />
        <rect x="35" y="146" width="30" height="12" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1" />
        <!-- Bottom goal -->
        <rect x="40" y="154.5" width="20" height="5" fill="rgba(255,255,255,.15)" stroke="rgba(255,255,255,.6)" stroke-width="1" />

        <!-- Penalty spots -->
        <circle cx="50" cy="22" r="1" fill="rgba(255,255,255,.6)" />
        <circle cx="50" cy="138" r="1" fill="rgba(255,255,255,.6)" />

        <!-- Corner arcs -->
        <path d="M 2 8 A 6 6 0 0 0 8 2"   fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1" />
        <path d="M 92 2 A 6 6 0 0 0 98 8"  fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1" />
        <path d="M 2 152 A 6 6 0 0 1 8 158" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1" />
        <path d="M 92 158 A 6 6 0 0 1 98 152" fill="none" stroke="rgba(255,255,255,.5)" stroke-width="1" />
      </svg>

      <!-- Player tokens on field -->
      <PlayerToken
        v-for="slot in filledSlots"
        :key="slot.slotId"
        :player="slot.player"
        :x="slot.x"
        :y="slot.y"
        :team-color="teamColor"
        :is-dragging="draggingId === slot.slotId"
        @drag-start="onTokenDragStart($event, slot)"
        @touch-start="onTokenTouchStart($event, slot)"
        @remove="removeFromSlot(slot.slotId)"
      />

      <!-- Empty slot indicators -->
      <div
        v-for="slot in emptySlots"
        :key="slot.slotId"
        class="empty-slot"
        :style="posStyle(slot.x, slot.y)"
        :class="{ 'drop-target': dragOverSlot === slot.slotId }"
        @dragover.prevent="dragOverSlot = slot.slotId"
        @dragleave="dragOverSlot = null"
        @drop.stop="onSlotDrop(slot)"
      >
        <span class="empty-slot-label">{{ shortPosition(slot.position) }}</span>
      </div>
    </div>

    <!-- Touch ghost -->
    <div
      v-if="touchGhost"
      class="touch-ghost"
      :style="{ left: touchGhost.x + 'px', top: touchGhost.y + 'px', background: teamColor }"
    >
      {{ touchGhost.initials }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import PlayerToken from './PlayerToken.vue'

const props = defineProps({
  slots:       { type: Array, required: true }, // [{ slotId, position, x, y, playerId? }]
  players:     { type: Object, required: true }, // id → player map
  teamColor:   { type: String, default: '#1a6b3c' },
  exportId:    { type: String, default: 'field-export' },
})

const emit = defineEmits(['slot-drop', 'remove-from-slot'])

// ── Computed helpers ─────────────────────────────────────────
const filledSlots = computed(() =>
  props.slots
    .filter(s => s.playerId && props.players[s.playerId])
    .map(s => ({ ...s, player: props.players[s.playerId] }))
)
const emptySlots = computed(() =>
  props.slots.filter(s => !s.playerId)
)

function posStyle(xPct, yPct) {
  return {
    position: 'absolute',
    left: `${xPct}%`,
    top:  `${yPct}%`,
    transform: 'translate(-50%, -50%)',
  }
}

function shortPosition(pos) {
  const map = { GK: 'K', DEF: 'V', MID: 'M', ATT: 'A', WB: 'WB' }
  return map[pos] ?? pos
}

// ── Drag & Drop (HTML5 — desktop) ────────────────────────────
const draggingId   = ref(null)
const draggingData = ref(null)
const dragOverSlot = ref(null)
const wrapperRef   = ref(null)
const fieldRef     = ref(null)

function onTokenDragStart(event, slot) {
  draggingId.value   = slot.slotId
  draggingData.value = { type: 'slot', slot }
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('application/json', JSON.stringify({ type: 'slot', slotId: slot.slotId }))
}

function onFieldDrop(event) {
  dragOverSlot.value = null
  draggingId.value   = null
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) { draggingData.value = null; return }
  const parsed = JSON.parse(raw)
  // For slot drags, prefer draggingData which carries the full slot object
  const data = (parsed.type === 'slot' && draggingData.value) ? draggingData.value : parsed
  draggingData.value = null
  const rect = fieldRef.value.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width)  * 100
  const y = ((event.clientY - rect.top)  / rect.height) * 100
  emit('slot-drop', { ...data, targetX: x, targetY: y, targetSlotId: null })
}

function onSlotDrop(targetSlot) {
  dragOverSlot.value = null
  draggingId.value   = null
  const raw = draggingData.value
  if (!raw) return
  emit('slot-drop', { ...raw, targetSlotId: targetSlot.slotId, targetX: targetSlot.x, targetY: targetSlot.y })
  draggingData.value = null
}

function removeFromSlot(slotId) {
  emit('remove-from-slot', slotId)
}

// ── Touch drag (mobile) ─────────────────────────────────────
const touchGhost    = ref(null)
const touchSlot     = ref(null)
const touchPlayerId = ref(null)
const touchBenchId  = ref(null)

function playerInitials(player) {
  const parts = player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function onTokenTouchStart(event, slot) {
  const touch = event.touches[0]
  touchSlot.value = slot
  touchGhost.value = {
    x: touch.clientX - 24,
    y: touch.clientY - 24,
    initials: playerInitials(slot.player),
  }
}

function onTouchMove(event) {
  if (!touchGhost.value) return
  const touch = event.touches[0]
  touchGhost.value = { ...touchGhost.value, x: touch.clientX - 24, y: touch.clientY - 24 }
}

function onTouchEnd(event) {
  if (!touchGhost.value || !touchSlot.value) return
  const touch = event.changedTouches[0]
  const rect  = fieldRef.value.getBoundingClientRect()
  const x = ((touch.clientX - rect.left) / rect.width)  * 100
  const y = ((touch.clientY - rect.top)  / rect.height) * 100

  // Check if dropped on an empty slot
  const target = props.slots.find(s => {
    if (s.playerId) return false
    const dx = Math.abs(s.x - x)
    const dy = Math.abs(s.y - y)
    return dx < 8 && dy < 8
  })

  emit('slot-drop', {
    type: 'slot',
    slot: touchSlot.value,
    targetSlotId: target?.slotId ?? null,
    targetX: target ? target.x : x,
    targetY: target ? target.y : y,
  })

  touchGhost.value = null
  touchSlot.value  = null
}
</script>

<style scoped>
.field-wrapper {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}
.pitch {
  position: relative;
  /* Mobile: height-driven — fills container, width computed from aspect-ratio */
  height: 100%;
  width: auto;
  max-width: 100%;
  aspect-ratio: 5 / 8;
  background: color-mix(in srgb, var(--field-color, #059669) 85%, #065f46);
  border-radius: var(--md-shape-md);
  overflow: hidden;
  box-shadow: var(--md-elevation-3);
  touch-action: none;
}
@media (min-width: 720px) {
  .field-wrapper {
    flex: unset;
    min-height: unset;
    display: block;
  }
  .pitch {
    /* Desktop: width-driven — fills column, height from aspect-ratio */
    height: auto;
    width: 100%;
    max-width: unset;
  }
}
.field-markings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.empty-slot {
  position: absolute;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px dashed rgba(255,255,255,.5);
  background: rgba(0,0,0,.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(-50%, -50%);
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
}
.empty-slot.drop-target {
  background: rgba(255,255,255,.25);
  border-color: rgba(255,255,255,.9);
}
.empty-slot-label {
  color: rgba(255,255,255,.7);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .5px;
}

/* Touch ghost */
.touch-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 15px;
  opacity: .85;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  transform: scale(1.1);
}
</style>
