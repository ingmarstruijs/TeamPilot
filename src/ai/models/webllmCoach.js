import { validateSessionPlan } from '../validateSessionPlan.js'
import { parseJsonFromModelText } from '../parseModelJson.js'
import { normalizeLlmSessionPlan } from '../normalizeLlmSessionPlan.js'
import { DEFAULT_LOCAL_MODEL_ID } from '../aiPreferences.js'
import {
  buildPlanSessionMessages,
  buildRepairMessages,
  buildEnrichNarrationMessages,
} from '../prompts/planSessionPrompt.js'
import { adaptBlockSync, fillPlannedBlockNarration } from './rulesCoach.js'

/** @type {any} */
let engineSingleton = null
/** @type {string|null} */
let engineModelId = null
/** @type {Promise<any>|null} */
let enginePromise = null
/** @type {ReturnType<typeof setTimeout>|null} */
let idleUnloadTimer = null
/** @type {boolean} */
let visibilityHooked = false

const GEN_MAX_TOKENS = 2048
const ENRICH_MAX_TOKENS = 768
/** Unload engine after this idle period to free phone GPU/RAM. */
export const ENGINE_IDLE_UNLOAD_MS = 5 * 60 * 1000

/** Speelwijze chips — always rules, never wait on WebLLM. */
export function isDeterministicAdaptInstruction(instruction) {
  const text = String(instruction ?? '').toLowerCase()
  return /makkelijker|eenvoudiger|simpeler|moeilijker|zwaarder|lastiger|korter|inkorten|langer|verlengen|meer tijd|geen keeper|zonder keeper|meer druk|pressen/.test(text)
}

function touchEngineActivity() {
  if (idleUnloadTimer) clearTimeout(idleUnloadTimer)
  idleUnloadTimer = setTimeout(() => {
    unloadWebLlmEngine()
  }, ENGINE_IDLE_UNLOAD_MS)
}

function ensureVisibilityUnloadHook() {
  if (visibilityHooked || typeof document === 'undefined') return
  visibilityHooked = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // Schedule unload shortly after backgrounding; cancel if user returns fast.
      if (idleUnloadTimer) clearTimeout(idleUnloadTimer)
      idleUnloadTimer = setTimeout(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          unloadWebLlmEngine()
        }
      }, 30_000)
    } else {
      touchEngineActivity()
    }
  })
}

/**
 * Drop the in-memory WebLLM engine (storage artifacts stay on disk).
 */
export function unloadWebLlmEngine() {
  if (idleUnloadTimer) {
    clearTimeout(idleUnloadTimer)
    idleUnloadTimer = null
  }
  const engine = engineSingleton
  engineSingleton = null
  engineModelId = null
  enginePromise = null
  try {
    engine?.unload?.()
  } catch {
    // ignore
  }
}

/**
 * Merge narration JSON onto a structure plan from rules.
 *
 * @param {import('../types.js').SessionPlan} structurePlan
 * @param {unknown} raw
 * @param {import('../types.js').CoachContext} ctx
 * @param {{ modelId?: string }} [meta]
 * @returns {import('../types.js').SessionPlan}
 */
export function applyNarrationEnrichment(structurePlan, raw, ctx, meta = {}) {
  const base = {
    ...structurePlan,
    engine: 'local-llm',
    modelId: meta.modelId || structurePlan.modelId || 'webllm',
  }
  if (!raw || typeof raw !== 'object') {
    return {
      ...base,
      blocks: (base.blocks ?? []).map(b => fillPlannedBlockNarration(ctx, b)),
    }
  }
  const parsed = /** @type {Record<string, any>} */ (raw)
  if (typeof parsed.coachBriefing === 'string' && parsed.coachBriefing.trim()) {
    base.coachBriefing = parsed.coachBriefing.trim()
  }

  const byIndex = new Map()
  if (Array.isArray(parsed.blocks)) {
    for (const row of parsed.blocks) {
      if (!row || typeof row !== 'object') continue
      const idx = Number(row.index)
      if (!Number.isFinite(idx)) continue
      byIndex.set(idx, row)
    }
  }

  base.blocks = (structurePlan.blocks ?? []).map((block, i) => {
    const row = byIndex.get(i)
    const next = { ...block }
    if (row) {
      if (typeof row.whyThis === 'string' && row.whyThis.trim()) {
        next.whyThis = row.whyThis.trim()
      }
      if (Array.isArray(row.coachingCues) && row.coachingCues.length) {
        next.coachingCues = row.coachingCues.map(String).filter(Boolean).slice(0, 3)
      }
    }
    return fillPlannedBlockNarration(ctx, next)
  })

  return base
}

/**
 * @param {{
 *   modelId?: string,
 *   createEngine?: (modelId: string, opts: object) => Promise<any>,
 *   loadWebLlm?: () => Promise<{ CreateMLCEngine: Function }>,
 * }} [options]
 * @returns {import('../coachModel.js').CoachModel}
 */
export function createWebLlmCoach(options = {}) {
  const modelId = options.modelId || DEFAULT_LOCAL_MODEL_ID
  const loadWebLlm = options.loadWebLlm
    || (async () => import('@mlc-ai/web-llm'))
  const createEngine = options.createEngine

  async function getEngine(onProgress) {
    ensureVisibilityUnloadHook()
    touchEngineActivity()
    if (engineSingleton && engineModelId === modelId) return engineSingleton
    if (enginePromise) return enginePromise

    enginePromise = (async () => {
      const factory = createEngine || (await loadWebLlm()).CreateMLCEngine
      let peak = 0
      const engine = await factory(modelId, {
        initProgressCallback: (report) => {
          if (!onProgress) return
          const raw = typeof report?.progress === 'number' ? report.progress : 0
          // WebLLM phases often reset progress — keep monotonic for UX.
          peak = Math.max(peak, Math.max(0, Math.min(1, raw || 0)))
          onProgress({
            progress: peak,
            text: report?.text || 'Model laden…',
          })
        },
      })
      engineSingleton = engine
      engineModelId = modelId
      touchEngineActivity()
      return engine
    })()

    try {
      return await enginePromise
    } finally {
      enginePromise = null
    }
  }

  /**
   * @param {Array<{role:string,content:string}>} messages
   * @param {{
   *   onProgress?: (p:{progress:number,text:string})=>void,
   *   phaseStart?: number,
   *   phaseSpan?: number,
   *   label?: string,
   *   maxTokens?: number,
   *   signal?: AbortSignal,
   * }} [opts]
   */
  async function chatJson(messages, opts = {}) {
    const onProgress = opts.onProgress
    const phaseStart = opts.phaseStart ?? 0
    const phaseSpan = opts.phaseSpan ?? 1
    const label = opts.label || 'AI schrijft trainingsplan…'
    const maxTokens = opts.maxTokens ?? GEN_MAX_TOKENS

    if (opts.signal?.aborted) throw new Error('aborted')

    const report = (localProgress, text) => {
      onProgress?.({
        progress: Math.max(0, Math.min(1, phaseStart + localProgress * phaseSpan)),
        text: text || label,
      })
    }

    report(0.02, label)
    const engine = await getEngine((p) => {
      report(Math.min(0.1, (p.progress || 0) * 0.1), p.text || 'Model laden…')
    })
    touchEngineActivity()

    const create = engine?.chat?.completions?.create
    if (typeof create !== 'function') {
      throw new Error('WebLLM engine mist chat.completions.create')
    }

    let reply
    try {
      reply = await create.call(engine.chat.completions, {
        messages,
        temperature: 0.2,
        max_tokens: maxTokens,
        stream: true,
      })
    } catch {
      reply = null
    }

    if (reply && typeof reply[Symbol.asyncIterator] === 'function') {
      let content = ''
      let chunks = 0
      for await (const chunk of reply) {
        if (opts.signal?.aborted) throw new Error('aborted')
        const delta = chunk?.choices?.[0]?.delta?.content
          ?? chunk?.choices?.[0]?.message?.content
          ?? ''
        if (delta) content += delta
        chunks += 1
        const approx = 1 - Math.exp(-(content.length || chunks * 24) / 600)
        report(0.1 + approx * 0.85, `${label} (${Math.round(approx * 100)}%)`)
      }
      report(0.98, 'Antwoord afronden…')
      touchEngineActivity()
      return parseJsonFromModelText(content)
    }

    if (opts.signal?.aborted) throw new Error('aborted')
    const full = reply ?? await create.call(engine.chat.completions, {
      messages,
      temperature: 0.2,
      max_tokens: maxTokens,
    })
    report(0.9, 'Antwoord verwerken…')
    touchEngineActivity()
    const content = full?.choices?.[0]?.message?.content ?? ''
    return parseJsonFromModelText(content)
  }

  return {
    id: 'webllm-v1',
    async status() {
      if (engineSingleton && engineModelId === modelId) return 'ready'
      return 'needs-download'
    },
    async ensureReady(onProgress) {
      let peak = 0
      await getEngine((p) => {
        peak = Math.max(peak, Math.max(0, Math.min(1, p.progress || 0)))
        onProgress?.({ progress: peak, text: p.text })
      })
    },
    /**
     * Legacy full-plan path (tests / repair). Prefer enrichNarration in product flow.
     *
     * @param {import('../types.js').CoachContext} ctx
     * @param {{ onProgress?: (p:{progress:number,text:string})=>void, signal?: AbortSignal }} [planOpts]
     */
    async planSession(ctx, planOpts = {}) {
      const onProgress = planOpts.onProgress
      const messages = buildPlanSessionMessages(ctx)
      let parsed = null
      let firstErrors = ['Geen bruikbare JSON']

      onProgress?.({ progress: 0.05, text: 'Prompt klaarzetten…' })

      try {
        parsed = normalizeLlmSessionPlan(
          await chatJson(messages, {
            onProgress,
            phaseStart: 0.08,
            phaseSpan: 0.62,
            label: 'AI schrijft trainingsplan…',
            signal: planOpts.signal,
          }),
          ctx,
          { modelId },
        )
        onProgress?.({ progress: 0.72, text: 'Plan controleren…' })
        let validated = validateSessionPlan(parsed, ctx)
        if (validated.ok) {
          onProgress?.({ progress: 1, text: 'Plan klaar' })
          return validated.plan
        }
        firstErrors = validated.errors
      } catch (err) {
        firstErrors = [err?.message || 'parse failed']
      }

      onProgress?.({ progress: 0.74, text: 'Plan bijwerken…' })
      try {
        const repairMessages = [
          ...messages,
          {
            role: 'assistant',
            content: parsed ? JSON.stringify(parsed) : '{}',
          },
          ...buildRepairMessages(firstErrors, parsed),
        ]
        parsed = normalizeLlmSessionPlan(
          await chatJson(repairMessages, {
            onProgress,
            phaseStart: 0.74,
            phaseSpan: 0.2,
            label: 'AI herstelt plan…',
            signal: planOpts.signal,
          }),
          ctx,
          { modelId },
        )
        onProgress?.({ progress: 0.96, text: 'Herstel controleren…' })
        const validated = validateSessionPlan(parsed, ctx)
        if (validated.ok) {
          onProgress?.({ progress: 1, text: 'Plan klaar' })
          return validated.plan
        }
        throw new Error(`WebLLM plan ongeldig: ${validated.errors.join('; ')}`)
      } catch (err) {
        throw new Error(err?.message || 'WebLLM plan ongeldig')
      }
    },
    /**
     * Narration-only pass on an existing rules structure plan.
     *
     * @param {import('../types.js').CoachContext} ctx
     * @param {import('../types.js').SessionPlan} structurePlan
     * @param {{ onProgress?: (p:{progress:number,text:string})=>void, signal?: AbortSignal }} [opts]
     */
    async enrichNarration(ctx, structurePlan, opts = {}) {
      const onProgress = opts.onProgress
      onProgress?.({ progress: 0.05, text: 'Briefing klaarzetten…' })
      const messages = buildEnrichNarrationMessages(ctx, structurePlan)
      const raw = await chatJson(messages, {
        onProgress,
        phaseStart: 0.08,
        phaseSpan: 0.88,
        label: 'Briefing schrijven…',
        maxTokens: ENRICH_MAX_TOKENS,
        signal: opts.signal,
      })
      const plan = applyNarrationEnrichment(structurePlan, raw, ctx, { modelId })
      onProgress?.({ progress: 1, text: 'Briefing klaar' })
      return plan
    },
    /**
     * Speelwijze chips stay on the rules path (instant). Freeform may use the LLM.
     *
     * @param {import('../types.js').CoachContext} ctx
     * @param {import('../types.js').PlannedBlock} block
     * @param {string} instruction
     * @param {{ onProgress?: (p:{progress:number,text:string})=>void }} [opts]
     */
    async adaptBlock(ctx, block, instruction, opts = {}) {
      const onProgress = opts.onProgress
      const text = String(instruction ?? '')
      if (isDeterministicAdaptInstruction(text)) {
        onProgress?.({ progress: 1, text: 'Aangepast' })
        return adaptBlockSync(ctx, block, instruction)
      }

      try {
        const messages = (await import('../prompts/adaptBlockPrompt.js')).buildAdaptBlockMessages(ctx, block, instruction)
        const parsed = await chatJson(messages, {
          onProgress,
          label: 'Blok aanpassen…',
          maxTokens: 512,
        })
        if (!parsed || typeof parsed !== 'object') {
          onProgress?.({ progress: 1, text: 'Aangepast' })
          return adaptBlockSync(ctx, block, instruction)
        }
        onProgress?.({ progress: 1, text: 'Aangepast' })
        return {
          ...block,
          ...parsed,
          adaptations: Array.isArray(parsed.adaptations) ? parsed.adaptations : block.adaptations,
          coachingCues: Array.isArray(parsed.coachingCues) ? parsed.coachingCues : block.coachingCues,
          rules: Array.isArray(parsed.rules) ? parsed.rules : block.rules,
          durationMin: Number(parsed.durationMin) || block.durationMin,
        }
      } catch {
        onProgress?.({ progress: 1, text: 'Aangepast' })
        return adaptBlockSync(ctx, block, instruction)
      }
    },
    async explainBlock(ctx, block) {
      return block.whyThis
        || `Lokale AI koos ${block.title} voor ${ctx.playerCount} spelers.`
    },
  }
}

/** Test helper — clears module-level engine cache. */
export function resetWebLlmEngineCache() {
  unloadWebLlmEngine()
}
