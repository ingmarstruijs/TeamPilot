import { generateTraining, getCycleThemeLabel } from '@/utils/trainingEngine'
import { formatPlayerNote, getExerciseTitle, getRinusRules } from '@/utils/exerciseText'
import { ageGroupLabel } from '@/data/formations'

const COACHING_CUES = {
  'warming-up': ['Houd tempo hoog maar gecontroleerd.', 'Iedereen raakt de bal vroeg.'],
  techniek: ['Kwaliteit voor snelheid.', 'Eis twee goede touches voordat je doorspeelt.'],
  tactiek: ['Praat hardop: wie dekt wie?', 'Houd de organisatie ook bij balverlies.'],
  conditie: ['Korte herstelmomenten, blijf scherp.', 'Intensiteit eerst, dan herhaalbaarheid.'],
  partijvorm: ['Speel door bij voorsprong.', 'Beloon druk zetten direct na balverlies.'],
  afsluiting: ['Rustig uitlopen, kort reflecteren.', 'Eén leerpunt mee naar huis.'],
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
    lines.push('Geen keeper aanwezig: speel met vaste achterste of wisselende keeper.')
  }
  if (ctx.focus) {
    lines.push(`Focus vanavond: ${ctx.focus}.`)
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
    bits.push('Veel verdedigers aanwezig → extra aanvallend werk')
  } else if (ctx.balance?.needsDefenceFocus && exercise.focusPositions?.includes('DEF')) {
    bits.push('Veel aanvallers aanwezig → extra druk zetten / verdedigen')
  }
  if (exercise.cycleThemes?.includes(ctx.cycleTheme)) {
    bits.push(`Past bij weekthema ${getCycleThemeLabel(ctx.cycleTheme)}`)
  }
  if (ctx.focus && (exercise.title?.toLowerCase().includes(ctx.focus.toLowerCase())
    || exercise.description?.toLowerCase().includes(ctx.focus.toLowerCase()))) {
    bits.push(`Sluit aan op focus “${ctx.focus}”`)
  }
  if (!bits.length) {
    bits.push(`Past bij ${ageGroupLabel(ctx.ageGroup)} en ${ctx.playerCount || 'de'} aanwezige spelers`)
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

  return {
    ...block,
    whyThis: whyThis || buildWhyThis(ctx, ex),
    adaptations: adaptations.length ? adaptations : buildAdaptations(ctx, ex),
    coachingCues: coachingCues.length
      ? coachingCues
      : (COACHING_CUES[ex.category || block.category] ?? ['Houd iedereen betrokken.']),
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
    coachingCues: COACHING_CUES[exercise.category] ?? ['Houd iedereen betrokken.'],
    whyThis: buildWhyThis(ctx, exercise),
  }
}

/**
 * @param {import('../types.js').CoachContext} ctx
 */
function buildBriefing(ctx, blocks) {
  const theme = getCycleThemeLabel(ctx.cycleTheme)
  const focusBit = ctx.focus ? ` Focus: ${ctx.focus}.` : ''
  const balanceBit = ctx.balance?.needsAttackFocus
    ? ' Extra aandacht voor aanvallen.'
    : ctx.balance?.needsDefenceFocus
      ? ' Extra aandacht voor verdedigen en druk zetten.'
      : ''
  return `Training voor ${ageGroupLabel(ctx.ageGroup)} met ${ctx.playerCount} spelers · thema ${theme}.${focusBit}${balanceBit} ${blocks.length} oefeningen, klaar voor op het veld.`
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

  const theme = getCycleThemeLabel(ctx.cycleTheme)
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

  if (/makkelijker|eenvoudiger|simpeler/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) - 0)
    next.rules.push('Makkelijker: meer touches toegestaan / minder druk op de balbezitter.')
    next.adaptations.push('Variant: verlaag weerstand of vergroot speelruimte.')
    next.coachingCues = ['Geef succeservaringen, bouw daarna op.']
    next.whyThis = [next.whyThis, 'Makkelijkere variant voor vanavond'].filter(Boolean).join(' · ')
    return next
  }
  if (/moeilijker|zwaarder|lastiger/.test(text)) {
    next.rules.push('Moeilijker: sneller handelen, minder touches, meer druk.')
    next.adaptations.push('Variant: kleinere ruimte of extra verdediger.')
    next.coachingCues = ['Eis tempo en scherpe keuzes.']
    next.whyThis = [next.whyThis, 'Zwaardere variant voor vanavond'].filter(Boolean).join(' · ')
    return next
  }
  if (/korter|korter maken|inkorten/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) - 3)
    next.adaptations.push('Blok ingekort voor strakker tempo.')
    return next
  }
  if (/langer|verlengen|meer tijd/.test(text)) {
    next.durationMin = clampDuration((next.durationMin ?? 10) + 3)
    next.adaptations.push('Blok verlengd voor meer herhalingen.')
    return next
  }
  if (/geen keeper|zonder keeper|no.?gk/.test(text)) {
    next.adaptations.push('Geen keeper: speel op kleine doeltjes of wisselende keeper.')
    next.rules.push('Geen vaste keeper in dit blok.')
    return next
  }
  if (/meer druk|druk zetten|pressen/.test(text)) {
    next.rules.push('Direct druk zetten na balverlies (5 seconden).')
    next.coachingCues = ['Beloon de eerste drukker hardop.']
    next.adaptations.push('Extra druk-moment ingebouwd.')
    if (ctx.focus !== 'druk zetten') {
      next.whyThis = [next.whyThis, 'Meer druk gevraagd'].filter(Boolean).join(' · ')
    }
    return next
  }

  next.coachingCues = [
    ...(next.coachingCues ?? []),
    'Probeer: moeilijker / makkelijker / korter / langer',
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
      opts.onProgress?.({ progress: 0.35, text: 'Slimme planning samenstellen…' })
      const plan = planSessionSync(ctx)
      opts.onProgress?.({ progress: 1, text: 'Klaar' })
      return plan
    },
    async adaptBlock(ctx, block, instruction, opts = {}) {
      opts.onProgress?.({ progress: 1, text: 'Aangepast' })
      return adaptBlockSync(ctx, block, instruction)
    },
    async explainBlock(ctx, block) {
      return block.whyThis
        || `Gekozen voor ${block.title} bij ${ctx.playerCount} spelers (${block.category}).`
    },
  }
}
