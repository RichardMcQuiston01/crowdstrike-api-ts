/**
 * The real `offset` request param on every ioarules query/search endpoint is
 * typed as a string in CrowdStrike's spec (legacy quirk), even though the
 * pagination meta returned in the response uses numeric offset/limit/total
 * (the standard MsaPaging shape). Both are preserved as-is rather than
 * normalized, since callers paging through this API need to pass the value
 * back exactly as documented.
 */
export interface CustomIoaSearchParams {
  sort?: string;
  filter?: string;
  q?: string;
  offset?: string;
  limit?: number;
}

export interface CustomIoaIdSearchResult {
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface RuleValueOption {
  label: string;
  value: string;
}

export interface RuleFieldValue {
  name: string;
  type: string;
  value: string;
  label?: string;
  finalValue?: string;
  values?: RuleValueOption[];
}

export interface CustomIoaRuleDetails {
  instanceId: string;
  rulegroupId: string;
  ruletypeId: string;
  ruletypeName?: string;
  name: string;
  description?: string;
  comment?: string;
  actionLabel?: string;
  dispositionId: number;
  patternId?: string;
  patternSeverity: string;
  enabled: boolean;
  deleted?: boolean;
  fieldValues: RuleFieldValue[];
  instanceVersion?: number;
  versionIds?: string[];
  createdBy?: string;
  createdOn?: string;
  modifiedBy?: string;
  modifiedOn?: string;
  raw: Record<string, unknown>;
}

export interface CustomIoaRuleGroupDetails {
  id: string;
  name: string;
  description?: string;
  comment?: string;
  platform: string;
  enabled: boolean;
  deleted?: boolean;
  version?: number;
  ruleIds: string[];
  rules: CustomIoaRuleDetails[];
  createdBy?: string;
  createdOn?: string;
  modifiedBy?: string;
  modifiedOn?: string;
  raw: Record<string, unknown>;
}

export interface CreateRuleGroupParams {
  name: string;
  description: string;
  platform: string;
  comment: string;
}

export interface UpdateRuleGroupParams {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  comment: string;
  rulegroupVersion: number;
}

export interface CreateRuleParams {
  rulegroupId: string;
  ruletypeId: string;
  name: string;
  description: string;
  comment: string;
  dispositionId: number;
  patternSeverity: string;
  fieldValues: RuleFieldValue[];
}

export interface RuleUpdate {
  instanceId: string;
  name: string;
  description: string;
  enabled: boolean;
  dispositionId: number;
  patternSeverity: string;
  fieldValues: RuleFieldValue[];
  rulegroupVersion: number;
}

export interface UpdateRulesParams {
  rulegroupId: string;
  rulegroupVersion: number;
  comment: string;
  ruleUpdates: RuleUpdate[];
}

export interface ValidateRuleField {
  name: string;
  type: string;
  testData: string;
  values?: RuleValueOption[];
}

export interface FieldValidationResult {
  name: string;
  value: string;
  bytes: string;
  valid: boolean;
  matchesTest?: boolean;
  testData?: string;
  error?: string;
}

export interface PatternSeverity {
  name: string;
  severity: string;
}

export interface IoaPlatform {
  id: string;
  label: string;
}

export interface RuleTypeDetails {
  id: string;
  name: string;
  platform: string;
  longDesc?: string;
  channel?: number;
  released?: boolean;
  dispositionMap: Record<string, unknown>[];
  fields: Record<string, unknown>[];
  raw: Record<string, unknown>;
}

export interface LookupSearchParams {
  offset?: string;
  limit?: number;
}
