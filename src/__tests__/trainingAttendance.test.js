import { describe, it, expect } from 'vitest'
import {
  splitTrainingAttendance,
  trainingAttendanceCounts,
  allGuestsJoiningTraining,
} from '../utils/trainingAttendance'

function p(overrides) {
  return { id: 'p1', name: 'Jan', position: 'MID', ...overrides }
}

describe('trainingAttendance', () => {
  it('splits regulars, injured and guests', () => {
    const players = [
      p({ id: 'r1' }),
      p({ id: 'r2', available: false }),
      p({ id: 'i1', injured: true }),
      p({ id: 'g1', guest: true }),
      p({ id: 'g2', guest: true }),
    ]
    const present = new Set(['r1', 'g2'])
    const split = splitTrainingAttendance(players, present)
    expect(split.regularPresent.map(x => x.id)).toEqual(['r1'])
    expect(split.regularAbsent.map(x => x.id)).toEqual(['r2'])
    expect(split.injured.map(x => x.id)).toEqual(['i1'])
    expect(split.guests.map(x => x.id)).toEqual(['g1', 'g2'])
  })

  it('does not count guests outside training as absent', () => {
    const players = [
      p({ id: 'r1' }),
      p({ id: 'r2' }),
      p({ id: 'g1', guest: true }),
      p({ id: 'g2', guest: true }),
      p({ id: 'i1', injured: true }),
    ]
    const present = new Set(['r1'])
    const counts = trainingAttendanceCounts(players, present)
    expect(counts).toEqual({
      present: 1,
      absent: 1,
      injured: 1,
      guestsTotal: 2,
      guestsJoining: 0,
      guestsNotJoining: 2,
    })
  })

  it('includes opted-in guests in the present count', () => {
    const players = [
      p({ id: 'r1' }),
      p({ id: 'g1', guest: true }),
      p({ id: 'g2', guest: true }),
    ]
    const present = new Set(['r1', 'g1', 'g2'])
    const counts = trainingAttendanceCounts(players, present)
    expect(counts.present).toBe(3)
    expect(counts.absent).toBe(0)
    expect(counts.guestsJoining).toBe(2)
    expect(counts.guestsNotJoining).toBe(0)
  })

  it('detects when every guest joins training', () => {
    const guests = [p({ id: 'g1', guest: true }), p({ id: 'g2', guest: true })]
    expect(allGuestsJoiningTraining(guests, new Set(['g1', 'g2']))).toBe(true)
    expect(allGuestsJoiningTraining(guests, new Set(['g1']))).toBe(false)
    expect(allGuestsJoiningTraining([], new Set())).toBe(false)
  })
})
