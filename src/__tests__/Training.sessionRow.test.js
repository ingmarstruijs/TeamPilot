import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { EXERCISES } from '../data/exercises'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))
vi.mock('@/ai/canRunLocalLlm', () => ({ canRunLocalLlm: vi.fn(async () => false) }))

import Training from '../views/Training.vue'

const teamId = 't1'
const players = [
  { id: 'p1', name: 'Jan', number: 1, position: 'GK' },
  { id: 'p2', name: 'Piet', number: 2, position: 'DEF' },
]

function mountSession() {
  return mount(Training, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            team: {
              teams: [{
                id: teamId,
                name: 'Test Team',
                ageGroup: 'O12',
                knvbClass: '5e',
                shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
                players,
              }],
              activeTeamId: teamId,
              activeLineupId: null,
              lineups: [],
              trainingState: {
                [teamId]: {
                  cycleWeek: 1,
                  cycleIsoWeek: null,
                  recentExerciseIds: [],
                  draftSession: {
                    trainingType: 'techniek',
                    durationMin: 60,
                    playerCount: 2,
                    presentPlayerIds: players.map(p => p.id),
                    blocks: [
                      { exerciseId: EXERCISES[0].id, durationMin: 6 },
                      { exerciseId: EXERCISES[1].id, durationMin: 14 },
                    ],
                  },
                },
              },
              customExercises: {},
              savedTrainings: {},
            },
          },
        }),
      ],
      stubs: {
        RouterLink: true,
        TrainingTabBar: true,
        TrainingSettingsPanel: true,
        AiModelSettings: true,
        SavedTrainingsPanel: true,
        AiBriefingBanner: true,
        ExerciseLibraryPanel: true,
        ExerciseDetailDialog: true,
        CustomExerciseDialog: true,
        SaveTrainingDialog: true,
        PickSavedTrainingDialog: true,
        FootballRealityRating: true,
      },
    },
  })
}

describe('Training session row', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })))
  })

  it('places the exercise title directly beside the number', async () => {
    const wrapper = mountSession()
    await flushPromises()

    expect(wrapper.findAll('.session-handle')).toHaveLength(2)
    const titles = wrapper.findAll('.session-title')
    expect(titles[0].find('.session-index').text()).toBe('1')
    expect(titles[1].find('.session-index').text()).toBe('2')
    expect(titles[0].find('.session-title-text').text().length).toBeGreaterThan(0)
  })

  it('moves delete and reorder into a right-aligned overflow menu', async () => {
    const wrapper = mountSession()
    await flushPromises()

    expect(wrapper.find('.session-delete').exists()).toBe(false)
    expect(wrapper.find('.session-move').exists()).toBe(false)

    const moreBtn = wrapper.find('.session-more-btn')
    expect(moreBtn.exists()).toBe(true)
    expect(wrapper.find('.session-more-menu').exists()).toBe(false)

    await moreBtn.trigger('click')
    const menu = wrapper.find('.session-more-menu')
    expect(menu.exists()).toBe(true)
    expect(menu.text()).toContain('Verplaats omhoog')
    expect(menu.text()).toContain('Verplaats omlaag')
    expect(menu.text()).toContain('Verwijderen')
  })
})
