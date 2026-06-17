import type { UserDetails, UserRole, CombinedUserRole } from './users.types';

/** Raw wire shape of a CrowdStrike user entity (DomainUser). */
export interface RawUser {
  cid?: string;
  created_at?: string;
  factors?: string[];
  first_name?: string;
  last_login_at?: string;
  last_name?: string;
  status?: string;
  uid?: string;
  updated_at?: string;
  user_type?: string;
  uuid?: string;
  [key: string]: unknown;
}

export function mapRawUser(raw: RawUser): UserDetails {
  return {
    uuid: raw.uuid,
    uid: raw.uid,
    cid: raw.cid,
    firstName: raw.first_name,
    lastName: raw.last_name,
    status: raw.status,
    userType: raw.user_type,
    factors: raw.factors,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    lastLoginAt: raw.last_login_at,
    raw,
  };
}

/** Raw wire shape of a CrowdStrike role entity (DomainRole). */
export interface RawUserRole {
  cid?: string;
  description: string;
  display_name: string;
  id: string;
  is_global: boolean;
  type?: string;
  [key: string]: unknown;
}

export function mapRawUserRole(raw: RawUserRole): UserRole {
  return {
    id: raw.id,
    cid: raw.cid,
    description: raw.description,
    displayName: raw.display_name,
    isGlobal: raw.is_global,
    type: raw.type,
    raw,
  };
}

/** Raw wire shape of a user-to-CID role grant (FlightcontrolapiCombinedUserRolesResourceV2). */
export interface RawCombinedUserRole {
  cid?: string;
  cid_group_id?: string;
  cid_group_name?: string;
  expires_at?: string;
  grant_type?: string;
  parent_cid?: string;
  role_id: string;
  role_name?: string;
  user_group_id?: string;
  user_group_name?: string;
  user_type?: string;
  uuid?: string;
  [key: string]: unknown;
}

export function mapRawCombinedUserRole(
  raw: RawCombinedUserRole,
): CombinedUserRole {
  return {
    roleId: raw.role_id,
    roleName: raw.role_name,
    cid: raw.cid,
    cidGroupId: raw.cid_group_id,
    cidGroupName: raw.cid_group_name,
    parentCid: raw.parent_cid,
    userGroupId: raw.user_group_id,
    userGroupName: raw.user_group_name,
    userType: raw.user_type,
    grantType: raw.grant_type,
    expiresAt: raw.expires_at,
    uuid: raw.uuid,
    raw,
  };
}
