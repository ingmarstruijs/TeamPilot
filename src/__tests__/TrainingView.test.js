import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useTeamStore } from '../stores/teamStore'
import { encodeRecipe, encodeTrainingSession } from '../utils/trainingShare'
import { EXERCISES } from '../data/exercises'
import { buildCustomExercise } from '../utils/customExercises'
import { showSnackbar } from '@/composables/useSnackbar'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))

import { useRoute, useRouter } from 'vue-router'
import TrainingView from '../views/TrainingView.vue'

const team = {
  id: 't1',
  name: 'Mijn Team',
  ageGroup: 'O11',
  knvbClass: '5e',
  shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
  players: [],
}

function mountView(query) {
  const mockPush = vi.fn()
  useRoute.mockReturnValue({ query })
  useRouter.mockReturnValue({ push: mockPush })

  const wrapper = shallowMount(TrainingView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            team: {
              teams: [team],
              activeTeamId: team.id,
              activeLineupId: null,
              lineups: [],
              trainingState: {},
              customExercises: {},
              savedTrainings: {},
            },
          },
        }),
      ],
      stubs: {
        ExerciseDetailDialog: true,
        RouterLink: { template: '<a><slot /></a>' },
      },
    },
  })
  return { wrapper, mockPush, store: useTeamStore() }
}

describe('TrainingView shared import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows empty state for invalid links', () => {
    const { wrapper } = mountView({ training: 'bad' })
    expect(wrapper.text()).toContain('Ongeldige link')
  })

  it('imports a shared session into the active team', async () => {
    const encoded = encodeTrainingSession({
      teamName: 'Deel Team',
      ageGroup: 'O13',
      knvbClass: '4e',
      trainingType: 'techniek',
      durationMin: 60,
      playerCount: 10,
      cycleWeek: 1,
      blocks: [{ exercise: EXERCISES[0], durationMin: 12 }],
    })
    const { wrapper, mockPush, store } = mountView({ training: encoded })
    await flushPromises()

    expect(wrapper.text()).toContain('Gedeelde trainingssessie')
    expect(wrapper.text()).toContain('dit is voor O13')
    await wrapper.find('button.btn-filled').trigger('click')

    const draft = store.getTrainingState(team.id).draftSession
    expect(draft.blocks).toEqual([{ exerciseId: EXERCISES[0].id, durationMin: 12 }])
    expect(showSnackbar).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/training')
  })

  it('saves a shared recipe and keeps embedded custom exercises', async () => {
    const custom = buildCustomExercise({
      id: 'custom-tv-1',
      title: 'Eigen rondo',
      rules: ['Max 2 touches'],
    }, 'O12')
    const encoded = encodeRecipe({
      name: 'Passing basis',
      trainingType: 'techniek',
      durationMin: 55,
      cycleTheme: 'passing',
      ageGroup: 'O12',
      knvbClass: '5e',
      blocks: [
        { exercise: custom, durationMin: 15 },
        { exercise: EXERCISES[0], durationMin: 10 },
      ],
    })
    const { wrapper, mockPush, store } = mountView({ training: encoded })
    await flushPromises()

    expect(wrapper.text()).toContain('Gedeeld trainingsrecept')
    expect(wrapper.text()).toContain('Eigen rondo')

    await wrapper.findAll('button.btn-filled').find(b => b.text().includes('Opslaan')).trigger('click')
    expect(store.getSavedTrainings(team.id)[0].name).toBe('Passing basis')
    expect(store.getCustomExercises(team.id).some(e => e.id === 'custom-tv-1')).toBe(true)
    expect(mockPush).toHaveBeenCalledWith('/training?saved=1')
  })

  it('filters out unknown exercise ids from older app versions', async () => {
    const encoded = encodeTrainingSession({
      teamName: 'Old',
      ageGroup: 'O11',
      knvbClass: '5e',
      trainingType: 'gemengd',
      durationMin: 60,
      playerCount: 8,
      cycleWeek: 1,
      blocks: [
        { exercise: { id: 'does-not-exist-anymore', durationMin: 10 }, durationMin: 10 },
      ],
    })
    // Manually craft payload with unknown id through encode of fake exercise object
    const { wrapper } = mountView({ training: encoded })
    await flushPromises()
    expect(wrapper.text()).toContain('niet beschikbaar')
    expect(wrapper.find('button.btn-filled').exists()).toBe(true)
    expect(wrapper.find('button.btn-filled').attributes('disabled')).toBeDefined()
  })
})
