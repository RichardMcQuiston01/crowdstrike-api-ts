export interface CloudResourceSearchParams {
  filter?: string;
  sort?: string;
  offset?: number;
  limit?: number;
}

export interface CloudResourceIdSearchResult {
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface CloudResourceDetails {
  id?: string;
  cid?: string;
  resourceId?: string;
  resourceName?: string;
  resourceType?: string;
  resourceTypeName?: string;
  cloudProvider?: string;
  accountId?: string;
  accountName?: string;
  region?: string;
  service?: string;
  serviceCategory?: string;
  status?: string;
  active?: boolean;
  firstSeen?: string;
  updatedAt?: string;
  tags?: unknown[];
  cloudLabels?: unknown[];
  cloudGroups?: string[];
  raw: Record<string, unknown>;
}

export interface ApplicationFindingsParams {
  crn?: string;
  gcrn?: string;
  type?: string;
  filter?: string;
  offset?: number;
  limit?: number;
}

export interface ApplicationFindingsResult {
  findings: ApplicationFinding[];
  pagination: { offset: number; limit: number; total: number };
}

export interface ApplicationFinding {
  crn?: string;
  findingType?: string;
  findings?: unknown[];
  raw: Record<string, unknown>;
}
