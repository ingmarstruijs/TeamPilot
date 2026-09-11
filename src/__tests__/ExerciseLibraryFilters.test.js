import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ExerciseLibraryFilters from '../components/training/ExerciseLibraryFilters.vue'
import ExerciseLibraryPanel from '../components/training/ExerciseLibraryPanel.vue'

const sampleExercise = {
  id: 'wu-loopscholing',
  title: 'Loopscholing met bal',
  category: 'warming-up',
  durationMin: 8,
  minPlayers: 4,
  maxPlayers: 20,
  footballReality: 3,
}

describe('ExerciseLibraryFilters', () => {
  it('shows search and filters in a persistent bar', () => {
    const wrapper = mount(ExerciseLibraryFilters, {
      props: { query: '', category: '', suitableOnly: true, minFootballReality: 0, resultCount: 12 },
    })

    expect(wrapper.find('.filters-trigger').exists()).toBe(false)
    expect(wrapper.find('.filters-popover').exists()).toBe(false)
    expect(wrapper.find('.search-input').exists()).toBe(true)
    expect(wrapper.findAll('.filter-select')).toHaveLength(2)
    expect(wrapper.find('.suitable-toggle').exists()).toBe(true)
    expect(wrapper.text()).toContain('12 oefeningen')
  })

  it('emits query and reset from the bar', async () => {
    const wrapper = mount(ExerciseLibraryFilters, {
      props: { query: '', category: '', suitableOnly: true, minFootballReality: 0, resultCount: 3 },
    })

    await wrapper.get('.search-input').setValue('passing')
    expect(wrapper.emitted('update:query')?.[0]).toEqual(['passing'])

    await wrapper.setProps({ query: 'passing' })
    await wrapper.get('.reset-btn').trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
  })
})

describe('ExerciseLibraryPanel', () => {
  it('keeps the filter bar above the library list', () => {
    const wrapper = mount(ExerciseLibraryPanel, {
      props: {
        exercises: [sampleExercise],
        sessionBlocks: [],
        query: '',
        category: '',
        suitableOnly: true,
        minFootballReality: 0,
      },
    })

    const toolbar = wrapper.get('.library-toolbar')
    const list = wrapper.get('.library-scroll')
    expect(toolbar.find('.search-input').exists()).toBe(true)
    expect(list.find('.manual-item').exists()).toBe(true)
    expect(toolbar.element.compareDocumentPosition(list.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('lets long titles wrap instead of overlapping the action buttons', () => {
    const wrapper = mount(ExerciseLibraryPanel, {
      props: {
        exercises: [{
          ...sampleExercise,
          id: 'custom-long-title',
          title: '1+K tegen 1+K grote doelen vanuit afwisselende posities',
        }],
        sessionBlocks: [],
      },
    })

    const item = wrapper.get('.manual-item').element
    expect(item.children[0].classList.contains('manual-item-main')).toBe(true)
    expect(item.children[1].classList.contains('manual-item-actions')).toBe(true)
    expect(wrapper.get('.manual-title-text').text()).toContain('afwisselende posities')
  })
})
