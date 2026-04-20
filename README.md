# TeamPilot

A responsive web app for managing football teams, building lineups, and sharing formations.

## Features

- **Team management** — create teams with custom shirt colors, organized by age group
- **Player roster** — add players with name, number, and position
- **Lineup builder** — drag-and-drop formation editor with pre-built formations per age group
  - JO8–10: 6v6 · JO11–12: 8v8 · JO13+ / Senior: 11v11
  - Auto-assign, formation snap, free positioning mode
  - Placeholder positions snap back to formation on player removal
  - Bench panel with drag-to-field and drag-to-bench support
- **Share lineup via link** — two modes:
  - *Inclusief team* — bundles full roster; receiver imports team + lineup in one tap
  - *Alleen opstelling* — embeds player names only; receiver matches to their own team
- **Share lineup as image** — PNG export, shareable via WhatsApp
- **Team sharing** — share team + roster via link; handles name conflicts (merge or copy)
- **Offline-first** — all data persists in localStorage, no backend needed

## Tech Stack

- Vue 3 + Vite
- Pinia (state)
- Vue Router 4 (hash-based)
- Vitest + Vue Test Utils

## Getting Started

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production bundle → dist/
npm run test       # run tests
```

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

## Coordinate System

- Storage: `y=0` at opponent goal, `y=100` at own goal (GK near `y=0`)
- Display: flipped via `displayY = flipped ? 100 - y : y` (default: GK at bottom)
- Formation slot positions snap back to origin on player removal

## Browser Support

Chrome/Edge 90+ · Firefox 88+ · Safari 15+ · iOS Safari · Chrome Android
