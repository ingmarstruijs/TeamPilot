/**
 * Age groups and their configuration (KNVB "O" naming).
 * Easily extensible by adding entries to the array.
 */
export const AGE_GROUPS = [
  { id: 'O8', label: 'O8',      players: 6,  fieldSize: 'sm' },
  { id: 'O9', label: 'O9',      players: 6,  fieldSize: 'sm' },
  { id: 'O10', label: 'O10',     players: 6,  fieldSize: 'sm' },
  { id: 'O11', label: 'O11',     players: 8,  fieldSize: 'md' },
  { id: 'O12', label: 'O12',     players: 8,  fieldSize: 'md' },
  { id: 'O13', label: 'O13',     players: 11, fieldSize: 'lg' },
  { id: 'Senior', label: 'Senioren', players: 11, fieldSize: 'lg' },
]

/** Legacy JO* / zero-padded ids → current KNVB O* ids. */
const AGE_GROUP_ALIASES = {
  JO08: 'O8',
  JO8: 'O8',
  O08: 'O8',
  JO09: 'O9',
  JO9: 'O9',
  O09: 'O9',
  JO10: 'O10',
  JO11: 'O11',
  JO12: 'O12',
  JO13: 'O13',
}

/** Normalize stored/shared age-group ids to the current AGE_GROUPS ids. */
export function normalizeAgeGroup(ageGroup) {
  if (ageGroup == null || ageGroup === '') return ageGroup
  if (AGE_GROUPS.some(g => g.id === ageGroup)) return ageGroup
  return AGE_GROUP_ALIASES[ageGroup] ?? ageGroup
}

/** Display label for an age-group id (supports legacy JO* values). */
export function ageGroupLabel(ageGroup) {
  const id = normalizeAgeGroup(ageGroup)
  return AGE_GROUPS.find(g => g.id === id)?.label ?? id ?? ''
}

export const POSITIONS = [
  { id: 'GK',  label: 'Keeper' },
  { id: 'DEF', label: 'Verdediger' },
  { id: 'MID', label: 'Middenvelder' },
  { id: 'ATT', label: 'Aanvaller' },
  { id: 'WB',  label: 'Wingback' },
]

/**
 * Standard vertical lines for formation slots (storage coords, 6.25% grid).
 * Low y = own goal, high y = toward opponent — equal spacing between lines.
 */
const _GK = 6.25
const _STEP = 18.75 // 3 grid cells between each line

export const FORMATION_LINE_STEP = _STEP

export const FORMATION_Y = {
  GK:  _GK,
  DEF: _GK + _STEP,       // 25
  DM:  _GK + 2 * _STEP,   // 43.75
  MID: _GK + 2 * _STEP,   // 43.75
  AM:  _GK + 3 * _STEP,   // 62.5
  ATT: _GK + 3 * _STEP,   // 62.5 — front line in 4-tier formations
  ST:  _GK + 4 * _STEP,   // 81.25 — extra tier (e.g. 4-2-3-1 striker)
}

const Y = FORMATION_Y

/**
 * Formations per age group.
 * y=0 toward opponent goal in storage; GK sits on the low-y (own) side.
 */
// 6vs6 formations (GK + 5 outfield = 6 total) — shared by O8, O9, O10
const FORMATIONS_6V6 = [
  {
    id: '2-2-1',
    label: '2-2-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 25,   y: Y.DEF },
      { id: 's2', position: 'DEF', x: 75,   y: Y.DEF },
      { id: 's3', position: 'MID', x: 25,   y: Y.MID },
      { id: 's4', position: 'MID', x: 75,   y: Y.MID },
      { id: 's5', position: 'ATT', x: 50,   y: Y.ATT },
    ],
  },
  {
    id: '2-1-2',
    label: '2-1-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 25,   y: Y.DEF },
      { id: 's2', position: 'DEF', x: 75,   y: Y.DEF },
      { id: 's3', position: 'MID', x: 50,   y: Y.MID },
      { id: 's4', position: 'ATT', x: 25,   y: Y.ATT },
      { id: 's5', position: 'ATT', x: 75,   y: Y.ATT },
    ],
  },
  {
    id: '1-3-1',
    label: '1-3-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 50,   y: Y.DEF },
      { id: 's2', position: 'MID', x: 12.5, y: Y.MID },
      { id: 's3', position: 'MID', x: 50,   y: Y.MID },
      { id: 's4', position: 'MID', x: 87.5, y: Y.MID },
      { id: 's5', position: 'ATT', x: 50,   y: Y.ATT },
    ],
  },
]

// 8vs8 formations (GK + 7 outfield = 8 total) — shared by O11, O12
const FORMATIONS_8V8 = [
  {
    id: '3-2-2',
    label: '3-2-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2', position: 'DEF', x: 50,   y: Y.DEF },
      { id: 's3', position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's4', position: 'MID', x: 25,   y: Y.MID },
      { id: 's5', position: 'MID', x: 75,   y: Y.MID },
      { id: 's6', position: 'ATT', x: 25,   y: Y.ATT },
      { id: 's7', position: 'ATT', x: 75,   y: Y.ATT },
    ],
  },
  {
    id: '2-3-2',
    label: '2-3-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 25,   y: Y.DEF },
      { id: 's2', position: 'DEF', x: 75,   y: Y.DEF },
      { id: 's3', position: 'MID', x: 12.5, y: Y.MID },
      { id: 's4', position: 'MID', x: 50,   y: Y.MID },
      { id: 's5', position: 'MID', x: 87.5, y: Y.MID },
      { id: 's6', position: 'ATT', x: 25,   y: Y.ATT },
      { id: 's7', position: 'ATT', x: 75,   y: Y.ATT },
    ],
  },
  {
    id: '3-3-1',
    label: '3-3-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1', position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2', position: 'DEF', x: 50,   y: Y.DEF },
      { id: 's3', position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's4', position: 'MID', x: 12.5, y: Y.MID },
      { id: 's5', position: 'MID', x: 50,   y: Y.MID },
      { id: 's6', position: 'MID', x: 87.5, y: Y.MID },
      { id: 's7', position: 'ATT', x: 50,   y: Y.ATT },
    ],
  },
]

const FORMATIONS_11V11 = [
  {
    id: '4-3-3',
    label: '4-3-3',
    slots: [
      { id: 's0',  position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1',  position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2',  position: 'DEF', x: 37.5, y: Y.DEF },
      { id: 's3',  position: 'DEF', x: 62.5, y: Y.DEF },
      { id: 's4',  position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's5',  position: 'MID', x: 25,   y: Y.MID },
      { id: 's6',  position: 'MID', x: 50,   y: Y.MID },
      { id: 's7',  position: 'MID', x: 75,   y: Y.MID },
      { id: 's8',  position: 'ATT', x: 25,   y: Y.ATT },
      { id: 's9',  position: 'ATT', x: 50,   y: Y.ATT },
      { id: 's10', position: 'ATT', x: 75,   y: Y.ATT },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    slots: [
      { id: 's0',  position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1',  position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2',  position: 'DEF', x: 37.5, y: Y.DEF },
      { id: 's3',  position: 'DEF', x: 62.5, y: Y.DEF },
      { id: 's4',  position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's5',  position: 'MID', x: 12.5, y: Y.MID },
      { id: 's6',  position: 'MID', x: 37.5, y: Y.MID },
      { id: 's7',  position: 'MID', x: 62.5, y: Y.MID },
      { id: 's8',  position: 'MID', x: 87.5, y: Y.MID },
      { id: 's9',  position: 'ATT', x: 37.5, y: Y.ATT },
      { id: 's10', position: 'ATT', x: 62.5, y: Y.ATT },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: [
      { id: 's0',  position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1',  position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2',  position: 'DEF', x: 37.5, y: Y.DEF },
      { id: 's3',  position: 'DEF', x: 62.5, y: Y.DEF },
      { id: 's4',  position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's5',  position: 'MID', x: 37.5, y: Y.DM  },
      { id: 's6',  position: 'MID', x: 62.5, y: Y.DM  },
      { id: 's7',  position: 'ATT', x: 12.5, y: Y.AM  },
      { id: 's8',  position: 'MID', x: 50,   y: Y.AM  },
      { id: 's9',  position: 'ATT', x: 87.5, y: Y.AM  },
      { id: 's10', position: 'ATT', x: 50,   y: Y.ST  },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    slots: [
      { id: 's0',  position: 'GK',  x: 50,   y: Y.GK  },
      { id: 's1',  position: 'DEF', x: 12.5, y: Y.DEF },
      { id: 's2',  position: 'DEF', x: 50,   y: Y.DEF },
      { id: 's3',  position: 'DEF', x: 87.5, y: Y.DEF },
      { id: 's4',  position: 'WB',  x: 12.5, y: Y.MID },
      { id: 's5',  position: 'MID', x: 25,   y: Y.MID },
      { id: 's6',  position: 'MID', x: 50,   y: Y.MID },
      { id: 's7',  position: 'MID', x: 75,   y: Y.MID },
      { id: 's8',  position: 'WB',  x: 87.5, y: Y.MID },
      { id: 's9',  position: 'ATT', x: 37.5, y: Y.ATT },
      { id: 's10', position: 'ATT', x: 62.5, y: Y.ATT },
    ],
  },
]

export const FORMATIONS = {
  O8: FORMATIONS_6V6,
  O9: FORMATIONS_6V6,
  O10: FORMATIONS_6V6,
  O11: FORMATIONS_8V8,
  O12: FORMATIONS_8V8,
  O13: FORMATIONS_11V11,
  Senior: FORMATIONS_11V11,
}
