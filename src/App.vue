<template>
  <div id="app-shell">
    <TopBar />

    <div class="layout-body">
      <!-- Navigation drawer: only mounted on desktop -->
      <NavDrawer v-if="isDesktop" class="layout-drawer" />

      <!-- Page content -->
      <main class="app-main">
        <RouterView v-slot="{ Component }">
          <Transition name="slide-up" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Mobile bottom nav: only mounted on mobile -->
    <BottomNav v-if="!isDesktop" class="layout-bottom-nav" />

    <Snackbar />
  </div>
</template>

<script setup>
import TopBar        from '@/components/layout/TopBar.vue'
import NavDrawer     from '@/components/layout/NavDrawer.vue'
import BottomNav     from '@/components/layout/BottomNav.vue'
import Snackbar      from '@/components/ui/Snackbar.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

const isDesktop = useMediaQuery('(min-width: 900px)')
</script>

<style>
/* ── Global mobile address bar support ────────────────────── */
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ── Shell structure ──────────────────────────────────────── */
#app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.layout-body {
  display: flex;
  flex: 1;
  padding-top: var(--top-bar-height);
  min-height: 0;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
}

/* Desktop drawer */
@media (min-width: 900px) {
  .layout-drawer {
    position: sticky;
    top: var(--top-bar-height);
    height: calc(100dvh - var(--top-bar-height));
    overflow-y: auto;
    flex-shrink: 0;
  }
}
</style>
