import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))
vi.mock('@/utils/generatePlayers', () => ({ generatePlayers: vi.fn(() => []) }))

import { showSnackbar } from '@/composables/useSnackbar'
import { generatePlayers } from '@/utils/generatePlayers'
import { useTeamStore } from '@/stores/teamStore'
import Players from '../views/Players.vue'

const COPY_BTN_TITLE = 'Kopieer spelerslijst als tekst'

function makePlayer(overrides = {}) {
  return { id: 'p1', name: 'Jan', number: 1, position: 'GK', ...overrides }
}

function mountWithPlayers(players = []) {
  return shallowMount(Players, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            team: {
              teams: [{
                id: 't1',
                name: 'Test Team',
                ageGroup: 'O11',
                shirt: { style: 'solid', primary: '#1a6b3c', secondary: '#ffffff' },
                players,
              }],
              activeTeamId: 't1',
              activeLineupId: null,
              lineups: [],
            },
          },
          stubActions: false,
        }),
      ],
      stubs: { RouterLink: true, RouterView: true },
    },
  })
}

describe('Players – "Kopieer selectie" button', () => {
  let writeText

  beforeEach(() => {
    vi.clearAllMocks()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
  })

  it('is disabled when there are no players', () => {
    const wrapper = mountWithPlayers([])
    const btn = wrapper.find(`button[title="${COPY_BTN_TITLE}"]`)
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('is enabled when players exist', () => {
    const wrapper = mountWithPlayers([makePlayer()])
    const btn = wrapper.find(`button[title="${COPY_BTN_TITLE}"]`)
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('calls navigator.clipboard.writeText on click', async () => {
    const wrapper = mountWithPlayers([makePlayer()])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    expect(writeText).toHaveBeenCalledOnce()
  })

  it('shows a success snackbar after copying', async () => {
    const wrapper = mountWithPlayers([makePlayer()])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    await Promise.resolve() // flush clipboard promise
    expect(showSnackbar).toHaveBeenCalledWith('Spelerslijst gekopieerd!')
  })

  it('includes the team name in the copied text', async () => {
    const wrapper = mountWithPlayers([makePlayer()])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text).toContain('Test Team')
  })

  it('includes the player name in the copied text', async () => {
    const wrapper = mountWithPlayers([makePlayer({ name: 'Piet', number: 10, position: 'MID' })])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text).toContain('Piet')
  })

  it('includes the player number (#) in the copied text', async () => {
    const wrapper = mountWithPlayers([makePlayer({ number: 10, position: 'MID' })])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text).toContain('#10')
  })

  it('omits number part when player has no number', async () => {
    const wrapper = mountWithPlayers([makePlayer({ number: null, position: 'DEF' })])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text).not.toContain('#')
  })

  it('sorts GK before ATT in the output', async () => {
    const wrapper = mountWithPlayers([
      makePlayer({ id: 'p2', name: 'Bob', number: 9, position: 'ATT' }),
      makePlayer({ id: 'p1', name: 'Jan', number: 1, position: 'GK' }),
    ])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text.indexOf('Jan')).toBeLessThan(text.indexOf('Bob'))
  })

  it('sorts in full order: GK → DEF → WB → MID → ATT', async () => {
    const wrapper = mountWithPlayers([
      makePlayer({ id: 'p5', name: 'Aanvaller', position: 'ATT' }),
      makePlayer({ id: 'p4', name: 'Middenvelder', position: 'MID' }),
      makePlayer({ id: 'p3', name: 'Wingback', position: 'WB' }),
      makePlayer({ id: 'p2', name: 'Verdediger', position: 'DEF' }),
      makePlayer({ id: 'p1', name: 'Keeper', position: 'GK' }),
    ])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    const positions = ['Keeper', 'Verdediger', 'Wingback', 'Middenvelder', 'Aanvaller']
      .map(name => text.indexOf(name))
    for (let i = 0; i < positions.length - 1; i++) {
      expect(positions[i]).toBeLessThan(positions[i + 1])
    }
  })

  it('includes the position code in the copied text', async () => {
    const wrapper = mountWithPlayers([makePlayer({ position: 'DEF', name: 'Vera' })])
    await wrapper.find(`button[title="${COPY_BTN_TITLE}"]`).trigger('click')
    const text = writeText.mock.calls[0][0]
    expect(text).toContain('DEF')
  })
})

describe('Players – availability, injury and guests', () => {
  it('does not count guests toward the minimum squad size', () => {
    const wrapper = mountWithPlayers([
      makePlayer(),
      makePlayer({ id: 'g1', name: 'Kees', position: 'ATT', guest: true }),
    ])
    expect(wrapper.get('.players-meta').text()).toContain('1 speler')
    expect(wrapper.get('.players-meta').text()).toContain('min 8')
  })

  it('toggles match availability from the row', async () => {
    const wrapper = mountWithPlayers([makePlayer()])
    await wrapper.get('button[aria-label="Aanwezig"]').trigger('click')
    expect(wrapper.get('button[aria-label="Afwezig"]').exists()).toBe(true)
  })

  it('keeps quiet guests in a collapsed group', () => {
    const wrapper = mountWithPlayers([
      makePlayer(),
      makePlayer({ id: 'g1', name: 'Kees', position: 'ATT', guest: true, guestQuiet: true }),
    ])
    expect(wrapper.text()).toContain('Gasten (1)')
    expect(wrapper.text()).not.toContain('Meenemen in volgende wedstrijd')
  })

  it('marks active guests in the main list', () => {
    const wrapper = mountWithPlayers([
      makePlayer(),
      makePlayer({ id: 'g1', name: 'Kees', position: 'ATT', guest: true }),
    ])
    const guestRow = wrapper.get('.player-row.is-guest')
    expect(guestRow.text()).toContain('Kees')
    expect(guestRow.get('.player-badge.is-guest').text()).toContain('Gast')
  })
})

describe('Players – quick fill', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generatePlayers.mockReturnValue([])
  })

  it('passes the current roster so guests and numbers can be skipped', async () => {
    const roster = [
      makePlayer(),
      makePlayer({ id: 'g1', name: 'Kees', position: 'ATT', guest: true, number: 9 }),
    ]
    const wrapper = mountWithPlayers(roster)
    await wrapper.get('button[title="Vul 7 spelers aan met standaardnamen"]').trigger('click')
    expect(generatePlayers).toHaveBeenCalledWith(7, roster)
  })

  it('saves preferred foot and regular-squad defaults', async () => {
    generatePlayers.mockReturnValue([{
      name: 'Luca Janssen',
      number: 2,
      position: 'DEF',
      preferredFoot: 'L',
      injured: false,
      available: true,
      guest: false,
    }])
    const wrapper = mountWithPlayers([])
    await wrapper.findAll('button').find(b => b.text().includes('Snel aanvullen')).trigger('click')
    await wrapper.get('.qf-dialog .btn-filled').trigger('click')

    const added = useTeamStore().activeTeam.players.find(p => p.name === 'Luca Janssen')
    expect(added).toMatchObject({
      position: 'DEF',
      number: 2,
      preferredFoot: 'L',
      injured: false,
      available: true,
      guest: false,
    })
  })

  it('closes from the top-right icon instead of a cancel button', async () => {
    generatePlayers.mockReturnValue([{
      name: 'Luca Janssen',
      number: 1,
      position: 'GK',
      preferredFoot: 'both',
    }])
    const wrapper = mountWithPlayers([])
    await wrapper.findAll('button').find(b => b.text().includes('Snel aanvullen')).trigger('click')

    expect(wrapper.get('.qf-dialog').text()).not.toContain('Annuleren')
    await wrapper.get('.qf-dialog .btn-icon').trigger('click')
    expect(wrapper.find('.qf-dialog').exists()).toBe(false)
  })
})
