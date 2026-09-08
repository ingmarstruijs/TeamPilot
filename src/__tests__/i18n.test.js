import { describe, it, expect, afterEach } from 'vitest'
import { t, setLocale, resetLocale } from '@/i18n'
import { encodeTrainingSession, decodeTrainingSession } from '@/utils/trainingShare'
import { encodeTeamShare, decodeTeamShare } from '@/utils/teamShare'
import { EXERCISES } from '@/data/exercises'

describe('i18n', () => {
  afterEach(() => {
    resetLocale()
  })

  it('defaults to Dutch UI copy', () => {
    expect(t('nav.players')).toBe('Spelers')
    expect(t('share.import')).toBe('Importeren')
    expect(t('trainingShare.sessionTitle')).toBe('Gedeelde trainingssessie')
  })

  it('switches UI copy to English without changing share payloads', () => {
    const session = {
      teamName: 'Deel Team',
      ageGroup: 'O13',
      knvbClass: '4e',
      trainingType: 'techniek',
      durationMin: 60,
      playerCount: 10,
      cycleWeek: 1,
      blocks: [{ exercise: EXERCISES[0], durationMin: 12 }],
    }
    const team = {
      name: 'FC Utrecht',
      ageGroup: 'O13',
      shirt: { style: 'stripes', primary: '#cc0000', secondary: '#ffffff' },
      players: [{ name: 'Lisa', number: 7, position: 'ATT' }],
    }

    const trainingNl = encodeTrainingSession(session)
    const teamNl = encodeTeamShare(team)
    setLocale('en')
    expect(t('nav.players')).toBe('Players')
    expect(encodeTrainingSession(session)).toBe(trainingNl)
    expect(encodeTeamShare(team)).toBe(teamNl)
    expect(decodeTrainingSession(trainingNl).blocks).toEqual([{ exerciseId: EXERCISES[0].id, durationMin: 12 }])
    expect(decodeTeamShare(teamNl).name).toBe('FC Utrecht')
  })
})
