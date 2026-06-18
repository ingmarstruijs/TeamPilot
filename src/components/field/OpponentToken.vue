<template>
  <div
    class="opponent-token"
    :class="{ 'is-dragging': isDragging }"
    :style="posStyle"
    :draggable="true"
    @dragstart="onDragStart"
    @touchstart.passive="onTouchStart"
  >
    <div class="token-avatar">
      <ShirtAvatar :shirt="teamShirt" :initials="String(number)" :size="38" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const props = defineProps({
  slotId:    { type: String, required: true },
  number:    { type: Number, required: true },
  x:         { type: Number, required: true },
  y:         { type: Number, required: true },
  teamShirt: { type: Object, required: true },
  isDragging:{ type: Boolean, default: false },
})

const emit = defineEmits(['drag-start', 'touch-start'])

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
.opponent-token {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  z-index: 5;
  cursor: grab;
  user-select: none;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
  transition: opacity var(--md-duration-short);
}

.opponent-token:active {
  cursor: grabbing;
}

.opponent-token.is-dragging {
  opacity: .25;
  z-index: 15;
  cursor: grabbing;
}

.token-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,.3);
  border: 2px solid rgba(255,255,255,.55);
  opacity: .92;
}
</style>
