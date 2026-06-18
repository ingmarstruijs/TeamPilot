import { EXERCISES } from '@/data/exercises'

export function analyzePlayerBalance(players) {
  const counts = { GK: 0, DEF: 0, WB: 0, MID: 0, ATT: 0 }
  for (const p of players) {
    if (counts[p.position] !== undefined) counts[p.position]++
  }
  const defenders = counts.DEF + counts.GK + counts.WB * 0.5
  const attackers = counts.ATT + counts.WB * 0.5
  const midfielders = counts.MID
  const total = players.length || 1
  return {
    counts,
    defenders,
    attackers,
    midfielders,
    defenderRatio: defenders / total,
    attackerRatio: attackers / total,
    needsAttackFocus: defenders > attackers + 1,
    needsDefenceFocus: attackers > defenders + 1,
  }
}

export function filterExercises({
  ageGroup,
  knvbLevel,
  playerCount,
  trainingType,
  category,
  categories,
}) {
  return EXERCISES.filter(ex => {
    if (!ex.ageGroups.includes(ageGroup)) return false
    if (knvbLevel < ex.minKnvbLevel || knvbLevel > ex.maxKnvbLevel) return false
    if (playerCount != null && (playerCount < ex.minPlayers || playerCount > ex.maxPlayers)) return false
    if (trainingType && !ex.trainingTypes.includes(trainingType)) return false
    if (category && ex.category !== category) return false
    if (categories?.length && !categories.includes(ex.category)) return false
    return true
  })
}

function scoreExercise(ex, ctx, targetMin = 0) {
  let score = 10
  if (ex.cycleThemes?.includes(ctx.cycleTheme)) score += 5
  if (ex.focusPositions?.some(p => ctx.focusPositions?.includes(p))) score += 3
  if (ctx.needsAttackFocus && ex.focusPositions?.includes('ATT')) score += 4
  if (ctx.needsDefenceFocus && ex.focusPositions?.includes('DEF')) score += 4
  if (ctx.recentIds?.includes(ex.id)) score -= 8
  if (targetMin >= 14 && ex.durationMin >= 14) score += 5
  if (targetMin >= 10 && ex.durationMin >= targetMin * 0.75) score += 4
  return score
}

function pickBest(pool, ctx, usedIds, targetMin = 0) {
  const available = pool.filter(ex => !usedIds.has(ex.id))
  if (!available.length) return null
  const ranked = [...available].sort((a, b) => scoreExercise(b, ctx, targetMin) - scoreExercise(a, ctx, targetMin))
  return ranked[0]
}

/** Warming-up + 4 core exercises + afsluiting (6 slots). Shares sum to 1.0. */
const SESSION_TEMPLATES = {
  techniek: [
    { category: 'warming-up', share: 0.10 },
    { category: 'techniek', share: 0.24 },
    { category: 'techniek', share: 0.24 },
    { category: 'partijvorm', share: 0.22 },
    { category: 'conditie', share: 0.10 },
    { category: 'afsluiting', share: 0.10 },
  ],
  tactiek: [
    { category: 'warming-up', share: 0.10 },
    { category: 'tactiek', share: 0.32 },
    { category: 'tactiek', share: 0.23 },
    { category: 'partijvorm', share: 0.25 },
    { category: 'afsluiting', share: 0.10 },
  ],
  conditie: [
    { category: 'warming-up', share: 0.12 },
    { category: 'conditie', share: 0.32 },
    { category: 'conditie', share: 0.23 },
    { category: 'partijvorm', share: 0.23 },
    { category: 'afsluiting', share: 0.10 },
  ],
  gemengd: [
    { category: 'warming-up', share: 0.10 },
    { categories: ['techniek', 'tactiek', 'conditie'], share: 0.22 },
    { categories: ['techniek', 'tactiek', 'conditie'], share: 0.22 },
    { category: 'partijvorm', share: 0.26 },
    { categories: ['techniek', 'tactiek', 'conditie'], share: 0.10 },
    { category: 'afsluiting', share: 0.10 },
  ],
  partij: [
    { category: 'warming-up', share: 0.12 },
    { category: 'partijvorm', share: 0.35 },
    { category: 'partijvorm', share: 0.23 },
    { category: 'techniek', share: 0.12 },
    { category: 'tactiek', share: 0.08 },
    { category: 'afsluiting', share: 0.10 },
  ],
}

const CYCLE_THEMES = ['techniek', 'passing', 'tactiek', 'conditie']

export { CYCLE_THEMES }

export function getCycleTheme(week) {
  return CYCLE_THEMES[(week - 1) % CYCLE_THEMES.length]
}

const CYCLE_THEME_LABELS = {
  techniek: 'Techniek',
  passing: 'Passing',
  tactiek: 'Tactiek',
  conditie: 'Conditie',
}

export function getCycleThemeLabel(themeOrWeek) {
  const theme = typeof themeOrWeek === 'number' ? getCycleTheme(themeOrWeek) : themeOrWeek
  return CYCLE_THEME_LABELS[theme] ?? theme
}

export function computeSessionTiming(blocks, targetDurationMin = 60) {
  const totalMin = blocks.reduce((s, b) => s + b.durationMin, 0)
  return {
    totalMin,
    targetMin: targetDurationMin,
  }
}

export function generateTraining({
  ageGroup,
  knvbLevel,
  playerCount,
  trainingType = 'gemengd',
  durationMin = 60,
  cycleWeek = 1,
  recentIds = [],
  presentPlayers = [],
}) {
  const balance = analyzePlayerBalance(presentPlayers)
  const cycleTheme = getCycleTheme(cycleWeek)
  const ctx = {
    cycleTheme,
    recentIds,
    needsAttackFocus: balance.needsAttackFocus,
    needsDefenceFocus: balance.needsDefenceFocus,
    focusPositions: presentPlayers.map(p => p.position),
  }

  const template = SESSION_TEMPLATES[trainingType] ?? SESSION_TEMPLATES.gemengd

  const usedIds = new Set()
  const blocks = []

  for (const slot of template) {
    const targetMin = Math.round(durationMin * slot.share)
    if (targetMin < 4) continue

    const pool = filterExercises({
      ageGroup,
      knvbLevel,
      playerCount,
      trainingType,
      category: slot.category,
      categories: slot.categories,
    })

    const ex = pickBest(pool, ctx, usedIds, targetMin)
    if (!ex) continue
    blocks.push({ exercise: ex, durationMin: targetMin })
    usedIds.add(ex.id)
  }

  const timing = computeSessionTiming(blocks, durationMin)

  return {
    blocks,
    totalMin: timing.totalMin,
    balance,
    cycleTheme,
    cycleWeek,
  }
}

export function searchExercises(filters) {
  return filterExercises(filters)
}

function normalizeSearchText(text) {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function exerciseMatchesQuery(ex, query) {
  if (!query) return true
  const haystack = normalizeSearchText(
    [ex.title, ex.description, ex.setup, ex.source].filter(Boolean).join(' ')
  )
  return haystack.includes(normalizeSearchText(query))
}

/** Browse built-in + optional custom exercises with filters and text search. */
export function browseExercisesWithFilters({
  ageGroup,
  knvbLevel,
  playerCount,
  trainingType,
  category,
  query = '',
  suitableOnly = true,
  customExercises = [],
}) {
  let builtIn
  if (suitableOnly) {
    builtIn = filterExercises({
      ageGroup,
      knvbLevel,
      playerCount: playerCount || undefined,
      trainingType: trainingType || undefined,
      category: category || undefined,
    })
  } else {
    builtIn = EXERCISES.filter(ex => {
      if (!ex.ageGroups.includes(ageGroup)) return false
      if (knvbLevel < ex.minKnvbLevel || knvbLevel > ex.maxKnvbLevel) return false
      if (category && ex.category !== category) return false
      return true
    })
  }

  let custom = [...customExercises]
  if (category) custom = custom.filter(ex => ex.category === category)
  if (suitableOnly && playerCount) {
    custom = custom.filter(ex => playerCount >= ex.minPlayers && playerCount <= ex.maxPlayers)
  }
  if (query) {
    custom = custom.filter(ex => exerciseMatchesQuery(ex, query))
  }

  const merged = [...custom, ...builtIn.filter(ex => exerciseMatchesQuery(ex, query))]
  return merged.sort((a, b) => a.title.localeCompare(b.title, 'nl'))
}

/** All exercises for manual browse — age group + level only (no type/player filter). */
export function browseExercises({ ageGroup, knvbLevel }) {
  return EXERCISES.filter(ex => {
    if (!ex.ageGroups.includes(ageGroup)) return false
    if (knvbLevel < ex.minKnvbLevel || knvbLevel > ex.maxKnvbLevel) return false
    return true
  })
}
