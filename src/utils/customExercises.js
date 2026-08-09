/**
 * Helpers for user-created exercises (no Rinus link).
 */

import { normalizeAgeGroup } from '@/data/formations'

const CUSTOM_ID_PREFIX = 'custom-'
const MAX_SVG_BYTES = 400_000

export function isCustomExercise(exerciseOrId) {
  const id = typeof exerciseOrId === 'string' ? exerciseOrId : exerciseOrId?.id
  return typeof id === 'string' && id.startsWith(CUSTOM_ID_PREFIX)
}

export function createCustomExerciseId() {
  return `${CUSTOM_ID_PREFIX}${Date.now()}`
}

export function parseRulesText(text) {
  return String(text ?? '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function rulesToText(rules) {
  return (rules ?? []).join('\n')
}

/**
 * @param {object} input
 * @param {string} [ageGroup]
 */
export function buildCustomExercise(input, ageGroup = 'O11') {
  const normalizedAge = normalizeAgeGroup(ageGroup) || 'O11'
  return {
    id: input.id ?? createCustomExerciseId(),
    custom: true,
    title: String(input.title ?? '').trim(),
    category: input.category ?? 'techniek',
    durationMin: Math.max(1, Math.min(60, Number(input.durationMin) || 10)),
    minPlayers: Math.max(1, Number(input.minPlayers) || 4),
    maxPlayers: Math.max(Number(input.maxPlayers) || 16, Number(input.minPlayers) || 4),
    ageGroups: [normalizedAge],
    minKnvbLevel: 1,
    maxKnvbLevel: 7,
    focusPositions: ['MID', 'ATT', 'DEF'],
    intensity: 'medium',
    trainingTypes: ['techniek', 'tactiek', 'conditie', 'gemengd', 'partij'],
    description: String(input.description ?? '').trim(),
    setup: String(input.setup ?? '').trim(),
    rules: Array.isArray(input.rules) ? input.rules : parseRulesText(input.rules),
    customSvg: input.customSvg ?? null,
    source: 'Eigen oefening',
  }
}

export function serializeCustomForShare(exercise) {
  return {
    title: exercise.title,
    category: exercise.category,
    durationMin: exercise.durationMin,
    minPlayers: exercise.minPlayers,
    maxPlayers: exercise.maxPlayers,
    description: exercise.description,
    setup: exercise.setup,
    rules: exercise.rules ?? [],
    customSvg: exercise.customSvg ?? null,
  }
}

export function restoreCustomExercise(id, data, ageGroup = 'O11') {
  return buildCustomExercise({ ...data, id }, ageGroup)
}

export function readSvgFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }
    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
    if (!isSvg) {
      reject(new Error('Alleen SVG-bestanden zijn toegestaan.'))
      return
    }
    if (file.size > MAX_SVG_BYTES) {
      reject(new Error('SVG is te groot (max. 400 KB).'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result === 'string' && result.startsWith('data:')) {
        resolve(result)
      } else if (typeof result === 'string') {
        resolve(`data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(result)))}`)
      } else {
        reject(new Error('SVG kon niet worden gelezen.'))
      }
    }
    reader.onerror = () => reject(new Error('SVG kon niet worden gelezen.'))
    reader.readAsDataURL(file)
  })
}
