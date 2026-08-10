import { getExerciseById } from '@/data/exercises'
import { CYCLE_THEMES } from '@/utils/trainingEngine'
import { getCycleThemeIcon, getTrainingTypeIcon } from '@/utils/trainingIcons'

export { getCycleThemeIcon, getTrainingTypeIcon }

export const MAX_SAVED_TRAININGS = 25

export const CYCLE_THEME_OPTIONS = [
  { id: '', label: 'Geen thema', icon: 'stadium' },
  ...CYCLE_THEMES.map(id => ({
    id,
    label: id.charAt(0).toUpperCase() + id.slice(1),
    icon: getCycleThemeIcon(id),
  })),
]

export function cycleThemeLabel(theme) {
  if (!theme) return null
  return CYCLE_THEME_OPTIONS.find(o => o.id === theme)?.label ?? theme
}

export function defaultSavedName({ cycleWeek, cycleThemeLabel: themeLabel, trainingTypeLabel }) {
  const date = new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
  if (themeLabel) return `Week ${cycleWeek} ${themeLabel} · ${date}`
  return `${trainingTypeLabel} · ${date}`
}

export function blocksToSerializable(blocks) {
  return blocks.map(b => ({
    exerciseId: b.exercise.id,
    durationMin: b.durationMin,
    ...(b.ai ? { ai: b.ai } : {}),
  }))
}

export function resolveSavedBlocks(recipe, customExercises = []) {
  if (!recipe?.blocks?.length) return []
  return recipe.blocks
    .map(b => {
      const exercise = getExerciseById(b.exerciseId, customExercises)
      if (!exercise) return null
      return { exercise, durationMin: b.durationMin }
    })
    .filter(Boolean)
}

export function createSavedTraining({
  name,
  trainingType,
  durationMin,
  cycleTheme = null,
  blocks,
  source = 'manual',
  sharedFrom = null,
  notes = '',
}) {
  const now = Date.now()
  return {
    id: `st-${now}-${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    createdAt: now,
    updatedAt: now,
    trainingType,
    durationMin,
    cycleTheme,
    exerciseCount: blocks.length,
    blocks,
    source,
    sharedFrom,
    notes,
  }
}

export function savedTrainingFromSession({
  name,
  trainingType,
  durationMin,
  cycleTheme,
  blocks,
  source,
  sharedFrom,
}) {
  return createSavedTraining({
    name,
    trainingType,
    durationMin,
    cycleTheme,
    blocks: blocksToSerializable(blocks),
    source,
    sharedFrom,
  })
}
