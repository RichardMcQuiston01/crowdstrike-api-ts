export interface HostGroupSearchParams {
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface HostGroupSearchResult {
  groupIds: string[];
  pagination: { offset: number; limit: number; total: number };
}

export type HostGroupType = 'static' | 'dynamic' | 'staticByID';

export interface HostGroupDetails {
  id: string;
  name: string;
  description?: string;
  groupType?: HostGroupType;
  assignmentRule?: string;
  createdBy?: string;
  createdTimestamp?: string;
  modifiedBy?: string;
  modifiedTimestamp?: string;
  raw: Record<string, unknown>;
}

export interface CreateHostGroupParams {
  name: string;
  groupType: HostGroupType;
  description?: string;
  /** FQL assignment rule, required when groupType is 'dynamic'. */
  assignmentRule?: string;
}

export interface UpdateHostGroupParams {
  id: string;
  name?: string;
  description?: string;
  assignmentRule?: string;
}

export interface QueryGroupMembersParams {
  groupId: string;
  filter?: string;
  offset?: number;
  limit?: number;
  sort?: string;
}

export interface GroupMemberSearchResult {
  hostIds: string[];
  pagination: { offset: number; limit: number; total: number };
}

/** Supported action_name values for HostGroupApi.performGroupAction. */
export type HostGroupMemberAction = 'add-hosts' | 'remove-hosts';

export interface PerformHostGroupActionParams {
  groupIds: string[];
  action: HostGroupMemberAction;
  /** FQL filter selecting which devices to add/remove, e.g. "device_id:'abc123'". */
  filter: string;
  disableHostnameCheck?: boolean;
}
