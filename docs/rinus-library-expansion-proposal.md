# Voorstel: Rinus-oefeningenbibliotheek uitbreiden & synchroniseren

Doel: de offline trainingsbibliotheek van TeamPilot sterk uitbreiden met officiële KNVB Rinus-oefeningen, en de sync-pipeline betrouwbaar en herhaalbaar maken — zonder de app traag of onoverzichtelijk te maken.

---

## Huidige situatie

| Bron | Aantal |
|---|---|
| Curated oefeningen (`exercises.js`) | 52 |
| Auto-import batch (`rinusExercises.generated.js`) | 96 |
| **Totaal in TeamPilot** | **148** |
| Rinus outdoor (search API) | ~7 800 |
| Rinus totaal (site) | ≥10 000 |

Verdeling nu (na leeftijd/filters ziet de coach per team vaak ~70–100):

| Categorie | Nu |
|---|---|
| Warming-up | 23 |
| Techniek | 40 |
| Tactiek | 29 |
| Conditie | 18 |
| Partijvorm | 25 |
| Afsluiting | 13 |

### Wat al werkt

- Discovery via `scripts/import-rinus-exercises.mjs` (Rinus search API, outdoor + SVG + officiële author)
- Content sync via `scripts/sync-rinus-content.mjs` → SVG-URL’s, spelregels, meta (duur, veldgrootte, leeftijd, ratings)
- Extra ratings-pass: `scripts/sync-rinus-reality.mjs`
- Bibliotheek-UI: zoeken, categorie, voetbal-echtheid, “alleen geschikt”
- Training engine + AI-coach gebruiken dezelfde catalogus

### Wat knelt

1. **Harde import-limieten** in `IMPORT_PLAN` (~96 slots) — bewust klein gehouden na de eerste uitbreiding (PR #17: 50 → 150).
2. **Sync is handmatig** — geen CI/periodieke refresh; meta kan stil verouderen.
3. **Grote catalogus ≠ bruikbare UX** — zonder betere filters/zoeken wordt “meer” vooral ruis.
4. **Bundle-grootte** — huidige Rinus-data ~400 KB bron; lineair meeschalen naar duizenden oefeningen breekt offline-first en Pages-build.
5. **Dubbele mapping** — curated ids + `rinus-*` ids + drie parallelle maps; onderhoud wordt zwaarder bij schaal.

---

## Uitgangspunten

1. **Alleen officiële outdoor-oefeningen met SVG** (zelfde eligibility als nu: `authorId === 1`, geen user-generated, outdoor, met diagram).
2. **Offline-first blijft leidend** — de coach moet zonder netwerk kunnen plannen; sync is maintainer/CI-werk, niet runtime.
3. **Kwaliteit boven maximalisatie** — liever 400–800 goed getagde drills dan 5 000 half-bruikbare.
4. **Bibliotheek moet filterbaar blijven** op leeftijd, categorie, spelersaantal, voetbal-echtheid, en (nieuw) Rinus-activiteit / doelstelling.
5. **Geen runtime scraping** van rinus.knvb.nl in de browser (fragiel, ToS/rate-limit, breekt offline).

---

## Aanbevolen strategie: drie fasen

### Fase A — Snelle win (doel: ~400–500 oefeningen)

**Scope:** limieten in `IMPORT_PLAN` verhogen, dedupe aanscherpen, sync opnieuw draaien. Geen architectuurwijziging.

Voorgestelde targets (indicatief):

| Categorie | Nu (import) | Voorstel A |
|---|---|---|
| warming-up | 18 | 50 |
| techniek | 22 | 100 |
| tactiek | 18 | 80 |
| conditie | 12 | 40 |
| partijvorm | 18 | 90 |
| afsluiting | 8 | 30 |
| **Import-batch** | **96** | **~390** |
| **Totaal catalogus** | **148** | **~440** |

Werkzaamheden:

- `IMPORT_PLAN` limieten + page-guard verhogen (`guard < 8` → genoeg voor diepere paginatie)
- Import opnieuw draaien → `sync-rinus-content.mjs`
- README-cijfers bijwerken
- Spot-check: O8 / O12 / Senior bibliotheek-counts + 5 detail-dialogs (SVG + regels)

**Risico’s:** grotere JS-bundle (~1–1,5 MB bron voor maps); library scroll wordt langer — filters zijn al aanwezig.

**Acceptatie:** `npm run test:run` + `npm run build`; O12 bibliotheek (geschikt-filter aan) ≥ ~150 zichtbare drills.

---

### Fase B — Bruikbaarheid bij schaal (doel: catalogus voelt als Rinus, niet als dump)

Zonder B wordt A al snel “meer van hetzelfde”.

| Verbetering | Waarom |
|---|---|
| Filters op **Rinus-activiteit** (passen, druk zetten, …) en **doelstelling** | Coaches zoeken vaak op spelmoment, niet op TeamPilot-categorie |
| Virtuele lijst / lazy render in `ExerciseLibraryPanel` | 400+ rijen soepel op telefoon |
| Betere dedupe: genormaliseerde titel **+** rinusId + near-duplicate detectie | Minder “zelfde oefening, andere titel” |
| Curated set markeren als `featured` / preferentie in engine-scoring | Auto-generate blijft stabiel en herkenbaar |
| Optioneel: lazy-load meta/rules per oefening (alleen index + SVG-URL in hoofdbundle) | Houdt initial load klein |

Data-model toevoeging (op geïmporteerde drills):

```js
{
  rinusActivities: ['Passen', 'Vrijlopen'],
  rinusObjectives: ['Opbouwen', 'Positiespel'],
  featured: false, // true alleen voor curated / handmatig goedgekeurd
}
```

Engine: `scoreExercise` krijgt lichte boost voor `featured` en voor match op activiteiten die bij `trainingType` / cycle theme horen.

---

### Fase C — Duurzame sync & optionele “full catalog” laag

**C1. Maintainer-sync automatiseren**

- GitHub Action (handmatig + maandelijks): `import` (alleen ids/metadata-delta) → `sync-rinus-content` → PR met diff
- Fail soft bij rate-limits; schrijf sync-rapport (`docs/rinus-sync-report.md` of artifact)
- Nooit force-push generated files zonder review

**C2. Catalogus-architectuur (als we richting 1 000+ gaan)**

Aanbevolen split:

| Laag | Inhoud | Load |
|---|---|---|
| **Core** (~400–600) | Curated + hoogste-kwaliteit import (SVG, ratings ≥3, breed leeftijdsbereik) | Altijd in bundle |
| **Extended index** | Lichte records: id, title, category, ages, players, reality, activities | Altijd of lazy chunk |
| **Detail on demand** | Spelregels + lange description | Lazy chunk of IndexedDB na eerste sync |

Runtime blijft offline voor Core. Extended kan:

- als Vite dynamic import / aparte chunk, of
- eenmalig gedownload en in `localStorage`/`IndexedDB` gecached (opt-in “Meer oefeningen laden”)

**C3. Legal / attribution**

- Blijf bronvermelding “KNVB Rinus” + deeplink per oefening
- Geen bulk herdistributie van SVG-bestanden in de repo (alleen CDN-URL’s, zoals nu)
- Rate-limit respecteren in scripts (bestaande sleeps behouden / verhogen)

---

## Wat we bewust níet doen (nu)

| Optie | Reden |
|---|---|
| Alle ~7 800 outdoor drills in de JS-bundle | Bundle + UX + maintenance exploderen |
| Live API-calls vanuit de app bij elk bibliotheek-bezoek | Breekt offline-first; afhankelijk van KNVB-API |
| User-generated Rinus-content importeren | Kwaliteit/ variatie onvoorspelbaar |
| Indoor/zaal meenemen | TeamPilot is outdoor grassroots-first; later optioneel |
| Curated set weggooien | Engine + tests + “bekende” drills leunen erop |

---

## Beslispunten voor product

Kies één richting zodat implementatie kan starten:

1. **Alleen Fase A** — limieten omhoog, sync, klaar (~440 drills).
2. **A + B** *(aanbevolen)* — uitbreiden én bibliotheek/engine klaar maken voor schaal.
3. **A + B + C1** — plus maandelijkse sync-PR via CI.
4. **Full C** — pas als we bewust richting 1 000+ en lazy catalog willen.

Aanbevolen default: **optie 2**, met C1 als follow-up zodra A+B stabiel is.

### Concrete default-targets bij optie 2

- Catalogus: **~450–500** built-in drills
- Per leeftijdsgroep (geschikt-filter): **≥150** zichtbaar voor O11–O13, **≥100** voor O8–O10
- Bundle-impact: brondata bij voorkeur **&lt; 1,5 MB**; anders detail-lazy (B)
- Engine: curated/`featured` blijft dominant in auto-generate; library toont de volle breedte

---

## Implementatievolgorde (na akkoord)

1. Branch: limieten + eventuele `activities`/`objectives` in import-mapper
2. `node scripts/import-rinus-exercises.mjs`
3. `node scripts/sync-rinus-content.mjs`
4. Library filters + virtualisatie (Fase B)
5. Tests: counts per age, dedupe, library filter, engine smoke
6. README + korte sync-checklist in `docs/`
7. (Later) GitHub Action voor sync-PR

Geschatte invasiviteit:

- Fase A: laag (scripts + generated data)
- Fase B: medium (UI + scoring + data fields)
- Fase C: medium–hoog (CI + eventueel lazy storage)

---

## Succescriteria

- Coach ziet **merkbaar meer** relevante Rinus-drills per leeftijd/categorie dan nu (~148).
- Detail-dialog blijft Rinus-pariteit: SVG, spelregels, veldgrootte, leeftijd, ratings.
- Auto-generate / AI-coach wordt niet slechter (geen random ruis; featured/scoring beschermt kwaliteit).
- Offline blijft werken zonder Rinus-netwerk.
- Sync is reproduceerbaar met twee commands (plus later CI).

---

## Open vragen

1. Wil je **indoor/zaal** ooit meenemen, of strikt outdoor houden?
2. Mag de bibliotheek een opt-in “uitgebreide catalogus” hebben (download/cache), of alles in de standaard bundle?
3. Moeten curated Nederlandse teksten leidend blijven, of altijd Rinus-titel/beschrijving tonen (zoals de detail-dialog nu al deels doet)?

---

## Referenties in de codebase

| Stuk | Pad |
|---|---|
| Catalogus | `src/data/exercises.js`, `src/data/rinusExercises.generated.js` |
| Import | `scripts/import-rinus-exercises.mjs` |
| Sync | `scripts/sync-rinus-content.mjs`, `scripts/sync-rinus-reality.mjs` |
| Maps | `src/data/rinusSvgMap.js`, `rinusRulesMap.js`, `rinusMetaMap.js` |
| Engine | `src/utils/trainingEngine.js` |
| Library UI | `src/components/training/ExerciseLibraryPanel.vue` |
| Vorige uitbreiding | PR #17 (~50 → ~150) |
