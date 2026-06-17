<template>
  <nav class="nav-drawer" aria-label="Hoofdnavigatie">
    <!-- Team identity block -->
    <div class="drawer-team">
      <div class="drawer-team-badge">
        <ShirtAvatar :shirt="activeTeam?.shirt" :initials="teamInitials" :size="44" />
      </div>
      <div class="drawer-team-info">
        <span class="drawer-team-name md-title-sm">{{ activeTeam?.name }}</span>
        <span class="drawer-team-age md-label-sm">{{ activeTeam?.ageGroup }}</span>
      </div>
    </div>

    <div class="drawer-divider"></div>

    <!-- Nav items -->
    <ul class="drawer-nav-list" role="list">
      <li v-for="item in navItems" :key="item.to" role="listitem">
        <RouterLink
          :to="item.to"
          class="drawer-item"
          :class="{ active: isActive(item) }"
          :aria-current="isActive(item) ? 'page' : undefined"
        >
          <div class="drawer-item-indicator">
            <span class="material-symbols-rounded drawer-item-icon">{{ item.icon }}</span>
          </div>
          <span class="drawer-item-label md-label-lg">{{ item.label }}</span>
        </RouterLink>
      </li>
    </ul>

    <!-- Bottom spacer / version -->
    <div class="drawer-footer">
      <span class="md-label-sm drawer-version">TeamPilot</span>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const route = useRoute()
const store = useTeamStore()

const activeTeam = computed(() => store.activeTeam)
const teamInitials = computed(() => {
  const name = activeTeam.value?.name ?? ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const navItems = [
  { to: '/',           icon: 'home',          label: 'Home'       },
  { to: '/players',    icon: 'groups',        label: 'Spelers'    },
  { to: '/lineup/new', icon: 'grid_view',     label: 'Opstelling' },
  { to: '/training',  icon: 'stadium',       label: 'Training' },
]

function isActive(item) {
  if (item.to === '/lineup/new') return route.path.startsWith('/lineup/')
  return route.path === item.to
}
</script>

<style scoped>
.nav-drawer {
  width: var(--drawer-width, 256px);
  background: var(--md-surface);
  border-right: 1px solid var(--md-outline-variant);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

/* Team block */
.drawer-team {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: var(--sp-4) var(--sp-4) var(--sp-3);
}
.drawer-team-badge {
  width: 44px;
  height: 44px;
  border-radius: var(--md-shape-full);
  overflow: hidden;
  flex-shrink: 0;
}
.drawer-team-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.drawer-team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md-on-surface);
}
.drawer-team-age {
  color: var(--md-on-surface-variant);
}

.drawer-divider {
  height: 1px;
  background: var(--md-outline-variant);
  margin: 0 var(--sp-3) var(--sp-2);
}

/* Nav list */
.drawer-nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--sp-3);
  flex: 1;
}

/* Full-row pill: the entire row is the interactive target */
.drawer-item {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 0 var(--sp-3);
  height: 56px;
  border-radius: var(--md-shape-full);
  text-decoration: none;
  color: var(--md-on-surface-variant);
  transition: background var(--md-duration-short) var(--md-motion-standard),
              color     var(--md-duration-short) var(--md-motion-standard);
  -webkit-tap-highlight-color: transparent;
}
.drawer-item:hover {
  background: color-mix(in srgb, var(--md-on-surface) 8%, transparent);
  color: var(--md-on-surface);
}
.drawer-item.active {
  background: var(--md-primary-container);
  color: var(--md-on-primary-container);
}
.drawer-item.active:hover {
  background: color-mix(in srgb, var(--md-primary-container) 92%, var(--md-on-primary-container));
}

/* Icon container — layout only, no background */
.drawer-item-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.drawer-item-icon {
  font-size: 22px;
  transition: font-variation-settings var(--md-duration-short);
}
.drawer-item.active .drawer-item-icon {
  font-variation-settings: 'FILL' 1, 'wght' 600, 'GRAD' 0, 'opsz' 24;
}

.drawer-item-label {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: .1px;
}

/* Footer */
.drawer-footer {
  padding: var(--sp-3) var(--sp-4);
  border-top: 1px solid var(--md-outline-variant);
}
.drawer-version {
  color: var(--md-outline);
  letter-spacing: .5px;
}
</style>
