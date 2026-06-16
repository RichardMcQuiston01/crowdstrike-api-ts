import type {RequestOptions} from '../../core/http-client';
import type {
  HostGroupSearchParams,
  CreateHostGroupParams,
  UpdateHostGroupParams,
  QueryGroupMembersParams,
  PerformHostGroupActionParams,
} from './host-groups.types';

export function buildSearchRequest(
  params: HostGroupSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/devices/queries/host-groups/v1',
    query: {
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildGetDetailsRequest(ids: string[]): RequestOptions {
  return {
    method: 'GET',
    path: '/devices/entities/host-groups/v1',
    query: {ids},
  };
}

export function buildCreateRequest(
  params: CreateHostGroupParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/devices/entities/host-groups/v1',
    body: {
      resources: [
        {
          name: params.name,
          group_type: params.groupType,
          description: params.description,
          assignment_rule: params.assignmentRule,
        },
      ],
    },
  };
}

export function buildUpdateRequest(
  params: UpdateHostGroupParams,
): RequestOptions {
  return {
    method: 'PATCH',
    path: '/devices/entities/host-groups/v1',
    body: {
      resources: [
        {
          id: params.id,
          name: params.name,
          description: params.description,
          assignment_rule: params.assignmentRule,
        },
      ],
    },
  };
}

export function buildDeleteRequest(ids: string[]): RequestOptions {
  return {
    method: 'DELETE',
    path: '/devices/entities/host-groups/v1',
    query: {ids},
  };
}

export function buildQueryMembersRequest(
  params: QueryGroupMembersParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/devices/queries/host-group-members/v1',
    query: {
      id: params.groupId,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildCombinedMembersRequest(
  params: QueryGroupMembersParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/devices/combined/host-group-members/v1',
    query: {
      id: params.groupId,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}

export function buildPerformActionRequest(
  params: PerformHostGroupActionParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/devices/entities/host-group-actions/v1',
    query: {
      action_name: params.action,
      disable_hostname_check: params.disableHostnameCheck,
    },
    body: {
      ids: params.groupIds,
      action_parameters: [{name: 'filter', value: params.filter}],
    },
  };
}
