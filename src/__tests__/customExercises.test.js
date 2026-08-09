import { describe, it, expect } from 'vitest'
import {
  isCustomExercise,
  buildCustomExercise,
  parseRulesText,
  serializeCustomForShare,
  restoreCustomExercise,
} from '../utils/customExercises'

describe('customExercises', () => {
  it('detects custom exercise ids', () => {
    expect(isCustomExercise('custom-123')).toBe(true)
    expect(isCustomExercise('wu-loopscholing')).toBe(false)
    expect(isCustomExercise({ id: 'custom-abc' })).toBe(true)
  })

  it('builds custom exercise with rules', () => {
    const ex = buildCustomExercise({
      title: 'Mijn oefening',
      rules: 'Regel 1\nRegel 2',
      description: 'Test',
      setup: '2 velden',
    }, 'O11')
    expect(ex.custom).toBe(true)
    expect(ex.id.startsWith('custom-')).toBe(true)
    expect(ex.rules).toEqual(['Regel 1', 'Regel 2'])
    expect(ex.source).toBe('Eigen oefening')
  })

  it('round-trips share serialization', () => {
    const ex = buildCustomExercise({
      id: 'custom-99',
      title: 'Deelbaar',
      rules: ['A', 'B'],
      customSvg: 'data:image/svg+xml;base64,abc',
    })
    const data = serializeCustomForShare(ex)
    const restored = restoreCustomExercise('custom-99', data, 'O12')
    expect(restored.title).toBe('Deelbaar')
    expect(restored.rules).toEqual(['A', 'B'])
    expect(restored.customSvg).toBe('data:image/svg+xml;base64,abc')
    expect(restored.ageGroups).toEqual(['O12'])
  })

  it('parses rules text', () => {
    expect(parseRulesText('  Eén \n\nTwee  ')).toEqual(['Eén', 'Twee'])
  })
})
