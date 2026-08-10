/**
 * Compact context for prompts — positions/counts only (no player names by default).
 * @param {import('../types.js').CoachContext} ctx
 */
export function compactCoachContext(ctx) {
  const positions = (ctx.presentPlayers ?? []).map(p => p.position)
  return {
    ageGroup: ctx.ageGroup,
    knvbLevel: ctx.knvbLevel,
    knvbClass: ctx.knvbClass,
    trainingType: ctx.trainingType,
    durationMin: ctx.durationMin,
    cycleWeek: ctx.cycleWeek,
    cycleTheme: ctx.cycleTheme,
    playerCount: ctx.playerCount,
    positions,
    focus: ctx.focus || null,
    balance: ctx.balance
      ? {
          needsAttackFocus: Boolean(ctx.balance.needsAttackFocus),
          needsDefenceFocus: Boolean(ctx.balance.needsDefenceFocus),
          counts: ctx.balance.counts ?? null,
        }
      : null,
    locale: 'nl',
  }
}

/**
 * @param {import('../types.js').CoachContext & { skeleton?: object, candidates?: object }} ctx
 */
export function buildPlanSessionMessages(ctx) {
  const skeletonBlocks = (ctx.skeleton?.blocks ?? []).map(b => ({
    category: b.exercise?.category,
    durationMin: b.durationMin,
    exerciseId: b.exercise?.id,
    title: b.exercise?.title || b.exercise?.name || undefined,
  }))

  const candidatesBySlot = (ctx.candidates?.bySlot ?? []).map(slot => ({
    category: slot.category,
    targetMin: slot.targetMin,
    candidates: (slot.candidates ?? []).map(c => ({
      id: c.id,
      title: c.title,
      minPlayers: c.minPlayers,
      maxPlayers: c.maxPlayers,
    })),
  }))

  const system = [
    'You are a Dutch grassroots football coaching planner for TeamPilot.',
    'Only pick exerciseId values from the provided candidates unless absolutely necessary to mark source:"generated".',
    'Respect playerCount; put practical adaptations in adaptations[].',
    'Output JSON only matching SessionPlan. No markdown, no commentary.',
    'SessionPlan fields: title, coachBriefing (Dutch, 1-3 sentences), durationMin, theme, blocks[], engine:"local-llm".',
    'Each block: source (rinus|library|generated), exerciseId, title, category, durationMin (4-30), minPlayers, maxPlayers, description, setup, rules[], adaptations[], coachingCues[], whyThis.',
    'Use 4-8 blocks. Sum of durationMin within ±15% of context.durationMin.',
  ].join(' ')

  const user = JSON.stringify({
    context: compactCoachContext(ctx),
    skeleton: skeletonBlocks,
    candidatesBySlot,
  })

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

/**
 * @param {string[]} errors
 * @param {unknown} previous
 */
export function buildRepairMessages(errors, previous) {
  return [
    {
      role: 'system',
      content: 'Fix the SessionPlan JSON so it passes validation. Output JSON only, no markdown.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        errors,
        previous,
        instruction: 'Return a corrected full SessionPlan with engine:"local-llm".',
      }),
    },
  ]
}
