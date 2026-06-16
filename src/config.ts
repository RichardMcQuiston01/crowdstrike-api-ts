/** CrowdStrike Falcon cloud regions and their API base URLs. */
export enum FalconRegion {
  US1 = 'https://api.crowdstrike.com',
  US2 = 'https://api.us-2.crowdstrike.com',
  EU1 = 'https://api.eu-1.crowdstrike.com',
  USGOV1 = 'https://api.laggar.gcw.crowdstrike.com',
}

/** Configuration accepted by FalconClient. */
export interface FalconClientConfig {
  clientId: string;
  clientSecret: string;
  /** Defaults to FalconRegion.US1. Accepts a FalconRegion or a raw base-url string. */
  baseUrl?: FalconRegion | string;
  /** Optional MSSP child CID to act on behalf of. */
  memberCid?: string;
  /** Override the fetch implementation (useful for tests, or custom proxies). */
  fetch?: typeof fetch;
  /** Request timeout in ms. Defaults to 30000. */
  timeoutMs?: number;
}
