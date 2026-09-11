import { describe, it, expect } from 'vitest'
import {
  benchForShare,
  fieldPlayersForShare,
  playerInitials,
  shortFirstName,
} from '../utils/lineupShareImage'

const robin = { id: 'p1', name: 'Robin Timber', guest: false }
const sam = { id: 'g1', name: 'Sam Gast', guest: true }
const steve = { id: 'g2', name: 'Steve Hulp', guest: true, guestQuiet: false }
const quiet = { id: 'g3', name: 'Stille Gast', guest: true, guestQuiet: true }

describe('lineupShareImage guests', () => {
  it('keeps guest flags for players on the field', () => {
    const slots = [
      { playerId: 'g1', x: 50, y: 40 },
      { playerId: 'p1', x: 20, y: 60 },
    ]
    const map = { p1: robin, g1: sam }
    const field = fieldPlayersForShare(slots, map)
    expect(field.find(p => p.id === 'g1').guest).toBe(true)
    expect(field.find(p => p.id === 'p1').guest).toBe(false)
  })

  it('puts remaining guests on the share bench and skips quiet guests', () => {
    const slots = [{ playerId: 'p1' }]
    const bench = benchForShare([robin, sam, steve, quiet], slots)
    expect(bench.map(p => p.id)).toEqual(['g1', 'g2'])
    expect(bench.every(p => p.guest)).toBe(true)
  })

  it('does not list a guest who is already on the field', () => {
    const bench = benchForShare([robin, sam], [{ playerId: 'g1' }])
    expect(bench.map(p => p.id)).toEqual(['p1'])
  })
})

describe('lineupShareImage names', () => {
  it('builds initials and a short first name', () => {
    expect(playerInitials('Sam Gast')).toBe('SG')
    expect(shortFirstName('Afwisselende', 8)).toBe('Afwisse.')
  })
})
