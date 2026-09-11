import { t } from '@/i18n'

export function formationLabel(id) {
  return id || t('lineup.free')
}

function periodFormationSummary(mode, periods, fallbackFormationId) {
  const count = mode === 'quarters' ? 4 : 2
  const periodKey = mode === 'quarters' ? 'lineup.periodQuarter' : 'lineup.periodHalf'
  const snaps = Array.isArray(periods) ? periods : []
  return Array.from({ length: count }, (_, i) => (
    t('lineup.archivePeriodFormation', {
      period: t(periodKey, { n: i + 1 }),
      formation: formationLabel(snaps[i]?.formationId ?? fallbackFormationId),
    })
  )).join(' · ')
}

/**
 * One-line archive summary: player count + formation, or halves/quarters with
 * each period’s formation (in order, not de-duplicated).
 * @param {object} lu saved lineup
 * @param {object} [live] current editor overlay for the open lineup
 */
export function lineupArchiveMeta(lu, live = null) {
  const source = live ?? lu ?? {}
  const mode = source.periodMode
  if (mode === 'quarters' || mode === 'halves') {
    return t('lineup.archivePeriods', {
      mode: mode === 'quarters' ? t('lineup.archiveQuarters') : t('lineup.archiveHalves'),
      formations: periodFormationSummary(mode, source.periods, source.formationId),
    })
  }
  const slots = source.slots ?? []
  return t('lineupShare.switcherPlayers', {
    count: slots.filter(s => s.playerId).length,
    formation: formationLabel(source.formationId),
  })
}
