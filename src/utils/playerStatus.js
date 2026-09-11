/** Helpers for roster status: guests, availability, injuries. */

export function isGuest(player) {
  return Boolean(player?.guest)
}

export function isQuietGuest(player) {
  return isGuest(player) && Boolean(player.guestQuiet)
}

export function isActiveGuest(player) {
  return isGuest(player) && !player.guestQuiet
}

export function countsTowardMin(player) {
  return !isGuest(player)
}

export function isInjured(player) {
  return Boolean(player?.injured)
}

export function isAvailable(player) {
  if (isInjured(player) || isQuietGuest(player)) return false
  return player?.available !== false
}

export function mainListPlayers(players) {
  return (players ?? []).filter(p => !isQuietGuest(p))
}

export function quietGuestPlayers(players) {
  return (players ?? []).filter(isQuietGuest)
}

export function regularPlayers(players) {
  return (players ?? []).filter(p => !isGuest(p))
}

export function benchEligiblePlayers(players) {
  return (players ?? []).filter(p => !isQuietGuest(p))
}

/**
 * Players Voorstel may use. Regulars first; active guests only if the
 * remaining empty slots cannot be filled from the regular pool.
 */
export function suggestPool(players, { emptyCount = 0, usedIds = new Set() } = {}) {
  const list = players ?? []
  const unused = list.filter(p => !usedIds.has(p.id) && isAvailable(p))
  const primary = unused.filter(p => !isGuest(p))
  if (primary.length >= emptyCount) return primary
  return [...primary, ...unused.filter(isActiveGuest)]
}

export function footBias(preferredFoot, x) {
  if (!preferredFoot || preferredFoot === 'both' || x == null) return 0
  if (x < 45) return preferredFoot === 'L' ? -0.25 : 0.25
  if (x > 55) return preferredFoot === 'R' ? -0.25 : 0.25
  return 0
}
