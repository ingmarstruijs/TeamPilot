import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))
vi.mock('@/utils/generatePlayers', () => ({ generatePlayers: vi.fn(() => []) }))

import { showSnackbar } from '@/composables/useSnackbar'
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
                ageGroup: 'JO11',
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
