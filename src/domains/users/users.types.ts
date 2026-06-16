export interface UserSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface UserIdSearchResult {
  ids: string[];
  pagination: {offset: number; limit: number; total: number};
}

export interface UserDetails {
  uuid?: string;
  uid?: string;
  cid?: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  userType?: string;
  factors?: string[];
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
  raw: Record<string, unknown>;
}

export interface CreateUserParams {
  uid?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  cid?: string;
  /** If true, validates the request without actually creating the user. */
  validateOnly?: boolean;
}

export interface UpdateUserParams {
  userUuid: string;
  firstName?: string;
  lastName?: string;
}

export interface UserRole {
  id: string;
  cid?: string;
  description: string;
  displayName: string;
  isGlobal: boolean;
  type?: string;
  raw: Record<string, unknown>;
}

export interface QueryAvailableRoleIdsParams {
  cid?: string;
  userUuid?: string;
  action?: string;
}

/** Supported action values for UserManagementApi.userActionV1. */
export type UserAction = 'reset_password' | 'reset_2fa';

export interface PerformUserActionParams {
  ids: string[];
  action: UserAction;
}

export type UserRoleGrantAction = 'grant' | 'revoke';

export interface GrantOrRevokeUserRoleParams {
  uuid: string;
  cid: string;
  roleIds: string[];
  action: UserRoleGrantAction;
  /** RFC3339 expiration for the grant; only meaningful when action is 'grant'. */
  expiresAt?: string;
}

export interface CombinedUserRolesParams {
  userUuid: string;
  cid?: string;
  directOnly?: boolean;
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface CombinedUserRole {
  roleId: string;
  roleName?: string;
  cid?: string;
  cidGroupId?: string;
  cidGroupName?: string;
  parentCid?: string;
  userGroupId?: string;
  userGroupName?: string;
  userType?: string;
  grantType?: string;
  expiresAt?: string;
  uuid?: string;
  raw: Record<string, unknown>;
}

export interface CombinedUserRolesResult {
  roles: CombinedUserRole[];
  pagination: {offset: number; limit: number; total: number};
}
