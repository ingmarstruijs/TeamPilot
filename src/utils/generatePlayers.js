/**
 * Generates a full player list for quick-fill.
 * Names are common Dutch first names + KNVB-style surnames.
 */

import { isGuest } from '@/utils/playerStatus'

const FIRST_NAMES = [
  'Daan', 'Sem', 'Finn', 'Luca', 'Noah', 'Julian', 'Bram',
  'Thijs', 'Lars', 'Tim', 'Niels', 'Sander', 'Joris', 'Milan',
  'Ruben', 'Jesse', 'Thomas', 'Max', 'Rick', 'Kevin', 'Stijn',
  'Robin', 'Jasper', 'Dylan', 'Pieter', 'Lukas', 'Joren', 'Bas',
  'Noel', 'Tibo', 'Rens', 'Bo', 'Arjen', 'Mark', 'Sven',
]

const LAST_NAMES = [
  'de Vries', 'Janssen', 'Bakker', 'Peters', 'Visser',
  'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos',
  'van Dijk', 'van den Berg', 'Hendriks', 'Klaasen', 'Berghuis',
  'Gravenberch', 'Timber', 'Veerman', 'Dumfries', 'de Jong',
  'Weghorst', 'Wijnaldum', 'Blind', 'Ake', 'Gakpo',
]

/** Position layout per player count — array of position IDs from goalkeeper to forwards. */
const POSITION_LAYOUTS = {
  6:  ['GK', 'DEF', 'DEF', 'MID', 'ATT', 'ATT'],
  8:  ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT'],
  11: ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT'],
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function layoutPosition(position) {
  if (position === 'WB') return 'DEF'
  return position || 'MID'
}

function defaultLayout(size) {
  const base = POSITION_LAYOUTS[11]
  if (size <= base.length) return base.slice(0, size)
  const extra = []
  for (let i = base.length; i < size; i++) extra.push(i % 2 ? 'ATT' : 'MID')
  return [...base, ...extra]
}

function layoutForSize(size) {
  return POSITION_LAYOUTS[size] ?? defaultLayout(size)
}

/** Remaining layout slots after existing regulars have taken theirs. Guests are ignored. */
export function remainingPositions(teamSize, existingPlayers = []) {
  const remaining = [...layoutForSize(teamSize)]
  for (const player of existingPlayers) {
    if (isGuest(player)) continue
    const idx = remaining.indexOf(layoutPosition(player.position))
    if (idx !== -1) remaining.splice(idx, 1)
  }
  return remaining
}

function preferredFootForRank(position, rank, groupSize) {
  if (position === 'GK' || groupSize <= 1) return 'both'
  if (rank === 0) return 'L'
  if (rank === groupSize - 1) return 'R'
  return 'both'
}

function nextFreeNumbers(count, existingPlayers) {
  const used = new Set()
  for (const player of existingPlayers) {
    const n = Number(player?.number)
    if (Number.isFinite(n)) used.add(n)
  }
  const nums = []
  for (let n = 1; nums.length < count && n <= 99; n++) {
    if (!used.has(n)) nums.push(n)
  }
  return nums
}

/**
 * @param {number} count
 * @param {Array<{ name?: string, number?: number, position?: string, guest?: boolean }>} [existingPlayers]
 * @returns {Array<{ name, number, position, preferredFoot, injured, available, guest }>}
 */
export function generatePlayers(count, existingPlayers = []) {
  const existing = Array.isArray(existingPlayers) ? existingPlayers : []
  const regulars = existing.filter(p => !isGuest(p))
  const teamSize = regulars.length + count
  const layout = layoutForSize(teamSize)
  const positions = remainingPositions(teamSize, existing).slice(0, count)
  while (positions.length < count) positions.push('MID')

  const numbers = nextFreeNumbers(count, existing)
  const shuffledFirst = shuffle(FIRST_NAMES)
  const shuffledLast  = shuffle(LAST_NAMES)
  const generatedOf = {}

  return positions.map((position, i) => {
    const sameInLayout = layout.filter(p => p === position).length
    const existingSame = regulars.filter(p => layoutPosition(p.position) === position).length
    const rank = existingSame + (generatedOf[position] ?? 0)
    generatedOf[position] = (generatedOf[position] ?? 0) + 1

    return {
      name:     `${shuffledFirst[i % shuffledFirst.length]} ${shuffledLast[i % shuffledLast.length]}`,
      number:   numbers[i] ?? regulars.length + i + 1,
      position,
      preferredFoot: preferredFootForRank(position, rank, sameInLayout),
      injured: false,
      available: true,
      guest: false,
    }
  })
}
