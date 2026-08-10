import { describe, it, expect } from 'vitest'
import { buildCoachContext } from '@/ai/buildCoachContext'
import { createRulesCoach, planSessionSync, adaptBlockSync } from '@/ai/models/rulesCoach'
import { validateSessionPlan } from '@/ai/validateSessionPlan'

function players(count, withGk = true) {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    name: `Speler ${i}`,
    position: withGk && i === 0 ? 'GK' : i % 3 === 0 ? 'DEF' : i % 3 === 1 ? 'MID' : 'ATT',
  }))
}

function ctxForCount(n) {
  return buildCoachContext({
    ageGroup: 'O11',
    knvbLevel: 3,
    trainingType: 'gemengd',
    durationMin: 60,
    cycleWeek: 2,
    presentPlayers: players(n),
    focus: 'druk zetten',
  })
}

describe('rulesCoach', () => {
  it('plans a session that respects age and player count', () => {
    for (const count of [8, 11, 14]) {
      const ctx = ctxForCount(count)
      const plan = planSessionSync(ctx)
      expect(plan.engine).toBe('rules')
      expect(plan.coachBriefing).toMatch(/spelers/)
      expect(plan.coachBriefing).toMatch(/druk zetten/)
      expect(plan.blocks.length).toBeGreaterThanOrEqual(4)
      expect(plan.blocks.every(b => b.exerciseId)).toBe(true)
      expect(plan.blocks.every(b => Array.isArray(b.adaptations))).toBe(true)
      expect(plan.blocks.every(b => Array.isArray(b.coachingCues))).toBe(true)
      expect(validateSessionPlan(plan, ctx).ok).toBe(true)
    }
  })

  it('includes whyThis and adaptations on blocks', () => {
    const ctx = ctxForCount(11)
    const plan = planSessionSync(ctx)
    expect(plan.blocks[0].whyThis).toBeTruthy()
    expect(plan.blocks.some(b => b.adaptations.some(a => /druk zetten|aanwezige/i.test(a)))).toBe(true)
  })

  it('adaptBlock shortens and hardens blocks', async () => {
    const coach = createRulesCoach()
    const ctx = ctxForCount(11)
    const plan = await coach.planSession(ctx)
    const block = plan.blocks[1]
    const shorter = await coach.adaptBlock(ctx, block, 'korter')
    expect(shorter.durationMin).toBe(block.durationMin - 3)
    const harder = adaptBlockSync(ctx, block, 'moeilijker')
    expect(harder.rules.some(r => /Moeilijker/i.test(r))).toBe(true)
  })

  it('unknown adapt instruction keeps duration and adds cue', () => {
    const ctx = ctxForCount(8)
    const plan = planSessionSync(ctx)
    const block = plan.blocks[0]
    const next = adaptBlockSync(ctx, block, 'maak het paars')
    expect(next.durationMin).toBe(block.durationMin)
    expect(next.coachingCues.some(c => /Probeer:/i.test(c))).toBe(true)
  })
})
