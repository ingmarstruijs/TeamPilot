import { describe, it, expect } from 'vitest'
import { EXERCISES } from '../data/exercises'
import { RINUS_ID_MAP } from '../data/rinusLinks'
import {
  buildExerciseDescription,
  buildExerciseSetup,
  getExerciseTitle,
  getRinusRules,
  getRinusSvgUrl,
  getRinusUrl,
  playerRangeLabel,
} from '../utils/exerciseText'

describe('exerciseText', () => {
  const sample = EXERCISES[0]

  it('builds player-aware description', () => {
    const text = buildExerciseDescription(sample, 10)
    expect(text).toContain('10 aanwezige spelers')
    expect(buildExerciseSetup(sample, 10)).toContain('meter')
  })

  it('warns when too few players present', () => {
    const text = buildExerciseDescription(sample, 2)
    expect(text).toContain('tekort')
  })

  it('suggests groups when too many players', () => {
    const big = EXERCISES.find(e => e.maxPlayers <= 10)
    const text = buildExerciseDescription(big, 18)
    expect(text).toContain('groepen')
  })

  it('builds setup with player count', () => {
    expect(buildExerciseSetup(sample, 10)).toContain('10 spelers')
  })

  it('returns Rinus URL for mapped exercises', () => {
    expect(getRinusUrl(sample)).toMatch(/^https:\/\/rinus\.knvb\.nl\/nl\/exercise\/id\/\d+$/)
  })

  it('returns Rinus SVG URL for mapped exercises', () => {
    expect(getRinusSvgUrl(sample)).toMatch(/^https:\/\/cdn-rinusha.*\.svg$/)
  })

  it('returns Rinus spelregels for mapped exercises', () => {
    const rules = getRinusRules(sample)
    expect(Array.isArray(rules)).toBe(true)
    expect(rules.length).toBeGreaterThan(0)
    expect(typeof rules[0]).toBe('string')
  })

  it('uses Rinus title and description for display', () => {
    const ex = EXERCISES.find(e => e.id === 'wu-snelheidsladders')
    expect(getExerciseTitle(ex)).toBe('Lijnenloop')
    const text = buildExerciseDescription(ex, 7)
    expect(text).not.toContain('Ladder-oefeningen')
    expect(text).toContain('7 aanwezige spelers')
    expect(getRinusRules(ex)[0]).toMatch(/startlijn|speler/i)
  })

  it('formats player range label', () => {
    expect(playerRangeLabel({ minPlayers: 6, maxPlayers: 10 })).toBe('6–10 spelers')
  })
})

describe('exercise library', () => {
  it('has at least 140 exercises', () => {
    expect(EXERCISES.length).toBeGreaterThanOrEqual(140)
  })

  it('maps every exercise to a Rinus page', () => {
    for (const ex of EXERCISES) {
      expect(RINUS_ID_MAP[ex.id] ?? ex.rinusId).toBeTruthy()
    }
  })

  it('maps every exercise to a Rinus diagram SVG', () => {
    for (const ex of EXERCISES) {
      expect(getRinusSvgUrl(ex)).toMatch(/^https:\/\/cdn-rinusha.*\.svg$/)
    }
  })

  it('maps every exercise to Rinus spelregels', () => {
    for (const ex of EXERCISES) {
      expect(getRinusRules(ex).length).toBeGreaterThan(0)
    }
  })

  it('maps every exercise to Rinus display metadata', () => {
    for (const ex of EXERCISES) {
      expect(getExerciseTitle(ex)).toBeTruthy()
      expect(buildExerciseDescription(ex, ex.minPlayers)).toBeTruthy()
    }
  })
})
