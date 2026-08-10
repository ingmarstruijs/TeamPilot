/**
 * @typedef {object} CoachContext
 * @property {string} ageGroup
 * @property {number} knvbLevel
 * @property {string} [knvbClass]
 * @property {string} trainingType
 * @property {number} durationMin
 * @property {number} cycleWeek
 * @property {string} cycleTheme
 * @property {number} playerCount
 * @property {Array<{id:string,name:string,position:string}>} presentPlayers
 * @property {string[]} recentExerciseIds
 * @property {string} [focus]
 * @property {{needsAttackFocus:boolean,needsDefenceFocus:boolean,counts:object}} balance
 * @property {'nl'} locale
 * @property {object} [skeleton]
 * @property {object} [candidates]
 */

/**
 * @typedef {object} PlannedBlock
 * @property {'rinus'|'library'|'generated'} source
 * @property {string} [exerciseId]
 * @property {string} title
 * @property {string} category
 * @property {number} durationMin
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {string} description
 * @property {string} setup
 * @property {string[]} rules
 * @property {string[]} adaptations
 * @property {string[]} coachingCues
 * @property {string} [whyThis]
 */

/**
 * @typedef {object} SessionPlan
 * @property {string} title
 * @property {string} coachBriefing
 * @property {number} durationMin
 * @property {string} theme
 * @property {PlannedBlock[]} blocks
 * @property {'rules'|'local-llm'} engine
 * @property {string} [modelId]
 */

/**
 * @typedef {object} CandidateCard
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {number} durationMin
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {string[]} [focusPositions]
 * @property {string} [intensity]
 */

export {}
