import { describe, it, expect } from 'vitest'
import {
  isGuest,
  isQuietGuest,
  countsTowardMin,
  isAvailable,
  suggestPool,
  mainListPlayers,
  quietGuestPlayers,
} from '../utils/playerStatus'

function p(overrides) {
  return { id: 'p1', name: 'Jan', position: 'MID', ...overrides }
}

describe('playerStatus', () => {
  it('treats missing flags as a regular available player', () => {
    const player = p()
    expect(isGuest(player)).toBe(false)
    expect(isAvailable(player)).toBe(true)
    expect(countsTowardMin(player)).toBe(true)
  })

  it('does not count guests toward the minimum squad size', () => {
    expect(countsTowardMin(p({ guest: true }))).toBe(false)
  })

  it('marks injured and quiet guests as unavailable', () => {
    expect(isAvailable(p({ injured: true }))).toBe(false)
    expect(isAvailable(p({ guest: true, guestQuiet: true }))).toBe(false)
    expect(isAvailable(p({ available: false }))).toBe(false)
  })

  it('splits the list into main players and quiet guests', () => {
    const players = [
      p({ id: 'a' }),
      p({ id: 'b', guest: true }),
      p({ id: 'c', guest: true, guestQuiet: true }),
    ]
    expect(mainListPlayers(players).map(x => x.id)).toEqual(['a', 'b'])
    expect(quietGuestPlayers(players).map(x => x.id)).toEqual(['c'])
    expect(isQuietGuest(players[2])).toBe(true)
  })

  it('uses active guests in Voorstel only when the regular pool is short', () => {
    const players = [
      p({ id: 'r1', position: 'DEF' }),
      p({ id: 'g1', guest: true, position: 'ATT' }),
      p({ id: 'g2', guest: true, guestQuiet: true, position: 'MID' }),
    ]
    expect(suggestPool(players, { emptyCount: 1 }).map(x => x.id)).toEqual(['r1'])
    expect(suggestPool(players, { emptyCount: 2 }).map(x => x.id)).toEqual(['r1', 'g1'])
  })
})
