import { describe, it, expect, vi, beforeEach } from 'vitest'
import { shallowMount, flushPromises } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'

vi.mock('@/composables/useSnackbar', () => ({ showSnackbar: vi.fn() }))

import { showSnackbar } from '@/composables/useSnackbar'
import Dashboard from '../views/Dashboard.vue'

const TEAM = {
  id: 't1',
  name: 'FC Utrecht',
  ageGroup: 'O13',
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
  const hash = url.split('#')[1] ?? ''
  const qs = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : ''
  const encoded = new URLSearchParams(qs).get('team') || new URLSearchParams(qs).get('import')
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
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
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledOnce()
  })

  it('shows a success snackbar after copying', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    expect(showSnackbar).toHaveBeenCalledWith('Team-link gekopieerd!')
  })

  it('generated URL contains the #/import?team= hash segment', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const url = writeText.mock.calls[0][0]
    expect(url).toContain('#/import?team=')
    expect(url).not.toContain('#/?import=')
  })

  it('encoded URL decodes back to the correct team name', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.n).toBe('FC Utrecht')
  })

  it('encoded URL decodes back to the correct ageGroup', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.a).toBe('O13')
  })

  it('encodes shirt style, primary and secondary color', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.sh).toEqual(['stripes', '#cc0000', '#ffffff'])
  })

  it('encodes all players as compact arrays', async () => {
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const decoded = decodeShareUrl(writeText.mock.calls[0][0])
    expect(decoded.p).toHaveLength(2)
    expect(decoded.p[0]).toEqual(['Lisa', 7, 'ATT'])
    expect(decoded.p[1]).toEqual(['Mark', null, 'GK'])
  })

  it('encodes null shirt as null when team has no shirt', async () => {
    const wrapper = mountDashboard({ shirt: null })
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
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
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    expect(shareMock).toHaveBeenCalledOnce()
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to clipboard when share rejects (non-abort)', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('denied')),
    })
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledOnce()
    expect(showSnackbar).toHaveBeenCalledWith('Team-link gekopieerd!')
  })

  it('share payload includes the correct URL', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: shareMock,
    })
    const wrapper = mountDashboard()
    await wrapper.find('button.share-btn').trigger('click')
    await flushPromises()
    const { url } = shareMock.mock.calls[0][0]
    expect(url).toContain('#/import?team=')
    const decoded = decodeShareUrl(url)
    expect(decoded.n).toBe('FC Utrecht')
  })
})
