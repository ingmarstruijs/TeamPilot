<template>
  <div
    class="player-avatar"
    :class="[`size-${size}`, { dragging }]"
    :style="{ background: color, border: `2px solid ${borderColor}` }"
    :title="player.name"
  >
    <span class="avatar-initials">{{ initials }}</span>
    <span v-if="player.number != null" class="avatar-number">{{ player.number }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  player: { type: Object, required: true },
  size:   { type: String, default: 'md' }, // xs | sm | md | lg
  color:  { type: String, default: '#1a6b3c' },
  borderColor: { type: String, default: 'rgba(255,255,255,0.6)' },
  dragging: { type: Boolean, default: false },
})

const initials = computed(() => {
  const parts = props.player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})
</script>

<style scoped>
.player-avatar {
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  position: relative;
  flex-shrink: 0;
  transition: transform var(--md-duration-short), box-shadow var(--md-duration-short);
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
}
.player-avatar.dragging {
  transform: scale(1.15);
  box-shadow: 0 8px 24px rgba(0,0,0,.35);
  cursor: grabbing;
  z-index: 1000;
}

/* Sizes */
.size-xs { width: 32px; height: 32px; }
.size-xs .avatar-initials { font-size: 10px; }
.size-sm { width: 40px; height: 40px; }
.size-sm .avatar-initials { font-size: 13px; }
.size-md { width: 48px; height: 48px; }
.size-md .avatar-initials { font-size: 15px; }
.size-lg { width: 56px; height: 56px; }
.size-lg .avatar-initials { font-size: 18px; }

.avatar-initials { line-height: 1; }
.avatar-number {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: rgba(0,0,0,.65);
  color: #fff;
  font-size: 9px;
  font-weight: 700;
  border-radius: 6px;
  padding: 0 3px;
  line-height: 14px;
  min-width: 14px;
  text-align: center;
}
</style>
