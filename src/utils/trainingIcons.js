/** Material Symbols per weekthema (4-wekencyclus). */
export const CYCLE_THEME_ICONS = {
  techniek: 'sports_soccer',
  passing: 'compare_arrows',
  tactiek: 'strategy',
  conditie: 'directions_run',
}

/** Material Symbols per trainingstype (sessie-instelling). */
export const TRAINING_TYPE_ICONS = {
  techniek: 'sports_soccer',
  passing: 'compare_arrows',
  tactiek: 'strategy',
  conditie: 'directions_run',
  gemengd: 'shuffle',
  partij: 'stadium',
}

export function getCycleThemeIcon(theme) {
  if (!theme) return 'stadium'
  return CYCLE_THEME_ICONS[theme] ?? 'stadium'
}

export function getTrainingTypeIcon(type) {
  if (!type) return 'stadium'
  return TRAINING_TYPE_ICONS[type] ?? 'stadium'
}
