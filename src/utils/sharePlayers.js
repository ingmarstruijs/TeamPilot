/** Compact player rows in team/lineup share payloads. */

export function encodeSharePlayer(player) {
  const row = [player.name, player.number ?? null, player.position]
  const guest = Boolean(player.guest)
  const injured = Boolean(player.injured)
  const available = player.available !== false
  const foot = player.preferredFoot ?? null
  if (guest || injured || !available || foot) {
    row.push(guest ? 1 : 0, injured ? 1 : 0, available ? 1 : 0)
    if (foot) row.push(foot)
  }
  return row
}

export function decodeSharePlayer(row) {
  if (!Array.isArray(row) || typeof row[0] !== 'string') return null
  return {
    name: row[0],
    number: row[1] ?? null,
    position: row[2],
    guest: Boolean(row[3]),
    injured: Boolean(row[4]),
    available: row[5] !== 0 && row[5] !== false,
    preferredFoot: row[6] ?? null,
  }
}

export function encodeShareBenchPlayer(player) {
  const row = { pn: player.name, num: player.number ?? null, pos: player.position }
  if (player.guest) row.g = 1
  if (player.injured) row.inj = 1
  if (player.available === false) row.av = 0
  return row
}

export function decodeShareBenchPlayer(row) {
  if (!row || typeof row !== 'object') return null
  return {
    pn: row.pn,
    num: row.num ?? null,
    pos: row.pos,
    guest: Boolean(row.g),
    injured: Boolean(row.inj),
    available: row.av !== 0,
  }
}

export function encodeShareSlot(slot) {
  const base = {
    sid: slot.slotId ?? slot.sid,
    pos: slot.position ?? slot.pos,
    x: slot.x,
    y: slot.y,
  }
  const player = slot.player
  if (player) {
    base.pn = player.name
    base.num = player.number ?? null
    if (player.guest) base.g = 1
  } else if (slot.pn) {
    base.pn = slot.pn
    base.num = slot.num ?? null
    if (slot.g || slot.guest) base.g = 1
  }
  return base
}

export function decodeShareSlot(slot) {
  if (!slot || typeof slot !== 'object') return null
  const decoded = {
    sid: slot.sid,
    pos: slot.pos,
    x: slot.x,
    y: slot.y,
  }
  if (slot.pn) {
    decoded.pn = slot.pn
    decoded.num = slot.num ?? null
    if (slot.g) decoded.guest = true
  }
  return decoded
}
