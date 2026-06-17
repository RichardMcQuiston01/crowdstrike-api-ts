export { FalconClient } from './client';
export { FalconRegion, type FalconClientConfig } from './config';

export {
  CrowdStrikeApiError,
  CrowdStrikeNetworkError,
  CrowdStrikeAuthConfigError,
} from './core/errors';
export type {
  CrowdStrikeErrorDetail,
  CrowdStrikeEnvelope,
  CrowdStrikeResponseMeta,
  OffsetPaginationMeta,
  CursorPaginationMeta,
} from './core/types';
export { paginateOffset, paginateCursor, collectAll } from './core/pagination';
export type { OffsetPageFetcher, CursorPageFetcher } from './core/pagination';

export { HostsClient } from './domains/hosts/hosts.client';
export type * from './domains/hosts/hosts.types';

export { HostGroupsClient } from './domains/host-groups/host-groups.client';
export type * from './domains/host-groups/host-groups.types';

export { CasesClient } from './domains/cases/cases.client';
export type * from './domains/cases/cases.types';

export { AlertsClient } from './domains/alerts/alerts.client';
export type * from './domains/alerts/alerts.types';

export { RealTimeResponseClient } from './domains/real-time-response/real-time-response.client';
export { RealTimeResponseAdminClient } from './domains/real-time-response/real-time-response-admin.client';
export type * from './domains/real-time-response/real-time-response.types';

export { ContainerVulnerabilitiesClient } from './domains/container-vulnerabilities/container-vulnerabilities.client';
export type * from './domains/container-vulnerabilities/container-vulnerabilities.types';

export { IntelClient } from './domains/intel/intel.client';
export type * from './domains/intel/intel.types';

export { IocClient } from './domains/ioc/ioc.client';
export type * from './domains/ioc/ioc.types';

export { CloudSecurityClient } from './domains/cloud-security/cloud-security.client';
export type * from './domains/cloud-security/cloud-security.types';

export { IdentityProtectionClient } from './domains/identity-protection/identity-protection.client';
export type * from './domains/identity-protection/identity-protection.types';

export { SensorDownloadClient } from './domains/sensor-download/sensor-download.client';
export type * from './domains/sensor-download/sensor-download.types';

export { PreventionPoliciesClient } from './domains/prevention-policies/prevention-policies.client';
export type * from './domains/prevention-policies/prevention-policies.types';

export { UsersClient } from './domains/users/users.client';
export type * from './domains/users/users.types';

export { DiscoverClient } from './domains/discover/discover.client';
export type * from './domains/discover/discover.types';

export { CustomIoaClient } from './domains/custom-ioa/custom-ioa.client';
export type * from './domains/custom-ioa/custom-ioa.types';

export * from './custom';
