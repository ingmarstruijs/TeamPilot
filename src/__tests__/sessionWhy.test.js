import { describe, it, expect } from 'vitest'
import { commonWhyFragments, uniqueWhyThis } from '../utils/sessionWhy'

const mixed = 'Links- en rechtsbenige spelers → wissel de kanten'
const theme = 'Past bij weekthema Techniek'
const attack = 'Veel verdedigers aanwezig → extra aanvallend werk'

describe('sessionWhy', () => {
  it('hides fragments that repeat on most blocks', () => {
    const blocks = [
      { ai: { whyThis: `${attack} · ${theme} · ${mixed}` } },
      { ai: { whyThis: `${theme} · ${mixed}` } },
      { ai: { whyThis: `${theme} · ${mixed}` } },
      { ai: { whyThis: mixed } },
      { ai: { whyThis: mixed } },
      { ai: { whyThis: mixed } },
    ]
    const common = commonWhyFragments(blocks)
    expect(common.has(mixed)).toBe(true)
    expect(common.has(theme)).toBe(true)
    expect(common.has(attack)).toBe(false)
    expect(uniqueWhyThis(blocks[0].ai.whyThis, common)).toBe(attack)
    expect(uniqueWhyThis(blocks[1].ai.whyThis, common)).toBe('')
  })

  it('keeps a note that only appears on one or two of six blocks', () => {
    const blocks = Array.from({ length: 6 }, (_, i) => ({
      ai: { whyThis: i < 2 ? `${attack} · ${mixed}` : mixed },
    }))
    const common = commonWhyFragments(blocks)
    expect(uniqueWhyThis(blocks[0].ai.whyThis, common)).toBe(attack)
  })

  it('always drops theme and feet notes, even on a single block', () => {
    expect(uniqueWhyThis(`${attack} · ${theme} · ${mixed}`, new Set())).toBe(attack)
  })

  it('keeps a one-off note in a two-block session', () => {
    const blocks = [
      { ai: { whyThis: `${attack} · ${mixed}` } },
      { ai: { whyThis: mixed } },
    ]
    const common = commonWhyFragments(blocks)
    expect(common.has(attack)).toBe(false)
    expect(uniqueWhyThis(blocks[0].ai.whyThis, common)).toBe(attack)
  })
})
