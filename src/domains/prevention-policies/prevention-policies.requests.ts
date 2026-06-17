import type { RequestOptions } from '../../core/http-client';
import type {
  PreventionPolicySearchParams,
  CreatePreventionPolicyParams,
  UpdatePreventionPolicyParams,
  PerformPreventionPolicyActionParams,
  SetPreventionPolicyPrecedenceParams,
  QueryPreventionPolicyMembersParams,
} from './prevention-policies.types';

function buildSearchQuery(params: PreventionPolicySearchParams) {
  return {
    filter: params.filter,
    offset: params.offset,
    limit: params.limit,
    sort: params.sort,
  };
}

export function buildSearchIdsRequest(
  params: PreventionPolicySearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/policy/queries/prevention/v1',
    query: buildSearchQuery(params),
  };
}

export function buildSearchCombinedRequest(
  params: PreventionPolicySearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/policy/combined/prevention/v1',
    query: buildSearchQuery(params),
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/policy/entities/prevention/v1',
    query: { ids },
  };
}

export function buildCreateRequest(
  params: CreatePreventionPolicyParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/policy/entities/prevention/v1',
    body: {
      resources: [
        {
          name: params.name,
          platform_name: params.platformName,
          description: params.description,
          clone_id: params.cloneId,
          settings: params.settings,
        },
      ],
    },
  };
}

export function buildUpdateRequest(
  params: UpdatePreventionPolicyParams,
): RequestOptions {
  return {
    method: 'PATCH',
    path: '/policy/entities/prevention/v1',
    body: {
      resources: [
        {
          id: params.id,
          name: params.name,
          description: params.description,
          settings: params.settings,
        },
      ],
    },
  };
}

export function buildDeleteRequest(ids: string[]): RequestOptions {
  return {
    method: 'DELETE',
    path: '/policy/entities/prevention/v1',
    query: { ids },
  };
}

export function buildPerformActionRequest(
  params: PerformPreventionPolicyActionParams,
): RequestOptions {
  const actionParameters: Array<{ name: string; value: string }> = [];
  if (params.groupId !== undefined) {
    actionParameters.push({ name: 'group_id', value: params.groupId });
  }
  if (params.ruleGroupId !== undefined) {
    actionParameters.push({ name: 'rule_group_id', value: params.ruleGroupId });
  }
  return {
    method: 'POST',
    path: '/policy/entities/prevention-actions/v1',
    query: { action_name: params.action },
    body: {
      ids: params.ids,
      action_parameters:
        actionParameters.length > 0 ? actionParameters : undefined,
    },
  };
}

export function buildSetPrecedenceRequest(
  params: SetPreventionPolicyPrecedenceParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/policy/entities/prevention-precedence/v1',
    body: {
      ids: params.ids,
      platform_name: params.platformName,
    },
  };
}

export function buildQueryMembersRequest(
  params: QueryPreventionPolicyMembersParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/policy/queries/prevention-members/v1',
    query: {
      id: params.policyId,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildCombinedMembersRequest(
  params: QueryPreventionPolicyMembersParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/policy/combined/prevention-members/v1',
    query: {
      id: params.policyId,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}
