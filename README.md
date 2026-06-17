# @richardmcquiston01/crowdstrike-ts-api

A TypeScript helper package for interacting with the [CrowdStrike Falcon API](https://developer.crowdstrike.com/api-reference/overview/).
Designed to be embedded into any Node-based application — an Electron desktop app, a backend API service, or a CLI
tool — without requiring `bun` at runtime.

Ships as a dual ESM/CJS package with bundled `.d.ts` types, so it works with any modern module system.

## Requirements

- **Node.js** 18 or later (uses the native `fetch` API; earlier versions require a polyfill via the `fetch` config
  option)
- **TypeScript** 5.0 or later (for consuming the bundled type declarations)
- A CrowdStrike Falcon API **client ID** and **client secret** with the scopes required by the domains you intend to
  use. Credentials are obtained from the [Falcon console](https://falcon.crowdstrike.com/api-clients-and-keys/clients).

## Installation

```sh
npm install @richardmcquiston01/crowdstrike-ts-api
# or
bun add @richardmcquiston01/crowdstrike-ts-api
```

## Configuration

Instantiate `FalconClient` with a `FalconClientConfig` object:

```ts
import { FalconClient, FalconRegion } from '@richardmcquiston01/crowdstrike-ts-api';

const client = new FalconClient({
  clientId: process.env.FALCON_CLIENT_ID!,
  clientSecret: process.env.FALCON_CLIENT_SECRET!,
  baseUrl: FalconRegion.US1, // optional — US1 is the default
});
```

### `FalconClientConfig`

| Property | Type | Required | Description |
|---|---|---|---|
| `clientId` | `string` | yes | OAuth2 client ID from the Falcon console |
| `clientSecret` | `string` | yes | OAuth2 client secret |
| `baseUrl` | `FalconRegion \| string` | no | API base URL. Defaults to `FalconRegion.US1` |
| `memberCid` | `string` | no | MSSP child CID to act on behalf of |
| `fetch` | `typeof fetch` | no | Custom fetch implementation (useful for proxies or testing) |
| `timeoutMs` | `number` | no | Per-request timeout in milliseconds. Defaults to `30000` |

### `FalconRegion`

| Value | Base URL |
|---|---|
| `FalconRegion.US1` | `https://api.crowdstrike.com` |
| `FalconRegion.US2` | `https://api.us-2.crowdstrike.com` |
| `FalconRegion.EU1` | `https://api.eu-1.crowdstrike.com` |
| `FalconRegion.USGOV1` | `https://api.laggar.gcw.crowdstrike.com` |

## Usage

Each API domain is exposed as a typed property on the `FalconClient` instance. OAuth2 token acquisition and refresh
are handled automatically.

```ts
// Search for hosts matching a hostname filter
const results = await client.hosts.searchWithDetails({
  filter: "hostname:'web-server-01'",
  limit: 10,
});

// List active alerts
const alerts = await client.alerts.combinedAlerts({ limit: 50 });

// Paginate through all discovered assets
import { collectAll } from '@richardmcquiston01/crowdstrike-ts-api';

const allAssets = await collectAll(
  client.discover.searchCombinedAll({ filter: "entity_type:'managed'" })
);
```

## Available domains

| Client property | CrowdStrike API area |
|---|---|
| `client.hosts` | Device/host inventory |
| `client.hostGroups` | Host group management |
| `client.alerts` | Unified alerts (replaces the decommissioned Detections API) |
| `client.cases` | Case management |
| `client.realTimeResponse` | Real-time response sessions |
| `client.realTimeResponseAdmin` | RTR admin commands |
| `client.containerVulnerabilities` | Container image vulnerabilities |
| `client.intel` | Threat intelligence |
| `client.ioc` | Indicators of compromise |
| `client.cloudSecurity` | Cloud security posture |
| `client.identityProtection` | Identity-based detections |
| `client.sensorDownload` | Sensor installer downloads |
| `client.preventionPolicies` | Prevention policy management |
| `client.users` | User and role management |
| `client.discover` | Asset discovery |
| `client.customIoa` | Custom IOA rule management |
| `client.custom` | Multi-domain composite workflows |

## Error handling

Three error classes are exported for typed `catch` blocks:

```ts
import {
  CrowdStrikeApiError,
  CrowdStrikeNetworkError,
  CrowdStrikeAuthConfigError,
} from '@richardmcquiston01/crowdstrike-ts-api';

try {
  const host = await client.hosts.getHostDetails(['invalid-id']);
} catch (err) {
  if (err instanceof CrowdStrikeApiError) {
    console.error(`API error ${err.status} on ${err.requestPath}`);
    if (err.isAuthError) { /* re-check credentials */ }
    if (err.isRateLimited) { /* back off and retry */ }
  } else if (err instanceof CrowdStrikeNetworkError) {
    console.error(`Network failure: ${err.message}`);
  } else if (err instanceof CrowdStrikeAuthConfigError) {
    console.error(`Bad config: ${err.message}`);
  }
}
```

| Class | When thrown |
|---|---|
| `CrowdStrikeApiError` | Non-2xx HTTP response from the Falcon API |
| `CrowdStrikeNetworkError` | DNS failure, connection reset, or request timeout |
| `CrowdStrikeAuthConfigError` | Missing or invalid credentials at construction time |

## Resources

- [CrowdStrike API documentation](https://developer.crowdstrike.com/api-reference/overview/)
- [CrowdStrike TypeScript SDK reference](https://developer.crowdstrike.com/sdks/typescript/)
- [Falcon console — API clients and keys](https://falcon.crowdstrike.com/api-clients-and-keys/clients)

## License

[MIT](./LICENSE) © 2026 Richard McQuiston
