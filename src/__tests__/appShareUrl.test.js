import { describe, it, expect, afterEach } from 'vitest'
import {
  firstQueryValue,
  readShareParam,
  stripLocationSearch,
  buildHashShareUrl,
  resolveIncomingShare,
} from '../utils/appShareUrl'

describe('appShareUrl', () => {
  it('builds path-based hash URLs (not #/?query)', () => {
    const url = buildHashShareUrl('/import', { team: 'abc-_' })
    expect(url).toContain('#/import?team=abc-_')
    expect(url).not.toContain('#/?')
  })

  it('builds lineup and training URLs with the same pattern', () => {
    expect(buildHashShareUrl('/view', { lineup: 'L1' })).toContain('#/view?lineup=L1')
    expect(buildHashShareUrl('/training/view', { training: 'T1' })).toContain(
      '#/training/view?training=T1',
    )
  })

  it('firstQueryValue unwraps vue-router arrays', () => {
    expect(firstQueryValue(['a', 'b'])).toBe('a')
    expect(firstQueryValue('')).toBeNull()
    expect(firstQueryValue(undefined)).toBeNull()
  })

  it('reads from route.query first, then location.search', () => {
    expect(readShareParam({ query: { team: 'from-hash' } }, 'team')).toBe('from-hash')
  })

  it('resolves team, legacy import, lineup and training kinds', () => {
    expect(resolveIncomingShare({ query: { team: 't' } })).toEqual({ kind: 'team', encoded: 't' })
    expect(resolveIncomingShare({ query: { import: 'i' } })).toEqual({ kind: 'team', encoded: 'i' })
    expect(resolveIncomingShare({ query: { lineup: 'l' } })).toEqual({ kind: 'lineup', encoded: 'l' })
    expect(resolveIncomingShare({ query: { training: 's' } })).toEqual({ kind: 'training', encoded: 's' })
    expect(resolveIncomingShare({ query: { recipe: 'r' } })).toEqual({ kind: 'training', encoded: 'r' })
    expect(resolveIncomingShare({ query: {} })).toBeNull()
  })
})

describe('appShareUrl location.search fallback', () => {
  afterEach(() => {
    window.history.replaceState(window.history.state, '', '/')
  })

  it('reads a share param moved onto location.search', () => {
    window.history.replaceState(window.history.state, '', '/?team=from-search')
    expect(readShareParam({ query: {} }, 'team')).toBe('from-search')
  })

  it('strips location.search while keeping the hash', () => {
    window.history.replaceState(window.history.state, '', '/?import=legacy#/')
    stripLocationSearch()
    expect(window.location.search).toBe('')
    expect(window.location.hash).toBe('#/')
  })
})
