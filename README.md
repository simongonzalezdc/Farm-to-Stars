# Farm to Stars

Farm to Stars is an open-source cozy strategy and civilization simulation game built with TypeScript, React, and Phaser. It combines farming loops, resource production, seasonal systems, township planning, population growth, and civilization bonuses into an experimental browser-based game for players, designers, and engineers.

## Table of Contents

- [What Is This?](#what-is-this)
- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Repository Map](#repository-map)
- [FAQ](#faq)
- [Contributing](#contributing)
- [License](#license)

## What Is This?

Farm to Stars is a **browser-based cozy civilization builder** that takes you from humble farming beginnings to township growth and beyond. The project is structured as two complementary applications:

- **Root Prototype** (`src/`): A lightweight React + Vite grand-strategy interface for rapid iteration on core game mechanics.
- **Web PWA** (`web/`): A full-featured Phaser-powered Progressive Web App with isometric farming, township growth, seasonal systems, local saves via IndexedDB, audio integration, and visual regression testing.

The codebase is designed as an experimental platform for exploring strategy-game systems — useful for game developers, AI agents, and designers studying simulation design patterns.

## Features

- **Farming Simulation** — Crop cycles, livestock management, weather systems, and seasonal mechanics.
- **Township Growth** — Zoning, construction, civic services, utilities, and population management.
- **Resource Economy** — Recipes, production chains, demand simulation, and outage workflows.
- **Civilization Progression** — Civilization bonuses, perks, tech trees, and milestone tracking.
- **Data-Driven Design** — JSON/TypeScript content tables for resources, buildings, crops, livestock, tools, and perks.
- **PWA Support** — Service worker, offline capability, and IndexedDB-oriented save system.
- **Audio System** — Integrated Tone.js and Howler.js audio pipelines.
- **QA Pipeline** — ESLint, Vitest unit tests, Playwright visual regression tests, npm audit, and secret scanning.
- **Renovate Automation** — Dependency updates managed via Renovate Bot.

## Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Clone the Repository

```bash
git clone https://github.com/simon/Farm-to-Stars.git
cd Farm-to-Stars
```

### Install Dependencies

**Root prototype:**

```bash
npm install
```

**Web PWA:**

```bash
cd web
npm install
```

## Quick Start

Run the root prototype:

```bash
npm run dev
```

Run the web PWA:

```bash
cd web
npm run dev
```

Both applications will start a local Vite dev server. Open the URL shown in your terminal (typically `http://localhost:5173`) to begin.

## Usage

### Root Prototype

The root prototype is a React + TypeScript grand-strategy interface. Use it to explore core game mechanics:

```bash
# Start development server
npm run dev

# Run type checking and build for production
npm run build

# Preview the production build
npm run preview

# Lint TypeScript/TSX files
npm run lint
```

### Web PWA

The web PWA is the primary game application powered by Phaser:

```bash
cd web

# Start development server
npm run dev

# Run type checking and build for production
npm run build

# Preview the production build
npm run preview

# Lint the codebase
npm run lint
# Auto-fix lint issues
npm run lint:fix

# Run Playwright end-to-end tests
npm test

# Run visual regression tests only
npm run test:visual
```

### Verification Checklist

Before submitting changes or cutting a release, run the full verification suite:

```bash
# Root
npm run build

# Web PWA
cd web
npm run lint
npm run build
npm test
npm run test:visual
npm audit --audit-level=high
```

> **Note:** This repository is in an active modernization pass. Treat failing tests or warnings as real maintenance signals.

## Repository Map

```text
src/                  Root strategy prototype (React + Vite)
src/ui/               Root UI components
src/game/             Root game logic
src/ai/               AI-related modules
web/                  Phaser web PWA
web/src/              PWA game source
web/src/data/         Homestead data tables
web/content/          Township and perk content
web/tests/            Visual and integration-style checks
web/scripts/          Release, migration, and support scripts
web/styles/           Stylesheets
web/telemetry/        Telemetry modules
tools/                CLI and validation utilities
Docs/                 Design documents, specs, and guides
Archive/              Historical project notes and earlier material
```

### Key Documentation

| Document | Description |
|----------|-------------|
| [`Docs/PRD.md`](Docs/PRD.md) | Product Requirements Document |
| [`Docs/TECH_SPEC.md`](Docs/TECH_SPEC.md) | Technical Specification |
| [`Docs/GDD.md`](Docs/GDD.md) | Game Design Document |
| [`Docs/CONTRIBUTING_FOR_AGENT.md`](Docs/CONTRIBUTING_FOR_AGENT.md) | Agent-specific contribution guide |
| [`Docs/DEVELOPMENT_PLAYBOOK.md`](Docs/DEVELOPMENT_PLAYBOOK.md) | Development workflows |
| [`Docs/BUILD_GUIDE.md`](Docs/BUILD_GUIDE.md) | Detailed build instructions |
| [`Docs/TEST_PLAN.md`](Docs/TEST_PLAN.md) | Test plan and strategy |
| [`Docs/DATA_SCHEMAS.md`](Docs/DATA_SCHEMAS.md) | Data schema definitions |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | General contribution guidelines |
| [`AGENTS.md`](AGENTS.md) | AI agent collaboration guidelines |
| [`SECURITY.md`](SECURITY.md) | Security policy and reporting |

## FAQ

### What technologies does Farm to Stars use?

The project is built with **TypeScript**, **React 19**, **Phaser**, **Vite 8**, **Zustand** (state management), **Playwright** (testing), and **ESLint** (linting). The web PWA also uses Tone.js and Howler.js for audio.

### Can I play the game in my browser?

Yes. Both the root prototype and the web PWA are browser-based applications. Run `npm run dev` (root) or `cd web && npm run dev` (web) to start a local dev server, then open the URL in your browser.

### How do I save my progress?

The web PWA uses an IndexedDB-oriented save system. Game state is persisted locally in your browser. The root prototype is primarily a development interface and may not have full save support.

### Is this project ready for production use?

No. Farm to Stars is in an **active modernization pass** and should be considered experimental. The codebase is intended for exploration, prototyping, and learning. Treat it as a work in progress.

### How are dependencies managed?

Dependencies are kept up to date via **Renovate Bot**, which automatically opens pull requests for version bumps. Check the `renovate.json` configuration for details.

## Contributing

We welcome contributions from developers, designers, and AI agents. Before submitting a pull request, please read the following:

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — General contribution guidelines, code standards, and pull request workflow.
- [`AGENTS.md`](AGENTS.md) — Guidelines for AI agents collaborating on the project.
- [`Docs/CONTRIBUTING_FOR_AGENT.md`](Docs/CONTRIBUTING_FOR_AGENT.md) — Agent-specific contribution instructions.

### Quick Contribution Checklist

1. Fork the repository and create a feature branch.
2. Install dependencies and make your changes.
3. Run linting and tests before submitting:
   ```bash
   npm run build
   cd web && npm run lint && npm run build && npm test
   ```
4. Open a pull request with a clear description of your changes.

For bug reports and feature requests, please open an issue on GitHub.

## License

Farm to Stars is released under the [MIT License](LICENSE).

Before publishing or cutting releases, run both current-tree and history secret scans, npm audits, builds, and the active test suites to ensure public safety.