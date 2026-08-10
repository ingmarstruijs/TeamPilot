import { describe, it, expect } from 'vitest'
import { buildPlanSessionMessages } from '@/ai/prompts/planSessionPrompt'
import { buildCoachContext } from '@/ai/buildCoachContext'

describe('planSessionPrompt', () => {
  it('includes candidate ids and JSON-only instruction', () => {
    const ctx = buildCoachContext({
      ageGroup: 'O11',
      knvbLevel: 3,
      presentPlayers: [
        { id: '1', name: 'Anna', position: 'ATT' },
        { id: '2', name: 'Bo', position: 'MID' },
      ],
      durationMin: 60,
      cycleWeek: 1,
    })
    const messages = buildPlanSessionMessages({
      ...ctx,
      skeleton: {
        blocks: [{
          exercise: { id: 'ex-a', category: 'techniek', title: 'Pass' },
          durationMin: 10,
        }],
      },
      candidates: {
        bySlot: [{
          category: 'techniek',
          targetMin: 10,
          candidates: [
            { id: 'ex-a', title: 'Pass', minPlayers: 6, maxPlayers: 12 },
            { id: 'ex-b', title: 'Dribble', minPlayers: 4, maxPlayers: 10 },
          ],
        }],
      },
    })

    expect(messages[0].content).toMatch(/JSON only/i)
    expect(messages[0].content).toMatch(/No markdown/i)
    expect(messages[1].content).toContain('ex-a')
    expect(messages[1].content).toContain('ex-b')
    expect(messages[1].content).not.toContain('Anna')
  })
})
