# Farm to Stars Web PWA

The `web/` package is the primary browser game surface for Farm to Stars. It is a Phaser, TypeScript, and Vite PWA for testing cozy farming, settlement growth, township planning, seasons, audio, saves, and visual-regression paths.

## Quick Start

```bash
npm install
npm run dev
```

## Core Commands

```bash
npm run lint
npm run build
npm test
npm run test:visual
npm audit --audit-level=high
```

## System Areas

- `src/world.ts`: main homestead tick loop.
- `src/sim/township/`: township phase systems for population, zones, demand, utilities, outages, and civilization bonuses.
- `src/data/`: homestead data tables for resources, buildings, recipes, crops, livestock, tools, and civilizations.
- `content/township/`: township building definitions and related content.
- `tests/visual/`: browser-based visual regression checks.

## Public Readiness Notes

This package is being modernized for public development. The expected path is to keep lint, build, unit tests, visual tests, audits, and secret scans green before treating a branch as release-ready.
