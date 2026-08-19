/**
 * Training & recipe share encoding / decoding.
 *
 * Session payload (_t: 'training'):
 * { _t, tn, a, k, tt, d, pc, cw, b, ce? }
 *
 * Recipe payload (_t: 'recipe'):
 * { _t, n, th, tt, d, a, k, b, ce? }
 */

import { normalizeAgeGroup } from '@/data/formations'
import { decodeJson, encodeJson } from '@/utils/base64url'
import { buildHashShareUrl } from '@/utils/appShareUrl'
import { shareLink } from '@/utils/shareLink'
import { isCustomExercise, restoreCustomExercise, serializeCustomForShare } from './customExercises'

function collectCustomExercises(blocks) {
  const ce = {}
  for (const block of blocks) {
    const ex = block.exercise
    if (isCustomExercise(ex)) {
      ce[ex.id] = serializeCustomForShare(ex)
    }
  }
  return Object.keys(ce).length ? ce : undefined
}

function parseCustomExercises(ce, ageGroup) {
  if (!ce) return []
  const normalized = normalizeAgeGroup(ageGroup) || 'O11'
  return Object.entries(ce).map(([id, data]) =>
    restoreCustomExercise(id, data, normalized)
  )
}

function parseBlocks(b, customById) {
  return b.map(([id, durationMin]) => ({ exerciseId: id, durationMin }))
}

export function encodeTrainingSession({
  teamName,
  ageGroup,
  knvbClass,
  trainingType,
  durationMin,
  playerCount,
  cycleWeek,
  blocks,
}) {
  const payload = {
    _t: 'training',
    tn: teamName,
    a: ageGroup,
    k: knvbClass,
    tt: trainingType,
    d: durationMin,
    pc: playerCount,
    cw: cycleWeek,
    b: blocks.map(bl => [bl.exercise.id, bl.durationMin]),
  }
  const ce = collectCustomExercises(blocks)
  if (ce) payload.ce = ce
  return encodeJson(payload)
}

export function encodeRecipe({
  name,
  trainingType,
  durationMin,
  cycleTheme,
  ageGroup,
  knvbClass,
  blocks,
}) {
  const payload = {
    _t: 'recipe',
    n: name,
    th: cycleTheme ?? null,
    tt: trainingType,
    d: durationMin,
    a: ageGroup,
    k: knvbClass,
    b: blocks.map(bl => [bl.exercise.id, bl.durationMin]),
  }
  const ce = collectCustomExercises(blocks)
  if (ce) payload.ce = ce
  return encodeJson(payload)
}

function decodeSessionPayload(d) {
  const customById = d.ce ?? {}
  const customExercises = parseCustomExercises(customById, d.a)

  return {
    kind: 'session',
    teamName: d.tn ?? 'Training',
    ageGroup: normalizeAgeGroup(d.a) || 'O11',
    knvbClass: d.k ?? '5e',
    trainingType: d.tt ?? 'gemengd',
    durationMin: d.d ?? 60,
    playerCount: d.pc ?? 0,
    cycleWeek: d.cw ?? 1,
    blocks: parseBlocks(d.b, customById),
    customExercises,
  }
}

function decodeRecipePayload(d) {
  const customExercises = parseCustomExercises(d.ce, d.a)

  return {
    kind: 'recipe',
    name: d.n ?? 'Trainingsrecept',
    cycleTheme: d.th ?? null,
    trainingType: d.tt ?? 'gemengd',
    durationMin: d.d ?? 60,
    ageGroup: normalizeAgeGroup(d.a) || 'O11',
    knvbClass: d.k ?? '5e',
    blocks: parseBlocks(d.b),
    customExercises,
  }
}

export function decodeTrainingSession(encoded) {
  try {
    const d = decodeJson(encoded)
    if (d._t !== 'training' || !Array.isArray(d.b)) return null
    const { kind, ...rest } = decodeSessionPayload(d)
    return rest
  } catch {
    return null
  }
}

export function decodeRecipe(encoded) {
  try {
    const d = decodeJson(encoded)
    if (d._t !== 'recipe' || !Array.isArray(d.b)) return null
    const { kind, ...rest } = decodeRecipePayload(d)
    return rest
  } catch {
    return null
  }
}

export function decodeSharedTraining(encoded) {
  try {
    const d = decodeJson(encoded)
    if (!Array.isArray(d.b)) return null
    if (d._t === 'recipe') return decodeRecipePayload(d)
    if (d._t === 'training') return decodeSessionPayload(d)
    return null
  } catch {
    return null
  }
}

export function buildTrainingShareUrl(encoded) {
  return buildHashShareUrl('/training/view', { training: encoded })
}

export function buildRecipeShareUrl(encoded) {
  return buildTrainingShareUrl(encoded)
}

export function resolveSharedExercise(exerciseId, customExercises = []) {
  const custom = customExercises.find(e => e.id === exerciseId)
  if (custom) return custom
  return null
}

/** @deprecated Prefer shareLink from '@/utils/shareLink'. Kept for callers/tests. */
export function shareUrl(opts) {
  return shareLink(opts)
}
