import { describe, it, expect } from 'vitest'
import { getCycleTheme, trainingTypeForCycleTheme } from '@/utils/trainingThemes'

/**
 * Mirrors Training.vue follow/override rules without mounting the full view.
 */
function applyTypeChange(currentTheme, nextType) {
  const mapped = trainingTypeForCycleTheme(currentTheme)
  return {
    trainingType: nextType,
    typeFollowsTheme: nextType === mapped,
  }
}

function onCycleWeekChange(typeFollowsTheme, week) {
  const theme = getCycleTheme(week)
  const mapped = trainingTypeForCycleTheme(theme)
  if (!typeFollowsTheme) {
    return { trainingType: null, typeFollowsTheme: false, theme }
  }
  return { trainingType: mapped, typeFollowsTheme: true, theme }
}

describe('type follows week theme', () => {
  it('stays in sync when type matches theme', () => {
    expect(applyTypeChange('passing', 'passing')).toEqual({
      trainingType: 'passing',
      typeFollowsTheme: true,
    })
  })

  it('stops following when user picks another type', () => {
    expect(applyTypeChange('passing', 'gemengd')).toEqual({
      trainingType: 'gemengd',
      typeFollowsTheme: false,
    })
  })

  it('updates type on cycle week change while following', () => {
    const next = onCycleWeekChange(true, 3)
    expect(next.theme).toBe('tactiek')
    expect(next.trainingType).toBe('tactiek')
    expect(next.typeFollowsTheme).toBe(true)
  })

  it('keeps override across cycle week change', () => {
    const next = onCycleWeekChange(false, 3)
    expect(next.trainingType).toBeNull()
    expect(next.typeFollowsTheme).toBe(false)
  })
})
