<template>
  <div class="page share-view">
    <div v-if="lineup" class="share-content">
      <div class="share-header">
        <span class="share-badge" :style="{ background: lineup.color }">⚽</span>
        <div>
          <h1 class="md-headline-sm">{{ lineup.name }}</h1>
          <p class="md-body-md" style="color:var(--md-on-surface-variant)">
            {{ lineup.teamName }} · {{ lineup.ageGroup }}
          </p>
        </div>
      </div>

      <!-- Read-only field -->
      <div class="share-field" :style="{ '--fc': lineup.color }">
        <svg class="field-markings" viewBox="0 0 100 160" preserveAspectRatio="none">
          <rect x="0" y="40"  width="100" height="20" fill="rgba(0,0,0,.04)"/>
          <rect x="0" y="80"  width="100" height="20" fill="rgba(0,0,0,.04)"/>
          <rect x="0" y="120" width="100" height="20" fill="rgba(0,0,0,.04)"/>
          <rect x="2" y="2" width="96" height="156" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1.5"/>
          <line x1="2" y1="80" x2="98" y2="80" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
          <circle cx="50" cy="80" r="15" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
          <rect x="22" y="2"   width="56" height="28" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
          <rect x="22" y="130" width="56" height="28" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="1"/>
        </svg>
        <!-- Player tokens (readonly) -->
        <div
          v-for="slot in filledSlots"
          :key="slot.id"
          class="share-token"
          :style="{ left: slot.x+'%', top: slot.y+'%', '--tc': lineup.color }"
        >
          <div class="st-avatar" :style="{ background: lineup.color }">{{ initials(slot.pid) }}</div>
          <div class="st-name">{{ slot.pid }}</div>
        </div>
      </div>

      <div class="share-cta">
        <RouterLink to="/" class="btn btn-filled">
          <span class="material-symbols-rounded" style="font-size:18px">sports_soccer</span>
          Open TeamPilot
        </RouterLink>
      </div>
    </div>

    <div v-else class="empty-state">
      <span class="material-symbols-rounded empty-icon">link_off</span>
      <p class="md-title-md">Ongeldige link</p>
      <RouterLink to="/" class="btn btn-filled mt-3">Naar home</RouterLink>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const lineup = computed(() => {
  try {
    const encoded = route.query.d
    if (!encoded) return null
    const data = JSON.parse(decodeURIComponent(atob(encoded)))
    return {
      name:     data.n,
      teamName: data.t,
      ageGroup: data.a,
      color:    data.c ?? '#1a6b3c',
      slots:    data.s ?? [],
    }
  } catch {
    return null
  }
})

const filledSlots = computed(() =>
  (lineup.value?.slots ?? []).filter(s => s.pid)
)

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
</script>

<style scoped>
.share-view { max-width: 560px; margin: 0 auto; }
.share-header {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  margin-bottom: var(--sp-4);
}
.share-badge {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}
.share-field {
  position: relative;
  width: 100%;
  aspect-ratio: 5 / 8;
  background: color-mix(in srgb, var(--fc, #1a6b3c) 85%, #2d5a1b);
  border-radius: var(--md-shape-md);
  overflow: hidden;
  box-shadow: var(--md-elevation-3);
  margin-bottom: var(--sp-4);
}
.field-markings {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.share-token {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transform: translate(-50%, -50%);
}
.st-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 13px;
  border: 2px solid rgba(255,255,255,.7);
  box-shadow: 0 2px 6px rgba(0,0,0,.3);
}
.st-name {
  background: rgba(0,0,0,.6);
  color: #fff;
  font-size: 8px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  white-space: nowrap;
  max-width: 56px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.share-cta { display: flex; justify-content: center; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--sp-3);
  padding: var(--sp-8) var(--sp-4);
  color: var(--md-on-surface-variant);
}
.empty-icon { font-size: 64px; opacity: .4; }
</style>
