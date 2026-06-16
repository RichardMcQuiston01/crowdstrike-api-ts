export interface IntelIndicatorSearchParams {
  filter?: string;
  q?: string;
  sort?: string;
  offset?: number;
  limit?: number;
  includeDeleted?: boolean;
  includeRelations?: boolean;
}

export interface IntelIndicatorSearchResult {
  indicators: IntelIndicatorDetails[];
  pagination: {offset: number; limit: number; total: number};
}

export interface IntelIndicatorIdSearchResult {
  ids: string[];
  pagination: {offset: number; limit: number; total: number};
}

export interface IntelIndicatorDetails {
  id?: string;
  indicatorValue?: string;
  type?: string;
  maliciousConfidence?: string;
  publishedDate?: number;
  lastUpdated?: number;
  deleted?: boolean;
  killChains?: string[];
  malwareFamilies?: string[];
  actors?: string[];
  reports?: string[];
  targets?: string[];
  threatTypes?: string[];
  vulnerabilities?: string[];
  domainTypes?: string[];
  ipAddressTypes?: string[];
  labels?: unknown[];
  relations?: unknown[];
  raw: Record<string, unknown>;
}
