<template>
  <div id="app-shell">
    <TopBar />

    <div class="layout-body">
      <!-- Navigation drawer: only mounted on desktop -->
      <NavDrawer
        v-if="isDesktop"
        class="layout-drawer"
        :collapsed="drawerCollapsed"
        @toggle="toggleDrawer"
      />

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

    <!-- Team import dialog -->
    <Teleport to="body">
      <Transition name="dialog-fade">
        <div v-if="importData" class="dialog-backdrop" @click.self="importData = null">
          <div class="dialog">
            <p class="dialog-title">Team importeren</p>
            <p class="md-body-md" style="margin-bottom:4px"><strong>{{ importData.name }}</strong></p>
            <p class="md-body-sm" style="color:var(--md-on-surface-variant);margin-bottom:var(--sp-3)">
              {{ ageGroupLabel(importData.ageGroup) }} &middot; {{ importData.players.length }} speler{{ importData.players.length !== 1 ? 's' : '' }}
            </p>
            <template v-if="conflictTeam">
              <p class="dialog-body">Er bestaat al een team met de naam <strong>{{ importData.name }}</strong>. Wat wil je doen?</p>
              <div class="dialog-actions" style="flex-wrap:wrap;gap:var(--sp-2)">
                <button class="btn btn-text" @click="importData = null">Annuleren</button>
                <button class="btn btn-outlined" @click="doImportCopy">Nieuwe kopie</button>
                <button class="btn btn-filled" @click="doMerge">Samenvoegen</button>
              </div>
            </template>
            <template v-else>
              <p class="dialog-body">Wil je dit team importeren in TeamPilot?</p>
              <div class="dialog-actions">
                <button class="btn btn-text" @click="importData = null">Annuleren</button>
                <button class="btn btn-filled" @click="doImport">Importeren</button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import TopBar        from '@/components/layout/TopBar.vue'
import NavDrawer     from '@/components/layout/NavDrawer.vue'
import BottomNav     from '@/components/layout/BottomNav.vue'
import Snackbar      from '@/components/ui/Snackbar.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'
import { useNavDrawer } from '@/composables/useNavDrawer'
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ageGroupLabel } from '@/data/formations'
import { useTeamStore } from '@/stores/teamStore'
import { showSnackbar } from '@/composables/useSnackbar'
import { decodeTeamShare } from '@/utils/teamShare'
import { firstQueryValue, resolveIncomingShare, stripLocationSearch } from '@/utils/appShareUrl'

const isDesktop = useMediaQuery('(min-width: 900px)')
const { collapsed: drawerCollapsed, toggleDrawer } = useNavDrawer()
const route  = useRoute()
const router = useRouter()
const store  = useTeamStore()

// ── Team import from share link ───────────────────────
const importData = ref(null)

const conflictTeam = computed(() =>
  importData.value
    ? store.teams.find(t => t.name.trim().toLowerCase() === importData.value.name.trim().toLowerCase())
    : null
)

onMounted(async () => {
  await router.isReady()
  consumeIncomingShare()
})

watch(() => route.fullPath, () => {
  consumeIncomingShare()
})

function consumeIncomingShare() {
  const incoming = resolveIncomingShare(route)
  if (!incoming) return

  if (incoming.kind === 'team') {
    const data = decodeTeamShare(incoming.encoded)
    if (data) importData.value = data
    stripLocationSearch()
    if (route.path !== '/' || route.query.team || route.query.import) {
      router.replace({ path: '/' })
    }
    return
  }

  if (incoming.kind === 'lineup') {
    const alreadyOnView =
      route.path === '/view' && firstQueryValue(route.query.lineup) === incoming.encoded
    stripLocationSearch()
    if (!alreadyOnView) {
      router.replace({ path: '/view', query: { lineup: incoming.encoded } })
    }
    return
  }

  if (incoming.kind === 'training') {
    const alreadyOnView =
      route.path === '/training/view'
      && (
        firstQueryValue(route.query.training) === incoming.encoded
        || firstQueryValue(route.query.recipe) === incoming.encoded
      )
    stripLocationSearch()
    if (!alreadyOnView) {
      router.replace({ path: '/training/view', query: { training: incoming.encoded } })
    }
  }
}

function doImport() {
  const team = store.importTeam(importData.value)
  store.setActiveTeam(team.id)
  showSnackbar(`Team "${team.name}" geïmporteerd ✓`)
  importData.value = null
}

function doImportCopy() {
  const data = { ...importData.value, name: importData.value.name + ' (2)' }
  const team = store.importTeam(data)
  store.setActiveTeam(team.id)
  showSnackbar(`Team "${team.name}" geïmporteerd ✓`)
  importData.value = null
}

function doMerge() {
  const added = store.mergeTeam(conflictTeam.value.id, importData.value)
  store.setActiveTeam(conflictTeam.value.id)
  showSnackbar(`${added} speler${added !== 1 ? 's' : ''} toegevoegd aan "${conflictTeam.value.name}" ✓`)
  importData.value = null
}
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
  height: 100dvh;
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
  overflow-y: auto;
  scrollbar-gutter: stable;
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

/* Import dialog transition */
.dialog-fade-enter-active,
.dialog-fade-leave-active { transition: opacity var(--md-duration-medium) ease; }
.dialog-fade-enter-from,
.dialog-fade-leave-to { opacity: 0; }
</style>
