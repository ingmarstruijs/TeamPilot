import { FORMATIONS, FORMATION_Y } from '@/data/formations'

/** Tactical counter formation per formation id */
const COUNTER_MAP = {
  '2-2-1':   '2-1-2',
  '2-1-2':   '1-3-1',
  '1-3-1':   '2-2-1',
  '3-2-2':   '2-3-2',
  '2-3-2':   '3-3-1',
  '3-3-1':   '3-2-2',
  '4-3-3':   '4-4-2',
  '4-4-2':   '4-3-3',
  '4-2-3-1': '3-5-2',
  '3-5-2':   '4-3-3',
}

/**
 * Pick the strongest counter formation for the given lineup.
 * Mirrors slots to the opponent half (y → 100 − y).
 */
export function buildOpponentSlots({ ageGroup, formationId, fieldSlots, playerCount }) {
  const formations = FORMATIONS[ageGroup] ?? []
  const counterId = formationId ? (COUNTER_MAP[formationId] ?? formations[0]?.id) : formations[0]?.id
  const counter = formations.find(f => f.id === counterId) ?? formations[0]

  if (counter) {
    return counter.slots.map((slot, i) => ({
      slotId: `opp-${i}`,
      x: slot.x,
      y: 100 - slot.y,
      number: i + 1,
    }))
  }

  // Free mode: mirror filled own slots, or fall back to even spread
  const filled = (fieldSlots ?? []).filter(s => s.playerId)
  if (filled.length) {
    return filled.map((slot, i) => ({
      slotId: `opp-${i}`,
      x: slot.x,
      y: 100 - slot.y,
      number: i + 1,
    }))
  }

  const count = playerCount ?? 11
  const rows = Math.ceil(Math.sqrt(count))
  const cols = Math.ceil(count / rows)
  const xStep = 100 / (cols + 1)
  const ySpan = FORMATION_Y.ATT - FORMATION_Y.GK
  const yStep = ySpan / (rows + 1)
  const slots = []
  let idx = 0
  for (let r = 0; r < rows && idx < count; r++) {
    for (let c = 0; c < cols && idx < count; c++) {
      const ownY = FORMATION_Y.GK + (r + 1) * yStep
      slots.push({
        slotId: `opp-${idx}`,
        x: (c + 1) * xStep,
        y: 100 - ownY,
        number: idx + 1,
      })
      idx++
    }
  }
  return slots
}

export function getCounterFormationLabel(ageGroup, formationId) {
  const formations = FORMATIONS[ageGroup] ?? []
  const counterId = formationId ? (COUNTER_MAP[formationId] ?? formations[0]?.id) : formations[0]?.id
  return formations.find(f => f.id === counterId)?.label ?? null
}
