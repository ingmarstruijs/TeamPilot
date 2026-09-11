import { ageGroupLabel } from '@/data/formations'
import { getKnvbClass } from '@/data/knvbClasses'

function slotPlayer(slot) {
  if (!slot?.pn) return null
  return {
    name: slot.pn,
    number: slot.num ?? null,
    guest: Boolean(slot.guest),
  }
}

function uniquePlayersFromLineup(payload) {
  const byKey = new Map()
  function add(player) {
    if (!player?.name) return
    const key = `${player.name.trim().toLowerCase()}|${player.number ?? ''}`
    if (!byKey.has(key)) byKey.set(key, player)
  }
  for (const p of payload.players ?? []) add(p)
  for (const slot of payload.slots ?? []) add(slotPlayer(slot))
  for (const period of payload.periods ?? []) {
    for (const slot of period.slots ?? []) add(slotPlayer(slot))
  }
  for (const b of payload.bench ?? []) {
    add({
      name: b.pn,
      number: b.num ?? null,
      position: b.pos,
      guest: Boolean(b.guest),
      injured: Boolean(b.injured),
      available: b.available !== false,
    })
  }
  return [...byKey.values()]
}

function periodFromSlots(formationId, slots) {
  const filled = (slots ?? []).map(slotPlayer).filter(Boolean)
  return {
    formationId: formationId ?? null,
    filled: filled.length,
    total: (slots ?? []).length,
    players: filled,
  }
}

export function summaryFromTeamShare(data) {
  return {
    teamName: data.name,
    ageGroup: data.ageGroup,
    ageGroupLabel: ageGroupLabel(data.ageGroup),
    knvbClass: data.knvbClass ?? null,
    knvbClassLabel: data.knvbClass ? getKnvbClass(data.knvbClass).label : null,
    shirt: data.shirt,
    players: data.players ?? [],
    lineup: null,
  }
}

export function summaryFromLineupShare(payload) {
  const players = payload.players?.length
    ? payload.players
    : uniquePlayersFromLineup(payload)
  const periods = payload.periodMode && payload.periods?.length
    ? payload.periods.map(period => periodFromSlots(period.formationId, period.slots))
    : [periodFromSlots(payload.formationId, payload.slots)]
  const bench = (payload.bench ?? []).map(b => ({
    name: b.pn,
    number: b.num ?? null,
    position: b.pos,
    guest: Boolean(b.guest),
    injured: Boolean(b.injured),
  }))
  return {
    teamName: payload.teamName,
    ageGroup: payload.ageGroup,
    ageGroupLabel: ageGroupLabel(payload.ageGroup),
    knvbClass: payload.knvbClass ?? null,
    knvbClassLabel: payload.knvbClass ? getKnvbClass(payload.knvbClass).label : null,
    shirt: payload.shirt,
    players,
    lineup: {
      name: payload.lineupName || '',
      periodMode: payload.periodMode,
      periods,
      bench,
    },
  }
}
