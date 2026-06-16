# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project purpose

A vanilla-TypeScript helper package meant to be integrated into other TypeScript applications (e.g., an Electron
desktop app or a backend API service) for interacting with the CrowdStrike Falcon API. It ships as a dual ESM/CJS
package with bundled `.d.ts` types, consumable from any Node-based app without requiring `bun` at runtime.

CrowdStrike's official SDK ("FalconJS", `github.com/CrowdStrike/falconjs`) is used only as a documentation/reference
source for real endpoint paths, params, and response shapes — it is not a runtime dependency. Every domain is a
hand-written, friendlier wrapper grounded against FalconJS's real `*Api.ts` files and model `FromJSONTyped()`
functions (the most reliable source of true wire-format field names).

Relevant external references:
- [CrowdStrike API Documentation](https://developer.crowdstrike.com/api-reference/overview/)
- [CrowdStrike API TypeScript SDK](https://developer.crowdstrike.com/sdks/typescript/)

## Commands

- `bun install` — install dependencies.
- `bun test` — run the full test suite (bun:test). Run a single file with `bun test src/domains/hosts/hosts.client.test.ts`.
- `bun run typecheck` — `tsc --noEmit`, no build output.
- `bun run lint` — `gts lint` (Google TypeScript Style via ESLint flat config + Prettier).
- `bun run lint:fix` — auto-fixes most lint/formatting errors. Prettier formatting errors are extremely common after
  writing new multi-line function signatures or object/array literals; always run this and re-verify with `lint`
  rather than hand-formatting.
- `bun run build` — `tsup`, produces `dist/index.js` (ESM), `dist/index.cjs` (CJS), `dist/index.d.ts` / `index.d.cts`.
- `bun run clean` — removes build output.
- `bun run prepublishOnly` — clean + typecheck + lint + test + build, run automatically before publish.

Local CI-equivalent before considering any change done: `bun run typecheck && bun run lint && bun test`.

## Architecture

### Core (`src/core/`, `src/config.ts`)

- `HttpClient` (`core/http-client.ts`) is the single choke point all domain request-builders funnel through: builds
  the URL/query (`URLSearchParams`, arrays become repeated keys), attaches `Authorization: Bearer`, applies an
  `AbortController` timeout, retries once on 401 after invalidating the cached token, and throws `CrowdStrikeApiError`
  on non-2xx responses.
- `RequestOptions<TBody>.query` is typed `Record<string, QueryValue>`. Passing a named interface variable directly as
  `query: someParamsObject` fails type-checking even when every property is a valid `QueryValue`, because TypeScript
  only allows structural assignment to an index-signature type via an object literal or a source type that itself
  declares an index signature. Always destructure into an inline literal: `query: {offset: params.offset, limit: params.limit}`.
- `OAuth2TokenManager` (`core/auth.ts`) fetches/caches/refreshes the bearer token with a 60s expiry skew and
  de-dupes concurrent fetches into one in-flight promise. It depends on `Oauth2Client`, which itself goes through an
  unauthenticated `HttpClient` (no token provider) since the token endpoint call carries no bearer token.
- `core/errors.ts` — `CrowdStrikeApiError` (status, traceId, `errors[]`, `requestPath`, `isAuthError`/`isRateLimited`
  getters), `CrowdStrikeNetworkError` (fetch/timeout failures), `CrowdStrikeAuthConfigError` (missing credentials,
  thrown synchronously from constructors).
- `core/pagination.ts` — CrowdStrike uses two pagination styles. `paginateOffset()` for the standard
  `{offset,limit,total}` meta block (most `query*`/`combined*` endpoints), `paginateCursor()` for `after`-token based
  endpoints (high-volume bulk endpoints, e.g. Alerts' `searchCombinedAll`). Both are async generators; `collectAll()`
  drains one into an array. A domain may define its own richer pagination meta/envelope type for its public surface
  when the wire shape doesn't cleanly match either core type (see Discover's `DiscoverCombinedEnvelope`) — that's
  domain-specific and doesn't require touching `core/pagination.ts` or `core/types.ts`.
- `config.ts` — `FalconRegion` enum (`US1` default, `US2`, `EU1`, `USGOV1`) and `FalconClientConfig`.

### Domain module pattern (`src/domains/<name>/`)

Every domain follows the same five-file shape — this uniformity is what makes adding more of CrowdStrike's ~141
FalconJS service collections mechanical:

- `<name>.types.ts` — camelCased friendly interfaces. Hydrated entities carry a `raw: Record<string, unknown>`
  escape hatch holding the untransformed wire payload.
- `<name>.requests.ts` — pure, I/O-free functions returning `RequestOptions` for each real endpoint. No HTTP calls;
  trivially unit-testable.
- `<name>.mapper.ts` — the raw snake_case wire interface(s) plus `mapRaw...()` function(s) converting to the friendly
  type. Field names are verified against FalconJS's real model `FromJSONTyped()` bodies, not guessed from camelCase
  convention.
- `<name>.client.ts` — a class wrapping a single injected `HttpClient`, exposing one method per endpoint plus
  in-domain convenience methods (e.g. `searchWithDetails()` that chains the domain's own search + hydrate calls).
- `<name>.client.test.ts` — bun:test, one `describe` per public method. Mocks the injected `HttpClient.request`
  directly (no real fetch).
- `__fixtures__/*.json` — realistic snake_case sample payloads exercised by the mapper tests.

When FalconJS exposes two non-deprecated methods that look like versions of the same operation but differ in real
semantics (e.g. Custom IOA's `updateRules` v1 requiring the complete state of every rule in a group vs. `updateRulesV2`
accepting a partial subset), build both as first-class methods rather than treating one as superseding the other.

Implemented domains: hosts, host-groups, cases (CrowdStrike's Case Management API, which replaced the deprecated
Incidents API), alerts, real-time-response (+ real-time-response-admin), container-vulnerabilities, intel, ioc,
cloud-security, identity-protection, sensor-download, prevention-policies, users, discover, custom-ioa. `oauth2` is
internal-only, consumed by `core/auth.ts` and not exposed on `FalconClient`. `detects` was intentionally skipped —
CrowdStrike decommissioned that API on 2025-09-30 in favor of Alerts.

### Top-level client (`src/client.ts`)

`FalconClient` takes one `FalconClientConfig`, builds one shared authenticated `HttpClient` (plus a second,
token-less `HttpClient` used only to bootstrap the OAuth2 token fetch itself), and instantiates every domain client
as a readonly property. Property names are the camelCase of the FalconJS class name minus `Api`
(`RealTimeResponseAdminApi` → `realTimeResponseAdmin`) to keep a 1:1 mental map back to official docs.

### Custom composite endpoints (`src/custom/`)

A function belongs here only if it joins two or more distinct domain clients, or implements a workflow with no
single corresponding CrowdStrike REST endpoint. Anything touching only one domain's own endpoints stays a
convenience method on that domain's `*.client.ts` instead. `CustomEndpoints` (exposed as `client.custom`) takes the
relevant domain client instances as constructor deps. Composite tests mock the domain clients directly (already
independently tested against mocked HTTP), not raw HTTP.

### Public barrel (`src/index.ts`)

Exports `FalconClient`, `FalconRegion`/`FalconClientConfig`, the error classes, shared envelope/pagination types and
helpers, every domain's client class plus its `*.types.ts` (via `export type *`), and everything from `src/custom`.
Domain `*.requests.ts` and `*.mapper.ts` internals are never exported — they're implementation detail reached only
through a domain client's methods.
