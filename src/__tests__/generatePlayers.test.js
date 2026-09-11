import { describe, it, expect } from 'vitest'
import { generatePlayers, remainingPositions } from '../utils/generatePlayers'

describe('remainingPositions', () => {
  it('returns the full 8-player layout when the roster is empty', () => {
    expect(remainingPositions(8, [])).toEqual([
      'GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT',
    ])
  })

  it('drops slots already filled by regulars', () => {
    expect(remainingPositions(8, [
      { position: 'GK' },
      { position: 'DEF' },
      { position: 'DEF' },
    ])).toEqual(['DEF', 'MID', 'MID', 'ATT', 'ATT'])
  })

  it('ignores guests when choosing remaining slots', () => {
    expect(remainingPositions(8, [
      { position: 'GK' },
      { position: 'ATT', guest: true },
    ])).toEqual(['DEF', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT'])
  })

  it('treats a wingback as a defender slot', () => {
    expect(remainingPositions(8, [{ position: 'WB' }])).toEqual([
      'GK', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT',
    ])
  })
})

describe('generatePlayers', () => {
  it('fills only the missing count, not a full fallback layout', () => {
    const generated = generatePlayers(5, [
      { name: 'Jan', number: 1, position: 'GK' },
      { name: 'Piet', number: 2, position: 'DEF' },
      { name: 'Klaas', number: 3, position: 'DEF' },
    ])
    expect(generated).toHaveLength(5)
    expect(generated.map(p => p.position)).toEqual(['DEF', 'MID', 'MID', 'ATT', 'ATT'])
  })

  it('skips jersey numbers already used, including by guests', () => {
    const generated = generatePlayers(2, [
      { name: 'Jan', number: 1, position: 'GK' },
      { name: 'Kees', number: 2, position: 'ATT', guest: true },
    ])
    expect(generated.map(p => p.number)).toEqual([3, 4])
  })

  it('does not let guests occupy a regular position slot', () => {
    const generated = generatePlayers(7, [
      { name: 'Jan', number: 1, position: 'GK' },
      { name: 'Kees', number: 9, position: 'ATT', guest: true },
    ])
    expect(generated[0].position).toBe('DEF')
    expect(generated.filter(p => p.position === 'ATT')).toHaveLength(2)
  })

  it('assigns preferred foot from the slot in the position group', () => {
    const generated = generatePlayers(8, [])
    const defs = generated.filter(p => p.position === 'DEF')
    expect(defs.map(p => p.preferredFoot)).toEqual(['L', 'both', 'R'])
    expect(generated.find(p => p.position === 'GK').preferredFoot).toBe('both')
  })

  it('continues foot assignment after existing regulars in the same group', () => {
    const generated = generatePlayers(7, [
      { name: 'Jan', position: 'DEF' },
    ])
    expect(generated.filter(p => p.position === 'DEF').map(p => p.preferredFoot)).toEqual(['both', 'R'])
  })

  it('marks generated players as available regulars', () => {
    const [player] = generatePlayers(1, [])
    expect(player).toMatchObject({
      injured: false,
      available: true,
      guest: false,
    })
    expect(player.preferredFoot).toBeTruthy()
  })
})
