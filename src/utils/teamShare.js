/**
 * Team roster share encode / decode (`#/import?team=`).
 * Legacy links (`#/?import=`) are still accepted by the importer.
 */

import { normalizeAgeGroup } from '@/data/formations'
import { buildHashShareUrl } from '@/utils/appShareUrl'
import { decodeJson, encodeJson } from '@/utils/base64url'
import { decodeSharePlayer, encodeSharePlayer } from '@/utils/sharePlayers'

export function encodeTeamShare(team) {
  const payload = {
    n: team.name,
    a: team.ageGroup,
    sh: team.shirt ? [team.shirt.style, team.shirt.primary, team.shirt.secondary] : null,
    p: (team.players ?? []).map(encodeSharePlayer),
  }
  if (team.knvbClass) payload.k = team.knvbClass
  return encodeJson(payload)
}

/**
 * Decode a team import payload.
 * Returns null for malformed / incomplete data.
 */
export function decodeTeamShare(encoded) {
  try {
    const d = decodeJson(encoded)
    if (!d || typeof d !== 'object' || Array.isArray(d)) return null
    if (typeof d.n !== 'string' || !d.n.trim()) return null
    if (d.p != null && !Array.isArray(d.p)) return null

    return {
      name: d.n.trim(),
      ageGroup: normalizeAgeGroup(d.a) || 'O11',
      knvbClass: d.k || null,
      shirt: d.sh ? { style: d.sh[0], primary: d.sh[1], secondary: d.sh[2] } : null,
      players: (d.p ?? []).map(decodeSharePlayer).filter(Boolean),
    }
  } catch {
    return null
  }
}

export function buildTeamShareUrl(encoded) {
  return buildHashShareUrl('/import', { team: encoded })
}
