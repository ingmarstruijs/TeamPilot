import { describe, it, expect } from 'vitest'
import { decodeTeamShare, encodeTeamShare, buildTeamShareUrl } from '../utils/teamShare'
import { encodeJson } from '../utils/base64url'

const team = {
  name: 'FC Test',
  ageGroup: 'O13',
  shirt: { style: 'stripes', primary: '#cc0000', secondary: '#ffffff' },
  players: [
    { name: 'Lisa', number: 7, position: 'ATT' },
    { name: 'Mark', number: null, position: 'GK' },
  ],
}

describe('teamShare', () => {
  it('round-trips team roster', () => {
    const decoded = decodeTeamShare(encodeTeamShare(team))
    expect(decoded).toEqual({
      name: 'FC Test',
      ageGroup: 'O13',
      shirt: team.shirt,
      players: [
        { name: 'Lisa', number: 7, position: 'ATT' },
        { name: 'Mark', number: null, position: 'GK' },
      ],
    })
  })

  it('normalizes legacy JO age groups on decode', () => {
    const encoded = encodeJson({ n: 'Legacy', a: 'JO11', sh: null, p: [] })
    expect(decodeTeamShare(encoded).ageGroup).toBe('O11')
  })

  it('rejects invalid / incomplete payloads', () => {
    expect(decodeTeamShare('invalid')).toBeNull()
    expect(decodeTeamShare(encodeJson(null))).toBeNull()
    expect(decodeTeamShare(encodeJson([]))).toBeNull()
    expect(decodeTeamShare(encodeJson({ a: 'O11', p: [] }))).toBeNull()
    expect(decodeTeamShare(encodeJson({ n: '   ', p: [] }))).toBeNull()
    expect(decodeTeamShare(encodeJson({ n: 'X', p: 'nope' }))).toBeNull()
  })

  it('accepts teams without players or shirt', () => {
    const decoded = decodeTeamShare(encodeJson({ n: 'Solo', a: 'O8' }))
    expect(decoded).toEqual({
      name: 'Solo',
      ageGroup: 'O8',
      shirt: null,
      players: [],
    })
  })

  it('builds import URL hash', () => {
    const encoded = encodeTeamShare(team)
    expect(buildTeamShareUrl(encoded)).toContain(`#/?import=${encoded}`)
  })

  it('handles unicode names', () => {
    const decoded = decodeTeamShare(encodeTeamShare({
      ...team,
      name: 'SJVñ / Östers',
      players: [{ name: 'Jürgen', number: 10, position: 'MID' }],
    }))
    expect(decoded.name).toBe('SJVñ / Östers')
    expect(decoded.players[0].name).toBe('Jürgen')
  })
})
