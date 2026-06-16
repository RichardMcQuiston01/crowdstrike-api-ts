import type {
  CloudResourceDetails,
  ApplicationFinding,
} from './cloud-security.types';

/** Raw wire shape of a cloud resource record (ResourcesCloudResource). */
export interface RawCloudResource {
  id?: string;
  cid?: string;
  resource_id?: string;
  resource_name?: string;
  resource_type?: string;
  resource_type_name?: string;
  cloud_provider?: string;
  account_id?: string;
  account_name?: string;
  region?: string;
  service?: string;
  service_category?: string;
  status?: string;
  active?: boolean;
  first_seen?: string;
  updated_at?: string;
  tags?: unknown[];
  cloud_labels?: unknown[];
  cloud_groups?: string[];
  [key: string]: unknown;
}

export function mapRawCloudResource(
  raw: RawCloudResource,
): CloudResourceDetails {
  return {
    id: raw.id,
    cid: raw.cid,
    resourceId: raw.resource_id,
    resourceName: raw.resource_name,
    resourceType: raw.resource_type,
    resourceTypeName: raw.resource_type_name,
    cloudProvider: raw.cloud_provider,
    accountId: raw.account_id,
    accountName: raw.account_name,
    region: raw.region,
    service: raw.service,
    serviceCategory: raw.service_category,
    status: raw.status,
    active: raw.active,
    firstSeen: raw.first_seen,
    updatedAt: raw.updated_at,
    tags: raw.tags,
    cloudLabels: raw.cloud_labels,
    cloudGroups: raw.cloud_groups,
    raw,
  };
}

/** Raw wire shape of an application finding (AssetsResourceApplicationFindingsItem). */
export interface RawApplicationFinding {
  crn?: string;
  finding_type?: string;
  findings?: unknown[];
  [key: string]: unknown;
}

export function mapRawApplicationFinding(
  raw: RawApplicationFinding,
): ApplicationFinding {
  return {
    crn: raw.crn,
    findingType: raw.finding_type,
    findings: raw.findings,
    raw,
  };
}
