import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    name: 'lineup-new',
    query: { new: '1' },
    params: {},
    path: '/lineup/new',
  })),
  useRouter: vi.fn(() => ({ replace: vi.fn(), push: vi.fn() })),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))

import LineupBuilder from '../views/LineupBuilder.vue'
import { showSnackbar } from '@/composables/useSnackbar'

const teamId = 't1'
const players = [
  { id: 'p1', name: 'Jan', number: 1, position: 'GK' },
  { id: 'p2', name: 'Piet', number: 2, position: 'DEF' },
  { id: 'p3', name: 'Klaas', number: 9, position: 'ATT' },
]

function mountBuilder() {
  return mount(LineupBuilder, {
    attachTo: document.body,
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
                ageGroup: 'O11',
                knvbClass: '5e',
                shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
                players,
              }],
              activeTeamId: teamId,
              activeLineupId: null,
              lineups: [],
            },
          },
        }),
      ],
      stubs: {
        FootballField: true,
        BenchPanel: true,
        FormationInfoDialog: true,
        RouterLink: true,
      },
    },
  })
}

describe('LineupBuilder header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('keeps Voorstel and Opslaan visible and puts reset/share in overflow', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    const toolbar = wrapper.get('.toolbar-actions').text()
    expect(toolbar).toContain('Voorstel')
    expect(toolbar).toContain('Opslaan')
    expect(toolbar).not.toContain('Reset')
    expect(toolbar).not.toContain('Delen')

    const moreBtn = wrapper.get('[aria-label="Meer acties"]')
    await moreBtn.trigger('pointerdown')
    await flushPromises()

    const menu = document.querySelector('.lineup-more-menu')
    expect(menu).toBeTruthy()
    expect(menu.textContent).toContain('Delen')
    expect(menu.textContent).toContain('Reset')
    expect(menu.textContent).not.toContain('Splitsen in kwartieren')

    wrapper.unmount()
  })

  it('shows period chips after choosing quarters in the structure row', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    const quarters = wrapper.findAll('.structure-chip').find(btn => btn.text() === 'Kwartieren')
    await quarters.trigger('click')
    await flushPromises()

    expect(wrapper.find('.period-chips').exists()).toBe(true)
    expect(wrapper.get('.period-chips').text()).toContain('K1')
    expect(wrapper.get('.period-chips').text()).toContain('K4')
    expect(wrapper.get('.period-chips').text()).toContain('3-2-2')

    wrapper.unmount()
  })

  it('lets each period keep its own formation', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    const quarters = wrapper.findAll('.structure-chip').find(btn => btn.text() === 'Kwartieren')
    await quarters.trigger('click')
    await flushPromises()

    const formationChip = wrapper.findAll('.formation-chips .chip')
      .find(btn => btn.text() === '2-3-2')
    await formationChip.trigger('click')
    await flushPromises()

    const chips = wrapper.findAll('.period-chip')
    expect(chips[0].text()).toContain('2-3-2')
    expect(chips[1].text()).toContain('3-2-2')

    await chips[1].trigger('click')
    await flushPromises()
    expect(wrapper.get('.controls-title').text()).toBe('Formatie K2')
    expect(wrapper.findAll('.formation-chips .chip').find(btn => btn.text() === '3-2-2').classes()).toContain('active')

    wrapper.unmount()
  })

  it('suggests a lineup for empty slots', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    const suggest = [...wrapper.findAll('button')].find(b => b.text().includes('Voorstel'))
    await suggest.trigger('click')
    await flushPromises()

    expect(showSnackbar).toHaveBeenCalledWith('Opstelling voorgesteld')
    wrapper.unmount()
  })
})
