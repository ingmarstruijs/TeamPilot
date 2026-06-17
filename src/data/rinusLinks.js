/**
 * Maps local exercise ids to KNVB Rinus exercise pages.
 * Each id should point to the matching Rinus oefening (title/rules/svg align).
 * @see https://rinus.knvb.nl/nl/exercise/id/{id}
 */
export const RINUS_ID_MAP = {
  // Warming-up
  'wu-loopscholing':        47607,  // Passen en lopen
  'wu-dynamisch-stretchen': 1135012, // Dynamische loopvormen 11+
  'wu-rondo-licht':         37787,  // 5 tegen 2 positiespel
  'wu-snelheidsladders':    47859,  // Lijnenloop
  'wu-voetbalfit-balans':   47837,  // Balans in driehoek

  // Techniek
  'tech-driehoek-passen':   47701,  // Passen en lopen (driehoek-vorm)
  'tech-een-tegen-een':     34535,  // 1 tegen 1+k groot doel, kleine doeltjes
  'tech-afwerken':          48167,  // Scoren als Vivianne
  'tech-kopbal':            1484136, // Koppen en keepen
  'tech-dribbel-parcours':  39409,  // Dribbel in + vorm
  'tech-snel-passen':       47931,  // De vrije speler zoeken
  'tech-voorzet-afmaken':   47965,  // Scoren uit voorzet
  'tech-vrije-speler':      47931,  // De vrije speler zoeken
  'tech-3v1-opbouw':        35803,  // 3 tegen 1 positiespel
  'tech-4v2-positiespel':   36149,  // 4 tegen 2 positiespel
  'tech-balans-driehoek':   47837,  // Balans in driehoek
  'tech-lijnen-dribbel':    47961,  // Lijnen dribbel
  'tech-dribbel-in-vorm':   39409,  // Dribbel in + vorm
  'tech-1v1-keeper':        48213,  // Keepers: 1 tegen 1 doelschietspel
  'tech-1v1-omschakelen':   42143,  // 1+K tegen 1+K omschakelen
  'tech-1v1-doeltjes':      34535,  // 1 tegen 1+k groot doel, kleine doeltjes
  'tech-muur-passen':       47931,  // De vrije speler zoeken (muurspeler-variant)
  'tech-afwerken-keeper':   48213,  // Keepers: 1 tegen 1 doelschietspel

  // Tactiek
  'tac-druk-zetten':        38507,  // 5 tegen 2 positiespel (smal veld)
  'tac-opbouwen':           41175,  // 4+K tegen 3 opbouw met de backs
  'tac-overload':           45645,  // Positiespel 2 tegen 1 spel verplaatsen
  'tac-transitie':          42143,  // 1+K tegen 1+K omschakelen
  'tac-zone-spel':          45811,  // Positiespel 3 tegen 2 spel verplaatsen
  'tac-2v1-verplaatsen':    45645,  // Positiespel 2 tegen 1 spel verplaatsen
  'tac-3v2-verplaatsen':    45811,  // Positiespel 3 tegen 2 spel verplaatsen
  'tac-4k-opbouw-backs':    41175,  // 4+K tegen 3 opbouw met de backs
  'tac-1v1-verdedigen':     43099,  // 1 tegen 1+k verdedigen op 2 lijnen + scoren
  'tac-hoog-druk-4v2':      36149,  // 4 tegen 2 positiespel

  // Conditie
  'con-interval':           47859,  // Lijnenloop
  'con-shuttle':            47393,  // Hinkel estafette met bal
  'con-kleine-partij':      37545,  // 4 tegen 4 basisvorm
  'con-weerstand':          47671,  // Elastiek sprint
  'con-positiespel-3v2':    45811,  // Positiespel 3 tegen 2 spel verplaatsen
  'cond-richting-wissel':   47673,  // Sprint uit startpositie

  // Partijvorm
  'part-5v5':               38095,  // 5 tegen 5
  'part-7v7':               37685,  // 7 tegen 7
  'part-8v8':               37331,  // 8 tegen 8
  'part-4v4-pionnen':       38735,  // 4 tegen 4 met pionnen
  'part-4v4-doeltjes':      38687,  // 4 tegen 4 met 4 kleine doeltjes
  'part-4v4-basis-o11':     37545,  // 4 tegen 4 basisvorm
  'part-9v9':               37331,  // 8 tegen 8 (dichtstbijzijnde partijvorm)

  // Keeper
  'gk-1v1-vierkant':        48209,  // Keepers: 1 tegen 1 vierkant verdedigen

  // Afsluiting
  'af-koordans':            47863,  // Lunges met bal
  'af-spelletje':           47699,  // Passen en jagen
  'af-stretchen-kring':     47863,  // Lunges met bal (cool-down variant)
  'af-evaluation':          47699,  // Passen en jagen (kring/evaluatie)
  'af-rondo-afsluit':       37787,  // 5 tegen 2 positiespel (lichte rondo)
}
