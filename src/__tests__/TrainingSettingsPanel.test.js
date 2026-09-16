import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TrainingSettingsPanel from '@/components/training/TrainingSettingsPanel.vue'

const trainingTypes = [{ id: 'tech', label: 'Techniek' }]

function mountPanel(overrides = {}) {
  const roster = overrides.roster ?? [
    { id: 'r1', name: 'Jan Jansen', position: 'GK' },
    { id: 'r2', name: 'Piet Pieters', position: 'DEF', available: false },
    { id: 'i1', name: 'Hidde', position: 'MID', injured: true },
    { id: 'g1', name: 'Kees', position: 'ATT', guest: true },
    { id: 'g2', name: 'Sam', position: 'MID', guest: true },
  ]
  const presentIds = overrides.presentIds ?? new Set(['r1'])
  return mount(TrainingSettingsPanel, {
    props: {
      variant: 'embedded',
      showConfig: false,
      roster,
      presentIds,
      allPresent: false,
      trainingType: 'tech',
      durationMin: 60,
      cycleWeek: 1,
      cycleThemeLabel: 'Techniek',
      trainingTypes,
      ...overrides.props,
    },
  })
}

describe('TrainingSettingsPanel attendance groups', () => {
  it('renders separate present, absent, injured and guest sections', () => {
    const wrapper = mountPanel()
    expect(wrapper.find('.attendance-group--present').exists()).toBe(true)
    expect(wrapper.find('.attendance-group--absent').exists()).toBe(true)
    expect(wrapper.find('.attendance-group--injured').exists()).toBe(true)
    expect(wrapper.find('.attendance-group--guests').exists()).toBe(true)
    expect(wrapper.find('.attendance-group--present').text()).toContain('Jan')
    expect(wrapper.find('.attendance-group--absent').text()).toContain('Piet')
    expect(wrapper.find('.attendance-group--injured').text()).toContain('Hidde')
    expect(wrapper.find('.attendance-group--guests').text()).toContain('Kees')
  })

  it('emits toggle-all-guests from the guest bulk action', async () => {
    const wrapper = mountPanel()
    await wrapper.get('.guests-toggle-all').trigger('click')
    expect(wrapper.emitted('toggle-all-guests')).toHaveLength(1)
  })
})
