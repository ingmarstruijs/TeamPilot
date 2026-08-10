import { describe, it, expect } from 'vitest'
import { parseJsonFromModelText } from '@/ai/parseModelJson'

describe('parseJsonFromModelText', () => {
  it('parses raw and fenced JSON', () => {
    expect(parseJsonFromModelText('{"a":1}')).toEqual({ a: 1 })
    expect(parseJsonFromModelText('```json\n{"b":2}\n```')).toEqual({ b: 2 })
    expect(parseJsonFromModelText('Sure.\n{"c":3}\nDone.')).toEqual({ c: 3 })
  })
})
