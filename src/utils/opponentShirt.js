const STYLE_OPTIONS = ['stripes', 'halves-h', 'halves-v', 'sash', 'gradient', 'solid']

/** Pick a shirt style and colours that contrast clearly with the own team kit. */
export function getOpponentShirt(teamShirt = { style: 'solid', primary: '#059669', secondary: '#ffffff' }) {
  const teamStyle = teamShirt.style ?? 'solid'
  const opponentStyle = STYLE_OPTIONS.find(s => s !== teamStyle) ?? 'stripes'

  const teamPrimary = (teamShirt.primary ?? '#059669').toLowerCase()
  const isGreenish = teamPrimary.includes('6b3') || teamPrimary.includes('0596') || teamPrimary.includes('1a7')

  if (isGreenish) {
    return { style: opponentStyle, primary: '#be123c', secondary: '#1e293b' }
  }

  const isRedish = teamPrimary.includes('cc') || teamPrimary.includes('be12') || teamPrimary.includes('dc26')
  if (isRedish) {
    return { style: opponentStyle, primary: '#1e40af', secondary: '#f8fafc' }
  }

  return { style: opponentStyle, primary: '#475569', secondary: '#f1f5f9' }
}
