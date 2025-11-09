# Farm to Stars — Tools & Validation

This directory contains CLI utilities, data validators, and phase converters for the Farm to Stars development pipeline.

## Directory Structure

```
tools/
├── cli/              # CLI entry points for development workflows
├── validation/       # Data schema validators and linters
└── converters/       # Phase-to-phase state converters
    ├── township-to-nation/    (Planned for Weeks 25+)
    └── nation-to-stellar/     (Planned for Weeks 41+)
```

## Available Commands

### Data Validation

```bash
# Validate all JSON data files against schemas
npm run validate:data

# Validate specific file
node tools/cli/validate.mjs --file web/src/data/buildings.json

# Validate with verbose output
node tools/cli/validate.mjs --verbose
```

**What it validates:**
- `web/src/data/*.json` files against `Docs/DATA_SCHEMAS.md` specifications
- Required fields present
- Type correctness (numbers, strings, arrays, objects)
- Value ranges (e.g., buildTime > 0)
- Cross-references (e.g., recipe inputs reference valid resources)

**Exit codes:**
- `0` — All validations passed
- `1` — One or more validation errors (fails CI)

### Phase Converters

**Homestead → Township:** Available via game UI (feature flag: `?feature.exportTownship=true`)
- Generator: `web/src/sim/export/homesteadToTownship.ts`
- Schema: `web/content/township/import.json`

**Township → Nation:** (Planned for Week 25)
**Nation → Stellar:** (Planned for Week 41)

## Development Workflow

### Adding New Data Files

1. **Author JSON file** in `web/src/data/<name>.json`
2. **Document schema** in `Docs/DATA_SCHEMAS.md`
3. **Create validator** in `tools/validation/schemas/<name>.mjs`
4. **Add test** in `web/src/data/__tests__/<name>.test.ts`
5. **Run validation:** `npm run validate:data`

### CI Integration

The `validate:data` script runs automatically in GitHub Actions on every PR targeting `main`. Schema drift will fail the build.

**Required checks:**
- ✅ All JSON files parse without errors
- ✅ All required fields present
- ✅ Type safety validated
- ✅ Cross-references resolved

## Tooling Roadmap

### Phase I: Homestead (Weeks 8-12)
- [x] Tools directory structure
- [x] JSON schema validators
- [x] CLI validation harness
- [ ] Localization extractors (deferred to Phase II)

### Phase II: Township (Weeks 13-24)
- [ ] Localization string extractors (`i18n:extract`)
- [ ] Localization compilers (`i18n:compile`)
- [ ] Township import validator
- [ ] Zoning validator (automated QA)

### Phase III: Nation (Weeks 25-40)
- [ ] Township→Nation converter CLI
- [ ] Map editor CLI
- [ ] Balance simulator (Monte Carlo)
- [ ] Mod API documentation generator

### Phase IV: Stellar (Weeks 41-56)
- [ ] Nation→Stellar converter CLI
- [ ] Procedural seed validator
- [ ] NG+ seed generator
- [ ] Release ops scripts

## Dependencies

**Runtime:**
- Node.js 20.x LTS
- No additional packages (uses built-in `fs`, `path`, `JSON.parse`)

**Future (when needed):**
- AJV (JSON schema validation library)
- Commander (CLI argument parsing)
- Chalk (colored terminal output)

## Maintenance

**Owner:** Lead Engineer + Tools Engineer
**Update Cadence:** Add new validators when data files are added; update schema checks when `DATA_SCHEMAS.md` changes
**Documentation:** Keep this README in sync with available commands

---

*Last updated: 2025-11-09 (Week 10 — Homestead completion)*
