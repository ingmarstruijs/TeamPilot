import { describe, it, expect } from 'vitest'
import { summaryFromLineupShare, summaryFromTeamShare } from '../utils/shareSummary'

describe('shareSummary', () => {
  it('builds a team import summary with settings and player flags', () => {
    const summary = summaryFromTeamShare({
      name: 'SBC O12-4',
      ageGroup: 'O12',
      knvbClass: '4e',
      shirt: { style: 'solid', primary: '#f59e0b', secondary: '#111' },
      players: [
        { name: 'Robin', number: 8, position: 'MID' },
        { name: 'Sam', number: 11, position: 'ATT', guest: true },
        { name: 'Arjen', number: 1, position: 'GK', injured: true },
      ],
    })
    expect(summary.teamName).toBe('SBC O12-4')
    expect(summary.ageGroupLabel).toBe('O12')
    expect(summary.knvbClassLabel).toBe('4e klasse')
    expect(summary.players).toHaveLength(3)
    expect(summary.lineup).toBeNull()
  })

  it('shows each half with formation and who is on the field', () => {
    const summary = summaryFromLineupShare({
      teamName: 'SBC O12-4',
      ageGroup: 'O12',
      knvbClass: '4e',
      shirt: { style: 'solid', primary: '#f59e0b', secondary: '#111' },
      players: [{ name: 'Robin', guest: false }, { name: 'Sam', guest: true }],
      lineupName: 'SBC O12-4 – 11-9-2026',
      formationId: '3-2-2',
      periodMode: 'halves',
      periods: [
        {
          formationId: '3-2-2',
          slots: [
            { sid: 's0', pos: 'GK', x: 50, y: 6, pn: 'Arjen', num: 1 },
            { sid: 's1', pos: 'ATT', x: 50, y: 70 },
          ],
        },
        {
          formationId: '2-3-2',
          slots: [{ sid: 's0', pos: 'GK', x: 50, y: 6, pn: 'Sam', num: 99, guest: true }],
        },
      ],
      bench: [{ pn: 'Steve', num: 7, pos: 'MID', guest: true }],
    })
    expect(summary.lineup.name).toBe('SBC O12-4 – 11-9-2026')
    expect(summary.lineup.periodMode).toBe('halves')
    expect(summary.lineup.periods[0]).toMatchObject({ formationId: '3-2-2', filled: 1, total: 2 })
    expect(summary.lineup.periods[1].players[0]).toMatchObject({ name: 'Sam', guest: true })
    expect(summary.lineup.bench[0].name).toBe('Steve')
  })
})
