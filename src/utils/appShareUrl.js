/**
 * Hash-based share URLs and incoming-link recovery.
 *
 * Share links use a real path in the hash (`#/import?team=…`, `#/view?lineup=…`)
 * so messengers/browsers do not “fix” `#/?query` into `?query#/`.
 */

export function firstQueryValue(value) {
  if (value == null || value === '') return null
  const v = Array.isArray(value) ? value[0] : value
  if (v == null || v === '') return null
  return String(v)
}

export function readShareParam(route, name) {
  const fromRoute = firstQueryValue(route?.query?.[name])
  if (fromRoute) return fromRoute
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(name)
}

/**
 * Messengers sometimes move `?param=` out of the hash onto location.search.
 * Strip that so a refresh does not re-trigger import.
 */
export function stripLocationSearch() {
  if (typeof window === 'undefined' || !window.location.search) return
  const next = `${window.location.pathname}${window.location.hash}`
  window.history.replaceState(window.history.state, '', next)
}

export function buildHashShareUrl(path, query) {
  const origin = window.location.origin
  const base = window.location.pathname
  const qs = new URLSearchParams(
    Object.entries(query).filter(([, v]) => v != null && v !== ''),
  ).toString()
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${origin}${base}#${normalizedPath}${qs ? `?${qs}` : ''}`
}

/**
 * Detect an incoming share payload from the hash route or location.search.
 * Team is checked first so a combined URL still opens the team import dialog.
 */
export function resolveIncomingShare(route) {
  const team = readShareParam(route, 'team') || readShareParam(route, 'import')
  if (team) return { kind: 'team', encoded: team }

  const lineup = readShareParam(route, 'lineup')
  if (lineup) return { kind: 'lineup', encoded: lineup }

  const training = readShareParam(route, 'training') || readShareParam(route, 'recipe')
  if (training) return { kind: 'training', encoded: training }

  return null
}
