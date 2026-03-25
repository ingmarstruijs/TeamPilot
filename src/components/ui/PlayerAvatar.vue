<template>
  <div
    class="player-avatar"
    :class="[`size-${size}`, { dragging }]"
    :title="player.name"
  >
    <ShirtAvatar :shirt="shirt" :initials="initials" :size="sizeMap[size]" />
    <span v-if="player.number != null" class="avatar-number">{{ player.number }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const props = defineProps({
  player:   { type: Object, required: true },
  size:     { type: String, default: 'md' }, // xs | sm | md | lg
  shirt:    { type: Object, default: () => ({ style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }) },
  dragging: { type: Boolean, default: false },
})

const sizeMap = { xs: 32, sm: 40, md: 48, lg: 56 }

const initials = computed(() => {
  const parts = props.player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})
</script>

<style scoped>
.player-avatar {
  border-radius: 50%;
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
.size-sm { width: 40px; height: 40px; }
.size-md { width: 48px; height: 48px; }
.size-lg { width: 56px; height: 56px; }

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
