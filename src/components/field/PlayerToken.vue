<template>
  <div
    class="player-token"
    :class="{ 'is-dragging': isDragging }"
    :style="{ ...posStyle, '--tc': teamColor }"
    :draggable="true"
    @dragstart="onDragStart"
    @touchstart.passive="onTouchStart"
  >
    <div class="token-avatar" :style="{ background: teamColor }">
      {{ initials }}
    </div>
    <div class="token-name">{{ shortName }}</div>
    <button class="token-remove" @click.stop="$emit('remove')" @touchend.stop="$emit('remove')"
      aria-label="Verwijder van veld">×</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  player:    { type: Object, required: true },
  x:         { type: Number, required: true },
  y:         { type: Number, required: true },
  teamColor: { type: String, default: '#1a6b3c' },
  isDragging:{ type: Boolean, default: false },
})

const emit = defineEmits(['drag-start', 'touch-start', 'remove'])

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
  emit('touch-start', e)
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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  border: 2.5px solid rgba(255,255,255,.75);
  box-shadow: 0 2px 8px rgba(0,0,0,.35);
  position: relative;
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

/* Show remove button on hover/touch */
.player-token:hover .token-remove,
.player-token:focus-within .token-remove {
  display: flex;
}
.token-avatar { position: relative; }
.token-remove { position: absolute; top: -4px; right: -4px; }

@media (hover: none) {
  /* On touch devices, always show remove */
  .token-remove { display: flex; }
}
</style>
