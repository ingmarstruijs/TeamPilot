/**
 * Discover official outdoor KNVB Rinus exercises and generate a TeamPilot library batch.
 *
 * Run: node scripts/import-rinus-exercises.mjs
 * Then: node scripts/sync-rinus-content.mjs
 *
 * Writes: src/data/rinusExercises.generated.js
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { RINUS_ID_MAP } from '../src/data/rinusLinks.js'
import { EXERCISES as EXISTING_EXERCISES } from '../src/data/exercises.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outFile = path.join(__dirname, '../src/data/rinusExercises.generated.js')

const API = 'https://api-rinus.knvb.nl/api/exercises/search'
const OUTDOOR = 295812

/** Per TeamPilot category: Rinus exerciseTypeCategory ids + how many unique drills to keep. */
const IMPORT_PLAN = [
  { category: 'warming-up', typeIds: [363, 545545, 362], limit: 18 },
  { category: 'techniek', typeIds: [364, 368], limit: 22 },
  { category: 'tactiek', typeIds: [368, 369], limit: 18 },
  { category: 'conditie', typeIds: [362, 368], limit: 12 },
  { category: 'partijvorm', typeIds: [365, 366, 367], limit: 18 },
  { category: 'afsluiting', typeIds: [362, 363], limit: 8 },
]

const AGE_MAP = {
  O8: 'JO8',
  O9: 'JO9',
  O10: 'JO10',
  O11: 'JO11',
  O12: 'JO12',
  O13: 'JO13',
  O14: 'JO13',
  O15: 'JO13',
  O16: 'JO13',
  O17: 'JO13',
  O18: 'Senior',
  O19: 'Senior',
  Senioren: 'Senior',
}

const ALL_AGE = ['JO8', 'JO9', 'JO10', 'JO11', 'JO12', 'JO13', 'Senior']

const existingRinusIds = new Set([
  ...Object.values(RINUS_ID_MAP).map(String),
  ...EXISTING_EXERCISES.map(ex => String(ex.rinusId ?? RINUS_ID_MAP[ex.id] ?? '')).filter(Boolean),
])

const existingTitles = new Set(
  EXISTING_EXERCISES.map(ex => normalizeTitle(ex.title)).filter(Boolean),
)

function normalizeTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function searchExercises({ typeId, from = 0, limit = 50 }) {
  const params = new URLSearchParams()
  params.append('exerciseTypeCategory[]', String(typeId))
  params.append('fieldTypeCategory[]', String(OUTDOOR))
  params.append('from', String(from))
  params.append('limit', String(limit))
  params.append('site', 'rinusNL')
  const res = await fetch(`${API}?${params}`)
  if (!res.ok) throw new Error(`Rinus search failed (${res.status}) for type ${typeId}`)
  return res.json()
}

function hasSvg(entry) {
  return Boolean(entry?.exerciseContent?.[0]?.exerciseFigure?.[0]?.exerciseSvgImage?.[0]?.url)
}

function mapAgeGroups(entry) {
  const ages = new Set()
  for (const cat of entry.ageCategories || []) {
    const mapped = AGE_MAP[cat.title]
    if (mapped) ages.add(mapped)
  }
  if (!ages.size) return [...ALL_AGE]
  // Broaden one step for practical grassroots use.
  const ordered = ALL_AGE.filter(a => ages.has(a))
  if (ordered.includes('JO8') || ordered.includes('JO9') || ordered.includes('JO10')) {
    ages.add('JO8'); ages.add('JO9'); ages.add('JO10')
  }
  if (ordered.includes('JO11') || ordered.includes('JO12')) {
    ages.add('JO11'); ages.add('JO12')
  }
  if (ordered.includes('JO13') || ordered.includes('Senior')) {
    ages.add('JO13'); ages.add('Senior')
  }
  return ALL_AGE.filter(a => ages.has(a))
}

function activityTitles(entry) {
  return (entry.activities || []).map(a => a.title)
}

function objectiveTitles(entry) {
  return (entry.objectiveCategories || []).map(o => o.title)
}

function focusPositionsFor(entry, category) {
  const acts = activityTitles(entry).join(' ').toLowerCase()
  const positions = new Set()
  if (/keeper/.test(acts)) positions.add('GK')
  if (/schiet|voorzet|dribbel|passeer|scoren/.test(acts)) positions.add('ATT')
  if (/pas|vrijloop|bijsluit|aannem|meeneem|overnem/.test(acts)) positions.add('MID')
  if (/druk|blokkeer|duel|knijp|verdedig|storen|sliding/.test(acts)) positions.add('DEF')
  if (category === 'partijvorm') {
    positions.add('ATT'); positions.add('MID'); positions.add('DEF')
  }
  if (category === 'warming-up' || category === 'afsluiting' || category === 'conditie') {
    positions.add('MID'); positions.add('ATT'); positions.add('DEF')
  }
  if (!positions.size) positions.add('MID')
  return [...positions]
}

function trainingTypesFor(category, entry) {
  const objectives = objectiveTitles(entry).join(' ').toLowerCase()
  const base = {
    'warming-up': ['gemengd', 'techniek', 'tactiek', 'conditie', 'partij'],
    techniek: ['techniek', 'gemengd'],
    tactiek: ['tactiek', 'gemengd'],
    conditie: ['conditie', 'gemengd'],
    partijvorm: ['partij', 'gemengd', 'tactiek'],
    afsluiting: ['gemengd', 'techniek', 'tactiek', 'conditie', 'partij'],
  }[category] || ['gemengd']

  if (/omschakel/.test(objectives) && !base.includes('tactiek')) base.push('tactiek')
  if (/scoren|kansen|1 tegen 1|één tegen één/.test(objectives) && !base.includes('techniek')) {
    base.push('techniek')
  }
  return [...new Set(base)]
}

function cycleThemesFor(category, entry) {
  const objectives = objectiveTitles(entry).join(' ').toLowerCase()
  const themes = new Set([category === 'partijvorm' ? 'partij' : category])
  if (/passen|positiespel|opbouw/.test(objectives)) themes.add('techniek')
  if (/verdedig|druk|storen/.test(objectives)) themes.add('tactiek')
  if (/omschakel/.test(objectives)) themes.add('tactiek')
  if (category === 'warming-up' || category === 'conditie') themes.add('conditie')
  if (category === 'afsluiting') themes.add('conditie')
  return [...themes]
}

function intensityFor(category, entry) {
  if (category === 'warming-up' || category === 'afsluiting') return 'low'
  if (category === 'conditie') return 'high'
  if (category === 'partijvorm') return 'medium'
  const players = entry.playersMaximum ?? entry.playersMinimum ?? 8
  if (players >= 12) return 'medium'
  return category === 'tactiek' ? 'medium' : 'low'
}

function knvbRange(ageGroups, category) {
  const young = ageGroups.some(a => ['JO8', 'JO9', 'JO10'].includes(a))
  const old = ageGroups.some(a => ['JO13', 'Senior'].includes(a))
  if (category === 'tactiek' && old) return [2, 7]
  if (young && !old) return [1, 5]
  if (!young && old) return [2, 7]
  return [1, 7]
}

function toExercise(entry, category) {
  const content = entry.exerciseContent?.[0] || {}
  const ageGroups = mapAgeGroups(entry)
  const [minKnvbLevel, maxKnvbLevel] = knvbRange(ageGroups, category)
  const minPlayers = content.playersMinimum ?? entry.playersMinimum ?? 4
  const maxPlayers = content.playersMaximum ?? entry.playersMaximum ?? Math.max(minPlayers, 12)
  const durationMin = content.exerciseDuration ?? 10
  const title = entry.exerciseTitle || content.exerciseTitle || entry.title
  const activities = activityTitles(entry)
  const objectives = objectiveTitles(entry)

  return {
    id: `rinus-${entry.id}`,
    rinusId: entry.id,
    title,
    category,
    durationMin,
    ageGroups,
    minKnvbLevel,
    maxKnvbLevel,
    minPlayers,
    maxPlayers,
    focusPositions: focusPositionsFor(entry, category),
    intensity: intensityFor(category, entry),
    trainingTypes: trainingTypesFor(category, entry),
    description: objectives[0]
      ? `${title}. Focus: ${objectives.filter(o => !/^alle |^verschillende /i.test(o)).slice(0, 2).join(', ')}.`
      : title,
    setup: (entry.fieldSizeCategory || []).map(f => f?.title).filter(Boolean).join(', ') || 'Zie Rinus-schema.',
    source: 'KNVB Rinus',
    cycleThemes: cycleThemesFor(category, entry),
    diagram: {},
  }
}

function isEligible(entry) {
  if (!entry?.id || entry.userGenerated) return false
  if (entry.authorId && entry.authorId !== 1) return false
  if (!hasSvg(entry)) return false
  const title = entry.exerciseTitle || ''
  if (/zaal|indoor|elektrisch|frame-?voetbal/i.test(title)) return false
  const fieldTypes = (entry.fieldTypeCategory || []).map(f => f.title.toLowerCase())
  if (fieldTypes.length && !fieldTypes.includes('outdoor')) return false
  return true
}

async function collectForCategory(plan) {
  const picked = []
  const seenTitles = new Set()

  for (const typeId of plan.typeIds) {
    if (picked.length >= plan.limit) break
    let from = 0
    const pageSize = 50
    let total = Infinity
    let guard = 0

    while (picked.length < plan.limit && from < total && guard < 8) {
      guard += 1
      process.stdout.write(`  type ${typeId} from=${from}... `)
      const data = await searchExercises({ typeId, from, limit: pageSize })
      total = data.pageInfo?.total ?? 0
      const results = data.results || []
      console.log(`${results.length} results (total ${total})`)

      for (const entry of results) {
        if (picked.length >= plan.limit) break
        if (!isEligible(entry)) continue
        const id = String(entry.id)
        if (existingRinusIds.has(id)) continue
        const norm = normalizeTitle(entry.exerciseTitle)
        if (!norm || existingTitles.has(norm) || seenTitles.has(norm)) continue

        // Category-specific suitability filters to keep library useful.
        if (plan.category === 'conditie') {
          const typeTitle = entry.exerciseTypeCategory?.[0]?.title || ''
          if (typeTitle !== 'Voetbalfit' && (entry.playersMaximum ?? 0) > 12) continue
        }
        if (plan.category === 'afsluiting') {
          const dur = entry.exerciseContent?.[0]?.exerciseDuration ?? 15
          if (dur > 12) continue
        }
        if (plan.category === 'techniek' && plan.typeIds.includes(368)) {
          // Prefer smaller overtal forms for technique slots.
          if ((entry.playersMaximum ?? 99) > 10 && entry.exerciseTypeCategory?.[0]?.id === 368) continue
        }

        picked.push(toExercise(entry, plan.category))
        existingRinusIds.add(id)
        seenTitles.add(norm)
        existingTitles.add(norm)
      }

      from += pageSize
      await sleep(120)
    }
  }

  return picked
}

const imported = []
for (const plan of IMPORT_PLAN) {
  console.log(`\nCollecting ${plan.category} (target ${plan.limit})`)
  const batch = await collectForCategory(plan)
  console.log(`→ ${batch.length} new ${plan.category} exercises`)
  imported.push(...batch)
}

const idMap = Object.fromEntries(imported.map(ex => [ex.id, ex.rinusId]))

const file = `/**
 * Auto-imported official outdoor KNVB Rinus exercises.
 * Generated by scripts/import-rinus-exercises.mjs — do not edit by hand.
 */
export const IMPORTED_RINUS_ID_MAP = ${JSON.stringify(idMap, null, 2)}

export const IMPORTED_RINUS_EXERCISES = ${JSON.stringify(imported, null, 2)}
`

fs.writeFileSync(outFile, file)
console.log(`\nWrote ${imported.length} exercises to ${outFile}`)
console.log('Next: node scripts/sync-rinus-content.mjs')
