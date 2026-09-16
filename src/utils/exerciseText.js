/**
 * Build Rinus exercise URL and player-aware exercise text.
 */

import { RINUS_ID_MAP } from '@/data/rinusLinks'
import { RINUS_META_BY_RINUS_ID, RINUS_META_MAP } from '@/data/rinusMetaMap'
import { RINUS_SVG_BY_RINUS_ID, RINUS_SVG_MAP } from '@/data/rinusSvgMap'
import { RINUS_RULES_BY_RINUS_ID, RINUS_RULES_MAP } from '@/data/rinusRulesMap'
import { isCustomExercise } from '@/utils/customExercises'
import { t } from '@/i18n'

export { isCustomExercise }

function rinusIdFor(exercise) {
  if (isCustomExercise(exercise)) return null
  return exercise.rinusId ?? RINUS_ID_MAP[exercise.id] ?? null
}

export function getRinusMeta(exercise) {
  if (isCustomExercise(exercise)) return null
  if (RINUS_META_MAP[exercise.id]) return RINUS_META_MAP[exercise.id]
  const id = rinusIdFor(exercise)
  if (id && RINUS_META_BY_RINUS_ID[String(id)]) return RINUS_META_BY_RINUS_ID[String(id)]
  return null
}

export function getExerciseTitle(exercise) {
  if (isCustomExercise(exercise)) return exercise.title
  return getRinusMeta(exercise)?.title ?? exercise.title
}

export function getExerciseDurationMin(exercise) {
  if (isCustomExercise(exercise)) return exercise.durationMin
  return getRinusMeta(exercise)?.durationMin ?? exercise.durationMin
}

function playerBounds(exercise) {
  if (isCustomExercise(exercise)) {
    return { minPlayers: exercise.minPlayers, maxPlayers: exercise.maxPlayers }
  }
  const meta = getRinusMeta(exercise)
  return {
    minPlayers: meta?.minPlayers ?? exercise.minPlayers,
    maxPlayers: meta?.maxPlayers ?? exercise.maxPlayers,
  }
}

export function getRinusUrl(exercise) {
  if (isCustomExercise(exercise)) return null
  const id = rinusIdFor(exercise)
  if (id) return `https://rinus.knvb.nl/nl/exercise/id/${id}`
  return 'https://rinus.knvb.nl/'
}

export function getRinusSvgUrl(exercise) {
  if (exercise.customSvg) return exercise.customSvg
  if (exercise.rinusSvgUrl) return exercise.rinusSvgUrl
  if (RINUS_SVG_MAP[exercise.id]) return RINUS_SVG_MAP[exercise.id]
  const id = rinusIdFor(exercise)
  if (id && RINUS_SVG_BY_RINUS_ID[String(id)]) return RINUS_SVG_BY_RINUS_ID[String(id)]
  return null
}

export function getRinusRules(exercise) {
  if (isCustomExercise(exercise)) return exercise.rules ?? []
  if (RINUS_RULES_MAP[exercise.id]?.length) return RINUS_RULES_MAP[exercise.id]
  const id = rinusIdFor(exercise)
  if (id && RINUS_RULES_BY_RINUS_ID[String(id)]?.length) return RINUS_RULES_BY_RINUS_ID[String(id)]
  return []
}

export function getFootballReality(exercise) {
  if (!exercise || isCustomExercise(exercise)) return null
  const n = getRinusMeta(exercise)?.footballReality
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

export function getInjuryPrevention(exercise) {
  if (!exercise || isCustomExercise(exercise)) return null
  const n = getRinusMeta(exercise)?.injuryPrevention
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null
}

const FIELD_SIZE_PATTERN = /^[¼½¾]\s*veld|^helft veld|^heel veld|^kwart veld/i

export function getFieldSizeLabel(exercise) {
  if (!exercise) return null
  const fromMeta = getRinusMeta(exercise)?.fieldSize?.trim()
  if (fromMeta) return fromMeta
  const setup = String(exercise.setup || '').trim()
  if (!setup) return null
  const first = setup.split(/[.,]/)[0]?.trim()
  if (first && FIELD_SIZE_PATTERN.test(first)) return first
  if (/^[¼½¾]/.test(first) && /veld/i.test(first)) return first
  return null
}

function normalizeRinusAgeTitle(title) {
  const t = String(title || '').trim()
  if (/^O\d+/i.test(t)) return t.replace(/^o/i, 'O')
  return t
}

function compressAgeGroups(ages) {
  const order = ['O8', 'O9', 'O10', 'O11', 'O12', 'O13', 'Senior']
  const set = new Set(ages.map(normalizeRinusAgeTitle))
  const sorted = order.filter(a => set.has(a))
  if (!sorted.length) return ages.map(normalizeRinusAgeTitle).join(' · ')
  if (sorted.length === 1) return sorted[0]
  const idx = sorted.map(a => order.indexOf(a))
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  if (contiguous && sorted.length > 2) {
    return `${sorted[0]} t/m ${sorted[sorted.length - 1]}`
  }
  if (sorted.length <= 3) return sorted.join(' & ')
  return sorted.join(' · ')
}

export function getAgeGroupsLabel(exercise) {
  if (!exercise) return null
  const metaAges = getRinusMeta(exercise)?.ageGroups
  if (Array.isArray(metaAges) && metaAges.length) {
    const filtered = metaAges.filter(a => !/t\/m|onder\s+\d+/i.test(a))
    if (filtered.length) return compressAgeGroups(filtered)
    return compressAgeGroups(metaAges)
  }
  if (Array.isArray(exercise.ageGroups) && exercise.ageGroups.length) {
    if (exercise.ageGroups.length >= 6) return t('exercise.allAgeGroups')
    return compressAgeGroups(exercise.ageGroups)
  }
  return null
}

export function formatPlayerNote(exercise, playerCount) {
  const { minPlayers, maxPlayers } = playerBounds(exercise)
  if (playerCount == null) return ''
  const playerWord = playerCount === 1 ? t('word.player') : t('word.players')

  if (playerCount < minPlayers) {
    const diff = minPlayers - playerCount
    return t('exercise.note.tooFew', {
      count: playerCount,
      playerWord,
      min: minPlayers,
      max: maxPlayers,
      diff,
    })
  }
  if (playerCount > maxPlayers) {
    const groups = Math.ceil(playerCount / maxPlayers)
    return t('exercise.note.tooMany', {
      count: playerCount,
      min: minPlayers,
      max: maxPlayers,
      groups,
      duration: getExerciseDurationMin(exercise),
    })
  }
  return t('exercise.note.ok', {
    count: playerCount,
    playerWord,
    min: minPlayers,
    max: maxPlayers,
  })
}

export function buildExerciseDescription(exercise, playerCount) {
  if (isCustomExercise(exercise)) {
    return formatPlayerNote(exercise, playerCount) + (exercise.description ?? '')
  }
  const meta = getRinusMeta(exercise)
  let text = ''
  if (meta?.description && meta.description !== 'Geen voetbalhandeling') {
    const action = meta.footballAction
    text = action && action !== 'Geen voetbalhandeling' && action !== meta.description
      ? `${meta.description} (${action}).`
      : `${meta.description}.`
  } else if (!meta) {
    text = exercise.description
  }
  return formatPlayerNote(exercise, playerCount) + text
}

export function buildExerciseSetup(exercise, playerCount) {
  const base = isCustomExercise(exercise)
    ? exercise.setup
    : (getRinusMeta(exercise)?.dimensions?.length
      ? getRinusMeta(exercise).dimensions.join('. ') + '.'
      : exercise.setup)
  if (playerCount == null) return base

  const { minPlayers, maxPlayers } = playerBounds(exercise)
  if (playerCount >= minPlayers && playerCount <= maxPlayers) {
    return t('exercise.setupOk', { base, count: playerCount })
  }
  if (playerCount > maxPlayers) {
    const groups = Math.ceil(playerCount / maxPlayers)
    const perGroup = Math.ceil(playerCount / groups)
    return t('exercise.setupTooMany', { base, count: playerCount, groups, perGroup })
  }
  const playerWord = playerCount === 1 ? t('word.player') : t('word.players')
  return t('exercise.setupTooFew', { base, count: playerCount, playerWord, min: minPlayers })
}

export function playerRangeLabel(exercise) {
  const { minPlayers, maxPlayers } = playerBounds(exercise)
  if (minPlayers === maxPlayers) return t('exercise.playerExact', { n: minPlayers })
  return t('exercise.playerRange', { min: minPlayers, max: maxPlayers })
}
