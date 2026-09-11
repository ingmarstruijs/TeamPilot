import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareImportSummary from '../components/share/ShareImportSummary.vue'

describe('ShareImportSummary', () => {
  it('shows team settings, guests, injuries and periods', () => {
    const wrapper = mount(ShareImportSummary, {
      props: {
        teamName: 'SBC O12-4',
        ageGroup: 'O12',
        ageGroupLabel: 'O12',
        knvbClass: '4e',
        knvbClassLabel: '4e klasse',
        shirt: { style: 'solid', primary: '#f59e0b', secondary: '#111111' },
        players: [
          { name: 'Robin Timber', number: 8, position: 'MID' },
          { name: 'Sam Gast', number: 11, position: 'ATT', guest: true },
          { name: 'Arjen', number: 1, position: 'GK', injured: true },
        ],
        lineup: {
          name: 'SBC O12-4 – 11-9-2026',
          periodMode: 'halves',
          periods: [
            { formationId: '3-2-2', filled: 7, total: 8, players: [{ name: 'Robin Timber' }] },
            { formationId: '2-3-2', filled: 8, total: 8, players: [{ name: 'Sam Gast', guest: true }] },
          ],
          bench: [{ name: 'Steve Hulp', guest: true }],
        },
      },
    })

    const text = wrapper.text()
    expect(text).toContain('SBC O12-4')
    expect(text).toContain('Teaminstellingen')
    expect(text).toContain('O12')
    expect(text).toContain('4e klasse')
    expect(text).toContain('Effen')
    expect(text).toContain('Gast')
    expect(text).toContain('Geblesseerd')
    expect(text).toContain('1e helft')
    expect(text).toContain('2e helft')
    expect(text).toContain('3-2-2')
    expect(text).toContain('Bank')
    expect(text).toContain('Steve Hulp')
  })
})
