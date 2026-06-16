import type {RequestOptions} from '../../core/http-client';
import type {
  CustomIoaSearchParams,
  LookupSearchParams,
  CreateRuleGroupParams,
  UpdateRuleGroupParams,
  CreateRuleParams,
  UpdateRulesParams,
  ValidateRuleField,
  RuleFieldValue,
  RuleUpdate,
} from './custom-ioa.types';

function buildSearchQuery(params: CustomIoaSearchParams) {
  return {
    sort: params.sort,
    filter: params.filter,
    q: params.q,
    offset: params.offset,
    limit: params.limit,
  };
}

export function buildSearchRuleGroupIdsRequest(
  params: CustomIoaSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/rule-groups/v1',
    query: buildSearchQuery(params),
  };
}

export function buildSearchRuleGroupsFullRequest(
  params: CustomIoaSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/rule-groups-full/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetRuleGroupsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/entities/rule-groups/v1',
    query: {ids},
  };
}

export function buildCreateRuleGroupRequest(
  params: CreateRuleGroupParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/ioarules/entities/rule-groups/v1',
    body: {
      name: params.name,
      description: params.description,
      platform: params.platform,
      comment: params.comment,
    },
  };
}

export function buildUpdateRuleGroupRequest(
  params: UpdateRuleGroupParams,
): RequestOptions {
  return {
    method: 'PATCH',
    path: '/ioarules/entities/rule-groups/v1',
    body: {
      id: params.id,
      name: params.name,
      description: params.description,
      enabled: params.enabled,
      comment: params.comment,
      rulegroup_version: params.rulegroupVersion,
    },
  };
}

export function buildDeleteRuleGroupsRequest(
  ids: string[],
  comment?: string,
): RequestOptions {
  return {
    method: 'DELETE',
    path: '/ioarules/entities/rule-groups/v1',
    query: {ids, comment},
  };
}

export function buildSearchRuleIdsRequest(
  params: CustomIoaSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/rules/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetRulesRequest(ids: string[]): RequestOptions {
  return {method: 'GET', path: '/ioarules/entities/rules/v1', query: {ids}};
}

export function buildGetRulesByVersionRequest(ids: string[]): RequestOptions {
  return {
    method: 'POST',
    path: '/ioarules/entities/rules/GET/v1',
    body: {ids},
  };
}

function fieldValueToWire(field: RuleFieldValue) {
  return {
    name: field.name,
    type: field.type,
    value: field.value,
    label: field.label,
    final_value: field.finalValue,
    values: field.values,
  };
}

export function buildCreateRuleRequest(
  params: CreateRuleParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/ioarules/entities/rules/v1',
    body: {
      rulegroup_id: params.rulegroupId,
      ruletype_id: params.ruletypeId,
      name: params.name,
      description: params.description,
      comment: params.comment,
      disposition_id: params.dispositionId,
      pattern_severity: params.patternSeverity,
      field_values: params.fieldValues.map(fieldValueToWire),
    },
  };
}

function ruleUpdateToWire(update: RuleUpdate) {
  return {
    instance_id: update.instanceId,
    name: update.name,
    description: update.description,
    enabled: update.enabled,
    disposition_id: update.dispositionId,
    pattern_severity: update.patternSeverity,
    field_values: update.fieldValues.map(fieldValueToWire),
    rulegroup_version: update.rulegroupVersion,
  };
}

export function buildUpdateRulesRequest(
  params: UpdateRulesParams,
): RequestOptions {
  return {
    method: 'PATCH',
    path: '/ioarules/entities/rules/v1',
    body: {
      comment: params.comment,
      rulegroup_id: params.rulegroupId,
      rulegroup_version: params.rulegroupVersion,
      rule_updates: params.ruleUpdates.map(ruleUpdateToWire),
    },
  };
}

export function buildUpdateRulesV2Request(
  params: UpdateRulesParams,
): RequestOptions {
  return {
    method: 'PATCH',
    path: '/ioarules/entities/rules/v2',
    body: {
      comment: params.comment,
      rulegroup_id: params.rulegroupId,
      rulegroup_version: params.rulegroupVersion,
      rule_updates: params.ruleUpdates.map(ruleUpdateToWire),
    },
  };
}

export function buildDeleteRulesRequest(
  ruleGroupId: string,
  ids: string[],
  comment?: string,
): RequestOptions {
  return {
    method: 'DELETE',
    path: '/ioarules/entities/rules/v1',
    query: {rule_group_id: ruleGroupId, ids, comment},
  };
}

export function buildValidateRequest(
  fields: ValidateRuleField[],
): RequestOptions {
  return {
    method: 'POST',
    path: '/ioarules/entities/rules/validate/v1',
    body: {
      fields: fields.map(field => ({
        name: field.name,
        type: field.type,
        test_data: field.testData,
        values: field.values,
      })),
    },
  };
}

export function buildSearchPatternIdsRequest(
  params: LookupSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/pattern-severities/v1',
    query: {offset: params.offset, limit: params.limit},
  };
}

export function buildGetPatternsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/entities/pattern-severities/v1',
    query: {ids},
  };
}

export function buildSearchPlatformIdsRequest(
  params: LookupSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/platforms/v1',
    query: {offset: params.offset, limit: params.limit},
  };
}

export function buildGetPlatformsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/entities/platforms/v1',
    query: {ids},
  };
}

export function buildSearchRuleTypeIdsRequest(
  params: LookupSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/queries/rule-types/v1',
    query: {offset: params.offset, limit: params.limit},
  };
}

export function buildGetRuleTypesRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/ioarules/entities/rule-types/v1',
    query: {ids},
  };
}
