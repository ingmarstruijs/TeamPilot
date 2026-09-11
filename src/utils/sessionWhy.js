/** Split and de-duplicate session-wide “why this exercise” notes. */

export const WHY_SEP = ' · '

export function whyFragments(whyThis) {
  return String(whyThis || '')
    .split(WHY_SEP)
    .map(s => s.trim())
    .filter(Boolean)
}

/** Theme, preferred-foot, and generic age-group notes belong in the briefing. */
export function isSessionWideFragment(bit) {
  const text = String(bit || '')
  return /weekthema|week theme/i.test(text)
    || /wissel de kanten|switch flanks/i.test(text)
    || /benut de (linker|rechter)kant/i.test(text)
    || /use the (left|right) side/i.test(text)
    || /^Past bij O\d+/i.test(text)
    || /^Fits O\d+/i.test(text)
}

/**
 * Fragments that appear on at least half of the blocks — session-level, not per exercise.
 * @param {Array<{ ai?: { whyThis?: string }, whyThis?: string }>} blocks
 * @returns {Set<string>}
 */
export function commonWhyFragments(blocks) {
  const total = blocks?.length ?? 0
  if (total < 2) return new Set()
  const threshold = Math.max(2, Math.ceil(total / 2))
  const counts = new Map()
  for (const block of blocks) {
    const seen = new Set()
    for (const bit of whyFragments(block.ai?.whyThis ?? block.whyThis)) {
      if (seen.has(bit)) continue
      seen.add(bit)
      counts.set(bit, (counts.get(bit) || 0) + 1)
    }
  }
  return new Set(
    [...counts].filter(([, n]) => n >= threshold).map(([bit]) => bit),
  )
}

export function uniqueWhyThis(whyThis, common) {
  const skip = common ?? new Set()
  return whyFragments(whyThis)
    .filter(bit => !skip.has(bit) && !isSessionWideFragment(bit))
    .join(WHY_SEP)
}
