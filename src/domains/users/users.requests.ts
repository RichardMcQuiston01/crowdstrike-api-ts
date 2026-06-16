import type {RequestOptions} from '../../core/http-client';
import type {
  UserSearchParams,
  CreateUserParams,
  UpdateUserParams,
  QueryAvailableRoleIdsParams,
  PerformUserActionParams,
  GrantOrRevokeUserRoleParams,
  CombinedUserRolesParams,
} from './users.types';

export function buildSearchIdsRequest(
  params: UserSearchParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/user-management/queries/users/v1',
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
    method: 'POST',
    path: '/user-management/entities/users/GET/v1',
    body: {ids},
  };
}

export function buildCreateRequest(params: CreateUserParams): RequestOptions {
  return {
    method: 'POST',
    path: '/user-management/entities/users/v1',
    query: {validate_only: params.validateOnly},
    body: {
      cid: params.cid,
      first_name: params.firstName,
      last_name: params.lastName,
      password: params.password,
      uid: params.uid,
    },
  };
}

export function buildUpdateRequest(params: UpdateUserParams): RequestOptions {
  return {
    method: 'PATCH',
    path: '/user-management/entities/users/v1',
    query: {user_uuid: params.userUuid},
    body: {
      first_name: params.firstName,
      last_name: params.lastName,
    },
  };
}

export function buildDeleteRequest(userUuid: string): RequestOptions {
  return {
    method: 'DELETE',
    path: '/user-management/entities/users/v1',
    query: {user_uuid: userUuid},
  };
}

export function buildGetRolesRequest(
  ids: string[],
  cid?: string,
): RequestOptions {
  return {
    method: 'POST',
    path: '/user-management/entities/roles/GET/v2',
    query: {cid},
    body: {ids},
  };
}

export function buildQueryAvailableRoleIdsRequest(
  params: QueryAvailableRoleIdsParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/user-management/queries/roles/v1',
    query: {
      cid: params.cid,
      user_uuid: params.userUuid,
      action: params.action,
    },
  };
}

export function buildPerformActionRequest(
  params: PerformUserActionParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/user-management/entities/user-actions/v1',
    body: {
      ids: params.ids,
      action: {action_name: params.action},
    },
  };
}

export function buildGrantOrRevokeRoleRequest(
  params: GrantOrRevokeUserRoleParams,
): RequestOptions {
  return {
    method: 'POST',
    path: '/user-management/entities/user-role-actions/v1',
    body: {
      action: params.action,
      cid: params.cid,
      uuid: params.uuid,
      role_ids: params.roleIds,
      expires_at: params.expiresAt,
    },
  };
}

export function buildCombinedUserRolesRequest(
  params: CombinedUserRolesParams,
): RequestOptions {
  return {
    method: 'GET',
    path: '/user-management/combined/user-roles/v2',
    query: {
      user_uuid: params.userUuid,
      cid: params.cid,
      direct_only: params.directOnly,
      filter: params.filter,
      offset: params.offset,
      limit: params.limit,
      sort: params.sort,
    },
  };
}
