export interface IocSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
  after?: string;
  fromParent?: boolean;
}

export interface IocSearchResult {
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface IocCombinedSearchResult {
  iocs: IocDetails[];
  pagination: { offset: number; limit: number; total: number };
}

export interface IocDetails {
  id?: string;
  type?: string;
  value?: string;
  action?: string;
  appliedGlobally?: boolean;
  createdBy?: string;
  createdOn?: string;
  deleted?: boolean;
  description?: string;
  expiration?: string;
  expired?: boolean;
  fromParent?: boolean;
  hostGroups?: string[];
  mobileAction?: string;
  modifiedBy?: string;
  modifiedOn?: string;
  parentCidName?: string;
  platforms?: string[];
  severity?: string;
  source?: string;
  tags?: string[];
  raw: Record<string, unknown>;
}

export interface CreateIocIndicatorParams {
  type: string;
  value: string;
  appliedGlobally: boolean;
  action?: string;
  description?: string;
  expiration?: string;
  hostGroups?: string[];
  mobileAction?: string;
  platforms?: string[];
  severity?: string;
  source?: string;
  tags?: string[];
}

export interface CreateIocParams {
  comment?: string;
  indicators: CreateIocIndicatorParams[];
  retrodetects?: boolean;
  ignoreWarnings?: boolean;
}

export interface DeleteIocParams {
  ids?: string[];
  filter?: string;
  comment?: string;
  fromParent?: boolean;
}
