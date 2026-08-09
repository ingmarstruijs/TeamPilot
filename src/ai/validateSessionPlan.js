import { getExerciseById } from '@/data/exercises'

const CATEGORIES = new Set([
  'warming-up',
  'techniek',
  'tactiek',
  'conditie',
  'partijvorm',
  'afsluiting',
])

/**
 * @param {unknown} plan
 * @param {import('./types.js').CoachContext} ctx
 * @param {{ customExercises?: object[] }} [options]
 * @returns {{ ok: true, plan: import('./types.js').SessionPlan } | { ok: false, errors: string[] }}
 */
export function validateSessionPlan(plan, ctx, options = {}) {
  const errors = []
  const customExercises = options.customExercises ?? []

  if (!plan || typeof plan !== 'object') {
    return { ok: false, errors: ['plan ontbreekt'] }
  }

  const p = /** @type {Record<string, unknown>} */ (plan)

  if (typeof p.title !== 'string' || !p.title.trim()) {
    errors.push('title ontbreekt')
  }
  if (typeof p.coachBriefing !== 'string' || !p.coachBriefing.trim()) {
    errors.push('coachBriefing ontbreekt')
  }
  if (typeof p.theme !== 'string' || !p.theme.trim()) {
    errors.push('theme ontbreekt')
  }
  if (p.engine !== 'rules' && p.engine !== 'local-llm') {
    errors.push('engine ongeldig')
  }
  if (!Array.isArray(p.blocks)) {
    errors.push('blocks ontbreekt')
    return { ok: false, errors }
  }

  const blocks = p.blocks
  if (blocks.length < 4 || blocks.length > 8) {
    errors.push(`blocks.length moet 4–8 zijn (nu ${blocks.length})`)
  }

  const target = Number(ctx?.durationMin) || 60
  let sum = 0
  const categories = new Set()

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    const prefix = `blocks[${i}]`
    if (!block || typeof block !== 'object') {
      errors.push(`${prefix} ongeldig`)
      continue
    }
    const b = /** @type {Record<string, unknown>} */ (block)

    if (b.source !== 'rinus' && b.source !== 'library' && b.source !== 'generated') {
      errors.push(`${prefix}.source ongeldig`)
    }
    if (typeof b.title !== 'string' || !b.title.trim()) {
      errors.push(`${prefix}.title ontbreekt`)
    }
    if (typeof b.category !== 'string' || !CATEGORIES.has(b.category)) {
      errors.push(`${prefix}.category ongeldig`)
    } else {
      categories.add(b.category)
    }

    const duration = Number(b.durationMin)
    if (!Number.isFinite(duration) || duration < 4 || duration > 30) {
      errors.push(`${prefix}.durationMin moet 4–30 zijn`)
    } else {
      sum += duration
    }

    const minPlayers = Number(b.minPlayers)
    const maxPlayers = Number(b.maxPlayers)
    if (!Number.isFinite(minPlayers) || !Number.isFinite(maxPlayers) || minPlayers < 1) {
      errors.push(`${prefix}.min/maxPlayers ongeldig`)
    }

    if (!Array.isArray(b.adaptations)) errors.push(`${prefix}.adaptations moet array zijn`)
    if (!Array.isArray(b.coachingCues)) errors.push(`${prefix}.coachingCues moet array zijn`)
    if (!Array.isArray(b.rules)) errors.push(`${prefix}.rules moet array zijn`)

    if (b.source === 'generated') {
      if (typeof b.description !== 'string') errors.push(`${prefix}.description ontbreekt`)
      if (typeof b.setup !== 'string') errors.push(`${prefix}.setup ontbreekt`)
    } else {
      const exerciseId = typeof b.exerciseId === 'string' ? b.exerciseId : ''
      if (!exerciseId) {
        errors.push(`${prefix}.exerciseId ontbreekt`)
      } else if (!getExerciseById(exerciseId, customExercises)) {
        errors.push(`${prefix}.exerciseId onbekend: ${exerciseId}`)
      }
    }

    const playerCount = Number(ctx?.playerCount) || 0
    if (playerCount > 0 && Number.isFinite(minPlayers) && playerCount < minPlayers) {
      const adaptations = Array.isArray(b.adaptations) ? b.adaptations.join(' ').toLowerCase() : ''
      const mentionsGrouping = /groep|veld|rotat|wissel|tekort|kleiner/.test(adaptations)
      if (!mentionsGrouping) {
        errors.push(`${prefix}: te weinig spelers zonder groeps-adaptatie`)
      }
    }
  }

  if (target >= 45) {
    if (!categories.has('warming-up')) errors.push('warming-up ontbreekt bij ≥45 min')
    if (!categories.has('afsluiting')) errors.push('afsluiting ontbreekt bij ≥45 min')
  }

  const low = target * 0.85
  const high = target * 1.15
  if (blocks.length >= 4 && (sum < low || sum > high)) {
    errors.push(`duur-som ${sum} buiten ${Math.round(low)}–${Math.round(high)} (±15%)`)
  }

  if (typeof p.durationMin === 'number' && p.durationMin !== sum && Number.isFinite(sum)) {
    // allow plan.durationMin to be target; prefer sum of blocks when validating shape
  }

  if (errors.length) return { ok: false, errors }

  return {
    ok: true,
    plan: /** @type {import('./types.js').SessionPlan} */ ({
      title: String(p.title).trim(),
      coachBriefing: String(p.coachBriefing).trim(),
      durationMin: sum,
      theme: String(p.theme).trim(),
      blocks: blocks,
      engine: p.engine,
      modelId: typeof p.modelId === 'string' ? p.modelId : undefined,
    }),
  }
}
