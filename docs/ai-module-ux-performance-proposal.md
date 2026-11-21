# Voorstel: AI-module usability & performance

Diagnose van de huidige lokale AI-trainingsflow + concreet verbeterplan.
Gebaseerd op code-inspectie van `src/ai/*`, `Training.vue` en `AiModelSettings.vue`
(nov 2026).

**Status:** Fase A + B + C geïmplementeerd op branch
`cursor/ai-module-improvement-proposal-33b3` (progressive enrich, job-store,
download UX, device gate, engine unload, lazy Rinus SVG/rules).

---

## Samenvatting

De AI-module is architecturaal gezond: **rules-engine kiest oefeningen**, optionele
**WebLLM** (Qwen 0.5B via `@mlc-ai/web-llm`) schrijft briefing/rationale. De pijn die
je ziet zit vooral in **UX-timing**, **progress-state** en **telefoonbelasting** —
niet in “AI werkt niet”.

| # | Symptoom | Root cause (kort) |
|---|---|---|
| 1 | Download-progress voelt raar | Progress is niet-monotoon; elke download wist eerst alle caches; status = preference-timestamp i.p.v. echte cache |
| 2 | Oefeningen “klaar”, uitleg duurt lang | Rules-skeleton is instant; LLM schrijft daarna één groot JSON-plan (tot 2048 tokens, mogelijk 2e repair-pass); UI hydrateert pas aan het eind |
| 3 | Zwaar op telefoon | ~0.6 GB model + WebGPU-inferentie + grote Rinus-payload op één Training-route; capability-check is alleen “heeft WebGPU?” |
| 4 | Wegnavigeren → progress weg | `isGenerating` / progress / `coachBriefing` leven alleen in component-refs; geen `<keep-alive>`; geen job-store |

**Aanbevolen productrichting:** rules blijven de snelle “training maken”; lokale LLM
wordt een **optionele enrichment-laag** (briefing + cues), met progressieve UI en
persistente job-state — niet een blocking “wacht tot alles klaar is”-stap.

---

## Huidige pipeline (zoals gebouwd)

```
[Generate knop]
    → buildSkeletonFromRules()     ~ms   echte oefeningen
    → retrieveCandidates()         ~ms
    → coach.planSession()          5–30s+ als WebLLM aan
         └─ JSON: title, coachBriefing, blocks[], whyThis, cues
         └─ bij validatiefout: 2e generatie (repair)
    → hydrateSessionPlan()         atomair in UI
    → sessionBlocks + coachBriefing verschijnen samen
```

Relevante ankers:

- Orchestrator: `src/ai/orchestrateSession.js`
- WebLLM: `src/ai/models/webllmCoach.js` (`GEN_MAX_TOKENS = 2048`)
- Download UI: `src/components/training/AiModelSettings.vue`
- Generate UI: `src/views/Training.vue` (`generate()`, `persistDraft()`)
- Prefs/storage: `src/ai/aiPreferences.js`
- Design doc (deels verouderd t.o.v. default model): `docs/ai-coach-slice-1-2.md`

Default model in code: `Qwen2.5-0.5B-Instruct-q4f16_1-MLC` (~0.6 GB).  
Docs noemen soms nog 1.5B als default — **doc drift**.

---

## Diagnose per melding

### 1. Download werkt raar in progress

**Wat er gebeurt**

1. Op “Download” roept `downloadModel()` eerst `resetWebLlmEngineCache()` +
   `clearWebLlmStorage()` aan. Die laatste wist **alle** origin Cache API-entries
   (niet alleen WebLLM), plus OPFS/IndexedDB-matches. De balk staat lang op 0% met
   tekst “opslag opschonen”.
2. Daarna geeft WebLLM `initProgressCallback` fases (fetch → cache → compile) die
   `report.progress` vaak **terugzetten**. In `AiModelSettings` wordt progress
   **niet** monotoon gemaakt (`Math.max` ontbreekt, in tegenstelling tot generate).
3. Na succes zet `finally` progress direct op 0 → korte flash van lege balk.
4. Status “Aan / gedownload” = aanwezigheid van `downloadAcceptedAt` in
   `localStorage`, **niet** een echte OPFS/cache-probe. Gedeeltelijke downloads of
   opgeschoonde browserdata geven een verkeerde status.

**Gebruikersgevoel:** balk springt terug, hangt op 0%, springt naar 100%, of zegt
“aan” terwijl het model er niet is.

### 2. AI aan → oefeningen lijken klaar, uitleg duurt lang

**Geen TTS** in de codebase. “Uitleg” = `coachBriefing` + per-blok `whyThis` /
`coachingCues`.

De orchestrator toont snel “Basisplanning maken…” / “Oefeningen zoeken…” (~4–14%),
daarna blijft de balk lang hangen op “AI schrijft trainingsplan…”. De prompt vraagt
het 0.5B-model om een **volledig SessionPlan-JSON** inclusief Nederlandse briefing
en narratie per blok. Dat is zwaar voor het model; bij validatiefalen volgt een
**tweede** volle generatie.

De UI past oefeningen **pas toe als het hele plan klaar is**. Gebruikers lezen de
vroege progress-teksten alsof de oefeningen al klaar zijn, terwijl ze die nog niet
zien — of (als ze de rules-flow kennen) verwachten ze instant resultaat zoals zonder
AI.

Daarna kan rules-narratie (`fillPlannedBlockNarration`) lege `whyThis` alsnog
vullen → lange wacht, soms template-achtige uitleg.

### 3. Erg zwaar voor een telefoon

| Factor | Impact |
|---|---|
| WebGPU + WebLLM in-browser | Warm GPU/CPU, batterij, soms tab-freeze |
| Model ~0.6 GB resident | Opslag + RAM; mid-range Android faalt sneller |
| Capability gate | Alleen `navigator.gpu.requestAdapter()` — geen RAM/quota/thermal-check |
| Engine singleton | Blijft in geheugen voor de tab; geen unload bij background |
| Training-route payload | Grote Rinus SVG/meta-maps (~1+ MB JS) naast AI-UI |
| Download wipe | `caches.delete` op **alle** origin caches → agressief en traag |

Perf-budget in de oude slice-doc (“volle JSON &lt; 8s op mid Android”) is aspiratief;
er is geen timeout/cancellation in code.

### 4. Wegnavigeren tijdens genereren → progress weg

Bevestigd door architectuur:

1. `isGenerating`, `generateProgress`, `generateStatus`, `coachBriefing` zijn
   **component `ref`s** in `Training.vue`.
2. `App.vue` rendert `<RouterView>` **zonder** `<keep-alive>`; leave vernietigt de
   view.
3. Er is geen Pinia-/module-“generation job”; geen resume bij remount.
4. `persistDraft()` slaat blocks (+ `ai` meta) op, maar **niet** `coachBriefing`.
5. `generate()` heeft geen `AbortController`. Werk kan doorlopen na unmount, maar
   de progress-UI is weg. Terugkomen toont de oude draft; als de detached instance
   alsnog `persistDraft()` schrijft, is dat racey en zonder briefing/progress-UX.

---

## Productvoorstel: hoe AI beter inzetten

### Kernprincipe

> **Rules = snelle bruikbare training. Lokale LLM = optionele rijkere coach-laag.**

Coach op het veld wil eerst: welke oefeningen, hoe lang, in welke volgorde.
Briefing en sideline-cues zijn waardevol, maar mogen **niet** de first paint
blokkeren.

### Gewenste gebruikersflow

1. Tik **Training maken** → binnen ~300 ms: session met rules-oefeningen zichtbaar
   (zelfde kwaliteit als “AI uit”).
2. Als lokale AI aan staat: banner “Coach schrijft briefing…” + progress die
   **nav-safe** is (job in store).
3. Briefing + cues streamen/verschijnen progressief op de al zichtbare blokken.
4. Timeout of fout → training blijft bruikbaar; eerlijke label `engine: rules`
   (geen faux-AI-copy).
5. Download is een **eenmalige setup** met duidelijke fases, niet onderdeel van
   elke generate.

### Wat de LLM wél / niet moet doen

| Doen (kleine prompt/output) | Niet (te zwaar / al rules) |
|---|---|
| `coachBriefing` (1–3 zinnen NL) | Volledige exercise-selectie opnieuw |
| Korte `whyThis` / 2–3 `coachingCues` per blok | Lange `description`/`setup`/`rules` herschrijven |
| Focus vanavond respecteren (`ctx.focus`) | Fantasy drills zonder schema |
| Speelwijze-chips → blijven rules (al zo) | Blocking repair-pass zonder timeout |

Optionele modes in UI:

- **Slimme planning** (default, rules only) — altijd instant
- **Met coachbriefing** (LLM, als gedownload) — enrichment
- Later: cloud boost / voice (buiten huidige scope)

### Focus-veld inschakelen

`buildCoachContext` ondersteunt al `focus`; Training-UI heeft geen input.
Eén veld “Focus vanavond” (bijv. “druk zetten”, “opbouw links”) geeft de LLM een
duidelijkere taak en betere briefing-ROI t.o.v. generieke JSON-regeneratie.

---

## Verbeterplan (gefaseerd)

### Fase A — Quick wins (lage risico, hoge UX-winst)

1. **Monotone download-progress**  
   `progress = Math.max(prev, clamped)` + vaste fases: opschonen → downloaden →
   klaarzetten → klaar. Geen raw WebLLM-tekst in de knop.
2. **Download wipe versmallen**  
   Alleen WebLLM/OPFS/gerelateerde caches wissen; niet default alle origin caches.
   “Opschonen & opnieuw” blijft de agressieve path.
3. **Echte download-status**  
   Probe OPFS/cache i.p.v. alleen `downloadAcceptedAt`.
4. **Persist `coachBriefing` (+ engine)** in `draftSession`.
5. **Generation job in Pinia/module singleton**  
   `status | progress | text | startedAt | plan?` overleeft route-leave; Training
   remount herbindt UI. Optioneel snackbar “Training wordt nog gemaakt…”.
6. **Timeout + soft fallback**  
   Bijv. na 12–15 s op mid devices: accepteer skeleton + rules-narratie; stop LLM.
7. **Docs sync**  
   Default model 0.5B, banner/focus-status bijwerken in `ai-coach-slice-1-2.md`.

### Fase B — Progressive generate (kernperformance)

1. Orchestrator split:
   - `planStructure()` → rules skeleton, **direct** hydrateren in UI
   - `enrichNarration(plan)` → LLM alleen briefing + cues (veel kleinere
     prompt/output, lagere `max_tokens`, bv. 512–768)
2. Geen of hoogstens één korte repair; bij fail → rules-narratie.
3. Progress-copy eerlijk: “Oefeningen klaar” → “Briefing schrijven…”.
4. AbortController bij “annuleren” of (optioneel) bij leave.

### Fase C — Telefoon licht houden

1. Strengere device gate: WebGPU **én** `storage.estimate` free ≥ modelmaat × 1.3
   **én** heuristiek (geen low-end zonder `deviceMemory` ≥ 4 indien beschikbaar).
2. Engine unload bij `visibilitychange` / idle na N minuten.
3. Lazy-load Rinus SVG/meta pas bij openen exercise-detail.
4. Generatie-UI op mobile: compacte sticky progress i.p.v. zware start-panel
   + modelsettings tegelijk open.
5. Optioneel: “AI pauzeren op batterijbesparing” via `navigator.getBattery` als
   beschikbaar.

### Fase D — Productwaarde verhogen (na stabiliteit)

1. UI voor **Focus vanavond**.
2. “Alleen slimme planning”-shortcut die WebLLM nooit raakt, ook al is het
   gedownload (expliciete snelle path).
3. Post-session feedback (“was briefing nuttig?”) → later betere prompts / geen
   LLM als user altijd dismiss’t.
4. README-sectie AI (offline, opt-in, ~0.6 GB, WebGPU).

---

## Voorgestelde meetlat

| Metric | Doel |
|---|---|
| Time-to-first-exercises (AI aan) | ≤ 500 ms (rules hydrate) |
| Time-to-briefing (0.5B, warm engine) | ≤ 8 s mid Android; hard timeout 15 s |
| Download progress | Nooit achteruit; fases in NL |
| Nav away/back tijdens generate | Progress + status zichtbaar; briefing bewaard |
| Memory na leave Training | Engine unload of gemarkeerd idle |
| Fallback-transparantie | `engine` label klopt; geen “AI”-copy bij rules |

---

## Aanbevolen volgorde van implementatie

1. Fase A.1–A.5 + A.7 (progress, persist, job-store) — lost melding 1 + 4 grotendeels op  
2. Fase B (progressive enrich) — lost melding 2 + groot deel van 3 (minder tokens) op  
3. Fase C (device gate + unload + lazy assets) — telefoon  
4. Fase D (focus + product polish)

Geschatte impact: **A+B** verandert de beleving het meest zonder nieuw model of
cloud. Groter model (1.5B) is **niet** de eerste remedie voor telefoon; kleinere
prompts wel.

---

## Out of scope (bewust)

- Cloud LLM / API-keys (breekt offline-first belofte)
- TTS / voice sideline (slice 3+)
- Generatieve SVG-oefeningen
- Vervangen van `generateTraining()` als enige planner

---

## Referentie: bestanden om te raken bij uitvoering

| Wijziging | Primair bestand |
|---|---|
| Monotone download + fases | `AiModelSettings.vue`, `webllmCoach.js` |
| Selectieve cache wipe | `aiPreferences.js` (`clearWebLlmStorage`) |
| Job-store + remount | nieuw `stores/aiJobStore.js` of module; `Training.vue` |
| Persist briefing | `Training.vue` `persistDraft` / `loadDraft`; eventueel `teamStore` |
| Progressive enrich | `orchestrateSession.js`, `planSessionPrompt.js`, `webllmCoach.js` |
| Focus UI | `TrainingSettingsPanel.vue` + `buildCoachContext` call site |
| Device gate | `canRunLocalLlm.js` |
| Keep-alive (alleen als job-store niet genoeg is) | `App.vue` — liever job-store dan keep-alive van hele Training |
