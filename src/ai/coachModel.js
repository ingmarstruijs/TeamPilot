/**
 * @typedef {import('./types.js').CoachContext} CoachContext
 * @typedef {import('./types.js').SessionPlan} SessionPlan
 * @typedef {import('./types.js').PlannedBlock} PlannedBlock
 */

/**
 * @typedef {object} CoachModel
 * @property {string} id
 * @property {() => Promise<'ready'|'needs-download'|'unsupported'|'offline-rules'>} status
 * @property {(ctx: CoachContext, options?: { onProgress?: (p:{progress:number,text:string})=>void, signal?: AbortSignal }) => Promise<SessionPlan>} planSession
 * @property {(ctx: CoachContext, structurePlan: SessionPlan, options?: { onProgress?: (p:{progress:number,text:string})=>void, signal?: AbortSignal }) => Promise<SessionPlan>} [enrichNarration]
 * @property {(ctx: CoachContext, block: PlannedBlock, instruction: string) => Promise<PlannedBlock>} adaptBlock
 * @property {(ctx: CoachContext, block: PlannedBlock) => Promise<string>} explainBlock
 * @property {(onProgress?: (p:{progress:number,text:string})=>void) => Promise<void>} [ensureReady]
 */

export {}
