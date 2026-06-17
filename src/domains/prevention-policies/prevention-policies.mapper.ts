import type { PreventionPolicyDetails } from './prevention-policies.types';

/** Raw wire shape of a CrowdStrike prevention policy entity (PreventionPolicyV1). */
export interface RawPreventionPolicy {
  id: string;
  cid: string;
  name: string;
  description?: string;
  platform_name: string;
  enabled: boolean;
  groups?: Record<string, unknown>[];
  ioa_rule_groups?: Record<string, unknown>[];
  prevention_settings?: Record<string, unknown>[] | null;
  created_by?: string;
  created_timestamp?: string;
  modified_by?: string;
  modified_timestamp?: string;
  [key: string]: unknown;
}

export function mapRawPreventionPolicy(
  raw: RawPreventionPolicy,
): PreventionPolicyDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    name: raw.name,
    description: raw.description,
    platformName: raw.platform_name as PreventionPolicyDetails['platformName'],
    enabled: raw.enabled,
    groups: raw.groups ?? [],
    ioaRuleGroups: raw.ioa_rule_groups ?? [],
    preventionSettings: raw.prevention_settings ?? null,
    createdBy: raw.created_by,
    createdTimestamp: raw.created_timestamp,
    modifiedBy: raw.modified_by,
    modifiedTimestamp: raw.modified_timestamp,
    raw,
  };
}
