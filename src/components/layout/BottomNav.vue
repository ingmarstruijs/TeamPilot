<template>
  <nav class="bottom-nav">
    <RouterLink
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item) }"
      :aria-current="isActive(item) ? 'page' : undefined"
    >
      <div class="nav-icon-wrap">
        <span class="material-symbols-rounded nav-icon">{{ item.icon }}</span>
      </div>
      <span class="nav-label md-label-md">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'

const route = useRoute()
const store = useTeamStore()

const lineupTo = computed(() => {
  // Prefer the stored active lineup if it still exists
  const id = store.activeLineupId
  if (id && store.lineups.find(l => l.id === id)) {
    return `/lineup/${id}`
  }
  // Fall back to most recently updated lineup for the current team
  const teamLus = store.teamLineups
  if (teamLus.length) {
    const newest = [...teamLus].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0]
    return `/lineup/${newest.id}`
  }
  return '/lineup/new'
})

const navItems = computed(() => [
  { to: '/',           icon: 'home',          label: 'Home'       },
  { to: '/players',    icon: 'groups',        label: 'Spelers'    },
  { to: lineupTo.value, icon: 'grid_view',   label: 'Opstelling' },
  { to: '/training',  icon: 'stadium',       label: 'Training' },
])

function isActive(item) {
  if (item.to.startsWith('/lineup/')) {
    return route.path.startsWith('/lineup/')
  }
  if (item.to === '/training') {
    return route.path.startsWith('/training')
  }
  return route.path === item.to
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: calc(var(--nav-height) + env(safe-area-inset-bottom));
  background: var(--md-surface);
  border-top: 1px solid var(--md-outline-variant);
  display: flex;
  align-items: flex-start;
  justify-content: space-around;
  z-index: 100;
  padding-top: 0;
  padding-bottom: env(safe-area-inset-bottom);
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
  text-decoration: none;
  color: var(--md-on-surface-variant);
  padding: var(--sp-2) var(--sp-1);
  transition: color var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
}
.nav-item.active { color: var(--md-primary); }
.nav-icon {
  font-size: 24px;
  transition: all var(--md-duration-short);
}
.nav-item.active .nav-icon {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}
.nav-label { font-size: 11px; font-weight: 500; }

/* Icon-chip: the only interactive highlight target */
.nav-item .nav-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 32px;
  border-radius: var(--md-shape-full);
  transition: background var(--md-duration-short);
}
.nav-item.active .nav-icon-wrap {
  background: var(--md-primary-container);
}
.nav-item:hover:not(.active) .nav-icon-wrap {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
}
</style>
