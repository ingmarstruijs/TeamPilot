import { getExerciseById } from '@/data/exercises'
import { fillPlannedBlockNarration, redistributeDurations } from './models/rulesCoach.js'

const CATEGORIES = new Set([
  'warming-up',
  'techniek',
  'tactiek',
  'conditie',
  'partijvorm',
  'afsluiting',
])

/**
 * Soft-repair common small-model mistakes before validation.
 *
 * @param {unknown} raw
 * @param {import('./types.js').CoachContext & { skeleton?: object, candidates?: object }} ctx
 * @param {{ modelId?: string }} [meta]
 * @returns {object|null}
 */
export function normalizeLlmSessionPlan(raw, ctx, meta = {}) {
  if (!raw || typeof raw !== 'object') return null
  const p = /** @type {Record<string, any>} */ ({ ...raw })

  p.engine = 'local-llm'
  if (meta.modelId) p.modelId = meta.modelId
  if (typeof p.title !== 'string' || !p.title.trim()) {
    p.title = `${ctx.cycleTheme || 'Training'}-sessie`
  }
  if (typeof p.theme !== 'string' || !p.theme.trim()) {
    p.theme = ctx.cycleTheme || 'techniek'
  }
  if (typeof p.coachBriefing !== 'string' || !p.coachBriefing.trim()) {
    p.coachBriefing = `Training voor ${ctx.playerCount} spelers, afgestemd op vanavond.`
  }

  const skeletonBlocks = ctx.skeleton?.blocks ?? []
  const candidateIds = new Set(
    (ctx.candidates?.flat ?? [])
      .map(c => c.id)
      .concat(skeletonBlocks.map(b => b.exercise?.id).filter(Boolean)),
  )

  let blocks = Array.isArray(p.blocks) ? [...p.blocks] : []

  // Prefer skeleton structure if model returned too few/many blocks
  if (blocks.length < 4 && skeletonBlocks.length >= 4) {
    blocks = skeletonBlocks.map((b, i) => ({
      source: b.exercise?.rinusId ? 'rinus' : 'library',
      exerciseId: b.exercise?.id,
      title: b.exercise?.title || b.exercise?.name || `Oefening ${i + 1}`,
      category: b.exercise?.category,
      durationMin: b.durationMin,
      minPlayers: b.exercise?.minPlayers ?? 1,
      maxPlayers: b.exercise?.maxPlayers ?? 22,
      description: b.exercise?.description ?? '',
      setup: b.exercise?.setup ?? '',
      rules: Array.isArray(b.exercise?.rules) ? b.exercise.rules : [],
      adaptations: [],
      coachingCues: [],
      whyThis: '',
      ...(blocks[i] && typeof blocks[i] === 'object'
        ? pickNarration(blocks[i])
        : {}),
    }))
  }

  blocks = blocks.map((block, i) => {
    const b = block && typeof block === 'object' ? { ...block } : {}
    const sk = skeletonBlocks[i]?.exercise

    if (!Array.isArray(b.adaptations)) b.adaptations = []
    if (!Array.isArray(b.coachingCues)) b.coachingCues = []
    if (!Array.isArray(b.rules)) b.rules = []

    let exerciseId = typeof b.exerciseId === 'string' ? b.exerciseId : ''
    if (exerciseId && !getExerciseById(exerciseId) && !candidateIds.has(exerciseId)) {
      exerciseId = sk?.id || [...candidateIds][0] || ''
    }
    if (!exerciseId && sk?.id) exerciseId = sk.id

    if (!b.source || !['rinus', 'library', 'generated'].includes(b.source)) {
      b.source = sk?.rinusId ? 'rinus' : 'library'
    }
    if (exerciseId) b.exerciseId = exerciseId

    const ex = exerciseId ? getExerciseById(exerciseId) : sk
    if (!b.title || typeof b.title !== 'string') b.title = ex?.title || ex?.name || `Oefening ${i + 1}`
    if (!CATEGORIES.has(b.category)) b.category = ex?.category || sk?.category || 'techniek'
    b.minPlayers = Number(b.minPlayers) || ex?.minPlayers || sk?.minPlayers || 1
    b.maxPlayers = Number(b.maxPlayers) || ex?.maxPlayers || sk?.maxPlayers || 22
    b.description = typeof b.description === 'string' ? b.description : (ex?.description ?? '')
    b.setup = typeof b.setup === 'string' ? b.setup : (ex?.setup ?? '')

    let duration = Number(b.durationMin)
    if (!Number.isFinite(duration)) duration = skeletonBlocks[i]?.durationMin || 10
    b.durationMin = Math.max(4, Math.min(30, duration))

    if (ctx.playerCount > 0 && ctx.playerCount < b.minPlayers && !b.adaptations.length) {
      b.adaptations = ['Speel in kleinere groepjes of roteer spelers.']
    }

    return fillPlannedBlockNarration(ctx, b, ex || sk || null)
  })

  // Ensure warm-up / cool-down present for long sessions using skeleton
  if ((ctx.durationMin || 60) >= 45 && skeletonBlocks.length) {
    const cats = new Set(blocks.map(b => b.category))
    if (!cats.has('warming-up')) {
      const warm = skeletonBlocks.find(b => b.exercise?.category === 'warming-up')
      if (warm) {
        blocks.unshift(blockFromSkeleton(warm, 'warming-up'))
      }
    }
    if (!cats.has('afsluiting')) {
      const cool = skeletonBlocks.find(b => b.exercise?.category === 'afsluiting')
      if (cool) {
        blocks.push(blockFromSkeleton(cool, 'afsluiting'))
      }
    }
  }

  if (blocks.length > 8) blocks = blocks.slice(0, 8)
  blocks = redistributeDurations(blocks, ctx.durationMin || 60)

  p.blocks = blocks
  p.durationMin = blocks.reduce((s, b) => s + (Number(b.durationMin) || 0), 0)
  return p
}

function pickNarration(block) {
  const out = {}
  if (typeof block.whyThis === 'string' && block.whyThis.trim()) out.whyThis = block.whyThis
  if (Array.isArray(block.adaptations) && block.adaptations.length) out.adaptations = block.adaptations
  if (Array.isArray(block.coachingCues) && block.coachingCues.length) out.coachingCues = block.coachingCues
  if (typeof block.coachBriefing === 'string') out.coachBriefing = block.coachBriefing
  return out
}

function blockFromSkeleton(sk, category) {
  const ex = sk.exercise
  return {
    source: ex?.rinusId ? 'rinus' : 'library',
    exerciseId: ex?.id,
    title: ex?.title || ex?.name || category,
    category,
    durationMin: sk.durationMin || 8,
    minPlayers: ex?.minPlayers ?? 1,
    maxPlayers: ex?.maxPlayers ?? 22,
    description: ex?.description ?? '',
    setup: ex?.setup ?? '',
    rules: [],
    adaptations: [],
    coachingCues: [],
    whyThis: '',
  }
}
