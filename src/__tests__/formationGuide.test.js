import { describe, it, expect, afterEach } from 'vitest'
import { getFormationGuide, hasFormationGuide } from '@/utils/formationGuide'
import { FORMATIONS } from '@/data/formations'
import { setLocale, resetLocale } from '@/i18n'

describe('formationGuide', () => {
  afterEach(() => {
    resetLocale()
  })

  it('covers every built-in formation id', () => {
    const ids = new Set(Object.values(FORMATIONS).flatMap(list => list.map(f => f.id)))
    for (const id of ids) {
      expect(hasFormationGuide(id), id).toBe(true)
      const guide = getFormationGuide(id)
      expect(guide.summary.length).toBeGreaterThan(20)
      expect(guide.strengths.length).toBeGreaterThan(0)
      expect(guide.watchouts.length).toBeGreaterThan(0)
    }
  })

  it('returns null for free mode / unknown ids', () => {
    expect(getFormationGuide(null)).toBeNull()
    expect(getFormationGuide('9-9-9')).toBeNull()
  })

  it('switches copy with locale', () => {
    const nl = getFormationGuide('4-3-3')
    setLocale('en')
    const en = getFormationGuide('4-3-3')
    expect(nl.summary).not.toBe(en.summary)
    expect(en.summary.toLowerCase()).toMatch(/balanced|width|press/)
  })
})
