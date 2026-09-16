import { isGuest } from '@/utils/playerStatus'

/**
 * Split roster into training attendance buckets (regulars vs guests, injured excluded from toggles).
 * @param {Array<{ id: string, guest?: boolean, injured?: boolean }>} players
 * @param {Set<string>|Iterable<string>} presentIds
 */
export function splitTrainingAttendance(players, presentIds) {
  const present = presentIds instanceof Set ? presentIds : new Set(presentIds ?? [])
  const regularPresent = []
  const regularAbsent = []
  const injured = []
  const guests = []

  for (const player of players ?? []) {
    if (player.injured) {
      injured.push(player)
      continue
    }
    if (isGuest(player)) {
      guests.push(player)
      continue
    }
    if (present.has(player.id)) regularPresent.push(player)
    else regularAbsent.push(player)
  }

  return { regularPresent, regularAbsent, injured, guests }
}

/**
 * Summary counts for training header chips. Guests who are not marked present do not count as absent.
 * @param {Array<{ id: string, guest?: boolean, injured?: boolean }>} players
 * @param {Set<string>|Iterable<string>} presentIds
 */
export function trainingAttendanceCounts(players, presentIds) {
  const present = presentIds instanceof Set ? presentIds : new Set(presentIds ?? [])
  const { regularPresent, regularAbsent, injured, guests } = splitTrainingAttendance(players, present)
  const guestsJoining = guests.filter(g => present.has(g.id))

  return {
    present: regularPresent.length + guestsJoining.length,
    absent: regularAbsent.length,
    injured: injured.length,
    guestsTotal: guests.length,
    guestsJoining: guestsJoining.length,
    guestsNotJoining: guests.length - guestsJoining.length,
  }
}

export function allGuestsJoiningTraining(guests, presentIds) {
  if (!guests.length) return false
  const present = presentIds instanceof Set ? presentIds : new Set(presentIds ?? [])
  return guests.every(g => present.has(g.id))
}
