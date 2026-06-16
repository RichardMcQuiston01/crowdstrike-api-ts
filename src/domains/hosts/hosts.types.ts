export interface HostSearchParams {
  /** FQL filter string, e.g. "platform_name:'Windows'". */
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface HostSearchResult {
  hostIds: string[];
  pagination: {offset: number; limit: number; total: number};
}

/** Friendlier, camelCased shape of a CrowdStrike device entity. */
export interface HostDetails {
  deviceId: string;
  cid: string;
  hostname?: string;
  localIp?: string;
  externalIp?: string;
  osVersion?: string;
  platformName?: string;
  agentVersion?: string;
  status?: string;
  lastSeen?: string;
  firstSeen?: string;
  tags?: string[];
  /** Escape hatch: the full untransformed device payload. */
  raw: Record<string, unknown>;
}

/** Supported action_name values for HostsApi.performActionV2. */
export type HostAction = 'contain' | 'lift_containment' | 'delete' | 'restore';

export interface PerformHostActionParams {
  ids: string[];
  action: HostAction;
}

export type UpdateHostTagsAction = 'add' | 'remove';

export interface UpdateHostTagsParams {
  ids: string[];
  tags: string[];
  action: UpdateHostTagsAction;
}
