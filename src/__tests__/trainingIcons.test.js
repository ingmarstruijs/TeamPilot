import { describe, it, expect } from 'vitest'
import { getCycleThemeIcon, getTrainingTypeIcon } from '../utils/trainingIcons'

describe('trainingIcons', () => {
  it('maps cycle themes to distinct icons', () => {
    expect(getCycleThemeIcon('techniek')).toBe('sports_soccer')
    expect(getCycleThemeIcon('passing')).toBe('compare_arrows')
    expect(getCycleThemeIcon('tactiek')).toBe('strategy')
    expect(getCycleThemeIcon('conditie')).toBe('directions_run')
  })

  it('maps training types to icons', () => {
    expect(getTrainingTypeIcon('gemengd')).toBe('shuffle')
    expect(getTrainingTypeIcon('partij')).toBe('stadium')
    expect(getTrainingTypeIcon('passing')).toBe('compare_arrows')
    expect(getTrainingTypeIcon('passing')).toBe(getCycleThemeIcon('passing'))
  })

  it('falls back to stadium for unknown ids', () => {
    expect(getCycleThemeIcon('unknown')).toBe('stadium')
    expect(getTrainingTypeIcon('unknown')).toBe('stadium')
  })
})
