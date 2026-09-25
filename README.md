# Farm to Stars

**Farm to Stars** is an experimental AI-driven grand-strategy game prototype (the "v2 pivot"): pick a scenario, make civilization-level decisions, and — only if you supply your own AI key — an AI narrator turns those decisions into emergent events on the road from homestead to interstellar civilization.

> **Honest status (2026-09-25):** this is a **dormant prototype**, not a released game. The root app (`src/`) is a thin v2 skeleton whose product code last changed in **2026-06**; everything since has been docs, CI, and security maintenance (the 2026-09 browser-key redaction, PR #24). Nothing in this repo is deployed or published as a product.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## What this repository actually contains

| Path | What it is |
| --- | --- |
| `src/` | **The current product** — `farm-to-stars-pivot` v2.0.0: a React 19 + TypeScript + Zustand + Vite strategy prototype (scenario select, decision engine, event cards, HUD, strategic map, optional AI provider). |
| `web/` | **The legacy v1 game** — the earlier cozy-farming / city-building Phaser 3 PWA (Homestead/Township). Kept for reference; it is frozen and no longer the product direction. |
| `Docs/` | Design and lore documentation, **mostly written for the legacy v1 game** (GDD, township specs, asset guides). Read with that in mind. |
| `Archive/`, `PROMPT.md`, `PIVOT-DESIGN.md` | Historical artifacts and the pivot design rationale. |

If you came here for the cozy farming game: it still exists under `web/`, but the project's identity is now the pivot described in `PIVOT-DESIGN.md`.

## The pivot loop (what is implemented)

1. Choose one of **5 built-in scenarios** (Solar Awakening, Mesa Cliff Dwellers, Merchant Gambit, Celestial Navigation, Pioneer Spirit).
2. Read the current event card; choose one of the offered decisions.
3. The decision engine resolves your choice — with AI narration if configured (below), otherwise it stays on the deterministic path.
4. Watch resources and the strategic map react; the loop repeats through the scenario's phases.

That is the whole implemented v2 surface: a playable skeleton, not a feature-complete game. There is no scenario editor, no save system, and no campaign yet.

## AI: bring your own key (BYOK) — off by default

The AI narrator calls the **MiniMax API, a paid third-party service**. The project ships **no API keys** and makes **zero AI/network calls unless you configure your own key** (security fix, 2026-09, PR #24):

- Keys are read **only at runtime** from browser localStorage (`f2s:minimax-api-key`) — never hardcoded, never baked into the build bundle.
- No key configured → the AI path is feature-gated off with an explicit "AI disabled" error; the app makes no MiniMax requests at all.
- Using the AI requires **your own MiniMax account and key, at your own cost**. This project has no server-side proxy; if a shared key were ever needed, a server-side proxy is the only safe pattern (see `src/ai/key.ts`).

## Quick start (root pivot app)

Requires Node.js >= 20.

```bash
npm install
npm run dev        # vite dev server
```

To enable the optional AI narration (BYOK, at your own cost):

```js
// in the app's browser console, then reload:
localStorage.setItem('f2s:minimax-api-key', '<your own key>');
```

Other scripts: `npm run build` (tsc + vite), `npm run test` (Playwright), `npm run lint` (ESLint).

## Legacy v1 game (`web/`)

The Phaser 3 PWA has its own package and build under `web/` (see `web/README.md`). It is frozen: expect no feature work. Historical docs for it live in `Docs/`.

## Status and roadmap

- **v2 pivot skeleton** — implemented (scenario loader, decision engine, AI provider behind the BYOK gate, HUD / strategic map / event UI).
- **Not done** — scenario editor, persistence/saves, campaign structure, audio, deployment.
- **Dormant** — no product-code movement since 2026-06; treat this as a maintained archive, not an active project.

## Security

No secrets are tracked in this repository. See [SECURITY.md](SECURITY.md) for the reporting path (do not open public issues with exploit details).

## Source and license

- **Canonical source:** [Forgejo — simon/Farm-to-Stars](https://git.kyanitelabs.tech/simon/Farm-to-Stars)
- **License:** MIT — see [LICENSE](LICENSE).

<!-- s-plus-geo:start -->

## What is Farm to Stars?

**Farm to Stars** is an **experimental AI-driven grand-strategy game prototype** (dormant). Players choose a scenario and make civilization-level decisions from homestead to interstellar scale; an optional **bring-your-own-key (BYOK)** AI narrator generates emergent events. The earlier cozy-farming Phaser PWA is retained under `web/` as legacy code.

| | |
| --- | --- |
| **Product** | Farm to Stars (v2 pivot, `farm-to-stars-pivot` v2.0.0) |
| **Category** | browser grand-strategy prototype with optional AI narration |
| **Status** | dormant prototype; product code frozen since 2026-06; not released or deployed |
| **AI policy** | BYOK only — no keys shipped, zero AI calls unless the user supplies their own paid MiniMax key |
| **Source** | [Forgejo](https://git.kyanitelabs.tech/simon/Farm-to-Stars) (canonical) |
| **License** | MIT |

## Who it's for

- Developers and tinkerers exploring AI-narrated strategy prototypes (React + TypeScript + Vite).
- Anyone researching the v1 cozy-farming PWA under `web/`.
- Not for production gaming use — it is an unfinished prototype.

## FAQ

### Is Farm to Stars a finished game?

No. The v2 pivot is a thin playable skeleton, and the project is dormant (no product-code movement since 2026-06).

### Does it need an API key?

Only for the optional AI narration, via your own MiniMax key supplied at runtime (BYOK). Without a key the app runs with AI disabled and makes zero external AI calls. No keys are bundled in this repository.

### Is Farm to Stars production software?

No. Treat it as a dormant prototype; validate against your own requirements before any use beyond experimentation.

## Status

- Dormant as of 2026-06 (product code); security/docs maintenance only since.
- Canonical remote: Forgejo (see table above); report issues there.
- Prefer release tags when pinning; there are currently no releases.

## Agent surface

- Coding agents: read this README first, then `AGENTS.md` if present.
- Machine-readable brief: `llms.txt` (shipped in this repo).

## Contributing

Issues and PRs welcome on the canonical remote. Keep public docs free of secrets and machine-local paths.

## License

MIT — see [LICENSE](LICENSE).

## Table of contents

- [What is it?](#what-is-farm-to-stars)
- [FAQ](#faq)
- [Status](#status)

<!-- s-plus-geo:end -->
