import { describe, it, expect } from 'vitest'
import { lineupArchiveMeta } from '../utils/lineupArchive'

describe('lineupArchiveMeta', () => {
  it('shows player count and formation for a single lineup', () => {
    expect(lineupArchiveMeta({
      formationId: '4-3-3',
      slots: [{ playerId: 'p1' }, { playerId: 'p2' }, { playerId: null }],
    })).toBe('2 spelers · 4-3-3')
  })

  it('lists each half with its formation', () => {
    expect(lineupArchiveMeta({
      periodMode: 'halves',
      formationId: '4-3-3',
      periods: [
        { formationId: '4-3-3' },
        { formationId: '3-2-3' },
      ],
    })).toBe('Helften · 1e 4-3-3 · 2e 3-2-3')
  })

  it('lists each quarter even when formations repeat', () => {
    expect(lineupArchiveMeta({
      periodMode: 'quarters',
      formationId: '4-3-3',
      periods: [
        { formationId: '4-3-3' },
        { formationId: '3-2-3' },
        { formationId: '4-3-3' },
        { formationId: '2-3-3' },
      ],
    })).toBe('Kwartieren · K1 4-3-3 · K2 3-2-3 · K3 4-3-3 · K4 2-3-3')
  })

  it('uses live editor state when the open lineup was split after save', () => {
    expect(lineupArchiveMeta(
      { formationId: '4-3-3', slots: [{ playerId: 'p1' }] },
      {
        periodMode: 'halves',
        formationId: '3-2-3',
        periods: [
          { formationId: '4-3-3' },
          { formationId: '3-2-3' },
        ],
      },
    )).toBe('Helften · 1e 4-3-3 · 2e 3-2-3')
  })
})
