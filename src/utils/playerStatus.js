/** Helpers for roster status: guests, availability, injuries. */

export const PREFERRED_FEET = ['L', 'R', 'both']

const FOOT_ALIASES = {
  L: 'L',
  R: 'R',
  both: 'both',
  left: 'L',
  right: 'R',
  links: 'L',
  rechts: 'R',
  beide: 'both',
}

export function normalizePreferredFoot(value) {
  if (value == null || value === '') return null
  return FOOT_ALIASES[String(value)] ?? FOOT_ALIASES[String(value).toLowerCase()] ?? null
}

/**
 * Upgrade a stored player from older TeamPilot versions.
 * Keeps id/name/number/position so existing lineups stay linked.
 */
export function migratePlayer(player) {
  if (!player || typeof player !== 'object') return null
  const parsedNumber = player.number == null || player.number === '' ? null : Number(player.number)
  const guest = Boolean(player.guest)
  return {
    ...player,
    id: player.id || `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: typeof player.name === 'string' ? player.name : String(player.name ?? ''),
    number: Number.isFinite(parsedNumber) ? parsedNumber : null,
    position: player.position || 'MID',
    preferredFoot: normalizePreferredFoot(player.preferredFoot),
    injured: Boolean(player.injured),
    available: player.available !== false,
    guest,
    guestQuiet: guest && Boolean(player.guestQuiet),
  }
}

export function migratePlayers(players) {
  if (!Array.isArray(players)) return []
  return players.map(migratePlayer).filter(Boolean)
}

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

/** Injured and absent players cannot start. */
export function canPlaceOnField(player) {
  return Boolean(player) && isAvailable(player)
}

export function splitBenchPlayers(players) {
  const available = []
  const unavailable = []
  for (const player of players ?? []) {
    if (isAvailable(player)) available.push(player)
    else unavailable.push(player)
  }
  return { available, unavailable }
}

/**
 * Clear injured/absent players from lineup slots.
 * Formation mode keeps empty slots; free mode drops them.
 */
export function dropUnavailableFromSlots(slots, players, { keepEmpty = true } = {}) {
  const byId = new Map((players ?? []).map(p => [p.id, p]))
  const next = (slots ?? []).map(slot => {
    if (!slot?.playerId) return slot
    const player = byId.get(slot.playerId)
    if (canPlaceOnField(player)) return slot
    return { ...slot, playerId: null }
  })
  return keepEmpty ? next : next.filter(slot => slot.playerId)
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
