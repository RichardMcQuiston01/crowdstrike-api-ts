import type {HostGroupDetails, HostGroupType} from './host-groups.types';

/** Raw wire shape of a CrowdStrike host group entity (HostGroupsHostGroupV1). */
export interface RawHostGroup {
  id: string;
  name: string;
  description?: string;
  group_type?: string;
  assignment_rule?: string;
  created_by?: string;
  created_timestamp?: string;
  modified_by?: string;
  modified_timestamp?: string;
  [key: string]: unknown;
}

export function mapRawHostGroupToDetails(raw: RawHostGroup): HostGroupDetails {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    groupType: raw.group_type as HostGroupType | undefined,
    assignmentRule: raw.assignment_rule,
    createdBy: raw.created_by,
    createdTimestamp: raw.created_timestamp,
    modifiedBy: raw.modified_by,
    modifiedTimestamp: raw.modified_timestamp,
    raw,
  };
}
