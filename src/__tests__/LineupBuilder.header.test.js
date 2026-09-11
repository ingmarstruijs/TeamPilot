import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

const { routerMocks } = vi.hoisted(() => ({
  routerMocks: { replace: vi.fn(), push: vi.fn() },
}))

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    name: 'lineup-new',
    query: { new: '1' },
    params: {},
    path: '/lineup/new',
  })),
  useRouter: vi.fn(() => routerMocks),
}))
vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))
vi.mock('@/utils/lineupShareImage', async importOriginal => {
  const actual = await importOriginal()
  return {
    ...actual,
    drawLineupShareCanvas: vi.fn(() => ({
      toBlob(cb) { cb(new Blob(['png'], { type: 'image/png' })) },
    })),
  }
})

import LineupBuilder from '../views/LineupBuilder.vue'
import { showSnackbar } from '@/composables/useSnackbar'
import { useTeamStore } from '../stores/teamStore'

const teamId = 't1'
const players = [
  { id: 'p1', name: 'Jan', number: 1, position: 'GK' },
  { id: 'p2', name: 'Piet', number: 2, position: 'DEF' },
  { id: 'p3', name: 'Klaas', number: 9, position: 'ATT' },
]

function mountBuilder({ ageGroup = 'O11', lineups = [] } = {}) {
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
                ageGroup,
                knvbClass: '5e',
                shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
                players,
              }],
              activeTeamId: teamId,
              activeLineupId: lineups[0]?.id ?? null,
              lineups,
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

async function chooseOverflow(wrapper, label) {
  await wrapper.get('[aria-label="Meer acties"]').trigger('pointerdown')
  await flushPromises()
  const item = [...document.querySelectorAll('.lineup-more-item')]
    .find(el => el.textContent.includes(label))
  expect(item).toBeTruthy()
  item.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flushPromises()
}

describe('LineupBuilder header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.innerHTML = ''
  })

  it('keeps Voorstel and Opslaan visible and puts reset/share/split in overflow', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    const toolbar = wrapper.get('.toolbar-actions').text()
    expect(toolbar).toContain('Voorstel')
    expect(toolbar).toContain('Opslaan')
    expect(toolbar).not.toContain('Reset')
    expect(toolbar).not.toContain('Delen')
    expect(wrapper.find('.structure-chip').exists()).toBe(false)
    expect(wrapper.find('.period-chips').exists()).toBe(false)

    const moreBtn = wrapper.get('[aria-label="Meer acties"]')
    await moreBtn.trigger('pointerdown')
    await flushPromises()

    const menu = document.querySelector('.lineup-more-menu')
    expect(menu).toBeTruthy()
    expect(menu.textContent).toContain('Delen')
    expect(menu.textContent).toContain('Reset')
    expect(menu.textContent).not.toContain('Dupliceren')
    expect(menu.textContent).toContain('Splitsen in kwartieren')
    expect(menu.textContent).toContain('Splitsen in helften')
    expect(menu.textContent).not.toContain('Samenvoegen tot 1 opstelling')

    wrapper.unmount()
  })

  it('merges lineup name and formation into one identity', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    expect(wrapper.get('.lineup-identity .control-kicker').text()).toBe('Opstelling')
    expect(wrapper.get('#formation-select').element.value).toBe('3-2-2')
    expect(wrapper.find('.builder-col-formation').exists()).toBe(false)

    wrapper.unmount()
  })

  it('sizes the formation control to the longest label', async () => {
    const wrapper = mountBuilder({ ageGroup: 'O13' })
    await flushPromises()

    expect(wrapper.get('.formation-select-sizer').text()).toBe('4-2-3-1')
    expect(wrapper.get('#formation-select').classes()).toContain('formation-dropdown--inline')

    wrapper.unmount()
  })

  it('lets you pick a quarter when sharing as an image', async () => {
    if (!URL.createObjectURL) URL.createObjectURL = () => 'blob:preview'
    if (!URL.revokeObjectURL) URL.revokeObjectURL = () => {}
    const wrapper = mountBuilder()
    await flushPromises()

    await chooseOverflow(wrapper, 'Splitsen in kwartieren')
    const suggest = [...wrapper.findAll('button')].find(b => b.text().includes('Voorstel'))
    await suggest.trigger('click')
    await flushPromises()
    await chooseOverflow(wrapper, 'Delen')

    const imageBtn = [...wrapper.findAll('button')].find(b => b.text().includes('Afbeelding'))
    expect(imageBtn).toBeTruthy()
    await imageBtn.trigger('click')
    await flushPromises()

    const picker = wrapper.get('.share-period-picker')
    expect(picker.text()).toContain('Kies welke helft of kwart je deelt')
    expect(picker.text()).toContain('K1')
    expect(picker.text()).toContain('K4')

    wrapper.unmount()
  })

  it('shows period chips after splitting from overflow', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    await chooseOverflow(wrapper, 'Splitsen in kwartieren')

    expect(wrapper.find('.period-chips').exists()).toBe(true)
    expect(wrapper.get('.period-chips').text()).toContain('K1')
    expect(wrapper.get('.period-chips').text()).toContain('K4')
    expect(wrapper.get('.period-chips').text()).toContain('3-2-2')
    expect(wrapper.get('.lineup-identity .control-kicker').text()).toBe('Opstelling · K1')

    wrapper.unmount()
  })

  it('lets each period keep its own formation', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    await chooseOverflow(wrapper, 'Splitsen in kwartieren')

    await wrapper.get('#formation-select').setValue('2-3-2')
    await flushPromises()

    const chips = wrapper.findAll('.period-chip')
    expect(chips[0].text()).toContain('2-3-2')
    expect(chips[1].text()).toContain('3-2-2')

    await chips[1].trigger('click')
    await flushPromises()
    expect(wrapper.get('.lineup-identity .control-kicker').text()).toBe('Opstelling · K2')
    expect(wrapper.get('#formation-select').element.value).toBe('3-2-2')

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

  it('marks a player added from the bench as a guest', async () => {
    const wrapper = mountBuilder()
    await flushPromises()

    wrapper.vm.saveGuestPlayer({
      name: 'Lisa Leen',
      position: 'ATT',
      guest: true,
    })
    await flushPromises()

    const store = useTeamStore()
    const lisa = store.activeTeam.players.find(p => p.name === 'Lisa Leen')
    expect(lisa?.guest).toBe(true)
    expect(lisa?.guestQuiet).toBe(false)

    wrapper.unmount()
  })

  it('moves Voorstel and Opslaan to the second row on mobile', async () => {
    const prev = window.matchMedia
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    const wrapper = mountBuilder()
    await flushPromises()

    expect(wrapper.get('.toolbar-actions').text()).not.toContain('Voorstel')
    expect(wrapper.get('.toolbar-actions').text()).not.toContain('Opslaan')
    const bar = wrapper.get('.builder-header-controls-bar').text()
    expect(bar).toContain('Voorstel')
    expect(bar).toContain('Opslaan')
    expect(bar).toContain('Bank')

    wrapper.unmount()
    window.matchMedia = prev
  })

  it('asks for a name before duplicating a saved lineup', async () => {
    const wrapper = mountBuilder({
      lineups: [{
        id: 'lu-old',
        teamId,
        name: 'Vorige week',
        formationId: '3-2-2',
        slots: [{ slotId: 's0', playerId: 'p1', position: 'GK', x: 50, y: 8 }],
        updatedAt: 1,
      }],
    })
    await flushPromises()

    await wrapper.get('.switcher-btn').trigger('click')
    await flushPromises()
    await wrapper.get('[aria-label="Opstelling dupliceren"]').trigger('click')
    await flushPromises()

    const store = useTeamStore()
    expect(store.teamLineups).toHaveLength(1)
    expect(wrapper.get('.dialog-title').text()).toBe('Opstelling dupliceren')
    expect(wrapper.get('.dialog-body').text()).toContain('kopie van “Vorige week”')
    const nameInput = wrapper.get('#lineup-copy-name')
    expect(nameInput.element.value).toBe('Vorige week (kopie)')

    await wrapper.get('.dialog .btn-filled').trigger('click')
    await flushPromises()

    expect(store.teamLineups).toHaveLength(2)
    const copy = store.teamLineups.find(l => l.id !== 'lu-old')
    expect(copy.name).toBe('Vorige week (kopie)')
    expect(copy.slots[0].playerId).toBe('p1')
    expect(showSnackbar).toHaveBeenCalledWith('"Vorige week (kopie)" aangemaakt')
    expect(routerMocks.push).toHaveBeenCalledWith(`/lineup/${copy.id}`)

    wrapper.unmount()
  })

  it('shows each half’s formation in the lineup archive', async () => {
    const wrapper = mountBuilder({
      lineups: [{
        id: 'lu-old',
        teamId,
        name: 'Vorige week',
        formationId: '4-3-3',
        periodMode: 'halves',
        periods: [
          { formationId: '4-3-3', slots: [{ playerId: 'p1' }] },
          { formationId: '3-2-3', slots: [{ playerId: 'p2' }] },
        ],
        slots: [{ playerId: 'p1' }],
        updatedAt: 1,
      }],
    })
    await flushPromises()

    await wrapper.get('.switcher-btn').trigger('click')
    await flushPromises()

    const meta = wrapper.get('.switcher-item-meta').text()
    expect(meta).toContain('Helften')
    expect(meta).toContain('1e 4-3-3')
    expect(meta).toContain('2e 3-2-3')

    wrapper.unmount()
  })
})
