import { describe, it, expect } from 'vitest'
import {
  analyzePlayerBalance,
  generateTraining,
  getCycleTheme,
  browseExercises,
  browseExercisesWithFilters,
  computeSessionTiming,
} from '../utils/trainingEngine'
import { EXERCISES } from '../data/exercises'

describe('trainingEngine', () => {
  it('detects when team has more defenders than attackers', () => {
    const balance = analyzePlayerBalance([
      { position: 'DEF' }, { position: 'DEF' }, { position: 'DEF' }, { position: 'ATT' },
    ])
    expect(balance.needsAttackFocus).toBe(true)
  })

  it('generates warming-up + 4 core + afsluiting for 60 min', () => {
    const players = Array.from({ length: 10 }, () => ({ position: 'MID' }))
    const result = generateTraining({
      ageGroup: 'O11',
      knvbLevel: 3,
      playerCount: 10,
      trainingType: 'gemengd',
      durationMin: 60,
      presentPlayers: players,
    })
    expect(result.blocks.length).toBe(6)
    expect(result.blocks[0].exercise.category).toBe('warming-up')
    expect(result.blocks[result.blocks.length - 1].exercise.category).toBe('afsluiting')
    const core = result.blocks.slice(1, -1)
    expect(core).toHaveLength(4)
    expect(core.every(b => !['warming-up', 'afsluiting'].includes(b.exercise.category))).toBe(true)
    expect(result.totalMin).toBeGreaterThanOrEqual(55)
    expect(result.totalMin).toBeLessThanOrEqual(65)
  })

  it('computes session timing as sum of block durations', () => {
    const timing = computeSessionTiming([
      { durationMin: 10 },
      { durationMin: 18 },
      { durationMin: 20 },
      { durationMin: 8 },
    ], 60)
    expect(timing.totalMin).toBe(56)
    expect(timing.targetMin).toBe(60)
  })

  it('prefers exercises matching cycle theme', () => {
    const theme = getCycleTheme(1)
    expect(theme).toBe('techniek')
    const themed = EXERCISES.filter(e => e.cycleThemes?.includes('techniek'))
    expect(themed.length).toBeGreaterThan(0)
  })

  it('browseExercisesWithFilters supports text search', () => {
    const results = browseExercisesWithFilters({
      ageGroup: 'O11',
      knvbLevel: 3,
      query: 'partij',
      suitableOnly: false,
    })
    expect(results.length).toBeGreaterThan(0)
    expect(results.some(e => e.title.toLowerCase().includes('partij') || e.category === 'partijvorm')).toBe(true)
  })

  it('browseExercises returns all exercises for age group without type filter', () => {
    const all = browseExercises({ ageGroup: 'O11', knvbLevel: 3 })
    const filtered = EXERCISES.filter(ex =>
      ex.ageGroups.includes('O11') && 3 >= ex.minKnvbLevel && 3 <= ex.maxKnvbLevel
    )
    expect(all.length).toBe(filtered.length)
    expect(all.length).toBeGreaterThan(10)
  })

  it('includes imported Rinus drills for O12 (not only curated)', () => {
    const o12 = browseExercises({ ageGroup: 'O12', knvbLevel: 3 })
    expect(o12.length).toBeGreaterThan(60)
    expect(o12.some(ex => String(ex.id).startsWith('rinus-'))).toBe(true)
  })

  it('matches legacy JO age tags on exercises when team uses O*', () => {
    const joTagged = EXERCISES.find(ex => ex.ageGroups?.includes('JO12') || ex.ageGroups?.includes('O12'))
    expect(joTagged).toBeTruthy()
    const viaLegacyTeam = browseExercises({ ageGroup: 'JO12', knvbLevel: 3 })
    const viaCurrent = browseExercises({ ageGroup: 'O12', knvbLevel: 3 })
    expect(viaLegacyTeam.length).toBe(viaCurrent.length)
    expect(viaCurrent.length).toBeGreaterThan(40)
  })
})
