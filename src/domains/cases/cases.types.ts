export interface CaseSearchParams {
  filter?: string;
  /** Free-text search query. */
  q?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface CaseSearchResult {
  caseIds: string[];
  pagination: { offset: number; limit: number; total: number };
}

/**
 * Friendlier, camelCased shape of a CrowdStrike case (SdkCaseVM). Only the
 * well-known scalar fields are surfaced directly; nested objects (assignee,
 * severity info, evidence, workflows, etc.) are available via `raw`.
 */
export interface CaseDetails {
  id: string;
  cid: string;
  name: string;
  description: string;
  status: string;
  severity: number;
  referenceId: string;
  tags?: string[];
  createdTimestamp: string;
  updatedTimestamp: string;
  startTimestamp: string;
  endTimestamp: string;
  version: number;
  raw: Record<string, unknown>;
}

export interface AddCaseTagsParams {
  id: string;
  tags: string[];
}

export interface RemoveCaseTagsParams {
  id: string;
  tags: string[];
}
