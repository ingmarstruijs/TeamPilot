<template>
  <div
    class="player-avatar"
    :class="[`size-${size}`, { dragging, 'is-guest': player.guest }]"
    :title="player.guest ? `${player.name} · ${t('players.guest')}` : player.name"
  >
    <ShirtAvatar :shirt="shirt" :initials="initials" :size="sizeMap[size]" />
    <span v-if="player.number != null" class="avatar-number">{{ player.number }}</span>
    <span v-if="player.guest" class="avatar-guest" aria-hidden="true">
      <span class="material-symbols-rounded">swap_horiz</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import { t } from '@/i18n'

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

.player-avatar.is-guest {
  outline: 2px dashed var(--md-tertiary);
  outline-offset: 2px;
}

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

.avatar-guest {
  position: absolute;
  top: -3px;
  left: -3px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--md-tertiary);
  color: var(--md-on-tertiary);
  box-shadow: 0 0 0 2px var(--md-surface);
  z-index: 2;
}

.avatar-guest .material-symbols-rounded {
  font-size: 11px;
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20;
}
</style>
