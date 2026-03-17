/**
 * Age groups and their configuration.
 * Easily extensible by adding entries to the array.
 */
export const AGE_GROUPS = [
  { id: 'JO08', label: 'JO8',      players: 6,  fieldSize: 'sm' },
  { id: 'JO09', label: 'JO9',      players: 6,  fieldSize: 'sm' },
  { id: 'JO10', label: 'JO10',     players: 6,  fieldSize: 'sm' },
  { id: 'JO11', label: 'JO11',     players: 8,  fieldSize: 'md' },
  { id: 'JO12', label: 'JO12',     players: 8,  fieldSize: 'md' },
  { id: 'JO13', label: 'JO13',     players: 11, fieldSize: 'lg' },
  { id: 'Senior', label: 'Senioren', players: 11, fieldSize: 'lg' },
]

export const POSITIONS = [
  { id: 'GK',  label: 'Keeper' },
  { id: 'DEF', label: 'Verdediger' },
  { id: 'MID', label: 'Middenvelder' },
  { id: 'ATT', label: 'Aanvaller' },
  { id: 'WB',  label: 'Wingback' },
]

/**
 * Formations per age group.
 * Positions use normalised coordinates: x (0-100 left→right), y (0-100 top→bottom).
 * y=0 = own goal, y=100 = opponent goal.
 * GK is always placed at y≈5.
 */
// 6vs6 formations (GK + 5 outfield = 6 total) — shared by JO8, JO9, JO10
const FORMATIONS_6V6 = [
  {
    id: '2-2-1',
    label: '2-2-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 30, y: 28 },
      { id: 's2', position: 'DEF', x: 70, y: 28 },
      { id: 's3', position: 'MID', x: 30, y: 54 },
      { id: 's4', position: 'MID', x: 70, y: 54 },
      { id: 's5', position: 'ATT', x: 50, y: 76 },
    ],
  },
  {
    id: '2-1-2',
    label: '2-1-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 30, y: 28 },
      { id: 's2', position: 'DEF', x: 70, y: 28 },
      { id: 's3', position: 'MID', x: 50, y: 52 },
      { id: 's4', position: 'ATT', x: 30, y: 76 },
      { id: 's5', position: 'ATT', x: 70, y: 76 },
    ],
  },
  {
    id: '1-3-1',
    label: '1-3-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 50, y: 28 },
      { id: 's2', position: 'MID', x: 15, y: 52 },
      { id: 's3', position: 'MID', x: 50, y: 50 },
      { id: 's4', position: 'MID', x: 85, y: 52 },
      { id: 's5', position: 'ATT', x: 50, y: 76 },
    ],
  },
]

// 8vs8 formations (GK + 7 outfield = 8 total) — shared by JO11, JO12
const FORMATIONS_8V8 = [
  {
    id: '3-2-2',
    label: '3-2-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 20, y: 26 },
      { id: 's2', position: 'DEF', x: 50, y: 26 },
      { id: 's3', position: 'DEF', x: 80, y: 26 },
      { id: 's4', position: 'MID', x: 30, y: 52 },
      { id: 's5', position: 'MID', x: 70, y: 52 },
      { id: 's6', position: 'ATT', x: 30, y: 76 },
      { id: 's7', position: 'ATT', x: 70, y: 76 },
    ],
  },
  {
    id: '2-3-2',
    label: '2-3-2',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 30, y: 26 },
      { id: 's2', position: 'DEF', x: 70, y: 26 },
      { id: 's3', position: 'MID', x: 15, y: 52 },
      { id: 's4', position: 'MID', x: 50, y: 50 },
      { id: 's5', position: 'MID', x: 85, y: 52 },
      { id: 's6', position: 'ATT', x: 30, y: 76 },
      { id: 's7', position: 'ATT', x: 70, y: 76 },
    ],
  },
  {
    id: '3-3-1',
    label: '3-3-1',
    slots: [
      { id: 's0', position: 'GK',  x: 50, y: 6  },
      { id: 's1', position: 'DEF', x: 20, y: 26 },
      { id: 's2', position: 'DEF', x: 50, y: 26 },
      { id: 's3', position: 'DEF', x: 80, y: 26 },
      { id: 's4', position: 'MID', x: 20, y: 52 },
      { id: 's5', position: 'MID', x: 50, y: 50 },
      { id: 's6', position: 'MID', x: 80, y: 52 },
      { id: 's7', position: 'ATT', x: 50, y: 76 },
    ],
  },
]

export const FORMATIONS = {
  JO08: FORMATIONS_6V6,
  JO09: FORMATIONS_6V6,
  JO10: FORMATIONS_6V6,
  JO11: FORMATIONS_8V8,
  JO12: FORMATIONS_8V8,

  JO13: [
    {
      id: '4-3-3',
      label: '4-3-3',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 15, y: 23 },
        { id: 's2',  position: 'DEF', x: 37, y: 23 },
        { id: 's3',  position: 'DEF', x: 63, y: 23 },
        { id: 's4',  position: 'DEF', x: 85, y: 23 },
        { id: 's5',  position: 'MID', x: 20, y: 50 },
        { id: 's6',  position: 'MID', x: 50, y: 48 },
        { id: 's7',  position: 'MID', x: 80, y: 50 },
        { id: 's8',  position: 'ATT', x: 20, y: 76 },
        { id: 's9',  position: 'ATT', x: 50, y: 78 },
        { id: 's10', position: 'ATT', x: 80, y: 76 },
      ],
    },
    {
      id: '4-4-2',
      label: '4-4-2',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 15, y: 23 },
        { id: 's2',  position: 'DEF', x: 37, y: 23 },
        { id: 's3',  position: 'DEF', x: 63, y: 23 },
        { id: 's4',  position: 'DEF', x: 85, y: 23 },
        { id: 's5',  position: 'MID', x: 15, y: 50 },
        { id: 's6',  position: 'MID', x: 37, y: 50 },
        { id: 's7',  position: 'MID', x: 63, y: 50 },
        { id: 's8',  position: 'MID', x: 85, y: 50 },
        { id: 's9',  position: 'ATT', x: 35, y: 76 },
        { id: 's10', position: 'ATT', x: 65, y: 76 },
      ],
    },
    {
      id: '3-5-2',
      label: '3-5-2',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 20, y: 23 },
        { id: 's2',  position: 'DEF', x: 50, y: 23 },
        { id: 's3',  position: 'DEF', x: 80, y: 23 },
        { id: 's4',  position: 'WB',  x: 10, y: 50 },
        { id: 's5',  position: 'MID', x: 30, y: 48 },
        { id: 's6',  position: 'MID', x: 50, y: 46 },
        { id: 's7',  position: 'MID', x: 70, y: 48 },
        { id: 's8',  position: 'WB',  x: 90, y: 50 },
        { id: 's9',  position: 'ATT', x: 35, y: 76 },
        { id: 's10', position: 'ATT', x: 65, y: 76 },
      ],
    },
  ],

  Senior: [
    {
      id: '4-3-3',
      label: '4-3-3',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 15, y: 23 },
        { id: 's2',  position: 'DEF', x: 37, y: 23 },
        { id: 's3',  position: 'DEF', x: 63, y: 23 },
        { id: 's4',  position: 'DEF', x: 85, y: 23 },
        { id: 's5',  position: 'MID', x: 20, y: 50 },
        { id: 's6',  position: 'MID', x: 50, y: 48 },
        { id: 's7',  position: 'MID', x: 80, y: 50 },
        { id: 's8',  position: 'ATT', x: 20, y: 76 },
        { id: 's9',  position: 'ATT', x: 50, y: 78 },
        { id: 's10', position: 'ATT', x: 80, y: 76 },
      ],
    },
    {
      id: '4-4-2',
      label: '4-4-2',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 15, y: 23 },
        { id: 's2',  position: 'DEF', x: 37, y: 23 },
        { id: 's3',  position: 'DEF', x: 63, y: 23 },
        { id: 's4',  position: 'DEF', x: 85, y: 23 },
        { id: 's5',  position: 'MID', x: 15, y: 50 },
        { id: 's6',  position: 'MID', x: 37, y: 50 },
        { id: 's7',  position: 'MID', x: 63, y: 50 },
        { id: 's8',  position: 'MID', x: 85, y: 50 },
        { id: 's9',  position: 'ATT', x: 35, y: 76 },
        { id: 's10', position: 'ATT', x: 65, y: 76 },
      ],
    },
    {
      id: '4-2-3-1',
      label: '4-2-3-1',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 15, y: 22 },
        { id: 's2',  position: 'DEF', x: 37, y: 22 },
        { id: 's3',  position: 'DEF', x: 63, y: 22 },
        { id: 's4',  position: 'DEF', x: 85, y: 22 },
        { id: 's5',  position: 'MID', x: 35, y: 42 },
        { id: 's6',  position: 'MID', x: 65, y: 42 },
        { id: 's7',  position: 'ATT', x: 15, y: 62 },
        { id: 's8',  position: 'MID', x: 50, y: 60 },
        { id: 's9',  position: 'ATT', x: 85, y: 62 },
        { id: 's10', position: 'ATT', x: 50, y: 78 },
      ],
    },
    {
      id: '3-5-2',
      label: '3-5-2',
      slots: [
        { id: 's0',  position: 'GK',  x: 50, y: 5  },
        { id: 's1',  position: 'DEF', x: 20, y: 22 },
        { id: 's2',  position: 'DEF', x: 50, y: 22 },
        { id: 's3',  position: 'DEF', x: 80, y: 22 },
        { id: 's4',  position: 'WB',  x: 10, y: 50 },
        { id: 's5',  position: 'MID', x: 30, y: 48 },
        { id: 's6',  position: 'MID', x: 50, y: 46 },
        { id: 's7',  position: 'MID', x: 70, y: 48 },
        { id: 's8',  position: 'WB',  x: 90, y: 50 },
        { id: 's9',  position: 'ATT', x: 35, y: 76 },
        { id: 's10', position: 'ATT', x: 65, y: 76 },
      ],
    },
  ],
}
