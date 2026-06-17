# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-06-17

### Added

- `FalconClient` — top-level entry point composing all domain clients behind a single authenticated HTTP layer
- OAuth2 token acquisition, caching, and automatic refresh via `OAuth2TokenManager`
- Dual ESM/CJS build with bundled TypeScript declarations (`.d.ts` / `.d.cts`)
- Offset and cursor pagination helpers: `paginateOffset()`, `paginateCursor()`, `collectAll()`
- Typed error classes: `CrowdStrikeApiError`, `CrowdStrikeNetworkError`, `CrowdStrikeAuthConfigError`
- Domain clients: `hosts`, `hostGroups`, `alerts`, `cases`, `realTimeResponse`, `realTimeResponseAdmin`,
  `containerVulnerabilities`, `intel`, `ioc`, `cloudSecurity`, `identityProtection`, `sensorDownload`,
  `preventionPolicies`, `users`, `discover`, `customIoa`
- `custom` composite endpoints for multi-domain workflows
- Support for all four Falcon regions: `US1`, `US2`, `EU1`, `USGOV1`
