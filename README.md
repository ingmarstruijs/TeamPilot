# ⚽ TeamPilot

A modern, responsive web app for managing football teams, building lineups, and sharing formations. Built entirely with **AI-assisted development** (fully vibe coded).

## Features

### 📋 Team Management
- Create and manage multiple teams with custom colors
- Add players with names, numbers, and positions
- Organize teams by age groups (JO08-10, JO11-12, JO13+, Senior)
- Persist data locally with localStorage

### 🎯 Formation Builder
- Intuitive drag-and-drop lineup builder
- Pre-configured formations optimized for different age groups:
  - **JO08-10**: 6v6 (goalkeeper + 5 outfield)
  - **JO11-12**: 8v8 (goalkeeper + 7 outfield)
  - **JO13+/Senior**: 11v11 (classic setup)
- Quick assign players to positions
- Bench management with slide-up panel on mobile

### 🔄 Field Orientation
- Toggle field flip to customize GK positioning
- Seamlessly rotate formations for different tactical approaches
- Orientation persists when sharing

### 📱 Responsive Design
- Mobile-first layout powered by container queries
- Optimized toolbar that collapses to icons on smaller screens
- Bottom sheet for bench management
- Full-width field optimization across all devices

### 🔗 Share Lineups
- **Share via link**: Encode lineups as URL parameters (base64 JSON)
- **Share as image**: Download lineup as PNG (custom Canvas 2D rendering)
  - Includes field, player positions, and bench section
  - No external image dependencies
- Read-only view for shared lineups with preserved field color and orientation

### 💾 Persistent Storage
- Auto-save lineups to browser localStorage
- Quick access to recently created lineups
- No backend required

## Tech Stack

- **Frontend Framework**: Vue 3 + Vite 5
- **State Management**: Pinia
- **Routing**: vue-router 4 (hash-based)
- **Styling**: Scoped SCSS with Material Design 3 tokens
- **Canvas Rendering**: Custom Canvas 2D API (no external libraries)
- **Layout**: Flexbox + CSS Grid + Container Queries

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Starts the dev server at `http://localhost:5173`

### Production Build

```bash
npm run build
```

Outputs optimized bundle to `dist/`

## Project Structure

```
src/
├── views/              # Page components
│   ├── Dashboard.vue   # Team & lineups overview
│   ├── Players.vue     # Player roster management
│   ├── LineupBuilder.vue   # Main formation editor
│   ├── Lineups.vue     # Saved lineups list
│   └── ShareView.vue   # Read-only shared lineup view
├── components/         # Reusable UI components
│   ├── FootballField.vue   # Pitch rendering & drag targets
│   ├── BenchPanel.vue      # Bench player display
│   └── FormationSelector.vue
├── stores/            # Pinia store modules
│   └── useTeamStore.ts
├── data/              # Static data (formations, positions, etc.)
└── App.vue           # Root component
```

## How It Works

### Building a Lineup
1. Navigate to Dashboard → Teams → Players
2. Create a team and add players
3. Go to "Nieuwe opstelling" (New Lineup)
4. Drag players onto the field to assign positions
5. Use "Wisselen" (flip) button to rotate field orientation
6. Save the lineup

### Sharing
- **Via Link**: Click "Deel" (Share) → "Link" to copy shareable URL
- **Via Image**: Click "Deel" (Share) → "Plaatje" to download as PNG

Shared lineups display in read-only mode with:
- Fixed green field (`#1a7a47`)
- Preserved team color on player avatars
- Correct field orientation (flipped or not)
- Bench section visible

## Key Implementation Details

### Responsive Field Sizing
Uses CSS Container Queries for true responsiveness:
```css
.field-wrapper { container-type: size; }
.pitch { width: min(100%, calc(100cqh * 5/8)); aspect-ratio: 5/8; }
```

### Coordinate System
- Storage coordinates: Canonical (y=0 at top, GK at bottom for normal view)
- Display coordinates: Flipped via `displayY(y) = flipped ? 100-y : y`
- All transforms handled transparently at component level

### Share Format
Lineups are encoded as base64 URL parameters:
```javascript
{
  n: "Lineup Name",
  t: "Team Name",
  a: "Age Group",
  c: "#hexcolor",
  f: "formationId",
  fl: true,           // flipped state
  s: [{               // slots
    id: "pos-1",
    p: "position",
    x: 50,
    y: 25,
    pid: "player-name",
    num: 1
  }]
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Mobile browsers (iOS Safari, Chrome Android)

## Vibe Check ✨

This entire application was built with **AI-assisted development** using copilot. Every feature, from the responsive layout to the canvas-based image sharing, was co-developed with intelligent code generation. The result is clean, maintainable, and feature-rich – all without a single external image library dependency.

---

**Made with ⚽ and AI** | v1.0.0
