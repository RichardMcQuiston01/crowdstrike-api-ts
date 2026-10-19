# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-10-19

### Added

- `funding` entry in `package.json` so `npm fund` and the npm page show the donate link.

### Changed

- README donate section standardized as "Buy Me a Coffee" and moved to the end of the file.

## [0.3.0] - 2026-10-10

Fixes for the issues raised in a Grok review (#10–#18). Several fixes change behavior that callers could previously
rely on; see **Changed** and **Migration notes**.

### Security

- Base URLs are validated before any credential is sent: userinfo, non-`https:` schemes, and non-origin values are
  rejected. Plain `http:` is allowed only for `localhost` / `127.0.0.1` / `[::1]` with the new
  `allowInsecureLoopback` config option. Request paths must be a single absolute path (no `//host`, absolute URLs, or
  backslashes) so the bearer token cannot be redirected to another host (#10).
- `CaseReportComposite.get()` escapes `\` and `'` in the case id before building its FQL filter (#11).
- A 2xx response whose body has `errors` and no `resources` now throws `CrowdStrikeApiError` instead of being
  returned as empty data (#12).

### Fixed

- Case reports now page through every alert for the case (up to the query endpoint's 10,000-result window) and expose
  `totalAlerts` / `alertsTruncated` (#13).
- The request timeout now applies when the caller passes an `AbortSignal`, and also covers reading the response body.
  `CrowdStrikeNetworkError` has a `code` (`'timeout' | 'aborted' | 'network'`) with distinct messages (#14).
- Short-lived tokens (`expires_in` ≤ 60s) are cached instead of refetched on every call, and a token fetch that
  started before `invalidate()` no longer repopulates the cache (#15).
- Id lookups and deletes sent as repeated query parameters are chunked (100 ids per request; 50 for sensor
  installers) across discover, prevention policies, IOC, sensor download, host groups, cloud security, and custom IOA.
  An empty id list makes no request (#16).
- RTR execute calls get a unique per-session sequence id (shared across read-only, active-responder, and admin
  commands) when `id` is omitted; `CommandExecuteResult.sequenceId` is returned for status polling (#17).
- `paginateCursor` stops when the `after` token does not advance and `paginateOffset` stops on a non-finite `total`
  (#18).

### Changed

- Mutating methods that returned `void` (host / host-group / user / prevention-policy actions, deletes, tag updates,
  alert updates, IOC delete, custom IOA deletes) now return `ActionResult { resources, errors }` so per-id failures
  are visible. `deleteSession` still returns `void` (#12).
- Single-entity methods throw `CrowdStrikeApiError` (with the response `errors`) on an empty result instead of a
  `TypeError` inside a mapper (#12).
- `HostDetails.groupIds` is mapped from the device `groups` field; `HostsWithGroupsComposite` uses it (#18).
- One shared `readOffsetPagination` replaces the per-domain copies; an offset response whose `meta.pagination` has no
  numeric `total` now throws instead of being cast (#18).
- `HttpClient` no longer references `Bun.BodyInit` in its types (#18).

### Migration notes

- A `baseUrl` with userinfo, a path, or a non-`https:` scheme now throws `CrowdStrikeAuthConfigError` when the client
  is constructed. For a local mock server use an `http://localhost` URL with `allowInsecureLoopback: true`.
- Code that constructs `HostDetails` or `CaseReport` objects by hand must add `groupIds` / `totalAlerts` and
  `alertsTruncated`.
- Calls that previously "succeeded" on an all-failed 2xx response will now throw.

## [0.2.3] - 2026-08-17

### Changed

- Reworded the README **Support** section and pointed the donation link at Stripe (replacing the previous
  PayPal link), with a scannable QR code (`donate.svg`).

### Added (repository tooling, not shipped in the published package)

- Runnable demo script (`examples/demo.ts`) exercising the hosts, alerts, and users domains.
- Docker setup (`Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.env.example`) to run the demo without a
  local toolchain.
- GitHub Actions workflow (`.github/workflows/docker-demo.yml`) that builds and smoke-tests the demo image.

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
