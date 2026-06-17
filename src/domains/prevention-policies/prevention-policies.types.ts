export type PreventionPolicyPlatform = 'Windows' | 'Mac' | 'Linux';

export interface PreventionPolicySearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface PreventionPolicyIdSearchResult {
  ids: string[];
  pagination: { offset: number; limit: number; total: number };
}

export interface PreventionPolicySearchResult {
  policies: PreventionPolicyDetails[];
  pagination: { offset: number; limit: number; total: number };
}

export interface PreventionPolicyDetails {
  id: string;
  cid: string;
  name: string;
  description?: string;
  platformName: PreventionPolicyPlatform;
  enabled: boolean;
  /** Host groups this policy is assigned to; kept as raw records (see Host Groups domain for the typed shape). */
  groups: Record<string, unknown>[];
  /** IOA rule groups attached to this policy; kept as raw records (see Custom IOA domain). */
  ioaRuleGroups: Record<string, unknown>[];
  /** Per-category prevention toggles/sliders; structure varies by platform and category. */
  preventionSettings: Record<string, unknown>[] | null;
  createdBy?: string;
  createdTimestamp?: string;
  modifiedBy?: string;
  modifiedTimestamp?: string;
  raw: Record<string, unknown>;
}

export interface PreventionPolicySetting {
  /** The id of the setting to update. */
  id: string;
  /** Shape varies by setting type, e.g. {enabled: true} or {detection: 'MODERATE', prevention: 'MODERATE'}. */
  value: Record<string, unknown>;
}

export interface CreatePreventionPolicyParams {
  name: string;
  platformName: PreventionPolicyPlatform;
  description?: string;
  /** If set, the new policy starts from this existing policy's settings. */
  cloneId?: string;
  settings?: PreventionPolicySetting[];
}

export interface UpdatePreventionPolicyParams {
  id: string;
  name?: string;
  description?: string;
  settings: PreventionPolicySetting[];
}

/** Supported action_name values for PreventionPoliciesApi.performPreventionPoliciesAction. */
export type PreventionPolicyAction =
  | 'enable'
  | 'disable'
  | 'add-host-group'
  | 'remove-host-group'
  | 'add-rule-group'
  | 'remove-rule-group';

export interface PerformPreventionPolicyActionParams {
  ids: string[];
  action: PreventionPolicyAction;
  /** Required for add-host-group/remove-host-group. */
  groupId?: string;
  /** Required for add-rule-group/remove-rule-group. */
  ruleGroupId?: string;
}

export interface SetPreventionPolicyPrecedenceParams {
  /** All current policy ids for the platform, in desired precedence order. */
  ids: string[];
  platformName: PreventionPolicyPlatform;
}

export interface QueryPreventionPolicyMembersParams {
  policyId: string;
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface PreventionPolicyMemberSearchResult {
  hostIds: string[];
  pagination: { offset: number; limit: number; total: number };
}
