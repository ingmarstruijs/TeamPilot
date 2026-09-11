<template>
  <component
    :is="tag"
    class="roster-chip"
    :class="chipClass"
  >
    <div class="rc-avatar" :class="chipClass">
      <ShirtAvatar :shirt="shirt" :initials="initials" :size="28" />
      <span v-if="mark" class="rc-mark" :class="mark.kind" :title="mark.title" aria-hidden="true">
        <span class="material-symbols-rounded">{{ mark.icon }}</span>
      </span>
    </div>
    <span class="rc-name">{{ shortName }}</span>
    <span v-if="player.number" class="rc-num">#{{ player.number }}</span>
    <span v-if="player.guest" class="rc-badge is-guest">{{ t('players.guest') }}</span>
    <span v-if="player.injured" class="rc-badge is-injured">{{ t('players.injured') }}</span>
    <span v-else-if="isAbsent" class="rc-badge is-absent">{{ t('players.unavailable') }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'
import { t } from '@/i18n'

const props = defineProps({
  player: { type: Object, required: true },
  shirt: {
    type: Object,
    default: () => ({ style: 'solid', primary: '#059669', secondary: '#ffffff' }),
  },
  tag: { type: String, default: 'div' },
  selected: { type: Boolean, default: true },
  dragging: { type: Boolean, default: false },
  staticChip: { type: Boolean, default: false },
})

const isAbsent = computed(() => !props.player.injured && props.player.available === false)

const chipClass = computed(() => ({
  dragging: props.dragging,
  'is-static': props.staticChip,
  'is-off': !props.selected,
  'is-guest': props.player.guest && !props.player.injured,
  'is-injured': Boolean(props.player.injured),
  'is-absent': isAbsent.value,
}))

const initials = computed(() => {
  const parts = String(props.player.name ?? '').trim().split(/\s+/)
  if (!parts[0]) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const shortName = computed(() => {
  const parts = String(props.player.name ?? '').trim().split(/\s+/)
  const first = parts[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  const display = last ? `${first} ${last[0]}.` : first
  return display.length > 14 ? `${display.slice(0, 13)}…` : display
})

const mark = computed(() => {
  if (props.player.injured) {
    return { kind: 'is-injured', icon: 'personal_injury', title: t('players.injuredLong') }
  }
  if (props.player.guest) {
    return { kind: 'is-guest', icon: 'swap_horiz', title: t('players.guest') }
  }
  if (isAbsent.value) {
    return { kind: 'is-absent', icon: 'cancel', title: t('players.unavailable') }
  }
  return null
})
</script>

<style scoped>
.roster-chip {
  display: flex;
  align-items: center;
  gap: var(--sp-1);
  background: var(--md-surface);
  border-radius: var(--md-shape-full);
  padding: 4px 10px 4px 4px;
  cursor: grab;
  touch-action: none;
  transition: box-shadow var(--md-duration-short), opacity var(--md-duration-short), background var(--md-duration-short);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--md-elevation-1);
  flex-shrink: 0;
  border: none;
  font: inherit;
  color: inherit;
  text-align: left;
}
.roster-chip:active,
.roster-chip.dragging { opacity: .5; cursor: grabbing; }
.roster-chip.is-static {
  cursor: default;
  touch-action: auto;
  opacity: 0.92;
}
.roster-chip.is-static:active { opacity: 0.92; cursor: default; }
button.roster-chip {
  cursor: pointer;
  touch-action: manipulation;
}
button.roster-chip:active {
  opacity: 0.85;
  cursor: pointer;
}
.roster-chip.is-off {
  background: transparent;
  box-shadow: inset 0 0 0 1px var(--md-outline);
  opacity: 0.78;
}

.rc-avatar {
  position: relative;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}
.rc-avatar.is-guest {
  outline: 2px dashed var(--md-tertiary);
  outline-offset: 1px;
}
.rc-avatar.is-injured {
  outline: 2px dashed var(--md-error);
  outline-offset: 1px;
}
.rc-mark {
  position: absolute;
  top: -5px;
  left: -5px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 0 1.5px var(--md-surface);
  z-index: 1;
}
.rc-mark.is-guest {
  background: var(--md-tertiary);
  color: var(--md-on-tertiary);
}
.rc-mark.is-injured {
  background: var(--md-error);
  color: var(--md-on-error);
}
.rc-mark.is-absent {
  background: var(--md-outline);
  color: var(--md-surface);
}
.rc-mark .material-symbols-rounded {
  font-size: 10px;
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 20;
}
.rc-name { font-size: 12px; color: var(--md-on-surface); }
.rc-num  { font-size: 10px; color: var(--md-on-surface-variant); }
.roster-chip.is-guest {
  background: var(--md-tertiary-container);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-tertiary) 55%, transparent);
}
.roster-chip.is-injured {
  background: var(--md-error-container);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--md-error) 55%, transparent);
}
.roster-chip.is-off.is-guest {
  background: color-mix(in srgb, var(--md-tertiary-container) 55%, transparent);
}
.rc-badge {
  font-size: 9px;
  font-weight: 700;
  letter-spacing: .2px;
  padding: 1px 5px;
  border-radius: var(--md-shape-full);
}
.rc-badge.is-guest {
  background: var(--md-tertiary);
  color: var(--md-on-tertiary);
}
.rc-badge.is-injured {
  background: var(--md-error);
  color: var(--md-on-error);
}
.rc-badge.is-absent {
  background: var(--md-outline);
  color: var(--md-surface);
}
</style>
