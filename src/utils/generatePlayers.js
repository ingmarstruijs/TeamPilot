/**
 * Genereert een volledige spelerslijst op basis van leeftijdsgroep.
 * Namen zijn veelvoorkomende Nederlandse voornamen + KNVB-stijl achternamen.
 */

const FIRST_NAMES = [
  'Daan', 'Sem', 'Finn', 'Luca', 'Noah', 'Julian', 'Bram',
  'Thijs', 'Lars', 'Tim', 'Niels', 'Sander', 'Joris', 'Milan',
  'Ruben', 'Jesse', 'Thomas', 'Max', 'Rick', 'Kevin', 'Stijn',
  'Robin', 'Jasper', 'Dylan', 'Pieter', 'Lukas', 'Joren', 'Bas',
  'Noel', 'Tibo', 'Rens', 'Bo', 'Arjen', 'Mark', 'Sven',
]

const LAST_NAMES = [
  'de Vries', 'Janssen', 'Bakker', 'Peters', 'Visser',
  'Smit', 'Meijer', 'de Boer', 'Mulder', 'Bos',
  'van Dijk', 'van den Berg', 'Hendriks', 'Klaasen', 'Berghuis',
  'Gravenberch', 'Timber', 'Veerman', 'Dumfries', 'de Jong',
  'Weghorst', 'Wijnaldum', 'Blind', 'Ake', 'Gakpo',
]

/**
 * Positieverdeling per spelersaantal
 * Returned array van positie-ID's, van keeper naar aanvallers
 */
const POSITION_LAYOUTS = {
  4:  ['GK', 'DEF', 'MID', 'ATT'],
  5:  ['GK', 'DEF', 'DEF', 'MID', 'ATT'],
  7:  ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'ATT', 'ATT'],
  8:  ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'ATT', 'ATT'],
  9:  ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT'],
  11: ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT'],
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * @param {number} count  – aantal te genereren spelers
 * @param {number} existingCount – huidig aantal spelers (voor nummering)
 * @returns {Array<{ name, number, position }>}
 */
export function generatePlayers(count, existingCount = 0) {
  const positions = POSITION_LAYOUTS[count] ?? POSITION_LAYOUTS[11]
  const shuffledFirst = shuffle(FIRST_NAMES)
  const shuffledLast  = shuffle(LAST_NAMES)

  return positions.map((position, i) => ({
    name:     `${shuffledFirst[i % shuffledFirst.length]} ${shuffledLast[i % shuffledLast.length]}`,
    number:   existingCount + i + 1,
    position,
  }))
}
