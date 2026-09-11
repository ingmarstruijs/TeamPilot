/**
 * Lineup share encoding / decoding.
 *
 * Two payload types are supported, distinguished by the `_t` field:
 *
 *   _t: 'bundle'  — team + lineup bundled together
 *   _t: 'lineup'  — lineup only (player names embedded, no team data)
 */

import { normalizeAgeGroup } from '@/data/formations'
import { buildHashShareUrl } from '@/utils/appShareUrl'
import { decodeJson, encodeJson } from '@/utils/base64url'
import {
  decodeShareBenchPlayer,
  decodeSharePlayer,
  decodeShareSlot,
  encodeShareBenchPlayer,
  encodeSharePlayer,
  encodeShareSlot,
} from '@/utils/sharePlayers'

function encodePeriods(lineup) {
  if (lineup?.periodMode !== 'quarters' && lineup?.periodMode !== 'halves') return null
  return (lineup.periods ?? []).map(period => ({
    f: period.formationId ?? null,
    s: (period.slots ?? []).map(encodeShareSlot),
  }))
}

function decodePeriods(raw, fallbackSlots, fallbackFormation) {
  if (!Array.isArray(raw) || !raw.length) {
    return [{ formationId: fallbackFormation ?? null, slots: fallbackSlots }]
  }
  return raw.map(period => ({
    formationId: period?.f ?? null,
    slots: (period?.s ?? []).map(decodeShareSlot).filter(Boolean),
  }))
}

function encodeLineupFields(lineup, slotsWithPlayers, bench) {
  const slots = slotsWithPlayers.map(encodeShareSlot)
  const fields = {
    n: lineup.name,
    f: lineup.formationId ?? null,
    fl: lineup.flipped ?? true,
    s: slots,
    b: bench.map(encodeShareBenchPlayer),
  }
  const periods = encodePeriods(lineup)
  if (periods) {
    fields.pm = lineup.periodMode
    fields.ap = lineup.activePeriod ?? 0
    fields.ps = periods
  }
  return fields
}

export function encodeBundle(team, lineup, slotsWithPlayers, bench) {
  const payload = {
    _t: 'bundle',
    tn: team.name,
    a: team.ageGroup,
    sh: team.shirt ? [team.shirt.style, team.shirt.primary, team.shirt.secondary] : null,
    pl: (team.players ?? []).map(encodeSharePlayer),
    ...encodeLineupFields(lineup, slotsWithPlayers, bench),
  }
  if (team.knvbClass) payload.k = team.knvbClass
  return encodeJson(payload)
}

export function encodeLineupOnly(team, lineup, slotsWithPlayers, bench) {
  return encodeJson({
    _t: 'lineup',
    tn: team.name,
    a: team.ageGroup,
    ...encodeLineupFields(lineup, slotsWithPlayers, bench),
  })
}

export function decodeSharePayload(encoded) {
  try {
    const d = decodeJson(encoded)
    const slots = (d.s ?? []).map(decodeShareSlot).filter(Boolean)
    const bench = (d.b ?? []).map(decodeShareBenchPlayer).filter(Boolean)
    const formationId = d.f ?? null
    const periodMode = d.pm === 'quarters' || d.pm === 'halves' ? d.pm : null
    const periods = periodMode
      ? decodePeriods(d.ps, slots, formationId)
      : null

    if (d._t === 'bundle') {
      return {
        type: 'bundle',
        teamName: d.tn,
        ageGroup: normalizeAgeGroup(d.a),
        knvbClass: d.k || null,
        shirt: d.sh ? { style: d.sh[0], primary: d.sh[1], secondary: d.sh[2] } : null,
        players: (d.pl ?? []).map(decodeSharePlayer).filter(Boolean),
        lineupName: d.n,
        formationId,
        flipped: d.fl ?? true,
        slots,
        bench,
        periodMode,
        activePeriod: d.ap ?? 0,
        periods,
      }
    }
    if (d._t === 'lineup') {
      return {
        type: 'lineup',
        teamName: d.tn,
        ageGroup: normalizeAgeGroup(d.a),
        lineupName: d.n,
        formationId,
        flipped: d.fl ?? true,
        slots,
        bench,
        periodMode,
        activePeriod: d.ap ?? 0,
        periods,
      }
    }
    return null
  } catch {
    return null
  }
}

export function resolveSlotsForTeam(slots, teamPlayers) {
  return slots.map(s => {
    const slot = { slotId: s.sid, position: s.pos, x: s.x, y: s.y, playerId: null }
    if (s.pn) {
      const match = teamPlayers.find(p =>
        p.name.trim().toLowerCase() === s.pn.trim().toLowerCase() &&
        (s.num === null || s.num === undefined || p.number === s.num)
      ) ?? teamPlayers.find(p =>
        p.name.trim().toLowerCase() === s.pn.trim().toLowerCase()
      )
      if (match) slot.playerId = match.id
    }
    return slot
  })
}

export function buildLineupShareUrl(encoded) {
  return buildHashShareUrl('/view', { lineup: encoded })
}
