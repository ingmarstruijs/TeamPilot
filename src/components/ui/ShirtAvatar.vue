<template>
  <svg
    :width="size"
    :height="size"
    :viewBox="`0 0 ${size} ${size}`"
    style="display: block; flex: none; overflow: visible;"
  >
    <defs>
      <clipPath :id="`sa-c-${uid}`">
        <circle :cx="half" :cy="half" :r="half" />
      </clipPath>
      <linearGradient v-if="shirt.style === 'gradient'" :id="`sa-g-${uid}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="shirt.primary" />
        <stop offset="100%" :stop-color="shirt.secondary" />
      </linearGradient>
    </defs>

    <!-- Shirt pattern (clipped to circle) -->
    <g :clip-path="`url(#sa-c-${uid})`">
      <!-- Solid -->
      <rect v-if="shirt.style === 'solid'"
        x="0" y="0" :width="size" :height="size" :fill="shirt.primary" />

      <!-- Gradient top→bottom -->
      <rect v-else-if="shirt.style === 'gradient'"
        x="0" y="0" :width="size" :height="size" :fill="`url(#sa-g-${uid})`" />

      <!-- Halves vertical: left=primary, right=secondary -->
      <template v-else-if="shirt.style === 'halves' || shirt.style === 'halves-v'">
        <rect x="0" y="0" :width="half" :height="size" :fill="shirt.primary" />
        <rect :x="half" y="0" :width="half" :height="size" :fill="shirt.secondary" />
      </template>

      <!-- Halves horizontal: top=primary, bottom=secondary -->
      <template v-else-if="shirt.style === 'halves-h'">
        <rect x="0" y="0" :width="size" :height="half" :fill="shirt.primary" />
        <rect x="0" :y="half" :width="size" :height="half" :fill="shirt.secondary" />
      </template>

      <!-- Stripes: 4 vertical alternating stripes -->
      <template v-else-if="shirt.style === 'stripes'">
        <rect v-for="i in 4" :key="i"
          :x="(i - 1) * stripe" y="0" :width="stripe" :height="size"
          :fill="i % 2 === 1 ? shirt.primary : shirt.secondary" />
      </template>

      <!-- Sash: primary base + diagonal band -->
      <template v-else-if="shirt.style === 'sash'">
        <rect x="0" y="0" :width="size" :height="size" :fill="shirt.primary" />
        <polygon :points="sashPoints" :fill="shirt.secondary" />
      </template>
    </g>

    <!-- White border ring -->
    <circle :cx="half" :cy="half" :r="half - borderWidth / 2"
      fill="none" stroke="rgba(255,255,255,.75)" :stroke-width="borderWidth" />

    <!-- Initials with outline for legibility on any background -->
    <text v-if="initials"
      :x="half" :y="half"
      dominant-baseline="central"
      text-anchor="middle"
      :fill="textColor"
      :stroke="strokeColor"
      :stroke-width="strokeWidth"
      paint-order="stroke fill"
      :font-size="fontSize"
      font-weight="700"
      font-family="'Inter', system-ui, sans-serif"
      :clip-path="`url(#sa-c-${uid})`">{{ initials }}</text>
  </svg>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  shirt: {
    type: Object,
    default: () => ({ style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }),
  },
  initials: { type: String, default: '' },
  size:     { type: Number, default: 42 },
})

const uid  = getCurrentInstance().uid
const half = computed(() => props.size / 2)
const stripe = computed(() => props.size / 4)
const borderWidth = computed(() => props.size <= 30 ? 1.5 : 2.5)
const fontSize    = computed(() => Math.round(props.size * 0.36))

// Diagonal sash: parallelogram band from upper-right to lower-left
const sashPoints = computed(() => {
  const s = props.size
  return `${s * 0.35},0 ${s * 0.7},0 ${s * 0.65},${s} ${s * 0.3},${s}`
})

function hexLuminance(hex) {
  if (!hex || hex.length < 7) return 0.5
  try {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return 0.299 * r + 0.587 * g + 0.114 * b
  } catch { return 0.5 }
}

// Text color: contrast of primary (or avg of both for mixed styles)
const textColor = computed(() => {
  const style = props.shirt.style
  const lumP = hexLuminance(props.shirt.primary)
  const lumS = hexLuminance(props.shirt.secondary ?? '#ffffff')
  const lum = style === 'solid'    ? lumP
            : style === 'gradient' ? lumP
            : style === 'sash'     ? lumP
            : (lumP + lumS) / 2
  return lum > 0.55 ? '#111111' : '#ffffff'
})

// For mixed styles: add a contrasting text-stroke so initials stay readable
const strokeColor = computed(() => {
  const s = props.shirt.style
  if (s === 'solid' || s === 'gradient' || s === 'sash') return 'none'
  return textColor.value === '#ffffff' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.65)'
})

const strokeWidth = computed(() => {
  const s = props.shirt.style
  if (s === 'solid' || s === 'gradient' || s === 'sash') return 0
  return Math.max(1.5, props.size * 0.05)
})
</script>
