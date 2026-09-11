/** ISO calendar week key, e.g. "2026-W24" */
export function getIsoWeekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`
}

/**
 * Keep cycle week (1–4) stable within the same calendar week.
 * Advances to the next cycle week only when the ISO week changes.
 */
export function syncCycleWeek(state) {
  const isoWeek = getIsoWeekKey()
  if (!state.cycleIsoWeek) {
    state.cycleIsoWeek = isoWeek
    state.cycleWeek = state.cycleWeek ?? 1
    return state.cycleWeek
  }
  if (state.cycleIsoWeek !== isoWeek) {
    state.cycleWeek = ((state.cycleWeek ?? 1) % 4) + 1
    state.cycleIsoWeek = isoWeek
  }
  return state.cycleWeek ?? 1
}

/** Most recently updated lineup that belongs to the given ISO week. */
export function latestLineupInIsoWeek(lineups, date = new Date()) {
  const week = getIsoWeekKey(date)
  return [...(lineups ?? [])]
    .filter(l => getIsoWeekKey(new Date(l.updatedAt ?? l.createdAt ?? 0)) === week)
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0))[0] ?? null
}
