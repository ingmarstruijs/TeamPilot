import { describe, it, expect, afterEach } from 'vitest'
import { t, setLocale, resetLocale } from '@/i18n'
import { planSessionSync } from '@/ai/models/rulesCoach'
import { buildCoachContext } from '@/ai/buildCoachContext'
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

  it('localizes rules coach briefing in English', () => {
    const presentPlayers = Array.from({ length: 11 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      position: i === 0 ? 'GK' : 'MID',
    }))
    const ctx = buildCoachContext({
      ageGroup: 'O11',
      knvbLevel: 3,
      trainingType: 'gemengd',
      durationMin: 60,
      cycleWeek: 2,
      presentPlayers,
      focus: 'pressing',
    })
    setLocale('en')
    const plan = planSessionSync(ctx)
    expect(plan.coachBriefing).toMatch(/players/i)
    expect(plan.coachBriefing).not.toMatch(/spelers · thema/)
    const techniekBlock = plan.blocks.find(b => b.category === 'techniek')
    expect(techniekBlock?.coachingCues[0]).toMatch(/Quality/)
  })
})
