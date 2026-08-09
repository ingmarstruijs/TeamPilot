import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { shareLink } from '../utils/shareLink'

describe('shareLink', () => {
  const originalShare = navigator.share
  const originalClipboard = navigator.clipboard

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: originalShare,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: originalClipboard,
    })
  })

  it('uses navigator.share when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', { configurable: true, value: share })
    const result = await shareLink({ title: 'T', text: 'x', url: 'https://example.test' })
    expect(result).toBe('shared')
    expect(share).toHaveBeenCalledOnce()
  })

  it('returns aborted when user cancels share sheet', async () => {
    const err = new Error('cancelled')
    err.name = 'AbortError'
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(err),
    })
    const writeText = vi.fn()
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const result = await shareLink({ title: 'T', text: 'x', url: 'https://example.test' })
    expect(result).toBe('aborted')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('falls back to clipboard when share fails for another reason', async () => {
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: vi.fn().mockRejectedValue(new Error('not allowed')),
    })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const result = await shareLink({ title: 'T', text: 'x', url: 'https://example.test/a' })
    expect(result).toBe('copied')
    expect(writeText).toHaveBeenCalledWith('https://example.test/a')
  })

  it('copies when share API is unavailable', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    await expect(shareLink({ title: 'T', text: 'x', url: 'u' })).resolves.toBe('copied')
  })

  it('returns failed when clipboard also rejects', async () => {
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    })
    await expect(shareLink({ title: 'T', text: 'x', url: 'u' })).resolves.toBe('failed')
  })
})
