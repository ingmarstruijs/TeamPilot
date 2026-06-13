<template>
  <header class="top-bar">
    <div class="top-bar__inner">
      <RouterLink to="/" class="top-bar__leading">
        <div class="app-logo-mark">
          <img src="/logo-mark.svg" alt="" width="36" height="36" />
        </div>
        <span class="app-name">TeamPilot</span>
      </RouterLink>

      <!-- Team Switcher -->
      <div class="team-switcher" ref="switcherRef" v-if="activeTeam">
        <button class="team-btn" @click="menuOpen = !menuOpen" :aria-expanded="menuOpen">
          <span class="team-btn-name">{{ activeTeam.name }}</span>
          <span class="material-symbols-rounded team-btn-chevron" :class="{ open: menuOpen }">expand_more</span>
        </button>

        <Transition name="menu">
          <div v-if="menuOpen" class="team-menu" role="menu">
            <button
              v-for="team in store.teams"
              :key="team.id"
              class="team-menu-item"
              :class="{ active: team.id === store.activeTeamId }"
              @click="selectTeam(team.id)"
              role="menuitem"
            >
              <span class="team-menu-icon material-symbols-rounded">
                {{ team.id === store.activeTeamId ? 'check' : '' }}
              </span>
              <span class="team-menu-name">{{ team.name }}</span>
              <span class="team-menu-age">{{ team.ageGroup }}</span>
            </button>

            <div class="team-menu-divider"></div>

            <button class="team-menu-item team-menu-item--add" @click="openCreate" role="menuitem">
              <span class="material-symbols-rounded team-menu-icon">add_circle</span>
              <span>Nieuw team</span>
            </button>
            <button
              class="team-menu-item team-menu-item--delete"
              @click="openDelete"
              :disabled="store.teams.length <= 1"
              role="menuitem"
            >
              <span class="material-symbols-rounded team-menu-icon">delete</span>
              <span>Team verwijderen</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>

  <!-- ── Create Team Dialog ─────────────────────────────── -->
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="createOpen" class="dialog-backdrop" @click.self="closeCreate">
        <div class="dialog create-dialog">
          <p class="dialog-title">Nieuw team</p>

          <div class="create-form">
            <!-- Name -->
            <div class="cf-field">
              <label class="cf-label">Teamnaam</label>
              <input
                class="cf-input"
                v-model="newTeam.name"
                placeholder="bijv. FC Junior"
                maxlength="40"
                autofocus
                @keydown.enter="confirmCreate"
              />
            </div>

            <!-- Age group -->
            <div class="cf-field">
              <label class="cf-label">Leeftijdsgroep</label>
              <select class="cf-input cf-select" v-model="newTeam.ageGroup">
                <option v-for="g in AGE_GROUPS" :key="g.id" :value="g.id">{{ g.label }}</option>
              </select>
            </div>

            <!-- KNVB class -->
            <div class="cf-field">
              <label class="cf-label">Competitieklasse</label>
              <select class="cf-input cf-select" v-model="newTeam.knvbClass">
                <option v-for="c in KNVB_CLASSES" :key="c.id" :value="c.id">{{ c.label }}</option>
              </select>
            </div>

            <!-- Shirt style -->
            <div class="cf-field cf-field--col">
              <label class="cf-label">Shirtkleur</label>
              <div class="shirt-styles">
                <button
                  v-for="s in SHIRT_STYLES"
                  :key="s.id"
                  type="button"
                  class="shirt-style-btn"
                  :class="{ active: newTeam.shirtStyle === s.id }"
                  @click="newTeam.shirtStyle = s.id"
                  :aria-label="s.label"
                >
                  <ShirtAvatar :shirt="{ style: s.id, primary: newTeam.primary, secondary: newTeam.secondary }" :size="28" />
                  <span class="shirt-style-label">{{ s.label }}</span>
                </button>
              </div>
            </div>

            <!-- Primary color -->
            <div class="cf-field cf-field--row">
              <label class="cf-label">Primaire kleur</label>
              <div class="color-picker-group">
                <input type="color" class="color-picker" v-model="newTeam.primary" />
                <div v-if="store.recentColors.length" class="color-swatches">
                  <button
                    v-for="color in store.recentColors.slice(0, 3)"
                    :key="color"
                    type="button"
                    class="color-swatch"
                    :class="{ active: newTeam.primary === color }"
                    :style="{ background: color }"
                    @click="newTeam.primary = color"
                    :title="color"
                  />
                </div>
              </div>
            </div>

            <!-- Secondary color (hidden for solid) -->
            <div v-if="newTeam.shirtStyle !== 'solid'" class="cf-field cf-field--row">
              <label class="cf-label">Secundaire kleur</label>
              <div class="color-picker-group">
                <input type="color" class="color-picker" v-model="newTeam.secondary" />
                <div v-if="store.recentColors.length" class="color-swatches">
                  <button
                    v-for="color in store.recentColors.slice(0, 3)"
                    :key="color"
                    type="button"
                    class="color-swatch"
                    :class="{ active: newTeam.secondary === color }"
                    :style="{ background: color }"
                    @click="newTeam.secondary = color"
                    :title="color"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="dialog-actions">
            <button class="btn btn-text" @click="closeCreate">Annuleren</button>
            <button class="btn btn-filled" @click="confirmCreate" :disabled="!newTeam.name.trim()">Aanmaken</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- ── Delete Team Dialog ─────────────────────────────── -->
  <Teleport to="body">
    <Transition name="dialog-fade">
      <div v-if="deleteOpen" class="dialog-backdrop" @click.self="closeDelete">
        <div class="dialog">
          <p class="dialog-title">Team verwijderen</p>
          <p class="dialog-body">
            Weet je zeker dat je <strong>{{ activeTeam?.name }}</strong> wil verwijderen?
            Alle spelers en opstellingen van dit team worden ook verwijderd.
          </p>
          <div class="dialog-actions">
            <button class="btn btn-text" @click="closeDelete">Annuleren</button>
            <button class="btn btn-filled" style="background: var(--md-error)" @click="confirmDelete">Verwijderen</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { AGE_GROUPS } from '@/data/formations'
import { DEFAULT_KNVB_CLASS, KNVB_CLASSES } from '@/data/knvbClasses'
import ShirtAvatar from '@/components/ui/ShirtAvatar.vue'

const store = useTeamStore()
const activeTeam = computed(() => store.activeTeam)

// ── Dropdown menu ────────────────────────────────────────────
const menuOpen = ref(false)
const switcherRef = ref(null)

function selectTeam(id) {
  store.setActiveTeam(id)
  menuOpen.value = false
}

function handleOutsideClick(e) {
  if (switcherRef.value && !switcherRef.value.contains(e.target)) {
    menuOpen.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', handleOutsideClick))
onUnmounted(() => document.removeEventListener('mousedown', handleOutsideClick))

// ── Create team ──────────────────────────────────────────────
const SHIRT_STYLES = [
  { id: 'solid',    label: 'Effen'    },
  { id: 'gradient', label: 'Verloop'  },
  { id: 'halves-v', label: 'Links/Re' },
  { id: 'halves-h', label: 'Boven/On' },
  { id: 'stripes',  label: 'Strepen'  },
  { id: 'sash',     label: 'Sjerp'    },
]

const createOpen = ref(false)
const newTeam = reactive({
  name: '',
  ageGroup: 'JO11',
  knvbClass: DEFAULT_KNVB_CLASS,
  shirtStyle: 'solid',
  primary: '#1a6b3c',
  secondary: '#ffffff',
})

function openCreate() {
  menuOpen.value = false
  Object.assign(newTeam, { name: '', ageGroup: 'JO11', knvbClass: DEFAULT_KNVB_CLASS, shirtStyle: 'solid', primary: '#1a6b3c', secondary: '#ffffff' })
  createOpen.value = true
}

function closeCreate() {
  createOpen.value = false
}

function confirmCreate() {
  if (!newTeam.name.trim()) return
  store.addRecentColors(newTeam.primary, newTeam.secondary)
  const team = store.addTeam(newTeam.name.trim(), newTeam.ageGroup, newTeam.primary, newTeam.knvbClass)
  store.updateTeam(team.id, {
    shirt: { style: newTeam.shirtStyle, primary: newTeam.primary, secondary: newTeam.secondary },
  })
  store.setActiveTeam(team.id)
  createOpen.value = false
}

// ── Delete team ──────────────────────────────────────────────
const deleteOpen = ref(false)

function openDelete() {
  menuOpen.value = false
  deleteOpen.value = true
}

function closeDelete() {
  deleteOpen.value = false
}

function confirmDelete() {
  store.deleteTeam(store.activeTeamId)
  deleteOpen.value = false
}
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
.top-bar__leading:active { opacity: 0.7; }
.app-logo-mark {
  width: 36px;
  height: 36px;
  border-radius: var(--md-shape-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.app-logo-mark img {
  width: 100%;
  height: 100%;
  display: block;
}
.app-name {
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -.3px;
}

/* ── Team switcher ───────────────────────────────────────── */
.team-switcher {
  position: relative;
}

.team-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,.08);
  border: 1px solid rgba(255,255,255,.14);
  border-radius: 8px;
  padding: 6px 10px 6px 12px;
  color: rgba(255,255,255,.95);
  cursor: pointer;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  transition: background var(--md-duration-short), border-color var(--md-duration-short);
  max-width: 180px;
}
.team-btn:hover {
  background: rgba(255,255,255,.13);
  border-color: rgba(255,255,255,.22);
}
.team-btn:active { background: rgba(255,255,255,.18); }

.team-btn-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team-btn-chevron {
  font-size: 18px;
  flex-shrink: 0;
  transition: transform var(--md-duration-short);
}
.team-btn-chevron.open { transform: rotate(180deg); }

/* ── Dropdown menu ───────────────────────────────────────── */
.team-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: #1e293b;
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 12px;
  padding: 6px;
  min-width: 210px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  z-index: 200;
}

.team-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,.9);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 8px;
  text-align: left;
  transition: background var(--md-duration-short);
}
.team-menu-item:hover:not(:disabled) { background: rgba(255,255,255,.08); }
.team-menu-item:active:not(:disabled) { background: rgba(255,255,255,.13); }
.team-menu-item.active { color: #ffffff; font-weight: 600; }

.team-menu-icon {
  font-size: 18px;
  flex-shrink: 0;
  width: 18px;
  color: var(--md-primary);
}
.team-menu-item--add .team-menu-icon { color: var(--md-primary); }
.team-menu-item--delete .team-menu-icon { color: #f87171; }
.team-menu-item--delete { color: #f87171; }
.team-menu-item--delete:disabled { opacity: .35; cursor: default; }

.team-menu-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.team-menu-age {
  font-size: 11px;
  font-weight: 500;
  color: rgba(255,255,255,.4);
  flex-shrink: 0;
}

.team-menu-divider {
  height: 1px;
  background: rgba(255,255,255,.08);
  margin: 4px 2px;
}

/* ── Menu transition ─────────────────────────────────────── */
.menu-enter-active,
.menu-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(.97);
}

/* ── Dialog fade transition ──────────────────────────────── */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 160ms ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

/* ── Create dialog form ──────────────────────────────────── */
.create-dialog {
  max-width: 460px;
}
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
  margin-bottom: var(--sp-5);
}
.cf-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-3);
}
.cf-field--col {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--sp-2);
}
.cf-field--row {
  flex-direction: row;
  align-items: center;
}
.cf-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface-variant);
  flex-shrink: 0;
}
.cf-input {
  background: var(--md-surface-variant);
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  padding: var(--sp-1) var(--sp-3);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  color: var(--md-on-surface);
  outline: none;
  text-align: right;
  height: 40px;
  max-width: 180px;
  transition: border-color var(--md-duration-short);
}
.cf-input:hover { border-color: var(--md-outline); }
.cf-input:focus {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 4%, transparent);
}
.cf-select { cursor: pointer; }

.shirt-styles {
  display: flex;
  gap: var(--sp-2);
  flex-wrap: wrap;
}
.shirt-style-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  background: var(--md-surface-variant);
  border: 2px solid transparent;
  border-radius: var(--md-shape-sm);
  padding: var(--sp-1) var(--sp-2);
  cursor: pointer;
  transition: border-color var(--md-duration-short), background var(--md-duration-short);
}
.shirt-style-btn:hover {
  background: color-mix(in srgb, var(--md-on-surface) 6%, var(--md-surface-variant));
}
.shirt-style-btn.active {
  border-color: var(--md-primary);
  background: color-mix(in srgb, var(--md-primary) 8%, transparent);
}
.shirt-style-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--md-on-surface-variant);
  white-space: nowrap;
}
.shirt-style-btn.active .shirt-style-label { color: var(--md-primary); }

.color-picker {
  width: 48px;
  height: 40px;
  border: 2px solid var(--md-outline-variant);
  border-radius: var(--md-shape-sm);
  cursor: pointer;
  padding: 2px;
  transition: border-color var(--md-duration-short);
}
.color-picker:hover { border-color: var(--md-outline); }

.color-picker-group {
  display: flex;
  align-items: center;
  gap: var(--sp-2);
  flex-direction: row-reverse;
}

.color-swatches {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  justify-content: flex-end;
  max-width: 160px;
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,.15);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: transform 100ms ease, border-color 100ms ease;
}
.color-swatch:hover {
  transform: scale(1.2);
  border-color: rgba(255,255,255,.5);
}
.color-swatch.active {
  border-color: var(--md-primary);
  box-shadow: 0 0 0 2px var(--md-primary);
}
</style>
