<template>
  <Transition name="fade">
    <div
      v-if="open"
      class="zoom-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Vergroot schema"
      @click.self="close"
    >
      <button type="button" class="btn-icon zoom-close" aria-label="Sluiten" @click="close">
        <span class="material-symbols-rounded">close</span>
      </button>

      <div
        ref="viewportRef"
        class="zoom-viewport"
        @wheel.prevent="onWheel"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          v-if="src"
          ref="imgRef"
          :src="src"
          :alt="alt"
          class="zoom-image"
          :style="imageStyle"
          draggable="false"
        />
      </div>

      <div class="zoom-toolbar">
        <button type="button" class="btn btn-tonal zoom-btn" aria-label="Uitzoomen" @click="adjustScale(-0.25)">
          <span class="material-symbols-rounded">remove</span>
        </button>
        <span class="zoom-level md-label-sm">{{ Math.round(scale * 100) }}%</span>
        <button type="button" class="btn btn-tonal zoom-btn" aria-label="Inzoomen" @click="adjustScale(0.25)">
          <span class="material-symbols-rounded">add</span>
        </button>
        <button type="button" class="btn btn-text zoom-btn" @click="resetView">Reset</button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  src: { type: String, default: null },
  alt: { type: String, default: 'Vergroot oefenschema' },
})

const emit = defineEmits(['close'])

const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)
const viewportRef = ref(null)
const imgRef = ref(null)

let dragging = false
let dragStart = { x: 0, y: 0 }
let translateStart = { x: 0, y: 0 }

const imageStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
}))

function resetView() {
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

function adjustScale(delta) {
  scale.value = Math.min(4, Math.max(0.5, scale.value + delta))
}

function close() {
  emit('close')
}

function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.15 : 0.15
  adjustScale(delta)
}

function onPointerDown(e) {
  if (e.pointerType === 'touch' && e.isPrimary) {
    // pinch handled via second touch in move
  }
  dragging = true
  dragStart = { x: e.clientX, y: e.clientY }
  translateStart = { x: translateX.value, y: translateY.value }
  viewportRef.value?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!dragging) return
  translateX.value = translateStart.x + (e.clientX - dragStart.x)
  translateY.value = translateStart.y + (e.clientY - dragStart.y)
}

function onPointerUp(e) {
  dragging = false
  viewportRef.value?.releasePointerCapture?.(e.pointerId)
}

function onKeydown(e) {
  if (e.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  open => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) resetView()
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
  { immediate: true }
)

onUnmounted(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.zoom-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: env(safe-area-inset-top, 0) env(safe-area-inset-right, 0) env(safe-area-inset-bottom, 0) env(safe-area-inset-left, 0);
}

.zoom-close {
  position: absolute;
  top: max(var(--sp-3), env(safe-area-inset-top, 0px));
  right: var(--sp-3);
  z-index: 2;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
}

.zoom-viewport {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}

.zoom-viewport:active {
  cursor: grabbing;
}

.zoom-image {
  max-width: 92vw;
  max-height: 70dvh;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 80ms linear;
  user-select: none;
  -webkit-user-drag: none;
}

@media (prefers-reduced-motion: reduce) {
  .zoom-image {
    transition: none;
  }
}

.zoom-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4) max(var(--sp-4), env(safe-area-inset-bottom, 0px));
  width: 100%;
}

.zoom-btn {
  min-height: 40px;
  color: white;
}

.zoom-level {
  min-width: 3rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.85);
}
</style>
