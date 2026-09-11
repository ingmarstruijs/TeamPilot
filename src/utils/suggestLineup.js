/**
 * Fill empty formation slots from the bench, preferring matching player types.
 *
 * @param {Array<{ slotId: string, position: string, x: number, y: number, playerId: string|null }>} slots
 * @param {Array<{ id: string, position: string }>} players
 */
export function suggestLineup(slots, players) {
  const used = new Set(slots.map(s => s.playerId).filter(Boolean))
  const pool = players.filter(p => !used.has(p.id))
  const next = slots.map(s => ({ ...s }))

  for (const slot of next) {
    if (slot.playerId || !pool.length) continue
    let bestIdx = 0
    let bestRank = matchRank(pool[0].position, slot.position)
    for (let i = 1; i < pool.length; i++) {
      const rank = matchRank(pool[i].position, slot.position)
      if (rank < bestRank) {
        bestIdx = i
        bestRank = rank
      }
    }
    const [pick] = pool.splice(bestIdx, 1)
    slot.playerId = pick.id
  }

  return next
}

function matchRank(playerPos, slotPos) {
  if (playerPos === slotPos) return 0
  if (slotPos === 'WB' && (playerPos === 'DEF' || playerPos === 'MID')) return 1
  if ((slotPos === 'DEF' || slotPos === 'MID') && playerPos === 'WB') return 1
  return 2
}

export function cloneLineupSlots(slots) {
  return slots.map(s => ({ ...s }))
}
