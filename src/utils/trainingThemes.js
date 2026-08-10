/**
 * Shared vocabulary for week themes (4-week cycle) and overlapping training types.
 * Same id + Dutch label wherever both surfaces talk about the same idea.
 */

export const CYCLE_THEMES = ['techniek', 'passing', 'tactiek', 'conditie']

export const CYCLE_THEME_LABELS = {
  techniek: 'Techniek',
  passing: 'Passing',
  tactiek: 'Tactiek',
  conditie: 'Conditie',
}

/**
 * @param {number} week 1–4 (or any int; wraps)
 * @returns {string}
 */
export function getCycleTheme(week) {
  return CYCLE_THEMES[((Number(week) || 1) - 1) % CYCLE_THEMES.length]
}

/**
 * @param {string|number} themeOrWeek
 * @returns {string}
 */
export function getCycleThemeLabel(themeOrWeek) {
  const theme = typeof themeOrWeek === 'number' ? getCycleTheme(themeOrWeek) : themeOrWeek
  return CYCLE_THEME_LABELS[theme] ?? theme
}

/**
 * Map cycle theme → default training type (1:1 for cycle themes).
 * @param {string} theme
 * @returns {string}
 */
export function trainingTypeForCycleTheme(theme) {
  if (CYCLE_THEMES.includes(theme)) return theme
  return 'gemengd'
}
