import { generateTraining, getCycleThemeLabel } from '@/utils/trainingEngine'
import { formatPlayerNote, getExerciseTitle, getRinusRules } from '@/utils/exerciseText'
import { ageGroupLabel } from '@/data/formations'
import { CYCLE_THEMES, getCycleTheme } from '@/utils/trainingThemes'
import { t } from '@/i18n'

function coachingCuesFor(category) {
  const key = `coach.cues.${category}`
  const raw = t(key)
  if (raw !== key && raw.includes('|')) {
    return raw.split('|').map(s => s.trim()).filter(Boolean)
  }
  if (raw !== key) return [raw]
  return [t('coach.cueDefault')]
}

function resolvedThemeId(ctx) {
  const raw = ctx.cycleTheme
  if (typeof raw === 'number') return getCycleTheme(raw)
  if (CYCLE_THEMES.includes(raw)) return raw
  return getCycleTheme(ctx.cycleWeek ?? 1)
}

function localizedThemeLabel(ctx) {
  const id = resolvedThemeId(ctx)
  const label = t(`trainingType.${id}`)
  return label.startsWith('trainingType.') ? getCycleThemeLabel(id) : label
}

/**
 * @param {import('../types.js').CoachContext} ctx
 * @param {object} exercise
 * @returns {string[]}
 */
function buildAdaptations(ctx, exercise) {
  const note = formatPlayerNote(exercise, ctx.playerCount || null).trim()
  const lines = []
  if (note) lines.push(note.replace(/\s+$/, ''))
  if (!ctx.presentPlayers?.some(p => p.position === 'GK')) {
    lines.push(t('coach.noGk'))
  }
  if (ctx.focus) {
    lines.push(t('coach.focusTonight', { focus: ctx.focus }))
  }
  return lines
}

/**
 * @param {import('../types.js').CoachContext} ctx
 * @param {object} exercise
 */
function buildWhyThis(ctx, exercise) {
  const bits = []
  if (ctx.balance?.needsAttackFocus && exercise.focusPositions?.includes('ATT')) {
    bits.push(t('coach.whyAttackFocus'))
  } else if (ctx.balance?.needsDefenceFocus && exercise.focusPositions?.includes('DEF')) {
    bits.push(t('coach.whyDefenceFocus'))
  }
  if (exercise.cycleThemes?.includes(ctx.cycleTheme)) {
    bits.push(t('coach.whyWeekTheme', { theme: localizedThemeLabel(ctx) }))
  }
  if (ctx.focus && (exercise.title?.toLowerCase().includes(ctx.focus.toLowerCase())
    || exercise.description?.toLowerCase().includes(ctx.focus.toLowerCase()))) {
    bits.push(t('coach.whyFocusMatch', { focus: ctx.focus }))
  }
  if (!bits.length) {
    if (ctx.playerCount) {
      bits.push(t('coach.whyDefault', {
        ageGroup: ageGroupLabel(ctx.ageGroup),
        count: ctx.playerCount,
      }))
    } else {
      bits.push(t('coach.whyDefaultNoCount', { ageGroup: ageGroupLabel(ctx.ageGroup) }))
    }
  }
  return bits.join(' · ')
}

/**
 * Fill empty coach narration on a planned block (e.g. thin local-LLM output).
 *
 * @param {import('../types.js').CoachContext} ctx
 * @param {import('../types.js').PlannedBlock} block
 * @param {object} [exercise]
 * @returns {import('../types.js').PlannedBlock}
 */
export function fillPlannedBlockNarration(ctx, block, exercise) {
  const ex = exercise || {
    title: block.title,
    description: block.description,
    category: block.category,
    focusPositions: block.focusPositions,
    cycleThemes: block.cycleThemes,
  }
  const adaptations = Array.isArray(block.adaptations) ? block.adaptations.filter(Boolean) : []
  const coachingCues = Array.isArray(block.coachingCues) ? block.coachingCues.filter(Boolean) : []
  const whyThis = typeof block.whyThis === 'string' ? block.whyThis.trim() : ''
  const category = ex.category || block.category

  return {
    ...block,
    whyThis: whyThis || buildWhyThis(ctx, ex),
    adaptations: adaptations.length ? adaptations : buildAdaptations(ctx, ex),
    coachingCues: coachingCues.length
      ? coachingCues
      : coachingCuesFor(category),
  }
}

/**
 * @param {import('../types.js').CoachContext} ctx
 * @param {object} exercise
 * @param {number} durationMin
 * @returns {import('../types.js').PlannedBlock}
 */
function blockFromExercise(ctx, exercise, durationMin) {
  const source = exercise.rinusId || exercise.source?.toLowerCase?.().includes('rinus')
    ? 'rinus'
    : 'library'
  return {
    source,
    exerciseId: exercise.id,
    title: getExerciseTitle(exercise),
    category: exercise.category,
    durationMin,
    minPlayers: exercise.minPlayers,
    maxPlayers: exercise.maxPlayers,
    description: exercise.description ?? '',
    setup: exercise.setup ?? '',
    rules: getRinusRules(exercise).length ? getRinusRules(exercise) : (exercise.rules ?? []),
    adaptations: buildAdaptations(ctx, exercise),
    coachingCues: coachingCuesFor(exercise.category),
    whyThis: buildWhyThis(ctx, exercise),
  }
}

/**
 * @param {import('../types.js').CoachContext} ctx
 */
function buildBriefing(ctx, blocks) {
  const theme = localizedThemeLabel(ctx)
  const focusBit = ctx.focus ? t('coach.briefingFocus', { focus: ctx.focus }) : ''
  const balanceBit = ctx.balance?.needsAttackFocus
    ? t('coach.briefingAttack')
    : ctx.balance?.needsDefenceFocus
      ? t('coach.briefingDefence')
      : ''
  return t('coach.briefing', {
    ageGroup: ageGroupLabel(ctx.ageGroup),
    count: ctx.playerCount,
    theme,
    focusBit,
    balanceBit,
    blockCount: blocks.length,
  })
}

/**
 * Scale block minutes so the session hits the target (missing template slots
 * otherwise leave the sum short and fail schema validation).
 *
 * @param {import('../types.js').PlannedBlock[]} blocks
 * @param {number} targetMin
 */
export function redistributeDurations(blocks, targetMin) {
  if (!blocks.length) return blocks
  const sum = blocks.reduce((s, b) => s + b.durationMin, 0)
  if (!sum || !targetMin) return blocks

  const scaled = blocks.map(b => ({
    ...b,
    durationMin: Math.max(4, Math.min(30, Math.round((b.durationMin * targetMin) / sum))),
  }))

  let newSum = scaled.reduce((s, b) => s + b.durationMin, 0)
  let guard = 0
  while (newSum !== targetMin && guard < 40) {
    const idx = Math.min(scaled.length - 2, Math.max(0, scaled.length - 2))
    const diff = targetMin > newSum ? 1 : -1
    const next = scaled[idx].durationMin + diff
    if (next < 4 || next > 30) {
      // try any adjustable block
      const alt = scaled.findIndex(b => {
        const n = b.durationMin + diff
        return n >= 4 && n <= 30
      })
      if (alt < 0) break
      scaled[alt] = { ...scaled[alt], durationMin: scaled[alt].durationMin + diff }
      newSum += diff
    } else {
      scaled[idx] = { ...scaled[idx], durationMin: next }
      newSum += diff
    }
    guard++
  }
  return scaled
}

/**
 * @param {import('../types.js').CoachContext} ctx
 * @returns {import('../types.js').SessionPlan}
 */
export function planSessionSync(ctx) {
  const skeleton = ctx.skeleton ?? generateTraining({
    ageGroup: ctx.ageGroup,
    knvbLevel: ctx.knvbLevel,
    playerCount: ctx.playerCount || undefined,
    trainingType: ctx.trainingType,
    durationMin: ctx.durationMin,
    cycleWeek: ctx.cycleWeek,
    recentIds: ctx.recentExerciseIds ?? [],
    presentPlayers: ctx.presentPlayers ?? [],
  })

  let blocks = (skeleton.blocks ?? []).map(b =>
    blockFromExercise(ctx, b.exercise, b.durationMin),
  )
  blocks = redistributeDurations(blocks, ctx.durationMin)

  const theme = localizedThemeLabel(ctx)
  const title = ctx.focus
    ? `${theme} · ${ctx.focus}`
    : `${theme}-training`

  return {
    title,
    coachBriefing: buildBriefing(ctx, blocks),
    durationMin: blocks.reduce((s, b) => s + b.durationMin, 0),
    theme,
    blocks,
    engine: 'rules',
    modelId: 'rules-v1',
  }
}

/**
 * Deterministic block mutations from chip/keyword instructions.
 *
 * @param {import('../types.js').CoachContext} ctx
 * @param {import('../types.js').PlannedBlock} block
 * @param {string} instruction
 * @returns {import('../types.js').PlannedBlock}
 */
export function adaptBlockSync(ctx, block, instruction) {
  const text = String(instruction ?? '').toLowerCase().trim()
  const next = {
    ...block,
    adaptations: [...(block.adaptations ?? [])],
    coachingCues: [...(block.coachingCues ?? [])],
    rules: [...(block.rules ?? [])],
  }

  const clampDuration = (n) => Math.max(4, Math.min(30, n))

  if (/makkelijker|eenvoudiger|simpeler|easier|simpler/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) - 0)
    next.rules.push(t('coach.adaptEasierRule'))
    next.adaptations.push(t('coach.adaptEasierVariant'))
    next.coachingCues = [t('coach.adaptEasierCue')]
    next.whyThis = [next.whyThis, t('coach.adaptEasierWhy')].filter(Boolean).join(' · ')
    return next
  }
  if (/moeilijker|zwaarder|lastiger|harder/.test(text)) {
    next.rules.push(t('coach.adaptHarderRule'))
    next.adaptations.push(t('coach.adaptHarderVariant'))
    next.coachingCues = [t('coach.adaptHarderCue')]
    next.whyThis = [next.whyThis, t('coach.adaptHarderWhy')].filter(Boolean).join(' · ')
    return next
  }
  if (/korter|korter maken|inkorten|shorter/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) - 3)
    next.adaptations.push(t('coach.adaptShorter'))
    return next
  }
  if (/langer|verlengen|meer tijd|longer/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) + 3)
    next.adaptations.push(t('coach.adaptLonger'))
    return next
  }
  if (/geen keeper|zonder keeper|no.?gk|no goalkeeper/.test(text)) {
    next.adaptations.push(t('coach.adaptNoGk'))
    next.rules.push(t('coach.adaptNoGkRule'))
    return next
  }
  if (/meer druk|druk zetten|pressen|more press|pressing/.test(text)) {
    next.rules.push(t('coach.adaptPressRule'))
    next.coachingCues = [t('coach.adaptPressCue')]
    next.adaptations.push(t('coach.adaptPressAdapt'))
    if (ctx.focus !== 'druk zetten') {
      next.whyThis = [next.whyThis, t('coach.adaptPressWhy')].filter(Boolean).join(' · ')
    }
    return next
  }

  next.coachingCues = [
    ...(next.coachingCues ?? []),
    t('coach.adaptTryHint'),
  ]
  return next
}

/**
 * @returns {import('../coachModel.js').CoachModel}
 */
export function createRulesCoach() {
  return {
    id: 'rules-v1',
    async status() {
      return 'offline-rules'
    },
    async planSession(ctx, opts = {}) {
      opts.onProgress?.({ progress: 0.35, text: t('coach.progressPlanning') })
      const plan = planSessionSync(ctx)
      opts.onProgress?.({ progress: 1, text: t('coach.progressReady') })
      return plan
    },
    async adaptBlock(ctx, block, instruction, opts = {}) {
      opts.onProgress?.({ progress: 1, text: t('coach.progressAdapted') })
      return adaptBlockSync(ctx, block, instruction)
    },
    async explainBlock(ctx, block) {
      return block.whyThis
        || t('coach.explainBlock', {
          title: block.title,
          count: ctx.playerCount,
          category: block.category,
        })
    },
  }
}
