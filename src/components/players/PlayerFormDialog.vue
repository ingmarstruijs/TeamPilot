<template>
  <Transition name="fade">
    <div v-if="open" class="dialog-backdrop" @click.self="$emit('close')">
      <div class="dialog" role="dialog" :aria-label="title">
        <p class="dialog-title">{{ title }}</p>

        <div class="form-grid">
          <div class="field-wrap" style="grid-column: 1/-1">
            <label class="field-label" for="player-form-name">{{ t('players.name') }}</label>
            <input
              id="player-form-name"
              class="field"
              v-model.trim="form.name"
              :placeholder="t('players.namePlaceholder')"
              maxlength="40"
              autofocus
            />
          </div>
          <div class="field-wrap">
            <label class="field-label" for="player-form-num">{{ t('players.number') }}</label>
            <input
              id="player-form-num"
              class="field"
              v-model.number="form.number"
              type="number"
              min="1"
              max="99"
              placeholder="–"
            />
          </div>
          <div class="field-wrap">
            <label class="field-label" for="player-form-pos">{{ t('players.position') }}</label>
            <select id="player-form-pos" class="field field-select" v-model="form.position">
              <option v-for="p in POSITIONS" :key="p.id" :value="p.id">{{ t(`position.${p.id}`) }}</option>
            </select>
          </div>
          <div class="field-wrap" style="grid-column: 1/-1">
            <p class="field-label">{{ t('players.foot') }}</p>
            <div class="foot-chips">
              <button
                v-for="foot in footOptions"
                :key="foot.id"
                type="button"
                class="chip"
                :class="{ active: form.preferredFoot === foot.id }"
                @click="form.preferredFoot = form.preferredFoot === foot.id ? null : foot.id"
              >{{ foot.label }}</button>
            </div>
          </div>
          <label class="switch-row" style="grid-column: 1/-1">
            <input type="checkbox" v-model="form.injured">
            <span>{{ t('players.injuredLong') }}</span>
          </label>
          <label class="switch-row" style="grid-column: 1/-1">
            <input type="checkbox" v-model="form.guest">
            <span>
              {{ t('players.guestSwitch') }}
              <span class="switch-hint">{{ t('players.guestHint') }}</span>
            </span>
          </label>
        </div>

        <div class="avatar-preview">
          <PlayerAvatar :player="formAsPlayer" :shirt="shirt" size="lg" />
          <span class="md-label-md preview-label">{{ t('players.preview') }}</span>
        </div>

        <div class="dialog-actions">
          <button class="btn btn-text" @click="$emit('close')">{{ t('common.cancel') }}</button>
          <button class="btn btn-filled" :disabled="!form.name" @click="submit">{{ submitLabel }}</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { POSITIONS } from '@/data/formations'
import PlayerAvatar from '@/components/ui/PlayerAvatar.vue'
import { t } from '@/i18n'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  submitLabel: { type: String, required: true },
  player: { type: Object, default: null },
  shirt: {
    type: Object,
    default: () => ({ style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }),
  },
  defaultGuest: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'save'])

const form = reactive(emptyForm())

const footOptions = computed(() => [
  { id: 'L', label: t('players.footLeft') },
  { id: 'R', label: t('players.footRight') },
  { id: 'both', label: t('players.footBoth') },
])

const formAsPlayer = computed(() => ({
  name: form.name || t('players.name'),
  number: form.number || null,
  guest: form.guest,
}))

watch(() => props.open, (isOpen) => {
  if (!isOpen) return
  applyPlayer(props.player)
}, { immediate: true })

watch(() => props.player, (player) => {
  if (!props.open) return
  applyPlayer(player)
})

function emptyForm(guest = false) {
  return {
    name: '',
    number: null,
    position: 'MID',
    preferredFoot: null,
    injured: false,
    guest,
  }
}

function applyPlayer(player) {
  const next = player
    ? {
        name: player.name,
        number: player.number,
        position: player.position || 'MID',
        preferredFoot: player.preferredFoot ?? null,
        injured: Boolean(player.injured),
        guest: Boolean(player.guest),
      }
    : emptyForm(props.defaultGuest)
  Object.assign(form, next)
}

function submit() {
  const name = form.name.trim()
  if (!name) return
  emit('save', {
    name,
    number: form.number || null,
    position: form.position,
    preferredFoot: form.preferredFoot,
    injured: form.injured,
    guest: form.guest,
  })
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}

.foot-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.switch-row {
  display: flex;
  align-items: flex-start;
  gap: var(--sp-3);
  font-size: 14px;
  color: var(--md-on-surface);
}

.switch-row input {
  margin-top: 3px;
}

.switch-hint {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: var(--md-on-surface-variant);
  font-weight: 400;
}

.avatar-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--sp-2);
  margin-bottom: var(--sp-4);
}

.preview-label {
  color: var(--md-on-surface-variant);
}
</style>
