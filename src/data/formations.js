/**
 * Leeftijdsgroepen en hun configuratie
 * Eenvoudig uitbreidbaar door items toe te voegen
 */
export const AGE_GROUPS = [
  { id: 'JO08', label: 'JO8',   players: 4,  fieldSize: 'xs' },
  { id: 'JO09', label: 'JO9',   players: 5,  fieldSize: 'xs' },
  { id: 'JO10', label: 'JO10',  players: 7,  fieldSize: 'sm' },
  { id: 'JO11', label: 'JO11',  players: 8,  fieldSize: 'sm' },
  { id: 'JO12', label: 'JO12',  players: 9,  fieldSize: 'md' },
  { id: 'JO13', label: 'JO13',  players: 11, fieldSize: 'lg' },
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
 * Formaties per leeftijdsgroep
 * Posities zijn genormaliseerde coördinaten: x (0-100 links→rechts), y (0-100 boven→onder)
 * y=0 = eigen goal, y=100 = tegenstander goal
 * GK staat altijd op y≈5
 */
export const FORMATIONS = {
  JO08: [
    {
      id: '1-1-2',
      label: '1-1-2',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 50, y: 30 },
        { id: 's2', position: 'MID', x: 30, y: 60 },
        { id: 's3', position: 'ATT', x: 70, y: 60 },
      ],
    },
    {
      id: '1-2-1',
      label: '1-2-1',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 30, y: 35 },
        { id: 's2', position: 'DEF', x: 70, y: 35 },
        { id: 's3', position: 'ATT', x: 50, y: 70 },
      ],
    },
  ],

  JO09: [
    {
      id: '1-2-2',
      label: '1-2-2',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 30, y: 32 },
        { id: 's2', position: 'DEF', x: 70, y: 32 },
        { id: 's3', position: 'ATT', x: 30, y: 70 },
        { id: 's4', position: 'ATT', x: 70, y: 70 },
      ],
    },
    {
      id: '1-1-2-1',
      label: '1-1-2-1',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 50, y: 28 },
        { id: 's2', position: 'MID', x: 25, y: 50 },
        { id: 's3', position: 'MID', x: 75, y: 50 },
        { id: 's4', position: 'ATT', x: 50, y: 75 },
      ],
    },
  ],

  JO10: [
    {
      id: '1-3-2-1',
      label: '1-3-2-1',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 20, y: 28 },
        { id: 's2', position: 'DEF', x: 50, y: 28 },
        { id: 's3', position: 'DEF', x: 80, y: 28 },
        { id: 's4', position: 'MID', x: 30, y: 55 },
        { id: 's5', position: 'MID', x: 70, y: 55 },
        { id: 's6', position: 'ATT', x: 50, y: 78 },
      ],
    },
    {
      id: '1-2-3-1',
      label: '1-2-3-1',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 6  },
        { id: 's1', position: 'DEF', x: 30, y: 28 },
        { id: 's2', position: 'DEF', x: 70, y: 28 },
        { id: 's3', position: 'MID', x: 15, y: 55 },
        { id: 's4', position: 'MID', x: 50, y: 52 },
        { id: 's5', position: 'MID', x: 85, y: 55 },
        { id: 's6', position: 'ATT', x: 50, y: 78 },
      ],
    },
  ],

  JO11: [
    {
      id: '1-3-3-1',
      label: '1-3-3-1',
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
    {
      id: '1-2-3-2',
      label: '1-2-3-2',
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
  ],

  JO12: [
    {
      id: '1-3-3-2',
      label: '1-3-3-2',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 5  },
        { id: 's1', position: 'DEF', x: 20, y: 24 },
        { id: 's2', position: 'DEF', x: 50, y: 24 },
        { id: 's3', position: 'DEF', x: 80, y: 24 },
        { id: 's4', position: 'MID', x: 20, y: 50 },
        { id: 's5', position: 'MID', x: 50, y: 48 },
        { id: 's6', position: 'MID', x: 80, y: 50 },
        { id: 's7', position: 'ATT', x: 33, y: 76 },
        { id: 's8', position: 'ATT', x: 67, y: 76 },
      ],
    },
    {
      id: '1-4-3-1',
      label: '1-4-3-1',
      slots: [
        { id: 's0', position: 'GK',  x: 50, y: 5  },
        { id: 's1', position: 'DEF', x: 15, y: 25 },
        { id: 's2', position: 'DEF', x: 38, y: 25 },
        { id: 's3', position: 'DEF', x: 62, y: 25 },
        { id: 's4', position: 'DEF', x: 85, y: 25 },
        { id: 's5', position: 'MID', x: 20, y: 52 },
        { id: 's6', position: 'MID', x: 50, y: 50 },
        { id: 's7', position: 'MID', x: 80, y: 52 },
        { id: 's8', position: 'ATT', x: 50, y: 76 },
      ],
    },
  ],

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
