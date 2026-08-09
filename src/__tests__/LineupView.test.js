import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import { useTeamStore } from '../stores/teamStore'
import { encodeBundle, encodeLineupOnly } from '../utils/lineupShare'
import { showSnackbar } from '@/composables/useSnackbar'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
  useRouter: vi.fn(() => ({ replace: vi.fn() })),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))

import { useRoute, useRouter } from 'vue-router'
import LineupView from '../views/LineupView.vue'

const team = {
  id: 't1',
  name: 'FC Utrecht',
  ageGroup: 'O11',
  knvbClass: '5e',
  shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
  players: [
    { id: 'p1', name: 'Jan', number: 1, position: 'GK' },
    { id: 'p2', name: 'Marco', number: 5, position: 'DEF' },
  ],
}

const slotsWithPlayers = [
  { slotId: 's0', position: 'GK', x: 50, y: 6.25, player: team.players[0] },
  { slotId: 's1', position: 'DEF', x: 25, y: 25, player: team.players[1] },
]

function mountView(query, teams = [team]) {
  const mockReplace = vi.fn()
  useRoute.mockReturnValue({ query })
  useRouter.mockReturnValue({ replace: mockReplace })

  const wrapper = shallowMount(LineupView, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
          initialState: {
            team: {
              teams,
              activeTeamId: teams[0].id,
              activeLineupId: null,
              lineups: [],
            },
          },
        }),
      ],
      stubs: {
        FootballField: true,
        ShirtAvatar: true,
        RouterLink: { template: '<a><slot /></a>' },
        Teleport: { props: ['to'], template: '<slot />' },
        Transition: { template: '<slot />' },
      },
    },
  })
  return { wrapper, mockReplace, store: useTeamStore() }
}

describe('LineupView import/export', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('shows error state for missing/invalid lineup payload', () => {
    const { wrapper } = mountView({})
    expect(wrapper.text()).toContain('Ongeldige of verlopen link')

    const bad = mountView({ lineup: '!!!' })
    expect(bad.wrapper.text()).toContain('Ongeldige of verlopen link')
  })

  it('renders a valid bundle and imports into a new team', async () => {
    const encoded = encodeBundle(
      team,
      { name: 'Thuis', formationId: '3-2-2', flipped: true },
      slotsWithPlayers,
      [],
    )
    const { wrapper, mockReplace, store } = mountView({ lineup: encoded }, [{
      ...team,
      id: 'local',
      name: 'Ander Team',
    }])

    expect(wrapper.text()).toContain('Thuis')
    await wrapper.find('button.btn-filled').trigger('click')
    await wrapper.findAll('button.btn-filled').find(b => b.text() === 'Importeren').trigger('click')
    await flushPromises()

    expect(store.teams.some(t => t.name === 'FC Utrecht')).toBe(true)
    expect(showSnackbar).toHaveBeenCalled()
    // Must open the imported lineup — not bounce back to dashboard.
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/lineup\//))
    expect(mockReplace).not.toHaveBeenCalledWith('/')
  })

  it('imports lineup-only onto a selected local team and keeps lineup route', async () => {
    const encoded = encodeLineupOnly(
      team,
      { name: 'Uit', formationId: '3-2-2', flipped: false },
      slotsWithPlayers,
      [],
    )
    const { wrapper, mockReplace, store } = mountView({ lineup: encoded }, [team])

    await wrapper.find('button.btn-filled').trigger('click')
    await wrapper.find('button.team-pick-btn').trigger('click')
    await wrapper.findAll('button.btn-filled').find(b => b.text() === 'Importeren').trigger('click')
    await flushPromises()

    expect(store.lineups.length).toBe(1)
    expect(store.lineups[0].name).toBe('Uit')
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/lineup\//))
    expect(mockReplace).not.toHaveBeenCalledWith('/')
  })

  it('on bundle name conflict, can add lineup to existing team', async () => {
    const encoded = encodeBundle(
      team,
      { name: 'Conflict lineup', formationId: null, flipped: true },
      slotsWithPlayers,
      [],
    )
    const { wrapper, mockReplace, store } = mountView({ lineup: encoded }, [team])

    await wrapper.find('button.btn-filled').trigger('click')
    expect(wrapper.text()).toContain('Er bestaat al een team')
    await wrapper.findAll('button.btn-filled').find(b => b.text().includes('Toevoegen')).trigger('click')
    await flushPromises()

    expect(store.teams).toHaveLength(1)
    expect(store.lineups[0].name).toBe('Conflict lineup')
    expect(mockReplace).toHaveBeenCalledWith(expect.stringMatching(/^\/lineup\//))
  })
})
