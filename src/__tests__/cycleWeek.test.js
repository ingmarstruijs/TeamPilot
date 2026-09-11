import { describe, it, expect } from 'vitest'
import { getIsoWeekKey, latestLineupInIsoWeek } from '../utils/cycleWeek'

describe('latestLineupInIsoWeek', () => {
  const friday = new Date('2026-09-11T12:00:00')

  it('picks the newest lineup from the same ISO week', () => {
    const lineups = [
      { id: 'old', updatedAt: new Date('2026-09-01T12:00:00').getTime() },
      { id: 'earlier', updatedAt: new Date('2026-09-07T12:00:00').getTime() },
      { id: 'later', updatedAt: new Date('2026-09-11T09:00:00').getTime() },
    ]
    expect(latestLineupInIsoWeek(lineups, friday).id).toBe('later')
  })

  it('returns null when nothing was saved this week', () => {
    const lineups = [
      { id: 'old', updatedAt: new Date('2026-09-01T12:00:00').getTime() },
    ]
    expect(latestLineupInIsoWeek(lineups, friday)).toBeNull()
  })

  it('uses createdAt when updatedAt is missing', () => {
    const lineups = [
      { id: 'created', createdAt: new Date('2026-09-09T12:00:00').getTime() },
    ]
    expect(latestLineupInIsoWeek(lineups, friday).id).toBe('created')
  })

  it('groups Friday with the Monday of the same ISO week', () => {
    expect(getIsoWeekKey(new Date('2026-09-07'))).toBe(getIsoWeekKey(friday))
  })
})
