<p align="center">
  <img src="public/logo-mark.svg" alt="TeamPilot logo" width="96" height="96" />
</p>

<h1 align="center">TeamPilot</h1>

<p align="center">
  <strong>Plan. Line up. Train. Share.</strong><br>
  The offline-first web app for Dutch grassroots football coaches.
</p>

<p align="center">
  Vue 3 · Offline-first · No account · Works on phone &amp; desktop
</p>

---

TeamPilot helps you run your team from the sideline — without spreadsheets, without logins, and without waiting for a connection. Build lineups on a drag-and-drop pitch, generate smart training sessions for who's actually present, and share everything with assistants or parents in one tap.

Built for **JO8 through Senior**, with KNVB competition classes, Rinus-style exercises, and data that stays on your device.

## Features

- **Team management** — create teams with custom shirt colors, age group, and KNVB competition class (6e klasse through hoofdklasse)
- **Player roster** — add players with name, number, and position
- **Lineup builder** — drag-and-drop formation editor with pre-built formations per age group
  - JO8–10: 6v6 · JO11–12: 8v8 · JO13+ / Senior: 11v11
  - Formation snap, free positioning mode
  - Switch between saved lineups via dropdown (with unsaved-changes dialog)
  - Delete lineups from the dropdown
  - Placeholder positions snap back to formation on player removal
  - Bench panel with drag-to-field and drag-to-bench support
- **Training planner** — generate sessions based on:
  - Present players and position balance (attackers vs defenders)
  - Training type (techniek, tactiek, conditie, gemengd, partij)
  - Duration (default 60 min), age group, and KNVB class
  - 4-week exercise rotation with feedback learning
  - Editable training overview (reorder, duration, remove exercises)
  - Share training via link (WhatsApp); recipients view without needing the same team
  - Manual selection from a local exercise library (~50 built-in exercises)
  - **Custom exercises** — create your own drills (title, description, setup, rules, optional SVG diagram); stored per team in localStorage; shareable in training links
  - Built-in exercises use official KNVB Rinus SVG diagrams, spelregels, and metadata (offline)
- **Share lineup via link** — two modes:
  - *Inclusief team* — bundles full roster; receiver imports team + lineup in one tap
  - *Alleen opstelling* — embeds player names only; receiver matches to their own team
- **Share lineup as image** — PNG export, shareable via WhatsApp
- **Team sharing** — share team + roster via link; handles name conflicts (merge or copy)
- **Offline-first** — all data persists in localStorage, no backend needed

## Tech Stack

| Layer | Choice |
|---|---|
| UI | Vue 3 + Vite |
| State | Pinia |
| Routing | Vue Router 4 (hash-based) |
| Tests | Vitest + Vue Test Utils |

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run test       # run tests (watch mode)
npm run test:run   # run tests once
```

### Sync Rinus exercise content (maintainers)

Built-in exercise diagrams, spelregels, titles and player counts are fetched from [KNVB Rinus](https://rinus.knvb.nl/) and stored as static maps. To refresh after updating `src/data/rinusLinks.js`:

```bash
node scripts/sync-rinus-content.mjs
```

This regenerates `src/data/rinusSvgMap.js`, `rinusRulesMap.js`, and `rinusMetaMap.js`. Requires network access.

## Sharing

### Lineup link

In the lineup builder, tap the **Link** button (mobile toolbar or desktop sidebar):

| Option | What's sent | Import behaviour |
|---|---|---|
| Inclusief team | Team + roster + positions | Creates team & lineup, or adds to existing team if name matches |
| Alleen opstelling | Positions + player names | Receiver picks a local team; players matched by name/number |

The shared URL opens a read-only field view (`#/view?lineup=…`). From there the receiver can import with one tap.

### Team link

On the Dashboard, tap **Team delen** to share the team roster. The receiver can import as a new team, merge into an existing one, or cancel.

## Training Engine

Training suggestions use a local rule-based engine — no API, no cloud. The engine considers:

| Input | Effect |
|---|---|
| **Competitieklasse** | 6e t/m hoofdklasse — sets exercise difficulty |
| **Aanwezige spelers** | All selected by default; uncheck absent players |
| **Positiebalans** | Extra attack or defence drills when the squad is unbalanced |
| **Feedback** | Thumbs up/down per exercise shapes future suggestions |
| **Cycle week** | Theme fixed for the calendar week; advances automatically |

The built-in library ships ~50 exercises offline. Each links to [KNVB Rinus](https://rinus.knvb.nl/); titles, SVG diagrams and spelregels come from synced metadata.

### Custom exercises

In **Training → Handmatig kiezen → Eigen oefening** you can add team-specific drills:

| Field | Description |
|---|---|
| Titel, categorie, duur, spelers | Same metadata as built-in exercises |
| Beschrijving, opstelling, spelregels | Free text; one rule per line |
| Schema (SVG) | Optional diagram from your device (max 400 KB) |

Custom exercises have no Rinus link. They appear in the library with a pencil badge and travel with shared training links — recipients get the full exercise embedded in the URL. **In mijn team** also saves them locally.

### Training link

Tap **Delen** in the training overview to share via WhatsApp or copy a link. Opens `#/training/view?training=…` — no team import required. Optionally load into your own team via **In mijn team**.

## Data storage

Everything lives in `localStorage` under the key `teampilot_v1`:

- Teams, players, lineups, shirt colors
- Training state per team (draft session, feedback, cycle week, recent exercises)
- Custom exercises per team (`customExercises`)

## Coordinate System

- Storage: `y=0` at opponent goal, `y=100` at own goal (GK near `y=0`)
- Display: flipped via `displayY = flipped ? 100 - y : y` (default: GK at bottom)
- Formation slot positions snap back to origin on player removal

## Browser Support

Chrome/Edge 90+ · Firefox 88+ · Safari 15+ · iOS Safari · Chrome Android
