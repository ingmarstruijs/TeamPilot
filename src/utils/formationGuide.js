import { locale } from '@/i18n'
import en from '@/i18n/en.js'
import nl from '@/i18n/nl.js'

const messages = { nl, en }

/**
 * @param {string|null|undefined} formationId
 * @returns {{
 *   id: string,
 *   label: string,
 *   summary: string,
 *   shape: string,
 *   strengths: string[],
 *   watchouts: string[],
 *   withBall: string,
 *   withoutBall: string,
 * }|null}
 */
export function getFormationGuide(formationId) {
  if (!formationId) return null
  const dict = messages[locale.value] ?? messages.nl
  const item = dict?.formationGuide?.items?.[formationId]
    ?? messages.nl?.formationGuide?.items?.[formationId]
  if (!item || typeof item !== 'object') return null
  return {
    id: formationId,
    label: formationId,
    summary: String(item.summary ?? ''),
    shape: String(item.shape ?? ''),
    strengths: Array.isArray(item.strengths) ? item.strengths.map(String) : [],
    watchouts: Array.isArray(item.watchouts) ? item.watchouts.map(String) : [],
    withBall: String(item.withBall ?? ''),
    withoutBall: String(item.withoutBall ?? ''),
  }
}

export function hasFormationGuide(formationId) {
  return Boolean(getFormationGuide(formationId))
}
