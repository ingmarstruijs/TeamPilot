<template>
  <div
    class="player-token"
    :class="{ 'is-dragging': isDragging }"
    :style="posStyle"
    :draggable="true"
    @dragstart="onDragStart"
    @touchstart.passive="onTouchStart"
    @touchmove="onTouchMove"
    @touchend="onTouchEnd"
  >
    <div class="token-avatar">
      <ShirtAvatar :shirt="teamShirt" :initials="initials" :size="42" />
    </div>
    <span v-if="player.number != null" class="token-number">{{ player.number }}</span>
    <div class="token-name">{{ shortName }}</div>
    <button class="token-remove" @click.stop="$emit('remove')" @touchend.stop="$emit('remove')"
      aria-label="Verwijder van veld">×</button>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const props = defineProps({
  player:    { type: Object, required: true },
  x:         { type: Number, required: true },
  y:         { type: Number, required: true },
  teamShirt: { type: Object, default: () => ({ style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }) },
  isDragging:{ type: Boolean, default: false },
})

const emit = defineEmits(['drag-start', 'touch-start', 'remove'])

const longPressTimer = ref(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const LONG_PRESS_DURATION = 500 // ms
const DRAG_THRESHOLD = 10 // px

const initials = computed(() => {
  const parts = props.player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const shortName = computed(() => {
  const parts = props.player.name.trim().split(/\s+/)
  // Show first name or shortened version
  return parts[0].length > 8 ? parts[0].slice(0, 7) + '.' : parts[0]
})

const posStyle = computed(() => ({
  position: 'absolute',
  left:  `${props.x}%`,
  top:   `${props.y}%`,
  transform: 'translate(-50%, -50%)',
}))

function onDragStart(e) {
  emit('drag-start', e)
}

function onTouchStart(e) {
  const touch = e.touches[0]
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
  
  // Start long-press timer
  longPressTimer.value = setTimeout(() => {
    emit('remove')
  }, LONG_PRESS_DURATION)
  
  emit('touch-start', e)
}

function onTouchMove(e) {
  if (!longPressTimer.value) return
  const touch = e.touches[0]
  const deltaX = Math.abs(touch.clientX - touchStartX.value)
  const deltaY = Math.abs(touch.clientY - touchStartY.value)
  
  // If moved beyond threshold, cancel long-press (it's a drag)
  if (deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}

function onTouchEnd() {
  // Cancel long-press timer if still active
  if (longPressTimer.value) {
    clearTimeout(longPressTimer.value)
    longPressTimer.value = null
  }
}
</script>

<style scoped>
.player-token {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: grab;
  z-index: 10;
  transition: transform var(--md-duration-short), opacity var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.player-token:active, .player-token.is-dragging {
  opacity: .6;
  transform: translate(-50%, -50%) scale(1.15) !important;
  cursor: grabbing;
  z-index: 50;
}

.token-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.35);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.token-number {
  position: absolute;
  top: 28px;
  right: -1px;
  background: rgba(0,0,0,.75);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  border-radius: 4px;
  padding: 0 3px;
  line-height: 14px;
  min-width: 14px;
  text-align: center;
  pointer-events: none;
  z-index: 20;
}

.token-name {
  background: rgba(0,0,0,.6);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .3px;
  padding: 1px 5px;
  border-radius: 4px;
  white-space: nowrap;
  max-width: 60px;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 14px;
}

.token-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: rgba(200,30,30,.9);
  color: white;
  border: none;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* Show remove button on hover/touch (desktop only) */
.player-token:hover .token-remove,
.player-token:focus-within .token-remove {
  display: flex;
}

/* Hide remove button on mobile (use long-press instead) */
@media (max-width: 720px) {
  .token-remove {
    display: none !important;
  }
}
</style>
