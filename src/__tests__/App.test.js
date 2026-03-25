import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

// vi.mock calls are hoisted by Vitest — they apply before any imports below
vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({ query: {} })),
  useRouter: vi.fn(() => ({ replace: vi.fn(), isReady: vi.fn(() => Promise.resolve()) })),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))
vi.mock('@/composables/useMediaQuery', () => ({ useMediaQuery: vi.fn(() => false) }))

import { useRoute, useRouter } from 'vue-router'
import { showSnackbar } from '@/composables/useSnackbar'
import App from '../App.vue'

// ── Helpers ─────────────────────────────────────────────────────────────────

function encodeTeam(data) {
  const compact = {
    n: data.name,
    a: data.ageGroup,
    sh: data.shirt ? [data.shirt.style, data.shirt.primary, data.shirt.secondary] : null,
    p: (data.players ?? []).map(p => [p.name, p.number ?? null, p.position]),
  }
  return btoa(encodeURIComponent(JSON.stringify(compact)))
}

const DEFAULT_TEAM = {
  id: 't1',
  name: 'Mijn Team',
  ageGroup: 'JO11',
  shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
  players: [],
}

function mountApp(routeQuery = {}, teams = null) {
  const mockReplace = vi.fn()
  useRoute.mockReturnValue({ query: routeQuery })
  useRouter.mockReturnValue({ replace: mockReplace, isReady: vi.fn(() => Promise.resolve()) })

  const wrapper = shallowMount(App, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            team: {
              teams: teams ?? [DEFAULT_TEAM],
              activeTeamId: DEFAULT_TEAM.id,
              activeLineupId: null,
              lineups: [],
            },
          },
          stubActions: false,
        }),
      ],
      stubs: {
        TopBar: true,
        NavDrawer: true,
        BottomNav: true,
        Snackbar: true,
        RouterView: true,
        Teleport: { props: ['to'], template: '<slot />' },
        Transition: { template: '<slot />' },
      },
    },
  })

  return { wrapper, mockReplace }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('App – team import detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not show a dialog when there is no import query param', async () => {
    const { wrapper } = mountApp({})
    await flushPromises()
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })

  it('shows the import dialog when a valid import param is present', async () => {
    const encoded = encodeTeam({ name: 'FC Test', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.find('.dialog').exists()).toBe(true)
  })

  it('displays the imported team name in the dialog', async () => {
    const encoded = encodeTeam({ name: 'FC Test', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.html()).toContain('FC Test')
  })

  it('clears the ?import= query param from the URL after detection', async () => {
    const encoded = encodeTeam({ name: 'FC Test', ageGroup: 'JO11', players: [] })
    const { mockReplace } = mountApp({ import: encoded })
    await flushPromises()
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('does not call router.replace when there is no import param', async () => {
    const { mockReplace } = mountApp({})
    await flushPromises()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it('ignores malformed (non-base64) import data silently', async () => {
    const { wrapper } = mountApp({ import: '!!!not-valid-base64!!!' })
    await flushPromises()
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })

  it('ignores valid base64 that does not decode to expected JSON', async () => {
    const garbage = btoa('this is not json')
    const { wrapper } = mountApp({ import: garbage })
    await flushPromises()
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })
})

describe('App – import dialog: no name conflict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows the "Importeren" button', async () => {
    const encoded = encodeTeam({ name: 'Brand New Team', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.html()).toContain('Importeren')
  })

  it('does not show the "Samenvoegen" (merge) button', async () => {
    const encoded = encodeTeam({ name: 'Brand New Team', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.html()).not.toContain('Samenvoegen')
  })

  it('closes the dialog when "Annuleren" is clicked', async () => {
    const encoded = encodeTeam({ name: 'Brand New Team', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    await wrapper.find('button.btn-text').trigger('click')
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })

  it('calls store.importTeam and shows snackbar on "Importeren"', async () => {
    const encoded = encodeTeam({ name: 'Brand New Team', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    await wrapper.find('button.btn-filled').trigger('click')
    expect(showSnackbar).toHaveBeenCalledWith(expect.stringContaining('geïmporteerd'))
  })

  it('closes the dialog after importing', async () => {
    const encoded = encodeTeam({ name: 'Brand New Team', ageGroup: 'JO13', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    await wrapper.find('button.btn-filled').trigger('click')
    expect(wrapper.find('.dialog').exists()).toBe(false)
  })
})

describe('App – import dialog: name conflict', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows "Samenvoegen" button when team name already exists', async () => {
    const encoded = encodeTeam({ name: 'Mijn Team', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded }) // 'Mijn Team' is DEFAULT_TEAM's name
    await flushPromises()
    expect(wrapper.html()).toContain('Samenvoegen')
  })

  it('shows "Nieuwe kopie" button on conflict', async () => {
    const encoded = encodeTeam({ name: 'Mijn Team', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.html()).toContain('Nieuwe kopie')
  })

  it('does not show plain "Importeren" button on conflict', async () => {
    const encoded = encodeTeam({ name: 'Mijn Team', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    // "Importeren" text appears in the title but as a standalone btn-filled button it shouldn't be there
    const filledBtns = wrapper.findAll('button.btn-filled')
    const labels = filledBtns.map(b => b.text())
    expect(labels).not.toContain('Importeren')
  })

  it('closes dialog and shows snackbar when "Samenvoegen" is clicked', async () => {
    const encoded = encodeTeam({ name: 'Mijn Team', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    const mergeBtn = wrapper.findAll('button.btn-filled').find(b => b.text() === 'Samenvoegen')
    await mergeBtn.trigger('click')
    expect(wrapper.find('.dialog').exists()).toBe(false)
    expect(showSnackbar).toHaveBeenCalled()
  })

  it('imports as new copy with "(2)" suffix when "Nieuwe kopie" is clicked', async () => {
    const encoded = encodeTeam({ name: 'Mijn Team', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    const copyBtn = wrapper.findAll('button').find(b => b.text() === 'Nieuwe kopie')
    await copyBtn.trigger('click')
    expect(showSnackbar).toHaveBeenCalledWith(expect.stringContaining('Mijn Team (2)'))
  })

  it('conflict detection is case-insensitive', async () => {
    const encoded = encodeTeam({ name: 'MIJN TEAM', ageGroup: 'JO11', players: [] })
    const { wrapper } = mountApp({ import: encoded })
    await flushPromises()
    expect(wrapper.html()).toContain('Samenvoegen')
  })
})
