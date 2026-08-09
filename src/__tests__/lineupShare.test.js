import { describe, it, expect } from 'vitest'
import {
  encodeBundle,
  encodeLineupOnly,
  decodeSharePayload,
  resolveSlotsForTeam,
} from '../utils/lineupShare'
import { encodeJson } from '../utils/base64url'

const team = {
  name: 'FC Utrecht',
  ageGroup: 'O11',
  shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#fff' },
  players: [
    { id: 'p1', name: 'Jan Jansen', number: 1, position: 'GK' },
    { id: 'p2', name: 'Marco', number: 5, position: 'DEF' },
    { id: 'p3', name: 'Lisa', number: 9, position: 'ATT' },
  ],
}

const lineup = {
  name: 'Thuis vs Ajax',
  formationId: '3-2-2',
  flipped: true,
}

const slotsWithPlayers = [
  { slotId: 's0', position: 'GK', x: 50, y: 6.25, player: team.players[0] },
  { slotId: 's1', position: 'DEF', x: 25, y: 25, player: team.players[1] },
  { slotId: 's2', position: 'ATT', x: 50, y: 70, player: null },
]

const bench = [team.players[2]]

describe('lineupShare encode/decode', () => {
  it('round-trips bundle payload', () => {
    const decoded = decodeSharePayload(encodeBundle(team, lineup, slotsWithPlayers, bench))
    expect(decoded.type).toBe('bundle')
    expect(decoded.teamName).toBe('FC Utrecht')
    expect(decoded.ageGroup).toBe('O11')
    expect(decoded.players).toHaveLength(3)
    expect(decoded.lineupName).toBe('Thuis vs Ajax')
    expect(decoded.formationId).toBe('3-2-2')
    expect(decoded.slots).toEqual([
      { sid: 's0', pos: 'GK', x: 50, y: 6.25, pn: 'Jan Jansen', num: 1 },
      { sid: 's1', pos: 'DEF', x: 25, y: 25, pn: 'Marco', num: 5 },
      { sid: 's2', pos: 'ATT', x: 50, y: 70 },
    ])
    expect(decoded.bench).toEqual([{ pn: 'Lisa', num: 9, pos: 'ATT' }])
  })

  it('round-trips lineup-only payload without roster', () => {
    const decoded = decodeSharePayload(encodeLineupOnly(team, lineup, slotsWithPlayers, bench))
    expect(decoded.type).toBe('lineup')
    expect(decoded.players).toBeUndefined()
    expect(decoded.shirt).toBeUndefined()
    expect(decoded.slots[0].pn).toBe('Jan Jansen')
  })

  it('normalizes legacy JO age groups', () => {
    const encoded = encodeBundle({ ...team, ageGroup: 'JO12' }, lineup, slotsWithPlayers, [])
    expect(decodeSharePayload(encoded).ageGroup).toBe('O12')
  })

  it('returns null for invalid payloads', () => {
    expect(decodeSharePayload('not-base64')).toBeNull()
    expect(decodeSharePayload(encodeJson({ hello: 'world' }))).toBeNull()
    expect(decodeSharePayload(encodeJson({ _t: 'training', b: [] }))).toBeNull()
    expect(decodeSharePayload('')).toBeNull()
  })

  it('defaults missing optional fields', () => {
    const encoded = encodeJson({
      _t: 'lineup',
      tn: 'Hint Team',
      a: 'O10',
      n: 'Away',
    })
    const decoded = decodeSharePayload(encoded)
    expect(decoded.formationId).toBeNull()
    expect(decoded.flipped).toBe(true)
    expect(decoded.slots).toEqual([])
    expect(decoded.bench).toEqual([])
  })
})

describe('resolveSlotsForTeam', () => {
  const slots = [
    { sid: 's0', pos: 'GK', x: 50, y: 6, pn: 'Jan Jansen', num: 1 },
    { sid: 's1', pos: 'DEF', x: 25, y: 25, pn: 'marco', num: 99 }, // number mismatch → name fallback
    { sid: 's2', pos: 'ATT', x: 50, y: 70, pn: 'Unknown', num: 4 },
    { sid: 's3', pos: 'MID', x: 50, y: 50 },
  ]

  it('matches by name+number, then name, leaves unmatched empty', () => {
    const resolved = resolveSlotsForTeam(slots, team.players)
    expect(resolved[0].playerId).toBe('p1')
    expect(resolved[1].playerId).toBe('p2')
    expect(resolved[2].playerId).toBeNull()
    expect(resolved[3].playerId).toBeNull()
  })

  it('is case-insensitive on player names', () => {
    const resolved = resolveSlotsForTeam(
      [{ sid: 's0', pos: 'ATT', x: 1, y: 1, pn: 'LISA', num: 9 }],
      team.players,
    )
    expect(resolved[0].playerId).toBe('p3')
  })
})
