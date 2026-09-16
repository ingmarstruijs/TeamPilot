import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { EXERCISES } from '../data/exercises'
import ExerciseDetailDialog from '../components/training/ExerciseDetailDialog.vue'
import {
  getAgeGroupsLabel,
  getExerciseDurationMin,
  getExerciseTitle,
  getFieldSizeLabel,
  getFootballReality,
  getInjuryPrevention,
} from '../utils/exerciseText'

const passenEnLopen = EXERCISES.find(e => e.id === 'wu-loopscholing')

function mountDialog(props) {
  return mount(ExerciseDetailDialog, {
    props: {
      playerCount: 8,
      ...props,
    },
    attachTo: document.body,
  })
}

function expectRinusMeta(wrapper) {
  const text = wrapper.text()
  expect(text).toContain(getExerciseTitle(passenEnLopen))
  expect(text).toContain(getFieldSizeLabel(passenEnLopen))
  expect(text).toContain(getAgeGroupsLabel(passenEnLopen))
  expect(text).toContain(String(getExerciseDurationMin(passenEnLopen)))
  expect(text).toMatch(/veldgrootte|field size/i)
  expect(text).toMatch(/leeftijd|age group/i)
  expect(text).toMatch(/voetbal echtheid|football authenticity/i)
  expect(text).toMatch(/blessure preventie|injury prevention/i)
  expect(wrapper.findAll('.metric-info-btn').length).toBeGreaterThanOrEqual(2)
  expect(getFootballReality(passenEnLopen)).toBe(1)
  expect(getInjuryPrevention(passenEnLopen)).toBe(3)
}

describe('ExerciseDetailDialog shared Library/Session experience', () => {
  it('shows Rinus meta from Library preview (exercise prop)', () => {
    const wrapper = mountDialog({
      exercise: passenEnLopen,
      mode: 'preview',
    })
    expectRinusMeta(wrapper)
    expect(wrapper.text()).toMatch(/toevoegen|add to training/i)
    expect(wrapper.find('.adapt-panel').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows the same Rinus meta from Session (block prop)', () => {
    const wrapper = mountDialog({
      block: {
        uid: 1,
        exercise: passenEnLopen,
        durationMin: 8,
      },
      mode: 'session',
    })
    expectRinusMeta(wrapper)
    // Session keeps curated/block duration when present
    expect(wrapper.text()).toContain('8')
    expect(wrapper.find('.adapt-panel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('still resolves Rinus meta when session block has a partial exercise stub', () => {
    const wrapper = mountDialog({
      block: {
        uid: 2,
        exercise: { id: 'wu-loopscholing', category: 'warming-up' },
        durationMin: 8,
      },
      exercise: { id: 'wu-loopscholing', category: 'warming-up' },
      mode: 'session',
    })
    expectRinusMeta(wrapper)
    wrapper.unmount()
  })
})
