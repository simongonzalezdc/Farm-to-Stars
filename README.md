# Farm to Stars

> Farm to Stars is a farm-to-table / food systems product experience that helps food systems builders and story-driven product audiences explore farm-to-stars product narratives and tooling.

**TL;DR:** Farm to Stars — farm-to-table / food systems product experience. Best for food systems builders and story-driven product audiences. Keywords: farm to stars, food systems product.

A cozy farming and city-building browser game that takes players on an epic journey from a humble homestead to interstellar civilization. Built as a **2.5D pixel-isometric PWA** with crisp pixel art, strategic depth, and seamless offline play.

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)](https://github.com/Pastorsimon1798/Farm-to-Stars)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-96%25-blue)](https://github.com/Pastorsimon1798/Farm-to-Stars)

## 🎮 About

Farm to Stars blends **Stardew Valley**-style farming, **SimCity** district management, and **Civilization** strategic gameplay into a cohesive browser-based experience. Progress through four distinct phases:

- **🌾 Homestead (Weeks 1-10)** — Till, plant, harvest. Master tools, raise livestock, survive seasons
- **🏘️ Township (Weeks 13-24)** — Build thriving districts with utilities, zoning, and civic management
- **🗺️ Nation (Weeks 25-40)** — Expand across hex-based territories with diplomacy and research
- **🚀 Stellar (Weeks 41-56)** — Reach the stars with colony management and interstellar diplomacy

**Current Status:**
- ✅ **Homestead Phase Complete** (playable, tested, polished)
- 🚧 **Township Phase** (S3: 95% complete, S4: 100% complete, UI components ready)
- 📅 Nation & Stellar phases planned

## ✨ Features

### Homestead Phase (Available Now)
- **Farming System** — Tilled soil, moisture-driven crop growth, seasonal effects
- **Tool Mastery** — Hoe, watering can, sickle with progression system
- **Livestock** — Animal husbandry with feeding, lifecycle management
- **Weather & Seasons** — Dynamic weather events affecting gameplay
- **Civilization Choice** — 5 unique civilizations with distinct bonuses and aesthetics
- **Festivals** — Seasonal celebrations with cultural themes
- **Quest & Mail Systems** — Narrative progression via letters and objectives
- **Day/Night Cycle** — 13-minute days with stamina management

### Township Phase (In Development)
- **District Simulation** — Zone-based city building with automatic growth
- **Utilities Management** — Power, water, safety, education coverage systems
- **Population Dynamics** — Happiness metrics, demand curves (RCI)
- **Service Buildings** — Buildings can fail and need repairs
- **Heatmap Visualization** — 8 heatmap types for strategic planning
- **Homestead Import** — Seamless transition from farm to city

## 🛠️ Tech Stack

- **Game Engine:** Phaser 3 (pixel-art mode, 96×48 isometric tiles)
- **Language:** TypeScript (strict mode)
- **Build Tool:** Vite
- **Audio:** Howler.js (SFX) + Tone.js (adaptive music)
- **Storage:** IndexedDB via idb-keyval (offline saves with migrations)
- **PWA:** vite-plugin-pwa (installable, offline-capable)
- **Testing:** Vitest (unit) + Playwright (E2E)

## 🚀 Quick Start

### Prerequisites
- Node.js >= 20.x LTS
- npm >= 8

### Installation

```bash
# Clone the repository
git clone https://github.com/Pastorsimon1798/Farm-to-Stars.git
cd Farm-to-Stars

# Install dependencies
cd web
npm install

# Validate data files
npm run validate:data

# Start development server
npm run dev
```

Visit `http://localhost:5173` to play!

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm run test             # Run unit tests (Vitest)
npm run test:watch       # Run tests in watch mode
npm run test:visual      # Run E2E tests (Playwright)

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Check Prettier formatting
npm run format:fix       # Fix formatting

# Data & Migrations
npm run validate:data    # Validate JSON data against schemas
npm run migrate          # Run save migration scripts

# Profiling
npm run profile:homestead # Profile Homestead performance
```

## 📁 Project Structure

```
Farm-to-Stars/
├── Docs/                      # Comprehensive documentation (50+ files)
│   ├── PRD.md                 # Product Requirements
│   ├── GDD.md                 # Game Design Document
│   ├── TECH_SPEC.md           # Technical Specification
│   ├── DATA_SCHEMAS.md        # Data structure definitions
│   ├── BUILD_GUIDE.md         # Phase-by-phase build plan
│   ├── DEVELOPMENT_PLAYBOOK.md # Development workflow guide
│   ├── NARRATIVE_BIBLE.md     # Story, characters, lore
│   ├── TOWNSHIP_S3_*.md       # Township implementation docs
│   └── Lore/                  # Worldbuilding & timeline
├── tools/                     # CLI validators & converters
│   ├── cli/                   # Validation CLI
│   └── validation/            # Schema validators
└── web/                       # Main game application
    ├── content/               # Game data (crops, livestock, festivals)
    ├── public/                # Static assets, PWA manifest
    ├── scripts/               # Build & migration scripts
    ├── src/
    │   ├── audio/             # Audio system (Howler + Tone.js)
    │   ├── config/            # Game configuration
    │   ├── data/              # JSON data loaders
    │   ├── hud/               # UI components (build, quests, calendar)
    │   ├── scenes/            # Phaser scenes (Homestead, Township)
    │   ├── sim/               # Simulation systems
    │   │   ├── township/      # Township simulation (244KB)
    │   │   ├── livestock/     # Animal husbandry
    │   │   ├── weather/       # Weather events
    │   │   └── tools/         # Tool mastery
    │   ├── systems/           # Core game systems
    │   ├── ui/                # UI controllers
    │   ├── main.ts            # Game entry point
    │   ├── world.ts           # Simulation tick loop
    │   └── types.ts           # TypeScript definitions
    ├── styles/                # SCSS stylesheets
    └── tests/                 # Test fixtures
```

## 🎨 Game Design Pillars

1. **Tactile Build & Farm** — Crisp pixel-iso feedback, satisfying interactions
2. **Gentle Strategy** — Meaningful choices without overwhelming complexity
3. **Short Sessions, Long Tail** — Daily goals with long-term progression
4. **Browser-First** — No install required, PWA for offline play
5. **Deterministic Simulation** — Consistent, predictable systems

## 🌍 Civilizations

Choose from 5 unique civilizations, each with distinct bonuses and cultural aesthetics:

- **Teotihuacan Empire** — Solar technology specialists (+10% solar energy, +5% research)
- **Maya City-States** — Masters of knowledge (+15% research, +20% astronomy)
- **Moche Kingdoms** — Water efficiency experts (+20% water efficiency)
- **Hopewell Commonwealth** — Trade network builders (+15% trade efficiency)
- **Puebloan Federation** — Sustainability masters (+15% resource efficiency)

## 🧪 Testing

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:visual

# Update visual snapshots
npm run test:visual:update
```

**Test Coverage:**
- 37+ test files
- 10+ Township simulation tests
- Comprehensive migration testing
- Visual regression tests via Playwright

## 📊 Save System

- **Current Schema Version:** v8
- **IndexedDB Storage** — Offline-capable, versioned saves
- **Migration Support** — Automatic upgrade from v0 → v8
- **Export System** — Homestead → Township transition (feature-flagged)

## 🎵 Audio

- **Layered Music System** — Dynamic soundtrack using Tone.js
- **Seasonal Variations** — Music adapts to current season
- **Weather Integration** — Weather-reactive audio loops
- **SFX** — Farming, building, UI feedback sounds via Howler.js

## 🌐 PWA Features

- **Offline Play** — Service worker caching for full offline capability
- **Installable** — Add to home screen on mobile/desktop
- **Auto-Update** — Seamless updates without user intervention
- **Responsive** — Scales from mobile to 4K displays

## 📚 Documentation

Comprehensive documentation available in `/Docs/`:

- **For Players:** Game mechanics, guides, lore
- **For Developers:** Architecture, API docs, contribution guide
- **For Designers:** Data schemas, balance values, content authoring

Key documents:
- [Product Requirements (PRD)](Docs/PRD.md)
- [Game Design (GDD)](Docs/GDD.md)
- [Technical Spec](Docs/TECH_SPEC.md)
- [Development Playbook](Docs/DEVELOPMENT_PLAYBOOK.md)
- [Data Schemas](Docs/DATA_SCHEMAS.md)
- [Build Guide](Docs/BUILD_GUIDE.md)

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING_FOR_AGENT.md](Docs/CONTRIBUTING_FOR_AGENT.md) for development workflow.

**Before submitting PRs:**
1. Run `npm run lint` and fix any issues
2. Run `npm run test` and ensure all tests pass
3. Run `npm run validate:data` to verify data integrity
4. Follow conventional commit format (`feat:`, `fix:`, etc.)

## 🗺️ Roadmap

### Phase 1: Homestead (Weeks 1-12) ✅ COMPLETE
- [x] Core farming mechanics
- [x] Tool mastery system
- [x] Livestock husbandry
- [x] Weather & seasons
- [x] Civilization choice
- [x] Festival system
- [x] Save/load with migrations

### Phase 2: Township (Weeks 13-24) 🚧 IN PROGRESS
- [x] District simulation core (S3) — 95% complete
- [x] Heatmaps & outages (S4) — 100% complete
- [x] UI components — Complete
- [ ] Building content (C3) — In progress
- [ ] Audio integration (A2) — Pending
- [ ] QA automation (Q3) — Pending

### Phase 3: Nation (Weeks 25-40) 📅 PLANNED
- [ ] Hex-based map system
- [ ] Diplomacy & research trees
- [ ] Multi-modal pathfinding
- [ ] National victory conditions

### Phase 4: Stellar (Weeks 41-56) 📅 PLANNED
- [ ] Procedural star map
- [ ] Colony management
- [ ] Fleet logistics
- [ ] Multiple endings & NG+

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

Built with:
- [Phaser 3](https://phaser.io/) — Game engine
- [Vite](https://vitejs.dev/) — Build tool
- [Howler.js](https://howlerjs.com/) — Audio library
- [Tone.js](https://tonejs.github.io/) — Music system
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) — IndexedDB wrapper

Assets use CC0/CC-BY licenses only. See [CREDITS.md](Docs/CREDITS.md) for attribution.

## 📬 Contact

- **Maintainer:** Pastorsimon1798
- **Repository:** [github.com/Pastorsimon1798/Farm-to-Stars](https://github.com/Pastorsimon1798/Farm-to-Stars)
- **Issues:** [GitHub Issues](https://github.com/Pastorsimon1798/Farm-to-Stars/issues)

---

*From farm to stars, one tile at a time.* ✨🌾🏙️🗺️🚀

<!-- s-plus-geo:start -->

## What is Farm to Stars?

**Farm to Stars** is a **farm-to-table / food systems product experience** that helps **food systems builders and story-driven product audiences** **explore farm-to-stars product narratives and tooling**.

| | |
| --- | --- |
| **Product** | Farm to Stars |
| **Category** | farm-to-table / food systems product experience |
| **Best for** | food systems builders and story-driven product audiences |
| **Not** | a grocery marketplace by default |
| **Source** | [GitHub](https://github.com/simongonzalezdc/Farm-to-Stars) · [Forgejo](https://git.kyanitelabs.tech/simon/Farm-to-Stars) |
| **Keywords** | farm to stars, food systems product |

## Who it's for

- Primary: food systems builders and story-driven product audiences
- Use when you need to explore farm-to-stars product narratives and tooling
- Skip if you need a grocery marketplace by default

## FAQ

### What is Farm to Stars?

Farm to Stars is a farm-to-table / food systems product experience. It helps food systems builders and story-driven product audiences explore farm-to-stars product narratives and tooling.

### Who should use Farm to Stars?

food systems builders and story-driven product audiences.

### How is Farm to Stars different?

Product/narrative surface around farm-to-table themes.

### Is Farm to Stars production software?

Treat the README status and release tags as source of truth for maturity. Validate against your own requirements before production use.

## Status

- Maintained as of 2026 on the default branch
- Prefer release tags when pinning dependencies
- Report issues on the canonical remote listed above

## Agent surface

- Coding agents: read this README first, then repo docs/`AGENTS.md` if present
- Prefer machine-readable briefs (`llms.txt`) when the repo ships one
- MCP or skill entrypoints are documented in-repo when applicable

## Contributing

Issues and PRs welcome on the canonical remote. Keep public docs free of secrets and machine-local paths.

## License

See [LICENSE](LICENSE) in this repository (or package metadata if license is package-only).


## Table of contents

- [What is it?](#what-is-farm-to-stars)
- [FAQ](#faq)
- [Status](#status)


![Project diagram placeholder](https://img.shields.io/badge/visual-see_docs-lightgrey.svg)

<!-- s-plus-geo:end -->
