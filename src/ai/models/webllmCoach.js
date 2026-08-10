import { validateSessionPlan } from '../validateSessionPlan.js'
import { parseJsonFromModelText } from '../parseModelJson.js'
import { normalizeLlmSessionPlan } from '../normalizeLlmSessionPlan.js'
import { DEFAULT_LOCAL_MODEL_ID } from '../aiPreferences.js'
import {
  buildPlanSessionMessages,
  buildRepairMessages,
} from '../prompts/planSessionPrompt.js'
import { buildAdaptBlockMessages } from '../prompts/adaptBlockPrompt.js'
import { adaptBlockSync } from './rulesCoach.js'

/** @type {any} */
let engineSingleton = null
/** @type {string|null} */
let engineModelId = null
/** @type {Promise<any>|null} */
let enginePromise = null

const GEN_MAX_TOKENS = 2048

/** Speelwijze chips — always rules, never wait on WebLLM. */
export function isDeterministicAdaptInstruction(instruction) {
  const text = String(instruction ?? '').toLowerCase()
  return /makkelijker|eenvoudiger|simpeler|moeilijker|zwaarder|lastiger|korter|inkorten|langer|verlengen|meer tijd|geen keeper|zonder keeper|meer druk|pressen/.test(text)
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
    if (engineSingleton && engineModelId === modelId) return engineSingleton
    if (enginePromise) return enginePromise

    enginePromise = (async () => {
      const factory = createEngine || (await loadWebLlm()).CreateMLCEngine
      const engine = await factory(modelId, {
        initProgressCallback: (report) => {
          if (!onProgress) return
          const progress = typeof report?.progress === 'number'
            ? report.progress
            : 0
          onProgress({
            progress,
            text: report?.text || 'Model laden…',
          })
        },
      })
      engineSingleton = engine
      engineModelId = modelId
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
   * }} [opts]
   */
  async function chatJson(messages, opts = {}) {
    const onProgress = opts.onProgress
    const phaseStart = opts.phaseStart ?? 0
    const phaseSpan = opts.phaseSpan ?? 1
    const label = opts.label || 'AI schrijft trainingsplan…'

    const report = (localProgress, text) => {
      onProgress?.({
        progress: Math.max(0, Math.min(1, phaseStart + localProgress * phaseSpan)),
        text: text || label,
      })
    }

    report(0.02, label)
    const engine = await getEngine((p) => {
      // Model reload mid-flight (rare) — keep within first 10% of phase
      report(Math.min(0.1, (p.progress || 0) * 0.1), p.text || 'Model laden…')
    })

    const create = engine?.chat?.completions?.create
    if (typeof create !== 'function') {
      throw new Error('WebLLM engine mist chat.completions.create')
    }

    // Prefer streaming for live progress; fall back for mocks / older engines.
    let reply
    try {
      reply = await create.call(engine.chat.completions, {
        messages,
        temperature: 0.2,
        max_tokens: GEN_MAX_TOKENS,
        stream: true,
      })
    } catch {
      reply = null
    }

    if (reply && typeof reply[Symbol.asyncIterator] === 'function') {
      let content = ''
      let chunks = 0
      for await (const chunk of reply) {
        const delta = chunk?.choices?.[0]?.delta?.content
          ?? chunk?.choices?.[0]?.message?.content
          ?? ''
        if (delta) content += delta
        chunks += 1
        // Asymptotic progress from output size (JSON plans are typically 1.5–4k chars)
        const approx = 1 - Math.exp(-(content.length || chunks * 24) / 900)
        report(0.1 + approx * 0.85, `${label} (${Math.round(approx * 100)}%)`)
      }
      report(0.98, 'Antwoord afronden…')
      return parseJsonFromModelText(content)
    }

    // Non-streaming fallback
    const full = reply ?? await create.call(engine.chat.completions, {
      messages,
      temperature: 0.2,
      max_tokens: GEN_MAX_TOKENS,
    })
    report(0.9, 'Antwoord verwerken…')
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
      await getEngine(onProgress)
    },
    /**
     * @param {import('../types.js').CoachContext} ctx
     * @param {{ onProgress?: (p:{progress:number,text:string})=>void }} [planOpts]
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
      // Known chips: no model load / hang — matches product budget for Speelwijze.
      if (isDeterministicAdaptInstruction(text)) {
        onProgress?.({ progress: 1, text: 'Aangepast' })
        return adaptBlockSync(ctx, block, instruction)
      }

      try {
        const messages = buildAdaptBlockMessages(ctx, block, instruction)
        const parsed = await chatJson(messages, {
          onProgress,
          label: 'Blok aanpassen…',
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
  engineSingleton = null
  engineModelId = null
  enginePromise = null
}
