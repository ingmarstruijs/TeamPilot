import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { AGE_GROUPS } from '@/data/formations'

const STORAGE_KEY = 'teampilot_v1'

function defaultShirt(color = '#1a6b3c') {
  return { style: 'solid', primary: color, secondary: '#ffffff' }
}

function migrateTeam(team) {
  if (!team.shirt) {
    team.shirt = defaultShirt(team.color ?? '#1a6b3c')
  }
  // Keep color in sync with shirt.primary for backward compat
  team.color = team.shirt.primary
  return team
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.teams) data.teams = data.teams.map(migrateTeam)
    return data
  } catch {
    return null
  }
}

function defaultState() {
  return {
    teams: [
      {
        id: 'team-1',
        name: 'Mijn Team',
        ageGroup: 'JO11',
        color: '#1a6b3c',
        shirt: defaultShirt('#1a6b3c'),
        players: [],
      },
    ],
    activeTeamId: 'team-1',
    activeLineupId: null,
    lineups: [],
  }
}

export const useTeamStore = defineStore('team', () => {
  const saved = loadFromStorage() || defaultState()

  const teams = ref(saved.teams)
  const activeTeamId = ref(saved.activeTeamId)
  const activeLineupId = ref(saved.activeLineupId ?? null)
  const lineups = ref(saved.lineups)
  // ── Persist on every change ──────────────────────────────────────────────
  watch(
    [teams, activeTeamId, activeLineupId, lineups],
    () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          teams: teams.value,
          activeTeamId: activeTeamId.value,
          activeLineupId: activeLineupId.value,
          lineups: lineups.value,
        })
      )
    },
    { deep: true }
  )

  // ── Computed ─────────────────────────────────────────────────────────────
  const activeTeam = computed(() =>
    teams.value.find((t) => t.id === activeTeamId.value) ?? teams.value[0]
  )

  const teamLineups = computed(() =>
    lineups.value.filter((l) => l.teamId === activeTeamId.value)
  )

  const ageGroupConfig = computed(() =>
    AGE_GROUPS.find((g) => g.id === activeTeam.value?.ageGroup)
  )

  // ── Team actions ─────────────────────────────────────────────────────────
  function addTeam(name, ageGroup, color = '#1a6b3c') {
    const team = {
      id: `team-${Date.now()}`,
      name,
      ageGroup,
      color,
      shirt: defaultShirt(color),
      players: [],
    }
    teams.value.push(team)
    return team
  }

  function updateTeam(id, patch) {
    const t = teams.value.find((t) => t.id === id)
    if (!t) return
    Object.assign(t, patch)
    // Keep color in sync with shirt.primary
    if (patch.shirt) t.color = t.shirt.primary
  }

  function setActiveTeam(id) {
    activeTeamId.value = id
  }

  function setActiveLineup(id) {
    activeLineupId.value = id
  }

  // ── Player actions ────────────────────────────────────────────────────────
  function addPlayer({ name, number = null, position = 'MID', teamId }) {
    const team = teams.value.find((t) => t.id === (teamId ?? activeTeamId.value))
    if (!team) return
    const player = {
      id: `player-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      number,
      position,
    }
    team.players.push(player)
    return player
  }

  function updatePlayer(playerId, patch) {
    for (const team of teams.value) {
      const p = team.players.find((p) => p.id === playerId)
      if (p) { Object.assign(p, patch); return }
    }
  }

  function removePlayer(playerId) {
    for (const team of teams.value) {
      const idx = team.players.findIndex((p) => p.id === playerId)
      if (idx !== -1) { team.players.splice(idx, 1); return }
    }
  }

  // ── Lineup actions ────────────────────────────────────────────────────────
  /**
   * Save or update a lineup.
   * @param {object} lineup - { id?, teamId, name, formationId, slots, bench }
   *   slots: [{ slotId, playerId, x, y }]
   *   bench: [playerId]
   */
  function saveLineup(lineup) {
    if (lineup.id) {
      const idx = lineups.value.findIndex((l) => l.id === lineup.id)
      if (idx !== -1) {
        lineups.value[idx] = { ...lineups.value[idx], ...lineup, updatedAt: Date.now() }
        return lineups.value[idx]
      }
    }
    const newLineup = {
      ...lineup,
      id: `lineup-${Date.now()}`,
      teamId: lineup.teamId ?? activeTeamId.value,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    lineups.value.push(newLineup)
    return newLineup
  }

  function deleteLineup(id) {
    const idx = lineups.value.findIndex((l) => l.id === id)
    if (idx !== -1) lineups.value.splice(idx, 1)
    if (activeLineupId.value === id) activeLineupId.value = null
  }

  function getLineup(id) {
    return lineups.value.find((l) => l.id === id) ?? null
  }

  function deleteTeam(id) {
    if (teams.value.length <= 1) return
    // Clear activeLineupId if it belongs to the deleted team
    if (activeLineupId.value) {
      const lineup = lineups.value.find(l => l.id === activeLineupId.value)
      if (lineup?.teamId === id) activeLineupId.value = null
    }
    // Remove all lineups for this team
    lineups.value = lineups.value.filter(l => l.teamId !== id)
    // Switch active team if the deleted team is currently active
    if (activeTeamId.value === id) {
      const other = teams.value.find(t => t.id !== id)
      if (other) activeTeamId.value = other.id
    }
    const idx = teams.value.findIndex(t => t.id === id)
    if (idx !== -1) teams.value.splice(idx, 1)
  }

  function importTeam(data) {
    const newTeam = addTeam(data.name, data.ageGroup, data.shirt?.primary ?? '#1a6b3c')
    if (data.shirt) updateTeam(newTeam.id, { shirt: data.shirt })
    for (const p of (data.players ?? [])) {
      addPlayer({ name: p.name, number: p.number ?? null, position: p.position, teamId: newTeam.id })
    }
    return newTeam
  }

  function mergeTeam(targetTeamId, data) {
    const team = teams.value.find(t => t.id === targetTeamId)
    if (!team) return 0
    const existingNames = new Set(team.players.map(p => p.name.trim().toLowerCase()))
    let added = 0
    for (const p of (data.players ?? [])) {
      if (!existingNames.has(p.name.trim().toLowerCase())) {
        addPlayer({ name: p.name, number: p.number ?? null, position: p.position, teamId: targetTeamId })
        added++
      }
    }
    return added
  }

  return {
    teams,
    activeTeamId,
    activeLineupId,
    lineups,
    activeTeam,
    teamLineups,
    ageGroupConfig,
    addTeam,
    updateTeam,
    setActiveTeam,
    setActiveLineup,
    addPlayer,
    updatePlayer,
    removePlayer,
    saveLineup,
    deleteLineup,
    getLineup,
    deleteTeam,
    importTeam,
    mergeTeam,
  }
})
