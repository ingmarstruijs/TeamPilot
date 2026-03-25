import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTeamStore } from '../stores/teamStore'

beforeEach(() => {
  setActivePinia(createPinia())
})

// ── importTeam ──────────────────────────────────────────────────────────────

describe('importTeam', () => {
  it('creates a new team with the given name and ageGroup', () => {
    const store = useTeamStore()
    const team = store.importTeam({ name: 'Ajax', ageGroup: 'JO13', players: [] })
    const found = store.teams.find(t => t.id === team.id)
    expect(found.name).toBe('Ajax')
    expect(found.ageGroup).toBe('JO13')
  })

  it('returns the newly created team object', () => {
    const store = useTeamStore()
    const result = store.importTeam({ name: 'FC Test', ageGroup: 'JO11', players: [] })
    expect(result).toHaveProperty('id')
    expect(result.name).toBe('FC Test')
  })

  it('adds all provided players to the new team', () => {
    const store = useTeamStore()
    const players = [
      { name: 'Jan', number: 1, position: 'GK' },
      { name: 'Piet', number: 9, position: 'ATT' },
      { name: 'Klaas', number: null, position: 'MID' },
    ]
    const team = store.importTeam({ name: 'Squad', ageGroup: 'Senior', players })
    const found = store.teams.find(t => t.id === team.id)
    expect(found.players).toHaveLength(3)
    expect(found.players.map(p => p.name)).toEqual(['Jan', 'Piet', 'Klaas'])
  })

  it('preserves player numbers and positions', () => {
    const store = useTeamStore()
    const team = store.importTeam({
      name: 'T', ageGroup: 'JO12',
      players: [{ name: 'Lisa', number: 7, position: 'ATT' }],
    })
    const player = store.teams.find(t => t.id === team.id).players[0]
    expect(player.number).toBe(7)
    expect(player.position).toBe('ATT')
  })

  it('stores null player numbers correctly', () => {
    const store = useTeamStore()
    const team = store.importTeam({
      name: 'T', ageGroup: 'JO11',
      players: [{ name: 'Ali', number: null, position: 'MID' }],
    })
    const player = store.teams.find(t => t.id === team.id).players[0]
    expect(player.number).toBeNull()
  })

  it('applies provided shirt data to the new team', () => {
    const store = useTeamStore()
    const shirt = { style: 'stripes', primary: '#ff0000', secondary: '#ffffff' }
    const team = store.importTeam({ name: 'Red', ageGroup: 'Senior', shirt, players: [] })
    const found = store.teams.find(t => t.id === team.id)
    expect(found.shirt.style).toBe('stripes')
    expect(found.shirt.primary).toBe('#ff0000')
    expect(found.shirt.secondary).toBe('#ffffff')
  })

  it('uses a default solid shirt when none is provided', () => {
    const store = useTeamStore()
    const team = store.importTeam({ name: 'NoShirt', ageGroup: 'JO11', players: [] })
    const found = store.teams.find(t => t.id === team.id)
    expect(found.shirt).toBeDefined()
    expect(found.shirt.style).toBe('solid')
  })

  it('handles an empty players array without error', () => {
    const store = useTeamStore()
    const initialCount = store.teams.length
    const team = store.importTeam({ name: 'Empty', ageGroup: 'JO08', players: [] })
    expect(store.teams).toHaveLength(initialCount + 1)
    expect(store.teams.find(t => t.id === team.id).players).toHaveLength(0)
  })

  it('adds the new team to the teams list', () => {
    const store = useTeamStore()
    const initialCount = store.teams.length
    store.importTeam({ name: 'Extra', ageGroup: 'JO09', players: [] })
    expect(store.teams).toHaveLength(initialCount + 1)
  })
})

// ── mergeTeam ───────────────────────────────────────────────────────────────

describe('mergeTeam', () => {
  it('returns 0 for a non-existent team ID', () => {
    const store = useTeamStore()
    const result = store.mergeTeam('non-existent-id', {
      players: [{ name: 'Ghost', number: null, position: 'MID' }],
    })
    expect(result).toBe(0)
  })

  it('adds players that are not already in the team', () => {
    const store = useTeamStore()
    const teamId = store.teams[0].id
    const result = store.mergeTeam(teamId, {
      players: [{ name: 'NewPlayer', number: 7, position: 'ATT' }],
    })
    expect(result).toBe(1)
    expect(store.teams[0].players.some(p => p.name === 'NewPlayer')).toBe(true)
  })

  it('skips players whose name already exists (case-insensitive)', () => {
    const store = useTeamStore()
    store.addPlayer({ name: 'Alice', number: 5, position: 'MID' })
    const teamId = store.teams[0].id
    const before = store.teams[0].players.length

    const result = store.mergeTeam(teamId, {
      players: [{ name: 'ALICE', number: 99, position: 'ATT' }],
    })

    expect(result).toBe(0)
    expect(store.teams[0].players).toHaveLength(before)
  })

  it('adds only new players when the list is a mix of new and duplicate names', () => {
    const store = useTeamStore()
    store.addPlayer({ name: 'Bob', number: 3, position: 'DEF' })
    const teamId = store.teams[0].id

    const result = store.mergeTeam(teamId, {
      players: [
        { name: 'Bob', number: 99, position: 'ATT' },    // duplicate
        { name: 'Carol', number: 10, position: 'MID' },  // new
      ],
    })

    expect(result).toBe(1)
    expect(store.teams[0].players.some(p => p.name === 'Carol')).toBe(true)
    // Bob should not be duplicated
    expect(store.teams[0].players.filter(p => p.name === 'Bob')).toHaveLength(1)
  })

  it('returns the correct count of added players', () => {
    const store = useTeamStore()
    const teamId = store.teams[0].id
    const result = store.mergeTeam(teamId, {
      players: [
        { name: 'P1', number: 1, position: 'GK' },
        { name: 'P2', number: 2, position: 'MID' },
        { name: 'P3', number: 3, position: 'ATT' },
      ],
    })
    expect(result).toBe(3)
  })

  it('returns 0 for an empty players array', () => {
    const store = useTeamStore()
    const teamId = store.teams[0].id
    expect(store.mergeTeam(teamId, { players: [] })).toBe(0)
  })

  it('returns 0 when the players key is missing', () => {
    const store = useTeamStore()
    const teamId = store.teams[0].id
    expect(store.mergeTeam(teamId, {})).toBe(0)
  })

  it('does not modify the team when no players are added', () => {
    const store = useTeamStore()
    store.addPlayer({ name: 'Dan', number: 4, position: 'WB' })
    const teamId = store.teams[0].id
    const before = store.teams[0].players.length

    store.mergeTeam(teamId, {
      players: [{ name: 'dan', number: 99, position: 'GK' }], // same name, lower-case
    })

    expect(store.teams[0].players).toHaveLength(before)
  })
})
