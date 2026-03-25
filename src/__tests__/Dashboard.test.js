import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))

import { showSnackbar } from '@/composables/useSnackbar'
import Dashboard from '../views/Dashboard.vue'

const TEAM = {
  id: 't1',
  name: 'FC Utrecht',
  ageGroup: 'JO13',
  color: '#cc0000',
  shirt: { style: 'stripes', primary: '#cc0000', secondary: '#ffffff' },
  players: [
    { id: 'p1', name: 'Lisa', number: 7, position: 'ATT' },
    { id: 'p2', name: 'Mark', number: null, position: 'GK' },
  ],
}

function mountDashboard(teamOverride = {}) {
  const team = { ...TEAM, ...teamOverride }
  return shallowMount(Dashboard, {
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            team: {
              teams: [team],
              activeTeamId: team.id,
              activeLineupId: null,
              lineups: [],
            },
          },
          stubActions: false,
        }),
      ],
      stubs: { RouterLink: true, ShirtAvatar: true },
    },
  })
}

function decodeShareUrl(url) {
  const b64url = url.split('#/?import=')[1]
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

describe('Dashboard – shareTeam', () => {
  let writeText

  beforeEach(() => {
    vi.clearAllMocks()
    writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    // Ensure clipboard fallback is used (no native share)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
  })

  it('copies a URL to clipboard when navigator.share is unavailable', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    expect(writeText).toHaveBeenCalledOnce()
  })

  it('shows a success snackbar after copying', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    await Promise.resolve()
    expect(showSnackbar).toHaveBeenCalledWith('Team-link gekopieerd!')
  })

  it('generated URL contains the #/?import= hash segment', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const url = writeText.mock.calls[0][0]
    expect(url).toContain('#/?import=')
  })

  it('encoded URL decodes back to the correct team name', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.n).toBe('FC Utrecht')
  })

  it('encoded URL decodes back to the correct ageGroup', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.a).toBe('JO13')
  })

  it('encodes shirt style, primary and secondary color', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.sh).toEqual(['stripes', '#cc0000', '#ffffff'])
  })

  it('encodes all players as compact arrays', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.p).toHaveLength(2)
    expect(decoded.p[0]).toEqual(['Lisa', 7, 'ATT'])
    expect(decoded.p[1]).toEqual(['Mark', null, 'GK'])
  })

  it('encodes null shirt as null when team has no shirt', async () => {
    const wrapper = mountDashboard({ shirt: null })
    await wrapper.find('button.btn-tonal').trigger('click')
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.sh).toBeNull()
  })

  it('uses navigator.share when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    })
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    expect(shareMock).toHaveBeenCalledOnce()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('share payload includes the correct URL', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    })
    const wrapper = mountDashboard()
    await wrapper.find('button.btn-tonal').trigger('click')
    const { url } = shareMock.mock.calls[0][0]
    expect(url).toContain('#/?import=')
    const decoded = decodeShareUrl(url)
    expect(decoded.n).toBe('FC Utrecht')
  })
})
