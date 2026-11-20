/**
 * Lazy load heavy Rinus SVG/rules maps until exercise detail needs them.
 * Meta + links stay eager (library browse / titles / filters).
 */

/** @type {typeof import('@/data/rinusSvgMap')|null} */
let svgMod = null
/** @type {typeof import('@/data/rinusRulesMap')|null} */
let rulesMod = null
/** @type {Promise<void>|null} */
let loadPromise = null

/**
 * @returns {boolean}
 */
export function areRinusDetailMapsLoaded() {
  return Boolean(svgMod && rulesMod)
}

/**
 * @returns {Promise<void>}
 */
export function ensureRinusDetailMaps() {
  if (svgMod && rulesMod) return Promise.resolve()
  if (loadPromise) return loadPromise
  loadPromise = Promise.all([
    import('@/data/rinusSvgMap.js'),
    import('@/data/rinusRulesMap.js'),
  ]).then(([svg, rules]) => {
    svgMod = svg
    rulesMod = rules
  }).finally(() => {
    // keep resolved promise for subsequent callers
  })
  return loadPromise
}

/**
 * @param {string} exerciseId
 * @param {string|null|undefined} rinusId
 * @returns {string|null}
 */
export function lookupRinusSvgUrl(exerciseId, rinusId) {
  if (!svgMod) return null
  if (exerciseId && svgMod.RINUS_SVG_MAP?.[exerciseId]) {
    return svgMod.RINUS_SVG_MAP[exerciseId]
  }
  if (rinusId && svgMod.RINUS_SVG_BY_RINUS_ID?.[String(rinusId)]) {
    return svgMod.RINUS_SVG_BY_RINUS_ID[String(rinusId)]
  }
  return null
}

/**
 * @param {string} exerciseId
 * @param {string|null|undefined} rinusId
 * @returns {string[]}
 */
export function lookupRinusRules(exerciseId, rinusId) {
  if (!rulesMod) return []
  if (exerciseId && rulesMod.RINUS_RULES_MAP?.[exerciseId]?.length) {
    return rulesMod.RINUS_RULES_MAP[exerciseId]
  }
  if (rinusId && rulesMod.RINUS_RULES_BY_RINUS_ID?.[String(rinusId)]?.length) {
    return rulesMod.RINUS_RULES_BY_RINUS_ID[String(rinusId)]
  }
  return []
}

/** Test helper */
export function resetRinusDetailMapsForTests() {
  svgMod = null
  rulesMod = null
  loadPromise = null
}
