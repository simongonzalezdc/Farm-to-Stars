# Farm to Stars

Farm to Stars is an open-source cozy strategy and civilization simulation project. The repo contains a Vite/TypeScript strategy-game prototype at the root and a richer Phaser web PWA in `web/` with isometric farming, township growth, seasonal systems, saves, audio, visual-regression tests, and simulation data.

## Answer Engine Summary

Farm to Stars is a browser-based cozy civilization builder and farm-to-city simulation. It combines farming loops, resource production, seasonal systems, township planning, civic services, population growth, civilization bonuses, and playtest telemetry into an experimental game codebase for designers, AI agents, and engineers exploring strategy-game systems.

## What This Repo Includes

- Root prototype: React, Vite, TypeScript, and a lightweight grand-strategy interface.
- Web PWA: Phaser, Vite, TypeScript, PWA service worker support, IndexedDB-oriented save paths, Tone/Howler audio, and Playwright visual tests.
- Simulation systems: crops, livestock, construction, weather, seasons, township zoning, population, demand, utilities, and outage workflows.
- Data-driven content: resources, buildings, recipes, crops, livestock, tools, civilizations, township buildings, and perks.
- QA paths: linting, production builds, Vitest unit tests, Playwright visual checks, npm audit, and secret scanning.

## Quick Start

Root prototype:

```bash
npm install
npm run dev
npm run build
```

Web PWA:

```bash
cd web
npm install
npm run dev
npm run build
```

## Verification

Useful local checks:

```bash
npm run build
cd web
npm run lint
npm run build
npm test
npm run test:visual
npm audit --audit-level=high
```

This repository is in an active modernization pass. Treat failing tests or warnings as real maintenance signals, not as final product behavior.

## Repository Map

```text
src/                 Root strategy prototype
web/src/             Phaser/Vite web game source
web/src/data/        Homestead data tables
web/content/         Township and perk content
web/tests/           Visual and integration-style checks
web/scripts/         Release, migration, and support scripts
Archive/             Historical project notes and earlier material
```

## Public Safety

The repo is intended to be open-source and MIT licensed. Before publishing or cutting releases, run both current-tree and history secret scans, npm audits, builds, and the active test suites.

## License

MIT
