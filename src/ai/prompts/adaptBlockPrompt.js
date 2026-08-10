import { compactCoachContext } from './planSessionPrompt.js'

/**
 * @param {import('../types.js').CoachContext} ctx
 * @param {import('../types.js').PlannedBlock} block
 * @param {string} instruction
 */
export function buildAdaptBlockMessages(ctx, block, instruction) {
  const system = [
    'You adapt one football training block for TeamPilot.',
    'Keep the same exerciseId and source unless the instruction requires a generated variant.',
    'Return JSON only for one PlannedBlock. No markdown.',
    'Dutch coachingCues and adaptations. Respect playerCount.',
  ].join(' ')

  const user = JSON.stringify({
    context: compactCoachContext(ctx),
    block: {
      source: block.source,
      exerciseId: block.exerciseId,
      title: block.title,
      category: block.category,
      durationMin: block.durationMin,
      minPlayers: block.minPlayers,
      maxPlayers: block.maxPlayers,
      description: block.description,
      setup: block.setup,
      rules: block.rules ?? [],
      adaptations: block.adaptations ?? [],
      coachingCues: block.coachingCues ?? [],
      whyThis: block.whyThis ?? '',
    },
    instruction: String(instruction ?? '').trim(),
  })

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}
