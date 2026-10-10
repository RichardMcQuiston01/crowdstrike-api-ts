import type { HttpClient } from '../../core/http-client';
import type { ActionResult } from '../../core/resources';
import { requestAction, requestFirst } from '../../core/resources';
import type {
  CrowdStrikeEnvelope,
  OffsetPaginationMeta,
} from '../../core/types';
import * as requests from './users.requests';
import {
  mapRawUser,
  mapRawUserRole,
  mapRawCombinedUserRole,
  type RawUser,
  type RawUserRole,
  type RawCombinedUserRole,
} from './users.mapper';
import type {
  UserSearchParams,
  UserIdSearchResult,
  UserDetails,
  CreateUserParams,
  UpdateUserParams,
  UserRole,
  QueryAvailableRoleIdsParams,
  PerformUserActionParams,
  GrantOrRevokeUserRoleParams,
  CombinedUserRolesParams,
  CombinedUserRolesResult,
} from './users.types';

function toPagination(raw: CrowdStrikeEnvelope<unknown>): {
  offset: number;
  limit: number;
  total: number;
} {
  const pagination = raw.meta?.pagination as OffsetPaginationMeta | undefined;
  return (
    pagination ?? { offset: 0, limit: 0, total: (raw.resources ?? []).length }
  );
}

/**
 * Wraps CrowdStrike's User Management API (UserManagementApi, the
 * `/user-management/*` and `/user-roles/*` v1/v2 endpoints).
 *
 * The older `/users/*` and `/user-roles/*` endpoints (createUser, deleteUser,
 * retrieveUser, updateUser, getRoles, getUserRoleIds, grantUserRoleIds,
 * revokeUserRoleIds, getAvailableRoleIds, retrieveUserUUID*,
 * retrieveEmailsByCID, combinedUserRolesV1) are all marked `@deprecated` in
 * favor of their `/user-management/*` v1/v2 replacements and are
 * intentionally omitted here. `aggregateUsersV1` is also omitted: its
 * `MsaAggregateQueryRequest` body is a generic aggregation DSL shared across
 * many CrowdStrike APIs and out of scope for this initial pass.
 */
export class UsersClient {
  constructor(private readonly http: HttpClient) {}

  /** Returns just the matching user UUIDs (one page). */
  async searchIds(params: UserSearchParams = {}): Promise<UserIdSearchResult> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildSearchIdsRequest(params),
    );
    return { ids: raw.resources, pagination: toPagination(raw) };
  }

  async getDetails(ids: string[]): Promise<UserDetails[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawUser>>(
      requests.buildGetDetailsRequest(ids),
    );
    return raw.resources.map(mapRawUser);
  }

  async create(params: CreateUserParams): Promise<UserDetails> {
    return mapRawUser(
      await requestFirst<RawUser>(
        this.http,
        requests.buildCreateRequest(params),
      ),
    );
  }

  async update(params: UpdateUserParams): Promise<UserDetails> {
    return mapRawUser(
      await requestFirst<RawUser>(
        this.http,
        requests.buildUpdateRequest(params),
      ),
    );
  }

  async delete(userUuid: string): Promise<ActionResult> {
    return requestAction(this.http, requests.buildDeleteRequest(userUuid));
  }

  async getRoles(ids: string[], cid?: string): Promise<UserRole[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<RawUserRole>>(
      requests.buildGetRolesRequest(ids, cid),
    );
    return raw.resources.map(mapRawUserRole);
  }

  /** Lists role IDs available in the account (or for a given user/CID). */
  async queryAvailableRoleIds(
    params: QueryAvailableRoleIdsParams = {},
  ): Promise<string[]> {
    const raw = await this.http.request<CrowdStrikeEnvelope<string>>(
      requests.buildQueryAvailableRoleIdsRequest(params),
    );
    return raw.resources;
  }

  /** Triggers a reset_password or reset_2fa action for one or more users. */
  async performAction(params: PerformUserActionParams): Promise<ActionResult> {
    return requestAction(this.http, requests.buildPerformActionRequest(params));
  }

  /** Grants or revokes one or more roles for a user against a specific CID. */
  async grantOrRevokeRole(
    params: GrantOrRevokeUserRoleParams,
  ): Promise<ActionResult> {
    return requestAction(
      this.http,
      requests.buildGrantOrRevokeRoleRequest(params),
    );
  }

  /** Lists direct and flight-control role grants for a user. */
  async getCombinedUserRoles(
    params: CombinedUserRolesParams,
  ): Promise<CombinedUserRolesResult> {
    const raw = await this.http.request<
      CrowdStrikeEnvelope<RawCombinedUserRole>
    >(requests.buildCombinedUserRolesRequest(params));
    return {
      roles: raw.resources.map(mapRawCombinedUserRole),
      pagination: toPagination(raw),
    };
  }
}
