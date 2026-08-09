import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { AGE_GROUPS, FORMATIONS, normalizeAgeGroup } from '../data/formations'
import { useTeamStore } from '../stores/teamStore'
import { decodeTrainingSession, encodeTrainingSession } from '../utils/trainingShare'
import { EXERCISES } from '../data/exercises'

describe('normalizeAgeGroup', () => {
  it('keeps current O* ids', () => {
    for (const g of AGE_GROUPS) {
      expect(normalizeAgeGroup(g.id)).toBe(g.id)
    }
  })

  it('maps legacy JO* and zero-padded ids to O*', () => {
    expect(normalizeAgeGroup('JO8')).toBe('O8')
    expect(normalizeAgeGroup('JO08')).toBe('O8')
    expect(normalizeAgeGroup('JO9')).toBe('O9')
    expect(normalizeAgeGroup('JO09')).toBe('O9')
    expect(normalizeAgeGroup('JO10')).toBe('O10')
    expect(normalizeAgeGroup('JO11')).toBe('O11')
    expect(normalizeAgeGroup('JO12')).toBe('O12')
    expect(normalizeAgeGroup('JO13')).toBe('O13')
  })
})

describe('AGE_GROUPS / FORMATIONS', () => {
  it('uses KNVB O naming for youth groups', () => {
    expect(AGE_GROUPS.map(g => g.id)).toEqual(['O8', 'O9', 'O10', 'O11', 'O12', 'O13', 'Senior'])
    expect(AGE_GROUPS.map(g => g.label).slice(0, 6)).toEqual(['O8', 'O9', 'O10', 'O11', 'O12', 'O13'])
  })

  it('exposes formations under O* keys', () => {
    expect(FORMATIONS.O8?.length).toBeGreaterThan(0)
    expect(FORMATIONS.O11?.length).toBeGreaterThan(0)
    expect(FORMATIONS.O13?.length).toBeGreaterThan(0)
    expect(FORMATIONS.JO11).toBeUndefined()
  })
})

describe('legacy age-group migration', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('migrates persisted JO team age groups on load', () => {
    localStorage.setItem('teampilot_v1', JSON.stringify({
      teams: [{
        id: 'team-1',
        name: 'Legacy',
        ageGroup: 'JO11',
        knvbClass: '5e',
        color: '#1a6b3c',
        players: [],
      }],
      activeTeamId: 'team-1',
      lineups: [],
      customExercises: {
        'team-1': [{ id: 'custom-1', title: 'X', ageGroups: ['JO12'], rules: [] }],
      },
    }))

    const store = useTeamStore()
    expect(store.activeTeam.ageGroup).toBe('O11')
    expect(store.customExercises['team-1'][0].ageGroups).toEqual(['O12'])
  })

  it('normalizes legacy JO age groups in shared training payloads', () => {
    const encoded = encodeTrainingSession({
      teamName: 'Test',
      ageGroup: 'JO13',
      knvbClass: '5e',
      trainingType: 'gemengd',
      durationMin: 60,
      playerCount: 11,
      cycleWeek: 1,
      blocks: [{ exercise: EXERCISES[0], durationMin: 10 }],
    })
    // Force legacy id into payload by rewriting after encode is not needed —
    // encode stores whatever we pass; decode must normalize.
    const decoded = decodeTrainingSession(encoded)
    expect(decoded.ageGroup).toBe('O13')
  })

  it('accepts legacy JO age group when creating teams', () => {
    const store = useTeamStore()
    const team = store.addTeam('Oud', 'JO08')
    expect(team.ageGroup).toBe('O8')
  })
})
