<template>
  <div class="page builder-page">
    <!-- Top toolbar -->
    <div class="builder-toolbar">
      <!-- Lineup switcher -->
      <div class="lineup-switcher" ref="switcherRef">
        <button class="switcher-btn" @click="showSwitcher = !showSwitcher" :class="{ open: showSwitcher }">
          <div class="switcher-text">
            <span class="md-title-sm switcher-name">{{ lineupName || 'Nieuwe Opstelling' }}</span>
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
            <h2 class="md-headline-sm">Opstellingen</h2>
            <button class="btn-icon" @click.stop="showSwitcher = false" aria-label="Sluiten">
              <span class="material-symbols-rounded">close</span>
            </button>
          </div>
          <div class="switcher-content">
            <button class="switcher-item switcher-new" @click.stop="startNew">
              <span class="material-symbols-rounded" style="font-size:18px">add</span>
              <span>Nieuwe opstelling</span>
            </button>
            <div v-if="teamLineups.length" class="switcher-divider"></div>
            <button
              v-for="lu in teamLineups"
              :key="lu.id"
              class="switcher-item"
              :class="{ 'switcher-active': lu.id === lineupId }"
              @click.stop="switchToLineup(lu)"
            >
              <span class="material-symbols-rounded" style="font-size:18px">{{ lu.id === lineupId ? 'radio_button_checked' : 'radio_button_unchecked' }}</span>
              <div class="switcher-item-info">
                <span class="switcher-item-name">{{ lu.name }}</span>
                <span class="switcher-item-meta">{{ lu.slots.filter(s=>s.playerId).length }} spelers · {{ lu.formationId || 'Vrij' }}</span>
              </div>
            </button>
            <div v-if="!teamLineups.length" class="switcher-empty">Geen opgeslagen opstellingen</div>
          </div>
        </div>
      </Transition>
      </div>

      <div class="toolbar-actions">
        <button class="btn btn-outlined" @click="resetAll" title="Alle posities leegmaken">
          <span class="material-symbols-rounded" style="font-size:18px">refresh</span>
          <span class="btn-lbl">Reset</span>
        </button>
        <button class="btn btn-tonal" @click="autoAssign" :disabled="!benchPlayers.length" title="Spelers automatisch invullen">
          <span class="material-symbols-rounded" style="font-size:18px">auto_awesome</span>
          <span class="btn-lbl">Auto</span>
        </button>
        <button class="btn btn-filled" @click="openSaveDialog">
          <span class="material-symbols-rounded" style="font-size:18px">save</span>
          <span class="btn-lbl">Opslaan</span>
        </button>
        <!-- Share submenu (mobile only — desktop has share panel in bench column) -->
        <div class="more-menu" ref="moreRef">
          <button class="btn btn-outlined" @click="showMore = !showMore" :class="{ active: showMore }" title="Delen">
            <span class="material-symbols-rounded" style="font-size:18px">share</span>
          </button>
          <Transition name="fade">
            <div v-if="showMore" class="more-dropdown">
              <button class="more-item" @click="shareImage(); showMore=false" :disabled="sharing">
                <span class="material-symbols-rounded">image</span>
                {{ sharing ? 'Bezig…' : 'Afbeelding' }}
              </button>
              <button class="more-item" @click="shareLink(); showMore=false">
                <span class="material-symbols-rounded">share</span>
                Link
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Formation chips -->
    <div class="formation-row">
      <button
        v-for="f in availableFormations"
        :key="f.id"
        class="chip"
        :class="{ active: selectedFormationId === f.id }"
        @click="applyFormation(f)"
      >{{ f.label }}</button>
      <button class="chip" :class="{ active: !selectedFormationId }" @click="freeMode">
        <span class="material-symbols-rounded" style="font-size:14px">edit</span>
        Vrij
      </button>
      <button class="chip" @click="flipped = !flipped" :title="flipped ? 'Aanval omhoog' : 'Keeper omlaag'">
        <span class="material-symbols-rounded" style="font-size:14px">swap_vert</span>
        <span class="chip-label">Omdraaien</span>
      </button>
      <button v-if="!isDesktop" class="chip" :class="{ active: showBench }" @click="showBench = !showBench">
        <span class="material-symbols-rounded" style="font-size:14px">group</span>
        Bank
        <span v-if="benchPlayers.length" class="chip-badge">{{ benchPlayers.length }}</span>
      </button>
    </div>

    <!-- Main layout: field + bench -->
    <div class="builder-layout">
      <!-- Bench column: desktop only -->
      <div v-if="isDesktop" class="bench-col">
        <BenchPanel
          :bench-players="benchPlayers"
          :team-color="activeTeam?.color"
          :horizontal="false"
          @bench-drag-start="onBenchDragStart"
          @bench-touch-start="onBenchTouchStart"
        />

        <!-- Share buttons: desktop only inside bench column -->
        <div v-if="filledCount > 0 && isDesktop" class="share-section">
          <p class="md-label-lg" style="margin-bottom:var(--sp-2)">Delen</p>
          <div class="share-btns">
            <button class="btn btn-tonal w-full" @click="shareImage" :disabled="sharing">
              <span class="material-symbols-rounded" style="font-size:18px">image</span>
              {{ sharing ? 'Bezig…' : 'Afbeelding' }}
            </button>
            <button class="btn btn-tonal w-full" @click="shareLink">
              <span class="material-symbols-rounded" style="font-size:18px">share</span>
              Link
            </button>
          </div>
        </div>
      </div>

      <!-- Football field -->
      <div class="field-col">
        <FootballField
          :slots="fieldSlots"
          :players="playersMap"
          :team-color="activeTeam?.color"
          :flipped="flipped"
          export-id="field-export-area"
          @slot-drop="handleSlotDrop"
          @remove-from-slot="removeFromSlot"
        />
      </div>
    </div>

    <!-- Mobile bench bottom sheet -->
    <Transition name="slide-bench">
      <div v-if="showBench && !isDesktop" class="bench-sheet" @click.self="showBench = false">
        <div class="bench-sheet-inner">
          <div class="bench-sheet-handle" @click="showBench = false">
            <div class="bench-handle-bar"></div>
          </div>
          <BenchPanel
            :bench-players="benchPlayers"
            :team-color="activeTeam?.color"
            :horizontal="false"
            @bench-drag-start="onBenchDragStart"
            @bench-touch-start="onBenchTouchStart"
          />
        </div>
      </div>
    </Transition>

    <!-- Bench-to-field touch drag ghost -->
    <div
      v-if="benchTouchGhost"
      class="bench-touch-ghost"
      :style="{ left: benchTouchGhost.x + 'px', top: benchTouchGhost.y + 'px', background: benchTouchGhost.color }"
    >{{ benchTouchGhost.initials }}</div>

    <!-- Save Dialog -->
    <Transition name="fade">
      <div v-if="showSave" class="dialog-backdrop" @click.self="showSave=false">
        <div class="dialog">
          <p class="dialog-title">Opstelling opslaan</p>
          <div class="field-wrap" style="margin-bottom:var(--sp-4)">
            <label class="field-label" for="lineup-name">Naam opstelling</label>
            <input id="lineup-name" class="field" v-model.trim="lineupName"
              placeholder="bijv. Thuis vs Ajax JO11" maxlength="50" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="showSave=false">Annuleren</button>
            <button class="btn btn-filled" :disabled="!lineupName" @click="doSave">Opslaan</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Share image preview dialog -->
    <Transition name="fade">
      <div v-if="sharePreviewUrl" class="dialog-backdrop" @click.self="sharePreviewUrl=null">
        <div class="dialog share-dialog">
          <p class="dialog-title">Opstelling delen</p>
          <img :src="sharePreviewUrl" class="share-preview" alt="Opstelling preview" />
          <div class="dialog-actions" style="flex-wrap:wrap;gap:var(--sp-2)">
            <button class="btn btn-text" @click="sharePreviewUrl=null">Sluiten</button>
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
import { FORMATIONS } from '@/data/formations'
import FootballField from '@/components/field/FootballField.vue'
import BenchPanel    from '@/components/field/BenchPanel.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { useMediaQuery } from '@/composables/useMediaQuery'

const props = defineProps({ id: String })
const store  = useTeamStore()
const route  = useRoute()
const router = useRouter()
const isDesktop = useMediaQuery('(min-width: 720px)')

// ── Lineup switcher ────────────────────────────────────────
const showSwitcher = ref(false)
const switcherRef  = ref(null)
const showMore     = ref(false)
const moreRef      = ref(null)
const showBench    = ref(false)

function closeOnOutsideClick(e) {
  if (switcherRef.value && !switcherRef.value.contains(e.target)) {
    showSwitcher.value = false
  }
  if (moreRef.value && !moreRef.value.contains(e.target)) {
    showMore.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', closeOnOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', closeOnOutsideClick))

function switchToLineup(lu) {
  showSwitcher.value = false
  router.push(`/lineup/${lu.id}`)
}

function startNew() {
  showSwitcher.value = false
  store.setActiveLineup(null)
  // Reset state in place (avoids remount flicker on /lineup/new)
  lineupId.value   = null
  lineupName.value = ''
  flipped.value    = true
  if (availableFormations.value.length) {
    applyFormation(availableFormations.value[0])
  } else {
    buildFreeSlots(ageGroupConfig.value?.players ?? 11)
  }
  router.replace('/lineup/new')
}

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
const flipped             = ref(true) // true = GK at bottom (default)

// fieldSlots: [{ slotId, position, x, y, playerId|null }]
const fieldSlots = ref([])

const filledCount = computed(() => fieldSlots.value.filter(s => s.playerId).length)

// Players not on field
const benchPlayers = computed(() => {
  const onField = new Set(fieldSlots.value.map(s => s.playerId).filter(Boolean))
  return (activeTeam.value?.players ?? []).filter(p => !onField.has(p.id))
})

// ── Init / load lineup ─────────────────────────────────────
onMounted(() => {
  const id = props.id ?? route.params.id
  if (id) {
    const existing = store.getLineup(id)
    if (existing) {
      lineupId.value   = existing.id
      lineupName.value = existing.name
      selectedFormationId.value = existing.formationId ?? null
      fieldSlots.value = existing.slots.map(s => ({ ...s }))
      flipped.value    = existing.flipped ?? true
      store.setActiveLineup(existing.id)
      return
    }
  }
  // No id in URL: redirect to last active lineup if one still exists
  const lastId = store.activeLineupId
  if (lastId) {
    const last = store.getLineup(lastId)
    if (last) {
      router.replace(`/lineup/${lastId}`)
      return
    }
  }
  // Fresh lineup
  if (availableFormations.value.length) {
    applyFormation(availableFormations.value[0])
  } else {
    buildFreeSlots((ageGroupConfig.value?.players) ?? 11)
  }
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
}

function freeMode() {
  selectedFormationId.value = null
  // Keep only filled slots — no more ghost placeholder circles in free mode
  fieldSlots.value = fieldSlots.value.filter(s => s.playerId)
}

function buildFreeSlots(count) {
  // Evenly distribute slots
  const rows    = Math.ceil(Math.sqrt(count))
  const cols    = Math.ceil(count / rows)
  const slots   = []
  const xStep   = 100 / (cols + 1)
  const yStep   = 80  / (rows + 1)
  let idx = 0
  for (let r = 0; r < rows && idx < count; r++) {
    for (let c = 0; c < cols && idx < count; c++) {
      slots.push({
        slotId:   `free-${idx}`,
        position: idx === 0 ? 'GK' : 'MID',
        x: (c + 1) * xStep,
        y: (r + 1) * yStep + 10,
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

function playerInitials(player) {
  const parts = player.name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function onBenchTouchStart({ event, player }) {
  showBench.value = false // reveal full field when drag starts
  pendingBenchPlayer = player
  const touch = event.touches[0]
  benchTouchGhost.value = {
    x:       touch.clientX - 24,
    y:       touch.clientY - 24,
    initials: playerInitials(player),
    color:   activeTeam.value?.color ?? '#059669',
  }

  function onMove(e) {
    e.preventDefault()
    const t = e.touches[0]
    benchTouchGhost.value = { ...benchTouchGhost.value, x: t.clientX - 24, y: t.clientY - 24 }
  }

  function onEnd(e) {
    document.removeEventListener('touchmove', onMove)
    document.removeEventListener('touchend', onEnd)
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
      handleSlotDrop({
        type:         'bench',
        playerId:     pendingBenchPlayer.id,
        targetSlotId: null,
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
      // Free reposition
      srcSlot.x = Math.min(Math.max(targetX, 5), 95)
      srcSlot.y = Math.min(Math.max(targetY, 5), 95)
    }
  } else if (type === 'bench') {
    // Dropping a bench player onto the field
    const pid = playerId ?? pendingBenchPlayer?.id
    if (!pid) return

    if (targetSlotId) {
      // Dropped directly onto an empty slot indicator
      const dstSlot = fieldSlots.value.find(s => s.slotId === targetSlotId)
      if (dstSlot && !dstSlot.playerId) {
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
      // Free mode: place at exact drop coordinates
      fieldSlots.value.push({
        slotId:   `free-${Date.now()}`,
        position: playersMap.value[pid]?.position ?? 'MID',
        x: Math.min(Math.max(targetX, 5), 95),
        y: Math.min(Math.max(targetY, 5), 95),
        playerId: pid,
      })
    }
    pendingBenchPlayer = null
  }
}

function removeFromSlot(slotId) {
  if (selectedFormationId.value) {
    // Formation mode: clear the player but keep the slot open as a target
    const slot = fieldSlots.value.find(s => s.slotId === slotId)
    if (slot) slot.playerId = null
  } else {
    // Free mode: delete the slot entirely — no ghost circle left behind
    fieldSlots.value = fieldSlots.value.filter(s => s.slotId !== slotId)
  }
}

function resetAll() {
  if (selectedFormationId.value) {
    for (const s of fieldSlots.value) s.playerId = null
  } else {
    fieldSlots.value = []
  }
}

function autoAssign() {
  // Get empty slots and available bench players
  const emptySlots = fieldSlots.value.filter(s => !s.playerId)
  if (!emptySlots.length || !benchPlayers.value.length) return

  // Shuffle bench players so repeated auto-assign gives variety
  const pool = [...benchPlayers.value].sort(() => Math.random() - 0.5)

  // Position priority order for matching
  const priority = ['GK', 'DEF', 'WB', 'MID', 'ATT']
  const slotsByPos  = new Map(priority.map(p => [p, emptySlots.filter(s => s.position === p)]))
  const playersByPos = new Map(priority.map(p => [p, pool.filter(pl => pl.position === p)]))

  const assigned = new Set()

  // Pass 1: exact position match
  for (const pos of priority) {
    const slots   = slotsByPos.get(pos)
    const players = playersByPos.get(pos)
    for (const slot of slots) {
      if (assigned.has(slot.slotId)) continue
      const player = players.find(pl => !assigned.has(pl.id))
      if (player) {
        slot.playerId = player.id
        assigned.add(player.id)
        assigned.add(slot.slotId)
      }
    }
  }

  // Pass 2: fill remaining empty slots with leftover players (any position)
  const stillEmpty  = emptySlots.filter(s => !assigned.has(s.slotId))
  const leftover    = pool.filter(pl => !assigned.has(pl.id))
  for (let i = 0; i < stillEmpty.length && i < leftover.length; i++) {
    stillEmpty[i].playerId = leftover[i].id
  }

  const placed = emptySlots.filter(s => s.playerId).length
  showSnackbar(`${placed} speler${placed !== 1 ? 's' : ''} automatisch ingevuld`)
}

// ── Save ───────────────────────────────────────────────────
const showSave = ref(false)

function openSaveDialog() {
  if (!lineupName.value && activeTeam.value) {
    lineupName.value = `${activeTeam.value.name} – ${new Date().toLocaleDateString('nl-NL')}`
  }
  showSave.value = true
}

function doSave() {
  const saved = store.saveLineup({
    id:          lineupId.value ?? undefined,
    name:        lineupName.value,
    formationId: selectedFormationId.value,
    flipped:     flipped.value,
    slots:       fieldSlots.value.map(s => ({ ...s })),
  })
  lineupId.value = saved.id
  store.setActiveLineup(saved.id)
  if (route.path === '/lineup/new') {
    router.replace(`/lineup/${saved.id}`)
  }
  showSave.value = false
  showSnackbar('Opstelling opgeslagen ✓')
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
  const SCALE    = 2
  const W        = 480
  const PITCH_H  = Math.round(W * 8 / 5)  // 768
  const PAD      = 14
  const HEADER_H = 56
  const bench    = benchPlayers.value
  const COLS     = 3
  const BENCH_ROW = 36
  const BENCH_H  = bench.length ? Math.ceil(bench.length / COLS) * BENCH_ROW + 48 : 0
  const TOTAL_H  = HEADER_H + PITCH_H + BENCH_H

  const canvas = document.createElement('canvas')
  canvas.width  = W * SCALE
  canvas.height = TOTAL_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)

  const teamColor = activeTeam.value?.color ?? '#059669'

  // Header
  ctx.fillStyle = teamColor
  ctx.fillRect(0, 0, W, HEADER_H)
  ctx.fillStyle = '#fff'
  ctx.font = 'bold 16px system-ui,sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(lineupName.value || 'Opstelling', 16, HEADER_H / 2)
  if (activeTeam.value?.name) {
    ctx.font = '13px system-ui,sans-serif'
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

  // Player tokens
  for (const slot of fieldSlots.value.filter(s => s.playerId)) {
    const player = playersMap.value[slot.playerId]
    if (!player) continue
    const dY = flipped.value ? 100 - slot.y : slot.y
    const cx = mx + (slot.x / 100) * mw
    const cy = my + (dY   / 100) * mh
    const r  = 16
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 2
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fillStyle = teamColor; ctx.fill()
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
    ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.stroke()
    const parts = player.name.trim().split(/\s+/)
    const ini   = parts.length === 1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
    ctx.fillStyle = '#fff'
    ctx.font = `bold ${Math.round(r * .7)}px system-ui,sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini, cx, cy)
    const first = parts[0].length > 8 ? parts[0].slice(0,7) + '.' : parts[0]
    ctx.font = 'bold 8px system-ui,sans-serif'
    const lw = ctx.measureText(first).width + 8
    ctx.fillStyle = 'rgba(0,0,0,.6)'
    _rdRect(ctx, cx - lw / 2, cy + r + 2, lw, 13, 3); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(first, cx, cy + r + 8)
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
      const ar = 10, ax = cx + ar + 4, ay = cy + ch / 2
      ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2)
      ctx.fillStyle = teamColor; ctx.fill()
      const parts = player.name.trim().split(/\s+/)
      const ini   = parts.length === 1 ? parts[0].slice(0,2).toUpperCase() : (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 7px system-ui,sans-serif'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ini, ax, ay)
      const first = parts[0].length > 10 ? parts[0].slice(0,9) + '.' : parts[0]
      ctx.fillStyle = '#1e293b'; ctx.font = '500 10px system-ui,sans-serif'
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

// ── Share via link ─────────────────────────────────────────
function shareLink() {
  // Encode the lineup as a compressed base64 URL parameter
  const data = {
    n: lineupName.value,
    t: activeTeam.value?.name,
    a: activeTeam.value?.ageGroup,
    c: activeTeam.value?.color,
    f: selectedFormationId.value,
    fl: flipped.value,
    s: fieldSlots.value.map(s => ({
      id: s.slotId,
      p: s.position,
      x: Math.round(s.x),
      y: Math.round(s.y),
      pid: s.playerId ? (playersMap.value[s.playerId]?.name ?? null) : null,
      num: s.playerId ? (playersMap.value[s.playerId]?.number ?? null) : null,
    })),
  }
  const encoded = btoa(encodeURIComponent(JSON.stringify(data)))
  const url = `${window.location.origin}${window.location.pathname}#/share?d=${encoded}`

  if (navigator.share) {
    navigator.share({ title: lineupName.value || 'Opstelling', url }).catch(() => {})
  } else {
    navigator.clipboard.writeText(url).then(() => {
      showSnackbar('Link gekopieerd naar klembord!')
    }).catch(() => {
      showSnackbar('Kon link niet kopiëren')
    })
  }
}
</script>

<style scoped>
/* ── Page: full-height flex column on mobile (no page scroll) ── */
.builder-page {
  display: flex;
  flex-direction: column;
  flex: none; /* override flex:1 from .page so explicit height is respected */
  height: calc(100dvh - var(--top-bar-height) - var(--nav-height));
  overflow: hidden;
  padding: var(--sp-3) var(--sp-4) 0;
  box-sizing: border-box;
}

.builder-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
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
.switcher-item.switcher-active { background: var(--md-primary-container); color: var(--md-on-primary-container); }
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
.switcher-active .switcher-item-meta { color: var(--md-on-primary-container); opacity: .7; }
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

.formation-row {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  gap: var(--sp-2);
  margin-bottom: var(--sp-2);
  flex-shrink: 0;
  padding-bottom: 2px;
}
.formation-row::-webkit-scrollbar { display: none; }
.formation-row > * { flex-shrink: 0; }

/* Builder layout: column on mobile, row on desktop */
.builder-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
/* Mobile: bench above, field fills remaining space */
.bench-col  { flex-shrink: 0; }
.field-col  {
  flex: 1;
  min-height: 0;
  display: flex;
}

/* Mobile share strip below the field */
.share-mobile {
  flex-shrink: 0;
  padding-top: var(--sp-2);
  padding-bottom: calc(var(--nav-height) + var(--sp-2));
}
.share-mobile .share-btns { flex-direction: row; }
.share-mobile .share-btns .btn { flex: 1; }

/* ── Desktop overrides (≥720px) ─────────────────────────── */
@media (min-width: 720px) {
  .builder-page {
    height: auto;
    overflow: visible;
    padding-bottom: var(--sp-6);
  }
  .builder-layout {
    flex: unset;
    flex-direction: row;
    align-items: flex-start;
    gap: var(--sp-4);
  }
  /* Field left (order:1), bench right (order:2) */
  .field-col {
    flex: 1;
    height: auto;
    min-width: 0;
    order: 1;
    display: block;
  }
  .bench-col {
    width: 280px;
    flex-shrink: 0;
    order: 2;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }
}

/* ── Mobile bench bottom sheet ──────────────────────────── */
.bench-sheet {
  position: fixed;
  inset: var(--top-bar-height) 0 var(--nav-height) 0;
  z-index: 150;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  background: rgba(0,0,0,.4);
}
.bench-sheet-inner {
  background: var(--md-surface);
  border-radius: 16px 16px 0 0;
  max-height: 55dvh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--sp-4);
}
.bench-sheet-handle {
  display: flex;
  justify-content: center;
  padding: var(--sp-2) 0 var(--sp-1);
  cursor: pointer;
}
.bench-handle-bar {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--md-outline-variant);
}

/* Slide-up transition */
.slide-bench-enter-active { transition: opacity .2s ease; }
.slide-bench-leave-active  { transition: opacity .2s ease; }
.slide-bench-enter-from, .slide-bench-leave-to { opacity: 0; }
.slide-bench-enter-active .bench-sheet-inner,
.slide-bench-leave-active .bench-sheet-inner  { transition: transform .25s cubic-bezier(.4,0,.2,1); }
.slide-bench-enter-from .bench-sheet-inner,
.slide-bench-leave-to .bench-sheet-inner      { transform: translateY(100%); }

/* Badge on Bank chip */
.chip-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: var(--md-shape-full);
  background: var(--md-primary);
  color: var(--md-on-primary);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  margin-left: 2px;
}
.chip.active .chip-badge {
  background: var(--md-on-primary-container);
  color: var(--md-primary-container);
}

/* ── More submenu (mobile share) ────────────────────────── */
.more-menu {
  position: relative;
  flex-shrink: 0;
}
.more-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--md-surface);
  border: 1px solid var(--md-outline-variant);
  border-radius: var(--md-shape-md);
  box-shadow: var(--md-elevation-3);
  min-width: 160px;
  z-index: 200;
  overflow: hidden;
}
.more-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  width: 100%;
  padding: var(--sp-3) var(--sp-4);
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--md-on-surface);
  font-size: 14px;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}
.more-item:hover, .more-item:active {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}
.more-item:disabled { opacity: .4; pointer-events: none; }
.more-item .material-symbols-rounded { font-size: 20px; color: var(--md-on-surface-variant); }
@media (min-width: 720px) { .more-menu { display: none; } }


.share-section { background: var(--md-surface-variant); border-radius: var(--md-shape-md); padding: var(--sp-3); }
.share-btns    { display: flex; flex-direction: column; gap: var(--sp-2); }

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
  .chip-label { display: none; }
  .toolbar-actions .btn { padding: var(--sp-2); min-width: 36px; justify-content: center; }
}
</style>
