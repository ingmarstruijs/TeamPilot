import { describe, it, expect } from 'vitest'
import { decodeJson, encodeJson } from '../utils/base64url'

describe('base64url', () => {
  it('round-trips unicode JSON', () => {
    const payload = { n: 'FC Ütrecht ⚽', a: 'O11', notes: 'pas & dribbel' }
    expect(decodeJson(encodeJson(payload))).toEqual(payload)
  })

  it('uses URL-safe alphabet without padding', () => {
    const encoded = encodeJson({ v: '>>??' })
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('encodes large payloads that used to crash String.fromCharCode spread', () => {
    const payload = {
      ce: {
        'custom-1': {
          title: 'Grote oefening',
          customSvg: `data:image/svg+xml;base64,${'A'.repeat(300_000)}`,
        },
      },
    }
    const encoded = encodeJson(payload)
    expect(encoded.length).toBeGreaterThan(100_000)
    expect(decodeJson(encoded).ce['custom-1'].title).toBe('Grote oefening')
  })

  it('throws on empty input', () => {
    expect(() => decodeJson('')).toThrow()
    expect(() => decodeJson(null)).toThrow()
  })

  it('throws on corrupt input', () => {
    expect(() => decodeJson('!!!')).toThrow()
    expect(() => decodeJson(btoa('not-json'))).toThrow()
  })
})
