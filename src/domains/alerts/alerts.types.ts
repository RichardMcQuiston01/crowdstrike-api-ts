export interface AlertSearchParams {
  filter?: string;
  /** Free-text search query. */
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
  includeHidden?: boolean;
}

export interface AlertSearchResult {
  compositeIds: string[];
  pagination: { offset: number; limit: number; total: number };
}

/** Friendlier, camelCased shape of a CrowdStrike alert (DetectsExternalAlert). */
export interface AlertDetails {
  compositeId: string;
  severity: number;
  severityName?: string;
  status: string;
  assignedToName?: string;
  assignedToUuid?: string;
  tactic?: string;
  technique?: string;
  createdTimestamp?: string;
  updatedTimestamp?: string;
  agentId?: string;
  platform?: string;
  raw: Record<string, unknown>;
}

export interface CombinedAlertSearchParams {
  filter?: string;
  sort?: string;
  limit?: number;
}

export type AlertStatus = 'new' | 'in_progress' | 'closed' | 'reopened';

export interface UpdateAlertStatusParams {
  compositeIds: string[];
  status: AlertStatus;
}

export interface UpdateAlertParams {
  compositeIds: string[];
  actionParameters: Array<{ name: string; value: string }>;
}
