<template>
  <div class="page builder-page">
    <!-- Sticky header: lineup switcher + actions -->
    <div class="builder-header-shell">
      <div class="builder-toolbar">
      <!-- Lineup switcher -->
      <div class="lineup-switcher" ref="switcherRef">
        <button class="switcher-btn" @click="toggleSwitcher" :class="{ open: showSwitcher }">
          <div class="switcher-text">
            <span class="md-title-sm switcher-name">{{ lineupName || t('lineupShare.newDefault') }}</span>
            <span class="md-label-sm switcher-meta" style="color:var(--md-on-surface-variant)">
              {{ ageGroupConfig?.label }} · {{ fieldSlots.filter(s=>s.playerId).length }}/{{ fieldSlots.length }}
            </span>
          </div>
          <span class="material-symbols-rounded switcher-chevron">expand_more</span>
        </button>

      <!-- Dropdown -->
      <Transition name="fade">
        <div v-if="showSwitcher" class="switcher-dropdown" @click="showSwitcher = false">
          <div class="switcher-header">
            <h2 class="md-headline-sm">{{ t('lineup.title') }}</h2>
            <button class="btn-icon" @click.stop="showSwitcher = false" :aria-label="t('common.close')">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="switcher-content">
            <button class="switcher-item switcher-new" @click.stop="requestStartNew">
              <span class="material-symbols-rounded" style="font-size:18px">add</span>
              <span>{{ t('lineup.new') }}</span>
            </button>
            <div v-if="teamLineups.length" class="switcher-divider"></div>
            <div
              v-for="lu in teamLineups"
              :key="lu.id"
              class="switcher-row"
              :class="{ 'switcher-active': lu.id === lineupId }"
            >
              <button class="switcher-item" @click.stop="requestSwitchToLineup(lu)">
                <span class="material-symbols-rounded" style="font-size:18px">{{ lu.id === lineupId ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
                <div class="switcher-item-info">
                  <span class="switcher-item-name">{{ lu.name }}</span>
                  <span class="switcher-item-meta">{{ t('lineupShare.switcherPlayers', { count: lu.slots.filter(s=>s.playerId).length, formation: lu.formationId || t('lineup.free') }) }}</span>
                </div>
              </button>
              <button
                class="btn-icon switcher-delete"
                @click.stop="requestDeleteLineup(lu)"
                :aria-label="t('lineupShare.deleteLineup')"
              >
                <span class="material-symbols-rounded">delete</span>
              </button>
            </div>
            <div v-if="!teamLineups.length" class="switcher-empty">{{ t('lineup.empty') }}</div>
          </div>
        </div>
      </Transition>
      </div>

      <div class="toolbar-actions">
        <button
          class="btn btn-tonal"
          @click="suggestFill"
          :title="t('lineup.suggestTitle')"
        >
          <span class="material-symbols-rounded" style="font-size:18px">auto_awesome</span>
          <span class="btn-lbl">{{ t('lineup.suggest') }}</span>
        </button>
        <button class="btn btn-filled" @click="openSaveDialog">
          <span class="material-symbols-rounded" style="font-size:18px">save</span>
          <span class="btn-lbl">{{ t('common.save') }}</span>
        </button>
        <div class="lineup-more">
          <button
            type="button"
            class="btn-icon lineup-more-btn"
            :aria-label="t('lineup.moreActions')"
            :aria-expanded="openMenu === 'toolbar'"
            aria-haspopup="menu"
            @pointerdown.stop.prevent="onToolbarMore"
            @click.stop.prevent
          >
            <span class="material-symbols-rounded" aria-hidden="true">more_vert</span>
          </button>
        </div>
      </div>
      </div>

      <div v-if="periodMode" class="period-chips" role="tablist" :aria-label="periodModeLabel">
        <button
          v-for="(label, i) in periodLabels"
          :key="`${periodMode}-${i}`"
          type="button"
          class="chip period-chip"
          :class="{ active: activePeriod === i }"
          role="tab"
          :aria-selected="activePeriod === i"
          @click="switchPeriod(i)"
        >{{ label }}</button>
      </div>

      <!-- Bank, formatie & weergave (mobile, onderkant sticky header) -->
      <div
        v-if="!isDesktop"
        class="builder-header-controls"
        ref="formationControlsRef"
      >
        <div class="builder-header-controls-bar">
          <div class="bench-anchor" ref="benchAnchorRef">
            <button
              class="chip chip-toggle"
              :class="{ active: showBench, 'drag-drop': isFieldDragging }"
              @click="toggleBench"
              data-bench-button
              :title="t('lineup.bench')"
            >
              <span class="material-symbols-rounded" style="font-size:16px">group</span>
              <span class="chip-text">{{ t('lineup.bench') }}</span>
              <span v-if="benchPlayers.length" class="chip-badge">{{ benchPlayers.length }}</span>
            </button>
          </div>
          <label class="sr-only" for="formation-select">{{ t('lineup.formations') }}</label>
          <div class="formation-select-wrap">
            <select
              id="formation-select"
              class="formation-dropdown formation-dropdown--inline"
              :value="selectedFormationId || ''"
              @change="onFormationChange"
            >
              <option value="">{{ t('lineup.free') }}</option>
              <option v-for="f in availableFormations" :key="f.id" :value="f.id">{{ f.label }}</option>
            </select>
            <button
              type="button"
              class="chip chip-toggle chip-toggle--icon formation-info-btn"
              :disabled="!canShowFormationInfo"
              :title="formationInfoTitle"
              :aria-label="formationInfoTitle"
              @click="showFormationInfo = true"
            >
              <span class="material-symbols-rounded" aria-hidden="true">info</span>
            </button>
          </div>
          <div class="lineup-more">
            <button
              type="button"
              class="chip chip-toggle chip-toggle--icon"
              :class="{ active: openMenu === 'view' || isOpponentVisible || flipped }"
              :aria-label="t('lineup.viewMenu')"
              :aria-expanded="openMenu === 'view'"
              aria-haspopup="menu"
              @pointerdown.stop.prevent="onViewMore"
              @click.stop.prevent
            >
              <span class="material-symbols-rounded" style="font-size:18px" aria-hidden="true">tune</span>
            </button>
          </div>
        </div>

        <Transition name="bench-drop">
          <div v-if="showBench" class="bench-dropdown bench-dropdown--overlay" :class="{ 'bench-dragging': isBenchDragging }">
            <BenchPanel
              :bench-players="benchPlayers"
              :team-shirt="activeTeam?.shirt"
              :horizontal="false"
              can-add-guest
              @bench-drag-start="onBenchDragStart"
              @bench-touch-start="onBenchTouchStart"
              @field-drop="removePlayerFromField"
              @add-guest="openGuestDialog"
            />
          </div>
        </Transition>
      </div>
    </div>

    <div
      v-if="!isDesktop && showBench"
      class="controls-backdrop"
      @click="closeMobileOverlays"
    />

    <div class="builder-body">
      <aside v-if="isDesktop" class="builder-col-formation card card-elevated">
        <div class="controls-title-row">
          <p class="md-title-sm controls-title">{{ t('lineup.formations') }}</p>
          <button
            type="button"
            class="btn-icon formation-info-btn"
            :disabled="!canShowFormationInfo"
            :title="formationInfoTitle"
            :aria-label="formationInfoTitle"
            @click="showFormationInfo = true"
          >
            <span class="material-symbols-rounded" aria-hidden="true">info</span>
          </button>
        </div>
        <div class="formation-chips formation-chips--stacked">
          <button
            v-for="f in availableFormations"
            :key="f.id"
            class="chip"
            :class="{ active: selectedFormationId === f.id }"
            @click="applyFormation(f)"
          >{{ f.label }}</button>
          <button class="chip" :class="{ active: !selectedFormationId }" @click="freeMode">
            <span class="material-symbols-rounded" style="font-size:14px">edit</span>
            {{ t('lineup.free') }}
          </button>
        </div>
      </aside>

      <div class="builder-col-field">
        <FootballField
          :slots="fieldSlots"
          :players="playersMap"
          :team-shirt="activeTeam?.shirt"
          :opponent-slots="isOpponentVisible ? opponentSlots : []"
          :opponent-shirt="opponentShirt"
          :flipped="flipped"
          export-id="field-export-area"
          @slot-drop="handleSlotDrop"
          @remove-from-slot="removeFromSlot"
          @opponent-move="handleOpponentMove"
          @drag-active="isFieldDragging = $event"
        />
      </div>

      <aside v-if="isDesktop" class="builder-col-bench">
        <div class="sidebar-card card card-elevated">
          <p class="md-title-sm controls-title">{{ t('lineup.display') }}</p>
          <div class="controls-options controls-options--sidebar">
            <button
              class="chip chip-toggle chip-toggle--icon chip-toggle--sidebar"
              :class="{ active: isOpponentVisible, [`opponent-mode-${opponentMode}`]: isOpponentVisible }"
              @click="cycleOpponentMode"
              :title="opponentModeTitle"
              :aria-label="opponentModeTitle"
            >
              <span class="material-symbols-rounded" style="font-size:18px">{{ opponentModeIcon }}</span>
            </button>
            <button
              class="chip chip-toggle chip-toggle--icon chip-toggle--sidebar"
              :class="{ active: flipped }"
              @click="flipped = !flipped"
              :title="flipped ? t('lineup.attackUp') : t('lineup.keeperDown')"
              :aria-label="t('lineupShare.flip')"
            >
              <span class="material-symbols-rounded" style="font-size:18px">swap_vert</span>
            </button>
          </div>
        </div>

        <BenchPanel
          class="bench-panel--sidebar"
          :bench-players="benchPlayers"
          :team-shirt="activeTeam?.shirt"
          :horizontal="false"
          can-add-guest
          @bench-drag-start="onBenchDragStart"
          @bench-touch-start="onBenchTouchStart"
          @field-drop="removePlayerFromField"
          @add-guest="openGuestDialog"
        />

        <div v-if="filledCount > 0" class="share-section">
          <button class="btn btn-tonal w-full" @click="openShareDialog" :disabled="sharing">
            <span class="material-symbols-rounded" style="font-size:18px">share</span>
            {{ sharing ? t('training.busy') : t('common.share') }}
          </button>
        </div>
      </aside>
    </div>

    <!-- Bench-to-field touch drag ghost -->
    <div
      v-if="benchTouchGhost"
      class="bench-touch-ghost"
      :style="{ left: benchTouchGhost.x + 'px', top: benchTouchGhost.y + 'px', background: benchTouchGhost.color }"
    >{{ benchTouchGhost.initials }}</div>



    <FormationInfoDialog
      :open="showFormationInfo"
      :formation-id="selectedFormationId"
      @close="showFormationInfo = false"
    />

    <Teleport to="body">
      <div
        v-if="openMenu === 'toolbar'"
        class="lineup-more-menu"
        role="menu"
        :aria-label="t('lineup.moreActions')"
        :style="menuStyle"
        @pointerdown.stop
      >
        <button
          type="button"
          class="lineup-more-item"
          role="menuitem"
          :disabled="filledCount === 0 || sharing"
          @click.stop="onShareFromMenu"
        >
          <span class="material-symbols-rounded" aria-hidden="true">share</span>
          {{ t('common.share') }}
        </button>
        <button
          type="button"
          class="lineup-more-item"
          role="menuitem"
          @click.stop="onResetFromMenu"
        >
          <span class="material-symbols-rounded" aria-hidden="true">delete_sweep</span>
          {{ t('common.reset') }}
        </button>
        <div class="lineup-more-divider" role="separator" />
        <button
          v-if="!periodMode"
          type="button"
          class="lineup-more-item"
          role="menuitem"
          @click.stop="splitPeriods('quarters')"
        >
          <span class="material-symbols-rounded" aria-hidden="true">grid_view</span>
          {{ t('lineup.splitQuarters') }}
        </button>
        <button
          v-if="!periodMode"
          type="button"
          class="lineup-more-item"
          role="menuitem"
          @click.stop="splitPeriods('halves')"
        >
          <span class="material-symbols-rounded" aria-hidden="true">view_agenda</span>
          {{ t('lineup.splitHalves') }}
        </button>
        <button
          v-if="periodMode"
          type="button"
          class="lineup-more-item"
          role="menuitem"
          @click.stop="mergePeriods"
        >
          <span class="material-symbols-rounded" aria-hidden="true">unfold_less</span>
          {{ t('lineup.mergePeriods') }}
        </button>
      </div>
      <div
        v-else-if="openMenu === 'view'"
        class="lineup-more-menu"
        role="menu"
        :aria-label="t('lineup.viewMenu')"
        :style="menuStyle"
        @pointerdown.stop
      >
        <button
          type="button"
          class="lineup-more-item"
          role="menuitem"
          @click.stop="cycleOpponentMode"
        >
          <span class="material-symbols-rounded" aria-hidden="true">{{ opponentModeIcon }}</span>
          {{ opponentMenuLabel }}
        </button>
        <button
          type="button"
          class="lineup-more-item"
          :class="{ 'is-active': flipped }"
          role="menuitem"
          @click.stop="flipped = !flipped"
        >
          <span class="material-symbols-rounded" aria-hidden="true">swap_vert</span>
          {{ t('lineup.flipField') }}
        </button>
      </div>
    </Teleport>

    <!-- Unsaved changes dialog -->
    <Transition name="fade">
      <div v-if="showUnsaved" class="dialog-backdrop" @click.self="cancelPending">
        <div class="dialog">
          <p class="dialog-title">{{ t('lineup.unsavedTitle') }}</p>
          <p class="dialog-body">{{ t('lineup.unsavedBody') }}</p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="cancelPending">{{ t('common.cancel') }}</button>
            <button class="btn btn-text" @click="confirmDiscard">{{ t('lineup.discard') }}</button>
            <button class="btn btn-filled" @click="confirmSaveAndContinue">{{ t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete lineup dialog -->
    <Transition name="fade">
      <div v-if="deleteTarget" class="dialog-backdrop" @click.self="deleteTarget=null">
        <div class="dialog">
          <p class="dialog-title">{{ t('lineupShare.deleteTitle') }}</p>
          <p class="dialog-body">
            {{ t('lineupShare.deleteBody', { name: deleteTarget.name }) }}
          </p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="deleteTarget=null">{{ t('common.cancel') }}</button>
            <button class="btn btn-filled" style="background:var(--md-error)" @click="doDeleteLineup">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Save Dialog -->
    <Transition name="fade">
      <div v-if="showSave" class="dialog-backdrop" @click.self="showSave=false">
        <div class="dialog">
          <p class="dialog-title">{{ t('lineupShare.saveDialogTitle') }}</p>
          <div class="field-wrap" style="margin-bottom:var(--sp-4)">
            <label class="field-label" for="lineup-name">{{ t('lineupShare.nameLabel') }}</label>
            <input id="lineup-name" class="field" v-model.trim="lineupName"
              :placeholder="t('lineupShare.namePlaceholder')" maxlength="50" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="showSave=false">{{ t('common.cancel') }}</button>
            <button class="btn btn-filled" :disabled="!lineupName" @click="confirmSave">{{ t('common.save') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="showGuestDialog" class="dialog-backdrop" @click.self="showGuestDialog=false">
        <div class="dialog">
          <p class="dialog-title">{{ t('bench.addGuestTitle') }}</p>
          <div class="field-wrap" style="margin-bottom:var(--sp-3)">
            <label class="field-label" for="guest-name">{{ t('players.name') }}</label>
            <input id="guest-name" class="field" v-model.trim="guestForm.name"
              :placeholder="t('players.namePlaceholder')" maxlength="40" />
          </div>
          <div class="field-wrap" style="margin-bottom:var(--sp-4)">
            <label class="field-label" for="guest-pos">{{ t('players.position') }}</label>
            <select id="guest-pos" class="field field-select" v-model="guestForm.position">
              <option v-for="p in POSITIONS" :key="p.id" :value="p.id">{{ t(`position.${p.id}`) }}</option>
            </select>
          </div>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="showGuestDialog=false">{{ t('common.cancel') }}</button>
            <button class="btn btn-filled" :disabled="!guestForm.name" @click="confirmGuest">{{ t('common.add') }}</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Share dialog: choose image or link -->
    <Transition name="fade">
      <div v-if="showShareDialog" class="dialog-backdrop" @click.self="closeShareDialog">
        <div class="dialog">
          <template v-if="shareDialogStep === 'type'">
            <p class="dialog-title">{{ t('lineupShare.shareTitle') }}</p>
            <p class="md-body-sm" style="color:var(--md-on-surface-variant);margin-bottom:var(--sp-4)">
              {{ t('lineupShare.shareHow') }}
            </p>
            <div class="share-link-options">
              <button class="share-link-opt" @click="shareImage" :disabled="sharing">
                <span class="material-symbols-rounded" style="font-size:22px">image</span>
                <div>
                  <p class="md-label-lg">{{ t('lineupShare.shareAsImage') }}</p>
                  <p class="md-body-sm" style="color:var(--md-on-surface-variant)">{{ t('lineupShare.shareAsImageDesc') }}</p>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;font-size:18px">chevron_right</span>
              </button>
              <button class="share-link-opt" @click="shareDialogStep = 'link'">
                <span class="material-symbols-rounded" style="font-size:22px">link</span>
                <div>
                  <p class="md-label-lg">{{ t('lineupShare.shareAsLink') }}</p>
                  <p class="md-body-sm" style="color:var(--md-on-surface-variant)">{{ t('lineupShare.shareAsLinkDesc') }}</p>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;font-size:18px">chevron_right</span>
              </button>
            </div>
            <div class="dialog-actions">
              <button class="btn btn-text" @click="closeShareDialog">{{ t('common.close') }}</button>
            </div>
          </template>
          <template v-else>
            <p class="dialog-title">{{ t('lineupShare.shareLinkTitle') }}</p>
            <p class="md-body-sm" style="color:var(--md-on-surface-variant);margin-bottom:var(--sp-4)">
              {{ t('lineupShare.shareLinkHow') }}
            </p>
            <div class="share-link-options">
              <button class="share-link-opt" @click="copyShareLink('bundle')">
                <span class="material-symbols-rounded" style="font-size:22px">groups</span>
                <div>
                  <p class="md-label-lg">{{ t('lineupShare.shareWithTeam') }}</p>
                  <p class="md-body-sm" style="color:var(--md-on-surface-variant)">{{ t('lineupShare.shareWithTeamDesc') }}</p>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;font-size:18px">content_copy</span>
              </button>
              <button class="share-link-opt" @click="copyShareLink('lineup')">
                <span class="material-symbols-rounded" style="font-size:22px">sports_soccer</span>
                <div>
                  <p class="md-label-lg">{{ t('lineupShare.shareLineupOnly') }}</p>
                  <p class="md-body-sm" style="color:var(--md-on-surface-variant)">{{ t('lineupShare.shareLineupOnlyDesc') }}</p>
                </div>
                <span class="material-symbols-rounded" style="margin-left:auto;font-size:18px">content_copy</span>
              </button>
            </div>
            <div class="dialog-actions">
              <button class="btn btn-text" @click="shareDialogStep = 'type'">{{ t('lineupShare.back') }}</button>
              <button class="btn btn-text" @click="closeShareDialog">{{ t('common.close') }}</button>
            </div>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Share image preview dialog -->
    <Transition name="fade">
      <div v-if="sharePreviewUrl" class="dialog-backdrop" @click.self="sharePreviewUrl=null">
        <div class="dialog share-dialog">
          <p class="dialog-title">{{ t('lineupShare.shareTitle') }}</p>
          <img :src="sharePreviewUrl" class="share-preview" :alt="t('lineupShare.sharePreviewAlt')" />
          <div class="dialog-actions" style="flex-wrap:wrap;gap:var(--sp-2)">
            <button class="btn btn-text" @click="sharePreviewUrl=null">{{ t('common.close') }}</button>
            <button class="btn btn-tonal" @click="downloadImage">
              <span class="material-symbols-rounded" style="font-size:18px">download</span>
              Opslaan
            </button>
            <button class="btn btn-filled" @click="shareViaWhatsApp">
              <span class="material-symbols-rounded" style="font-size:18px">chat</span>
              WhatsApp
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import { FORMATIONS, FORMATION_Y, POSITIONS } from '@/data/formations'
import { encodeBundle, encodeLineupOnly, buildLineupShareUrl } from '@/utils/lineupShare'
import { shareLink } from '@/utils/shareLink'
import { suggestLineup, cloneLineupSlots } from '@/utils/suggestLineup'
import { benchEligiblePlayers, suggestPool } from '@/utils/playerStatus'
import {
  OPPONENT_MODES,
  buildOpponentSlotsForMode,
  getOpponentModeLabel,
} from '@/utils/opponentFormation'
import { getOpponentShirt } from '@/utils/opponentShirt'
import FootballField from '@/components/field/FootballField.vue'
import BenchPanel    from '@/components/field/BenchPanel.vue'
import FormationInfoDialog from '@/components/lineup/FormationInfoDialog.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { t } from '@/i18n'
import { hasFormationGuide } from '@/utils/formationGuide'

const props = defineProps({ id: String })
const store  = useTeamStore()
const route  = useRoute()
const router = useRouter()
const isDesktop = useMediaQuery('(min-width: 720px)')

// ── Field positioning constants ─────────────────────────────────
const GRID_SIZE = 16  // 16x16 grid for finer snapping precision
const GRID_STEP = 100 / GRID_SIZE  // 6.25% between grid points
const MIN_GRID_POS = 0
const MAX_GRID_POS = GRID_SIZE - 1

function snapToGrid(value) {
  // Snap a position (0-100) to nearest grid point
  const normalized = value / GRID_STEP
  const snapped = Math.round(normalized)
  const clamped = Math.max(MIN_GRID_POS, Math.min(MAX_GRID_POS, snapped))
  return clamped * GRID_STEP
}

// ── Lineup switcher ────────────────────────────────────────
const showSwitcher = ref(false)
const switcherRef  = ref(null)
const showBench    = ref(false)
const benchAnchorRef = ref(null)
const formationControlsRef = ref(null)
const opponentMode = ref('off')

const isOpponentVisible = computed(() => opponentMode.value !== 'off')

const opponentModeTitle = computed(() => {
  const label = getOpponentModeLabel(opponentMode.value)
  return `${label} — tik voor volgende modus`
})

const opponentMenuLabel = computed(() => getOpponentModeLabel(opponentMode.value))

const opponentModeIcon = computed(() => {
  const icons = {
    off: 'shield',
    mirror: 'flip',
    optimal: 'shield',
    alternative: 'shuffle',
  }
  return icons[opponentMode.value] ?? 'shield'
})

function cycleOpponentMode() {
  const idx = OPPONENT_MODES.indexOf(opponentMode.value)
  opponentMode.value = OPPONENT_MODES[(idx + 1) % OPPONENT_MODES.length]
}

function toggleBench() {
  closeMenus()
  showBench.value = !showBench.value
}

function toggleSwitcher() {
  closeMenus()
  showSwitcher.value = !showSwitcher.value
}

const openMenu = ref(null)
const menuStyle = ref({})

function closeMenus() {
  openMenu.value = null
}

function menuStyleFromRect(rect) {
  const opensUp = window.innerHeight - rect.bottom < 240
  return opensUp
    ? {
        top: 'auto',
        bottom: `${Math.max(8, window.innerHeight - rect.top + 4)}px`,
        right: `${Math.max(8, window.innerWidth - rect.right)}px`,
      }
    : {
        top: `${rect.bottom + 4}px`,
        bottom: 'auto',
        right: `${Math.max(8, window.innerWidth - rect.right)}px`,
      }
}

function onToolbarMore(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  showSwitcher.value = false
  if (openMenu.value === 'toolbar') {
    closeMenus()
    return
  }
  openMenu.value = 'toolbar'
  menuStyle.value = menuStyleFromRect(e.currentTarget.getBoundingClientRect())
}

function onViewMore(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  showSwitcher.value = false
  if (openMenu.value === 'view') {
    closeMenus()
    return
  }
  openMenu.value = 'view'
  menuStyle.value = menuStyleFromRect(e.currentTarget.getBoundingClientRect())
}

function onDocPointerDown(e) {
  if (!openMenu.value) return
  if (e.target?.closest?.('.lineup-more, .lineup-more-menu')) return
  closeMenus()
}

function onShareFromMenu() {
  closeMenus()
  openShareDialog()
}

function onResetFromMenu() {
  closeMenus()
  resetAll()
}

function closeMobileOverlays() {
  if (!isBenchDragging.value) showBench.value = false
}

function closeOnOutsideClick(e) {
  if (switcherRef.value && !switcherRef.value.contains(e.target)) {
    showSwitcher.value = false
  }
  if (
    showBench.value
    && formationControlsRef.value
    && !formationControlsRef.value.contains(e.target)
  ) {
    closeMobileOverlays()
  }
}
onMounted(() => {
  document.addEventListener('mousedown', closeOnOutsideClick)
  document.addEventListener('pointerdown', onDocPointerDown)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', closeOnOutsideClick)
  document.removeEventListener('pointerdown', onDocPointerDown)
})

function switchToLineup(lu) {
  showSwitcher.value = false
  loadLineupById(lu)
  if (route.params.id !== lu.id) {
    router.push(`/lineup/${lu.id}`)
  }
}

function requestSwitchToLineup(lu) {
  if (lu.id === lineupId.value) {
    showSwitcher.value = false
    return
  }
  if (isDirty.value) {
    pendingAction.value = { type: 'switch', lineup: lu }
    showUnsaved.value = true
    return
  }
  switchToLineup(lu)
}

function requestStartNew() {
  if (isDirty.value) {
    pendingAction.value = { type: 'new' }
    showUnsaved.value = true
    return
  }
  startNew()
}

const showUnsaved = ref(false)
const pendingAction = ref(null)

function cancelPending() {
  showUnsaved.value = false
  pendingAction.value = null
}

function confirmDiscard() {
  const action = pendingAction.value
  showUnsaved.value = false
  pendingAction.value = null
  if (action?.type === 'switch') switchToLineup(action.lineup)
  else if (action?.type === 'new') startNew()
}

function confirmSaveAndContinue() {
  if (!lineupName.value.trim() && activeTeam.value) {
    lineupName.value = `${activeTeam.value.name} – ${new Date().toLocaleDateString('nl-NL')}`
  }
  if (!lineupName.value.trim()) {
    showUnsaved.value = false
    openSaveDialog()
    return
  }
  const action = pendingAction.value
  doSave()
  showUnsaved.value = false
  pendingAction.value = null
  if (action?.type === 'switch') switchToLineup(action.lineup)
  else if (action?.type === 'new') startNew()
}

const deleteTarget = ref(null)

function requestDeleteLineup(lu) {
  deleteTarget.value = lu
}

function doDeleteLineup() {
  const lu = deleteTarget.value
  if (!lu) return
  const wasActive = lu.id === lineupId.value
  store.deleteLineup(lu.id)
  deleteTarget.value = null
  showSwitcher.value = false
  showSnackbar(t('lineup.deleted'))
  if (!wasActive) return
  const remaining = [...store.teamLineups].sort((a, b) => b.updatedAt - a.updatedAt)
  if (remaining.length) {
    switchToLineup(remaining[0])
  } else {
    startNew()
  }
}

function startNew() {
  showSwitcher.value = false
  store.setActiveLineup(null)
  // Reset state in place (avoids remount flicker on /lineup/new)
  lineupId.value   = null
  lineupName.value = ''
  flipped.value    = true
  opponentMode.value = 'off'
  store.quietGuests()
  resetPeriodState()
  if (availableFormations.value.length) {
    applyFormation(availableFormations.value[0])
  } else {
    buildFreeSlots(ageGroupConfig.value?.players ?? 11)
  }
  router.replace({ name: 'lineup-new', query: { new: '1' } })
  refreshSnapshot()
}

// ── Dirty state ────────────────────────────────────────────
const loadedSnapshot = ref(null)

function serializeState() {
  return JSON.stringify({
    lineupId: lineupId.value,
    lineupName: lineupName.value,
    selectedFormationId: selectedFormationId.value,
    flipped: flipped.value,
    opponentMode: opponentMode.value,
    showOpponent: opponentMode.value !== 'off',
    periodMode: periodMode.value,
    activePeriod: activePeriod.value,
    periods: periodMode.value
      ? periodSnapshots.value.map((p, i) => (
        i === activePeriod.value
          ? snapshotCurrent()
          : { formationId: p.formationId, slots: cloneLineupSlots(p.slots) }
      ))
      : null,
    fieldSlots: fieldSlots.value.map(s => ({
      slotId: s.slotId,
      position: s.position,
      x: s.x,
      y: s.y,
      playerId: s.playerId ?? null,
    })),
  })
}

function refreshSnapshot() {
  loadedSnapshot.value = serializeState()
}

const isDirty = computed(() => serializeState() !== loadedSnapshot.value)

// ── Team state ─────────────────────────────────────────────
const activeTeam      = computed(() => store.activeTeam)
const ageGroupConfig  = computed(() => store.ageGroupConfig)
const teamLineups     = computed(() => store.teamLineups)
const availableFormations = computed(() =>
  FORMATIONS[activeTeam.value?.ageGroup] ?? []
)

const playersMap = computed(() => {
  const map = {}
  for (const p of (activeTeam.value?.players ?? [])) map[p.id] = p
  return map
})

// ── Lineup state ───────────────────────────────────────────
const lineupId           = ref(null)
const lineupName         = ref('')
const selectedFormationId = ref(null)
const showFormationInfo = ref(false)

const canShowFormationInfo = computed(() => hasFormationGuide(selectedFormationId.value))
const formationInfoTitle = computed(() => (
  canShowFormationInfo.value
    ? t('lineup.formationInfo', { formation: selectedFormationId.value })
    : t('lineup.formationInfoDisabled')
))

watch(selectedFormationId, (id) => {
  if (!hasFormationGuide(id)) showFormationInfo.value = false
})
const flipped             = ref(true) // true = GK at bottom (default)

// fieldSlots: [{ slotId, position, x, y, playerId|null }]
const fieldSlots = ref([])

const periodMode = ref(null) // null | 'quarters' | 'halves'
const activePeriod = ref(0)
const periodSnapshots = ref([])

const periodCount = computed(() => (periodMode.value === 'quarters' ? 4 : periodMode.value === 'halves' ? 2 : 0))
const periodModeLabel = computed(() => (
  periodMode.value === 'quarters' ? t('lineup.splitQuarters') : t('lineup.splitHalves')
))
const periodLabels = computed(() => {
  const key = periodMode.value === 'quarters' ? 'lineup.periodQuarter' : 'lineup.periodHalf'
  return Array.from({ length: periodCount.value }, (_, i) => t(key, { n: i + 1 }))
})

function snapshotCurrent() {
  return {
    formationId: selectedFormationId.value,
    slots: cloneLineupSlots(fieldSlots.value),
  }
}

function applySnapshot(snap) {
  selectedFormationId.value = snap?.formationId ?? null
  fieldSlots.value = cloneLineupSlots(snap?.slots ?? [])
  if (isOpponentVisible.value) resetOpponentSlots()
}

function resetPeriodState() {
  periodMode.value = null
  activePeriod.value = 0
  periodSnapshots.value = []
}

function capturePeriod() {
  if (!periodMode.value) return
  periodSnapshots.value[activePeriod.value] = snapshotCurrent()
}

function switchPeriod(i) {
  if (!periodMode.value || i === activePeriod.value) return
  capturePeriod()
  applySnapshot(periodSnapshots.value[i])
  activePeriod.value = i
}

function splitPeriods(mode) {
  const current = snapshotCurrent()
  const count = mode === 'quarters' ? 4 : 2
  periodMode.value = mode
  periodSnapshots.value = Array.from({ length: count }, () => ({
    formationId: current.formationId,
    slots: cloneLineupSlots(current.slots),
  }))
  activePeriod.value = 0
  closeMenus()
}

function mergePeriods() {
  capturePeriod()
  const keep = periodSnapshots.value[activePeriod.value] ?? snapshotCurrent()
  resetPeriodState()
  applySnapshot(keep)
  closeMenus()
}

function loadPeriodState(existing) {
  if (existing.periodMode !== 'quarters' && existing.periodMode !== 'halves') {
    resetPeriodState()
    return
  }
  const count = existing.periodMode === 'quarters' ? 4 : 2
  const loaded = Array.isArray(existing.periods) ? existing.periods : []
  periodMode.value = existing.periodMode
  periodSnapshots.value = Array.from({ length: count }, (_, i) => {
    const snap = loaded[i]
    if (snap?.slots) {
      return {
        formationId: snap.formationId ?? existing.formationId ?? null,
        slots: cloneLineupSlots(snap.slots),
      }
    }
    return {
      formationId: existing.formationId ?? null,
      slots: cloneLineupSlots(existing.slots ?? []),
    }
  })
  activePeriod.value = Math.min(Math.max(existing.activePeriod ?? 0, 0), count - 1)
  applySnapshot(periodSnapshots.value[activePeriod.value])
}

function suggestFill() {
  const usedIds = new Set(fieldSlots.value.map(s => s.playerId).filter(Boolean))
  const emptyCount = fieldSlots.value.filter(s => !s.playerId).length
  const pool = suggestPool(activeTeam.value?.players ?? [], { emptyCount, usedIds })
  const next = suggestLineup(fieldSlots.value, pool)
  const changed = next.some((s, i) => s.playerId !== fieldSlots.value[i]?.playerId)
  if (!changed) {
    showSnackbar(t('lineup.suggestNone'))
    return
  }
  fieldSlots.value = next
  showSnackbar(t('lineup.suggestFilled'))
}

const filledCount = computed(() => fieldSlots.value.filter(s => s.playerId).length)

const benchPlayers = computed(() => {
  const onField = new Set(fieldSlots.value.map(s => s.playerId).filter(Boolean))
  return benchEligiblePlayers(activeTeam.value?.players ?? []).filter(p => !onField.has(p.id))
})

const showGuestDialog = ref(false)
const guestForm = ref({ name: '', position: 'MID' })

function openGuestDialog() {
  guestForm.value = { name: '', position: 'MID' }
  showGuestDialog.value = true
  showBench.value = true
}

function confirmGuest() {
  const name = guestForm.value.name.trim()
  if (!name) return
  store.addPlayer({
    name,
    position: guestForm.value.position,
    guest: true,
    guestQuiet: false,
  })
  showGuestDialog.value = false
  showSnackbar(t('bench.addedGuest', { name }))
}

const opponentShirt = computed(() => getOpponentShirt(activeTeam.value?.shirt))

const opponentSlots = ref([])

function resetOpponentSlots() {
  opponentSlots.value = buildOpponentSlotsForMode(opponentMode.value, {
    ageGroup: activeTeam.value?.ageGroup,
    formationId: selectedFormationId.value,
    fieldSlots: fieldSlots.value,
    playerCount: ageGroupConfig.value?.players ?? 11,
  }).map(s => ({ ...s }))
}

function handleOpponentMove({ slotId, x, y }) {
  const slot = opponentSlots.value.find(s => s.slotId === slotId)
  if (!slot) return
  slot.x = snapToGrid(x)
  slot.y = snapToGrid(y)
}

watch(opponentMode, (mode) => {
  if (mode !== 'off') resetOpponentSlots()
  else opponentSlots.value = []
})

watch(selectedFormationId, () => {
  if (isOpponentVisible.value) resetOpponentSlots()
})

function onFormationChange(event) {
  const formationId = event.target.value
  if (!formationId) {
    freeMode()
  } else {
    const formation = availableFormations.value.find(f => f.id === formationId)
    if (formation) applyFormation(formation)
  }
}

// ── Init / load lineup ─────────────────────────────────────
function loadFreshFormation() {
  lineupId.value = null
  lineupName.value = ''
  resetPeriodState()
  if (availableFormations.value.length) {
    applyFormation(availableFormations.value[0])
  } else {
    buildFreeSlots((ageGroupConfig.value?.players) ?? 11)
  }
  refreshSnapshot()
}

function loadLineupById(existing) {
  lineupId.value   = existing.id
  lineupName.value = existing.name
  selectedFormationId.value = existing.formationId ?? null
  flipped.value    = existing.flipped ?? true
  if (existing.opponentMode && OPPONENT_MODES.includes(existing.opponentMode)) {
    opponentMode.value = existing.opponentMode
  } else {
    opponentMode.value = existing.showOpponent ? 'optimal' : 'off'
  }

  if (existing.formationId) {
    const formation = availableFormations.value.find(f => f.id === existing.formationId)
    if (formation) {
      const prevMap = {}
      for (const s of existing.slots) {
        if (s.playerId) prevMap[s.slotId] = s.playerId
      }
      fieldSlots.value = formation.slots.map(s => ({
        slotId:   s.id,
        position: s.position,
        x:        s.x,
        y:        s.y,
        playerId: prevMap[s.id] ?? null,
      }))
    } else {
      fieldSlots.value = existing.slots.map(s => ({ ...s }))
    }
  } else {
    fieldSlots.value = existing.slots.map(s => ({ ...s }))
  }

  loadPeriodState(existing)

  store.setActiveLineup(existing.id)
  if (isOpponentVisible.value) resetOpponentSlots()
  refreshSnapshot()
}

onMounted(() => {
  if (route.name === 'lineup-new') {
    // When explicitly creating a new lineup (from the dropdown), skip redirect
    if (route.query.new === '1') {
      loadFreshFormation()
      return
    }
    // Redirect to the active lineup if one exists (e.g. arrived here via bottom nav)
    const activeId = store.activeLineupId
    if (activeId && store.getLineup(activeId)) {
      router.replace(`/lineup/${activeId}`)
      return
    }
    // Fallback: most recently updated lineup for the active team
    const sorted = [...store.teamLineups].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))
    if (sorted.length) {
      router.replace(`/lineup/${sorted[0].id}`)
      return
    }
    // Truly no saved lineups → start fresh
    loadFreshFormation()
    return
  }
  // Priority 1: Check URL for lineup ID
  const id = props.id ?? route.params.id
  if (id) {
    const existing = store.getLineup(id)
    if (existing) {
      loadLineupById(existing)
      return
    }
  }
  // No id in URL: find the best lineup for the active team
  const lastId = store.activeLineupId
  if (lastId) {
    const last = store.getLineup(lastId)
    if (last && last.teamId === store.activeTeamId) {
      router.replace(`/lineup/${lastId}`)
      return
    }
  }
  // activeLineupId belongs to a different team — find most recent for current team
  const teamLineupsSorted = [...store.teamLineups].sort((a, b) => b.updatedAt - a.updatedAt)
  if (teamLineupsSorted.length) {
    router.replace(`/lineup/${teamLineupsSorted[0].id}`)
    return
  }
  // Fresh lineup
  loadFreshFormation()
})

// ── React to team switch while builder is open ─────────────
watch(() => store.activeTeamId, () => {
  // Try to load the last active lineup for the new team
  const lastId = store.activeLineupId
  if (lastId) {
    const last = store.getLineup(lastId)
    if (last && last.teamId === store.activeTeamId) {
      loadLineupById(last)
      router.replace(`/lineup/${lastId}`)
      return
    }
  }
  // Fall back to the most recent lineup of the new team
  const teamLineupsSorted = [...store.teamLineups].sort((a, b) => b.updatedAt - a.updatedAt)
  if (teamLineupsSorted.length) {
    const first = teamLineupsSorted[0]
    loadLineupById(first)
    router.replace(`/lineup/${first.id}`)
    return
  }
  // No lineups for this team — start fresh
  loadFreshFormation()
  router.replace('/lineup/new')
})

// ── Formation logic ────────────────────────────────────────
function applyFormation(formation) {
  // Preserve existing player assignments where slot count matches
  const prevMap = {}
  for (const s of fieldSlots.value) {
    if (s.playerId) prevMap[s.slotId] = s.playerId
  }
  fieldSlots.value = formation.slots.map(s => ({
    slotId:   s.id,
    position: s.position,
    x:        s.x,
    y:        s.y,
    playerId: prevMap[s.id] ?? null,
  }))
  selectedFormationId.value = formation.id
  if (isOpponentVisible.value) resetOpponentSlots()
}

function freeMode() {
  selectedFormationId.value = null
  // Keep only filled slots — no more ghost placeholder circles in free mode
  fieldSlots.value = fieldSlots.value.filter(s => s.playerId)
  if (isOpponentVisible.value) resetOpponentSlots()
}

function buildFreeSlots(count) {
  const rows    = Math.ceil(Math.sqrt(count))
  const cols    = Math.ceil(count / rows)
  const slots   = []
  const xStep   = 100 / (cols + 1)
  const ySpan   = FORMATION_Y.ATT - FORMATION_Y.GK
  const yStep   = ySpan / (rows + 1)
  let idx = 0
  for (let r = 0; r < rows && idx < count; r++) {
    for (let c = 0; c < cols && idx < count; c++) {
      slots.push({
        slotId:   `free-${idx}`,
        position: idx === 0 ? 'GK' : 'MID',
        x: (c + 1) * xStep,
        y: FORMATION_Y.GK + (r + 1) * yStep,
        playerId: null,
      })
      idx++
    }
  }
  fieldSlots.value = slots
}

// ── Drag & drop handlers ────────────────────────────────────
let pendingBenchPlayer = null

function onBenchDragStart({ player }) {
  showBench.value = false // backdrop would block the drop target otherwise
  pendingBenchPlayer = player
}

// ── Mobile bench-to-field touch drag ───────────────────────
// Touch events are locked to the element where the finger first landed,
// so we use document-level listeners so the drag works across components.
const benchTouchGhost = ref(null)
const isBenchDragging = ref(false)  // true while a bench player is being touch-dragged
const isFieldDragging = ref(false)  // true while a field player is being touch-dragged

function playerInitials(player) {
  const parts = player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function onBenchTouchStart({ event, player }) {
  // Do NOT set showBench=false here. Removing the bench sheet from the DOM while a touch
  // sequence is active causes iOS to silently drop all subsequent touchmove/touchend events,
  // freezing the ghost. Instead, keep the element in the DOM and hide it visually via
  // isBenchDragging; close it for real only after the gesture completes.
  isBenchDragging.value = true
  pendingBenchPlayer = player
  const touch = event.touches[0]
  benchTouchGhost.value = {
    x:       touch.clientX - 24,
    y:       touch.clientY - 24,
    initials: playerInitials(player),
    color:   activeTeam.value?.shirt?.primary ?? '#059669',
  }

  function onMove(e) {
    e.preventDefault()
    const t = e.touches[0]
    benchTouchGhost.value = { ...benchTouchGhost.value, x: t.clientX - 24, y: t.clientY - 24 }
  }

  function onEnd(e) {
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
    isBenchDragging.value = false
    showBench.value = false  // close bench after gesture completes
    benchTouchGhost.value = null

    if (!pendingBenchPlayer) return
    const t = e.changedTouches[0]
    const fieldEl = document.getElementById('field-export-area')
    if (!fieldEl) { pendingBenchPlayer = null; return }

    const rect = fieldEl.getBoundingClientRect()
    if (t.clientX >= rect.left && t.clientX <= rect.right &&
        t.clientY >= rect.top  && t.clientY <= rect.bottom) {
      const rawX = ((t.clientX - rect.left) / rect.width)  * 100
      const rawY = ((t.clientY - rect.top)  / rect.height) * 100

      // Check if the finger landed near a filled slot → swap bench player with that field player
      const swapTarget = fieldSlots.value.find(s => {
        if (!s.playerId) return false
        const displayY = flipped.value ? 100 - s.y : s.y
        return Math.abs(s.x - rawX) < 7 && Math.abs(displayY - rawY) < 7
      })

      handleSlotDrop({
        type:         'bench',
        playerId:     pendingBenchPlayer.id,
        targetSlotId: swapTarget?.slotId ?? null,
        targetX:      rawX,
        targetY:      flipped.value ? 100 - rawY : rawY,
      })
    }
    pendingBenchPlayer = null
  }

  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', onEnd, { once: true })
}

function handleSlotDrop({ type, slot, slotId, playerId, targetSlotId, targetX, targetY }) {
  if (type === 'slot') {
    // Moving a player from one field position to another
    // `slot` is a full object (touch/slot-indicator drops); `slotId` is a string (HTML5 field drop)
    const resolvedId = slot?.slotId ?? slotId
    const srcSlot = fieldSlots.value.find(s => s.slotId === resolvedId)
    if (!srcSlot) return

    if (targetSlotId) {
      // Swap with another slot
      const dstSlot = fieldSlots.value.find(s => s.slotId === targetSlotId)
      if (dstSlot) {
        const tmp = dstSlot.playerId
        dstSlot.playerId = srcSlot.playerId
        srcSlot.playerId = tmp
      }
    } else {
      // Free reposition — snap to grid
      srcSlot.x = snapToGrid(targetX)
      srcSlot.y = snapToGrid(targetY)
    }
  } else if (type === 'bench') {
    // Dropping a bench player onto the field
    const pid = playerId ?? pendingBenchPlayer?.id
    if (!pid) return

    if (targetSlotId) {
      // Dropped onto a slot — empty means assign, filled means swap (displaced player returns to bench)
      const dstSlot = fieldSlots.value.find(s => s.slotId === targetSlotId)
      if (dstSlot) {
        dstSlot.playerId = pid
      }
    } else if (selectedFormationId.value) {
      // Formation mode: snap to the nearest empty slot instead of floating freely
      const open = fieldSlots.value.filter(s => !s.playerId)
      if (open.length) {
        const nearest = open.reduce((best, s) => {
          const d = Math.hypot(s.x - targetX, s.y - targetY)
          return d < best.d ? { s, d } : best
        }, { s: null, d: Infinity })
        if (nearest.s) nearest.s.playerId = pid
      }
      // All formation slots filled — do nothing
    } else {
      // Free mode: place at exact drop coordinates, snapped to grid
      fieldSlots.value.push({
        slotId:   `free-${Date.now()}`,
        position: playersMap.value[pid]?.position ?? 'MID',
        x: snapToGrid(targetX),
        y: snapToGrid(targetY),
        playerId: pid,
      })
    }
    pendingBenchPlayer = null
  }
}

function removeFromSlot(slotId) {
  if (selectedFormationId.value) {
    // Formation mode: clear the player and restore the slot to its formation position
    const slot = fieldSlots.value.find(s => s.slotId === slotId)
    if (slot) {
      slot.playerId = null
      const formation = availableFormations.value.find(f => f.id === selectedFormationId.value)
      const origin = formation?.slots.find(s => s.id === slotId)
      if (origin) {
        slot.x = origin.x
        slot.y = origin.y
      }
    }
  } else {
    // Free mode: delete the slot entirely — no ghost circle left behind
    fieldSlots.value = fieldSlots.value.filter(s => s.slotId !== slotId)
  }
}

function removePlayerFromField({ slotId }) {
  // Called when player is dropped on bench panel (desktop or mobile bottom sheet)
  removeFromSlot(slotId)
}

function resetAll() {
  if (selectedFormationId.value) {
    const formation = availableFormations.value.find(f => f.id === selectedFormationId.value)
    for (const s of fieldSlots.value) {
      s.playerId = null
      const origin = formation?.slots.find(fs => fs.id === s.slotId)
      if (origin) {
        s.x = origin.x
        s.y = origin.y
      }
    }
  } else {
    fieldSlots.value = []
  }
}

// ── Save ───────────────────────────────────────────────────
const showSave = ref(false)

function openSaveDialog() {
  if (!lineupName.value && activeTeam.value) {
    lineupName.value = `${activeTeam.value.name} – ${new Date().toLocaleDateString('nl-NL')}`
  }
  showSave.value = true
}

function confirmSave() {
  doSave()
}

function doSave() {
  capturePeriod()
  const saved = store.saveLineup({
    id:          lineupId.value ?? undefined,
    name:        lineupName.value,
    formationId: selectedFormationId.value,
    flipped:     flipped.value,
    opponentMode: opponentMode.value,
    showOpponent: opponentMode.value !== 'off',
    slots:       fieldSlots.value.map(s => ({ ...s })),
    periodMode:  periodMode.value,
    activePeriod: activePeriod.value,
    periods: periodMode.value
      ? periodSnapshots.value.map(p => ({
          formationId: p.formationId,
          slots: cloneLineupSlots(p.slots),
        }))
      : null,
  })
  lineupId.value = saved.id
  store.setActiveLineup(saved.id)
  if (route.path === '/lineup/new') {
    router.replace(`/lineup/${saved.id}`)
  }
  showSave.value = false
  refreshSnapshot()
  showSnackbar(t('lineup.saved'))
}

// ── Share ─────────────────────────────────────────────────
const showShareDialog = ref(false)
const shareDialogStep = ref('type')

function openShareDialog() {
  shareDialogStep.value = 'type'
  showShareDialog.value = true
}

function closeShareDialog() {
  showShareDialog.value = false
  shareDialogStep.value = 'type'
}

async function copyShareLink(mode) {
  const team = activeTeam.value
  if (!team) return
  const slotsWithPlayers = fieldSlots.value.map(s => ({
    ...s,
    player: s.playerId ? playersMap.value[s.playerId] : null,
  }))
  const encoded = mode === 'bundle'
    ? encodeBundle(team, { name: lineupName.value, formationId: selectedFormationId.value, flipped: flipped.value }, slotsWithPlayers, benchPlayers.value)
    : encodeLineupOnly(team, { name: lineupName.value, formationId: selectedFormationId.value, flipped: flipped.value }, slotsWithPlayers, benchPlayers.value)
  const url = buildLineupShareUrl(encoded)
  const result = await shareLink({ title: lineupName.value || t('lineupShare.defaultName'), text: lineupName.value || t('lineupShare.defaultName'), url })
  if (result === 'copied') showSnackbar(t('share.lineupCopied'))
  if (result === 'failed') showSnackbar(t('share.copyFailed'))
  closeShareDialog()
}

// ── Share via image ────────────────────────────────────────
const sharing        = ref(false)
const sharePreviewUrl = ref(null)
let   capturedBlob   = null

// Rounded-rect path helper for Canvas 2D
function _rdRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function drawShareCanvas() {
  const SCALE    = 3
  const W        = 540
  const PITCH_H  = Math.round(W * 8 / 5)  // 864
  const PAD      = 16
  const HEADER_H = 64
  const bench    = benchPlayers.value
  const COLS     = 3
  const BENCH_ROW = 40
  const BENCH_H  = bench.length ? Math.ceil(bench.length / COLS) * BENCH_ROW + 52 : 0
  const TOTAL_H  = HEADER_H + PITCH_H + BENCH_H

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = TOTAL_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const shirt = activeTeam.value?.shirt ?? { style: 'solid', primary: '#059669', secondary: '#ffffff' }
  const teamColor = shirt.primary

  // Helper: draw shirt-pattern circle
  function drawShirtCircle(cx, cy, r, ini) {
    ctx.save()
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
    if (shirt.style === 'solid') {
      ctx.fillStyle = shirt.primary
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
    } else if (shirt.style === 'gradient') {
      const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
      g.addColorStop(0, shirt.primary); g.addColorStop(1, shirt.secondary)
      ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
    } else if (shirt.style === 'halves' || shirt.style === 'halves-v') {
      ctx.fillStyle = shirt.primary;   ctx.fillRect(cx - r, cy - r, r, r * 2)
      ctx.fillStyle = shirt.secondary; ctx.fillRect(cx,     cy - r, r, r * 2)
    } else if (shirt.style === 'halves-h') {
      ctx.fillStyle = shirt.primary;   ctx.fillRect(cx - r, cy - r, r * 2, r)
      ctx.fillStyle = shirt.secondary; ctx.fillRect(cx - r, cy,     r * 2, r)
    } else if (shirt.style === 'stripes') {
      const sw = r * 2 / 4
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 === 0 ? shirt.primary : shirt.secondary
        ctx.fillRect(cx - r + i * sw, cy - r, sw, r * 2)
      }
    } else if (shirt.style === 'sash') {
      ctx.fillStyle = shirt.primary; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      ctx.fillStyle = shirt.secondary
      ctx.beginPath()
      ctx.moveTo(cx - r * 0.4, cy - r); ctx.lineTo(cx + r * 0.7, cy - r)
      ctx.lineTo(cx + r * 0.4, cy + r); ctx.lineTo(cx - r * 0.7, cy + r)
      ctx.closePath(); ctx.fill()
    }
    ctx.restore()
    // border
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    // initials – pick readable color
    const lP = hexLum(shirt.primary), lS = shirt.style === 'solid' ? lP : hexLum(shirt.secondary)
    const avgL = shirt.style === 'solid' ? lP : (lP + lS) / 2
    ctx.fillStyle = avgL > 0.55 ? '#111' : '#fff'
    ctx.font = `bold ${Math.round(r * .7)}px system-ui,sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini, cx, cy)
  }
  function hexLum(hex) {
    if (!hex || hex.length < 7) return 0.5
    const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255
    return 0.299*r + 0.587*g + 0.114*b
  }

  // Header
  ctx.fillStyle = teamColor
  ctx.fillRect(0, 0, W, HEADER_H)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 22px system-ui,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(lineupName.value || 'Opstelling', 16, HEADER_H / 2)
  if (activeTeam.value?.name) {
    ctx.font = '17px system-ui,sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,.75)'
    ctx.textAlign = 'right'
    ctx.fillText(activeTeam.value.name, W - 16, HEADER_H / 2)
  }

  // Pitch background
  const py = HEADER_H
  ctx.fillStyle = '#1a7a47'
  ctx.fillRect(0, py, W, PITCH_H)
  ctx.fillStyle = 'rgba(0,0,0,.04)'
  const sh = PITCH_H / 8
  for (let i = 0; i < 8; i += 2) ctx.fillRect(0, py + i * sh, W, sh)

  // Pitch markings
  const mx = PAD, my = py + PAD, mw = W - PAD * 2, mh = PITCH_H - PAD * 2
  ctx.strokeStyle = 'rgba(255,255,255,.65)'
  ctx.lineWidth = 1.5
  ctx.strokeRect(mx, my, mw, mh)
  ctx.beginPath(); ctx.moveTo(mx, my + mh / 2); ctx.lineTo(mx + mw, my + mh / 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(mx + mw / 2, my + mh / 2, mw * 0.15, 0, Math.PI * 2); ctx.stroke()
  ctx.beginPath(); ctx.arc(mx + mw / 2, my + mh / 2, 2, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(255,255,255,.65)'; ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1
  const paw = mw * 0.56, pax = mx + mw * 0.22, pah = mh * 0.175
  ctx.strokeRect(pax, my, paw, pah)
  ctx.strokeRect(mx + mw * 0.35, my, mw * 0.30, mh * 0.075)
  ctx.strokeRect(pax, my + mh - pah, paw, pah)
  ctx.strokeRect(mx + mw * 0.35, my + mh - mh * 0.075, mw * 0.30, mh * 0.075)
  const gx = mx + mw * 0.375, gw = mw * 0.25
  ctx.fillStyle = 'rgba(255,255,255,.15)'
  ctx.fillRect(gx, py, gw, PAD); ctx.strokeRect(gx, py, gw, PAD)
  ctx.fillRect(gx, my + mh, gw, PAD); ctx.strokeRect(gx, my + mh, gw, PAD)

  // Opponent tokens (drawn first, behind own team)
  if (isOpponentVisible.value) {
    const opp = opponentShirt.value
    function drawOppCircle(cx, cy, r, num) {
      ctx.save()
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
      if (opp.style === 'solid') {
        ctx.fillStyle = opp.primary
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      } else if (opp.style === 'gradient') {
        const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r)
        g.addColorStop(0, opp.primary); g.addColorStop(1, opp.secondary)
        ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
      } else if (opp.style === 'halves' || opp.style === 'halves-v') {
        ctx.fillStyle = opp.primary;   ctx.fillRect(cx - r, cy - r, r, r * 2)
        ctx.fillStyle = opp.secondary; ctx.fillRect(cx,     cy - r, r, r * 2)
      } else if (opp.style === 'halves-h') {
        ctx.fillStyle = opp.primary;   ctx.fillRect(cx - r, cy - r, r * 2, r)
        ctx.fillStyle = opp.secondary; ctx.fillRect(cx - r, cy,     r * 2, r)
      } else if (opp.style === 'stripes') {
        const sw = r * 2 / 4
        for (let i = 0; i < 4; i++) {
          ctx.fillStyle = i % 2 === 0 ? opp.primary : opp.secondary
          ctx.fillRect(cx - r + i * sw, cy - r, sw, r * 2)
        }
      } else if (opp.style === 'sash') {
        ctx.fillStyle = opp.primary; ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
        ctx.fillStyle = opp.secondary
        ctx.beginPath()
        ctx.moveTo(cx - r * 0.4, cy - r); ctx.lineTo(cx + r * 0.7, cy - r)
        ctx.lineTo(cx + r * 0.4, cy + r); ctx.lineTo(cx - r * 0.7, cy + r)
        ctx.closePath(); ctx.fill()
      }
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
      const lP = hexLum(opp.primary), lS = opp.style === 'solid' ? lP : hexLum(opp.secondary)
      const avgL = opp.style === 'solid' ? lP : (lP + lS) / 2
      ctx.fillStyle = avgL > 0.55 ? '#111' : '#fff'
      ctx.font = `bold ${Math.round(r * .65)}px system-ui,sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(num), cx, cy)
    }
    for (const slot of opponentSlots.value) {
      const dY = flipped.value ? 100 - slot.y : slot.y
      const cx = mx + (slot.x / 100) * mw
      const cy = my + (dY   / 100) * mh
      drawOppCircle(cx, cy, 24, slot.number)
    }
  }

  // Own team player tokens
  for (const slot of fieldSlots.value.filter(s => s.playerId)) {
    const player = playersMap.value[slot.playerId]
    if (!player) continue
    const parts = player.name.trim().split(/\s+/)
    const ini   = parts.length === 1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
    const dY = flipped.value ? 100 - slot.y : slot.y
    const cx = mx + (slot.x / 100) * mw
    const cy = my + (dY   / 100) * mh
    const r  = 28
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2
    drawShirtCircle(cx, cy, r, ini)
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    const first = parts[0].length > 8 ? parts[0].slice(0,7) + '.' : parts[0]
    ctx.font = 'bold 15px system-ui,sans-serif'
    const lw = ctx.measureText(first).width + 10
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    _rdRect(ctx, cx - lw / 2, cy + r + 4, lw, 20, 4); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(first, cx, cy + r + 14)
  }

  // Bench section
  if (bench.length) {
    const by = HEADER_H + PITCH_H
    ctx.fillStyle = '#f0fdf4'; ctx.fillRect(0, by, W, BENCH_H)
    ctx.fillStyle = '#059669'; ctx.font = 'bold 11px system-ui,sans-serif'
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle'
    ctx.fillText('BANK', 16, by + 18)
    const colW = (W - 16) / COLS
    bench.forEach((player, i) => {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const cx  = 8 + col * colW
      const cy  = by + 36 + row * BENCH_ROW
      const cw  = colW - 8
      const ch  = 28
      ctx.shadowColor = 'rgba(0,0,0,.08)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 1
      ctx.fillStyle = '#fff'; _rdRect(ctx, cx, cy, cw, ch, 14); ctx.fill()
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      const ar = 22, ax = cx + ar + 4, ay = cy + ch / 2
      ctx.shadowColor = 'rgba(0,0,0,.15)'; ctx.shadowBlur = 2
      const parts = player.name.trim().split(/\s+/)
      const ini   = parts.length === 1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      drawShirtCircle(ax, ay, ar, ini)
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
      const first = parts[0].length > 10 ? parts[0].slice(0,9) + '.' : parts[0]
      ctx.fillStyle = '#1e293b'; ctx.font = '500 14px system-ui,sans-serif'
      ctx.textAlign = 'left'; ctx.fillText(first, ax + ar + 4, ay)
    })
  }

  return canvas
}

async function shareImage() {
  sharing.value = true
  try {
    const canvas = drawShareCanvas()
    canvas.toBlob(blob => {
      capturedBlob = blob
      sharePreviewUrl.value = URL.createObjectURL(blob)
      sharing.value = false
      closeShareDialog()
    }, 'image/png')
  } catch (e) {
    sharing.value = false
    showSnackbar('Kon afbeelding niet maken')
  }
}

function downloadImage() {
  if (!sharePreviewUrl.value) return
  const a = document.createElement('a')
  a.href = sharePreviewUrl.value
  a.download = `${lineupName.value || 'lineup'}.png`
  a.click()
}

async function shareViaWhatsApp() {
  if (!capturedBlob) return
  try {
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([capturedBlob], 'opstelling.png', { type: 'image/png' })] })) {
      await navigator.share({
        title: lineupName.value || 'Opstelling',
        files: [new File([capturedBlob], 'opstelling.png', { type: 'image/png' })],
      })
    } else {
      // Fallback: open WhatsApp web with a message
      const url = encodeURIComponent(`Bekijk mijn opstelling: ${lineupName.value || 'TeamPilot'}`)
      window.open(`https://wa.me/?text=${url}`, '_blank', 'noopener')
    }
    sharePreviewUrl.value = null
  } catch {
    showSnackbar('Delen geannuleerd')
  }
}

</script>

<style scoped>
/* ── Page: full-height flex column on mobile (no page scroll) ── */
.builder-page {
  display: flex;
  flex-direction: column;
  flex: none;
  height: calc(100dvh - var(--top-bar-height) - var(--nav-height));
  overflow: hidden;
  padding: var(--sp-3) var(--sp-3) 0;
  box-sizing: border-box;
}

/* ── Sticky header shell (aligned with training page) ── */
.builder-header-shell {
  flex-shrink: 0;
}

@media (max-width: 899px) {
  .builder-page {
    padding-top: 0;
    gap: 0;
  }

  .builder-header-shell {
    position: sticky;
    top: 0;
    z-index: 25;
    margin: calc(-1 * var(--sp-3)) calc(-1 * var(--sp-3)) var(--sp-2);
    padding: var(--sp-2) var(--sp-3) 0;
    background: var(--md-surface);
    border-bottom: 1px solid var(--md-outline-variant);
    box-shadow: var(--sticky-header-shadow);
    overflow: visible;
  }
}

.builder-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  flex-shrink: 0;
}

/* ── Lineup switcher ─────────────────────────────────────── */
.lineup-switcher {
  position: relative;
  min-width: 0;
  flex: 1;
}
.switcher-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  background: var(--md-surface);
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  padding: var(--sp-2) var(--sp-3);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
  color: var(--md-on-surface);
  -webkit-tap-highlight-color: transparent;
  font-weight: 500;
}
.switcher-btn:hover {
  border-color: var(--md-outline);
}
.switcher-btn.open {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, transparent);
}
.switcher-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: 0;
}
.switcher-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switcher-meta {
  font-size: 12px;
  line-height: 1.2;
  display: none;
}
.switcher-chevron {
  font-size: 20px;
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-short);
  flex-shrink: 0;
}
.switcher-btn.open .switcher-chevron { transform: rotate(180deg); }

/* Mobile dropdown: fixed overlay full-screen */
.switcher-dropdown {
  position: fixed;
  inset: var(--top-bar-height) 0 var(--nav-height) 0;
  background: var(--md-background);
  z-index: 200;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-duration-short);
}
.switcher-btn.open ~ .switcher-dropdown {
  opacity: 1;
  pointer-events: auto;
}

.switcher-row {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: var(--md-shape-md);
}
.switcher-row.switcher-active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}
.switcher-delete {
  flex-shrink: 0;
  color: var(--md-error);
  margin-right: var(--sp-1);
}
.switcher-row.switcher-active .switcher-delete { color: var(--md-on-primary-container); opacity: .8; }
.switcher-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-on-surface);
  text-align: left;
  transition: background var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
}
.switcher-item:active { background: color-mix(in srgb, var(--md-on-surface) 8%, transparent); }
.switcher-row.switcher-active .switcher-item { background: transparent; color: inherit; }
.switcher-new {
  color: var(--md-primary);
  font-weight: 600;
  font-size: 14px;
}
.switcher-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}
.switcher-item-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.switcher-item-meta {
  font-size: 11px;
  color: var(--md-on-surface-variant);
}
.switcher-active .switcher-item-meta { color: inherit; opacity: .7; }
.switcher-divider { height: 1px; background: var(--md-outline-variant); margin: var(--sp-1) 0; }
.switcher-empty {
  padding: var(--sp-5) var(--sp-4);
  font-size: 13px;
  color: var(--md-on-surface-variant);
  text-align: center;
}

/* Desktop overrides */
@media (min-width: 720px) {
  .switcher-meta { display: block; }
  .switcher-dropdown {
    position: absolute;
    inset: unset;
    top: calc(100% + 6px);
    left: 0;
    min-width: 300px;
    max-width: 100vw;
    background: var(--md-surface);
    border: 1px solid var(--md-outline-variant);
    border-radius: var(--md-shape-md);
    box-shadow: var(--md-elevation-3);
    max-height: 320px;
    overflow-y: auto;
    opacity: 1;
    pointer-events: auto;
    display: flex;
    flex-direction: column;
  }
  .switcher-btn.open ~ .switcher-dropdown { display: flex; }
  .switcher-dropdown:not(.switcher-btn.open ~ .switcher-dropdown) { display: none; }
}

.toolbar-actions { display: flex; gap: var(--sp-2); flex-shrink: 0; align-items: center; }

.lineup-more {
  position: relative;
  flex-shrink: 0;
}

.lineup-more-btn {
  width: 36px;
  height: 36px;
  color: var(--md-on-surface-variant);
}

.period-chips {
  display: flex;
  gap: var(--sp-1);
  padding: var(--sp-2) 0 0;
}

@media (min-width: 720px) {
  .period-chips {
    padding-bottom: var(--sp-2);
  }
}

.period-chip {
  flex: 1;
  justify-content: center;
  min-height: 32px;
}

/* ── Mobile header controls ───────────────────────────────── */
.builder-header-controls {
  position: relative;
  margin-top: var(--sp-2);
  padding-bottom: var(--sp-2);
  border-top: 1px solid var(--md-outline-variant);
  overflow: visible;
}

.builder-header-controls-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--sp-2);
  padding-top: var(--sp-2);
}

.builder-header-controls-bar > .bench-anchor {
  flex-shrink: 0;
}

.formation-select-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--sp-1);
}

.formation-dropdown--inline {
  flex: 1;
  min-width: 0;
  min-height: 36px;
  padding: var(--sp-1) var(--sp-2);
  font-size: 13px;
}

.formation-info-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.controls-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
}

.controls-title-row .controls-title {
  margin: 0;
}

.chip-toggle--icon {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  min-width: 2.25rem;
  padding: 0;
}

.chip-toggle--sidebar {
  width: 100%;
  min-width: 0;
  height: 2.5rem;
  padding: 0;
}

.chip-toggle--icon.active .material-symbols-rounded,
.opponent-mode-mirror.active .material-symbols-rounded,
.opponent-mode-optimal.active .material-symbols-rounded,
.opponent-mode-alternative.active .material-symbols-rounded {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.builder-header-controls-expand {
  position: absolute;
  top: 100%;
  left: calc(-1 * var(--sp-3));
  right: calc(-1 * var(--sp-3));
  z-index: 30;
  padding: var(--sp-3);
  background: var(--md-surface);
  border-bottom: 1px solid var(--md-outline-variant);
  box-shadow: var(--md-elevation-2);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}

.builder-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.builder-col-field {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
}

.builder-col-field :deep(.field-wrapper) {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.controls-title {
  margin: 0;
}

.controls-expand-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--md-on-surface-variant);
  cursor: pointer;
  border-radius: var(--md-shape-full);
  -webkit-tap-highlight-color: transparent;
}

.controls-summary-chevron {
  flex-shrink: 0;
  color: var(--md-on-surface-variant);
  transition: transform var(--md-duration-short);
}

.controls-summary-chevron.open {
  transform: rotate(180deg);
}

.controls-options--summary {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: var(--sp-2);
}

.controls-options--summary > .chip-toggle,
.controls-options--summary > .bench-anchor {
  flex: 1 1 0;
  min-width: 0;
}

.controls-options--summary .chip-toggle {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  padding: var(--sp-1) var(--sp-2);
}

.controls-options--summary .chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.controls-backdrop {
  position: fixed;
  inset: var(--top-bar-height) 0 var(--nav-height) 0;
  z-index: 24;
  background: transparent;
}

.formation-dropdown {
  width: 100%;
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  padding: var(--sp-2) var(--sp-3);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
  outline: none;
  min-height: 40px;
  cursor: pointer;
  transition: border-color var(--md-duration-short), background var(--md-duration-short);
}

.formation-dropdown:hover {
  border-color: var(--md-outline);
}

.formation-dropdown:focus {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, transparent);
}

.formation-chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.formation-chips--stacked {
  flex-direction: column;
  align-items: stretch;
}

.formation-chips--stacked .chip {
  width: 100%;
  justify-content: center;
}

.controls-options--sidebar {
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
}

.controls-options--sidebar .chip-toggle {
  flex: 1;
  justify-content: center;
}

.sidebar-card {
  padding: var(--sp-3);
  flex-shrink: 0;
}

.controls-options {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2);
}

.bench-anchor {
  position: relative;
  min-width: 0;
}

.bench-anchor .chip-toggle {
  width: 100%;
}

.chip-toggle {
  min-height: 36px;
  padding: var(--sp-1) var(--sp-2);
  font-size: 12px;
  gap: 4px;
  border-radius: var(--md-shape-sm);
  white-space: nowrap;
}

@media (min-width: 720px) {
  .controls-options > .chip-toggle {
    flex: 0 1 auto;
  }
}

.chip-toggle .chip-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.bench-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 260px;
  max-width: calc(100vw - var(--sp-8));
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  box-shadow: var(--md-elevation-3);
  z-index: 160;
  max-height: 50dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.bench-dropdown--overlay {
  top: calc(100% + var(--sp-1));
  left: 0;
  right: 0;
  min-width: 0;
  max-width: none;
  z-index: 35;
}

.bench-dropdown.bench-dragging {
  opacity: 0;
  pointer-events: none;
}

.bench-drop-enter-active,
.bench-drop-leave-active {
  transition: opacity .18s ease, transform .2s cubic-bezier(.4,0,.2,1);
}
.bench-drop-enter-from,
.bench-drop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Desktop overrides (≥720px) ─────────────────────────── */
@media (min-width: 720px) {
  .builder-page {
    display: flex;
    flex-direction: column;
    height: calc(100dvh - var(--top-bar-height));
    max-width: none;
    overflow: hidden;
    padding: var(--sp-3);
    gap: var(--sp-3);
  }

  .builder-header-shell {
    margin-bottom: 0;
  }

  .builder-body {
    display: grid;
    grid-template-columns: minmax(200px, 240px) minmax(0, 1fr) minmax(240px, 280px);
    gap: var(--sp-4);
    align-items: stretch;
  }

  .builder-col-formation {
    padding: var(--sp-3);
    min-height: 0;
    overflow-y: auto;
    align-self: start;
    max-height: 100%;
  }

  .builder-col-field {
    min-height: 0;
    height: 100%;
  }

  .builder-col-bench {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    min-height: 0;
    overflow: hidden;
  }

  .builder-col-bench :deep(.bench-panel--sidebar) {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .builder-col-bench :deep(.bench-panel--sidebar .bench-scroll) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    align-content: flex-start;
  }

  .builder-col-bench .share-section {
    flex-shrink: 0;
  }
}

/* Mobile share strip below the field */
.share-mobile {
  flex-shrink: 0;
  padding-top: var(--sp-2);
  padding-bottom: calc(var(--nav-height) + var(--sp-2));
}
.share-mobile .share-btns { flex-direction: row; }
.share-mobile .share-btns .btn { flex: 1; }

/* ── Mobile bench dropdown (replaces bottom sheet) ──────── */
@media (max-width: 719px) {
  .builder-col-bench { display: none; }
}

/* Bank chip highlighted as drop target while dragging a field player */
.chip.drag-drop {
  background: var(--md-error-container, #fce8e6);
  color: var(--md-on-error-container, #410e0b);
  border-color: var(--md-error, #b3261e);
  box-shadow: var(--md-elevation-2);
}

/* Badge on Bank chip */
.chip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-1);
  padding: var(--sp-2) var(--sp-3);
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-full);
  cursor: pointer;
  color: var(--md-on-surface);
  font-size: 14px;
  font-weight: 500;
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
  white-space: nowrap;
  min-height: 40px;
}
.chip:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, var(--md-surface-variant));
}
.chip.active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
  border-color: var(--md-primary);
}

.chip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--md-shape-full);
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  margin-left: 2px;
}
.chip.active .chip-badge {
  background: var(--md-on-primary-container);
  color: var(--md-primary-container);
}

/* ── Overflow menus ──────────────────────────────────────── */
.lineup-more-menu {
  position: fixed;
  z-index: 400;
  min-width: 220px;
  padding: var(--sp-1) 0;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  box-shadow: var(--md-elevation-3);
}
.lineup-more-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: 10px var(--sp-4);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-on-surface);
  font-size: 14px;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.lineup-more-item .material-symbols-rounded {
  font-size: 20px;
  color: var(--md-on-surface-variant);
}
.lineup-more-item:hover,
.lineup-more-item:active {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}
.lineup-more-item:disabled { opacity: .4; pointer-events: none; }
.lineup-more-item.is-active {
  background: color-mix(in srgb, var(--md-primary) 10%, transparent);
}
.lineup-more-divider {
  height: 1px;
  margin: var(--sp-1) 0;
  background: var(--md-outline-variant);
}

.share-section { background: var(--md-surface-variant); border-radius: var(--md-shape-md); padding: var(--sp-3); }
.share-btns    { display: flex; flex-direction: column; gap: var(--sp-2); }

/* Share-link dialog options */
.share-link-options { display: flex; flex-direction: column; gap: var(--sp-2); margin-bottom: var(--sp-2); }
.share-link-opt {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-3);
  background: var(--md-surface-variant);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  cursor: pointer;
  text-align: left;
  transition: background var(--md-duration-short);
}
.share-link-opt:hover { background: color-mix(in srgb, var(--md-on-surface) 8%, var(--md-surface-variant)); }
.share-link-opt p { margin: 0; }

/* ── Bench-to-field touch ghost ──────────────────────────── */
.bench-touch-ghost {
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

/* ── Dialogs ─────────────────────────────────────────────── */
.share-dialog { max-width: 500px; }
.share-preview { width: 100%; border-radius: var(--md-shape-sm); margin-bottom: var(--sp-3); display: block; }

/* ── Switcher header (mobile) ──────────────────────────── */
.switcher-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-4);
  border-bottom: 1px solid var(--md-outline-variant);
  flex-shrink: 0;
}
.switcher-header .md-headline-sm { margin: 0; }
.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: var(--md-shape-full);
  cursor: pointer;
  color: var(--md-on-surface);
  font-size: 18px;
  transition: background var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
}
.btn-icon:active { background: color-mix(in srgb, var(--md-on-surface) 8%, transparent); }

.switcher-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

/* Desktop: hide header and content wrapper, show absolute dropdown */
@media (min-width: 720px) {
  .switcher-header { display: none; }
  .switcher-content { flex: none; overflow-y: visible; }
}

/* Hide button labels on mobile for compact icon-only toolbar */
@media (max-width: 719px) {
  .btn-lbl { display: none; }
  .toolbar-actions .btn { padding: var(--sp-2); min-width: 36px; justify-content: center; }
}
</style>
