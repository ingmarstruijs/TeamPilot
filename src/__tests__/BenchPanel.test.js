import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BenchPanel from '../components/field/BenchPanel.vue'

const shirt = { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' }

function mountBench(players) {
  return mount(BenchPanel, {
    props: { benchPlayers: players, teamShirt: shirt },
  })
}

describe('BenchPanel', () => {
  it('marks borrowed players on the available bench', () => {
    const wrapper = mountBench([
      { id: 'p1', name: 'Jan Jansen', number: 1, position: 'GK' },
      { id: 'g1', name: 'Kees de Gast', number: 99, position: 'ATT', guest: true },
    ])

    const chips = wrapper.findAll('.bench-player')
    expect(chips).toHaveLength(2)
    expect(chips[1].classes()).toContain('is-guest')
    expect(chips[1].get('.rc-badge.is-guest').text()).toBe('Gast')
    expect(chips[1].find('.rc-mark.is-guest').exists()).toBe(true)
    expect(wrapper.find('.bench-unavailable').exists()).toBe(false)
  })

  it('puts injured players in a separate unavailable group', () => {
    const wrapper = mountBench([
      { id: 'p1', name: 'Jan Jansen', number: 1, position: 'GK' },
      { id: 'p2', name: 'Robin Timber', number: 8, position: 'ATT', injured: true },
    ])

    const available = wrapper.findAll('.bench-scroll:not(.bench-unavailable-list) .bench-player')
    expect(available).toHaveLength(1)
    expect(available[0].text()).toContain('Jan J.')

    const unavailable = wrapper.get('.bench-unavailable')
    expect(unavailable.text()).toContain('Niet beschikbaar (1)')
    const chip = unavailable.get('.bench-player')
    expect(chip.classes()).toContain('is-injured')
    expect(chip.classes()).toContain('is-static')
    expect(chip.attributes('draggable')).toBeUndefined()
    expect(chip.get('.rc-badge.is-injured').text()).toBe('Geblesseerd')
    expect(chip.find('.rc-mark.is-injured').exists()).toBe(true)
  })

  it('lists absent players with the unavailable group', () => {
    const wrapper = mountBench([
      { id: 'p1', name: 'Jan Jansen', number: 1, position: 'GK', available: false },
    ])
    const chip = wrapper.get('.bench-unavailable .bench-player')
    expect(chip.classes()).toContain('is-absent')
    expect(chip.get('.rc-badge.is-absent').text()).toBe('Afwezig')
  })
})
