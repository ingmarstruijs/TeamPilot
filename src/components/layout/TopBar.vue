<template>
  <header class="top-bar">
    <div class="top-bar__inner">
      <RouterLink to="/" class="top-bar__leading">
        <div class="app-logo-mark">
          <span class="material-symbols-rounded">sports_soccer</span>
        </div>
        <span class="app-name">TeamPilot</span>
      </RouterLink>
      <span class="team-name" v-if="activeTeam">{{ activeTeam.name }}</span>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useTeamStore } from '@/stores/teamStore'

const store = useTeamStore()
const activeTeam = computed(() => store.activeTeam)
</script>

<style scoped>
.top-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: var(--top-bar-height);
  background: #0f172a;
  z-index: 100;
  box-shadow: 0 1px 0 rgba(255,255,255,.06), 0 2px 8px rgba(0,0,0,.3);
}
.top-bar__inner {
  max-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--sp-4);
}
.top-bar__leading {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  transition: opacity var(--md-duration-short);
}
.top-bar__leading:active {
  opacity: 0.7;
}
.app-logo-mark {
  width: 36px;
  height: 36px;
  background: var(--md-primary);
  border-radius: var(--md-shape-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}
.app-logo-mark .material-symbols-rounded {
  font-size: 20px;
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20;
}
.app-name {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -.3px;
}
.team-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: var(--sp-3);
}
</style>
