<template>
  <Transition name="fade">
    <div v-if="open" class="custom-ex-backdrop" @click.self="close">
      <Transition name="dialog">
        <div
          v-if="open"
          class="custom-ex-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-ex-title"
        >
          <header class="custom-ex-header">
            <h2 id="custom-ex-title" class="md-title-md">Eigen oefening toevoegen</h2>
            <button type="button" class="btn-icon" aria-label="Sluiten" @click="close">
              <span class="material-symbols-rounded">close</span>
            </button>
          </header>

          <div class="custom-ex-body">
            <div class="field-wrap">
              <label class="field-label" for="ce-title">Titel *</label>
              <input id="ce-title" v-model.trim="form.title" class="field" maxlength="80" placeholder="Naam van de oefening" />
            </div>

            <div class="form-row">
              <div class="field-wrap">
                <label class="field-label" for="ce-category">Categorie</label>
                <select id="ce-category" v-model="form.category" class="field field-select">
                  <option v-for="c in EXERCISE_CATEGORIES" :key="c.id" :value="c.id">{{ c.label }}</option>
                </select>
              </div>
              <div class="field-wrap">
                <label class="field-label" for="ce-duration">Duur (min)</label>
                <input id="ce-duration" v-model.number="form.durationMin" class="field" type="number" min="1" max="60" />
              </div>
            </div>

            <div class="form-row">
              <div class="field-wrap">
                <label class="field-label" for="ce-min">Min. spelers</label>
                <input id="ce-min" v-model.number="form.minPlayers" class="field" type="number" min="1" max="30" />
              </div>
              <div class="field-wrap">
                <label class="field-label" for="ce-max">Max. spelers</label>
                <input id="ce-max" v-model.number="form.maxPlayers" class="field" type="number" min="1" max="30" />
              </div>
            </div>

            <div class="field-wrap">
              <label class="field-label" for="ce-desc">Beschrijving</label>
              <textarea id="ce-desc" v-model.trim="form.description" class="field field-textarea" rows="3" placeholder="Wat doen de spelers?" />
            </div>

            <div class="field-wrap">
              <label class="field-label" for="ce-setup">Opstelling</label>
              <textarea id="ce-setup" v-model.trim="form.setup" class="field field-textarea" rows="2" placeholder="Velden, pionnen, teams..." />
            </div>

            <div class="field-wrap">
              <label class="field-label" for="ce-rules">Spelregels</label>
              <textarea id="ce-rules" v-model="form.rulesText" class="field field-textarea" rows="4" placeholder="Eén regel per regel" />
            </div>

            <div class="field-wrap">
              <label class="field-label">Schema (SVG)</label>
              <div class="svg-picker">
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/svg+xml,.svg"
                  class="svg-input"
                  @change="onSvgSelected"
                />
                <button type="button" class="btn btn-tonal svg-btn" @click="fileInput?.click()">
                  <span class="material-symbols-rounded">upload_file</span>
                  {{ form.customSvg ? 'Ander SVG-bestand' : 'SVG kiezen' }}
                </button>
                <button v-if="form.customSvg" type="button" class="btn btn-text" @click="clearSvg">Verwijderen</button>
              </div>
              <img v-if="form.customSvg" :src="form.customSvg" alt="Voorbeeld schema" class="svg-preview" />
              <p v-if="svgError" class="field-error">{{ svgError }}</p>
            </div>
          </div>

          <footer class="custom-ex-footer">
            <button type="button" class="btn btn-text" @click="close">Annuleren</button>
            <button type="button" class="btn btn-filled" :disabled="!canSave" @click="save">
              Opslaan
            </button>
          </footer>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { EXERCISE_CATEGORIES } from '@/data/exercises'
import { buildCustomExercise, readSvgFile, parseRulesText } from '@/utils/customExercises'

const props = defineProps({
  open: { type: Boolean, default: false },
  ageGroup: { type: String, default: 'O11' },
})

const emit = defineEmits(['close', 'save'])

const fileInput = ref(null)
const svgError = ref('')

const defaultForm = () => ({
  title: '',
  category: 'techniek',
  durationMin: 10,
  minPlayers: 4,
  maxPlayers: 16,
  description: '',
  setup: '',
  rulesText: '',
  customSvg: null,
})

const form = ref(defaultForm())

const canSave = computed(() => form.value.title.trim().length > 0)

watch(
  () => props.open,
  open => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) {
      form.value = defaultForm()
      svgError.value = ''
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  document.body.style.overflow = ''
})

function close() {
  emit('close')
}

async function onSvgSelected(e) {
  const file = e.target.files?.[0]
  if (!file) return
  svgError.value = ''
  try {
    form.value.customSvg = await readSvgFile(file)
  } catch (err) {
    svgError.value = err.message ?? 'SVG kon niet worden geladen.'
    form.value.customSvg = null
  }
  e.target.value = ''
}

function clearSvg() {
  form.value.customSvg = null
  svgError.value = ''
}

function save() {
  if (!canSave.value) return
  const exercise = buildCustomExercise(
    {
      ...form.value,
      rules: parseRulesText(form.value.rulesText),
    },
    props.ageGroup,
  )
  emit('save', exercise)
}
</script>

<style scoped>
.custom-ex-backdrop {
  position: fixed;
  inset: 0;
  z-index: 900;
  background: rgba(0, 0, 0, 0.44);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: max(var(--sp-3), env(safe-area-inset-top, 0px)) var(--sp-3)
    max(var(--sp-3), env(safe-area-inset-bottom, 0px));
}

.custom-ex-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 480px;
  max-height: min(90dvh, calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - var(--sp-6)));
  background: var(--md-surface);
  border-radius: var(--md-shape-xl);
  box-shadow: var(--md-elevation-3);
  overflow: hidden;
}

.custom-ex-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-2);
  padding: var(--sp-4);
  border-bottom: 1px solid var(--md-outline-variant);
}

.custom-ex-header h2 {
  margin: 0;
}

.custom-ex-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--sp-3);
}

@media (max-width: 400px) {
  .form-row { grid-template-columns: 1fr; }
}

.field-textarea {
  resize: vertical;
  min-height: 72px;
  font-family: inherit;
}

.svg-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--sp-2);
}

.svg-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.svg-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.svg-preview {
  margin-top: var(--sp-2);
  width: 100%;
  max-height: 160px;
  object-fit: contain;
  background: #f8faf8;
  border-radius: var(--md-shape-md);
  border: 1px solid var(--md-outline-variant);
}

.field-error {
  margin: var(--sp-1) 0 0;
  font-size: 13px;
  color: var(--md-error);
}

.custom-ex-footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: var(--sp-2);
  padding: var(--sp-3) var(--sp-4);
  padding-bottom: max(var(--sp-4), env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--md-outline-variant);
}

.dialog-enter-active,
.dialog-leave-active {
  transition: transform var(--md-duration-medium) var(--md-motion-standard),
    opacity var(--md-duration-medium);
}

.dialog-enter-from,
.dialog-leave-to {
  transform: translateY(12px) scale(0.98);
  opacity: 0;
}
</style>
