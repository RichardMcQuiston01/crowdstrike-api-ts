export interface DiscoverSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface DiscoverIdSearchResult {
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface DiscoverCombinedSearchParams {
  filter: string;
  limit?: number;
  sort?: string;
  /** Restricts the response to only the named fields (reduces payload size). */
  facet?: string[];
}

export interface DiscoverCursorPagination {
  after?: string;
  limit: number;
  total: number;
}

/**
 * Friendlier, camelCased shape of a Falcon Discover asset (DomainDiscoverAPIHost).
 * The real entity has 140+ optional fields describing hardware, AD, cloud, and
 * IoT/OT metadata; only the most broadly useful ones are surfaced here — the
 * rest remain available via `raw`.
 */
export interface DiscoverHostDetails {
  id: string;
  cid: string;
  hostname?: string;
  fqdn?: string;
  aid?: string;
  agentVersion?: string;
  platformName?: string;
  osVersion?: string;
  entityType?: string;
  criticality?: string;
  internetExposure?: string;
  externalIp?: string;
  currentLocalIp?: string;
  localIpAddresses?: string[];
  macAddresses?: string[];
  firstSeenTimestamp?: string;
  lastSeenTimestamp?: string;
  discoveringBy?: string[];
  dataProviders?: string[];
  tags?: string[];
  groups?: string[];
  managedBy?: string;
  ownedBy?: string;
  department?: string;
  systemManufacturer?: string;
  systemProductName?: string;
  raw: Record<string, unknown>;
}

export interface DiscoverHostSearchResult {
  hosts: DiscoverHostDetails[];
  pagination: DiscoverCursorPagination;
}

export interface DiscoverApplicationDetails {
  id: string;
  cid: string;
  name?: string;
  vendor?: string;
  version?: string;
  category?: string;
  softwareType?: string;
  groups?: string[];
  installationPaths?: string[];
  firstSeenTimestamp?: string;
  lastUsedTimestamp?: string;
  isSuspicious?: boolean;
  raw: Record<string, unknown>;
}

export interface DiscoverApplicationSearchResult {
  applications: DiscoverApplicationDetails[];
  pagination: DiscoverCursorPagination;
}

export interface DiscoverAccountDetails {
  id: string;
  cid: string;
  accountName?: string;
  accountType?: string;
  username?: string;
  loginDomain?: string;
  adminPrivileges?: string;
  localAdminPrivileges?: string;
  lastSuccessfulLoginTimestamp?: string;
  lastSuccessfulLoginHostname?: string;
  lastFailedLoginTimestamp?: string;
  firstSeenTimestamp?: string;
  raw: Record<string, unknown>;
}

export interface DiscoverLoginDetails {
  id?: string;
  cid?: string;
  accountId?: string;
  accountName?: string;
  hostId?: string;
  hostname?: string;
  username?: string;
  loginType?: string;
  loginStatus?: string;
  loginTimestamp?: string;
  remoteIp?: string;
  localIp?: string;
  isSuspicious?: boolean;
  loginEventCount?: number;
  raw: Record<string, unknown>;
}
