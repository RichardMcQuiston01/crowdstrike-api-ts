import type {IocDetails} from './ioc.types';

/** Raw wire shape of a custom IOC indicator (ApiIndicatorV1). */
export interface RawIoc {
  id?: string;
  type?: string;
  value?: string;
  action?: string;
  applied_globally?: boolean;
  created_by?: string;
  created_on?: string;
  deleted?: boolean;
  description?: string;
  expiration?: string;
  expired?: boolean;
  from_parent?: boolean;
  host_groups?: string[];
  mobile_action?: string;
  modified_by?: string;
  modified_on?: string;
  parent_cid_name?: string;
  platforms?: string[];
  severity?: string;
  source?: string;
  tags?: string[];
  [key: string]: unknown;
}

export function mapRawIoc(raw: RawIoc): IocDetails {
  return {
    id: raw.id,
    type: raw.type,
    value: raw.value,
    action: raw.action,
    appliedGlobally: raw.applied_globally,
    createdBy: raw.created_by,
    createdOn: raw.created_on,
    deleted: raw.deleted,
    description: raw.description,
    expiration: raw.expiration,
    expired: raw.expired,
    fromParent: raw.from_parent,
    hostGroups: raw.host_groups,
    mobileAction: raw.mobile_action,
    modifiedBy: raw.modified_by,
    modifiedOn: raw.modified_on,
    parentCidName: raw.parent_cid_name,
    platforms: raw.platforms,
    severity: raw.severity,
    source: raw.source,
    tags: raw.tags,
    raw,
  };
}
