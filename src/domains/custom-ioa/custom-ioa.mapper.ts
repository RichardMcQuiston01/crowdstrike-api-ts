import type {
  CustomIoaRuleDetails,
  CustomIoaRuleGroupDetails,
  RuleFieldValue,
  PatternSeverity,
  IoaPlatform,
  RuleTypeDetails,
  FieldValidationResult,
} from './custom-ioa.types';

export interface RawRuleFieldValue {
  name: string;
  type: string;
  value: string;
  label?: string;
  final_value?: string;
  values?: { label: string; value: string }[];
  [key: string]: unknown;
}

function mapRawFieldValue(raw: RawRuleFieldValue): RuleFieldValue {
  return {
    name: raw.name,
    type: raw.type,
    value: raw.value,
    label: raw.label,
    finalValue: raw.final_value,
    values: raw.values,
  };
}

/** Raw wire shape of a Custom IOA rule (ApiRuleV1). */
export interface RawCustomIoaRule {
  instance_id: string;
  rulegroup_id: string;
  ruletype_id: string;
  ruletype_name?: string;
  name: string;
  description?: string;
  comment?: string;
  action_label?: string;
  disposition_id: number;
  pattern_id?: string;
  pattern_severity: string;
  enabled: boolean;
  deleted?: boolean;
  field_values?: RawRuleFieldValue[];
  instance_version?: number;
  version_ids?: string[];
  created_by?: string;
  created_on?: string;
  modified_by?: string;
  modified_on?: string;
  [key: string]: unknown;
}

export function mapRawCustomIoaRule(
  raw: RawCustomIoaRule,
): CustomIoaRuleDetails {
  return {
    instanceId: raw.instance_id,
    rulegroupId: raw.rulegroup_id,
    ruletypeId: raw.ruletype_id,
    ruletypeName: raw.ruletype_name,
    name: raw.name,
    description: raw.description,
    comment: raw.comment,
    actionLabel: raw.action_label,
    dispositionId: raw.disposition_id,
    patternId: raw.pattern_id,
    patternSeverity: raw.pattern_severity,
    enabled: raw.enabled,
    deleted: raw.deleted,
    fieldValues: (raw.field_values ?? []).map(mapRawFieldValue),
    instanceVersion: raw.instance_version,
    versionIds: raw.version_ids,
    createdBy: raw.created_by,
    createdOn: raw.created_on,
    modifiedBy: raw.modified_by,
    modifiedOn: raw.modified_on,
    raw,
  };
}

/** Raw wire shape of a Custom IOA rule group (ApiRuleGroupV1). */
export interface RawCustomIoaRuleGroup {
  id: string;
  name: string;
  description?: string;
  comment?: string;
  platform: string;
  enabled: boolean;
  deleted?: boolean;
  version?: number;
  rule_ids?: string[];
  rules?: RawCustomIoaRule[];
  created_by?: string;
  created_on?: string;
  modified_by?: string;
  modified_on?: string;
  [key: string]: unknown;
}

export function mapRawCustomIoaRuleGroup(
  raw: RawCustomIoaRuleGroup,
): CustomIoaRuleGroupDetails {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    comment: raw.comment,
    platform: raw.platform,
    enabled: raw.enabled,
    deleted: raw.deleted,
    version: raw.version,
    ruleIds: raw.rule_ids ?? [],
    rules: (raw.rules ?? []).map(mapRawCustomIoaRule),
    createdBy: raw.created_by,
    createdOn: raw.created_on,
    modifiedBy: raw.modified_by,
    modifiedOn: raw.modified_on,
    raw,
  };
}

/** Raw wire shape of a pattern severity entry (ApiPatternV1). */
export interface RawPatternSeverity {
  name: string;
  severity: string;
  [key: string]: unknown;
}

export function mapRawPatternSeverity(
  raw: RawPatternSeverity,
): PatternSeverity {
  return { name: raw.name, severity: raw.severity };
}

/** Raw wire shape of a supported platform entry (DomainPlatform). */
export interface RawIoaPlatform {
  id: string;
  label: string;
  [key: string]: unknown;
}

export function mapRawIoaPlatform(raw: RawIoaPlatform): IoaPlatform {
  return { id: raw.id, label: raw.label };
}

/** Raw wire shape of a rule type definition (ApiRuleTypeV1). */
export interface RawRuleType {
  id: string;
  name: string;
  platform: string;
  long_desc?: string;
  channel?: number;
  released?: boolean;
  disposition_map?: Record<string, unknown>[];
  fields?: Record<string, unknown>[];
  [key: string]: unknown;
}

export function mapRawRuleType(raw: RawRuleType): RuleTypeDetails {
  return {
    id: raw.id,
    name: raw.name,
    platform: raw.platform,
    longDesc: raw.long_desc,
    channel: raw.channel,
    released: raw.released,
    dispositionMap: raw.disposition_map ?? [],
    fields: raw.fields ?? [],
    raw,
  };
}

/** Raw wire shape of a field validation result (DomainFieldValidation). */
export interface RawFieldValidation {
  name: string;
  value: string;
  bytes: string;
  valid: boolean;
  matches_test?: boolean;
  test_data?: string;
  error?: string;
  [key: string]: unknown;
}

export function mapRawFieldValidation(
  raw: RawFieldValidation,
): FieldValidationResult {
  return {
    name: raw.name,
    value: raw.value,
    bytes: raw.bytes,
    valid: raw.valid,
    matchesTest: raw.matches_test,
    testData: raw.test_data,
    error: raw.error,
  };
}
