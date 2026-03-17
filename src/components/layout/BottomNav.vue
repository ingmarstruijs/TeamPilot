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
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/',           icon: 'home',          label: 'Home'       },
  { to: '/players',    icon: 'group',         label: 'Spelers'    },
  { to: '/lineup/new', icon: 'sports_soccer', label: 'Opstelling' },
  { to: '/lineups',    icon: 'folder_open',   label: 'Opgeslagen' },
]

function isActive(item) {
  if (item.to === '/lineup/new') {
    return route.path.startsWith('/lineup')
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
  height: var(--nav-height);
  background: var(--md-surface);
  border-top: 1px solid var(--md-outline-variant);
  display: flex;
  align-items: center;
  justify-content: space-around;
  z-index: 100;
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
  border-radius: var(--md-shape-md);
  transition: color var(--md-duration-short);
  -webkit-tap-highlight-color: transparent;
}
.nav-item.active  { color: var(--md-primary); }
.nav-icon {
  font-size: 24px;
  transition: all var(--md-duration-short);
}
.nav-item.active .nav-icon {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}
.nav-label { font-size: 11px; font-weight: 500; }

/* Active indicator pill behind icon */
.nav-item .nav-icon-wrap {
  position: relative;
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
</style>
