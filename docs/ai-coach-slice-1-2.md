# TeamPilot AI Coach — Slice 1–2 Implementation Plan

Concrete build plan for:

1. **Slice 1 — AI Architect** (orchestrator + retrieval + structured plans; no model download required)
2. **Slice 2 — Local LLM adapter** (WebLLM behind `CoachModel`, JSON repair, fallback)

Out of scope here: voice sideline mode, cloud boost, generative SVG forge (Slices 3–5).

---

## Goals

- One Training entry: **AI-training maken**
- Output hydrates the **existing** session UI (`sessionBlocks` in `Training.vue`)
- Plans always respect: present player count, age group, KNVB level, training type, duration, cycle theme, recent exercises
- Offline-first: Slice 1 works with zero network; Slice 2 downloads a model **once, opt-in**
- Never free-form chat as the product surface — structured session JSON only

Non-goals for 1–2:

- Replacing `generateTraining()` entirely (it becomes the safety skeleton / fallback)
- Cloud API requirement
- Voice input
- Inventing unbounded fantasy drills without schema validation

---

## Current anchors in the codebase

| Piece | Location | Role after AI |
|---|---|---|
| Rule engine | `src/utils/trainingEngine.js` | Skeleton + fallback + candidate pool |
| Exercise library | `src/data/exercises.js` + Rinus maps | Retrieval corpus |
| Custom exercises | `src/utils/customExercises.js` | Persist generated drills later (Slice 3); reuse schema now |
| Training UI | `src/views/Training.vue` | Entry point + hydrate `sessionBlocks` |
| Draft persistence | `teamStore.saveDraftSession` | Unchanged |
| Share | `src/utils/trainingShare.js` | Unchanged for Slice 1–2 (generated blocks still resolve via exercise ids / custom embed) |

---

## Data shapes

Add `src/ai/types.js` (JSDoc typedefs; plain objects at runtime).

### `CoachContext` — inputs to every plan/adapt call

```js
/**
 * @typedef {object} CoachContext
 * @property {string} ageGroup          // 'O8'…'O13' | 'Senior'
 * @property {number} knvbLevel         // 1–7 from getKnvbLevel()
 * @property {string} knvbClass         // '5e' etc.
 * @property {string} trainingType      // techniek|tactiek|conditie|gemengd|partij
 * @property {number} durationMin
 * @property {number} cycleWeek
 * @property {string} cycleTheme
 * @property {number} playerCount
 * @property {Array<{id:string,name:string,position:string}>} presentPlayers
 * @property {string[]} recentExerciseIds
 * @property {string} [focus]           // free text, e.g. "druk zetten"
 * @property {{needsAttackFocus:boolean,needsDefenceFocus:boolean,counts:object}} balance
 * @property {'nl'} locale
 */
```

Build with a pure helper:

`src/ai/buildCoachContext.js` ← reads team + Training UI state (no Pinia import inside model layer).

### `SessionPlan` — canonical AI output

```js
/**
 * @typedef {object} PlannedBlock
 * @property {'rinus'|'library'|'generated'} source
 * @property {string} [exerciseId]      // required unless source==='generated'
 * @property {string} title
 * @property {string} category          // warming-up|techniek|…
 * @property {number} durationMin
 * @property {number} minPlayers
 * @property {number} maxPlayers
 * @property {string} description
 * @property {string} setup
 * @property {string[]} rules
 * @property {string[]} adaptations     // player-count / no-GK tweaks
 * @property {string[]} coachingCues    // sideline Dutch
 * @property {string} [whyThis]         // short rationale for tonight
 */

/**
 * @typedef {object} SessionPlan
 * @property {string} title
 * @property {string} coachBriefing     // 1–3 sentences Dutch
 * @property {number} durationMin
 * @property {string} theme
 * @property {PlannedBlock[]} blocks
 * @property {'rules'|'local-llm'} engine
 * @property {string} [modelId]
 */
```

### Validation

`src/ai/validateSessionPlan.js`

- Zod (or hand-rolled validators if we want zero new deps in Slice 1 — prefer **Zod** once LLM lands in Slice 2)
- Rules:
  - `blocks.length` between 4 and 8
  - categories cover warming-up + afsluiting when duration ≥ 45
  - each `durationMin` ∈ [4, 30]
  - sum of durations within `durationMin ± 15%`
  - `exerciseId` must exist in library **or** `source === 'generated'` with full fields
  - `minPlayers ≤ playerCount` after adaptations (or adaptations must mention grouping)

On failure: run **repair** (Slice 2) or fall back to rules skeleton (Slice 1).

### Hydration into Training UI

`src/ai/hydrateSessionPlan.js`

```js
// SessionPlan → { exercise, durationMin }[] compatible with makeBlock()
```

- `library` / `rinus` → `getExerciseById(id)` + overlay `adaptations` / `coachingCues` onto block meta (store on the block object, not on the shared exercise definition)
- `generated` → `buildCustomExercise(...)` shape, `id: custom-ai-${timestamp}`, mark `source: 'AI Coach'` for later badge

Extend session block shape lightly in `Training.vue`:

```js
{
  uid, exercise, durationMin,
  ai?: { whyThis, adaptations, coachingCues, engine }
}
```

Draft save should persist `ai` meta (add to `saveDraftSession` mapping).

---

## `CoachModel` API

File: `src/ai/coachModel.js`

```js
/**
 * @typedef {object} CoachModel
 * @property {string} id
 * @property {() => Promise<'ready'|'needs-download'|'unsupported'|'offline-rules'>} status
 * @property {(ctx: CoachContext) => Promise<SessionPlan>} planSession
 * @property {(ctx: CoachContext, block: PlannedBlock, instruction: string) => Promise<PlannedBlock>} adaptBlock
 * @property {(ctx: CoachContext, block: PlannedBlock) => Promise<string>} explainBlock
 * @property {(onProgress?: (p:{progress:number,text:string})=>void) => Promise<void>} [ensureReady]
 */
```

### Implementations

| Id | File | Slice |
|---|---|---|
| `rules-v1` | `src/ai/models/rulesCoach.js` | 1 |
| `webllm-v1` | `src/ai/models/webllmCoach.js` | 2 |

### Factory

`src/ai/createCoach.js`

```js
export async function createCoach(preferences = {}) {
  // 1) if user enabled local LLM && WebGPU available → webllm-v1
  // 2) else → rules-v1
}
```

Preferences in `localStorage` key `teampilot_ai_v1`:

```js
{
  preferLocalLlm: false,      // opt-in
  modelId: 'Qwen2.5-1.5B-Instruct-q4f16_1',
  downloadAcceptedAt: null
}
```

### Orchestrator (the real product brain)

`src/ai/orchestrateSession.js`

```js
export async function orchestrateSession(ctx, coach) {
  const skeleton = buildSkeletonFromRules(ctx)       // wrap generateTraining()
  const candidates = retrieveCandidates(ctx, skeleton)
  const plan = await coach.planSession({ ...ctx, skeleton, candidates })
  const validated = validateSessionPlan(plan, ctx)
  if (!validated.ok) {
    return finalizeRulesFallback(skeleton, ctx, validated.errors)
  }
  return validated.plan
}
```

**Important:** even `webllm-v1` receives `skeleton` + `candidates` so the model mostly **selects, orders, adapts, and narrates** — it does not invent the whole universe from scratch.

---

## Slice 1 — Rules coach + retrieval + UI

### 1A. Retrieval

`src/ai/retrieveCandidates.js`

- Input: `CoachContext` + optional category
- Use existing `filterExercises` / `browseExercises`
- Rank with current `scoreExercise` logic (export it or duplicate thinly)
- Return top N per template slot (e.g. 5)
- Attach compact cards for prompting later:

```js
{ id, title, category, durationMin, minPlayers, maxPlayers, focusPositions, intensity }
```

No embeddings in Slice 1 (lexical + metadata is enough). Leave a seam:

```js
// retrieveCandidates(ctx) → later swap body for vector search
```

### 1B. `rules-v1` planSession

Algorithm:

1. Call `generateTraining({...})` → skeleton blocks  
2. For each block, attach:
   - `adaptations` from player-count helpers (reuse ideas from `exerciseText.js` group notes)
   - `coachingCues` from small Dutch template tables by category/focus
   - `whyThis` from balance + cycle theme (“Veel verdedigers aanwezig → extra druk-zetten”)
3. Build `coachBriefing` template string
4. Return `SessionPlan` with `engine: 'rules'`

`adaptBlock(ctx, block, instruction)` in Slice 1:

- Map chips/keywords: `makkelijker|moeilijker|korter|langer|geen keeper|meer druk`
- Deterministic mutations (duration ±3, rule line inject, setup tweak)
- Unknown instruction → return block unchanged + cue “Probeer: moeilijker / makkelijker / korter”

### 1C. Training UI entry

In `Training.vue` / `TrainingSettingsPanel.vue`:

1. Primary button in session empty / settings area: **AI-training maken**
2. Optional single field: **Focus vanavond** (text, max 80 chars)
3. On click:
   - `buildCoachContext(...)`
   - `orchestrateSession(ctx, await createCoach())`
   - hydrate → `sessionBlocks`
   - show briefing in a slim banner above the session list (dismissible)
4. Motion (2–3):
   - button → progress pulse
   - blocks stagger-in
   - briefing fade-in

Keep existing **Genereer** (rules-only) as secondary/advanced if already present, or fold it into AI entry (AI path *is* the generate path, powered by rules in Slice 1).

**Recommendation:** replace the main generate CTA label with **AI-training maken**; keep behavior rules-backed until Slice 2 opt-in unlocks the model.

### 1D. Block UI additions

In session item / `ExerciseDetailDialog.vue`:

- Show `whyThis` when present
- Chip row: **Makkelijker** · **Moeilijker** · **Korter** · **Langer** → `adaptBlock`
- Don’t show a chat box in Slice 1

### 1E. Tests (Slice 1)

| File | Coverage |
|---|---|
| `src/__tests__/ai/validateSessionPlan.test.js` | schema edge cases |
| `src/__tests__/ai/rulesCoach.test.js` | plan respects playerCount/age; briefing present |
| `src/__tests__/ai/orchestrateSession.test.js` | fallback on invalid plan |
| `src/__tests__/ai/hydrateSessionPlan.test.js` | library ids resolve; ai meta attached |

Acceptance criteria Slice 1:

- [ ] AI CTA produces a full session offline with no new network calls  
- [ ] 8 / 11 / 14 player counts all produce coherent adaptations  
- [ ] Draft persistence round-trips `ai` meta  
- [ ] Existing share/import tests still pass  

---

## Slice 2 — Local LLM adapter (WebLLM)

### 2A. Model tier for mid-range Android

Target device profile: **Android mid-range, Chrome with WebGPU**, ~6–8 GB RAM (e.g. recent A-series / mid Galaxy).

| Tier | Model (WebLLM prebuilt id family) | Approx. download | When |
|---|---|---|---|
| **Default mobile** | **Qwen2.5-1.5B-Instruct** q4f16_1 (or q4f32_1 if f16 flaky) | ~1.0–1.5 GB | Phones / weak GPUs |
| Laptop / desktop | Qwen2.5-3B-Instruct q4f16_1 | ~2 GB | `maxStorageBufferBindingSize` comfortable + desktop GPU |
| Fallback | `rules-v1` | 0 | No WebGPU / user declines download / load error |

**Why Qwen2.5-1.5B**

- Strong instruction following for JSON-sized outputs relative to size  
- Fits Android WebGPU realities better than 7B (7B is a crash risk; WebLLM historically limits large models on mobile)  
- Dutch is usable for short coaching cues (keep prompts bilingual: system English for schema discipline, user content Dutch)

**Capability probe** before offering download:

```js
async function canRunLocalLlm() {
  if (!navigator.gpu) return false
  const adapter = await navigator.gpu.requestAdapter()
  if (!adapter) return false
  // Prefer WebLLM helpers if available; else treat Android + low buffer as 1.5B-only
  return true
}
```

UI copy (honest):

> Lokale AI-coach downloaden (~1.2 GB). Eenmalig. Werkt daarna offline. Selectie blijft op dit apparaat.

### 2B. `webllm-v1` responsibilities

`src/ai/models/webllmCoach.js`

- Lazy-import `@mlc-ai/web-llm` (code-split; do not inflate initial Training bundle)
- `ensureReady(onProgress)` → `CreateMLCEngine(modelId, { initProgressCallback })`
- Persist engine singleton in module scope for the tab session
- `planSession`:
  1. Build compact prompt with `skeleton` + `candidates` (token budget ~2–3k)
  2. Ask for **JSON only** matching `SessionPlan`
  3. `JSON.parse` → `validateSessionPlan`
  4. If invalid → one repair prompt with error list
  5. If still invalid → `rules-v1` fallback (transparent: `engine` field reflects actual engine used)

### 2C. Prompt contract

`src/ai/prompts/planSessionPrompt.js`

System (stable):

- You are a Dutch grassroots football coaching planner for TeamPilot
- Only pick `exerciseId` values from candidates unless absolutely necessary to mark `source:"generated"`
- Respect playerCount; put practical adaptations in `adaptations[]`
- Output JSON only, no markdown

User payload:

```json
{
  "context": { "...CoachContext sans heavy player names if privacy trim..." },
  "skeleton": [{ "category", "durationMin", "exerciseId", "title" }],
  "candidatesBySlot": [[{ "id", "title", "minPlayers", "maxPlayers" }]]
}
```

Trim PII: pass positions + counts by default; player **names** optional (off by default).

### 2D. Settings UI

Small section under Training settings or a first-run dialog:

- Toggle: **Lokale AI gebruiken**
- Status: Niet gedownload / Bezig 37% / Klaar / Niet ondersteund
- Button: Download / Verwijder model (Clear Cache API / WebLLM unload)

### 2E. Perf budgets

| Action | Target |
|---|---|
| Rules plan (Slice 1) | < 50 ms |
| Local plan first token | < 2 s after model loaded |
| Local full session JSON | < 8 s on mid Android |
| adaptBlock | < 3 s |
| Model download | progress UI; cancellable |

If adapt exceeds budget: deterministic chip mutations only.

### 2F. Tests (Slice 2)

| File | Coverage |
|---|---|
| `webllmCoach.test.js` | mock engine; repair path; fallback |
| `createCoach.test.js` | preference + WebGPU matrix |
| Prompt snapshot test | candidate ids appear; JSON-only instruction present |

Do **not** run real WebLLM in CI (too heavy). Mock `MLCEngine`.

Acceptance criteria Slice 2:

- [ ] With toggle off, behavior ≡ Slice 1  
- [ ] With toggle on + mocked engine, valid `SessionPlan` hydrates UI  
- [ ] Invalid model JSON falls back without empty session  
- [ ] Bundle: Training route does not load WebLLM until opt-in  

---

## File tree to add

```
docs/ai-coach-slice-1-2.md          ← this plan
src/ai/
  types.js
  buildCoachContext.js
  validateSessionPlan.js
  hydrateSessionPlan.js
  retrieveCandidates.js
  orchestrateSession.js
  createCoach.js
  coachModel.js                     ← typedef + JSDoc only
  prompts/
    planSessionPrompt.js
    adaptBlockPrompt.js
  models/
    rulesCoach.js
    webllmCoach.js
src/__tests__/ai/
  …
```

UI touch points:

- `src/views/Training.vue`
- `src/components/training/TrainingSettingsPanel.vue`
- `src/components/training/ExerciseDetailDialog.vue`
- optional new `src/components/training/AiBriefingBanner.vue`
- optional new `src/components/training/AiModelSettings.vue`

---

## Suggested build order (PR-sized)

1. **PR A — Schema + rules coach + orchestrator** (no UI polish)  
2. **PR B — Training CTA + hydrate + briefing banner + adapt chips**  
3. **PR C — WebLLM adapter behind opt-in + settings + mocks/tests**  

Each PR must keep `npm run test:run` green and preserve offline generate without WebGPU.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Mid-range Android OOM on 3B | Default **1.5B**; probe before offer; rules fallback |
| Model invents fake Rinus ids | Candidates allow-list in prompt + validator |
| Dutch quality weak on 1.5B | Short cues; templates for briefing; LLM fills adaptations |
| Bundle bloat | Dynamic `import()` for WebLLM only after opt-in |
| Users think AI needs account | Copy: “Op jouw apparaat. Geen account.” |
| Over-promise vs rules Slice 1 | Badge engine: `Slimme planning` vs `Lokale AI` |

---

## Decision record (locked for Slice 1–2)

1. **Orchestrator + rules skeleton first**, LLM second  
2. **Qwen2.5-1.5B-Instruct q4** as default on-device model  
3. **Opt-in download**, never forced  
4. **Structured JSON only** into existing Training session model  
5. **No cloud dependency** in these slices  

---

## Next action after plan merge

Start **PR A**: `src/ai/*` rules coach + validators + tests, wired behind a feature flag `aiCoach: true` in Training so UI can ship dark until PR B.
