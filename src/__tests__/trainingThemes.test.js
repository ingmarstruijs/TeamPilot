import { describe, it, expect } from 'vitest'
import {
  CYCLE_THEMES,
  getCycleTheme,
  getCycleThemeLabel,
  trainingTypeForCycleTheme,
} from '@/utils/trainingThemes'

describe('trainingThemes', () => {
  it('maps weeks 1–4 to cycle themes', () => {
    expect(CYCLE_THEMES).toEqual(['techniek', 'passing', 'tactiek', 'conditie'])
    expect(getCycleTheme(1)).toBe('techniek')
    expect(getCycleTheme(2)).toBe('passing')
    expect(getCycleTheme(3)).toBe('tactiek')
    expect(getCycleTheme(4)).toBe('conditie')
    expect(getCycleTheme(5)).toBe('techniek')
  })

  it('uses the same Dutch labels for shared vocabulary', () => {
    expect(getCycleThemeLabel('techniek')).toBe('Techniek')
    expect(getCycleThemeLabel('passing')).toBe('Passing')
    expect(getCycleThemeLabel('tactiek')).toBe('Tactiek')
    expect(getCycleThemeLabel('conditie')).toBe('Conditie')
    expect(getCycleThemeLabel(2)).toBe('Passing')
  })

  it('maps cycle themes 1:1 to training types', () => {
    for (const theme of CYCLE_THEMES) {
      expect(trainingTypeForCycleTheme(theme)).toBe(theme)
    }
    expect(trainingTypeForCycleTheme('unknown')).toBe('gemengd')
  })
})
