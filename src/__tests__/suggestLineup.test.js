import { describe, it, expect } from 'vitest'
import { suggestLineup } from '../utils/suggestLineup'

function slot(id, position, playerId = null, x = 50) {
  return { slotId: id, position, x, y: 0, playerId }
}

function player(id, position, extras = {}) {
  return { id, position, ...extras }
}

describe('suggestLineup', () => {
  it('fills empty slots with matching player types first', () => {
    const next = suggestLineup(
      [slot('s0', 'GK'), slot('s1', 'DEF'), slot('s2', 'ATT')],
      [player('a', 'ATT'), player('g', 'GK'), player('d', 'DEF')],
    )
    expect(next.map(s => s.playerId)).toEqual(['g', 'd', 'a'])
  })

  it('keeps already filled slots and uses remaining bench players', () => {
    const next = suggestLineup(
      [slot('s0', 'GK', 'g'), slot('s1', 'MID'), slot('s2', 'ATT')],
      [player('g', 'GK'), player('m', 'MID'), player('a', 'ATT')],
    )
    expect(next.map(s => s.playerId)).toEqual(['g', 'm', 'a'])
  })

  it('returns the same slots when nothing can be filled', () => {
    const slots = [slot('s0', 'GK', 'g')]
    expect(suggestLineup(slots, [player('g', 'GK')])).toEqual(slots)
  })

  it('prefers the matching foot on wide slots', () => {
    const next = suggestLineup(
      [slot('s1', 'DEF', null, 20)],
      [player('right', 'DEF', { preferredFoot: 'R' }), player('left', 'DEF', { preferredFoot: 'L' })],
    )
    expect(next[0].playerId).toBe('left')
  })
})
