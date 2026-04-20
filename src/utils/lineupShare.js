/**
 * Lineup share encoding / decoding.
 *
 * Two payload types are supported, distinguished by the `_t` field:
 *
 *   _t: 'bundle'  — team + lineup bundled together
 *   _t: 'lineup'  — lineup only (player names embedded, no team data)
 *
 * Bundle payload:
 * {
 *   _t: 'bundle',
 *   tn: "FC Utrecht",                        // team name
 *   a:  "JO13",                              // age group
 *   sh: ["solid","#cc0000","#fff"],           // shirt [style, primary, secondary]
 *   pl: [["Jan",1,"GK"], ["Marco",5,"DEF"]], // players [name, number|null, position]
 *   n:  "Thuis vs Ajax",                     // lineup name
 *   f:  "4-3-3",                             // formationId (null = free mode)
 *   fl: true,                                // flipped
 *   s: [{ sid, pos, x, y, pn, num }],        // slots (pn/num absent = empty)
 *   b: [{ pn, num, pos }],                   // bench players
 * }
 *
 * Lineup-only payload:
 * {
 *   _t: 'lineup',
 *   tn: "FC Utrecht",                        // team name hint (for matching)
 *   a:  "JO13",                              // age group hint
 *   n:  "Thuis vs Ajax",
 *   f:  "4-3-3",
 *   fl: true,
 *   s: [{ sid, pos, x, y, pn, num }],
 *   b: [{ pn, num, pos }],
 * }
 */

function encode(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj))
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function decode(encoded) {
  const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  return JSON.parse(new TextDecoder().decode(bytes))
}

// ── Encode ───────────────────────────────────────────────────────────────────

/**
 * Encodes a full team+lineup bundle into a base64url string.
 * @param {object} team    - store team object
 * @param {object} lineup  - { name, formationId, flipped, slots, players (map id→player) }
 * @param {Array}  bench   - bench player objects
 */
export function encodeBundle(team, lineup, slotsWithPlayers, bench) {
  const payload = {
    _t: 'bundle',
    tn: team.name,
    a:  team.ageGroup,
    sh: team.shirt ? [team.shirt.style, team.shirt.primary, team.shirt.secondary] : null,
    pl: (team.players ?? []).map(p => [p.name, p.number ?? null, p.position]),
    n:  lineup.name,
    f:  lineup.formationId ?? null,
    fl: lineup.flipped ?? true,
    s:  slotsWithPlayers.map(s => {
      const base = { sid: s.slotId, pos: s.position, x: s.x, y: s.y }
      if (s.player) { base.pn = s.player.name; base.num = s.player.number ?? null }
      return base
    }),
    b:  bench.map(p => ({ pn: p.name, num: p.number ?? null, pos: p.position })),
  }
  return encode(payload)
}

/**
 * Encodes just the lineup (no full team roster) into a base64url string.
 */
export function encodeLineupOnly(team, lineup, slotsWithPlayers, bench) {
  const payload = {
    _t: 'lineup',
    tn: team.name,
    a:  team.ageGroup,
    n:  lineup.name,
    f:  lineup.formationId ?? null,
    fl: lineup.flipped ?? true,
    s:  slotsWithPlayers.map(s => {
      const base = { sid: s.slotId, pos: s.position, x: s.x, y: s.y }
      if (s.player) { base.pn = s.player.name; base.num = s.player.number ?? null }
      return base
    }),
    b:  bench.map(p => ({ pn: p.name, num: p.number ?? null, pos: p.position })),
  }
  return encode(payload)
}

// ── Decode ───────────────────────────────────────────────────────────────────

/**
 * Decodes a base64url share string.
 * Returns { type: 'bundle'|'lineup', ...fields } or null on failure.
 */
export function decodeSharePayload(encoded) {
  try {
    const d = decode(encoded)
    if (d._t === 'bundle') {
      return {
        type: 'bundle',
        teamName:   d.tn,
        ageGroup:   d.a,
        shirt:      d.sh ? { style: d.sh[0], primary: d.sh[1], secondary: d.sh[2] } : null,
        players:    (d.pl ?? []).map(p => ({ name: p[0], number: p[1] ?? null, position: p[2] })),
        lineupName: d.n,
        formationId: d.f ?? null,
        flipped:    d.fl ?? true,
        slots:      d.s ?? [],
        bench:      d.b ?? [],
      }
    }
    if (d._t === 'lineup') {
      return {
        type: 'lineup',
        teamName:   d.tn,
        ageGroup:   d.a,
        lineupName: d.n,
        formationId: d.f ?? null,
        flipped:    d.fl ?? true,
        slots:      d.s ?? [],
        bench:      d.b ?? [],
      }
    }
    return null
  } catch {
    return null
  }
}

/**
 * Given a decoded payload and a target team (with players), returns resolved slots
 * where each slot's player is matched by name+number from the team's roster.
 * Unmatched slots keep pn/num but have no playerId.
 */
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
