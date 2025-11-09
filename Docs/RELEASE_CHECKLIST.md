# Release Checklist — Farm to Stars

**Version:** 1.0
**Last Updated:** 2025-11-09
**Owner:** QA Lead + Producer
**Purpose:** Standardized release gates for all phase milestones

---

## Table of Contents
1. [Release Philosophy](#1-release-philosophy)
2. [Universal Gates (All Phases)](#2-universal-gates-all-phases)
3. [Phase-Specific Gates](#3-phase-specific-gates)
4. [Sign-Off Matrix](#4-sign-off-matrix)
5. [Post-Release Monitoring](#5-post-release-monitoring)
6. [Release Notes Template](#6-release-notes-template)

---

## 1. Release Philosophy

**Core Principles:**
- **Quality Over Speed:** No release ships with known Sev-1 or Sev-2 bugs
- **Data Safety First:** Save migrations must be bulletproof; downgrade paths tested
- **Accessibility Non-Negotiable:** Every release meets WCAG 2.1 AA minimum
- **Performance Budgets Enforced:** Lighthouse scores gate releases, not suggestions

**Release Types:**

| Type | Cadence | Purpose | Gates |
|------|---------|---------|-------|
| **Wave Alpha** | End of Weeks 8, 13, 25, 41 | Internal prototype, contracts frozen | Reduced (engineers only) |
| **Wave Beta** | Mid-phase (Weeks 9-10, 15-18, etc.) | Friends & family playtest | Standard gates |
| **Wave Gamma** | Late phase | External closed beta | Standard + external QA |
| **Wave Delta** | Phase completion | Public RC / phase launch | Full gates + marketing |

---

## 2. Universal Gates (All Phases)

### 2.1 Code Quality Gates

#### ✅ **CI Pipeline Green**
- [ ] All lint checks pass (`npm run lint`)
- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:visual`)
- [ ] Data validation passes (`npm run validate:data`)
- [ ] No console errors in production build
- [ ] TypeScript compiles without errors (`npm run build`)

**Verification:**
```bash
cd web
npm run lint && npm run test && npm run validate:data && npm run build
```

**Owner:** Engineering Lead
**Blocker:** Yes (cannot release if failing)

---

#### ✅ **Code Review Completed**
- [ ] All PRs for milestone have ≥1 approving review
- [ ] No unaddressed review comments
- [ ] All merge conflicts resolved
- [ ] Commit history clean (no WIP commits on `main`)

**Owner:** Engineering Lead
**Blocker:** Yes

---

### 2.2 Performance Gates

#### ✅ **Lighthouse Audit ≥90**
Run on production build (`npm run build && npm run preview`):

- [ ] **Performance:** ≥90
- [ ] **Accessibility:** ≥90
- [ ] **Best Practices:** ≥90
- [ ] **SEO:** ≥80 (nice-to-have)

**How to Run:**
1. Build production: `npm run build`
2. Serve locally: `npm run preview`
3. Open Chrome DevTools → Lighthouse
4. Run audit (Mobile + Desktop)
5. Screenshot results, attach to release notes

**Performance Budget Checks:**
- [ ] Initial bundle ≤10MB (check `web/dist/` size)
- [ ] Time to first frame ≤3s (cold load)
- [ ] Frame time ≤16ms (60 FPS) during typical gameplay

**Owner:** Lead Engineer
**Blocker:** Yes (Performance + Accessibility must be ≥90)

---

#### ✅ **Frame Rate Stable**
- [ ] No dropped frames during 5-minute play session
- [ ] Camera pan/zoom smooth at all zoom levels
- [ ] No stuttering during season transitions
- [ ] Audio/music layers sync without drift

**Test Environment:** Mid-tier hardware (defined in TECH_SPEC)

**Owner:** QA Lead
**Blocker:** Yes

---

### 2.3 Save System Gates

#### ✅ **Migration Testing Complete**
- [ ] All legacy save versions load successfully (v0→current)
- [ ] Downgrade fixtures tested (current→previous)
- [ ] Migration harness runs without errors: `npm run migrate -- --dry-run`
- [ ] No data loss in migration (resources, buildings, state preserved)
- [ ] Edge cases tested: Empty saves, corrupted JSON, missing fields

**Test Cases:**
```bash
cd web
npm run migrate -- --file ../web/scripts/migrate/__fixtures__/v4-basic.json
npm run migrate -- --file ../web/scripts/migrate/__fixtures__/v5-basic.json
# Verify console shows "Migration successful" for each
```

**Sign-Off Required:**
- [ ] Engineering: Migration logic reviewed and tested
- [ ] QA: Loaded 5 legacy saves, verified state correctness
- [ ] Producer: User data risk acknowledged and documented

**Owner:** Engineering Lead + QA Lead
**Blocker:** Yes (data loss is Sev-1)

---

#### ✅ **Save/Load Regression**
- [ ] Save game → Reload page → Load save (state preserved)
- [ ] Offline save works (disable network, save, reload)
- [ ] Multiple save slots functional (if implemented)
- [ ] Auto-save triggers correctly (every 5 seconds per TECH_SPEC)

**Owner:** QA Lead
**Blocker:** Yes

---

### 2.4 PWA & Offline Gates

#### ✅ **PWA Install Flow**
Test on **Chrome Desktop + Safari iOS** (minimum):

- [ ] Install prompt appears on eligible visits
- [ ] App installs to home screen/app launcher
- [ ] Installed app opens in standalone mode (no browser chrome)
- [ ] App icon displays correctly
- [ ] Manifest.json validates (use https://manifest-validator.appspot.com/)

**Owner:** QA Lead
**Blocker:** Yes

---

#### ✅ **Offline Functionality**
- [ ] Game loads offline after first visit (service worker active)
- [ ] Saves persist offline
- [ ] Asset caching works (no broken images/sounds offline)
- [ ] Service worker cache version updated (see `web/src/service-worker.ts`)
- [ ] Hard refresh clears old cache versions

**Test Procedure:**
1. Load game online (fresh install)
2. Play for 5 minutes
3. Disconnect network (Chrome DevTools → Network → Offline)
4. Reload page
5. Verify game loads and plays normally

**Owner:** QA Lead
**Blocker:** Yes

---

### 2.5 Accessibility Gates

#### ✅ **WCAG 2.1 AA Compliance**
- [ ] Color contrast ≥4.5:1 for all UI text (use contrast checker)
- [ ] Keyboard navigation works (Tab, Enter, Esc, Arrow keys)
- [ ] Focus indicators visible
- [ ] Screen reader compatibility (test with NVDA or VoiceOver)
- [ ] No seizure-inducing flashing content (≤3 flashes/second)

**Automated Check:**
```bash
npm run test:a11y  # TODO: Implement axe-core integration
```

**Manual Checks:**
- [ ] HUD scales 0.75× to 1.5× without layout breakage
- [ ] All interactive elements have accessible names
- [ ] Error messages are announced to screen readers

**Owner:** QA Lead
**Blocker:** Yes (Accessibility is not optional)

---

### 2.6 Audio Gates

#### ✅ **Audio Mix Review**
- [ ] SFX volume balanced (not overpowering music)
- [ ] Music layers transition smoothly (no pops/clicks)
- [ ] Weather audio reacts to weather state
- [ ] Volume sliders persist across sessions
- [ ] Mobile audio gated by user interaction (tap to play)

**Audio Lead Sign-Off Required**

**Owner:** Audio Lead
**Blocker:** No (can release with minor audio issues if documented)

---

### 2.7 Localization Gates (Phase II+)

**For Homestead:** English-only (skip this section)

**For Township+:**
- [ ] All UI strings externalized to `strings.json`
- [ ] Localization extraction runs without errors: `npm run i18n:extract`
- [ ] Translations compiled: `npm run i18n:compile`
- [ ] Multi-language UI tested (German, Spanish, French minimum)
- [ ] No text clipping in any supported language
- [ ] Date/number formatting correct per locale

**Owner:** Localization Lead (to be assigned)
**Blocker:** Yes (for multi-language releases)

---

## 3. Phase-Specific Gates

### 3.1 Homestead Phase (Weeks 8-12)

#### Wave Delta Specific Gates:

**✅ Homestead Core Loop Complete**
- [ ] 30 in-game day campaign stable (no crashes)
- [ ] All quests completable (Harvest, Herd, Post)
- [ ] Livestock system functional (feeding, growth, production)
- [ ] Weather system working (rain, storms, seasonal effects)
- [ ] Tool mastery progression unlocks correctly
- [ ] Festival events trigger on schedule

**Soak Test:**
- [ ] 4-hour simulated time soak test passes: `npm run test:soak` (TODO: Implement)
- [ ] No memory leaks detected (heap stable over time)
- [ ] No NaN states in game data

**Export Prototype:**
- [ ] Homestead→Township export generates valid JSON
- [ ] Export accessible via feature flag: `?feature.exportTownship=true`
- [ ] Export payload validates against `web/content/township/import.json` schema

**Owner:** QA Lead
**Blocker:** Yes

---

### 3.2 Township Phase (Weeks 13-24)

**✅ City Simulation Stable**
- [ ] 5k population achieved without performance degradation
- [ ] Utilities propagation works (power/water grids)
- [ ] Outages resolve within expected time (≤5 simulated minutes)
- [ ] Advisor dialogs functional with personality consistency
- [ ] Zoning validator passes: `npm run test:township:zoning` (future)

**✅ Homestead Import Works**
- [ ] 5 different Homestead exports successfully imported
- [ ] Resources transferred correctly
- [ ] No data loss during conversion
- [ ] Import generates starter district with correct layout

**Owner:** QA Lead
**Blocker:** Yes

---

### 3.3 Nation Phase (Weeks 25-40)

**✅ Hex Engine Stable**
- [ ] 200-turn autoplay stable: `npm run test:nation:autoplay` (future)
- [ ] Pathfinding ≤8ms CPU per frame
- [ ] Fog of war renders correctly
- [ ] No NaN positions or infinite loops

**✅ Diplomacy System**
- [ ] All treaty types negotiable (trade, research, border)
- [ ] AI responds deterministically (same seed = same behavior)
- [ ] Victory conditions achievable (cultural, industrial, military)

**Owner:** QA Lead
**Blocker:** Yes

---

### 3.4 Stellar Phase (Weeks 41-56)

**✅ Procedural Generation Deterministic**
- [ ] 100 seeds reproduce identical star maps
- [ ] Fleet combat ≤12ms per frame
- [ ] Colony management loops functional

**✅ Finale & NG+ Ready**
- [ ] Multiple endings accessible (cultural, scientific, diplomatic)
- [ ] NG+ seed generator verified
- [ ] Legacy codex populates correctly

**Owner:** QA Lead
**Blocker:** Yes

---

## 4. Sign-Off Matrix

### 4.1 Required Approvals

| Phase | Engineering Lead | QA Lead | Producer | Audio Lead | Narrative Lead |
|-------|-----------------|---------|----------|------------|----------------|
| **Homestead** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | Optional |
| **Township** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Nation** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |
| **Stellar** | ✅ Required | ✅ Required | ✅ Required | ✅ Required | ✅ Required |

**Sign-Off Format:**
Create GitHub issue titled `[RELEASE SIGN-OFF] <Phase> Wave <Alpha/Beta/Gamma/Delta>`

**Template:**
```
## Sign-Off Checklist

- [ ] Engineering Lead: @username
- [ ] QA Lead: @username
- [ ] Producer: @username
- [ ] Audio Lead: @username (if applicable)
- [ ] Narrative Lead: @username (Township+)

## Gate Status

- [ ] All universal gates passed
- [ ] Phase-specific gates passed
- [ ] Known issues documented (attach bug list)
- [ ] Release notes drafted

## Risk Assessment

**P0 (Showstoppers):** None / [List]
**P1 (High Risk):** None / [List]
**P2 (Medium Risk):** [List or "None"]

## Go/No-Go Decision

**Decision:** GO / NO-GO
**Reasoning:** [Brief explanation]
**Release Date:** [YYYY-MM-DD]
```

---

## 5. Post-Release Monitoring

### 5.1 First 24 Hours

**Monitoring Checklist:**
- [ ] Telemetry dashboard shows normal traffic (when implemented)
- [ ] No spike in error events
- [ ] Service worker adoption rate normal (check caching metrics)
- [ ] User-reported bugs triaged (monitor Discord/GitHub issues)

**On-Call:** Engineering Lead (or designated on-call engineer)

**Escalation:** If Sev-1 detected, follow `Docs/OPS_RUNBOOK.md` §3.2

---

### 5.2 First Week

- [ ] Daily bug triage meetings
- [ ] Monitor Lighthouse scores (no regressions)
- [ ] Track progression metrics (time to milestones)
- [ ] Collect playtest feedback

**Report to:** Producer + Studio Director (weekly summary)

---

## 6. Release Notes Template

**File:** `/Docs/releases/<phase>.md`

**Format:**
```markdown
# Farm to Stars — <Phase Name> Release

**Version:** <schemaVersion>
**Release Date:** YYYY-MM-DD
**Phase:** Homestead / Township / Nation / Stellar
**Wave:** Alpha / Beta / Gamma / Delta

---

## 🎉 Highlights

- [Major feature 1]
- [Major feature 2]
- [Major feature 3]

---

## ✨ New Features

### [Category 1: e.g., Simulation]
- **[Feature Name]:** [Description]
- **[Feature Name]:** [Description]

### [Category 2: e.g., UI/UX]
- **[Feature Name]:** [Description]

---

## 🐛 Bug Fixes

- Fixed [specific bug description] (Issue #123)
- Resolved [another bug] (Issue #456)

---

## ⚡ Performance Improvements

- Reduced frame time by [X]ms during [scenario]
- Optimized [system] for [improvement]

---

## 🎨 Content Updates

- Added [X] new crops/buildings/units
- Updated [content type] with [changes]

---

## 🔧 Technical Notes

- Schema version bumped to v[X]
- Save migration from v[X-1]→v[X] automatic
- Service worker cache version: v[X]-YYYY-MM-DD

---

## ⚠️ Known Issues

- [Issue description] — Workaround: [steps] (Fix planned for [date])
- [Issue description] — Severity: Sev-3 (Non-blocking)

---

## 📊 Metrics (Internal)

- Lighthouse Performance: [score]
- Lighthouse Accessibility: [score]
- Initial bundle size: [X]MB
- Average frame time: [X]ms
- Test coverage: [X]%

---

## 🙏 Credits

Special thanks to:
- [Playtesters who provided feedback]
- [External contributors]
- [Asset creators]

See full credits in `Docs/CREDITS.md`
```

---

## 7. Emergency Release Procedures

### 7.1 Hotfix Releases

**When:** Critical Sev-1 bug discovered post-release

**Procedure:**
1. **Create hotfix branch:** `hotfix/sev1-<brief-description>`
2. **Fix on branch:** Minimal code change, focused on issue only
3. **Fast-track CI:** Standard gates still apply (no skipping tests)
4. **Abbreviated sign-off:** Engineering Lead + QA Lead approval sufficient
5. **Deploy immediately:** Follow `OPS_RUNBOOK.md` §2.2
6. **Post-deploy:** Full retro within 24h, update BUG_TRIAGE.md

**Documentation:**
- Update `/Docs/releases/<phase>.md` with hotfix entry
- Bump patch version if using semantic versioning

---

## 8. Checklist Maintenance

**Review Cadence:** After every Wave Delta release

**Update Triggers:**
- New testing tools added (e.g., automated soak tests)
- Lighthouse threshold changes
- New accessibility standards
- Monitoring dashboards implemented

**Changelog:**

| Date | Change | Author |
|------|--------|--------|
| 2025-11-09 | Initial version created for Homestead Wave Delta | QA Lead |

**Next Review:** Before Township Wave Alpha (Week 13)

---

## Quick Reference: Pre-Release Commands

```bash
# Run all checks locally before requesting sign-off
cd web

# 1. Code quality
npm run lint
npm run test
npm run validate:data

# 2. Build
npm run build

# 3. Visual tests
npm run test:visual

# 4. Migration test
npm run migrate -- --dry-run

# 5. Preview build
npm run preview
# Then run Lighthouse audit in Chrome DevTools

# 6. Offline test
# Load in browser, disconnect network, verify works offline
```

---

**Document Owner:** QA Lead (primary), Producer (backup)
