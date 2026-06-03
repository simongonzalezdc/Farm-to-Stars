# Security Policy

## Supported Versions

Security fixes target the current `main` branch and latest public release. Archived prototypes are not supported unless the same issue affects current code.

## Reporting a Vulnerability

Please do not open a public issue with exploit details, credentials, private save data, or personal information.

Report security concerns through GitHub Security Advisories or email `security@kyanitelabs.tech` with:

- affected package or route;
- impact and reproduction steps;
- whether local saves, telemetry, or private data was exposed;
- browser and Node version.

Expected response: acknowledgement within 3 business days, triage within 7 business days, and a fix or mitigation plan based on severity.

## Project Security Notes

Farm to Stars is a browser game prototype and PWA. Local saves, playtest telemetry, generated reports, and unpublished design notes should stay out of the repository unless intentionally sanitized for public release.

Before a release, run:

```bash
npm audit --audit-level=high
npm run build
cd web
npm audit --audit-level=high
npm run lint
npm run build
npm test
gitleaks dir .. --no-banner --redact
```

